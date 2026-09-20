#!/usr/bin/env node
/**
 * safe-restart-local-dev-dispatcher-v1 — canonical race-safe restart gate
 * for ControlPlane-V4-LocalDevDispatcher (issue #115).
 *
 * HARD LAW:
 * - LIVE GET /v1/status is the ONLY authority that may authorize restart.
 * - Cached diagnostics / Mission Control / history / prior snapshots NEVER authorize.
 * - Two-phase idle fence: PRECHECK_IDLE → bounded delay → FINAL_PREKILL_IDLE_CHECK.
 * - If either fence fails (active / BUSY / EXECUTING / unavailable / malformed /
 *   ambiguous): ABORT with RESTART_DEFERRED_ACTIVE_EXECUTION (or precise
 *   fail-closed classification). Zero terminate / Stop-ScheduledTask / kill.
 * - Only after BOTH fences PASS may the Scheduled Task be recycled.
 * - No receipt mutation, no tick endpoint calls, no executor invocation.
 *
 * Canonical entrypoint for ALL dispatcher maintenance restarts.
 */
import { spawnSync } from "node:child_process";

export const SAFE_RESTART_MODULE_VERSION = "safe-restart-local-dev-dispatcher-v1";
export const CANONICAL_TASK_NAME = "ControlPlane-V4-LocalDevDispatcher";
export const STATUS_URL = "http://127.0.0.1:18793/v1/status";
export const DIAGNOSTICS_URL = "http://127.0.0.1:18793/v1/diagnostics";
export const LISTENER_HOST = "127.0.0.1";
export const LISTENER_PORT = 18793;
export const DEFAULT_RACE_FENCE_MS = 1500;
export const DEFAULT_POST_RESTART_WAIT_MS = 3000;
export const DEFAULT_POST_RESTART_SETTLE_MS = 30000;
export const DEFAULT_POST_RESTART_POLL_MS = 2000;
export const SUPERVISOR_SCRIPT_TOKEN = "run-local-dev-dispatcher-supervisor-v1.ps1";
export const DISPATCHER_SCRIPT_TOKEN = "serve-local-dev-autonomous-dispatcher-v1.mjs";

export const RESULT_RESTART_EXECUTED = "RESTART_EXECUTED";
export const RESULT_DEFERRED_ACTIVE = "RESTART_DEFERRED_ACTIVE_EXECUTION";
export const RESULT_DEFERRED_UNAVAILABLE = "RESTART_DEFERRED_STATUS_UNAVAILABLE";
export const RESULT_DEFERRED_AMBIGUOUS = "RESTART_DEFERRED_STATUS_AMBIGUOUS";
export const RESULT_POST_RESTART_VERIFY_FAILED = "RESTART_POST_VERIFY_FAILED";

/**
 * Evaluate a LIVE /v1/status HTTP observation. Never consult diagnostics.
 * @returns {{ idle: boolean, classification: string, detail: string, active: boolean|null }}
 */
export function evaluateLiveStatusObservation({
  httpOk = false,
  statusCode = 0,
  bodyText = null,
  parseError = null,
  body = null,
} = {}) {
  if (!httpOk || statusCode !== 200) {
    return {
      idle: false,
      classification: RESULT_DEFERRED_UNAVAILABLE,
      detail: `status_http_${statusCode || "fail"}`,
      active: null,
    };
  }
  if (parseError) {
    return {
      idle: false,
      classification: RESULT_DEFERRED_AMBIGUOUS,
      detail: "status_json_invalid",
      active: null,
    };
  }
  const obj = body && typeof body === "object" && !Array.isArray(body) ? body : null;
  if (!obj) {
    return {
      idle: false,
      classification: RESULT_DEFERRED_AMBIGUOUS,
      detail: "status_body_not_object",
      active: null,
    };
  }
  if (!Object.prototype.hasOwnProperty.call(obj, "active") || typeof obj.active !== "boolean") {
    return {
      idle: false,
      classification: RESULT_DEFERRED_AMBIGUOUS,
      detail: "active_field_missing_or_non_boolean",
      active: null,
    };
  }
  if (obj.active === true) {
    return {
      idle: false,
      classification: RESULT_DEFERRED_ACTIVE,
      detail: "active_true",
      active: true,
      task_ref: typeof obj.task_ref === "string" ? obj.task_ref : null,
      phase: typeof obj.phase === "string" ? obj.phase : null,
    };
  }
  const classification = typeof obj.classification === "string" ? obj.classification : null;
  const phase = typeof obj.phase === "string" ? obj.phase : null;
  if (classification === "BUSY") {
    return {
      idle: false,
      classification: RESULT_DEFERRED_ACTIVE,
      detail: "classification_BUSY",
      active: false,
      phase,
    };
  }
  if (phase === "EXECUTING" || phase === "OPENCODE" || phase === "QWEN_PREFLIGHT"
    || phase === "TESTS" || phase === "PERSISTENCE" || phase === "CLAIM") {
    return {
      idle: false,
      classification: RESULT_DEFERRED_ACTIVE,
      detail: `phase_${phase}`,
      active: false,
      phase,
    };
  }
  // active===false and no in-flight phase → idle for restart purposes
  return {
    idle: true,
    classification: "IDLE_CONFIRMED",
    detail: classification || phase || "active_false",
    active: false,
    phase,
    task_ref: obj.task_ref ?? null,
  };
}

/** Fetch LIVE /v1/status only. Diagnostics must not be used for authorization. */
export async function fetchLiveStatus(fetchImpl, url = STATUS_URL) {
  try {
    const res = await fetchImpl(url, { method: "GET", headers: { Accept: "application/json" } });
    const statusCode = Number(res?.status) || 0;
    const bodyText = typeof res?.text === "function" ? await res.text() : String(res?.body ?? "");
    let body = null;
    let parseError = null;
    try {
      body = JSON.parse(bodyText);
    } catch (err) {
      parseError = err;
    }
    return evaluateLiveStatusObservation({
      httpOk: statusCode === 200,
      statusCode,
      bodyText,
      parseError,
      body,
    });
  } catch (err) {
    return {
      idle: false,
      classification: RESULT_DEFERRED_UNAVAILABLE,
      detail: `fetch_threw:${String(err?.message || err).slice(0, 80)}`,
      active: null,
    };
  }
}

function sleepMs(ms, sleepImpl) {
  const n = Math.max(0, Number(ms) || 0);
  if (typeof sleepImpl === "function") return Promise.resolve(sleepImpl(n));
  return new Promise((resolve) => setTimeout(resolve, n));
}

/**
 * Canonical safe restart orchestrator. All destructive actions are injected
 * so tests can prove zero terminate calls when blocked.
 */
export async function safeRestartLocalDevDispatcher({
  fetchImpl = globalThis.fetch,
  sleepImpl = null,
  raceFenceMs = DEFAULT_RACE_FENCE_MS,
  postRestartWaitMs = DEFAULT_POST_RESTART_WAIT_MS,
  postRestartSettleMs = DEFAULT_POST_RESTART_SETTLE_MS,
  postRestartPollMs = DEFAULT_POST_RESTART_POLL_MS,
  // Destructive ops — default to real Windows Scheduled Task recycle.
  endScheduledTask = defaultEndScheduledTask,
  startScheduledTask = defaultStartScheduledTask,
  killOrphanDispatcherTree = defaultKillOrphanDispatcherTree,
  reapExtraSupervisors = defaultReapExtraSupervisors,
  verifyIdentity = defaultVerifyIdentity,
  // Explicitly ignored if provided — diagnostics must never authorize.
  cachedDiagnostics = null,
  nowIso = null,
} = {}) {
  void cachedDiagnostics; // hard law: unused for authorization
  const terminateCalls = [];
  const wrapEnd = async (...args) => {
    terminateCalls.push({ op: "endScheduledTask", at: new Date().toISOString() });
    return endScheduledTask(...args);
  };
  const wrapKill = async (...args) => {
    terminateCalls.push({ op: "killOrphanDispatcherTree", at: new Date().toISOString() });
    return killOrphanDispatcherTree(...args);
  };

  const precheck = await fetchLiveStatus(fetchImpl, STATUS_URL);
  if (!precheck.idle) {
    return {
      ok: false,
      result: precheck.classification === RESULT_DEFERRED_UNAVAILABLE || precheck.classification === RESULT_DEFERRED_AMBIGUOUS
        ? precheck.classification
        : RESULT_DEFERRED_ACTIVE,
      phase: "PRECHECK_IDLE",
      precheck,
      final_prekill: null,
      restart_executed: false,
      terminate_calls: terminateCalls.length,
      terminate_log: terminateCalls,
      post_verify: null,
      now: nowIso || new Date().toISOString(),
    };
  }

  await sleepMs(raceFenceMs, sleepImpl);

  const finalPrekill = await fetchLiveStatus(fetchImpl, STATUS_URL);
  if (!finalPrekill.idle) {
    return {
      ok: false,
      result: finalPrekill.classification === RESULT_DEFERRED_UNAVAILABLE || finalPrekill.classification === RESULT_DEFERRED_AMBIGUOUS
        ? finalPrekill.classification
        : RESULT_DEFERRED_ACTIVE,
      phase: "FINAL_PREKILL_IDLE_CHECK",
      precheck,
      final_prekill: finalPrekill,
      restart_executed: false,
      terminate_calls: terminateCalls.length,
      terminate_log: terminateCalls,
      post_verify: null,
      now: nowIso || new Date().toISOString(),
    };
  }

  // AUTHORIZED — first destructive action only after both fences PASS.
  const endResult = await wrapEnd(CANONICAL_TASK_NAME);
  await wrapKill();

  // Fail-closed settle: do not Start while any prior supervisor/dispatcher/listener remains.
  const drainMs = Math.max(Number(postRestartWaitMs) || 0, 1000);
  const drainDeadline = Date.now() + Math.max(Number(postRestartSettleMs) || 0, drainMs);
  let drained = false;
  for (;;) {
    const snap = await verifyIdentity({
      fetchImpl,
      taskName: CANONICAL_TASK_NAME,
      statusUrl: STATUS_URL,
      diagnosticsUrl: DIAGNOSTICS_URL,
      requireHttp: false,
    });
    const supervisors = Number(snap.supervisor_count) || 0;
    const dispatchers = Number(snap.dispatcher_child_count) || 0;
    const listeners = Number(snap.listener_count) || 0;
    // Drain authority: listener + dispatcher must be gone. Supervisor is
    // best-effort (killed every loop); a lone supervisor without a listener
    // is not an active execution and must not block Start forever.
    if (dispatchers === 0 && listeners === 0 && supervisors === 0) {
      drained = true;
      break;
    }
    if (Date.now() >= drainDeadline) break;
    await wrapKill();
    await sleepMs(Math.max(Number(postRestartPollMs) || 0, 500), sleepImpl);
  }
  if (!drained) {
    // Always attempt Start to restore service after authorized teardown began.
    const startResult = await startScheduledTask(CANONICAL_TASK_NAME);
    await sleepMs(Math.max(Number(postRestartWaitMs) || 0, 3000), sleepImpl);
    const restored = await verifyIdentity({
      fetchImpl,
      taskName: CANONICAL_TASK_NAME,
      statusUrl: STATUS_URL,
      diagnosticsUrl: DIAGNOSTICS_URL,
    });
    return {
      ok: false,
      result: RESULT_POST_RESTART_VERIFY_FAILED,
      phase: "PRE_START_DRAIN",
      precheck,
      final_prekill: finalPrekill,
      restart_executed: true,
      end_result: endResult,
      start_result: startResult,
      terminate_calls: terminateCalls.length,
      terminate_log: terminateCalls,
      post_verify: {
        ok: false,
        detail: "prior_dispatcher_tree_not_drained",
        drained: false,
        restored_attempt: restored,
      },
      now: nowIso || new Date().toISOString(),
    };
  }

  const startResult = await startScheduledTask(CANONICAL_TASK_NAME);
  await sleepMs(Math.max(Number(postRestartWaitMs) || 0, 2000), sleepImpl);
  if (typeof reapExtraSupervisors === "function") {
    try { await reapExtraSupervisors(); } catch { /* best-effort */ }
  }

  const settleMs = Math.max(0, Number(postRestartSettleMs) || 0);
  const pollMs = Math.max(0, Number(postRestartPollMs) || 0);
  const deadline = Date.now() + settleMs;
  let postVerify = await verifyIdentity({
    fetchImpl,
    taskName: CANONICAL_TASK_NAME,
    statusUrl: STATUS_URL,
    diagnosticsUrl: DIAGNOSTICS_URL,
  });
  while (!postVerify.ok && Date.now() < deadline) {
    if ((Number(postVerify.supervisor_count) || 0) > 1 && typeof reapExtraSupervisors === "function") {
      try { await reapExtraSupervisors(); } catch { /* best-effort */ }
    }
    await sleepMs(pollMs || 1, sleepImpl);
    postVerify = await verifyIdentity({
      fetchImpl,
      taskName: CANONICAL_TASK_NAME,
      statusUrl: STATUS_URL,
      diagnosticsUrl: DIAGNOSTICS_URL,
    });
  }

  if (!postVerify.ok) {
    return {
      ok: false,
      result: RESULT_POST_RESTART_VERIFY_FAILED,
      phase: "POST_RESTART_VERIFY",
      precheck,
      final_prekill: finalPrekill,
      restart_executed: true,
      end_result: endResult,
      start_result: startResult,
      terminate_calls: terminateCalls.length,
      terminate_log: terminateCalls,
      post_verify: postVerify,
      now: nowIso || new Date().toISOString(),
    };
  }

  return {
    ok: true,
    result: RESULT_RESTART_EXECUTED,
    phase: "RESTART_EXECUTED",
    precheck,
    final_prekill: finalPrekill,
    restart_executed: true,
    end_result: endResult,
    start_result: startResult,
    terminate_calls: terminateCalls.length,
    terminate_log: terminateCalls,
    post_verify: postVerify,
    now: nowIso || new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Default Windows adapters (live only; tests inject fakes)             */
/* ------------------------------------------------------------------ */

export function defaultEndScheduledTask(taskName = CANONICAL_TASK_NAME) {
  // Stop only — do not Disable (Disable+Enable races Task Scheduler into dual supervisors).
  const r = spawnSync("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-Command",
    `Stop-ScheduledTask -TaskName '${taskName}' -ErrorAction SilentlyContinue; schtasks.exe /End /TN '${taskName}' 2>$null | Out-Null; 'OK'`,
  ], { encoding: "utf8", windowsHide: true });
  return { ok: true, status: r.status, stdout: String(r.stdout || "").slice(0, 400), stderr: String(r.stderr || "").slice(0, 400) };
}

export function defaultStartScheduledTask(taskName = CANONICAL_TASK_NAME) {
  const ps = [
    "$ErrorActionPreference='SilentlyContinue'",
    `Start-ScheduledTask -TaskName '${taskName}'`,
    "$deadline = (Get-Date).AddSeconds(20)",
    "do { Start-Sleep -Milliseconds 500; $st = (Get-ScheduledTask -TaskName '" + taskName + "').State } while ($st -ne 'Running' -and (Get-Date) -lt $deadline)",
    "Write-Output (\"state=$st\")",
  ].join("; ");
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", windowsHide: true });
  return { ok: r.status === 0, status: r.status, stdout: String(r.stdout || "").slice(0, 400), stderr: String(r.stderr || "").slice(0, 400) };
}

export function defaultKillOrphanDispatcherTree() {
  // Two-step: list matching PIDs, then taskkill /F /T from Node.
  // Kill PowerShell supervisors BEFORE node children so the supervisor
  // while-loop cannot relaunch during the drain window.
  const listPs = [
    "$ErrorActionPreference='SilentlyContinue'",
    "$me=$PID; $sup=@(); $dis=@()",
    "Get-CimInstance Win32_Process | ForEach-Object {",
    "  if ($_.ProcessId -eq $me) { return }",
    "  if (-not $_.CommandLine) { return }",
    "  if (($_.Name -match 'powershell|pwsh') -and ($_.CommandLine -like '*-File*') -and ($_.CommandLine -like '*" + SUPERVISOR_SCRIPT_TOKEN + "*')) { $sup += $_.ProcessId }",
    "  if (($_.Name -eq 'node.exe') -and ($_.CommandLine -like '*" + DISPATCHER_SCRIPT_TOKEN + "*')) { $dis += $_.ProcessId }",
    "}",
    "Write-Output (('SUP=' + ($sup -join ',')) + ';DIS=' + ($dis -join ','))",
  ].join("\n");
  const listed = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", listPs], { encoding: "utf8", windowsHide: true });
  const raw = String(listed.stdout || "");
  const supMatch = /SUP=([^;]*)/.exec(raw);
  const disMatch = /DIS=(.*)/.exec(raw);
  const parseIds = (s) => String(s || "").split(/[,\r\n]+/).map((x) => x.trim()).filter((x) => /^\d+$/.test(x));
  const supPids = parseIds(supMatch && supMatch[1]);
  const disPids = parseIds(disMatch && disMatch[1]);
  const ordered = [...supPids, ...disPids];
  const killed = [];
  const errors = [];
  for (const pid of ordered) {
    const r = spawnSync("taskkill.exe", ["/F", "/T", "/PID", pid], { encoding: "utf8", windowsHide: true });
    const out = String(r.stdout || "") + String(r.stderr || "");
    if (r.status === 0 || /riuscita|success/i.test(out)) killed.push(pid);
    else errors.push({ pid, status: r.status, out: out.slice(0, 160) });
  }
  return { ok: true, killed_pids: killed, listed_pids: ordered, supervisor_pids: supPids, dispatcher_pids: disPids, errors, list_status: listed.status };
}

export function defaultReapExtraSupervisors() {
  const listPs = [
    "$ErrorActionPreference='SilentlyContinue'",
    "$me=$PID; $sup=@(); $keep=@()",
    "Get-CimInstance Win32_Process | ForEach-Object {",
    "  if ($_.ProcessId -eq $me) { return }",
    "  if (-not $_.CommandLine) { return }",
    "  if (($_.Name -eq 'node.exe') -and ($_.CommandLine -like '*" + DISPATCHER_SCRIPT_TOKEN + "*')) { $keep += $_.ParentProcessId }",
    "  if (($_.Name -match 'powershell|pwsh') -and ($_.CommandLine -like '*-File*') -and ($_.CommandLine -like '*" + SUPERVISOR_SCRIPT_TOKEN + "*')) { $sup += $_.ProcessId }",
    "}",
    "Write-Output (('SUP=' + ($sup -join ',')) + ';KEEP=' + ($keep -join ','))",
  ].join("\n");
  const listed = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", listPs], { encoding: "utf8", windowsHide: true });
  const raw = String(listed.stdout || "");
  const parseIds = (label) => {
    const m = new RegExp(label + "=([^;]*)").exec(raw);
    return String((m && m[1]) || "").split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  };
  const sup = parseIds("SUP");
  const keep = new Set(parseIds("KEEP"));
  const killed = [];
  if (sup.length <= 1) return { ok: true, killed_pids: [], supervisor_pids: sup, keep_pids: [...keep] };
  for (const pid of sup) {
    if (keep.has(pid)) continue;
    const r = spawnSync("taskkill.exe", ["/F", "/T", "/PID", pid], { encoding: "utf8", windowsHide: true });
    const out = String(r.stdout || "") + String(r.stderr || "");
    if (r.status === 0 || /riuscita|success/i.test(out)) killed.push(pid);
  }
  return { ok: true, killed_pids: killed, supervisor_pids: sup, keep_pids: [...keep] };
}

export async function defaultVerifyIdentity({
  fetchImpl = globalThis.fetch,
  taskName = CANONICAL_TASK_NAME,
  statusUrl = STATUS_URL,
  diagnosticsUrl = DIAGNOSTICS_URL,
  requireHttp = true,
} = {}) {
  const taskState = (() => {
    const r = spawnSync("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-Command",
      `(Get-ScheduledTask -TaskName '${taskName}' -ErrorAction SilentlyContinue).State`,
    ], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").trim();
  })();

  const census = (() => {
    // Newlines (not ';') — a leading ';' inside @{...} breaks ConvertTo-Json.
    const ps = [
      "$ErrorActionPreference='SilentlyContinue'",
      "$me = $PID",
      "$supervisors = @()",
      "$dispatchers = @()",
      "Get-CimInstance Win32_Process | ForEach-Object {",
      "  if ($_.ProcessId -eq $me) { return }",
      "  if (-not $_.CommandLine) { return }",
      // Real supervisor is launched with -File; census/kill helpers use -Command and must not count themselves.
      "  if (($_.Name -match 'powershell|pwsh') -and ($_.CommandLine -like '*-File*') -and ($_.CommandLine -like '*" + SUPERVISOR_SCRIPT_TOKEN + "*')) { $supervisors += $_ }",
      "  if (($_.Name -eq 'node.exe') -and ($_.CommandLine -like '*" + DISPATCHER_SCRIPT_TOKEN + "*')) { $dispatchers += $_ }",
      "}",
      "$listeners = @(Get-NetTCPConnection -LocalAddress " + LISTENER_HOST + " -LocalPort " + LISTENER_PORT + " -State Listen -ErrorAction SilentlyContinue)",
      "[pscustomobject]@{",
      "  supervisor_count = @($supervisors).Count",
      "  dispatcher_count = @($dispatchers).Count",
      "  listener_count = @($listeners).Count",
      "  supervisor_pids = @($supervisors | ForEach-Object { $_.ProcessId }) -join ','",
      "  dispatcher_pids = @($dispatchers | ForEach-Object { $_.ProcessId }) -join ','",
      "  dispatcher_ppids = @($dispatchers | ForEach-Object { $_.ParentProcessId }) -join ','",
      "  listener_pids = @($listeners | ForEach-Object { $_.OwningProcess }) -join ','",
      "} | ConvertTo-Json -Compress",
    ].join("\n");
    const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", windowsHide: true });
    try { return JSON.parse(String(r.stdout || "").trim() || "{}"); } catch {
      return {
        parse_error: true,
        raw: String(r.stdout || "").slice(0, 300),
        stderr: String(r.stderr || "").slice(0, 300),
      };
    }
  })();

  let statusHttp = 0;
  let diagnosticsHttp = 0;
  if (requireHttp) {
    try {
      const s = await fetchImpl(statusUrl, { method: "GET" });
      statusHttp = Number(s?.status) || 0;
    } catch { statusHttp = 0; }
    try {
      const d = await fetchImpl(diagnosticsUrl, { method: "GET" });
      diagnosticsHttp = Number(d?.status) || 0;
    } catch { diagnosticsHttp = 0; }
  }

  const supervisorCount = Number(census.supervisor_count) || 0;
  const dispatcherCount = Number(census.dispatcher_count) || 0;
  const listenerCount = Number(census.listener_count) || 0;
  const dispatcherPpids = String(census.dispatcher_ppids || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const supervisorPids = String(census.supervisor_pids || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const parentOwned = dispatcherCount === 1
    && dispatcherPpids.length === 1
    && supervisorPids.includes(dispatcherPpids[0]);
  const ok = requireHttp
    ? (taskState === "Running"
      && supervisorCount === 1
      && dispatcherCount === 1
      && listenerCount === 1
      && statusHttp === 200
      && diagnosticsHttp === 200
      && parentOwned)
    : true;

  return {
    ok,
    task_state: taskState,
    supervisor_count: supervisorCount,
    dispatcher_child_count: dispatcherCount,
    listener_count: listenerCount,
    listener_bind: `${LISTENER_HOST}:${LISTENER_PORT}`,
    status_http: statusHttp,
    diagnostics_http: diagnosticsHttp,
    census,
  };
}

/* ------------------------------------------------------------------ */
/* CLI                                                                  */
/* ------------------------------------------------------------------ */

const isCli = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("tools/safe-restart-local-dev-dispatcher-v1.mjs");
if (isCli) {
  const dryFence = process.argv.includes("--dry-fence-only");
  const result = await safeRestartLocalDevDispatcher({
    raceFenceMs: DEFAULT_RACE_FENCE_MS,
    postRestartWaitMs: DEFAULT_POST_RESTART_WAIT_MS,
    ...(dryFence ? {
      endScheduledTask: async () => ({ ok: true, dry: true }),
      startScheduledTask: async () => ({ ok: true, dry: true }),
      killOrphanDispatcherTree: async () => ({ ok: true, dry: true, killed_pids: [] }),
      verifyIdentity: async () => ({ ok: true, dry: true }),
    } : {}),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.ok) process.exit(0);
  if (String(result.result || "").startsWith("RESTART_DEFERRED")) process.exit(2);
  process.exit(1);
}
