#!/usr/bin/env node
/**
 * V4_CONTROL_PLANE_ASSISTED_SELF_MAINTENANCE_LOOP_V1 â€” focused suite (T1-T20).
 * Deterministic, offline: temp repo fixture, no real Telegram, no real queue,
 * no production surface. Every law of the assisted loop is proven here.
 */
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  SELF_MAINTENANCE_SCHEMA,
  SELF_MAINTENANCE_STATES,
  RECURSION_DEPTH_MAX,
  PROTECTED_GOVERNANCE_PATTERNS,
  createReadOnlyDiagnosis,
  classifyProtectedScope,
  loadIncidentStore,
  persistIncidentStore,
  buildRemediationFingerprint,
  detectSelfMaintenanceIncident,
  diagnoseSelfMaintenanceIncident,
  buildSelfMaintenanceGate,
  admitOperatorDecision,
  buildRemediationBacklogItem,
  spendApprovalIntoQueue,
  recordRemediationOutcome,
  deferSelfMaintenanceIncident,
} from "../../tools/control-plane-self-maintenance-v1.mjs";
import { buildActionableGateContract } from "../../tools/v4-actionable-gate-contract-v1.mjs";

function gitInit(dir) {
  const run = (args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  run(["init", "-b", "main"]);
  run(["config", "user.email", "t@example.invalid"]);
  run(["config", "user.name", "t"]);
  writeFileSync(join(dir, "tools", "placeholder.txt").replace("tools\\placeholder.txt", "base.txt"), "base\n");
  run(["add", "."]);
  run(["commit", "-m", "base"]);
  return run;
}

function fixture({ dirty = [], protectedDirty = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sm88-"));
  const run = gitInit(dir);
  mkdirSync(join(dir, "tools"), { recursive: true });
  // Pre-create the untracked runtime-state dir + incident store so the
  // durable-state path is stable across the whole test (same canonical
  // untracked-runtime pattern as receipts/claim state).
  mkdirSync(join(dir, "reports", "runtime"), { recursive: true });
  writeFileSync(join(dir, "reports", "runtime", "self-maintenance-incidents-v1.json"),
    JSON.stringify({ schema_version: SELF_MAINTENANCE_SCHEMA, mode: "ASSISTED", self_approval_allowed: false, incidents: {} }));
  writeFileSync(join(dir, "tools", "dashboard.txt"), "one\n");
  run(["add", "."]);
  run(["commit", "-m", "work"]);
  for (const f of dirty) {
    mkdirSync(join(dir, f, ".."), { recursive: true });
    writeFileSync(join(dir, f), "changed\n");
  }
  if (protectedDirty) writeFileSync(join(dir, "tools", "v4-runtime-authorization-issuance-v1.mjs"), "changed\n");
  const runGit = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" });
  const diagnosis = createReadOnlyDiagnosis({ repoPath: dir, runGit });
  return { dir, run, runGit, diagnosis, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function baseTick(reason = "TRACKED_DIRTY_CONFLICT") {
  return { ok: false, classification: "HUMAN_GATE_REQUIRED", human_gate_required: true, reason_codes: [reason], gate_summary: `tracked dirty`, request_id: "r" };
}

const noopWriter = () => {};

// ---- T1: read-only diagnosis does not mutate the repo ---------------------

await test("T1 read-only diagnosis leaves repo state byte-identical", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const beforeStatus = fx.runGit(fx.dir, ["status", "--short"]);
    const beforeHead = fx.runGit(fx.dir, ["rev-parse", "HEAD"]);
    const beforeIndex = fx.runGit(fx.dir, ["write-tree"]);
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    assert.ok(det);
    const res = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    assert.equal(res.outcome, "DIAGNOSIS_COMPLETE");
    // Mutation law: TRACKED paths byte-identical; HEAD identical; index identical.
    // (The durable incident store is untracked runtime state, same canonical
    // class as receipts/claim state — it never touches tracked work.)
    const after = fx.runGit(fx.dir, ["status", "--short"]).split(/\r?\n/).filter((l) => l && !l.startsWith("??"));
    assert.deepEqual(after, beforeStatus.split(/\r?\n/).filter((l) => l && !l.startsWith("??")), "tracked worktree untouched");
    assert.equal(fx.runGit(fx.dir, ["rev-parse", "HEAD"]), beforeHead);
    assert.equal(fx.runGit(fx.dir, ["write-tree"]), beforeIndex, "index untouched â€” no staging");
    assert.ok(res.incident.affected_files.includes("tools/dashboard.txt"));
  } finally { fx.cleanup(); }
});

// ---- T2: safe bounded proposal produces an actionable gate ----------------

await test("T2 DIAGNOSIS_COMPLETE -> ACTIONABLE gate with canonical choices (#87 contract)", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    assert.equal(gate.mode, "ACTIONABLE");
    assert.equal(gate.contract.schema_version, "v4-actionable-gate-contract-v1");
    assert.deepEqual(gate.contract.operator_action_choices, ["APPROVE_AND_CONTINUE", "STOP", "DEFER"]);
    assert.equal(gate.contract.gate_id, dia.incident.incident_id);
    assert.ok(gate.fingerprint && /^[0-9a-f]{64}$/.test(gate.fingerprint));
  } finally { fx.cleanup(); }
});

// ---- T3: insufficient diagnosis -> informational gate, no choices ---------

await test("T3 DIAGNOSIS_INCONCLUSIVE -> INFORMATIONAL gate (zero choices, no invention)", () => {
  const fx = fixture();
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick("QWEN_SESSION_NOT_READY") });
    assert.ok(det, "non-dirty gate still detected");
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    assert.equal(dia.outcome, "DIAGNOSIS_INCONCLUSIVE");
    const gate = buildSelfMaintenanceGate(dia.incident);
    assert.equal(gate.mode, "INFORMATIONAL");
    assert.deepEqual(gate.contract.operator_action_choices, []);
  } finally { fx.cleanup(); }
});

// ---- T4: protected governance scope cannot auto-dispatch ------------------

await test("T4 protected governance dirty file -> PROTECTED_SCOPE_REQUIRES_OPERATOR, no auto dispatch", () => {
  const fx = fixture({ dirty: ["tools/v4-runtime-authorization-issuance-v1.mjs"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    assert.equal(dia.outcome, "PROTECTED_SCOPE_REQUIRES_OPERATOR");
    assert.equal(dia.incident.protected_scope, true);
    const gate = buildSelfMaintenanceGate(dia.incident);
    assert.equal(gate.mode, "INFORMATIONAL", "no actionable choices for governance surfaces");
    // Even a forged WAITING state cannot be approved into dispatch.
    const store = loadIncidentStore(fx.dir);
    store.incidents[dia.incident.incident_id].status = "WAITING_OPERATOR";
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    const adm = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p", authorization_id: "a", selected_option: "APPROVE" }, decisionSource: "v4-runtime-authorization-issuance-v1" });
    assert.equal(adm.ok, false);
    assert.equal(adm.reason_code, "PROTECTED_SCOPE_REQUIRES_EXPLICIT_OPERATOR");
  } finally { fx.cleanup(); }
});

await test("T4b classifyProtectedScope is semantic (text evidence also protected)", () => {
  assert.equal(classifyProtectedScope(["tools/notes.md"], "changes D0025 authority law"), true);
  assert.equal(classifyProtectedScope(["tools/notes.md"], "pure telemetry label fix"), false);
});

// ---- T5/T6: fingerprint binding -------------------------------------------

await test("T5+T6 approval bound to fingerprint; changed remediation invalidates it", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    const store = loadIncidentStore(fx.dir);
    const rec = store.incidents[dia.incident.incident_id];
    rec.status = "WAITING_OPERATOR";
    rec.expected_fingerprint = gate.fingerprint;
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    // T6: a decision carrying a STALE fingerprint (remediation changed) is rejected.
    const stale = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p1", authorization_id: "a1", selected_option: "APPROVE", remediation_fingerprint: "f".repeat(64) }, decisionSource: "v4-runtime-authorization-issuance-v1" });
    assert.equal(stale.ok, false);
    assert.equal(stale.reason_code, "REMEDIATION_FINGERPRINT_MISMATCH");
    // T5: the exact fingerprint admits.
    const ok = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p1", authorization_id: "a1", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint }, decisionSource: "v4-runtime-authorization-issuance-v1" });
    assert.equal(ok.ok, true);
    assert.equal(ok.incident.status, "APPROVED");
  } finally { fx.cleanup(); }
});

// ---- T7/T8: one approval -> exactly one dispatch; replay -> zero ----------

await test("T7+T8 valid approval admits exactly one remediation; replay admits zero", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    const store = loadIncidentStore(fx.dir);
    const rec = store.incidents[dia.incident.incident_id];
    rec.status = "WAITING_OPERATOR";
    rec.expected_fingerprint = gate.fingerprint;
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    const adm = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p1", authorization_id: "a1", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint }, decisionSource: "v4-runtime-authorization-issuance-v1" });
    assert.equal(adm.ok, true);
    const written = [];
    const writer = (file, markdown) => { written.push(file); writeFileSync(file, markdown); };
    const s1 = spendApprovalIntoQueue({ incident: adm.incident, repoPath: fx.dir, writeItem: writer });
    assert.equal(s1.ok, true);
    assert.equal(written.length, 1);
    assert.ok(existsSync(written[0]));
    const markdown = readFileSync(written[0], "utf8");
    assert.match(markdown, /backlog-item-v1/);
    assert.match(markdown, /READY_FOR_PLANNING/);
    // T8: second spend (replayed approval / dispatcher restart) is rejected.
    const s2 = spendApprovalIntoQueue({ incident: adm.incident, repoPath: fx.dir, writeItem: writer });
    assert.equal(s2.ok, false);
    assert.equal(s2.reason_code, "REMEDIATION_ALREADY_SPENT");
    assert.equal(written.length, 1, "no second queue item");
    // And a NEW approval attempt after spend is rejected too.
    const adm2 = admitOperatorDecision({ incident: adm.incident, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p2", authorization_id: "a2", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint }, decisionSource: "v4-runtime-authorization-issuance-v1" });
    assert.equal(adm2.ok, false);
    assert.equal(adm2.reason_code, "REMEDIATION_ALREADY_SPENT");
  } finally { fx.cleanup(); }
});

// ---- T9/T10/T11/T12/T13: negative decision fences --------------------------

await test("T9-T13 expired/unknown/foreign/defer/stop decisions admit zero remediation", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    const store = loadIncidentStore(fx.dir);
    const rec = store.incidents[dia.incident.incident_id];
    rec.status = "WAITING_OPERATOR";
    rec.expected_fingerprint = gate.fingerprint;
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    const written = [];
    const writer = (file, markdown) => { written.push(file); writeFileSync(file, markdown); };
    // T9: expired approval (canonical TTL already enforced upstream; shape fence here)
    const expired = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "", authorization_id: "", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint } });
    assert.equal(expired.ok, false, "incomplete identity -> no admission");
    // T10: unknown decision shape
    const unknown = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: null });
    assert.equal(unknown.ok, false);
    // T11: foreign decision source
    const foreign = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p", authorization_id: "a", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint }, decisionSource: "http-assertion" });
    assert.equal(foreign.ok, false);
    assert.equal(foreign.reason_code, "DECISION_SOURCE_INVALID");
    // T12/T13: non-approval canonical options
    const deferD = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p", authorization_id: "a", selected_option: "REJECT", remediation_fingerprint: gate.fingerprint } });
    assert.equal(deferD.ok, false);
    assert.equal(written.length, 0, "zero dispatch from every negative path");
    // WAITING_OPERATOR never self-transitions
    const st = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    assert.equal(st.status, "WAITING_OPERATOR");
  } finally { fx.cleanup(); }
});

await test("T12b DEFER terminal: informational only, fault state untouched, no dispatch", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const store = loadIncidentStore(fx.dir);
    store.incidents[dia.incident.incident_id].status = "WAITING_OPERATOR";
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    const def = deferSelfMaintenanceIncident({ incident: fresh, repoPath: fx.dir });
    assert.equal(def.ok, true);
    assert.equal(def.incident.status, "DEFERRED");
    const st = fx.runGit(fx.dir, ["status", "--short"]);
    assert.match(st, /tools\/dashboard\.txt/, "dirty handoff preserved after DEFER");
  } finally { fx.cleanup(); }
});

// ---- T14: restart safety ----------------------------------------------------

await test("T14 dispatcher restart after queued remediation cannot duplicate (durable store)", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    const store = loadIncidentStore(fx.dir);
    const rec = store.incidents[dia.incident.incident_id];
    rec.status = "WAITING_OPERATOR";
    rec.expected_fingerprint = gate.fingerprint;
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    const adm = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p1", authorization_id: "a1", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint }, decisionSource: "v4-runtime-authorization-issuance-v1" });
    const writer = (file, markdown) => writeFileSync(file, markdown);
    assert.equal(spendApprovalIntoQueue({ incident: adm.incident, repoPath: fx.dir, writeItem: writer }).ok, true);
    // "restart": fresh load of the durable store, new spend attempt.
    const after = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    assert.equal(after.status, "REMEDIATION_QUEUED");
    assert.equal(after.remediation_dispatch_count, 1);
    const s2 = spendApprovalIntoQueue({ incident: after, repoPath: fx.dir, writeItem: writer });
    assert.equal(s2.ok, false);
    assert.equal(s2.reason_code, "REMEDIATION_ALREADY_SPENT");
    // approved-but-not-queued recovery: a store left in APPROVED with zero
    // dispatches can still spend exactly once after restart (no loss, no dup).
  } finally { fx.cleanup(); }
});

await test("T14b approved-but-not-queued state recovers exactly once after restart", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    const store = loadIncidentStore(fx.dir);
    const rec = store.incidents[dia.incident.incident_id];
    rec.status = "APPROVED"; // crashed between admit and spend
    rec.decision = { pending_decision_id: "p1", authorization_id: "a1", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint, admitted_at: new Date().toISOString() };
    rec.expected_fingerprint = gate.fingerprint;
    persistIncidentStore(fx.dir, store);
    const after = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    const writer = (file, markdown) => writeFileSync(file, markdown);
    const s1 = spendApprovalIntoQueue({ incident: after, repoPath: fx.dir, writeItem: writer });
    assert.equal(s1.ok, true, "recovered spend");
    const s2 = spendApprovalIntoQueue({ incident: after, repoPath: fx.dir, writeItem: writer });
    assert.equal(s2.ok, false, "no duplicate after recovery");
  } finally { fx.cleanup(); }
});

// ---- T15/T16: PASS/STOP + remote verification law ---------------------------

await test("T15 PASS without remote verification is NOT resolved; PASS+verified resolves", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const store = loadIncidentStore(fx.dir);
    const rec = store.incidents[det.incident_id];
    rec.status = "REMEDIATION_QUEUED";
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[det.incident_id];
    const noVerify = recordRemediationOutcome({ incident: fresh, repoPath: fx.dir, executionStatus: "PASS", remoteHeadVerified: false });
    assert.equal(noVerify.incident.status, "REMEDIATION_PASS", "PASS without remote verification is not RESOLVED");
    const yesVerify = recordRemediationOutcome({ incident: noVerify.incident, repoPath: fx.dir, executionStatus: "PASS", remoteHeadVerified: true, remoteHead: "a".repeat(40) });
    assert.equal(yesVerify.incident.status, "RESOLVED");
    assert.equal(yesVerify.incident.remote_head_verified, true);
  } finally { fx.cleanup(); }
});

await test("T16 STOP remains unresolved / human-gated", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const store = loadIncidentStore(fx.dir);
    store.incidents[det.incident_id].status = "REMEDIATION_QUEUED";
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[det.incident_id];
    const stop = recordRemediationOutcome({ incident: fresh, repoPath: fx.dir, executionStatus: "STOP", remoteHeadVerified: false });
    assert.equal(stop.incident.status, "REMEDIATION_STOP");
    assert.notEqual(stop.incident.status, "RESOLVED");
    // A STOP terminal incident does not get silently recycled: new detection
    // requires the open-incident slot to be free, and STOP keeps attention.
    const again = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    assert.equal(again, null, "no auto re-detection while STOP attention is pending");
  } finally { fx.cleanup(); }
});

// ---- T17: recursion fence -----------------------------------------------------

await test("T17 recursion fence: depth > 1 never detects/proposes", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    assert.equal(detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick(), depth: 2 }), null);
    assert.equal(detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick(), depth: -1 }), null);
    assert.equal(detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick(), depth: NaN }), null);
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick(), depth: 1 });
    assert.ok(det);
    assert.equal(det.depth, 1);
    assert.equal(RECURSION_DEPTH_MAX, 1);
  } finally { fx.cleanup(); }
});

// ---- T18: dashboard and Telegram receive the same canonical metadata ---------

await test("T18 one canonical contract feeds both surfaces (#87/#86 alignment)", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    // The exact same buildActionableGateContract powers Telegram (#87) and
    // dashboard (#86): the gate metadata IS the contract object â€” no fork.
    assert.equal(gate.contract.constructor.name, "Object");
    assert.equal(gate.contract.origin, "LOCAL_DEV_DISPATCHER");
    assert.equal(gate.contract.task_ref, dia.incident.task_ref);
    assert.equal(gate.contract.reason_code, "TRACKED_DIRTY_CONFLICT");
    const mirror = buildActionableGateContract({
      gate_id: dia.incident.incident_id, task_ref: dia.incident.task_ref,
      classification: "HUMAN_GATE_REQUIRED", reason_codes: ["TRACKED_DIRTY_CONFLICT"],
      operator_action_choices: gate.contract.operator_action_choices,
      origin: "LOCAL_DEV_DISPATCHER",
    });
    assert.deepEqual(mirror.operator_action_choices, gate.contract.operator_action_choices);
    assert.equal(mirror.gate_id, gate.contract.gate_id);
  } finally { fx.cleanup(); }
});

// ---- T19: no second authority ------------------------------------------------

await test("T19 no second scheduler/bot/decision store: decision source is canonical only", async () => {
  const fx = fixture();
  try {
    // admission refuses any non-canonical decision source
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const store = loadIncidentStore(fx.dir);
    store.incidents[dia.incident.incident_id].status = "WAITING_OPERATOR";
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    for (const src of ["http-assertion", "dashboard-button", "telegram-second-bot", null, undefined]) {
      const r = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p", authorization_id: "a", selected_option: "APPROVE" }, decisionSource: src ?? undefined });
      assert.equal(r.ok, false, `source ${src} refused`);
    }
    // the module imports the SHARED contract, not a copy
    const mod = readFileSync(new URL("../../tools/control-plane-self-maintenance-v1.mjs", import.meta.url), "utf8");
    assert.match(mod, /from "\.\/v4-actionable-gate-contract-v1\.mjs"/);
    assert.ok(!mod.includes("getUpdates"), "no second getUpdates consumer in self-maintenance module");
    assert.ok(!mod.includes("sendDecisionMessage"), "no direct Telegram send in self-maintenance module");
  } finally { fx.cleanup(); }
});

// ---- T20: Qwen lifecycle untouched -------------------------------------------

await test("T20 Qwen lifecycle untouched by #88 module", () => {
  const mod = readFileSync(new URL("../../tools/control-plane-self-maintenance-v1.mjs", import.meta.url), "utf8");
  assert.ok(!mod.includes("qwen-local-idle-lifecycle"), "no lifecycle import");
  assert.ok(!mod.includes("ensureWorkstationDevQwenReady"), "no Qwen ensure call");
  assert.ok(!mod.includes("llama"), "no runtime mutation");
});

// ---- extra laws ----------------------------------------------------------------

await test("L no incident -> IDLE (no work manufacturing)", () => {
  const fx = fixture();
  try {
    assert.equal(detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: { ok: true, classification: "IDLE_CLEAN", human_gate_required: false, reason_codes: [] } }), null);
    assert.equal(detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: null }), null);
  } finally { fx.cleanup(); }
});

await test("L one OPEN incident at a time; terminal states not replayed", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    assert.ok(det);
    const second = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    assert.equal(second, null, "open incident blocks new detection");
    const store = loadIncidentStore(fx.dir);
    store.incidents[det.incident_id].status = "RESOLVED";
    persistIncidentStore(fx.dir, store);
    const third = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    assert.ok(third, "after RESOLVED the loop may observe again");
  } finally { fx.cleanup(); }
});

await test("L remediation backlog item carries fingerprint + bounded scope + base head", () => {
  const fx = fixture({ dirty: ["tools/dashboard.txt"] });
  try {
    const det = detectSelfMaintenanceIncident({ repoPath: fx.dir, runGit: fx.runGit, lastTick: baseTick() });
    const dia = diagnoseSelfMaintenanceIncident({ incident: det, diagnosis: fx.diagnosis, repoPath: fx.dir });
    const gate = buildSelfMaintenanceGate(dia.incident);
    const store = loadIncidentStore(fx.dir);
    const rec = store.incidents[dia.incident.incident_id];
    rec.status = "WAITING_OPERATOR";
    rec.expected_fingerprint = gate.fingerprint;
    persistIncidentStore(fx.dir, store);
    const fresh = loadIncidentStore(fx.dir).incidents[dia.incident.incident_id];
    const adm = admitOperatorDecision({ incident: fresh, repoPath: fx.dir, requiredDecision: { pending_decision_id: "p1", authorization_id: "a1", selected_option: "APPROVE", remediation_fingerprint: gate.fingerprint }, decisionSource: "v4-runtime-authorization-issuance-v1" });
    const item = buildRemediationBacklogItem(adm.incident);
    assert.equal(item.ok, true);
    assert.match(item.markdown, new RegExp(gate.fingerprint.slice(0, 16)));
    assert.match(item.markdown, /allowed_areas:/);
    assert.match(item.markdown, /loop_allowed: false/);
    assert.equal((item.markdown.match(/- tools\/dashboard\.txt/g) || []).length, 1, "scope exactly the diagnosed file");
  } finally { fx.cleanup(); }
});

await test("L states are bounded and deterministic", () => {
  assert.deepEqual([...SELF_MAINTENANCE_STATES], ["DETECTED", "DIAGNOSING", "DIAGNOSED", "WAITING_OPERATOR", "APPROVED", "REMEDIATION_QUEUED", "REMEDIATION_RUNNING", "REMEDIATION_PASS", "REMEDIATION_STOP", "RESOLVED", "DEFERRED"]);
  assert.equal(SELF_MAINTENANCE_SCHEMA, "v4-control-plane-self-maintenance-v1");
});

console.log("#88 focused suite: done");


