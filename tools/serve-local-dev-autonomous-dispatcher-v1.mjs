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
 *   → execute envelope (LOCAL_DEV_EXECUTOR authority) → bounded response.
 *
 * Composition only: reuses tools/dispatch-local-dev-queue-loop-v1.mjs
 * (selector/claim authority) and tools/run-local-dev-executor-v1.mjs
 * (execution authority) UNCHANGED. No second executor. No safety-law merge.
 *
 * The caller can NEVER influence: repo path, commands, profile, allowed
 * paths, task choice, synthetic policy, or production routing. Those are
 * server-side canonical constants.
 *
 * In-process single-flight lock: a concurrent tick returns BUSY and never
 * queues.
 *
 * Repository hygiene (fail-closed, non-destructive): canonical checkout,
 * branch main, HEAD == origin/main after fetch, no conflicting tracked
 * dirty state. Any mismatch → HUMAN_GATE_REQUIRED (never reset/stash/clean).
 *
 * IDLE ticks NEVER manufacture synthetic work (authoring law: only real
 * READY backlog executes here; synthetic capability preserved elsewhere).
 */
import http from "node:http";
import { execFile } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runDispatchLoop } from "./dispatch-local-dev-queue-loop-v1.mjs";
import { KNOWN_LOCAL_REPOS } from "./bridge-backlog-to-local-dev-envelope-v1.mjs";
import { executeLocalDevTask } from "./local-dev-executor-v1.mjs";
import { composeRunners } from "./run-local-dev-executor-v1.mjs";

export const RESULT_SCHEMA = "local-dev-dispatch-tick-result-v1";
export const REQUEST_SCHEMA = "local-dev-dispatch-tick-v1";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 18793;
export const TICK_PATH = "/v1/tick";
export const REPO = "mrhz1973/control-plane";
export const CANONICAL_REPO_PATH = KNOWN_LOCAL_REPOS[REPO];
export const QUEUE_DIR = "reports/runtime/dev-queue/always-on";
export const RECEIPTS_PATH = "reports/runtime/dev-queue/receipts.json";
export const MAX_BODY_BYTES = 64 * 1024;
export const CLASSIFICATIONS = Object.freeze([
  "WORK_EXECUTED_PASS",
  "WORK_EXECUTED_STOP",
  "IDLE_CLEAN",
  "BUSY",
  "HUMAN_GATE_REQUIRED",
  "SERVICE_ERROR",
]);

function gitExec(repoPath, args) {
  return new Promise((res) => {
    execFile("git.exe", args, { cwd: repoPath, windowsHide: true, timeout: 120_000 }, (err, stdout, stderr) => {
      res({ status: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

/** Fail-closed repo hygiene: canonical checkout + main + synced + clean-enough. */
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
  const local = await run(repoPath, ["rev-parse", "HEAD"]);
  const remote = await run(repoPath, ["rev-parse", "origin/main"]);
  if (local.status !== 0 || remote.status !== 0) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"], human_gate_required: true };
  }
  if (local.stdout.trim() !== remote.stdout.trim()) {
    return { ok: false, reason_codes: ["HEAD_ORIGIN_MISMATCH"], human_gate_required: true };
  }
  const dirty = await run(repoPath, ["status", "--porcelain=v1", "--untracked-files=no"]);
  if (dirty.status !== 0) {
    return { ok: false, reason_codes: ["STATUS_FAILED"], human_gate_required: true };
  }
  const dirtyLines = dirty.stdout.split("\n").filter((l) => l.trim());
  if (dirtyLines.length) {
    return { ok: false, reason_codes: ["TRACKED_DIRTY_CONFLICT"], human_gate_required: true, gate_summary: `tracked dirty: ${dirtyLines.length} file(s)` };
  }
  return { ok: true, reason_codes: [], head: local.stdout.trim(), human_gate_required: false };
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
 * One bounded tick. deps are injectable for offline tests:
 * verifyRepo, scanQueue, runDispatchLoop, runExecutor, nowIso.
 * scanQueue returns [{ ok, item, markdown, source, backlog_path }].
 */
export async function performTick(body, deps = {}) {
  const requestId = typeof body?.request_id === "string" ? body.request_id : null;
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
  const runExecutor = deps.runExecutor || (async (envelope) => executeLocalDevTask(envelope, composeRunners()));
  const nowIso = deps.nowIso ? deps.nowIso() : new Date().toISOString();

  // 1. Repo hygiene (fail-closed, non-destructive).
  const repoState = await verifyRepo();
  if (!repoState.ok) {
    return wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      human_gate_required: true,
      gate_summary: repoState.gate_summary || (repoState.reason_codes || []).join(","),
      reason_codes: repoState.reason_codes,
    });
  }
  const head = repoState.head;

  // 2. Claim AT MOST ONE real READY item via the proven dispatcher primitive.
  const receipts = loadReceiptsFile();
  const entries = scan(QUEUE_DIR).map((e) => {
    if (e.read_failed || !e.markdown) return { ok: false, source: e.source };
    try {
      const parsed = parseBacklog(e);
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
    return wrapTickResult({
      ok: true,
      request_id: requestId,
      classification: "IDLE_CLEAN",
      execution_performed: false,
      reason_codes: loop.skipped?.length ? ["CLAIM_SKIPPED_PRESENT"] : ["NO_ELIGIBLE_READY"],
    });
  }
  const claim = loop.claims[0];

  // 3. Persist claim receipts + envelope (same layout as the proven loop).
  try {
    const outDir = resolve(CANONICAL_REPO_PATH, QUEUE_DIR);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const safe = claim.task_ref.replace(/[^A-Za-z0-9_-]/g, "_");
    writeFileSync(join(outDir, `${safe}__dispatch-envelope.json`), JSON.stringify(claim.envelope, null, 2), "utf8");
    // In tests (deps injected) the canonical receipts file must NOT be touched.
    if (!deps.runDispatchLoop && !deps.scanQueue && !deps.runExecutor) {
      writeFileSync(resolve(CANONICAL_REPO_PATH, RECEIPTS_PATH), JSON.stringify(receipts.concat(loop.claims.map((c) => c.receipt)), null, 2), "utf8");
    }
  } catch (err) {
    return wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "SERVICE_ERROR",
      reason_codes: ["PERSIST_FAILED", String(err?.code || err?.message || "unknown").slice(0, 80)],
    });
  }

  // 4. Execute EXACTLY the emitted envelope via the proven executor.
  let executorResult;
  try {
    executorResult = await runExecutor(claim.envelope);
  } catch (err) {
    executorResult = {
      status: "STOP",
      classification: "STOP:SERVICE_EXECUTION_ERROR",
      task_ref: claim.task_ref,
      reason_codes: [String(err?.code || err?.message || "executor_error").slice(0, 80)],
    };
  }
  return classificationFromExecutorResult(executorResult, requestId);
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

/** HTTP handler. Injected deps only for tests. */
export async function handleTickRequest(req, res, deps = {}) {
  const send = (status, obj) => {
    try {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(`${JSON.stringify(obj)}\n`);
    } catch { /* client gone */ }
  };
  if (req.method !== "POST") {
    send(405, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["POST_ONLY"] }));
    return;
  }
  let url;
  try { url = new URL(req.url, "http://127.0.0.1"); } catch { url = null; }
  if (!url || url.pathname !== TICK_PATH) {
    send(404, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["PATH_NOT_FOUND"] }));
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
    const result = await performTick(body, deps.tickDeps || {});
    if (deps.releaseLock) deps.releaseLock();
    send(result.classification === "WORK_EXECUTED_STOP" || result.classification === "HUMAN_GATE_REQUIRED" || result.classification === "SERVICE_ERROR" ? 500 : 200, result);
  } catch (err) {
    if (deps.releaseLock) deps.releaseLock();
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
  const server = http.createServer((req, res) => {
    handleTickRequest(req, res, { ...(options.deps || {}), tryAcquireLock, releaseLock }).catch(() => {
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
