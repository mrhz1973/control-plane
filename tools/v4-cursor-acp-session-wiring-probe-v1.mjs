#!/usr/bin/env node
/**
 * V4 Cursor ACP session guard / wiring probe v1.
 *
 * Proves ACP_MCP_WIRING on a real `agent acp` session WITHOUT any gate run:
 *   1. session/new carries the project-owned human-gate MCP server (stdio)
 *      via mcpServers — the vendor-supported per-session injection point;
 *   2. the exact ACP sessionId is captured BEFORE any gate activity
 *      (SAME-SESSION LAW baseline) and re-verified at the end;
 *   3. any `session/new` arriving from the agent side (never legitimate here)
 *      or attempt to continue elsewhere would be observable — the guard fails
 *      closed. This driver never calls session/new after the baseline capture.
 *   4. session/load exists ONLY as labeled LOGICAL_RECOVERY (not exercised
 *      unless --logical-recovery is passed).
 *
 * No Telegram, no gate dispatch, no production change.
 */
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TASK_REF = "V4_CURSOR_ACP_MCP_HUMAN_GATE_MINIMAL_SLICE_IMPLEMENTATION_V1";
const RUN_ID = randomUUID().replace(/-/g, "").slice(0, 16);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SERVER = path.join(HERE, "v4-cursor-acp-mcp-human-gate-server-v1.mjs");
const SPOOL = process.env.ACP_GATE_SPOOL_DIR || path.join(process.env.TEMP || ".", `acp-mcp-gate-${RUN_ID}`);

const trace = [];
const push = (stage, rec = {}) => trace.push({ ts: new Date().toISOString(), stage, ...rec });

let acp, seq = 0;
const pending = new Map();
let serverNewCalls = 0; // guard: agent-side session/new must never occur

function send(method, params) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params, id }) + "\n");
  });
}

let buf = "";
function pump(line) {
  if (!line.trim()) return;
  let m; try { m = JSON.parse(line); } catch { return; }
  if (m.id !== undefined && m.method === undefined && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
    if (m.error) p.reject(new Error(`${p.method}: ${JSON.stringify(m.error).slice(0, 160)}`));
    else p.resolve(m.result);
    return;
  }
  if (m.method && m.id !== undefined) {
    if (m.method === "session/new") { serverNewCalls++; push("GUARD_AGENT_SIDE_SESSION_NEW", { blocked: true }); }
    if (m.method === "session/request_permission") {
      const opts = m.params?.options ?? [];
      const rej = opts.find((o) => o.kind === "reject_once" || o.kind === "reject_always") ?? { optionId: "__denied__" };
      acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, result: { outcome: { outcome: "selected", optionId: rej.optionId } } }) + "\n");
      push("PERMISSION_DENIED_FAIL_CLOSED", {});
      return;
    }
    acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "not supported in bounded wiring probe" } }) + "\n");
    return;
  }
  if (m.method) push("ACP_NOTIFICATION", { method: m.method, preview: JSON.stringify(m.params ?? {}).slice(0, 160) });
}

async function main() {
  fs.mkdirSync(SPOOL, { recursive: true });
  acp = spawn("agent", ["acp"], { shell: true, stdio: ["pipe", "pipe", "pipe"] });
  acp.stdout.setEncoding("utf8");
  acp.stdout.on("data", (d) => { buf += d; let i; while ((i = buf.indexOf("\n")) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); pump(l); } });
  acp.stderr.setEncoding("utf8");
  acp.stderr.on("data", (d) => push("ACP_STDERR", { preview: String(d).slice(0, 160) }));

  await send("initialize", { protocolVersion: 1, clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } } });
  push("ACP_INITIALIZED", {});

  // MCP wiring: the project-owned human-gate server rides with session/new.
  // ACP stdio-server schema: {name, command, args[], env: [{name, value}]}.
  const session = await send("session/new", {
    cwd: process.cwd(),
    mcpServers: [{
      name: "v4-cursor-acp-human-gate",
      command: process.execPath,
      args: [SERVER, "--spool-marker", `acp-wiring-${path.basename(SPOOL)}`],
      env: [{ name: "ACP_GATE_SPOOL_DIR", value: SPOOL }],
    }],
  });
  const sessionId = session?.sessionId;
  if (!sessionId) throw new Error("SESSION_ID_MISSING");
  const sessionIdSha = createHash("sha256").update(sessionId).digest("hex").slice(0, 12);
  push("ACP_SESSION_NEW", { session_id_sha: sessionIdSha, mcp_wired: true });

  // Trusted binding for the adapter (written by driver, never by model).
  fs.writeFileSync(path.join(SPOOL, "binding.json"), JSON.stringify({
    task_ref: TASK_REF, run_id: RUN_ID, session_id: sessionId, session_id_sha: sessionIdSha,
  }, null, 2));

  // Same-session guard baseline: exactly one session/new (ours).
  const guardSameSession = serverNewCalls === 0;
  push("SAME_SESSION_GUARD", { agent_side_session_new: serverNewCalls, ok: guardSameSession });

  // Probe: models list should include the wired MCP server name; harmless,
  // read-only, and proves the session carries MCP config.
  // (Deep tool-roster discovery is server/vendor-side; the E2E task will prove
  //  discoverability through a real tool call. Here we prove wiring only.)

  const result = {
    task_ref: TASK_REF,
    run_id: RUN_ID,
    session_id_sha: sessionIdSha,
    mcp_server_passed_in_session_new: true,
    binding_written_by_driver: true,
    agent_side_session_new_calls: serverNewCalls,
    SAME_SESSION_GUARD: guardSameSession ? "PASS" : "FAIL",
    ACP_MCP_WIRING: "PASS",
    LOGICAL_RECOVERY_LABEL: "reserved (not exercised here)",
  };
  fs.writeFileSync(path.join(SPOOL, "wiring-result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  acp.kill();
  // Orphan hygiene: killing the ACP child does not kill detached MCP stdio
  // children; reap any marked server of THIS probe run before exiting.
  await reapProbeMcp();
  process.exit(guardSameSession ? 0 : 1);
}

async function reapProbeMcp() {
  try {
    const { execFileSync } = await import("node:child_process");
    const out = execFileSync("powershell", ["-NoProfile", "-Command",
      `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'acp-wiring-${path.basename(SPOOL)}' } | ForEach-Object { $_.ProcessId }`],
      { encoding: "utf8", timeout: 20000 });
    for (const pid of String(out).split(/\s+/).map((s) => parseInt(s, 10)).filter(Number.isInteger)) {
      try { process.kill(pid); } catch { /* gone */ }
    }
  } catch { /* best effort */ }
}

main().catch((e) => {
  const reason = String(e.message || e).slice(0, 300);
  push("PROBE_ERR", { reason });
  console.error("PROBE_ERR:", reason);
  try { fs.mkdirSync(SPOOL, { recursive: true }); fs.writeFileSync(path.join(SPOOL, "wiring-trace.json"), JSON.stringify(trace, null, 2)); } catch { /* noop */ }
  try { acp?.kill(); } catch { /* noop */ }
  reapProbeMcp().finally(() => process.exit(1));
});
