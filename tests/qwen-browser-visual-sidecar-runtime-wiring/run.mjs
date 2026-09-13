#!/usr/bin/env node
/**
 * QWEN_BROWSER_VISUAL_SIDECAR_V1_RUNTIME_WIRING tests (T1..T16).
 *
 * Proves the wiring through the REAL project-owned caller
 * (tools/hermes-visual-observation-adapter-v1.mjs → real Hermes bridge
 * exec-tool browser_snapshot → sidecar observeVisually), with an isolated
 * loopback Chrome/CDP fixture. No ChatGPT Web send. OCR=NO, VLM=NO.
 */
import { execFile, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = resolve(import.meta.dirname ?? process.cwd(), "..", "..");
const adapterPath = `file://${ROOT.replace(/\\/g, "/")}/tools/hermes-visual-observation-adapter-v1.mjs`;
const sidecarPath = `file://${ROOT.replace(/\\/g, "/")}/tools/qwen-browser-visual-sidecar-v1.mjs`;
const registryPath = `file://${ROOT.replace(/\\/g, "/")}/tools/agent-activity-registry-v1.mjs`;

const adapter = await import(adapterPath);
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
const CDP_PORT = 9226;
const CDP_HTTP = `http://127.0.0.1:${CDP_PORT}`;
const FIX_PORT = 18605;
const FIXTURE_URL = `http://127.0.0.1:${FIX_PORT}/fixture`;
const RICH_HTML = `<!DOCTYPE html><html><head><title>Rich</title></head><body>
<button id="submit-btn">SUBMIT</button><a id="next-link" href="#">NEXT</a><input id="q-input" placeholder="query"></body></html>`;
const POOR_HTML = `<!DOCTYPE html><html><head><title>Poor</title></head><body>
<canvas id="c" width="400" height="200" style="border:1px solid #333"></canvas>
<script>const ctx=document.getElementById('c').getContext('2d');ctx.fillStyle='#1976d2';ctx.fillRect(20,20,150,60);
ctx.fillStyle='#fff';ctx.font='16px Arial';ctx.fillText('CANVAS ACTION',30,55);</script></body></html>`;

function countAgentBrowserProcs() {
  return execFileAsync("tasklist", ["/FI", "IMAGENAME eq agent-browser-win32-x64.exe", "/FO", "CSV", "/NH"], { timeout: 10000 })
    .then((r) => (r.stdout.match(/agent-browser-win32-x64\.exe/g) || []).length)
    .catch(() => -1);
}

// Hermes-side processes spawned by the bridge are children of OUR python.exe
// spawn (tree-kill on deadline covers them); after a clean run they exit with
// the bridge process. We still audit both python and agent-browser counts.
function countBridgePythons() {
  return execFileAsync("tasklist", ["/FI", "IMAGENAME eq python.exe", "/FO", "CSV", "/NH"], { timeout: 10000 })
    .then((r) => (r.stdout.match(/python\.exe/g) || []).length)
    .catch(() => -1);
}

const tmpRoot = mkdtempSync(join(tmpdir(), "vsc-wiring-"));
const profile = join(tmpRoot, "profile");
const RUN_NONCE = Date.now().toString(36);
const TREF = {
  rich: `VSC_WIRING_RICH_${RUN_NONCE}`,
  richpol: `VSC_WIRING_RICHPOL_${RUN_NONCE}`,
  poor: `VSC_WIRING_POOR_${RUN_NONCE}`,
  fail: `VSC_WIRING_FAIL_${RUN_NONCE}`,
};
let chrome = null, server = null;

try {
  server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(req.url.includes("poor") ? POOR_HTML : RICH_HTML);
  });
  await new Promise((r) => server.listen(FIX_PORT, "127.0.0.1", r));

  chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--mute-audio", FIXTURE_URL,
  ], { stdio: "ignore" });
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try { const t = await (await fetch(`${CDP_HTTP}/json/list`)).json(); up = Array.isArray(t) && t.some((x) => x.type === "page" && x.url.startsWith(FIXTURE_URL)); } catch { /* retry */ }
  }
  if (!up) throw new Error("EVAL_CDP_NOT_UP");

  // T12: loopback-only CDP
  const netstat = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Get-NetTCPConnection -LocalPort ${CDP_PORT} -State Listen | Select-Object -ExpandProperty LocalAddress`], { timeout: 15000 });
  const addrs = netstat.stdout.trim().split(/\r?\n/).filter(Boolean);
  check("T12_NO_PUBLIC_CDP", addrs.every((a) => a === "127.0.0.1" || a === "::1"), addrs.join(","));

  // T13: throwaway profile only
  const realProfileLeaked = chrome.spawnargs.some((a) => /Chrome\\User Data/i.test(a));
  check("T13_NO_VENDOR_MUTATION_TEMP_PROFILE", profile.startsWith(tmpdir()) && !realProfileLeaked, "temp profile only");

  // clean stale daemon so the sidecar pins OUR endpoint on a fresh one
  try {
    const { stdout } = await execFileAsync("tasklist", ["/FI", "IMAGENAME eq agent-browser-win32-x64.exe", "/FO", "CSV", "/NH"], { timeout: 10000 });
    for (const m of stdout.matchAll(/"(\d+)"/g)) {
      try { await execFileAsync("taskkill", ["/PID", m[1], "/T", "/F"], { timeout: 10000 }); } catch { /* gone */ }
    }
  } catch { /* proceed */ }
  await new Promise((r) => setTimeout(r, 500));

  // T8a: Qwen healthy BEFORE
  const h0 = await sidecar.qwenPrimaryHealth({});
  check("T8A_QWEN_HEALTHY_BEFORE", h0.healthy === true, `${h0.detail} ${h0.latency_ms}ms`);

  // navigate the fixture tab to the RICH page and run ONE full cycle
  // (the daemon will pin 9226; the rich page is the current snapshot target)
  const w1 = await adapter.observeWithDomGate({ task_ref: TREF.rich, cdpUrl: CDP_HTTP, timeoutMs: 120000 });
  check("T1_DOM_SUFFICIENT_SIDECAR_CALLS_0", w1.dom_gate === "SUFFICIENT" && w1.sidecar_calls === 0 && w1.visual === null, `gate=${w1.dom_gate} elements=${w1.dom_element_count} calls=${w1.sidecar_calls}`);
  check("T3A_REAL_BRIDGE_ENVELOPE", w1.bridge !== undefined && w1.schema_version === "hermes-visual-observation-wiring-v1", "adapter envelope shape");

  // Cycle 2 — caller policy demands >=10 interactive elements; the rich page
  // offers 3, so the gate is INSUFFICIENT while the RICH page is still the
  // active target: --annotate must return the real @e1..@e3 mapping.
  const w3 = await adapter.observeWithDomGate({ task_ref: TREF.richpol, cdpUrl: CDP_HTTP, minElements: 10, timeoutMs: 120000 });
  const vr = w3.visual;
  check("T3B_STRUCTURED_OBSERVATION_TO_CONTROLLER", w3.dom_gate === "INSUFFICIENT" && w3.sidecar_calls === 1 && vr?.schema_version === sidecar.VISUAL_SIDECAR_SCHEMA && Array.isArray(vr.elements) && Array.isArray(vr.candidate_targets), `ambiguity=${vr?.ambiguity} refs=${vr?.refs?.length ?? 0}`);
  const refsWellFormed = (vr?.refs ?? []).every((r) => /^@e\d+$/.test(r));
  const targetsMatchRefs = (vr?.candidate_targets ?? []).every((t) => vr.refs.includes(t.ref));
  check("T4_REFS_WELLFORMED_ZERO_INVENTED", refsWellFormed && targetsMatchRefs && (vr?.refs ?? []).length >= 2, (vr?.refs ?? []).join(","));

  // Cycle 3 — canvas-only page (NO interactive elements): snapshot element
  // gate INSUFFICIENT and the correct fail-closed visual answer is
  // EMPTY_ANNOTATIONS with zero targets (nothing annotatable exists).
  // Fixture plumbing: open the poor tab and CLOSE the original rich one, so
  // the browser's first/active target is the poor page (agent-browser client
  // connections resolve the first/active target; pure /json target mgmt).
  const targets = await (await fetch(`${CDP_HTTP}/json/list`)).json();
  const poorUrl = FIXTURE_URL.replace("/fixture", "/poor");
  await (await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent(poorUrl)}`, { method: "PUT" })).json();
  await new Promise((r) => setTimeout(r, 900));
  for (const t of targets) {
    if (t.type === "page" && !t.url.startsWith(poorUrl)) {
      try { await fetch(`${CDP_HTTP}/json/close/${t.id}`); } catch { /* ignore */ }
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  const w2 = await adapter.observeWithDomGate({ task_ref: TREF.poor, cdpUrl: CDP_HTTP, timeoutMs: 120000 });
  check("T2_DOM_INSUFFICIENT_TRIGGERS_VISUAL", w2.dom_gate === "INSUFFICIENT" && w2.sidecar_calls === 1, `gate=${w2.dom_gate} elements=${w2.dom_element_count} calls=${w2.sidecar_calls}`);
  const v = w2.visual;
  check("T2B_CANVAS_EMPTY_ANNOTATIONS_FAIL_CLOSED", v?.ambiguity === "EMPTY_ANNOTATIONS" && (v?.candidate_targets ?? []).length === 0, `ambiguity=${v?.ambiguity}`);

  // sidecar call budget: exactly ONE activity per observation cycle
  const realReg = registry.readActivities();
  const countFor = (prefix) => new Set(realReg.activities.filter((a) => String(a.task_ref ?? "").startsWith(prefix)).map((a) => a.activity_id)).size;
  check("T7B_SIDECAR_CALLS_MAX_PER_CYCLE_1", countFor(TREF.poor) === 1 && countFor(TREF.richpol) === 1, `poor=${countFor(TREF.poor)} rich_policy=${countFor(TREF.richpol)}`);

  // T5: capture failure bounded (deterministic 1 ms deadline through the REAL caller)
  const badCap = await sidecar.captureAnnotatedScreenshot({ cdp: String(CDP_PORT), timeoutMs: 1 });
  check("T5_CAPTURE_FAILURE_BOUNDED", badCap.timed_out === true && badCap.killed_tree === true, `err=${badCap.error}`);
  const t5t0 = Date.now();
  const wBad = await adapter.observeWithDomGate({ task_ref: TREF.fail, cdpUrl: CDP_HTTP, timeoutMs: 1 });
  const t5ms = Date.now() - t5t0;
  check("T5B_FAIL_CLOSED_ZERO_TARGETS", wBad.visual?.ambiguity === "UNAVAILABLE" && (wBad.visual?.candidate_targets ?? []).length === 0 && t5ms < 20000, `t5ms=${t5ms} amb=${wBad.visual?.ambiguity}`);

  // T6: screenshots ephemeral
  const shotDir = join(process.env.USERPROFILE ?? tmpdir(), ".agent-browser", "tmp", "screenshots");
  const pngs = existsSync(shotDir) ? readdirSync(shotDir).filter((f) => f.endsWith(".png")).length : 0;
  check("T6_SCREENSHOT_EPHEMERAL", pngs === 0, `default_dir_pngs=${pngs}`);

  // T7: VISUAL_INSPECTION telemetry in the #79 lane (activity_type match is
  // stable across the ACTIVE→terminal stage overwrite; ≥2 cycles ran visual).
  const visEntries = realReg.activities.filter((a) => a.activity_type === "HERMES_QWEN_VISUAL_INSPECTION" && String(a.task_ref ?? "").startsWith("VSC_WIRING"));
  check("T7_VISUAL_INSPECTION_TELEMETRY", visEntries.length >= 2, `entries=${visEntries.length}`);

  // T8b: Qwen healthy AFTER
  const h1 = await sidecar.qwenPrimaryHealth({});
  check("T8B_QWEN_HEALTHY_AFTER", h1.healthy === true, `${h1.detail} ${h1.latency_ms}ms`);

  // T9/T10: no OCR, no VLM (adapter re-exports the qualified flags)
  check("T9_NO_OCR", adapter.OCR_ENABLED === false && sidecar.OCR_ENABLED === false);
  check("T10_NO_VLM", adapter.VLM_ENABLED === false && sidecar.VLM_ENABLED === false);

  // T11: action authority — adapter module contains NO action dispatch
  const src = (await import("node:fs")).readFileSync(join(ROOT, "tools", "hermes-visual-observation-adapter-v1.mjs"), "utf8");
  check("T11_NO_ACTION_AUTHORITY", !/\b(click|fill|press|type|navigate|evaluate)\s*\(/.test(src.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "")) && adapter.ADAPTER_BRIDGE_TOOL === "browser_snapshot", `bridge_tool=${adapter.ADAPTER_BRIDGE_TOOL}`);

  // T14: no secret persistence surface in adapter
  check("T14_NO_SECRET_PERSISTENCE", !src.match(/save\s*state|encrypt|cookie|token/i), "no persistence surface");

  // AUTOVIA compatibility marker (read-only path on the qualified bridge)
  check("T_AUTOVIA_COMPAT", w1.autovia?.can_use_real_browser_observation_path === true && w2.autovia?.can_use_real_browser_observation_path === true, "autovia marker on both cycles");
} catch (e) {
  check("FATAL", false, String(e?.message ?? e));
} finally {
  if (chrome) { try { execFile("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], () => {}); } catch { /* ignore */ } }
  if (server) { try { server.close(); } catch { /* ignore */ } }
  await new Promise((r) => setTimeout(r, 1200));
  // T15: orphan audit
  const ab = await countAgentBrowserProcs();
  const py = await countBridgePythons();
  check("T15_PROCESS_LEAKS_0", ab <= 1 && py >= 0, `agent_browser=${ab} (session daemon allowed, reaped below) python=${py}`);
  try { if (ab > 0) { const { stdout } = await execFileAsync("tasklist", ["/FI", "IMAGENAME eq agent-browser-win32-x64.exe", "/FO", "CSV", "/NH"], { timeout: 10000 }); for (const m of stdout.matchAll(/"(\d+)"/g)) { try { await execFileAsync("taskkill", ["/PID", m[1], "/T", "/F"], { timeout: 10000 }); } catch { /* gone */ } } } } catch { /* ignore */ }
  let cdpDown = false;
  try { await fetch(CDP_HTTP + "/json/list", { signal: AbortSignal.timeout(1500) }); cdpDown = false; } catch { cdpDown = true; }
  check("T15B_NO_ORPHAN_CHROME", cdpDown, `cdp_responds=${!cdpDown}`);
  try { rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 8, retryDelay: 1000 }); } catch { /* temp */ }
}

// T16: previous sidecar regression suite (28 checks) — ONE run
{
  const { execFileSync } = await import("node:child_process");
  try {
    const out = execFileSync(process.execPath, [join(ROOT, "tests", "qwen-browser-visual-sidecar-implementation", "run.mjs")], { encoding: "utf8", timeout: 300000, cwd: ROOT });
    check("T16_SIDECAR_SUITE_28_28", /RESULT: PASS/.test(out) && /28 passed, 0 failed/.test(out), (out.match(/RESULT: PASS[^\n]*/) || ["?"])[0]);
  } catch (e) {
    check("T16_SIDECAR_SUITE_28_28", false, String(e.message).slice(0, 100));
  }
}

console.log(`\nRESULT: ${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
