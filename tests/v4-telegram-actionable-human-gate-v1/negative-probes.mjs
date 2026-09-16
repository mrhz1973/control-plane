#!/usr/bin/env node
/**
 * Negative probes (offline, canonical module functions, no network/no store
 * mutation of live entries): duplicate update reuse + unknown pending + TTL.
 * Uses a THROWAWAY store copy; live store untouched.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  handleTelegramDecisionUpdate,
  createPendingStoreMutationMutex,
} from "../../tools/v4-runtime-authorization-issuance-v1.mjs";

const cfg = JSON.parse(fs.readFileSync(process.env.LOCALAPPDATA + "\\control-plane\\v4-runtime-authorization-issuance-config-v1.json", "utf8").replace(/^\uFEFF/, ""));
const live = JSON.parse(fs.readFileSync(cfg.pending_store_path, "utf8"));
const tmpStore = path.join(os.tmpdir(), `wf87-negprobe-${Date.now()}.json`);
fs.writeFileSync(tmpStore, JSON.stringify(live, null, 2));

const config = { ...cfg, pending_store_path: tmpStore };
const mutex = createPendingStoreMutationMutex();
const opts = { config, pendingStorePath: tmpStore, mutationMutex: mutex, loadRegistry: null, issueActiveEntry: undefined, now: new Date() };

// Find the ISSUED qualification decision
const d = live.decisions.find((x) => x.pending_decision_id === "WF87-QUAL-6b4fc0c9439c");
const results = {};

// 1. Replay the SAME consumed update -> must reject (already consumed).
const replayUpdate = { update_id: Number(d.telegram_update_id), callback_query: { id: "probe-ack-1", data: `ra:${d.pending_decision_id}:approve`, from: { id: Number(cfg.operator_telegram_user_id) }, message: { chat: { id: Number(cfg.operator_telegram_chat_id) } } } };
const r1 = await handleTelegramDecisionUpdate(replayUpdate, opts);
results.replayed_callback = { ok: r1.ok === true, classification: r1.classification, reason_codes: r1.reason_codes };

// 2. Unknown pending id -> NOT_FOUND.
const unknownUpdate = { update_id: Number(d.telegram_update_id) + 5000, callback_query: { id: "probe-ack-2", data: "ra:WF87-UNKNOWN-xxx:approve", from: { id: Number(cfg.operator_telegram_user_id) }, message: { chat: { id: Number(cfg.operator_telegram_chat_id) } } } };
const r2 = await handleTelegramDecisionUpdate(unknownUpdate, opts);
results.unknown_gate = { ok: r2.ok === true, classification: r2.classification, reason_codes: r2.reason_codes };

// 3. Unknown choice (namespace ok, option invalid) -> UPDATE_INVALID.
const badChoice = { update_id: Number(d.telegram_update_id) + 5001, callback_query: { id: "probe-ack-3", data: `ra:${d.pending_decision_id}:magic_fix`, from: { id: Number(cfg.operator_telegram_user_id) }, message: { chat: { id: Number(cfg.operator_telegram_chat_id) } } } };
const r3 = await handleTelegramDecisionUpdate(badChoice, opts);
results.unknown_choice = { ok: r3.ok === true, classification: r3.classification, reason_codes: r3.reason_codes };

// 4. Foreign operator -> IDENTITY_MISMATCH.
const foreign = { update_id: Number(d.telegram_update_id) + 5002, callback_query: { id: "probe-ack-4", data: `ra:${d.pending_decision_id}:approve`, from: { id: 999999 }, message: { chat: { id: Number(cfg.operator_telegram_chat_id) } } } };
const r4 = await handleTelegramDecisionUpdate(foreign, opts);
results.foreign_operator = { ok: r4.ok === true, classification: r4.classification, reason_codes: r4.reason_codes };

results.store_untouched_by_rejects = JSON.parse(fs.readFileSync(tmpStore, "utf8")).decisions.find((x) => x.pending_decision_id === "WF87-QUAL-6b4fc0c9439c").state === "ISSUED";
fs.unlinkSync(tmpStore);
console.log(JSON.stringify(results, null, 1));
