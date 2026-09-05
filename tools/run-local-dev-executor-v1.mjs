#!/usr/bin/env node
/**
 * V4 — LOCAL_DEV_EXECUTOR live runner (composition layer).
 *
 * Composes concrete collaborators for tools/local-dev-executor-v1.mjs:
 *   ensureQwenReady (session manager) · guardStart (DEV guard)
 *   runOpenCodeTask (ONE opencode process via DEV guard URL only)
 *   runTests (bounded cycles) · persistGit (selective staging, target repo only)
 *
 * Contract: docs/contracts/local-dev-executor-v1.md
 * No production authorization, no WF40/D-0025/scope-v3, no eligible-set use.
 *
 * Usage:
 *   node tools/run-local-dev-executor-v1.mjs --input-file <envelope.json>
 *                                             [--release-started-router]
 *
 * --release-started-router: opt-in; if this task EXCLUSIVELY started the
 * router, rediscover live process identity then stop it (never stale PIDs).
 */
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, execFile } from "node:child_process";
import { executeLocalDevTask, pathAllowed, DEV_PROFILE_CATEGORY, sanitizeOpenCodeDiagnostic } from "./local-dev-executor-v1.mjs";
import { ensureWorkstationDevQwenReady } from "./qwen-local-session-manager-v1.mjs";
import { probeOpenCodeLocal } from "./probe-opencode-local-v1.mjs";
import { startLocalDevGenerationGuard } from "./local-dev-generation-guard-v1.mjs";

export const DIRECT_QWEN_ENDPOINT = "http://127.0.0.1:8080";

/** Ordered deny-all-first V1 permission overlay (fail-closed enforcement). */
export function buildPermissionOverlay({ allowedCommands, allowedPaths, networkPolicy }) {
  const bash = { "*": "deny" };
  for (const command of allowedCommands) {
    const trimmed = String(command).trim();
    if (!trimmed) continue;
    if (bash[trimmed] === "deny") delete bash[trimmed];
    bash[trimmed] = "allow";
  }
  const edit = { "*": "deny" };
  for (const pathGlob of allowedPaths) {
    const trimmed = String(pathGlob).trim();
    if (!trimmed) continue;
    edit[trimmed] = "allow";
    // V1 glob semantics: expose both `dir/*` and `dir/**` forms for path prefixes.
    if (trimmed.endsWith("/**")) edit[`${trimmed.slice(0, -3)}/*`] = "allow";
  }
  const permission = {
    bash,
    edit,
    webfetch: "deny",
    websearch: "deny",
  };
  // network_policy remains executor metadata only. OpenCode V1 treats every
  // key inside `permission` as a PermissionActionConfig, so undocumented
  // metadata must never be serialized here. Both supported policies remain
  // fail-closed for web tools; Qwen model traffic uses the DEV guard.
  return permission;
}

/** Merge provider overlay + V1 permission enforcement into one config. */
export function buildOpenCodeRuntimeConfig({ providerOverlay, permissionOverlay }) {
  return {
    ...providerOverlay,
    permission: permissionOverlay,
  };
}

export function defaultSpawn(executable, args, opts = {}) {
  let child;
  let settled = false;
  // Phase B fix: stdout/stderr live in the OUTER handle scope so getOutput()
  // stays valid across the whole child lifecycle (before/after termination).
  // The promise executor only closes over them — no ReferenceError possible.
  let stdout = "";
  let stderr = "";
  const promise = new Promise((resolvePromise) => {
    child = spawn(executable, args, {
      cwd: opts.cwd,
      env: opts.env,
      windowsHide: true,
      shell: Boolean(opts.shell),
      // stdin IGNORED: the ratified production invocation shape. An open,
      // never-closed stdin pipe stalls the OpenCode CLI bootstrap post-init
      // (RETRY4/RETRY5 pre-generation stall; production adapter proof Aug 31).
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (d) => (stdout += d));
    child.stderr?.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      settled = true;
      resolvePromise({
        status: 1,
        error: err?.message || "spawn_error",
        spawn_error: err?.message || "spawn_error",
        spawn_error_code: err?.code || "SPAWN_ERROR",
        spawn_failure: true,
        stdout,
        stderr,
      });
    });
    child.on("close", (code) => {
      settled = true;
      resolvePromise({ status: code ?? 1, stdout, stderr, pid: child.pid });
    });
  });
  const waitForExit = (ms) => Promise.race([
    promise.then(() => true),
    new Promise((resolvePromise) => setTimeout(() => resolvePromise(false), ms)),
  ]);
  return {
    pid: child?.pid ?? null,
    promise,
    getOutput: () => ({ stdout, stderr }), // outer-scope capture: valid before AND after termination

    terminate: async () => {
      const pid = child?.pid ?? null;
      const termination = {
        child_pid: pid,
        termination_requested: true,
        termination_confirmed: false,
        termination_method: null,
        exit_code_after_termination: null,
      };
      if (!child || settled) {
        termination.termination_confirmed = settled;
        termination.termination_method = settled ? "already_exited" : "no_child_handle";
        return termination;
      }
      try {
        child.kill();
        termination.termination_method = "child.kill";
      } catch {
        termination.termination_method = "child.kill_failed";
      }
      if (await waitForExit(1500)) {
        termination.termination_confirmed = true;
        termination.exit_code_after_termination = (await promise).status;
        return termination;
      }
      if (process.platform === "win32" && pid) {
        await new Promise((resolvePromise) => {
          execFile("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true }, () => resolvePromise());
        });
        termination.termination_method = "taskkill_pid_tree";
        if (await waitForExit(1500)) {
          termination.termination_confirmed = true;
          termination.exit_code_after_termination = (await promise).status;
        }
      }
      return termination;
    },
  };
}

function asSpawnHandle(value) {
  if (value && typeof value === "object" && value.promise && typeof value.promise.then === "function") {
    return value;
  }
  return {
    pid: null,
    promise: Promise.resolve(value),
    getOutput: () => ({ stdout: "", stderr: "" }),
    terminate: async () => ({
      child_pid: null,
      termination_requested: true,
      termination_confirmed: false,
      termination_method: "no_child_handle",
      exit_code_after_termination: null,
    }),
  };
}

function defaultGitExec(repoPath, args) {
  return new Promise((resolvePromise) => {
    execFile("git", ["-C", repoPath, ...args], { windowsHide: true }, (err, stdout, stderr) => {
      resolvePromise({ status: err ? 1 : 0, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

/**
 * Windows npm-shim spawn fix: shared no-shell resolver in
 * tools/opencode-binary-resolution-v1.mjs (single source of truth for both
 * the live runner and the local CLI probe). Resolve the REAL package
 * executable instead of the shim; a `.cmd`/`.bat` shim that cannot be
 * resolved is rejected fail-closed (never silently shelled out).
 */
import { resolveOpenCodeSpawnTarget } from "./opencode-binary-resolution-v1.mjs";
export { resolveOpenCodeSpawnTarget };

/** Bounded task message for the single OpenCode run (no secrets, structural).
 * Hardened for convergence: reinforces scope, tool policy, and explicit
 * create-vs-modify semantics (absence of a CREATE target is EXPECTED). */
export function buildTaskMessage(envelope) {
  const lines = [
    `LOCAL_DEV task ${envelope.task_ref}`,
    `TASK DELTA: ${envelope.task_delta}`,
    `Allowed paths: ${envelope.allowed_paths.join(", ")}`,
    `Allowed commands: ${envelope.allowed_commands.join("; ")}`,
  ];
  const kind = envelope.task_kind === "CREATE" ||
    /Execution mode: CREATE\b/.test(String(envelope.task_delta || ""))
    ? "CREATE" : "MODIFY";
  if (kind === "CREATE") {
    lines.push(
      "File policy: the target file MAY NOT EXIST yet; its absence is EXPECTED, not a blocker. Create it directly with the file edit tool; never read it before initial creation; never probe existence via shell.",
    );
  }
  lines.push(
    "Tool policy: use only the permitted file edit tool for file changes and only the allowed commands above; no shell existence probes; no subagents; no delegation.",
    "Stop exploring as soon as every acceptance criterion is satisfied; do not spend turns on further verification.",
  );
  if (envelope.test_command) lines.push(`Test command: ${envelope.test_command}`);
  lines.push(
    `Bounds: timebox ${envelope.timebox_seconds}s, max turns ${envelope.max_agent_turns}, max test cycles ${envelope.max_test_cycles}.`,
    `Stop at the first uncorrectable blocker. No destructive git commands.`,
  );
  const text = lines.join("\n");
  return text.length > 4000 ? text.slice(0, 4000) : text;
}

/** ensureQwenReady adapter: DEV session bridge + router_was_running flag. */
export function makeEnsureQwenReady(ensure = ensureWorkstationDevQwenReady) {
  return async ({ profile }) => {
    const session = await ensure({ profile });
    return { ...session, router_was_running: session?.status === "READY" };
  };
}

/** ONE OpenCode process per task; target is ALWAYS the DEV guard URL.
 * Hard wall-clock timeout: the child process is terminated on expiry. */
export function makeRunOpenCodeTask(deps = {}) {
  const probe = deps.probe || probeOpenCodeLocal;
  const spawnProc = deps.spawnProc || defaultSpawn;
  const hardTimeoutMs = deps.hardTimeoutMs ?? 90_000;
  const makeTempConfig =
    deps.makeTempConfig ||
    ((config) => {
      const dir = mkdtempSync(join(tmpdir(), "lde-oc-config-"));
      const p = join(dir, "opencode.json");
      writeFileSync(p, JSON.stringify(config), "utf8");
      return p;
    });
  // Deterministic config-schema gate: the EXACT generated config must be
  // accepted by the INSTALLED opencode (`debug config` resolves it or we
  // fail closed before any run). Read-only wrt the repository; the temp
  // file lives in the OS temp dir. Set deps.debugConfig for tests.
  const debugConfig = deps.debugConfig || ((configPath) => new Promise((resolvePromise) => {
    execFile("opencode.exe", ["debug", "config"], {
      env: { ...process.env, OPENCODE_CONFIG: configPath },
      timeout: 30_000,
      windowsHide: true,
    }, (err, stdout) => resolvePromise({ ok: !err, stdout: stdout || "", error: err?.message }));
  }));
  const removeTempConfig = deps.removeTempConfig || ((p) => { try { unlinkSync(p); } catch { /* best effort */ } });

  return async ({ guardBaseUrl, modelId, modelSelector, providerOverlay, capabilities, envelope }) => {
    if (!guardBaseUrl || guardBaseUrl === DIRECT_QWEN_ENDPOINT || !guardBaseUrl.startsWith("http://127.0.0.1:")) {
      throw Object.assign(new Error("opencode target must be the DEV guard URL, never :8080 directly"), {
        code: "GUARD_TARGET_IS_DIRECT_QWEN_ENDPOINT",
      });
    }
    const probeResult = probe();
    if (!probeResult?.available || !probeResult.dispatch_interface_resolved) {
      throw Object.assign(new Error("opencode unavailable"), { code: "PREFLIGHT_TOOLING_UNAVAILABLE" });
    }
    // Windows shim fix: never spawn the .cmd shim with shell:false (EINVAL);
    // resolve the real package binary and keep literal no-shell argv.
    const spawnTarget = resolveOpenCodeSpawnTarget(probeResult.executable);
    if (!spawnTarget.executable) {
      throw Object.assign(new Error(spawnTarget.reason || "opencode spawn target unresolved"), {
        code: spawnTarget.reason_code || "OPENCODE_SPAWN_TARGET_UNRESOLVED",
      });
    }
    const caps = capabilities || probeResult.capabilities;
    const permissionOverlay = buildPermissionOverlay({
      allowedCommands: envelope.allowed_commands,
      allowedPaths: envelope.allowed_paths,
      networkPolicy: envelope.network_policy,
    });
    const runtimeConfig = buildOpenCodeRuntimeConfig({ providerOverlay, permissionOverlay });
    const configPath = makeTempConfig(runtimeConfig);
    // Fail closed if the INSTALLED OpenCode rejects the exact generated config.
    const cfgCheck = await debugConfig(configPath);
    if (!cfgCheck.ok) {
      removeTempConfig(configPath);
      throw Object.assign(new Error("opencode rejected generated config (debug config failed)"), {
        code: "OPENCODE_CONFIG_REJECTED",
        detail: cfgCheck.error || "unknown",
      });
    }
    let run;
    let timer = null;
    try {
      const argv = [
        caps.subcommand,
        caps.directory_flag, envelope.target_repo_path,
        caps.model_flag, modelSelector,
        caps.format_flag, caps.format_json_value,
        caps.auto_flag,
        buildTaskMessage(envelope),
      ];
      // HARD TIMEBOX + Phase A arbitration: bound the child process itself.
      // Once the hard timeout fires, the child's exit (status 1, close event,
      // promise resolution) is a CONSEQUENCE of task-owned termination and
      // must NEVER reclassify the result as OPENCODE_RUN_FAILED. The
      // arbitration flag flips synchronously when the timer fires — BEFORE
      // terminate() — so any subsequent child resolution is suspended and the
      // race can only be won by the BOUNDS_TIMEBOX_EXPIRED rejection, which
      // still carries the FULL termination diagnostics (bounded confirmation
      // window) and sanitized stdout/stderr excerpts (Phase B capture).
      const timeoutMs = Math.max(1, envelope.timebox_seconds) * 1000;
      const spawned = asSpawnHandle(spawnProc(spawnTarget.executable, argv, {
        cwd: envelope.target_repo_path,
        env: {
          ...process.env,
          OPENCODE_CONFIG: configPath,
          // Ratified live-proof disable suite (mirrors the production adapter
          // that reached provider stream on this workstation): no network
          // plugin fetches / autoupdate during the bounded DEV run.
          OPENCODE_DISABLE_TITLE: "1",
          OPENCODE_DISABLE_AUTOCOMPACT: "1",
          OPENCODE_DISABLE_MODELS_FETCH: "1",
          OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
          OPENCODE_DISABLE_CLAUDE_CODE: "1",
          OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
          OPENCODE_DISABLE_AUTOUPDATE: "1",
          OPENCODE_DISABLE_PRUNE: "1",
        },
        shell: false, // no-shell: argv stays literal data, never shell syntax
      }));
      let timedOut = false;
      const childOutcome = spawned.promise.then((r) =>
        timedOut ? new Promise(() => {}) : r, // suspend: exit is kill evidence, not a classification
      );
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(async () => {
          timedOut = true; // Phase A arbitration flips BEFORE any await
          const termination = await spawned.terminate();
          const output = spawned.getOutput ? spawned.getOutput() : {};
          reject(Object.assign(new Error(`opencode exceeded hard timebox ${envelope.timebox_seconds}s`), {
            code: "BOUNDS_TIMEBOX_EXPIRED",
            timeout_diagnostics: {
              ...termination,
              stdout_excerpt: sanitizeOpenCodeDiagnostic(output.stdout),
              stderr_excerpt: sanitizeOpenCodeDiagnostic(output.stderr),
            },
          }));
        }, timeoutMs);
      });
      run = await Promise.race([childOutcome, timeout]);
    } finally {
      if (timer) clearTimeout(timer); // a PASS must not leave a late unhandled rejection
      removeTempConfig(configPath);
    }
    if (run.status !== 0) {
      // Best-effort: persist the EXACT generated config for failure forensics
      // (read-only wrt repo; harmless on success path since file is removed).
      let generated_config_copy = null;
      try { generated_config_copy = readFileSync(configPath, "utf8"); } catch { /* removed */ }
      throw Object.assign(new Error(`opencode run failed (exit ${run.status})`), {
        code: "OPENCODE_RUN_FAILED",
        opencode_exit_code: run.status,
        stdout: run.stdout,
        stderr: run.stderr,
        spawn_failure: Boolean(run.spawn_error),
        spawn_error: run.spawn_error,
        spawn_error_code: run.spawn_error_code,
        generated_config_copy,
      });
    }
    return { ok: true, exit_code: run.status, opencode_execution_count: 1, model_id: modelId };
  };
}

/** Bounded test cycles: re-run only while failing and cycles remain.
 * Handle-shape fix (V4_LOCAL_DEV_EXECUTOR_TEST_HARNESS_HANDLE_SHAPE_FIX_V1):
 * defaultSpawn returns a HANDLE {pid, promise, getOutput, terminate}; injected
 * legacy fakes may still return a resolved result object. Both shapes are
 * normalized through the same asSpawnHandle path used by the OpenCode task,
 * then the resolved process result's `status` is recorded as `exit_code`.
 * Never read `status` off the handle itself (that field does not exist there
 * — the RETRY9 STOP:TEST_FAILED root cause). */
export function makeRunTests(deps = {}) {
  const spawnProc = deps.spawnProc || defaultSpawn;
  return async ({ testCommand, maxTestCycles, repoPath }) => {
    if (!testCommand) return [];
    const runs = [];
    for (let cycle = 1; cycle <= maxTestCycles; cycle += 1) {
      const handle = asSpawnHandle(await spawnProc(testCommand, [], { cwd: repoPath, shell: true }));
      const result = await handle.promise;
      runs.push({ command: testCommand, exit_code: result.status, cycle });
      if (result.status === 0) break;
    }
    return runs;
  };
}

/** Selective staging inside target repo only; never stages untracked files. */
export function makePersistGit(deps = {}) {
  const gitExec = deps.gitExec || defaultGitExec;
  const pathMatch = deps.pathMatch || null;
  return async ({ envelope, changedFiles, evidenceSubject: subject }) => {
    const repo = envelope.target_repo_path;
    const stageable = (changedFiles || []).filter((p) => pathAllowed(envelope.allowed_paths, p, pathMatch));
    if (stageable.length === 0) {
      return { ok: false, reason_codes: ["NOTHING_STAGEABLE_IN_SCOPE"] };
    }
    const add = await gitExec(repo, ["add", "--", ...stageable]);
    if (add.status !== 0) return { ok: false, reason_codes: ["GIT_ADD_FAILED"] };
    const commit = await gitExec(repo, ["commit", "-m", subject]);
    if (commit.status !== 0) return { ok: false, reason_codes: ["GIT_COMMIT_FAILED"] };
    const push = await gitExec(repo, ["push", "origin", "HEAD"]);
    if (push.status !== 0) return { ok: false, reason_codes: ["GIT_PUSH_FAILED"] };
    const head = await gitExec(repo, ["rev-parse", "HEAD"]);
    if (head.status !== 0) return { ok: false, reason_codes: ["REV_PARSE_FAILED"] };
    return { ok: true, final_head: head.stdout.trim(), staged_files: stageable };
  };
}

/** Compose the concrete collaborator bundle (all injectable for tests). */
export function composeRunners(options = {}) {
  return {
    ensureQwenReady: options.ensureQwenReady || makeEnsureQwenReady(options.ensureWorkstationDevQwenReady),
    guardStart: options.guardStart || startLocalDevGenerationGuard,
    runOpenCodeTask: options.runOpenCodeTask || makeRunOpenCodeTask(options.opencodeDeps || {}),
    runTests: options.runTests || makeRunTests(options.testDeps || {}),
    persistGit: options.persistGit || makePersistGit(options.gitDeps || {}),
  };
}

/**
 * Opt-in router release: only when THIS task started the router exclusively.
 * Live process-identity rediscovery immediately before stop; never stale PIDs.
 */
export async function releaseRouterIfStarted(result, deps = {}) {
  if (!result || result.launch_performed !== true) return { released: false, reason: "not_owned" };
  const runPowerShell = deps.runPowerShell || ((cmd) => new Promise((resolvePromise) => {
    execFile("powershell.exe", ["-NoProfile", "-Command", cmd], { windowsHide: true }, (err, stdout) =>
      resolvePromise({ status: err ? 1 : 0, stdout: stdout || "" }));
  }));
  // Rediscover live identity (launcher-verified matcher), then stop — same query semantics as Start-Qwen-MultiModel-16K.ps1.
  const discovery = await runPowerShell(
    `Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'llama-server.exe' -and $_.CommandLine -match '(?i)8080') -or ($_.Name -match '(?i)^python' -and $_.CommandLine -match '(?i)qwen_runtime_router\\.py') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
  );
  return { released: discovery.status === 0, rediscovered: true };
}

async function main() {
  const args = process.argv.slice(2);
  const inputFile = args[args.indexOf("--input-file") + 1];
  const releaseFlag = args.includes("--release-started-router");
  if (!inputFile) {
    process.stderr.write("Usage: node tools/run-local-dev-executor-v1.mjs --input-file <envelope.json> [--release-started-router]\n");
    process.exit(2);
  }
  const envelope = JSON.parse(readFileSync(resolve(process.cwd(), inputFile), "utf8").replace(/^\uFEFF/, ""));
  const result = await executeLocalDevTask(envelope, composeRunners());
  if (releaseFlag) {
    result.router_release = await releaseRouterIfStarted(result);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.status === "PASS" ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/run-local-dev-executor-v1.mjs");

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
