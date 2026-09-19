#!/usr/bin/env node
/**
 * local-dev-project-reconciliation-v1 — bounded post-terminal continuation
 * stage for the LOCAL_DEV dispatcher (issue #110).
 *
 * Closes the loop:
 *   terminal PASS → [detect → publish ONE project-reconciliation READY]
 *   → natural WF90 → reconciler executes on the TARGET repo (project canon
 *   authority: updates stale docs + writes machine-readable backlog-state)
 *   → terminal PASS of the reconciler → deterministic decision
 *   → publish MAX ONE successor READY | HUMAN_GATE | PROJECT_IDLE_COMPLETE.
 *
 * Authority model (hard law):
 * - the PROJECT owns backlog semantics; this module NEVER invents roadmap
 *   work and NEVER violates dependency edges. The deterministic decision
 *   only materializes what the reconciled project canon declares
 *   (status NEXT with satisfied dependencies → the one canonical next).
 * - no second dispatcher/queue/scheduler: everything is invoked from inside
 *   the existing canonical tick, publishing into the existing queue dir.
 *
 * Idempotency / crash recovery (hard law):
 * - stable key: repo + terminal task_ref + terminal commit;
 * - every external effect (READY publication, notification) is guarded by
 *   the durable store + on-disk queue state, so repeated terminal
 *   observation, duplicate ticks, and restarts cannot duplicate work;
 * - historical receipts are NEVER rewritten or deleted.
 *
 * Deterministic only: no LLM calls here. The reconciler work item itself is
 * executed through the canonical LOCAL_DEV pipeline by the usual executor.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";

export const RECONCILIATION_MODULE_VERSION = "local-dev-project-reconciliation-v1";
export const RECONCILIATION_STORE_SCHEMA = "local-dev-project-reconciliation-store-v1";
export const BACKLOG_STATE_SCHEMA = "tmar-backlog-state-v1";
export const RECONCILER_ID_SUFFIX = "-RECON";
export const TERMINAL_PASS = "PASS";
export const TERMINAL_STOP = "STOP";

/** Projects with a canonical reconciliation contract (closed map — adding a
 * project is an explicit governed act, not an inference). */
export const PROJECT_CANON = Object.freeze({
  "mrhz1973/tmar-tts": Object.freeze({
    reconcilerAllowedAreas: Object.freeze(["docs/roadmap.md", "docs/current-state.md", "docs/backlog-state.json"]),
    reconcilerForbiddenAreas: Object.freeze(["*.py", "requirements.txt", "requirements-dev.txt", "ruff.toml", "voices/**", "texts/**", "models/**", "weights/**", "datasets/**", ".github/**"]),
    campaignContextRefs: Object.freeze([
      "github:mrhz1973/control-plane#103",
      "github:mrhz1973/control-plane#110",
    ]),
    terminalIssueRef: "github:mrhz1973/control-plane#103",
  }),
});

/** Stable reconciliation key: repo + terminal task_ref + terminal commit. */
export function reconciliationKey({ repo, taskRef, commitSha }) {
  const repo_s = String(repo || "").trim();
  const task = String(taskRef || "").trim();
  const sha = String(commitSha || "").trim() || "NO_COMMIT";
  if (!repo_s || !task) return null;
  return `${repo_s}|${task}|${sha}`;
}

/** Deterministic stable numeric suffix (6 digits) for RECONCILER ids derived
 * from the reconciliation key: same terminal evidence → same id → natural
 * dedup against both the on-disk queue and the receipt ledger. */
export function stableReconDigits(key) {
  let h = 0x811c9dc5;
  const s = String(key || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 900000) + 100000;
}

export function isReconcilerTaskRef(taskRef) {
  return typeof taskRef === "string" && taskRef.endsWith(RECONCILER_ID_SUFFIX);
}

function runtimeStorePath() {
  const base = typeof process.env?.LOCALAPPDATA === "string" && process.env.LOCALAPPDATA.trim()
    ? join(process.env.LOCALAPPDATA, "ControlPlane", "runtime")
    : join(homedir() || ".", ".control-plane-runtime");
  return join(base, "project-reconciliation-store.json");
}

/** Load the durable store (missing → fresh empty; malformed → fail closed
 * by throwing — the caller must surface a SERVICE-style journal event and
 * never silently reset reconciliation state). */
export function loadReconciliationStore(path = runtimeStorePath()) {
  if (!existsSync(path)) {
    return { schema_version: RECONCILIATION_STORE_SCHEMA, records: [] };
  }
  const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
    || parsed.schema_version !== RECONCILIATION_STORE_SCHEMA
    || !Array.isArray(parsed.records)) {
    const err = new Error("RECONCILIATION_STORE_INVALID");
    err.code = "RECONCILIATION_STORE_INVALID";
    throw err;
  }
  return parsed;
}

export function saveReconciliationStoreAtomic(store, path = runtimeStorePath()) {
  if (!store || store.schema_version !== RECONCILIATION_STORE_SCHEMA || !Array.isArray(store.records)) {
    const err = new Error("RECONCILIATION_STORE_INVALID");
    err.code = "RECONCILIATION_STORE_INVALID";
    throw err;
  }
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.recon-${process.pid}-${Date.now()}.tmp`);
  try {
    writeFileSync(tmp, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    renameSync(tmp, path);
  } catch (err) {
    try { unlinkSync(tmp); } catch { /* best-effort */ }
    throw err;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Backlog-state (project-side machine-readable canon reflection)      */
/* ------------------------------------------------------------------ */

const BACKLOG_STATE_STATUSES = new Set(["READY", "NEXT", "LATER", "PARKED", "SUPERSEDED", "DONE"]);

/** Validate + normalize the reconciler-produced project backlog state.
 * Returns { ok, state } or { ok:false, reason }. Pure. */
export function parseBacklogState(text) {
  let obj;
  try {
    obj = JSON.parse(String(text));
  } catch {
    return { ok: false, reason: "BACKLOG_STATE_JSON_INVALID" };
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, reason: "BACKLOG_STATE_INVALID_SHAPE" };
  }
  if (obj.schema !== BACKLOG_STATE_SCHEMA) {
    return { ok: false, reason: "BACKLOG_STATE_SCHEMA_MISMATCH" };
  }
  if (!Array.isArray(obj.items)) {
    return { ok: false, reason: "BACKLOG_STATE_ITEMS_INVALID" };
  }
  const seen = new Set();
  const items = [];
  for (const raw of obj.items) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, reason: "BACKLOG_STATE_ITEM_INVALID" };
    }
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!id || seen.has(id)) return { ok: false, reason: "BACKLOG_STATE_ITEM_INVALID" };
    seen.add(id);
    const status = typeof raw.status === "string" ? raw.status.trim().toUpperCase() : "";
    if (!BACKLOG_STATE_STATUSES.has(status)) return { ok: false, reason: "BACKLOG_STATE_STATUS_INVALID" };
    const dependsOn = Array.isArray(raw.depends_on)
      ? raw.depends_on.map((d) => String(d).trim()).filter(Boolean)
      : [];
    items.push({ id, status, depends_on: dependsOn, payload: raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload) ? raw.payload : null });
  }
  return { ok: true, state: { schema: BACKLOG_STATE_SCHEMA, generated_at: typeof obj.generated_at === "string" ? obj.generated_at : null, reconciled_for: typeof obj.reconciled_for === "string" ? obj.reconciled_for : null, items } };
}

/** Deterministic next-task decision (the ONLY selection authority here is
 * the reconciled project canon: status NEXT + satisfied dependencies).
 * Pure. */
export function decideNext(backlogState) {
  const items = backlogState?.items || [];
  const done = new Set(items.filter((i) => i.status === "DONE").map((i) => i.id));
  const nextItems = items.filter((i) => i.status === "NEXT");
  const readyItems = items.filter((i) => i.status === "READY");
  if (nextItems.length === 1) {
    const n = nextItems[0];
    const unsatisfied = (n.depends_on || []).filter((d) => !done.has(d));
    if (unsatisfied.length === 0) return { kind: "PUBLISH", item: n };
    return { kind: "HUMAN_GATE", reason: "NEXT_DEPENDENCIES_NOT_SATISFIED", candidates: [n.id], detail: `unsatisfied: ${unsatisfied.join(",")}` };
  }
  if (nextItems.length >= 2) {
    return { kind: "HUMAN_GATE", reason: "AMBIGUOUS_CANONICAL_NEXT", candidates: nextItems.map((i) => i.id) };
  }
  // nextItems.length === 0
  const activeRemaining = items.filter((i) => !done.has(i.id) && !["PARKED", "SUPERSEDED", "LATER"].includes(i.status));
  if (readyItems.length === 0 && activeRemaining.length === 0) {
    return { kind: "PROJECT_IDLE_COMPLETE" };
  }
  return {
    kind: "HUMAN_GATE",
    reason: readyItems.length ? "NO_CANONICAL_SELECTION_AMONG_READY" : "BLOCKED_WORK_REMAINS",
    candidates: (readyItems.length ? readyItems : activeRemaining).map((i) => i.id),
  };
}

/* ------------------------------------------------------------------ */
/* READY artifact builders (backlog-item-v1 transport contract)        */
/* ------------------------------------------------------------------ */

function yamlString(value) {
  return String(value ?? "");
}

function yamlBlockList(lines, indent = "  ") {
  return lines.map((l) => `${indent}- ${String(l ?? "").replace(/\r?\n/g, " ")}`).join("\n");
}

/** Build the bounded-YAML reconciler READY markdown. Bang-safe (no "!"),
 * transport-contract conforming (created_by gpt-web, D-style id). */
export function buildReconcilerReadyMarkdown({ repo, terminalTaskRef, terminalTaskId, terminalCommit, terminalTestsState, nowIso, canon }) {
  const c = canon || PROJECT_CANON[repo];
  const digits = stableReconDigits(reconciliationKey({ repo, taskRef: terminalTaskRef, commitSha: terminalCommit }));
  const id = `D-${digits}${RECONCILER_ID_SUFFIX}`;
  const safeTerminalId = yamlString(terminalTaskId).slice(0, 60);
  const commitLine = terminalCommit ? `terminal commit ${String(terminalCommit).slice(0, 40)}` : "no terminal commit recorded";
  const objective = [
    `Project reconciliation for ${repo} after terminal PASS of ${yamlString(terminalTaskRef).slice(0, 120)} (${commitLine}).`,
    `This is the bounded post-terminal reconciliation stage of Control Plane issue #110: it does NOT implement product work and does NOT promote anything by itself.`,
    ``,
    `Required actions on the target repository, in order:`,
    `1. Read docs/roadmap.md and docs/current-state.md.`,
    `2. Mark the completed item (${safeTerminalId} lineage) as DONE in docs/roadmap.md with the PASS evidence (date${terminalCommit ? `, commit ${String(terminalCommit).slice(0, 40)}` : ""}) and update the SELECTED NEXT section so the completed item is no longer the current NEXT.`,
    `3. Update docs/current-state.md "Next concrete work" to the reconciled next item (or state that none is selected).`,
    `4. Write docs/backlog-state.json — machine-readable reflection of the reconciled roadmap — with EXACTLY this shape:`,
    `   {"schema":"tmar-backlog-state-v1","generated_at":"<now>","reconciled_for":"${yamlString(terminalTaskRef).slice(0, 120)}","items":[{"id":"F001","status":"DONE","depends_on":["R001"],"payload":null},{"id":"F002","status":"NEXT","depends_on":["F001"],"payload":{"ready_id":"D-0103-F002","title":"...","objective":"...","allowed_areas":["..."],"forbidden_areas":["..."],"risk_hint":"low","complexity_hint":"medium","acceptance":["..."],"test_commands":["..."],"timebox_hint":3600,"max_turns_hint":16,"context_refs":["..."]}}]}`,
    `   Rules for items: one entry per roadmap item with id, status (READY|NEXT|LATER|PARKED|SUPERSEDED|DONE) and depends_on copied from the roadmap dependency graph. Exactly ONE item may have status NEXT: the single project-canonical next whose dependencies are all DONE. Independent READY candidates must have status READY, not NEXT. If no unambiguous next exists, use zero NEXT items and leave the eligible ones READY.`,
    `   Rules for the NEXT item payload (only required when a NEXT exists): ready_id must match D-<digits>-<ITEMID>; objective/scope/acceptance must come from the roadmap item semantics; test_commands must be exactly ONE bang-safe command; timebox_hint and max_turns_hint bounded integers.`,
    `5. Commit and push the three docs paths with an ordinary commit.`,
    ``,
    `Do not modify any other file. Do not change dependency edges. Do not invent new roadmap items.`,
  ].join("\n");
  const lines = [
    "# Backlog item — project reconciliation (post-terminal continuation)",
    "",
    "```yaml",
    `schema: backlog-item-v1`,
    `id: ${id}`,
    `title: ${repo} project reconciliation after ${safeTerminalId}`,
    `created_at: ${nowIso}`,
    `created_by: gpt-web`,
    `repository: ${repo}`,
    `branch_target: main`,
    "",
    "objective: |",
    ...objective.split("\n").map((l) => (l ? `  ${l}` : "")),
    "",
    "scope:",
    "  allowed_areas:",
    ...yamlBlockList(c.reconcilerAllowedAreas).split("\n").map((l) => `  ${l}`),
    "  forbidden_areas:",
    ...yamlBlockList(c.reconcilerForbiddenAreas).split("\n").map((l) => `  ${l}`),
    "risk_hint: low",
    "complexity_hint: low",
    "",
    "planner:",
    "  preferred: qwen",
    "  fallback: []",
    "  fallback_policy: gate_only",
    "",
    "execution:",
    "  target: cursor",
    "  loop_allowed: false",
    "  max_loop_rounds_hint: 1",
    "",
    "acceptance:",
    "  - the completed item is recorded DONE in docs/roadmap.md with PASS evidence",
    "  - the completed item is no longer SELECTED NEXT in docs/roadmap.md",
    "  - docs/current-state.md next concrete work is reconciled",
    "  - docs/backlog-state.json exists, parses, and satisfies schema tmar-backlog-state-v1",
    "  - at most one item has status NEXT and its dependencies are all DONE",
    "  - dependency edges are unchanged and no roadmap item was invented",
    "  - executor persistence commit and ordinary push succeed",
    "",
    "local_dev:",
    "  dev_profile: qwen38-opus-q3-opencode-64k",
    "  timebox_hint: 1800",
    "  max_turns_hint: 12",
    "  test_commands:",
    `    - powershell.exe -NoProfile -Command "try { $st = Get-Content docs\\backlog-state.json -Raw | ConvertFrom-Json } catch { exit 1 }; if (-not $st.items) { exit 2 }; if ($st.schema -ne 'tmar-backlog-state-v1') { exit 3 }; $n = @($st.items | Where-Object { $_.status -eq 'NEXT' }); if ($n.Count -gt 1) { exit 4 }; git diff --check; if ($LASTEXITCODE -ne 0) { exit 5 }"`,
    "",
    "human_gate_required_if: []",
    "context_refs:",
    ...yamlBlockList([...c.campaignContextRefs, c.terminalIssueRef]).split("\n").map((l) => `  ${l}`),
    "",
    "state: READY_FOR_PLANNING",
    "```",
    "",
  ];
  return { markdown: lines.join("\n"), id, taskRef: `LOCAL_DEV_B_${id}` };
}

const D_ID_RE = /^D-\d+-[A-Za-z0-9_-]+$/;

/** Build the successor READY markdown from the canonical NEXT payload. */
export function buildSuccessorReadyMarkdown({ repo, payload, nowIso, contextRefs }) {
  if (!payload || typeof payload !== "object") return { ok: false, reason: "PAYLOAD_INVALID" };
  const readyId = String(payload.ready_id || "").trim();
  if (!D_ID_RE.test(readyId)) return { ok: false, reason: "READY_ID_INVALID" };
  const title = String(payload.title || "").trim() || readyId;
  const objective = String(payload.objective || "").trim();
  if (!objective) return { ok: false, reason: "OBJECTIVE_MISSING" };
  const allowed = Array.isArray(payload.allowed_areas) ? payload.allowed_areas.map(String).filter(Boolean) : [];
  const forbidden = Array.isArray(payload.forbidden_areas) ? payload.forbidden_areas.map(String).filter(Boolean) : ["models/**", "weights/**", "datasets/**"];
  if (!allowed.length) return { ok: false, reason: "ALLOWED_AREAS_EMPTY" };
  const acceptance = Array.isArray(payload.acceptance) ? payload.acceptance.map(String).filter(Boolean) : [];
  if (!acceptance.length) return { ok: false, reason: "ACCEPTANCE_EMPTY" };
  const testCommands = Array.isArray(payload.test_commands) ? payload.test_commands.map(String).filter(Boolean) : [];
  if (testCommands.length !== 1) return { ok: false, reason: "TEST_COMMANDS_INVALID" };
  if (/![A-Za-z]/.test(testCommands[0])) return { ok: false, reason: "TEST_COMMAND_BANG_UNSAFE" };
  const timebox = Number.isInteger(payload.timebox_hint) && payload.timebox_hint > 0 && payload.timebox_hint <= 3600 ? payload.timebox_hint : 1800;
  const maxTurns = Number.isInteger(payload.max_turns_hint) && payload.max_turns_hint > 0 && payload.max_turns_hint <= 24 ? payload.max_turns_hint : 12;
  const risk = ["low", "medium"].includes(payload.risk_hint) ? payload.risk_hint : "low";
  const refs = Array.isArray(payload.context_refs) && payload.context_refs.length
    ? payload.context_refs.map(String).filter(Boolean)
    : (contextRefs || []).map(String).filter(Boolean);
  const lines = [
    `# Backlog item — ${readyId} (${title})`,
    "",
    "```yaml",
    "schema: backlog-item-v1",
    `id: ${readyId}`,
    `title: ${title}`,
    `created_at: ${nowIso}`,
    "created_by: gpt-web",
    `repository: ${repo}`,
    "branch_target: main",
    "",
    "objective: |",
    ...objective.split(/\r?\n/).map((l) => (l ? `  ${l}` : "")),
    "",
    "scope:",
    "  allowed_areas:",
    ...yamlBlockList(allowed).split("\n").map((l) => `  ${l}`),
    "  forbidden_areas:",
    ...yamlBlockList(forbidden).split("\n").map((l) => `  ${l}`),
    `risk_hint: ${risk}`,
    `complexity_hint: ${["low", "medium", "high"].includes(payload.complexity_hint) ? payload.complexity_hint : "medium"}`,
    "",
    "planner:",
    "  preferred: qwen",
    "  fallback: []",
    "  fallback_policy: gate_only",
    "",
    "execution:",
    "  target: cursor",
    "  loop_allowed: true",
    "  max_loop_rounds_hint: 2",
    "",
    "acceptance:",
    ...yamlBlockList(acceptance, "  ").split("\n"),
    "",
    "local_dev:",
    "  dev_profile: qwen38-opus-q3-opencode-64k",
    `  timebox_hint: ${timebox}`,
    `  max_turns_hint: ${maxTurns}`,
    "  test_commands:",
    `    - ${testCommands[0]}`,
    "",
    "human_gate_required_if: []",
    "context_refs:",
    ...yamlBlockList(refs).split("\n").map((l) => `  ${l}`),
    "",
    "state: READY_FOR_PLANNING",
    "```",
    "",
  ];
  return { ok: true, markdown: lines.join("\n"), id: readyId, taskRef: `LOCAL_DEV_B_${readyId}` };
}

/* ------------------------------------------------------------------ */
/* Orchestrator — deterministic post-terminal actions                   */
/* ------------------------------------------------------------------ */

function queueFileForId(queueDir, id) {
  const prefix = `READY_${id}.md`;
  const candidates = existsSync(queueDir) ? readdirSync(queueDir).filter((f) => f.endsWith(".md")) : [];
  return candidates.includes(prefix) ? join(queueDir, prefix) : null;
}

function recordByKey(store, key) {
  return store.records.find((r) => r && r.key === key) || null;
}

/**
 * Post-terminal continuation for a NON-reconciler terminal PASS:
 * idempotently publishes the ONE project-reconciliation READY item and
 * returns the PASS notification payload (dedup handled by the caller's
 * notify ledger).
 */
export function reconcileTerminalPass({ store, queueDir, repo, taskRef, taskId, commitSha, testsState, durationMs, nowIso, writeQueueFile }) {
  const canon = PROJECT_CANON[repo];
  if (!canon) return { ok: true, action: "NO_CANON_FOR_REPO", journalEvents: [], notifications: [] };
  const key = reconciliationKey({ repo, taskRef, commitSha });
  if (!key) return { ok: true, action: "KEY_INVALID", journalEvents: [], notifications: [] };
  let record = recordByKey(store, key);
  const journalEvents = [];
  const write = typeof writeQueueFile === "function" ? writeQueueFile : ((path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text, "utf8"); return true; });
  if (!record) {
    record = {
      key, repo, terminal_task_ref: taskRef, terminal_commit: commitSha || null, terminal_outcome: TERMINAL_PASS,
      reconciler_ready_id: null, reconciler_ready_published_at: null,
      reconciler_task_ref: null, reconciler_terminal_at: null, reconciler_outcome: null,
      decision: null, decision_at: null, successor_ready_id: null, successor_published_at: null,
      pass_notified_at: null, summary_notified_at: null, created_at: nowIso, updated_at: nowIso,
    };
    store.records.push(record);
  }
  if (record.terminal_outcome !== TERMINAL_PASS) {
    return { ok: true, action: "TERMINAL_NOT_PASS", journalEvents: [], notifications: [], record };
  }
  // Publish the reconciler READY exactly once (idempotent on store + disk).
  if (!record.reconciler_ready_id) {
    const built = buildReconcilerReadyMarkdown({ repo, terminalTaskRef: taskRef, terminalTaskId: taskId, terminalCommit: commitSha, testsState, nowIso });
    const existing = queueFileForId(queueDir, built.id);
    if (!existing) {
      write(join(queueDir, `READY_${built.id}.md`), built.markdown);
    }
    record.reconciler_ready_id = built.id;
    record.reconciler_task_ref = built.taskRef;
    record.reconciler_ready_published_at = nowIso;
    record.updated_at = nowIso;
    journalEvents.push({ event: "RECONCILIATION_READY_PUBLISHED", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: built.taskRef, target_repo: repo, classification: "RECONCILIATION_QUEUED", human_summary: `Riconciliazione progetto ${repo} accodata dopo PASS di ${taskId}.` });
  }
  const notifications = [];
  if (!record.pass_notified_at) {
    notifications.push({
      kind: "PASS",
      key: `pass|${key}`,
      recordKey: key,
      flag: "pass_notified_at",
      text: [
        "CONTROL PLANE — TASK PASS",
        `task: ${taskRef}`,
        `repo: ${repo}`,
        `duration: ${Number.isFinite(durationMs) ? `${Math.round(durationMs / 1000)}s` : "unknown"}`,
        `commit: ${commitSha ? String(commitSha).slice(0, 12) : "none"}`,
        "next: project reconciliation queued",
      ].join("\n"),
    });
    // pass_notified_at is set by the CALLER only after a confirmed send
    // (send failure must leave the request retryable).
  }
  return { ok: true, action: record.reconciler_ready_id ? "RECONCILER_QUEUED" : "NOOP", journalEvents, notifications, record };
}

/**
 * Post-terminal continuation for a RECONCILER terminal PASS: read the
 * reconciled project canon (backlog-state.json), decide deterministically,
 * publish the successor / emit HUMAN_GATE / PROJECT_IDLE_COMPLETE.
 */
export function reconcileReconcilerTerminal({ store, queueDir, repo, taskRef, nowIso, readBacklogState, writeQueueFile }) {
  const journalEvents = [];
  const notifications = [];
  const record = store.records.find((r) => r && r.reconciler_task_ref === taskRef) || null;
  const finishGate = (reason, candidates, detail) => ({
    ok: true, action: "HUMAN_GATE", journalEvents, notifications,
    journalGate: { reason, candidates: candidates || [], detail: detail || null },
  });
  if (!record) {
    // Unknown reconciler terminal — fail closed to a truthful gate.
    journalEvents.push({ event: "RECONCILIATION_HUMAN_GATE", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: taskRef, target_repo: repo, classification: "HUMAN_GATE_REQUIRED", human_summary: "Reconciler terminale senza record: richiesto intervento operatore." });
    return finishGate("RECONCILER_RECORD_MISSING", [String(taskRef).slice(0, 80)]);
  }
  record.reconciler_terminal_at = record.reconciler_terminal_at || nowIso;
  record.reconciler_outcome = TERMINAL_PASS;
  if (record.decision) {
    return { ok: true, action: "ALREADY_DECIDED", journalEvents, notifications, record };
  }
  const readState = typeof readBacklogState === "function"
    ? readBacklogState
    : (() => existsSync(readBacklogState) ? readFileSync(readBacklogState, "utf8") : null);
  let stateText = null;
  try {
    stateText = readState(repo);
  } catch {
    stateText = null;
  }
  if (!stateText) {
    journalEvents.push({ event: "RECONCILIATION_HUMAN_GATE", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: taskRef, target_repo: repo, classification: "HUMAN_GATE_REQUIRED", human_summary: "backlog-state.json non leggibile dopo reconciler PASS." });
    return finishGate("BACKLOG_STATE_UNREADABLE", [String(taskRef).slice(0, 80)]);
  }
  const parsed = parseBacklogState(stateText);
  if (!parsed.ok) {
    journalEvents.push({ event: "RECONCILIATION_HUMAN_GATE", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: taskRef, target_repo: repo, classification: "HUMAN_GATE_REQUIRED", human_summary: `backlog-state.json non valido: ${parsed.reason}.` });
    return finishGate(parsed.reason, [String(taskRef).slice(0, 80)]);
  }
  const decision = decideNext(parsed.state);
  record.decision = { kind: decision.kind, item_id: decision.item?.id || null, reason: decision.reason || null, candidates: decision.candidates || null };
  record.decision_at = nowIso;
  if (decision.kind === "PROJECT_IDLE_COMPLETE") {
    journalEvents.push({ event: "PROJECT_IDLE_COMPLETE", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: taskRef, target_repo: repo, classification: "PROJECT_IDLE_COMPLETE", human_summary: `Nessun lavoro residuo eligible in ${repo}.` });
    if (!record.summary_notified_at) {
      notifications.push({ kind: "SUMMARY", key: `summary|${record.key}`, recordKey: record.key, flag: "summary_notified_at", text: `CONTROL PLANE — PROJECT RECONCILED\nrepo: ${repo}\nresult: no eligible work remains (PROJECT_IDLE_COMPLETE)` });
    }
    return { ok: true, action: "PROJECT_IDLE_COMPLETE", journalEvents, notifications, record };
  }
  if (decision.kind === "HUMAN_GATE") {
    journalEvents.push({ event: "RECONCILIATION_HUMAN_GATE", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: taskRef, target_repo: repo, classification: "HUMAN_GATE_REQUIRED", human_summary: `Selezione next non univoca: ${decision.reason} (${(decision.candidates || []).join(", ")}).` });
    if (!record.summary_notified_at) {
      notifications.push({ kind: "SUMMARY", key: `summary|${record.key}`, recordKey: record.key, flag: "summary_notified_at", text: `CONTROL PLANE — PROJECT RECONCILED\nrepo: ${repo}\nresult: HUMAN_GATE (${decision.reason})\ncandidates: ${(decision.candidates || []).join(", ")}` });
    }
    return { ok: true, action: "HUMAN_GATE", journalEvents, notifications, record, gate: decision };
  }
  // PUBLISH: materialize the canonical NEXT as ONE successor READY.
  const built = buildSuccessorReadyMarkdown({ repo, payload: decision.item.payload, nowIso });
  if (!built.ok) {
    journalEvents.push({ event: "RECONCILIATION_HUMAN_GATE", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: taskRef, target_repo: repo, classification: "HUMAN_GATE_REQUIRED", human_summary: `Payload successore non conforme: ${built.reason}.` });
    record.decision = { kind: "HUMAN_GATE", item_id: decision.item.id, reason: `PAYLOAD_INVALID:${built.reason}` };
    return finishGate(`PAYLOAD_INVALID:${built.reason}`, [decision.item.id]);
  }
  const write = typeof writeQueueFile === "function" ? writeQueueFile : ((path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text, "utf8"); return true; });
  if (!record.successor_ready_id) {
    const existing = queueFileForId(queueDir, built.id);
    if (!existing) {
      write(join(queueDir, `READY_${built.id}.md`), built.markdown);
    }
    record.successor_ready_id = built.id;
    record.successor_published_at = nowIso;
    journalEvents.push({ event: "SUCCESSOR_READY_PUBLISHED", phase: "PROJECT_RECONCILIATION", component: "dispatcher", task_ref: built.taskRef, target_repo: repo, classification: "NEXT_QUEUED", human_summary: `Successore ${built.id} accodato per ${repo}.` });
  }
  if (!record.summary_notified_at) {
    notifications.push({ kind: "SUMMARY", key: `summary|${record.key}`, recordKey: record.key, flag: "summary_notified_at", text: `CONTROL PLANE — PROJECT RECONCILED\nrepo: ${repo}\nresult: ${built.id} queued automatically\nnext tick: natural WF90 dispatch` });
  }
  return { ok: true, action: "SUCCESSOR_QUEUED", journalEvents, notifications, record, successorId: built.id };
}

/**
 * Terminal STOP law (#110-H): STOP never auto-publishes a successor and
 * never triggers project reconciliation. Only a truthful journal marker is
 * recorded so repeated observations stay idempotent.
 */
export function reconcileTerminalStop({ store, repo, taskRef, commitSha, nowIso }) {
  const canon = PROJECT_CANON[repo];
  if (!canon) return { ok: true, action: "NO_CANON_FOR_REPO", journalEvents: [], notifications: [] };
  const key = reconciliationKey({ repo, taskRef, commitSha });
  if (!key) return { ok: true, action: "KEY_INVALID", journalEvents: [], notifications: [] };
  const existing = recordByKey(store, key);
  if (existing) return { ok: true, action: "ALREADY_RECORDED", journalEvents: [], notifications: [], record: existing };
  const record = {
    key, repo, terminal_task_ref: taskRef, terminal_commit: commitSha || null, terminal_outcome: TERMINAL_STOP,
    reconciler_ready_id: null, reconciler_ready_published_at: null, reconciler_task_ref: null,
    reconciler_terminal_at: null, reconciler_outcome: null, decision: null, decision_at: null,
    successor_ready_id: null, successor_published_at: null, pass_notified_at: null, summary_notified_at: null,
    created_at: nowIso, updated_at: nowIso,
  };
  store.records.push(record);
  return {
    ok: true, action: "STOP_RECORDED_NO_AUTO_SUCCESSOR",
    journalEvents: [{
      event: "TERMINAL_STOP_RECORDED", phase: "PROJECT_RECONCILIATION", component: "dispatcher",
      task_ref: taskRef, target_repo: repo, classification: "STOP",
      human_summary: `STOP terminale registrato per ${taskRef}: nessun successore automatico (semantica di recovery governata separatamente).`,
    }],
    notifications: [], record,
  };
}

/**
 * Retro-detect terminal PASS receipts without a reconciliation record
 * (covers restarts, pre-deployment terminals like the F001 bootstrap, and
 * crash-after-terminal). Deterministic, bounded to the latest terminal PASS
 * per canon repo. Pure read + the same idempotent actions.
 */
export function detectUnreconciledTerminalPass({ receipts, store, repoCanonMap }) {
  const out = [];
  for (const repo of Object.keys(repoCanonMap || PROJECT_CANON)) {
    const passes = (receipts || []).filter((r) => r && r.state === TERMINAL_PASS
      && typeof r.source_ref === "string" && r.source_ref.includes(`github:${repo}@`)
      && !isReconcilerTaskRef(r.task_ref));
    if (!passes.length) continue;
    const latest = passes.reduce((a, b) => (String(a.claimed_at || "") <= String(b.claimed_at || "") ? b : a));
    const key = reconciliationKey({ repo, taskRef: latest.task_ref, commitSha: null });
    if (!key) continue;
    if (recordByKey(store, key)) continue;
    out.push({ repo, taskRef: latest.task_ref, taskId: String(latest.task_ref).replace(/^LOCAL_DEV_B_/, ""), commitSha: null, claimedAt: latest.claimed_at });
  }
  return out;
}

const isCli = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("tools/local-dev-project-reconciliation-v1.mjs");
if (isCli) {
  process.stdout.write(`${RECONCILIATION_MODULE_VERSION} — library module (deterministic core; invoked by the canonical dispatcher)\n`);
  process.exit(0);
}
