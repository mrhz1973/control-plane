#!/usr/bin/env node
/** Focused deterministic regressions for final-real-proof guards. No network. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { verifyExactGateConsumption } from "../../tools/v4-cursor-acp-mcp-gate-final-proof-guards-v1.mjs";
import { send, deactivateCurrentKeyboard, loadActiveKeyboardRegistry } from "../../tools/v4-cursor-acp-gate-transport-telegram-v1.mjs";
import { reserveFinalProofSendBudget, settleFinalProofSendBudget } from "../../tools/v4-cursor-acp-gate-core-v1.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "acp-final-guards-"));
const registry = path.join(tmp, "active.json");
const cfg = { telegram_bot_token: "x".repeat(24), operator_telegram_chat_id: "100", operator_telegram_user_id: "200" };
const calls = [];
let nextMessage = 41;
const fixture = async (_token, method, body) => {
  calls.push({ method, body });
  if (method === "sendMessage") return { ok: true, result: { message_id: nextMessage++ } };
  if (method === "editMessageReplyMarkup") return { ok: true, result: true };
  return { ok: false };
};
const d = (id) => ({ decision_id: id, task_ref: "T", run_id: "R", session_id_sha: "abc", generation: 1, question: { prompt: "x", options: ["A", "B", "C"] } });

// Reservation happens before I/O and is never reopened after a failed send.
const budgetStore = { schema_version: "v4-cursor-acp-gate-store-v1", decisions: [] };
const firstBudget = reserveFinalProofSendBudget(budgetStore, { taskRef: "T", runId: "proof-1", scopeId: "proof-1" });
assert.equal(firstBudget.ok, true);
assert.equal(reserveFinalProofSendBudget(budgetStore, { taskRef: "T", runId: "proof-1", scopeId: "proof-1" }).reason, "FINAL_PROOF_SEND_BUDGET_EXHAUSTED");
settleFinalProofSendBudget(budgetStore, firstBudget.key, "SEND_FAILED");
assert.equal(reserveFinalProofSendBudget(budgetStore, { taskRef: "T", runId: "proof-1", scopeId: "proof-1" }).reason, "FINAL_PROOF_SEND_BUDGET_EXHAUSTED");

// Exact consumption: only the verified option and exact structured marker pass.
for (const [name, text, expected] of [
  ["A", 'GATE_CONSUMPTION_JSON:{"operator_decision_consumed":"A","continued_in_same_session":true}', true],
  ["B-counterexample", 'GATE_CONSUMPTION_JSON:{"operator_decision_consumed":"B","continued_in_same_session":true}', false],
  ["C-counterexample", 'GATE_CONSUMPTION_JSON:{"operator_decision_consumed":"C","continued_in_same_session":true}', false],
  ["text-counterexample", "I consumed A and continued_in_same_session=true", false],
]) assert.equal(verifyExactGateConsumption({ expectedOption: "A", transcript: text }).ok, expected, name);

// Cross-run registry deactivates only the prior registered keyboard, then the
// sole new message becomes active; current gate is deactivatable at terminal.
await send({ decision: d("old"), config: cfg, telegramCall: fixture, registryPath: registry });
await send({ decision: d("new"), config: cfg, telegramCall: fixture, registryPath: registry });
assert.deepEqual(calls.map((c) => c.method), ["sendMessage", "editMessageReplyMarkup", "sendMessage"]);
assert.equal(calls[1].body.message_id, 41);
assert.equal(loadActiveKeyboardRegistry(registry).registry.active.decision_id, "new");
assert.equal((await deactivateCurrentKeyboard({ decision: d("new"), config: cfg, telegramCall: fixture, registryPath: registry })).deactivated, true);
assert.equal(loadActiveKeyboardRegistry(registry).registry.active, null);

// Malformed registry authorizes neither an edit nor a new send.
fs.writeFileSync(registry, "{");
const before = calls.length;
await assert.rejects(() => send({ decision: d("blocked"), config: cfg, telegramCall: fixture, registryPath: registry }), /ACTIVE_KEYBOARD_REGISTRY_INVALID/);
assert.equal(calls.length, before);

console.log("FINAL_PROOF_GUARDS=PASS");
console.log("ONE_REAL_GATE_SEND_BUDGET=PASS");
console.log("EXACT_CONSUMPTION_FENCES=PASS");
console.log("CROSS_RUN_KEYBOARD_REGISTRY=PASS");
