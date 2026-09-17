#!/usr/bin/env node
/**
 * Focused target-onboarding suite (issue #90 —
 * V4_TMAR_TTS_GOVERNED_LOCAL_DEV_TARGET_ONBOARDING_V1).
 *
 * Proves the closed known-target map, target selection from the selected
 * backlog item's repository field, TMAR target hygiene, TMAR envelope
 * formation (path/remote/head/allowed_paths), fail-closed unknown repos,
 * caller-cannot-select-target, and zero TMAR mutation / zero executions
 * during this qualification. Offline by construction: no Qwen, no
 * OpenCode, no network, no git mutation of the real TMAR worktree.
 *
 * Run: node tests/local-dev-tmar-target-onboarding-v1/run.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLocalDevEnvelopeFromBacklog,
  KNOWN_LOCAL_REPOS,
  resolveKnownLocalRepo,
} from "../../tools/bridge-backlog-to-local-dev-envelope-v1.mjs";
import { runDispatchLoop } from "../../tools/dispatch-local-dev-queue-loop-v1.mjs";
import { parseBacklogFile } from "../../tools/select-local-dev-queue-item-v1.mjs";
import { validateEnvelope } from "../../tools/local-dev-executor-v1.mjs";
import {
  performTick,
  validateTickRequest,
  REQUEST_SCHEMA,
  verifyRepoState,
} from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "fixtures");
const FIX = (name) => readFileSync(join(FIXTURES, name), "utf8");

const TMAR_REPO = "mrhz1973/tmar-tts";
const TMAR_PATH = "C:\\Users\\mrhz\\Downloads\\Documents\\AI\\Chatterbox-TTS";
const TMAR_REMOTE = "https://github.com/mrhz1973/tmar-tts.git";
const TMAR_HEAD = "e22fff7f850dbe50e089a7329c89753aff556566";
const CP_REPO = "mrhz1973/control-plane";
const CP_PATH = "C:\\Users\\mrhz\\Documents\\AI\\GitHub\\control-plane";
const NOW = new Date("2026-09-18T00:00:00Z");
const COMMIT = "a".repeat(40);

let passed = 0;
const failures = [];
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

function tmarEntries() {
  const markdown = FIX("READY_TMAR_D9500T.md");
  const parsed = parseBacklogFile(markdown);
  assert.equal(parsed.ok, true, JSON.stringify(parsed));
  return [{ ...parsed, markdown, source: "READY_TMAR_D9500T.md", backlog_path: "tests/fixtures/READY_TMAR_D9500T.md" }];
}

// T1 existing Control Plane known-repo mapping remains unchanged.
await test("T1 control-plane mapping unchanged", () => {
  assert.equal(KNOWN_LOCAL_REPOS[CP_REPO], CP_PATH);
  assert.equal(resolveKnownLocalRepo(CP_REPO), CP_PATH);
});

// T2 TMAR exact mapping exists.
await test("T2 tmar-tts exact mapping exists", () => {
  assert.equal(KNOWN_LOCAL_REPOS[TMAR_REPO], TMAR_PATH);
  assert.equal(resolveKnownLocalRepo(TMAR_REPO), TMAR_PATH);
  assert.equal(Object.keys(KNOWN_LOCAL_REPOS).length, 2, "closed map: exactly 2 entries");
});

// T3 unknown repo => REPO_NOT_LOCAL_KNOWN.
await test("T3 unknown repo fails closed REPO_NOT_LOCAL_KNOWN", () => {
  for (const repo of ["somebody/unknown", "mrhz1973/other-repo", "", null, undefined, "mrhz1973/tmar-tts ", "Mrhz1973/tmar-tts"]) {
    const r = buildLocalDevEnvelopeFromBacklog({
      markdown: FIX("READY_TMAR_D9500T.md"),
      repo,
      commit: COMMIT,
      path: "queue/x.md",
      dispatchBaseHead: TMAR_HEAD,
      now: NOW,
    });
    assert.equal(r.ok, false, String(repo));
    assert.deepEqual(r.reason_codes, ["REPO_NOT_LOCAL_KNOWN"]);
    assert.equal(resolveKnownLocalRepo(repo), null, String(repo));
  }
});

// T4 no wildcard/prefix repo acceptance.
await test("T4 no wildcard or prefix acceptance", () => {
  for (const repo of ["mrhz1973/tmar-tts-extra", "mrhz1973/*", "mrhz1973/", "*/*", "mrhz1973/control-plane-evil"]) {
    assert.equal(resolveKnownLocalRepo(repo), null, repo);
  }
  // prefix of a known repo string is NOT the known repo
  assert.notEqual(resolveKnownLocalRepo("mrhz1973/tmar"), TMAR_PATH);
});

// T5/T6/T7/T8 TMAR bridge envelope exact target fields.
await test("T5-T8 TMAR bridge envelope: exact path, remote, dispatch head, verbatim allowed_paths", () => {
  const r = buildLocalDevEnvelopeFromBacklog({
    markdown: FIX("READY_TMAR_D9500T.md"),
    repo: TMAR_REPO,
    commit: COMMIT,
    path: "tests/fixtures/READY_TMAR_D9500T.md",
    dispatchBaseHead: TMAR_HEAD,
    now: NOW,
  });
  assert.equal(r.ok, true, JSON.stringify(r.reason_codes));
  assert.equal(r.envelope.target_repo_path, TMAR_PATH); // T5
  assert.equal(r.envelope.target_remote, TMAR_REMOTE);  // T6
  assert.equal(r.envelope.dispatch_base_head, TMAR_HEAD); // T7
  assert.deepEqual(r.envelope.allowed_paths, ["docs/current-state.md"]); // T8 verbatim
  assert.equal(r.envelope.target_remote, `https://github.com/${TMAR_REPO}.git`, "remote derived from canonical owner/repo");
  const v = validateEnvelope(r.envelope);
  assert.equal(v.ok, true, JSON.stringify(v.reason_codes));
  assert.equal(r.receipt.source_ref, `github:${TMAR_REPO}@${COMMIT}:tests/fixtures/READY_TMAR_D9500T.md`);
});

// T9 Control Plane-target fixture still produces current envelope semantics.
await test("T9 control-plane fixture envelope semantics unchanged", () => {
  const cpMd = readFileSync(join(HERE, "..", "local-dev-backlog-envelope-bridge-v1", "fixtures", "READY_D9001T.md"), "utf8");
  const r = buildLocalDevEnvelopeFromBacklog({
    markdown: cpMd,
    repo: CP_REPO,
    commit: COMMIT,
    path: "docs/runtime/BACKLOG_FIXTURE.md",
    dispatchBaseHead: "b".repeat(40),
    now: NOW,
  });
  assert.equal(r.ok, true, JSON.stringify(r.reason_codes));
  assert.equal(r.envelope.target_repo_path, CP_PATH);
  assert.equal(r.envelope.target_remote, "https://github.com/mrhz1973/control-plane.git");
  assert.deepEqual(r.envelope.allowed_paths, ["docs/runtime/CAMPAIGN_NOTES.md"]);
});

// T10 caller tick request cannot specify repo/path.
await test("T10 tick request schema rejects caller repo/path fields", () => {
  const base = { schema_version: REQUEST_SCHEMA, request_id: "t10", source: "n8n" };
  assert.equal(validateTickRequest(base).ok, true);
  for (const field of ["repo", "repo_path", "target_repo_path", "repository", "path", "dispatch_head"]) {
    const v = validateTickRequest({ ...base, [field]: "C:/evil" });
    assert.equal(v.ok, false, field);
    assert.deepEqual(v.reason_codes, ["REQUEST_FIELD_UNSUPPORTED", field]);
  }
});

// T11 selected backlog repository determines target (dispatch loop honors item.repository).
await test("T11 dispatch loop honors selected item repository for target + head", () => {
  const r = runDispatchLoop(tmarEntries(), [], {
    repo: CP_REPO,
    commit: COMMIT,
    head: "c".repeat(40), // control-plane head must NOT become TMAR dispatch head
    headsByRepo: { [TMAR_REPO]: TMAR_HEAD },
    nowIso: NOW.toISOString(),
    maxClaims: 1,
  });
  assert.equal(r.ok, true);
  assert.equal(r.claims.length, 1);
  const env = r.claims[0].envelope;
  assert.equal(env.target_repo_path, TMAR_PATH);
  assert.equal(env.target_remote, TMAR_REMOTE);
  assert.equal(env.dispatch_base_head, TMAR_HEAD, "dispatch_base_head must be TMAR HEAD, not control-plane HEAD");
});

// T11b item without repository field keeps queue control repo (backward compat).
await test("T11b item without repository falls back to queue control repo", () => {
  const cpMd = readFileSync(join(HERE, "..", "local-dev-backlog-envelope-bridge-v1", "fixtures", "READY_D9001T.md"), "utf8");
  const parsed = parseBacklogFile(cpMd);
  const noRepo = cpMd.replace("repository: mrhz1973/control-plane\n", "");
  const parsed2 = parseBacklogFile(noRepo);
  assert.equal(parsed2.ok, true);
  const r = runDispatchLoop(
    [{ ...parsed2, markdown: noRepo, source: "NO_REPO.md", backlog_path: "q/NO_REPO.md" }],
    [],
    { repo: CP_REPO, commit: COMMIT, head: "c".repeat(40), nowIso: NOW.toISOString(), maxClaims: 1 },
  );
  assert.equal(r.claims.length, 1);
  assert.equal(r.claims[0].envelope.target_repo_path, CP_PATH);
  void parsed;
});

// T12 target dirty => fail closed before claim/executor (injected performTick).
await test("T12 TMAR target dirty => HUMAN_GATE_REQUIRED before executor", async () => {
  const execCalls = [];
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "t12", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "b".repeat(40), reason_codes: [] }),
      scanQueue: () => tmarEntries(),
      runDispatchLoop: undefined, // force real loop (offline pure core)
      verifyTargetRepo: async () => ({ ok: false, reason_codes: ["TRACKED_DIRTY_CONFLICT", `REPO=${TMAR_REPO}`], human_gate_required: true, gate_summary: "tracked dirty" }),
      ensureDevQwenReady: async () => { throw new Error("MUST NOT PREFLIGHT ON DIRTY TARGET"); },
      runExecutor: async () => { execCalls.push(1); throw new Error("MUST NOT EXECUTE"); },
      persistReceipts: () => { throw new Error("MUST NOT PERSIST ON DIRTY TARGET"); },
    },
  );
  assert.equal(result.classification, "HUMAN_GATE_REQUIRED");
  assert.equal(result.execution_performed, false);
  assert.ok(result.reason_codes.includes("TARGET_REPO_HYGIENE_FAILED"));
  assert.ok(result.reason_codes.includes("TRACKED_DIRTY_CONFLICT"));
  assert.equal(execCalls.length, 0);
});

// T13 target ahead/diverged => fail closed.
await test("T13 TMAR target ahead/diverged => HUMAN_GATE_REQUIRED", async () => {
  for (const code of ["LOCAL_AHEAD_OF_ORIGIN", "HEAD_ORIGIN_DIVERGED"]) {
    const result = await performTick(
      { schema_version: REQUEST_SCHEMA, request_id: `t13-${code}`, source: "n8n" },
      {
        verifyRepo: async () => ({ ok: true, head: "b".repeat(40), reason_codes: [] }),
        scanQueue: () => tmarEntries(),
        verifyTargetRepo: async () => ({ ok: false, reason_codes: [code, `REPO=${TMAR_REPO}`], human_gate_required: true }),
        ensureDevQwenReady: async () => { throw new Error("MUST NOT PREFLIGHT"); },
        runExecutor: async () => { throw new Error("MUST NOT EXECUTE"); },
      },
    );
    assert.equal(result.classification, "HUMAN_GATE_REQUIRED", code);
    assert.ok(result.reason_codes.includes("TARGET_REPO_HYGIENE_FAILED"), code);
    assert.ok(result.reason_codes.includes(code), code);
  }
});

// T14 target strict-behind may use exactly one ff-only sync (verifyRepoState law on target path).
await test("T14 verifyRepoState target ff-only law: exactly one merge --ff-only when strict ancestor", async () => {
  const calls = [];
  let headSha = "1".repeat(40);
  const originSha = "2".repeat(40);
  const result = await verifyRepoState({
    repo: TMAR_REPO,
    repoPath: TMAR_PATH,
    gitExec: async (_p, args) => {
      calls.push(args.join(" "));
      if (args[0] === "rev-parse" && args[1] === "--is-inside-work-tree") return { status: 0, stdout: "true" };
      if (args[0] === "rev-parse" && args[1] === "--abbrev-ref") return { status: 0, stdout: "main" };
      if (args[0] === "fetch") return { status: 0, stdout: "" };
      if (args[0] === "status") return { status: 0, stdout: "" };
      if (args[0] === "rev-parse" && args[1] === "HEAD") return { status: 0, stdout: headSha };
      if (args[0] === "rev-parse") return { status: 0, stdout: originSha };
      if (args[0] === "merge-base") return { status: 0, stdout: headSha }; // strict ancestor
      if (args[0] === "merge") { headSha = originSha; return { status: 0, stdout: "" }; }
      return { status: 1, stdout: "" };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.sync_performed, true);
  assert.equal(result.head, originSha);
  const merges = calls.filter((c) => /^merge\b/.test(c) && !c.startsWith("merge-base"));
  assert.equal(merges.length, 1, "exactly one merge");
  assert.equal(merges[0], "merge --ff-only origin/main");
  for (const c of calls) {
    assert.ok(!/\b(reset|stash|clean|checkout|rebase|--hard|--force)\b/.test(c), `destructive: ${c}`);
  }
});

// T15 Control Plane queue repo hygiene still runs independently.
await test("T15 queue repo hygiene runs independently before target hygiene", async () => {
  const order = [];
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "t15", source: "n8n" },
    {
      verifyRepo: async () => { order.push("queue_hygiene"); return { ok: false, reason_codes: ["FETCH_FAILED", `REPO=${CP_REPO}`], human_gate_required: true }; },
      scanQueue: () => { order.push("scan"); return tmarEntries(); },
      verifyTargetRepo: async () => { order.push("target_hygiene"); return { ok: true, head: TMAR_HEAD }; },
      runExecutor: async () => { throw new Error("MUST NOT EXECUTE"); },
    },
  );
  assert.equal(result.classification, "HUMAN_GATE_REQUIRED");
  assert.equal(result.execution_performed, false);
  assert.deepEqual(order, ["queue_hygiene"], "queue hygiene gate blocks before scan/target");
});

// T16 TMAR target hygiene independent from queue hygiene (target failure does not touch queue repo check).
await test("T16 target hygiene independent: queue ok + target fail => target gate", async () => {
  const calls = [];
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "t16", source: "n8n" },
    {
      verifyRepo: async () => { calls.push("queue"); return { ok: true, head: "b".repeat(40), reason_codes: [] }; },
      scanQueue: () => tmarEntries(),
      verifyTargetRepo: async () => { calls.push("target"); return { ok: false, reason_codes: ["HEAD_ORIGIN_DIVERGED", `REPO=${TMAR_REPO}`], human_gate_required: true }; },
      ensureDevQwenReady: async () => { throw new Error("MUST NOT PREFLIGHT"); },
      runExecutor: async () => { throw new Error("MUST NOT EXECUTE"); },
    },
  );
  assert.equal(result.classification, "HUMAN_GATE_REQUIRED");
  assert.deepEqual(calls, ["queue", "target"]);
  assert.ok(result.reason_codes.includes("TARGET_REPO_HYGIENE_FAILED"));
});

// T17/T18 dry-run TMAR tick: zero executor/Qwen, TMAR files unchanged, envelope correct.
await test("T17 dry-run TMAR tick: zero generations, correct envelope; T18 TMAR unchanged", async () => {
  const tmarStatBefore = statSync(join(TMAR_PATH, "docs", "current-state.md"));
  let qwenCalls = 0;
  let execCalls = 0;
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "t17", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "b".repeat(40), reason_codes: [] }),
      scanQueue: () => tmarEntries(),
      verifyTargetRepo: async () => ({ ok: true, head: TMAR_HEAD, reason_codes: [], sync_performed: false }),
      ensureDevQwenReady: async () => { qwenCalls += 1; throw new Error("MUST NOT START QWEN DURING ONBOARDING QUALIFICATION"); },
      runExecutor: async (envelope) => {
        execCalls += 1;
        // Even if the executor were reached, it must receive the TMAR envelope.
        assert.equal(envelope.target_repo_path, TMAR_PATH);
        assert.equal(envelope.dispatch_base_head, TMAR_HEAD);
        throw new Error("MUST NOT EXECUTE DURING QUALIFICATION");
      },
      persistReceipts: () => { throw new Error("MUST NOT PERSIST (injected deps isolation)"); },
    },
  );
  // Qwen preflight is attempted AFTER claim; our stub throws => HUMAN_GATE_REQUIRED
  // with ZERO executor invocations and ZERO Qwen generations.
  assert.equal(result.classification, "HUMAN_GATE_REQUIRED");
  assert.equal(result.execution_performed, false);
  assert.equal(execCalls, 0, "executor_invocations=0");
  assert.equal(qwenCalls, 1, "qwen preflight attempted once (never started; stub refuses)");
  assert.ok(result.reason_codes.includes("QWEN_SESSION_NOT_READY"));
  assert.ok(String(result.gate_summary).startsWith("QWEN_SESSION_NOT_READY"));
  // T18: TMAR worktree byte-identical.
  const tmarStatAfter = statSync(join(TMAR_PATH, "docs", "current-state.md"));
  assert.equal(tmarStatAfter.size, tmarStatBefore.size);
  assert.equal(tmarStatAfter.mtimeMs, tmarStatBefore.mtimeMs);
  assert.ok(existsSync(join(TMAR_PATH, "docs", "current-state.md")));
});

// T19 one receipts ledger / one queue / one executor remains true.
await test("T19 single authority: one queue dir, one receipts path, one executor path", async () => {
  const src = readFileSync(join(HERE, "..", "..", "tools", "serve-local-dev-autonomous-dispatcher-v1.mjs"), "utf8");
  // queue dir + receipts remain under the Control Plane canonical path only.
  assert.ok(src.includes('export const QUEUE_DIR = "reports/runtime/dev-queue/always-on"'));
  assert.ok(src.includes('export const RECEIPTS_PATH = "reports/runtime/dev-queue/always-on/receipts.json"'));
  assert.ok(src.includes('export const QUEUE_REPO = "mrhz1973/control-plane"'));
  assert.ok(src.includes('export const CANONICAL_REPO_PATH = KNOWN_LOCAL_REPOS[QUEUE_REPO]'));
  // exactly one executor wiring (single import + single call site; no second executor).
  assert.equal((src.match(/executeLocalDevTask/g) || []).length, 2);
  // exactly one selector module (import + lazy parse import = same file, no second selector).
  assert.equal((src.match(/select-local-dev-queue-item-v1\.mjs/g) || []).length, 2);
  // no auto-discovery/clone primitives introduced.
  assert.ok(!/auto-?clone|discoverRepos|glob\(/i.test(src));
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
