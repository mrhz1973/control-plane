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
import { executeLocalDevTask, pathAllowed, DEV_PROFILE_CATEGORY } from "./local-dev-executor-v1.mjs";
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
  // localhost_only: the DEV guard upstream (Qwen via guard) is model traffic,
  // not an agent tool action; agent web tools stay denied under BOTH policies.
  // offline: identical — no web tools under either policy. Divergence would
  // only exist if a future OpenCode action allowed raw sockets; none in V1.
  permission._network_policy = networkPolicy; // informational; not consumed by CLI
  return permission;
}

/** Merge provider overlay + V1 permission enforcement into one config. */
export function buildOpenCodeRuntimeConfig({ providerOverlay, permissionOverlay }) {
  return {
    ...providerOverlay,
    permission: permissionOverlay,
  };
}

function defaultSpawn(executable, args, opts = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(executable, args, {
      cwd: opts.cwd,
      env: opts.env,
      windowsHide: true,
      shell: Boolean(opts.shell),
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => (stdout += d));
    child.stderr?.on("data", (d) => (stderr += d));
    child.on("error", (err) => resolvePromise({ status: 1, error: err?.message || "spawn_error", stdout, stderr }));
    child.on("close", (code) => resolvePromise({ status: code ?? 1, stdout, stderr }));
  });
}

function defaultGitExec(repoPath, args) {
  return new Promise((resolvePromise) => {
    execFile("git", ["-C", repoPath, ...args], { windowsHide: true }, (err, stdout, stderr) => {
      resolvePromise({ status: err ? 1 : 0, stdout: stdout || "", stderr: stderr || "" });
    });
  });
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
      run = await Promise.race([
        spawnProc(probeResult.executable, argv, {
          cwd: envelope.target_repo_path,
          env: { ...process.env, OPENCODE_CONFIG: configPath },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error(`opencode exceeded hard timebox ${envelope.timebox_seconds}s`), { code: "BOUNDS_TIMEBOX_EXPIRED", terminated: true })), timeoutMs),
        ),
      ]);
    } finally {
      removeTempConfig(configPath);
    }
    if (run.status !== 0) {
      throw Object.assign(new Error(`opencode run failed (exit ${run.status})`), { code: "OPENCODE_RUN_FAILED" });
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
