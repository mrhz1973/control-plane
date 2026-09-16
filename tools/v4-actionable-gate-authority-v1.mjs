#!/usr/bin/env node
/**
 * V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — canonical answer endpoint.
 *
 * The dispatcher (ONE decision authority) exposes a bounded, localhost-only,
 * read-safe POST endpoint that VALIDATES an actionable-gate callback against
 * the CURRENT canonical gate evidence and records the operator answer in the
 * canonical receipts store. Security model:
 *  - binds only to 127.0.0.1 (operator taps travel via the MCP transport on
 *    the workstation, which is the ONLY getUpdates consumer);
 *  - callback value must carry gate_id + choice + dispatcher nonce + hmac tag
 *    (constant-time compare); unknown choice/gate/expired/resolved -> REJECT;
 *  - one-shot per gate (resolved gate replays -> IDEMPOTENT_NOOP);
 *  - no destructive action is executed here; the answer is only RECORDED and
 *    surfaced via /v1/diagnostics + the next tick result (governed path).
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const HOST = "127.0.0.1";
export const ANSWER_PORT = Number(process.env.WF87_ANSWER_PORT) || 18794;
export const ANSWER_PATH = "/v1/actionable-gate/answer";
const STATE_REL = "reports/runtime/dev-queue/always-on/wf87-actionable-gate-state.json";

function statePath() {
  const repo = process.env.CP_REPO_PATH || process.cwd();
  return path.join(repo, STATE_REL);
}

export function loadGateState(p = statePath()) {
  try {
    const s = JSON.parse(fs.readFileSync(p, "utf8"));
    if (s.schema_version !== "v4-actionable-gate-state-v1") throw new Error("schema");
    return s;
  } catch {
    return { schema_version: "v4-actionable-gate-state-v1", secret: null, gates: {} };
  }
}

export function persistGateState(state, p = statePath()) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, p);
}

function tag({ nonce, gateId, choice, secret }) {
  return createHmac("sha256", secret).update(`${nonce}|${gateId}|${choice}`).digest("hex").slice(0, 16);
}

/** Issue a fresh actionable gate (TEST/QUALIFICATION or real). Returns callback tags per choice. */
export function issueGate({ state, gateId, taskRef, classification, reasonCode, summary, detail, choices, requiresConfirmation = false, expiresAt = null, nowMs = Date.now() }) {
  if (!state.secret) state.secret = randomBytes(24).toString("hex");
  const nonce = randomBytes(8).toString("hex");
  const gates = state.gates;
  for (const [id, g] of Object.entries(gates)) {
    if (g.status === "OPEN") {
      g.status = "SUPERSEDED";
      g.superseded_by = gateId;
      g.superseded_at = new Date(nowMs).toISOString();
    }
  }
  const gate = {
    gate_id: String(gateId).slice(0, 120),
    task_ref: taskRef ?? null,
    classification: String(classification || "HUMAN_GATE_REQUIRED").slice(0, 120),
    reason_code: reasonCode ?? null,
    summary: summary ?? null,
    detail: detail ?? null,
    choices: [...choices],
    requires_confirmation: requiresConfirmation === true,
    expires_at: expiresAt,
    nonce,
    status: "OPEN",
    created_at: new Date(nowMs).toISOString(),
    answer: null,
    callbacks_seen: 0,
  };
  gates[gate.gate_id] = gate;
  return { gate, tags: Object.fromEntries(gate.choices.map((c) => [c, tag({ nonce, gateId: gate.gate_id, choice: c, secret: state.secret })])) };
}

/**
 * PURE callback adjudication. Deterministic, offline-testable.
 * REJECT reasons: MALFORMED, UNKNOWN_CHOICE, UNKNOWN_GATE, NOT_OPEN (superseded),
 * TAG_INVALID, EXPIRED. IDEMPOTENT_NOOP for an already-resolved identical tap.
 */
export function adjudicateCallback(state, { value }) {
  const parts = String(value ?? "").split(":");
  if (parts.length !== 4 || parts[0] !== "ag") return { action: "REJECT", reason: "MALFORMED" };
  const [, nonce, choice, tagIn] = parts;
  const gate = Object.values(state.gates || {}).find((g) => g.nonce === nonce);
  if (!gate) return { action: "REJECT", reason: "UNKNOWN_GATE" };
  if (!gate.choices.includes(choice)) return { action: "REJECT", reason: "UNKNOWN_CHOICE" };
  if (gate.status === "RESOLVED") {
    return gate.answer?.choice === choice
      ? { action: "IDEMPOTENT_NOOP", gate_id: gate.gate_id, choice }
      : { action: "REJECT", reason: "GATE_ALREADY_RESOLVED" };
  }
  if (gate.status !== "OPEN") return { action: "REJECT", reason: "GATE_NOT_OPEN" };
  if (gate.expires_at && Date.now() >= Date.parse(gate.expires_at)) {
    gate.status = "EXPIRED";
    return { action: "REJECT", reason: "GATE_EXPIRED", gate_id: gate.gate_id };
  }
  const expected = tag({ nonce, gateId: gate.gate_id, choice, secret: state.secret });
  const a = Buffer.from(String(tagIn));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { action: "REJECT", reason: "TAG_INVALID", gate_id: gate.gate_id };
  // ACCEPT: exactly one transition OPEN -> RESOLVED.
  gate.status = "RESOLVED";
  gate.answer = { choice, at: new Date().toISOString() };
  gate.callbacks_seen += 1;
  return { action: "ACCEPT", gate_id: gate.gate_id, choice, requires_confirmation: gate.requires_confirmation };
}

/** Start the localhost-only answer server. Returns { server, url } */
export function startAnswerServer({ state, nowMs = Date.now() } = {}) {
  const server = http.createServer((req, res) => {
    const reply = (code, payload) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    };
    if (req.method !== "POST" || !String(req.url).startsWith(ANSWER_PATH)) return reply(404, { ok: false, reason: "NOT_FOUND" });
    let buf = "";
    req.on("data", (c) => { buf += c; if (buf.length > 4096) req.destroy(); });
    req.on("end", () => {
      let body = {};
      try { body = JSON.parse(buf || "{}"); } catch { return reply(400, { ok: false, reason: "MALFORMED" }); }
      const verdict = adjudicateCallback(state, { value: body.callback_value });
      persistGateState(state);
      if (verdict.action === "ACCEPT") {
        return reply(200, {
          ok: true, result: "ACCEPTED", gate_id: verdict.gate_id, choice: verdict.choice,
          requires_confirmation: verdict.requires_confirmation,
          note: "Answer recorded by the canonical dispatcher gate authority.",
        });
      }
      if (verdict.action === "IDEMPOTENT_NOOP") {
        return reply(200, { ok: true, result: "IDEMPOTENT_NOOP", gate_id: verdict.gate_id, choice: verdict.choice, note: "Gate scaduto o già risolto — nessuna azione eseguita." });
      }
      return reply(403, { ok: false, result: "REJECTED", reason: verdict.reason });
    });
  });
  return new Promise((resolvePromise) => {
    server.listen(ANSWER_PORT, HOST, () => resolvePromise({ server, url: `http://${HOST}:${ANSWER_PORT}${ANSWER_PATH}` }));
  });
}
