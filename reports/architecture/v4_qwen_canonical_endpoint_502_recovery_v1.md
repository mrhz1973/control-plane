# V4 Qwen canonical endpoint 502 recovery V1

## Classification

`PASS`

`BASE_HEAD=4cd860e4d6aeae76614ff282c678cff77a10a190`

## PRE state

- Canonical configuration remained unchanged:
  `canonical_endpoint=http://127.0.0.1:8080` and
  `primary_backend=multi_model_router`.
- `127.0.0.1:8080` was occupied by PID `39708`, a Python process whose
  bounded command line was the canonical
  `qwen_runtime_router.py --config qwen-runtime-router.json`.
- `GET /v1/models` and `GET /health` on `:8080` returned HTTP 502.
- `:18080`, `:18200`, and `:18210` had no loopback listeners; bounded GETs to
  `:18080` were connection-refused.
- The canonical router entrypoint, config, launcher, backend executable, and
  model preset all existed. The occupant was therefore not foreign/unknown.

Root cause: `CANONICAL_ZOMBIE_ROUTER_ON_8080` — the canonical router process
survived while its canonical backend was dead/not started. This is the known
failure boundary covered by the existing session-manager recovery; no new
root cause or repo-owned regression was found.

## Recovery

The existing `ensureWorkstationDevRouterReady` path was invoked with its
bounded 120-second timeout. It recycled only the identified canonical router
tree and relaunched through the configured headless router path. Result:

`LAUNCH_STARTED_AND_READY`, `launch_count=1`, `wait_elapsed_ms=4048`,
`base_url=http://127.0.0.1:8080`.

No global process kill, name-based kill, foreign-process action, model-file,
GGUF, llama.cpp, CUDA, driver, endpoint, or configuration change occurred.

## POST state

- Router PID `48740` matched the canonical entrypoint/config.
- Canonical backend child PID `34804` was owned by the router and ran the
  canonical `llama-server.exe` on `127.0.0.1:18080`.
- `GET /health` returned HTTP 200 with `{"status":"ok"}` on both `:8080`
  and `:18080`.
- The `/v1/models` catalog returned HTTP 200, 12,355 bytes, and a valid
  OpenAI-compatible `data` array containing the canonical profile IDs. The
  listed profiles were `unloaded`; this is a valid catalog/IDLE observation,
  and no model was loaded for this task.
- Three separate `/v1/models` probes returned HTTP 200 with schema-valid
  catalogs: probe 1 in 145 ms, probe 2 in 10 ms, probe 3 in 10 ms.
- Warm recheck via the same existing session-manager function returned
  `READY`, `launch_performed=false`, `launch_count=0`, and
  `load_performed=false`.

## Dashboard/resource verification

The current dispatcher code was exercised on an ephemeral loopback server
using the real Qwen collector and a bounded quota stub to avoid waiting on the
separate asynchronous OpenClaw CLI refresh. `GET /dashboard` returned 200 and
`GET /v1/resources` returned 200 with `read_only=true`; Qwen was
`AVAILABLE/OBSERVED`, reachable, and not `REAL_FAILURE` for HTTP 502. The
existing persistent `:18793` service was not restarted or mutated.

## Code and safety

`CODE_CHANGE_REQUIRED=NO`: the existing canonical autorecovery already
covered the observed zombie boundary and restored the endpoint successfully.
No Qwen generation, chat/completions, agent task, OpenCode task, WF90 task,
benchmark, `/v1/tick`, queue/claim/receipt mutation, provider call, GLM,
Codex inference, Hermes, ChatGPT Web, OpenAI API/BYOK, credential/cookie
access, n8n/VPS/OLD mutation, or network exposure occurred.

## Tests

- `node tests/qwen-local-autorecovery-checkpoint-v1/run.mjs` → 15/15 PASS
- `node tests/local-dev-executor-workstation-session-bridge-v1/run.mjs` → 26/26 PASS
- `node tests/local-dev-resource-observability-integrity-v1/run.mjs` → 7/7 PASS
- `node tests/local-dev-dispatcher-service-v1/run.mjs` → 69/69 PASS
- `git diff --check` → PASS

The previous dashboard VPS/reorder PASS, resource observability integrity,
`DASHBOARD_RED_STATE_REQUIRES_REAL_FAILURE=YES`, exact profile semantics,
`QWEN_INDEPENDENT_QUALIFIED=YES`, always-on dispatcher policy, queue/claim/
receipt state, `#73 PHASE_D=OPEN`, and production-routing-disabled state are
preserved.
