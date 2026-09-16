# v4_local_dev_qwen_idle_autostop_v1

RESULT=PASS
TASK_REF=V4_LOCAL_DEV_QWEN_IDLE_AUTOSTOP_V1
ISSUE_89=#89

BASE_HEAD=d7cec520d507b1455f7ac32cfc69aa7e31616569
FINAL_HEAD=3422373e4546417109a74f0f0c93c087940ff753

IDLE_GRACE_MS=90000
LIFECYCLE_OWNER=tools/qwen-local-idle-lifecycle-v1.mjs (one-shot timer owned by the always-on dispatcher server; no second scheduler — WF90 remains the tick owner and its IDLE_CLEAN ticks only trigger a read-only reconcile)
LIFECYCLE_STATES=STOPPED|STARTING|LOADED_IDLE|SERVING|IDLE_GRACE|AUTO_STOPPED|SHUTDOWN_FAILED (exact internal states of qwen-local-idle-lifecycle-v1; deterministic transitions, exposed read-only via diagnostics `qwen.lifecycle`)

START_ON_DEMAND=YES (canonical ensureWorkstationDevQwenReady untouched; exact-profile READY law preserved; IDLE_CLEAN reconciles read-only and never starts Qwen)
IDLE_AUTOSTOP=YES (bounded one-shot grace 90s armed on last real use; fresh fence re-check immediately before stop)
ACTIVE_EXECUTION_PROTECTION=YES (dispatcher execution window fences stop; proven in focused suite T3 + end-to-end T13)
ACTIVE_REQUEST_PROTECTION=YES (proven LIVE in Phase B: real in-flight generation + concurrent stop attempt → stop DEFERRED with fences MODEL_REQUEST_IN_FLIGHT + FOREIGN_ESTABLISHED_CLIENT; request completed HTTP 200; worker PIDs byte-identical before/after)
FOREIGN_PROCESS_PROTECTION=YES (termination only after canonical ownership proof: qwen_runtime_router.py entrypoint + exact qwen-runtime-router.json + parent-child closure; foreign/ambiguous census → deterministic refuse, zero kills; suite T8 + real foreign llama-server on :9999 excluded from tree in tests)

SHUTDOWN_STRATEGY=1) exact-model unload via canonical router POST /models/unload (router proxies to llama.cpp model manager; worker exits, VRAM released) with bounded verification; 2) bounded fallback: targeted graceful-then-forced PID-tree stop of the positively identified canonical tree only (taskkill /PID <pid> /T, then /T /F on re-verified survivors). Broad name/port-based kills NOT used.
CANONICAL_TREE_IDENTIFICATION=tools/qwen-local-session-manager-v1.mjs identifyCanonicalDevTree(): entrypoint+config classifier → collectCanonicalRouterTreePids (port evidence + --ppid evidence) → parent-child closure over the full Win32_Process census (catches dynamic-port worker); worker_pids = tree − router_pids
BROAD_PROCESS_KILL_USED=NO

REAL_ROUTER_PID_BEFORE=55156 (Phase A; headless python -u qwen_runtime_router.py --config qwen-runtime-router.json)
REAL_MANAGER_PID_BEFORE=32828 (llama-server.exe --port 18080 --models-autoload)
REAL_WORKER_PIDS_BEFORE=6956 (llama-server.exe --alias qwen38-opus-q3-opencode-64k --ctx-size 65536 --port 26113 dynamic --n-gpu-layers 50 --threads 20; census also recorded 43684/43888 router-children rows from PowerShell census grouping)

REAL_IDLE_AUTOSTOP=YES (Phase C: grace timer armed 2026-09-16T17:50:21.870Z + 90s → fired 17:51:51Z in the still-alive driver process; fresh fences passed; canonical tree exited WITHOUT manual console intervention)
REAL_WORKER_EXITED=YES (PIDs 55156/32828/6956 all GONE verified via Win32_Process direct queries; ports 8080/18080/26113 free)
REAL_CPU_RELEASED=YES (llama-server CPU counters: none running after stop — the ~67% idle-burn incident class is eliminated)
REAL_VRAM_RELEASED=YES (nvidia-smi: 12003 MiB loaded → 1097 MiB after auto-stop; second cycle Phase D close: 11930 MiB → 1039 MiB)

RESTART_ON_DEMAND=YES (Phase D: canonical ensure after AUTO_STOPPED → PROFILE_LOADED_AND_READY, launch_performed=true load_performed=true, new router PID 54836)
RESTART_EXACT_PROFILE=YES (GET /v1/models → exactly qwen38-opus-q3-opencode-64k state=loaded; worker alias verified; no fallback profile)

FINAL_QWEN_STATE=STOPPED (AUTO_STOPPED by natural policy after Phase D close; 0 qwen processes, VRAM 1047 MiB, :8080 free at report time)

DASHBOARD_LIFECYCLE_STATE=ADDITIVE_LABELS (qwen.lifecycle snapshot exposed by /v1/diagnostics; dashboard renders Fermato / Avvio / Caricato · inattivo / In uso / Stop automatico tra Ns / Fermato automaticamente / Errore arresto; no dashboard redesign; #85/#86 untouched)
OBSERVABILITY_STARTS_QWEN=NO (reconcile is strictly read-only: census + GET /v1/models; never launches, loads or recycles)

FOCUSED_TESTS=tests/qwen-local-idle-autostop-v1/run.mjs → 14/14 PASS (covers all 12 required proofs: grace-not-before-deadline, stop-after-deadline, execution fence, model-request fence, established-client fence, new-task cancels stop, idempotent stop, foreign never terminated, reconcile never starts, ensure-after-autostop exact profile, state transitions, shutdown failure surfaced; plus config bounds 60–120s and unload fail-closed contract)
AUTORECOVERY_REGRESSION=tests/qwen-local-autorecovery-checkpoint-v1/run.mjs → 15/15 PASS (incl. S12 live cold/zombie→READY then warm reuse); tests/local-dev-dispatcher-service-v1/run.mjs → 75/75 PASS; tests/local-dev-executor-workstation-session-bridge-v1/run.mjs → 26/26 PASS

WF90_CHANGED=NO (120s cadence, 3900000ms timeout, #84 dedupe, #87 actionable gate semantics untouched; no n8n workflow artifact modified)
TELEGRAM_CHANGED=NO
N8N_CHANGED=NO
PRODUCTION_CHANGED=NO

EXTERNAL_QWEN_SOURCE_CHANGED=NO (C:\Users\mrhz\Documents\AI\QWEN\qwen_runtime_router.py untouched — its existing POST /models/unload and manager proxy satisfied the preferred strategy without any patch)
UNRELATED_PROCESSES_KILLED=0 (verified: 0 foreign llama-server processes touched; kills limited to positively identified canonical tree PIDs, evidenced in shutdown_result.requested_pids)

SECRETS_EXPOSED=0

ISSUE_89=CLOSED_COMPLETED
COMMIT=3422373e4546417109a74f0f0c93c087940ff753 (implementation 94820ca + follow-ups 494283e, 2ff3eef, 3422373)
REMOTE_HEAD_VERIFIED=YES (local HEAD == origin/main == 3422373e4546417109a74f0f0c93c087940ff753)

## Implementation map

- tools/qwen-local-idle-lifecycle-v1.mjs (NEW): bounded idle lifecycle controller.
  - `resolveIdleShutdownMs`: qwen_local_idle_shutdown_ms bounds 60000–120000, default 90000, deterministic fallback on invalid values.
  - `createQwenIdleLifecycle`: one-shot grace timer (injectable clock for determinism), execution/request/preflight bookkeeping, `reconcile()` (read-only truthing), `performIdleStop()` (fresh fences → unload → verified tree stop → AUTO_STOPPED/SHUTDOWN_FAILED), self-probe exclusion in the TCP activity fence, execution-window flag so an unbalanced `markExecutionEnd` never fabricates grace.
  - `getSharedQwenIdleLifecycle`: lazy shared instance owned by startServer (never created on import; performTick uses only explicitly injected handles → injected-deps tests are fully isolated).
- tools/qwen-local-session-manager-v1.mjs: `defaultUnloadExactDevModel` (POST /models/unload exact id, no fallback), `defaultListLoadedDevModels`, `identifyCanonicalDevTree`, `defaultStopCanonicalTreePids` (graceful → re-verify → bounded force), `stopCanonicalDevRouterTree` (fail-closed on foreign/ambiguous), parent-child closure in tree collection (ParentProcessId added to the census).
- tools/serve-local-dev-autonomous-dispatcher-v1.mjs: preflight (markPreflightStart/End around ensure), execution window (markExecutionStart before runExecutor), terminal `done()` hook (markExecutionEnd after PASS/STOP/HUMAN_GATE/SERVICE_ERROR), IDLE_CLEAN → onIdleCleanTick reconcile, startServer owns the shared lifecycle + isDispatcherBusy fence, diagnostics expose additive `qwen.lifecycle` snapshot.
- tools/local-dev-dispatcher-dashboard-v1.html: additive `qwenLifecycleInfo` + labels; UNAVAILABLE state now shows "Fermato automaticamente" when lifecycle says so; IDLE_GRACE shows live countdown "Stop automatico tra Ns".
- configs/resources/qwen-local-runtime.json: `qwen_local_idle_shutdown_ms: 90000`.

## Live qualification evidence

- Phase A (cold start): ensureWorkstationDevQwenReady("qwen38-opus-q3-opencode-64k") → READY exact profile; headless tree router 55156 → manager 32828 → worker 6956 (dynamic port 26113, ctx 65536, GPU offload 50 layers); VRAM 12003/12288 MiB.
- Phase B (active protection): real POST /v1/chat/completions in-flight; concurrent performIdleStop → `{stopped:false, deferred:true, reason_code:ACTIVE_FENCE, fences:[MODEL_REQUEST_IN_FLIGHT, FOREIGN_ESTABLISHED_CLIENT]}`; generation completed HTTP 200; worker PIDs identical before/after.
- Phase C (real idle auto-stop): one-shot timer armed at request end (17:50:21.870Z + 90s); fired at 17:51:51Z; fresh fences all clear; canonical tree exited; VRAM 12003 → 1097 MiB; llama CPU counters gone; ports 8080/18080/26113 free; ZERO manual console action.
- Phase D (restart proof): canonical ensure again → PROFILE_LOADED_AND_READY (launch+load performed, router 54836); GET /v1/models → exactly qwen38-opus-q3-opencode-64k loaded, VRAM 11880 MiB. Closing: natural reconcile → IDLE_GRACE armed → one-shot fire → tree_stop of positively identified PIDs [54836, 34992, 28696, 51116, 46736] → AUTO_STOPPED; VRAM 11930 → 1039 MiB.

## Notes

- During qualification the dispatcher service was restarted (Windows, local always-on service only) strictly after verifying `status.active=false`, phase TERMINAL — zero interrupted executions. Final service PID 53704 runs the committed code; diagnostics lifecycle reports state/cfg/idle_ms correctly.
- The Phase B→C transition was fully organic: the armed timer fired inside the qualification driver, demonstrating the timer works even outside the server process when it owns the lifecycle.
- An instructive false-positive was observed and fixed (commit 3422373): the observer's own established probe connection counted as a foreign client; the fence now excludes the observing process's own connections while still failing closed on census errors.
