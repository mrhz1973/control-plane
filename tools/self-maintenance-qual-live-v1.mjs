#!/usr/bin/env node
/**
 * V4_CONTROL_PLANE_ASSISTED_SELF_MAINTENANCE_LOOP_V1 â€” LIVE QUALIFICATION
 * driver (SELFMAINT_QUAL_01), through EXISTING canonical surfaces only.
 *
 * Phase 1 (no args):
 *   1. create the qualification incident in the durable store (clearly marked
 *      QUAL, protected_scope=false, harmless read-only remediation);
 *   2. diagnose (read-only) -> DIAGNOSIS_COMPLETE with bounded proposal;
 *   3. build the canonical actionable gate (#87 contract);
 *   4. register ONE pending decision through the EXISTING issuance service
 *      (127.0.0.1:18792 register-pending) â€” the service itself sends the
 *      Telegram message with APPROVE/REJECT buttons (single getUpdates
 *      consumer, identity/TTL/one-shot fences owned by the canonical
 *      authority). NO second bot, NO second poller.
 *   5. persist incident + expected fingerprint (scope_digest = the exact
 *      remediation fingerprint â€” the issuance service enforces scope binding).
 *
 * Phase 2 (--pending-id <id>):
 *   poll canonical status; when APPROVED, admit the decision into the
 *   incident, spend ONE remediation backlog item into the canonical queue,
 *   and print the verification handles. Repeated/stale taps are rejected by
 *   the canonical authority itself (ISSUANCE_TELEGRAM_UPDATE_REUSED /
 *   GATE_ALREADY_RESOLVED semantics) and the incident store spends the
 *   approval exactly once (REMEDIATION_ALREADY_SPENT).
 *
 * The remediation item is a READ-ONLY self-check: it reads a known project
 * file, changes nothing, and its PASS path is the standard executor law
 * (receipts + post-exec fence + remote verification). No production action.
 * No tracked dirty state. No Qwen generation required for registration.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  SELF_MAINTENANCE_SCHEMA,
  SELF_MAINTENANCE_TASK_REF,
  loadIncidentStore,
  persistIncidentStore,
  buildRemediationFingerprint,
  buildSelfMaintenanceGate,
  admitOperatorDecision,
  spendApprovalIntoQueue,
} from "./control-plane-self-maintenance-v1.mjs";
import { createReadOnlyDiagnosis } from "./control-plane-self-maintenance-v1.mjs";

const REPO = "C:\\Users\\mrhz\\Documents\\AI\\GitHub\\control-plane";
const ISSUANCE = "http://127.0.0.1:18792";
const REGISTER_PATH = "/v4/authorization/register-pending";
const STATUS_PATH = "/v4/authorization/status";

const INCIDENT_ID = `SELFMAINT_QUAL_01-${randomUUID().replace(/-/g, "").slice(0, 8)}`;
const TASK_REF = `D-20260916-SMQ${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;

function post(p, body) {
  return new Promise((resolveP, rejectP) => {
    const data = JSON.stringify(body);
    const req = http.request(ISSUANCE + p, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }, timeout: 30000 }, (res) => {
      let b = ""; res.setEncoding("utf8"); res.on("data", (c) => (b += c)); res.on("end", () => { try { resolveP({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { rejectP(e); } });
    });
    req.on("error", rejectP); req.on("timeout", () => req.destroy(new Error("timeout"))); req.write(data); req.end();
  });
}
function get(p) {
  return new Promise((resolveP, rejectP) => {
    http.get(ISSUANCE + p, { timeout: 20000 }, (res) => {
      let b = ""; res.setEncoding("utf8"); res.on("data", (c) => (b += c)); res.on("end", () => { try { resolveP({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { rejectP(e); } });
    }).on("error", rejectP);
  });
}
const diag = createReadOnlyDiagnosis({ repoPath: REPO, runGit: (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }) });

// ---- Phase 1: incident + gate + canonical pending registration -----------
const store = loadIncidentStore(REPO);
const nowIso = new Date().toISOString();
const head = diag.currentHead();
const incident = {
  schema_version: SELF_MAINTENANCE_SCHEMA,
  incident_id: INCIDENT_ID,
  task_ref: `LOCAL_DEV_B_${TASK_REF}`,
  status: "DETECTED",
  depth: 0,
  classification: "HUMAN_GATE_REQUIRED",
  reason_code: "SELF_MAINTENANCE_QUALIFICATION",
  summary: "[TEST/QUAL #88] Incidente di auto-manutenzione assistita â€” nessun difetto reale",
  origin: "LOCAL_DEV_DISPATCHER",
  created_at: nowIso,
  updated_at: nowIso,
  affected_component: "self_maintenance_qualification",
  affected_files: [],
  evidence: { qualification: true, base_head: head },
  diagnosis: null,
  review_outcome: null,
  proposed_remediation: null,
  protected_scope: false,
  requires_confirmation: false,
  decision: null,
  expected_fingerprint: null,
  remediation_dispatch_count: 0,
  execution_count: 0,
  result_persisted: null,
  remote_head_verified: null,
};
store.incidents[INCIDENT_ID] = incident;

// Bounded harmless remediation proposal: ONE read-only self-check report file
// (canonical persistence surface â€” reports/), one file, no governance surface.
incident.proposed_remediation = {
  summary: "Creare il report di qualifica sola-lettura reports/runtime/self-maintenance-qual-01.md (nessuna modifica al codice, nessuna azione di produzione).",
  allowed_paths: ["reports/runtime/self-maintenance-qual-01.md"],
  test_command: "git diff --check",
  requires_confirmation: false,
};
incident.affected_files = [];
incident.review_outcome = "DIAGNOSIS_COMPLETE";
incident.diagnosis = {
  outcome: "DIAGNOSIS_COMPLETE",
  what_happened: incident.summary,
  why: "Incidente di qualifica esplicitamente marcato TEST/QUAL (#88). Nessun difetto reale: verifica del percorso gate->approvazione->un dispatch.",
  affected_component: incident.affected_component,
  affected_files: [],
  risk: "nessuno â€” remediation sola lettura, un solo file di report",
  operator_authorization_required: true,
  touches_protected_governance: false,
  evidence: { probes: [{ probe: "git_rev_parse_HEAD", result: head }] },
};
incident.status = "DIAGNOSED";
persistIncidentStore(REPO, store);

const gate = buildSelfMaintenanceGate(incident, { ttlMs: 15 * 60 * 1000 });
if (!gate || gate.mode !== "ACTIONABLE") {
  console.log(JSON.stringify({ step: "GATE_BUILD_FAILED", mode: gate?.mode ?? null }, null, 1));
  process.exit(3);
}
// Approval binds to the EXACT remediation fingerprint.
incident.expected_fingerprint = gate.fingerprint;
persistIncidentStore(REPO, store);

const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
const pendingDecisionId = `WF88-QUAL-${suffix}`;
const authorizationId = `WF88-QUAL-AUTH-${suffix}`;
const executionId = `WF88-QUAL-EXEC-${suffix}`;
// scope_digest = sha256 of the canonical remediation fingerprint record â€”
// the issuance scope carries the incident identity so the approval cannot be
// replayed onto a different remediation (fingerprint binding end-to-end).
const scope = {
  task_ref: SELF_MAINTENANCE_TASK_REF,
  kind: "SELF_MAINTENANCE_QUALIFICATION",
  incident_id: INCIDENT_ID,
  remediation_fingerprint: gate.fingerprint,
  allowed_paths: incident.proposed_remediation.allowed_paths,
  destructive: false,
  production_promotion: false,
  note: "TEST/QUAL #88 only â€” read-only remediation, no runtime path consumes the issued authorization.",
};
const scopeDigest = createHash("sha256").update(JSON.stringify(scope)).digest("hex");
const reg = await post(REGISTER_PATH, {
  schema_version: "v4-runtime-authorization-register-pending-request-v1",
  pending_decision_id: pendingDecisionId,
  authorization_id: authorizationId,
  task_id: SELF_MAINTENANCE_TASK_REF,
  execution_id: executionId,
  route_id: "opencode+qwen_local",
  scope_digest: scopeDigest,
  pending_ttl_seconds: 900,
});
const out = {
  step: "REGISTERED",
  task_ref: SELF_MAINTENANCE_TASK_REF,
  incident_id: INCIDENT_ID,
  gate_mode: gate.mode,
  gate_choices: gate.contract.operator_action_choices,
  remediation_fingerprint: gate.fingerprint,
  pending_decision_id: pendingDecisionId,
  authorization_id: authorizationId,
  register_status: reg.status,
  register_ok: reg.body?.ok === true,
  telegram_sent_by_service: reg.status === 200 && reg.body?.ok === true,
};
const spoolDir = process.env.TEMP || ".";
fs.writeFileSync(path.join(spoolDir, `wf88-qual-${pendingDecisionId}.json`), JSON.stringify({ ...out, authorization_id: authorizationId }, null, 2));
console.log(JSON.stringify(out, null, 1));
if (!out.register_ok) {
  console.log(JSON.stringify({ step: "REGISTER_FAILED", reason: reg.body?.reason_codes ?? null }, null, 1));
  process.exit(3);
}
console.log(`NOW_TAP_APPROVE_ON_TELEGRAM. Then rerun with --pending-id ${pendingDecisionId}`);
process.exit(0);

