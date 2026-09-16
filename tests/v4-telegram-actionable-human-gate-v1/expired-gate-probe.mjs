#!/usr/bin/env node
/**
 * Stale/expired gate probe (canonical, offline): a callback arriving for a
 * PENDING decision whose pending_expires_at has elapsed must be REJECTED
 * with ISSUANCE_EXPIRED, with no state mutation. Uses a throwaway store.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { handleTelegramDecisionUpdate, createPendingStoreMutationMutex } from "../../tools/v4-runtime-authorization-issuance-v1.mjs";

const cfg = JSON.parse(fs.readFileSync(process.env.LOCALAPPDATA + "\\control-plane\\v4-runtime-authorization-issuance-config-v1.json", "utf8").replace(/^\uFEFF/, ""));
const live = JSON.parse(fs.readFileSync(cfg.pending_store_path, "utf8"));
// Clone the qualification decision as still-PENDING but expired in the past.
const d = JSON.parse(JSON.stringify(live.decisions.find((x) => x.pending_decision_id === "WF87-QUAL-6b4fc0c9439c")));
d.state = "PENDING";
d.pending_expires_at = new Date(Date.now() - 60_000).toISOString();
d.decision_at = null; d.selected_option = null; d.telegram_update_id = null; d.telegram_chat_id = null; d.telegram_user_id = null; d.authorization_expires_at = null; d.issued_at = null;
const store = { schema_version: live.schema_version, decisions: [...live.decisions.filter((x) => x.pending_decision_id !== "WF87-QUAL-6b4fc0c9439c"), d] };
const tmpStore = path.join(os.tmpdir(), `wf87-expired-${Date.now()}.json`);
fs.writeFileSync(tmpStore, JSON.stringify(store, null, 2));
const config = { ...cfg, pending_store_path: tmpStore };
const opts = { config, pendingStorePath: tmpStore, mutationMutex: createPendingStoreMutationMutex(), loadRegistry: null };

const update = { update_id: 9_999_001, callback_query: { id: "probe-expired", data: `ra:${d.pending_decision_id}:approve`, from: { id: Number(cfg.operator_telegram_user_id) }, message: { chat: { id: Number(cfg.operator_telegram_chat_id) } } } };
const r = await handleTelegramDecisionUpdate(update, opts);
const after = JSON.parse(fs.readFileSync(tmpStore, "utf8")).decisions.find((x) => x.pending_decision_id === d.pending_decision_id);
console.log(JSON.stringify({
  expired_callback: { ok: r.ok === true, classification: r.classification, reason_codes: r.reason_codes },
  state_after: after.state,
  no_mutation: after.state === "PENDING" && after.selected_option === null,
}, null, 1));
fs.unlinkSync(tmpStore);
