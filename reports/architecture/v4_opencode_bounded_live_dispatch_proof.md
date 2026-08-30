# V4 — OpenCode bounded live dispatch proof

**Block ID:** `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF`
**Starting HEAD / expected origin/main:** `afab31088e2ca8121b73001502227e3826037bff`
**Status:** **STOP** — `QWEN_LOCAL_UNAVAILABLE`
**Authorization:** `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`
**Packet:** `EP-V4-OPENCODE-LIVE-PROOF-001`

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER `LIVE_PROOF_AUTHORIZED` | PASS |
| authorization artifact | PASS |
| packet validates | PASS |
| OpenCode CLI v1.18.25 · interface resolved | PASS |
| WF61 inactive · D-0025 CLOSED · D-0025 gate CLOSED | PASS |

## One-generation safety (pre-run, zero generation)

Temporary config outside repo prepared and resolved via `opencode --pure debug config`:

| Control | Proven |
|---|---|
| `agent.live-proof.steps` | **1** |
| all tool permissions | **deny** |
| `experimental.continue_loop_on_deny` | **false** |
| title/summary/compaction agents | **disabled** |
| `share` | **disabled** |
| `compaction.auto` | **false** |
| `enabled_providers` | `["qwen_local"]` only |
| model | `qwen_local/qwen38-original-dflash2-8k` |
| env: `OPENCODE_DISABLE_TITLE/AUTOCOMPACT/MODELS_FETCH/DEFAULT_PLUGINS/CLAUDE_CODE/LSP_DOWNLOAD/AUTOUPDATE/PRUNE` | set |
| `--pure` · explicit `--title` · no continue/fork/session · no `--auto` | planned |

**Not executed:** live `opencode run` was not started.

## Qwen readiness

Command: `node tools/qwen-local-session-manager-v1.mjs --profile fast_8k`

| Field | Value |
|---|---|
| profile | fast_8k |
| model_id | qwen38-original-dflash2-8k |
| status | **API_UNREACHABLE** |
| ready | **false** |
| launch_performed | true (one idempotent ensure) |
| wait_elapsed_ms | 180006 |
| launch_count | 1 |
| post-timeout `/v1/models` | unreachable |
| llama process / :8080 | none observed |

Per authorization: no second OpenCode invocation, no fallback, no GLM/Codex/LiteLLM, no launcher parameter mutation, no unauthorized restart beyond session-manager contract (already used once).

## Accounting

| Counter | Value |
|---|---|
| opencode_execution_count | **0** |
| qwen_generation_calls | **0** |
| retry_calls | 0 |
| fallback_calls | 0 |
| glm_calls | 0 |
| codex_calls | 0 |
| litellm_calls | 0 |
| n8n_calls | 0 |
| repository_mutation_by_opencode | false |
| runtime_parameter_mutation | false |
| secret_exposure | false |
| gate_closed_final | **true** |

## Decision

**STOP — QWEN_LOCAL_UNAVAILABLE**

Live OpenCode execution was **not** started because `qwen_local` was not READY. One-generation bound remains unspent (generation_calls=0).

## NEXT

Smallest zero-generation diagnosis/remediation: restore `qwen_local` llama.cpp DFlash2 `fast_8k` listen on `127.0.0.1:8080` (operator launcher / session readiness) without a second live OpenCode call. Re-authorize live proof only after READY.

Temporary OpenCode config remains outside the repository (`%TEMP%\opencode-v4-live-proof\`) and was not committed.

---

## Output line

`STOP — QWEN_LOCAL_UNAVAILABLE / OPENCODE=0 / QWEN_GENERATIONS=0 / GATE=CLOSED`
