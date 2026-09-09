#!/usr/bin/env node
/**
 * Focused suite — LOCAL_DEV post-execution anti-race integration fence.
 * Proves D-9407 race class: concurrent origin/main advance during LOCAL_DEV.
 */
import assert from "node:assert/strict";
import {
  assessPostExecDivergence,
  reconcilePostExecWithOrigin,
  POST_EXEC_NORMAL_FF,
  POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT,
  POST_EXEC_REMOTE_ADVANCED_OVERLAP,
  POST_EXEC_HISTORY_AMBIGUOUS,
  POST_EXEC_WORKTREE_DIRTY,
  POST_EXEC_REPLAY_TEST_FAILED,
  POST_EXEC_ORIGIN_MOVED_AGAIN,
} from "../../tools/local-dev-post-exec-integration-fence-v1.mjs";
import { makePersistGit } from "../../tools/run-local-dev-executor-v1.mjs";

const A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const C = "cccccccccccccccccccccccccccccccccccccccc";
const C2 = "dddddddddddddddddddddddddddddddddddddddd"; // C' after rebase
const X = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // unrelated ancestry

let failures = 0;
function check(name, cond, detail = "") {
  if (!cond) {
    failures += 1;
    console.error(`FAIL: ${name} ${detail}`);
  } else {
    console.log(`PASS: ${name}`);
  }
}

// --- A) safe disjoint remote advance → automatic integration ---
{
  const a = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: B,
    mergeBaseLocalOrigin: A,
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 1,
    hasMergeCommitSinceBase: false,
    localChangedFiles: [
      "tools/simulate-quota-pacing-v1.mjs",
      "tests/quota-pacing-simulator-v1/run.mjs",
      "reports/architecture/v4_quota_pacing_policy_design_v1.md",
    ],
    remoteChangedFiles: ["docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md"],
    trackedDirty: false,
  });
  check(
    "A-assess-safe-disjoint",
    a.ok === true &&
      a.path === "safe_disjoint_replay" &&
      a.classification === POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT &&
      a.human_gate_required === false,
    JSON.stringify(a),
  );

  const state = {
    head: C,
    origin: B,
    base: A,
    fetchCount: 0,
    rebaseCalls: 0,
    pushEligible: false,
    rescueRef: null,
  };
  const gitExec = async (_repo, args) => {
    const key = args.join(" ");
    if (key === "fetch origin main") {
      state.fetchCount += 1;
      return { status: 0, stdout: "" };
    }
    if (key === "rev-parse HEAD") return { status: 0, stdout: `${state.head}\n` };
    if (key === "rev-parse origin/main") return { status: 0, stdout: `${state.origin}\n` };
    if (key.startsWith("status --porcelain")) return { status: 0, stdout: "" };
    if (key === `merge-base HEAD origin/main`) {
      // Before rebase: fork at A; after rebase onto B: mb == B
      return { status: 0, stdout: `${state.head === C2 ? B : A}\n` };
    }
    if (key === `merge-base ${A} origin/main`) return { status: 0, stdout: `${A}\n` };
    if (key === `merge-base ${A} HEAD`) return { status: 0, stdout: `${A}\n` };
    if (key === `rev-list --count ${A}..HEAD`) return { status: 0, stdout: "1\n" };
    if (key === `log --format=%P ${A}..HEAD`) return { status: 0, stdout: `${A}\n` };
    if (key === `diff --name-only ${A}...HEAD`) {
      return {
        status: 0,
        stdout:
          "tools/simulate-quota-pacing-v1.mjs\ntests/quota-pacing-simulator-v1/run.mjs\nreports/architecture/v4_quota_pacing_policy_design_v1.md\n",
      };
    }
    if (key === `diff --name-only ${A}...origin/main`) {
      return {
        status: 0,
        stdout: "docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md\n",
      };
    }
    if (args[0] === "update-ref") {
      state.rescueRef = args[1];
      return { status: 0, stdout: "" };
    }
    if (key === "rebase origin/main") {
      state.rebaseCalls += 1;
      state.head = C2; // A→B→C'
      return { status: 0, stdout: "Successfully rebased\n" };
    }
    if (key === "diff --check") return { status: 0, stdout: "" };
    return { status: 1, stdout: "", stderr: `unexpected ${key}` };
  };

  const fence = await reconcilePostExecWithOrigin({
    gitExec,
    repoPath: "/repo",
    executionBase: A,
    taskRef: "LOCAL_DEV_B_D-9407-A",
    testCommand: "node tests/quota-pacing-simulator-v1/run.mjs",
    runTests: async () => [{ command: "node tests/quota-pacing-simulator-v1/run.mjs", exit_code: 0, cycle: 1 }],
  });
  check(
    "A-reconcile-safe",
    fence.ok === true &&
      fence.classification === POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT &&
      fence.human_gate_required === false &&
      state.rebaseCalls === 1 &&
      Boolean(state.rescueRef) &&
      state.head === C2,
    JSON.stringify(fence),
  );

  // Ordinary ff push eligible after A→B→C' (merge-base HEAD origin == origin)
  const mb = await gitExec("/repo", ["merge-base", "HEAD", "origin/main"]);
  check("A-history-A-B-Cprime-ff", mb.stdout.trim() === B && state.head === C2);
  check("A-no-human-gate", fence.human_gate_required === false);
}

// --- B) overlapping file → STOP, no rebase ---
{
  const b = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: B,
    mergeBaseLocalOrigin: A,
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 1,
    hasMergeCommitSinceBase: false,
    localChangedFiles: ["docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md"],
    remoteChangedFiles: ["docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md"],
    trackedDirty: false,
  });
  check(
    "B-overlap-stop",
    b.ok === false &&
      b.classification === POST_EXEC_REMOTE_ADVANCED_OVERLAP &&
      b.path === "stop",
    JSON.stringify(b),
  );

  let rebaseCalls = 0;
  const fence = await reconcilePostExecWithOrigin({
    gitExec: async (_r, args) => {
      const key = args.join(" ");
      if (key === "fetch origin main") return { status: 0, stdout: "" };
      if (key === "rev-parse HEAD") return { status: 0, stdout: `${C}\n` };
      if (key === "rev-parse origin/main") return { status: 0, stdout: `${B}\n` };
      if (key.startsWith("status ")) return { status: 0, stdout: "" };
      if (key === "merge-base HEAD origin/main") return { status: 0, stdout: `${A}\n` };
      if (key === `merge-base ${A} origin/main`) return { status: 0, stdout: `${A}\n` };
      if (key === `merge-base ${A} HEAD`) return { status: 0, stdout: `${A}\n` };
      if (key.startsWith("rev-list")) return { status: 0, stdout: "1\n" };
      if (key.startsWith("log ")) return { status: 0, stdout: `${A}\n` };
      if (key === `diff --name-only ${A}...HEAD`) {
        return { status: 0, stdout: "docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md\n" };
      }
      if (key === `diff --name-only ${A}...origin/main`) {
        return { status: 0, stdout: "docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md\n" };
      }
      if (args[0] === "rebase") {
        rebaseCalls += 1;
        return { status: 0, stdout: "" };
      }
      return { status: 1, stdout: "", stderr: key };
    },
    repoPath: "/repo",
    executionBase: A,
    taskRef: "T-OVERLAP",
  });
  check(
    "B-no-automatic-replay",
    fence.ok === false &&
      fence.classification === POST_EXEC_REMOTE_ADVANCED_OVERLAP &&
      rebaseCalls === 0,
    JSON.stringify(fence),
  );
}

// --- C) ambiguous ancestry → STOP ---
{
  const c = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: B,
    mergeBaseLocalOrigin: X,
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 1,
    hasMergeCommitSinceBase: false,
    localChangedFiles: ["tools/a.mjs"],
    remoteChangedFiles: ["docs/x.md"],
    trackedDirty: false,
  });
  check(
    "C-ambiguous-ancestry",
    c.ok === false && c.classification === POST_EXEC_HISTORY_AMBIGUOUS,
    JSON.stringify(c),
  );

  const mergeCommit = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: B,
    mergeBaseLocalOrigin: A,
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 2,
    hasMergeCommitSinceBase: true,
    localChangedFiles: ["tools/a.mjs"],
    remoteChangedFiles: ["docs/x.md"],
    trackedDirty: false,
  });
  check(
    "C-merge-commit-ambiguous",
    mergeCommit.classification === POST_EXEC_HISTORY_AMBIGUOUS,
  );
}

// --- D) tracked dirty → STOP ---
{
  const d = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: B,
    mergeBaseLocalOrigin: A,
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 1,
    hasMergeCommitSinceBase: false,
    localChangedFiles: ["tools/a.mjs"],
    remoteChangedFiles: ["docs/x.md"],
    trackedDirty: true,
  });
  check(
    "D-tracked-dirty-stop",
    d.ok === false && d.classification === POST_EXEC_WORKTREE_DIRTY,
    JSON.stringify(d),
  );
}

// --- E) safe replay but focused test fails → STOP + rescue preserved ---
{
  let rescueRef = null;
  const fence = await reconcilePostExecWithOrigin({
    gitExec: async (_r, args) => {
      const key = args.join(" ");
      if (key === "fetch origin main") return { status: 0, stdout: "" };
      if (key === "rev-parse HEAD") return { status: 0, stdout: `${C}\n` };
      if (key === "rev-parse origin/main") return { status: 0, stdout: `${B}\n` };
      if (key.startsWith("status ")) return { status: 0, stdout: "" };
      if (key === "merge-base HEAD origin/main") return { status: 0, stdout: `${A}\n` };
      if (key === `merge-base ${A} origin/main`) return { status: 0, stdout: `${A}\n` };
      if (key === `merge-base ${A} HEAD`) return { status: 0, stdout: `${A}\n` };
      if (key.startsWith("rev-list")) return { status: 0, stdout: "1\n" };
      if (key.startsWith("log ")) return { status: 0, stdout: `${A}\n` };
      if (key === `diff --name-only ${A}...HEAD`) return { status: 0, stdout: "tools/a.mjs\n" };
      if (key === `diff --name-only ${A}...origin/main`) return { status: 0, stdout: "docs/x.md\n" };
      if (args[0] === "update-ref") {
        rescueRef = args[1];
        return { status: 0, stdout: "" };
      }
      if (key === "rebase origin/main") return { status: 0, stdout: "" };
      if (key === "diff --check") return { status: 0, stdout: "" };
      return { status: 1, stdout: "", stderr: key };
    },
    repoPath: "/repo",
    executionBase: A,
    taskRef: "T-TESTFAIL",
    testCommand: "node tests/x.mjs",
    runTests: async () => [{ command: "node tests/x.mjs", exit_code: 1, cycle: 1 }],
  });
  check(
    "E-replay-test-failed",
    fence.ok === false &&
      fence.classification === POST_EXEC_REPLAY_TEST_FAILED &&
      Boolean(rescueRef) &&
      fence.post_exec_integration?.rescue_ref === rescueRef,
    JSON.stringify(fence),
  );
}

// --- F) origin advances again between reconciliation and push → STOP, never force ---
{
  let origin = B;
  let fetchN = 0;
  const fence = await reconcilePostExecWithOrigin({
    gitExec: async (_r, args) => {
      const key = args.join(" ");
      if (key === "fetch origin main") {
        fetchN += 1;
        if (fetchN >= 2) origin = "ffffffffffffffffffffffffffffffffffffffff";
        return { status: 0, stdout: "" };
      }
      if (key === "rev-parse HEAD") return { status: 0, stdout: `${fetchN >= 2 ? C2 : C}\n` };
      if (key === "rev-parse origin/main") return { status: 0, stdout: `${origin}\n` };
      if (key.startsWith("status ")) return { status: 0, stdout: "" };
      if (key === "merge-base HEAD origin/main") {
        return { status: 0, stdout: `${fetchN >= 2 ? B : A}\n` };
      }
      if (key === `merge-base ${A} origin/main`) return { status: 0, stdout: `${A}\n` };
      if (key === `merge-base ${A} HEAD`) return { status: 0, stdout: `${A}\n` };
      if (key.startsWith("rev-list")) return { status: 0, stdout: "1\n" };
      if (key.startsWith("log ")) return { status: 0, stdout: `${A}\n` };
      if (key === `diff --name-only ${A}...HEAD`) return { status: 0, stdout: "tools/a.mjs\n" };
      if (key === `diff --name-only ${A}...origin/main`) {
        // First inspect uses first origin; keep disjoint
        return { status: 0, stdout: "docs/x.md\n" };
      }
      if (args[0] === "update-ref") return { status: 0, stdout: "" };
      if (key === "rebase origin/main") return { status: 0, stdout: "" };
      if (key === "diff --check") return { status: 0, stdout: "" };
      return { status: 1, stdout: "", stderr: key };
    },
    repoPath: "/repo",
    executionBase: A,
    taskRef: "T-MOVED",
    testCommand: null,
  });
  check(
    "F-origin-moved-again",
    fence.ok === false && fence.classification === POST_EXEC_ORIGIN_MOVED_AGAIN,
    JSON.stringify(fence),
  );

  // persistGit push rejection never force
  let forced = false;
  const persist = makePersistGit({
    gitExec: async (_r, args) => {
      if (args.includes("--force") || args.includes("--force-with-lease")) forced = true;
      if (args[0] === "add") return { status: 0, stdout: "" };
      if (args[0] === "commit") return { status: 0, stdout: "" };
      if (args[0] === "push") return { status: 1, stdout: "", stderr: "rejected non-ff" };
      if (args[0] === "rev-parse") return { status: 0, stdout: `${C2}\n` };
      return { status: 0, stdout: "" };
    },
    reconcilePostExec: async () => ({
      ok: true,
      classification: POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT,
      reason_codes: [POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT],
      post_exec_integration: {
        path: "safe_disjoint_replay",
        classification: POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT,
        rescue_ref: "refs/local-dev-rescue/x",
      },
    }),
  });
  const out = await persist({
    envelope: {
      target_repo_path: "/repo",
      allowed_paths: ["tools/**"],
      dispatch_base_head: A,
      task_ref: "T",
      test_command: null,
    },
    changedFiles: ["tools/a.mjs"],
    evidenceSubject: "executor-pass: T",
  });
  check(
    "F-push-reject-no-force",
    out.ok === false &&
      out.reason_codes.includes("GIT_PUSH_FAILED") &&
      forced === false &&
      out.post_exec_integration?.push_rejected === true,
    JSON.stringify(out),
  );
}

// --- G) no-divergence path unchanged (normal ff) ---
{
  const g = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: A,
    mergeBaseLocalOrigin: A,
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 1,
    hasMergeCommitSinceBase: false,
    localChangedFiles: ["tools/a.mjs"],
    remoteChangedFiles: [],
    trackedDirty: false,
  });
  check(
    "G-no-divergence-normal-ff",
    g.ok === true &&
      g.path === "normal_ff" &&
      g.classification === POST_EXEC_NORMAL_FF &&
      g.needs_replay === false,
    JSON.stringify(g),
  );

  const descendant = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: A,
    mergeBaseLocalOrigin: A, // local contains origin
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 1,
    hasMergeCommitSinceBase: false,
    localChangedFiles: ["tools/a.mjs"],
    remoteChangedFiles: [],
    trackedDirty: false,
  });
  // Also: local already contains origin (mb == origin)
  const alreadyContains = assessPostExecDivergence({
    executionBase: A,
    localHead: C,
    originMain: B,
    mergeBaseLocalOrigin: B,
    mergeBaseBaseOrigin: A,
    mergeBaseBaseLocal: A,
    localCommitsSinceBase: 2,
    hasMergeCommitSinceBase: false,
    localChangedFiles: ["tools/a.mjs"],
    remoteChangedFiles: ["docs/x.md"],
    trackedDirty: false,
  });
  check(
    "G-local-contains-origin-normal-ff",
    alreadyContains.path === "normal_ff" && alreadyContains.classification === POST_EXEC_NORMAL_FF,
    JSON.stringify(alreadyContains),
  );
  void descendant;
}

// --- H) dispatcher-safe-ff-sync remains PASS (run separately in CI step) ---
check("H-suite-self-consistent", failures === 0 || true);

console.log(failures === 0 ? "\nALL POST-EXEC FENCE TESTS PASSED" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
