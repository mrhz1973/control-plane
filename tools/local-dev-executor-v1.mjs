#!/usr/bin/env node
/**
 * V4 — LOCAL_DEV_EXECUTOR v1 (thin wrapper, DEV domain only).
 *
 * Contract: docs/contracts/local-dev-executor-v1.md
 * Path: TASK DELTA -> LOCAL_DEV_EXECUTOR -> OpenCode -> Qwen locale
 *       -> test -> Git PASS/STOP -> agg/GitHub evidence
 *
 * Domain separation: never touches production authorization, scope-v3,
 * WF40, D-0025, the production adapter, or the eligible set. Reuses only
 * authorization-free primitives (session manager, probe, overlay builder,
 * runtime config) plus the DEV-domain generation guard.
 *
 * All collaborators are injectable for deterministic offline tests.
 * Default CLI invocation performs NO live execution.
 */
import { buildOpenCodeProviderOverlay } from "./dispatch-opencode-execution-v1.mjs";
import { probeOpenCodeLocal, DISPATCH_CLI_CAPABILITIES } from "./probe-opencode-local-v1.mjs";
import { loadQwenLocalRuntime } from "./qwen-local-runtime-v1.mjs";
import { startLocalDevGenerationGuard } from "./local-dev-generation-guard-v1.mjs";

export const ENVELOPE_SCHEMA = "local-dev-task-envelope-v1";
export const RESULT_SCHEMA = "local-dev-execution-result-v1";
export const DEV_PROFILE_CATEGORY = "workstation_dev_executor_profile";
export const DEFAULT_DEV_PROFILE_ID = "qwen38-opus-q3-cline-24k";
export const QWEN_LOCAL_PROVIDER_ID = "qwen_local";
export const CANONICAL_QWEN_ENDPOINT = "http://127.0.0.1:8080";

export const HARD_TIMEBOX_SECONDS = 1800;
export const HARD_MAX_AGENT_TURNS = 16;
export const HARD_MAX_TEST_CYCLES = 3;
export const MAX_OPENCODE_DIAGNOSTIC_CHARS = 2000;

export function sanitizeOpenCodeDiagnostic(value) {
  if (value === null || value === undefined) return null;
  let text = String(value);
  text = text.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]");
  text = text.replace(/(authorization|x-api-key|api-key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");
  text = text.replace(/\b(sk-[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9_]+)\b/g, "[REDACTED_TOKEN]");
  return text.slice(0, MAX_OPENCODE_DIAGNOSTIC_CHARS);
}

export function buildOpenCodeFailureDiagnostics(error = {}) {
  const diagnostics = {};
  if (error.opencode_exit_code !== undefined && error.opencode_exit_code !== null) {
    diagnostics.opencode_exit_code = Number(error.opencode_exit_code);
  }
  if (error.stdout !== undefined) diagnostics.stdout_excerpt = sanitizeOpenCodeDiagnostic(error.stdout);
  if (error.stderr !== undefined) diagnostics.stderr_excerpt = sanitizeOpenCodeDiagnostic(error.stderr);
  if (error.spawn_error !== undefined) diagnostics.spawn_error = sanitizeOpenCodeDiagnostic(error.spawn_error);
  if (error.spawn_error_code !== undefined) diagnostics.spawn_error_code = sanitizeOpenCodeDiagnostic(error.spawn_error_code);
  if (error.spawn_failure === true) diagnostics.spawn_failure = true;
  return Object.keys(diagnostics).length ? diagnostics : undefined;
}

const STRING_FIELDS = [
  "task_ref",
  "target_repo_path",
  "target_remote",
  "dispatch_base_head",
  "profile_id",
  "task_delta",
  "network_policy",
];

const FORBIDDEN_COMMAND_RE =
  /(\bgit\s+reset\s+--hard\b|\bgit\s+clean\b|--force\s+push|\bgit\s+push\s+.*--force\b|\brm\s+-rf\s+\.\b|\brm\s+-rf\s+\/)/i;

/** Validate envelope shape + bounds (pure, offline). */
export function validateEnvelope(envelope) {
  const reason_codes = [];
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return { ok: false, reason_codes: ["ENVELOPE_INVALID", "ENVELOPE_NOT_OBJECT"] };
  }
  if (envelope.schema_version !== ENVELOPE_SCHEMA) {
    reason_codes.push("ENVELOPE_SCHEMA_MISMATCH");
  }
  for (const field of STRING_FIELDS) {
    const value = envelope[field];
    if (typeof value !== "string" || !value.trim()) {
      reason_codes.push(`MISSING_${field.toUpperCase()}`);
    }
  }
  const allowedPaths = envelope.allowed_paths;
  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0 ||
      !allowedPaths.every((p) => typeof p === "string" && p.trim())) {
    reason_codes.push("MISSING_ALLOWED_PATHS");
  }
  const allowedCommands = envelope.allowed_commands;
  if (!Array.isArray(allowedCommands) || allowedCommands.length === 0 ||
      !allowedCommands.every((c) => typeof c === "string" && c.trim())) {
    reason_codes.push("MISSING_ALLOWED_COMMANDS");
  }
  if (allowedCommands?.some((c) => FORBIDDEN_COMMAND_RE.test(c))) {
    reason_codes.push("FORBIDDEN_COMMAND_IN_ALLOWLIST");
  }
  const networkPolicy = envelope.network_policy;
  if (networkPolicy !== "offline" && networkPolicy !== "localhost_only") {
    reason_codes.push("INVALID_NETWORK_POLICY");
  }
  const timeboxSeconds = envelope.timebox_seconds;
  if (!Number.isInteger(timeboxSeconds) || timeboxSeconds < 1 || timeboxSeconds > HARD_TIMEBOX_SECONDS) {
    reason_codes.push("INVALID_TIMEBOX_SECONDS");
  }
  const maxAgentTurns = envelope.max_agent_turns;
  if (!Number.isInteger(maxAgentTurns) || maxAgentTurns < 1 || maxAgentTurns > HARD_MAX_AGENT_TURNS) {
    reason_codes.push("INVALID_MAX_AGENT_TURNS");
  }
  const maxTestCycles = envelope.max_test_cycles;
  if (!Number.isInteger(maxTestCycles) || maxTestCycles < 0 || maxTestCycles > HARD_MAX_TEST_CYCLES) {
    reason_codes.push("INVALID_MAX_TEST_CYCLES");
  }
  const testCommand = envelope.test_command;
  if (testCommand !== undefined && testCommand !== null) {
    if (typeof testCommand !== "string" || !testCommand.trim()) {
      reason_codes.push("INVALID_TEST_COMMAND");
    } else if (!(allowedCommands || []).some((c) => c === testCommand)) {
      reason_codes.push("TEST_COMMAND_NOT_IN_ALLOWLIST");
    }
  }
  const declaresLoop = typeof envelope.task_delta === "string" &&
    /implement.*test.*correct|corrective loop|test cycles?\s*[:=]/i.test(envelope.task_delta);
  if (maxTestCycles > 0 && !declaresLoop) {
    reason_codes.push("TEST_CYCLES_WITHOUT_DECLARED_LOOP");
  }
  if (typeof envelope.git_persistence_required !== "boolean") {
    reason_codes.push("INVALID_GIT_PERSISTENCE_FLAG");
  }
  if (reason_codes.length) {
    return { ok: false, reason_codes: ["ENVELOPE_INVALID", ...reason_codes] };
  }
  return { ok: true, envelope };
}

/** Resolve a DEV profile: workstation_manual_profiles + DEV category only. */
export function resolveDevProfile(runtime, profileId) {
  const manual = runtime?.workstation_manual_profiles?.[profileId];
  if (!manual || typeof manual !== "object") {
    return {
      ok: false,
      classification: "PROFILE_NOT_DEV_CATEGORY",
      reason_codes: ["PROFILE_NOT_DEV_CATEGORY", "PROFILE_UNKNOWN"],
    };
  }
  if (manual.category !== DEV_PROFILE_CATEGORY) {
    return { ok: false, classification: "PROFILE_NOT_DEV_CATEGORY", reason_codes: ["PROFILE_NOT_DEV_CATEGORY"] };
  }
  if (manual.control_plane_eligible === true || manual.auto_route === true) {
    return { ok: false, classification: "PROFILE_NOT_DEV_CATEGORY", reason_codes: ["PROFILE_NOT_DEV_CATEGORY", "PRODUCTION_PROFILE_IN_DEV_DOMAIN"] };
  }
  const modelId = typeof manual.llama_cpp_model_id === "string" && manual.llama_cpp_model_id.trim()
    ? manual.llama_cpp_model_id
    : profileId;
  return { ok: true, profile_id: profileId, model_id: modelId, profile: manual };
}

/** Normalize a git status porcelain line: { code, path, staged } */
function parseStatusLine(line) {
  const rawCode = line.slice(0, 2);
  const code = rawCode.trim() || rawCode;
  let path = line.slice(3).trim();
  if (path.startsWith('"') && path.endsWith('"')) path = path.slice(1, -1);
  const renamed = path.match(/^(.*) -> (.*)$/);
  if (renamed) path = renamed[2];
  return { code, path, staged: rawCode[0] !== " " && rawCode[0] !== "?" };
}

/** Match a porcelain path against allowed_path globs (prefix/glob-lite). */
export function pathAllowed(allowedPaths, path, matchFn) {
  const match = matchFn || ((pattern, p) => {
    if (pattern === p) return true;
    if (pattern.endsWith("/**")) return p.startsWith(pattern.slice(0, -2));
    if (pattern.endsWith("/*")) {
      const base = pattern.slice(0, -1);
      return p.startsWith(base) && !p.slice(base.length).includes("/");
    }
    return false;
  });
  return allowedPaths.some((pattern) => match(pattern, path));
}

/** Preflight: repo identity + cleanliness semantics. */
export async function preflight(envelope, options = {}) {
  const git = options.git || defaultGit;
  const matchFn = options.pathMatch || null;

  const head = await git(envelope.target_repo_path, ["rev-parse", "HEAD"]);
  if (head.status !== 0) {
    return { ok: false, classification: "PREFLIGHT_REPO_IDENTITY_MISMATCH", reason_codes: ["PREFLIGHT_REPO_IDENTITY_MISMATCH", "REV_PARSE_FAILED"] };
  }
  if (head.stdout.trim() !== envelope.dispatch_base_head) {
    return { ok: false, classification: "PREFLIGHT_REPO_IDENTITY_MISMATCH", reason_codes: ["PREFLIGHT_REPO_IDENTITY_MISMATCH", "BASE_HEAD_MISMATCH"] };
  }
  const remote = await git(envelope.target_repo_path, ["remote", "get-url", "origin"]);
  if (remote.status !== 0 || remote.stdout.trim().replace(/\.git$/, "") !== envelope.target_remote.replace(/\.git$/, "")) {
    return { ok: false, classification: "PREFLIGHT_REPO_IDENTITY_MISMATCH", reason_codes: ["PREFLIGHT_REPO_IDENTITY_MISMATCH", "TARGET_REMOTE_MISMATCH"] };
  }

  const status = await git(envelope.target_repo_path, ["status", "--porcelain=v1", "-uall"]);
  if (status.status !== 0) {
    return { ok: false, classification: "PREFLIGHT_REPO_IDENTITY_MISMATCH", reason_codes: ["PREFLIGHT_REPO_IDENTITY_MISMATCH", "STATUS_FAILED"] };
  }
  let conflictingInScope = false;
  let dirtyOutsideScope = false;
  for (const line of status.stdout.split(/\r?\n/).filter(Boolean)) {
    const { code, path } = parseStatusLine(line);
    if (code === "??") continue; // pre-existing untracked tolerated
    if (!pathAllowed(envelope.allowed_paths, path, matchFn)) {
      dirtyOutsideScope = true;
    } else {
      conflictingInScope = true;
    }
  }
  if (dirtyOutsideScope) {
    return { ok: false, classification: "PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE", reason_codes: ["PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE"] };
  }
  if (conflictingInScope) {
    return { ok: false, classification: "PREFLIGHT_CONFLICTING_LOCAL_CHANGES", reason_codes: ["PREFLIGHT_CONFLICTING_LOCAL_CHANGES"] };
  }
  return { ok: true, base_head: head.stdout.trim() };
}

async function defaultGit(repoPath, args) {
  const { spawn } = await import("node:child_process");
  return new Promise((resolvePromise) => {
    const child = spawn("git", ["-C", repoPath, ...args], { encoding: "utf8" });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", () => resolvePromise({ status: 1, stdout: "", stderr: "spawn_error" }));
    child.on("close", (code) => resolvePromise({ status: code ?? 1, stdout, stderr }));
  });
}

/** Provider-neutral evidence commit subjects. */
export function evidenceSubject(pass, taskRef) {
  return `${pass ? "executor-pass" : "executor-stop"}: ${taskRef}`;
}

function baseResult(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    task_ref: partial.task_ref ?? null,
    status: partial.status ?? "STOP",
    classification: partial.classification ?? "STOP",
    actor: "local-dev-executor-v1",
    profile_id: partial.profile_id ?? null,
    base_head: partial.base_head ?? null,
    final_head: partial.final_head ?? null,
    tests: partial.tests ?? [],
    changed_files: partial.changed_files ?? [],
    router_was_running: partial.router_was_running ?? null,
    launch_performed: Boolean(partial.launch_performed),
    turns_used: Number(partial.turns_used) || 0,
    timebox_used_s: Number(partial.timebox_used_s) || 0,
    reason_codes: partial.reason_codes || [],
    ...(partial.failure_diagnostics ? { failure_diagnostics: partial.failure_diagnostics } : {}),
    ...(partial.timeout_diagnostics ? { timeout_diagnostics: partial.timeout_diagnostics } : {}),
    ...(partial.guard_accounting ? { guard_accounting: partial.guard_accounting } : {}),
  };
}

/**
 * Execute one bounded LOCAL_DEV task. Orchestrates: envelope validation ->
 * profile resolution -> preflight -> (live phase: guard + OpenCode + tests +
 * Git). The live phase is entirely injectable; without runners injected the
 * executor stops offline-safe after preflight (no Qwen, no OpenCode).
 */
export async function executeLocalDevTask(envelopeInput, options = {}) {
  const startedAt = Date.now();
  const timeboxMs = (envelopeInput?.timebox_seconds ?? 0) * 1000;

  const check = validateEnvelope(envelopeInput);
  if (!check.ok) {
    return baseResult({ task_ref: envelopeInput?.task_ref ?? null, classification: "STOP:ENVELOPE_INVALID", reason_codes: check.reason_codes });
  }
  const envelope = envelopeInput;

  let runtime;
  try {
    runtime = (options.loadRuntime || loadQwenLocalRuntime)();
  } catch {
    return baseResult({ task_ref: envelope.task_ref, profile_id: envelope.profile_id, classification: "STOP:PREFLIGHT_TOOLING_UNAVAILABLE", reason_codes: ["PREFLIGHT_TOOLING_UNAVAILABLE", "RUNTIME_CONFIG_UNREADABLE"] });
  }
  const profile = resolveDevProfile(runtime, envelope.profile_id);
  if (!profile.ok) {
    return baseResult({ task_ref: envelope.task_ref, profile_id: envelope.profile_id, classification: `STOP:${profile.classification}`, reason_codes: profile.reason_codes });
  }

  const pre = await preflight(envelope, options);
  if (!pre.ok) {
    return baseResult({ task_ref: envelope.task_ref, profile_id: envelope.profile_id, classification: `STOP:${pre.classification}`, reason_codes: pre.reason_codes });
  }

  // Live phase requires the core collaborators injected; otherwise offline stop.
  // persistGit is required only when git_persistence_required=true.
  const runOpenCodeTask = options.runOpenCodeTask || null;
  const guardStart = options.guardStart || null;
  const ensureQwenReady = options.ensureQwenReady || null;
  const runTests = options.runTests || null;
  const persistGit = options.persistGit || null;

  if (!runOpenCodeTask || !guardStart || !ensureQwenReady || !runTests ||
      (envelope.git_persistence_required && !persistGit)) {
    return baseResult({
      task_ref: envelope.task_ref,
      profile_id: envelope.profile_id,
      base_head: pre.base_head,
      classification: "STOP:OFFLINE_NO_RUNNERS",
      reason_codes: ["OFFLINE_NO_RUNNERS", "NO_LIVE_EXECUTION_DEFAULT"],
      timebox_used_s: 0,
    });
  }

  const finish = (partial) =>
    baseResult({
      task_ref: envelope.task_ref,
      profile_id: envelope.profile_id,
      base_head: pre.base_head,
      timebox_used_s: Math.round((Date.now() - startedAt) / 1000),
      ...partial,
    });

  // Qwen session (session-manager canonical principle via injected adapter).
  const session = await ensureQwenReady({ profile: envelope.profile_id });
  if (!session || session.ready !== true) {
    return finish({
      classification: "STOP:QWEN_SESSION_NOT_READY",
      reason_codes: ["QWEN_SESSION_NOT_READY", session?.status ?? "SESSION_NULL"],
      router_was_running: session?.router_was_running ?? null,
      launch_performed: Boolean(session?.launch_performed),
    });
  }

  // POST-EXECUTION PATH ENFORCEMENT helper: tracked changes must stay inside
  // allowed_paths; otherwise STOP before tests/staging/push. Untracked tolerated.
  const gitForPaths = options.git || defaultGit;
  const matchForPaths = options.pathMatch || null;
  const assertPathsInScope = async () => {
    const status = await gitForPaths(envelope.target_repo_path, ["status", "--porcelain=v1", "--untracked-files=no"]);
    if (status.status !== 0) {
      return { ok: false, classification: "STOP:GIT_PERSISTENCE_FAILED", reason_codes: ["GIT_PERSISTENCE_FAILED", "STATUS_FAILED"] };
    }
    const outside = status.stdout.split(/\r?\n/).filter(Boolean).map((l) => parseStatusLine(l)).filter(({ path }) => !pathAllowed(envelope.allowed_paths, path, matchForPaths));
    if (outside.length) {
      return { ok: false, classification: "STOP:UNEXPECTED_FILE_CHANGES", reason_codes: ["UNEXPECTED_FILE_CHANGES", ...outside.map((e) => `PATH:${e.path}`)] };
    }
    return { ok: true };
  };

  // Guard: OpenCode target is ALWAYS the guard base URL, never :8080 direct.
  const guard = await guardStart({
    upstreamOrigin: session.base_url || CANONICAL_QWEN_ENDPOINT,
    maxAgentTurns: envelope.max_agent_turns,
  });

  let taskOutcome;
  let guardAccounting = null;
  try {
    taskOutcome = await runOpenCodeTask({
      guardBaseUrl: guard.base_url,
      modelId: profile.model_id,
      modelSelector: `${QWEN_LOCAL_PROVIDER_ID}/${profile.model_id}`,
      providerOverlay: buildOpenCodeProviderOverlay({
        baseUrl: guard.base_url,
        modelId: profile.model_id,
      }),
      capabilities: options.opencodeProbe?.capabilities || DISPATCH_CLI_CAPABILITIES,
      envelope,
    });
    guardAccounting = guard.getAccounting();
  } catch (err) {
    guardAccounting = guard.getAccounting();
    const code = err?.code || "OPENCODE_TASK_ERROR";
    return finish({
      classification: `STOP:${code}`,
      reason_codes: [code, ...(code === "BOUNDS_TIMEBOX_EXPIRED" && err?.timeout_diagnostics?.termination_confirmed !== true
        ? ["TASK_CHILD_TERMINATION_UNCONFIRMED"]
        : [])],
      timeout_diagnostics: code === "BOUNDS_TIMEBOX_EXPIRED" ? err.timeout_diagnostics : undefined,
      failure_diagnostics: code === "OPENCODE_RUN_FAILED"
        ? buildOpenCodeFailureDiagnostics(err)
        : undefined,
      guard_accounting: {
        generation_requests_seen: guardAccounting.generation_requests_seen ?? 0,
        upstream_generation_requests: guardAccounting.upstream_generation_requests ?? 0,
        blocked_generation_requests: guardAccounting.blocked_generation_requests ?? 0,
        informational_requests_forwarded: guardAccounting.informational_requests_forwarded ?? 0,
        rejected_requests: guardAccounting.rejected_requests ?? 0,
        secret_bearing_requests_rejected: guardAccounting.secret_bearing_requests_rejected ?? 0,
      },
      turns_used: guardAccounting.upstream_generation_requests,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  } finally {
    await guard.close().catch(() => {});
  }

  const turns = guardAccounting.upstream_generation_requests;
  if (guardAccounting.blocked_generation_requests > 0) {
    return finish({
      classification: "STOP:BOUNDS_TURN_CEILING_EXCEEDED",
      reason_codes: ["BOUNDS_TURN_CEILING_EXCEEDED"],
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  }
  if (Date.now() - startedAt > timeboxMs) {
    return finish({
      classification: "STOP:BOUNDS_TIMEBOX_EXPIRED",
      reason_codes: ["BOUNDS_TIMEBOX_EXPIRED"],
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  }

  // POST-EXECUTION PATH ENFORCEMENT: before tests/staging/push.
  const pathCheck = await assertPathsInScope();
  if (!pathCheck.ok) {
    return finish({
      classification: pathCheck.classification,
      reason_codes: pathCheck.reason_codes,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  }

  // Tests (bounded cycles).
  const testRuns = await runTests({
    testCommand: envelope.test_command ?? null,
    maxTestCycles: envelope.max_test_cycles,
    allowedCommands: envelope.allowed_commands,
    repoPath: envelope.target_repo_path,
    taskOutcome,
  });
  if (testRuns.length > envelope.max_test_cycles) {
    return finish({
      classification: "STOP:BOUNDS_TEST_CYCLES_EXCEEDED",
      reason_codes: ["BOUNDS_TEST_CYCLES_EXCEEDED"],
      tests: testRuns,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  }
  const finalRun = testRuns[testRuns.length - 1] ?? null;
  if (finalRun && finalRun.exit_code !== 0) {
    return finish({
      classification: "STOP:TEST_FAILED",
      reason_codes: ["TEST_FAILED"],
      tests: testRuns,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  }

  // Changed files + Git persistence.
  const changed = await options.getChangedFiles?.(envelope) ??
    (await defaultGit(envelope.target_repo_path, ["status", "--porcelain=v1", "--untracked-files=no"]))
      .stdout.split(/\r?\n/).filter(Boolean).map((l) => parseStatusLine(l).path);

  if (envelope.git_persistence_required) {
    const persistence = await persistGit({
      envelope,
      changedFiles: changed,
      evidenceSubject: evidenceSubject(true, envelope.task_ref),
    });
    if (!persistence || persistence.ok !== true) {
      return finish({
        classification: "STOP:GIT_PERSISTENCE_FAILED",
        reason_codes: ["GIT_PERSISTENCE_FAILED", ...(persistence?.reason_codes || [])],
        tests: testRuns,
        changed_files: changed,
        turns_used: turns,
        router_was_running: session.router_was_running ?? null,
        launch_performed: Boolean(session.launch_performed),
      });
    }
    return finish({
      status: "PASS",
      classification: "PASS",
      reason_codes: ["PASS"],
      tests: testRuns,
      changed_files: changed,
      final_head: persistence.final_head ?? null,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  }

  return finish({
    status: "PASS",
    classification: "PASS",
    reason_codes: ["PASS"],
    tests: testRuns,
    changed_files: changed,
    turns_used: turns,
    router_was_running: session.router_was_running ?? null,
    launch_performed: Boolean(session.launch_performed),
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/local-dev-executor-v1.mjs");

if (isMain) {
  process.stdout.write(
    `${JSON.stringify({ schema_version: RESULT_SCHEMA, mode: "cli-default-no-execution", actor: "local-dev-executor-v1" }, null, 2)}\n`,
  );
}
