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
 * The one GATE-CREATING tool — watchdog-safe (V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1):
 * registers the decision, sends the ONE Telegram ACTIVE GATE and returns
 * PENDING immediately. NO long wait happens inside this tool invocation
 * (vendor ACP runtime erroring tool calls at ~60s — RETRY3 evidence). The
 * canonical gate store remains the sole authority; the decision is retrieved
 * later via human_gate_status short bounded polls (each well under the
 * watchdog budget). PENDING is NOT a decision — never consumable as one.
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

  // Watchdog-safe: return PENDING (non-decision) instead of blocking. The
  // MCP server itself keeps polling getUpdates in the background (persistent
  // operator wait: re-armed bounded waits, NO wall-clock auto-termination)
  // so the canonical callback admission happens even if the model polls
  // late; verified results are consumed via human_gate_status.
  startBackgroundWait(notified.decision, { taskRef: args.task_ref, sessionId: binding.session_id, generation: args.generation });
  return {
    status: "PENDING",
    decision_id: decision.decision_id,
    lifetime_mode: notified.decision.lifetime_mode,
    note: "Human gate is pending the operator's Telegram decision. Poll human_gate_status with this decision_id. PENDING is NOT a decision. The gate does NOT auto-expire while waiting for the operator.",
  };
}

const STATUS_POLL_SLICE_MS = Math.min(Number(process.env.ACP_GATE_STATUS_POLL_SLICE_MS) || 8000, 20000); // bounded slice << watchdog
// PERSISTENT OPERATOR WAIT: bounded re-arm window for each transport wait
// (long-poll server-side); the human wait lives across many re-arms, never
// inside a single tool call. 10 minutes default, capped at 1h.
const OPERATOR_WAIT_REARM_MS = Math.min(Number(process.env.ACP_GATE_OPERATOR_WAIT_REARM_MS) || 10 * 60 * 1000, 60 * 60 * 1000);
const OPERATOR_WAIT = "operator_wait"; // mirrors gate-core OPERATOR_WAIT_MODE

/**
 * Watchdog-safe read-only status poll: ONE bounded short slice (< watchdog)
 * that NEVER authorizes, never invents an answer, never creates gates, never
 * sends. It reads only canonical gate-store state (already admitted by the
 * gate law) and reports PENDING or the VERIFIED/RETURNED option.
 *
 * Lifetime law (PERSISTENT_OPERATOR_WAIT): on lifetime_mode="operator_wait"
 * the elapsed time is NEVER reported as terminal — no NO_ANSWER/EXPIRED from
 * wall-clock alone. Terminal statuses are only CANCELLED / SUPERSEDED
 * (explicit, persisted events) or legacy bounded_ttl expiry.
 */
async function humanGateStatus(args) {
  if (!args || typeof args !== "object" || typeof args.decision_id !== "string" || !args.decision_id) {
    return { status: "error", reason: "SCHEMA_INVALID", fields: ["decision_id"] };
  }
  const binding = readBinding();
  if (!binding) return { status: "error", reason: "SESSION_BINDING_MISSING" };

  const storePath = gateStorePath();
  const sliceDeadline = Date.now() + STATUS_POLL_SLICE_MS;
  while (Date.now() < sliceDeadline) {
    const store = loadGateStore(storePath);
    const d = store.decisions.find((x) => x.decision_id === args.decision_id);
    if (!d) return { status: "error", reason: "DECISION_UNKNOWN", decision_id: args.decision_id };
    if (d.task_ref !== args.task_ref || d.generation !== Number(args.generation)) {
      return { status: "error", reason: "DECISION_BINDING_MISMATCH", decision_id: args.decision_id };
    }
    if (d.state === "RETURNED" || d.state === "VERIFIED") {
      return { status: "answered", option: d.selected_option, decision_id: d.decision_id };
    }
    // EXPLICIT terminal events only. Elapsed wall-clock time alone is NOT a
    // terminal condition on the operator-wait path (expires_at is null there).
    if (d.state === "CANCELLED") return { status: "no_answer", decision_id: d.decision_id, reason: "GATE_CANCELLED" };
    if (d.state === "SUPERSEDED") return { status: "no_answer", decision_id: d.decision_id, reason: "GATE_SUPERSEDED" };
    if (d.state === "NO_ANSWER" || d.state === "EXPIRED") {
      return { status: "no_answer", decision_id: d.decision_id, reason: `GATE_${d.state}` };
    }
    if (d.lifetime_mode !== OPERATOR_WAIT && d.expires_at && Date.parse(d.expires_at) <= Date.now()) {
      // legacy bounded_ttl only — operator-wait never reaches this branch
      return { status: "no_answer", decision_id: d.decision_id, reason: "GATE_EXPIRED" };
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return { status: "PENDING", decision_id: args.decision_id };
}

/**
 * Background waiter inside the MCP server (single getUpdates consumer stays
 * HERE — never in the driver, never duplicated).
 *
 * PERSISTENT OPERATOR WAIT lifetime law: the waiter NEVER terminates because
 * of elapsed wall-clock time. It loops over bounded transport waits (each
 * well under the watchdog; the transport long-polls Telegram server-side),
 * re-arming until: ANSWERED (canonical admission → VERIFIED→RETURNED),
 * an explicit CANCELLED/SUPERSEDED transition in the store, a FATAL
 * transport class (CONFLICT/AUTH), or process exit. If the MCP process dies,
 * the PENDING decision remains in the persistent store; a restarted server
 * resumes waiting on first status-poll re-arm — elapsed time alone never
 * invalidates the persisted decision.
 */
const OPERATOR_WAIT_POLL_MS = 1000; // gap between re-armed waits (no busy loop)

function startBackgroundWait(decision, { taskRef, sessionId, generation }) {
  const storePath = gateStorePath();
  (async () => {
    for (;;) {
      // explicit termination check before (re)arming a wait
      const pre = loadGateStore(storePath).decisions.find((x) => x.decision_id === decision.decision_id);
      if (pre && ["CANCELLED", "SUPERSEDED", "RETURNED", "VERIFIED", "CONSUMED"].includes(pre.state)) return;

      let wait = null;
      try {
        const transport = await getTransport();
        wait = await transport.waitAnswer({ decision, deadlineMs: Date.now() + OPERATOR_WAIT_REARM_MS, spoolDir: SPOOL_DIR });
      } catch (e) {
        // Transport exception: fail closed ONLY for real irrecoverable errors.
        // Transient network failures are retried by the re-arm loop.
        const kind = String(e?.message ?? e).toUpperCase();
        if (kind.includes("CONFIG") || kind.includes("AUTH")) {
          const store = loadGateStore(storePath);
          markNoAnswer(store, decision.decision_id); // legacy mode: NO_ANSWER; operator_wait: rejected (no auto-terminal)
          persistGateStore(store, storePath);
          return;
        }
        await new Promise((r) => setTimeout(r, OPERATOR_WAIT_POLL_MS * 5));
        continue;
      }

      if (wait?.status === "ANSWERED" && wait.update_id !== undefined) {
        const store = loadGateStore(storePath);
        const admitted = admitGateCallback(store, { decision_id: decision.decision_id, option: wait.option, update_id: wait.update_id }, { taskRef, sessionId, generation });
        persistGateStore(store, storePath);
        if (!admitted.ok) {
          // Already-admitted elsewhere through the same gate law (e.g. driver
          // synthetic admission): still perform the canonical hand-back.
          if (admitted.reason !== "GATE_DECISION_ALREADY_CONSUMED") return;
          const s = loadGateStore(storePath);
          const d = s.decisions.find((x) => x.decision_id === decision.decision_id);
          if (d?.state === "VERIFIED" && d?.selected_option) markReturned(s, decision.decision_id);
          persistGateStore(s, storePath);
          return;
        }
        const store2 = loadGateStore(storePath);
        markReturned(store2, decision.decision_id);
        persistGateStore(store2, storePath);
        return;
      }
      if (wait?.status === "ABORTED") {
        // FATAL classes (CONFLICT=competing consumer, AUTH=credentials) end the
        // wait explicitly; the decision stays PENDING in the persistent store
        // (fail closed: NOT auto-answered, NOT auto-expired).
        return;
      }
      // TIMEOUT of this bounded slice: re-arm (the human wait continues).
      // Check explicit cancellation/supersession each cycle.
      const post = loadGateStore(storePath).decisions.find((x) => x.decision_id === decision.decision_id);
      if (post && ["CANCELLED", "SUPERSEDED"].includes(post.state)) return;
      await new Promise((r) => setTimeout(r, OPERATOR_WAIT_POLL_MS));
    }
  })();
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
    write({ jsonrpc: "2.0", id, result: { tools: [
      {
        name: "human_gate",
        description: "Ask the human operator a material A/B/C decision through the canonical Control Plane gate (Telegram). Registers the gate, sends ONE Telegram ACTIVE GATE and returns PENDING immediately (watchdog-safe). Then poll human_gate_status with the returned decision_id. PENDING is NOT a decision; the only consumable result is the verified option from human_gate_status.",
        inputSchema: INPUT_SCHEMA,
      },
      {
        name: "human_gate_status",
        description: "Read-only bounded status poll for a pending human gate: ONE short slice (well under the runtime tool watchdog). Returns PENDING, the verified option (only when the canonical gate state is VERIFIED/RETURNED), no_answer (TTL/expired), or error. Never creates gates, never sends, never invents answers.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["decision_id", "task_ref", "generation"],
          properties: {
            decision_id: { type: "string", minLength: 1, maxLength: 64 },
            task_ref: { type: "string", minLength: 1, maxLength: 128 },
            generation: { type: "integer", minimum: 1 },
          },
        },
      },
    ] } });
    return;
  }
  if (method === "tools/call") {
    if (params?.name !== TOOL_NAME && params?.name !== "human_gate_status") {
      write({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ status: "error", reason: "UNKNOWN_TOOL" }) }], isError: true } });
      return;
    }
    const out = params?.name === "human_gate_status"
      ? await humanGateStatus(params?.arguments ?? {})
      : await humanGate(params?.arguments ?? {});
    const isError = out.status === "error";
    write({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(out) }], isError } });
    return;
  }
  if (method?.startsWith("notifications/")) return; // notifications: no response
  if (id !== undefined) write({ jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } });
}

writeSpoolMarker("server-started.marker", { server: "v4-cursor-acp-human-gate", transport_module: TRANSPORT_MODULE ? path.basename(TRANSPORT_MODULE) : null });
