#!/usr/bin/env node
/** Focused suite — V4_AUTOMATED_MICRO_TASK_ADMISSION_PARITY_V1. */
import {
  admitMicroTaskDelta,
  extractMicroTaskAdmissionInput,
  ADMISSION_SCHEMA,
  DEFAULT_TASK_KIND,
  DEFAULT_MAX_CORRECTIVE_LOOPS,
} from "../../tools/admit-micro-task-delta-v1.mjs";
import { performTick, RESULT_SCHEMA } from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 280) });
}

const baseEnvelope = (over = {}) => ({
  schema_version: "local-dev-task-envelope-v1",
  task_ref: "LOCAL_DEV_B_D-47-A",
  target_repo_path: "C:\\Users\\mrhz\\Documents\\AI\\GitHub\\control-plane",
  target_remote: "https://github.com/mrhz1973/control-plane.git",
  dispatch_base_head: "a179a40752d858be6f83df96780f107ff13b80e1",
  profile_id: "qwen38-opus-q3-opencode-24k",
  task_delta: "Objective: focused micro-task\nWorkflow: implement then test then correct corrective loop declared, test cycles: 2.",
  task_kind: "MODIFY",
  allowed_paths: ["docs/"],
  allowed_commands: ["git status --short", "git diff --check"],
  test_command: "git diff --check",
  network_policy: "localhost_only",
  timebox_seconds: 600,
  max_agent_turns: 8,
  max_test_cycles: 2,
  git_persistence_required: true,
  ...over,
});

// 1. normal micro-task admitted
{
  const r = admitMicroTaskDelta({
    task_kind: "MICRO_TASK_DELTA",
    max_corrective_loops: 2,
    require_broad_regression: false,
    bugbot: false,
  });
  check(
    "1-normal-micro-task-admitted",
    r.schema_version === ADMISSION_SCHEMA && r.admitted === true &&
      r.task_kind === DEFAULT_TASK_KIND && r.max_corrective_loops === 2 &&
      r.reason_codes.includes("MICRO_TASK_ADMISSION_ADMITTED"),
    JSON.stringify(r),
  );
}

// 2. bound >2 rejected
{
  const r = admitMicroTaskDelta({
    task_kind: "MICRO_TASK_DELTA",
    max_corrective_loops: 5,
  });
  check(
    "2-bound-gt2-rejected",
    r.admitted === false &&
      r.reason_codes.includes("MAX_CORRECTIVE_LOOPS_EXCEEDS_DEFAULT"),
    JSON.stringify(r.reason_codes),
  );
}

// 3. micro-task broad regression rejected
{
  const r = admitMicroTaskDelta({
    task_kind: "MICRO_TASK_DELTA",
    max_corrective_loops: 2,
    require_broad_regression: true,
  });
  check(
    "3-micro-broad-regression-rejected",
    r.admitted === false &&
      r.reason_codes.includes("BROAD_REGRESSION_FORBIDDEN_ON_MICRO_TASK"),
    JSON.stringify(r.reason_codes),
  );
  const bug = admitMicroTaskDelta({
    task_kind: "MICRO_TASK_DELTA",
    max_corrective_loops: 2,
    bugbot: true,
  });
  check(
    "3b-micro-bugbot-rejected",
    bug.admitted === false && bug.reason_codes.includes("BUGBOT_FORBIDDEN_ON_MICRO_TASK"),
    JSON.stringify(bug.reason_codes),
  );
}

// 4. checkpoint broad regression accepted
{
  const r = admitMicroTaskDelta({
    task_kind: "CHECKPOINT_DELTA",
    max_corrective_loops: 2,
    require_broad_regression: true,
    bugbot: true,
  });
  check(
    "4-checkpoint-broad-regression-accepted",
    r.admitted === true &&
      r.reason_codes.includes("CHECKPOINT_BROAD_REGRESSION_AUTHORIZED") &&
      r.reason_codes.includes("CHECKPOINT_BUGBOT_AUTHORIZED"),
    JSON.stringify(r.reason_codes),
  );
}

// 5. unauthorized campaign rejected
{
  const r = admitMicroTaskDelta({
    task_kind: "CAMPAIGN",
    max_corrective_loops: 2,
    human_authorized_campaign_exception: false,
  });
  check(
    "5-unauthorized-campaign-rejected",
    r.admitted === false &&
      r.reason_codes.includes("CAMPAIGN_REQUIRES_HUMAN_AUTHORIZED_EXCEPTION"),
    JSON.stringify(r.reason_codes),
  );
}

// 6. human-authorized campaign exception accepted
{
  const r = admitMicroTaskDelta({
    task_kind: "CAMPAIGN",
    max_corrective_loops: 2,
    human_authorized_campaign_exception: true,
  });
  check(
    "6-human-authorized-campaign-accepted",
    r.admitted === true &&
      r.reason_codes.includes("HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION"),
    JSON.stringify(r.reason_codes),
  );
}

// 7. rejected task never reaches executor (real dispatcher path)
{
  let executorCalls = 0;
  const claimEnvelope = baseEnvelope({
    micro_task_policy: {
      task_kind: "MICRO_TASK_DELTA",
      max_corrective_loops: 9,
      require_broad_regression: false,
      bugbot: false,
    },
  });
  const tick = await performTick(
    { schema_version: "local-dev-dispatch-tick-v1", request_id: "t-admit-7", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "a".repeat(40) }),
      scanQueue: () => [],
      runDispatchLoop: () => ({
        claims: [{
          task_ref: claimEnvelope.task_ref,
          source_file: "x.md",
          envelope: claimEnvelope,
          receipt: { task_ref: claimEnvelope.task_ref },
        }],
        skipped: [],
      }),
      runExecutor: async () => {
        executorCalls += 1;
        return { status: "PASS", classification: "PASS", task_ref: claimEnvelope.task_ref, reason_codes: ["PASS"] };
      },
    },
  );
  check(
    "7-rejected-never-reaches-executor",
    executorCalls === 0 &&
      tick.schema_version === RESULT_SCHEMA &&
      tick.execution_performed === false &&
      tick.classification === "HUMAN_GATE_REQUIRED" &&
      tick.reason_codes.includes("MICRO_TASK_ADMISSION_REJECTED") &&
      tick.reason_codes.includes("MAX_CORRECTIVE_LOOPS_EXCEEDS_DEFAULT"),
    JSON.stringify({ calls: executorCalls, c: tick.classification, rc: tick.reason_codes }),
  );
}

// 7b. admitted micro-task DOES reach executor once
{
  let executorCalls = 0;
  const claimEnvelope = baseEnvelope({
    micro_task_policy: {
      task_kind: "MICRO_TASK_DELTA",
      max_corrective_loops: 2,
    },
  });
  const tick = await performTick(
    { schema_version: "local-dev-dispatch-tick-v1", request_id: "t-admit-7b", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "a".repeat(40) }),
      scanQueue: () => [],
      runDispatchLoop: () => ({
        claims: [{
          task_ref: claimEnvelope.task_ref,
          source_file: "y.md",
          envelope: claimEnvelope,
          receipt: { task_ref: claimEnvelope.task_ref },
        }],
        skipped: [],
      }),
      runExecutor: async () => {
        executorCalls += 1;
        return { status: "PASS", classification: "PASS", task_ref: claimEnvelope.task_ref, reason_codes: ["PASS"] };
      },
    },
  );
  check(
    "7b-admitted-reaches-executor-once",
    executorCalls === 1 && tick.classification === "WORK_EXECUTED_PASS" && tick.execution_performed === true,
    JSON.stringify({ calls: executorCalls, c: tick.classification }),
  );
}

// 8. existing bounded legacy item handled safely (no micro_task_policy)
{
  const env = baseEnvelope({ max_test_cycles: 2 });
  delete env.micro_task_policy;
  const extracted = extractMicroTaskAdmissionInput({ envelope: env });
  const r = admitMicroTaskDelta(extracted);
  check(
    "8-legacy-bounded-item-safe-default",
    extracted.legacy_defaults_applied === true &&
      extracted.task_kind === DEFAULT_TASK_KIND &&
      extracted.max_corrective_loops === DEFAULT_MAX_CORRECTIVE_LOOPS &&
      r.admitted === true &&
      r.reason_codes.includes("LEGACY_SAFE_MICRO_TASK_DEFAULTS_APPLIED"),
    JSON.stringify({ extracted, r }),
  );

  // Legacy with max_test_cycles > 2 without policy → fail closed migration
  const bad = admitMicroTaskDelta(extractMicroTaskAdmissionInput({
    envelope: baseEnvelope({ max_test_cycles: 3 }),
  }));
  check(
    "8b-legacy-overbound-fail-closed-migration",
    bad.admitted === false &&
      bad.reason_codes.includes("LEGACY_ITEM_REQUIRES_MICRO_TASK_POLICY_MIGRATION"),
    JSON.stringify(bad.reason_codes),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
