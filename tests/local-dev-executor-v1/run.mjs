#!/usr/bin/env node
/**
 * Deterministic offline tests for LOCAL_DEV_EXECUTOR v1 critical invariants.
 * No Qwen. No OpenCode. No network. No live execution.
 *
 * Run: node tests/local-dev-executor-v1/run.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import {
  validateEnvelope,
  resolveDevProfile,
  preflight,
  executeLocalDevTask,
  evidenceSubject,
  ENVELOPE_SCHEMA,
  DEV_PROFILE_CATEGORY,
} from "../../tools/local-dev-executor-v1.mjs";
import {
  startLocalDevGenerationGuard,
  normalizeUpstreamOrigin,
  assertLoopbackBindHost,
  GuardConfigError,
} from "../../tools/local-dev-generation-guard-v1.mjs";
import {
  loadQwenLocalRuntime,
  PROFILE_IDS,
} from "../../tools/qwen-local-runtime-v1.mjs";

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

function validEnvelope(overrides = {}) {
  return {
    schema_version: ENVELOPE_SCHEMA,
    task_ref: "TEST_TASK_1",
    target_repo_path: "/repos/target",
    target_remote: "https://example.invalid/target.git",
    dispatch_base_head: "a".repeat(40),
    profile_id: "qwen38-opus-q3-cline-64k",
    task_delta: "Bounded change: update README section only. implement then test then correct corrective loop declared, test cycles: 2",
    allowed_paths: ["docs/**", "README.md"],
    allowed_commands: ["node --test tests/run.mjs", "git add", "git commit", "git push"],
    test_command: "node --test tests/run.mjs",
    network_policy: "localhost_only",
    timebox_seconds: 600,
    max_agent_turns: 8,
    max_test_cycles: 2,
    git_persistence_required: false,
    ...overrides,
  };
}

function fakeGit(script) {
  return async (repoPath, args) => {
    const key = args.join(" ");
    const handler = script[key];
    if (!handler) return { status: 1, stdout: "", stderr: `unexpected: ${key}` };
    return typeof handler === "function" ? await handler() : handler;
  };
}

// ---------- 1. valid envelope ----------
await test("valid envelope passes validation", () => {
  const r = validateEnvelope(validEnvelope());
  assert.equal(r.ok, true, JSON.stringify(r.reason_codes));
});

// ---------- 2. invalid envelope ----------
await test("invalid envelope rejected with codes", () => {
  const bad = validEnvelope({ timebox_seconds: 99999, max_agent_turns: 0, max_test_cycles: 9, network_policy: "open_internet", allowed_paths: [], allowed_commands: ["git reset --hard HEAD"] });
  const r = validateEnvelope(bad);
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ENVELOPE_INVALID"));
  assert.ok(r.reason_codes.includes("INVALID_TIMEBOX_SECONDS"));
  assert.ok(r.reason_codes.includes("INVALID_MAX_AGENT_TURNS"));
  assert.ok(r.reason_codes.includes("INVALID_MAX_TEST_CYCLES"));
  assert.ok(r.reason_codes.includes("INVALID_NETWORK_POLICY"));
  assert.ok(r.reason_codes.includes("MISSING_ALLOWED_PATHS"));
  assert.ok(r.reason_codes.includes("FORBIDDEN_COMMAND_IN_ALLOWLIST"));
});

await test("test cycles > 0 without declared loop rejected", () => {
  const r = validateEnvelope(validEnvelope({ max_test_cycles: 1, task_delta: "simple one-shot change" }));
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("TEST_CYCLES_WITHOUT_DECLARED_LOOP"));
});

// ---------- 3. repo identity mismatch ----------
await test("repo identity mismatch rejected", () => {
  const env = validEnvelope();
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: "b".repeat(40) + "\n" },
  });
  return preflight(env, { git }).then((r) => {
    assert.equal(r.ok, false);
    assert.equal(r.classification, "PREFLIGHT_REPO_IDENTITY_MISMATCH");
  });
});

await test("remote mismatch rejected", () => {
  const env = validEnvelope();
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: env.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: "https://other.invalid/x.git\n" },
  });
  return preflight(env, { git }).then((r) => {
    assert.equal(r.ok, false);
    assert.equal(r.classification, "PREFLIGHT_REPO_IDENTITY_MISMATCH");
  });
});

// ---------- 4. pre-existing untracked tolerated ----------
await test("pre-existing untracked files tolerated", () => {
  const env = validEnvelope();
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: env.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: env.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: "?? tools/old-script.sh\n?? notes.txt\n" },
  });
  return preflight(env, { git }).then((r) => assert.equal(r.ok, true));
});

// ---------- 5. tracked dirty outside scope rejected ----------
await test("tracked dirty outside scope rejected", () => {
  const env = validEnvelope();
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: env.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: env.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: " M tools/unrelated.mjs\n" },
  });
  return preflight(env, { git }).then((r) => {
    assert.equal(r.ok, false);
    assert.equal(r.classification, "PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE");
  });
});

await test("tracked dirty inside scope rejected as conflicting", () => {
  const env = validEnvelope();
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: env.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: env.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: " M README.md\n" },
  });
  return preflight(env, { git }).then((r) => {
    assert.equal(r.ok, false);
    assert.equal(r.classification, "PREFLIGHT_CONFLICTING_LOCAL_CHANGES");
  });
});

// ---------- 6. non-DEV profile rejected ----------
await test("production profile rejected in DEV domain", () => {
  const runtime = loadQwenLocalRuntime();
  const r = resolveDevProfile(runtime, "qwen38-opus-q3-agent-24k");
  assert.equal(r.ok, false);
  assert.equal(r.classification, "PROFILE_NOT_DEV_CATEGORY");
});

await test("cline-64k resolves as DEV profile from workstation_manual_profiles", () => {
  const runtime = loadQwenLocalRuntime();
  const r = resolveDevProfile(runtime, "qwen38-opus-q3-cline-64k");
  assert.equal(r.ok, true);
  assert.equal(r.profile.category, DEV_PROFILE_CATEGORY);
  assert.equal(r.model_id, "qwen38-opus-q3-cline-64k");
  assert.equal(r.profile.control_plane_eligible, false);
});

// ---------- 7. command/path enforcement ----------
await test("command allowlist blocks forbidden destructive command", () => {
  const r = validateEnvelope(validEnvelope({ allowed_commands: ["git reset --hard origin/main", "node x.mjs"], test_command: null }));
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("FORBIDDEN_COMMAND_IN_ALLOWLIST"));
});

await test("path enforcement: outside-scope path not allowed", async () => {
  const { pathAllowed } = await import("../../tools/local-dev-executor-v1.mjs");
  assert.equal(pathAllowed(["docs/**"], "docs/a/b.md"), true);
  assert.equal(pathAllowed(["docs/**"], "tools/a.mjs"), false);
  assert.equal(pathAllowed(["README.md"], "README.md"), true);
  assert.equal(pathAllowed(["README.md"], "docs/README.md"), false);
  assert.equal(pathAllowed(["src/*"], "src/a.ts"), true);
  assert.equal(pathAllowed(["src/*"], "src/sub/a.ts"), false);
});

// ---------- 8. generation guard blocks N+1 ----------
await test("guard blocks generation request N+1 at max_agent_turns", async () => {
  // local fake upstream on loopback
  const upstream = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
  const upstreamPort = upstream.address().port;

  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstreamPort}`,
    maxAgentTurns: 2,
  });
  try {
    assert.ok(guard.base_url.startsWith("http://127.0.0.1:"));
    assert.notEqual(guard.base_url, `http://127.0.0.1:${upstreamPort}`);

    const post = (url) =>
      fetch(`${url}/v1/chat/completions`, { method: "POST", body: "{}" });
    const r1 = await post(guard.base_url); assert.equal(r1.status, 200);
    const r2 = await post(guard.base_url); assert.equal(r2.status, 200);
    const r3 = await post(guard.base_url); assert.equal(r3.status, 429);
    const blocked = await r3.json();
    assert.equal(blocked.error.code, "BOUNDS_TURN_CEILING_EXCEEDED");

    const acc = guard.getAccounting();
    assert.equal(acc.upstream_generation_requests, 2);
    assert.equal(acc.blocked_generation_requests, 1);
    assert.equal(acc.generation_requests_seen, 3);
  } finally {
    await guard.close();
    upstream.close();
  }
});

await test("guard informational request forwarded, not counted", async () => {
  const upstream = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{}");
  });
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstream.address().port}`,
    maxAgentTurns: 1,
  });
  try {
    const models = await fetch(`${guard.base_url}/v1/models`);
    assert.equal(models.status, 200);
    const acc = guard.getAccounting();
    assert.equal(acc.upstream_generation_requests, 0);
    assert.equal(acc.informational_requests_forwarded, 1);
  } finally {
    await guard.close();
    upstream.close();
  }
});

await test("guard rejects non-loopback upstream and bind host", () => {
  assert.throws(() => normalizeUpstreamOrigin("https://127.0.0.1:8080"), GuardConfigError);
  assert.throws(() => normalizeUpstreamOrigin("http://192.168.1.5:8080"), GuardConfigError);
  assert.throws(() => assertLoopbackBindHost("0.0.0.0"), GuardConfigError);
});

// ---------- 9. provider-neutral PASS/STOP evidence ----------
await test("provider-neutral evidence subjects", () => {
  assert.equal(evidenceSubject(true, "T1"), "executor-pass: T1");
  assert.equal(evidenceSubject(false, "T2"), "executor-stop: T2");
});

await test("full offline path: no runners -> offline stop; evidence shape", async () => {
  const dir = mkdtempSync(join(tmpdir(), "lde-"));
  try {
    writeFileSync(join(dir, "README.md"), "# t\n");
    mkdirSync(join(dir, "tools"), { recursive: true });
    // real git repo: untracked tolerated, tracked dirty outside scope -> STOP
    const { execSync } = await import("node:child_process");
    const run = (args) => execSync(`git -C "${dir}" ${args}`, { encoding: "utf8" });
    run("init -q");
    run("config user.email t@t");
    run("config user.name t");
    writeFileSync(join(dir, "other.txt"), "x");
    run('add other.txt'); run('commit -q -m init');
    const head = run("rev-parse HEAD").trim();
    run('remote add origin https://example.invalid/target.git');

    const env = validEnvelope({
      target_repo_path: dir,
      target_remote: "https://example.invalid/target.git",
      dispatch_base_head: head,
    });
    const r = await executeLocalDevTask(env, {});
    assert.equal(r.classification, "STOP:OFFLINE_NO_RUNNERS");
    assert.equal(r.schema_version, "local-dev-execution-result-v1");
    assert.equal(r.actor, "local-dev-executor-v1");

    // now make tracked dirty outside scope -> preflight STOP
    writeFileSync(join(dir, "other.txt"), "y");
    const r2 = await executeLocalDevTask(env, {});
    assert.equal(r2.classification, "STOP:PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("injected happy path produces PASS evidence envelope", async () => {
  const env = validEnvelope();
  const session = { ready: true, status: "READY", base_url: "http://127.0.0.1:8080", router_was_running: true, launch_performed: false };

  // guard with 1-turn fake upstream to prove wiring + accounting
  const upstream = http.createServer((req, res) => { res.writeHead(200); res.end("{}"); });
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstream.address().port}`,
    maxAgentTurns: 2,
  });

  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: env.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: env.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: "" },
  });

  const result = await executeLocalDevTask(env, {
    git,
    ensureQwenReady: async () => session,
    guardStart: async () => guard,
    runOpenCodeTask: async ({ guardBaseUrl, modelSelector }) => {
      assert.ok(guardBaseUrl.startsWith("http://127.0.0.1:"));
      assert.equal(modelSelector, "qwen_local/qwen38-opus-q3-cline-64k");
      const r = await fetch(`${guardBaseUrl}/v1/chat/completions`, { method: "POST", body: "{}" });
      assert.equal(r.status, 200);
      return { ok: true };
    },
    runTests: async ({ testCommand, maxTestCycles }) => {
      assert.equal(testCommand, env.test_command);
      assert.equal(maxTestCycles, 2);
      return [{ command: testCommand, exit_code: 0, cycle: 1 }];
    },
    getChangedFiles: async () => ["docs/notes.md"],
    persistGit: null, // git_persistence_required=false
  });
  upstream.close();

  assert.equal(result.status, "PASS");
  assert.equal(result.classification, "PASS");
  assert.equal(result.profile_id, "qwen38-opus-q3-cline-64k");
  assert.equal(result.router_was_running, true);
  assert.equal(result.turns_used, 1);
  assert.deepEqual(result.changed_files, ["docs/notes.md"]);
  assert.equal(result.tests[0].exit_code, 0);
});

await test("test failure produces STOP:TEST_FAILED", async () => {
  const env = validEnvelope({ git_persistence_required: false });
  const upstream = http.createServer((req, res) => { res.writeHead(200); res.end("{}"); });
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
  const guard = await startLocalDevGenerationGuard({
    upstreamOrigin: `http://127.0.0.1:${upstream.address().port}`,
    maxAgentTurns: 2,
  });
  const git = fakeGit({
    "rev-parse HEAD": { status: 0, stdout: env.dispatch_base_head + "\n" },
    "remote get-url origin": { status: 0, stdout: env.target_remote + "\n" },
    "status --porcelain=v1 -uall": { status: 0, stdout: "" },
  });
  const result = await executeLocalDevTask(env, {
    git,
    ensureQwenReady: async () => ({ ready: true, status: "READY", base_url: "http://127.0.0.1:8080", router_was_running: true, launch_performed: false }),
    guardStart: async () => guard,
    runOpenCodeTask: async () => ({ ok: true }),
    runTests: async ({ testCommand }) => [{ command: testCommand, exit_code: 1, cycle: 1 }],
    getChangedFiles: async () => [],
  });
  upstream.close();
  assert.equal(result.classification, "STOP:TEST_FAILED");
});

// ---------- 10. production eligible set unchanged ----------
await test("production eligible set unchanged vs base HEAD (additive DEV fields only)", async () => {
  const { execSync } = await import("node:child_process");
  const runtime = loadQwenLocalRuntime();
  const base = JSON.parse(
    execSync("git show HEAD:configs/resources/qwen-local-runtime.json", { encoding: "utf8" }),
  );
  // Production sections must be deep-equal to base HEAD.
  assert.deepEqual(runtime.profiles, base.profiles);
  assert.deepEqual(runtime.role_to_profile_id, base.role_to_profile_id);
  assert.equal(runtime.startup_profile_id, base.startup_profile_id);
  assert.equal(runtime.next_wf40_executor_profile_id, base.next_wf40_executor_profile_id);
  // Exactly six production profiles; cline-64k never among them.
  assert.equal(Object.keys(runtime.profiles).length, PROFILE_IDS.length);
  for (const id of PROFILE_IDS) assert.ok(runtime.profiles[id]);
  assert.ok(!runtime.profiles["qwen38-opus-q3-cline-64k"]);
  // DEV profile additive-only: same manual entry plus category field.
  const manualNow = runtime.workstation_manual_profiles["qwen38-opus-q3-cline-64k"];
  const manualBase = base.workstation_manual_profiles["qwen38-opus-q3-cline-64k"];
  for (const [k, v] of Object.entries(manualBase)) assert.equal(manualNow[k], v);
  assert.equal(manualNow.category, DEV_PROFILE_CATEGORY);
  // NOTE: pre-existing production drift (module ROLE_TO_PROFILE_ID.FAST_AGENT
  // vs config role_to_profile_id.FAST_AGENT) is out of DEV scope and left
  // untouched; catalog tests failing at base HEAD remain a production-domain
  // follow-up, not a LOCAL_DEV regression.
});

// ---------- summary ----------
process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
