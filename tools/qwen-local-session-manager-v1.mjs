#!/usr/bin/env node
/**
 * qwen-local-session-manager-v1 — ensure canonical llama.cpp qwen_local READY.
 *
 * Reuses healthy server. If absent, launches the operator-tested PowerShell
 * launcher once (no reconstructed llama-server flags). Bounded readiness poll.
 * No kill/restart/shutdown. No model generation.
 *
 * Usage:
 *   node tools/qwen-local-session-manager-v1.mjs [--profile qwen38-opus-q3-daily-16k]
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import {
  STARTUP_PROFILE_ID,
  getProfile,
  loadQwenLocalRuntime,
  validateRuntimeDocument,
} from "./qwen-local-runtime-v1.mjs";

export const RESULT_SCHEMA = "qwen-local-session-manager-result-v1";
export const DEFAULT_TIMEOUT_MS = 180_000;
export const DEFAULT_POLL_MS = 2_000;

/** In-process start lock (dedupe concurrent ensure while launching). */
let inFlightEnsure = null;

function result(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    status: partial.status,
    ready: Boolean(partial.ready),
    profile: partial.profile ?? null,
    model_id: partial.model_id ?? null,
    base_url: partial.base_url ?? null,
    launch_performed: Boolean(partial.launch_performed),
    wait_elapsed_ms: Number(partial.wait_elapsed_ms) || 0,
    reason_code: partial.reason_code || partial.status,
    launch_count: Number(partial.launch_count) || 0,
  };
}

export function resolveLauncherPath(runtime, options = {}) {
  if (options.launcherPath) return resolve(options.launcherPath);
  const verified = "C:\\Users\\mrhz\\Documents\\AI\\QWEN\\Start-Qwen-MultiModel-16K.ps1";
  const script = runtime?.launcher?.script;
  if (typeof script === "string" && script.trim()) {
    const fromHome = join(homedir(), script.replace(/\//g, "\\"));
    if (existsSync(fromHome)) return fromHome;
    if (existsSync(script)) return resolve(script);
  }
  return verified;
}

export async function defaultCheckReadiness({ baseUrl, modelId, timeoutMs = 3000 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${String(baseUrl).replace(/\/$/, "")}/v1/models`, {
      signal: ctrl.signal,
    });
    if (!r.ok) {
      return { ok: false, classification: "API_UNREACHABLE", http_status: r.status };
    }
    const data = await r.json();
    const ids = Array.isArray(data?.data)
      ? data.data.map((row) => (row && typeof row.id === "string" ? row.id : null)).filter(Boolean)
      : [];
    if (!ids.includes(modelId)) {
      return { ok: false, classification: "PROFILE_NOT_EXPOSED", http_status: 200, ids };
    }
    return { ok: true, classification: "READY", http_status: 200, ids };
  } catch {
    return { ok: false, classification: "API_UNREACHABLE" };
  } finally {
    clearTimeout(timer);
  }
}

export async function defaultLaunchOperatorLauncher({ launcherPath }) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", launcherPath],
      {
        windowsHide: true,
        detached: true,
        stdio: "ignore",
      },
    );
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      rejectPromise(err);
    });
    // Detached launcher owns lifecycle; consider spawn success as launch accepted.
    child.unref();
    // Give spawn a tick to surface immediate failures.
    setImmediate(() => {
      if (settled) return;
      settled = true;
      resolvePromise({ pid: child.pid || null });
    });
  });
}

function sleep(ms, sleepFn) {
  return sleepFn(ms);
}

async function waitForReadiness({
  baseUrl,
  modelId,
  timeoutMs,
  pollIntervalMs,
  checkReadiness,
  sleepFn,
}) {
  const started = Date.now();
  let last = { ok: false, classification: "API_UNREACHABLE" };
  while (Date.now() - started <= timeoutMs) {
    last = await checkReadiness({ baseUrl, modelId });
    if (last.ok) {
      return {
        ok: true,
        wait_elapsed_ms: Date.now() - started,
        last,
      };
    }
    // PROFILE_NOT_EXPOSED with API up: keep polling until timeout (model may autoload).
    const remaining = timeoutMs - (Date.now() - started);
    if (remaining <= 0) break;
    await sleep(Math.min(pollIntervalMs, remaining), sleepFn);
  }
  return {
    ok: false,
    wait_elapsed_ms: Date.now() - started,
    last,
  };
}

/**
 * Ensure qwen_local canonical llama.cpp runtime is READY for a profile.
 *
 * Injectables (tests):
 *   loadRuntime, checkReadiness, launchLauncher, existsPath, sleepFn
 *   readinessTimeoutMs, pollIntervalMs, launcherPath
 */
export async function ensureQwenLocalReady(options = {}) {
  const profileId = options.profile || STARTUP_PROFILE_ID;
  const timeoutMs = options.readinessTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_MS;
  const loadRuntime = options.loadRuntime || loadQwenLocalRuntime;
  const checkReadiness = options.checkReadiness || defaultCheckReadiness;
  const launchLauncher = options.launchLauncher || defaultLaunchOperatorLauncher;
  const existsPath = options.existsPath || existsSync;
  const sleepFn =
    options.sleepFn || ((ms) => new Promise((r) => setTimeout(r, ms)));

  let runtime;
  try {
    runtime = loadRuntime();
  } catch {
    return result({
      status: "INVALID_RUNTIME_CONFIG",
      ready: false,
      profile: profileId,
      reason_code: "INVALID_RUNTIME_CONFIG",
    });
  }

  const runtimeOk = validateRuntimeDocument(runtime);
  if (!runtimeOk.ok) {
    return result({
      status: "INVALID_RUNTIME_CONFIG",
      ready: false,
      profile: profileId,
      reason_code: "INVALID_RUNTIME_CONFIG",
    });
  }

  if (runtime.reconstruct_llama_server_commands === true) {
    return result({
      status: "INVALID_RUNTIME_CONFIG",
      ready: false,
      profile: profileId,
      reason_code: "INVALID_RUNTIME_CONFIG",
    });
  }

  const profileCheck = getProfile(runtime, profileId);
  if (!profileCheck.ok) {
    const status =
      profileCheck.classification === "DFLASH_PROFILE_RETIRED"
        ? "DFLASH_REQUIRED"
        : "INVALID_PROFILE";
    return result({
      status,
      ready: false,
      profile: profileId,
      reason_code: status,
    });
  }

  const modelId = profileCheck.profile.llama_cpp_model_id;
  if (typeof modelId !== "string" || !modelId.trim()) {
    return result({
      status: "INVALID_RUNTIME_CONFIG",
      ready: false,
      profile: profileId,
      reason_code: "INVALID_RUNTIME_CONFIG",
    });
  }

  const baseUrl =
    options.baseUrl ||
    runtime.launcher?.base_url ||
    "http://127.0.0.1:8080";

  // Fast path: already READY
  const readyNow = await checkReadiness({ baseUrl, modelId });
  if (readyNow.ok) {
    return result({
      status: "READY",
      ready: true,
      profile: profileId,
      model_id: modelId,
      base_url: baseUrl,
      launch_performed: false,
      wait_elapsed_ms: 0,
      reason_code: "READY",
      launch_count: 0,
    });
  }

  // In-process dedupe: share one launch+wait
  if (inFlightEnsure) {
    return inFlightEnsure;
  }

  inFlightEnsure = (async () => {
    try {
      // Re-check after acquiring lock (another caller may have finished)
      const again = await checkReadiness({ baseUrl, modelId });
      if (again.ok) {
        return result({
          status: "READY",
          ready: true,
          profile: profileId,
          model_id: modelId,
          base_url: baseUrl,
          launch_performed: false,
          wait_elapsed_ms: 0,
          reason_code: "READY",
          launch_count: 0,
        });
      }

      const launcherPath = resolveLauncherPath(runtime, options);
      if (!existsPath(launcherPath)) {
        return result({
          status: "LAUNCHER_NOT_FOUND",
          ready: false,
          profile: profileId,
          model_id: modelId,
          base_url: baseUrl,
          launch_performed: false,
          reason_code: "LAUNCHER_NOT_FOUND",
          launch_count: 0,
        });
      }

      let launchCount = 0;
      try {
        await launchLauncher({ launcherPath, baseUrl, modelId, profileId });
        launchCount = 1;
      } catch {
        return result({
          status: "LAUNCH_FAILED",
          ready: false,
          profile: profileId,
          model_id: modelId,
          base_url: baseUrl,
          launch_performed: false,
          reason_code: "LAUNCH_FAILED",
          launch_count: 0,
        });
      }

      const waited = await waitForReadiness({
        baseUrl,
        modelId,
        timeoutMs,
        pollIntervalMs,
        checkReadiness,
        sleepFn,
      });

      if (waited.ok) {
        return result({
          status: "LAUNCH_STARTED_AND_READY",
          ready: true,
          profile: profileId,
          model_id: modelId,
          base_url: baseUrl,
          launch_performed: true,
          wait_elapsed_ms: waited.wait_elapsed_ms,
          reason_code: "LAUNCH_STARTED_AND_READY",
          launch_count: launchCount,
        });
      }

      const lastClass = waited.last?.classification;
      let status = "READINESS_TIMEOUT";
      if (lastClass === "PROFILE_NOT_EXPOSED") status = "PROFILE_NOT_EXPOSED";
      else if (lastClass === "API_UNREACHABLE") status = "API_UNREACHABLE";

      return result({
        status,
        ready: false,
        profile: profileId,
        model_id: modelId,
        base_url: baseUrl,
        launch_performed: true,
        wait_elapsed_ms: waited.wait_elapsed_ms,
        reason_code: status,
        launch_count: launchCount,
      });
    } finally {
      inFlightEnsure = null;
    }
  })();

  return inFlightEnsure;
}

/** Test helper: clear in-process lock between cases. */
export function __resetSessionManagerLockForTests() {
  inFlightEnsure = null;
}

function parseArgs(argv) {
  const opts = { profile: STARTUP_PROFILE_ID, help: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--profile" && argv[i + 1]) {
      opts.profile = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      opts.help = true;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    process.stderr.write(
      "Usage: node tools/qwen-local-session-manager-v1.mjs [--profile <exact-profile-id>]\n",
    );
    process.exit(0);
  }
  const out = await ensureQwenLocalReady({ profile: opts.profile });
  process.stdout.write(`${JSON.stringify(out)}\n`);
  process.exit(out.ready ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("qwen-local-session-manager-v1.mjs") ||
    process.argv[1]
      .replace(/\\/g, "/")
      .endsWith("tools/qwen-local-session-manager-v1.mjs"));

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
