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
import { createConnection } from "node:net";
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
export const DEFAULT_DEV_ROUTER_TIMEOUT_MS = 30_000;

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

/**
 * Workstation DEV session bridge (LOCAL_DEV_DOMAIN only).
 *
 * Headless router restore (no Edge / PowerShell launcher / reconstructed
 * llama-server flags). Resolves ONLY
 * runtime.workstation_manual_profiles[profile_id] and does NOT validate the
 * production runtime document or role maps.
 *
 * Strict DEV profile rules:
 *   category == "workstation_dev_executor_profile"
 *   control_plane_eligible !== true · auto_route !== true
 * model_id = profile.llama_cpp_model_id (when explicitly present) else profile_id.
 */
export const DEV_PROFILE_CATEGORY = "workstation_dev_executor_profile";

let inFlightDevEnsure = null;
let inFlightDevRouterEnsure = null;

export function resolveWorkstationDevProfile(runtime, profileId) {
  const profile = runtime?.workstation_manual_profiles?.[profileId];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return { ok: false, classification: "DEV_PROFILE_INVALID", reason_codes: ["DEV_PROFILE_INVALID", "PROFILE_UNKNOWN"] };
  }
  if (profile.category !== DEV_PROFILE_CATEGORY) {
    return { ok: false, classification: "DEV_PROFILE_INVALID", reason_codes: ["DEV_PROFILE_INVALID", "CATEGORY_MISMATCH"] };
  }
  if (profile.control_plane_eligible === true || profile.auto_route === true) {
    return { ok: false, classification: "DEV_PROFILE_INVALID", reason_codes: ["DEV_PROFILE_INVALID", "PRODUCTION_FLAGS_PRESENT"] };
  }
  const modelId = typeof profile.llama_cpp_model_id === "string" && profile.llama_cpp_model_id.trim()
    ? profile.llama_cpp_model_id
    : profileId;
  return { ok: true, profile, model_id: modelId };
}

function resolveHomeRelativePath(relOrAbs, existsPath) {
  if (typeof relOrAbs !== "string" || !relOrAbs.trim()) return null;
  const trimmed = relOrAbs.trim();
  if (existsPath(trimmed)) return resolve(trimmed);
  const fromHome = join(homedir(), trimmed.replace(/\//g, "\\"));
  if (existsPath(fromHome)) return fromHome;
  return null;
}

/** Resolve launcher.router_entrypoint + launcher.router_config from runtime. */
export function resolveDevRouterPaths(runtime, options = {}) {
  const existsPath = options.existsPath || existsSync;
  if (options.routerEntrypoint && options.routerConfig) {
    return {
      ok: true,
      router_entrypoint: resolve(options.routerEntrypoint),
      router_config: resolve(options.routerConfig),
    };
  }
  const entryRel = runtime?.launcher?.router_entrypoint;
  const configRel = runtime?.launcher?.router_config;
  const entry = options.routerEntrypoint
    ? resolve(options.routerEntrypoint)
    : resolveHomeRelativePath(entryRel, existsPath);
  const config = options.routerConfig
    ? resolve(options.routerConfig)
    : resolveHomeRelativePath(configRel, existsPath);
  if (!entry) {
    return { ok: false, classification: "ROUTER_ENTRYPOINT_NOT_FOUND", reason_code: "ROUTER_ENTRYPOINT_NOT_FOUND" };
  }
  if (!config) {
    return { ok: false, classification: "ROUTER_CONFIG_NOT_FOUND", reason_code: "ROUTER_CONFIG_NOT_FOUND" };
  }
  return { ok: true, router_entrypoint: entry, router_config: config };
}

/** Deterministic Python for headless router spawn (injectable in tests). */
export function resolvePythonExecutable(options = {}) {
  const existsPath = options.existsPath || existsSync;
  if (typeof options.pythonExecutable === "string" && options.pythonExecutable.trim()) {
    const injected = options.pythonExecutable.trim();
    if (injected === "python.exe" || existsPath(injected)) {
      return { ok: true, python_executable: injected };
    }
    return { ok: false, classification: "PYTHON_NOT_FOUND", reason_code: "PYTHON_NOT_FOUND" };
  }
  const localApp = process.env.LOCALAPPDATA || "";
  // Prefer known LOCALAPPDATA installs (pythoncore-3.14-64 is the live workstation).
  const fallbacks = [
    localApp ? join(localApp, "Python", "pythoncore-3.14-64", "python.exe") : null,
    localApp ? join(localApp, "Programs", "Python", "Python314", "python.exe") : null,
    localApp ? join(localApp, "Programs", "Python", "Python312", "python.exe") : null,
    localApp ? join(localApp, "Programs", "Python", "Python311", "python.exe") : null,
    localApp ? join(localApp, "Programs", "Python", "Python310", "python.exe") : null,
  ].filter(Boolean);
  for (const candidate of fallbacks) {
    if (existsPath(candidate)) return { ok: true, python_executable: candidate };
  }
  // Final normal-runtime fallback: PATH python.exe (spawn validates later).
  if (!options.existsPath) {
    return { ok: true, python_executable: "python.exe" };
  }
  return { ok: false, classification: "PYTHON_NOT_FOUND", reason_code: "PYTHON_NOT_FOUND" };
}

export function parseCanonicalEndpoint(baseUrl, runtime = {}) {
  const raw = baseUrl
    || runtime.canonical_endpoint
    || runtime.launcher?.base_url
    || "http://127.0.0.1:8080";
  try {
    const u = new URL(raw);
    const port = u.port ? Number(u.port) : (u.protocol === "https:" ? 443 : 80);
    return {
      base_url: String(raw).replace(/\/$/, ""),
      host: u.hostname || "127.0.0.1",
      port: Number.isFinite(port) ? port : (runtime.launcher?.port || 8080),
    };
  } catch {
    return {
      base_url: "http://127.0.0.1:8080",
      host: runtime.launcher?.host || "127.0.0.1",
      port: runtime.launcher?.port || 8080,
    };
  }
}

/** GET /v1/models only — never generates. Healthy when HTTP 200 + parseable list. */
export async function defaultCheckRouterApiHealthy({ baseUrl, timeoutMs = 3000 }) {
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
    return { ok: true, classification: "ROUTER_API_HEALTHY", http_status: 200, ids };
  } catch {
    return { ok: false, classification: "API_UNREACHABLE" };
  } finally {
    clearTimeout(timer);
  }
}

/** TCP probe of the canonical router port (occupied => true). Never kills. */
export async function defaultCheckEndpointOccupied({ host, port, timeoutMs = 400 }) {
  return new Promise((resolvePromise) => {
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      resolvePromise(v);
    };
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      finish(false);
    }, timeoutMs);
    socket.on("connect", () => {
      clearTimeout(timer);
      socket.end();
      finish(true);
    });
    socket.on("error", () => {
      clearTimeout(timer);
      finish(false);
    });
  });
}

/** Detached headless router: python -u <entrypoint> --config <config>. No Edge/shell. */
export async function defaultLaunchHeadlessDevRouter({
  pythonExecutable,
  routerEntrypoint,
  routerConfig,
}) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    const child = spawn(
      pythonExecutable,
      ["-u", routerEntrypoint, "--config", routerConfig],
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
    child.unref();
    setImmediate(() => {
      if (settled) return;
      settled = true;
      resolvePromise({ pid: child.pid || null });
    });
  });
}

async function waitForRouterApi({
  baseUrl,
  timeoutMs,
  pollIntervalMs,
  checkRouterApi,
  sleepFn,
}) {
  const started = Date.now();
  let last = { ok: false, classification: "API_UNREACHABLE" };
  while (Date.now() - started <= timeoutMs) {
    last = await checkRouterApi({ baseUrl });
    if (last.ok) {
      return { ok: true, wait_elapsed_ms: Date.now() - started, last };
    }
    const remaining = timeoutMs - (Date.now() - started);
    if (remaining <= 0) break;
    await sleep(Math.min(pollIntervalMs, remaining), sleepFn);
  }
  return { ok: false, wait_elapsed_ms: Date.now() - started, last };
}

/**
 * Ensure the canonical DEV router API is healthy (zero generation).
 * Does not require a specific model id.
 */
export async function ensureWorkstationDevRouterReady(options = {}) {
  const timeoutMs = options.readinessTimeoutMs ?? DEFAULT_DEV_ROUTER_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_MS;
  const loadRuntime = options.loadRuntime || loadQwenLocalRuntime;
  const checkRouterApi = options.checkRouterApi || defaultCheckRouterApiHealthy;
  const checkEndpointOccupied = options.checkEndpointOccupied || defaultCheckEndpointOccupied;
  const launchHeadlessRouter = options.launchHeadlessRouter || defaultLaunchHeadlessDevRouter;
  const existsPath = options.existsPath || existsSync;
  const sleepFn = options.sleepFn || ((ms) => new Promise((r) => setTimeout(r, ms)));

  let runtime;
  try {
    runtime = loadRuntime();
  } catch {
    return result({ status: "INVALID_RUNTIME_CONFIG", ready: false, reason_code: "INVALID_RUNTIME_CONFIG" });
  }
  if (!runtime || typeof runtime !== "object" || runtime.reconstruct_llama_server_commands === true) {
    return result({ status: "INVALID_RUNTIME_CONFIG", ready: false, reason_code: "INVALID_RUNTIME_CONFIG" });
  }

  const endpoint = parseCanonicalEndpoint(options.baseUrl, runtime);
  const baseUrl = endpoint.base_url;

  const healthyNow = await checkRouterApi({ baseUrl });
  if (healthyNow.ok) {
    return result({
      status: "READY",
      ready: true,
      base_url: baseUrl,
      launch_performed: false,
      wait_elapsed_ms: 0,
      reason_code: "READY",
      launch_count: 0,
    });
  }

  if (inFlightDevRouterEnsure) return inFlightDevRouterEnsure;

  inFlightDevRouterEnsure = (async () => {
    try {
      const again = await checkRouterApi({ baseUrl });
      if (again.ok) {
        return result({
          status: "READY",
          ready: true,
          base_url: baseUrl,
          launch_performed: false,
          wait_elapsed_ms: 0,
          reason_code: "READY",
          launch_count: 0,
        });
      }

      const occupied = await checkEndpointOccupied({
        host: endpoint.host,
        port: endpoint.port,
      });
      if (occupied) {
        return result({
          status: "ENDPOINT_OCCUPIED_UNHEALTHY",
          ready: false,
          base_url: baseUrl,
          launch_performed: false,
          reason_code: "ENDPOINT_OCCUPIED_UNHEALTHY",
          launch_count: 0,
        });
      }

      const paths = resolveDevRouterPaths(runtime, { ...options, existsPath });
      if (!paths.ok) {
        return result({
          status: paths.classification,
          ready: false,
          base_url: baseUrl,
          launch_performed: false,
          reason_code: paths.reason_code,
          launch_count: 0,
        });
      }

      const py = resolvePythonExecutable({ ...options, existsPath });
      if (!py.ok) {
        return result({
          status: "PYTHON_NOT_FOUND",
          ready: false,
          base_url: baseUrl,
          launch_performed: false,
          reason_code: "PYTHON_NOT_FOUND",
          launch_count: 0,
        });
      }

      let launchCount = 0;
      try {
        await launchHeadlessRouter({
          pythonExecutable: py.python_executable,
          routerEntrypoint: paths.router_entrypoint,
          routerConfig: paths.router_config,
          baseUrl,
        });
        launchCount = 1;
      } catch {
        return result({
          status: "LAUNCH_FAILED",
          ready: false,
          base_url: baseUrl,
          launch_performed: false,
          reason_code: "LAUNCH_FAILED",
          launch_count: 0,
        });
      }

      const waited = await waitForRouterApi({
        baseUrl,
        timeoutMs,
        pollIntervalMs,
        checkRouterApi,
        sleepFn,
      });
      if (waited.ok) {
        return result({
          status: "LAUNCH_STARTED_AND_READY",
          ready: true,
          base_url: baseUrl,
          launch_performed: true,
          wait_elapsed_ms: waited.wait_elapsed_ms,
          reason_code: "LAUNCH_STARTED_AND_READY",
          launch_count: launchCount,
        });
      }
      return result({
        status: "READINESS_TIMEOUT",
        ready: false,
        base_url: baseUrl,
        launch_performed: true,
        wait_elapsed_ms: waited.wait_elapsed_ms,
        reason_code: "READINESS_TIMEOUT",
        launch_count: launchCount,
      });
    } finally {
      inFlightDevRouterEnsure = null;
    }
  })();

  return inFlightDevRouterEnsure;
}

/**
 * Ensure exact workstation DEV profile is exposed on the canonical router.
 * Uses headless router restore only; never falls back to another profile.
 */
export async function ensureWorkstationDevQwenReady(options = {}) {
  const profileId = options.profile;
  if (typeof profileId !== "string" || !profileId.trim()) {
    return result({ status: "DEV_PROFILE_INVALID", ready: false, profile: null, reason_code: "DEV_PROFILE_INVALID" });
  }
  const timeoutMs = options.readinessTimeoutMs ?? DEFAULT_DEV_ROUTER_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_MS;
  const loadRuntime = options.loadRuntime || loadQwenLocalRuntime;
  const checkReadiness = options.checkReadiness || defaultCheckReadiness;
  const existsPath = options.existsPath || existsSync;
  const sleepFn = options.sleepFn || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const ensureRouter = options.ensureDevRouterReady || ensureWorkstationDevRouterReady;

  let runtime;
  try {
    runtime = loadRuntime();
  } catch {
    return result({ status: "INVALID_RUNTIME_CONFIG", ready: false, profile: profileId, reason_code: "INVALID_RUNTIME_CONFIG" });
  }
  if (!runtime || typeof runtime !== "object" || runtime.reconstruct_llama_server_commands === true) {
    return result({ status: "INVALID_RUNTIME_CONFIG", ready: false, profile: profileId, reason_code: "INVALID_RUNTIME_CONFIG" });
  }

  const resolved = resolveWorkstationDevProfile(runtime, profileId);
  if (!resolved.ok) {
    return result({ status: resolved.classification, ready: false, profile: profileId, reason_code: resolved.classification });
  }
  const modelId = resolved.model_id;
  const endpoint = parseCanonicalEndpoint(options.baseUrl, runtime);
  const baseUrl = endpoint.base_url;

  // Fast path: exact profile already visible.
  const readyNow = await checkReadiness({ baseUrl, modelId });
  if (readyNow.ok) {
    return result({
      status: "READY", ready: true, profile: profileId, model_id: modelId,
      base_url: baseUrl, launch_performed: false, wait_elapsed_ms: 0,
      reason_code: "READY", launch_count: 0,
    });
  }

  // Router healthy but exact profile missing — never launch / never fallback.
  if (readyNow.classification === "PROFILE_NOT_EXPOSED") {
    return result({
      status: "PROFILE_NOT_EXPOSED", ready: false, profile: profileId, model_id: modelId,
      base_url: baseUrl, launch_performed: false, wait_elapsed_ms: 0,
      reason_code: "PROFILE_NOT_EXPOSED", launch_count: 0,
    });
  }

  if (inFlightDevEnsure) return inFlightDevEnsure;

  inFlightDevEnsure = (async () => {
    try {
      const again = await checkReadiness({ baseUrl, modelId });
      if (again.ok) {
        return result({
          status: "READY", ready: true, profile: profileId, model_id: modelId,
          base_url: baseUrl, launch_performed: false, wait_elapsed_ms: 0,
          reason_code: "READY", launch_count: 0,
        });
      }
      if (again.classification === "PROFILE_NOT_EXPOSED") {
        return result({
          status: "PROFILE_NOT_EXPOSED", ready: false, profile: profileId, model_id: modelId,
          base_url: baseUrl, launch_performed: false, wait_elapsed_ms: 0,
          reason_code: "PROFILE_NOT_EXPOSED", launch_count: 0,
        });
      }

      const started = Date.now();
      const router = await ensureRouter({
        ...options,
        loadRuntime: () => runtime,
        existsPath,
        sleepFn,
        readinessTimeoutMs: timeoutMs,
        pollIntervalMs,
        baseUrl,
      });
      if (!router.ready) {
        return result({
          status: router.status || router.reason_code || "API_UNREACHABLE",
          ready: false,
          profile: profileId,
          model_id: modelId,
          base_url: baseUrl,
          launch_performed: Boolean(router.launch_performed),
          wait_elapsed_ms: router.wait_elapsed_ms || (Date.now() - started),
          reason_code: router.reason_code || router.status || "API_UNREACHABLE",
          launch_count: Number(router.launch_count) || 0,
        });
      }

      const remaining = Math.max(0, timeoutMs - (Date.now() - started));
      const waited = await waitForReadiness({
        baseUrl,
        modelId,
        timeoutMs: remaining,
        pollIntervalMs,
        checkReadiness,
        sleepFn,
      });
      const launchCount = Number(router.launch_count) || 0;
      const launchPerformed = Boolean(router.launch_performed) || launchCount > 0;
      if (waited.ok) {
        return result({
          status: launchPerformed ? "LAUNCH_STARTED_AND_READY" : "READY",
          ready: true,
          profile: profileId,
          model_id: modelId,
          base_url: baseUrl,
          launch_performed: launchPerformed,
          wait_elapsed_ms: Date.now() - started,
          reason_code: launchPerformed ? "LAUNCH_STARTED_AND_READY" : "READY",
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
        launch_performed: launchPerformed,
        wait_elapsed_ms: Date.now() - started,
        reason_code: status,
        launch_count: launchCount,
      });
    } finally {
      inFlightDevEnsure = null;
    }
  })();

  return inFlightDevEnsure;
}

/** Test helper: clear DEV in-process locks between cases. */
export function __resetDevSessionManagerLockForTests() {
  inFlightDevEnsure = null;
  inFlightDevRouterEnsure = null;
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
