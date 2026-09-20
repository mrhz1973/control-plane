/**
 * Focused offline tests for tools/serve-local-dev-autonomous-dispatcher-v1.mjs
 * (V4_LOCAL_DEV_N8N_ALWAYS_ON_LIVE_FAST_TRACK_V1, §I minimum test policy).
 * Covers ONLY: request validation, single-flight BUSY, max-one-task/tick,
 * response normalization. No live execution, no network.
 *
 * Run: node tests/local-dev-dispatcher-service-v1/run.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdtempSync, unlinkSync, statSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import {
  RESULT_SCHEMA,
  REQUEST_SCHEMA,
  TICK_PATH,
  STATUS_PATH,
  DIAGNOSTICS_PATH,
  DIAGNOSTICS_SCHEMA,
  STATUS_SCHEMA,
  CLASSIFICATIONS,
  validateTickRequest,
  wrapTickResult,
  classificationFromExecutorResult,
  performTick,
  handleTickRequest,
  verifyRepoState,
  shouldPersistRuntimeArtifacts,
  persistReceiptsAtomic,
  createExecutionStatusTracker,
  createLastTickStore,
  buildQueueScanDiagnostics,
  buildOperatorExplanation,
  buildDiagnostics,
  normalizeQwenModel,
  probeQwenEndpointReadOnly,
  loadReceiptsLedger,
  WF90_INTERVAL_SECONDS,
  DASHBOARD_PATHS,
  RESOURCES_PATH,
  RESOURCES_SCHEMA,
} from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";
import {
  buildResourceObservatory,
  collectWorkstationMetrics,
  collectGpuMetrics,
  collectQwenResources,
  collectVpsNewResources,
  collectQuotaObservatory,
  collectChatgptWebObservation,
  assertVpsCommandSafe,
  resetVpsObservationCache,
  VPS_SAFE_REMOTE_COMMANDS,
} from "../../tools/local-dev-resource-observatory-v1.mjs";
import {
  CLAIM_STALE_AFTER_MS,
  isReceiptBlocking,
  buildLocalDevEnvelopeFromBacklog,
} from "../../tools/bridge-backlog-to-local-dev-envelope-v1.mjs";
import { parseBacklogFile, selectNextQueueItem } from "../../tools/select-local-dev-queue-item-v1.mjs";

let passed = 0;
const failures = [];

/** Canonical repo root as seen by this checkout (test file lives at tests/<suite>/). */
function CANONICAL_REPO_PATH_TEST() {
  return resolve(process.cwd());
}
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    failures.push(name);
    process.stdout.write(`FAIL ${name}: ${err?.message || err}\n`);
  }
}

/** Minimal mock HTTP req/res. */
function mockReq(method, url, body) {
  return { method, url, on(ev, cb) { if (ev === "data" && body) cb(Buffer.from(body)); if (ev === "end") cb(); } };
}
function mockRes() {
  const state = { status: null, body: null };
  state.writeHead = (s) => { state.status = s; return state; };
  state.end = (b) => { state.body = b; };
  return state;
}

await test("S1 request validation: exact schema, source pinned to n8n, no caller-controlled fields", () => {
  assert.equal(validateTickRequest({ schema_version: REQUEST_SCHEMA, request_id: "n8n-local-dev-20260905T000000Z-abc123", source: "n8n" }).ok, true);
  for (const [name, body] of Object.entries({
    wrong_schema: { schema_version: "other", request_id: "x", source: "n8n" },
    bad_source: { schema_version: REQUEST_SCHEMA, request_id: "x", source: "cron" },
    empty_id: { schema_version: REQUEST_SCHEMA, request_id: "", source: "n8n" },
    long_id: { schema_version: REQUEST_SCHEMA, request_id: "x".repeat(201), source: "n8n" },
    extra_field: { schema_version: REQUEST_SCHEMA, request_id: "x", source: "n8n", profile: "pwn" },
    command_injection: { schema_version: REQUEST_SCHEMA, request_id: "x", source: "n8n", commands: ["rm -rf /"] },
    repo_override: { schema_version: REQUEST_SCHEMA, request_id: "x", source: "n8n", repo_path: "C:/elsewhere" },
    not_object: "hello",
  })) {
    const v = validateTickRequest(body);
    assert.equal(v.ok, false, name);
  }
});

await test("S2 method+path gates: GET/other rejected, wrong path rejected", async () => {
  for (const [method, path, code] of [["GET", TICK_PATH, 405], ["DELETE", TICK_PATH, 405], ["POST", "/other", 404], ["POST", "/v1/tick/extra", 404]]) {
    const res = mockRes();
    await handleTickRequest(mockReq(method, path, method === "POST" ? "{}" : undefined), res, { tryAcquireLock: () => true, releaseLock: () => {} });
    assert.equal(res.status, code, `${method} ${path}`);
  }
});

await test("S3 malformed JSON body -> 400 SERVICE_ERROR", async () => {
  const res = mockRes();
  await handleTickRequest(mockReq("POST", TICK_PATH, "{nope"), res, { tryAcquireLock: () => true, releaseLock: () => {} });
  assert.equal(res.status, 400);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.classification, "SERVICE_ERROR");
  assert.ok(parsed.reason_codes.includes("BODY_NOT_JSON"));
});

await test("S4 single-flight: second tick while executing -> BUSY, never queued", async () => {
  let locked = false;
  let busySeen = false;
  const tryAcquire = () => { if (locked) { busySeen = true; return false; } locked = true; return true; };
  const release = () => { locked = false; };
  // First request acquires, then while "executing" (verifyRepo pending), second arrives.
  // Fully inject scan/dispatch/executor so S4 cannot touch the live canonical queue
  // (V4_PARTIAL_INJECTED_TICKDEPS_REAL_RUNTIME_ISOLATION_V1).
  let releaseRepo = null;
  let scanCalls = 0;
  let dispatchCalls = 0;
  let executorCalls = 0;
  const slowVerify = () => new Promise((r) => { releaseRepo = () => r({ ok: true, head: "a".repeat(40), reason_codes: [] }); });
  const tickDeps = {
    verifyRepo: slowVerify,
    scanQueue: () => { scanCalls += 1; return []; },
    runDispatchLoop: () => { dispatchCalls += 1; return { ok: true, claims: [], skipped: [], stop_reason: "QUEUE_DRAINED" }; },
    runExecutor: async () => { executorCalls += 1; throw new Error("MUST NOT EXECUTE DURING S4 SINGLE-FLIGHT"); },
    ensureDevQwenReady: async () => { throw new Error("MUST NOT PREFLIGHT DURING S4 IDLE"); },
  };
  const firstRes = mockRes();
  const first = handleTickRequest(mockReq("POST", TICK_PATH, JSON.stringify({ schema_version: REQUEST_SCHEMA, request_id: "r1", source: "n8n" })), firstRes, { tryAcquireLock: tryAcquire, releaseLock: release, tickDeps });
  await new Promise((r) => setTimeout(r, 20));
  const secondRes = mockRes();
  await handleTickRequest(mockReq("POST", TICK_PATH, JSON.stringify({ schema_version: REQUEST_SCHEMA, request_id: "r2", source: "n8n" })), secondRes, { tryAcquireLock: tryAcquire, releaseLock: release });
  assert.equal(secondRes.status, 409);
  assert.equal(JSON.parse(secondRes.body).classification, "BUSY");
  assert.equal(busySeen, true);
  releaseRepo();
  await first;
  assert.equal(locked, false, "lock released after tick");
  assert.equal(JSON.parse(firstRes.body).classification, "IDLE_CLEAN");
  assert.equal(executorCalls, 0, "executor never called");
  assert.ok(scanCalls >= 1, "injected scanQueue used (not live queue)");
  assert.ok(dispatchCalls >= 1, "injected runDispatchLoop used (zero claims)");
  assert.equal(shouldPersistRuntimeArtifacts(tickDeps), false, "S4 tickDeps must disable canonical persistence");
});

await test("S5 IDLE_CLEAN: no eligible READY -> no execution, ok=true", async () => {
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r3", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "b".repeat(40), reason_codes: [] }),
      scanQueue: () => [
        { markdown: "state: BLOCKED", source: "x.md", backlog_path: "q/x.md" },
      ],
      runDispatchLoop: () => ({ ok: true, claims: [], skipped: [], stop_reason: "QUEUE_DRAINED" }),
      runExecutor: async () => { throw new Error("MUST NOT EXECUTE ON IDLE"); },
    },
  );
  assert.equal(result.classification, "IDLE_CLEAN");
  assert.equal(result.execution_performed, false);
  assert.equal(result.human_gate_required, false);
});

await test("S6 repo hygiene gate: mismatch/dirty -> HUMAN_GATE_REQUIRED, no execution", async () => {
  for (const reason of ["HEAD_ORIGIN_MISMATCH", "TRACKED_DIRTY_CONFLICT", "BRANCH_NOT_MAIN"]) {
    const result = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r4", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: false, reason_codes: [reason], human_gate_required: true, gate_summary: reason }),
        runExecutor: async () => { throw new Error("MUST NOT EXECUTE ON GATE"); },
      },
    );
    assert.equal(result.classification, "HUMAN_GATE_REQUIRED", reason);
    assert.equal(result.human_gate_required, true);
    assert.equal(result.execution_performed, false);
  }
});

await test("S7 exactly ONE task per tick: two admissible items -> one claim, one execution", async () => {
  const executed = [];
  const entries = [
    { ok: true, item: { id: "D-1", state: "READY_FOR_PLANNING" }, markdown: "m1", source: "1.md", backlog_path: "q/1.md" },
    { ok: true, item: { id: "D-2", state: "READY_FOR_PLANNING" }, markdown: "m2", source: "2.md", backlog_path: "q/2.md" },
  ];
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r5", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "c".repeat(40), reason_codes: [] }),
      scanQueue: () => entries,
      runDispatchLoop: (seen) => {
        return { ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-1", source_file: "1.md", envelope: { task_ref: "LOCAL_DEV_B_D-1", profile_id: "qwen38-opus-q3-opencode-64k" }, receipt: { task_ref: "LOCAL_DEV_B_D-1" } }], skipped: [], stop_reason: "MAX_CLAIMS_REACHED" };
      },
      ensureDevQwenReady: readyEnsureStub(),
      runExecutor: async (envelope) => { executed.push(envelope.task_ref); return { status: "PASS", classification: "PASS", task_ref: envelope.task_ref, reason_codes: ["PASS"] }; },
    },
  );
  assert.equal(result.classification, "WORK_EXECUTED_PASS");
  assert.equal(result.execution_performed, true);
  assert.equal(result.task_ref, "LOCAL_DEV_B_D-1");
  assert.equal(executed.length, 1);
});

await test("S8 executor STOP -> WORK_EXECUTED_STOP, bounded fields only", async () => {
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r6", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "d".repeat(40), reason_codes: [] }),
      scanQueue: () => [{ ok: true, item: { id: "D-9" }, markdown: "m", source: "9.md", backlog_path: "q/9.md" }],
      runDispatchLoop: () => ({ ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-9", source_file: "9.md", envelope: { task_ref: "LOCAL_DEV_B_D-9", profile_id: "qwen38-opus-q3-opencode-64k" }, receipt: { task_ref: "LOCAL_DEV_B_D-9" } }], skipped: [] }),
      ensureDevQwenReady: readyEnsureStub(),
      runExecutor: async () => ({ status: "STOP", classification: "STOP:TEST_FAILED", task_ref: "LOCAL_DEV_B_D-9", reason_codes: ["TEST_FAILED"] }),
    },
  );
  assert.equal(result.classification, "WORK_EXECUTED_STOP");
  assert.equal(result.executor_classification, "STOP:TEST_FAILED");
  assert.equal(result.ok, false);
});

await test("S9 response normalization: bounded shape, no secrets field anywhere", async () => {
  const wrapped = wrapTickResult({ ok: true, request_id: "x", classification: "IDLE_CLEAN", reason_codes: Array(30).fill("R") });
  assert.equal(wrapped.schema_version, RESULT_SCHEMA);
  assert.ok(wrapped.reason_codes.length <= 16);
  assert.deepEqual(Object.keys(wrapped).sort(), ["classification", "execution_performed", "executor_classification", "gate_summary", "human_gate_required", "ok", "post_exec_integration", "reason_codes", "request_id", "schema_version", "task_ref"]);
  const fromExecutor = classificationFromExecutorResult({ status: "PASS", classification: "PASS", task_ref: "T", stdout: "SECRETSTUFF", stderr: "MORE" }, "req");
  assert.equal(fromExecutor.executor_classification, "PASS");
  assert.ok(!JSON.stringify(fromExecutor).includes("SECRETSTUFF"));
  for (const c of CLASSIFICATIONS) assert.ok(typeof c === "string");
});

await test("S10 verifyRepoState allows only fetch + ff-only merge (no destructive git)", async () => {
  const calls = [];
  const result = await verifyRepoState({
    repoPath: process.cwd(),
    gitExec: async (p, args) => {
      calls.push(args.join(" "));
      if (args[0] === "rev-parse" && args[1] === "--is-inside-work-tree") return { status: 0, stdout: "true" };
      if (args[0] === "rev-parse" && args[1] === "--abbrev-ref") return { status: 0, stdout: "main" };
      if (args[0] === "fetch") return { status: 0, stdout: "" };
      if (args[0] === "status") return { status: 0, stdout: "" };
      if (args[0] === "rev-parse") return { status: 0, stdout: "e".repeat(40) };
      return { status: 1, stdout: "" };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.sync_performed, false);
  for (const c of calls) {
    assert.ok(!/\b(reset|stash|clean|checkout|rebase|--hard|--force)\b/.test(c), `destructive command attempted: ${c}`);
    if (/\bmerge\b/.test(c)) {
      assert.ok(/^merge --ff-only origin\/main$/.test(c), `non-ff merge attempted: ${c}`);
    }
  }
});

await test("S11 safe-FF advanced HEAD forwarded as head/commit into dispatch-loop options; one admitted executor call continues", async () => {
  const advancedHead = "f".repeat(40);
  const verifyCalls = [];
  const dispatchCalls = [];
  const executed = [];
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r11", source: "n8n" },
    {
      verifyRepo: async () => { verifyCalls.push("verify"); return { ok: true, head: advancedHead, reason_codes: [] }; },
      scanQueue: () => [{ ok: true, item: { id: "D-11", state: "READY_FOR_PLANNING" }, markdown: "m11", source: "11.md", backlog_path: "q/11.md" }],
      runDispatchLoop: (_entries, _receipts, options) => { dispatchCalls.push(options); return { ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-11", source_file: "11.md", envelope: { task_ref: "LOCAL_DEV_B_D-11", profile_id: "qwen38-opus-q3-opencode-64k", head: advancedHead, commit: advancedHead }, receipt: { task_ref: "LOCAL_DEV_B_D-11" } }], skipped: [], stop_reason: "MAX_CLAIMS_REACHED" }; },
      ensureDevQwenReady: readyEnsureStub(),
      runExecutor: async (envelope) => { executed.push(envelope); return { status: "PASS", classification: "PASS", task_ref: envelope.task_ref, reason_codes: ["PASS"] }; },
    },
  );
  assert.equal(result.classification, "WORK_EXECUTED_PASS");
  assert.equal(result.execution_performed, true);
  assert.equal(verifyCalls.length, 1);
  assert.equal(dispatchCalls.length, 1);
  const seen = dispatchCalls[0];
  assert.ok(seen, "dispatch-loop received options");
  assert.equal(seen.head, advancedHead);
  assert.equal(seen.commit, advancedHead);
  assert.equal(executed.length, 1, "exactly one admitted executor call continues");
  assert.equal(executed[0].task_ref, "LOCAL_DEV_B_D-11");
});

await test("S12 advanced-HEAD repo verification reaches dispatch-loop options; task_ref preserved; one executor invocation", async () => {
  const advancedHead = "a".repeat(40);
  const taskRef = "LOCAL_DEV_B_D-12";
  let optionsSeen = null;
  const execRefs = [];
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r12", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: advancedHead, reason_codes: [] }),
      scanQueue: () => [{ ok: true, item: { id: "D-12", state: "READY_FOR_PLANNING" }, markdown: "m12", source: "12.md", backlog_path: "q/12.md" }],
      runDispatchLoop: (_e, _r, options) => {
        optionsSeen = options;
        return { ok: true, claims: [{ task_ref: taskRef, source_file: "12.md", envelope: { task_ref: taskRef, profile_id: "qwen38-opus-q3-opencode-64k", head: advancedHead, commit: advancedHead }, receipt: { task_ref: taskRef } }], skipped: [] };
      },
      ensureDevQwenReady: readyEnsureStub(),
      runExecutor: async (envelope) => { execRefs.push(envelope.task_ref); return { status: "PASS", classification: "PASS", task_ref: envelope.task_ref, reason_codes: ["PASS"] }; },
    },
  );
  assert.equal(result.classification, "WORK_EXECUTED_PASS");
  assert.equal(result.execution_performed, true);
  assert.ok(optionsSeen, "dispatch-loop options reached");
  assert.equal(optionsSeen.head, advancedHead);
  assert.equal(optionsSeen.commit, advancedHead);
  assert.equal(result.task_ref, taskRef);
  assert.equal(execRefs.length, 1);
  assert.equal(execRefs[0], taskRef);
});

await test("S13 injected performTick persistence isolation: no canonical queue artifacts, semantics unchanged; real mode persistence-enabled", async () => {
  // Pure persistence-gate helper: empty deps enabled; EACH injectable dep disables.
  assert.equal(shouldPersistRuntimeArtifacts({}), true);
  assert.equal(shouldPersistRuntimeArtifacts({ verifyRepo: async () => ({}) }), false);
  assert.equal(shouldPersistRuntimeArtifacts({ scanQueue: () => [] }), false);
  assert.equal(shouldPersistRuntimeArtifacts({ runDispatchLoop: () => ({}) }), false);
  assert.equal(shouldPersistRuntimeArtifacts({ runExecutor: async () => ({}) }), false);
  assert.equal(shouldPersistRuntimeArtifacts({ nowIso: () => "t" }), false);
  assert.equal(shouldPersistRuntimeArtifacts({ ensureDevQwenReady: async () => ({}) }), false);

  // Snapshot the canonical queue dir + receipts BEFORE (no artifact may be
  // created/deleted by this regression itself).
  const queueDir = resolve(CANONICAL_REPO_PATH_TEST(), "reports/runtime/dev-queue/always-on");
  const before = existsSync(queueDir) ? readdirSync(queueDir).sort().join(",") : "";
  const receiptsBefore = existsSync(resolve(CANONICAL_REPO_PATH_TEST(), "reports/runtime/dev-queue/always-on/receipts.json"))
    ? readFileSync(resolve(CANONICAL_REPO_PATH_TEST(), "reports/runtime/dev-queue/always-on/receipts.json"), "utf8")
    : null;

  const advancedHead = "b".repeat(40);
  const taskRef = "LOCAL_DEV_B_D-13"; // fresh fake id, never used by S11/S12
  let optionsSeen = null;
  const execRefs = [];
  const injected = {
    verifyRepo: async () => ({ ok: true, head: advancedHead, reason_codes: [] }),
    scanQueue: () => [{ ok: true, item: { id: "D-13", state: "READY_FOR_PLANNING" }, markdown: "m13", source: "13.md", backlog_path: "q/13.md" }],
    runDispatchLoop: (_e, _r, options) => {
      optionsSeen = options;
      return { ok: true, claims: [{ task_ref: taskRef, source_file: "13.md", envelope: { task_ref: taskRef, profile_id: "qwen38-opus-q3-opencode-64k", head: advancedHead, commit: advancedHead }, receipt: { task_ref: taskRef } }], skipped: [] };
    },
    ensureDevQwenReady: readyEnsureStub(),
    runExecutor: async (envelope) => { execRefs.push(envelope.task_ref); return { status: "PASS", classification: "PASS", task_ref: envelope.task_ref, reason_codes: ["PASS"] }; },
  };
  assert.equal(shouldPersistRuntimeArtifacts(injected), false);
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r13", source: "n8n" },
    injected,
  );
  // Classification semantics unchanged (same contract as S11/S12).
  assert.equal(result.classification, "WORK_EXECUTED_PASS");
  assert.equal(result.execution_performed, true);
  assert.equal(optionsSeen.head, advancedHead);
  assert.equal(optionsSeen.commit, advancedHead);
  assert.equal(result.task_ref, taskRef);
  assert.equal(execRefs.length, 1);
  assert.equal(execRefs[0], taskRef);

  // Injected-deps mode persists NEITHER the fake envelope NOR receipts.
  const after = existsSync(queueDir) ? readdirSync(queueDir).sort().join(",") : "";
  assert.equal(after, before, "canonical queue dir unchanged by injected performTick");
  assert.ok(!after.split(",").includes("LOCAL_DEV_B_D-13__dispatch-envelope.json"), "no fake D-13 envelope persisted");
  const receiptsAfter = existsSync(resolve(CANONICAL_REPO_PATH_TEST(), "reports/runtime/dev-queue/always-on/receipts.json"))
    ? readFileSync(resolve(CANONICAL_REPO_PATH_TEST(), "reports/runtime/dev-queue/always-on/receipts.json"), "utf8")
    : null;
  assert.equal(receiptsAfter, receiptsBefore, "canonical receipts unchanged by injected performTick");
});

await test("S14 executor STOP normalization preserves bounded failure evidence without leaking stdout/stderr", async () => {
  const result = classificationFromExecutorResult(
    {
      status: "STOP",
      classification: "STOP:S14_SENTINEL",
      task_ref: "LOCAL_DEV_B_S14_SENTINEL",
      reason_codes: ["S14_REASON_A", "S14_REASON_B"],
      stdout: "S14_SECRET_STDOUT",
      stderr: "S14_SECRET_STDERR",
    },
    "req",
  );
  assert.equal(result.classification, "WORK_EXECUTED_STOP");
  assert.equal(result.execution_performed, true);
  assert.equal(result.ok, false);
  assert.equal(result.task_ref, "LOCAL_DEV_B_S14_SENTINEL");
  assert.equal(result.executor_classification, "STOP:S14_SENTINEL");
  assert.ok(result.reason_codes.includes("S14_REASON_A"));
  assert.ok(result.reason_codes.includes("S14_REASON_B"));
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes("S14_SECRET_STDOUT"));
  assert.ok(!serialized.includes("S14_SECRET_STDERR"));
});

await test("S15 null executor result normalizes fail-closed without throwing", () => {
  const result = classificationFromExecutorResult(null, "S15_REQ");
  assert.equal(result.classification, "WORK_EXECUTED_STOP");
  assert.equal(result.execution_performed, true);
  assert.equal(result.ok, false);
  assert.equal(result.request_id, "S15_REQ");
  assert.equal(result.task_ref, null);
  assert.equal(result.executor_classification, null);
  assert.equal(result.human_gate_required, false);
  assert.ok(Array.isArray(result.reason_codes));
  assert.equal(result.reason_codes.length, 0);
});

await test("S16 request validation reports unsupported field name deterministically", () => {
  const v = validateTickRequest({
    schema_version: REQUEST_SCHEMA,
    request_id: "S16_REQ",
    source: "n8n",
    forbidden_s16_field: true
  });
  assert.equal(v.ok, false);
  assert.deepEqual(v.reason_codes, ["REQUEST_FIELD_UNSUPPORTED", "forbidden_s16_field"]);
});

await test("S17 wrapTickResult truncates reason_codes to sixteen preserving order", () => {
  const reason_codes = ["R00","R01","R02","R03","R04","R05","R06","R07","R08","R09","R10","R11","R12","R13","R14","R15","R16","R17","R18","R19"];
  const result = wrapTickResult({
    ok: false,
    request_id: "S17_REQ",
    classification: "SERVICE_ERROR",
    reason_codes,
  });
  assert.equal(result.reason_codes.length, 16);
  assert.deepEqual(result.reason_codes, ["R00","R01","R02","R03","R04","R05","R06","R07","R08","R09","R10","R11","R12","R13","R14","R15"]);
  assert.equal(reason_codes.length, 20);
});

const LAW_NOW = "2026-09-08T01:00:00.000Z";
const LAW_NOW_DATE = new Date(LAW_NOW);
const STALE_CLAIMED_AT = new Date(LAW_NOW_DATE.getTime() - CLAIM_STALE_AFTER_MS - 60_000).toISOString();
const FRESH_CLAIMED_AT = new Date(LAW_NOW_DATE.getTime() - 60_000).toISOString();
const BRIDGE_SHA = "1".repeat(40);
const CANONICAL_RECEIPTS = resolve(CANONICAL_REPO_PATH_TEST(), "reports/runtime/dev-queue/always-on/receipts.json");

function admissibleEntry(id, source = `${id}.md`) {
  return {
    ok: true,
    source,
    item: {
      id,
      state: "READY_FOR_PLANNING",
      human_gate_required_if: [],
      risk_hint: "low",
      execution: { target: "cursor" },
      planner: { preferred: "qwen" },
      created_at: "2026-09-01T00:00:00Z",
      created_by: "gpt-web",
    },
  };
}

function selectorBlocks(id, receipts) {
  const d = selectNextQueueItem([admissibleEntry(id)], receipts, LAW_NOW);
  return d.selected === null && d.excluded.some((e) => e.reason === "CLAIM_ALREADY_EXISTS");
}

function selectorAllows(id, receipts) {
  const d = selectNextQueueItem([admissibleEntry(id)], receipts, LAW_NOW);
  return d.selected && d.selected.task_ref === `LOCAL_DEV_B_${id}`;
}

function backlogMarkdown(id) {
  return [
    "```yaml",
    "schema: backlog-item-v1",
    `id: ${id}`,
    "title: Receipt lifecycle fixture",
    "created_at: 2026-09-08T00:00:00Z",
    "created_by: gpt-web",
    "repository: mrhz1973/control-plane",
    "branch_target: main",
    "objective: Modify the local-dev dispatcher receipt lifecycle helper.",
    "scope:",
    "  allowed_areas:",
    "    - tools/serve-local-dev-autonomous-dispatcher-v1.mjs",
    "  forbidden_areas: []",
    "risk_hint: low",
    "planner:",
    "  preferred: qwen",
    "  fallback: []",
    "  fallback_policy: gate_only",
    "execution:",
    "  target: cursor",
    "  loop_allowed: false",
    "acceptance:",
    "  - durable receipts",
    "human_gate_required_if: []",
    "state: READY_FOR_PLANNING",
    "```",
  ].join("\n");
}

function bridgeClaim(id, existingReceipts) {
  return buildLocalDevEnvelopeFromBacklog({
    markdown: backlogMarkdown(id),
    repo: "mrhz1973/control-plane",
    commit: BRIDGE_SHA,
    path: `reports/runtime/dev-queue/always-on/${id}.md`,
    dispatchBaseHead: BRIDGE_SHA,
    now: LAW_NOW_DATE,
    existingReceipts,
  });
}

function snapshotCanonicalReceipts() {
  return existsSync(CANONICAL_RECEIPTS) ? readFileSync(CANONICAL_RECEIPTS, "utf8") : null;
}

function claimForTick(taskRef, extraReceipt = {}, profileId = "qwen38-opus-q3-opencode-64k") {
  return {
    ok: true,
    claims: [{
      task_ref: taskRef,
      source_file: "x.md",
      envelope: { task_ref: taskRef, profile_id: profileId },
      receipt: {
        task_ref: taskRef,
        source_ref: `github:mrhz1973/control-plane@${BRIDGE_SHA}:x.md`,
        claimed_at: LAW_NOW,
        bridge_version: "local-dev-backlog-bridge-v1",
        ...extraReceipt,
      },
    }],
    skipped: [],
  };
}

function readyEnsureStub(profileSeen) {
  return async ({ profile }) => {
    if (profileSeen) profileSeen.push(profile);
    return { ready: true, status: "READY", reason_code: "READY", profile, launch_count: 0 };
  };
}

function latestFor(taskRef, snapshots) {
  const last = snapshots[snapshots.length - 1] || [];
  const matching = last.filter((r) => r && r.task_ref === taskRef);
  return matching[matching.length - 1] || null;
}

await test("S18 receipt law: legacy/unknown/PASS/EXECUTING/fresh CLAIMED block; replayable STOP and stale CLAIMED replay", () => {
  assert.equal(CLAIM_STALE_AFTER_MS, 30 * 60 * 1000);
  const id = "D-9402-S18";
  const taskRef = `LOCAL_DEV_B_${id}`;
  const now = LAW_NOW_DATE;

  const legacy = { task_ref: taskRef, source_ref: "s", claimed_at: STALE_CLAIMED_AT };
  assert.equal(isReceiptBlocking(legacy, now, CLAIM_STALE_AFTER_MS), true);
  assert.equal(selectorBlocks(id, [legacy]), true);
  assert.equal(bridgeClaim(id, [legacy]).reason_codes.includes("CLAIM_ALREADY_EXISTS"), true);

  const freshClaimed = {
    task_ref: taskRef, state: "CLAIMED", execution_started: false, replayable: true, claimed_at: FRESH_CLAIMED_AT,
  };
  assert.equal(isReceiptBlocking(freshClaimed, now, CLAIM_STALE_AFTER_MS), true);
  assert.equal(selectorBlocks(id, [freshClaimed]), true);
  assert.equal(bridgeClaim(id, [freshClaimed]).reason_codes.includes("CLAIM_ALREADY_EXISTS"), true);

  const staleClaimed = {
    task_ref: taskRef, state: "CLAIMED", execution_started: false, replayable: true, claimed_at: STALE_CLAIMED_AT,
  };
  assert.equal(isReceiptBlocking(staleClaimed, now, CLAIM_STALE_AFTER_MS), false);
  assert.equal(selectorAllows(id, [staleClaimed]), true);
  const staleBridge = bridgeClaim(id, [staleClaimed]);
  assert.equal(staleBridge.ok, true);
  assert.equal(staleBridge.receipt.state, "CLAIMED");
  assert.equal(staleBridge.receipt.execution_started, false);
  assert.equal(staleBridge.receipt.replayable, true);

  for (const execution_started of [true, "yes", undefined]) {
    const blockedStale = {
      task_ref: taskRef, state: "CLAIMED", execution_started, replayable: true, claimed_at: STALE_CLAIMED_AT,
    };
    assert.equal(isReceiptBlocking(blockedStale, now, CLAIM_STALE_AFTER_MS), true, `claimed exec=${execution_started}`);
    assert.equal(selectorBlocks(id, [blockedStale]), true);
  }

  const executing = { task_ref: taskRef, state: "EXECUTING", execution_started: true, replayable: false, claimed_at: STALE_CLAIMED_AT };
  const pass = { task_ref: taskRef, state: "PASS", execution_started: true, replayable: false, claimed_at: STALE_CLAIMED_AT };
  const unknown = { task_ref: taskRef, state: "WEIRD", execution_started: false, replayable: true, claimed_at: STALE_CLAIMED_AT };
  const stopTerminal = { task_ref: taskRef, state: "STOP", execution_started: true, replayable: false, claimed_at: STALE_CLAIMED_AT };
  for (const r of [executing, pass, unknown, stopTerminal]) {
    assert.equal(isReceiptBlocking(r, now, CLAIM_STALE_AFTER_MS), true, r.state);
    assert.equal(selectorBlocks(id, [r]), true, r.state);
    assert.equal(bridgeClaim(id, [r]).ok, false, r.state);
  }

  const stopReplay = { task_ref: taskRef, state: "STOP", execution_started: false, replayable: true, claimed_at: FRESH_CLAIMED_AT };
  assert.equal(isReceiptBlocking(stopReplay, now, CLAIM_STALE_AFTER_MS), false);
  assert.equal(selectorAllows(id, [stopReplay]), true);
  assert.equal(bridgeClaim(id, [stopReplay]).ok, true);

  const freshOk = bridgeClaim("D-9402-NEW", []);
  assert.equal(freshOk.ok, true);
  assert.equal(freshOk.receipt.state, "CLAIMED");
  assert.equal(freshOk.receipt.execution_started, false);
  assert.equal(freshOk.receipt.replayable, true);
});

await test("S19 dispatcher persists CLAIMED→admission STOP / EXECUTING-before-executor / terminal PASS|STOP|throw; history kept", async () => {
  const before = snapshotCanonicalReceipts();
  const historical = { task_ref: "LOCAL_DEV_B_UNRELATED", state: "PASS", execution_started: true, replayable: false, claimed_at: STALE_CLAIMED_AT };

  async function tickWithPersist(taskRef, { admit, executor, historicalReceipts = [historical] }) {
    const snapshots = [];
    let executorEntered = false;
    const result = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: `r-${taskRef}`, source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        scanQueue: () => [{ markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
        runDispatchLoop: () => claimForTick(taskRef),
        loadReceipts: () => historicalReceipts.map((r) => ({ ...r })),
        persistReceipts: (list) => { snapshots.push(list.map((r) => ({ ...r }))); },
        ensureDevQwenReady: readyEnsureStub(),
        admitMicroTaskDelta: admit,
        runExecutor: async (envelope) => {
          executorEntered = true;
          const current = latestFor(taskRef, snapshots);
          assert.equal(current.state, "EXECUTING");
          assert.equal(current.execution_started, true);
          assert.equal(current.replayable, false);
          return executor(envelope);
        },
      },
    );
    return { result, snapshots, executorEntered };
  }

  const admitReject = await tickWithPersist("LOCAL_DEV_B_D-9402-ADM", {
    admit: () => ({ admitted: false, reason_codes: ["MICRO_TASK_KIND_UNSUPPORTED"] }),
    executor: async () => { throw new Error("MUST NOT EXECUTE ON ADMISSION REJECT"); },
  });
  assert.equal(admitReject.result.classification, "HUMAN_GATE_REQUIRED");
  assert.equal(admitReject.result.execution_performed, false);
  assert.equal(admitReject.executorEntered, false);
  const admitLatest = latestFor("LOCAL_DEV_B_D-9402-ADM", admitReject.snapshots);
  assert.equal(admitLatest.state, "STOP");
  assert.equal(admitLatest.execution_started, false);
  assert.equal(admitLatest.replayable, true);
  assert.ok(admitReject.snapshots[admitReject.snapshots.length - 1].some((r) => r.task_ref === "LOCAL_DEV_B_UNRELATED"));

  const passRun = await tickWithPersist("LOCAL_DEV_B_D-9402-PASS", {
    admit: () => ({ admitted: true }),
    executor: async (envelope) => ({ status: "PASS", classification: "PASS", task_ref: envelope.task_ref, reason_codes: ["PASS"] }),
  });
  assert.equal(passRun.result.classification, "WORK_EXECUTED_PASS");
  assert.equal(passRun.executorEntered, true);
  assert.equal(passRun.snapshots[0].find((r) => r.task_ref === "LOCAL_DEV_B_D-9402-PASS").state, "CLAIMED");
  assert.equal(passRun.snapshots[1].find((r) => r.task_ref === "LOCAL_DEV_B_D-9402-PASS").state, "EXECUTING");
  const passLatest = latestFor("LOCAL_DEV_B_D-9402-PASS", passRun.snapshots);
  assert.equal(passLatest.state, "PASS");
  assert.equal(passLatest.execution_started, true);
  assert.equal(passLatest.replayable, false);
  assert.equal(passRun.snapshots[passRun.snapshots.length - 1].filter((r) => r.task_ref === "LOCAL_DEV_B_UNRELATED").length, 1);

  const stopRun = await tickWithPersist("LOCAL_DEV_B_D-9402-STOP", {
    admit: () => ({ admitted: true }),
    executor: async () => ({ status: "STOP", classification: "STOP:TEST_FAILED", task_ref: "LOCAL_DEV_B_D-9402-STOP", reason_codes: ["TEST_FAILED"] }),
  });
  const stopLatest = latestFor("LOCAL_DEV_B_D-9402-STOP", stopRun.snapshots);
  assert.equal(stopRun.result.classification, "WORK_EXECUTED_STOP");
  assert.equal(stopLatest.state, "STOP");
  assert.equal(stopLatest.execution_started, true);
  assert.equal(stopLatest.replayable, false);

  const throwRun = await tickWithPersist("LOCAL_DEV_B_D-9402-THROW", {
    admit: () => ({ admitted: true }),
    executor: async () => { throw new Error("boom-executor"); },
  });
  const throwLatest = latestFor("LOCAL_DEV_B_D-9402-THROW", throwRun.snapshots);
  assert.equal(throwRun.result.classification, "WORK_EXECUTED_STOP");
  assert.equal(throwLatest.state, "STOP");
  assert.equal(throwLatest.execution_started, true);
  assert.equal(throwLatest.replayable, false);

  assert.equal(snapshotCanonicalReceipts(), before, "canonical receipts unchanged by injected persistReceipts");
});

await test("S20 atomic receipts persist fail-closed; no replayable ambiguity after blocking state", async () => {
  const before = snapshotCanonicalReceipts();
  const dir = mkdtempSync(join(tmpdir(), "local-dev-receipts-"));
  const receiptsFile = join(dir, "receipts.json");
  persistReceiptsAtomic(receiptsFile, [{ task_ref: "KEEP", state: "PASS", execution_started: true, replayable: false }]);
  const parsed = JSON.parse(readFileSync(receiptsFile, "utf8"));
  assert.equal(parsed[0].task_ref, "KEEP");

  const blocker = join(dir, "not-a-dir");
  writeFileSync(blocker, "x");
  let threw = false;
  try {
    persistReceiptsAtomic(join(blocker, "receipts.json"), [{ task_ref: "X" }]);
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
  assert.equal(JSON.parse(readFileSync(receiptsFile, "utf8"))[0].task_ref, "KEEP");

  const snaps = [];
  let executorCalls = 0;
  const failAfterClaimed = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r-atomic", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
      scanQueue: () => [{ markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
      runDispatchLoop: () => claimForTick("LOCAL_DEV_B_D-9402-ATOM"),
      loadReceipts: () => [],
      persistReceipts: (list) => {
        snaps.push(list.map((r) => ({ ...r })));
        if (snaps.length >= 2) {
          const err = new Error("ATOMIC_FAIL");
          err.code = "ATOMIC_FAIL";
          throw err;
        }
      },
      ensureDevQwenReady: readyEnsureStub(),
      admitMicroTaskDelta: () => ({ admitted: true }),
      runExecutor: async () => { executorCalls += 1; return { status: "PASS", classification: "PASS", task_ref: "LOCAL_DEV_B_D-9402-ATOM" }; },
    },
  );
  assert.equal(failAfterClaimed.classification, "SERVICE_ERROR");
  assert.ok(failAfterClaimed.reason_codes.includes("PERSIST_FAILED"));
  assert.equal(executorCalls, 0, "executor must not run if EXECUTING persist fails");
  assert.equal(snaps[0].find((r) => r.task_ref === "LOCAL_DEV_B_D-9402-ATOM").state, "CLAIMED");
  assert.equal(snapshotCanonicalReceipts(), before);

  try { unlinkSync(blocker); } catch { /* ignore */ }
});

await test("S21 Qwen readiness preflight before claim: exact profile_id, fail unconsumed, success keeps lifecycle", async () => {
  const before = snapshotCanonicalReceipts();
  const profileId = "qwen38-opus-q3-opencode-64k";
  const taskRef = "LOCAL_DEV_B_D-9402-PRE";

  const profilesSeen = [];
  let persistCalls = 0;
  let admitCalls = 0;
  let execCalls = 0;
  const failResult = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r-pre-fail", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
      scanQueue: () => [{ markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
      runDispatchLoop: () => claimForTick(taskRef, {}, profileId),
      loadReceipts: () => [],
      persistReceipts: () => { persistCalls += 1; },
      ensureDevQwenReady: async ({ profile }) => {
        profilesSeen.push(profile);
        return { ready: false, status: "PROFILE_NOT_EXPOSED", reason_code: "PROFILE_NOT_EXPOSED", launch_count: 0 };
      },
      admitMicroTaskDelta: () => { admitCalls += 1; return { admitted: true }; },
      runExecutor: async () => { execCalls += 1; return { status: "PASS", classification: "PASS", task_ref: taskRef }; },
    },
  );
  assert.deepEqual(profilesSeen, [profileId]);
  assert.equal(failResult.classification, "HUMAN_GATE_REQUIRED");
  assert.equal(failResult.execution_performed, false);
  assert.equal(failResult.task_ref, taskRef);
  assert.ok(failResult.reason_codes.includes("QWEN_SESSION_NOT_READY"));
  assert.ok(failResult.reason_codes.includes("PROFILE_NOT_EXPOSED"));
  assert.equal(persistCalls, 0, "no receipt persistence on readiness failure");
  assert.equal(admitCalls, 0, "admission never invoked on readiness failure");
  assert.equal(execCalls, 0, "executor never invoked on readiness failure");
  assert.equal(shouldPersistRuntimeArtifacts({ ensureDevQwenReady: async () => ({}) }), false);

  const snaps = [];
  let readinessBeforeClaimed = false;
  const okResult = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r-pre-ok", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
      scanQueue: () => [{ markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
      runDispatchLoop: () => claimForTick(taskRef, {}, profileId),
      loadReceipts: () => [],
      persistReceipts: (list) => {
        if (snaps.length === 0) readinessBeforeClaimed = true;
        snaps.push(list.map((r) => ({ ...r })));
      },
      ensureDevQwenReady: async ({ profile }) => {
        assert.equal(profile, profileId);
        assert.equal(snaps.length, 0, "readiness must run before CLAIMED persistence");
        return { ready: true, status: "READY", reason_code: "READY", launch_count: 0 };
      },
      admitMicroTaskDelta: () => ({ admitted: true }),
      runExecutor: async (envelope) => {
        assert.equal(latestFor(taskRef, snaps).state, "EXECUTING");
        return { status: "PASS", classification: "PASS", task_ref: envelope.task_ref, reason_codes: ["PASS"] };
      },
    },
  );
  assert.equal(okResult.classification, "WORK_EXECUTED_PASS");
  assert.equal(readinessBeforeClaimed, true);
  assert.equal(snaps[0].find((r) => r.task_ref === taskRef).state, "CLAIMED");
  assert.equal(snaps[1].find((r) => r.task_ref === taskRef).state, "EXECUTING");
  assert.equal(latestFor(taskRef, snaps).state, "PASS");
  assert.equal(snapshotCanonicalReceipts(), before);
});

await test("S22 status tracker IDLE + GET /v1/status schema; zero side effects; POST status 405", async () => {
  const tracker = createExecutionStatusTracker();
  const idle = tracker.snapshot();
  assert.equal(idle.schema_version, STATUS_SCHEMA);
  assert.equal(idle.active, false);
  assert.equal(idle.terminal, false);
  assert.equal(idle.phase, "IDLE");

  let verify = 0, scan = 0, ready = 0, exec = 0;
  const res = mockRes();
  await handleTickRequest(mockReq("GET", STATUS_PATH), res, {
    statusTracker: tracker,
    tickDeps: {
      verifyRepo: async () => { verify += 1; return { ok: true, head: BRIDGE_SHA }; },
      scanQueue: () => { scan += 1; return []; },
      ensureDevQwenReady: async () => { ready += 1; return { ready: true }; },
      runExecutor: async () => { exec += 1; return { status: "PASS", classification: "PASS" }; },
    },
  });
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.schema_version, STATUS_SCHEMA);
  assert.equal(body.phase, "IDLE");
  assert.equal(verify + scan + ready + exec, 0);

  const postRes = mockRes();
  await handleTickRequest(mockReq("POST", STATUS_PATH, "{}"), postRes, { statusTracker: tracker });
  assert.equal(postRes.status, 405);
});

await test("S23 concurrent GET status during slow tick; BUSY preserved; terminal PASS/STOP classifications", async () => {
  const tracker = createExecutionStatusTracker();
  let releaseExec = null;
  let locked = false;
  const tryAcquire = () => { if (locked) return false; locked = true; return true; };
  const release = () => { locked = false; };
  const profileId = "qwen38-opus-q3-opencode-64k";
  const taskRef = "LOCAL_DEV_B_D-76B-A";

  const tickDeps = {
    statusTracker: tracker,
    verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
    scanQueue: () => [{ markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
    runDispatchLoop: () => claimForTick(taskRef, {}, profileId),
    loadReceipts: () => [],
    persistReceipts: () => {},
    ensureDevQwenReady: readyEnsureStub(),
    admitMicroTaskDelta: () => ({ admitted: true }),
    runExecutor: async (_envelope, opts) => {
      opts?.onStatus?.({ phase: "OPENCODE", last_event: "opencode_start" });
      opts?.onStatus?.({ phase: "TESTS", tests_state: "RUNNING", last_event: "tests_start" });
      await new Promise((r) => { releaseExec = () => r(); });
      opts?.onStatus?.({ phase: "TESTS", tests_state: "PASS", last_event: "tests_done" });
      return { status: "PASS", classification: "PASS", task_ref: taskRef, reason_codes: ["PASS"] };
    },
  };

  const firstRes = mockRes();
  const first = handleTickRequest(
    mockReq("POST", TICK_PATH, JSON.stringify({ schema_version: REQUEST_SCHEMA, request_id: "r-status-1", source: "n8n" })),
    firstRes,
    { tryAcquireLock: tryAcquire, releaseLock: release, statusTracker: tracker, tickDeps },
  );
  await new Promise((r) => setTimeout(r, 20));
  const mid = tracker.snapshot();
  assert.equal(mid.active, true);
  assert.equal(mid.task_ref, taskRef);
  assert.equal(mid.qwen_profile, profileId);
  assert.ok(["EXECUTING", "OPENCODE", "TESTS"].includes(mid.phase), mid.phase);

  const statusRes = mockRes();
  await handleTickRequest(mockReq("GET", STATUS_PATH), statusRes, { statusTracker: tracker });
  assert.equal(statusRes.status, 200);
  assert.equal(JSON.parse(statusRes.body).active, true);

  const busyRes = mockRes();
  await handleTickRequest(
    mockReq("POST", TICK_PATH, JSON.stringify({ schema_version: REQUEST_SCHEMA, request_id: "r-status-2", source: "n8n" })),
    busyRes,
    { tryAcquireLock: tryAcquire, releaseLock: release, statusTracker: tracker, tickDeps },
  );
  assert.equal(JSON.parse(busyRes.body).classification, "BUSY");
  assert.equal(tracker.snapshot().request_id, "r-status-1");

  releaseExec();
  await first;
  const term = tracker.snapshot();
  assert.equal(term.active, false);
  assert.equal(term.terminal, true);
  assert.equal(term.phase, "TERMINAL");
  assert.equal(term.classification, "PASS");
  const serialized = JSON.stringify(term);
  assert.ok(!serialized.includes("task_delta"));
  assert.ok(!serialized.includes("stdout"));
  assert.ok(!serialized.includes("stderr"));
  assert.ok(!serialized.includes("Authorization"));
  assert.ok(term.request_id.length <= 200);
  assert.ok(term.phase.length <= 80);
  assert.ok(Array.isArray(term.files_touched) && term.files_touched.length <= 16);

  // Specific STOP classification preserved
  const tracker2 = createExecutionStatusTracker();
  await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r-ctx", source: "n8n" },
    {
      statusTracker: tracker2,
      verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
      scanQueue: () => [{ markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
      runDispatchLoop: () => claimForTick("LOCAL_DEV_B_D-76B-CTX", {}, profileId),
      loadReceipts: () => [],
      persistReceipts: () => {},
      ensureDevQwenReady: readyEnsureStub(),
      admitMicroTaskDelta: () => ({ admitted: true }),
      runExecutor: async () => ({
        status: "STOP",
        classification: "STOP:CONTEXT_WINDOW_EXCEEDED",
        task_ref: "LOCAL_DEV_B_D-76B-CTX",
        reason_codes: ["CONTEXT_WINDOW_EXCEEDED"],
      }),
    },
  );
  assert.equal(tracker2.snapshot().classification, "STOP:CONTEXT_WINDOW_EXCEEDED");
});

await test("S24 status tracker exceptions cannot break tick", async () => {
  const boom = () => { throw new Error("status boom"); };
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r-boom", source: "n8n" },
    {
      statusTracker: {
        start: boom,
        update: boom,
        finish: boom,
        snapshot: boom,
      },
      verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
      scanQueue: () => [{ markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
      runDispatchLoop: () => claimForTick("LOCAL_DEV_B_D-76B-BOOM"),
      loadReceipts: () => [],
      persistReceipts: () => {},
      ensureDevQwenReady: readyEnsureStub(),
      admitMicroTaskDelta: () => ({ admitted: true }),
      runExecutor: async () => ({ status: "PASS", classification: "PASS", task_ref: "LOCAL_DEV_B_D-76B-BOOM" }),
    },
  );
  assert.equal(result.classification, "WORK_EXECUTED_PASS");
});

await test("S25 GET /dashboard and / serve HTML; POST dashboard 405; no tick side effects", async () => {
  let verify = 0;
  const html = "<!DOCTYPE html><title>dash</title><body>ok</body>";
  for (const path of DASHBOARD_PATHS) {
    const res = mockRes();
    await handleTickRequest(mockReq("GET", path), res, {
      dashboardHtml: html,
      tickDeps: {
        verifyRepo: async () => { verify += 1; return { ok: true, head: BRIDGE_SHA }; },
      },
    });
    assert.equal(res.status, 200, path);
    assert.ok(String(res.body).includes("ok"), path);
  }
  const postRes = mockRes();
  await handleTickRequest(mockReq("POST", "/dashboard", "{}"), postRes, { dashboardHtml: html });
  assert.equal(postRes.status, 405);
  assert.equal(verify, 0);
});

await test("S26 GET /v1/diagnostics schema + IDLE explanation; read-only; POST 405", async () => {
  const tracker = createExecutionStatusTracker();
  const lastTick = createLastTickStore();
  lastTick.record({
    ok: true,
    request_id: "r-diag-1",
    classification: "IDLE_CLEAN",
    execution_performed: false,
    reason_codes: ["NO_ELIGIBLE_READY"],
  }, { elapsed_ms: 12, recorded_at: "2026-09-09T00:00:00.000Z" });
  tracker.finish({
    request_id: "r-diag-1",
    classification: "IDLE_CLEAN",
    last_event: "terminal:IDLE_CLEAN",
  });

  let probeCalls = 0;
  const res = mockRes();
  await handleTickRequest(mockReq("GET", DIAGNOSTICS_PATH), res, {
    statusTracker: tracker,
    lastTickStore: lastTick,
    diagnosticsScanQueue: () => [],
    diagnosticsLoadReceipts: () => [],
    probeQwen: async () => {
      probeCalls += 1;
      return { reachable: false, health_summary: "unreachable", profile_status: "unreachable", models: [], error: "timeout" };
    },
  });
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.schema_version, DIAGNOSTICS_SCHEMA);
  assert.equal(body.read_only, true);
  assert.equal(body.last_tick.classification, "IDLE_CLEAN");
  assert.ok(body.last_tick.reason_codes.includes("NO_ELIGIBLE_READY"));
  assert.equal(body.queue.eligible_count, 0);
  assert.equal(body.explanation.why_code, "NO_ELIGIBLE_READY");
  assert.match(body.explanation.headline, /coda|task|eseguibil|attesa/i);
  assert.equal(probeCalls, 1);

  const postRes = mockRes();
  await handleTickRequest(mockReq("POST", DIAGNOSTICS_PATH, "{}"), postRes, { statusTracker: tracker, lastTickStore: lastTick });
  assert.equal(postRes.status, 405);
});

await test("S27 diagnostics shows candidate + claim-blocked exclusion without mutating", async () => {
  const readyMd = `\`\`\`yaml
id: D-9009-UI
state: READY_FOR_PLANNING
created_at: "2026-09-09T00:00:00Z"
created_by: gpt-web
risk_hint: low
human_gate_required_if: []
execution:
  target: cursor
planner:
  preferred: qwen
objective: "ui test"
allowed_areas: ["docs/"]
\`\`\``;
  const queue = buildQueueScanDiagnostics({
    entries: [{ markdown: readyMd, source: "READY_DUI1.md", backlog_path: "q/READY_DUI1.md" }],
    receipts: [{
      task_ref: "LOCAL_DEV_B_D-9009-UI",
      state: "PASS",
      execution_started: true,
      replayable: false,
      claimed_at: "2026-09-09T00:00:00.000Z",
    }],
    nowIso: "2026-09-09T01:00:00.000Z",
  });
  assert.equal(queue.eligible_count, 0);
  assert.equal(queue.claim_present_count, 1);
  assert.equal(queue.candidate_task_ref, null);
  assert.ok(queue.skip_reason_summary.CLAIM_ALREADY_EXISTS >= 1);

  const open = buildQueueScanDiagnostics({
    entries: [{ markdown: readyMd, source: "READY_DUI1.md", backlog_path: "q/READY_DUI1.md" }],
    receipts: [],
    nowIso: "2026-09-09T01:00:00.000Z",
  });
  assert.equal(open.eligible_count, 1);
  assert.equal(open.candidate_task_ref, "LOCAL_DEV_B_D-9009-UI");
  assert.equal(open.candidate_source_file, "READY_DUI1.md");

  const expl = buildOperatorExplanation({
    status: { active: false, classification: "HUMAN_GATE_REQUIRED", phase: "TERMINAL" },
    last_tick: {
      classification: "HUMAN_GATE_REQUIRED",
      human_gate_required: true,
      gate_summary: "QWEN_SESSION_NOT_READY",
      reason_codes: ["QWEN_SESSION_NOT_READY", "ENDPOINT_OCCUPIED_UNHEALTHY"],
    },
    queue: open,
  });
  assert.equal(expl.blocked_at, "qwen_preflight");
  assert.match(expl.headline, /intervento umano/i);
});

await test("S28 performTick records lastTickStore; GET diagnostics exposes it", async () => {
  const tracker = createExecutionStatusTracker();
  const lastTick = createLastTickStore();
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "r-last-tick", source: "n8n" },
    {
      statusTracker: tracker,
      lastTickStore: lastTick,
      verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
      scanQueue: () => [],
      runDispatchLoop: () => ({ ok: true, claims: [], skipped: [], stop_reason: "QUEUE_DRAINED" }),
      runExecutor: async () => { throw new Error("MUST NOT EXECUTE"); },
      nowIso: () => "2026-09-09T02:00:00.000Z",
    },
  );
  assert.equal(result.classification, "IDLE_CLEAN");
  assert.equal(lastTick.snapshot().classification, "IDLE_CLEAN");
  assert.ok(lastTick.snapshot().reason_codes.includes("NO_ELIGIBLE_READY"));

  const diag = await buildDiagnostics({
    statusTracker: tracker,
    lastTickStore: lastTick,
    scanQueue: () => [],
    loadReceipts: () => [],
    probeQwen: async () => ({ reachable: true, health_summary: "1_models", profile_status: "loaded", models: [{ id: "qwen38-opus-q3-opencode-64k", status: "loaded" }], error: null }),
    nowIso: () => "2026-09-09T02:00:01.000Z",
  });
  assert.equal(diag.schema_version, DIAGNOSTICS_SCHEMA);
  assert.equal(diag.last_tick.request_id, "r-last-tick");
  assert.equal(diag.qwen.reachable, true);
});

function diagnosticsEntry(id, extraItem = {}) {
  const markdown = backlogMarkdown(id);
  return {
    ...parseBacklogFile(markdown),
    markdown,
    source: "READY_" + id + ".md",
    backlog_path: "q/READY_" + id + ".md",
    item: { ...parseBacklogFile(markdown).item, ...extraItem },
  };
}

function freezeTree(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeTree);
    Object.freeze(value);
  }
  return value;
}

await test("S29 queue receipt explanations follow canonical lifecycle and exact stale boundary, without mutation", () => {
  const entry = diagnosticsEntry("D-9402-OBS");
  const task_ref = "LOCAL_DEV_B_D-9402-OBS";
  const cases = [
    ["legacy", {}],
    ["null state", { state: null }],
    ["unknown state", { state: "UNRECOGNIZED" }],
    ["whitespace is not a canonical state", { state: " STOP ", execution_started: false, replayable: true }],
    ["numeric state is not canonical", { state: 17, execution_started: false, replayable: true }],
    ["executing", { state: "EXECUTING", execution_started: true, replayable: false }],
    ["pass", { state: "PASS", execution_started: true, replayable: false }],
    ["terminal stop", { state: "STOP", execution_started: true, replayable: false }],
    ["pre-execution stop", { state: "STOP", execution_started: false, replayable: true }],
    ["ambiguous stop", { state: "STOP", replayable: true }],
    ["fresh claimed", { state: "CLAIMED", execution_started: false, replayable: true, claimed_at: FRESH_CLAIMED_AT }],
    ["stale claimed", { state: "CLAIMED", execution_started: false, replayable: true, claimed_at: STALE_CLAIMED_AT }],
    ["exact stale boundary", { state: "CLAIMED", execution_started: false, replayable: true, claimed_at: new Date(LAW_NOW_DATE.getTime() - CLAIM_STALE_AFTER_MS).toISOString() }],
    ["before stale boundary", { state: "CLAIMED", execution_started: false, replayable: true, claimed_at: new Date(LAW_NOW_DATE.getTime() - CLAIM_STALE_AFTER_MS + 1).toISOString() }],
    ["stale but executed", { state: "CLAIMED", execution_started: true, replayable: true, claimed_at: STALE_CLAIMED_AT }],
    ["stale without replay permission", { state: "CLAIMED", execution_started: false, claimed_at: STALE_CLAIMED_AT }],
    ["invalid timestamp", { state: "CLAIMED", execution_started: false, replayable: true, claimed_at: "invalid" }],
    ["future timestamp", { state: "CLAIMED", execution_started: false, replayable: true, claimed_at: "2099-01-01T00:00:00Z" }],
    ["object flags fail closed", { state: "CLAIMED", execution_started: {}, replayable: {}, claimed_at: STALE_CLAIMED_AT }],
  ];
  for (const [name, fields] of cases) {
    const receipts = freezeTree([{ task_ref, claimed_at: STALE_CLAIMED_AT, ...fields }]);
    const entries = freezeTree([entry]);
    const before = JSON.stringify({ entries, receipts });
    const canonical = selectNextQueueItem(entries, receipts, LAW_NOW);
    const blocking = isReceiptBlocking(receipts[0], LAW_NOW_DATE, CLAIM_STALE_AFTER_MS);
    const queue = buildQueueScanDiagnostics({ entries, receipts, nowIso: LAW_NOW });
    assert.equal(queue.eligible_count, canonical.eligible_count, name);
    assert.equal(queue.candidate_task_ref, canonical.selected?.task_ref || null, name);
    const item = queue.items.find((candidate) => candidate.task_ref === task_ref);
    assert.ok(item, name + ": READY item must be explained");
    assert.equal(item.admissible, true, name);
    assert.equal(item.currently_blocking, blocking, name);
    assert.equal(item.eligible, !blocking, name);
    assert.equal(item.matching_receipt_present, true, name);
    assert.equal(item.matching_receipt_count, 1, name);
    assert.equal(item.blocking_reason, blocking ? "CLAIM_ALREADY_EXISTS" : null, name);
    assert.equal(item.latest_receipt.currently_blocking, blocking, name);
    assert.equal(item.latest_receipt.state, typeof fields.state === "string" ? fields.state : null, name);
    assert.equal(typeof item.latest_receipt.interpretation, "string", name);
    assert.ok(item.latest_receipt.interpretation.length > 12, name);
    if (fields.claimed_at === "invalid") assert.equal(item.latest_receipt.age_ms, null);
    assert.equal(JSON.stringify({ entries, receipts }), before, name + ": no mutation");
  }
  const open = buildQueueScanDiagnostics({ entries: [entry], receipts: [], nowIso: LAW_NOW }).items[0];
  assert.equal(open.matching_receipt_present, false);
  assert.equal(open.latest_receipt, null);
  assert.equal(open.currently_blocking, false);
  assert.equal(open.eligible, true);
});

await test("S30 historical blocking receipts remain visible even when latest receipt permits replay", () => {
  const entry = diagnosticsEntry("D-9402-HISTORY");
  const receipts = freezeTree([
    { task_ref: "LOCAL_DEV_B_D-9402-HISTORY", state: "PASS", execution_started: true, replayable: false, claimed_at: STALE_CLAIMED_AT },
    { task_ref: "UNRELATED", state: "PASS", execution_started: true, replayable: false },
    { task_ref: "LOCAL_DEV_B_D-9402-HISTORY", state: "STOP", execution_started: false, replayable: true, claimed_at: FRESH_CLAIMED_AT },
  ]);
  const canonical = selectNextQueueItem([entry], receipts, LAW_NOW);
  const queue = buildQueueScanDiagnostics({ entries: [entry], receipts, nowIso: LAW_NOW });
  assert.equal(queue.eligible_count, canonical.eligible_count);
  assert.equal(queue.eligible_count, 0);
  assert.equal(queue.items[0].matching_receipt_count, 2);
  assert.equal(queue.items[0].latest_receipt.state, "STOP");
  assert.equal(queue.items[0].latest_receipt.currently_blocking, false);
  assert.equal(queue.items[0].currently_blocking, true);
  assert.ok(queue.items[0].blocking_receipts.some((receipt) => receipt.state === "PASS"));
  assert.equal(queue.items[0].blocking_reason, "CLAIM_ALREADY_EXISTS");
});

await test("S31 queue counts are complete beyond disclosure caps and inadmissible READY preserves selector decision", () => {
  const entries = Array.from({ length: 140 }, (_, i) => diagnosticsEntry("D-9402-C" + i));
  const receipts = entries.map((entry) => ({
    task_ref: "LOCAL_DEV_B_" + entry.item.id,
    state: "PASS",
    execution_started: true,
    replayable: false,
    claimed_at: STALE_CLAIMED_AT,
  }));
  entries.push(diagnosticsEntry("D-9402-GATED", { human_gate_required_if: ["MANUAL"] }));
  const queue = buildQueueScanDiagnostics({ entries, receipts, nowIso: LAW_NOW });
  assert.equal(queue.eligible_count, 0);
  assert.equal(queue.scanned_file_count, 141);
  assert.equal(queue.claim_present_count, 140);
  assert.equal(queue.skip_reason_summary.CLAIM_ALREADY_EXISTS, 140);
  assert.equal(queue.skip_reason_summary.INADMISSIBLE_STATE_OR_SCOPE, 1);
  assert.equal(queue.rejected_count, 141);
  assert.ok(queue.items.length <= 128);
  assert.ok(queue.rejected_items.length <= 128);
  assert.equal(queue.items_truncated, true);
  assert.equal(queue.rejected_items_truncated, true);
  const gated = buildQueueScanDiagnostics({ entries: [entries.at(-1)], receipts: [], nowIso: LAW_NOW }).items[0];
  assert.equal(gated.admissible, false);
  assert.equal(gated.eligible, false);
  assert.equal(gated.currently_blocking, false);
});

await test("S32 repeated GET diagnostics preserves receipt bytes, status, last tick and all execution side-effect counters", async () => {
  const canonicalBefore = snapshotCanonicalReceipts();
  const dir = mkdtempSync(join(tmpdir(), "dispatcher-observe-"));
  const receiptsPath = join(dir, "receipts.json");
  const task_ref = "LOCAL_DEV_B_D-9402-READONLY";
  writeFileSync(receiptsPath, JSON.stringify([{ task_ref, state: "CLAIMED", execution_started: false, replayable: true, claimed_at: STALE_CLAIMED_AT }], null, 2) + "\n", "utf8");
  const before = { bytes: readFileSync(receiptsPath, "utf8"), mtime: statSync(receiptsPath).mtimeMs };
  const tracker = createExecutionStatusTracker();
  const lastTick = createLastTickStore();
  lastTick.record({ request_id: "preserved", classification: "IDLE_CLEAN", reason_codes: ["NO_ELIGIBLE_READY"] });
  const statusBefore = tracker.snapshot();
  const lastTickBefore = lastTick.snapshot();
  const effects = [];
  const forbidden = (name) => () => { effects.push(name); throw new Error("Unexpected mutation: " + name); };
  const deps = {
    statusTracker: tracker,
    lastTickStore: lastTick,
    receiptsPath,
    nowIso: () => LAW_NOW,
    diagnosticsScanQueue: () => [diagnosticsEntry("D-9402-READONLY")],
    probeQwen: async () => ({ reachable: true, models: [] }),
    tryAcquireLock: forbidden("lock"),
    releaseLock: forbidden("unlock"),
    tickDeps: {
      verifyRepo: forbidden("repo sync"),
      runDispatchLoop: forbidden("claim"),
      ensureDevQwenReady: forbidden("Qwen load"),
      runExecutor: forbidden("execution"),
      admitMicroTaskDelta: forbidden("admission"),
      persistReceipts: forbidden("receipt write"),
      scanQueue: forbidden("execution queue scan"),
    },
  };
  try {
    for (let i = 0; i < 3; i += 1) {
      const response = mockRes();
      await handleTickRequest(mockReq("GET", DIAGNOSTICS_PATH), response, deps);
      assert.equal(response.status, 200);
      const diag = JSON.parse(response.body);
      assert.equal(diag.read_only, true);
      assert.equal(diag.queue.eligible_count, 1, "stale receipt is explained as replayable without being released");
      assert.equal(diag.queue.items[0].latest_receipt.state, "CLAIMED");
    }
    assert.deepEqual(effects, []);
    assert.equal(readFileSync(receiptsPath, "utf8"), before.bytes);
    assert.equal(statSync(receiptsPath).mtimeMs, before.mtime);
    assert.deepEqual(tracker.snapshot(), statusBefore);
    assert.deepEqual(lastTick.snapshot(), lastTickBefore);
    assert.equal(snapshotCanonicalReceipts(), canonicalBefore);
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const response = mockRes();
      await handleTickRequest(mockReq(method, DIAGNOSTICS_PATH, "{}"), response, deps);
      assert.equal(response.status, 405);
    }
    const statusResponse = mockRes();
    await handleTickRequest(mockReq("GET", STATUS_PATH), statusResponse, deps);
    assert.deepEqual(JSON.parse(statusResponse.body), statusBefore, "/v1/status contract is unchanged");
    assert.deepEqual(effects, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("S33 Qwen actual nested model status is normalized and probing emits only GET /v1/models", async () => {
  const calls = [];
  const model = freezeTree({
    id: "qwen38-opus-q3-opencode-64k",
    status: { value: "loaded", args: ["--ctx-size", "65536"], pid: 4321, port: 8081 },
    meta: { n_ctx: 65536 },
  });
  const normalized = normalizeQwenModel(model);
  assert.equal(normalized.id, model.id);
  assert.equal(normalized.status, "loaded");
  assert.match(normalized.status_label, /caricato/i);
  assert.equal(normalized.context_tokens, 65536);
  assert.ok(normalized.context_source);
  assert.ok(!JSON.stringify(normalized).includes("[object Object]"));
  const probe = await probeQwenEndpointReadOnly({
    baseUrl: "http://127.0.0.1:8080",
    wanted_profile: model.id,
    fetchFn: async (url, options = {}) => {
      calls.push({ url, method: options.method || "GET" });
      return { ok: true, json: async () => ({ data: [model] }) };
    },
  });
  assert.deepEqual(calls, [{ url: "http://127.0.0.1:8080/v1/models", method: "GET" }]);
  assert.equal(probe.reachable, true);
  assert.equal(probe.profile_status, "loaded");
  assert.equal(probe.models[0].status, "loaded");
  const unknown = normalizeQwenModel({ id: "unknown", status: { strange: "payload" } });
  assert.equal(unknown.status, "unknown");
  assert.equal(unknown.status_label, "Sconosciuto");
  const absent = normalizeQwenModel({ id: "missing" });
  assert.equal(absent.status, null);
  assert.equal(absent.status_label, "Non disponibile");
  for (const invalid of [null, {}, [], 17, "malformed"]) {
    const safe = normalizeQwenModel(invalid);
    assert.ok(!JSON.stringify(safe).includes("[object Object]"));
  }
});

await test("S34 diagnostics null, malformed collection and unavailable sources fail safely without fabricated readiness", async () => {
  for (const probeQwen of [
    async () => null,
    async () => ({ reachable: null, profile_status: { nested: "unknown" }, health_summary: {}, models: [null, {}, { id: "nested", status: { unsupported: true } }] }),
    async () => { throw new Error("QWEN_PROBE_FAILED"); },
  ]) {
    const diag = await buildDiagnostics({
      statusTracker: { snapshot: () => null },
      lastTickStore: { snapshot: () => null },
      scanQueue: () => [],
      loadReceipts: () => [],
      probeQwen,
      nowIso: () => LAW_NOW,
    });
    assert.equal(diag.read_only, true);
    assert.notEqual(diag.qwen.reachable, true);
    assert.notEqual(diag.qwen.profile_status, "loaded");
    assert.ok(!JSON.stringify(diag).includes("[object Object]"));
    assert.doesNotThrow(() => JSON.stringify(diag));
  }
  for (const source of [
    { scanQueue: () => null, loadReceipts: () => [] },
    { scanQueue: () => ({}), loadReceipts: () => [] },
    { scanQueue: () => [diagnosticsEntry("D-9402-BAD")], loadReceipts: () => ({}) },
    { scanQueue: () => { throw new Error("SCAN_FAILED"); }, loadReceipts: () => [] },
  ]) {
    const diag = await buildDiagnostics({ ...source, probeQwen: async () => null, nowIso: () => LAW_NOW });
    assert.equal(diag.queue.ok, false);
    assert.equal(diag.queue.candidate_task_ref, null);
    assert.equal(diag.queue.eligible_count, null, "unreadable queue is unknown, not empty");
    assert.match(diag.queue.selection_reason_code, /FAILED|INVALID/);
  }
});

const DASHBOARD_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../../tools/local-dev-dispatcher-dashboard-v1.html");

/**
 * Execute the shipped script, including its startup and refresh listeners.
 * This small DOM records HTML sinks and network requests; CSS contracts are
 * checked separately. It never opens a browser or contacts the live service.
 */
async function dashboardHarness(initial = {}) {
  const html = readFileSync(DASHBOARD_FILE, "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, "dashboard stays self-contained");
  const elements = new Map();
  const htmlWrites = [];
  const fetches = [];
  const otherNetwork = [];
  const intervals = new Map();
  const localStore = new Map();
  let timerId = 0;
  let scenario = initial;
  let sectionOrder = ["agentops", "queue"];
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const listeners = new Map();
    const attributes = new Map();
    const classes = new Set();
    let text = "", markup = "";
    const result = {
      id,
      value: "",
      checked: true,
      disabled: false,
      hidden: false,
      open: false,
      dataset: {},
      style: {},
      className: "",
      get textContent() { return text; },
      set textContent(value) { text = String(value ?? ""); markup = ""; },
      get innerHTML() { return markup; },
      set innerHTML(value) { markup = String(value ?? ""); text = ""; htmlWrites.push({ id, value: markup }); },
      classList: {
        add: (...values) => values.forEach((value) => classes.add(value)),
        remove: (...values) => values.forEach((value) => classes.delete(value)),
        toggle: (value, force) => {
          const enabled = force ?? !classes.has(value);
          if (enabled) classes.add(value); else classes.delete(value);
          return enabled;
        },
        contains: (value) => classes.has(value),
      },
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: (name) => {
        if (name === "data-section" && id.startsWith("sec-")) return id.slice(4);
        return attributes.get(name) ?? null;
      },
      removeAttribute: (name) => attributes.delete(name),
      addEventListener: (name, listener) => {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(listener);
      },
      querySelectorAll: (selector) => {
        if (id === "layout-root" && selector.includes("data-section")) {
          return sectionOrder.map((sec) => element("sec-" + sec));
        }
        return [];
      },
      querySelector: () => null,
      appendChild(child) {
        if (id === "layout-root" && child && typeof child.getAttribute === "function") {
          const sec = child.getAttribute("data-section");
          if (sec) {
            sectionOrder = [...sectionOrder.filter((value) => value !== sec), sec];
          }
        }
        return child;
      },
      // The harness does not model a full DOM tree; no refreshed node owns
      // the synthetic active element. The production browser supplies the
      // native Element#contains implementation.
      contains: () => false,
      async fire(name) {
        for (const listener of listeners.get(name) || []) {
          await listener({ target: result, currentTarget: result, preventDefault() {} });
        }
      },
      focus() {},
    };
    elements.set(id, result);
    return result;
  }
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) element(match[1]);
  // queue-panel defaults collapsed (no open attribute in shipped markup)
  element("queue-panel").open = false;
  const document = {
    hidden: false,
    visibilityState: "visible",
    readyState: "complete",
    getElementById: (id) => element(id),
    querySelector: (selector) => selector.startsWith("#") ? element(selector.slice(1)) : null,
    querySelectorAll: (selector) => {
      if (String(selector).includes("data-section")) return sectionOrder.map((sec) => element("sec-" + sec));
      return [];
    },
    addEventListener: (name, listener) => element("__document").addEventListener(name, listener),
    createElement: (tag) => element("__created_" + tag + "_" + elements.size),
    documentElement: element("__root"),
  };
  const sandbox = {
    document,
    AbortController,
    AbortSignal,
    URL,
    console,
    localStorage: {
      getItem: (key) => (localStore.has(String(key)) ? localStore.get(String(key)) : null),
      setItem: (key, value) => { localStore.set(String(key), String(value)); },
      removeItem: (key) => { localStore.delete(String(key)); },
      clear: () => { localStore.clear(); },
    },
    fetch: async (url, options = {}) => {
      fetches.push({ url: String(url), method: String(options.method || "GET").toUpperCase() });
      if (scenario.networkError) throw new Error("Errore rete simulato");
      const path = String(url);
      return {
        ok: scenario.httpError !== true && !(scenario.httpHistoryError === true && path === "/v1/history"),
        status: (scenario.httpError ? 503 : (scenario.httpHistoryError === true && path === "/v1/history" ? 503 : 200)),
        json: async () => {
          if (scenario.badJson) throw new SyntaxError("JSON non valido");
          if (path === STATUS_PATH) return scenario.status ?? null;
          if (path === DIAGNOSTICS_PATH) return scenario.diag ?? null;
          if (path === RESOURCES_PATH) return scenario.resources ?? { schema_version: RESOURCES_SCHEMA, workstation: {}, qwen: {}, vps_new: {}, quotas: { pools: {} }, chatgpt_web: {} };
          if (path === "/v1/history") return scenario.history ?? { schema_version: "local-dev-mission-control-history-v1", read_only: true, latest_tick: null, active_task: null, last_terminal_task: null, recent_tasks: [], recent_events: [] };
          if (path === "/v1/live-activity") return scenario.liveActivity ?? { schema_version: "local-dev-live-activity-v1", read_only: true, active: false, events: [], public_rationale: null, freshness: "EMPTY", note: "Nessuna attività live disponibile" };
          return null;
        },
      };
    },
    setInterval: (callback) => { const id = ++timerId; intervals.set(id, callback); return id; },
    clearInterval: (id) => intervals.delete(id),
    setTimeout: () => ++timerId,
    clearTimeout() {},
    navigator: { sendBeacon: (...args) => { otherNetwork.push(["beacon", args]); return false; } },
    XMLHttpRequest: class { constructor() { otherNetwork.push("xhr"); throw new Error("Unexpected XHR"); } },
    WebSocket: class { constructor() { otherNetwork.push("websocket"); throw new Error("Unexpected WebSocket"); } },
    EventSource: class { constructor() { otherNetwork.push("eventsource"); throw new Error("Unexpected EventSource"); } },
    addEventListener: (name, listener) => element("__window").addEventListener(name, listener),
  };
  sandbox.window = sandbox;
  const context = createContext(sandbox);
  runInContext(scripts[0][1], context, { timeout: 2000, filename: DASHBOARD_FILE });
  const settle = () => new Promise((resolvePromise) => setImmediate(resolvePromise));
  await settle();
  return {
    html, context, elements, fetches, otherNetwork, htmlWrites, intervals, element, settle, localStore,
    getSectionOrder: () => [...sectionOrder],
    setScenario: (next) => { scenario = next; },
    evaluate: (script) => runInContext(script, context, { timeout: 2000 }),
    render: (status, diag, resources, refreshMeta, history) => {
      context.__testStatus = status;
      context.__testDiag = diag;
      context.__testResources = resources ?? null;
      context.__testRefreshMeta = refreshMeta ?? null;
      context.__testHistory = history ?? null;
      return runInContext("render(__testStatus, __testDiag, __testResources, __testRefreshMeta, __testHistory)", context, { timeout: 2000 });
    },
  };
}

await test("S35 dashboard startup, automatic and manual refresh execute only the read-only GET endpoints", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: { queue: { eligible_count: 0 }, qwen: {} } });
  await dashboard.evaluate("refresh()");
  for (const callback of [...dashboard.intervals.values()]) await callback();
  await dashboard.element("refresh-button").fire("click");
  await dashboard.element("queue-search").fire("input");
  await dashboard.element("queue-filter").fire("change");
  await dashboard.element("queue-sort").fire("change");
  await dashboard.settle();
  assert.ok(dashboard.fetches.length >= 6, "startup and manual refresh both fetch");
  assert.ok(dashboard.fetches.some((request) => request.url === STATUS_PATH));
  assert.ok(dashboard.fetches.some((request) => request.url === DIAGNOSTICS_PATH));
  assert.ok(dashboard.fetches.some((request) => request.url === RESOURCES_PATH));
  assert.ok(dashboard.fetches.some((request) => request.url === "/v1/history"), "#94 history source fetched");
  assert.ok(dashboard.fetches.some((request) => request.url === "/v1/live-activity"), "#120 live-activity source fetched");
  for (const request of dashboard.fetches) {
    assert.equal(request.method, "GET");
    assert.ok([STATUS_PATH, DIAGNOSTICS_PATH, RESOURCES_PATH, "/v1/history", "/v1/live-activity"].includes(request.url), request.url);
  }
  assert.deepEqual(dashboard.otherNetwork, []);
  assert.doesNotMatch(dashboard.html, /<form\b|<script\b[^>]*\bsrc\s*=|\b(?:src|href)\s*=\s*["']https?:\/\/(?!127\.0\.0\.1:16080\/vnc\.html)/i);
});

await test("S36 dashboard safely renders null, malformed collections and nested Qwen objects without implicit coercion", async () => {
  const dashboard = await dashboardHarness();
  const payloads = [
    [null, null],
    [null, {}],
    [{ active: null, classification: {}, task_ref: {}, phase: [] }, { status: {}, last_tick: null, queue: null, qwen: null, explanation: null }],
    [null, { queue: { items: {}, rejected_items: {}, skip_reason_summary: {} }, qwen: { models: {}, profile_status: {} }, last_tick: { reason_codes: {} } }],
    [null, {
      qwen: { reachable: true, profile_status: { value: "loaded" }, health_summary: {}, models: [null, {}, { id: "Qwen", status: { value: "loaded", args: ["--ctx-size", "65536"] }, meta: { n_ctx: 65536 } }] },
      queue: { items: [null, {}, { task_ref: {}, source_file: {}, latest_receipt: {}, blocking_receipts: {} }], rejected_items: [null, {}] },
      explanation: { headline: {}, detail: {}, blocked_at: {}, why_code: {}, operator_action: {} },
    }],
  ];
  for (const [status, diag] of payloads) {
    assert.doesNotThrow(() => dashboard.render(status, diag));
    const output = [...dashboard.elements.values()].map((node) => node.innerHTML + node.textContent).join("\n");
    assert.doesNotMatch(output, /\[object Object\]|\bundefined\b|\bNaN\b/);
  }
});

await test("S37 dashboard escapes untrusted model, queue, receipt and reason data at every HTML sink", async () => {
  const dashboard = await dashboardHarness();
  const attack = '<img src=x onerror="globalThis.__xss=1"><script>globalThis.__xss=1</script>';
  const diag = {
    status: { active: true, task_ref: attack, phase: attack, qwen_profile: attack, last_event: attack, classification: attack, request_id: attack },
    last_tick: { classification: attack, reason_codes: [attack], gate_summary: attack, task_ref: attack },
    queue: {
      eligible_count: 0, claim_present_count: 1,
      items: [{
        task_ref: attack, source_file: attack, backlog_state: attack,
        matching_receipt_present: true, currently_blocking: true, blocking_reason: attack,
        latest_receipt: { state: attack, claimed_at: attack, interpretation: attack, interpretation_code: attack },
        blocking_receipts: [{ state: attack, interpretation: attack }],
      }],
      rejected_items: [{ source: attack, reason: attack }],
      skip_reason_summary: { [attack]: 1 },
    },
    qwen: { reachable: true, profile_status: attack, health_summary: attack, error: attack, models: [{ id: attack, status: { value: attack, unknown: attack }, runtime: attack, health: attack }] },
    explanation: { headline: attack, detail: attack, blocked_at: attack, blocked_at_label: attack, why_code: attack, operator_action: attack },
  };
  dashboard.render(null, diag);
  const sinks = dashboard.htmlWrites.map((write) => write.value).join("\n");
  assert.doesNotMatch(sinks, /<img\b|<script\b|<svg\b/i);
  assert.ok(sinks.includes("&lt;img"), "payload must be rendered as escaped data");
  assert.equal(dashboard.context.__xss, undefined);
});

await test("S38 Italian tooltip dictionary is complete and tooltip content supports hover and keyboard focus", async () => {
  const dashboard = await dashboardHarness();
  assert.match(dashboard.html, /<html\b[^>]*lang=["']it["']/i);
  const tips = dashboard.evaluate("TIPS");
  for (const key of [
    "active", "classification", "phase", "task_ref", "request_id", "runtime_ready",
    "eligible_count", "claim_present_count", "execution_performed", "human_gate_required",
    "reason_codes", "receipt", "replayable",
  ]) {
    assert.equal(typeof tips[key], "string", key);
    assert.ok(tips[key].length >= 25, key + ": helpful explanation");
    assert.doesNotMatch(tips[key], /\b(?:whether|current|indicates|assigned|execution is|true while|the dispatcher)\b/i, key);
    const markup = dashboard.evaluate("help(" + JSON.stringify(key) + ")");
    assert.match(markup, /tabindex=["']0["']/i, key + ": keyboard focusable");
    assert.match(markup, /role=["']tooltip["']/i, key + ": semantic tooltip");
    assert.match(markup, /aria-(?:label|describedby)=/i, key + ": accessible description");
  }
  assert.match(dashboard.html, /:hover/);
  assert.match(dashboard.html, /:focus(?:-visible|-within)?/);
  // Keep the detector itself UTF-8 clean: these escapes represent the common
  // mojibake byte sequences without placing mojibake in the source file.
  assert.doesNotMatch(dashboard.html, /\u00e2\u20ac|\u00c3\u00a9|\u00c3\u00a8|\u00e2\u20ac\u00a6|\uFFFD/);
});

await test("S39 refresh handles HTTP, network and malformed JSON failures without execution requests", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: {} });
  for (const failure of [{ httpError: true }, { networkError: true }, { badJson: true }]) {
    dashboard.setScenario(failure);
    await assert.doesNotReject(async () => dashboard.evaluate("refresh()"));
    await dashboard.settle();
    const output = [...dashboard.elements.values()].map((node) => node.textContent + node.innerHTML).join("\n");
    assert.match(output, /errore|non (?:raggiungibile|disponibile)|connessione|fallit|aggiornamento/i);
  }
  assert.ok(dashboard.fetches.every((request) => request.method === "GET" && [STATUS_PATH, DIAGNOSTICS_PATH, RESOURCES_PATH, "/v1/history", "/v1/live-activity"].includes(request.url)));
  assert.deepEqual(dashboard.otherNetwork, []);
});

await test("S40 #77 loadReceiptsLedger: missing => []; valid []; invalid existing ledgers fail closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "cp-receipts-ledger-"));
  try {
    const missing = join(dir, "absent-receipts.json");
    const miss = loadReceiptsLedger(missing);
    assert.equal(miss.ok, true);
    assert.equal(miss.missing, true);
    assert.deepEqual(miss.receipts, []);

    const emptyPath = join(dir, "empty-array.json");
    writeFileSync(emptyPath, "[]\n", "utf8");
    const empty = loadReceiptsLedger(emptyPath);
    assert.equal(empty.ok, true);
    assert.equal(empty.missing, false);
    assert.deepEqual(empty.receipts, []);

    const malformed = join(dir, "malformed.json");
    writeFileSync(malformed, "{not-json", "utf8");
    const badJson = loadReceiptsLedger(malformed);
    assert.equal(badJson.ok, false);
    assert.equal(badJson.reason_code, "RECEIPTS_LEDGER_JSON_INVALID");
    assert.equal(badJson.receipts, null);
    assert.ok(!JSON.stringify(badJson).includes("{not-json"));

    const objPath = join(dir, "object.json");
    writeFileSync(objPath, "{\"receipts\":[]}\n", "utf8");
    const badObj = loadReceiptsLedger(objPath);
    assert.equal(badObj.ok, false);
    assert.equal(badObj.reason_code, "RECEIPTS_LEDGER_NOT_ARRAY");

    for (const scalar of ["null", "17", "\"x\"", "true"]) {
      const p = join(dir, `scalar-${Buffer.from(scalar).toString("hex")}.json`);
      writeFileSync(p, `${scalar}\n`, "utf8");
      const r = loadReceiptsLedger(p);
      assert.equal(r.ok, false, scalar);
      assert.equal(r.reason_code, "RECEIPTS_LEDGER_NOT_ARRAY", scalar);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("S41 #77 performTick invalid ledger: SERVICE_ERROR + zero selector/Qwen/executor/persist side effects", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cp-receipts-tick-"));
  const cases = [
    { name: "malformed_json", body: "{nope", subtype: "RECEIPTS_LEDGER_JSON_INVALID" },
    { name: "object", body: "{\"items\":[]}\n", subtype: "RECEIPTS_LEDGER_NOT_ARRAY" },
    { name: "null_scalar", body: "null\n", subtype: "RECEIPTS_LEDGER_NOT_ARRAY" },
  ];
  try {
    for (const c of cases) {
      const receiptsPath = join(dir, `${c.name}.json`);
      writeFileSync(receiptsPath, c.body, "utf8");
      let dispatch = 0, ready = 0, exec = 0, persist = 0, scan = 0;
      const result = await performTick(
        { schema_version: REQUEST_SCHEMA, request_id: `r-77-${c.name}`, source: "n8n" },
        {
          verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
          receiptsPath,
          scanQueue: () => { scan += 1; return [{ markdown: backlogMarkdown("D-77-X"), source: "READY_D-77-X.md", backlog_path: "q/READY_D-77-X.md" }]; },
          runDispatchLoop: () => { dispatch += 1; return claimForTick("LOCAL_DEV_B_D-77-X"); },
          ensureDevQwenReady: async () => { ready += 1; return { ready: true }; },
          runExecutor: async () => { exec += 1; return { status: "PASS", classification: "PASS", task_ref: "LOCAL_DEV_B_D-77-X" }; },
          persistReceipts: () => { persist += 1; },
        },
      );
      assert.equal(result.classification, "SERVICE_ERROR", c.name);
      assert.equal(result.execution_performed, false, c.name);
      assert.equal(result.human_gate_required, false, c.name);
      assert.equal(result.task_ref, null, c.name);
      assert.ok(result.reason_codes.includes("RECEIPTS_LEDGER_INVALID"), c.name);
      assert.ok(result.reason_codes.includes(c.subtype), c.name);
      assert.equal(dispatch, 0, c.name);
      assert.equal(ready, 0, c.name);
      assert.equal(exec, 0, c.name);
      assert.equal(persist, 0, c.name);
      assert.equal(scan, 0, c.name);
      if (c.name === "malformed_json") {
        assert.ok(!JSON.stringify(result).includes("{nope"), c.name);
      }
      if (c.name === "object") {
        assert.ok(!JSON.stringify(result).includes("\"items\""), c.name);
      }
    }

    // Injected read error path (unreadable) — fail closed without touching selector.
    let dispatch2 = 0, ready2 = 0, exec2 = 0, persist2 = 0;
    const readFail = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r-77-read-fail", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        loadReceipts: () => {
          const err = new Error("RECEIPTS_LEDGER_READ_FAILED");
          err.code = "RECEIPTS_LEDGER_READ_FAILED";
          throw err;
        },
        scanQueue: () => [{ markdown: backlogMarkdown("D-77-Y"), source: "y.md", backlog_path: "q/y.md" }],
        runDispatchLoop: () => { dispatch2 += 1; return claimForTick("LOCAL_DEV_B_D-77-Y"); },
        ensureDevQwenReady: async () => { ready2 += 1; return { ready: true }; },
        runExecutor: async () => { exec2 += 1; return { status: "PASS", classification: "PASS" }; },
        persistReceipts: () => { persist2 += 1; },
      },
    );
    assert.equal(readFail.classification, "SERVICE_ERROR");
    assert.equal(readFail.execution_performed, false);
    assert.ok(readFail.reason_codes.includes("RECEIPTS_LEDGER_INVALID"));
    assert.ok(readFail.reason_codes.includes("RECEIPTS_LEDGER_READ_FAILED"));
    assert.equal(dispatch2 + ready2 + exec2 + persist2, 0);

    // Injected non-array return (without throw).
    let dispatch3 = 0;
    const nonArray = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r-77-non-array-inject", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        loadReceipts: () => ({ not: "array" }),
        runDispatchLoop: () => { dispatch3 += 1; return { ok: true, claims: [], skipped: [] }; },
        ensureDevQwenReady: async () => ({ ready: true }),
        runExecutor: async () => ({ status: "PASS", classification: "PASS" }),
      },
    );
    assert.equal(nonArray.classification, "SERVICE_ERROR");
    assert.ok(nonArray.reason_codes.includes("RECEIPTS_LEDGER_NOT_ARRAY"));
    assert.equal(dispatch3, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("S42 #77 missing ledger and valid [] preserve empty-ledger selection path", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cp-receipts-empty-"));
  try {
    const missingPath = join(dir, "no-such-receipts.json");
    let dispatch = 0;
    const miss = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r-77-missing", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        receiptsPath: missingPath,
        scanQueue: () => [],
        runDispatchLoop: (_entries, receipts) => {
          dispatch += 1;
          assert.ok(Array.isArray(receipts));
          assert.equal(receipts.length, 0);
          return { ok: true, claims: [], skipped: [], stop_reason: "QUEUE_DRAINED" };
        },
        ensureDevQwenReady: async () => { throw new Error("MUST NOT PREFLIGHT ON IDLE"); },
        runExecutor: async () => { throw new Error("MUST NOT EXECUTE"); },
      },
    );
    assert.equal(miss.classification, "IDLE_CLEAN");
    assert.equal(miss.execution_performed, false);
    assert.equal(dispatch, 1);

    const emptyPath = join(dir, "empty.json");
    writeFileSync(emptyPath, "[]\n", "utf8");
    dispatch = 0;
    const empty = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r-77-empty", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        receiptsPath: emptyPath,
        scanQueue: () => [{ markdown: backlogMarkdown("D-77-Z"), source: "READY_D-77-Z.md", backlog_path: "q/READY_D-77-Z.md" }],
        runDispatchLoop: (_entries, receipts) => {
          dispatch += 1;
          assert.deepEqual(receipts, []);
          return { ok: true, claims: [], skipped: [], stop_reason: "QUEUE_DRAINED" };
        },
        ensureDevQwenReady: async () => { throw new Error("MUST NOT PREFLIGHT"); },
        runExecutor: async () => { throw new Error("MUST NOT EXECUTE"); },
      },
    );
    assert.equal(empty.classification, "IDLE_CLEAN");
    assert.equal(dispatch, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("S43 #77 valid ledger: legacy no-state still blocks; #74 stale CLAIMED replay unchanged", async () => {
  const id = "D-77-LEG";
  const taskRef = `LOCAL_DEV_B_${id}`;
  const markdown = backlogMarkdown(id);
  const entry = { ...parseBacklogFile(markdown), markdown, source: `READY_${id}.md`, backlog_path: `q/READY_${id}.md` };

  const legacyBlocks = selectNextQueueItem([entry], [{ task_ref: taskRef, claimed_at: STALE_CLAIMED_AT }], LAW_NOW);
  assert.equal(legacyBlocks.selected, null);
  assert.equal(legacyBlocks.eligible_count, 0);
  assert.ok(legacyBlocks.excluded.some((e) => e.reason === "CLAIM_ALREADY_EXISTS"));

  const staleReplay = selectNextQueueItem(
    [entry],
    [{ task_ref: taskRef, state: "CLAIMED", execution_started: false, replayable: true, claimed_at: STALE_CLAIMED_AT }],
    LAW_NOW,
  );
  assert.equal(staleReplay.selected?.task_ref, taskRef);
  assert.equal(staleReplay.eligible_count, 1);

  // performTick with real file loader + real selector path via injected dispatch that receives ledger
  const dir = mkdtempSync(join(tmpdir(), "cp-receipts-legacy-"));
  try {
    const legacyPath = join(dir, "legacy.json");
    writeFileSync(legacyPath, `${JSON.stringify([{ task_ref: taskRef, claimed_at: STALE_CLAIMED_AT }], null, 2)}\n`, "utf8");
    let seenReceipts = null;
    const blocked = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r-77-legacy-block", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        receiptsPath: legacyPath,
        scanQueue: () => [{ markdown, source: `READY_${id}.md`, backlog_path: `q/READY_${id}.md` }],
        runDispatchLoop: (entries, receipts) => {
          seenReceipts = receipts;
          const decision = selectNextQueueItem(
            entries.map((e) => {
              try { return { ...parseBacklogFile(e.markdown), markdown: e.markdown, source: e.source }; }
              catch { return { ok: false, source: e.source }; }
            }),
            receipts,
            LAW_NOW,
          );
          assert.equal(decision.selected, null);
          return { ok: true, claims: [], skipped: [], stop_reason: "QUEUE_DRAINED" };
        },
        ensureDevQwenReady: async () => { throw new Error("MUST NOT PREFLIGHT WHEN BLOCKED"); },
        runExecutor: async () => { throw new Error("MUST NOT EXECUTE"); },
      },
    );
    assert.equal(blocked.classification, "IDLE_CLEAN");
    assert.equal(seenReceipts.length, 1);
    assert.equal(seenReceipts[0].state, undefined);

    const stalePath = join(dir, "stale-claimed.json");
    writeFileSync(stalePath, `${JSON.stringify([{
      task_ref: taskRef,
      state: "CLAIMED",
      execution_started: false,
      replayable: true,
      claimed_at: STALE_CLAIMED_AT,
    }], null, 2)}\n`, "utf8");
    let claimed = false;
    const replay = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r-77-stale-replay", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        receiptsPath: stalePath,
        scanQueue: () => [{ markdown, source: `READY_${id}.md`, backlog_path: `q/READY_${id}.md` }],
        runDispatchLoop: (entries, receipts) => {
          const decision = selectNextQueueItem(
            entries.map((e) => ({ ...parseBacklogFile(e.markdown), markdown: e.markdown, source: e.source })),
            receipts,
            LAW_NOW,
          );
          assert.equal(decision.selected?.task_ref, taskRef);
          claimed = true;
          return claimForTick(taskRef);
        },
        loadReceipts: undefined,
        persistReceipts: () => {},
        ensureDevQwenReady: readyEnsureStub(),
        admitMicroTaskDelta: () => ({ admitted: true }),
        runExecutor: async () => ({ status: "PASS", classification: "PASS", task_ref: taskRef, reason_codes: ["PASS"] }),
      },
    );
    assert.equal(claimed, true);
    assert.equal(replay.classification, "WORK_EXECUTED_PASS");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("S44 #77 diagnostics invalid ledger remains read-only / independent of execution authority", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cp-diag-invalid-"));
  try {
    const badPath = join(dir, "bad-receipts.json");
    writeFileSync(badPath, "{broken", "utf8");
    const before = readFileSync(badPath, "utf8");
    const diag = await buildDiagnostics({
      statusTracker: createExecutionStatusTracker(),
      lastTickStore: createLastTickStore(),
      receiptsPath: badPath,
      scanQueue: () => [],
      probeQwen: async () => ({ reachable: false, health_summary: "unreachable", profile_status: "unreachable", models: [], error: "n/a" }),
      nowIso: () => LAW_NOW,
    });
    assert.equal(diag.schema_version, DIAGNOSTICS_SCHEMA);
    assert.equal(diag.read_only, true);
    assert.ok(diag.queue);
    // Diagnostics must not rewrite the invalid ledger file.
    assert.equal(readFileSync(badPath, "utf8"), before);
    // Execution path still fail-closed on same file.
    const tick = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: "r-77-diag-vs-exec", source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: BRIDGE_SHA, reason_codes: [] }),
        receiptsPath: badPath,
        runDispatchLoop: () => { throw new Error("SELECTOR_MUST_NOT_RUN"); },
        ensureDevQwenReady: async () => { throw new Error("QWEN_MUST_NOT_RUN"); },
        runExecutor: async () => { throw new Error("EXEC_MUST_NOT_RUN"); },
      },
    );
    assert.equal(tick.classification, "SERVICE_ERROR");
    assert.ok(tick.reason_codes.includes("RECEIPTS_LEDGER_INVALID"));
    assert.equal(readFileSync(badPath, "utf8"), before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("S45 GET /v1/resources read-only observatory: no tick side effects; schema bound", async () => {
  let dispatch = 0, ready = 0, exec = 0, persist = 0;
  const res = mockRes();
  await handleTickRequest(mockReq("GET", RESOURCES_PATH), res, {
    buildResources: async () => ({
      schema_version: RESOURCES_SCHEMA,
      read_only: true,
      observed_at: "2026-09-09T00:00:00.000Z",
      workstation: { state: "AVAILABLE", collector_label: "Node.js dispatcher / Windows OS" },
      qwen: { state: "AVAILABLE", capacity_label: "Capacità locale — nessuna quota commerciale", commercial_quota: "N/A", collector_label: "qwen probe" },
      vps_new: { state: "UNAVAILABLE", reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE", collector_label: "vps probe" },
      quotas: {
        pools: {
          glm_coding_plan: { quota_pool_id: "glm_coding_plan", consumers: ["glm-5.3", "glm-5.3-flash"], state: "UNKNOWN", freshness: "stale" },
          chatgpt_codex_subscription: { quota_pool_id: "chatgpt_codex_subscription", state: "UNKNOWN", freshness: "stale" },
        },
        cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN" },
      },
      chatgpt_web: { availability_domain: "SEPARATE_AVAILABILITY_DOMAIN", unlimited: false, free: false, state: "UNKNOWN" },
      collectors: {},
    }),
    tickDeps: {
      runDispatchLoop: () => { dispatch += 1; return { claims: [] }; },
      ensureDevQwenReady: async () => { ready += 1; return { ready: true }; },
      runExecutor: async () => { exec += 1; return { status: "PASS" }; },
      persistReceipts: () => { persist += 1; },
    },
  });
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.schema_version, RESOURCES_SCHEMA);
  assert.equal(body.read_only, true);
  assert.equal(body.quotas.pools.glm_coding_plan.consumers.length, 2);
  assert.equal(body.chatgpt_web.unlimited, false);
  assert.equal(body.chatgpt_web.free, false);
  assert.equal(dispatch + ready + exec + persist, 0);
  const post = mockRes();
  await handleTickRequest(mockReq("POST", RESOURCES_PATH, "{}"), post, {});
  assert.equal(post.status, 405);
});

await test("S46 observatory collectors: GPU missing UNKNOWN; Qwen unreachable; VPS unavailable; mutation blocked; cache", async () => {
  resetVpsObservationCache();
  const gpu = await collectGpuMetrics({
    execFile: async () => { const err = new Error("not found"); err.code = "ENOENT"; throw err; },
  });
  assert.equal(gpu.state, "UNAVAILABLE");
  assert.equal(gpu.reason_code, "NVIDIA_SMI_NOT_FOUND");

  const qwen = await collectQwenResources({
    probeQwen: async () => ({ reachable: false, models: [], profile_status: "unreachable", error: "timeout" }),
  });
  assert.equal(qwen.reachable, false);
  assert.equal(qwen.commercial_quota, "N/A");
  assert.match(qwen.capacity_label, /nessuna quota commerciale/i);

  assert.equal(assertVpsCommandSafe("docker restart n8n").ok, false);
  assert.equal(assertVpsCommandSafe("systemctl restart docker").reason_code, "VPS_COMMAND_MUTATION_FORBIDDEN");
  assert.equal(assertVpsCommandSafe("uptime").ok, true);
  assert.ok(VPS_SAFE_REMOTE_COMMANDS.includes("uptime"));

  const v1 = await collectVpsNewResources({ nowMs: 1_000 });
  assert.equal(v1.state, "UNAVAILABLE");
  assert.equal(v1.reason_code, "VPS_PRIVATE_OBSERVATION_UNAVAILABLE");
  const v2 = await collectVpsNewResources({ nowMs: 1_000 + 5_000 });
  assert.equal(v2.cache_hit, true);

  let sshCalls = 0;
  resetVpsObservationCache();
  const vLive = await collectVpsNewResources({
    nowMs: 2_000,
    bypassCache: true,
    sshRunner: async ({ commands, batchMode, timeoutMs }) => {
      sshCalls += 1;
      assert.equal(batchMode, true);
      assert.ok(timeoutMs <= 8000);
      for (const cmd of commands) assert.equal(assertVpsCommandSafe(cmd).ok, true);
      return { reachable: true, observed_at: "2026-09-09T00:00:00.000Z", ram_percent: 40, n8n: "active", docker: "29.0", postgresql: "active", litellm: "unknown" };
    },
  });
  assert.equal(vLive.state, "AVAILABLE");
  assert.equal(sshCalls, 1);
  const vCached = await collectVpsNewResources({ nowMs: 2_000 + 10_000 });
  assert.equal(vCached.cache_hit, true);
  assert.equal(sshCalls, 1);

  const quotas = await collectQuotaObservatory({
    collectOpenClaw: async () => ({
      ok: false, freshness: "stale", observed_at: null, cache_hit: false,
      reason_codes: ["OPENCLAW_NOT_FOUND"], emit_contributions: false, contributions: [],
      pools: {
        glm_coding_plan: { state: "unknown", freshness: "stale", reason_code: "OPENCLAW_NOT_FOUND", windows: [], unmapped_windows: [], primary: null },
        chatgpt_codex_subscription: { state: "unknown", freshness: "stale", reason_code: "OPENCLAW_NOT_FOUND", windows: [], unmapped_windows: [], primary: null },
      },
    }),
    composeCanonicalQuotaState: async () => ({
      ok: true,
      schema_version: "v4-rt25-canonical-quota-state-v1",
      joined: {
        pools: {
          glm_coding_plan: { state: "unknown", freshness: "stale", remaining_percent: null, evaluation: "CONSERVE_UNKNOWN_MISSING" },
          chatgpt_codex_subscription: { state: "unknown", freshness: "stale", remaining_percent: null, evaluation: "CONSERVE_UNKNOWN_MISSING" },
        },
      },
      reason_codes: [],
    }),
  });
  assert.equal(quotas.pools.glm_coding_plan.quota_pool_id, "glm_coding_plan");
  assert.deepEqual(quotas.pools.glm_coding_plan.consumers, ["glm-5.3", "glm-5.3-flash"]);
  assert.equal(quotas.pools.chatgpt_codex_subscription.state, "UNKNOWN");
  assert.equal(quotas.cursor.accounting_mapping, "UNVERIFIED");
  assert.equal(quotas.qwen_local.commercial_quota, "N/A");

  const web = await collectChatgptWebObservation({});
  assert.equal(web.unlimited, false);
  assert.equal(web.free, false);
  assert.equal(web.state, "UNKNOWN");
  assert.equal(web.availability_domain, "SEPARATE_AVAILABILITY_DOMAIN");
  assert.ok(!/"unlimited"\s*:\s*true/.test(JSON.stringify(web)));
  assert.ok(!/"free"\s*:\s*true/.test(JSON.stringify(web)));

  const obs = await buildResourceObservatory({
    collectWorkstation: async () => ({ state: "AVAILABLE", ram_percent: 50, collector_label: "os", gpu }),
    collectQwen: async () => qwen,
    collectVps: async () => v1,
    collectQuotas: async () => quotas,
    collectChatgptWeb: async () => web,
  });
  assert.equal(obs.schema_version, RESOURCES_SCHEMA);
  assert.equal(obs.read_only, true);
  assert.ok(!JSON.stringify(obs).includes("[object Object]"));
});

await test("S47 dashboard resources section: no object Object; Italian labels; no unlimited ChatGPT Web", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false },
    diag: { queue: { eligible_count: 0 }, qwen: { reachable: true, models: [] } },
    resources: {
      schema_version: RESOURCES_SCHEMA,
      workstation: { state: "AVAILABLE", ram_percent: 42.5, observed_at: "2026-09-09T00:00:00Z", freshness: "fresh", collector_label: "Node.js dispatcher / Windows OS", gpu: { state: "UNKNOWN", reason_code: "NVIDIA_SMI_NOT_FOUND", collector_label: "nvidia-smi" } },
      qwen: { occupancy: "IDLE", capacity_label: "Capacità locale — nessuna quota commerciale", commercial_quota: "N/A", collector_label: "qwen probe", loaded_models: [] },
      vps_new: { state: "UNAVAILABLE", reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE", collector_label: "vps probe" },
      quotas: {
        pools: {
          glm_coding_plan: { state: "UNKNOWN", freshness: "stale", consumers: ["glm-5.3", "glm-5.3-flash"], collector_label: "rt25" },
          chatgpt_codex_subscription: { state: "UNKNOWN", freshness: "stale", collector_label: "rt25" },
        },
        cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN", labels: {}, collector_label: "manual" },
      },
      chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false, collector_label: "hermes" },
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = [...dashboard.htmlWrites.map((w) => w.value), ...[...dashboard.elements.values()].map((n) => n.innerHTML + n.textContent)].join("\n");
  assert.match(out, /Risorse e quote|Macchina locale|Qwen locale|VPS|GLM|Codex|Cursor/i);
  assert.doesNotMatch(out, /ChatGPT Web/);
  assert.match(out, /Capacità locale — nessuna quota commerciale|Nessuna quota commerciale/);
  assert.match(out, /UNVERIFIED|MANUAL_ONLY|Mapping/i);
  assert.match(out, /Fonte \/ Collector/);
  assert.doesNotMatch(out, /\[object Object\]/);
  assert.doesNotMatch(out, /\bUNLIMITED\b|\bFREE\b|100%\s*remaining/i);
});

function qwenResourcesFixture(extra = {}) {
  const profile = extra.profile || "qwen38-opus-q3-opencode-64k";
  const loaded = extra.loaded_models || [{
    id: profile,
    status: "loaded",
    context_tokens: 65536,
    pid: 4242,
    port: 8080,
  }];
  return {
    schema_version: RESOURCES_SCHEMA,
    workstation: { state: "AVAILABLE", freshness: "fresh", collector_label: "ws" },
    qwen: {
      reachable: extra.reachable !== false,
      occupancy: extra.occupancy || (loaded.length ? "LOADED" : "IDLE"),
      profile_status: extra.profile_status || (loaded.length ? "loaded" : "listed"),
      capacity_label: "Capacità locale — nessuna quota commerciale",
      commercial_quota: "N/A",
      collector_label: "qwen probe",
      loaded_models: loaded,
      models: loaded,
      freshness: "fresh",
      observed_at: "2026-09-09T00:00:00Z",
      ...objish(extra.qwen),
    },
    vps_new: { state: "UNAVAILABLE", reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE" },
    quotas: { pools: {} },
    chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
  };
}
function objish(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function dashboardText(dashboard) {
  const latestById = new Map();
  for (const write of dashboard.htmlWrites) latestById.set(write.id, write.value);
  return [...latestById.values(), ...[...dashboard.elements.values()].map((n) => n.innerHTML + n.textContent)].join("\n");
}

await test("S48 loaded idle: model id + CARICATO + nessun uso dispatcher; never LIBERO/IN USO", async () => {
  const profile = "qwen38-opus-q3-opencode-64k";
  const dashboard = await dashboardHarness({
    status: { active: false, phase: "IDLE", qwen_profile: null },
    diag: { queue: { eligible_count: 0 }, qwen: { reachable: true, models: [{ id: profile, status: "loaded", meta: { n_ctx: 65536 } }] } },
    resources: qwenResourcesFixture({ profile }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /qwen38-opus-q3-opencode-64k/);
  assert.match(out, /CARICATO|Caricato/);
  assert.match(out, /Nessun uso dispatcher osservato/i);
  assert.match(out, /64K|65\.536|65536/);
  assert.match(out, /Uso esterno: non osservabile/);
  assert.doesNotMatch(out, /\bLIBERO\b/);
  assert.doesNotMatch(out, /In uso dal dispatcher|In uso · OpenCode/);
  assert.doesNotMatch(out, /\[object Object\]/);
});

await test("S49 OPENCODE exact profile match: IN USO + OpenCode + task + elapsed", async () => {
  const profile = "qwen38-opus-q3-opencode-64k";
  const dashboard = await dashboardHarness({
    status: {
      active: true,
      phase: "OPENCODE",
      qwen_profile: profile,
      task_ref: "LOCAL_DEV_B_D-9405-A",
      elapsed_ms: 151000,
      executor_pid: 999,
      runtime_ready: true,
    },
    diag: {
      status: {
        active: true,
        phase: "OPENCODE",
        qwen_profile: profile,
        task_ref: "LOCAL_DEV_B_D-9405-A",
        elapsed_ms: 151000,
      },
      queue: { eligible_count: 0 },
      qwen: { reachable: true, models: [{ id: profile, status: "loaded", meta: { n_ctx: 65536 } }] },
    },
    resources: qwenResourcesFixture({ profile }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /In uso dal dispatcher|In uso · OpenCode/);
  assert.match(out, /OpenCode/);
  assert.match(out, /D-9405-A/);
  assert.match(out, /02:31|Attivo da/);
  assert.doesNotMatch(out, /Nessun uso dispatcher osservato/);
  assert.doesNotMatch(out, /\[object Object\]/);
});

await test("S50 QWEN_PREFLIGHT is preparation, not inference", async () => {
  const profile = "qwen38-opus-q3-opencode-64k";
  const dashboard = await dashboardHarness({
    status: { active: true, phase: "QWEN_PREFLIGHT", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-11", elapsed_ms: 5000 },
    diag: { status: { active: true, phase: "QWEN_PREFLIGHT", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-11" }, queue: {}, qwen: { reachable: true, models: [{ id: profile, status: "loaded" }] } },
    resources: qwenResourcesFixture({ profile }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /PREPARAZIONE \/ VERIFICA QWEN|Preparazione \/ verifica Qwen/i);
  assert.doesNotMatch(out, /In uso dal dispatcher|In uso · OpenCode/);
  assert.doesNotMatch(out, /inferenza in esecuzione|sta elaborando un’inferenza/i);
});

await test("S51 TESTS phase: task active, Qwen not in inference", async () => {
  const profile = "qwen38-opus-q3-opencode-64k";
  const dashboard = await dashboardHarness({
    status: { active: true, phase: "TESTS", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-12", elapsed_ms: 90000 },
    diag: { status: { active: true, phase: "TESTS", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-12" }, queue: {}, qwen: { reachable: true, models: [{ id: profile, status: "loaded" }] } },
    resources: qwenResourcesFixture({ profile }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /QWEN NON IN INFERENZA|non in inferenza/i);
  assert.doesNotMatch(out, /In uso dal dispatcher|In uso · OpenCode/);
});

await test("S52 PERSISTENCE phase: same non-inference semantics", async () => {
  const profile = "qwen38-opus-q3-opencode-64k";
  const dashboard = await dashboardHarness({
    status: { active: true, phase: "PERSISTENCE", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-13", elapsed_ms: 120000 },
    diag: { status: { active: true, phase: "PERSISTENCE", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-13" }, queue: {}, qwen: { reachable: true, models: [{ id: profile, status: "loaded" }] } },
    resources: qwenResourcesFixture({ profile }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /QWEN NON IN INFERENZA|non in inferenza/i);
  assert.doesNotMatch(out, /In uso dal dispatcher|In uso · OpenCode/);
});

await test("S53 active profile mismatch: no false attribution", async () => {
  const dashboard = await dashboardHarness({
    status: { active: true, phase: "OPENCODE", qwen_profile: "other-profile-id", task_ref: "LOCAL_DEV_B_D-14", elapsed_ms: 1000 },
    diag: { status: { active: true, phase: "OPENCODE", qwen_profile: "other-profile-id", task_ref: "LOCAL_DEV_B_D-14" }, queue: {}, qwen: { reachable: true, models: [{ id: "qwen38-opus-q3-opencode-64k", status: "loaded" }] } },
    resources: qwenResourcesFixture({ profile: "qwen38-opus-q3-opencode-64k" }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /USO DISPATCHER NON CORRELATO|non correlato/i);
  assert.doesNotMatch(out, /In uso dal dispatcher|In uso · OpenCode · D-14/);
  assert.doesNotMatch(out, /Harness: OpenCode/);
});

await test("S54 qwen_profile null: no invented owner", async () => {
  const dashboard = await dashboardHarness({
    status: { active: true, phase: "OPENCODE", qwen_profile: null, task_ref: "LOCAL_DEV_B_D-15", elapsed_ms: 1000 },
    diag: { status: { active: true, phase: "OPENCODE", qwen_profile: null, task_ref: "LOCAL_DEV_B_D-15" }, queue: {}, qwen: { reachable: true, models: [{ id: "qwen38-opus-q3-opencode-64k", status: "loaded" }] } },
    resources: qwenResourcesFixture({}),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.doesNotMatch(out, /In uso dal dispatcher|In uso · OpenCode/);
  assert.doesNotMatch(out, /Harness: OpenCode/);
  assert.match(out, /senza profilo|non correlato|Nessun uso dispatcher osservato/i);
});

await test("S55 multiple loaded models: exact correlation only", async () => {
  const profile = "qwen38-opus-q3-opencode-64k";
  const other = "qwen-other-profile";
  const dashboard = await dashboardHarness({
    status: { active: true, phase: "OPENCODE", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-16", elapsed_ms: 61000 },
    diag: {
      status: { active: true, phase: "OPENCODE", qwen_profile: profile, task_ref: "LOCAL_DEV_B_D-16", elapsed_ms: 61000 },
      queue: {},
      qwen: { reachable: true, models: [{ id: profile, status: "loaded" }, { id: other, status: "loaded" }] },
    },
    resources: qwenResourcesFixture({
      loaded_models: [
        { id: profile, status: "loaded", context_tokens: 65536, pid: 1, port: 8080 },
        { id: other, status: "loaded", context_tokens: 32768, pid: 2, port: 8081 },
      ],
    }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /In uso dal dispatcher|In uso · OpenCode/);
  assert.match(out, /Modello del task/);
  assert.match(out, new RegExp(other));
  assert.match(out, new RegExp(profile));
});

await test("S56 endpoint unreachable: bounded unavailable state", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false },
    diag: { queue: {}, qwen: { reachable: false, models: [], error: "ECONNREFUSED" } },
    resources: qwenResourcesFixture({
      reachable: false,
      occupancy: "UNKNOWN",
      profile_status: "unreachable",
      loaded_models: [],
      qwen: { reachable: false, error: "ECONNREFUSED" },
    }),
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /non raggiungibile|Offline|ENDPOINT NON RAGGIUNGIBILE/i);
  assert.doesNotMatch(out, /In uso dal dispatcher/);
  assert.doesNotMatch(out, /\[object Object\]/);
});

await test("S57 Qwen usage tooltips present; network remains GET-only without POST tick", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false },
    diag: { queue: { eligible_count: 0 }, qwen: { reachable: true, models: [] } },
    resources: qwenResourcesFixture({ loaded_models: [] }),
  });
  const tips = dashboard.evaluate("TIPS");
  for (const key of ["qwen_model_loaded", "qwen_in_use", "qwen_no_dispatcher_use"]) {
    assert.equal(typeof tips[key], "string", key);
    assert.ok(tips[key].length >= 25, key);
  }
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  assert.ok(dashboard.fetches.every((request) => request.method === "GET"));
  assert.ok(dashboard.fetches.every((request) => [STATUS_PATH, DIAGNOSTICS_PATH, RESOURCES_PATH, "/v1/history", "/v1/live-activity"].includes(request.url)));
  assert.ok(!dashboard.fetches.some((request) => /tick/i.test(request.url)));
  assert.deepEqual(dashboard.otherNetwork, []);
  assert.doesNotMatch(dashboardText(dashboard), /\[object Object\]/);
});

await test("S58 #73 observatory consumes live OpenClaw observation: pools, windows, merge law", async () => {
  const observedAt = new Date(Date.parse("2026-09-09T05:00:00.000Z") - 5000).toISOString();
  const livePools = {
    glm_coding_plan: {
      provider: "zai",
      state: "available",
      freshness: "fresh",
      reason_code: null,
      windows: [
        { window_type: "rolling", label: "Tokens (5h)", remaining_percent: 40, reset_at: "2026-09-09T06:00:00.000Z" },
        { window_type: "weekly", label: "Tokens (Limit)", remaining_percent: 13, reset_at: "2026-09-11T22:35:05.998Z" },
      ],
      auxiliary_windows: [{ kind: "mcp", label: "MCP", remaining_percent: 100, reset_at: "2026-10-04T22:35:05.999Z" }],
      unmapped_windows: [],
      primary: { window_type: "weekly", remaining_percent: 13, reset_at: "2026-09-11T22:35:05.998Z" },
      effective_remaining_percent: 13,
      source_label: "OpenClaw / Z.AI usage",
    },
    chatgpt_codex_subscription: {
      provider: "openai-codex",
      state: "available",
      freshness: "fresh",
      reason_code: null,
      windows: [
        { window_type: "rolling", label: "5h", remaining_percent: 100, reset_at: "2026-09-09T08:16:18.000Z" },
        { window_type: "weekly", label: "Week", remaining_percent: 84, reset_at: "2026-09-16T08:09:21.000Z" },
      ],
      auxiliary_windows: [],
      unmapped_windows: [],
      primary: { window_type: "weekly", remaining_percent: 84, reset_at: "2026-09-16T08:09:21.000Z" },
      effective_remaining_percent: 84,
      source_label: "OpenClaw / OpenAI Codex usage",
      plan: "plus",
    },
  };
  const contributions = [
    {
      schema_version: "v4-resource-status-contribution-v1",
      contribution_id: "openclaw-quota-glm_coding_plan-" + observedAt,
      producer_id: "collect-openclaw-quota-v1",
      source: "provider_api",
      produced_at: observedAt,
      resources: { glm: { available: true, quota_remaining: { value: 100, unit: "percent" }, reset_at: "2026-09-16T05:00:00.000Z", cost_mode: "included", location: "cloud", updated_at: observedAt, evidence: { kind: "source_snapshot", classification: "OPENCLAW_USAGE_LIVE_zai" } } },
    },
  ];
  let composeCalls = 0;
  const quotas = await collectQuotaObservatory({
    nowMs: Date.parse("2026-09-09T05:00:00.000Z"),
    collectOpenClaw: async () => ({
      ok: true, freshness: "fresh", observed_at: observedAt, cache_hit: false,
      reason_codes: [], emit_contributions: true, contributions, pools: livePools,
    }),
    composeCanonicalQuotaState: async (args) => {
      composeCalls += 1;
      assert.equal(args.contributions.length, 1);
      assert.equal(args.contributions[0].producer_id, "collect-openclaw-quota-v1");
      return {
        ok: true,
        schema_version: "v4-rt25-canonical-quota-state-v1",
        joined: {
          pools: {
            glm_coding_plan: { state: "available", freshness: "fresh", remaining_percent: 13, evaluation: "POOL_HEALTHY", reset_at: "2026-09-11T22:35:05.998Z" },
            chatgpt_codex_subscription: { state: "available", freshness: "fresh", remaining_percent: 84, evaluation: "POOL_HEALTHY", reset_at: "2026-09-16T08:09:21.000Z" },
          },
        },
        reason_codes: [],
      };
    },
  });
  assert.equal(composeCalls, 1);
  const glm = quotas.pools.glm_coding_plan;
  assert.equal(glm.quota_pool_id, "glm_coding_plan");
  assert.equal(glm.state, "AVAILABLE");
  assert.equal(glm.freshness, "fresh");
  assert.equal(glm.remaining_percent, 13); // MIN(40,13), MCP excluded
  assert.equal(glm.windows.length, 2);
  assert.equal(glm.windows.find((w) => w.window_type === "rolling").remaining_percent, 40);
  assert.equal(glm.windows.find((w) => w.window_type === "weekly").remaining_percent, 13);
  assert.ok(!glm.windows.some((w) => w.window_type === "monthly")); // Monthly is MCP aux
  assert.equal(glm.auxiliary_windows.length, 1);
  assert.equal(glm.auxiliary_windows[0].kind, "mcp");
  assert.equal(glm.auxiliary_windows[0].remaining_percent, 100);
  assert.equal(glm.collector_id, "openclaw_usage_live");
  assert.equal(glm.observed_at, observedAt);
  assert.deepEqual(glm.consumers, ["glm-5.3", "glm-5.3-flash"]); // one shared pool entry, both models
  // PHASE_0_5: codex authority = CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ.
  // OpenClaw codex data above is present + fresh but MUST NOT govern the pool:
  const codex = quotas.pools.chatgpt_codex_subscription;
  assert.equal(quotas.codex_quota_authority, "CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ");
  assert.equal(codex.authority_source, "CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ");
  assert.equal(codex.state, "UNKNOWN"); // no app-server observation -> fail closed
  assert.equal(codex.reason_code, "CODEX_APPSERVER_UNAVAILABLE");
  assert.equal(codex.remaining_percent ?? null, null); // never the OpenClaw 84
  assert.equal(codex.windows.length, 0);
  assert.equal(quotas.openclaw.collector, "openclaw_usage_live");
  assert.ok(!JSON.stringify(quotas).includes("[object Object]"));

  // OpenClaw NOT fresh → falls back to canonical ingest labels, no crash:
  const degraded = await collectQuotaObservatory({
    nowMs: Date.parse("2026-09-09T05:00:00.000Z"),
    collectOpenClaw: async () => ({
      ok: false, freshness: "stale", observed_at: null, cache_hit: false,
      reason_codes: ["OPENCLAW_NOT_FOUND"], emit_contributions: false, contributions: [],
      pools: {
        glm_coding_plan: { state: "unknown", freshness: "stale", reason_code: "OPENCLAW_NOT_FOUND", windows: [], unmapped_windows: [], primary: null },
        chatgpt_codex_subscription: { state: "unknown", freshness: "stale", reason_code: "OPENCLAW_NOT_FOUND", windows: [], unmapped_windows: [], primary: null },
      },
    }),
    composeCanonicalQuotaState: async () => ({
      ok: true,
      joined: {
        pools: {
          glm_coding_plan: { state: "unknown", freshness: "stale", remaining_percent: null, evaluation: "CONSERVE_UNKNOWN_MISSING" },
          chatgpt_codex_subscription: { state: "unknown", freshness: "stale", remaining_percent: null, evaluation: "CONSERVE_UNKNOWN_MISSING" },
        },
      },
      reason_codes: [],
    }),
  });
  assert.equal(degraded.pools.glm_coding_plan.state, "UNKNOWN");
  assert.equal(degraded.pools.glm_coding_plan.collector_id, "rt25_quota_ingest");
  assert.equal(degraded.openclaw.reason_codes[0], "OPENCLAW_NOT_FOUND");
  assert.equal(degraded.pools.chatgpt_codex_subscription.state, "UNKNOWN");
  assert.equal(degraded.pools.chatgpt_codex_subscription.reason_code, "CODEX_APPSERVER_UNAVAILABLE");

  // Collector exception never breaks /v1/resources:
  const resilient = await collectQuotaObservatory({
    nowMs: Date.parse("2026-09-09T05:00:00.000Z"),
    collectOpenClaw: async () => { throw new Error("unexpected"); },
    composeCanonicalQuotaState: async () => ({
      ok: true,
      joined: { pools: {} },
      reason_codes: [],
    }),
  });
  assert.equal(resilient.pools.glm_coding_plan.state, "UNKNOWN");
  assert.equal(resilient.openclaw, null);
});

await test("S59 #73 GET /v1/resources with live OpenClaw wiring stays read-only: no tick, no writes", async () => {
  let dispatch = 0, exec = 0, persist = 0;
  const res = mockRes();
  await handleTickRequest(mockReq("GET", RESOURCES_PATH), res, {
    buildResources: async () => {
      const quotas = await collectQuotaObservatory({
        nowMs: Date.parse("2026-09-09T05:00:00.000Z"),
        collectOpenClaw: async () => ({
          ok: true, freshness: "fresh", observed_at: "2026-09-09T04:59:55.000Z", cache_hit: false,
          reason_codes: [], emit_contributions: true,
          contributions: [{
            schema_version: "v4-resource-status-contribution-v1",
            contribution_id: "openclaw-quota-glm_coding_plan-2026-09-09T04:59:55.000Z",
            producer_id: "collect-openclaw-quota-v1",
            source: "provider_api",
            produced_at: "2026-09-09T04:59:55.000Z",
            resources: { glm: { available: true, quota_remaining: { value: 98, unit: "percent" }, reset_at: "2026-09-09T06:00:00.000Z", cost_mode: "included", location: "cloud", updated_at: "2026-09-09T04:59:55.000Z", evidence: { kind: "source_snapshot", classification: "OPENCLAW_USAGE_LIVE_zai" } } },
          }],
          pools: {
            glm_coding_plan: { state: "available", freshness: "fresh", reason_code: null, windows: [{ window_type: "rolling", label: "Tokens (5h)", remaining_percent: 98, reset_at: "2026-09-09T06:00:00.000Z" }], unmapped_windows: [], primary: { window_type: "rolling", remaining_percent: 98, reset_at: "2026-09-09T06:00:00.000Z" } },
            chatgpt_codex_subscription: { state: "unknown", freshness: "stale", reason_code: "OPENCLAW_PROVIDER_MISSING", windows: [], unmapped_windows: [], primary: null },
          },
        }),
        composeCanonicalQuotaState: async (args) => {
          // The live OpenClaw contribution rides the EXISTING canonical compose:
          assert.equal(args.contributions.length, 1);
          assert.equal(args.contributions[0].producer_id, "collect-openclaw-quota-v1");
          return {
            ok: true,
            joined: { pools: { glm_coding_plan: { state: "available", freshness: "fresh", remaining_percent: 98, evaluation: "POOL_HEALTHY" } } },
            reason_codes: [],
          };
        },
      });
      return {
        schema_version: RESOURCES_SCHEMA,
        read_only: true,
        observed_at: "2026-09-09T05:00:00.000Z",
        workstation: {}, qwen: {}, vps_new: {}, quotas, chatgpt_web: {}, collectors: {},
      };
    },
    tickDeps: {
      runDispatchLoop: () => { dispatch += 1; return { claims: [] }; },
      runExecutor: async () => { exec += 1; return { status: "PASS" }; },
      persistReceipts: () => { persist += 1; },
    },
  });
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.read_only, true);
  assert.equal(body.quotas.pools.glm_coding_plan.state, "AVAILABLE");
  assert.equal(body.quotas.openclaw.collector, "openclaw_usage_live");
  assert.equal(dispatch + exec + persist, 0); // no tick side effects
  // No raw OpenClaw JSON escapes: only bounded normalized pools/meta.
  assert.ok(!JSON.stringify(body).includes("displayName"));
  assert.ok(!JSON.stringify(body).includes('"providers"'));
});

await test("S60 #73 dashboard renders live GLM/Codex windows, plan metadata, OpenClaw source", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false },
    diag: { queue: { eligible_count: 0 }, qwen: { reachable: true, models: [] } },
    resources: {
      schema_version: RESOURCES_SCHEMA,
      workstation: { state: "AVAILABLE" },
      qwen: { occupancy: "IDLE", capacity_label: "Capacità locale — nessuna quota commerciale", commercial_quota: "N/A", collector_label: "qwen probe", loaded_models: [] },
      vps_new: { state: "UNAVAILABLE", reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE", collector_label: "vps probe" },
      quotas: {
        openclaw: { collector: "openclaw_usage_live", observed_at: "2026-09-09T04:59:55.000Z", freshness: "fresh", cache_hit: false, refresh_in_progress: false, reason_codes: [] },
        pools: {
          glm_coding_plan: {
            quota_pool_id: "glm_coding_plan", consumers: ["glm-5.3", "glm-5.3-flash"],
            state: "AVAILABLE", freshness: "fresh", remaining_percent: 13,
            reset_at: "2026-09-11T22:35:05.998Z", observed_at: "2026-09-09T04:59:55.000Z",
            collector_id: "openclaw_usage_live", collector_label: "OpenClaw usage (read-only CLI) / canonical quota state", collector_detail: "OpenClaw / Z.AI usage",
            windows: [
              { window_type: "rolling", label: "Tokens (5h)", remaining_percent: 40, reset_at: "2026-09-09T06:00:00.000Z" },
              { window_type: "weekly", label: "Tokens (Limit)", remaining_percent: 13, reset_at: "2026-09-11T22:35:05.998Z" },
            ],
            auxiliary_windows: [{ kind: "mcp", label: "MCP", remaining_percent: 100, reset_at: "2026-10-04T22:35:05.999Z" }],
            unmapped_windows: [],
          },
          chatgpt_codex_subscription: {
            quota_pool_id: "chatgpt_codex_subscription",
            state: "AVAILABLE", freshness: "fresh", remaining_percent: 84,
            reset_at: "2026-09-16T08:09:21.000Z", observed_at: "2026-09-09T04:59:55.000Z",
            plan: "plus",
            collector_id: "openclaw_usage_live", collector_label: "OpenClaw usage (read-only CLI) / canonical quota state", collector_detail: "OpenClaw / OpenAI Codex usage",
            windows: [
              { window_type: "rolling", label: "5h", remaining_percent: 100, reset_at: "2026-09-09T08:16:18.000Z" },
              { window_type: "weekly", label: "Week", remaining_percent: 84, reset_at: "2026-09-16T08:09:21.000Z" },
            ],
            unmapped_windows: [],
          },
        },
        cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN", labels: {}, collector_label: "manual" },
      },
      chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false, collector_label: "hermes" },
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /5h[\s\S]{0,240}40(?:[.,]0)?%/);
  assert.match(out, /Settim\.[\s\S]{0,240}13(?:[.,]0)?%/);
  assert.match(out, /MCP \(ausiliario\):\s*100(?:[.,]0)?%|MCP[\s\S]{0,80}non influenza capacità modello/);
  assert.match(out, /5h[\s\S]{0,240}100(?:[.,]0)?%/);
  assert.match(out, /Settim\.[\s\S]{0,240}84(?:[.,]0)?%/);
  assert.match(out, /class="res-main info">Disponibile/);
  assert.doesNotMatch(out, /Effettivo/);
  assert.match(out, /Piano: plus/i);
  assert.match(out, /OpenClaw \/ Z\.AI usage/);
  assert.match(out, /OpenClaw \/ OpenAI Codex usage/);
  assert.match(out, /Pool unico: glm_coding_plan/);
  assert.match(out, /glm-5\.3, glm-5\.3-flash/);
  assert.match(out, /Settim\./);
  assert.match(out, /MCP \(ausiliario\)/);
  assert.doesNotMatch(out, /Mensile:/);
  assert.doesNotMatch(out, /\$0\.00/);
  assert.doesNotMatch(out, /\[object Object\]/);
});

await test("S61 #73 dashboard pools without windows keep legacy canonical rendering", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false },
    diag: { queue: { eligible_count: 0 }, qwen: {} },
    resources: {
      schema_version: RESOURCES_SCHEMA,
      workstation: {}, qwen: {}, vps_new: {},
      quotas: {
        pools: {
          glm_coding_plan: { quota_pool_id: "glm_coding_plan", consumers: ["glm-5.3", "glm-5.3-flash"], state: "UNKNOWN", freshness: "stale", collector_label: "rt25 quota ingest / canonical quota state" },
          chatgpt_codex_subscription: { quota_pool_id: "chatgpt_codex_subscription", state: "UNKNOWN", freshness: "stale", collector_label: "rt25 quota ingest / canonical quota state" },
        },
        cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN", labels: {} },
      },
      chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /Pool unico: glm_coding_plan/);
  assert.match(out, /Pool: chatgpt_codex_subscription/);
  assert.doesNotMatch(out, /5h: \d+ % residuo/);
  assert.doesNotMatch(out, /Settimanale: \d+ % residuo/);
  assert.doesNotMatch(out, /\[object Object\]/);
});

await test("S62 #73 laws preserved: Cursor UNVERIFIED, ChatGPT Web not unlimited, Qwen LOCAL_COMPUTE, no POST tick", async () => {
  const quotas = await collectQuotaObservatory({
    nowMs: Date.parse("2026-09-09T05:00:00.000Z"),
    collectOpenClaw: async () => ({
      ok: true, freshness: "fresh", observed_at: "2026-09-09T04:59:55.000Z",
      emit_contributions: true, contributions: [], pools: {
        glm_coding_plan: { state: "available", freshness: "fresh", windows: [], unmapped_windows: [], primary: null },
        chatgpt_codex_subscription: { state: "available", freshness: "fresh", windows: [], unmapped_windows: [], primary: null },
      },
    }),
    composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
  });
  assert.equal(quotas.cursor.accounting_mapping, "UNVERIFIED"); // unchanged
  assert.equal(quotas.qwen_local.commercial_quota, "N/A"); // LOCAL_COMPUTE unchanged
  const web = await collectChatgptWebObservation({});
  assert.equal(web.unlimited, false);
  assert.equal(web.free, false); // ChatGPT Web never unlimited/free
  assert.equal(web.availability_domain, "SEPARATE_AVAILABILITY_DOMAIN");
  assert.ok(!/"unlimited"\s*:\s*true/.test(JSON.stringify(web)));
  // No POST /tick is ever issued by the observatory path:
  const res = mockRes();
  await handleTickRequest(mockReq("POST", RESOURCES_PATH, "{}"), res, {});
  assert.equal(res.status, 405);
});

await test("S63 #73 merge law: OpenClaw live + ingest-lane contributions BOTH reach the canonical composer", async () => {
  const observedAt = "2026-09-09T04:59:55.000Z";
  const openclawContribution = {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "openclaw-quota-glm_coding_plan-" + observedAt,
    producer_id: "collect-openclaw-quota-v1",
    source: "provider_api",
    produced_at: observedAt,
    resources: { glm: { available: true, quota_remaining: { value: 76, unit: "percent" }, reset_at: "2026-09-09T10:03:41.662Z", cost_mode: "included", location: "cloud", updated_at: observedAt, evidence: { kind: "source_snapshot", classification: "OPENCLAW_USAGE_LIVE_zai" } } },
  };
  const ingestLaneDir = mkdtempSync(join(tmpdir(), "oc-ingest-lane-"));
  try {
    const ingestDecision = {
      schema_version: "v4-rt25-quota-ingest-result-v1",
      ok: true,
      contribution: {
        schema_version: "v4-resource-status-contribution-v1",
        contribution_id: "rt25-glm-quota-glm_coding_plan-2026-09-09T04:50:00.000Z",
        producer_id: "rt25-quota-ingest-glm-v1",
        source: "dashboard_snapshot",
        produced_at: "2026-09-09T04:50:00.000Z",
        resources: { glm: { available: true, quota_remaining: { value: 60, unit: "percent" }, reset_at: "2026-09-09T10:00:00.000Z", cost_mode: "included", location: "cloud", updated_at: "2026-09-09T04:50:00.000Z", evidence: { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" } } },
      },
    };
    writeFileSync(join(ingestLaneDir, "glm-quota-decision.json"), JSON.stringify(ingestDecision));
    let seen = null;
    const quotas = await collectQuotaObservatory({
      nowMs: Date.parse("2026-09-09T05:00:00.000Z"),
      ingestDir: ingestLaneDir,
      collectOpenClaw: async () => ({
        ok: true, freshness: "fresh", observed_at: observedAt, cache_hit: false,
        reason_codes: [], emit_contributions: true,
        contributions: [openclawContribution],
        pools: {
          glm_coding_plan: { state: "available", freshness: "fresh", reason_code: null, windows: [{ window_type: "rolling", label: "Tokens (5h)", remaining_percent: 76, reset_at: "2026-09-09T10:03:41.662Z" }], unmapped_windows: [], primary: { window_type: "rolling", remaining_percent: 76, reset_at: "2026-09-09T10:03:41.662Z" } },
          chatgpt_codex_subscription: { state: "unknown", freshness: "stale", reason_code: "OPENCLAW_PROVIDER_MISSING", windows: [], unmapped_windows: [], primary: null },
        },
      }),
      composeCanonicalQuotaState: async (args) => {
        seen = args;
        return {
          ok: true,
          joined: { pools: { glm_coding_plan: { state: "available", freshness: "fresh", remaining_percent: 76, evaluation: "POOL_HEALTHY" } } },
          reason_codes: [],
        };
      },
    });
    // BOTH lanes merged — the ingest-lane observation is NOT silently discarded:
    const ids = seen.contributions.map((c) => c.contribution_id);
    assert.ok(ids.includes("rt25-glm-quota-glm_coding_plan-2026-09-09T04:50:00.000Z"));
    assert.ok(ids.includes("openclaw-quota-glm_coding_plan-" + observedAt));
    assert.equal(ids.length, 2);
    assert.equal(quotas.pools.glm_coding_plan.remaining_percent, 76);
    assert.equal(quotas.pools.glm_coding_plan.collector_id, "openclaw_usage_live");
  } finally {
    rmSync(ingestLaneDir, { recursive: true, force: true });
  }
});

await test("S70 D-9408-A classifyHealthBar: util high worse; quota remaining low worse; temp; unknown neutral", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: {} });
  const utilLow = dashboard.evaluate("classifyHealthBar('util', 40)");
  const utilHigh = dashboard.evaluate("classifyHealthBar('util', 95)");
  assert.equal(utilLow.tone, "ok");
  assert.equal(utilHigh.tone, "danger");
  assert.ok(utilHigh.tone !== "ok");
  const quotaHigh = dashboard.evaluate("classifyHealthBar('quota_remaining', 80)");
  const quotaLow = dashboard.evaluate("classifyHealthBar('quota_remaining', 5)");
  assert.equal(quotaHigh.tone, "ok");
  assert.equal(quotaLow.tone, "danger");
  const tempOk = dashboard.evaluate("classifyHealthBar('temp_c', 50)");
  const tempHot = dashboard.evaluate("classifyHealthBar('temp_c', 90)");
  assert.equal(tempOk.tone, "ok");
  assert.equal(tempHot.tone, "danger");
  const unknown = dashboard.evaluate("classifyHealthBar('util', null)");
  const stale = dashboard.evaluate("classifyHealthBar('util', 10, { stale: true })");
  const missing = dashboard.evaluate("classifyHealthBar('vram', undefined)");
  assert.equal(unknown.tone, "neutral");
  assert.equal(stale.tone, "neutral");
  assert.equal(missing.tone, "neutral");
  assert.notEqual(unknown.tone, "ok");
  assert.notEqual(stale.tone, "ok");
  const vram = dashboard.evaluate("classifyHealthBar('vram', 96)");
  const disk = dashboard.evaluate("classifyHealthBar('disk_free', 3)");
  assert.equal(vram.tone, "danger");
  assert.equal(disk.tone, "danger");
});

await test("S71 D-9408-A dashboard compact health: qwen no fake 100%; cursor no fabricated %; chatgpt never unlimited; MCP not effective; queue collapsed; layout; candidate precedes resources", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false, classification: "IDLE_CLEAN" },
    diag: {
      queue: { eligible_count: 1, claim_present_count: 0, scanned_file_count: 4, candidate_task_ref: "LOCAL_DEV_B_D-9408-A" },
      qwen: { reachable: true, models: [] },
      last_tick: { classification: "IDLE_CLEAN", reason_codes: ["CLAIM_ALREADY_EXISTS"] },
    },
    resources: {
      schema_version: RESOURCES_SCHEMA,
      workstation: {
        state: "AVAILABLE",
        cpu_percent: 92,
        ram_percent: 55,
        system_disk_percent: 18,
        system_disk_free_bytes: 40_000_000_000,
        logical_cpu_count: 16,
        observed_at: "2026-09-09T00:00:00Z",
        freshness: "fresh",
        collector_label: "Node.js dispatcher / Windows OS",
        gpu: {
          state: "AVAILABLE",
          gpu_name: "RTX",
          gpu_util_percent: 40,
          vram_used_mb: 1000,
          vram_total_mb: 8000,
          temperature_c: 70,
          freshness: "fresh",
          collector_label: "nvidia-smi",
        },
      },
      qwen: {
        occupancy: "IDLE",
        capacity_label: "Capacità locale — nessuna quota commerciale",
        commercial_quota: "N/A",
        collector_label: "qwen probe",
        loaded_models: [],
      },
      vps_new: { state: "UNAVAILABLE", reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE", collector_label: "vps probe" },
      quotas: {
        pools: {
          glm_coding_plan: {
            quota_pool_id: "glm_coding_plan",
            consumers: ["glm-5.3", "glm-5.3-flash"],
            state: "AVAILABLE",
            freshness: "fresh",
            remaining_percent: 42,
            windows: [
              { window_type: "rolling", remaining_percent: 55 },
              { window_type: "weekly", remaining_percent: 42 },
            ],
            auxiliary_windows: [{ kind: "mcp", remaining_percent: 99, label: "MCP" }],
            collector_label: "openclaw",
          },
          chatgpt_codex_subscription: {
            quota_pool_id: "chatgpt_codex_subscription",
            state: "AVAILABLE",
            freshness: "fresh",
            remaining_percent: 12,
            windows: [
              { window_type: "rolling", remaining_percent: 30 },
              { window_type: "weekly", remaining_percent: 12 },
            ],
            collector_label: "openclaw",
          },
        },
        cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN", labels: {}, collector_label: "manual", freshness: "stale" },
      },
      chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false, collector_label: "hermes" },
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(dashboard.html, /id="sec-ops"|id="ops-row"/);
  assert.match(dashboard.html, /id="sec-resources"/);
  assert.match(dashboard.html, /Task attivo \/ ultimo terminato/);
  assert.match(dashboard.html, /Stato \/ motivo/);
  assert.match(dashboard.html, /Ultimo ciclo completato/);
  assert.doesNotMatch(dashboard.html, /Qwen e runtime|why-title|Perché il sistema è in questo stato/);
  assert.doesNotMatch(dashboard.html, /data-move-up|data-move-down|>▲<|>▼</);
  assert.match(dashboard.html, /<details class="panel queue-panel" id="queue-panel"/);
  assert.doesNotMatch(dashboard.html, /<details class="panel queue-panel" id="queue-panel"[^>]*\sopen\b/);
  assert.equal(dashboard.element("queue-panel").open, false);
  assert.match(dashboard.html, /id="reset-layout"/);
  assert.match(out, /Macchina locale/);
  assert.match(out, /Nessuna quota commerciale|Capacità locale — nessuna quota commerciale/);
  assert.doesNotMatch(out, /Qwen[\s\S]{0,120}100\s*%/);
  assert.match(out, /MANUAL_ONLY|UNVERIFIED|percentuale non inventata/i);
  assert.doesNotMatch(out, /Cursor Models:\s*100/);
  assert.doesNotMatch(out, /Illimitato:\s*No|Infinito:\s*No|ChatGPT Web/);
  assert.doesNotMatch(out, /\bunlimited\b|\binfinite\b|\bgratuito illimitato\b/i);
  assert.match(out, /MCP \(ausiliario\)|non influenza capacità modello/);
  assert.match(out, /Residuo effettivo|Effettivo|hbar-fill danger/);
  assert.doesNotMatch(out, /Residuo effettivo[\s\S]{0,80}99/);
  assert.doesNotMatch(out, /\[object Object\]/);
  assert.match(out, /hbar-fill danger/);
  // Visible bar markup must not show severity words (aria/title may still carry them).
  const barChunks = out.match(/<div class="hbar"[^>]*>[\s\S]*?<\/div><\/div><span class="hbar-val[^"]*">[^<]*<\/span><\/div>/g) || [];
  for (const chunk of barChunks) {
    const visible = chunk.replace(/\s(?:aria-label|title)="[^"]*"/g, "");
    assert.doesNotMatch(visible, /\b(?:OK|ATTENZIONE|ELEVATO|CRITICO|HEALTHY|WARNING|DANGER)\b/);
  }
  // Layout persistence (browser-local only)
  dashboard.evaluate("storageSet(LAYOUT_KEY, JSON.stringify(['queue','agentops']))");
  dashboard.evaluate("applySectionOrder(readSavedOrder())");
  assert.equal(JSON.stringify(dashboard.evaluate("readSavedOrder()")), JSON.stringify(["queue", "agentops"]));
  assert.equal(dashboard.localStore.get("local-dev-dispatcher-dashboard-v1:section-order"), JSON.stringify(["queue", "agentops"]));
  dashboard.evaluate("resetLayout()");
  assert.equal(JSON.stringify(dashboard.evaluate("readSavedOrder()")), JSON.stringify(["agentops", "queue"]));
  assert.equal(dashboard.localStore.has("local-dev-dispatcher-dashboard-v1:section-order"), false);
  // Invalid saved IDs fall back safely
  dashboard.evaluate("storageSet(LAYOUT_KEY, JSON.stringify(['legacy','bogus','resources']))");
  assert.equal(JSON.stringify(dashboard.evaluate("readSavedOrder()")), JSON.stringify(["agentops", "queue"]));
});

await test("S72 D-9408-B disk free derived from used percent and free/total bytes", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: { queue: {}, qwen: {} } });
  const used10 = dashboard.evaluate("deriveDiskFreePercent({ system_disk_percent: 10 })");
  const used90 = dashboard.evaluate("deriveDiskFreePercent({ system_disk_percent: 90 })");
  const used97 = dashboard.evaluate("deriveDiskFreePercent({ system_disk_percent: 97 })");
  assert.equal(used10, 90);
  assert.equal(used90, 10);
  assert.equal(used97, 3);
  assert.equal(dashboard.evaluate("classifyHealthBar('disk_free', deriveDiskFreePercent({ system_disk_percent: 10 })).tone"), "ok");
  assert.equal(dashboard.evaluate("classifyHealthBar('disk_free', deriveDiskFreePercent({ system_disk_percent: 90 })).tone"), "caution");
  assert.equal(dashboard.evaluate("classifyHealthBar('disk_free', deriveDiskFreePercent({ system_disk_percent: 97 })).tone"), "danger");
  const fromBytes = dashboard.evaluate("deriveDiskFreePercent({ system_disk_free_bytes: 25, system_disk_total_bytes: 100, system_disk_percent: 99 })");
  assert.equal(fromBytes, 25);
  assert.equal(dashboard.evaluate("deriveDiskFreePercent({})"), null);
  assert.equal(dashboard.evaluate("deriveDiskFreePercent({ system_disk_free_bytes: 10 })"), null);
  assert.equal(dashboard.evaluate("classifyHealthBar('disk_free', deriveDiskFreePercent({}), { unknown: true }).tone"), "neutral");

  async function renderDisk(workstation) {
    dashboard.setScenario({
      status: { active: false },
      diag: { queue: { eligible_count: 0 }, qwen: {} },
      resources: {
        schema_version: RESOURCES_SCHEMA,
        workstation: { state: "AVAILABLE", freshness: "fresh", collector_label: "ws", ...workstation },
        qwen: { occupancy: "IDLE", capacity_label: "Capacità locale — nessuna quota commerciale", commercial_quota: "N/A" },
        vps_new: { state: "UNAVAILABLE" },
        quotas: { pools: {} },
        chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
      },
    });
    dashboard.htmlWrites.length = 0;
    await dashboard.evaluate("refresh()");
    await dashboard.settle();
    return dashboardText(dashboard);
  }

  const greenOut = await renderDisk({ system_disk_percent: 10 });
  assert.match(greenOut, /aria-label="Disco: 90(?:[.,]0)?%/);
  assert.match(greenOut, /hbar-label">Disco<\/span>[\s\S]{0,160}hbar-fill ok/);
  assert.match(greenOut, /usati \(system_disk_percent\):\s*10(?:[.,]0)?%/);
  assert.doesNotMatch(greenOut, /aria-label="Disco: 10(?:[.,]0)?%/);

  const orangeOut = await renderDisk({ system_disk_percent: 90 });
  assert.match(orangeOut, /aria-label="Disco: 10(?:[.,]0)?%/);
  assert.match(orangeOut, /hbar-label">Disco<\/span>[\s\S]{0,160}hbar-fill caution/);
  assert.match(orangeOut, /usati \(system_disk_percent\):\s*90(?:[.,]0)?%/);

  const redOut = await renderDisk({ system_disk_percent: 97 });
  assert.match(redOut, /aria-label="Disco: 3(?:[.,]0)?%/);
  assert.match(redOut, /hbar-label">Disco<\/span>[\s\S]{0,160}hbar-fill danger/);

  const bytesOut = await renderDisk({
    system_disk_free_bytes: 40_000_000_000,
    system_disk_total_bytes: 100_000_000_000,
    system_disk_percent: 99,
  });
  assert.match(bytesOut, /aria-label="Disco: 40(?:[.,]0)?%/);
  assert.match(bytesOut, /hbar-label">Disco<\/span>[\s\S]{0,160}hbar-fill ok/);
  assert.doesNotMatch(bytesOut, /aria-label="Disco: 99(?:[.,]0)?%/);

  const missingOut = await renderDisk({ ram_percent: 20 });
  assert.match(missingOut, /aria-label="Disco: —, Sconosciuto"/);
  assert.match(missingOut, /hbar-label">Disco<\/span>[\s\S]{0,160}hbar-fill neutral/);
  assert.doesNotMatch(missingOut, /hbar-label">Disco<\/span>[\s\S]{0,160}hbar-fill ok/);
});

await test("S73 D-9408-C resource cards: no visible severity words; six-col grid; collapsible meta", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false },
    diag: { queue: { eligible_count: 0 }, qwen: { reachable: true, models: [] } },
    resources: {
      schema_version: RESOURCES_SCHEMA,
      workstation: {
        state: "AVAILABLE", freshness: "fresh", cpu_percent: 20.6, ram_percent: 81.9,
        system_disk_percent: 96.2, collector_label: "ws",
        gpu: { state: "AVAILABLE", gpu_util_percent: 0, vram_used_mb: 7680, vram_total_mb: 8000, temperature_c: 36, freshness: "fresh" },
      },
      qwen: { occupancy: "IDLE", capacity_label: "Capacità locale — nessuna quota commerciale", commercial_quota: "N/A", loaded_models: [] },
      vps_new: { state: "UNAVAILABLE", reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE" },
      quotas: {
        pools: {
          glm_coding_plan: {
            state: "AVAILABLE", freshness: "fresh", remaining_percent: 42,
            windows: [{ window_type: "rolling", remaining_percent: 55 }, { window_type: "weekly", remaining_percent: 42 }],
            auxiliary_windows: [{ kind: "mcp", remaining_percent: 99 }],
            consumers: ["glm-5.3", "glm-5.3-flash"], collector_label: "openclaw",
          },
          chatgpt_codex_subscription: {
            state: "AVAILABLE", freshness: "fresh", remaining_percent: 12,
            windows: [{ window_type: "rolling", remaining_percent: 30 }, { window_type: "weekly", remaining_percent: 12 }],
            collector_label: "openclaw",
          },
        },
        cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN", labels: {}, freshness: "stale" },
      },
      chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(dashboard.html, /\.res-grid\{[^}]*grid-template-columns:repeat\(6,/);
  assert.match(out, /class="res-grid"/);
  assert.match(out, /class="res-tile/);
  assert.match(out, /Macchina locale/);
  assert.match(out, /Qwen locale/);
  assert.match(out, /VPS/);
  assert.match(out, /\bGLM\b/);
  assert.match(out, /Codex/);
  assert.match(out, /Cursor/);
  assert.doesNotMatch(out, /ChatGPT Web/);
  assert.match(out, /hbar-label">CPU<\/span>[\s\S]{0,200}20(?:[.,]6)?%/);
  assert.match(out, /hbar-label">RAM<\/span>[\s\S]{0,200}81(?:[.,]9)?%/);
  assert.match(out, /hbar-label">5h<\/span>[\s\S]{0,200}55(?:[.,]0)?%/);
  assert.match(out, /hbar-label">Settim\.<\/span>[\s\S]{0,200}42(?:[.,]0)?%/);
  assert.doesNotMatch(out, /Effettivo/);
  assert.match(out, /Nessuna quota commerciale/);
  assert.doesNotMatch(out, /Qwen[\s\S]{0,120}100%/);
  assert.match(out, /MANUAL_ONLY|UNVERIFIED/);
  assert.doesNotMatch(out, /Illimitato:\s*No|Infinito:\s*No|ChatGPT Web/);
  assert.doesNotMatch(out, /\bunlimited\b|\binfinite\b/i);
  assert.match(out, /details class="res-more"/);
  assert.match(out, /Fonte \/ Collector/);
  const bars = out.match(/<div class="hbar"[^>]*>[\s\S]*?<\/div><\/div><span class="hbar-val[^"]*">[^<]*<\/span><\/div>/g) || [];
  assert.ok(bars.length >= 6, "machine + quota bars present");
  for (const chunk of bars) {
    assert.doesNotMatch(chunk, /hbar-status/);
    const visible = chunk.replace(/\s(?:aria-label|title)="[^"]*"/g, "");
    assert.doesNotMatch(visible, /\b(?:OK|ATTENZIONE|ELEVATO|CRITICO|HEALTHY|WARNING|DANGER|SCONOSCIUTO)\b/);
    assert.match(visible, /hbar-val[^>]*>[^<]+</);
  }
  assert.equal(dashboard.evaluate("classifyHealthBar('util', 95).tone"), "danger");
  assert.equal(dashboard.evaluate("classifyHealthBar('quota_remaining', 5).tone"), "danger");
  assert.equal(dashboard.element("queue-panel").open, false);
  assert.match(dashboard.html, /id="reset-layout"/);
  assert.doesNotMatch(dashboard.html, /Qwen e runtime|data-move-up|data-move-down|>▲<|>▼</);
  assert.match(dashboard.html, /\.ops-row\{[^}]*grid-template-columns:repeat\(3,/);
});

await test("S74 D-9408-D consolidated ops row: 3 cards; Qwen merged; no arrows; no hero", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false, classification: "IDLE_CLEAN" },
    diag: {
      queue: { eligible_count: 0, claim_present_count: 29, scanned_file_count: 40, candidate_task_ref: null },
      qwen: { reachable: true, models: [{ id: "qwen38-opus-q3-opencode-64k", status: "loaded", meta: { n_ctx: 65536 } }] },
      last_tick: { classification: "IDLE_CLEAN", recorded_at: "2026-09-09T13:30:42.000Z", execution_performed: false, elapsed_ms: 1000, reason_codes: ["NO_ELIGIBLE_READY"] },
      explanation: { headline: "Nessun task eseguibile in questo momento.", detail: "La coda è stata controllata.", operator_action: "Attendere.", action_required: false, severity: "info", why_code: "NO_ELIGIBLE_READY" },
    },
    resources: {
      schema_version: RESOURCES_SCHEMA,
      workstation: { state: "AVAILABLE", freshness: "fresh", cpu_percent: 20.6, ram_percent: 50 },
      qwen: { occupancy: "LOADED", capacity_label: "Capacità locale — nessuna quota commerciale", commercial_quota: "N/A", reachable: true, loaded_models: [{ id: "qwen38-opus-q3-opencode-64k", status: "loaded", context_tokens: 65536 }] },
      vps_new: { state: "UNAVAILABLE" },
      quotas: { pools: {}, cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN", labels: {} } },
      chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(dashboard.html, /id="ops-row"|class="ops-row"/);
  assert.match(dashboard.html, /\.ops-row\{[^}]*grid-template-columns:repeat\(3,/);
  assert.match(dashboard.html, /Task attivo \/ ultimo terminato/);
  assert.match(dashboard.html, /Stato \/ motivo/);
  assert.match(dashboard.html, /Ultimo ciclo completato/);
  assert.match(out, /NO_ELIGIBLE_READY/);
  assert.match(out, /29 bloccati da receipt|29<\/strong>claim|29/);
  assert.match(out, /Qwen locale/);
  assert.match(out, /qwen38-opus-q3-opencode-64k/);
  assert.match(out, /Endpoint raggiungibile|Nessuna quota commerciale/);
  assert.match(out, /Catalogo modelli|Contesto:/);
  assert.doesNotMatch(dashboard.html, /id="qwen-title"|Qwen e runtime/);
  assert.doesNotMatch(dashboard.html, /Perché il sistema è in questo stato|id="why-title"|class="panel hero/);
  assert.doesNotMatch(dashboard.html, /data-move-up|data-move-down|>▲<|>▼</);
  assert.match(dashboard.html, /sec-handle|data-drag=/);
  assert.doesNotMatch(dashboard.html, /id="sec-candidate"/);
  assert.ok(/id="ops-task-card"[\s\S]*id="ops-state-card"[\s\S]*id="ops-tick-card"/.test(dashboard.html));
  assert.match(dashboard.html, /id="ops-task-card"/);
  assert.match(dashboard.html, /id="ops-state-card"/);
  assert.match(dashboard.html, /id="ops-tick-card"/);
  assert.equal(dashboard.element("queue-panel").open, false);
  assert.doesNotMatch(out, /\[object Object\]/);
  assert.doesNotMatch(dashboard.html, /\u00e2\u20ac|\uFFFD/);
  assert.match(out, /CLAIM_ALREADY_EXISTS|NO_ELIGIBLE_READY|Intervento umano: No/);
  assert.doesNotMatch(out, /Qwen[\s\S]{0,80}100%/);
  assert.match(out, /UNVERIFIED|MANUAL_ONLY/);
  assert.doesNotMatch(out, /Illimitato:\s*No|Infinito:\s*No|ChatGPT Web/);
});

await test("S75 D-9408-E six resource cards on one wide-desktop row with canonical reorder", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false },
    diag: { queue: { eligible_count: 0 }, qwen: { reachable: true, models: [] } },
    resources: {
      schema_version: RESOURCES_SCHEMA,
      workstation: { state: "AVAILABLE", freshness: "fresh", cpu_percent: 10, ram_percent: 40 },
      qwen: { occupancy: "IDLE", capacity_label: "Capacità locale — nessuna quota commerciale", commercial_quota: "N/A", reachable: true, loaded_models: [] },
      vps_new: { state: "UNAVAILABLE" },
      quotas: {
        pools: {
          glm_coding_plan: { state: "AVAILABLE", remaining_percent: 50, windows: [{ window_type: "rolling", remaining_percent: 50 }, { window_type: "weekly", remaining_percent: 50 }], auxiliary_windows: [{ kind: "mcp", remaining_percent: 90 }] },
          chatgpt_codex_subscription: { state: "AVAILABLE", remaining_percent: 20, windows: [{ window_type: "rolling", remaining_percent: 40 }, { window_type: "weekly", remaining_percent: 20 }] },
        },
        cursor: { accounting_mapping: "MANUAL_ONLY", state: "UNKNOWN", labels: {} },
      },
      chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(dashboard.html, /\.res-grid\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(dashboard.html, /@media\(max-width:(?:1680|1480|1280)px\)\{\.res-grid\{grid-template-columns:repeat\((?:6|5|4),/);
  assert.match(dashboard.html, /@media\(max-width:1200px\)\{[\s\S]*?\.res-grid\{grid-template-columns:repeat\(3,/);
  assert.match(dashboard.html, /@media\(max-width:900px\)\{[\s\S]*?\.res-grid\{grid-template-columns:repeat\(2,/);
  assert.match(dashboard.html, /@media\(max-width:620px\)\{[\s\S]*?\.res-grid\{grid-template-columns:1fr/);
  assert.match(dashboard.html, /\.res-tile\{[^}]*min-height:150px/);
  assert.match(dashboard.html, /\.ops-row\{[^}]*grid-template-columns:repeat\(3,/);
  const titles = ["Macchina locale", "VPS", "Qwen locale", "GLM", "Codex", "Cursor"];
  for (const title of titles) assert.match(out, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(out, /ChatGPT Web/);
  const resourcesHtml = [...dashboard.htmlWrites].filter((write) => write.id === "resources-cards").at(-1)?.value || "";
  assert.equal((resourcesHtml.match(/class="res-tile/g) || []).length, 6);
  assert.match(resourcesHtml, /data-resource="qwen"/);
  assert.deepEqual([...resourcesHtml.matchAll(/data-resource="([^"]+)"/g)].map((match) => match[1]), ["workstation", "vps", "qwen", "glm", "codex", "cursor"]);
  assert.doesNotMatch(resourcesHtml, /data-resource="chatgpt_web"/);
  assert.match(resourcesHtml, /data-resource-drag="workstation"/);
  assert.match(resourcesHtml, /data-resource-drag="cursor"/);
  assert.equal(JSON.stringify(dashboard.evaluate("mergeResourceOrder(['chatgpt_web','qwen','qwen','future','workstation'], ['workstation','vps','qwen','glm','codex','cursor','future'])")), JSON.stringify(["qwen", "future", "workstation", "vps", "glm", "codex", "cursor"]));
  assert.equal(JSON.stringify(dashboard.evaluate("mergeResourceOrder(['chatgpt_web','qwen','qwen'], CANONICAL_RESOURCES)")), JSON.stringify(["qwen", "workstation", "vps", "glm", "codex", "cursor"]));
  dashboard.evaluate("storageSet(RESOURCE_LAYOUT_KEY, JSON.stringify(['cursor','vps','chatgpt_web']))");
  assert.equal(JSON.stringify(dashboard.evaluate("readSavedResourceOrder()")), JSON.stringify(["cursor", "vps", "workstation", "qwen", "glm", "codex"]));
  dashboard.evaluate("resetLayout()");
  assert.equal(JSON.stringify(dashboard.evaluate("readSavedResourceOrder()")), JSON.stringify(["workstation", "vps", "qwen", "glm", "codex", "cursor"]));
  assert.equal(dashboard.localStore.has("local-dev-dispatcher-dashboard-v1:resource-order"), false);
  assert.doesNotMatch(dashboard.html, /Qwen e runtime|id="qwen-title"/);
  assert.doesNotMatch(dashboard.html, /data-move-up|data-move-down|>▲<|>▼</);
  assert.match(dashboard.html, /id="ops-task-card"/);
  assert.match(dashboard.html, /id="ops-state-card"/);
  assert.match(dashboard.html, /id="ops-tick-card"/);
  const bars = out.match(/<div class="hbar"[^>]*>[\s\S]*?<\/div><\/div><span class="hbar-val[^"]*">[^<]*<\/span><\/div>/g) || [];
  for (const chunk of bars) {
    const visible = chunk.replace(/\s(?:aria-label|title)="[^"]*"/g, "");
    assert.doesNotMatch(visible, /\b(?:OK|ATTENZIONE|ELEVATO|CRITICO|HEALTHY|WARNING|DANGER|SCONOSCIUTO)\b/);
  }
  assert.doesNotMatch(out, /\[object Object\]/);
});

// S76–S81: V4_WF90_2MIN_DASHBOARD_COUNTDOWN_AND_D9410A_UNBLOCK_V1 —
// WF90 tick_clock diagnostics law + dashboard operational strip laws.
await test("S76 tick_clock: WF90 interval constant is 120s and diagnostics expose last/next tick anchored on the real last tick", async () => {
  assert.equal(WF90_INTERVAL_SECONDS, 120, "WF90 live cadence must be 2 minutes");
  const tracker = createExecutionStatusTracker();
  const lastTick = createLastTickStore();
  lastTick.record(
    { ok: false, classification: "HUMAN_GATE_REQUIRED", request_id: "s76-req", task_ref: null, reason_codes: ["TRACKED_DIRTY_CONFLICT"], human_gate_required: true, gate_summary: "tracked dirty: 2 file(s)" },
    { recorded_at: "2026-09-15T22:10:40.808Z", elapsed_ms: 906 },
  );
  const diag = await buildDiagnostics({
    statusTracker: tracker,
    lastTickStore: lastTick,
    scanQueue: () => [],
    loadReceipts: () => [],
    probeQwen: async () => ({ reachable: null }),
    nowIso: () => "2026-09-15T22:11:00.000Z",
  });
  assert.equal(diag.tick_clock.schema_version, "local-dev-dispatch-tick-clock-v1");
  assert.equal(diag.tick_clock.wf90_interval_seconds, 120);
  assert.equal(diag.tick_clock.last_observed_tick_at, "2026-09-15T22:10:40.808Z");
  assert.equal(diag.tick_clock.next_expected_tick_at, "2026-09-15T22:12:40.808Z", "next = last real tick + 120000ms");
  // No tick observed yet -> both anchors null (never invented).
  const diagEmpty = await buildDiagnostics({
    statusTracker: tracker,
    lastTickStore: createLastTickStore(),
    scanQueue: () => [],
    loadReceipts: () => [],
    probeQwen: async () => ({ reachable: null }),
    nowIso: () => "2026-09-15T22:11:00.000Z",
  });
  assert.equal(diagEmpty.tick_clock.last_observed_tick_at, null);
  assert.equal(diagEmpty.tick_clock.next_expected_tick_at, null);
});

await test("S77 dashboard countdown arithmetic: next = last + 120s; MM:SS while positive; ATTESA TICK N8N at zero without realign", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: {} });
  const clockAt = (lastMs) => JSON.stringify({
    tick_clock: { wf90_interval_seconds: 120, last_observed_tick_at: new Date(lastMs).toISOString(), next_expected_tick_at: new Date(lastMs + 120_000).toISOString() },
    last_tick: { recorded_at: new Date(lastMs).toISOString() },
  });
  const last = Date.now() - 73_000;
  dashboard.evaluate(`renderOpstripMeta(${clockAt(last)})`);
  dashboard.evaluate("renderOpstripCountdown()");
  const value = dashboard.element("op-countdown");
  assert.match(value.textContent, /^0[0-2]:[0-5]\d$/, "positive remainder renders MM:SS (~00:47)");
  assert.ok(value.textContent <= "02:00" && value.textContent > "00:30", "arithmetic inside expected window");
  // Zero crossing without a new real tick: waits, never restarts synthetic countdown.
  dashboard.evaluate(`renderOpstripMeta(${clockAt(Date.now() - 130_000)})`);
  dashboard.evaluate("renderOpstripCountdown()");
  assert.equal(dashboard.element("op-countdown").textContent, "ATTESA TICK N8N");
  assert.match(dashboard.element("op-countdown-sub").textContent, /nessun tick reale ancora osservato/);
  // Real tick realign: new timestamp resets the countdown from it.
  dashboard.evaluate(`renderOpstripMeta(${clockAt(Date.now() - 5000)})`);
  dashboard.evaluate("renderOpstripCountdown()");
  assert.match(dashboard.element("op-countdown").textContent, /^01:5[0-9]$/, "realigned to ~01:55 from new real tick");
  assert.notEqual(dashboard.element("op-last-tick").textContent, "Non disponibile");
  assert.match(dashboard.element("op-interval").textContent, /2 minuti/);
});

await test("S78 phase rail maps real dispatcher fields only; HUMAN GATE terminal state visible with exact reason", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: {} });
  // IDLE -> ATTESA
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} });
  let rail = [...dashboard.htmlWrites].filter((w) => w.id === "op-rail").at(-1)?.value || "";
  assert.match(rail, /rail-step current[^"]*"[^>]*>\s*<span class="rdot"[^>]*><\/span>ATTESA/);
  // Active EXECUTING -> EXECUTOR
  dashboard.render({ active: true, phase: "EXECUTING", task_ref: "LOCAL_DEV_B_D-9410-A", elapsed_ms: 92000 }, { last_tick: {}, queue: {} });
  rail = [...dashboard.htmlWrites].filter((w) => w.id === "op-rail").at(-1)?.value || "";
  assert.match(rail, /current[^>]*>\s*<span class="rdot"[^>]*><\/span>EXECUTOR/);
  const taskHtml = [...dashboard.htmlWrites].filter((w) => w.id === "op-task").at(-1)?.value || "";
  assert.match(taskHtml, /D-9410-A/);
  assert.match(taskHtml, /EXECUTOR/);
  assert.match(taskHtml, /01:32/, "elapsed 00:01:32 shown from real ms");
  // HUMAN_GATE_REQUIRED -> HUMAN GATE with exact reason/detail/task
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED", phase: "TERMINAL" },
    { last_tick: { classification: "HUMAN_GATE_REQUIRED", human_gate_required: true, reason_codes: ["TRACKED_DIRTY_CONFLICT"], gate_summary: "tracked dirty: 2 file(s)", task_ref: null }, queue: { eligible_count: 1, candidate_task_ref: "LOCAL_DEV_B_D-9410-A" }, explanation: { blocked_at: "repo_hygiene", why_code: "TRACKED_DIRTY_CONFLICT" } },
  );
  rail = [...dashboard.htmlWrites].filter((w) => w.id === "op-rail").at(-1)?.value || "";
  assert.match(rail, /terminal-stop current/);
  assert.match(rail, /HUMAN GATE/);
  const gate = dashboard.element("op-gate");
  assert.equal(gate.hidden, false);
  assert.match(gate.innerHTML, /HUMAN GATE/);
  assert.match(gate.innerHTML, /TRACKED_DIRTY_CONFLICT/);
  assert.match(gate.innerHTML, /tracked dirty: 2 file\(s\)/);
  assert.match(gate.innerHTML, /D-9410-A/);
  assert.match(gate.innerHTML, /Blocked at:/);
});

await test("S79 queue classification: READY totali / eseguibili / bloccati / storici con receipt terminale separated", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: {} });
  const items = [
    { id: "D-9410-A", task_ref: "LOCAL_DEV_B_D-9410-A", source_file: "READY_D9410A.md", backlog_state: "READY_FOR_PLANNING", ready_looking: true, admissible: true, eligible: true, matching_receipt_present: false, currently_blocking: false, blocking_reason: null, latest_receipt: null, blocking_receipts: [], matching_receipt_count: 0, blocking_receipt_count: 0 },
    { id: "D-9301-C", task_ref: "LOCAL_DEV_B_D-9301-C", source_file: "READY_D9301C.md", backlog_state: "READY_FOR_PLANNING", ready_looking: true, admissible: true, eligible: false, matching_receipt_present: true, currently_blocking: true, blocking_reason: "CLAIM_ALREADY_EXISTS", latest_receipt: { state: "PASS" }, blocking_receipts: [{ state: "PASS", execution_started: true, currently_blocking: true }], matching_receipt_count: 1, blocking_receipt_count: 1 },
    { id: "D-9403-A", task_ref: "LOCAL_DEV_B_D-9403-A", source_file: "READY_D9403A.md", backlog_state: "READY_FOR_PLANNING", ready_looking: true, admissible: true, eligible: false, matching_receipt_present: true, currently_blocking: true, blocking_reason: "CLAIM_ALREADY_EXISTS", latest_receipt: { state: "STOP" }, blocking_receipts: [{ state: "STOP", execution_started: true, currently_blocking: true }], matching_receipt_count: 1, blocking_receipt_count: 1 },
    { id: "D-9409-A", task_ref: "LOCAL_DEV_B_D-9409-A", source_file: "READY_D9409A.md", backlog_state: "READY_FOR_PLANNING", ready_looking: true, admissible: false, eligible: false, matching_receipt_present: false, currently_blocking: false, blocking_reason: "INADMISSIBLE_STATE_OR_SCOPE", latest_receipt: null, blocking_receipts: [], matching_receipt_count: 0, blocking_receipt_count: 0 },
  ];
  const counts = JSON.parse(dashboard.evaluate(`JSON.stringify(classifyQueueHistory(${JSON.stringify(items)}))`));
  assert.deepEqual(Object.keys(counts).sort(), ["bloccati", "eseguibili", "readyTotal", "storici"]);
  assert.deepEqual(counts, { readyTotal: 4, eseguibili: 1, bloccati: 0, storici: 2 }, "PASS + terminal STOP are history, not current blocks");
  dashboard.render(null, { queue: { items, eligible_count: 1, claim_present_count: 2, scanned_file_count: 33 } });
  const metrics = [...dashboard.htmlWrites].filter((w) => w.id === "queue-metrics").at(-1)?.value || "";
  assert.match(metrics, /READY totali/);
  assert.match(metrics, /READY eseguibili/);
  assert.match(metrics, /READY bloccati/);
  assert.match(metrics, /storici con receipt terminale/);
  const body = [...dashboard.htmlWrites].filter((w) => w.id === "queue-body").at(-1)?.value || "";
  assert.match(body, /D-9410-A[\s\S]*?READY · ELIGIBLE/);
  assert.match(body, /Storico · receipt terminale/);
  // Fresh CLAIMED receipt stays CURRENT blocked, not history.
  const counts2 = JSON.parse(dashboard.evaluate(`JSON.stringify(classifyQueueHistory(${JSON.stringify([{ ready_looking: true, admissible: true, eligible: false, currently_blocking: true, blocking_receipts: [{ state: "CLAIMED", execution_started: false, currently_blocking: true }] }])}))`));
  assert.deepEqual(counts2, { readyTotal: 1, eseguibili: 0, bloccati: 1, storici: 0 });
});

await test("S80 opstrip renders safely with null/malformed diagnostics (no coercion, no invented anchors)", async () => {
  const dashboard = await dashboardHarness();
  for (const diag of [null, {}, { tick_clock: null }, { tick_clock: { wf90_interval_seconds: {} }, last_tick: { recorded_at: {} } }, { last_tick: { recorded_at: "not-a-date" } }]) {
    assert.doesNotThrow(() => dashboard.render(null, diag));
    const value = dashboard.element("op-countdown");
    assert.ok(["—:——", "ATTESA TICK N8N"].includes(value.textContent) || /^\d\d:\d\d$/.test(value.textContent), value.textContent);
  }
  const out = dashboardText(dashboard);
  assert.doesNotMatch(out, /\[object Object\]|\bundefined\b|\bNaN\b/);
});

await test("S81 live diagnostics endpoint shape: tick_clock present and read-only GET only", async () => {
  const tracker = createExecutionStatusTracker();
  const lastTick = createLastTickStore();
  lastTick.record({ ok: true, classification: "IDLE_CLEAN", request_id: "s81" }, { recorded_at: "2026-09-15T22:20:41.000Z", elapsed_ms: 300 });
  let diag = null;
  const res = mockRes();
  const originalEnd = res.end;
  res.end = (b) => { diag = JSON.parse(b); originalEnd(b); };
  await handleTickRequest(mockReq("GET", DIAGNOSTICS_PATH), res, {
    statusTracker: tracker,
    lastTickStore: lastTick,
    diagnosticsScanQueue: () => [],
    diagnosticsLoadReceipts: () => [],
    probeQwen: async () => ({ reachable: null }),
  });
  assert.equal(res.status, 200);
  assert.equal(diag.tick_clock.wf90_interval_seconds, 120);
  assert.equal(diag.tick_clock.last_observed_tick_at, "2026-09-15T22:20:41.000Z");
  assert.equal(diag.tick_clock.next_expected_tick_at, "2026-09-15T22:22:41.000Z");
});

// ===================== #94 MISSION CONTROL V2 (S82–S93) =====================
import {
  HISTORY_PATH,
  HISTORY_SCHEMA,
  MISSION_CONTROL_JOURNAL_SCHEMA,
  missionControlJournalPath,
  sanitizeMissionControlEvent,
  appendMissionControlEvent,
  readMissionControlJournal,
  buildMissionControlHistoryView,
} from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";

const JOURNAL_DIR = mkdtempSync(join(tmpdir(), "mc94-journal-"));

await test("S82 #94 journal path resolves outside the Git worktree (LOCALAPPDATA root)", () => {
  const p = missionControlJournalPath({ LOCALAPPDATA: "C:\\FakeUser\\AppData\\Local" }, "C:\\FakeUser");
  assert.ok(p.startsWith("C:\\FakeUser\\AppData\\Local\\ControlPlane\\runtime"), p);
  assert.ok(p.endsWith("mission-control-events.jsonl"));
  assert.doesNotMatch(p, /control-plane/i, "journal must not live in the repo worktree");
  const fallback = missionControlJournalPath({}, "C:\\FakeHome");
  assert.ok(fallback.startsWith(join("C:\\FakeHome", ".control-plane-runtime")), fallback);
});

await test("S83 #94 strict field allow-list + bounded sizes; secret-like and oversized fields are not persisted", () => {
  const ev = sanitizeMissionControlEvent({
    schema_version: "other", // overridden by canonical constant
    recorded_at: "2026-09-19T00:00:00.000Z",
    task_ref: "T".repeat(500),
    event: "TASK_PASS",
    api_token: "SUPERSECRET", // non-allowlisted + secret-like
    session_id: "x", // non-allowlisted + secret-like
    stdout: "raw output", // non-allowlisted
    command_line: "node --secret-flag", // non-allowlisted
    env_vars: { A: "1" }, // non-allowlisted
    duration_ms: 12_345,
    commit_sha: "c".repeat(200),
    human_summary: "s".repeat(999),
    nested: { deep: { object: true } }, // non-allowlisted
  });
  assert.equal(ev.schema_version, MISSION_CONTROL_JOURNAL_SCHEMA);
  assert.equal(ev.task_ref.length, 200, "task_ref bounded to 200");
  assert.equal(ev.commit_sha.length, 60, "commit_sha bounded to 60");
  assert.equal(ev.human_summary.length, 300, "human_summary bounded to 300");
  assert.equal(ev.duration_ms, 12345);
  assert.ok(!("api_token" in ev) && !("session_id" in ev) && !("stdout" in ev));
  assert.ok(!("command_line" in ev) && !("env_vars" in ev) && !("nested" in ev));
  assert.equal(sanitizeMissionControlEvent(null), null);
  assert.ok(sanitizeMissionControlEvent({ event: "X", recorded_at: "t" }), "unknown event names are bounded-shaped; the EMITTER vocabulary is the authority");
  assert.equal(sanitizeMissionControlEvent({ event: "", recorded_at: "t" }), null, "empty event rejected");
  assert.equal(sanitizeMissionControlEvent({ event: "TASK_PASS" }), null, "missing recorded_at rejected");
});

await test("S84 #94 journal append-only writes survive reload; malformed lines fail safely without breaking reads", async () => {
  const jp = join(JOURNAL_DIR, "s84.jsonl");
  const a = appendMissionControlEvent({ recorded_at: "2026-09-19T00:01:00.000Z", event: "TASK_SELECTED", task_ref: "LOCAL_DEV_B_D-94-A", target_repo: "mrhz1973/control-plane" }, { journalPath: jp });
  assert.ok(a && a.event === "TASK_SELECTED");
  appendMissionControlEvent({ recorded_at: "2026-09-19T00:02:00.000Z", event: "TASK_PASS", task_ref: "LOCAL_DEV_B_D-94-A", classification: "PASS", duration_ms: 9000 }, { journalPath: jp });
  // Simulated dispatcher restart: a fresh read sees the same durable history.
  const reloaded = readMissionControlJournal(jp);
  assert.equal(reloaded.length, 2);
  assert.equal(reloaded[0].event, "TASK_SELECTED");
  assert.equal(reloaded[1].event, "TASK_PASS");
  // Malformed + foreign-schema lines are skipped safely.
  writeFileSync(jp, `${JSON.stringify(reloaded[1])}\n{not json\n{"schema_version":"other-v9","event":"X"}\n${JSON.stringify(reloaded[0])}\n`, "utf8");
  const safe = readMissionControlJournal(jp);
  assert.equal(safe.length, 2, "malformed/foreign lines skipped, never fatal");
  assert.equal(readMissionControlJournal(join(JOURNAL_DIR, "absent.jsonl")).length, 0);
});

await test("S85 #94 GET /v1/history is read-only, GET-only, bounded view; POST rejected", async () => {
  const tracker = createExecutionStatusTracker();
  const lastTick = createLastTickStore();
  lastTick.record({ ok: true, classification: "IDLE_CLEAN", request_id: "s85" }, { recorded_at: "2026-09-19T00:03:00.000Z", elapsed_ms: 200 });
  let payload = null;
  const res = mockRes();
  const originalEnd = res.end;
  res.end = (b) => { if (res.status === 200) payload = JSON.parse(b); originalEnd(b); };
  await handleTickRequest(mockReq("GET", HISTORY_PATH), res, {
    statusTracker: tracker,
    lastTickStore: lastTick,
    diagnosticsLoadReceipts: () => [
      { task_ref: "LOCAL_DEV_B_D-94-H", claimed_at: "2026-09-18T09:00:39.780Z", state: "STOP", source_ref: "github:mrhz1973/control-plane@sha:reports/runtime/dev-queue/always-on/READY_X.md" },
    ],
    missionControlJournalPath: join(JOURNAL_DIR, "absent-s85.jsonl"),
    nowIso: () => "2026-09-19T00:03:30.000Z",
  });
  assert.equal(res.status, 200);
  assert.equal(payload.schema_version, HISTORY_SCHEMA);
  assert.equal(payload.read_only, true);
  assert.equal(payload.latest_tick.classification, "IDLE_CLEAN");
  // IDLE_CLEAN tick with a real terminal task in receipts: LAST TERMINAL SURVIVES.
  assert.ok(payload.last_terminal_task, "last terminal task present despite latest IDLE tick");
  assert.equal(payload.last_terminal_task.task_ref, "LOCAL_DEV_B_D-94-H");
  assert.equal(payload.last_terminal_task.outcome, "STOP");
  assert.equal(payload.active_task, null, "no active task invented");
  assert.ok(Array.isArray(payload.recent_tasks) && payload.recent_tasks.length === 1);
  assert.ok(Array.isArray(payload.recent_events));
  const resPost = mockRes();
  await handleTickRequest(mockReq("POST", HISTORY_PATH, "{}"), resPost, {});
  assert.equal(resPost.status, 405);
});

await test("S86 #94 active task and last terminal task remain separate; idle never overwrites terminal", async () => {
  const tracker = createExecutionStatusTracker();
  tracker.start({ request_id: "s86", task_ref: "LOCAL_DEV_B_D-94-ACTIVE", phase: "EXECUTING" });
  const lastTick = createLastTickStore();
  const view = buildMissionControlHistoryView({
    statusTracker: tracker,
    lastTickStore: lastTick,
    loadReceipts: () => [
      { task_ref: "LOCAL_DEV_B_D-94-DONE", claimed_at: "2026-09-18T00:00:00.000Z", state: "PASS", source_ref: "github:mrhz1973/control-plane@sha:p.md" },
    ],
    journalPath: join(JOURNAL_DIR, "absent-s86.jsonl"),
    nowIso: () => "2026-09-19T00:04:00.000Z",
  });
  assert.equal(view.active_task.task_ref, "LOCAL_DEV_B_D-94-ACTIVE");
  assert.equal(view.active_task.phase, "EXECUTING");
  assert.equal(view.last_terminal_task.task_ref, "LOCAL_DEV_B_D-94-DONE");
  assert.notEqual(view.active_task.task_ref, view.last_terminal_task.task_ref, "active vs terminal distinct");
  // IDLE tracker: active becomes null, terminal still present.
  tracker.finish({ classification: "IDLE_CLEAN" });
  const view2 = buildMissionControlHistoryView({
    statusTracker: tracker,
    lastTickStore: lastTick,
    loadReceipts: () => [
      { task_ref: "LOCAL_DEV_B_D-94-DONE", claimed_at: "2026-09-18T00:00:00.000Z", state: "PASS", source_ref: "github:mrhz1973/control-plane@sha:p.md" },
    ],
    journalPath: join(JOURNAL_DIR, "absent-s86.jsonl"),
    nowIso: () => "2026-09-19T00:04:30.000Z",
  });
  assert.equal(view2.active_task, null);
  assert.equal(view2.last_terminal_task.task_ref, "LOCAL_DEV_B_D-94-DONE", "idle does NOT erase last terminal task");
});

await test("S87 #94 IDLE_CLEAN tick is not rendered as an engineering task in the dashboard", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" },
    diag: { last_tick: { classification: "IDLE_CLEAN", recorded_at: "2026-09-19T00:05:00.000Z" }, queue: { eligible_count: 0 } },
    history: {
      schema_version: HISTORY_SCHEMA, read_only: true,
      latest_tick: { recorded_at: "2026-09-19T00:05:00.000Z", classification: "IDLE_CLEAN", execution_performed: false, task_ref: null, reason_codes: [] },
      active_task: null,
      last_terminal_task: { task_ref: "LOCAL_DEV_B_D-94-LAST", task_id: "D-94-LAST", outcome: "STOP", terminal_at: "2026-09-18T09:30:00.000Z", started_at: "2026-09-18T09:00:00.000Z", duration_ms: 1800000, tests_state: "FAIL", commit_sha: null, persistence_state: "NOT_COMPLETED", blocker: "STOP:TEST_FAILED", human_summary: "Task fermato con STOP." },
      recent_tasks: [{ task_ref: "LOCAL_DEV_B_D-94-LAST", task_id: "D-94-LAST", outcome: "STOP", claimed_at: "2026-09-18T09:00:39.780Z", terminal_at: "2026-09-18T09:30:00.000Z", duration_ms: 1800000, tests_state: "FAIL", commit_sha: null, persistence_state: "NOT_COMPLETED", blocker: "STOP:TEST_FAILED", state: "STOP", target_repo: "mrhz1973/control-plane" }],
      recent_events: [],
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const pad = [...dashboard.htmlWrites].filter((w) => w.id === "ops-prima-adesso-dopo").at(-1)?.value || "";
  assert.match(pad, /Prima/);
  assert.match(pad, /D-94-LAST/, "last terminal task prominent in PRIMA");
  assert.match(pad, /Nessun task in esecuzione/, "ADESSO explicitly idle");
  assert.match(pad, /Nessun prossimo task determinato/, "DOPO honest unknown");
  assert.doesNotMatch(pad, /IDLE_CLEAN/, "idle tick not represented as a task");
  const term = [...dashboard.htmlWrites].filter((w) => w.id === "ops-terminal-body").at(-1)?.value || "";
  assert.match(term, /D-94-LAST/);
  assert.match(term, /STOP/);
  const hist = [...dashboard.htmlWrites].filter((w) => w.id === "history-tasks").at(-1)?.value || "";
  assert.match(hist, /D-94-LAST/);
  assert.doesNotMatch(hist, /task-name">IDLE_CLEAN/, "no idle tick as engineering task row");
});

await test("S88 #94 phase rail derives completion only from real evidence; no invented completed phases", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: {} });
  // STOP with NO journal evidence: no phase marked completed.
  dashboard.render({ active: false, classification: "WORK_EXECUTED_STOP", phase: "TERMINAL" }, { last_tick: { classification: "WORK_EXECUTED_STOP" }, queue: {} }, null, {}, { recent_events: [] });
  let rail = [...dashboard.htmlWrites].filter((w) => w.id === "ops-phase-rail").at(-1)?.value || "";
  assert.match(rail, /terminal-stop current/);
  assert.doesNotMatch(rail, /rail-step done/, "no invented completed phases without journal evidence");
  // PASS terminal: all six phases completed (authoritative classification).
  dashboard.render({ active: false, classification: "WORK_EXECUTED_PASS", phase: "TERMINAL" }, { last_tick: { classification: "WORK_EXECUTED_PASS" }, queue: {} }, null, {}, { recent_events: [] });
  rail = [...dashboard.htmlWrites].filter((w) => w.id === "ops-phase-rail").at(-1)?.value || "";
  const doneCount = (rail.match(/rail-step done/g) || []).length;
  assert.equal(doneCount, 6, "PASS completes exactly the six canonical phases");
  assert.match(rail, /terminal-pass current/);
  // Active EXECUTING with journal evidence up to executor.
  dashboard.render(
    { active: true, phase: "EXECUTING", task_ref: "LOCAL_DEV_B_D-94-RUN", elapsed_ms: 45000 },
    { last_tick: {}, queue: {} }, null, {},
    { recent_events: [
      { task_ref: "LOCAL_DEV_B_D-94-RUN", event: "TASK_SELECTED", recorded_at: "2026-09-19T00:06:00.000Z" },
      { task_ref: "LOCAL_DEV_B_D-94-RUN", event: "PREFLIGHT_PASS", recorded_at: "2026-09-19T00:06:05.000Z" },
      { task_ref: "LOCAL_DEV_B_D-94-RUN", event: "RUNTIME_READY", recorded_at: "2026-09-19T00:06:06.000Z" },
      { task_ref: "LOCAL_DEV_B_D-94-RUN", event: "EXECUTOR_STARTED", recorded_at: "2026-09-19T00:06:10.000Z" },
    ], active_task: { task_ref: "LOCAL_DEV_B_D-94-RUN" } },
  );
  rail = [...dashboard.htmlWrites].filter((w) => w.id === "ops-phase-rail").at(-1)?.value || "";
  const doneRun = (rail.match(/rail-step done/g) || []).length;
  assert.equal(doneRun, 4, "Selezione+Preflight+Runtime+Executor completed from real events");
  assert.match(rail, /current[^>]*>\s*<span class="rdot"[^>]*><\/span>Executor/, "current stays EXECUTOR until a real TESTS event");
  assert.doesNotMatch(rail, /done[^>]*>\s*<span class="rdot"[^>]*><\/span>Test/, "Test not completed without TESTS evidence");
});

await test("S89 #94 history endpoint failure does not blank unrelated good data (#85 LKG law extended)", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" },
    diag: { last_tick: { classification: "IDLE_CLEAN", recorded_at: "2026-09-19T00:07:00.000Z" }, queue: { eligible_count: 2 } },
    history: {
      schema_version: HISTORY_SCHEMA, read_only: true, latest_tick: null, active_task: null,
      last_terminal_task: { task_ref: "LOCAL_DEV_B_D-94-K", outcome: "PASS", terminal_at: "2026-09-18T10:00:00.000Z" },
      recent_tasks: [{ task_ref: "LOCAL_DEV_B_D-94-K", outcome: "PASS", claimed_at: "2026-09-18T09:00:00.000Z" }], recent_events: [],
    },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  let pad = [...dashboard.htmlWrites].filter((w) => w.id === "ops-prima-adesso-dopo").at(-1)?.value || "";
  assert.match(pad, /D-94-K/, "history good data rendered");
  // Now history fails; status keeps working; PRIMA keeps the last-known-good.
  dashboard.setScenario({ status: { active: false }, diag: { queue: { eligible_count: 1 } }, httpHistoryError: true });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  pad = [...dashboard.htmlWrites].filter((w) => w.id === "ops-prima-adesso-dopo").at(-1)?.value || "";
  assert.match(pad, /D-94-K/, "last-known-good history retained on failure");
  const health = dashboard.element("data-health");
  assert.match(health.className, /partial/, "partial state surfaced in compact header indicator");
  assert.match(dashboard.element("data-health-label").textContent, /Dati parziali/);
  assert.equal(dashboard.element("data-alert").hidden, true, "full-width data alert stays collapsed");
});

await test("S90 #94 COMPONENTI tab renders honest cards; PID/port only when observed", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false, phase: "TERMINAL" },
    diag: { status: { active: false, phase: "TERMINAL" }, qwen: { reachable: false, lifecycle: { state: "AUTO_STOPPED" } }, queue: {} },
    history: { recent_tasks: [], recent_events: [], active_task: null, last_terminal_task: null },
  });
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const comps = [...dashboard.htmlWrites].filter((w) => w.id === "components-cards").at(-1)?.value || "";
  for (const name of ["WF90", "Dispatcher", "Dispatcher Supervisor", "Qwen Local", "OpenCode", "Receipt Ledger", "GitHub", "Hermes"]) {
    assert.ok(comps.includes(name), `component card present: ${name}`);
  }
  assert.match(comps, /Se lo chiudi:/, "closure consequence explained");
  assert.match(comps, /non osservato/, "unobserved PID shown honestly as non osservato");
  assert.match(comps, /finché il supervisor non lo riavvia/, "dispatcher closure consequence accurate");
  assert.doesNotMatch(comps, /PID \d+/, "no invented PID when idle");
});

await test("S91 #94 tabs exist; OPERAZIONI default; switching persists trivially; no full-page reload", async () => {
  const dashboard = await dashboardHarness({ status: { active: false }, diag: {} });
  const ops = dashboard.element("tab-panel-operations");
  const live = dashboard.element("tab-panel-live");
  const hist = dashboard.element("tab-panel-history");
  const tech = dashboard.element("tab-panel-technical");
  const comp = dashboard.element("tab-panel-components");
  assert.equal(ops.hidden, false, "OPERAZIONI is the default visible tab");
  assert.equal(live.hidden && hist.hidden && comp.hidden && tech.hidden, true, "others hidden by default");
  assert.equal(dashboard.element("tab-operations").getAttribute("aria-selected"), "true");
  // Switching is presentational only (no navigation, no reload).
  await dashboard.element("tab-technical").fire("click");
  assert.equal(dashboard.element("tab-panel-technical").hidden, false);
  assert.equal(dashboard.element("tab-operations").getAttribute("aria-selected"), "false");
  assert.equal(dashboard.localStore.get("control-plane.dashboard.tab.v1"), "technical", "tab persisted trivially");
  await dashboard.element("tab-live").fire("click");
  assert.equal(dashboard.element("tab-panel-live").hidden, false);
  assert.match(dashboard.element("live-placeholder").innerHTML || dashboard.html, /ATTIVITÀ LIVE|#120 non ancora installato/);
  assert.doesNotMatch(dashboard.html, /location\.reload/);
  // Architecture route remains linked prominently.
  assert.match(dashboard.html, /href="\/architecture"/);
});

await test("S94 #121 compact header; zero-height gate; resources outside TECNICO; LIVE open from active task", async () => {
  const dashboard = await dashboardHarness({
    status: { active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" },
    diag: { last_tick: { classification: "IDLE_CLEAN" }, queue: {} },
    history: {
      schema_version: "local-dev-mission-control-history-v1",
      read_only: true,
      active_task: null,
      last_terminal_task: { task_ref: "LOCAL_DEV_B_D-0103-F004R", outcome: "PASS", commit_sha: "4ee42b227c20da139ba023f131ad087e8ff2f6d6", terminal_at: "2026-09-20T19:37:50.625Z" },
      recent_tasks: [], recent_events: [],
    },
  });
  assert.match(dashboard.html, /Control Plane[\s\S]*Local Dev Dispatcher/);
  assert.match(dashboard.html, /id="data-health"/);
  assert.match(dashboard.html, /class="page-head"[^>]*hidden|page-head\{display:none/);
  assert.doesNotMatch(dashboard.html, /<div class="eyebrow">Console operativa<\/div>/);
  // No HUMAN_GATE => gate hidden and strip without has-gate.
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} });
  const gateIdle = dashboard.element("op-gate");
  assert.equal(gateIdle.hidden, true);
  assert.equal(dashboard.element("opstrip").classList.contains("has-gate"), false);
  // HUMAN_GATE => compact gate visible.
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED", phase: "TERMINAL" },
    { last_tick: { classification: "HUMAN_GATE_REQUIRED", human_gate_required: true, reason_codes: ["TRACKED_DIRTY_CONFLICT"], gate_summary: "tracked dirty", task_ref: "LOCAL_DEV_B_D-X" }, explanation: { blocked_at: "repo_hygiene" } },
  );
  assert.equal(dashboard.element("op-gate").hidden, false);
  assert.equal(dashboard.element("opstrip").classList.contains("has-gate"), true);
  assert.match(dashboard.element("op-gate").innerHTML, /HUMAN GATE/);
  // Resources are first-screen / outside TECNICO panel markup order.
  const resIdx = dashboard.html.indexOf('id="sec-resources"');
  const techIdx = dashboard.html.indexOf('id="tab-panel-technical"');
  const tabsIdx = dashboard.html.indexOf('role="tablist"');
  assert.ok(resIdx > 0 && tabsIdx > 0 && resIdx < tabsIdx, "resources precede tabs");
  assert.ok(techIdx > tabsIdx, "technical tab after resources");
  assert.doesNotMatch(dashboard.html.slice(techIdx, techIdx + 800), /id="sec-resources"/);
  // First-screen cards include last terminal / next.
  await dashboard.evaluate("refresh()");
  await dashboard.settle();
  const cards = [...dashboard.htmlWrites].filter((w) => w.id === "summary-cards").at(-1)?.value || "";
  assert.match(cards, /Ultimo terminato/);
  assert.match(cards, /D-0103-F004R|F004R/);
  assert.match(cards, /Prossimo/);
  // Active task can open LIVE.
  dashboard.render({ active: true, phase: "EXECUTING", task_ref: "LOCAL_DEV_B_D-121-A", elapsed_ms: 5000 }, { last_tick: {}, queue: {} });
  const taskHtml = [...dashboard.htmlWrites].filter((w) => w.id === "op-task").at(-1)?.value || "";
  assert.match(taskHtml, /data-open-live="1"/);
  assert.match(taskHtml, /D-121-A/);
  dashboard.evaluate("applyTab('live')");
  assert.equal(dashboard.element("tab-panel-live").hidden, false);
  assert.equal(dashboard.element("tab-live").getAttribute("aria-selected"), "true");
});

await test("S95 #121 last Control Plane event card from canonical history", async () => {
  const dashboard = await dashboardHarness({ status: { active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, diag: { last_tick: { classification: "IDLE_CLEAN" }, queue: {} } });
  assert.match(dashboard.html, /id="last-cp-event"/);
  assert.match(dashboard.html, /ULTIMO EVENTO CONTROL PLANE/);

  const passHistory = {
    schema_version: HISTORY_SCHEMA,
    read_only: true,
    last_terminal_task: {
      task_ref: "LOCAL_DEV_B_D-0103-F004R", outcome: "PASS", target_repo: "mrhz1973/tmar-tts",
      duration_ms: 783000, commit_sha: "4ee42b227c20da139ba023f131ad087e8ff2f6d6", terminal_at: "2026-09-20T19:37:50.625Z",
    },
    recent_events: [{
      event: "TASK_PASS", recorded_at: "2026-09-20T19:37:50.283Z", task_ref: "LOCAL_DEV_B_D-0103-F004R",
      target_repo: "mrhz1973/tmar-tts", classification: "PASS", duration_ms: 783000,
      commit_sha: "4ee42b227c20da139ba023f131ad087e8ff2f6d6", human_summary: "Task D-0103-F004R completato con PASS.",
    }],
  };
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, passHistory);
  let card = dashboard.element("last-cp-event").innerHTML;
  assert.match(card, /TASK PASS/);
  assert.match(card, /D-0103-F004R/);
  assert.match(card, /mrhz1973\/tmar-tts/);
  assert.match(card, /783s/);
  assert.match(card, /4ee42b227c20/);
  assert.match(dashboard.element("last-cp-event").className, /\bpass\b/);
  assert.doesNotMatch(card, /HUMAN GATE/);

  const stopHistory = {
    schema_version: HISTORY_SCHEMA, read_only: true,
    last_terminal_task: { task_ref: "LOCAL_DEV_B_D-0103-F005", outcome: "STOP", blocker: "STOP:BOUNDS_TIMEBOX_EXPIRED", duration_ms: 3600000, target_repo: "mrhz1973/tmar-tts" },
    recent_events: [{
      event: "TASK_STOP", recorded_at: "2026-09-20T20:27:47.612Z", task_ref: "LOCAL_DEV_B_D-0103-F005",
      target_repo: "mrhz1973/tmar-tts", classification: "STOP:BOUNDS_TIMEBOX_EXPIRED", duration_ms: 3600000,
      human_summary: "Task D-0103-F005 fermato con STOP.",
    }],
  };
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, stopHistory);
  card = dashboard.element("last-cp-event").innerHTML;
  assert.match(card, /TASK STOP/);
  assert.match(card, /BOUNDS_TIMEBOX_EXPIRED/);
  assert.doesNotMatch(card, /HUMAN GATE|HUMAN ACTION REQUIRED/);
  assert.match(dashboard.element("last-cp-event").className, /\bstop\b/);

  const gateHistory = {
    schema_version: HISTORY_SCHEMA, read_only: true, last_terminal_task: null,
    recent_events: [{
      event: "HUMAN_GATE_REQUIRED", recorded_at: "2026-09-20T20:38:41.533Z", phase: "REPO_HYGIENE",
      classification: "HUMAN_GATE_REQUIRED", human_summary: "Gate umano richiesto: TRACKED_DIRTY_CONFLICT, REPO=mrhz1973/control-plane",
      target_repo: "mrhz1973/control-plane",
    }],
  };
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, gateHistory);
  card = dashboard.element("last-cp-event").innerHTML;
  assert.match(card, /HUMAN GATE/);
  assert.doesNotMatch(card, /TASK STOP/);
  assert.match(card, /TRACKED_DIRTY_CONFLICT|HUMAN_GATE_REQUIRED/);
  assert.match(dashboard.element("last-cp-event").className, /human-gate/);

  const successorHistory = {
    schema_version: HISTORY_SCHEMA, read_only: true,
    recent_events: [{
      event: "SUCCESSOR_READY_PUBLISHED", recorded_at: "2026-09-20T20:12:01.100Z",
      task_ref: "LOCAL_DEV_B_D-0103-F005", target_repo: "mrhz1973/tmar-tts",
      classification: "NEXT_QUEUED", human_summary: "Successore D-0103-F005 accodato per mrhz1973/tmar-tts.",
    }],
  };
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, successorHistory);
  card = dashboard.element("last-cp-event").innerHTML;
  assert.match(card, /PROJECT RECONCILED/);
  assert.match(card, /D-0103-F005/);
  assert.match(card, /queued automatically|NEXT_QUEUED/);
  assert.match(card, /natural WF90/);
  assert.match(dashboard.element("last-cp-event").className, /\bnext\b/);

  const idleHistory = {
    schema_version: HISTORY_SCHEMA, read_only: true,
    recent_events: [{
      event: "PROJECT_IDLE_COMPLETE", recorded_at: "2026-09-20T21:00:00.000Z",
      target_repo: "mrhz1973/tmar-tts", classification: "PROJECT_IDLE_COMPLETE",
      human_summary: "Nessun lavoro residuo eligible in mrhz1973/tmar-tts.",
    }],
  };
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, idleHistory);
  card = dashboard.element("last-cp-event").innerHTML;
  assert.match(card, /PROJECT IDLE COMPLETE/);
  assert.match(card, /mrhz1973\/tmar-tts/);

  // IDLE tick without significant events must keep last significant LKG.
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, {
    schema_version: HISTORY_SCHEMA, read_only: true, recent_events: [{ event: "TICK", recorded_at: "2026-09-20T21:02:00.000Z", classification: "IDLE_CLEAN" }],
  });
  card = dashboard.element("last-cp-event").innerHTML;
  assert.match(card, /PROJECT IDLE COMPLETE/, "IDLE does not erase last significant event");

  // Semantic duplicates: newest wins once; no duplicated titles in one card.
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, {
    schema_version: HISTORY_SCHEMA, read_only: true,
    recent_events: [
      { event: "HUMAN_GATE_REQUIRED", recorded_at: "2026-09-20T21:10:00.000Z", classification: "HUMAN_GATE_REQUIRED", human_summary: "same", target_repo: "mrhz1973/control-plane" },
      { event: "HUMAN_GATE_REQUIRED", recorded_at: "2026-09-20T21:08:00.000Z", classification: "HUMAN_GATE_REQUIRED", human_summary: "same", target_repo: "mrhz1973/control-plane" },
    ],
  });
  card = dashboard.element("last-cp-event").innerHTML;
  assert.equal((card.match(/HUMAN GATE/g) || []).length, 1, "duplicate visual suppressed");

  // Missing fields: omit / non invent.
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, { last_tick: { classification: "IDLE_CLEAN" }, queue: {} }, null, null, {
    schema_version: HISTORY_SCHEMA, read_only: true,
    recent_events: [{ event: "TASK_STOP", recorded_at: "2026-09-20T22:00:00.000Z", classification: "STOP:X" }],
  });
  card = dashboard.element("last-cp-event").innerHTML;
  assert.match(card, /TASK STOP/);
  assert.doesNotMatch(card, /Task: <b|Repo: <b|Durata:/);
  assert.doesNotMatch(card, /\bundefined\b|\bnull\b|inventat/i);
});

await test("S92 #94 injected-deps ticks never write the real journal (isolation law)", async () => {
  const realPath = missionControlJournalPath();
  const before = readMissionControlJournal(realPath, 10_000).length;
  // Injected-deps tick: repo hygiene failure (journal hook point) — no writes.
  await performTick({ request_id: "s92-injected", source: "n8n", schema_version: REQUEST_SCHEMA }, {
    verifyRepo: async () => ({ ok: false, reason_codes: ["TRACKED_DIRTY_CONFLICT"], gate_summary: "dirty" }),
    statusTracker: createExecutionStatusTracker(),
  });
  const after = readMissionControlJournal(realPath, 10_000).length;
  assert.equal(after, before, "injected-deps tick wrote no journal lines");
  // Explicit injected path DOES write (offline-test affordance).
  const jp = join(JOURNAL_DIR, "s92.jsonl");
  await performTick({ request_id: "s92-explicit", source: "n8n", schema_version: REQUEST_SCHEMA }, {
    missionControlJournalPath: jp,
    verifyRepo: async () => ({ ok: false, reason_codes: ["X"], gate_summary: "x" }),
    statusTracker: createExecutionStatusTracker(),
  });
  const lines = readMissionControlJournal(jp);
  assert.ok(lines.some((l) => l.event === "HUMAN_GATE_REQUIRED"), "explicit path journals the gate event");
});

await test("S93 #94 history survives simulated dispatcher restart: view rebuilt purely from durable state", async () => {
  const jp = join(JOURNAL_DIR, "s93.jsonl");
  const receiptsPath = join(JOURNAL_DIR, "s93-receipts.json");
  writeFileSync(receiptsPath, JSON.stringify([
    { task_ref: "LOCAL_DEV_B_D-94-P1", claimed_at: "2026-09-18T08:00:00.000Z", state: "STOP", execution_started: true, replayable: false, source_ref: "github:mrhz1973/control-plane@aaa:reports/runtime/dev-queue/always-on/READY_P1.md" },
    { task_ref: "LOCAL_DEV_B_D-94-P2", claimed_at: "2026-09-18T10:00:00.000Z", state: "PASS", execution_started: true, replayable: false, source_ref: "github:mrhz1973/control-plane@bbb:reports/runtime/dev-queue/always-on/READY_P2.md" },
  ]), "utf8");
  appendMissionControlEvent({ recorded_at: "2026-09-18T08:20:00.000Z", event: "TASK_STOP", task_ref: "LOCAL_DEV_B_D-94-P1", classification: "STOP:TEST_FAILED", tests_state: "FAIL", duration_ms: 1_200_000 }, { journalPath: jp });
  appendMissionControlEvent({ recorded_at: "2026-09-18T10:40:00.000Z", event: "TASK_PASS", task_ref: "LOCAL_DEV_B_D-94-P2", classification: "PASS", tests_state: "PASS", duration_ms: 2_400_000, commit_sha: "94a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9" }, { journalPath: jp });
  // Simulated restart: fresh stores, same durable journal + receipts.
  const view = buildMissionControlHistoryView({
    statusTracker: createExecutionStatusTracker(),
    lastTickStore: createLastTickStore(),
    loadReceipts: () => JSON.parse(readFileSync(receiptsPath, "utf8")),
    journalPath: jp,
    nowIso: () => "2026-09-19T00:08:00.000Z",
  });
  assert.equal(view.recent_tasks.length, 2);
  assert.equal(view.last_terminal_task.task_ref, "LOCAL_DEV_B_D-94-P2", "most recent terminal (P2 PASS) wins");
  assert.equal(view.last_terminal_task.outcome, "PASS");
  assert.equal(view.last_terminal_task.commit_sha, "94a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9");
  assert.equal(view.last_terminal_task.tests_state, "PASS");
  const p1 = view.recent_tasks.find((t) => t.task_ref.endsWith("P1"));
  assert.equal(p1.outcome, "STOP");
  assert.equal(p1.blocker, "STOP:TEST_FAILED");
  assert.equal(view.recent_events.length, 2, "journal events readable after restart");
});


process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
