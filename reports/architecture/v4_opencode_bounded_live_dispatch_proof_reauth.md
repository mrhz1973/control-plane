# V4 — OpenCode bounded live dispatch proof REAUTH

**Block ID:** `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH`
**Starting HEAD / expected origin/main:** `d03930b544c29741aeffd42e844bd799073e5a39`
**Status:** **STOP** — `LIVE_PROOF_RESPONSE_INVALID`
**Authorization:** `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.operator.json` (**spent**)
**Packet:** `EP-V4-OPENCODE-LIVE-PROOF-REAUTH-001`

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER = this block · fresh AUTH | PASS |
| packet exists/validates | PASS |
| prior AUTH (no REAUTH) historical/spent | PASS |
| D-0025 CLOSED · WF61 inactive | PASS |
| OpenCode CLI | **1.18.25** |

## 1. Occupancy preflight (read-only)

| Field | Value |
|---|---|
| occupancy_preflight_classification | **`QWEN_NOT_RUNNING_SAFE_TO_START`** |
| competing_workload_detected | **false** |
| blender / qwen-code / blender-mcp | absent |
| ollama models loaded | **0** |
| `:31452` listener | none |
| orphan `ollama_qwen_proxy` | present · CPU-flat · parent gone · **not** treated as active inference |
| `:8080` before restore | UNREACHABLE |

## 2. Zero-generation restore

| Field | Value |
|---|---|
| runtime_restore_required | **true** |
| launcher_start_count | **1** |
| launcher | `Start-Qwen-MultiModel-16K.ps1` (canonical only) |
| runtime_ready | **true** |
| models_http_status | **200** |
| qwen_model_exposed | **true** (`qwen38-original-dflash2-8k`) |
| control-plane llama-server PID | **30504** (dflash2 · `--port 8080`) |

No Ollama/Blender/proxy kill · no runtime-parameter mutation.

## 3. Occupancy revalidation before generation

| Field | Value |
|---|---|
| occupancy_recheck_before_generation | **`QWEN_READY_IDLE`** |
| competing_workload_detected | **false** |
| Ollama loaded models | 0 |
| CP llama CPU idle sample | flat before live call |

## 4. DISPATCH_READY

| Field | Value |
|---|---|
| classification | **DISPATCH_READY** |
| dispatch_ready | **true** |
| execution_performed | **false** |
| qwen_session_status | **READY** |
| route | `opencode+qwen_local` |
| generation at this stage | **0** |

## 5. One-generation safety (pre-run)

Temporary config outside repo (`%TEMP%\opencode-v4-live-proof-reauth\opencode.json`), reused proven shape:

| Control | Proven |
|---|---|
| `agent.live-proof.steps` | **1** |
| tools / permissions | deny / `*` false |
| `continue_loop_on_deny` | **false** |
| title/summary/compaction | disabled |
| share | disabled |
| enabled_providers | `["qwen_local"]` only |
| model | `qwen_local/qwen38-original-dflash2-8k` |
| OPENCODE_DISABLE_* suite | set |
| `--pure` · `--title` fixed · no `--auto`/`--continue`/`--fork` | used |

## 6. Live execution (exactly once)

| Field | Value |
|---|---|
| opencode_execution_count | **1** |
| live_transport_status | process exit **0** · `--format json` events captured |
| live_elapsed_ms | **58748** |
| event_types | `step_start` → `text` → `step_finish` |
| step_finish reason | `stop` |
| tokens (sanitized) | input **495** · output **1** · total **496** |

Assistant text was **not** the required compact JSON. Structural head indicates OpenCode **`CRITICAL - MAXIMUM STEPS REACHED`** constraint text (tools disabled / text-only summary instructions). Required fields `schema` / `LIVE_DISPATCH_OK` **absent**.

Per authorization: **no second OpenCode execution** · malformed response is **not** permission for retry.

## 7. Accounting

| Counter | Value |
|---|---|
| opencode_execution_count | **1** |
| qwen_generation_calls | **1** (reconciled via single `step_finish` with model token usage) |
| retry_calls | **0** |
| fallback_calls | **0** |
| glm / codex / litellm / n8n | **0** |
| process_kill_calls | **0** |
| process_stop_calls | **0** |
| repository_mutation_by_opencode | **false** (git before/after identical · workspace clean) |
| runtime_parameter_mutation | **false** |
| network_mutation | **false** |
| secret_exposure | **false** |

### Response validation

| Field | Value |
|---|---|
| response_schema | **missing** |
| response_task_id | **missing** |
| response_route | **missing** |
| response_profile | **missing** |
| response_dflash_required | **missing** |
| response_result | **missing** |
| response_message | **missing** |
| response_validation | **FAIL** — `MAXIMUM_STEPS_TEXT_NOT_REQUIRED_JSON` |

## 8. Gate closure

| Field | Value |
|---|---|
| gate_closed_final | **true** |
| AUTH | historical / spent / **non-reusable** |

## Decision

**STOP — `LIVE_PROOF_RESPONSE_INVALID`**

Live OpenCode ran once against READY `qwen_local` `fast_8k` DFlash2, consumed the one authorized generation, and did not emit the required `v4-opencode-live-proof-output-v1` object.

## NEXT

**`V4_OPENCODE_STEPS1_MAXIMUM_STEPS_DIAGNOSIS_ZERO_GENERATION`** — zero-generation diagnosis of why OpenCode 1.18.25 with proven `steps=1` / tools-deny emits `MAXIMUM STEPS REACHED` instead of the required JSON (step accounting / agent wiring). No live retry without fresh AUTH.

---

## Output line

`STOP — LIVE_PROOF_RESPONSE_INVALID / OPENCODE=1 / QWEN_GENERATIONS=1 / GATE=CLOSED`
