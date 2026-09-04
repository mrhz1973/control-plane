#!/usr/bin/env node
/**
 * Deterministic offline wiring tests for run-local-dev-executor-v1.
 * No Qwen. No OpenCode. No service start/stop. No real git repos mutated.
 *
 * Run: node tests/local-dev-executor-live-runner-v1/run.mjs
 */
import assert from "node:assert/strict";
import http from "node:http";
import { tmpdir as tmpdirRoot } from "node:os";
import { join } from "node:path";
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
      "status --porcelain=v1 --untracked-files=no": { status: 0, stdout: "" },
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
      "status --porcelain=v1 --untracked-files=no": { status: 0, stdout: "" },
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

// ---------- 11. LIVE SAFETY ENFORCEMENT ----------
await test("hard timeout bounds the OpenCode child process", async () => {
  const { makeRunOpenCodeTask } = await import("../../tools/run-local-dev-executor-v1.mjs");
  let killed = false;
  const neverResolvingSpawn = () => ({
    pid: 424242,
    promise: new Promise(() => {}), // simulates hung child
    getOutput: () => ({ stdout: "child stdout", stderr: "child stderr" }),
    terminate: async () => {
      killed = true;
      return {
        child_pid: 424242,
        termination_requested: true,
        termination_confirmed: true,
        termination_method: "test_child_handle",
        exit_code_after_termination: 143,
      };
    },
  });
  const run = makeRunOpenCodeTask({
    probe: () => ({ available: true, executable: "opencode-x", dispatch_interface_resolved: true, capabilities: null }),
    spawnProc: neverResolvingSpawn,
    makeTempConfig: () => "/tmp/x.json",
    removeTempConfig: () => {},
  });
  const t0 = Date.now();
  await assert.rejects(
    () => run({
      guardBaseUrl: "http://127.0.0.1:54321",
      modelId: "m", modelSelector: "qwen_local/m",
      providerOverlay: { provider: {} },
      capabilities: { subcommand: "run", directory_flag: "--dir", model_flag: "-m", format_flag: "--format", format_json_value: "json", auto_flag: "--auto" },
      envelope: { ...ENVELOPE, timebox_seconds: 1 },
    }),
    (e) => e.code === "BOUNDS_TIMEBOX_EXPIRED" &&
      e.timeout_diagnostics.termination_confirmed === true &&
      e.timeout_diagnostics.child_pid === 424242,
  );
  assert.equal(killed, true);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 5000, `timeout fired late: ${elapsed}ms`);
});

await test("default spawn handle terminates an exact harmless child", async () => {
  const { defaultSpawn } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const handle = defaultSpawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { shell: false });
  assert.ok(handle.pid);
  const startedPid = handle.pid;
  const termination = await handle.terminate();
  assert.equal(termination.child_pid, startedPid);
  assert.equal(termination.termination_requested, true);
  assert.equal(termination.termination_confirmed, true);
  assert.ok(["child.kill", "taskkill_pid_tree"].includes(termination.termination_method));
});

await test("timeout error propagates as STOP:BOUNDS_TIMEBOX_EXPIRED", async () => {
  const upstream = await fakeUpstream();
  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstream.address().port}`,
    maxAgentTurns: 4,
  });
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: ENVELOPE.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: ENVELOPE.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: "" },
  });
  let persistCalled = false;
  const r = await executeLocalDevTask(ENVELOPE, {
    git,
    ensureQwenReady: async () => ({ ready: true, status: "READY", base_url: `http://127.0.0.1:${upstream.address().port}`, router_was_running: true, launch_performed: false }),
    guardStart: async () => guard,
    runOpenCodeTask: async () => { throw Object.assign(new Error("timebox"), { code: "BOUNDS_TIMEBOX_EXPIRED" }); },
    runTests: async () => { throw new Error("must not test"); },
    persistGit: async () => { persistCalled = true; return { ok: true }; },
  });
  upstream.close();
  assert.equal(r.classification, "STOP:BOUNDS_TIMEBOX_EXPIRED");
  assert.ok(r.guard_accounting);
  assert.equal(r.guard_accounting.upstream_generation_requests, 0);
  assert.equal(r.turns_used, 0);
  assert.ok(r.reason_codes.includes("TASK_CHILD_TERMINATION_UNCONFIRMED"));
  assert.equal(persistCalled, false);
});

await test("out-of-scope tracked change produces STOP:UNEXPECTED_FILE_CHANGES", async () => {
  const upstream = await fakeUpstream();
  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstream.address().port}`,
    maxAgentTurns: 4,
  });
  let statusCall = 0;
  const git = async (repoPath, args) => {
    const key = args.join(" ");
    if (key === "rev-parse HEAD") return { status: 0, stdout: ENVELOPE.dispatch_base_head + "\n" };
    if (key === "remote get-url origin") return { status: 0, stdout: ENVELOPE.target_remote + "\n" };
    if (key === "status --porcelain=v1 -uall") return { status: 0, stdout: "" };
    if (key === "status --porcelain=v1 --untracked-files=no") {
      statusCall += 1;
      // first call = post-execution path enforcement: agent wrote outside scope
      return { status: 0, stdout: " M tools/outside.mjs\n M docs/ok.md\n" };
    }
    return { status: 1, stdout: "", stderr: `unexpected ${key}` };
  };
  let testsCalled = false, persistCalled = false;
  const r = await executeLocalDevTask(ENVELOPE, {
    git,
    ensureQwenReady: async () => ({ ready: true, status: "READY", base_url: `http://127.0.0.1:${upstream.address().port}`, router_was_running: true, launch_performed: false }),
    guardStart: async () => guard,
    runOpenCodeTask: async () => ({ ok: true }),
    runTests: async () => { testsCalled = true; return []; },
    persistGit: async () => { persistCalled = true; return { ok: true }; },
  });
  upstream.close();
  assert.equal(r.classification, "STOP:UNEXPECTED_FILE_CHANGES");
  assert.ok(r.reason_codes.some((c) => c.startsWith("PATH:")));
  assert.equal(testsCalled, false, "tests must not run after unexpected changes");
  assert.equal(persistCalled, false, "no staging/push after unexpected changes");
});

await test("permission overlay denies disallowed commands and allows allowlisted ones", async () => {
  const { buildPermissionOverlay } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const perm = buildPermissionOverlay({
    allowedCommands: ["node --test tests/run.mjs", "git status"],
    allowedPaths: ["docs/**"],
    networkPolicy: "localhost_only",
  });
  // ordered rule evaluation: last matching wins (V1 semantics via key order)
  const bashKeys = Object.keys(perm.bash);
  assert.equal(perm.bash["*"], "deny");
  assert.equal(perm.bash["node --test tests/run.mjs"], "allow");
  assert.equal(perm.bash["git status"], "allow");
  assert.ok(bashKeys.indexOf("*") < bashKeys.indexOf("node --test tests/run.mjs"));
  assert.equal(perm.edit["*"], "deny");
  assert.equal(perm.edit["docs/**"], "allow");
  assert.equal(perm.edit["docs/*"], "allow");
  // network fail-closed under both policies
  assert.equal(perm.webfetch, "deny");
  assert.equal(perm.websearch, "deny");
});

await test("permission overlay offline policy identical fail-closed web denial", async () => {
  const { buildPermissionOverlay } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const offline = buildPermissionOverlay({ allowedCommands: ["git status"], allowedPaths: ["README.md"], networkPolicy: "offline" });
  const localhost = buildPermissionOverlay({ allowedCommands: ["git status"], allowedPaths: ["README.md"], networkPolicy: "localhost_only" });
  assert.equal(offline.webfetch, "deny");
  assert.equal(offline.websearch, "deny");
  assert.equal(localhost.webfetch, "deny");
  assert.equal(localhost.websearch, "deny");
});

await test("runtime config merges provider + permission overlays", async () => {
  const { buildOpenCodeRuntimeConfig, buildPermissionOverlay } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const cfg = buildOpenCodeRuntimeConfig({
    providerOverlay: { $schema: "https://opencode.ai/config.json", provider: { qwen_local: {} } },
    permissionOverlay: buildPermissionOverlay({ allowedCommands: ["git status"], allowedPaths: ["docs/**"], networkPolicy: "localhost_only" }),
  });
  assert.ok(cfg.provider.qwen_local);
  assert.equal(cfg.permission.bash["*"], "deny");
  assert.equal(cfg.permission.bash["git status"], "allow");
  assert.equal(cfg.permission.webfetch, "deny");
});

await test("installed OpenCode CLI accepts the exact generated V1 config for both network policies", async () => {
  // schema-acceptance probe against the real installed CLI (no run, no model)
  const { execFile } = await import("node:child_process");
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { buildOpenCodeRuntimeConfig, buildPermissionOverlay } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const exe = join(process.env.APPDATA || "", "npm", "opencode.cmd");
  for (const networkPolicy of ["localhost_only", "offline"]) {
    const cfg = buildOpenCodeRuntimeConfig({
      providerOverlay: { $schema: "https://opencode.ai/config.json", provider: { qwen_local: {} } },
      permissionOverlay: buildPermissionOverlay({
        allowedCommands: ENVELOPE.allowed_commands,
        allowedPaths: ENVELOPE.allowed_paths,
        networkPolicy,
      }),
    });
    assert.equal("_network_policy" in cfg.permission, false);
    assert.equal(cfg.permission.webfetch, "deny");
    assert.equal(cfg.permission.websearch, "deny");
    assert.equal(cfg.permission.bash["*"], "deny");
    assert.equal(cfg.permission.bash[ENVELOPE.allowed_commands[0]], "allow");
    assert.equal(cfg.permission.edit["*"], "deny");
    assert.equal(cfg.permission.edit["docs/**"], "allow");
    assert.ok(cfg.provider.qwen_local);
    const dir = mkdtempSync(join(tmpdir(), "lde-schema-probe-"));
    const cfgPath = join(dir, "opencode.json");
    writeFileSync(cfgPath, JSON.stringify(cfg), "utf8");
    try {
      const result = await new Promise((resolvePromise) => {
        execFile(exe, ["debug", "config"], { env: { ...process.env, OPENCODE_CONFIG: cfgPath }, windowsHide: true, shell: process.platform === "win32" }, (err, stdout) => resolvePromise({ err, stdout: stdout || "" }));
      });
      assert.ok(!result.err, `cli rejected ${networkPolicy}: ${result.err?.message}`);
      assert.ok(!/Error|invalid/i.test(result.stdout), result.stdout.slice(0, 200));
      assert.ok(result.stdout.includes('"permission"'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

await test("production domain remains untouched by enforcement layer", async () => {
  const { readFileSync } = await import("node:fs");
  const runner = readFileSync(new URL("../../tools/run-local-dev-executor-v1.mjs", import.meta.url), "utf8");
  const executor = readFileSync(new URL("../../tools/local-dev-executor-v1.mjs", import.meta.url), "utf8");
  for (const src of [runner, executor]) {
    assert.ok(!src.includes("opencode-execution-adapter-v1"));
    assert.ok(!src.includes("operator-runtime-authorization"));
    assert.ok(!src.includes("qwen-execution-scope-v3"));
  }
});

// ---------- 12. WINDOWS OPENCODE SHIM SPAWN ----------
await test("resolveOpenCodeSpawnTarget: real .cmd shim resolves to package binary", async () => {
  const { resolveOpenCodeSpawnTarget } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const appdata = process.env.APPDATA;
  const shim = join(appdata, "npm", "opencode.cmd");
  const t = resolveOpenCodeSpawnTarget(shim);
  assert.ok(t.executable, JSON.stringify(t));
  assert.ok(t.executable.endsWith("opencode.exe"));
  assert.ok(!t.executable.endsWith(".cmd"));
  assert.equal(t.resolved_from, "npm-package-real-binary");
  assert.ok(t.executable.startsWith(join(appdata, "npm", "node_modules")));
});

await test("resolveOpenCodeSpawnTarget: unresolvable .cmd rejected fail-closed (no shell fallback)", async () => {
  const { resolveOpenCodeSpawnTarget } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const savedAppdata = process.env.APPDATA;
  process.env.APPDATA = join(tmpdirRoot(), "nonexistent-appdata");
  try {
    const t = resolveOpenCodeSpawnTarget("C:\\fake\\npm\\opencode.cmd");
    assert.equal(t.executable, null);
    assert.equal(t.reason_code, "OPENCODE_CMD_SHIM_UNRESOLVED");
  } finally {
    process.env.APPDATA = savedAppdata;
  }
});

await test("resolveOpenCodeSpawnTarget: direct executable passthrough unchanged", async () => {
  const { resolveOpenCodeSpawnTarget } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const t = resolveOpenCodeSpawnTarget("C:\\tools\\my-opencode.exe");
  assert.equal(t.executable, "C:\\tools\\my-opencode.exe");
  assert.equal(t.resolved_from, "direct");
});

await test("real spawn of .cmd-resolved target: no EINVAL, argv literal, config/cwd survive, one process", async () => {
  const { makeRunOpenCodeTask, resolveOpenCodeSpawnTarget } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const shim = join(process.env.APPDATA, "npm", "opencode.cmd");
  const target = resolveOpenCodeSpawnTarget(shim);
  assert.ok(target.executable, "real binary must resolve on this workstation");
  const spied = [];
  const run = makeRunOpenCodeTask({
    probe: () => ({ available: true, executable: shim, dispatch_interface_resolved: true, capabilities: null }),
    spawnProc: async (exe, argv, opts) => {
      spied.push({ exe, argv, opts });
      return { status: 0, stdout: "{}", stderr: "" };
    },
    makeTempConfig: () => "/tmp/fake.json",
    removeTempConfig: () => {},
  });
  const tricky = {
    ...ENVELOPE,
    task_delta: "quote ' ` & | < > %PATH% ^ caret ; semicolon",
    allowed_paths: ["docs/**"],
  };
  const out = await run({
    guardBaseUrl: "http://127.0.0.1:54321",
    modelId: "qwen38-opus-q3-cline-64k",
    modelSelector: "qwen_local/qwen38-opus-q3-cline-64k",
    providerOverlay: { provider: {} },
    capabilities: { subcommand: "run", directory_flag: "--dir", model_flag: "-m", format_flag: "--format", format_json_value: "json", auto_flag: "--auto" },
    envelope: tricky,
  });
  assert.equal(out.ok, true);
  assert.equal(out.opencode_execution_count, 1);
  assert.equal(spied.length, 1, "exactly one task process");
  assert.equal(spied[0].exe, target.executable); // real binary, not the shim
  assert.equal(spied[0].opts.shell, false);      // no-shell literal argv
  assert.equal(spied[0].opts.cwd, tricky.target_repo_path);
  assert.equal(spied[0].opts.env.OPENCODE_CONFIG, "/tmp/fake.json");
  // metacharacter-laden message survives as ONE literal argv element
  const msgArg = spied[0].argv[spied[0].argv.length - 1];
  assert.ok(msgArg.includes("quote ' ` & | < > %PATH% ^ caret ; semicolon"));
  assert.equal(typeof msgArg, "string");
  assert.ok(msgArg.includes(tricky.task_delta));
});

await test("spawn target resolution is applied inside makeRunOpenCodeTask (fail-closed on unresolvable shim)", async () => {
  const { makeRunOpenCodeTask } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const savedAppdata = process.env.APPDATA;
  process.env.APPDATA = join(tmpdirRoot(), "nonexistent-appdata");
  try {
    const run = makeRunOpenCodeTask({
      probe: () => ({ available: true, executable: "C:\\fake\\npm\\opencode.cmd", dispatch_interface_resolved: true, capabilities: null }),
      spawnProc: async () => { throw new Error("must not spawn"); },
      makeTempConfig: () => "/tmp/fake.json",
      removeTempConfig: () => {},
    });
    await assert.rejects(
      () => run({
        guardBaseUrl: "http://127.0.0.1:54321",
        modelId: "m", modelSelector: "qwen_local/m",
        providerOverlay: { provider: {} },
        capabilities: { subcommand: "run" },
        envelope: ENVELOPE,
      }),
      (e) => e.code === "OPENCODE_CMD_SHIM_UNRESOLVED",
    );
  } finally {
    process.env.APPDATA = savedAppdata;
  }
});

await test("no-shell spawn of real binary does not produce EINVAL (real smoke, no model)", async () => {
  // spawnSync-free: directly spawn the resolved real binary with --version.
  const { resolveOpenCodeSpawnTarget } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const { spawn } = await import("node:child_process");
  const shim = join(process.env.APPDATA, "npm", "opencode.cmd");
  const target = resolveOpenCodeSpawnTarget(shim);
  assert.ok(target.executable);
  const p = spawn(target.executable, ["--version"], { shell: false, windowsHide: true });
  const code = await new Promise((resolvePromise) => {
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("error", () => resolvePromise({ err: true, out }));
    p.on("close", (c) => resolvePromise({ err: false, code: c, out }));
  });
  assert.equal(code.err, false, "spawn error (EINVAL?) on real binary");
  assert.equal(code.code, 0);
  assert.match(code.out.trim(), /^1\.\d+\.\d+/);
});

// ---------- 13. OPENCODE FAILURE EVIDENCE ----------
await test("non-zero OpenCode exit preserves sanitized bounded diagnostics", async () => {
  const { buildOpenCodeFailureDiagnostics } = await import("../../tools/local-dev-executor-v1.mjs");
  const d = buildOpenCodeFailureDiagnostics({
    opencode_exit_code: 1,
    stderr: `fatal Authorization: Bearer secret-token ${"x".repeat(3000)}`,
    stdout: `tooling output ${"y".repeat(3000)}`,
  });
  assert.equal(d.opencode_exit_code, 1);
  assert.equal(d.stderr_excerpt.length, 2000);
  assert.equal(d.stdout_excerpt.length, 2000);
  assert.ok(!d.stderr_excerpt.includes("secret-token"));
  assert.ok(d.stderr_excerpt.includes("[REDACTED]"));
});

await test("spawn failure is structurally distinct from clean non-zero exit", async () => {
  const { makeRunOpenCodeTask } = await import("../../tools/run-local-dev-executor-v1.mjs");
  const run = makeRunOpenCodeTask({
    probe: () => ({ available: true, executable: "opencode-test.exe", dispatch_interface_resolved: true, capabilities: null }),
    spawnProc: async () => ({ status: 1, stdout: "", stderr: "", spawn_error: "spawn failed", spawn_error_code: "ENOENT", spawn_failure: true }),
    makeTempConfig: () => "/tmp/fake.json",
    removeTempConfig: () => {},
  });
  await assert.rejects(
    () => run({
      guardBaseUrl: "http://127.0.0.1:54321", modelId: "m", modelSelector: "qwen_local/m",
      providerOverlay: { provider: {} },
      capabilities: { subcommand: "run", directory_flag: "--dir", model_flag: "-m", format_flag: "--format", format_json_value: "json", auto_flag: "--auto" },
      envelope: ENVELOPE,
    }),
    (e) => e.code === "OPENCODE_RUN_FAILED" && e.opencode_exit_code === 1 &&
      e.spawn_failure === true && e.spawn_error_code === "ENOENT",
  );
});

await test("STOP:OPENCODE_RUN_FAILED propagates failure evidence; PASS has none", async () => {
  const { executeLocalDevTask } = await import("../../tools/local-dev-executor-v1.mjs");
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: ENVELOPE.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: ENVELOPE.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: "" },
    "status --porcelain=v1 --untracked-files=no": { status: 0, stdout: "" },
  });
  const guardFactory = async () => ({
    base_url: "http://127.0.0.1:54321",
    getAccounting: () => ({ upstream_generation_requests: 0, blocked_generation_requests: 0 }),
    close: async () => {},
  });
  const failed = await executeLocalDevTask(ENVELOPE, {
    git,
    ensureQwenReady: async () => ({ ready: true, status: "READY", router_was_running: true }),
    guardStart: guardFactory,
    runOpenCodeTask: async () => {
      throw Object.assign(new Error("exit 1"), {
        code: "OPENCODE_RUN_FAILED", opencode_exit_code: 1,
        stdout: "stdout tooling", stderr: "stderr tooling",
      });
    },
    runTests: async () => { throw new Error("must not test"); },
    persistGit: async () => { throw new Error("must not persist"); },
  });
  assert.equal(failed.classification, "STOP:OPENCODE_RUN_FAILED");
  assert.equal(failed.failure_diagnostics.opencode_exit_code, 1);
  assert.equal(failed.failure_diagnostics.stdout_excerpt, "stdout tooling");
  assert.equal(failed.failure_diagnostics.stderr_excerpt, "stderr tooling");

  const passed = await executeLocalDevTask(ENVELOPE, {
    git,
    ensureQwenReady: async () => ({ ready: true, status: "READY", router_was_running: true }),
    guardStart: guardFactory,
    runOpenCodeTask: async () => ({ ok: true }),
    runTests: async () => [{ command: "test", exit_code: 0, cycle: 1 }],
    getChangedFiles: async () => [],
    persistGit: async () => ({ ok: true, final_head: ENVELOPE.dispatch_base_head }),
  });
  assert.equal(passed.status, "PASS");
  assert.equal("failure_diagnostics" in passed, false);
});

// ---------- summary ----------
process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
// Explicit exit: the CLI schema-acceptance probe spawns a shell (.cmd) child
// whose handle can keep the event loop alive after all tests complete.
process.exit(failures.length ? 1 : 0);
