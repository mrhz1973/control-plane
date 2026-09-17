# V4 — TMAR TTS governed LOCAL_DEV target onboarding v1

**Repository:** `mrhz1973/control-plane`
**Task ref:** `V4_TMAR_TTS_GOVERNED_LOCAL_DEV_TARGET_ONBOARDING_V1`
**Issue:** #90
**Date:** 2026-09-18
**Status:** COMPLETED (dry-run qualification only)

---

## RESULT

```
RESULT=PASS
TASK_REF=V4_TMAR_TTS_GOVERNED_LOCAL_DEV_TARGET_ONBOARDING_V1
ISSUE_90=#90

CONTROL_PLANE_BASE_HEAD=1b870e262df298584fc8dde5e47b56958b32e4b9
CONTROL_PLANE_FINAL_HEAD=d204edd06832250f556a2db5de7c36bfb18a5344

TARGET_REPO=mrhz1973/tmar-tts
TARGET_CANONICAL_PATH=C:\Users\mrhz\Downloads\Documents\AI\Chatterbox-TTS
TARGET_REMOTE=https://github.com/mrhz1973/tmar-tts.git
TARGET_INITIAL_HEAD=e22fff7f850dbe50e089a7329c89753aff556566
TARGET_FINAL_HEAD=e22fff7f850dbe50e089a7329c89753aff556566

KNOWN_LOCAL_REPOS=mrhz1973/control-plane, mrhz1973/tmar-tts
KNOWN_LOCAL_REPO_COUNT=2

QUEUE_REPO=mrhz1973/control-plane
QUEUE_PATH=reports/runtime/dev-queue/always-on (Control Plane canonical checkout)
RECEIPTS_OWNER_REPO=mrhz1973/control-plane

TARGET_SELECTION_SOURCE=selected backlog item `repository` field (closed map resolution)
CALLER_CAN_SELECT_TARGET=NO

CONTROL_REPO_HYGIENE=PASS (independent, fail-closed, unchanged law)
TARGET_REPO_HYGIENE=PASS (same fail-closed law applied to the selected target repo)
TARGET_HEAD_CAPTURE=PASS (target repo HEAD becomes dispatch_base_head for TMAR tasks)

TMAR_BRIDGE_ENVELOPE=PASS (LOCAL_DEV_B_D-9500-T dry-run fixture)
TMAR_TARGET_PATH_MATCH=YES
TMAR_REMOTE_MATCH=YES
TMAR_HEAD_MATCH=YES
TMAR_ALLOWED_PATHS_BOUNDED=YES (docs/current-state.md only, verbatim)

CONTROL_PLANE_BACKWARD_COMPAT=YES (all existing suites green)
UNKNOWN_REPO_FAIL_CLOSED=YES (REPO_NOT_LOCAL_KNOWN)

DRY_RUN_ONLY=YES
EXECUTOR_INVOCATIONS=0
QWEN_GENERATIONS=0
OPENCODE_EXECUTIONS=0

TMAR_FILES_CHANGED=0
TMAR_HEAD_CHANGED_BY_ONBOARDING=NO
TMAR_WORKTREE_CLEAN=YES (git status --short empty, HEAD e22fff7…556565)

FOCUSED_TESTS=local-dev-tmar-target-onboarding-v1 (16/16), local-dev-backlog-envelope-bridge-v1 (18/18), local-dev-dispatch-loop-v1 (5/5), local-dev-dispatcher-service-v1 (75/75), micro-task-delta-policy (11/11), local-dev-idle-backfill-injection-v1 (22/22)

DISPATCHER_RESTARTED=NO (running service not required to load the change for this dry-run qualification; restart deferred to next operator-authorized service window with status.active=false check)
LIVE_SERVICE_CHECK=NOT_PERFORMED (no restart performed; no live endpoints invoked during qualification)

WF90_CHANGED=NO
N8N_CHANGED=NO
TELEGRAM_CHANGED=NO
QWEN_LIFECYCLE_CHANGED=NO
ROUTING_CHANGED=NO
PRODUCTION_CHANGED=NO

SECRETS_EXPOSED=0
```

`COMMIT` / `REMOTE_HEAD_VERIFIED` / `ISSUE_90` final values are recorded at
push time below (§ Close-out).

---

## 1. Objective

Onboard TMAR TTS as exactly one additional governed LOCAL_DEV target
repository. Not generic multi-repo execution: exactly two known repositories
(`mrhz1973/control-plane`, `mrhz1973/tmar-tts`) flow through the existing
canonical pipeline (backlog → selector → claim → MICRO_TASK_DELTA admission →
LOCAL_DEV executor → PASS/STOP persistence). No second dispatcher, executor,
scheduler, queue, selector or authority was created.

## 2. Canonical target map

`KNOWN_LOCAL_REPOS` (tools/bridge-backlog-to-local-dev-envelope-v1.mjs) is the
one closed canonical map, now exactly:

```
mrhz1973/control-plane -> C:\Users\mrhz\Documents\AI\GitHub\control-plane
mrhz1973/tmar-tts     -> C:\Users\mrhz\Downloads\Documents\AI\Chatterbox-TTS
```

New pure helper `resolveKnownLocalRepo(repo)` performs exact-match
`hasOwnProperty` resolution only. No wildcards, no prefix matching, no
caller/env-supplied paths, no disk search, no auto-discovery, no auto-clone.
Unknown repository → `REPO_NOT_LOCAL_KNOWN` (fail closed).

## 3. Target selection law

- The **selected backlog item's canonical `repository` field** determines the
  target repository.
- `dispatch-local-dev-queue-loop-v1.mjs` `runDispatchLoop` resolves the
  per-item repository and passes it to the bridge; items without an explicit
  `repository` keep the queue control repo (backward compatible with every
  existing item).
- `POST /v1/tick` request schema is **unchanged** (`schema_version`,
  `request_id`, `source` only). Callers still cannot influence repo, path,
  commands, profile, allowed_paths, task choice or routing (T10 green).
- Single selection authority preserved: the dispatcher's pre-claim target
  resolution reuses the **same** `selectNextQueueItem` deterministic decision
  on the same entries/ledger/clock the loop uses; no second selector.

## 4. Repo hygiene (queue vs target)

- `QUEUE_REPO` (`mrhz1973/control-plane`) owns queue, receipts, runtime
  artifacts, dispatcher code. `REPO` remains as backward-compatible alias.
  `CANONICAL_REPO_PATH` still resolves to the Control Plane checkout.
- Control Plane hygiene runs first and independently (unchanged law).
- New phase `TARGET_REPO_HYGIENE`: when the selected item's repository differs
  from QUEUE_REPO, `verifyRepoState` runs against the allowlisted target path
  with the identical fail-closed law (main branch, fetch, tracked-clean before
  sync, HEAD==origin/main or exactly one `merge --ff-only`, never
  reset/stash/clean/rebase/force). Failures → `HUMAN_GATE_REQUIRED` with
  `TARGET_REPO_HYGIENE_FAILED` + the exact reason (incl. `REPO=<owner/repo>`
  labels for unambiguous operator diagnostics).
- `headsByRepo` carries the verified target HEAD into the loop; envelope
  `dispatch_base_head` for a TMAR task is the **TMAR HEAD**, never the Control
  Plane HEAD.
- Belt & braces: after claim, an envelope carrying `target_repo_path` must
  match the verified canonical path or the tick fails closed
  (`TARGET_PATH_MISMATCH`) before Qwen/admission/executor/persistence.

## 5. Remote law

Envelope `target_remote` is derived by the bridge from the canonical
`owner/repo` identity (`https://github.com/<repo>.git`), never trusted from
backlog content: `https://github.com/mrhz1973/tmar-tts.git` for TMAR,
`https://github.com/mrhz1973/control-plane.git` unchanged.

## 6. Allowed paths law

Unchanged: `scope.allowed_areas → envelope.allowed_paths` verbatim. The dry-run
fixture is bounded to `docs/current-state.md` and nothing else.

## 7. Dry-run qualification fixture + proof

Fixture: `tests/local-dev-tmar-target-onboarding-v1/fixtures/READY_TMAR_D9500T.md`
(`D-9500-T`, repository `mrhz1973/tmar-tts`, read-only/no-op objective,
allowed_paths `docs/current-state.md`). Never queued in
`reports/runtime/dev-queue/always-on`; WF90 never consumed it.

Live-read-only proof (no executor, no Qwen, no OpenCode):

```
selected repository      = mrhz1973/tmar-tts
resolved target path     = C:\Users\mrhz\Downloads\Documents\AI\Chatterbox-TTS
target HEAD              = e22fff7f850dbe50e089a7329c89753aff556566 (== origin/main, sync_performed=false)
target remote            = https://github.com/mrhz1973/tmar-tts.git
executor_invocations     = 0
qwen_generations         = 0
opencode_executions      = 0
TMAR_MUTATIONS           = 0 (git status --short empty; HEAD unchanged)
```

Dry-run envelope persisted as test evidence:
`tests/local-dev-tmar-target-onboarding-v1/dry-run-envelope.json`.

## 8. Focused tests

New suite `tests/local-dev-tmar-target-onboarding-v1/run.mjs` proves T1–T19
(mapping, fail-closed unknown/wildcard, envelope exactness, target selection,
hygiene independence, ff-only law, dry-run zero-execution, TMAR byte-identity,
single queue/executor/selector authority). All directly relevant existing
suites re-run green (bridge 18/18, loop 5/5, dispatcher service 75/75, policy
11/11, idle-backfill 22/22).

## 9. Hard walls honored

```
ARBITRARY_REPO_EXECUTION=NO
WILDCARD_REPO_MAPPING=NO
CALLER_REPO_SELECTION=NO
CALLER_PATH_SELECTION=NO
SECOND_QUEUE=NO
SECOND_RECEIPT_LEDGER=NO
SECOND_EXECUTOR=NO
SECOND_SELECTOR_AUTHORITY=NO
SECOND_SCHEDULER=NO
PRODUCTION_CHANGED=NO
WF90_CHANGED=NO
N8N_CHANGED=NO
TELEGRAM_CHANGED=NO
QWEN_LIFECYCLE_CHANGED=NO
ROUTING_POLICY_CHANGED=NO
HUMAN_GATE_AUTHORITY_CHANGED=NO
SELF_MAINTENANCE_AUTHORITY_CHANGED=NO
D0025_CHANGED=NO
TMAR_APPLICATION_CODE_CHANGED=NO
TMAR_DEPENDENCIES_CHANGED=NO
TMAR_MODEL_GENERATION=0
TMAR_AUDIO_GENERATION=0
DESTRUCTIVE_GIT=0
```

## 10. Close-out (push time)

```
COMMIT=d204edd06832250f556a2db5de7c36bfb18a5344
REMOTE_HEAD_VERIFIED=YES (origin/main == d204edd06832250f556a2db5de7c36bfb18a5344)
ISSUE_90=CLOSED_COMPLETED
NEXT=queue first real TMAR task: verify-fresh-install (from mrhz1973/tmar-tts/docs/roadmap.md NOW) — NOT queued in this pass
```

**End of report.**
