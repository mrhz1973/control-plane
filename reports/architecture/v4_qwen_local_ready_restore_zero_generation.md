# V4 — qwen_local READY restore (zero generation)

**Block ID:** `V4_QWEN_LOCAL_READY_RESTORE_ZERO_GENERATION`
**Starting HEAD / expected origin/main:** `7a0046ba596f3db9cbf5367cf08546e37089b8ba`
**Status:** **PASS** — `fast_8k` READY on `127.0.0.1:8080`
**Generation calls:** **0** · OpenCode executions **0**

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main | PASS |
| CURRENT_FRONTIER NEXT = this block | PASS |
| prior live-proof gate CLOSED · AUTH historical | PASS |
| D-0025 CLOSED · WF61 inactive | PASS |

## Shared-runtime occupancy preflight (read-only)

Aligned with `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`:

| Observation | Classification impact |
|---|---|
| No listener on control-plane endpoint `:8080` | control-plane path **not running** |
| Separate Ollama `llama-server` on **31452** (same main blob path) | left **untouched** · not killed |
| No Blender/MCP/OpenCode generation correlated to `:8080` | none observed |
| Occupancy decision for restore start | **`QWEN_NOT_RUNNING_SAFE_TO_START`** for canonical `:8080` launcher path |

## Initial baseline (read-only, zero generation)

| Field | Value |
|---|---|
| initial_llama_process | Ollama `llama-server` only (port **31452**, not dflash2/8080) |
| initial_port_8080 | **not listening** |
| initial_models_http | **UNREACHABLE** |
| initial_fast_8k_exposed | **false** |
| launcher_exists | **true** (`Start-Qwen-MultiModel-16K.ps1`) |
| llama_cpp_directory_exists | **true** |
| llama-server.exe (dflash2) | **true** |
| models.ini | **true** |
| main + draft model artifacts | **true** |
| Edge | **true** |

## Previous `API_UNREACHABLE` diagnosis

| Classification | `API_UNREACHABLE_AFTER_CANONICAL_LAUNCH` |
|---|---|
| Evidence | Prior ensure: `launch_performed=true`, ~180s poll, no `:8080` listener, no dflash2 `llama-server` |

Deterministic launcher behavior (read-only inspection of canonical script):

1. Starts `llama.cpp-dflash2\...\llama-server.exe` with operator-tested `--models-preset` args on `127.0.0.1:8080`.
2. Requires `/v1/models` count ≥ 2 within **60s**, else **Stop-QwenServer** and fail.
3. Opens Edge WebUI and, after UI close, **stops** the 8080 server.

Prior session-manager spawn used `windowsHide` + detached PowerShell; that path did not leave a lasting healthy `:8080` listener. No launcher/runtime parameter mutation performed to remediate.

Ollama’s separate `llama-server` on **31452** (same main blob path) was **not** killed (not authorized).

## Restore action

| Field | Value |
|---|---|
| launcher_start_count | **1** |
| command | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File Start-Qwen-MultiModel-16K.ps1` |
| launcher_exit_or_spawn_behavior | Parent PowerShell remains alive (Edge UI wait loop); child dflash2 `llama-server` stays listening on 8080 |
| readiness poll | `/v1/models` only · max 180000 ms |
| first READY observation | ~20s · HTTP 200 · `qwen38-original-dflash2-8k` present |

## Final state

| Field | Value |
|---|---|
| final_llama_process | dflash2 `llama-server` PID observed · args include `--models-preset` · `--port 8080` |
| final_port_8080 | **LISTEN** `127.0.0.1:8080` |
| final_models_http | **HTTP 200** |
| final_fast_8k_exposed | **true** |
| qwen_backend | `llama_cpp` |
| qwen_profile | `fast_8k` |
| qwen_model_id | `qwen38-original-dflash2-8k` |
| dflash_required | **true** |
| session_manager_final_status | **READY** (`launch_performed=false` on recheck) |
| qwen_resource_status_available | **true** · `source=local_probe` · `cost_mode=free` |

## Tests (zero generation)

| Suite | Result |
|---|---|
| `tests/qwen-local-session-manager/run.mjs` | **14/14 PASS** |
| `tests/qwen-local-resource-status-overlay/run.mjs` | **PASS** |

## Counters

| Counter | Value |
|---|---|
| opencode_execution_count | **0** |
| qwen_generation_calls | **0** |
| glm/codex/litellm/n8n | **0** |
| launcher_mutations | **0** |
| runtime_parameter_mutations | **0** |
| network_mutations | **0** |
| process_kill_calls | **0** |
| secret_exposure | **false** |
| historical_live_auth_reused | **false** |
| gate_final | **CLOSED** · fresh operator AUTH required for any live OpenCode proof |

## NEXT

`V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH` — human gate for a **new** one-shot authorization. Do **not** reuse spent AUTH. Do **not** execute live proof in this pass.

---

## Output line

`PASS — V4 QWEN LOCAL READY RESTORED / FAST_8K=READY / GENERATIONS=0 / LIVE_PROOF_REAUTH_REQUIRED`
