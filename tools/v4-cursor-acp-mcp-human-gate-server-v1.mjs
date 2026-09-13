#!/usr/bin/env node
/**
 * V4 Cursor ACP MCP human-gate server v1 — ADAPTER ONLY.
 *
 * Exposes exactly ONE MCP tool (human_gate) over stdio JSON-RPC (newline-
 * delimited). The canonical Control Plane gate law lives exclusively in
 * tools/v4-cursor-acp-gate-core-v1.mjs (single decision authority); this
 * server only: validates schema → registers → notifies via the injected
 * transport → admits the transport-verified callback through the gate law →
 * returns the decision. It CANNOT self-authorize and has NO default answer.
 *
 * Transport is injected via env (no credentials here, ever):
 *   ACP_GATE_TRANSPORT_MODULE  absolute path of a transport module exporting
 *                              { name, send({decision}), waitAnswer({decision, deadlineMs}) }
 *   ACP_GATE_STORE_PATH        user-local gate store path (canonical by default)
 *   ACP_GATE_SPOOL_DIR         session spool dir (driver writes binding.json)
 *   ACP_GATE_TTL_MS            explicit bounded TTL (clamped to [1s, 1h], default 15m)
 *
 * Fail closed: missing binding, invalid schema, unknown transport, transport
 * no-answer, or any fence rejection → no answer is ever invented.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  validateHumanGateInput,
  registerGateDecision,
  markNotified,
  admitGateCallback,
  markReturned,
  markNoAnswer,
  loadGateStore,
  persistGateStore,
  reserveFinalProofSendBudget,
  settleFinalProofSendBudget,
  gateStorePath,
  MAX_TTL_MS,
  DEFAULT_TTL_MS,
} from "./v4-cursor-acp-gate-core-v1.mjs";

const SPOOL_DIR = process.env.ACP_GATE_SPOOL_DIR || null;
const TRANSPORT_MODULE = process.env.ACP_GATE_TRANSPORT_MODULE || null;
const TOOL_NAME = "human_gate";

function writeSpoolMarker(name, payload) {
  if (!SPOOL_DIR) return;
  try {
    fs.mkdirSync(SPOOL_DIR, { recursive: true });
    fs.writeFileSync(path.join(SPOOL_DIR, name), JSON.stringify({ ...payload, pid: process.pid, at: new Date().toISOString() }, null, 2));
  } catch { /* fail closed later at binding read */ }
}

/** Trusted session binding written by the ACP driver (never by the model). */
function readBinding() {
  if (!SPOOL_DIR) return null;
  try {
    const b = JSON.parse(fs.readFileSync(path.join(SPOOL_DIR, "binding.json"), "utf8"));
    if (typeof b.session_id !== "string" || !b.session_id || typeof b.session_id_sha !== "string") return null;
    return b;
  } catch {
    return null;
  }
}

let transportPromise = null;
async function getTransport() {
  if (!TRANSPORT_MODULE) return null;
  if (!transportPromise) {
    transportPromise = import(pathToFileURL(TRANSPORT_MODULE).href).then((m) => {
      if (typeof m.send !== "function" || typeof m.waitAnswer !== "function" || typeof m.name !== "string") {
        throw new Error("TRANSPORT_MODULE_INVALID");
      }
      return m;
    }).catch((e) => { transportPromise = null; throw e; });
  }
  return transportPromise;
}

/**
 * The one tool. Adapter-only flow; every state mutation goes through the
 * canonical gate-core law. Store is reloaded before each mutation.
 */
async function humanGate(args) {
  const v = validateHumanGateInput(args);
  if (!v.ok) return { status: "error", reason: "SCHEMA_INVALID", fields: v.errors };

  const binding = readBinding();
  if (!binding) return { status: "error", reason: "SESSION_BINDING_MISSING" };

  const transport = await getTransport();
  if (!transport) return { status: "error", reason: "TRANSPORT_UNAVAILABLE" };

  const storePath = gateStorePath();
  const ttlMs = Math.min(Math.max(Number(process.env.ACP_GATE_TTL_MS) || DEFAULT_TTL_MS, 1000), MAX_TTL_MS);

  let store = loadGateStore(storePath);
  // This is opt-in and is set only by the final-real-proof driver. Reserve
  // before registering/sending so concurrent/repeated tool calls cannot emit
  // more than one keyboard for that proof run.
  const proofScope = process.env.ACP_GATE_FINAL_PROOF_SCOPE || null;
  let sendBudgetKey = null;
  if (proofScope) {
    const reservation = reserveFinalProofSendBudget(store, {
      taskRef: args.task_ref, runId: args.run_id, scopeId: proofScope,
    });
    persistGateStore(store, storePath);
    if (!reservation.ok) return { status: "error", reason: reservation.reason };
    sendBudgetKey = reservation.key;
  }
  const decision = registerGateDecision(store, {
    taskRef: args.task_ref,
    runId: args.run_id,
    sessionId: binding.session_id,
    generation: args.generation,
    question: { prompt: args.question.prompt, options: args.question.options },
    ttlMs,
  });
  persistGateStore(store, storePath);

  let sent;
  try {
    sent = await transport.send({ decision, spoolDir: SPOOL_DIR });
  } catch (e) {
    store = loadGateStore(storePath);
    if (sendBudgetKey) settleFinalProofSendBudget(store, sendBudgetKey, "SEND_FAILED");
    markNoAnswer(store, decision.decision_id);
    persistGateStore(store, storePath);
    return { status: "error", reason: "TRANSPORT_SEND_FAILED", detail: String(e.message || e).slice(0, 120), decision_id: decision.decision_id };
  }

  store = loadGateStore(storePath);
  if (sendBudgetKey) settleFinalProofSendBudget(store, sendBudgetKey, "SENT");
  const notified = markNotified(store, decision.decision_id, { transport: transport.name, messageId: sent?.messageId ?? null });
  if (!notified.ok) {
    persistGateStore(store, storePath);
    return { status: "error", reason: notified.reason, decision_id: decision.decision_id };
  }
  persistGateStore(store, storePath);

  const deadline = Date.now() + ttlMs;
  let wait = null;
  try {
    wait = await transport.waitAnswer({ decision: notified.decision, deadlineMs: deadline, spoolDir: SPOOL_DIR });
  } catch (e) {
    // never swallow: an exception in the wait path is an explicit no_answer
    // with sanitized reason, not a silent continue.
    store = loadGateStore(storePath);
    markNoAnswer(store, decision.decision_id);
    persistGateStore(store, storePath);
    return { status: "no_answer", decision_id: decision.decision_id, reason: "TRANSPORT_WAIT_EXCEPTION", detail: String(e?.message ?? e).slice(0, 80) };
  }

  // Hardened contract: {status: ANSWERED|TIMEOUT|ABORTED, ...}
  if (!wait || wait.status !== "ANSWERED" || wait.update_id === undefined) {
    const reason = !wait ? "TRANSPORT_WAIT_NULL" : wait.status === "ABORTED" ? `TRANSPORT_ABORTED_${wait.class}` : "TRANSPORT_TIMEOUT";
    store = loadGateStore(storePath);
    markNoAnswer(store, decision.decision_id);
    persistGateStore(store, storePath);
    return { status: "no_answer", decision_id: decision.decision_id, reason };
  }
  const answer = { decision_id: decision.decision_id, option: wait.option, update_id: wait.update_id };

  store = loadGateStore(storePath);
  const admitted = admitGateCallback(store, answer, {
    taskRef: args.task_ref,
    sessionId: binding.session_id,
    generation: args.generation,
  });
  persistGateStore(store, storePath);
  if (!admitted.ok) return { status: "error", reason: admitted.reason, decision_id: decision.decision_id };

  store = loadGateStore(storePath);
  const returned = markReturned(store, decision.decision_id);
  persistGateStore(store, storePath);
  if (!returned.ok) return { status: "error", reason: returned.reason, decision_id: decision.decision_id };

  // Option ONLY from the verified decision — never invented, never defaulted.
  return { status: "answered", option: admitted.decision.selected_option, decision_id: decision.decision_id };
}

const INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["task_ref", "run_id", "generation", "question"],
  properties: {
    task_ref: { type: "string", minLength: 1, maxLength: 128, description: "Canonical task reference the gate is for" },
    run_id: { type: "string", minLength: 1, maxLength: 64, description: "Run identifier of this bounded attempt" },
    generation: { type: "integer", minimum: 1, description: "Gate generation counter (callback fence)" },
    question: {
      type: "object",
      additionalProperties: false,
      required: ["prompt", "options"],
      properties: {
        prompt: { type: "string", minLength: 1, maxLength: 2000 },
        options: { type: "array", items: { type: "string", enum: ["A", "B", "C"] }, minItems: 3, maxItems: 3 },
      },
    },
  },
};

// ---------- minimal stdio JSON-RPC ----------
let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i);
    buf = buf.slice(i + 1);
    if (line.trim()) handleLine(line);
  }
});
process.stdin.on("end", () => process.exit(0));

function write(msg) { process.stdout.write(JSON.stringify(msg) + "\n"); }

async function handleLine(line) {
  let m;
  try { m = JSON.parse(line); } catch { return; }
  const { id, method, params } = m;
  if (method === "initialize") {
    write({ jsonrpc: "2.0", id, result: {
      protocolVersion: params?.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "v4-cursor-acp-human-gate", version: "v1" },
    } });
    writeSpoolMarker("server-initialized.marker", { server: "v4-cursor-acp-human-gate" });
    return;
  }
  if (method === "ping") { write({ jsonrpc: "2.0", id, result: {} }); return; }
  if (method === "tools/list") {
    write({ jsonrpc: "2.0", id, result: { tools: [{
      name: TOOL_NAME,
      description: "Ask the human operator a material A/B/C decision through the canonical Control Plane gate (Telegram). Blocks until the verified operator callback or TTL. No default answer.",
      inputSchema: INPUT_SCHEMA,
    }] } });
    return;
  }
  if (method === "tools/call") {
    if (params?.name !== TOOL_NAME) {
      write({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ status: "error", reason: "UNKNOWN_TOOL" }) }], isError: true } });
      return;
    }
    const out = await humanGate(params?.arguments ?? {});
    const isError = out.status === "error";
    write({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(out) }], isError } });
    return;
  }
  if (method?.startsWith("notifications/")) return; // notifications: no response
  if (id !== undefined) write({ jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } });
}

writeSpoolMarker("server-started.marker", { server: "v4-cursor-acp-human-gate", transport_module: TRANSPORT_MODULE ? path.basename(TRANSPORT_MODULE) : null });
