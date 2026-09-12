#!/usr/bin/env node
/**
 * Control Plane per-invocation Hermes browser-tool allowlist wrapper (v1).
 *
 * BLOCK-ID: V4_HERMES_PER_INVOCATION_BROWSER_TOOL_ALLOWLIST_AND_SEND_QUALIFICATION_V1
 *
 * Conceptual route:
 *   QWEN_LOCAL -> CONTROL_PLANE_INVOCATION_GUARD -> HERMES_NATIVE_BROWSER_TOOLS -> CHATGPT_WEB
 *
 * DUAL BARRIER (mandatory):
 *   Barrier 1 (model-visible schemas): the Qwen chat-completions request
 *   carries EXACTLY the 4 existing Hermes schemas for browser_navigate,
 *   browser_snapshot, browser_type, browser_press.
 *   Barrier 2 (execution dispatch): every tool name returned by the model is
 *   checked against the EXACT allowlist before any Hermes handler runs;
 *   anything else deterministically returns TOOL_NOT_ALLOWED and never
 *   reaches Hermes.
 *
 * Hard walls:
 * - Hermes remains the browser/tool implementation (in-process venv bridge
 *   tools/hermes-per-invocation-browser-allowlist-v1.py; installed Hermes is
 *   a read-only dependency; no source/config mutation, no monkey-patching);
 * - BROWSER_CDP_URL is set only inside the bridge process (per-invocation
 *   equivalent of `/browser connect`; disappears at process exit);
 * - RAW CDP / generic evaluate (browser_cdp, browser_console, browser_exec)
 *   are neither model-visible nor dispatchable;
 * - budgets: total Qwen generations <= 2 (1 offline + 1 live), ChatGPT Web
 *   sends <= 1, zero retries, zero provider fallback;
 * - sanitized evidence only: no page DOM/text, no cookies/tokens/storage,
 *   no chain-of-thought persistence.
 */

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const EXACT_ALLOWLIST = Object.freeze([
  "browser_navigate",
  "browser_snapshot",
  "browser_type",
  "browser_press",
]);

const PY = String.raw`C:\Users\mrhz\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`;
const BRIDGE = path.join(process.cwd(), "tools", "hermes-per-invocation-browser-allowlist-v1.py");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run one bridge action; resolves with the parsed JSON envelope. */
export async function bridge(action, extra = []) {
  const out = path.join(process.env.TEMP || process.cwd(), `cp-allowlist-${randomUUID()}.json`);
  const args = [BRIDGE, "--action", action, "--out", out, ...extra];
  const proc = spawn(PY, args, { stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  proc.stderr.on("data", (d) => { stderr += String(d); });
  const code = await new Promise((resolve) => proc.on("close", resolve));
  let payload = null;
  try { payload = JSON.parse(fs.readFileSync(out, "utf8")); } catch { /* leave null */ }
  try { fs.unlinkSync(out); } catch { /* best effort */ }
  if (code !== 0) {
    throw new Error(`bridge ${action} exit=${code} stderr=${stderr.slice(0, 300)}`);
  }
  if (!payload) throw new Error(`bridge ${action} produced no JSON`);
  return payload;
}

/**
 * Phase D repair: bounded composer-send chain (snapshot -> fill -> press Enter)
 * executed in ONE agent-browser client connection via the bridge's chain-send
 * action. Fixes the live root cause: agent-browser 0.26.0 keeps snapshot refs
 * per CLIENT CONNECTION, so the native type/press handlers (separate CLI
 * invocations, separate connections) could not resolve the snapshot ref.
 * Same qualified tool semantics; the model-visible surface is unchanged.
 */
export async function chainSend({ text, pressOnly, taskId, cdpUrl }) {
  return bridge("chain-send", [
    "--args-json", JSON.stringify({ text: text ?? "", press_only: pressOnly ?? null }),
    "--task-id", taskId,
    "--cdp-url", cdpUrl,
  ]);
}

/** Barrier 2: EXACT-name gate. No prefix, no wildcard, no fallback. */
export function gateToolName(name) {
  return typeof name === "string" && EXACT_ALLOWLIST.includes(name);
}

/**
 * Multi-turn chain state machine (wrapper-owned enforcement).
 * Even though the model-visible allowlist holds 4 tools, each chain state
 * accepts EXACTLY ONE tool; any other tool (allowed globally or not) is
 * rejected PRE-EXECUTION with HERMES_HANDLER_INVOKED=NO.
 */
export const CHAIN_STATES = Object.freeze({
  S0_SNAPSHOT: "browser_snapshot",
  S1_TYPE: "browser_type",
  S2_PRESS: "browser_press",
});

export function stateGate(state, toolName) {
  return CHAIN_STATES[state] === toolName;
}

/** Chat-completions against the canonical Qwen endpoint (loopback, no key). */
export async function qwenChat({ endpoint, profile, messages, tools, maxTokens, timeoutMs }) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs || 180000);
  try {
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: profile,
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: maxTokens ?? 512,
        temperature: 0.2,
        stream: false,
      }),
      signal: ac.signal,
    });
    if (!res.ok) throw new Error(`qwen http ${res.status}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

/** Extract the first tool call (name+args) from a chat-completions response. */
export function firstToolCall(response) {
  const msg = response?.choices?.[0]?.message;
  const call = msg?.tool_calls?.[0];
  if (!call) return null;
  let args = {};
  try { args = JSON.parse(call.function?.arguments || "{}"); } catch { /* empty */ }
  return { id: call.id ?? null, name: call.function?.name ?? "", args };
}

/** Extract ALL tool calls (bounded state machine needs exact counts). */
export function allToolCalls(response) {
  const calls = response?.choices?.[0]?.message?.tool_calls ?? [];
  return calls.map((call) => {
    let args = {};
    try { args = JSON.parse(call.function?.arguments || "{}"); } catch { /* empty */ }
    return { id: call.id ?? null, name: call.function?.name ?? "", args };
  });
}

function sha256(s) { return createHash("sha256").update(String(s)).digest("hex"); }

/** Persist a sanitized trace record (append-only, bounded fields). */
export function tracePush(store, record) {
  store.push({
    ts: new Date().toISOString(),
    ...record,
  });
}

/**
 * Offline qualification: schemas, dispatch probes, config hash stability,
 * and (optionally) the single offline tool-emission proof.
 */
export async function offlineQualification({ endpoint, profile, doEmission }) {
  const evidence = {};
  const schemas = await bridge("schemas");
  evidence.schemas = {
    schemas_sourced_from_hermes: schemas.schemas_sourced_from_hermes === true,
    hermes_inventory_count: schemas.hermes_inventory_count,
    model_visible_count: schemas.model_visible_count,
    model_visible_names: schemas.model_visible_names,
    forbidden_model_visible: schemas.forbidden_model_visible,
    config_before: schemas.config_meta,
  };
  const probe = await bridge("dispatch-probe");
  evidence.dispatch_probes = {
    exact_allowlist: probe.exact_allowlist,
    probes: probe.probes,
    hermes_handler_invocations: probe.hermes_handler_invocations,
    config_after: probe.config_meta,
  };
  evidence.config_unchanged =
    schemas.config_meta.sha256 === probe.config_meta.sha256 &&
    schemas.config_meta.size === probe.config_meta.size;

  if (doEmission) {
    const messages = [
      {
        role: "system",
        content:
          "You are the controller for a bounded browser-send qualification. " +
          "You have exactly four tools. Follow the instruction and emit ONE tool call, nothing else.",
      },
      {
        role: "user",
        content:
          "Open a new browser page at https://example.com/ using the available tools. " +
          "Emit exactly one tool call now.",
      },
    ];
    const response = await qwenChat({
      endpoint,
      profile,
      messages,
      tools: schemas.model_visible_definitions,
      maxTokens: 256,
    });
    const call = firstToolCall(response);
    evidence.emission = {
      profile,
      model_visible_tool_count: schemas.model_visible_count,
      model_visible_tool_names: schemas.model_visible_names,
      returned_tool_name: call ? call.name : null,
      returned_tool_args_sanitized: call
        ? Object.fromEntries(
            Object.entries(call.args || {}).map(([k, v]) => [
              k,
              k === "text" ? { chars: String(v).length, sha256_12: sha256(v).slice(0, 12) } : v,
            ]),
          )
        : null,
      returned_tool_allowed: call ? gateToolName(call.name) : false,
      finish_reason: response?.choices?.[0]?.finish_reason ?? null,
      executed: false, // synthetic call never executed
    };
  }
  return evidence;
}

export function buildProofPayload({ taskRef, runId, nonce, baseHead, schemaVersion = "hermes-per-invocation-allowlist-send-proof-v1" }) {
  return (
    `{"schema_version":"${schemaVersion}",` +
    `"task_ref":"${taskRef}","run_id":"${runId}","nonce":"${nonce}",` +
    `"base_head":"${baseHead}","shadow_only":true,"production_dispatch":false}\n` +
    `Please reply with a one-word acknowledgement only (e.g. "received").`
  );
}

/** CLI entry: offline qualification or dispatch gate self-test. */
async function main() {
  const mode = process.argv[2] ?? "offline";
  const endpoint = process.env.QWEN_ENDPOINT ?? "http://127.0.0.1:8080/v1";
  const profile = process.env.QWEN_PROFILE ?? "qwen38-opus-q3-agent-24k";
  if (mode === "offline") {
    const ev = await offlineQualification({ endpoint, profile, doEmission: true });
    console.log(JSON.stringify(ev, null, 2));
    return;
  }
  if (mode === "gate-selftest") {
    const cases = [
      ...EXACT_ALLOWLIST.map((n) => [n, true]),
      ["browser_cdp", false],
      ["browser_console", false],
      ["browser_exec", false],
      ["synthetic_unknown_tool", false],
      ["browser_", false],
      ["browser_navigate2", false],
    ];
    let ok = true;
    for (const [name, expect] of cases) {
      const got = gateToolName(name);
      if (got !== expect) ok = false;
      console.log(`${name} -> ${got ? "WOULD_DISPATCH" : "TOOL_NOT_ALLOWED"}${got === expect ? "" : " (UNEXPECTED)"}`);
    }
    process.exitCode = ok ? 0 : 1;
    return;
  }
  if (mode === "payload") {
    const [taskRef, runId, nonce, baseHead] = process.argv.slice(3);
    console.log(buildProofPayload({ taskRef, runId, nonce, baseHead }));
    return;
  }
  console.error("usage: run.mjs [offline|gate-selftest|payload ...] (live flow is driven by the operator script)");
  process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  main().catch((e) => { console.error(e); process.exitCode = 1; });
}
