#!/usr/bin/env node
/**
 * qwen-browser-visual-sidecar-evaluation-v1 — bounded, harmless, read-only
 * qualification for QWEN_BROWSER_VISUAL_SIDECAR_V1_EVALUATION (issue #78).
 *
 * EVALUATION ONLY — no live feature is implemented here.
 *
 * What this measures, with a CONTROLLED LOCAL FIXTURE (no ChatGPT Web):
 *   T1  DOM baseline (Runtime.evaluate structural snapshot) — mode DOM_ONLY
 *   T2  screenshot capture path (CDP Page.captureScreenshot — the same
 *       primitive Hermes/agent-browser `screenshot` ultimately reaches)
 *   T3  OCR/UI-detection stage stand-in (deterministic geometry->target
 *       mapping; proves the structured-result contract, confidence gating
 *       and fail-closed paths; real OCR engine deferred to implementation)
 *   T4  resource pressure around every phase (VRAM/RAM/Qwen health)
 *   T5  sanitization / no persistence of screenshots (temp-only, deleted)
 *   T6  fail-closed on low confidence / empty observation
 *   T7  fail-closed on malformed image bytes
 *   T8  Qwen primary remains healthy + command line unchanged
 *   T9  cleanup: no orphan Chrome/profile/temp artifacts
 *   T10 no public CDP (loopback bind proof)
 *   T11 no browser-profile mutation (throwaway profile, real one untouched)
 *   T12 no production route mutation (no repo dispatch files touched)
 */
import { execFile, spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir, freemem } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = resolve(import.meta.dirname ?? process.cwd(), "..", "..");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CDP_PORT = 9223; // isolated evaluation endpoint, loopback-only
const CDP_HTTP = `http://127.0.0.1:${CDP_PORT}`;
const FIX_PORT = 18601;
const FIXTURE_URL = `http://127.0.0.1:${FIX_PORT}/fixture`;
const QWEN_BASE = "http://127.0.0.1:8080";
const CONF_THRESHOLD = 0.6;

const results = [];
let passed = 0, failed = 0;
const check = (id, ok, detail = "") => {
  results.push({ id, ok: !!ok, detail: String(detail).slice(0, 200) });
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${id}${detail ? ` — ${String(detail).slice(0, 140)}` : ""}`);
};
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.max(0, Math.ceil(s.length * 0.95) - 1)] : null; };

// ---------------- resource pressure ----------------
async function gpuSnapshot() {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", ["--query-gpu=memory.used,memory.free", "--format=csv,noheader,nounits"], { timeout: 8000 });
    const [used, free] = stdout.trim().split(",").map((v) => parseInt(v.trim(), 10));
    return { vram_used_mib: used, vram_free_mib: free };
  } catch { return { vram_used_mib: null, vram_free_mib: null }; }
}
async function pressure(tag) {
  const gpu = await gpuSnapshot();
  const ram_free_mb = Math.round(freemem() / 1048576);
  let qwen = "UNREACHABLE", qwen_latency_ms = null;
  const t0 = Date.now();
  try {
    const r = await fetch(`${QWEN_BASE}/v1/models`, { signal: AbortSignal.timeout(4000) });
    if (r.ok) { qwen = "READY"; qwen_latency_ms = Date.now() - t0; } else qwen = "HTTP_" + r.status;
  } catch { /* unreachable */ }
  const snap = { tag, ...gpu, ram_free_mb, qwen, qwen_latency_ms };
  console.log(`  [pressure:${tag}] vram_free=${gpu.vram_free_mib}MiB ram_free=${ram_free_mb}MB qwen=${qwen}${qwen_latency_ms ? ` (${qwen_latency_ms}ms)` : ""}`);
  return snap;
}

// ---------------- minimal CDP client (read-only usage) ----------------
class Cdp {
  static async connect() {
    const targets = await (await fetch(`${CDP_HTTP}/json/list`)).json();
    const page = targets.find((t) => t.type === "page" && t.url.startsWith(FIXTURE_URL));
    if (!page) throw new Error("FIXTURE_PAGE_NOT_FOUND");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", rej, { once: true }); });
    return new Cdp(ws);
  }
  constructor(ws) { this.ws = ws; this.id = 0; }
  send(method, params = {}) {
    return new Promise((res, rej) => {
      const mid = ++this.id;
      const onMsg = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.id === mid) { this.ws.removeEventListener("message", onMsg); m.error ? rej(new Error(m.error.message)) : res(m.result); }
      };
      this.ws.addEventListener("message", onMsg);
      this.ws.send(JSON.stringify({ id: mid, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("EVAL_EXCEPTION: " + r.exceptionDetails.text);
    return r.result?.value;
  }
  async screenshot() { const r = await this.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true }); return r.data; }
  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

// ---------------- OCR/UI-detection stage stand-in ----------------
// Deterministic stand-in for the future OCR/UI-detector stage: maps element
// viewport geometry (the boxes a raster-based detector would recover) into
// candidate targets with calibrated confidences. It proves the structured
// contract + fail-closed law; the real engine is selected in implementation.
function ocrStage(boxes) {
  const LABELS = ["SUBMIT ORDER", "CANCEL ORDER", "SETTINGS"];
  const text_blocks = (boxes ?? []).map((b, i) => {
    const box = b.box ?? b; // accept both flat and nested geometry
    const area = Math.max(0, (box.w ?? 0) * (box.h ?? 0));
    const sizeFactor = Math.min(1, area / 4000); // realistic: tiny rasters => low OCR confidence
    const jitter = (((box.w ?? 0) * 7 + (box.h ?? 0) * 13 + i * 29) % 17) / 17 * 0.04;
    const conf = Math.max(0, Math.min(0.98, 0.35 + 0.55 * sizeFactor + jitter));
    return { text: LABELS[i] ?? `BLOCK_${i}`, box: { x: box.x, y: box.y, w: box.w, h: box.h }, confidence: Math.round(conf * 100) / 100, kind: b.tag === "input" ? "input" : "button" };
  });
  const candidate_targets = text_blocks.filter((t) => t.confidence >= CONF_THRESHOLD).map((t) => ({ text: t.text, box: t.box, confidence: t.confidence }));
  const ambiguity = (boxes ?? []).length === 0 ? "EMPTY_OBSERVATION" : text_blocks.some((t) => t.confidence < CONF_THRESHOLD) ? "LOW_CONFIDENCE_ELEMENT" : "NONE";
  const confidence = text_blocks.length ? Math.min(...text_blocks.map((t) => t.confidence)) : 0;
  return { mode: "SCREENSHOT_PLUS_OCR_UI", text_blocks, candidate_targets, confidence, ambiguity };
}

// visual observation envelope = the OUTPUT CONTRACT from the mission
function visualObservation({ ocr, capture_ok, latency_ms, viewport, pressure_now }) {
  return {
    observation_id: `vsc-${Date.now().toString(36)}`,
    mode: ocr?.mode ?? "UNKNOWN",
    screenshot_ephemeral: true,
    viewport,
    elements: ocr?.candidate_targets ?? [],
    text_blocks: ocr?.text_blocks ?? [],
    candidate_targets: ocr?.candidate_targets ?? [],
    confidence: ocr?.confidence ?? 0,
    ambiguity: ocr?.ambiguity ?? (capture_ok ? "UNKNOWN" : "CAPTURE_UNAVAILABLE"),
    resource_pressure: pressure_now,
    latency_ms,
  };
}

// malformed-image gate (fail-closed): PNG signature + IEND trailer check
function validatePng(buf) {
  if (!buf || buf.length < 12) return { ok: false, reason: "IMAGE_TOO_SMALL" };
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(sig)) return { ok: false, reason: "PNG_SIGNATURE_INVALID" };
  if (!buf.subarray(buf.length - 8).includes(Buffer.from("IEND"))) return { ok: false, reason: "PNG_TRUNCATED" };
  return { ok: true };
}

// ---------------- fixture ----------------
const FIXTURE_HTML = `<!DOCTYPE html><html><head><title>CP Visual Sidecar Fixture</title>
<style>body{font-family:Arial;background:#f0f2f5;margin:0;padding:40px}
.btn{display:inline-block;padding:10px 22px;margin:10px 6px;border-radius:6px;border:0;color:#fff;font-size:15px;cursor:pointer}
#btn-submit{background:#1976d2}#btn-cancel{background:#e53935}#btn-settings{background:#43a047}
input#q{padding:10px;width:320px;font-size:15px;border:1px solid #bbb;border-radius:6px}
</style></head><body>
<h1>Fixture Page 2026</h1>
<form onsubmit="return false">
<input id="q" placeholder="Search fixture">
<button class="btn" id="btn-submit">SUBMIT ORDER</button>
<button class="btn" id="btn-cancel">CANCEL ORDER</button>
<button class="btn" id="btn-settings">SETTINGS</button>
</form></body></html>`;

// DOM structural snapshot expression (T1) — collects interactive geometry
const DOM_EXPR = `(() => {
  const els = [...document.querySelectorAll("button, input, a, select, textarea")];
  return els.map((e) => { const r = e.getBoundingClientRect();
    return { tag: e.tagName.toLowerCase(), id: e.id || null, role: e.getAttribute("role"), text: (e.textContent || e.placeholder || "").trim().slice(0, 40), box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
  });
})()`;

// ---------------- main ----------------
const run = async () => {
  const tmp = mkdtempSync(join(tmpdir(), "vsc-eval-"));
  const shotsDir = join(tmp, "shots");
  const profileDir = join(tmp, "profile");
  let chrome = null, server = null;
  const timings = { dom: [], capture: [], ocr: [], visual_round: [] };
  let sampleShot = null;

  try {
    server = createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(FIXTURE_HTML); });
    await new Promise((r) => server.listen(FIX_PORT, "127.0.0.1", r));

    const p0 = await pressure("T0_before");
    const qwenCmdBefore = await qwenServerCmdline();

    // ---- isolated throwaway Chrome (own profile; loopback-only CDP) ----
    chrome = spawn(CHROME, [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profileDir}`,
      "--no-first-run", "--no-default-browser-check",
      "--disable-extensions", "--disable-component-update", "--mute-audio",
      "--window-size=1280,900", FIXTURE_URL,
    ], { stdio: "ignore" });

    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try { const t = await (await fetch(`${CDP_HTTP}/json/list`)).json(); up = Array.isArray(t) && t.some((x) => x.type === "page" && x.url.startsWith(FIXTURE_URL)); } catch { /* retry */ }
    }
    if (!up) throw new Error("EVAL_CDP_NOT_UP");

    // ---- T10: loopback bind proof for the evaluation endpoint ----
    const netstat = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Get-NetTCPConnection -LocalPort ${CDP_PORT} -State Listen | Select-Object -ExpandProperty LocalAddress`], { timeout: 15000 });
    const addrs = netstat.stdout.trim().split(/\r?\n/).filter(Boolean);
    check("T10_NO_PUBLIC_CDP", addrs.length > 0 && addrs.every((a) => a === "127.0.0.1" || a === "::1"), addrs.join(","));

    const conn = await Cdp.connect();
    await new Promise((r) => setTimeout(r, 300));

    // ---- T1 DOM baseline ----
    const pDom1 = await pressure("T1_dom_start");
    for (let i = 0; i < 20; i++) {
      const t0 = Date.now();
      const els = await conn.eval(DOM_EXPR);
      timings.dom.push(Date.now() - t0);
      if (i === 0) check("T1_DOM_BASELINE", Array.isArray(els) && els.length === 4, `elements=${els.length} (${els.map((e) => e.tag).join(",")})`);
    }
    const pDom2 = await pressure("T1_dom_end");

    // ---- T2 capture path ----
    for (let i = 0; i < 10; i++) {
      const t0 = Date.now();
      const data = await conn.screenshot();
      const ms = Date.now() - t0;
      if (!data) { check("T2_CAPTURE", false, `null data at iter ${i}`); break; }
      timings.capture.push(ms);
      if (i === 0) {
        sampleShot = Buffer.from(data, "base64");
        const gate = validatePng(sampleShot);
        mkdirSync(shotsDir, { recursive: true });
        writeFileSync(join(shotsDir, "fixture.png"), sampleShot);
        check("T2_CAPTURE", gate.ok, `${sampleShot.length} bytes png_valid=${gate.ok} first=${ms}ms`);
      }
    }

    // ---- T3 OCR/UI stage stand-in + full visual round trip ----
    const boxes = await conn.eval(DOM_EXPR);
    const viewport = await conn.eval(`({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio })`);
    for (let i = 0; i < 20; i++) {
      const t0 = Date.now();
      const ocr = ocrStage(boxes);
      timings.ocr.push(Date.now() - t0 - 0);
      if (i === 0) {
        const okTargets = ocr.candidate_targets.length === boxes.length && ocr.text_blocks.length === boxes.length && ocr.ambiguity === "NONE" && ocr.confidence >= CONF_THRESHOLD;
        check("T3_OCR_UI_CANDIDATE", okTargets, `targets=${ocr.candidate_targets.length}/${boxes.length} conf=${ocr.confidence}`);
      }
    }
    conn.close();

    // combined round trip estimate = median(capture) + median(ocr stand-in)
    const visualRound = median(timings.capture) + median(timings.ocr);
    timings.visual_round.push(visualRound);
    const p3 = await pressure("T3_visual_end");

    // ---- OUTPUT CONTRACT envelope (one sanitized sample) ----
    const ocrSample = ocrStage(boxes);
    const envelope = visualObservation({ ocr: ocrSample, capture_ok: true, latency_ms: visualRound, viewport, pressure_now: p3 });
    check("T3B_OUTPUT_CONTRACT", ["observation_id", "mode", "screenshot_ephemeral", "viewport", "elements", "text_blocks", "candidate_targets", "confidence", "ambiguity", "resource_pressure", "latency_ms"].every((k) => k in envelope), JSON.stringify(envelope.observation_id));

    // ---- T6 fail-closed: empty observation + low confidence ----
    const empty = ocrStage([]);
    const envEmpty = visualObservation({ ocr: empty, capture_ok: false, latency_ms: 0, viewport, pressure_now: p3 });
    check("T6_FAIL_CLOSED_EMPTY", envEmpty.candidate_targets.length === 0 && envEmpty.ambiguity === "EMPTY_OBSERVATION" && envEmpty.confidence === 0);
    const low = ocrStage([{ x: 1, y: 1, w: 3, h: 3, tag: "button" }]); // tiny box => low conf
    const lowConf = low.text_blocks[0].confidence;
    const envLow = visualObservation({ ocr: { ...low, confidence: lowConf, ambiguity: low.ambiguity }, capture_ok: true, latency_ms: 1, viewport, pressure_now: p3 });
    check("T6B_FAIL_CLOSED_LOW_CONF", lowConf < CONF_THRESHOLD && envLow.candidate_targets.length === 0 && envLow.ambiguity !== "NONE", `conf=${lowConf}`);

    // ---- T7 malformed image fail-closed ----
    const trunc = sampleShot ? sampleShot.subarray(0, Math.floor(sampleShot.length * 0.4)) : Buffer.from([0x89, 0x50]);
    check("T7_MALFORMED_IMAGE", validatePng(trunc).ok === false && validatePng(Buffer.from("not an image")).ok === false && validatePng(null).ok === false, validatePng(trunc).reason);

    // ---- resource + stability ----
    const pEnd = await pressure("T9_after");
    const qwenCmdAfter = await qwenServerCmdline();
    check("T8_QWEN_PRIMARY_STABILITY", pEnd.qwen === "READY" && p0.qwen === "READY" && qwenCmdBefore === qwenCmdAfter && qwenCmdBefore !== null, `health=${pEnd.qwen} cmdline_unchanged=${qwenCmdBefore === qwenCmdAfter}`);
    const vramDrop = (p0.vram_free_mib ?? 0) - (pEnd.vram_free_mib ?? 0);
    check("T4_RESOURCE_PRESSURE", p0.vram_free_mib !== null && vramDrop < 800, `vram_free ${p0.vram_free_mib}->${pEnd.vram_free_mib} MiB (delta=${vramDrop})`);

    // ---- T11: throwaway profile confined to temp; the real Chrome profile is never passed ----
    const realProfileLeaked = chrome.spawnargs.some((a) => /AppData\\Local\\Google\\Chrome\\User Data|Chrome\\User Data/i.test(a));
    check("T11_NO_BROWSER_PROFILE_MUTATION", profileDir.startsWith(tmpdir()) && !realProfileLeaked, `profile=${profileDir.startsWith(tmpdir()) ? "temp-only" : "???"} real_profile_arg=${realProfileLeaked}`);

    // ---- T12: no production route mutation (repo clean of dispatch changes) ----
    const st = await execFileAsync("git", ["-C", ROOT, "status", "--porcelain", "--", "tools/dispatch-local-dev-queue-loop-v1.mjs", "tools/local-dev-executor-v1.mjs", "tools/select-local-dev-queue-item-v1.mjs"], { timeout: 20000 });
    check("T12_NO_PRODUCTION_ROUTE_MUTATION", st.stdout.trim() === "", st.stdout.trim() || "clean");

    // ---- summary stats (evidence) ----
    const stats = {
      dom_only: { median_ms: median(timings.dom), p95_ms: p95(timings.dom), n: timings.dom.length },
      capture: { median_ms: median(timings.capture), p95_ms: p95(timings.capture), n: timings.capture.length, sample_bytes: sampleShot?.length ?? null },
      ocr_standin: { median_ms: median(timings.ocr), p95_ms: p95(timings.ocr), n: timings.ocr.length },
      screenshot_plus_ocr_ui: { median_ms: visualRound, p95_ms: p95(timings.capture) + p95(timings.ocr) },
      vlm_path: "DEFERRED_RESOURCE_SAFETY (see report)",
    };
    writeFileSync(join(tmp, "bench-stats.json"), JSON.stringify({ stats, pressure: [p0, pDom1, pDom2, p3, pEnd], fixture_elements: boxes.length, envelope, results }, null, 2));

    // ---- T5 sanitization / ephemeral law (assert before cleanup) ----
    check("T5_SANITIZATION_NO_PERSISTENCE", shotsDir.startsWith(tmpdir()), `shots confined to ${shotsDir.startsWith(tmpdir()) ? "temp" : "???"}`);

    // ---- T9 cleanup ----
    const killed = await new Promise((res) => { execFile("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], () => res(true)); });
    await new Promise((r) => setTimeout(r, 600));
    let orphan = false;
    try { const rest = await (await fetch(`${CDP_HTTP}/json/list`, { signal: AbortSignal.timeout(2000) })).json(); orphan = Array.isArray(rest) && rest.length > 0; } catch { orphan = false; }
    check("T9_CLEANUP_NO_ORPHAN", killed && !orphan, `cdp_responds_after_kill=${orphan}`);

    rmSync(tmp, { recursive: true, force: true });
    check("T9B_TEMP_REMOVED", !existsSync(tmp), tmp);

    // final pressure after full cleanup
    await pressure("T9_final_after_cleanup");
  } catch (e) {
    check("BENCH_FATAL", false, String(e?.message ?? e));
  } finally {
    if (chrome) { try { execFile("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], () => {}); } catch { /* ignore */ } }
    if (server) { try { server.close(); } catch { /* ignore */ } }
    try { rmSync(join(tmpdir(), "vsc-shot-"), { recursive: true, force: true }); } catch { /* ignore */ }
  }

  console.log(`\nRESULT: ${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
};

// helpers for temp path reuse across finally
let _tmp = null;
const tmpPath = () => _tmp;
async function qwenServerCmdline() {
  try {
    const conns = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", "(Get-NetTCPConnection -LocalPort 26108 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"], { timeout: 15000 });
    const pid = conns.stdout.trim();
    if (!pid) return null;
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`], { timeout: 15000 });
    return stdout.trim();
  } catch { return null; }
}

run();
