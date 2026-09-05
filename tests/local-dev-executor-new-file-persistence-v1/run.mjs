/**
 * Deterministic offline tests for LOCAL_DEV_EXECUTOR option-B new-file
 * persistence semantics (V4_LOCAL_DEV_EXECUTOR_BRIDGED_PROOF_TRACKED_FILE_SEMANTICS_V1).
 *
 * Covers: snapshot/classification units + full executor integration for the
 * 8 operator-mandated regressions. No Qwen. No OpenCode. No network.
 *
 * Run: node tests/local-dev-executor-new-file-persistence-v1/run.mjs
 */
import assert from "node:assert/strict";
import {
  normalizeRepoPath,
  snapshotUntrackedPaths,
  classifyPostExecutionChanges,
  executeLocalDevTask,
} from "../../tools/local-dev-executor-v1.mjs";
import { ENVELOPE_SCHEMA } from "../../tools/local-dev-executor-v1.mjs";

const HEAD = "c".repeat(40);

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

function env(overrides = {}) {
  return {
    schema_version: ENVELOPE_SCHEMA,
    task_ref: "T_NF",
    target_repo_path: "/repos/target",
    target_remote: "https://example.invalid/target.git",
    dispatch_base_head: HEAD,
    profile_id: "qwen38-opus-q3-opencode-64k",
    task_delta: "one-shot change",
    allowed_paths: ["docs/**"],
    allowed_commands: ["git status --short"],
    test_command: null,
    network_policy: "localhost_only",
    timebox_seconds: 600,
    max_agent_turns: 8,
    max_test_cycles: 0,
    git_persistence_required: true,
    ...overrides,
  };
}

function fakeGit(script) {
  return async (repoPath, args) => {
    const key = args.join(" ");
    const h = script[key];
    if (!h) return { status: 1, stdout: "", stderr: `unexpected: ${key}` };
    return typeof h === "function" ? await h() : h;
  };
}

// ---------- units ----------
await test("normalizeRepoPath: backslashes, ./ prefix, trailing slash", () => {
  assert.equal(normalizeRepoPath("docs\\a\\b.md"), "docs/a/b.md");
  assert.equal(normalizeRepoPath("./docs/a.md"), "docs/a.md");
  assert.equal(normalizeRepoPath("docs/dir/"), "docs/dir");
  assert.equal(normalizeRepoPath("docs/a.md"), "docs/a.md");
});

await test("snapshot: null on status failure; ambiguous on case-colliding paths", async () => {
  assert.equal(await snapshotUntrackedPaths("/r", async () => ({ status: 1, stdout: "" })), null);
  const amb = await snapshotUntrackedPaths("/r", async () => ({ status: 0, stdout: "?? docs/A.md\n?? docs/a.md\n" }));
  assert.equal(amb.ambiguous, true);
  const ok = await snapshotUntrackedPaths("/r", async () => ({ status: 0, stdout: "?? docs/keep.md\n?? other/x.tmp\n" }));
  assert.equal(ok.ambiguous, false);
  assert.deepEqual(ok.paths, ["docs/keep.md", "other/x.tmp"]);
});

// ---------- classification regressions (operator list 1-8) ----------
const ENV = env();
const okGit = (stdout) => async () => ({ status: 0, stdout });
const EMPTY_PRE = { ambiguous: false, paths: [] };

// 1. existing tracked file modification -> stageable
await test("R1 tracked in-scope modification is stageable", async () => {
  const r = await classifyPostExecutionChanges(ENV, EMPTY_PRE, fakeGit({ "status --porcelain=v1 -uall": okGit(" M docs/notes.md\n") }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.stageable, ["docs/notes.md"]);
  assert.deepEqual(r.task_created_new, []);
});

// 2. task-created new in-scope file -> eligible/stageable
await test("R2 new in-scope untracked file is TASK_CREATED and stageable", async () => {
  const r = await classifyPostExecutionChanges(ENV, EMPTY_PRE, fakeGit({ "status --porcelain=v1 -uall": okGit("?? docs/new-file.md\n") }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.task_created_new, ["docs/new-file.md"]);
  assert.deepEqual(r.stageable, ["docs/new-file.md"]);
});

// 3. pre-existing untracked in-scope -> NOT stageable, protected
await test("R3 pre-existing untracked in-scope stays unstaged and protected", async () => {
  const pre = { ambiguous: false, paths: ["docs/old.md"] };
  const r = await classifyPostExecutionChanges(ENV, pre, fakeGit({ "status --porcelain=v1 -uall": okGit("?? docs/old.md\n") }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.stageable, []);
  assert.deepEqual(r.task_created_new, []);
  assert.equal(r.preexisting_untracked_protected, 1);
});

// 4. pre-existing untracked out-of-scope -> preserved (not staged, no violation)
await test("R4 pre-existing untracked out-of-scope is preserved untouched", async () => {
  const pre = { ambiguous: false, paths: ["tools/tmp.txt"] };
  const r = await classifyPostExecutionChanges(ENV, pre, fakeGit({ "status --porcelain=v1 -uall": okGit("?? tools/tmp.txt\n") }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.stageable, []);
  assert.equal(r.preexisting_untracked_protected, 1);
});

// 5. new out-of-scope file -> STOP
await test("R5 new out-of-scope untracked file stops fail-closed", async () => {
  const r = await classifyPostExecutionChanges(ENV, EMPTY_PRE, fakeGit({ "status --porcelain=v1 -uall": okGit("?? tools/rogue.txt\n") }));
  assert.equal(r.ok, false);
  assert.equal(r.classification, "STOP:UNEXPECTED_FILE_CHANGES");
  assert.ok(r.reason_codes.includes("PATH:tools/rogue.txt"));
});

// 6. mixture: valid new + protected pre-existing -> only new staged
await test("R6 mixture stages only the task-created new file", async () => {
  const pre = { ambiguous: false, paths: ["docs/preexisting.md"] };
  const r = await classifyPostExecutionChanges(ENV, pre, fakeGit({ "status --porcelain=v1 -uall": okGit("?? docs/preexisting.md\n M docs/edited.md\n?? docs/created-by-task.md\n") }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.stageable, ["docs/created-by-task.md", "docs/edited.md"]);
  assert.deepEqual(r.task_created_new, ["docs/created-by-task.md"]);
  assert.equal(r.preexisting_untracked_protected, 1);
});

// 7. nothing stageable -> empty staging set preserved (NOTHING_STAGEABLE flows from persistGit)
await test("R7 no stageable in-scope result keeps empty staging set", async () => {
  const r = await classifyPostExecutionChanges(ENV, EMPTY_PRE, fakeGit({ "status --porcelain=v1 -uall": okGit("") }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.stageable, []);
});

// 8. Windows path normalization + ambiguity
await test("R8 windows separators normalize; case-only delta is ambiguous fail-closed", async () => {
  const r1 = await classifyPostExecutionChanges(ENV, EMPTY_PRE, fakeGit({ "status --porcelain=v1 -uall": okGit("?? docs\\windows-new.md\n") }));
  assert.equal(r1.ok, true);
  assert.deepEqual(r1.task_created_new, ["docs/windows-new.md"]);
  const pre = { ambiguous: false, paths: ["docs/Notes.md"] };
  const r2 = await classifyPostExecutionChanges(ENV, pre, fakeGit({ "status --porcelain=v1 -uall": okGit("?? docs/NOTES.md\n") }));
  assert.equal(r2.ok, false);
  assert.equal(r2.classification, "STOP:PATH_NORMALIZATION_AMBIGUOUS");
});

// extra fail-closed cases mandated by the task
await test("missing pre-existing untracked file at classification -> STOP PREEXISTING_UNTRACKED_MODIFIED", async () => {
  const pre = { ambiguous: false, paths: ["docs/vanished.md"] };
  const r = await classifyPostExecutionChanges(ENV, pre, fakeGit({ "status --porcelain=v1 -uall": okGit("") }));
  assert.equal(r.ok, false);
  assert.equal(r.classification, "STOP:PREEXISTING_UNTRACKED_MODIFIED");
});

await test("null snapshot / ambiguous snapshot -> fail closed", async () => {
  const r1 = await classifyPostExecutionChanges(ENV, null, fakeGit({}));
  assert.equal(r1.ok, false);
  assert.ok(r1.reason_codes.includes("PREEXISTING_UNTRACKED_PROVENANCE_UNKNOWN"));
  const r2 = await classifyPostExecutionChanges(ENV, { ambiguous: true, paths: [] }, fakeGit({}));
  assert.equal(r2.ok, false);
  assert.ok(r2.reason_codes.includes("PREEXISTING_UNTRACKED_PROVENANCE_UNKNOWN"));
});

await test("tracked out-of-scope change at classification -> STOP (belt & braces)", async () => {
  const r = await classifyPostExecutionChanges(ENV, EMPTY_PRE, fakeGit({ "status --porcelain=v1 -uall": okGit(" M tools/x.mjs\n") }));
  assert.equal(r.ok, false);
  assert.equal(r.classification, "STOP:UNEXPECTED_FILE_CHANGES");
});

// ---------- full executor integration: new file gets staged + committed ----------
await test("integration: task-created new in-scope file flows into persistGit", async () => {
  const e = env({ test_command: undefined });
  let calls = 0;
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: e.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: e.target_remote + "\n" },
    "status --porcelain=v1 --untracked-files=no": { status: 0, stdout: "" },
    "status --porcelain=v1 -uall": () => {
      calls += 1;
      return calls >= 3 ? { status: 0, stdout: "?? docs/created.md\n" } : { status: 0, stdout: "" };
    },
  });
  const staged = [];
  const result = await executeLocalDevTask(e, {
    git,
    ensureQwenReady: async () => ({ ready: true, status: "READY", base_url: "http://127.0.0.1:8080", router_was_running: true, launch_performed: false }),
    guardStart: async () => ({ base_url: "http://127.0.0.1:1", getAccounting: () => ({ generation_requests_seen: 0, upstream_generation_requests: 0, blocked_generation_requests: 0, informational_requests_forwarded: 0, rejected_requests: 0, secret_bearing_requests_rejected: 0 }), close: async () => {} }),
    runOpenCodeTask: async () => ({ ok: true }),
    runTests: async () => [],
    persistGit: async ({ changedFiles }) => {
      staged.push(...changedFiles);
      return { ok: true, final_head: "d".repeat(40), staged_files: changedFiles };
    },
  });
  assert.equal(result.status, "PASS", JSON.stringify(result));
  assert.deepEqual(staged, ["docs/created.md"]);
  assert.deepEqual(result.task_created_new, ["docs/created.md"]);
  assert.equal(result.final_head, "d".repeat(40));
});

await test("integration: NOTHING_STAGEABLE semantics preserved via persistGit refusal", async () => {
  const e = env();
  let calls = 0;
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: e.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: e.target_remote + "\n" },
    "status --porcelain=v1 --untracked-files=no": { status: 0, stdout: "" },
    "status --porcelain=v1 -uall": () => {
      calls += 1;
      return calls >= 3 ? { status: 0, stdout: "?? docs/untouched-preexisting.md\n" } : { status: 0, stdout: "?? docs/untouched-preexisting.md\n" };
    },
  });
  const result = await executeLocalDevTask(e, {
    git,
    ensureQwenReady: async () => ({ ready: true, status: "READY", base_url: "http://127.0.0.1:8080", router_was_running: true, launch_performed: false }),
    guardStart: async () => ({ base_url: "http://127.0.0.1:1", getAccounting: () => ({ generation_requests_seen: 0, upstream_generation_requests: 0, blocked_generation_requests: 0, informational_requests_forwarded: 0, rejected_requests: 0, secret_bearing_requests_rejected: 0 }), close: async () => {} }),
    runOpenCodeTask: async () => ({ ok: true }),
    runTests: async () => [],
    persistGit: async ({ changedFiles }) => changedFiles.length === 0
      ? { ok: false, reason_codes: ["NOTHING_STAGEABLE_IN_SCOPE"] }
      : { ok: true, final_head: "d".repeat(40) },
  });
  assert.equal(result.status, "STOP");
  assert.equal(result.classification, "STOP:GIT_PERSISTENCE_FAILED");
  assert.ok(result.reason_codes.includes("NOTHING_STAGEABLE_IN_SCOPE"));
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
