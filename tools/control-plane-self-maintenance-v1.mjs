#!/usr/bin/env node
/**
 * V4_CONTROL_PLANE_ASSISTED_SELF_MAINTENANCE_LOOP_V1 (issue #88) — core.
 *
 * ASSISTED_SELF_MAINTENANCE, never AUTONOMOUS_SELF_GOVERNANCE:
 *   real fault → preserve state → READ-ONLY diagnosis → canonical actionable
 *   gate (#87 contract) → operator decision through the EXISTING canonical
 *   runtime-authorization issuance authority (identity/TTL/one-shot fences) →
 *   ONE bounded remediation backlog item (existing LOCAL_DEV queue/admission/
 *   executor law) → PASS/STOP persistence → remote HEAD verification →
 *   incident resolution → queue resume.
 *
 * Laws encoded here (deterministic, offline-testable):
 *   - diagnosis mutates nothing (pure collectors + injected probes only);
 *   - WAITING_OPERATOR can never self-transition to APPROVED (external
 *     canonical decision record required, bound to a remediation fingerprint);
 *   - one approval admits at most one dispatch (bridge CLAIM_ALREADY_EXISTS
 *     + incident.spent fence + durable store survive dispatcher restart);
 *   - protected governance scope can be diagnosed/proposed but NEVER
 *     auto-dispatched (explicit protected operator authorization required);
 *   - PASS without remote verification is NOT RESOLVED;
 *   - recursion fence: depth > 1 never auto-proposes;
 *   - no incident → IDLE (no work manufacturing).
 *
 * No second bot, scheduler, decision store or executor is created. Telegram is
 * transport/UI only; the dashboard stays read-only.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildActionableGateContract, CANONICAL_GATE_CHOICES } from "./v4-actionable-gate-contract-v1.mjs";

export const SELF_MAINTENANCE_SCHEMA = "v4-control-plane-self-maintenance-v1";
export const SELF_MAINTENANCE_MODE = "ASSISTED";
export const SELF_MAINTENANCE_TASK_REF = "V4_CONTROL_PLANE_ASSISTED_SELF_MAINTENANCE_LOOP_V1";
export const RECURSION_DEPTH_MAX = 1;

/** Deterministic state machine (all transitions explicit, nothing inferred). */
export const SELF_MAINTENANCE_STATES = Object.freeze([
  "DETECTED", "DIAGNOSING", "DIAGNOSED", "WAITING_OPERATOR", "APPROVED",
  "REMEDIATION_QUEUED", "REMEDIATION_RUNNING", "REMEDIATION_PASS", "REMEDIATION_STOP",
  "RESOLVED", "DEFERRED",
]);

const INCIDENTS_REL = "reports/runtime/dev-queue/always-on/self-maintenance-incidents-v1.json";
const STATUS_REL = "reports/runtime/dev-queue/always-on/self-maintenance-status-v1.json";

/* Protected governance scope: semantic, not filename-only. Governance change
 * could alter who/what is authorized to act — every mechanism below can. */
export const PROTECTED_GOVERNANCE_PATTERNS = Object.freeze([
  "d0025", "production", "routing", "admission", "sequencing",
  "credential", "token", "secret", "auth", "gate", "authorization",
  "destructive", "tailscale", "litellm", "hermes", "openclaw", "spend", "provenance",
]);

export const PROTECTED_DIRTY_ACTIONS = Object.freeze(["DISCARD", "RESET", "STASH", "CLEAN", "CHECKOUT", "FORCE"]);

function bounded(value, max) {
  const s = String(value ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function iso(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/* ------------------------------------------------------------------ */
/* Read-only diagnosis collectors (zero mutation)                      */
/* ------------------------------------------------------------------ */

export function createReadOnlyDiagnosis({ repoPath, runGit, nowMs = Date.now() } = {}) {
  const safeGit = (...args) => {
    try {
      return String(runGit(repoPath, args)).slice(0, 4000);
    } catch (err) {
      throw Object.assign(new Error(`DIAGNOSIS_PROBE_FAILED: ${err?.message || err}`), { code: "DIAGNOSIS_PROBE_FAILED" });
    }
  };
  return {
    gitStatus: () => safeGit("status", "--short"),
    gitDiffStat: () => safeGit("diff", "--stat"),
    gitLog: (n = 3) => safeGit("log", `-${n}`, "--format=%H %s"),
    currentHead: () => safeGit("rev-parse", "HEAD").trim(),
    fileHead: (rel) => {
      if (typeof rel !== "string" || rel.includes("..") || resolve(repoPath, rel).startsWith(resolve(repoPath)) === false) {
        throw Object.assign(new Error("DIAGNOSIS_FILE_OUT_OF_REPO"), { code: "DIAGNOSIS_FILE_OUT_OF_REPO" });
      }
      try {
        return readFileSync(join(repoPath, rel), "utf8").slice(0, 4000);
      } catch (err) {
        throw Object.assign(new Error(`DIAGNOSIS_PROBE_FAILED: ${err?.message || err}`), { code: "DIAGNOSIS_PROBE_FAILED" });
      }
    },
    // One bounded, whitelisted, non-mutating test command (evidence only).
    focusedTest: async (command, { timeoutMs = 120000 } = {}) => {
      const { execFile } = await import("node:child_process");
      return await new Promise((resolvePromise) => {
        execFile("node", command.split(/\s+/), { cwd: repoPath, timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
          resolvePromise({ ok: !err, exit_code: err?.code ?? 0, stdout: String(stdout || "").slice(-2000), stderr: String(stderr || "").slice(-2000) });
        });
      });
    },
  };
}

/** Classify a protected governance surface from semantic evidence. */
export function classifyProtectedScope(paths = [], extraText = "") {
  const hay = [...paths, String(extraText)].join(" ").toLowerCase();
  return PROTECTED_GOVERNANCE_PATTERNS.some((p) => hay.includes(p));
}

/* ------------------------------------------------------------------ */
/* Incident store — durable, restart-safe (untracked runtime state)     */
/* ------------------------------------------------------------------ */

export function loadIncidentStore(repoPath) {
  const p = join(repoPath, INCIDENTS_REL);
  try {
    const s = JSON.parse(readFileSync(p, "utf8"));
    if (s.schema_version !== SELF_MAINTENANCE_SCHEMA) throw new Error("schema");
    return s;
  } catch {
    return { schema_version: SELF_MAINTENANCE_SCHEMA, mode: SELF_MAINTENANCE_MODE, self_approval_allowed: false, incidents: {} };
  }
}

export function persistIncidentStore(repoPath, store) {
  const p = join(repoPath, INCIDENTS_REL);
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(store, null, 2));
  renameSync(tmp, p);
  return p;
}

/* ------------------------------------------------------------------ */
/* Remediation fingerprint — approval binds to the EXACT remediation    */
/* ------------------------------------------------------------------ */

export function buildRemediationFingerprint(incident) {
  return createHash("sha256").update(JSON.stringify({
    incident_id: incident.incident_id,
    task_ref: incident.task_ref,
    base_head: incident.base_head ?? null,
    affected_files: incident.affected_files ?? [],
    allowed_paths: incident.proposed_remediation?.allowed_paths ?? [],
    remediation_summary: incident.proposed_remediation?.summary ?? null,
    test_command: incident.proposed_remediation?.test_command ?? null,
    protected_scope: incident.protected_scope === true,
    schema: SELF_MAINTENANCE_SCHEMA,
  })).digest("hex");
}

/* ------------------------------------------------------------------ */
/* Detection — real evidence only; no incident → IDLE                  */
/* ------------------------------------------------------------------ */

/**
 * Bounded read-only detection over real runtime evidence (dispatcher tick
 * result + git status). Returns null when there is nothing to maintain
 * (NO WORK MANUFACTURING law).
 */
export function detectSelfMaintenanceIncident({ repoPath, runGit, lastTick = null, depth = 0, nowMs = Date.now() } = {}) {
  // Recursion fence: a self-maintenance fault never spawns another cycle.
  const depthN = Number(depth);
  if (!Number.isFinite(depthN) || depthN < 0 || depthN > RECURSION_DEPTH_MAX) return null;
  const store = loadIncidentStore(repoPath);
  // One OPEN incident at a time; terminal states never auto-recycle:
  // RESOLVED frees the slot; DEFERRED keeps the fault state and needs the
  // operator to act externally; STOP keeps operator attention (no silent
  // re-detection loop). Only RESOLVED is re-observable.
  if (Object.values(store.incidents).some((i) => i.status !== "RESOLVED")) return null;

  const classification = bounded(lastTick?.classification, 40);
  const gateRequired = lastTick?.human_gate_required === true;
  const codes = Array.isArray(lastTick?.reason_codes) ? lastTick.reason_codes.map((c) => bounded(c, 80)).filter(Boolean) : [];
  if (!gateRequired && classification !== "HUMAN_GATE_REQUIRED") return null;

  const reason = codes[0] || null;
  const isDirty = reason === "TRACKED_DIRTY_CONFLICT";
  const nowIso = new Date(nowMs).toISOString();
  const incidentId = `SELFMAINT-${nowMs}`;
  const taskRef = `D-${new Date(nowMs).toISOString().slice(0, 10).replace(/-/g, "")}-SM${String(nowMs).slice(-5)}`;
  const incident = {
    schema_version: SELF_MAINTENANCE_SCHEMA,
    incident_id: incidentId,
    task_ref: taskRef,
    status: "DETECTED",
    depth: depthN,
    classification: "HUMAN_GATE_REQUIRED",
    reason_code: reason,
    summary: bounded(lastTick?.gate_summary, 240) || `Control Plane fermato su ${reason || "HUMAN_GATE"}`,
    origin: "LOCAL_DEV_DISPATCHER",
    created_at: nowIso,
    updated_at: nowIso,
    affected_component: isDirty ? "git_worktree" : "dispatcher_runtime",
    affected_files: [],
    evidence: { last_tick_classification: classification, reason_codes: codes },
    diagnosis: null,
    review_outcome: null,
    proposed_remediation: null,
    protected_scope: false,
    requires_confirmation: false,
    decision: null,
    remediation_dispatch_count: 0,
    execution_count: 0,
    result_persisted: null,
    remote_head_verified: null,
  };
  store.incidents[incidentId] = incident;
  persistIncidentStore(repoPath, store);
  return incident;
}

/* ------------------------------------------------------------------ */
/* Diagnosis — read-only, deterministic outcome                        */
/* ------------------------------------------------------------------ */

/**
 * Read-only diagnosis. Never mutates the repo; never stages/commits/resets.
 * Outcome: DIAGNOSIS_COMPLETE (bounded safe proposal exists) or
 * DIAGNOSIS_INCONCLUSIVE (informational gate only) or
 * PROTECTED_SCOPE_REQUIRES_OPERATOR (proposal touches governance).
 */
export function diagnoseSelfMaintenanceIncident({ incident, diagnosis, runGit, repoPath, nowMs = Date.now() } = {}) {
  if (!incident || incident.status !== "DETECTED") {
    return { ok: false, outcome: "DIAGNOSIS_INCONCLUSIVE", reason: "INCIDENT_STATE_INVALID" };
  }
  const store = loadIncidentStore(repoPath);
  const rec = store.incidents[incident.incident_id];
  if (!rec) return { ok: false, outcome: "DIAGNOSIS_INCONCLUSIVE", reason: "INCIDENT_NOT_PERSISTED" };

  const nowIso = new Date(nowMs).toISOString();
  rec.status = "DIAGNOSING";
  const evidence = { probes: [] };

  try {
    if (rec.reason_code === "TRACKED_DIRTY_CONFLICT") {
      evidence.probes.push({ probe: "git_status_short", result: diagnosis.gitStatus() });
      evidence.probes.push({ probe: "git_diff_stat", result: diagnosis.gitDiffStat() });
      // Affected files come ONLY from real diff evidence (read-only).
      const statusOut = String(diagnosis.gitStatus());
      rec.affected_files = statusOut.split(/\r?\n/).map((l) => l.replace(/^..?\s+/, "").trim()).filter(Boolean).slice(0, 16);
    } else {
      evidence.probes.push({ probe: "git_status_short", result: diagnosis.gitStatus() });
      evidence.probes.push({ probe: "git_log", result: diagnosis.gitLog(3) });
    }
    rec.base_head = diagnosis.currentHead();
  } catch (err) {
    rec.status = "DIAGNOSED";
    rec.review_outcome = "DIAGNOSIS_INCONCLUSIVE";
    rec.updated_at = nowIso;
    rec.diagnosis = { outcome: "DIAGNOSIS_INCONCLUSIVE", error: bounded(err?.message, 200), evidence };
    persistIncidentStore(repoPath, store);
    return { ok: false, outcome: "DIAGNOSIS_INCONCLUSIVE", incident: rec };
  }

  const dirty = rec.reason_code === "TRACKED_DIRTY_CONFLICT";
  const dirtyTouchProtected = dirty && rec.affected_files.some((f) => classifyProtectedScope([f]));
  rec.protected_scope = dirtyTouchProtected || classifyProtectedScope(rec.affected_files, rec.summary);

  // Bounded safe remediation proposal — ONLY for dirty conflicts whose files
  // are known and non-protected, or for the harmless QUAL incident. Otherwise
  // the diagnosis stays informational (operator decides the path manually).
  const knownAffected = rec.affected_files.length > 0 && rec.affected_files.every((f) => existsSync(join(repoPath, f)));
  let proposal = null;
  if (dirty && knownAffected && !rec.protected_scope) {
    proposal = {
      kind: "REVIEW_DIRTY_HANDOFF",
      summary: "Revisionare il diff protetto e decidere l'esito (commit delle modifiche verificate oppure STOP esplicito).",
      allowed_paths: [...rec.affected_files],
      test_command: "git diff --check",
      requires_confirmation: true,
    };
  }
  if (!proposal) {
    rec.status = "DIAGNOSED";
    rec.review_outcome = dirty ? "PROTECTED_SCOPE_REQUIRES_OPERATOR" : "DIAGNOSIS_INCONCLUSIVE";
    rec.diagnosis = {
      outcome: rec.review_outcome,
      what_happened: rec.summary,
      why: `Codice motivo: ${rec.reason_code}.`,
      affected_component: rec.affected_component,
      affected_files: rec.affected_files,
      risk: rec.protected_scope ? "SUPERFICIE DI GOVERNANCE PROTETTA — nessuna auto-remediation" : "non determinata automaticamente",
      proposed_remediation: null,
      evidence,
    };
    rec.updated_at = nowIso;
    persistIncidentStore(repoPath, store);
    return { ok: true, outcome: rec.review_outcome, incident: rec };
  }

  rec.status = "DIAGNOSED";
  rec.review_outcome = "DIAGNOSIS_COMPLETE";
  rec.proposed_remediation = {
    summary: proposal.summary,
    allowed_paths: proposal.allowed_paths,
    test_command: proposal.test_command,
    requires_confirmation: proposal.requires_confirmation === true,
  };
  rec.requires_confirmation = rec.proposed_remediation.requires_confirmation;
  rec.diagnosis = {
    outcome: "DIAGNOSIS_COMPLETE",
    what_happened: rec.summary,
    why: `Il worktree tracciato contiene ${rec.affected_files.length} file modificati non committati; il dispatcher si è fermato fail-closed.`,
    affected_component: rec.affected_component,
    affected_files: rec.affected_files,
    risk: "bounded — scope limitato ai file diagnosticati; nessuna superficie di governance toccata",
    proposed_remediation: rec.proposed_remediation,
    operator_authorization_required: true,
    touches_protected_governance: false,
    evidence,
  };
  rec.updated_at = nowIso;
  persistIncidentStore(repoPath, store);
  return { ok: true, outcome: "DIAGNOSIS_COMPLETE", incident: rec };
}

/* ------------------------------------------------------------------ */
/* Canonical gate metadata (#87 contract) + dashboard view             */
/* ------------------------------------------------------------------ */

/**
 * Build the canonical actionable-gate metadata for a DIAGNOSED incident.
 * Reuses tools/v4-actionable-gate-contract-v1.mjs — never forks the
 * choice vocabulary; non-protected complete diagnoses expose the canonical
 * approval choice; everything else degrades to informational MODE A.
 */
export function buildSelfMaintenanceGate(incident, { nowMs = Date.now(), ttlMs = 30 * 60 * 1000 } = {}) {
  if (!incident || incident.status !== "DIAGNOSED") return null;
  const complete = incident.review_outcome === "DIAGNOSIS_COMPLETE" && incident.proposed_remediation && !incident.protected_scope;
  const choices = complete ? ["APPROVE_AND_CONTINUE", "STOP", "DEFER"] : [];
  const contract = buildActionableGateContract({
    gate_id: incident.incident_id,
    task_ref: incident.task_ref,
    classification: "HUMAN_GATE_REQUIRED",
    reason_codes: [incident.reason_code || "HUMAN_GATE_REQUIRED"].filter(Boolean),
    gate_summary: incident.summary,
    operator_action_summary: complete ? "Applicare la correzione bounded proposta" : null,
    operator_action_detail: complete
      ? `${incident.diagnosis?.why || ""} File coinvolti: ${(incident.affected_files || []).join(", ") || "—"}. Approvare ammete ESATTAMENTE UN remediation task con questo scope esatto (fingerprint vincolante).`
      : (incident.diagnosis?.risk || null),
    operator_action_choices: choices,
    origin: "LOCAL_DEV_DISPATCHER",
    created_at: incident.created_at,
    first_observed_at: incident.created_at,
    expires_at: new Date(nowMs + ttlMs).toISOString(),
    requires_confirmation: incident.requires_confirmation === true,
    references: [SELF_MAINTENANCE_TASK_REF, `incident:${incident.incident_id}`],
  });
  if (!contract) return null;
  return { contract, fingerprint: buildRemediationFingerprint(incident), mode: complete ? "ACTIONABLE" : "INFORMATIONAL" };
}

/* ------------------------------------------------------------------ */
/* Canonical operator decision admission (one-shot, restart-safe)      */
/* ------------------------------------------------------------------ */

/**
 * Admit ONE canonical external operator decision for the incident.
 * The decision record MUST come from the canonical runtime-authorization
 * issuance store (never from HTTP assertions or dashboard actions).
 * requiredDecision = { pending_decision_id, authorization_id, selected_option }.
 * Fences: state, fingerprint, one-shot spend, protected scope, foreign shape.
 */
export function admitOperatorDecision({ incident, repoPath, requiredDecision, decisionSource = null, nowMs = Date.now() } = {}) {
  if (!incident || !requiredDecision || decisionSource !== "v4-runtime-authorization-issuance-v1") {
    return { ok: false, reason_code: "DECISION_SOURCE_INVALID" };
  }
  const store = loadIncidentStore(repoPath);
  const rec = store.incidents[incident.incident_id];
  if (!rec) return { ok: false, reason_code: "UNKNOWN_INCIDENT" };
  if (rec.status === "APPROVED" || rec.status === "REMEDIATION_QUEUED") {
    return { ok: false, reason_code: "REMEDIATION_ALREADY_SPENT" };
  }
  if (rec.status !== "WAITING_OPERATOR") return { ok: false, reason_code: "GATE_NOT_WAITING" };
  if (rec.protected_scope === true) return { ok: false, reason_code: "PROTECTED_SCOPE_REQUIRES_EXPLICIT_OPERATOR" };
  if (requiredDecision.selected_option !== "APPROVE") return { ok: false, reason_code: "OPERATOR_CHOICE_NOT_APPROVAL" };
  if (rec.decision && rec.decision.pending_decision_id === requiredDecision.pending_decision_id) {
    return { ok: false, reason_code: "DECISION_REPLAYED" };
  }
  if (rec.expected_fingerprint && requiredDecision.remediation_fingerprint !== rec.expected_fingerprint) {
    return { ok: false, reason_code: "REMEDIATION_FINGERPRINT_MISMATCH" };
  }
  if (!requiredDecision.pending_decision_id || !requiredDecision.authorization_id) {
    return { ok: false, reason_code: "DECISION_IDENTITY_INCOMPLETE" };
  }
  // Exactly one transition WAITING_OPERATOR -> APPROVED, durably persisted.
  rec.decision = {
    source: decisionSource,
    pending_decision_id: bounded(requiredDecision.pending_decision_id, 200),
    authorization_id: bounded(requiredDecision.authorization_id, 200),
    selected_option: "APPROVE",
    remediation_fingerprint: rec.expected_fingerprint,
    admitted_at: new Date(nowMs).toISOString(),
  };
  rec.status = "APPROVED";
  rec.updated_at = rec.decision.admitted_at;
  persistIncidentStore(repoPath, store);
  return { ok: true, incident: rec };
}

/* ------------------------------------------------------------------ */
/* Remediation backlog item — existing LOCAL_DEV queue law only        */
/* ------------------------------------------------------------------ */

const backlogIdRe = /^D-\d+-[A-Za-z0-9_-]+$/;

function yamlEscape(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Render the canonical backlog-item-v1 markdown for the remediation task. */
export function buildRemediationBacklogItem(incident) {
  if (!incident || incident.status !== "APPROVED") return { ok: false, reason_codes: ["INCIDENT_NOT_APPROVED"] };
  if (incident.protected_scope === true) return { ok: false, reason_codes: ["PROTECTED_SCOPE_REQUIRES_EXPLICIT_OPERATOR"] };
  if (incident.remediation_dispatch_count > 0) return { ok: false, reason_codes: ["REMEDIATION_ALREADY_SPENT"] };
  const id = incident.task_ref.replace(/^D-(\d{4})(\d{2})(\d{2})-SM/, "D-$1$2$3-SM").slice(0, 60);
  const bareId = incident.task_ref.startsWith("LOCAL_DEV_B_") ? incident.task_ref.slice("LOCAL_DEV_B_".length) : incident.task_ref;
  if (!backlogIdRe.test(bareId)) return { ok: false, reason_codes: ["REMEDIATION_TASK_REF_INVALID"] };
  const allowed = incident.proposed_remediation?.allowed_paths || [];
  if (!Array.isArray(allowed) || allowed.length === 0) return { ok: false, reason_codes: ["REMEDIATION_SCOPE_EMPTY"] };
  const testCommand = incident.proposed_remediation?.test_command || "git diff --check";
  const files = allowed.map((f) => `    - ${yamlEscape(f)}`).join("\n");
  const markdown = [
    `# Backlog item — ${bareId} (#88 assisted self-maintenance remediation)`,
    "",
    "```yaml",
    `schema: backlog-item-v1`,
    `id: ${bareId}`,
    `title: #88 self-maintenance remediation for ${incident.incident_id}`,
    `created_at: ${new Date().toISOString()}`,
    `created_by: gpt-web`,
    `repository: mrhz1973/control-plane`,
    `branch_target: main`,
    "",
    `objective: |`,
    `  ASSISTED SELF-MAINTENANCE (issue #88) — incident ${incident.incident_id}.`,
    `  Operator APPROVE (decision ${incident.decision?.pending_decision_id || "n/a"}) admits EXACTLY THIS scope.`,
    `  Remediation fingerprint: ${incident.decision?.remediation_fingerprint || "n/a"}.`,
    `  ${yamlEscape(incident.proposed_remediation?.summary || "Apply the bounded diagnosed remediation.")}`,
    `  Base HEAD at approval time: ${(incident.base_head || "").slice(0, 12) || "unknown"}.`,
    `  Touch ONLY the allowed_paths below. Run the focused verification command.`,
    `  Persist PASS/STOP with git; remote HEAD verification is mandatory before resolution.`,
    "",
    `scope:`,
    `  allowed_areas:`,
    files,
    `  forbidden_areas:`,
    `    - .github/**`,
    `    - workflows/**`,
    `    - configs/**`,
    "",
    `risk_hint: low`,
    `complexity_hint: low`,
    "",
    `planner:`,
    `  preferred: qwen`,
    `  fallback: []`,
    `  fallback_policy: gate_only`,
    "",
    `execution:`,
    `  target: cursor`,
    `  loop_allowed: false`,
    `  max_loop_rounds_hint: 1`,
    "",
    `acceptance:`,
    `  - Exactly the approved remediation scope is implemented; no unrelated change`,
    `  - ${yamlEscape(testCommand)} exits 0`,
    `  - PASS/STOP persisted; remote HEAD verified before incident resolution`,
    "",
    `local_dev:`,
    `  dev_profile: qwen38-opus-q3-opencode-24k`,
    `  timebox_hint: 600`,
    `  max_turns_hint: 8`,
    `  test_commands:`,
    `    - ${yamlEscape(testCommand)}`,
    "",
    `human_gate_required_if: []`,
    `context_refs:`,
    `  - ${SELF_MAINTENANCE_TASK_REF}`,
    `  - incident:${incident.incident_id}`,
    "",
    `state: READY_FOR_PLANNING`,
    "```",
    "",
  ].join("\n");
  return { ok: true, markdown, backlog_id: bareId, source_file: `READY_${bareId}.md` };
}

/**
 * Spend the approval into ONE queue dispatch. Enqueue via the canonical queue
 * writer; the existing bridge/claim fences make a second dispatch impossible
 * (CLAIM_ALREADY_EXISTS) even across restarts (durable incident store).
 */
export function spendApprovalIntoQueue({ incident, repoPath, queueDir = "reports/runtime/dev-queue/always-on", writeItem, nowMs = Date.now() } = {}) {
  if (typeof writeItem !== "function") return { ok: false, reason_code: "QUEUE_WRITER_INVALID" };
  const store = loadIncidentStore(repoPath);
  const rec = store.incidents[incident.incident_id];
  if (!rec) return { ok: false, reason_code: "UNKNOWN_INCIDENT" };
  if (rec.status === "REMEDIATION_QUEUED" || rec.remediation_dispatch_count > 0) {
    return { ok: false, reason_code: "REMEDIATION_ALREADY_SPENT" };
  }
  if (rec.status !== "APPROVED") return { ok: false, reason_code: "INCIDENT_NOT_APPROVED" };
  const item = buildRemediationBacklogItem(rec);
  if (!item.ok) return { ok: false, reason_code: item.reason_codes[0] };
  writeItem(join(repoPath, queueDir, item.source_file), item.markdown);
  rec.status = "REMEDIATION_QUEUED";
  rec.remediation_dispatch_count = 1;
  rec.updated_at = new Date(nowMs).toISOString();
  persistIncidentStore(repoPath, store);
  return { ok: true, incident: rec, source_file: item.source_file, backlog_id: item.backlog_id };
}

/* ------------------------------------------------------------------ */
/* Terminal transition — PASS/STOP + remote verification law           */
/* ------------------------------------------------------------------ */

/**
 * Record the remediation outcome. PASS without remote HEAD verification is
 * NOT RESOLVED (stays REMEDIATION_PASS, human attention if never verified).
 */
export function recordRemediationOutcome({ incident, repoPath, executionStatus, remoteHeadVerified = false, remoteHead = null, nowMs = Date.now() } = {}) {
  const store = loadIncidentStore(repoPath);
  const rec = store.incidents[incident.incident_id];
  if (!rec) return { ok: false, reason_code: "UNKNOWN_INCIDENT" };
  const nowIso = new Date(nowMs).toISOString();
  rec.execution_count += 1;
  rec.result_persisted = executionStatus === "PASS" ? "PASS" : (executionStatus === "STOP" ? "STOP" : null);
  if (rec.result_persisted === "PASS" && remoteHeadVerified === true) {
    rec.remote_head_verified = true;
    rec.remote_head = bounded(remoteHead, 40);
    rec.status = "RESOLVED";
  } else if (rec.result_persisted === "PASS") {
    rec.remote_head_verified = false;
    rec.status = "REMEDIATION_PASS";
  } else {
    rec.remote_head_verified = false;
    rec.status = "REMEDIATION_STOP";
  }
  rec.updated_at = nowIso;
  persistIncidentStore(repoPath, store);
  return { ok: true, incident: rec, resolved: rec.status === "RESOLVED" };
}

/** Defer: informational handoff only — fault state untouched. */
export function deferSelfMaintenanceIncident({ incident, repoPath, nowMs = Date.now() } = {}) {
  const store = loadIncidentStore(repoPath);
  const rec = store.incidents[incident.incident_id];
  if (!rec) return { ok: false, reason_code: "UNKNOWN_INCIDENT" };
  if (rec.status !== "WAITING_OPERATOR") return { ok: false, reason_code: "INCIDENT_NOT_WAITING" };
  rec.status = "DEFERRED";
  rec.updated_at = new Date(nowMs).toISOString();
  persistIncidentStore(repoPath, store);
  return { ok: true, incident: rec };
}
