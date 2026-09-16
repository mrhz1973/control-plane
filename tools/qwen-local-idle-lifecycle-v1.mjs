#!/usr/bin/env node
/**
 * qwen-local-idle-lifecycle-v1 — governed idle auto-stop for the LOCAL_DEV Qwen
 * runtime (issue #89, V4_LOCAL_DEV_QWEN_IDLE_AUTOSTOP_V1).
 *
 * Owns ONE bounded one-shot idle-grace timer inside the always-on dispatcher
 * lifecycle. No second scheduler: WF90 remains the tick owner and may only
 * trigger a read-only reconciliation.
 *
 * Laws implemented here:
 * - START-ON-DEMAND: this module NEVER starts Qwen. Observability is read-only.
 * - ACTIVE EXECUTION FENCE: stop is prohibited while a dispatcher execution,
 *   an ensure/preflight, an explicitly marked model request, or an immediately
 *   admitted execution is active. When uncertain: KEEP QWEN RUNNING.
 * - NO-ACTIVE-CLIENT: immediately before stop, a fresh bounded check combines
 *   dispatcher state + marked requests + owned process tree + established TCP
 *   connections owned by the canonical tree (foreign client => fence).
 * - FOREIGN PROCESS LAW: termination targets ONLY the positively identified
 *   canonical tree (qwen_runtime_router.py entrypoint + exact config + port
 *   evidence). Ambiguous ownership => deterministic error, no kill.
 * - SHUTDOWN STRATEGY: 1) exact-model unload via canonical router
 *   POST /models/unload (manager terminates the worker, VRAM released);
 *   2) if unload is unavailable or the heavy worker remains, stop ONLY the
 *   identified canonical tree via the session-manager primitives.
 * - NO CONSOLE LAW: fully headless; nothing here opens a terminal window.
 *
 * Lifecycle states (deterministic, bounded):
 *   STOPPED | STARTING | LOADED_IDLE | SERVING | IDLE_GRACE | AUTO_STOPPED |
 *   SHUTDOWN_FAILED
 */
import { createConnection } from "node:net";
import {
  defaultCheckEndpointOccupied,
  defaultListLoadedDevModels,
  defaultListWindowsProcesses,
  defaultUnloadExactDevModel,
  identifyCanonicalDevTree,
  stopCanonicalDevRouterTree,
} from "./qwen-local-session-manager-v1.mjs";
import { loadQwenLocalRuntime } from "./qwen-local-runtime-v1.mjs";

export const LIFECYCLE_SCHEMA = "qwen-local-idle-lifecycle-v1";

export const LIFECYCLE_STATES = Object.freeze([
  "STOPPED",
  "STARTING",
  "LOADED_IDLE",
  "SERVING",
  "IDLE_GRACE",
  "AUTO_STOPPED",
  "SHUTDOWN_FAILED",
]);

/** Bounded idle grace: preferred default 90s, allowed 60–120s (issue #89). */
export const DEFAULT_IDLE_SHUTDOWN_MS = 90_000;
export const MIN_IDLE_SHUTDOWN_MS = 60_000;
export const MAX_IDLE_SHUTDOWN_MS = 120_000;

/**
 * Resolve the bounded setting from the canonical runtime document
 * (`qwen_local_idle_shutdown_ms`). Invalid/out-of-bounds => deterministic
 * default with `config_source: "default"` (never trust unbounded values).
 */
export function resolveIdleShutdownMs(runtime, options = {}) {
  const raw = runtime && typeof runtime === "object"
    ? runtime.qwen_local_idle_shutdown_ms
    : undefined;
  const n = Number(raw);
  if (Number.isInteger(n) && n >= MIN_IDLE_SHUTDOWN_MS && n <= MAX_IDLE_SHUTDOWN_MS) {
    return { ms: n, config_source: "runtime_config" };
  }
  return { ms: options.defaultMs ?? DEFAULT_IDLE_SHUTDOWN_MS, config_source: "default" };
}

/**
 * Fresh bounded established-connection census. Returns rows with
 * OwningProcess/LocalPort/RemoteAddress/RemotePort for Established connections.
 * Read-only; injectable for deterministic tests.
 */
export async function defaultListEstablishedTcpConnections(options = {}) {
  const run = options.execFileAsync || (await import("node:util")).promisify(
    (await import("node:child_process")).execFile,
  );
  const ps = [
    "$ErrorActionPreference='SilentlyContinue';",
    "Get-NetTCPConnection -State Established |",
    " Select-Object OwningProcess,LocalAddress,LocalPort,RemoteAddress,RemotePort |",
    " ConvertTo-Json -Compress",
  ].join(" ");
  try {
    const { stdout } = await run(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", ps],
      { windowsHide: true, timeout: 15_000, maxBuffer: 8 * 1024 * 1024 },
    );
    const raw = String(stdout || "").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows
      .map((r) => ({
        owning_pid: Number(r.OwningProcess) || 0,
        local_address: String(r.LocalAddress || ""),
        local_port: Number(r.LocalPort) || 0,
        remote_address: String(r.RemoteAddress || ""),
        remote_port: Number(r.RemotePort) || 0,
      }))
      .filter((r) => r.owning_pid > 0 && r.local_port > 0 && r.remote_port > 0);
  } catch {
    return null; // census unavailable => treat as unknown (fail-safe: fence)
  }
}

function isLoopbackAddress(addr) {
  const a = String(addr || "").toLowerCase();
  return a === "127.0.0.1" || a === "::1" || a === "localhost" || a === "0.0.0.0";
}

/**
 * NO-ACTIVE-CLIENT test: does the canonical tree own an Established connection
 * with a FOREIGN endpoint (a client outside the tree)? Internal tree-to-tree
 * loopback pairs (manager<->worker) are not clients. Connections whose peer is
 * the OBSERVING process itself (selfPid; our own catalog probes / in-process
 * guard proxy, already covered by the execution/request bookkeeping fences)
 * are not foreign clients either. Census failure => unknown => fence
 * (keep running) per the WHEN-UNCERTAIN law.
 */
export function evaluateForeignClientActivity({ connections, treePids, selfPid = null }) {
  const tree = new Set((treePids || []).map(Number).filter((n) => n > 0));
  if (!tree.size) return { active: false, foreign: [], census_ok: true, reason_code: "TREE_ABSENT" };
  if (!Array.isArray(connections)) {
    return { active: true, foreign: [], census_ok: false, reason_code: "TCP_CENSUS_UNAVAILABLE" };
  }
  // Ports served by the tree itself (internal peers are not foreign clients).
  const treeServingPorts = new Set(
    connections.filter((c) => tree.has(c.owning_pid)).map((c) => c.local_port),
  );
  // Local ports owned by the observing process itself (self-probes).
  const selfPorts = new Set(
    selfPid != null
      ? connections.filter((c) => c.owning_pid === Number(selfPid)).map((c) => c.local_port)
      : [],
  );
  const foreign = [];
  for (const c of connections) {
    if (!tree.has(c.owning_pid)) continue;
    if (isLoopbackAddress(c.remote_address) && selfPorts.has(c.remote_port)) continue;
    const remoteIsTreePort = isLoopbackAddress(c.remote_address)
      && treeServingPorts.has(c.remote_port);
    if (!remoteIsTreePort) foreign.push(c);
  }
  return foreign.length
    ? { active: true, foreign, census_ok: true, reason_code: "FOREIGN_ESTABLISHED_CLIENT" }
    : { active: false, foreign: [], census_ok: true, reason_code: "NO_ACTIVE_CLIENT" };
}

/**
 * Create the bounded idle-lifecycle controller. All collaborators injectable
 * for deterministic offline tests; defaults are the canonical primitives.
 */
export function createQwenIdleLifecycle(options = {}) {
  const nowMs = options.nowMs || (() => Date.now());
  const sleepFn = options.sleepFn || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const timerFn = options.timerFn
    || ((fn, ms) => setTimeout(fn, ms));
  const clearTimerFn = options.clearTimerFn || ((t) => clearTimeout(t));
  const loadRuntime = options.loadRuntime || loadQwenLocalRuntime;
  const identifyTree = options.identifyCanonicalTree || identifyCanonicalDevTree;
  const listLoadedModels = options.listLoadedModels || defaultListLoadedDevModels;
  const unloadExactModel = options.unloadExactModel || defaultUnloadExactDevModel;
  const stopTree = options.stopCanonicalTree || stopCanonicalDevRouterTree;
  const listConnections = options.listEstablishedTcpConnections || defaultListEstablishedTcpConnections;
  const isDispatcherBusy = options.isDispatcherBusy || (() => false);
  const onEvent = typeof options.onEvent === "function" ? options.onEvent : null;

  const idleResolved = options.idleShutdownMs
    ? (typeof options.idleShutdownMs === "object" && options.idleShutdownMs !== null
      ? { ms: Number(options.idleShutdownMs.ms), config_source: String(options.idleShutdownMs.config_source || "explicit") }
      : { ms: Number(options.idleShutdownMs), config_source: "explicit" })
    : null;

  const state = {
    state: "STOPPED",
    profile_id: null,
    model_id: null,
    router_pids: [],
    worker_pids: [],
    last_activity_at: null,
    idle_since: null,
    idle_deadline: null,
    active_executions: 0,
    active_model_requests: 0,
    ensure_in_flight: false,
    shutdown_reason: null,
    shutdown_result: null,
    last_error: null,
    updated_at: null,
  };

  let timer = null;
  let stopping = false; // single-flight idle stop
  let executionWindowOpen = false; // markExecutionStart seen without its end

  const logEvent = (event, detail = {}) => {
    if (onEvent) {
      try { onEvent({ event, at: new Date(nowMs()).toISOString(), ...detail }); } catch { /* observability only */ }
    }
  };

  const setState = (next, patch = {}) => {
    state.state = next;
    state.updated_at = new Date(nowMs()).toISOString();
    Object.assign(state, patch);
    logEvent(`state:${next}`, { ...patch });
  };

  const cancelTimer = () => {
    if (timer != null) {
      clearTimerFn(timer);
      timer = null;
      logEvent("timer:cancelled");
    }
    state.idle_deadline = null;
  };

  function snapshot() {
    const now = nowMs();
    return {
      schema_version: LIFECYCLE_SCHEMA,
      state: state.state,
      profile_id: state.profile_id,
      model_id: state.model_id,
      router_pids: [...state.router_pids],
      worker_pids: [...state.worker_pids],
      last_activity_at: state.last_activity_at,
      idle_since: state.idle_since,
      idle_deadline: state.idle_deadline,
      ms_remaining: state.idle_deadline ? Math.max(0, state.idle_deadline - now) : null,
      active_executions: state.active_executions,
      active_model_requests: state.active_model_requests,
      ensure_in_flight: state.ensure_in_flight,
      shutdown_reason: state.shutdown_reason,
      shutdown_result: state.shutdown_result,
      last_error: state.last_error,
      updated_at: state.updated_at,
      idle_shutdown_ms: idleResolved ? idleResolved.ms : null,
      config_source: idleResolved ? idleResolved.config_source : null,
    };
  }

  /** Every inactivity fence, evaluated fresh. Uncertainty => not safe. */
  async function evaluateStopSafety({ treePids } = {}) {
    const fences = [];
    if (state.active_executions > 0) fences.push("DISPATCHER_EXECUTION_ACTIVE");
    if (state.ensure_in_flight) fences.push("QWEN_ENSURE_IN_FLIGHT");
    if (state.active_model_requests > 0) fences.push("MODEL_REQUEST_IN_FLIGHT");
    let busy;
    try { busy = isDispatcherBusy() === true; } catch { busy = true; }
    if (busy) fences.push("DISPATCHER_REPORTS_BUSY");
    if (stopping) fences.push("STOP_ALREADY_IN_FLIGHT");
    const pids = treePids || state.router_pids;
    if (pids && pids.length) {
      const conn = await listConnections();
      const client = evaluateForeignClientActivity({
        connections: conn,
        treePids: pids,
        selfPid: options.selfPid ?? process.pid,
      });
      if (client.active) fences.push(client.reason_code);
      else if (!client.census_ok) fences.push(client.reason_code);
    } else {
      fences.push("CANONICAL_TREE_UNPROVEN");
    }
    return { safe: fences.length === 0, fences };
  }

  /** Arm the one-shot grace timer (idempotent; existing deadline kept). */
  function armIdleGrace({ reason }) {
    if (timer != null) {
      logEvent("timer:already_armed");
      return;
    }
    const now = nowMs();
    const ms = idleResolved ? idleResolved.ms : DEFAULT_IDLE_SHUTDOWN_MS;
    state.idle_since = state.idle_since || new Date(now).toISOString();
    state.idle_deadline = now + ms;
    setState("IDLE_GRACE", { shutdown_reason: null });
    timer = timerFn(async () => {
      timer = null;
      await performIdleStop({ reason: reason || "IDLE_GRACE_EXPIRED" });
    }, ms);
    logEvent("timer:armed", { ms, reason: reason || null });
  }

  /** Mark real use begins: cancel any pending stop; lifecycle becomes SERVING. */
  function markExecutionStart({ taskRef, profileId } = {}) {
    cancelTimer();
    state.active_executions += 1;
    executionWindowOpen = true;
    if (profileId) {
      state.profile_id = String(profileId).slice(0, 120);
      state.model_id = String(profileId).slice(0, 120);
    }
    state.last_activity_at = new Date(nowMs()).toISOString();
    state.shutdown_reason = null;
    setState("SERVING", { task_ref: taskRef ? String(taskRef).slice(0, 200) : null });
  }

  /** Mark real use ended: enter bounded IDLE_GRACE and arm the one-shot timer.
   *  No-op when no execution window was open (never fabricates activity). */
  function markExecutionEnd({ taskRef } = {}) {
    if (!executionWindowOpen) {
      logEvent("execution:end_without_window");
      return snapshot();
    }
    state.active_executions = Math.max(0, state.active_executions - 1);
    executionWindowOpen = false;
    state.last_activity_at = new Date(nowMs()).toISOString();
    if (state.task_ref && (!taskRef || state.task_ref === taskRef)) delete state.task_ref;
    if (state.active_executions > 0) {
      logEvent("execution:still_active", { remaining: state.active_executions });
      return snapshot();
    }
    if (state.ensure_in_flight || state.active_model_requests > 0) {
      // Work continues at another level; grace is armed when it truly ends.
      setState("SERVING");
      return snapshot();
    }
    armIdleGrace({ reason: "EXECUTION_ENDED" });
    return snapshot();
  }

  function markModelRequestStart(tag = {}) {
    cancelTimer();
    state.active_model_requests += 1;
    state.last_activity_at = new Date(nowMs()).toISOString();
    setState("SERVING", { request_tag: tag && tag.tag ? String(tag.tag).slice(0, 80) : null });
  }

  function markModelRequestEnd() {
    state.active_model_requests = Math.max(0, state.active_model_requests - 1);
    state.last_activity_at = new Date(nowMs()).toISOString();
    if (state.active_model_requests > 0 || state.active_executions > 0 || state.ensure_in_flight) {
      setState("SERVING");
      return snapshot();
    }
    armIdleGrace({ reason: "MODEL_REQUEST_ENDED" });
    return snapshot();
  }

  function markPreflightStart({ profileId } = {}) {
    cancelTimer();
    state.ensure_in_flight = true;
    if (profileId) {
      state.profile_id = String(profileId).slice(0, 120);
      state.model_id = String(profileId).slice(0, 120);
    }
    state.last_activity_at = new Date(nowMs()).toISOString();
    setState("STARTING");
  }

  function markPreflightEnd({ ready } = {}) {
    state.ensure_in_flight = false;
    state.last_activity_at = new Date(nowMs()).toISOString();
    if (state.active_executions > 0 || state.active_model_requests > 0) {
      setState("SERVING");
      return snapshot();
    }
    if (ready === true) {
      armIdleGrace({ reason: "PREFLIGHT_READY_NO_EXECUTION" });
      return snapshot();
    }
    // Preflight failed: nothing heavy proven; reconcile will truth the state.
    setState("LOADED_IDLE");
    return snapshot();
  }

  /**
   * READ-ONLY reconcile: truth the lifecycle from real evidence. Never starts
   * Qwen, never loads, never kills. IDLE_CLEAN ticks call this.
   */
  async function reconcile() {
    if (stopping) return snapshot();
    const identified = await identifyTree();
    const routerPids = identified.ok ? (identified.router_pids || []) : [];
    const treePids = identified.ok ? (identified.tree_pids || []) : [];
    const workerPids = treePids.filter((p) => !routerPids.includes(p));

    if (!identified.ok && identified.reason_code === "INVALID_RUNTIME_CONFIG") {
      state.last_error = "INVALID_RUNTIME_CONFIG";
      setState("SHUTDOWN_FAILED");
      return snapshot();
    }

    state.router_pids = routerPids;
    state.worker_pids = workerPids;

    if (!treePids.length) {
      // Canonical runtime absent: STOPPED (externally stopped / never started).
      cancelTimer();
      if (state.state !== "AUTO_STOPPED") setState("STOPPED", { shutdown_result: null });
      return snapshot();
    }

    // Tree present: classify loaded state via read-only catalog probe.
    const baseUrl = identified.base_url;
    const loaded = await listLoadedModels({ baseUrl });
    const loadedIds = loaded.ok ? loaded.loaded.map((m) => m.id) : null;

    if (state.active_executions > 0 || state.ensure_in_flight || state.active_model_requests > 0) {
      if (state.state !== "SERVING" && state.state !== "STARTING") setState("SERVING");
      return snapshot();
    }

    const heavyPids = state.worker_pids;
    if (loaded.ok && loadedIds.length === 0 && heavyPids.length === 0) {
      // Manager alive, nothing loaded, no heavy worker: lightweight supervisor
      // with negligible idle footprint (issue #89 desired behavior).
      cancelTimer();
      if (state.state !== "AUTO_STOPPED") setState("AUTO_STOPPED", {
        shutdown_result: state.shutdown_result || { mode: "already_unloaded" },
      });
      return snapshot();
    }
    if (loaded.ok && loadedIds.length > 0) {
      state.model_id = loadedIds[0];
      const safety = await evaluateStopSafety({ treePids });
      if (!safety.safe) {
        cancelTimer();
        setState("SERVING", { last_fences: safety.fences });
        return snapshot();
      }
      armIdleGrace({ reason: "RECONCILE_FOUND_LOADED_IDLE" });
      return snapshot();
    }
    // Catalog probe failed but tree present: keep current state; when uncertain,
    // never stop. If we were mid-grace, leave the timer as-is (stop re-checks).
    return snapshot();
  }

  /**
   * The bounded shutdown orchestration. Fresh fence re-check immediately
   * before any termination. Preferred strategy: exact-model unload; bounded
   * fallback: positively-identified canonical tree stop.
   */
  async function performIdleStop({ reason = "IDLE_GRACE_EXPIRED" } = {}) {
    cancelTimer();
    const identified = await identifyTree();
    const routerPids = identified.ok ? (identified.router_pids || []) : [];
    const treePids = identified.ok ? (identified.tree_pids || []) : [];

    if (!identified.ok) {
      // Nothing provably ours is running: treat as stopped (no kill ever).
      state.router_pids = [];
      state.worker_pids = [];
      if (identified.reason_code === "INVALID_RUNTIME_CONFIG") {
        state.last_error = "INVALID_RUNTIME_CONFIG";
        setState("SHUTDOWN_FAILED", { shutdown_reason: reason });
        return { stopped: false, reason_code: "INVALID_RUNTIME_CONFIG", fences: [] };
      }
      if (state.state !== "AUTO_STOPPED") setState("AUTO_STOPPED", {
        shutdown_reason: reason,
        shutdown_result: { mode: "tree_absent" },
      });
      return { stopped: true, mode: "tree_absent", reason_code: "CANONICAL_TREE_ABSENT", fences: [] };
    }

    state.router_pids = routerPids;
    state.worker_pids = identified.worker_pids || treePids.filter((p) => !routerPids.includes(p));

    // FRESH inactivity fences immediately before shutdown.
    const safety = await evaluateStopSafety({ treePids });
    if (!safety.safe) {
      armIdleGrace({ reason: "STOP_DEFERRED_ACTIVE_FENCE" });
      logEvent("stop:deferred", { fences: safety.fences });
      return { stopped: false, deferred: true, reason_code: "ACTIVE_FENCE", fences: safety.fences };
    }

    // Idempotency: no worker/manager left => already stopped (a bare router
    // supervisor is a negligible lightweight remainder, not heavy work).
    if (state.worker_pids.length === 0) {
      setState("AUTO_STOPPED", {
        shutdown_reason: reason,
        shutdown_result: { mode: "already_unloaded" },
        last_error: null,
      });
      return { stopped: true, mode: "tree_absent", reason_code: "CANONICAL_TREE_ABSENT", fences: safety.fences };
    }

    stopping = true;
    try {
      // Strategy 1: exact-model unload on the canonical router (bounded).
      const baseUrl = identified.base_url;
      const loaded = await listLoadedModels({ baseUrl });
      const unloadResults = [];
      if (loaded.ok && loaded.loaded.length) {
        for (const m of loaded.loaded) {
          const r = await unloadExactModel({ baseUrl, modelId: m.id });
          unloadResults.push({ model: m.id, ok: r.ok === true, classification: r.classification });
        }
        await sleepFn(1_000); // bounded settle before verification
        const after = await listLoadedModels({ baseUrl });
        const stillLoaded = after.ok ? after.loaded.map((m) => m.id) : ["__probe_failed__"];
        if (stillLoaded.length === 0) {
          // Worker released; verify whether heavy processes remain.
          const re = await identifyTree();
          const reRouter = re.ok ? (re.router_pids || []) : [];
          const reWorkers = re.ok ? (re.worker_pids || (re.tree_pids || []).filter((p) => !reRouter.includes(p))) : ["__verify_failed__"];
          state.router_pids = reRouter;
          state.worker_pids = Array.isArray(reWorkers) ? reWorkers : state.worker_pids;
          if (reWorkers.length === 0) {
            setState("AUTO_STOPPED", {
              shutdown_reason: reason,
              shutdown_result: { mode: "model_unload", unloaded: unloadResults },
              last_error: null,
            });
            return { stopped: true, mode: "model_unload", reason_code: "MODEL_UNLOADED", fences: safety.fences };
          }
          // Unload accepted but heavy worker remains => bounded fallback.
        }
      }

      // Strategy 2: stop ONLY the positively identified canonical tree.
      const stopResult = await stopTree(options);
      if (stopResult && stopResult.ok && stopResult.stopped) {
        state.router_pids = [];
        state.worker_pids = [];
        setState("AUTO_STOPPED", {
          shutdown_reason: reason,
          shutdown_result: { mode: "tree_stop", requested_pids: stopResult.requested_pids },
          last_error: null,
        });
        return { stopped: true, mode: "tree_stop", reason_code: "CANONICAL_TREE_STOPPED", fences: safety.fences };
      }
      if (stopResult && stopResult.already_stopped) {
        setState("AUTO_STOPPED", {
          shutdown_reason: reason,
          shutdown_result: { mode: "tree_already_absent" },
          last_error: null,
        });
        return { stopped: true, mode: "tree_absent", reason_code: "CANONICAL_TREE_ABSENT", fences: safety.fences };
      }
      const rc = (stopResult && stopResult.reason_code) || "CANONICAL_STOP_INCOMPLETE";
      state.last_error = rc;
      setState("SHUTDOWN_FAILED", {
        shutdown_reason: reason,
        shutdown_result: { mode: loaded.ok ? "unload_then_tree_stop" : "tree_stop" },
      });
      logEvent("stop:failed", { reason_code: rc });
      return { stopped: false, reason_code: rc, fences: safety.fences };
    } finally {
      stopping = false;
    }
  }

  /** IDLE_CLEAN tick hook: read-only reconcile; never starts Qwen. */
  async function onIdleCleanTick() {
    return reconcile();
  }

  return {
    snapshot,
    reconcile,
    performIdleStop,
    onIdleCleanTick,
    markExecutionStart,
    markExecutionEnd,
    markModelRequestStart,
    markModelRequestEnd,
    markPreflightStart,
    markPreflightEnd,
    armIdleGrace,
    evaluateStopSafety,
    __internal: {
      cancelTimer,
      resolveIdleShutdownMs: (runtime) => idleResolved || resolveIdleShutdownMs(runtime),
    },
  };
}

/** Resolve config once and build the canonical lifecycle (real runtime). */
export function createCanonicalQwenIdleLifecycle(options = {}) {
  const resolved = options.idleShutdownMs
    ? (typeof options.idleShutdownMs === "object" && options.idleShutdownMs !== null
      ? options.idleShutdownMs
      : { ms: Number(options.idleShutdownMs), config_source: "explicit" })
    : (() => {
      let runtime = null;
      try { runtime = loadQwenLocalRuntime(); } catch { runtime = null; }
      return resolveIdleShutdownMs(runtime, options);
    })();
  return createQwenIdleLifecycle({ ...options, idleShutdownMs: resolved });
}

let sharedLifecycle = null;

/** Lazy shared instance for the always-on dispatcher (never created on import). */
export function getSharedQwenIdleLifecycle(options = {}) {
  if (!sharedLifecycle) sharedLifecycle = createCanonicalQwenIdleLifecycle(options);
  return sharedLifecycle;
}

/** Test helper: drop the shared instance between cases. */
export function __resetQwenIdleLifecycleForTests() {
  if (sharedLifecycle && typeof sharedLifecycle.__internal?.cancelTimer === "function") {
    sharedLifecycle.__internal.cancelTimer();
  }
  sharedLifecycle = null;
}
