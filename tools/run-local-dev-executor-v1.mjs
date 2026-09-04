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
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
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
  let resolveResult;
  const promise = new Promise((resolvePromise) => {
    resolveResult = resolvePromise;
    child = spawn(executable, args, {
      cwd: opts.cwd,
      env: opts.env,
      windowsHide: true,
      shell: Boolean(opts.shell),
    });
    let stdout = "";
    let stderr = "";
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
    getOutput: () => ({ stdout, stderr }),
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
 * Windows npm-shim spawn fix: spawn() with shell:false cannot execute
 * `.cmd` shims (EINVAL). Resolve the REAL package executable instead of the
 * shim, with NO shell and literal argv (task message stays pure data).
 *
 * Resolution order (Windows only, all no-shell):
 *   1. %APPDATA%\npm\node_modules\opencode-ai\bin\opencode.exe  (real binary)
 *   2. <dir(opencode.cmd)>\node_modules\opencode-ai\bin\opencode.exe
 * A `.cmd`/`.bat`/`.sh` executable that cannot be resolved to the real
 * binary is rejected fail-closed (never silently shelled out).
 */
export function resolveOpenCodeSpawnTarget(executable) {
  const exe = String(executable || "").trim();
  const isCmdShim = /\.cmd$/i.test(exe) || /\.bat$/i.test(exe);
  if (process.platform !== "win32" && !isCmdShim) {
    return { executable: exe, resolved_from: "direct" };
  }
  if (!isCmdShim) {
    return { executable: exe, resolved_from: "direct" };
  }
  const candidates = [];
  const appdata = process.env.APPDATA;
  if (appdata) {
    candidates.push(join(appdata, "npm", "node_modules", "opencode-ai", "bin", "opencode.exe"));
  }
  candidates.push(join(dirname(exe), "node_modules", "opencode-ai", "bin", "opencode.exe"));
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return { executable: candidate, resolved_from: "npm-package-real-binary" };
    }
  }
  return {
    executable: null,
    resolved_from: "unresolved_cmd_shim",
    reason_code: "OPENCODE_CMD_SHIM_UNRESOLVED",
    reason: "opencode resolved to a .cmd shim and the real package binary was not found; refusing shell fallback",
  };
}

/** Bounded task message for the single OpenCode run (no secrets, structural). */
export function buildTaskMessage(envelope) {
  const lines = [
    `LOCAL_DEV task ${envelope.task_ref}`,
    `TASK DELTA: ${envelope.task_delta}`,
    `Allowed paths: ${envelope.allowed_paths.join(", ")}`,
    `Allowed commands: ${envelope.allowed_commands.join("; ")}`,
  ];
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
    let run;
    try {
      const argv = [
        caps.subcommand,
        caps.directory_flag, envelope.target_repo_path,
        caps.model_flag, modelSelector,
        caps.format_flag, caps.format_json_value,
        caps.auto_flag,
        buildTaskMessage(envelope),
      ];
      // HARD TIMEBOX: bound the child process itself, not just post-hoc checks.
      const timeoutMs = Math.max(1, envelope.timebox_seconds) * 1000;
      const spawned = asSpawnHandle(spawnProc(spawnTarget.executable, argv, {
          cwd: envelope.target_repo_path,
          env: { ...process.env, OPENCODE_CONFIG: configPath },
          shell: false, // no-shell: argv stays literal data, never shell syntax
        }));
      const timeout = new Promise((_, reject) =>
        setTimeout(async () => {
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
        }, timeoutMs),
      );
      run = await Promise.race([spawned.promise, timeout]);
    } finally {
      removeTempConfig(configPath);
    }
    if (run.status !== 0) {
      throw Object.assign(new Error(`opencode run failed (exit ${run.status})`), {
        code: "OPENCODE_RUN_FAILED",
        opencode_exit_code: run.status,
        stdout: run.stdout,
        stderr: run.stderr,
        spawn_failure: Boolean(run.spawn_error),
        spawn_error: run.spawn_error,
        spawn_error_code: run.spawn_error_code,
      });
    }
    return { ok: true, exit_code: run.status, opencode_execution_count: 1, model_id: modelId };
  };
}

/** Bounded test cycles: re-run only while failing and cycles remain. */
export function makeRunTests(deps = {}) {
  const spawnProc = deps.spawnProc || defaultSpawn;
  return async ({ testCommand, maxTestCycles, repoPath }) => {
    if (!testCommand) return [];
    const runs = [];
    for (let cycle = 1; cycle <= maxTestCycles; cycle += 1) {
      const r = await spawnProc(testCommand, [], { cwd: repoPath, shell: true });
      runs.push({ command: testCommand, exit_code: r.status, cycle });
      if (r.status === 0) break;
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
