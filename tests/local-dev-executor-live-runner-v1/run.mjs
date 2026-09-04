#!/usr/bin/env node
/**
 * Deterministic offline wiring tests for run-local-dev-executor-v1.
 * No Qwen. No OpenCode. No service start/stop. No real git repos mutated.
 *
 * Run: node tests/local-dev-executor-live-runner-v1/run.mjs
 */
import assert from "node:assert/strict";
import http from "node:http";
import {
  composeRunners,
  makeEnsureQwenReady,
  makeRunOpenCodeTask,
  makeRunTests,
  makePersistGit,
  buildTaskMessage,
  releaseRouterIfStarted,
  DIRECT_QWEN_ENDPOINT,
} from "../../tools/run-local-dev-executor-v1.mjs";
import { executeLocalDevTask, evidenceSubject } from "../../tools/local-dev-executor-v1.mjs";
import { startLocalDevGenerationGuard } from "../../tools/local-dev-generation-guard-v1.mjs";

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

function fakeUpstream() {
  return new Promise((r) => {
    const server = http.createServer((req, res) => { res.writeHead(200); res.end("{}"); });
    server.listen(0, "127.0.0.1", () => r(server));
  });
}

const ENVELOPE = {
  schema_version: "local-dev-task-envelope-v1",
  task_ref: "WIRING_TEST_1",
  target_repo_path: "/repos/target",
  target_remote: "https://example.invalid/target.git",
  dispatch_base_head: "a".repeat(40),
  profile_id: "qwen38-opus-q3-cline-64k",
  task_delta: "Bounded change: docs only. implement then test then correct corrective loop declared, test cycles: 2",
  allowed_paths: ["docs/**", "README.md"],
  allowed_commands: ["node --test tests/run.mjs"],
  test_command: "node --test tests/run.mjs",
  network_policy: "localhost_only",
  timebox_seconds: 600,
  max_agent_turns: 4,
  max_test_cycles: 2,
  git_persistence_required: true,
};

function fakeGit(script) {
  const calls = [];
  const fn = async (repoPath, args) => {
    calls.push([repoPath, ...args]);
    const handler = script[args.join(" ")] ?? script[args[0]];
    if (!handler) return { status: 1, stdout: "", stderr: `unexpected: ${args.join(" ")}` };
    return typeof handler === "function" ? await handler() : handler;
  };
  fn.calls = calls;
  return fn;
}

// ---------- 1. envelope reaches executor (validation in wiring path) ----------
await test("envelope reaches executor: invalid envelope stops at executor validation", async () => {
  const bad = { ...ENVELOPE, timebox_seconds: 99999 };
  const runners = composeRunners({
    ensureQwenReady: async () => { throw new Error("must not be called"); },
  });
  const r = await executeLocalDevTask(bad, runners);
  assert.equal(r.classification, "STOP:ENVELOPE_INVALID");
  assert.ok(r.reason_codes.includes("INVALID_TIMEBOX_SECONDS"));
});

await test("valid envelope flows through wiring to preflight", async () => {
  const runners = composeRunners({
    ensureQwenReady: async () => { throw new Error("must not be called before preflight"); },
  });
  // identity mismatch -> preflight STOP happens BEFORE ensureQwenReady
  let ensureCalled = false;
  const r = await executeLocalDevTask(ENVELOPE, {
    ...runners,
    ensureQwenReady: async () => { ensureCalled = true; return { ready: true }; },
    git: async (p, args) => {
      if (args[0] === "rev-parse") return { status: 0, stdout: "b".repeat(40) + "\n" };
      return { status: 0, stdout: "" };
    },
  });
  assert.equal(r.classification, "STOP:PREFLIGHT_REPO_IDENTITY_MISMATCH");
  assert.equal(ensureCalled, false);
});

// ---------- 2. DEV profile preserved end-to-end ----------
await test("DEV profile preserved through ensureQwenReady call and result", async () => {
  const upstream = await fakeUpstream();
  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstream.address().port}`,
    maxAgentTurns: 4,
  });
  let seenProfile = null;
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: ENVELOPE.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: ENVELOPE.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: "" },
  });
  const ensure = makeEnsureQwenReady(async ({ profile }) => {
    seenProfile = profile;
    return { ready: true, status: "READY", base_url: `http://127.0.0.1:${upstream.address().port}`, launch_performed: false };
  });
  const r = await executeLocalDevTask(ENVELOPE, {
    git,
    ensureQwenReady: ensure,
    guardStart: async () => guard,
    runOpenCodeTask: async () => ({ ok: true }),
    runTests: async ({ testCommand }) => [{ command: testCommand, exit_code: 0, cycle: 1 }],
    getChangedFiles: async () => ["docs/a.md"],
    persistGit: async ({ evidenceSubject: s }) => ({ ok: true, final_head: "c".repeat(40) }),
  });
  upstream.close();
  assert.equal(r.classification, "PASS", JSON.stringify(r));
  assert.equal(seenProfile, "qwen38-opus-q3-cline-64k");
  assert.equal(r.profile_id, "qwen38-opus-q3-cline-64k");
  assert.equal(r.status, "PASS");
  assert.equal(r.final_head, "c".repeat(40));
});

await test("makeEnsureQwenReady maps READY -> router_was_running=true", async () => {
  const ensure = makeEnsureQwenReady(async () => ({ ready: true, status: "READY", base_url: "http://127.0.0.1:8080", launch_performed: false }));
  const s = await ensure({ profile: "qwen38-opus-q3-cline-64k" });
  assert.equal(s.router_was_running, true);
  const ensure2 = makeEnsureQwenReady(async () => ({ ready: true, status: "LAUNCH_STARTED_AND_READY", base_url: "http://127.0.0.1:8080", launch_performed: true }));
  const s2 = await ensure2({ profile: "x" });
  assert.equal(s2.router_was_running, false);
});

// ---------- 3. guard URL reaches OpenCode collaborator, never :8080 ----------
await test("runOpenCodeTask rejects direct :8080 target", async () => {
  const run = makeRunOpenCodeTask({ probe: () => ({ available: true, dispatch_interface_resolved: true, capabilities: { subcommand: "run" } }) });
  await assert.rejects(
    () => run({ guardBaseUrl: DIRECT_QWEN_ENDPOINT, modelId: "m", modelSelector: "qwen_local/m", providerOverlay: {}, capabilities: { subcommand: "run" }, envelope: ENVELOPE }),
    (e) => e.code === "GUARD_TARGET_IS_DIRECT_QWEN_ENDPOINT",
  );
});

await test("concrete guard URL reaches OpenCode collaborator (loopback, not 8080)", async () => {
  const upstream = await fakeUpstream();
  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstream.address().port}`,
    maxAgentTurns: 4,
  });
  try {
    let captured = null;
    const git = fakeGit({
      "rev-parse HEAD": { status: 0, stdout: ENVELOPE.dispatch_base_head + "\n" },
      "remote get-url origin": { status: 0, stdout: ENVELOPE.target_remote + "\n" },
      "status --porcelain=v1 -uall": { status: 0, stdout: "" },
    });
    const result = await executeLocalDevTask(ENVELOPE, {
      git,
      ensureQwenReady: async () => ({ ready: true, status: "READY", base_url: `http://127.0.0.1:${upstream.address().port}`, router_was_running: true, launch_performed: false }),
      guardStart: async () => guard,
      runOpenCodeTask: async ({ guardBaseUrl, modelSelector, providerOverlay, capabilities }) => {
        captured = { guardBaseUrl, modelSelector, hasOverlay: Boolean(providerOverlay?.provider), capabilities };
        return { ok: true };
      },
      runTests: async ({ testCommand }) => [{ command: testCommand, exit_code: 0, cycle: 1 }],
      getChangedFiles: async () => [],
      persistGit: async () => ({ ok: true, final_head: "d".repeat(40) }),
    });
    assert.equal(result.classification, "PASS");
    assert.ok(captured.guardBaseUrl.startsWith("http://127.0.0.1:"), captured.guardBaseUrl);
    assert.notEqual(captured.guardBaseUrl, DIRECT_QWEN_ENDPOINT);
    assert.notEqual(captured.guardBaseUrl.endsWith(":8080"), true);
    assert.equal(captured.modelSelector, "qwen_local/qwen38-opus-q3-cline-64k");
    assert.equal(captured.hasOverlay, true);
    assert.equal(captured.capabilities.subcommand, "run");
  } finally {
    await guard.close();
    upstream.close();
  }
});

await test("makeRunOpenCodeTask probes opencode and builds argv with guard URL config", async () => {
  const madeConfigs = [];
  const run = makeRunOpenCodeTask({
    probe: () => ({ available: true, version: "1.18.0", executable: "opencode-test", dispatch_interface_resolved: true, capabilities: null }),
    spawnProc: async (exe, argv, opts) => {
      madeConfigs.push({ exe, argv, opts });
      return { status: 0, stdout: "{}", stderr: "" };
    },
    makeTempConfig: (overlay) => {
      madeConfigs.push({ overlay });
      return "/tmp/fake-opencode.json";
    },
    removeTempConfig: () => {},
  });
  const out = await run({
    guardBaseUrl: "http://127.0.0.1:54321",
    modelId: "qwen38-opus-q3-cline-64k",
    modelSelector: "qwen_local/qwen38-opus-q3-cline-64k",
    providerOverlay: { provider: {} },
    capabilities: { subcommand: "run", directory_flag: "--dir", model_flag: "-m", format_flag: "--format", format_json_value: "json", auto_flag: "--auto" },
    envelope: ENVELOPE,
  });
  assert.equal(out.ok, true);
  assert.equal(out.opencode_execution_count, 1);
  const spawnCall = madeConfigs.find((c) => c.argv);
  assert.equal(spawnCall.exe, "opencode-test");
  assert.equal(spawnCall.argv[0], "run");
  assert.ok(spawnCall.argv.includes("--dir"));
  assert.ok(spawnCall.argv.includes("qwen_local/qwen38-opus-q3-cline-64k"));
  assert.ok(spawnCall.opts.env.OPENCODE_CONFIG.endsWith("fake-opencode.json"));
  const overlayCall = madeConfigs.find((c) => c.overlay);
  assert.ok(overlayCall.overlay.provider);
});

// ---------- 4. production authorization never invoked ----------
await test("no production authorization surface in wiring (no imports/paths of production auth)", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../../tools/run-local-dev-executor-v1.mjs", import.meta.url), "utf8");
  assert.ok(!src.includes("opencode-execution-adapter-v1"));
  assert.ok(!src.includes("operator-runtime-authorization"));
  assert.ok(!src.includes("qwen-execution-scope-v3"));
  assert.ok(!src.includes("spend-ledger"));
  assert.ok(!src.includes("provenance"));
});

await test("persistGit stages only allowed paths and never untracked", async () => {
  const git = fakeGit({
    "add": { status: 0, stdout: "" },
    "commit": { status: 0, stdout: "" },
    "push": { status: 0, stdout: "" },
    "rev-parse HEAD": { status: 0, stdout: "e".repeat(40) + "\n" },
  });
  const persist = makePersistGit({ gitExec: git });
  const out = await persist({
    envelope: ENVELOPE,
    changedFiles: ["docs/a.md", "docs/b.md", "tools/untracked-new.mjs"],
    evidenceSubject: evidenceSubject(true, ENVELOPE.task_ref),
  });
  assert.equal(out.ok, true);
  const addCall = git.calls.find((c) => c[1] === "add");
  assert.deepEqual(addCall.slice(2), ["--", "docs/a.md", "docs/b.md"]);
  assert.equal(out.staged_files.length, 2);
});

await test("persistGit fails closed when nothing stageable in scope", async () => {
  const persist = makePersistGit({ gitExec: fakeGit({}) });
  const out = await persist({ envelope: ENVELOPE, changedFiles: ["tools/x.mjs"], evidenceSubject: "executor-stop: T" });
  assert.equal(out.ok, false);
  assert.deepEqual(out.reason_codes, ["NOTHING_STAGEABLE_IN_SCOPE"]);
});

// ---------- 5. PASS/STOP result propagation ----------
await test("runner subjects propagate: executor-pass/executor-stop", () => {
  assert.equal(evidenceSubject(true, "T1"), "executor-pass: T1");
  assert.equal(evidenceSubject(false, "T2"), "executor-stop: T2");
});

await test("STOP propagation through composed wiring (qwen not ready)", async () => {
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: ENVELOPE.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: ENVELOPE.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: "" },
  });
  const r = await executeLocalDevTask(ENVELOPE, {
    git,
    ensureQwenReady: async () => ({ ready: false, status: "READINESS_TIMEOUT", router_was_running: false, launch_performed: false }),
    guardStart: async () => { throw new Error("must not start"); },
    runOpenCodeTask: async () => { throw new Error("must not run"); },
    runTests: async () => { throw new Error("must not test"); },
    persistGit: async () => { throw new Error("must not persist"); },
  });
  assert.equal(r.classification, "STOP:QWEN_SESSION_NOT_READY");
  assert.equal(r.status, "STOP");
});

await test("runTests bounded: stops at max cycles, breaks on success", async () => {
  const runs = [];
  const spawnProc = async () => { runs.push(1); return { status: runs.length >= 2 ? 0 : 1 }; };
  const runTests = makeRunTests({ spawnProc });
  const out = await runTests({ testCommand: "node --test tests/run.mjs", maxTestCycles: 2, repoPath: "/repos/target" });
  assert.equal(out.length, 2);
  assert.equal(out[0].exit_code, 1);
  assert.equal(out[1].exit_code, 0);
  const out2 = await makeRunTests({ spawnProc: async () => { runs.push(1); return { status: 0 }; } })({ testCommand: "x", maxTestCycles: 3, repoPath: "/r" });
  assert.equal(out2.length, 1);
});

await test("buildTaskMessage is bounded and structural", () => {
  const msg = buildTaskMessage(ENVELOPE);
  assert.ok(msg.includes("LOCAL_DEV task WIRING_TEST_1"));
  assert.ok(msg.length <= 4000);
});

await test("releaseRouterIfStarted: not owned -> no release", async () => {
  const out = await releaseRouterIfStarted({ launch_performed: false }, { runPowerShell: async () => { throw new Error("must not run"); } });
  assert.deepEqual(out, { released: false, reason: "not_owned" });
});

// ---------- summary ----------
process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
