#!/usr/bin/env node
/**
 * local-dev-terminal-notifier-v1 — bounded operator notification for terminal
 * PASS (+ reconciliation summaries) and deterministic STALL detection
 * (issues #109/#110). Dispatcher-side, deduplicated by a durable ledger:
 * one notification per stable key, ever — repeated ticks and restarts never
 * re-send. STOP/HUMAN_GATE/SERVICE_ERROR notifications stay with the
 * EXISTING WF90 path (unchanged): this module only ADDS the PASS gap and
 * the STALL sentinel; it is never a second bot surface (same single bot
 * token, same single chat id, read from the canonical user-local issuance
 * config — never persisted in the repo).
 *
 * False-positive law: STALL requires deterministic evidence only —
 * (a) an eligible READY exists and the same task_ref stayed selected-less
 *     for N consecutive idle ticks;
 * (b) a phase stayed active beyond its executor timebox;
 * (c) WF90 tick freshness exceeded the threshold;
 * (d) the dispatcher endpoint was unreachable for K consecutive probes
 *     (probed by the sentinel runner, not by this module).
 * Legitimate IDLE (no eligible READY) and Qwen intentional autostop are
 * explicitly NOT stalls.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

export const NOTIFIER_MODULE_VERSION = "local-dev-terminal-notifier-v1";
export const NOTIFY_LEDGER_SCHEMA = "local-dev-terminal-notify-ledger-v1";
export const NOTIFY_LEDGER_MAX = 500;

function ledgerPath() {
  const base = typeof process.env?.LOCALAPPDATA === "string" && process.env.LOCALAPPDATA.trim()
    ? join(process.env.LOCALAPPDATA, "ControlPlane", "runtime")
    : join(homedir() || ".", ".control-plane-runtime");
  return join(base, "terminal-notify-ledger.json");
}

/** Load the durable notification ledger (missing → fresh; malformed → throw
 * fail-closed: the caller skips sending rather than risking spam). */
export function loadNotifyLedger(path = ledgerPath()) {
  if (!existsSync(path)) return { schema_version: NOTIFY_LEDGER_SCHEMA, sent: [] };
  const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
    || parsed.schema_version !== NOTIFY_LEDGER_SCHEMA || !Array.isArray(parsed.sent)) {
    const err = new Error("NOTIFY_LEDGER_INVALID");
    err.code = "NOTIFY_LEDGER_INVALID";
    throw err;
  }
  return parsed;
}

export function saveNotifyLedgerAtomic(ledger, path = ledgerPath()) {
  if (!ledger || ledger.schema_version !== NOTIFY_LEDGER_SCHEMA || !Array.isArray(ledger.sent)) {
    const err = new Error("NOTIFY_LEDGER_INVALID");
    err.code = "NOTIFY_LEDGER_INVALID";
    throw err;
  }
  const trimmed = ledger.sent.slice(-NOTIFY_LEDGER_MAX);
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.notify-${process.pid}-${Date.now()}.tmp`);
  try {
    writeFileSync(tmp, `${JSON.stringify({ schema_version: NOTIFY_LEDGER_SCHEMA, sent: trimmed }, null, 2)}\n`, "utf8");
    renameSync(tmp, path);
  } catch (err) {
    try { unlinkSync(tmp); } catch { /* best-effort */ }
    throw err;
  }
  return true;
}

export function alreadySent(ledger, key) {
  return ledger.sent.some((e) => e && e.key === String(key));
}

export function markSent(ledger, key, nowIso) {
  ledger.sent.push({ key: String(key), sent_at: nowIso || new Date().toISOString() });
  return ledger;
}

/** Load the Telegram transport config from the canonical user-local
 * issuance config (same single bot, same operator chat). Never logs or
 * returns the token in results. */
export function loadTelegramTransportConfig(configPath) {
  let obj;
  try {
    obj = JSON.parse(readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return { ok: false, reason: "TELEGRAM_CONFIG_UNREADABLE" };
  }
  const token = typeof obj?.telegram_bot_token === "string" ? obj.telegram_bot_token : "";
  const chatId = typeof obj?.operator_telegram_chat_id === "string" ? obj.operator_telegram_chat_id : "";
  if (!token || !chatId) return { ok: false, reason: "TELEGRAM_CONFIG_INCOMPLETE" };
  return { ok: true, token, chatId };
}

/** Send one Telegram message (HTML-escaped plain text). Never throws: any
 * failure returns { ok:false, reason } so a notification outage can never
 * fail the dispatch tick. */
export async function sendTelegramMessage({ token, chatId, text, fetchImpl = globalThis.fetch, timeoutMs = 10_000 }) {
  if (!token || !chatId || typeof text !== "string" || !text.trim()) {
    return { ok: false, reason: "SEND_INPUT_INVALID" };
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 3800), parse_mode: "HTML", disable_web_page_preview: true }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: `TELEGRAM_HTTP_${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `TELEGRAM_SEND_FAILED:${String(err?.name || err?.message || err).slice(0, 60)}` };
  } finally {
    clearTimeout(timer);
  }
}

/** Deduplicated dispatch of a batch of notification requests. Pure ledger
 * mutation + bounded side effects; deterministic and restart-safe.
 * Each request may carry { recordKey, flag }: when present and the send is
 * CONFIRMED, onConfirm(recordKey, flag) is invoked so the caller's durable
 * reconciliation record marks the notification as sent only after success
 * (send failure leaves the request retryable on the next observation). */
export async function dispatchNotifications({ requests, ledger, transport, nowIso, fetchImpl, saveLedger, onConfirm }) {
  const results = [];
  if (!Array.isArray(requests) || !requests.length) return { ok: true, results };
  for (const req of requests) {
    const key = String(req?.key || "");
    if (!key || !req?.text) continue;
    if (alreadySent(ledger, key)) {
      results.push({ key, sent: false, reason: "ALREADY_SENT" });
      if (typeof onConfirm === "function" && req.recordKey && req.flag) {
        try { onConfirm(req.recordKey, req.flag); } catch { /* bounded */ }
      }
      continue;
    }
    let send = { ok: false, reason: "TRANSPORT_UNAVAILABLE" };
    if (transport && transport.ok) {
      send = await sendTelegramMessage({ token: transport.token, chatId: transport.chatId, text: req.text, fetchImpl: fetchImpl || globalThis.fetch });
    }
    if (send.ok) {
      markSent(ledger, key, nowIso);
      results.push({ key, sent: true });
      if (typeof onConfirm === "function" && req.recordKey && req.flag) {
        try { onConfirm(req.recordKey, req.flag); } catch { /* bounded */ }
      }
    } else {
      results.push({ key, sent: false, reason: send.reason });
    }
  }
  if (typeof saveLedger === "function") saveLedger(ledger);
  return { ok: true, results };
}

/* ------------------------------------------------------------------ */
/* STALL sentinel (deterministic, no false positives on legit idle)     */
/* ------------------------------------------------------------------ */

export const STALL_RULES = Object.freeze({
  // (a) eligible READY unchanged without claim across N consecutive ticks
  eligible_ready_no_claim_ticks: 5,
  // (b) active phase beyond executor timebox margin
  active_phase_overrun_factor: 1.5,
  // (c) WF90 freshness beyond this multiple of the interval
  wf90_stale_factor: 3,
});

/** Evaluate stall from the current tick snapshot. Pure.
 * snapshot: { queueEligibleCount, candidateTaskRef, lastTickClassification,
 *             active, phase, wf90IntervalSeconds, lastTickAt, nowIso,
 *             executorTimeboxSeconds, tickHistory: [{at, candidateTaskRef, classification}] }
 */
export function evaluateStall(snapshot, rules = STALL_RULES) {
  if (!snapshot || typeof snapshot !== "object") return { stalled: false };
  const nowMs = Date.parse(snapshot.nowIso || "");
  // (a) eligible READY stuck: needs >= N consecutive IDLE_CLEAN ticks with
  // the SAME non-null candidate and no claim. Legitimate idle (candidate
  // null or CLAIM_ALREADY_EXISTS-driven) never trips this.
  const history = Array.isArray(snapshot.tickHistory) ? snapshot.tickHistory : [];
  const n = Number(rules.eligible_ready_no_claim_ticks);
  if (snapshot.queueEligibleCount > 0 && snapshot.candidateTaskRef && history.length >= n) {
    const window = history.slice(-n);
    const allIdleNoClaim = window.every((t) => t && t.classification === "IDLE_CLEAN" && t.candidateTaskRef === snapshot.candidateTaskRef && !t.claimed);
    if (allIdleNoClaim) {
      return {
        stalled: true,
        reason: "ELIGIBLE_READY_NO_CLAIM",
        detail: `candidate ${snapshot.candidateTaskRef} eligible and unchanged across ${n} idle ticks`,
        task_ref: snapshot.candidateTaskRef,
      };
    }
  }
  // (c) WF90 freshness: only when the dispatcher itself is NOT executing
  // (a long legitimate execution can span several WF90 intervals because
  // single-flight answers BUSY — that is not a stall).
  if (snapshot.active !== true && Number.isFinite(nowMs)) {
    const lastTickMs = Date.parse(snapshot.lastTickAt || "");
    const intervalMs = (Number(snapshot.wf90IntervalSeconds) || 120) * 1000;
    if (Number.isFinite(lastTickMs) && nowMs - lastTickMs > intervalMs * Number(rules.wf90_stale_factor)) {
      return { stalled: true, reason: "WF90_TICK_STALE", detail: `last tick ${snapshot.lastTickAt} exceeds ${rules.wf90_stale_factor}x interval`, task_ref: null };
    }
  }
  // (b) phase overrun: active phase beyond timebox margin.
  if (snapshot.active === true && Number.isFinite(nowMs) && Number.isFinite(Number(snapshot.executorTimeboxSeconds))) {
    const startedMs = Date.parse(snapshot.activeSince || "");
    if (Number.isFinite(startedMs) && nowMs - startedMs > Number(snapshot.executorTimeboxSeconds) * 1000 * Number(rules.active_phase_overrun_factor)) {
      return { stalled: true, reason: "ACTIVE_PHASE_OVERRUN", detail: `phase ${snapshot.phase || "?"} beyond timebox`, task_ref: snapshot.taskRef || null };
    }
  }
  return { stalled: false };
}

const isCli = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("tools/local-dev-terminal-notifier-v1.mjs");
if (isCli) {
  process.stdout.write(`${NOTIFIER_MODULE_VERSION} — library module (dispatcher-side; PASS notify + STALL sentinel)\n`);
  process.exit(0);
}
