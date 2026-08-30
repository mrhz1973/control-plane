# V4 — OpenCode bounded live dispatch proof REAUTH_2 (guarded)

**Block ID:** `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2`
**Starting HEAD / expected origin/main:** `80a7aad187c816f14ee463b9fc0c5f98a6e7250e`
**Status:** **PASS** — `LIVE_DISPATCH_OK`
**Authorization:** `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2.operator.json` (**spent**)
**Packet:** `EP-V4-OPENCODE-LIVE-PROOF-REAUTH-002`

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER = REAUTH_2 · AUTH ACTIVE | PASS |
| packet / guard tool present | PASS |
| prior AUTH spent · D-0025 CLOSED · WF61 inactive | PASS |
| OpenCode CLI | **1.18.25** |

## 1. Occupancy preflight

| Field | Value |
|---|---|
| occupancy_preflight_classification | **`QWEN_READY_IDLE`** |
| competing_workload_detected | **false** |
| blender / qwen-code / blender-mcp | absent |
| ollama models loaded | **0** |
| orphan `ollama_qwen_proxy` | present · idle · not correlated to active inference |
| `:8080` | LISTEN · HTTP 200 · `qwen38-original-dflash2-8k` exposed |
| Edge client on `:8080` | present (launcher WebUI) · not competing inference |

## 2. Restore

| Field | Value |
|---|---|
| runtime_restore_required | **false** |
| launcher_start_count | **0** |
| runtime_ready | **true** |
| qwen_model_exposed | **true** |

## 3. Single-generation guard

| Field | Value |
|---|---|
| guard_started | **true** |
| guard_bind_host | `127.0.0.1` |
| guard_listen_port | **12670** |
| guard_base_url | `http://127.0.0.1:12670` |
| guard_upstream_origin | `http://127.0.0.1:8080` |
| guard_generation_budget | **1** |
| READY schema | `opencode-single-generation-guard-ready-v1` |

OpenCode provider `baseURL` / `api` resolved exclusively to **`http://127.0.0.1:12670/v1`** (not direct `:8080`).

## 4. Occupancy recheck before generation

| Field | Value |
|---|---|
| occupancy_recheck_before_generation | **`QWEN_READY_IDLE`** |
| competing_workload_detected | **false** |

## 5. OpenCode config (temp, outside repo)

| Control | Value |
|---|---|
| tools | all denied |
| steps / maxSteps | **omitted** (no `steps=1` / `steps=2`) |
| title/summary/compaction/share | disabled |
| OPENCODE_DISABLE_* suite | set |
| `--pure` · fixed `--title` · no `--auto`/`--continue`/`--fork` | used |
| provider target is guard | **true** |

## 6. Live execution (exactly once)

| Field | Value |
|---|---|
| opencode_execution_count | **1** |
| live_transport_status | exit **0** · JSON events |
| live_elapsed_ms | **167644** |
| events | `step_start` → `text` → `step_finish(reason=stop)` |
| tokens (sanitized) | input 144 · output 573 · cache read 199 |

### Response (exact)

```json
{"schema":"v4-opencode-live-proof-output-v1","task_id":"V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2","route":"opencode+qwen_local","profile":"fast_8k","dflash_required":true,"result":"PASS","message":"LIVE_DISPATCH_OK"}
```

| Field | Value |
|---|---|
| response_validation | **VALID** |

## 7. Accounting

| Counter | Value |
|---|---|
| opencode_execution_count | **1** |
| qwen_generation_calls | **1** |
| guard_generation_budget | **1** |
| guard_generation_requests_seen | **1** |
| guard_upstream_generation_requests | **1** |
| guard_blocked_generation_requests | **0** |
| guard_first_generation_terminal | **true** |
| opencode_steps_generation_ceiling_used | **false** |
| retry / fallback / glm / codex / litellm / n8n | **0** |
| process_kill_calls | **0** |
| process_stop_calls | **0** (owned guard closed after accounting only) |
| repository_mutation_by_opencode | **false** |
| runtime_parameter_mutation | **false** |
| network_system_mutation | **false** |
| secret_exposure | **false** |

Invariant held: `upstream_generation_requests <= 1`.

## 8. Gate closure + cleanup

| Field | Value |
|---|---|
| gate_closed_final | **true** |
| AUTH | spent / non-reusable |
| guard process | closed after capture (PID owned by this pass only) |
| Qwen / Edge / Cursor | left running |

## NEXT

**`V4_OPENCODE_EXECUTION_ADAPTER_V1`** — implement production bounded OpenCode execution adapter behind explicit runtime authorization. Do **not** implement in this pass.

---

## Output line

`PASS — V4 OPENCODE LIVE DISPATCH PROOF REAUTH_2 / OPENCODE=1 / QWEN_GENERATIONS=1 / GUARD_UPSTREAM=1 / LIVE_DISPATCH_OK / GATE=CLOSED`
