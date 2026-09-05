/**
 * Deterministic offline tests for the LOCAL_DEV convergence remediation V1
 * (V4_LOCAL_DEV_EXECUTOR_OPENCODE_PERMISSION_AND_NEW_FILE_CONVERGENCE_REMEDIATION_V1).
 *
 * Covers the 10 operator-mandated regressions. No Qwen. No OpenCode run.
 * (The `debug config` gate itself is exercised with injected fakes; the real
 * installed-OpenCode acceptance was verified in the Phase-1 evidence report.)
 *
 * Run: node tests/local-dev-convergence-remediation-v1/run.mjs
 */
import assert from "node:assert/strict";
import {
  buildTaskMessage,
  buildPermissionOverlay,
  makeRunOpenCodeTask,
} from "../../tools/run-local-dev-executor-v1.mjs";
import { inferTaskKind, buildTaskDelta } from "../../tools/bridge-backlog-to-local-dev-envelope-v1.mjs";
import { validateEnvelope } from "../../tools/local-dev-executor-v1.mjs";

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

const HEAD = "c".repeat(40);

function env(overrides = {}) {
  return {
    schema_version: "local-dev-task-envelope-v1",
    task_ref: "T_R1",
    target_repo_path: "/repos/target",
    target_remote: "https://example.invalid/target.git",
    dispatch_base_head: HEAD,
    profile_id: "qwen38-opus-q3-opencode-24k",
    task_delta: "Objective: Update existing notes.\nExecution mode: MODIFY â€” operate on the existing target using the permitted file edit tool.",
    task_kind: "MODIFY",
    allowed_paths: ["docs/**"],
    allowed_commands: ["git status --short", "git diff --check"],
    test_command: "git diff --check",
    network_policy: "localhost_only",
    timebox_seconds: 600,
    max_agent_turns: 8,
    max_test_cycles: 0,
    git_persistence_required: true,
    ...overrides,
  };
}

// 1. CREATE objective includes explicit absent-target/create-directly shaping
await test("R1 CREATE objective carries create-directly, absence-expected shaping", () => {
  const b = { objective: "Create a new file docs/runtime/NOTES.md with the marker", scope: { forbidden_areas: [] } };
  const kind = inferTaskKind(b);
  assert.equal(kind, "CREATE");
  const delta = buildTaskDelta(b, 0);
  assert.ok(delta.includes("Execution mode: CREATE"));
  assert.ok(delta.includes("MAY NOT EXIST"));
  assert.ok(delta.includes("do NOT read the target before initial creation"));
  assert.ok(delta.includes("do NOT use shell commands to test"));
  // generic: different wording still detected
  assert.equal(inferTaskKind({ objective: "Add a new report file summarizing Q3" }), "CREATE");
  assert.equal(inferTaskKind({ objective: "Append the marker to docs/runtime/LOG.md" }), "CREATE");
});

// 2. MODIFY objective does not falsely claim target is absent
await test("R2 MODIFY objective gets MODIFY mode, no absence claim", () => {
  const b = { objective: "Update the version header in docs/README.md", scope: { forbidden_areas: [] } };
  assert.equal(inferTaskKind(b), "MODIFY");
  const delta = buildTaskDelta(b, 0);
  assert.ok(delta.includes("Execution mode: MODIFY"));
  assert.ok(!delta.includes("MAY NOT EXIST"));
  const msg = buildTaskMessage(env({ task_delta: delta, task_kind: "MODIFY" }));
  assert.ok(!msg.includes("MAY NOT EXIST"));
});

// 3. shell discovery is not added automatically
await test("R3 no filesystem-discovery commands auto-added to bash allowlist", () => {
  const overlay = buildPermissionOverlay({
    allowedCommands: ["git status --short", "git diff --check"],
    allowedPaths: ["docs/**"],
    networkPolicy: "localhost_only",
  });
  for (const banned of ["Test-Path", "dir", "ls", "find", "Get-ChildItem"]) {
    assert.notEqual(overlay.bash[banned], "allow");
  }
  assert.equal(overlay.bash["*"], "deny");
  assert.deepEqual(Object.keys(overlay.bash).filter((k) => overlay.bash[k] === "allow").sort(),
    ["git diff --check", "git status --short"]);
});

// 4. permission overlay remains deny-all-first
await test("R4 overlay is deny-all-first for bash and edit", () => {
  const overlay = buildPermissionOverlay({
    allowedCommands: [], allowedPaths: [], networkPolicy: "localhost_only",
  });
  assert.equal(overlay.bash["*"], "deny");
  assert.equal(overlay.edit["*"], "deny");
  assert.equal(overlay.webfetch, "deny");
  assert.equal(overlay.websearch, "deny");
  const o2 = buildPermissionOverlay({
    allowedCommands: ["git diff --check"], allowedPaths: ["docs/runtime/CAMPAIGN_NOTES.md"], networkPolicy: "localhost_only",
  });
  assert.equal(o2.bash["*"], "deny");
  assert.equal(o2.edit["*"], "deny");
  assert.equal(o2.edit["docs/runtime/CAMPAIGN_NOTES.md"], "allow");
});

// 5. allowed_commands remain the sole ordinary bash allowlist source
await test("R5 bash allows exactly envelope allowed_commands", () => {
  const overlay = buildPermissionOverlay({
    allowedCommands: ["git status --short", "git diff --check"], allowedPaths: [], networkPolicy: "localhost_only",
  });
  assert.deepEqual(Object.keys(overlay.bash).filter((k) => overlay.bash[k] === "allow").sort(), ["git diff --check", "git status --short"]);
});

// 6. new-file allowed path receives the exact edit permission (edit covers create in installed 1.18.25 â€” no separate write key)
await test("R6 allowed_paths map to edit allow; no invented write/create keys", () => {
  const overlay = buildPermissionOverlay({
    allowedCommands: [], allowedPaths: ["docs/runtime/CAMPAIGN_NOTES.md", "reports/**"], networkPolicy: "localhost_only",
  });
  assert.equal(overlay.edit["docs/runtime/CAMPAIGN_NOTES.md"], "allow");
  assert.equal(overlay.edit["reports/**"], "allow");
  assert.equal(overlay.edit["reports/*"], "allow"); // V1 dual-form prefix exposure
  for (const key of Object.keys(overlay)) {
    assert.ok(["bash", "edit", "webfetch", "websearch"].includes(key), `unexpected permission group: ${key}`);
  }
  assert.equal(overlay.write, undefined);
  assert.equal(overlay.create, undefined);
});

// 7. out-of-scope file creation remains denied
await test("R7 out-of-scope paths stay denied under edit overlay", () => {
  const overlay = buildPermissionOverlay({
    allowedCommands: [], allowedPaths: ["docs/**"], networkPolicy: "localhost_only",
  });
  assert.equal(overlay.edit["tools/rogue.txt"], undefined); // not allow -> wildcard deny governs
  assert.equal(overlay.edit["*"], "deny");
});

// 8. production config untouched: overlays built only from envelope inputs
await test("R8 overlay derived purely from envelope fields (no production coupling)", () => {
  const a = buildPermissionOverlay({
    allowedCommands: ["git status --short"], allowedPaths: ["docs/**"], networkPolicy: "localhost_only",
  });
  const b = buildPermissionOverlay({
    allowedCommands: ["git status --short"], allowedPaths: ["docs/**"], networkPolicy: "offline",
  });
  assert.deepEqual(a, b); // network_policy is executor metadata; identical overlays
  assert.ok(!JSON.stringify(a).includes("8080"));
  assert.ok(!JSON.stringify(a).includes("qwen"));
  // envelope derived purely from its own inputs + stays valid
  const v = validateEnvelope(env({ test_command: undefined }));
  assert.equal(v.ok, true);
});

// 9. installed OpenCode exact config schema gate: injected debugConfig fail-closed + exact-permission pass
await test("R9 debug-config gate fails closed on rejection and passes on acceptance", async () => {
  const calls = [];
  const capsFake = { subcommand: "run", directory_flag: "--dir", model_flag: "-m", format_flag: "--format", format_json_value: "json", auto_flag: "--auto", message_positionals: true };
  const okTask = makeRunOpenCodeTask({
    probe: () => ({ available: true, dispatch_interface_resolved: true, executable: "opencode.exe", capabilities: capsFake }),
    spawnProc: () => ({ pid: 1, promise: Promise.resolve({ status: 0, stdout: "", stderr: "" }), getOutput: () => ({ stdout: "", stderr: "" }), terminate: async () => ({}) }),
    debugConfig: async (configPath) => { calls.push(configPath); return { ok: true, stdout: "{}" }; },
  });
  const r = await okTask({ guardBaseUrl: "http://127.0.0.1:1", modelId: "m", modelSelector: "prov/m", envelope: env() });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 1);

  const rejectTask = makeRunOpenCodeTask({
    probe: () => ({ available: true, dispatch_interface_resolved: true, executable: "opencode.exe", capabilities: capsFake }),
    spawnProc: async () => { throw new Error("MUST NOT SPAWN when config rejected"); },
    debugConfig: async () => ({ ok: false, stdout: "", error: "invalid key" }),
  });
  await assert.rejects(() => rejectTask({ guardBaseUrl: "http://127.0.0.1:1", modelId: "m", modelSelector: "prov/m", envelope: env() }),
    (err) => err.code === "OPENCODE_CONFIG_REJECTED");
});

// 10. old tracked-file behavior unchanged
await test("R10 tracked-file task message keeps original structural lines", () => {
  const e = env();
  const msg = buildTaskMessage(e);
  assert.ok(msg.includes(`LOCAL_DEV task ${e.task_ref}`));
  assert.ok(msg.includes(`TASK DELTA: ${e.task_delta}`));
  assert.ok(msg.includes("Allowed paths: docs/**"));
  assert.ok(msg.includes("Allowed commands: git status --short"));
  assert.ok(msg.includes("Test command: git diff --check"));
  assert.ok(msg.includes("Bounds: timebox 600s, max turns 8, max test cycles 0."));
  assert.ok(msg.includes("No destructive git commands."));
  // envelope stays valid (additive task_kind tolerated by closed validator)
  const v = validateEnvelope(e);
  assert.equal(v.ok, true);
});

// extra: task message hardening for CREATE envelopes end-to-end
await test("extra: CREATE envelope message contains full hardened policy", () => {
  const b = { objective: "Create a new file docs/runtime/PROOF.md with the marker", scope: { forbidden_areas: ["tools/**"] } };
  const delta = buildTaskDelta(b, 0);
  const e = env({ task_delta: delta, task_kind: "CREATE" });
  const msg = buildTaskMessage(e);
  assert.ok(msg.includes("absence is EXPECTED, not a blocker"));
  assert.ok(msg.includes("never read it before initial creation"));
  assert.ok(msg.includes("no shell existence probes"));
  assert.ok(msg.includes("no subagents"));
  assert.ok(msg.includes("Stop exploring as soon as every acceptance criterion is satisfied"));
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
