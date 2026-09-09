#!/usr/bin/env node
/** Focused suite — V4_DISPATCHER_SAFE_FAST_FORWARD_SYNC_V1. */
import {
  verifyRepoState,
  performTick,
  RESULT_SCHEMA,
} from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";
import { admitMicroTaskDelta } from "../../tools/admit-micro-task-delta-v1.mjs";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 280) });
}

const A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const C = "cccccccccccccccccccccccccccccccccccccccc"; // merge-base diverged

function mockGit(state) {
  const calls = [];
  const gitExec = async (_repo, args) => {
    const key = args.join(" ");
    calls.push(key);
    const cmd = args[0];
    if (cmd === "rev-parse" && args[1] === "--is-inside-work-tree") return { status: 0, stdout: "true\n" };
    if (cmd === "rev-parse" && args[1] === "--abbrev-ref") return { status: 0, stdout: "main\n" };
    if (cmd === "fetch") return { status: state.fetchFail ? 1 : 0, stdout: "" };
    if (cmd === "status") {
      return { status: 0, stdout: state.dirtyTracked ? " M docs/runtime/CURRENT_FRONTIER.md\n" : "" };
    }
    if (cmd === "rev-parse" && args[1] === "HEAD") {
      return { status: 0, stdout: `${state.head}\n` };
    }
    if (cmd === "rev-parse" && args[1] === "origin/main") {
      return { status: 0, stdout: `${state.origin}\n` };
    }
    if (cmd === "merge-base") {
      if (state.mergeBaseFail) return { status: 1, stdout: "" };
      return { status: 0, stdout: `${state.mergeBase}\n` };
    }
    if (cmd === "merge") {
      if (args[1] !== "--ff-only" || args[2] !== "origin/main") {
        return { status: 1, stdout: "", stderr: "unexpected merge args" };
      }
      state.mergeCalls = (state.mergeCalls || 0) + 1;
      if (state.ffFail) return { status: 1, stdout: "", stderr: "ff failed" };
      // Simulate successful ff: HEAD advances to origin.
      state.head = state.origin;
      return { status: 0, stdout: "Updating ... Fast-forward\n" };
    }
    return { status: 1, stdout: "", stderr: `unexpected: ${key}` };
  };
  return { gitExec, calls, state };
}

// 1. synced clean -> no mutation / PASS
{
  const { gitExec, calls, state } = mockGit({ head: A, origin: A, mergeBase: A });
  const r = await verifyRepoState({ repoPath: process.cwd(), gitExec });
  check(
    "1-synced-clean-no-mutation",
    r.ok === true && r.head === A && r.sync_performed === false &&
      !calls.some((c) => c.startsWith("merge ")) && state.mergeCalls !== 1,
    JSON.stringify({ r, calls }),
  );
}

// 2. clean behind -> one ff-only / PASS
{
  const { gitExec, calls, state } = mockGit({ head: A, origin: B, mergeBase: A });
  const r = await verifyRepoState({ repoPath: process.cwd(), gitExec });
  check(
    "2-clean-behind-one-ff-only",
    r.ok === true && r.head === B && r.sync_performed === true &&
      r.reason_codes.includes("FAST_FORWARD_SYNCED") &&
      state.mergeCalls === 1 &&
      calls.filter((c) => c === "merge --ff-only origin/main").length === 1 &&
      !calls.some((c) => /\b(reset|stash|clean|rebase)\b/.test(c)),
    JSON.stringify({ r, mergeCalls: state.mergeCalls, calls }),
  );
}

// 3. tracked dirty + behind -> no merge / gate
{
  const { gitExec, calls, state } = mockGit({ head: A, origin: B, mergeBase: A, dirtyTracked: true });
  const r = await verifyRepoState({ repoPath: process.cwd(), gitExec });
  check(
    "3-tracked-dirty-behind-no-merge",
    r.ok === false && r.human_gate_required === true &&
      r.reason_codes.includes("TRACKED_DIRTY_CONFLICT") &&
      !state.mergeCalls &&
      !calls.some((c) => c.startsWith("merge ")),
    JSON.stringify({ r, calls }),
  );
}

// 4. diverged -> no merge / gate
{
  const { gitExec, calls, state } = mockGit({ head: A, origin: B, mergeBase: C });
  const r = await verifyRepoState({ repoPath: process.cwd(), gitExec });
  check(
    "4-diverged-no-merge",
    r.ok === false && r.reason_codes.includes("HEAD_ORIGIN_DIVERGED") && !state.mergeCalls,
    JSON.stringify({ r, calls }),
  );
}

// 5. local ahead -> no merge / gate
{
  const { gitExec, state } = mockGit({ head: B, origin: A, mergeBase: A });
  const r = await verifyRepoState({ repoPath: process.cwd(), gitExec });
  check(
    "5-local-ahead-no-merge",
    r.ok === false && r.reason_codes.includes("LOCAL_AHEAD_OF_ORIGIN") && !state.mergeCalls,
    JSON.stringify(r),
  );
}

// 6. untracked preserved — dirty check uses --untracked-files=no; untracked never blocks
{
  const { gitExec, calls, state } = mockGit({ head: A, origin: B, mergeBase: A });
  // status returns clean for tracked; untracked would be ignored by the flag
  const r = await verifyRepoState({ repoPath: process.cwd(), gitExec });
  check(
    "6-untracked-not-blocking-ff",
    r.ok === true &&
      calls.some((c) => c.includes("status --porcelain=v1 --untracked-files=no")) &&
      state.mergeCalls === 1 &&
      !calls.some((c) => /\bclean\b/.test(c)),
    JSON.stringify({ r, calls }),
  );
}

// 7. ff failure -> gate
{
  const { gitExec, state } = mockGit({ head: A, origin: B, mergeBase: A, ffFail: true });
  const r = await verifyRepoState({ repoPath: process.cwd(), gitExec });
  check(
    "7-ff-failure-gate",
    r.ok === false && r.reason_codes.includes("FAST_FORWARD_FAILED") && state.mergeCalls === 1,
    JSON.stringify(r),
  );
}

// 8. failed sync never reaches queue/executor
{
  let scan = 0;
  let loop = 0;
  let exec = 0;
  const tick = await performTick(
    { schema_version: "local-dev-dispatch-tick-v1", request_id: "ff-8", source: "n8n" },
    {
      verifyRepo: async () => ({
        ok: false,
        reason_codes: ["LOCAL_AHEAD_OF_ORIGIN"],
        human_gate_required: true,
        gate_summary: "LOCAL_AHEAD_OF_ORIGIN",
      }),
      scanQueue: () => { scan += 1; return []; },
      runDispatchLoop: () => { loop += 1; return { claims: [], skipped: [] }; },
      runExecutor: async () => { exec += 1; return { status: "PASS", classification: "PASS", task_ref: "x", reason_codes: [] }; },
    },
  );
  check(
    "8-failed-sync-never-reaches-queue-executor",
    tick.schema_version === RESULT_SCHEMA &&
      tick.classification === "HUMAN_GATE_REQUIRED" &&
      tick.execution_performed === false &&
      scan === 0 && loop === 0 && exec === 0,
    JSON.stringify({ tick, scan, loop, exec }),
  );
}

// 9. existing MICRO_TASK_DELTA admission path unchanged
{
  const ok = admitMicroTaskDelta({
    task_kind: "MICRO_TASK_DELTA",
    max_corrective_loops: 2,
  });
  const bad = admitMicroTaskDelta({
    task_kind: "MICRO_TASK_DELTA",
    max_corrective_loops: 9,
  });
  let exec = 0;
  const tick = await performTick(
    { schema_version: "local-dev-dispatch-tick-v1", request_id: "ff-9", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: A, sync_performed: true, reason_codes: ["FAST_FORWARD_SYNCED"] }),
      scanQueue: () => [],
      ensureDevQwenReady: async () => ({ ready: true, status: "READY" }),
      runDispatchLoop: () => ({
        claims: [{
          task_ref: "LOCAL_DEV_B_D-49-A",
          source_file: "x.md",
          envelope: {
            schema_version: "local-dev-task-envelope-v1",
            task_ref: "LOCAL_DEV_B_D-49-A",
            micro_task_policy: { task_kind: "MICRO_TASK_DELTA", max_corrective_loops: 9 },
          },
          receipt: { task_ref: "LOCAL_DEV_B_D-49-A" },
        }],
        skipped: [],
      }),
      runExecutor: async () => { exec += 1; return { status: "PASS", classification: "PASS", task_ref: "LOCAL_DEV_B_D-49-A", reason_codes: ["PASS"] }; },
    },
  );
  check(
    "9-admission-path-unchanged",
    ok.admitted === true && bad.admitted === false &&
      exec === 0 &&
      tick.classification === "HUMAN_GATE_REQUIRED" &&
      tick.execution_performed === false &&
      tick.reason_codes.includes("MICRO_TASK_ADMISSION_REJECTED"),
    JSON.stringify({ ok: ok.admitted, bad: bad.admitted, exec, c: tick.classification, rc: tick.reason_codes }),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
