#!/usr/bin/env node
/**
 * V4 Cursor ACP gate transport — REAL Telegram v2 (hardened).
 *
 * Canonical credential path: the existing user-local issuance config
 * (%LOCALAPPDATA%\control-plane\v4-runtime-authorization-issuance-config-v1.json).
 * The bot token is loaded in-memory only — never logged, never persisted,
 * never echoed. Operator chat/user binding from the same config is enforced
 * on every callback. Exactly one sendMessage per gate decision (the adapter
 * enforces the send budget; this transport performs exactly one send per
 * send() call and polls getUpdates until the bounded deadline).
 *
 * SINGLE-CONSUMER LAW: getUpdates Conflicts (HTTP 409 "terminated by other
 * getUpdates request") are FATAL to the wait — never polled through. A
 * competing consumer must be quiesced BEFORE the gate window; this transport
 * surfaces the conflict instead of silently racing for callbacks.
 *
 * OBSERVABILITY LAW: every observed update and every poll error is reported
 * through a sanitized observe sink (update_id, decision match, binding match,
 * option). No tokens, no chat contents, no raw ids (masked tails only).
 * Rejections always carry an explicit sanitized reason.
 *
 * Exports the transport contract consumed by the MCP human-gate server:
 *   { name, send({decision, spoolDir}), waitAnswer({decision, deadlineMs, observe?}) }
 * plus pure testable helpers:
 *   processUpdate({ update, decision, chatOk, userOk })
 *   classifyPollError(errOrRes)
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { createHash } from "node:crypto";

export const name = "telegram-canonical-v2";

const TG_API_HOST = "api.telegram.org";
// Decision ids carry a lowercase-hex digest (gate-core sha12) — the id group
// MUST accept lowercase. Options remain strict uppercase A/B/C.
const CALLBACK_RE = /^acp:([A-Za-z0-9-]+):([ABC])$/;

function loadConfig() {
  const p = path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-issuance-config-v1.json");
  const cfg = JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
  if (typeof cfg.telegram_bot_token !== "string" || cfg.telegram_bot_token.length < 20) {
    throw new Error("TELEGRAM_CONFIG_INVALID");
  }
  return cfg;
}

function tgCall(token, method, body, timeoutMs = 35000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      host: TG_API_HOST,
      path: `/bot${token}/${method}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: timeoutMs,
    }, (res) => {
      let buf = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        try { resolve(JSON.parse(buf)); } catch { reject(new Error("TG_RESPONSE_INVALID")); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("TG_TIMEOUT")));
    req.write(data);
    req.end();
  });
}

function sha12(s) {
  return createHash("sha256").update(String(s)).digest("hex").slice(0, 12);
}

/** Classify a getUpdates failure. CONFLICT/AUTH are fatal; others retryable. */
export function classifyPollError(errOrRes) {
  const text = String(errOrRes?.description ?? errOrRes?.message ?? "").toLowerCase();
  if (text.includes("conflict") || text.includes("terminated by other getupdates")) return "CONFLICT";
  if (text.includes("401") || text.includes("unauthorized")) return "AUTH";
  if (text.includes("timeout") || errOrRes?.code === "ECONNRESET" || errOrRes?.code === "ECONNREFUSED" || errOrRes?.code === "ETIMEDOUT" || errOrRes?.code === "ENOTFOUND") return "NETWORK";
  return "TRANSIENT";
}

/**
 * PURE decision for one Telegram update. Deterministic and unit-testable.
 * Returns { action: "ACCEPT", option, update_id } or { action: "SKIP", reason, update_id }.
 * No I/O, no network, no secrets.
 */
export function processUpdate({ update, decision, chatOk, userOk }) {
  const u = update ?? {};
  const updateId = u.update_id;
  const cq = u.callback_query;
  if (!cq) return { action: "SKIP", reason: "NOT_CALLBACK_QUERY", update_id: updateId };
  const m = CALLBACK_RE.exec(String(cq.data ?? ""));
  if (!m) return { action: "SKIP", reason: "FOREIGN_CALLBACK_DATA", update_id: updateId };
  if (m[1] !== decision.decision_id) return { action: "SKIP", reason: "DECISION_MISMATCH", update_id: updateId };
  const chatMatch = String(cq.message?.chat?.id) === String(chatOk);
  const userMatch = String(cq.from?.id) === String(userOk);
  if (!chatMatch) return { action: "SKIP", reason: "OPERATOR_CHAT_MISMATCH", update_id: updateId };
  if (!userMatch) return { action: "SKIP", reason: "OPERATOR_USER_MISMATCH", update_id: updateId };
  if (!["A", "B", "C"].includes(m[2])) return { action: "SKIP", reason: "OPTION_INVALID", update_id: updateId };
  return { action: "ACCEPT", option: m[2], update_id: updateId };
}

function maskTail(v) {
  const s = String(v ?? "");
  return s.length > 4 ? "***" + s.slice(-4) : "***";
}

export async function send({ decision, spoolDir }) {
  const cfg = loadConfig();
  // Deactivate inline keyboards of previous gate messages recorded in the
  // store (bounded, best-effort) so exactly ONE message ever shows live
  // buttons — stale-button taps become impossible.
  let deactivatedStale = 0;
  try {
    const storePath = spoolDir ? path.join(spoolDir, "gate-store.json") : null;
    if (storePath && fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
      const stale = (store.decisions ?? [])
        .filter((d) => d.state === "NOTIFIED" && d.telegram_message_id && d.decision_id !== decision.decision_id)
        .slice(-10);
      for (const d of stale) {
        try {
          await tgCall(cfg.telegram_bot_token, "editMessageReplyMarkup", {
            chat_id: cfg.operator_telegram_chat_id,
            message_id: d.telegram_message_id,
            reply_markup: { inline_keyboard: [] },
          }, 10000);
          deactivatedStale++;
        } catch { /* best effort per-message */ }
      }
    }
  } catch { /* best effort overall */ }
  const text = [
    `🟢 ACTIVE GATE — ${decision.decision_id}`,
    `(i messaggi precedenti sono SCADUTI${deactivatedStale ? ` — ${deactivatedStale} disattivati` : ""}: premi SOLO qui)`,
    `task: ${decision.task_ref}`,
    `run: ${String(decision.run_id).slice(0, 8)}… · session: ${decision.session_id_sha} · gen: ${decision.generation}`,
    `emesso: ${new Date().toISOString()}`,
    "",
    decision.question.prompt,
    "",
    "A = APPROVE_AND_CONTINUE · B = STOP · C = DEFER",
    "One tap only · one-shot · operator-only · TTL bounded.",
  ].join("\n");
  const keyboard = {
    inline_keyboard: [
      [
        { text: "A — APPROVE_AND_CONTINUE", callback_data: `acp:${decision.decision_id}:A` },
        { text: "B — STOP", callback_data: `acp:${decision.decision_id}:B` },
        { text: "C — DEFER", callback_data: `acp:${decision.decision_id}:C` },
      ],
    ],
  };
  const res = await tgCall(cfg.telegram_bot_token, "sendMessage", {
    chat_id: cfg.operator_telegram_chat_id,
    text,
    reply_markup: keyboard,
    disable_notification: false,
  });
  if (res?.ok !== true || !res.result?.message_id) {
    throw new Error("TG_SEND_FAILED: " + String(res?.description ?? "unknown").slice(0, 80));
  }
  return { messageId: res.result.message_id };
}

/**
 * Poll getUpdates until the bounded deadline. Single-consumer law enforced:
 * a 409 Conflict aborts immediately (never races). Offset advances only for
 * updates fully processed (observed + classified). Default observe sink:
 * sanitized single-line records appended to <spoolDir>/tg-observe.log (the
 * spool dir is shared with the driver, which cannot see MCP stderr) plus
 * console.error.
 */
export async function waitAnswer({ decision, deadlineMs, spoolDir, observe, getUpdatesOverride, binding }) {
  const cfg = loadConfig();
  // binding override is TEST-ONLY (deterministic fixtures). The production
  // MCP adapter never passes it, so the canonical config binding is enforced.
  const chatOk = String(binding?.chatId ?? cfg.operator_telegram_chat_id);
  const userOk = String(binding?.userId ?? cfg.operator_telegram_user_id);
  const logPath = spoolDir ? path.join(spoolDir, "tg-observe.log") : null;
  const onEvent = typeof observe === "function"
    ? observe
    : (e) => {
      const line = `${new Date().toISOString()} ${e.kind} ${JSON.stringify(e.data ?? {})}`;
      console.error(`[tg] ${line}`);
      try { if (logPath) fs.appendFileSync(logPath, line + "\n"); } catch { /* logging must never break the wait */ }
    };
  let offset = 0;
  let consecutiveTransient = 0;

  // getUpdatesOverride is test-only injection (deterministic fixtures);
  // production always uses the real tgCall path.
  const poll = getUpdatesOverride
    ? (offsetValue) => getUpdatesOverride({ offset: offsetValue })
    : (offsetValue) => tgCall(cfg.telegram_bot_token, "getUpdates", {
        offset: offsetValue,
        timeout: 25,
        allowed_updates: ["callback_query"],
      });

  while (Date.now() < deadlineMs - 2000) {
    let res = null;
    let netErr = null;
    try {
      res = await poll(offset);
    } catch (e) {
      netErr = e;
    }
    if (netErr) {
      const kind = classifyPollError(netErr);
      onEvent({ kind: "POLL_ERROR", data: { class: kind } });
      if (kind === "CONFLICT" || kind === "AUTH") {
        onEvent({ kind: "WAIT_ABORTED", data: { class: kind } });
        return { status: "ABORTED", class: kind, updates_seen: offset };
      }
      // NETWORK/TRANSIENT: bounded retry with small backoff; deadline governs.
      consecutiveTransient++;
      if (consecutiveTransient > 20) {
        onEvent({ kind: "WAIT_ABORTED", data: { class: "TRANSIENT_EXHAUSTED" } });
        return { status: "ABORTED", class: "TRANSIENT_EXHAUSTED", updates_seen: offset };
      }
      await new Promise((r) => setTimeout(r, Math.min(1000 * consecutiveTransient, 4000)));
      continue;
    }
    if (res?.ok !== true || !Array.isArray(res.result)) {
      const kind = classifyPollError(res ?? {});
      onEvent({ kind: "POLL_ERROR", data: { class: kind, description: String(res?.description ?? "").slice(0, 80) } });
      if (kind === "CONFLICT" || kind === "AUTH") {
        onEvent({ kind: "WAIT_ABORTED", data: { class: kind } });
        return { status: "ABORTED", class: kind, updates_seen: offset };
      }
      consecutiveTransient++;
      if (consecutiveTransient > 20) {
        onEvent({ kind: "WAIT_ABORTED", data: { class: "TRANSIENT_EXHAUSTED" } });
        return { status: "ABORTED", class: "TRANSIENT_EXHAUSTED", updates_seen: offset };
      }
      await new Promise((r) => setTimeout(r, Math.min(1000 * consecutiveTransient, 4000)));
      continue;
    }
    consecutiveTransient = 0;
    for (const u of res.result) {
      offset = u.update_id + 1; // advance BEFORE processing: never re-see
      const verdict = processUpdate({ update: u, decision, chatOk, userOk });
      onEvent({
        kind: verdict.action === "ACCEPT" ? "CALLBACK_ACCEPTED" : "UPDATE_SKIPPED",
        data: {
          update_id: verdict.update_id,
          reason: verdict.reason ?? null,
          option: verdict.option ?? null,
          decision: verdict.action === "ACCEPT" ? decision.decision_id : null,
        },
      });
      if (verdict.action === "ACCEPT") {
        // ack best-effort; failure to ack must NOT lose the callback.
        try { await tgCall(cfg.telegram_bot_token, "answerCallbackQuery", { callback_query_id: u.callback_query.id }); } catch (e) {
          onEvent({ kind: "ACK_FAILED", data: { class: classifyPollError(e) } });
        }
        return { status: "ANSWERED", option: verdict.option, update_id: verdict.update_id, updates_seen: offset };
      }
    }
  }
  return { status: "TIMEOUT", class: "DEADLINE", updates_seen: offset };
}
