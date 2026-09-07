/**
 * Focused offline tests for tools/serve-local-dev-autonomous-dispatcher-v1.mjs
 * (V4_LOCAL_DEV_N8N_ALWAYS_ON_LIVE_FAST_TRACK_V1, §I minimum test policy).
 * Covers ONLY: request validation, single-flight BUSY, max-one-task/tick,
 * response normalization. No live execution, no network.
 *
 * Run: node tests/local-dev-dispatcher-service-v1/run.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdtempSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  RESULT_SCHEMA,
  REQUEST_SCHEMA,
  TICK_PATH,
  CLASSIFICATIONS,
  validateTickRequest,
  wrapTickResult,
  classificationFromExecutorResult,
  performTick,
  handleTickRequest,
  verifyRepoState,
  shouldPersistRuntimeArtifacts,
  persistReceiptsAtomic,
} from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";
import {
  CLAIM_STALE_AFTER_MS,
  isReceiptBlocking,
  buildLocalDevEnvelopeFromBacklog,
} from "../../tools/bridge-backlog-to-local-dev-envelope-v1.mjs";
import { selectNextQueueItem } from "../../tools/select-local-dev-queue-item-v1.mjs";

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
        // Proven primitive guarantees max 1 claim via maxClaims=1:
        return { ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-1", source_file: "1.md", envelope: { task_ref: "LOCAL_DEV_B_D-1" }, receipt: { task_ref: "LOCAL_DEV_B_D-1" } }], skipped: [], stop_reason: "MAX_CLAIMS_REACHED" };
      },
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
      runDispatchLoop: () => ({ ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-9", source_file: "9.md", envelope: { task_ref: "LOCAL_DEV_B_D-9" }, receipt: { task_ref: "LOCAL_DEV_B_D-9" } }], skipped: [] }),
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
  assert.deepEqual(Object.keys(wrapped).sort(), ["classification", "execution_performed", "executor_classification", "gate_summary", "human_gate_required", "ok", "reason_codes", "request_id", "schema_version", "task_ref"]);
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
      runDispatchLoop: (_entries, _receipts, options) => { dispatchCalls.push(options); return { ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-11", source_file: "11.md", envelope: { task_ref: "LOCAL_DEV_B_D-11", head: advancedHead, commit: advancedHead }, receipt: { task_ref: "LOCAL_DEV_B_D-11" } }], skipped: [], stop_reason: "MAX_CLAIMS_REACHED" }; },
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
        return { ok: true, claims: [{ task_ref: taskRef, source_file: "12.md", envelope: { task_ref: taskRef, head: advancedHead, commit: advancedHead }, receipt: { task_ref: taskRef } }], skipped: [] };
      },
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
      return { ok: true, claims: [{ task_ref: taskRef, source_file: "13.md", envelope: { task_ref: taskRef, head: advancedHead, commit: advancedHead }, receipt: { task_ref: taskRef } }], skipped: [] };
    },
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

function claimForTick(taskRef, extraReceipt = {}) {
  return {
    ok: true,
    claims: [{
      task_ref: taskRef,
      source_file: "x.md",
      envelope: { task_ref: taskRef },
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

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
