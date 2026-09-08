# V4_QWEN_LOCAL_AUTORECOVERY_EXHAUSTIVE_REMEDIATION_V1

ROOT_CAUSE=CANONICAL_ZOMBIE_ROUTER_ON_8080_FAIL_CLOSED_WITHOUT_RECYCLE (+ unloaded catalog treated as ready without /models/load; DEV/preflight timeout 30s < backend ~90s budget)
FIX=Recycle only identified canonical unhealthy router tree then headless relaunch; exact POST /models/load; READY requires id + loaded|loading; DEFAULT_DEV_ROUTER_TIMEOUT_MS and QWEN_PREFLIGHT_TIMEOUT_MS=120000
SCENARIO_TOTAL=15
SCENARIO_PASS=15
SCENARIO_FAIL=0
LIVE_COLD_START=PASS (zombie :8080 LISTEN+HTTP 502 → recycle → LAUNCH_STARTED_AND_READY; later exact load → loaded)
WARM_REUSE=PASS (second ensure launch_count=0 load_performed=false status=READY)
EXACT_PROFILE_VISIBLE=PASS (qwen38-opus-q3-opencode-64k in /v1/models with status=loaded)
DISPATCHER_HEALTH=PASS (GET http://127.0.0.1:18793/v1/status schema-valid; PID retained)
D9404A_CONSUMED=NO
PROVIDER_CALLS=0
HERMES_CALLS=0
GLM_CALLS=0
CODEX_CALLS=0

## Evidence — first failing boundary

Observed before fix (local probe, not chat reconstruction):

- Canonical router PID held `127.0.0.1:8080` (`python -u …/qwen_runtime_router.py --config …/qwen-runtime-router.json`).
- `GET /v1/models` and `/health` returned **HTTP 502** (backend `:18080` dead).
- `ensureWorkstationDevRouterReady` / `ensureWorkstationDevQwenReady(64k)` returned **`ENDPOINT_OCCUPIED_UNHEALTHY`** with `launch_performed=false`.

First boundary: occupied+unhealthy treated every occupant as foreign → fail closed → no relaunch.

Secondary boundaries proven from router/`qwen-models.ini`:

1. Backend bring-up budget in `start_backend` is ~90s; prior DEV/preflight timeout 30s was insufficient after a real relaunch.
2. `--models-autoload` prefers first preset (`qwen38-opus-q3-daily-16k`); catalog may list 64k as **unloaded**. Exact readiness now requires `loaded|loading` and performs exact `/models/load` when missing.

## Fix (minimal, allowed scope)

| File | Change |
|---|---|
| `tools/qwen-local-session-manager-v1.mjs` | Canonical zombie classify/recycle; wire into ensure-router; exact `/models/load`; readiness respects load state; DEV timeout 120s |
| `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` | `QWEN_PREFLIGHT_TIMEOUT_MS=120000` |
| `tests/local-dev-executor-workstation-session-bridge-v1/run.mjs` | Foreign vs canonical recycle cases; exact-load path |
| `tests/qwen-local-autorecovery-checkpoint-v1/run.mjs` | Matrix ≥12 scenarios + live S12 |

Foreign `:8080` occupants remain fail-closed (no kill). QWEN tree / `qwen-models.ini` untouched (READ-ONLY).

## Scenario matrix

| ID | Result | Evidence |
|---|---|---|
| S1 COLD ROUTER | PASS | mock launch once → READY |
| S2 WARM READY | PASS | zero launch/load |
| S3 PROFILE MISSING | PASS | exact `/models/load` → PROFILE_LOADED_AND_READY |
| S4 WRONG PROFILE | PASS | never READY on other id |
| S5 DEAD ROUTER | PASS | bounded READINESS_TIMEOUT |
| S6 FOREIGN PORT | PASS | FOREIGN_OR_UNKNOWN_OCCUPANT, no launch |
| S6b CANONICAL ZOMBIE | PASS | recycle once then launch READY |
| S7 ENTRYPOINT MISSING | PASS | ROUTER_ENTRYPOINT_NOT_FOUND |
| S8 CONFIG MISSING | PASS | ROUTER_CONFIG_NOT_FOUND |
| S9 PYTHON MISSING | PASS | PYTHON_NOT_FOUND |
| S10 SPAWN EXIT | PASS | READINESS_TIMEOUT after launch |
| S11 CONCURRENT | PASS | single launch under dual ensure |
| S12 LIVE COLD/ZOMBIE | PASS | pre: occupied=true models_http=502 → first=LAUNCH_STARTED_AND_READY; post-load status=loaded; warm reuse |
| S13 ISOLATED FOREIGN | PASS | ephemeral non-8080 occupant fail-closed |
| CLASSIFY/TREE | PASS | canonical vs foreign + backend port tree |

## Live integration (no /v1/tick, D-9404-A unconsumed)

- Direct `ensureWorkstationDevQwenReady(qwen38-opus-q3-opencode-64k)` after zombie recycle → ready.
- Exact id visible; load_state progressed `loading` → `loaded`.
- Second ensure: `READY`, `launch_count=0`, `load_performed=false`.
- Dispatcher `GET /v1/status` healthy schema; no queue/receipt mutation for D-9404-A (`READY_D9404A.md` present; no claim envelope).
- Note: long-lived dispatcher process still needs a later Scheduled Task recycle to import this revision in-process; session-manager path proven out-of-band.

## Regressions

- `node tests/qwen-local-autorecovery-checkpoint-v1/run.mjs` → 15/15
- `node tests/local-dev-executor-workstation-session-bridge-v1/run.mjs` → 26/26
- `node tests/local-dev-dispatcher-service-v1/run.mjs` → 24/24
- `git diff --check` on scoped files → PASS

## Invariants

- No n8n/WF40/WF61/D-0025/VPS/Hermes/GLM/Codex/provider mutation
- No profile fallback; fail closed if exact 64k unavailable
- D-9404-A left for natural WF90 after this PASS
