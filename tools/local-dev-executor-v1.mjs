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
export const DEFAULT_DEV_PROFILE_ID = "qwen38-opus-q3-opencode-24k";
export const QWEN_LOCAL_PROVIDER_ID = "qwen_local";
export const CANONICAL_QWEN_ENDPOINT = "http://127.0.0.1:8080";

export const HARD_TIMEBOX_SECONDS = 3600;
export const HARD_MAX_AGENT_TURNS = 24;
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
  if (error.generated_config_copy !== undefined && error.generated_config_copy !== null) {
    diagnostics.generated_config_copy = sanitizeOpenCodeDiagnostic(error.generated_config_copy);
  }
  return Object.keys(diagnostics).length ? diagnostics : undefined;
}

/**
 * Pure OpenCode failure classifier (sanitized evidence only).
 * Precedence: guard blocked generations → MAX_AGENT_TURNS_EXCEEDED;
 * then robust context-overflow patterns → CONTEXT_WINDOW_EXCEEDED;
 * else OPENCODE_RUN_FAILED.
 */
export function classifyOpenCodeFailure(input = {}) {
  const blocked = Number(input.guardAccounting?.blocked_generation_requests) || 0;
  if (blocked > 0) return "MAX_AGENT_TURNS_EXCEEDED";

  const parts = [
    input.code,
    input.exitCode,
    input.opencode_exit_code,
    input.stdout,
    input.stderr,
    input.spawn_error,
    input.error_message,
  ]
    .filter((v) => v !== undefined && v !== null && v !== "")
    .map((v) => sanitizeOpenCodeDiagnostic(v))
    .filter(Boolean);
  const blob = parts.join("\n");
  if (looksLikeContextWindowExceeded(blob)) return "CONTEXT_WINDOW_EXCEEDED";
  return "OPENCODE_RUN_FAILED";
}

function looksLikeContextWindowExceeded(text) {
  const t = String(text || "");
  if (!t.trim()) return false;
  if (/\b(context|token|request|input|prompt)\b[\s\S]{0,120}\b\d{2,}\s*>\s*\d{2,}\b/i.test(t)) return true;
  if (/\b\d{2,}\s*>\s*\d{2,}\b[\s\S]{0,120}\b(context|token|context\s+window|context\s+length|maximum\s+context)\b/i.test(t)) return true;
  if (/exceeds?\s+(the\s+)?(model\s+)?context\s+window/i.test(t)) return true;
  if (/context\s+length\s+exceeded/i.test(t)) return true;
  if (/maximum\s+context\s+length/i.test(t)) return true;
  if (/too\s+many\s+tokens\s+for\s+(the\s+)?context/i.test(t)) return true;
  if (/input\s+tokens?\s+exceed/i.test(t)) return true;
  if (/request\s+.*\bexceed(ed|s)?\b.*\bcontext\b/i.test(t)) return true;
  return false;
}

export function buildConvergenceDiagnostics({ envelope, turnsUsed, reason = "MAX_AGENT_TURNS_EXCEEDED" } = {}) {
  return {
    budget_exhausted: true,
    reason,
    max_agent_turns: Number(envelope?.max_agent_turns) || 0,
    turns_used: Number(turnsUsed) || 0,
  };
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

/** Normalize a repo path for deterministic comparison (Windows-safe:
 * backslashes -> forward slashes, no leading ./, no trailing slash).
 * Case is PRESERVED; case-only differences are treated as ambiguity. */
export function normalizeRepoPath(p) {
  return String(p).replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
}

/**
 * Pre-run snapshot of untracked paths (provenance baseline for new-file
 * persistence). Returns { ambiguous:false, paths:[...] } | { ambiguous:true }.
 * Caller must fail closed on null (status failure) or ambiguous:true.
 */
export async function snapshotUntrackedPaths(repoPath, git = defaultGit) {
  const status = await git(repoPath, ["status", "--porcelain=v1", "-uall"]);
  if (status.status !== 0) return null;
  const paths = status.stdout.split(/\r?\n/).filter(Boolean)
    .map((l) => parseStatusLine(l))
    .filter(({ code }) => code === "??")
    .map(({ path }) => normalizeRepoPath(path));
  const seen = new Map();
  for (const p of paths) {
    const k = p.toLowerCase();
    if (seen.has(k) && seen.get(k) !== p) return { ambiguous: true, paths: [] };
    seen.set(k, p);
  }
  return { ambiguous: false, paths };
}

/**
 * Classify post-execution working-tree changes against the pre-run untracked
 * snapshot (option-B new-file persistence semantics, operator-authorized):
 *
 *   PREEXISTING_UNTRACKED  -> absolutely protected: never staged, never
 *                             modified/deleted by persistence; if one goes
 *                             missing or becomes tracked -> STOP.
 *   TASK_CREATED_UNTRACKED -> stageable ONLY if inside allowed_paths.
 *
 * Fail closed on: status failure, unknown provenance, case-ambiguous paths,
 * out-of-scope new files, out-of-scope tracked changes (belt & braces with
 * assertPathsInScope).
 */
export async function classifyPostExecutionChanges(envelope, preUntracked, git = defaultGit, matchFn = null) {
  if (!preUntracked || preUntracked.ambiguous) {
    return { ok: false, classification: "STOP:GIT_PERSISTENCE_FAILED", reason_codes: ["GIT_PERSISTENCE_FAILED", "PREEXISTING_UNTRACKED_PROVENANCE_UNKNOWN"] };
  }
  const status = await git(envelope.target_repo_path, ["status", "--porcelain=v1", "-uall"]);
  if (status.status !== 0) {
    return { ok: false, classification: "STOP:GIT_PERSISTENCE_FAILED", reason_codes: ["GIT_PERSISTENCE_FAILED", "STATUS_FAILED"] };
  }
  const preSet = new Set(preUntracked.paths);
  const preCase = new Set(preUntracked.paths.map((p) => p.toLowerCase()));
  const trackedModified = [];
  const untrackedNow = [];
  for (const line of status.stdout.split(/\r?\n/).filter(Boolean)) {
    const { code, path } = parseStatusLine(line);
    const p = normalizeRepoPath(path);
    if (code === "??") untrackedNow.push(p);
    else trackedModified.push(p);
  }
  const taskCreatedNew = [];
  let preexistingProtected = 0;
  const exactAllowed = new Set(
    (envelope.allowed_paths || [])
      .map((a) => normalizeRepoPath(String(a || "")))
      .filter((a) => a && !/[?*\[]/.test(a) && !a.endsWith("/")),
  );
  for (const p of untrackedNow) {
    if (preSet.has(p)) {
      // Exact allowed-file recovery: durable drafts left by a prior non-PASS
      // STOP on exact allowed_paths entries may be staged (glob roots stay protected).
      if (exactAllowed.has(p)) {
        taskCreatedNew.push(p);
        continue;
      }
      preexistingProtected += 1;
      continue;
    }
    if (preCase.has(p.toLowerCase())) {
      return { ok: false, classification: "STOP:PATH_NORMALIZATION_AMBIGUOUS", reason_codes: ["PATH_NORMALIZATION_AMBIGUOUS", `PATH:${p}`] };
    }
    if (!pathAllowed(envelope.allowed_paths, p, matchFn)) {
      return { ok: false, classification: "STOP:UNEXPECTED_FILE_CHANGES", reason_codes: ["UNEXPECTED_FILE_CHANGES", `PATH:${p}`] };
    }
    taskCreatedNew.push(p);
  }
  for (const p of preUntracked.paths) {
    if (!untrackedNow.includes(p)) {
      return { ok: false, classification: "STOP:PREEXISTING_UNTRACKED_MODIFIED", reason_codes: ["PREEXISTING_UNTRACKED_MODIFIED", `PATH:${p}`] };
    }
  }
  const outOfScopeTracked = trackedModified.filter((p) => !pathAllowed(envelope.allowed_paths, p, matchFn));
  if (outOfScopeTracked.length) {
    return { ok: false, classification: "STOP:UNEXPECTED_FILE_CHANGES", reason_codes: ["UNEXPECTED_FILE_CHANGES", ...outOfScopeTracked.map((p) => `PATH:${p}`)] };
  }
  const stageable = [...trackedModified, ...taskCreatedNew].sort();
  return {
    ok: true,
    stageable,
    tracked_modified: [...trackedModified].sort(),
    task_created_new: [...taskCreatedNew].sort(),
    preexisting_untracked_protected: preexistingProtected,
  };
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
    task_created_new: partial.task_created_new ?? [],
    preexisting_untracked_protected: partial.preexisting_untracked_protected ?? null,
    router_was_running: partial.router_was_running ?? null,
    launch_performed: Boolean(partial.launch_performed),
    turns_used: Number(partial.turns_used) || 0,
    timebox_used_s: Number(partial.timebox_used_s) || 0,
    reason_codes: partial.reason_codes || [],
    human_gate_required: partial.human_gate_required === true,
    post_exec_integration: partial.post_exec_integration ?? null,
    ...(partial.failure_diagnostics ? { failure_diagnostics: partial.failure_diagnostics } : {}),
    ...(partial.timeout_diagnostics ? { timeout_diagnostics: partial.timeout_diagnostics } : {}),
    ...(partial.guard_accounting ? { guard_accounting: partial.guard_accounting } : {}),
    ...(partial.convergence_diagnostics ? { convergence_diagnostics: partial.convergence_diagnostics } : {}),
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

  // Pre-run untracked provenance snapshot (option-B new-file persistence):
  // everything untracked NOW is PREEXISTING_UNTRACKED and stays absolutely
  // protected for the whole task.
  const preUntracked = await snapshotUntrackedPaths(envelope.target_repo_path, options.git || defaultGit);
  if (preUntracked === null || preUntracked.ambiguous) {
    return baseResult({
      task_ref: envelope.task_ref,
      profile_id: envelope.profile_id,
      base_head: pre.base_head,
      classification: "STOP:GIT_PERSISTENCE_FAILED",
      reason_codes: ["GIT_PERSISTENCE_FAILED", preUntracked?.ambiguous ? "PREEXISTING_UNTRACKED_PROVENANCE_AMBIGUOUS" : "STATUS_FAILED"],
    });
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

  const emitStatus = (event = {}) => {
    if (typeof options.onStatus !== "function") return;
    try {
      const safe = {
        phase: typeof event.phase === "string" ? event.phase.slice(0, 80) : undefined,
        tests_state: typeof event.tests_state === "string" ? event.tests_state.slice(0, 80) : undefined,
        files_touched: Array.isArray(event.files_touched)
          ? event.files_touched.map((p) => String(p).slice(0, 200)).filter(Boolean).slice(0, 16)
          : undefined,
        classification: typeof event.classification === "string" ? event.classification.slice(0, 120) : undefined,
        last_event: typeof event.last_event === "string" ? event.last_event.slice(0, 160) : undefined,
      };
      options.onStatus(safe);
    } catch {
      /* observability must never alter PASS/STOP */
    }
  };

  const inferTestsState = (result) => {
    if (!result) return "UNKNOWN";
    if (result.classification === "STOP:CONTEXT_WINDOW_EXCEEDED") return "NOT_APPLICABLE";
    if (!Array.isArray(result.tests) || result.tests.length === 0) {
      if (result.reason_codes?.includes("ACCEPTANCE_TEST_MISSING") || result.reason_codes?.includes("ACCEPTANCE_TEST_NOT_RUN")) {
        return "NOT_APPLICABLE";
      }
      return "NOT_STARTED";
    }
    const last = result.tests[result.tests.length - 1];
    if (last && last.exit_code === 0) return "PASS";
    if (last && last.exit_code !== 0) return "FAIL";
    return "UNKNOWN";
  };

  const finish = (partial) => {
    const result = baseResult({
      task_ref: envelope.task_ref,
      profile_id: envelope.profile_id,
      base_head: pre.base_head,
      timebox_used_s: Math.round((Date.now() - startedAt) / 1000),
      ...partial,
    });
    emitStatus({
      phase: "TERMINAL",
      classification: result.classification,
      tests_state: inferTestsState(result),
      files_touched: result.changed_files,
      last_event: `terminal:${result.classification}`,
    });
    return result;
  };

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
  let convergenceBudgetExhausted = false;
  let openCodeCalls = 0;

  const guardAccountingFields = (acct) => ({
    generation_requests_seen: acct?.generation_requests_seen ?? 0,
    upstream_generation_requests: acct?.upstream_generation_requests ?? 0,
    blocked_generation_requests: acct?.blocked_generation_requests ?? 0,
    informational_requests_forwarded: acct?.informational_requests_forwarded ?? 0,
    rejected_requests: acct?.rejected_requests ?? 0,
    secret_bearing_requests_rejected: acct?.secret_bearing_requests_rejected ?? 0,
  });

  const applyConvergence = (partial) => {
    if (!convergenceBudgetExhausted) return partial;
    const turnsUsed = Number(partial.turns_used) || Number(guardAccounting?.upstream_generation_requests) || 0;
    const diag = buildConvergenceDiagnostics({
      envelope,
      turnsUsed,
      reason: "MAX_AGENT_TURNS_EXCEEDED",
    });
    const passed = partial.status === "PASS" || partial.classification === "PASS";
    if (passed) {
      const codes = ["PASS", "DETERMINISTIC_ACCEPTANCE_AFTER_MAX_AGENT_TURNS"];
      for (const c of partial.reason_codes || []) {
        if (!codes.includes(c)) codes.push(c);
      }
      return {
        ...partial,
        status: "PASS",
        classification: "PASS",
        reason_codes: codes,
        convergence_diagnostics: diag,
      };
    }
    const codes = ["MAX_AGENT_TURNS_EXCEEDED"];
    for (const c of partial.reason_codes || []) {
      if (c === "MAX_AGENT_TURNS_EXCEEDED") continue;
      if (String(c).startsWith("STOP:")) continue;
      codes.push(c);
    }
    return {
      ...partial,
      status: "STOP",
      classification: "STOP:MAX_AGENT_TURNS_EXCEEDED",
      reason_codes: codes,
      convergence_diagnostics: diag,
    };
  };

  try {
    openCodeCalls += 1;
    emitStatus({ phase: "OPENCODE", tests_state: "NOT_STARTED", last_event: "opencode_start" });
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
    const sessionFields = {
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
      turns_used: guardAccounting?.upstream_generation_requests ?? 0,
      guard_accounting: guardAccountingFields(guardAccounting),
    };

    if (code === "BOUNDS_TIMEBOX_EXPIRED") {
      return finish({
        classification: `STOP:${code}`,
        reason_codes: [code, ...(err?.timeout_diagnostics?.termination_confirmed !== true
          ? ["TASK_CHILD_TERMINATION_UNCONFIRMED"]
          : [])],
        timeout_diagnostics: err.timeout_diagnostics,
        ...sessionFields,
      });
    }

    // Guard-proven turn ceiling: recover via deterministic acceptance (no second model turn).
    if ((Number(guardAccounting?.blocked_generation_requests) || 0) > 0) {
      convergenceBudgetExhausted = true;
    } else {
      const classified = classifyOpenCodeFailure({
        code,
        exitCode: err?.opencode_exit_code,
        opencode_exit_code: err?.opencode_exit_code,
        stdout: err?.stdout,
        stderr: err?.stderr,
        spawn_error: err?.spawn_error,
        error_message: err?.message,
        guardAccounting,
        max_agent_turns: envelope.max_agent_turns,
      });
      if (classified === "CONTEXT_WINDOW_EXCEEDED") {
        return finish({
          classification: "STOP:CONTEXT_WINDOW_EXCEEDED",
          reason_codes: ["CONTEXT_WINDOW_EXCEEDED"],
          failure_diagnostics: buildOpenCodeFailureDiagnostics(err),
          ...sessionFields,
        });
      }
      return finish({
        classification: `STOP:${code === "OPENCODE_RUN_FAILED" ? classified : code}`,
        reason_codes: [
          code === "OPENCODE_RUN_FAILED" ? classified : code,
          ...(code === "BOUNDS_TIMEBOX_EXPIRED" && err?.timeout_diagnostics?.termination_confirmed !== true
            ? ["TASK_CHILD_TERMINATION_UNCONFIRMED"]
            : []),
        ],
        failure_diagnostics: code === "OPENCODE_RUN_FAILED" || code === "OPENCODE_CONFIG_REJECTED"
          ? buildOpenCodeFailureDiagnostics(err)
          : undefined,
        ...sessionFields,
      });
    }
  } finally {
    await guard.close().catch(() => {});
  }

  const turns = guardAccounting.upstream_generation_requests;
  // Successful OpenCode with blocked turns still stops (legacy ceiling) unless
  // we already entered convergence recovery from a nonzero OpenCode exit.
  if (!convergenceBudgetExhausted && guardAccounting.blocked_generation_requests > 0) {
    return finish({
      classification: "STOP:BOUNDS_TURN_CEILING_EXCEEDED",
      reason_codes: ["BOUNDS_TURN_CEILING_EXCEEDED"],
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    });
  }
  if (Date.now() - startedAt > timeboxMs) {
    return finish(applyConvergence({
      classification: "STOP:BOUNDS_TIMEBOX_EXPIRED",
      reason_codes: ["BOUNDS_TIMEBOX_EXPIRED"],
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    }));
  }

  // POST-EXECUTION PATH ENFORCEMENT: before tests/staging/push.
  const pathCheck = await assertPathsInScope();
  if (!pathCheck.ok) {
    return finish(applyConvergence({
      classification: pathCheck.classification,
      reason_codes: pathCheck.reason_codes,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    }));
  }

  if (convergenceBudgetExhausted && (envelope.test_command === null || envelope.test_command === undefined || envelope.test_command === "")) {
    return finish(applyConvergence({
      classification: "STOP:MAX_AGENT_TURNS_EXCEEDED",
      reason_codes: ["ACCEPTANCE_TEST_MISSING"],
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    }));
  }

  // Tests (bounded cycles). Absolutely no second OpenCode call.
  void openCodeCalls;
  emitStatus({ phase: "TESTS", tests_state: "RUNNING", last_event: "tests_start" });
  const testRuns = await runTests({
    testCommand: envelope.test_command ?? null,
    maxTestCycles: envelope.max_test_cycles,
    allowedCommands: envelope.allowed_commands,
    repoPath: envelope.target_repo_path,
    taskOutcome,
  });
  const lastTest = testRuns?.[testRuns.length - 1];
  emitStatus({
    phase: "TESTS",
    tests_state: !testRuns?.length ? "NOT_APPLICABLE"
      : (lastTest?.exit_code === 0 ? "PASS" : "FAIL"),
    last_event: "tests_done",
  });
  if (convergenceBudgetExhausted && (!Array.isArray(testRuns) || testRuns.length === 0)) {
    return finish(applyConvergence({
      classification: "STOP:MAX_AGENT_TURNS_EXCEEDED",
      reason_codes: ["ACCEPTANCE_TEST_NOT_RUN"],
      tests: testRuns || [],
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    }));
  }
  if (testRuns.length > envelope.max_test_cycles) {
    return finish(applyConvergence({
      classification: "STOP:BOUNDS_TEST_CYCLES_EXCEEDED",
      reason_codes: ["BOUNDS_TEST_CYCLES_EXCEEDED"],
      tests: testRuns,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    }));
  }
  const finalRun = testRuns[testRuns.length - 1] ?? null;
  if (finalRun && finalRun.exit_code !== 0) {
    return finish(applyConvergence({
      classification: "STOP:TEST_FAILED",
      reason_codes: ["TEST_FAILED"],
      tests: testRuns,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    }));
  }

  // Changed files + Git persistence (option-B semantics: tracked in-scope
  // modifications + task-created NEW in-scope untracked files are stageable;
  // pre-existing untracked files are absolutely protected). The deterministic
  // classification is the SINGLE authority for the staging set.
  const classification = await classifyPostExecutionChanges(envelope, preUntracked, gitForPaths, matchForPaths);
  if (!classification.ok) {
    return finish(applyConvergence({
      classification: classification.classification,
      reason_codes: classification.reason_codes,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
    }));
  }
  const changed = classification.stageable;

  if (envelope.git_persistence_required) {
    emitStatus({ phase: "PERSISTENCE", last_event: "persistence_start" });
    const persistence = await persistGit({
      envelope,
      changedFiles: changed,
      evidenceSubject: evidenceSubject(true, envelope.task_ref),
    });
    if (!persistence || persistence.ok !== true) {
      return finish(applyConvergence({
        classification: "STOP:GIT_PERSISTENCE_FAILED",
        reason_codes: ["GIT_PERSISTENCE_FAILED", ...(persistence?.reason_codes || [])],
        tests: testRuns,
        changed_files: changed,
        turns_used: turns,
        router_was_running: session.router_was_running ?? null,
        launch_performed: Boolean(session.launch_performed),
        post_exec_integration: persistence?.post_exec_integration ?? null,
        human_gate_required: persistence?.human_gate_required === true,
      }));
    }
    const passCodes =
      Array.isArray(persistence.reason_codes) && persistence.reason_codes.length > 0
        ? ["PASS", ...persistence.reason_codes.filter((c) => c !== "PASS")].slice(0, 16)
        : ["PASS"];
    return finish(applyConvergence({
      status: "PASS",
      classification: "PASS",
      reason_codes: passCodes,
      tests: testRuns,
      changed_files: changed,
      task_created_new: classification.task_created_new,
      preexisting_untracked_protected: classification.preexisting_untracked_protected,
      final_head: persistence.final_head ?? null,
      turns_used: turns,
      router_was_running: session.router_was_running ?? null,
      launch_performed: Boolean(session.launch_performed),
      post_exec_integration: persistence.post_exec_integration ?? null,
    }));
  }

  return finish(applyConvergence({
    status: "PASS",
    classification: "PASS",
    reason_codes: ["PASS"],
    tests: testRuns,
    changed_files: changed,
    task_created_new: classification.task_created_new,
    preexisting_untracked_protected: classification.preexisting_untracked_protected,
    turns_used: turns,
    router_was_running: session.router_was_running ?? null,
    launch_performed: Boolean(session.launch_performed),
  }));
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/local-dev-executor-v1.mjs");

if (isMain) {
  process.stdout.write(
    `${JSON.stringify({ schema_version: RESULT_SCHEMA, mode: "cli-default-no-execution", actor: "local-dev-executor-v1" }, null, 2)}\n`,
  );
}
