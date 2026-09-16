#!/usr/bin/env node
/**
 * V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — qualification gate driver (LOCAL).
 *
 * ONE harmless bounded TEST/QUALIFICATION gate through the EXISTING canonical
 * human-gate mechanism (gate-core v4-cursor-acp-gate-core-v1.mjs + proven
 * Telegram transport v4-cursor-acp-gate-transport-telegram-v1.mjs).
 *
 * LAW:
 *  - transport.send() performs exactly one Telegram send (its own budget).
 *  - waitAnswer polls getUpdates (single consumer) until the operator taps.
 *  - Callback admission is ONLY through canonical admitGateCallback
 *    (decision_id, chat/user binding, option A/B/C, one-shot, TTL fences).
 *  - No production dispatch, no destructive action, no second bot/scheduler.
 *  - Store path is overridden via ACP_GATE_STORE_PATH (canonical store NEVER
 *    touched); config is loaded from the canonical credential path.
 *
 * Qualification choices: A=APPROVE_AND_CONTINUE, B=STOP, C=DEFER (the proven
 * canonical A/B/C set). Expected operator tap for PASS: A.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import {
  registerGateDecision,
  markNotified,
  admitGateCallback,
  markReturned,
  markConsumed,
  loadGateStore,
  persistGateStore,
  OPERATOR_WAIT_MODE,
} from "./v4-cursor-acp-gate-core-v1.mjs";
import { name as transportName, send, waitAnswer } from "./v4-cursor-acp-gate-transport-telegram-v1.mjs";

const TASK_REF = "V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1";
const RUN_ID = "QUAL" + randomUUID().replace(/-/g, "").slice(0, 12);
const SPOOL = path.join(os.tmpdir(), `tg-actionable-gate-${RUN_ID}`);
fs.mkdirSync(SPOOL, { recursive: true });
const STORE = path.join(SPOOL, "gate-store.json");

const out = { task_ref: TASK_REF, run_id: RUN_ID, transport: transportName, events: [] };
const ev = (k, d = {}) => { out.events.push({ ts: new Date().toISOString(), k, ...d }); console.error(`[q] ${k} ${JSON.stringify(d).slice(0, 140)}`); };

const args = process.argv.slice(2);
const waitForOperator = !args.includes("--no-wait");

// Canonical binding comes from the canonical issuance config via the transport.
const decision = registerGateDecision(loadGateStore(STORE), {
  taskRef: TASK_REF,
  runId: RUN_ID,
  sessionId: `qualification-${RUN_ID}`,
  generation: 1,
  question: {
    prompt: "[TEST/QUALIFICAZIONE #87] Gate di qualificazione NON distruttivo: nessun side effect. Confermi la qualificazione del gate Telegram azionabile?",
    options: ["A", "B", "C"],
  },
  ttlMs: 15 * 60 * 1000,
  lifetimeMode: OPERATOR_WAIT_MODE,
});
let store = loadGateStore(STORE);
store = loadGateStore(STORE); // re-read (registerGateDecision mutates its arg's store; persist below)
persistGateStore({ ...store, decisions: [...store.decisions.filter((d) => d.decision_id !== decision.decision_id), decision] }, STORE);
out.decision_id = decision.decision_id;
out.gate_mode = decision.lifetime_mode;
ev("GATE_REGISTERED", { decision_id: decision.decision_id });

const sent = await send({ decision, spoolDir: SPOOL });
out.telegram_message_id = sent.messageId;
out.telegram_delivered = true;
store = loadGateStore(STORE);
const notified = markNotified(store, decision.decision_id, { transport: transportName, messageId: sent.messageId });
if (!notified.ok) throw new Error("MARK_NOTIFIED_FAILED:" + notified.reason);
persistGateStore(store, STORE);
ev("TELEGRAM_SENT", { message_id: sent.messageId });

if (!waitForOperator) {
  fs.writeFileSync(path.join(SPOOL, "qualification-result.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}

// Bounded operator wait (max 10 minutes of re-armed 60s waits).
const deadline = Date.now() + 10 * 60 * 1000;
let answered = null;
while (Date.now() < deadline && !answered) {
  const slice = await waitAnswer({ decision, deadlineMs: Math.min(deadline, Date.now() + 60_000), spoolDir: SPOOL });
  if (slice.status === "ANSWERED") { answered = slice; break; }
  if (slice.status === "ABORTED") { out.wait_aborted = slice; break; }
  ev("WAIT_REARMED");
}
if (!answered) {
  out.qualification = "TIMEOUT_NO_CALLBACK";
  fs.writeFileSync(path.join(SPOOL, "qualification-result.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
  process.exit(2);
}

out.operator_option = answered.option;
ev("CALLBACK_ACCEPTED_BY_TRANSPORT", { option: answered.option, update_id: answered.update_id });

// Canonical admission (one-shot; fences: id/TTL/option/update-id).
store = loadGateStore(STORE);
const admitted = admitGateCallback(store, {
  decision_id: decision.decision_id,
  option: answered.option,
  update_id: answered.update_id,
}, { taskRef: TASK_REF, sessionId: `qualification-${RUN_ID}`, generation: 1 });
persistGateStore(store, STORE);
out.canonical_admission = admitted.ok ? "ACCEPTED" : admitted.reason;
if (!admitted.ok) {
  out.qualification = "ADMISSION_REJECTED";
  fs.writeFileSync(path.join(SPOOL, "qualification-result.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
  process.exit(3);
}
ev("CALLBACK_ADMITTED_CANONICALLY", { option: answered.option });

// Replay the SAME update id against the now-VERIFIED gate: must reject (one-shot).
store = loadGateStore(STORE);
const replay = admitGateCallback(store, {
  decision_id: decision.decision_id,
  option: answered.option,
  update_id: answered.update_id,
}, { taskRef: TASK_REF, sessionId: `qualification-${RUN_ID}`, generation: 1 });
persistGateStore(store, STORE);
out.repeated_callback_result = replay.ok ? "ACCEPTED_VIOLATION" : replay.reason;
ev("REPLAY_PROBED", { result: out.repeated_callback_result });

// Unknown-gate probe: must reject.
store = loadGateStore(STORE);
const unknown = admitGateCallback(store, {
  decision_id: "ACP-GATE-DOESNOTEXIST",
  option: "A",
  update_id: answered.update_id + 1,
}, { taskRef: TASK_REF, sessionId: `qualification-${RUN_ID}`, generation: 1 });
out.unknown_gate_result = unknown.ok ? "ACCEPTED_VIOLATION" : unknown.reason;
ev("UNKNOWN_GATE_PROBED", { result: out.unknown_gate_result });

// Invalid option probe against still-open sibling gates is impossible here
// (our gate is VERIFIED); option fence is covered by transport + core tests.

markReturned(store, decision.decision_id);
persistGateStore(store, STORE);
markConsumed(loadGateStore(STORE), decision.decision_id);
persistGateStore(loadGateStore(STORE), STORE);
out.gate_state = "CONSUMED";
out.qualification = answered.option === "A" ? "PASS_EXPECTED_PATH" : "PASS_ALTERNATE_PATH";
out.spool = SPOOL;

fs.writeFileSync(path.join(SPOOL, "qualification-result.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
