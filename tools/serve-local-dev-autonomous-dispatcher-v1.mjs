#!/usr/bin/env node
/**
 * serve-local-dev-autonomous-dispatcher-v1 — Windows always-on LOCAL_DEV
 * dispatcher service (GPT_WEB authoring override:
 * V4_LOCAL_DEV_N8N_ALWAYS_ON_LIVE_FAST_TRACK_V1).
 *
 * ONE private dispatch tick per HTTP request:
 *   POST /v1/tick   on 127.0.0.1:18793
 *   External route (Tailscale Serve): /v4/local-dev/dispatch-tick
 *
 * One tick = MAX ONE real execution through the PROVEN pipeline:
 *   scan → select (selector law) → claim (bridge receipts) → emit envelope
 *   → MICRO_TASK_DELTA admission (admit-micro-task-delta-v1) → execute
 *   envelope (LOCAL_DEV_EXECUTOR authority) → bounded response.
 *
 * Composition only: reuses tools/dispatch-local-dev-queue-loop-v1.mjs
 * (selector/claim authority), tools/admit-micro-task-delta-v1.mjs
 * (MICRO_TASK operating-law admission), and tools/run-local-dev-executor-v1.mjs
 * (execution authority). No second executor. No safety-law merge.
 * Rejected admission never reaches the executor (execution_performed=false).
 *
 * The caller can NEVER influence: repo path, commands, profile, allowed
 * paths, task choice, synthetic policy, or production routing. Those are
 * server-side canonical constants.
 *
 * In-process single-flight lock: a concurrent tick returns BUSY and never
 * queues.
 *
 * Repository hygiene (fail-closed): canonical checkout, branch main,
 * `git fetch origin main`, TRACKED-clean before any sync, then either
 * HEAD==origin/main or exactly one `git merge --ff-only origin/main` when
 * HEAD is a strict ancestor. Ahead/diverged/dirty/ff-failure →
 * HUMAN_GATE_REQUIRED (never reset/stash/clean/rebase/force-pull).
 * Pre-existing untracked files are preserved (dirty check uses
 * --untracked-files=no). Sync runs before queue claim/admission/executor.
 *
 * IDLE ticks NEVER manufacture synthetic work (authoring law: only real
 * READY backlog executes here; synthetic capability preserved elsewhere).
 */
import http from "node:http";
import { execFile } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runDispatchLoop } from "./dispatch-local-dev-queue-loop-v1.mjs";
import {
  KNOWN_LOCAL_REPOS,
  buildReceiptLifecycle,
  transitionLatestReceipt,
} from "./bridge-backlog-to-local-dev-envelope-v1.mjs";
import { executeLocalDevTask } from "./local-dev-executor-v1.mjs";
import { composeRunners } from "./run-local-dev-executor-v1.mjs";
import { admitMicroTaskDelta, extractMicroTaskAdmissionInput } from "./admit-micro-task-delta-v1.mjs";
import { ensureWorkstationDevQwenReady } from "./qwen-local-session-manager-v1.mjs";

export const RESULT_SCHEMA = "local-dev-dispatch-tick-result-v1";
export const REQUEST_SCHEMA = "local-dev-dispatch-tick-v1";
export const STATUS_SCHEMA = "local-dev-execution-status-v1";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 18793;
export const TICK_PATH = "/v1/tick";
export const STATUS_PATH = "/v1/status";
export const REPO = "mrhz1973/control-plane";
export const CANONICAL_REPO_PATH = KNOWN_LOCAL_REPOS[REPO];
export const QUEUE_DIR = "reports/runtime/dev-queue/always-on";
// Claim receipts for the always-on queue live INSIDE the queue dir (untracked
// runtime state). The shared tracked ledger reports/runtime/dev-queue/receipts.json
// must NOT be written by the service: a claim written there dirties a tracked
// file BEFORE the executor preflight runs, so every live claim would deterministically
// STOP with PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE (observed live 2026-09-05).
export const RECEIPTS_PATH = "reports/runtime/dev-queue/always-on/receipts.json";
export const MAX_BODY_BYTES = 64 * 1024;
/** Bounded DEV Qwen readiness preflight before claim persistence. */
/** Align with session-manager DEV router/backend readiness budget. */
export const QWEN_PREFLIGHT_TIMEOUT_MS = 120_000;
export const CLASSIFICATIONS = Object.freeze([
  "WORK_EXECUTED_PASS",
  "WORK_EXECUTED_STOP",
  "IDLE_CLEAN",
  "BUSY",
  "HUMAN_GATE_REQUIRED",
  "SERVICE_ERROR",
]);

function boundStr(value, max) {
  if (value === null || value === undefined) return null;
  const s = String(value);
  if (!s) return null;
  return s.length <= max ? s : s.slice(0, max);
}

function boundInt(value, { allowNull = true, min = 0 } = {}) {
  if (value === null || value === undefined) return allowNull ? null : min;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) return allowNull ? null : min;
  return Math.floor(n);
}

function boundFilesTouched(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => boundStr(p, 200))
    .filter(Boolean)
    .slice(0, 16);
}

function emptyStatusSnapshot(partial = {}) {
  return {
    schema_version: STATUS_SCHEMA,
    active: false,
    terminal: false,
    request_id: null,
    task_ref: null,
    phase: "IDLE",
    elapsed_ms: 0,
    executor_pid: null,
    qwen_profile: null,
    runtime_ready: null,
    tests_state: "NOT_STARTED",
    files_touched: [],
    classification: null,
    last_event: null,
    ...partial,
  };
}

/**
 * In-memory execution status tracker (observability only).
 * Never throws into the execution path; callers should still wrap updates.
 */
export function createExecutionStatusTracker(options = {}) {
  const nowFn = options.nowMs || (() => Date.now());
  let startedAt = null;
  let state = emptyStatusSnapshot();

  const snapshot = () => {
    const elapsed = startedAt == null ? (state.elapsed_ms || 0) : Math.max(0, nowFn() - startedAt);
    return {
      schema_version: STATUS_SCHEMA,
      active: state.active === true,
      terminal: state.terminal === true,
      request_id: boundStr(state.request_id, 200),
      task_ref: boundStr(state.task_ref, 200),
      phase: boundStr(state.phase, 80) || "IDLE",
      elapsed_ms: boundInt(elapsed, { allowNull: false, min: 0 }),
      executor_pid: boundInt(state.executor_pid, { allowNull: true, min: 1 }),
      qwen_profile: boundStr(state.qwen_profile, 120),
      runtime_ready: state.runtime_ready === true ? true : (state.runtime_ready === false ? false : null),
      tests_state: boundStr(state.tests_state, 80) || "NOT_STARTED",
      files_touched: boundFilesTouched(state.files_touched),
      classification: boundStr(state.classification, 120),
      last_event: boundStr(state.last_event, 160),
    };
  };

  return {
    start(fields = {}) {
      startedAt = nowFn();
      state = emptyStatusSnapshot({
        active: true,
        terminal: false,
        request_id: boundStr(fields.request_id, 200),
        task_ref: boundStr(fields.task_ref, 200),
        phase: boundStr(fields.phase, 80) || "REPO_HYGIENE",
        executor_pid: boundInt(fields.executor_pid, { allowNull: true, min: 1 }),
        qwen_profile: boundStr(fields.qwen_profile, 120),
        runtime_ready: null,
        tests_state: "NOT_STARTED",
        files_touched: [],
        classification: null,
        last_event: boundStr(fields.last_event || "tick_started", 160),
      });
      return snapshot();
    },
    update(fields = {}) {
      if (!state.active && !fields.force) {
        // Still allow enriching terminal snapshot only via finish; ignore stray updates.
        if (state.terminal) return snapshot();
      }
      if (fields.request_id !== undefined) state.request_id = boundStr(fields.request_id, 200);
      if (fields.task_ref !== undefined) state.task_ref = boundStr(fields.task_ref, 200);
      if (fields.phase !== undefined) state.phase = boundStr(fields.phase, 80) || state.phase;
      if (fields.executor_pid !== undefined) state.executor_pid = boundInt(fields.executor_pid, { allowNull: true, min: 1 });
      if (fields.qwen_profile !== undefined) state.qwen_profile = boundStr(fields.qwen_profile, 120);
      if (fields.runtime_ready !== undefined) {
        state.runtime_ready = fields.runtime_ready === true ? true : (fields.runtime_ready === false ? false : null);
      }
      if (fields.tests_state !== undefined) state.tests_state = boundStr(fields.tests_state, 80) || state.tests_state;
      if (fields.files_touched !== undefined) state.files_touched = boundFilesTouched(fields.files_touched);
      if (fields.classification !== undefined) state.classification = boundStr(fields.classification, 120);
      if (fields.last_event !== undefined) state.last_event = boundStr(fields.last_event, 160);
      if (fields.active !== undefined) state.active = fields.active === true;
      if (fields.terminal !== undefined) state.terminal = fields.terminal === true;
      return snapshot();
    },
    finish(fields = {}) {
      const elapsed = startedAt == null ? 0 : Math.max(0, nowFn() - startedAt);
      state = {
        ...state,
        active: false,
        terminal: true,
        phase: "TERMINAL",
        elapsed_ms: elapsed,
        classification: boundStr(fields.classification ?? state.classification, 120),
        task_ref: fields.task_ref !== undefined ? boundStr(fields.task_ref, 200) : state.task_ref,
        request_id: fields.request_id !== undefined ? boundStr(fields.request_id, 200) : state.request_id,
        qwen_profile: fields.qwen_profile !== undefined ? boundStr(fields.qwen_profile, 120) : state.qwen_profile,
        runtime_ready: fields.runtime_ready !== undefined
          ? (fields.runtime_ready === true ? true : (fields.runtime_ready === false ? false : null))
          : state.runtime_ready,
        tests_state: fields.tests_state !== undefined ? (boundStr(fields.tests_state, 80) || state.tests_state) : state.tests_state,
        files_touched: fields.files_touched !== undefined ? boundFilesTouched(fields.files_touched) : state.files_touched,
        last_event: boundStr(fields.last_event || "terminal", 160),
      };
      startedAt = null;
      return snapshot();
    },
    snapshot,
  };
}

function gitExec(repoPath, args) {
  return new Promise((res) => {
    execFile("git.exe", args, { cwd: repoPath, windowsHide: true, timeout: 120_000 }, (err, stdout, stderr) => {
      res({ status: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

/** Fail-closed repo hygiene: canonical checkout + main + synced + clean-enough.
 * When local main is a strict ancestor of origin/main and the TRACKED
 * worktree is clean, performs exactly one `git merge --ff-only origin/main`
 * (V4_DISPATCHER_SAFE_FAST_FORWARD_SYNC_V1). Never reset/stash/clean/rebase.
 * Untracked files are ignored by the dirty check and never touched.
 */
export async function verifyRepoState(deps = {}) {
  const run = deps.gitExec || gitExec;
  const repoPath = deps.repoPath || CANONICAL_REPO_PATH;
  if (!existsSync(repoPath)) {
    return { ok: false, reason_codes: ["CANONICAL_REPO_PATH_MISSING"], human_gate_required: true };
  }
  const inside = await run(repoPath, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    return { ok: false, reason_codes: ["NOT_A_GIT_WORKTREE"], human_gate_required: true };
  }
  const branch = await run(repoPath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch.status !== 0 || branch.stdout.trim() !== "main") {
    return { ok: false, reason_codes: ["BRANCH_NOT_MAIN"], human_gate_required: true };
  }
  const fetch = await run(repoPath, ["fetch", "origin", "main"]);
  if (fetch.status !== 0) {
    return { ok: false, reason_codes: ["FETCH_FAILED"], human_gate_required: true };
  }

  // TRACKED dirty must block BEFORE any sync mutation (untracked preserved).
  const dirty = await run(repoPath, ["status", "--porcelain=v1", "--untracked-files=no"]);
  if (dirty.status !== 0) {
    return { ok: false, reason_codes: ["STATUS_FAILED"], human_gate_required: true };
  }
  const dirtyLines = dirty.stdout.split("\n").filter((l) => l.trim());
  if (dirtyLines.length) {
    return {
      ok: false,
      reason_codes: ["TRACKED_DIRTY_CONFLICT"],
      human_gate_required: true,
      gate_summary: `tracked dirty: ${dirtyLines.length} file(s)`,
    };
  }

  const local = await run(repoPath, ["rev-parse", "HEAD"]);
  const remote = await run(repoPath, ["rev-parse", "origin/main"]);
  if (local.status !== 0 || remote.status !== 0) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"], human_gate_required: true };
  }
  let headSha = local.stdout.trim();
  const originSha = remote.stdout.trim();
  if (!/^[0-9a-f]{40}$/i.test(headSha) || !/^[0-9a-f]{40}$/i.test(originSha)) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"], human_gate_required: true };
  }

  // Already synced — no mutation.
  if (headSha === originSha) {
    return {
      ok: true,
      reason_codes: [],
      head: headSha,
      human_gate_required: false,
      sync_performed: false,
    };
  }

  // Ancestry: behind / ahead / diverged (fail closed on merge-base failure).
  const mb = await run(repoPath, ["merge-base", "HEAD", "origin/main"]);
  if (mb.status !== 0 || !/^[0-9a-f]{40}$/i.test(mb.stdout.trim())) {
    return { ok: false, reason_codes: ["MERGE_BASE_FAILED"], human_gate_required: true };
  }
  const baseSha = mb.stdout.trim();
  if (baseSha === originSha && headSha !== originSha) {
    return { ok: false, reason_codes: ["LOCAL_AHEAD_OF_ORIGIN"], human_gate_required: true };
  }
  if (baseSha !== headSha && baseSha !== originSha) {
    return { ok: false, reason_codes: ["HEAD_ORIGIN_DIVERGED"], human_gate_required: true };
  }
  if (baseSha !== headSha) {
    // Not a strict ancestor relationship we recognize.
    return { ok: false, reason_codes: ["HEAD_ORIGIN_MISMATCH"], human_gate_required: true };
  }

  // Strict ancestor: HEAD is behind origin/main → exactly one ff-only merge.
  const ff = await run(repoPath, ["merge", "--ff-only", "origin/main"]);
  if (ff.status !== 0) {
    return { ok: false, reason_codes: ["FAST_FORWARD_FAILED"], human_gate_required: true };
  }
  const after = await run(repoPath, ["rev-parse", "HEAD"]);
  if (after.status !== 0) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"], human_gate_required: true };
  }
  headSha = after.stdout.trim();
  if (headSha !== originSha) {
    return { ok: false, reason_codes: ["FAST_FORWARD_DID_NOT_SYNC"], human_gate_required: true };
  }
  return {
    ok: true,
    reason_codes: ["FAST_FORWARD_SYNCED"],
    head: headSha,
    human_gate_required: false,
    sync_performed: true,
  };
}

export function validateTickRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, reason_codes: ["BODY_NOT_OBJECT"] };
  }
  if (body.schema_version !== REQUEST_SCHEMA) {
    return { ok: false, reason_codes: ["SCHEMA_VERSION_UNSUPPORTED"] };
  }
  if (typeof body.request_id !== "string" || !body.request_id.trim() || body.request_id.length > 200) {
    return { ok: false, reason_codes: ["REQUEST_ID_INVALID"] };
  }
  if (body.source !== "n8n") {
    return { ok: false, reason_codes: ["SOURCE_UNSUPPORTED"] };
  }
  const allowedKeys = ["schema_version", "request_id", "source"];
  for (const k of Object.keys(body)) {
    if (!allowedKeys.includes(k)) return { ok: false, reason_codes: ["REQUEST_FIELD_UNSUPPORTED", k] };
  }
  return { ok: true, reason_codes: [] };
}

export function wrapTickResult(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    ok: partial.ok === true,
    request_id: partial.request_id ?? null,
    classification: partial.classification ?? "SERVICE_ERROR",
    execution_performed: partial.execution_performed === true,
    task_ref: partial.task_ref ?? null,
    executor_classification: partial.executor_classification ?? null,
    human_gate_required: partial.human_gate_required === true,
    gate_summary: partial.gate_summary ?? null,
    reason_codes: Array.isArray(partial.reason_codes) ? partial.reason_codes.slice(0, 16) : [],
  };
}

/** Normalize an executor result into the bounded tick result. */
export function classificationFromExecutorResult(executorResult, request_id) {
  const pass = executorResult && executorResult.status === "PASS";
  return wrapTickResult({
    ok: pass,
    request_id,
    classification: pass ? "WORK_EXECUTED_PASS" : "WORK_EXECUTED_STOP",
    execution_performed: true,
    task_ref: executorResult?.task_ref ?? null,
    executor_classification: executorResult?.classification ?? null,
    human_gate_required: false,
    reason_codes: Array.isArray(executorResult?.reason_codes) ? executorResult.reason_codes : [],
  });
}

/**
 * TRUE only when NONE of the supported performTick dependencies were injected.
 * Any supplied injectable dep disables BOTH claim-envelope and receipts writes
 * (V4_PARTIAL_INJECTED_TICKDEPS_REAL_RUNTIME_ISOLATION_V1 — closes S4 verifyRepo-only leakage).
 */
export function shouldPersistRuntimeArtifacts(deps = {}) {
  return !(
    deps.verifyRepo ||
    deps.scanQueue ||
    deps.runDispatchLoop ||
    deps.runExecutor ||
    deps.nowIso ||
    deps.ensureDevQwenReady
  );
}

/**
 * Atomic same-directory receipts persist: write complete JSON to a unique
 * temp file, then rename onto receipts.json. Best-effort temp cleanup on
 * failure. Never truncates the canonical file in place.
 */
export function persistReceiptsAtomic(targetPath, receipts) {
  if (typeof targetPath !== "string" || !targetPath) {
    const err = new Error("RECEIPTS_PATH_INVALID");
    err.code = "RECEIPTS_PATH_INVALID";
    throw err;
  }
  if (!Array.isArray(receipts)) {
    const err = new Error("RECEIPTS_NOT_ARRAY");
    err.code = "RECEIPTS_NOT_ARRAY";
    throw err;
  }
  const dir = dirname(targetPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = join(dir, `.receipts-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`);
  try {
    writeFileSync(tmp, `${JSON.stringify(receipts, null, 2)}\n`, "utf8");
    renameSync(tmp, targetPath);
  } catch (err) {
    try { unlinkSync(tmp); } catch { /* best-effort */ }
    throw err;
  }
}

/**
 * One bounded tick. deps are injectable for offline tests:
 * verifyRepo, scanQueue, runDispatchLoop, runExecutor, nowIso, statusTracker.
 * scanQueue returns [{ ok, item, markdown, source, backlog_path }].
 */
export async function performTick(body, deps = {}) {
  const requestId = typeof body?.request_id === "string" ? body.request_id : null;
  const tracker = deps.statusTracker || null;
  const statusSafe = (fn, ...args) => {
    try { return tracker && typeof tracker[fn] === "function" ? tracker[fn](...args) : null; } catch { return null; }
  };
  const terminalClassification = (result) => {
    if (!result) return "SERVICE_ERROR";
    if (result.executor_classification) return result.executor_classification;
    if (result.classification === "WORK_EXECUTED_PASS") return "PASS";
    if (result.classification === "WORK_EXECUTED_STOP") return result.executor_classification || "STOP";
    return result.classification || "SERVICE_ERROR";
  };
  const done = (result) => {
    statusSafe("finish", {
      request_id: requestId,
      task_ref: result?.task_ref ?? null,
      classification: terminalClassification(result),
      last_event: `terminal:${terminalClassification(result)}`,
    });
    return result;
  };

  statusSafe("start", {
    request_id: requestId,
    phase: "REPO_HYGIENE",
    executor_pid: process.pid,
    last_event: "repo_hygiene",
  });

  const verifyRepo = deps.verifyRepo || verifyRepoState;
  const scan = deps.scanQueue || ((queueDir) => {
    const abs = resolve(CANONICAL_REPO_PATH, queueDir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs).filter((f) => f.endsWith(".md")).sort().map((f) => {
      try {
        const markdown = readFileSync(join(abs, f), "utf8").replace(/^\uFEFF/, "");
        return { markdown, source: f, backlog_path: `${queueDir}/${f}` };
      } catch {
        return { markdown: "", source: f, backlog_path: `${queueDir}/${f}`, read_failed: true };
      }
    });
  });
  const dispatchLoop = deps.runDispatchLoop || runDispatchLoop;
  const defaultRunExecutor = async (envelope, execOpts = {}) =>
    executeLocalDevTask(envelope, { ...composeRunners(), ...execOpts });
  const runExecutor = deps.runExecutor || defaultRunExecutor;
  const nowIso = deps.nowIso ? deps.nowIso() : new Date().toISOString();
  const receiptsPath = deps.receiptsPath || resolve(CANONICAL_REPO_PATH, RECEIPTS_PATH);
  const loadReceipts = deps.loadReceipts || (() => loadReceiptsFile(receiptsPath));

  // 1. Repo hygiene (fail-closed, non-destructive).
  const repoState = await verifyRepo();
  if (!repoState.ok) {
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      human_gate_required: true,
      gate_summary: repoState.gate_summary || (repoState.reason_codes || []).join(","),
      reason_codes: repoState.reason_codes,
    }));
  }
  const head = repoState.head;

  // 2. Claim AT MOST ONE real READY item via the proven dispatcher primitive.
  statusSafe("update", { phase: "QUEUE_SCAN", last_event: "queue_scan" });
  const receipts = loadReceipts();
  const entries = scan(QUEUE_DIR).map((e) => {
    if (e.read_failed || !e.markdown) return { ok: false, source: e.source };
    try {
      const parsed = parseBacklog(e.markdown);
      return { ...parsed, markdown: e.markdown, source: e.source, backlog_path: e.backlog_path };
    } catch {
      return { ok: false, source: e.source };
    }
  });
  const loop = dispatchLoop(entries, receipts, {
    repo: REPO,
    commit: head,
    head,
    nowIso,
    maxClaims: 1,
    queueDir: QUEUE_DIR,
  });
  if (!loop.claims.length) {
    return done(wrapTickResult({
      ok: true,
      request_id: requestId,
      classification: "IDLE_CLEAN",
      execution_performed: false,
      reason_codes: loop.skipped?.length ? ["CLAIM_SKIPPED_PRESENT"] : ["NO_ELIGIBLE_READY"],
    }));
  }
  const claim = loop.claims[0];
  statusSafe("update", {
    phase: "QWEN_PREFLIGHT",
    task_ref: claim.task_ref,
    qwen_profile: claim?.envelope?.profile_id ?? null,
    last_event: "qwen_preflight",
  });

  // 2b. Exact DEV profile readiness BEFORE any durable claim/envelope write.
  // In-memory selection is not consumption; persistence is.
  const ensureDevQwenReady = deps.ensureDevQwenReady || ensureWorkstationDevQwenReady;
  const profileId = claim?.envelope?.profile_id;
  let readiness;
  try {
    readiness = await ensureDevQwenReady({
      profile: profileId,
      readinessTimeoutMs: deps.qwenPreflightTimeoutMs ?? QWEN_PREFLIGHT_TIMEOUT_MS,
    });
  } catch (err) {
    statusSafe("update", { runtime_ready: false, last_event: "qwen_preflight_threw" });
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      execution_performed: false,
      task_ref: claim.task_ref,
      human_gate_required: true,
      gate_summary: "QWEN_SESSION_NOT_READY",
      reason_codes: [
        "QWEN_SESSION_NOT_READY",
        String(err?.code || err?.message || "ensure_threw").slice(0, 80),
      ],
    }));
  }
  if (!readiness || readiness.ready !== true) {
    const status = readiness?.reason_code || readiness?.status || "QWEN_SESSION_NOT_READY";
    statusSafe("update", { runtime_ready: false, last_event: "qwen_not_ready" });
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      execution_performed: false,
      task_ref: claim.task_ref,
      human_gate_required: true,
      gate_summary: `QWEN_SESSION_NOT_READY:${status}`,
      reason_codes: ["QWEN_SESSION_NOT_READY", String(status).slice(0, 80)],
    }));
  }
  statusSafe("update", { runtime_ready: true, last_event: "qwen_ready" });

  // 3. Persist claim receipts + envelope ONLY after exact profile READY.
  // Real runtime (zero injected deps) persists BOTH; ANY injected performTick
  // dependency persists NEITHER (shouldPersistRuntimeArtifacts).
  statusSafe("update", { phase: "CLAIM", last_event: "claim_persist" });
  const realRuntimePersistence = shouldPersistRuntimeArtifacts(deps);
  const persistReceiptsFn = deps.persistReceipts
    || (realRuntimePersistence ? (list) => persistReceiptsAtomic(receiptsPath, list) : null);
  const persistFailed = (err) => wrapTickResult({
    ok: false,
    request_id: requestId,
    classification: "SERVICE_ERROR",
    task_ref: claim.task_ref,
    reason_codes: ["PERSIST_FAILED", String(err?.code || err?.message || "unknown").slice(0, 80)],
  });
  let ledger = receipts.concat(loop.claims.map((c) => buildReceiptLifecycle(c.receipt || { task_ref: c.task_ref }, "CLAIMED")));
  try {
    if (realRuntimePersistence) {
      const outDir = resolve(CANONICAL_REPO_PATH, QUEUE_DIR);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const safe = claim.task_ref.replace(/[^A-Za-z0-9_-]/g, "_");
      writeFileSync(join(outDir, `${safe}__dispatch-envelope.json`), JSON.stringify(claim.envelope, null, 2), "utf8");
    }
    if (persistReceiptsFn) persistReceiptsFn(ledger);
  } catch (err) {
    return done(persistFailed(err));
  }

  // 3b. MICRO_TASK_DELTA admission — AFTER claim, BEFORE executor.
  // Rejected admission never reaches runExecutor (execution_performed=false).
  // Classification HUMAN_GATE_REQUIRED stays within the WF90 ALLOWED set
  // (no live schema expansion in this pass).
  statusSafe("update", { phase: "ADMISSION", last_event: "admission" });
  const admitFn = deps.admitMicroTaskDelta || admitMicroTaskDelta;
  const admissionInput = deps.admissionInput
    || extractMicroTaskAdmissionInput(claim);
  const admission = admitFn(admissionInput);
  if (!admission || admission.admitted !== true) {
    try {
      ledger = transitionLatestReceipt(ledger, claim.task_ref, "STOP", {
        execution_started: false,
        replayable: true,
      });
      if (persistReceiptsFn) persistReceiptsFn(ledger);
    } catch (err) {
      return done(persistFailed(err));
    }
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      execution_performed: false,
      task_ref: claim.task_ref,
      human_gate_required: true,
      gate_summary: (admission?.reason_codes || ["MICRO_TASK_ADMISSION_REJECTED"]).join(","),
      reason_codes: [
        "MICRO_TASK_ADMISSION_REJECTED",
        ...(Array.isArray(admission?.reason_codes) ? admission.reason_codes : ["ADMISSION_HELPER_INVALID"]),
      ].slice(0, 16),
    }));
  }

  // 4. Persist EXECUTING immediately BEFORE runExecutor, then execute.
  try {
    ledger = transitionLatestReceipt(ledger, claim.task_ref, "EXECUTING");
    if (persistReceiptsFn) persistReceiptsFn(ledger);
  } catch (err) {
    return done(persistFailed(err));
  }
  statusSafe("update", {
    phase: "EXECUTING",
    executor_pid: process.pid,
    last_event: "executor_start",
  });
  let executorResult;
  try {
    const onStatus = (event = {}) => {
      statusSafe("update", {
        phase: event.phase || "EXECUTING",
        tests_state: event.tests_state,
        files_touched: event.files_touched,
        classification: event.classification,
        last_event: event.last_event || event.phase || "executor_event",
      });
    };
    executorResult = await runExecutor(claim.envelope, { onStatus });
  } catch (err) {
    executorResult = {
      status: "STOP",
      classification: "STOP:SERVICE_EXECUTION_ERROR",
      task_ref: claim.task_ref,
      reason_codes: [String(err?.code || err?.message || "executor_error").slice(0, 80)],
    };
  }
  const terminalPass = executorResult && executorResult.status === "PASS";
  try {
    ledger = transitionLatestReceipt(
      ledger,
      claim.task_ref,
      terminalPass ? "PASS" : "STOP",
      { execution_started: true, replayable: false },
    );
    if (persistReceiptsFn) persistReceiptsFn(ledger);
  } catch (err) {
    return done(persistFailed(err));
  }
  return done(classificationFromExecutorResult(executorResult, requestId));
}

// parseBacklog via the proven selector module (imported lazily to keep the
// module import graph identical to the proven dispatcher primitive).
import { parseBacklogFile as parseBacklog } from "./select-local-dev-queue-item-v1.mjs";

function loadReceiptsFile(path = resolve(CANONICAL_REPO_PATH, RECEIPTS_PATH)) {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Read the request body with a hard byte cap. */
function readBody(req) {
  return new Promise((res) => {
    let size = 0;
    const chunks = [];
    let done = false;
    const finish = (v) => { if (!done) { done = true; res(v); } };
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) { finish(null); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => finish(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => finish(null));
  });
}

/** HTTP handler. Injected deps only for tests. Routes /v1/tick and /v1/status. */
export async function handleTickRequest(req, res, deps = {}) {
  const send = (status, obj) => {
    try {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(`${JSON.stringify(obj)}\n`);
    } catch { /* client gone */ }
  };
  let url;
  try { url = new URL(req.url, "http://127.0.0.1"); } catch { url = null; }
  const path = url?.pathname || "";

  // Read-only status: never acquires the tick lock, never executes work.
  if (path === STATUS_PATH) {
    if (req.method !== "GET") {
      send(405, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["GET_ONLY"] }));
      return;
    }
    const tracker = deps.statusTracker || null;
    let snap;
    try {
      snap = tracker && typeof tracker.snapshot === "function"
        ? tracker.snapshot()
        : emptyStatusSnapshot();
    } catch {
      snap = emptyStatusSnapshot({ phase: "IDLE", last_event: "status_snapshot_error" });
    }
    send(200, snap);
    return;
  }

  if (path !== TICK_PATH) {
    send(404, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["PATH_NOT_FOUND"] }));
    return;
  }
  if (req.method !== "POST") {
    send(405, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["POST_ONLY"] }));
    return;
  }
  const raw = await readBody(req);
  if (raw === null) {
    send(413, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["BODY_TOO_LARGE"] }));
    return;
  }
  let body;
  try { body = JSON.parse(raw); } catch {
    send(400, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["BODY_NOT_JSON"] }));
    return;
  }
  const validation = validateTickRequest(body);
  if (!validation.ok) {
    send(400, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: validation.reason_codes }));
    return;
  }
  // Single-flight: concurrent ticks are BUSY, never queued.
  if (deps.tryAcquireLock && !deps.tryAcquireLock()) {
    send(409, wrapTickResult({ ok: false, request_id: body.request_id, classification: "BUSY", reason_codes: ["EXECUTION_IN_FLIGHT"] }));
    return;
  }
  try {
    const tickDeps = { ...(deps.tickDeps || {}) };
    if (deps.statusTracker && !tickDeps.statusTracker) tickDeps.statusTracker = deps.statusTracker;
    const result = await performTick(body, tickDeps);
    if (deps.releaseLock) deps.releaseLock();
    // WORK_EXECUTED_STOP is a well-formed bounded contract result (executor
    // stopped safely) — transport 200; the n8n normalizer keys off
    // classification, not status code. 500 stays reserved for SERVICE_ERROR
    // (malformed/failed service responses) and HUMAN_GATE_REQUIRED stays 409.
    const status = result.classification === "SERVICE_ERROR" ? 500
      : result.classification === "HUMAN_GATE_REQUIRED" ? 409
      : 200;
    send(status, result);
  } catch (err) {
    if (deps.releaseLock) deps.releaseLock();
    try {
      deps.statusTracker?.finish?.({
        request_id: body.request_id,
        classification: "SERVICE_ERROR",
        last_event: "tick_unhandled",
      });
    } catch { /* observability only */ }
    send(500, wrapTickResult({ ok: false, request_id: body.request_id, classification: "SERVICE_ERROR", reason_codes: ["TICK_UNHANDLED", String(err?.message || err).slice(0, 80)] }));
  }
}

export function startServer(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  let executing = false;
  const tryAcquireLock = () => {
    if (executing) return false;
    executing = true;
    return true;
  };
  const releaseLock = () => { executing = false; };
  const statusTracker = options.statusTracker || createExecutionStatusTracker();
  const server = http.createServer((req, res) => {
    handleTickRequest(req, res, {
      ...(options.deps || {}),
      tryAcquireLock,
      releaseLock,
      statusTracker,
    }).catch(() => {
      releaseLock();
      try {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(`${JSON.stringify(wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["HANDLER_UNHANDLED"] }))}\n`);
      } catch { /* ignore */ }
    });
  });
  return new Promise((resolvePromise, rejectPromise) => {
    server.on("error", rejectPromise);
    server.listen(port, host, () => resolvePromise(server));
  });
}

async function main() {
  const server = await startServer();
  const addr = server.address();
  process.stdout.write(`${JSON.stringify({
    schema_version: RESULT_SCHEMA,
    service: "local-dev-autonomous-dispatcher-v1",
    listening: `${addr.address}:${addr.port}`,
    tick_path: TICK_PATH,
    external_route: "/v4/local-dev/dispatch-tick",
    repo: CANONICAL_REPO_PATH,
    queue_dir: QUEUE_DIR,
    started_at: new Date().toISOString(),
  })}\n`);
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/serve-local-dev-autonomous-dispatcher-v1.mjs");
if (isMain) {
  main().catch((e) => {
    process.stderr.write(`error: ${e && e.message ? e.message : e}\n`);
    process.exit(1);
  });
}
