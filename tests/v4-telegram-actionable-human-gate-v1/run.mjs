#!/usr/bin/env node
/**
 * V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — focused offline tests (deterministic).
 *
 * Proves the canonical actionable-gate contract + WF90 normalization/build
 * logic + MODE A/B Telegram transport routing. No Telegram, no n8n, no network.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIONABLE_GATE_CONTRACT_SCHEMA,
  CANONICAL_GATE_CHOICES,
  buildActionableGateContract,
  actionableGateSignature,
  signCallbackValue,
  verifyCallbackValue,
} from "../../tools/v4-actionable-gate-contract-v1.mjs";
import {
  NORMALIZER_JSCODE,
  MESSAGE_BUILDER_JSCODE,
  MESSAGE_BUILDER_NODE,
  TELEGRAM_INFO_NODE,
  TELEGRAM_ACTIONABLE_NODE,
  IF_MODE_B_TELEGRAM_NODE,
  PERSIST_ALERT_STATE_NODE,
  TELEGRAM_TEXT_EXPR,
  MODE_B_ACTIONABLE_EXPR,
  MODE_B_BUTTON_TEXT_EXPRS,
  MODE_B_BUTTON_CALLBACK_EXPRS,
} from "../../tools/wf90-actionable-gate-nodes-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const ARTIFACT = join(ROOT, "workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json");
const DECIDE_NODE = "Code - Decide WF90 alert dedupe";

const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, pass: true }); process.stdout.write(`PASS ${name}\n`); }
  catch (err) { results.push({ name, pass: false }); process.stdout.write(`FAIL ${name}: ${err?.message || err}\n`); }
}

// ---------- canonical contract ----------
await test("contract-modeA-informational-no-choices", () => {
  const c = buildActionableGateContract({
    gate_id: "GATE-1", classification: "HUMAN_GATE_REQUIRED", reason_codes: ["TRACKED_DIRTY_CONFLICT"],
    gate_summary: "tracked dirty: 2 file(s)", origin: "LOCAL_DEV_DISPATCHER",
  });
  assert.equal(c.schema_version, ACTIONABLE_GATE_CONTRACT_SCHEMA);
  assert.equal(c.mode, "INFORMATIONAL");
  assert.deepEqual(c.operator_action_choices, []);
});

await test("contract-modeB-actionable-canonical-choices", () => {
  const c = buildActionableGateContract({
    gate_id: "GATE-2", classification: "HUMAN_GATE_REQUIRED", reason_codes: ["TEST"],
    operator_action_choices: ["APPROVE_AND_CONTINUE", "STOP", "DEFER"],
    operator_action_summary: "Confermi?", origin: "WF90_TICK",
  });
  assert.equal(c.mode, "ACTIONABLE");
  assert.deepEqual(c.operator_action_choices, CANONICAL_GATE_CHOICES);
  const sig = actionableGateSignature(c);
  assert.ok(JSON.parse(sig).choices.length === 3);
});

await test("contract-partial-or-unknown-choices-degrade-to-informational", () => {
  const c1 = buildActionableGateContract({ gate_id: "G3", classification: "HUMAN_GATE_REQUIRED", operator_action_choices: ["APPROVE_AND_CONTINUE", "MAGIC_FIX"] });
  assert.equal(c1.mode, "INFORMATIONAL");
  assert.deepEqual(c1.operator_action_choices, []);
  const c2 = buildActionableGateContract({ gate_id: "G4", classification: "HUMAN_GATE_REQUIRED", operator_action_choices: ["COMMIT", "DISCARD"] });
  assert.equal(c2.mode, "INFORMATIONAL");
});

await test("contract-invalid-evidence-returns-null", () => {
  assert.equal(buildActionableGateContract({ classification: "HUMAN_GATE_REQUIRED" }), null);
  assert.equal(buildActionableGateContract({ gate_id: "G5" }), null);
});

// ---------- callback value binding ----------
await test("callback-binding-sign-verify-roundtrip-and-tamper", () => {
  const secret = "test-secret";
  const v = signCallbackValue({ gateId: "GATE-9", choice: "APPROVE_AND_CONTINUE", secret, nowMs: 1_700_000_000_000 });
  const ok = verifyCallbackValue({ value: v, secret, maxAgeSec: 3600, nowMs: 1_700_000_000_000 + 1000 });
  assert.equal(ok.ok, true);
  assert.equal(ok.gate_id, "GATE-9");
  assert.equal(ok.choice, "APPROVE_AND_CONTINUE");
  const tampered = v.replace(":APPROVE_AND_CONTINUE:", ":STOP:");
  assert.equal(verifyCallbackValue({ value: tampered, secret, maxAgeSec: 3600, nowMs: 1_700_000_000_000 + 1000 }).ok, false);
  assert.equal(verifyCallbackValue({ value: v, secret: "other", maxAgeSec: 3600, nowMs: 1_700_000_000_000 + 1000 }).reason, "CALLBACK_TAG_INVALID");
  assert.equal(verifyCallbackValue({ value: "acp:something:else", secret }).reason, "CALLBACK_MALFORMED");
  assert.equal(verifyCallbackValue({ value: "ag:G9:MAGIC:123:deadbeef", secret }).reason, "CHOICE_UNKNOWN");
  assert.equal(verifyCallbackValue({ value: v, secret, maxAgeSec: 3600, nowMs: 1_700_000_000_000 + 7200_000 }).reason, "CALLBACK_EXPIRED");
});

// ---------- WF90 normalizer (additive gate metadata) ----------
const runNormalizer = (json) => {
  const fn = new Function("$input", "$", NORMALIZER_JSCODE);
  return fn({ item: { json } }, () => null).json;
};

await test("normalizer-preserves-existing-informational-shape", () => {
  const out = runNormalizer({ schema_version: "local-dev-dispatch-tick-result-v1", classification: "HUMAN_GATE_REQUIRED", execution_performed: false, human_gate_required: true, gate_summary: "tracked dirty: 2 file(s)", reason_codes: ["TRACKED_DIRTY_CONFLICT"] });
  assert.equal(out.human_gate_required, true);
  assert.equal(out.notify_required, true);
  assert.equal(out.telegram_text.includes("CONTROL PLANE - HUMAN ACTION REQUIRED"), true);
  assert.equal(out.actionable_gate, null); // no canonical choices -> informational
});

await test("normalizer-additive-actionable-metadata-modeB", () => {
  const out = runNormalizer({
    schema_version: "local-dev-dispatch-tick-result-v1", classification: "HUMAN_GATE_REQUIRED", execution_performed: false,
    human_gate_required: true, gate_summary: "qualification", reason_codes: ["QUALIFICATION"],
    operator_action_gate_id: "GATE-77", operator_action_summary: "Confermi la qualificazione?",
    operator_action_choices: ["APPROVE_AND_CONTINUE", "STOP", "DEFER"], operator_action_requires_confirmation: false,
  });
  assert.equal(out.actionable_gate.gate_id, "GATE-77");
  assert.deepEqual(out.actionable_gate.choices, CANONICAL_GATE_CHOICES);
  assert.equal(out.telegram_text.includes("HUMAN_GATE"), true); // underscores remain in informational text
});

await test("normalizer-rejects-non-canonical-choice-set-to-informational", () => {
  const out = runNormalizer({
    schema_version: "local-dev-dispatch-tick-result-v1", classification: "HUMAN_GATE_REQUIRED", execution_performed: false,
    human_gate_required: true, gate_summary: "dirty", reason_codes: ["TRACKED_DIRTY_CONFLICT"],
    operator_action_gate_id: "GATE-78", operator_action_choices: ["FIX", "DISCARD"],
  });
  assert.equal(out.actionable_gate, null);
});

await test("normalizer-service-error-still-not-actionable", () => {
  const out = runNormalizer({ schema_version: "local-dev-dispatch-tick-result-v1", classification: "SERVICE_ERROR", execution_performed: false, human_gate_required: false, reason_codes: ["X"] });
  assert.equal(out.classification, "SERVICE_ERROR");
  assert.equal(out.notify_required, true);
  assert.equal(out.actionable_gate, null);
});

// ---------- WF90 message builder ----------
const runBuilder = (normalized) => {
  const fn = new Function("$", MESSAGE_BUILDER_JSCODE);
  return fn((name) => (name === "Code - Normalize LOCAL_DEV tick result" ? { first: () => ({ json: normalized }) } : null)).json;
};

await test("builder-modeA-message-only-zero-buttons", () => {
  const out = runBuilder({ telegram_text: "CONTROL PLANE - HUMAN ACTION REQUIRED", classification: "HUMAN_GATE_REQUIRED", actionable_gate: null });
  assert.equal(out.actionable, false);
  assert.equal(out.reply_markup, null);
  assert.equal(out.telegram_text, "CONTROL PLANE - HUMAN ACTION REQUIRED");
});

await test("builder-modeB-exact-buttons-bound-to-gate", () => {
  const out = runBuilder({
    classification: "HUMAN_GATE_REQUIRED", task_ref: "TASK-1", reason_codes: ["QUALIFICATION"], gate_summary: "q",
    actionable_gate: { gate_id: "GATE-77", summary: "Confermi?", detail: null, choices: ["APPROVE_AND_CONTINUE", "STOP", "DEFER"], requires_confirmation: false, expires_at: "2026-09-16T15:00:00.000Z", callback_nonce: "n1", callback_tag: "t1" },
  });
  assert.equal(out.gate_id, "GATE-77");
  const buttons = out.reply_markup.inline_keyboard[0];
  assert.equal(buttons.length, 3);
  assert.deepEqual(buttons.map((b) => b.callback_data), ["ag:n1:APPROVE_AND_CONTINUE:t1", "ag:n1:STOP:t1", "ag:n1:DEFER:t1"]);
  assert.equal(out.telegram_text.includes("GATE-77"), true);
  assert.equal(out.telegram_text.includes("TEST") || out.telegram_text.includes("AZIONABILE"), true);
});

// ---------- WF90 artifact regression (MODE A/B transport + dedupe intact) ----------
const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8").replace(/^\uFEFF/, ""));
const infoNode = artifact.nodes.find((n) => n.name === TELEGRAM_INFO_NODE);
const actNode = artifact.nodes.find((n) => n.name === TELEGRAM_ACTIONABLE_NODE);
const modeBIf = artifact.nodes.find((n) => n.name === IF_MODE_B_TELEGRAM_NODE);
const persistNode = artifact.nodes.find((n) => n.name === PERSIST_ALERT_STATE_NODE);

await test("artifact-dedupe-node-unchanged-semantics", () => {
  const decideNode = artifact.nodes.find((n) => n.name === DECIDE_NODE);
  assert.ok(decideNode, "dedupe node present");
  assert.equal(decideNode.parameters.mode, "runOnceForAllItems");
  assert.ok(decideNode.parameters.jsCode.includes("wf90:active_alert_signature"));
  assert.ok(decideNode.parameters.jsCode.includes("UNCHANGED_ACTIONABLE_STATE"));
  assert.ok(decideNode.parameters.jsCode.includes("KEEP_EPISODE"));
});

await test("A MODE A routes informational Telegram with zero replyMarkup", () => {
  assert.ok(infoNode, "informational Telegram node present");
  assert.equal(infoNode.type, "n8n-nodes-base.telegram");
  assert.equal(infoNode.parameters.text, TELEGRAM_TEXT_EXPR);
  assert.equal(Object.prototype.hasOwnProperty.call(infoNode.parameters, "replyMarkup"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(infoNode.parameters, "inlineKeyboard"), false);
  assert.equal(artifact.connections[IF_MODE_B_TELEGRAM_NODE].main[1][0].node, TELEGRAM_INFO_NODE);
});

await test("B MODE B routes actionable Telegram with canonical 3 buttons", () => {
  assert.ok(actNode, "actionable Telegram node present");
  assert.equal(actNode.parameters.replyMarkup, "inlineKeyboard");
  const buttons = actNode.parameters.inlineKeyboard.rows[0].row.buttons;
  assert.equal(buttons.length, 3);
  assert.deepEqual(buttons.map((b) => b.text), [...MODE_B_BUTTON_TEXT_EXPRS]);
  assert.equal(artifact.connections[IF_MODE_B_TELEGRAM_NODE].main[0][0].node, TELEGRAM_ACTIONABLE_NODE);
});

await test("C MODE A never evaluates reply_markup.inline_keyboard expressions", () => {
  const infoJson = JSON.stringify(infoNode.parameters);
  assert.equal(infoJson.includes("reply_markup.inline_keyboard"), false);
  assert.equal(infoJson.includes("callback_data"), false);
});

await test("D MODE B callback_data expressions unchanged", () => {
  const buttons = actNode.parameters.inlineKeyboard.rows[0].row.buttons;
  assert.deepEqual(
    buttons.map((b) => b.additionalFields.callback_data),
    [...MODE_B_BUTTON_CALLBACK_EXPRS],
  );
});

await test("E both successful send paths persist alert state", () => {
  assert.equal(artifact.connections[TELEGRAM_INFO_NODE].main[0][0].node, PERSIST_ALERT_STATE_NODE);
  assert.equal(artifact.connections[TELEGRAM_ACTIONABLE_NODE].main[0][0].node, PERSIST_ALERT_STATE_NODE);
  assert.ok(persistNode);
  assert.ok(persistNode.parameters.columns.value.value.includes("alert_signature"));
});

await test("F Telegram error does not false-mark delivery success", () => {
  // No continueRegularOutput on Telegram: failure stops before Persist.
  assert.equal(infoNode.onError, undefined);
  assert.equal(actNode.onError, undefined);
  assert.equal(infoNode.alwaysOutputData, undefined);
  assert.equal(actNode.alwaysOutputData, undefined);
  // Persist remains only on successful Telegram main outputs (E).
  const persistIncoming = Object.entries(artifact.connections)
    .filter(([, c]) => (c.main || []).flat().some((edge) => edge.node === PERSIST_ALERT_STATE_NODE))
    .map(([name]) => name)
    .sort();
  assert.deepEqual(persistIncoming, [TELEGRAM_ACTIONABLE_NODE, TELEGRAM_INFO_NODE].sort());
});

await test("artifact-contains-message-builder-and-mode-b-if-synced", () => {
  const builder = artifact.nodes.find((n) => n.name === MESSAGE_BUILDER_NODE);
  assert.ok(builder, "message builder node present");
  assert.equal(builder.parameters.jsCode, MESSAGE_BUILDER_JSCODE);
  assert.ok(modeBIf);
  assert.equal(modeBIf.parameters.conditions.conditions[0].leftValue, MODE_B_ACTIONABLE_EXPR);
  assert.equal(modeBIf.parameters.conditions.conditions[0].operator.operation, "true");
  assert.equal(artifact.nodes.some((n) => n.name === "Telegram - LOCAL_DEV gate notification"), false);
});

await test("artifact-schedule-timeout-and-dedupe-invariants-preserved", () => {
  const sched = artifact.nodes.find((n) => n.name === "Schedule Trigger - LOCAL_DEV tick");
  assert.equal(sched.parameters.rule.interval[0].field, "minutes");
  assert.equal(sched.parameters.rule.interval[0].minutesInterval, 2);
  const http = artifact.nodes.find((n) => n.type === "n8n-nodes-base.httpRequest");
  assert.equal(http.parameters.options.timeout, 3900000);
  const names = new Set(artifact.nodes.map((n) => n.name));
  assert.ok(names.has("Data Table - Load WF90 active alert state"));
  assert.ok(names.has("Data Table - Persist WF90 active alert state"));
  assert.ok(names.has("Data Table - Clear WF90 active alert state"));
});

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;
console.log(JSON.stringify({ ok: failed === 0, passed, failed, total: results.length }));
process.exitCode = failed ? 1 : 0;
