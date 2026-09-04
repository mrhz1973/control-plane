# Handoff — LOCAL_DEV_EXECUTOR RETRY5 diagnostic STOP

Repository: mrhz1973/control-plane
Producer: GPT Web
Reason: context rollover; latest live workstation result is not yet represented in CURRENT_FRONTIER
Active work: `V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY5_DIAGNOSTIC`

## Delta non ancora ricavabile dal repo vivo
- The bounded live retry was executed locally from base `1b75b632228b241e0833f341c5971e91aa85e49e`.
- Result: `STOP:OPENCODE_RUN_FAILED` after about 92 s; `opencode_exit_code=1`; stdout/stderr excerpts empty.
- `router_was_running=true`; `launch_performed=false`; `turns_used=0`; no tracked file changed; no tests ran; no commit was created.
- Guard accounting was all zero: `generation_requests_seen=0`, `upstream_generation_requests=0`, `blocked_generation_requests=0`, `informational_requests_forwarded=0`, `rejected_requests=0`, `secret_bearing_requests_rejected=0`.
- Therefore OpenCode never reached the DEV guard or Qwen during RETRY5.
- Code inspection at the same base shows a timeout-attribution race in `makeRunOpenCodeTask`: the timeout callback awaits `spawned.terminate()` before rejecting `BOUNDS_TIMEBOX_EXPIRED`; terminating the child can resolve `spawned.promise` with exit 1 first, causing `Promise.race` to surface `OPENCODE_RUN_FAILED` instead of the timeout classification. The ~92 s runtime with empty output and zero guard accounting is consistent with this race.

## Stato locale non globale
- workstation checkout: `C:\Users\mrhz\Documents\AI\GitHub\control-plane`
- local HEAD observed after RETRY5: `1b75b632228b241e0833f341c5971e91aa85e49e`
- tracked worktree changes from RETRY5: none
- pre-existing untracked files remain and must be preserved
- router was already running and was not owned/stopped by the task

## Gate reale
- NONE. This is a bounded DEV control-plane correction under standing operator authorization.

## next_action
Fix the timeout-attribution race so timeout-triggered child termination deterministically returns `STOP:BOUNDS_TIMEBOX_EXPIRED` with confirmed termination diagnostics, never `OPENCODE_RUN_FAILED`; add regression coverage, then rerun a short diagnostic live proof.

Suggested task ref: `V4_LOCAL_DEV_EXECUTOR_TIMEOUT_ATTRIBUTION_RACE_FIX_V1`.

## Bootstrap nuova chat
BOOTSTRAP control-plane. Esegui esclusivamente CORE BOOT dal README AI-BOOT, poi leggi `docs/handoffs/2026-09-05-0041-local-dev-retry5-diagnostic-stop-handoff-gptweb.md` come delta locale di rollover e segui AUTO-VIA.
