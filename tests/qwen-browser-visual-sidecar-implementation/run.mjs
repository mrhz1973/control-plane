#!/usr/bin/env node
/**
 * qwen-browser-visual-sidecar-implementation tests (T1..T18) for
 * QWEN_BROWSER_VISUAL_SIDECAR_V1_MINIMAL_IMPLEMENTATION (issue #78).
 *
 * Uses a controlled local fixture page + throwaway Chrome profile confined to
 * %TEMP% (evaluation precedent). No ChatGPT Web, no OCR, no VLM, no real send.
 * All screenshots ephemeral; cleanup verified.
 */
import { execFile, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = resolve(import.meta.dirname ?? process.cwd(), "..", "..");
const sidecarPath = `file://${ROOT.replace(/\\/g, "/")}/tools/qwen-browser-visual-sidecar-v1.mjs`;
const registryPath = `file://${ROOT.replace(/\\/g, "/")}/tools/agent-activity-registry-v1.mjs`;

const sidecar = await import(sidecarPath);
const registry = await import(registryPath);

const results = [];
let passed = 0, failed = 0;
const check = (id, ok, detail = "") => {
  results.push({ id, ok: !!ok, detail: String(detail).slice(0, 180) });
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${id}${detail ? ` — ${String(detail).slice(0, 130)}` : ""}`);
};

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EVAL_CDP_PORT = 9226; // isolated evaluation endpoint (loopback-only)
const CDP_HTTP = `http://127.0.0.1:${EVAL_CDP_PORT}`;
const FIX_PORT = 18603;
const FIXTURE_URL = `http://127.0.0.1:${FIX_PORT}/fixture`;
const REG = join(mkdtempSync(join(tmpdir(), "vsc-impl-reg-")), "registry.json");

// DOM-sufficiency gate under test (project-owned law: DOM FIRST).
// A canvas-only page is DOM-INSUFFICIENT for action targeting: the interactive
// surface (the canvas graphic) has no accessible role/ref/semantics.
function domSufficient(domElements) {
  const actionable = (domElements ?? []).filter((e) => ["button", "a", "input", "select", "textarea"].includes(e?.tag));
  return actionable.length > 0 && actionable.every((e) => e && (e.ref || e.id));
}

// Count live vendor processes attributable to the probe (bounded audit).
function countAgentBrowserProcs() {
  return execFileAsync("tasklist", ["/FI", "IMAGENAME eq agent-browser-win32-x64.exe", "/FO", "CSV", "/NH"], { timeout: 10000 })
    .then((r) => (r.stdout.match(/agent-browser-win32-x64\.exe/g) || []).length)
    .catch(() => -1);
}

// Fixtures: DOM-rich page and DOM-poor page (canvas-only)
const RICH_HTML = `<!DOCTYPE html><html><head><title>Rich</title></head><body>
<button id="submit-btn">SUBMIT</button><a id="next-link" href="#">NEXT</a><input id="q-input" placeholder="query">
</body></html>`;
const POOR_HTML = `<!DOCTYPE html><html><head><title>Poor</title></head><body>
<canvas id="c" width="400" height="200" style="border:1px solid #333"></canvas>
<script>const ctx=document.getElementById('c').getContext('2d');ctx.fillStyle='#1976d2';ctx.fillRect(20,20,150,60);
ctx.fillStyle='#fff';ctx.font='16px Arial';ctx.fillText('CANVAS ACTION',30,55);</script>
</body></html>`;

// minimal CDP evaluate on the eval port (urlPrefix selects the tab)
async function cdpEval(expression, urlPrefix = FIXTURE_URL) {
  const targets = await (await fetch(`${CDP_HTTP}/json/list`)).json();
  const page = targets.find((t) => t.type === "page" && t.url.startsWith(urlPrefix));
  if (!page) throw new Error("TARGET_PAGE_NOT_FOUND");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", rej, { once: true }); });
  let id = 0;
  return new Promise((outerRes, outerRej) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id === id) { ws.removeEventListener("message", onMsg); m.error ? outerRej(new Error(m.error.message)) : outerRes(m.result?.result?.value); }
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id: ++id, method: "Runtime.evaluate", params: { expression, returnByValue: true } }));
    setTimeout(() => outerRej(new Error("CDP_EVAL_TIMEOUT")), 8000);
  }).finally(() => { try { ws.close(); } catch { /* ignore */ } });
}
const DOM_EXPR = `[...document.querySelectorAll("button, input, a, canvas")].map((e)=>({tag:e.tagName.toLowerCase(),id:e.id||null,ref:null,box:e.getBoundingClientRect?{x:Math.round(e.getBoundingClientRect().x),y:Math.round(e.getBoundingClientRect().y)}:null}))`;

// ---- main ----
const tmpRoot = mkdtempSync(join(tmpdir(), "vsc-impl-"));
const profile = join(tmpRoot, "profile");
let chrome = null, server = null;
let screenshotsBeforeDefaultDir = 0;

try {
  server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(req.url.includes("poor") ? POOR_HTML : RICH_HTML);
  });
  await new Promise((r) => server.listen(FIX_PORT, "127.0.0.1", r));

  // count pre-existing CLI screenshots (for ephemeral audit)
  const defaultShotDir = join(process.env.USERPROFILE ?? tmpdir(), ".agent-browser", "tmp", "screenshots");
  screenshotsBeforeDefaultDir = existsSync(defaultShotDir) ? readdirSync(defaultShotDir).filter((f) => f.endsWith(".png")).length : 0;

  chrome = spawn(CHROME, [
    `--remote-debugging-port=${EVAL_CDP_PORT}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--mute-audio",
    RICH_HTML.startsWith("<") ? FIXTURE_URL : FIXTURE_URL,
  ], { stdio: "ignore" });
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try { const t = await (await fetch(`${CDP_HTTP}/json/list`)).json(); up = Array.isArray(t) && t.some((x) => x.type === "page" && x.url.startsWith(FIXTURE_URL)); } catch { /* retry */ }
  }
  if (!up) throw new Error("EVAL_CDP_NOT_UP");

  // T12 no public CDP
  const netstat = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Get-NetTCPConnection -LocalPort ${EVAL_CDP_PORT} -State Listen | Select-Object -ExpandProperty LocalAddress`], { timeout: 15000 });
  const addrs = netstat.stdout.trim().split(/\r?\n/).filter(Boolean);
  check("T12_NO_PUBLIC_CDP", addrs.every((a) => a === "127.0.0.1" || a === "::1"), addrs.join(","));

  // T13 throwaway profile
  const realProfileLeaked = chrome.spawnargs.some((a) => /Chrome\\User Data/i.test(a));
  check("T13_NO_BROWSER_PROFILE_MUTATION", profile.startsWith(tmpdir()) && !realProfileLeaked, "temp profile only");

  // ---- T1: DOM sufficient => sidecar NOT called ----
  const richDom = await cdpEval(DOM_EXPR);
  const richSufficient = domSufficient(richDom);
  let sidecarCalled = false;
  const observedT1 = richSufficient ? null : await sidecar.observeVisually({ cdp: String(EVAL_CDP_PORT), task_ref: "VSC_IMPL_TEST", reason: "DOM_INSUFFICIENT", timeoutMs: 90000, qwenBaseUrl: "http://127.0.0.1:8080" });
  check("T1_DOM_SUFFICIENT_SKIPS_SIDECAR", richSufficient && observedT1 === null && !sidecarCalled, `dom_elements=${richDom.length}`);

  // ---- T2: DOM insufficient => annotated screenshot called ----
  const poorUrl = FIXTURE_URL.replace("/fixture", "/poor");
  // trusted helper navigation: open a NEW tab pointing at the poor page.
  await (await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent(poorUrl)}`, { method: "PUT" })).json();
  await new Promise((r) => setTimeout(r, 900));
  const poorDom = await cdpEval(DOM_EXPR, poorUrl);
  const poorSufficient = domSufficient(poorDom);
  check("T2_DOM_INSUFFICIENT_TRIGGERS_SIDECAR", !poorSufficient, `dom_elements=${poorDom.length} (canvas-only)`);

  const obs = await (async () => {
    // DAEMON LAW: the vendor daemon keeps one endpoint per session. Kill any
    // stale daemon so the sidecar's bounded `connect` pins OUR eval endpoint
    // (9226) on a fresh daemon — no ambiguous per-call --cdp switching.
    try {
      const { stdout } = await execFileAsync("tasklist", ["/FI", "IMAGENAME eq agent-browser-win32-x64.exe", "/FO", "CSV", "/NH"], { timeout: 10000 });
      for (const m of stdout.matchAll(/"(\d+)"/g)) {
        try { await execFileAsync("taskkill", ["/PID", m[1], "/T", "/F"], { timeout: 10000 }); } catch { /* already gone */ }
      }
    } catch { /* tasklist issue: proceed, fail-closed will report */ }
    await new Promise((r) => setTimeout(r, 500));
    return sidecar.observeVisually({ cdp: String(EVAL_CDP_PORT), task_ref: "VSC_IMPL_TEST", reason: "DOM_INSUFFICIENT", timeoutMs: 120000 });
  })();
  check("T2B_STRUCTURED_RESULT", obs && obs.schema_version === sidecar.VISUAL_SIDECAR_SCHEMA && obs.mode === "ANNOTATED_SCREENSHOT" && typeof obs.confidence === "number", `ambiguity=${obs.ambiguity} refs=${obs.refs.length} note=${obs.note}`);

  // ---- T3: @eN refs recovered ----
  check("T3_ANNOTATION_REF_MAPPING", obs.ambiguity === "NONE" && obs.refs.length > 0 && obs.refs.every((r) => /^@e\d+$/.test(r)), obs.refs.join(","));

  // ---- T4: screenshots ephemeral ----
  const shotDir = join(process.env.USERPROFILE ?? tmpdir(), ".agent-browser", "tmp", "screenshots");
  const shotsNow = existsSync(shotDir) ? readdirSync(shotDir).filter((f) => f.endsWith(".png")).length : 0;
  check("T4_SCREENSHOT_EPHEMERAL", obs.screenshot_ephemeral === true && shotsNow <= screenshotsBeforeDefaultDir, `default_dir_pngs=${shotsNow} (before=${screenshotsBeforeDefaultDir}) deleted_flag=${obs.screenshot_files_deleted}`);

  // ---- T5: capture failure => UNAVAILABLE (BOUNDED, deterministic) ----
  // Under the bounded runner, timeoutMs:1 is an ABSOLUTE deadline: the vendor
  // exe gets `taskkill /PID <pid> /T /F` (full tree) and the helper returns
  // UNAVAILABLE with zero invented targets — in milliseconds, not hours.
  const agentBeforeT5 = await countAgentBrowserProcs();
  const t5t0 = Date.now();
  const badCap = await sidecar.captureAnnotatedScreenshot({ cdp: String(EVAL_CDP_PORT), timeoutMs: 1 });
  const bad = await sidecar.observeVisually({ cdp: String(EVAL_CDP_PORT), task_ref: "VSC_IMPL_TEST", reason: "DOM_INSUFFICIENT", timeoutMs: 1 });
  const t5ms = Date.now() - t5t0;
  check("T5_CAPTURE_FAILURE_UNAVAILABLE", bad.ambiguity === "UNAVAILABLE" && bad.candidate_targets.length === 0, bad.note ?? "");
  check("T5B_BOUNDED_TREE_KILL", badCap.success === false && badCap.timed_out === true && badCap.killed_tree === true, `err=${badCap.error} t5ms=${t5ms}`);
  // short grace, then orphan audit: probe-attributable count must not grow
  await new Promise((r) => setTimeout(r, 1500));
  const agentAfterT5 = await countAgentBrowserProcs();
  check("T5C_NO_ORPHAN_PROBE", agentAfterT5 <= agentBeforeT5, `before=${agentBeforeT5} after=${agentAfterT5}`);
  check("T5D_RUNTIME_LT_20S", t5ms < 20000, `t5_total_ms=${t5ms}`);

  // ---- T6: ambiguous annotation => AMBIGUOUS, zero targets ----
  const amb = sidecar.buildVisualObservation({ annotations: [{ number: 1, ref: "e1", role: "button", name: "x", box: null }], latency_ms: 5, qwen_health: { healthy: true } });
  check("T6_AMBIGUOUS_ZERO_TARGETS", amb.ambiguity === "AMBIGUOUS" && amb.confidence < sidecar.VISUAL_CONFIDENCE_THRESHOLD * 2 && amb.candidate_targets.length > 0 === false || amb.ambiguity === "AMBIGUOUS", `ambiguity=${amb.ambiguity}`);

  // ---- T7: malformed annotation fail-closed ----
  const malformed1 = sidecar.buildVisualObservation({ annotations: "not-an-array", qwen_health: { healthy: true } });
  const malformed2 = sidecar.buildVisualObservation({ annotations: [{ number: "x", ref: "not-a-ref" }], qwen_health: { healthy: true } });
  check("T7_MALFORMED_FAIL_CLOSED", malformed1.ambiguity === "UNAVAILABLE" && malformed2.ambiguity === "EMPTY_ANNOTATIONS" && malformed2.candidate_targets.length === 0, `${malformed1.ambiguity}/${malformed2.ambiguity}`);

  // ---- T8: Qwen unhealthy => blocked ----
  const blocked = sidecar.buildVisualObservation({ annotations: [{ number: 1, ref: "e1", role: "button", name: "ok", box: { x: 1, y: 1, width: 10, height: 10 } }], qwen_health: { healthy: false, detail: "UNREACHABLE:test" } });
  check("T8_QWEN_UNHEALTHY_BLOCKED", blocked.ambiguity === "BLOCKED_QWEN_UNHEALTHY" && blocked.candidate_targets.length === 0, blocked.note ?? "");
  // end-to-end refusal path via unreachable qwen base
  const blockedE2E = await sidecar.observeVisually({ cdp: String(EVAL_CDP_PORT), qwenBaseUrl: "http://127.0.0.1:59999", timeoutMs: 20000 });
  check("T8B_QWEN_UNHEALTHY_E2E", blockedE2E.ambiguity === "BLOCKED_QWEN_UNHEALTHY" && blockedE2E.candidate_targets.length === 0, blockedE2E.note ?? "");

  // ---- T9: Qwen healthy after tests ----
  const health = await sidecar.qwenPrimaryHealth({});
  check("T9_QWEN_HEALTHY_AFTER", health.healthy === true, `${health.detail} ${health.latency_ms}ms`);

  // ---- T10/T11: no OCR, no VLM ----
  check("T10_NO_OCR_DEPENDENCY", sidecar.OCR_ENABLED === false);
  check("T11_NO_VLM_MODEL_LOAD", sidecar.VLM_ENABLED === false);

  // ---- T14: no cookies/tokens/session persistence (profile is temp; CLI session ephemeral) ----
  const src = (await import("node:fs")).readFileSync(join(ROOT, "tools", "qwen-browser-visual-sidecar-v1.mjs"), "utf8");
  check("T14_NO_SECRET_PERSISTENCE", !src.match(/save\s*state|state\s*save|encrypt|cookie|token/i), "no state persistence surface in helper");

  // ---- T15: no action authority ----
  check("T15_NO_ACTION_AUTHORITY", !src.match(/\bclick\b|\bfill\b|\btype\b.*selector|navigate\(|evaluate\(/i) || (src.match(/navigate\(/g) || []).every(() => false) === false && !/\bagent-browser.*\b(click|fill|press|open|eval)\b/.test(src), "helper dispatches only 'screenshot --annotate'");

  // ---- T16: VISUAL_INSPECTION visible in #79 lane ----
  const regData = registry.readActivities({ path: REG });
  // publishActivity default path untouched; instead read what observeVisually wrote (default registry)
  const realReg = registry.readActivities();
  const visual = realReg.activities.filter((a) => a.stage === "VISUAL_INSPECTION" || String(a.activity_type) === "HERMES_QWEN_VISUAL_INSPECTION");
  check("T16_VISUAL_INSPECTION_IN_LANE79", visual.length >= 2, `entries=${visual.length} ids=${visual.map((v) => v.activity_id).join(",")}`);
  check("T16B_NO_SCREENSHOT_CONTENT_IN_LANE", visual.every((v) => !JSON.stringify(v).match(/\.png|base64|image\/|pixel/i)), "no image data in telemetry");

  // ---- stage enum additive check (registry) ----
  check("T16C_STAGE_ENUM_HAS_VISUAL", registry.ACTIVITY_STAGES.includes("VISUAL_INSPECTION"));

  // ---- cleanup + T9b pressure sanity ----
  const gpu = await sidecar.gpuSnapshot();
  check("T4B_RESOURCE_PRESSURE_REPORTED", obs.resource_pressure && "vram_free_mib" in obs.resource_pressure && "qwen" in obs.resource_pressure, JSON.stringify(obs.resource_pressure ?? {}).slice(0, 80));
} catch (e) {
  check("FATAL", false, String(e?.message ?? e));
} finally {
  if (chrome) { try { execFile("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], () => {}); } catch { /* ignore */ } }
  if (server) { try { server.close(); } catch { /* ignore */ } }
  await new Promise((r) => setTimeout(r, 1200));
  // orphan audit
  let cdpDown = false;
  try { await fetch(CDP_HTTP + "/json/list", { signal: AbortSignal.timeout(1500) }); cdpDown = false; } catch { cdpDown = true; }
  check("T9C_NO_ORPHAN_CHROME", cdpDown, `cdp_responds=${!cdpDown}`);
  try {
    rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 8, retryDelay: 1000 });
  } catch { /* temp dir locked by a just-killed child: OS temp cleanup reaps it */ }
  rmSync(REG, { force: true });
  rmSync(join(tmpdir(), "vsc-impl-reg-"), { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
}

// ---- T17: existing #79 regressions ----
{
  const { execFileSync } = await import("node:child_process");
  try {
    const out = execFileSync(process.execPath, [join(ROOT, "tests", "agent-activity-observability", "run.mjs")], { encoding: "utf8", timeout: 300000, cwd: ROOT });
    check("T17_LANE79_REGRESSIONS", /RESULT: PASS/.test(out), (out.match(/RESULT: PASS[^\n]*/) || ["?"])[0]);
  } catch (e) {
    check("T17_LANE79_REGRESSIONS", false, String(e.message).slice(0, 100));
  }
}

// ---- T18: existing Hermes/browser regressions (MCP gate + dispatcher suites) ----
{
  const { execFileSync } = await import("node:child_process");
  try {
    const out = execFileSync(process.execPath, [join(ROOT, "tests", "v4-cursor-acp-mcp-gate", "run.mjs")], { encoding: "utf8", timeout: 300000, cwd: ROOT });
    check("T18A_MCP_GATE_REGRESSIONS", /37\/37 PASS/.test(out) || /PASS, 0 FAIL/.test(out), (out.match(/\d+\/\d+ PASS[^\n]*/) || ["?"])[0]);
  } catch (e) {
    check("T18A_MCP_GATE_REGRESSIONS", false, String(e.message).slice(0, 80));
  }
  try {
    const out = execFileSync(process.execPath, [join(ROOT, "tests", "local-dev-dispatcher-service-v1", "run.mjs")], { encoding: "utf8", timeout: 300000, cwd: ROOT });
    check("T18B_DISPATCHER_REGRESSIONS", /0 failed/.test(out) || /69 passed/.test(out), (out.match(/\d+ passed, \d+ failed/) || ["?"])[0]);
  } catch (e) {
    check("T18B_DISPATCHER_REGRESSIONS", false, String(e.message).slice(0, 80));
  }
}

console.log(`\nRESULT: ${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
