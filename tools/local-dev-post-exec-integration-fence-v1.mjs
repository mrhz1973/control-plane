#!/usr/bin/env node
/**
 * LOCAL_DEV post-execution anti-race integration fence (D-9407 race class).
 *
 * After a bounded task commit, if origin/main advanced concurrently, attempt a
 * safe disjoint replay onto current origin/main. Never force-push. Overlap /
 * ambiguity / dirty tree / failed tests / origin moved again → fail closed.
 */

export const POST_EXEC_NORMAL_FF = "POST_EXEC_NORMAL_FF";
export const POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT =
  "POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT";
export const POST_EXEC_REMOTE_ADVANCED_OVERLAP =
  "POST_EXEC_REMOTE_ADVANCED_OVERLAP";
export const POST_EXEC_HISTORY_AMBIGUOUS = "POST_EXEC_HISTORY_AMBIGUOUS";
export const POST_EXEC_WORKTREE_DIRTY = "POST_EXEC_WORKTREE_DIRTY";
export const POST_EXEC_REPLAY_TEST_FAILED = "POST_EXEC_REPLAY_TEST_FAILED";
export const POST_EXEC_ORIGIN_MOVED_AGAIN = "POST_EXEC_ORIGIN_MOVED_AGAIN";
export const POST_EXEC_REPLAY_FAILED = "POST_EXEC_REPLAY_FAILED";
export const POST_EXEC_DIFF_CHECK_FAILED = "POST_EXEC_DIFF_CHECK_FAILED";

/** Soft upper bound on task commits since execution base. */
export const MAX_BOUNDED_TASK_COMMITS = 8;

function trimSha(s) {
  return String(s || "").trim();
}

function uniqueSorted(paths) {
  return [...new Set((paths || []).map((p) => String(p).replace(/\\/g, "/")))].sort();
}

export function intersectPaths(a, b) {
  const setB = new Set(uniqueSorted(b));
  return uniqueSorted(a).filter((p) => setB.has(p));
}

/**
 * Pure structural assessment of whether a post-exec remote advance is the
 * safe disjoint case. No git mutation.
 */
export function assessPostExecDivergence({
  executionBase,
  localHead,
  originMain,
  mergeBaseLocalOrigin,
  mergeBaseBaseOrigin,
  mergeBaseBaseLocal,
  localCommitsSinceBase,
  hasMergeCommitSinceBase,
  localChangedFiles,
  remoteChangedFiles,
  trackedDirty,
} = {}) {
  const base = trimSha(executionBase);
  const local = trimSha(localHead);
  const origin = trimSha(originMain);
  const mbLO = trimSha(mergeBaseLocalOrigin);
  const mbBO = trimSha(mergeBaseBaseOrigin);
  const mbBL = trimSha(mergeBaseBaseLocal);

  if (!base || !local || !origin) {
    return {
      ok: false,
      classification: POST_EXEC_HISTORY_AMBIGUOUS,
      human_gate_required: true,
      path: "stop",
      reason: "missing_sha",
    };
  }

  if (trackedDirty === true) {
    return {
      ok: false,
      classification: POST_EXEC_WORKTREE_DIRTY,
      human_gate_required: true,
      path: "stop",
    };
  }

  // Local already contains origin → ordinary fast-forward push eligible.
  if (local === origin || mbLO === origin) {
    return {
      ok: true,
      classification: POST_EXEC_NORMAL_FF,
      human_gate_required: false,
      path: "normal_ff",
      needs_replay: false,
    };
  }

  // Origin still at execution base → ordinary push of local task commits.
  if (origin === base && local !== base) {
    return {
      ok: true,
      classification: POST_EXEC_NORMAL_FF,
      human_gate_required: false,
      path: "normal_ff",
      needs_replay: false,
    };
  }

  // Ambiguous ancestry / not a simple A→B / A→C fork.
  if (
    hasMergeCommitSinceBase === true ||
    mbBL !== base ||
    mbBO !== base ||
    mbLO !== base
  ) {
    return {
      ok: false,
      classification: POST_EXEC_HISTORY_AMBIGUOUS,
      human_gate_required: true,
      path: "stop",
      reason: "ancestry_not_simple_fork",
    };
  }

  const commitCount = Number(localCommitsSinceBase);
  if (
    !Number.isFinite(commitCount) ||
    commitCount < 1 ||
    commitCount > MAX_BOUNDED_TASK_COMMITS
  ) {
    return {
      ok: false,
      classification: POST_EXEC_HISTORY_AMBIGUOUS,
      human_gate_required: true,
      path: "stop",
      reason: "unbounded_or_empty_task_history",
    };
  }

  if (origin === base) {
    return {
      ok: false,
      classification: POST_EXEC_HISTORY_AMBIGUOUS,
      human_gate_required: true,
      path: "stop",
      reason: "origin_not_advanced",
    };
  }

  const overlap = intersectPaths(localChangedFiles, remoteChangedFiles);
  if (overlap.length > 0) {
    return {
      ok: false,
      classification: POST_EXEC_REMOTE_ADVANCED_OVERLAP,
      human_gate_required: true,
      path: "stop",
      overlap_files: overlap.slice(0, 32),
    };
  }

  return {
    ok: true,
    classification: POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT,
    human_gate_required: false,
    path: "safe_disjoint_replay",
    needs_replay: true,
    local_changed_files: uniqueSorted(localChangedFiles),
    remote_changed_files: uniqueSorted(remoteChangedFiles),
  };
}

async function gitOk(gitExec, repo, args) {
  const r = await gitExec(repo, args);
  return {
    ok: r && r.status === 0,
    status: r?.status ?? 1,
    stdout: String(r?.stdout || "").trim(),
    stderr: String(r?.stderr || "").trim(),
  };
}

function rescueRefName(taskRef, localHead) {
  const safeTask = String(taskRef || "task")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .slice(0, 48);
  const short = trimSha(localHead).slice(0, 12) || "unknown";
  return `refs/local-dev-rescue/post-exec-${safeTask}-${short}-${Date.now()}`;
}

/** Inspect live git state for post-exec fence decisions. */
export async function inspectPostExecGitState({
  gitExec,
  repoPath,
  executionBase,
} = {}) {
  const base = trimSha(executionBase);
  const head = await gitOk(gitExec, repoPath, ["rev-parse", "HEAD"]);
  const origin = await gitOk(gitExec, repoPath, ["rev-parse", "origin/main"]);
  if (!head.ok || !origin.ok) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"] };
  }
  const localHead = head.stdout;
  const originMain = origin.stdout;

  const status = await gitOk(gitExec, repoPath, [
    "status",
    "--porcelain",
    "--untracked-files=no",
  ]);
  if (!status.ok) return { ok: false, reason_codes: ["STATUS_FAILED"] };
  const trackedDirty = status.stdout.length > 0;

  const mbLO = await gitOk(gitExec, repoPath, ["merge-base", "HEAD", "origin/main"]);
  const mbBO = await gitOk(gitExec, repoPath, ["merge-base", base, "origin/main"]);
  const mbBL = await gitOk(gitExec, repoPath, ["merge-base", base, "HEAD"]);
  if (!mbLO.ok || !mbBO.ok || !mbBL.ok) {
    return {
      ok: true,
      executionBase: base,
      localHead,
      originMain,
      mergeBaseLocalOrigin: mbLO.ok ? mbLO.stdout : null,
      mergeBaseBaseOrigin: mbBO.ok ? mbBO.stdout : null,
      mergeBaseBaseLocal: mbBL.ok ? mbBL.stdout : null,
      localCommitsSinceBase: null,
      hasMergeCommitSinceBase: true,
      localChangedFiles: [],
      remoteChangedFiles: [],
      trackedDirty,
      ancestry_probe_failed: true,
    };
  }

  const count = await gitOk(gitExec, repoPath, [
    "rev-list",
    "--count",
    `${base}..HEAD`,
  ]);
  const parents = await gitOk(gitExec, repoPath, [
    "log",
    "--format=%P",
    `${base}..HEAD`,
  ]);
  const hasMerge =
    parents.ok &&
    parents.stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .some((line) => line.trim().split(/\s+/).filter(Boolean).length >= 2);

  const localFiles = await gitOk(gitExec, repoPath, [
    "diff",
    "--name-only",
    `${base}...HEAD`,
  ]);
  const remoteFiles = await gitOk(gitExec, repoPath, [
    "diff",
    "--name-only",
    `${base}...origin/main`,
  ]);

  return {
    ok: true,
    executionBase: base,
    localHead,
    originMain,
    mergeBaseLocalOrigin: mbLO.stdout,
    mergeBaseBaseOrigin: mbBO.stdout,
    mergeBaseBaseLocal: mbBL.stdout,
    localCommitsSinceBase: count.ok ? Number(count.stdout) : null,
    hasMergeCommitSinceBase: hasMerge === true,
    localChangedFiles: localFiles.ok
      ? localFiles.stdout.split(/\r?\n/).filter(Boolean)
      : [],
    remoteChangedFiles: remoteFiles.ok
      ? remoteFiles.stdout.split(/\r?\n/).filter(Boolean)
      : [],
    trackedDirty,
  };
}

/** Run focused tests + git diff --check after a safe replay. */
export async function verifyReplayHygiene({
  gitExec,
  repoPath,
  testCommand,
  runTests,
} = {}) {
  if (testCommand && typeof runTests === "function") {
    const runs = await runTests({
      testCommand,
      maxTestCycles: 1,
      repoPath,
    });
    const last = Array.isArray(runs) ? runs[runs.length - 1] : null;
    if (!last || last.exit_code !== 0) {
      return {
        ok: false,
        classification: POST_EXEC_REPLAY_TEST_FAILED,
        reason_codes: [POST_EXEC_REPLAY_TEST_FAILED],
        tests: runs || [],
      };
    }
  }
  const check = await gitOk(gitExec, repoPath, ["diff", "--check"]);
  if (!check.ok) {
    return {
      ok: false,
      classification: POST_EXEC_DIFF_CHECK_FAILED,
      reason_codes: [POST_EXEC_DIFF_CHECK_FAILED],
    };
  }
  return { ok: true, reason_codes: [] };
}

/**
 * Full post-commit fence: fetch, assess, optional rescue+rebase, retest.
 * Never force-push. Caller performs ordinary push only when ok.
 */
export async function reconcilePostExecWithOrigin({
  gitExec,
  repoPath,
  executionBase,
  taskRef,
  testCommand = null,
  runTests = null,
} = {}) {
  const fetch = await gitOk(gitExec, repoPath, ["fetch", "origin", "main"]);
  if (!fetch.ok) {
    return {
      ok: false,
      human_gate_required: true,
      path: "stop",
      classification: "FETCH_FAILED",
      reason_codes: ["FETCH_FAILED"],
      post_exec_integration: { path: "stop", classification: "FETCH_FAILED", rescue_ref: null },
    };
  }

  const inspected = await inspectPostExecGitState({
    gitExec,
    repoPath,
    executionBase,
  });
  if (!inspected.ok) {
    return {
      ok: false,
      human_gate_required: true,
      path: "stop",
      classification: POST_EXEC_HISTORY_AMBIGUOUS,
      reason_codes: inspected.reason_codes || [POST_EXEC_HISTORY_AMBIGUOUS],
      post_exec_integration: {
        path: "stop",
        classification: POST_EXEC_HISTORY_AMBIGUOUS,
        rescue_ref: null,
      },
    };
  }

  const assessment = assessPostExecDivergence(inspected);
  if (assessment.path === "normal_ff") {
    return {
      ok: true,
      path: "normal_ff",
      classification: POST_EXEC_NORMAL_FF,
      reason_codes: [POST_EXEC_NORMAL_FF],
      human_gate_required: false,
      needs_replay: false,
      origin_main_at_assess: inspected.originMain,
      local_head_at_assess: inspected.localHead,
      post_exec_integration: {
        path: "normal_ff",
        classification: POST_EXEC_NORMAL_FF,
        rescue_ref: null,
      },
    };
  }

  if (!assessment.ok || assessment.path === "stop") {
    return {
      ok: false,
      path: "stop",
      classification: assessment.classification,
      reason_codes: [assessment.classification],
      human_gate_required: true,
      overlap_files: assessment.overlap_files || [],
      post_exec_integration: {
        path: "stop",
        classification: assessment.classification,
        overlap_files: assessment.overlap_files || [],
        rescue_ref: null,
      },
    };
  }

  const rescueRef = rescueRefName(taskRef, inspected.localHead);
  const rescue = await gitOk(gitExec, repoPath, [
    "update-ref",
    rescueRef,
    inspected.localHead,
  ]);
  if (!rescue.ok) {
    return {
      ok: false,
      path: "stop",
      classification: POST_EXEC_REPLAY_FAILED,
      reason_codes: [POST_EXEC_REPLAY_FAILED, "RESCUE_REF_FAILED"],
      human_gate_required: true,
      post_exec_integration: {
        path: "stop",
        classification: POST_EXEC_REPLAY_FAILED,
        rescue_ref: null,
      },
    };
  }

  const rebase = await gitOk(gitExec, repoPath, ["rebase", "origin/main"]);
  if (!rebase.ok) {
    await gitOk(gitExec, repoPath, ["rebase", "--abort"]);
    return {
      ok: false,
      path: "stop",
      classification: POST_EXEC_REPLAY_FAILED,
      reason_codes: [POST_EXEC_REPLAY_FAILED],
      human_gate_required: true,
      post_exec_integration: {
        path: "stop",
        classification: POST_EXEC_REPLAY_FAILED,
        rescue_ref: rescueRef,
      },
    };
  }

  const hygiene = await verifyReplayHygiene({
    gitExec,
    repoPath,
    testCommand,
    runTests,
  });
  if (!hygiene.ok) {
    return {
      ok: false,
      path: "stop",
      classification: hygiene.classification,
      reason_codes: hygiene.reason_codes,
      human_gate_required: true,
      post_exec_integration: {
        path: "stop",
        classification: hygiene.classification,
        rescue_ref: rescueRef,
      },
    };
  }

  const refetch = await gitOk(gitExec, repoPath, ["fetch", "origin", "main"]);
  if (!refetch.ok) {
    return {
      ok: false,
      path: "stop",
      classification: "FETCH_FAILED",
      reason_codes: ["FETCH_FAILED"],
      human_gate_required: true,
      post_exec_integration: {
        path: "stop",
        classification: "FETCH_FAILED",
        rescue_ref: rescueRef,
      },
    };
  }
  const originNow = await gitOk(gitExec, repoPath, ["rev-parse", "origin/main"]);
  if (!originNow.ok) {
    return {
      ok: false,
      path: "stop",
      classification: POST_EXEC_HISTORY_AMBIGUOUS,
      reason_codes: ["REV_PARSE_FAILED"],
      human_gate_required: true,
      post_exec_integration: {
        path: "stop",
        classification: POST_EXEC_HISTORY_AMBIGUOUS,
        rescue_ref: rescueRef,
      },
    };
  }
  if (originNow.stdout !== inspected.originMain) {
    return {
      ok: false,
      path: "stop",
      classification: POST_EXEC_ORIGIN_MOVED_AGAIN,
      reason_codes: [POST_EXEC_ORIGIN_MOVED_AGAIN],
      human_gate_required: true,
      post_exec_integration: {
        path: "stop",
        classification: POST_EXEC_ORIGIN_MOVED_AGAIN,
        rescue_ref: rescueRef,
        origin_at_assess: inspected.originMain,
        origin_now: originNow.stdout,
      },
    };
  }

  const mb = await gitOk(gitExec, repoPath, ["merge-base", "HEAD", "origin/main"]);
  if (!mb.ok || mb.stdout !== originNow.stdout) {
    return {
      ok: false,
      path: "stop",
      classification: POST_EXEC_HISTORY_AMBIGUOUS,
      reason_codes: [POST_EXEC_HISTORY_AMBIGUOUS, "POST_REPLAY_NOT_FF_ELIGIBLE"],
      human_gate_required: true,
      post_exec_integration: {
        path: "stop",
        classification: POST_EXEC_HISTORY_AMBIGUOUS,
        rescue_ref: rescueRef,
      },
    };
  }

  return {
    ok: true,
    path: "safe_disjoint_replay",
    classification: POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT,
    reason_codes: [POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT],
    human_gate_required: false,
    needs_replay: true,
    rescue_ref: rescueRef,
    origin_main_at_assess: inspected.originMain,
    post_exec_integration: {
      path: "safe_disjoint_replay",
      classification: POST_EXEC_REMOTE_ADVANCED_SAFE_DISJOINT,
      rescue_ref: rescueRef,
      local_changed_files: assessment.local_changed_files,
      remote_changed_files: assessment.remote_changed_files,
    },
  };
}
