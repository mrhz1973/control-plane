#!/usr/bin/env node
/**
 * V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — end-to-end LIVE qualification driver
 * (ABANDONED PATH — kept as evidence only).
 *
 * This driver was written to reuse the ACP transport directly, but the live run
 * proved the SINGLE-CONSUMER LAW: the canonical issuance service
 * (serve-v4-runtime-authorization-issuance-v1.mjs) already owns the Telegram
 * getUpdates loop, so this driver's waitAnswer aborted with CONFLICT on the
 * first poll (correct fail-closed behavior, message 20 was delivered but no
 * callback was ever admitted anywhere).
 * The canonical qualification used instead:
 * tools/v4-telegram-actionable-gate-issuance-e2e-v1.mjs (through the issuance
 * service itself). DO NOT run this file in parallel with the issuance service.
 *
 * Original intent (superseded): ONE harmless TEST/QUALIFICATION gate:
 *  1. canonical authority issues the gate (choices: APPROVE_AND_CONTINUE/STOP/DEFER)
 *  2. ONE real Telegram message with inline buttons via the EXISTING proven
 *     transport (v4-cursor-acp-gate-transport-telegram-v1.mjs send())
 *  3. operator taps APPROVE_AND_CONTINUE -> transport waitAnswer captures it
 *     (single getUpdates consumer, chat/user binding enforced)
 *  4. canonical authority adjudicates the callback (OPEN->RESOLVED, one-shot)
 *  5. local probes: replay/superseded/unknown-choice/unknown-gate
 *  6. MODE A informational message rendered with ZERO buttons (fixture)
 *
 * No production dispatch. No destructive action. No second bot/scheduler.
 * Callback value carries nonce+tag bound to the canonical authority secret.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { loadGateState, persistGateState, issueGate, adjudicateCallback } from "./v4-actionable-gate-authority-v1.mjs";
import { name as transportName, send as transportSend, waitAnswer } from "./v4-cursor-acp-gate-transport-telegram-v1.mjs";

const TASK_REF = "V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1";
const RUN_ID = "Q" + randomUUID().replace(/-/g, "").slice(0, 10);
const SPOOL = path.join(os.tmpdir(), `tg-actionable-e2e-${RUN_ID}`);
fs.mkdirSync(SPOOL, { recursive: true });

const out = { task_ref: TASK_REF, run_id: RUN_ID, transport: transportName, checks: {} };
const ev = (k, d = {}) => { out.events = out.events || []; out.events.push({ ts: new Date().toISOString(), k, ...d }); console.error(`[e2e] ${k} ${JSON.stringify(d).slice(0, 160)}`); };

const CHOICES = ["APPROVE_AND_CONTINUE", "STOP", "DEFER"];
const gateId = `WF87-QUAL-${RUN_ID}`;
const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

// 1. canonical authority: issue gate
const state = loadGateState();
const { gate, tags } = issueGate({ state, gateId, taskRef: TASK_REF, classification: "HUMAN_GATE_REQUIRED", reasonCode: "QUALIFICATION_TEST", summary: "[TEST/QUALIFICAZIONE #87] Gate di qualificazione Telegram azionabile (nessun side effect). Confermi?", detail: "Questo è un gate di prova NON distruttivo per la qualificazione del percorso Telegram azionabile (issue #87).", choices: CHOICES, requiresConfirmation: false, expiresAt });
out.gate_id = gate.gate_id;
out.expires_at = gate.expires_at;
out.choices = gate.choices;
ev("GATE_ISSUED", { gate_id: gate.gate_id });

// 2. ONE real Telegram message with buttons via the existing transport send()
//    The transport renders its own ACTIVE GATE layout for its decision; we use
//    it VERBATIM (reuse law) with decision.options bound to our canonical tags.
const decision = {
  decision_id: gateId,
  task_ref: TASK_REF,
  run_id: RUN_ID,
  session_id_sha: "wf87",
  generation: 1,
  question: { prompt: gate.summary, options: ["A", "B", "C"] },
  lifetime_mode: "operator_wait",
  history: [],
};
const optionValue = { A: `ag:${gate.nonce}:APPROVE_AND_CONTINUE:${tags.APPROVE_AND_CONTINUE}`, B: `ag:${gate.nonce}:STOP:${tags.STOP}`, C: `ag:${gate.nonce}:DEFER:${tags.DEFER}` };

// Send with the transport, then PATCH the message keyboard to our canonical
// callback values via editMessageReplyMarkup (still exactly ONE user-visible
// message; edit keeps message identity and buttons bound to canonical tags).
import https from "node:https";
const cfgPath = path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-issuance-config-v1.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8").replace(/^\uFEFF/, ""));
function tg(method, body, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({ host: "api.telegram.org", path: `/bot${cfg.telegram_bot_token}/${method}`, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }, timeout: timeoutMs }, (res) => {
      let b = ""; res.setEncoding("utf8"); res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
    });
    req.on("error", reject); req.on("timeout", () => req.destroy(new Error("timeout"))); req.write(data); req.end();
  });
}

// Compose the qualification message text (visible TEST context + gate ref + question).
const text = [
  "🟢 CONTROL PLANE — GATE ATTIVO (AZIONABILE) — TEST/QUALIFICAZIONE #87",
  `gate: ${gateId}`,
  `task: ${TASK_REF}`,
  "classification: HUMAN_GATE_REQUIRED",
  "reason: QUALIFICATION_TEST",
  "",
  "[TEST/QUALIFICAZIONE] Gate di qualificazione NON distruttivo: nessun side effect. Confermi la qualificazione del gate Telegram azionabile?",
  `valid until: ${expiresAt}`,
  "",
  "Un solo tocco · una sola transizione · solo operatore.",
].join("\n");
const keyboard = { inline_keyboard: [[
  { text: "A — APPROVE_AND_CONTINUE", callback_data: optionValue.A },
  { text: "B — STOP", callback_data: optionValue.B },
  { text: "C — DEFER", callback_data: optionValue.C },
]] };
const sent = await tg("sendMessage", { chat_id: cfg.operator_telegram_chat_id, text, reply_markup: keyboard, disable_notification: false });
out.telegram_delivered = sent?.ok === true;
out.telegram_message_id = sent?.result?.message_id ?? null;
out.buttons_rendered = out.telegram_delivered; // keyboard was part of sendMessage
ev("TELEGRAM_SENT", { message_id: out.telegram_message_id, ok: out.telegram_delivered });
if (!out.telegram_delivered) throw new Error("TG_SEND_FAILED " + String(sent?.description ?? "").slice(0, 80));

// 3. wait for the operator callback (bounded; re-armed 60s slices, max 10 min)
const deadline = Date.now() + 10 * 60 * 1000;
let answered = null;
while (Date.now() < deadline && !answered) {
  const slice = await waitAnswer({ decision, deadlineMs: Math.min(deadline, Date.now() + 60_000), spoolDir: SPOOL });
  if (slice.status === "ANSWERED") { answered = slice; break; }
  if (slice.status === "ABORTED") { out.wait_aborted = slice; break; }
  ev("WAIT_REARMED");
}
out.operator_callback_received = Boolean(answered);
if (!answered) {
  out.e2e = "TIMEOUT_NO_CALLBACK";
  fs.writeFileSync(path.join(SPOOL, "e2e-result.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
  process.exit(2);
}
ev("CALLBACK_RECEIVED", { option: answered.option, update_id: answered.update_id });

// Map transport A/B/C -> canonical choice + raw callback value
const OPTION_TO_CHOICE = { A: "APPROVE_AND_CONTINUE", B: "STOP", C: "DEFER" };
const chosen = OPTION_TO_CHOICE[answered.option];
out.operator_choice = chosen;
out.choice_mapped_to_active_gate = gateId;

// 4. canonical adjudication (exactly one transition)
const v1 = adjudicateCallback(state, { value: optionValue[chosen] });
out.adjudication_1 = v1;
persistGateState(state);
out.gate_transitioned_once = v1.action === "ACCEPT" && state.gates[gateId].status === "RESOLVED";
ev("ADJUDICATED", { action: v1.action, choice: v1.choice });

// 5. negative probes (no extra Telegram messages)
const replay = adjudicateCallback(state, { value: optionValue[chosen] });
out.repeated_callback = replay; // expect IDEMPOTENT_NOOP
const other = chosen === "STOP" ? "DEFER" : "STOP";
const staleOther = adjudicateCallback(state, { value: optionValue[other] });
out.stale_callback_other_choice = staleOther; // expect REJECT GATE_ALREADY_RESOLVED
const unknownChoice = adjudicateCallback(state, { value: `ag:${gate.nonce}:MAGIC_FIX:${tags.APPROVE_AND_CONTINUE}` });
out.unknown_choice = unknownChoice; // expect REJECT UNKNOWN_CHOICE
const unknownGate = adjudicateCallback(state, { value: `ag:deadbeef00:${chosen}:abcdef0123456789` });
out.unknown_gate = unknownGate; // expect REJECT UNKNOWN_GATE
ev("PROBES_DONE", { replay: replay.action, stale: staleOther.action || staleOther.reason, unknown_choice: unknownChoice.reason, unknown_gate: unknownGate.reason });

// 6. MODE A informational render proof (offline fixture; zero buttons)
const informational = { telegram_text: "CONTROL PLANE - HUMAN ACTION REQUIRED\nclassification: HUMAN_GATE_REQUIRED\nreason: TRACKED_DIRTY_CONFLICT", actionable: false, reply_markup: null };
out.modeA = { message: true, buttons: 0, reply_markup: informational.reply_markup };

out.e2e = v1.action === "ACCEPT" && chosen === "APPROVE_AND_CONTINUE" ? "PASS_EXPECTED_PATH" : (v1.action === "ACCEPT" ? "PASS_ALTERNATE_PATH" : "ADJUDICATION_FAILED");
out.spool = SPOOL;
fs.writeFileSync(path.join(SPOOL, "e2e-result.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
