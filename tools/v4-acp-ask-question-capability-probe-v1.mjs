#!/usr/bin/env node
/**
 * Bounded ACP capability probe for V4_CURSOR_ACP_ASK_QUESTION_EXPOSURE_QUALIFICATION_V1.
 * Read-only: initialize + session/new captured in full, tool list asked per mode.
 * No gate, no Telegram, no production change. Sanitized output (no tokens).
 */
import { spawn } from "node:child_process";

const acp = spawn("agent", ["acp"], { shell: true, stdio: ["pipe", "pipe", "pipe"] });
let buf = "";
let seq = 0;
const pending = new Map();

function send(method, params) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params, id }) + "\n");
  });
}

acp.stdout.setEncoding("utf8");
acp.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i);
    buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.id !== undefined && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) p.reject(new Error(JSON.stringify(m.error).slice(0, 200)));
      else p.resolve(m.result);
    } else if (m.method === "session/update") {
      const u = m.params?.update ?? {};
      if (u.sessionUpdate === "current_mode_update") console.log("MODE_UPDATE:", JSON.stringify(u));
    }
  }
});
acp.stderr.setEncoding("utf8");
acp.stderr.on("data", (d) => console.error("STDERR:", String(d).slice(0, 200)));

const main = async () => {
  const init = await send("initialize", { protocolVersion: 1, clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } } });
  console.log("INITIALIZE_FULL:", JSON.stringify(init));
  const s = await send("session/new", { cwd: process.cwd(), mcpServers: [] });
  console.log("SESSION_NEW_FULL:", JSON.stringify(s));
  const sessionId = s.sessionId;

  const askTools = async (label) => {
    const r = await send("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text: "List EVERY tool name currently available to you (the exact tool identifiers from your tool list), comma-separated, nothing else. Do not run any tool." }],
    });
    let text = "";
    for (const c of r?.messages ?? []) for (const part of c?.content ?? []) if (part?.type === "text") text += part.text;
    console.log(`TOOLS[${label}]:`, text.replace(/\s+/g, " ").slice(0, 500));
    console.log(`STOPREASON[${label}]:`, r?.stopReason);
  };

  await askTools("default");

  for (const modeId of ["agent", "plan", "ask"]) {
    try {
      await send("session/set_mode", { sessionId, modeId });
      console.log("SET_MODE_OK:", modeId);
      await askTools(modeId);
    } catch (e) {
      console.log("SET_MODE_FAIL:", modeId, String(e.message).slice(0, 120));
    }
  }

  acp.kill();
  process.exit(0);
};

main().catch((e) => { console.error("PROBE_ERR:", String(e.message).slice(0, 300)); acp.kill(); process.exit(1); });
