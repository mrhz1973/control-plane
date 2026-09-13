#!/usr/bin/env node
/**
 * hermes-visual-observation-adapter-v1 — RUNTIME WIRING between the real
 * project-owned Hermes browser path and the qualified visual sidecar
 * (QWEN_BROWSER_VISUAL_SIDECAR_V1_RUNTIME_WIRING).
 *
 * Caller contract (the smallest real integration point):
 *
 *   QWEN_LOCAL controller
 *     → DOM/accessibility via the REAL Hermes bridge (exec-tool
 *       browser_snapshot — a Barrier-2 allowlisted tool; element_count is
 *       decided by CODE, never by model hallucination)
 *     → sufficient  ⇒ continue normally (sidecar_calls = 0)
 *     → insufficient ⇒ observeVisually() EXACTLY ONCE (read-only,
 *       structured, @eN-mapped) and hand the observation back to the
 *       controller layer.
 *
 * LAWS (unchanged from the qualified sidecar):
 * - Qwen stays controller; Hermes stays bridge; DOM stays default; the
 *   visual sidecar is a READ-ONLY fallback. This adapter never clicks,
 *   types, navigates, presses, evaluates JS, authorizes routes, creates
 *   or claims tasks, or dispatches.
 * - The bridge tool used is ONLY browser_snapshot (already in
 *   EXACT_ALLOWLIST — no 5th model-visible tool, no authority expansion).
 * - Fail-closed: bridge errors and ambiguous/unavailable visuals yield
 *   structured envelopes with ZERO invented targets.
 * - Bounded: every process spawn (Hermes bridge python AND vendor
 *   agent-browser) runs under runBoundedTree (absolute deadline ⇒
 *   taskkill /T /F). OCR_ENABLED=NO, VLM_ENABLED=NO.
 * - AUTOVIA-compatible: read-only observation on the same qualified
 *   bridge the LOCAL_DEV autonomous path already uses; no selector,
 *   claim, receipt or policy surface is touched.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runBoundedTree, buildVisualObservation, observeVisually, OCR_ENABLED, VLM_ENABLED, VISUAL_MODE, VISUAL_SIDECAR_SCHEMA } from "./qwen-browser-visual-sidecar-v1.mjs";

/** The ONLY bridge tool this adapter may invoke (Barrier-2 allowlisted). */
export const ADAPTER_BRIDGE_TOOL = "browser_snapshot";
/** Bounded default for the DOM-gate bridge call. */
export const DEFAULT_BRIDGE_TIMEOUT_MS = 45000;
export const DEFAULT_VISUAL_TIMEOUT_MS = 60000;
/** Minimum accessibility elements for a page to count as DOM-sufficient. */
export const DEFAULT_DOM_MIN_ELEMENTS = 1;

const PY = String.raw`C:\Users\mrhz\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`;
const BRIDGE = join(process.cwd(), "tools", "hermes-per-invocation-browser-allowlist-v1.py");

/**
 * Ephemeral per-invocation Hermes home: an EMPTY temp config scope so the
 * bridge's SSRF page guard does not judge loopback fixture pages with the
 * production config policy. NEVER touches the real user Hermes home.
 * (Hermes reads browser.allow_private_urls from HERMES_HOME/config.yaml;
 * default False there, which blocks our 127.0.0.1 fixture.)
 */
export function makeEphemeralHermesHome() {
  const home = mkdtempSync(join(tmpdir(), "vsc-hermes-home-"));
  writeFileSync(join(home, "config.yaml"), "browser:\n  allow_private_urls: true\n", "utf8");
  return home;
}

/**
 * One bounded bridge invocation (same CLI contract as the allowlist
 * wrapper's bridge(), but under the absolute-deadline tree-kill runner).
 * Resolves with the parsed JSON envelope or a fail-closed error marker.
 */
export async function boundedBridge(args, timeoutMs = DEFAULT_BRIDGE_TIMEOUT_MS) {
  const tmp = mkdtempSync(join(tmpdir(), "vsc-bridge-"));
  const out = join(tmp, "envelope.json");
  // Process-scoped ephemeral config: BROWSER_CDP_URL pins the endpoint and
  // HERMES_HOME scopes the SSRF policy to an empty temp home (no production
  // config is read or mutated). Both disappear with the bridge process.
  const env = {
    ...process.env,
    BROWSER_CDP_URL: String(cdpUrlEnv(args)),
    HERMES_HOME: makeEphemeralHermesHome(),
  };
  try {
    const run = await runBoundedTree(PY, [BRIDGE, "--action", "exec-tool", "--out", out, ...args], timeoutMs, env);
    if (run.error) return { bridge_error: run.error };
    if (run.timed_out) return { bridge_error: `BRIDGE_TIMEOUT_BOUNDED:${timeoutMs}ms`, killed_tree: run.killed_tree === true };
    if (run.code !== 0) return { bridge_error: `BRIDGE_EXIT_${run.code}:${String(run.stderr ?? "").slice(0, 60)}` };
    try {
      return { envelope: JSON.parse(readFileSync(out, "utf8")) };
    } catch {
      return { bridge_error: "BRIDGE_OUTPUT_MALFORMED" };
    }
  } finally {
    try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ephemeral best-effort */ }
    try { if (env.HERMES_HOME?.startsWith(join(tmpdir(), "vsc-hermes-home-"))) rmSync(env.HERMES_HOME, { recursive: true, force: true }); } catch { /* ephemeral best-effort */ }
  }
}

/** Extract --cdp-url from the bridge args (env for the child process). */
function cdpUrlEnv(args) {
  const i = args.indexOf("--cdp-url");
  return i >= 0 && args[i + 1] ? args[i + 1] : "http://127.0.0.1:9222";
}

/** Deterministic DOM-sufficiency decision (fail-closed, code-owned). */
export function domGateDecision(envelope, minElements = DEFAULT_DOM_MIN_ELEMENTS) {
  if (!envelope || envelope.decision !== "DISPATCHED") return { gate: "BRIDGE_ERROR" };
  if (envelope.success !== true) return { gate: "SNAPSHOT_FAILED" };
  const n = envelope.element_count;
  // Sufficient ONLY when provably enough elements exist; anything unverifiable
  // falls back to the (read-only) visual observation — never the reverse.
  if (Number.isFinite(n) && n >= minElements) return { gate: "SUFFICIENT", element_count: n };
  return { gate: "INSUFFICIENT", element_count: Number.isFinite(n) ? n : null };
}

/**
 * Main entry — the real caller surface. One observation cycle:
 * DOM gate via the real Hermes bridge, then at most ONE visual fallback.
 * Never throws (fail-closed envelopes only).
 */
export async function observeWithDomGate({
  task_ref = "cp-visual-observation",
  cdpUrl = "http://127.0.0.1:9222",
  minElements = DEFAULT_DOM_MIN_ELEMENTS,
  bridgeTimeoutMs = DEFAULT_BRIDGE_TIMEOUT_MS,
  timeoutMs = DEFAULT_VISUAL_TIMEOUT_MS,
  qwenBaseUrl,
} = {}) {
  const r = await boundedBridge(
    ["--name", ADAPTER_BRIDGE_TOOL, "--args-json", "{}", "--task-id", String(task_ref), "--cdp-url", String(cdpUrl)],
    bridgeTimeoutMs,
  );

  if (r.bridge_error) {
    // Bridge unavailable: cannot even measure DOM. Fail closed with zero
    // targets and NO visual attempt (transport untrusted).
    return {
      schema_version: "hermes-visual-observation-wiring-v1",
      task_ref, controller: "QWEN_LOCAL", bridge: "HERMES",
      dom_gate: "BRIDGE_ERROR", dom_element_count: null,
      sidecar_calls: 0,
      visual: buildVisualObservation({ annotations: null, qwen_health: { healthy: true }, note: `DOM_GATE_BRIDGE_ERROR:${r.bridge_error}` }),
      autovia: { can_use_real_browser_observation_path: true, note: "read-only observation only" },
    };
  }

  const gate = domGateDecision(r.envelope, minElements);
  if (gate.gate === "SUFFICIENT") {
    return {
      schema_version: "hermes-visual-observation-wiring-v1",
      task_ref, controller: "QWEN_LOCAL", bridge: "HERMES",
      dom_gate: "SUFFICIENT", dom_element_count: gate.element_count,
      sidecar_calls: 0, visual: null,
      autovia: { can_use_real_browser_observation_path: true, note: "DOM sufficient; controller continues normally" },
    };
  }

  if (gate.gate === "SNAPSHOT_FAILED") {
    return {
      schema_version: "hermes-visual-observation-wiring-v1",
      task_ref, controller: "QWEN_LOCAL", bridge: "HERMES",
      dom_gate: "SNAPSHOT_FAILED", dom_element_count: null,
      sidecar_calls: 0,
      visual: buildVisualObservation({ annotations: null, qwen_health: { healthy: true }, note: "DOM_GATE_SNAPSHOT_FAILED" }),
      autovia: { can_use_real_browser_observation_path: true, note: "read-only observation only" },
    };
  }

  // INSUFFICIENT → the single visual fallback (observeVisually owns the
  // Qwen health gate, the #79 VISUAL_INSPECTION telemetry and the
  // bounded three-step capture).
  const visual = await observeVisually({ cdp: cdpUrl, task_ref, reason: "DOM_INSUFFICIENT", timeoutMs, qwenBaseUrl });
  return {
    schema_version: "hermes-visual-observation-wiring-v1",
    task_ref, controller: "QWEN_LOCAL", bridge: "HERMES",
    dom_gate: "INSUFFICIENT", dom_element_count: gate.element_count,
    sidecar_calls: 1, visual,
    autovia: { can_use_real_browser_observation_path: true, note: "structured read-only observation returned to controller" },
  };
}

export { OCR_ENABLED, VLM_ENABLED, VISUAL_MODE, VISUAL_SIDECAR_SCHEMA };
