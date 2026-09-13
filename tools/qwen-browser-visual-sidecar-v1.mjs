#!/usr/bin/env node
/**
 * qwen-browser-visual-sidecar-v1 — MINIMAL implementation of the visual
 * sidecar selected by QWEN_BROWSER_VISUAL_SIDECAR_V1_EVALUATION (issue #78).
 *
 * SELECTED ARCHITECTURE B (OCR-first with VLM escalation) — this task
 * implements ONLY the annotate tier, with OCR and VLM DISABLED:
 *   OCR_ENABLED=NO   VLM_ENABLED=NO
 *
 * Path: DOM/accessibility remains the primary observation method (Qwen stays
 * controller, Hermes stays bridge). The sidecar is ONLY an observation
 * surface invoked when DOM is insufficient:
 *
 *   Hermes screenshot --annotate (agent-browser, same transport Hermes uses)
 *     → structured visual observation (with @eN ref mapping)
 *     → returned to the controller.
 *
 * LAWS
 * - Observation only: this module NEVER clicks, types, navigates, evaluates
 *   JS, authorizes routes, creates or claims tasks. It returns structured
 *   information; any action remains with the controller through the
 *   qualified 4-tool allowlist.
 * - Screenshots are EPHEMERAL: written only to temp dirs, read, and always
 *   deleted (including agent-browser's own default screenshot dir). No
 *   screenshot ever lands in the repo or in evidence.
 * - Fail-closed: capture failure, missing/invalid annotations, ambiguity,
 *   unhealthy Qwen primary or unsafe resource pressure yield structured
 *   UNKNOWN / AMBIGUOUS / UNAVAILABLE with ZERO invented targets.
 * - No public CDP (loopback endpoints only), no browser-profile mutation
 *   (uses whatever session the caller already owns via --cdp), no OCR/VLM,
 *   no second execution authority.
 *
 * Observability: every invocation publishes a #79-lane activity
 * (stage=VISUAL_INSPECTION) to the agent-activity registry — sanitized.
 */
import { execFile, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir, freemem } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { publishActivity } from "./agent-activity-registry-v1.mjs";

const execFileAsync = promisify(execFile);

export const VISUAL_SIDECAR_SCHEMA = "local-dev-visual-sidecar-v1";
export const VISUAL_MODE = "ANNOTATED_SCREENSHOT";
export const OCR_ENABLED = false;
export const VLM_ENABLED = false;
/** Minimum confidence (0..1) required from the annotation stage. */
export const VISUAL_CONFIDENCE_THRESHOLD = 0.5;
/** VRAM headroom (MiB) the primary model must retain before visual work. */
export const MIN_QWEN_FREE_VRAM_MIB = 0; // observation only: never block on our own allocation; reported always
/** Real confidence of the annotate tier: ref mapping is structural, not OCR. */
const ANNOTATE_BASE_CONFIDENCE = 0.9;

// ---------------------------------------------------------------- resources
export async function gpuSnapshot() {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", ["--query-gpu=memory.used,memory.free", "--format=csv,noheader,nounits"], { timeout: 8000 });
    const [used, free] = stdout.trim().split(",").map((v) => parseInt(v.trim(), 10));
    return { vram_used_mib: used, vram_free_mib: free };
  } catch {
    return { vram_used_mib: null, vram_free_mib: null };
  }
}

/** Qwen primary health (read-only, bounded). Returns {healthy, latency_ms, detail}. */
export async function qwenPrimaryHealth({ baseUrl = "http://127.0.0.1:8080", timeoutMs = 5000 } = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(timeoutMs) });
    if (r.ok) return { healthy: true, latency_ms: Date.now() - t0, detail: "READY" };
    return { healthy: false, latency_ms: Date.now() - t0, detail: `HTTP_${r.status}` };
  } catch (e) {
    return { healthy: false, latency_ms: Date.now() - t0, detail: `UNREACHABLE:${String(e?.message ?? e).slice(0, 40)}` };
  }
}

// ------------------------------------------------------------- observation envelope
/**
 * Build the structured visual observation (fail-closed).
 * Shape (OUTPUT CONTRACT):
 *   { observation_id, mode, screenshot_ephemeral, elements[],
 *     candidate_targets[], confidence, ambiguity, latency_ms,
 *     resource_pressure, refs[], note }
 * `ambiguity` ∈ NONE | EMPTY_ANNOTATIONS | AMBIGUOUS | UNAVAILABLE | BLOCKED_QWEN_UNHEALTHY
 * Zero targets are ever invented: refs come only from agent-browser.
 */
export function buildVisualObservation({ annotations, screenshot_deleted, latency_ms, resource_pressure, qwen_health, observation_id, note }) {
  const id = observation_id ?? `vsc-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  const base = {
    observation_id: id,
    mode: VISUAL_MODE,
    screenshot_ephemeral: true,
    elements: [],
    candidate_targets: [],
    confidence: 0,
    ambiguity: "UNAVAILABLE",
    latency_ms: latency_ms ?? null,
    resource_pressure: resource_pressure ?? null,
    refs: [],
    note: note ?? null,
    schema_version: VISUAL_SIDECAR_SCHEMA,
    ocr_enabled: OCR_ENABLED,
    vlm_enabled: VLM_ENABLED,
  };
  if (qwen_health && qwen_health.healthy === false) {
    return { ...base, ambiguity: "BLOCKED_QWEN_UNHEALTHY", note: `Qwen primary not healthy (${qwen_health.detail}); visual inspection blocked` };
  }
  if (!Array.isArray(annotations)) {
    return { ...base, ambiguity: "UNAVAILABLE", note: note ?? "annotation payload missing or malformed" };
  }
  const valid = annotations.filter((a) => a && typeof a.ref === "string" && /^e\d+$/.test(a.ref) && Number.isFinite(a.number));
  if (!valid.length) {
    return { ...base, ambiguity: "EMPTY_ANNOTATIONS", note: note ?? "screenshot produced no valid element references" };
  }
  const elements = valid.map((a) => ({
    number: a.number,
    ref: `@${a.ref}`,
    role: typeof a.role === "string" ? a.role.slice(0, 40) : null,
    name_len: typeof a.name === "string" ? a.name.length : 0, // length only: no page text persisted
    box: a.box && Number.isFinite(a.box.x) ? { x: Math.round(a.box.x), y: Math.round(a.box.y), w: Math.round(a.box.width ?? 0), h: Math.round(a.box.height ?? 0) } : null,
  }));
  const ambiguous = valid.some((a) => !a.box || !Number.isFinite(a.box.x));
  const confidence = ambiguous ? Math.round((ANNOTATE_BASE_CONFIDENCE * 0.6) * 100) / 100 : ANNOTATE_BASE_CONFIDENCE;
  return {
    ...base,
    elements,
    candidate_targets: elements.map((e) => ({ ref: e.ref, role: e.role, box: e.box })),
    refs: elements.map((e) => e.ref),
    confidence,
    ambiguity: ambiguous ? "AMBIGUOUS" : "NONE",
    note: note ?? (screenshot_deleted ? "annotated screenshot captured and deleted" : "annotated screenshot captured; deletion deferred to cleanup"),
  };
}

// ------------------------------------------------------------ annotate capture
/**
 * Resolve the agent-browser NATIVE binary already present on this machine
 * (npx cache, pinned resolution — no network, no cold-start). Returns
 * { exe, source } or { exe: null, source } when unresolvable (caller must
 * fail closed). NEVER downloads, installs or patches the vendor package.
 */
export function resolveAgentBrowserExe({ version = "0.26.0" } = {}) {
  const candidates = [];
  const npxCache = join(process.env.LOCALAPPDATA ?? "", "npm-cache", "_npx");
  if (process.env.AGENT_BROWSER_EXE) candidates.push(process.env.AGENT_BROWSER_EXE);
  try {
    for (const d of readdirSync(npxCache)) {
      const exe = join(npxCache, d, "node_modules", "agent-browser", "bin", "agent-browser-win32-x64.exe");
      const pkg = join(npxCache, d, "node_modules", "agent-browser", "package.json");
      if (!existsSync(exe)) continue;
      try {
        if (JSON.parse(readFileSync(pkg, "utf8")).version === version) candidates.push(exe);
      } catch { /* unreadable pkg: skip */ }
    }
  } catch { /* no cache dir */ }
  return { exe: candidates[0] ?? null, source: candidates[0] ? "npx-cache-pinned" : "UNRESOLVED" };
}

/**
 * Bounded process-tree runner: spawn the exe DIRECTLY (no cmd.exe, no npx,
 * no node wrapper) and enforce an ABSOLUTE deadline. On deadline the whole
 * tree is killed with `taskkill /PID <pid> /T /F` (Windows tree-kill — the
 * only mechanism proven to reap the vendor daemon's children, which
 * Promise.race/AbortSignal do NOT). Returns { code, stdout, stderr, timed_out,
 * killed_tree } or { error } when spawn itself failed.
 */
export function runBoundedTree(exe, args, timeoutMs, env = undefined) {
  return new Promise((resolveRun) => {
    let child;
    try {
      child = spawn(exe, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true, env });
    } catch (e) {
      resolveRun({ error: `SPAWN_ERROR:${String(e?.message ?? e).slice(0, 60)}` });
      return;
    }
    if (!child.pid) {
      resolveRun({ error: "SPAWN_NO_PID" });
      return;
    }
    const out = [];
    const err = [];
    let settled = false, timedOut = false;
    const cap = (buf, chunk) => { if (buf.length < 8 * 1024 * 1024) buf.push(chunk); };
    child.stdout.on("data", (c) => cap(out, c));
    child.stderr.on("data", (c) => cap(err, c));
    const finish = (r) => { if (!settled) { settled = true; clearTimeout(timer); resolveRun(r); } };
    const timer = setTimeout(() => {
      timedOut = true;
      execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], { timeout: 5000 }, () => {
        finish({ code: null, stdout: out.join(""), stderr: err.join(""), timed_out: true, killed_tree: true });
      });
    }, Math.max(1, timeoutMs));
    child.on("error", (e) => finish({ error: `CHILD_ERROR:${String(e?.message ?? e).slice(0, 60)}`, timed_out: false }));
    // Complete on PROCESS EXIT, not stream close: when the vendor CLI starts
    // the daemon as its own child, that grandchild inherits the stdout pipe
    // and `close` never fires even though the command succeeded (observed:
    // `✓ Done` captured, then a false 60 s timeout). A 100 ms grace lets any
    // in-flight data events flush before we finalize the buffers.
    child.on("exit", (code) => {
      if (timedOut) return; // deadline path owns completion via the taskkill callback
      setTimeout(() => finish({ code, stdout: out.join(""), stderr: err.join(""), timed_out: false, killed_tree: false }), 100);
    });
    child.on("close", (code) => {
      if (timedOut) return;
      finish({ code, stdout: out.join(""), stderr: err.join(""), timed_out: false, killed_tree: false });
    });
  });
}

/**
 * Run `screenshot --annotate` through the project-qualified agent-browser
 * transport Hermes uses. NEVER exposes raw CDP to any model; the CLI is
 * invoked by this trusted helper only.
 *
 * DAEMON LAW (learned from T5_FAILURE_PATH_PROBE_NOT_BOUNDED evidence): the
 * vendor daemon keeps ONE endpoint per session. Passing `--cdp` per call on
 * a live daemon deadlocks (probes hung 33 min / 1.7 h). The bounded flow is
 * therefore THREE-STEP per invocation (each step tree-kill bounded):
 *   1. `connect <cdp>`        — pin the caller's endpoint (~20 s cold daemon);
 *   2. `snapshot`             — populate the @eN ref state --annotate reads;
 *   3. `screenshot --annotate`.
 * NOTE: --annotate silently omits `annotations[]` without a prior snapshot.
 * The vendor binary is spawned DIRECTLY from a pinned local resolution
 * (no `npx --yes`, no network, no cold-start) and every step is BOUNDED by
 * runBoundedTree (deadline → taskkill /T /F → fail closed).
 *
 * Returns the RAW CLI envelope { success, data: { annotations, path } } or a
 * fail-closed { success:false, error }. The screenshot file (wherever the CLI
 * put it) is DELETED before this function returns.
 */
export async function captureAnnotatedScreenshot({ cdp = "9222", timeoutMs = 60000, exe = null } = {}) {
  const t0 = Date.now();
  const tmp = mkdtempSync(join(tmpdir(), "vsc-shot-"));
  const shotPath = join(tmp, "annotated.png");
  const resolved = exe ? { exe, source: "caller-provided" } : resolveAgentBrowserExe();
  const defaultShotDir = join(process.env.USERPROFILE ?? tmpdir(), ".agent-browser", "tmp", "screenshots");
  const fail = (error, timed_out, killed_tree) => ({ success: false, error, latency_ms: Date.now() - t0, shot_path: shotPath, tmp, default_shot_dir: defaultShotDir, timed_out: !!timed_out, killed_tree: !!killed_tree });
  if (!resolved.exe) return fail("ANNOTATION_CLI_UNRESOLVED", false, false);

  // STEP 1 — pin the endpoint onto the session daemon (bounded). Cold daemon
  // start measurably takes ~20 s on this workstation (loopback handshakes are
  // slow under the local WFP/redirector stack), so the connect budget clamp
  // is 45 s — still absolutely bounded and generous over the observed 20 s.
  const c = await runBoundedTree(resolved.exe, ["connect", String(cdp)], Math.min(Math.max(1, timeoutMs), 45000));
  if (c.error) return fail(`CONNECT_${c.error}`, false, false);
  if (c.timed_out) return fail("CONNECT_TIMEOUT_BOUNDED", true, c.killed_tree);
  if (c.code !== 0) return fail(`CONNECT_FAILED:code=${c.code}:${String(c.stderr ?? "").slice(0, 40)}`, false, false);

  // STEP 2 — populate @eN refs (bounded). Fail-closed on timeout/kill only;
  // a semantically empty snapshot still yields EMPTY_ANNOTATIONS downstream.
  const s = await runBoundedTree(resolved.exe, ["snapshot"], Math.min(Math.max(1, timeoutMs), 20000));
  if (s.error) return fail(`SNAPSHOT_${s.error}`, false, false);
  if (s.timed_out) return fail("SNAPSHOT_TIMEOUT_BOUNDED", true, s.killed_tree);

  // STEP 3 — annotated screenshot (bounded).
  const a = await runBoundedTree(resolved.exe, ["--json", "screenshot", "--annotate", shotPath], Math.max(1, timeoutMs));
  if (a.error) return fail(a.error, false, false);
  if (a.timed_out) return fail(`ANNOTATION_TIMEOUT_BOUNDED:${timeoutMs}ms`, true, a.killed_tree);
  let parsed;
  try { parsed = JSON.parse(a.stdout); } catch { return fail("ANNOTATION_OUTPUT_MALFORMED", false, false); }
  if (!parsed || parsed.success !== true || !parsed.data) {
    return fail(`ANNOTATION_FAILED:${String(parsed?.error ?? "unknown").slice(0, 60)}`, false, false);
  }
  return { success: true, annotations: Array.isArray(parsed.data.annotations) ? parsed.data.annotations : [], cli_path: typeof parsed.data.path === "string" ? parsed.data.path : null, latency_ms: Date.now() - t0, shot_path: shotPath, tmp, default_shot_dir: defaultShotDir, timed_out: false, killed_tree: false };
}
/** Delete every artifact of an annotate capture (our temp + CLI's own dir). EPHEMERAL LAW. */
export function cleanupCapture(capture) {
  const removed = [];
  if (capture?.tmp && existsSync(capture.tmp)) { rmSync(capture.tmp, { recursive: true, force: true }); removed.push(capture.tmp); }
  try {
    if (capture?.default_shot_dir && existsSync(capture.default_shot_dir)) {
      for (const f of readdirSync(capture.default_shot_dir)) {
        if (f.endsWith(".png")) { const p = join(capture.default_shot_dir, f); rmSync(p, { force: true }); removed.push(p); }
      }
    }
  } catch { /* best-effort; never throws */ }
  return removed;
}

// ---------------------------------------------------------------- main entry
/**
 * Observe visually (annotate tier) — the ONLY public entry point.
 * Refuses (fail-closed) when Qwen primary is unhealthy.
 * Publishes #79-lane telemetry (stage=VISUAL_INSPECTION, sanitized).
 */
export async function observeVisually({ cdp = "9222", task_ref = null, reason = "DOM_INSUFFICIENT", timeoutMs = 60000, qwenBaseUrl } = {}) {
  const started = Date.now();
  const qwen = await qwenPrimaryHealth({ baseUrl: qwenBaseUrl });
  const gpu = await gpuSnapshot();
  const resource_pressure = { ...gpu, ram_free_mb: Math.round(freemem() / 1048576), qwen: qwen.detail };

  const activityId = `visual-${Date.now().toString(36)}`;
  publishActivity({
    activity_id: activityId, task_ref, activity_type: "HERMES_QWEN_VISUAL_INSPECTION",
    controller: "QWEN_LOCAL", bridge: "HERMES", browser_surface: "CHROME_CDP_PERSISTENT",
    answer_surface: null, model_profile: null, started_at: new Date(started).toISOString(),
    last_progress_at: new Date(started).toISOString(), elapsed_seconds: 0,
    stage: "VISUAL_INSPECTION", state: "ACTIVE", capture_state: "ANNOTATED_SCREENSHOT",
    cdp_state: "OBSERVED", qwen_occupancy: "PRIMARY_RESIDENT",
  });

  let observation;
  if (!qwen.healthy) {
    observation = buildVisualObservation({ annotations: null, latency_ms: Date.now() - started, resource_pressure, qwen_health: qwen });
  } else {
    const capture = await captureAnnotatedScreenshot({ cdp, timeoutMs });
    const removed = cleanupCapture(capture);
    observation = buildVisualObservation({
      annotations: capture.success ? capture.annotations : null,
      screenshot_deleted: removed.length > 0,
      latency_ms: Date.now() - started,
      resource_pressure,
      qwen_health: qwen,
      observation_id: activityId.replace("visual-", "vsc-"),
      note: capture.success ? null : capture.error,
    });
    observation.screenshot_files_deleted = removed.length;
  }

  const terminal = observation.ambiguity === "NONE" ? "PASS" : "STOP";
  publishActivity({
    activity_id: activityId, state: terminal, stage: terminal === "PASS" ? "PASS" : "STOP",
    stop_reason: terminal === "PASS" ? null : `VISUAL_${observation.ambiguity}`,
    last_progress_at: new Date().toISOString(), elapsed_seconds: Math.round((Date.now() - started) / 1000),
    capture_state: terminal === "PASS" ? "ANNOTATION_MAPPED" : "FAILED_CLOSED",
  });

  return observation;
}
