# V4 — OpenCode execution dispatch

**Block ID:** `V4_OPENCODE_DISPATCH_RESUME_AFTER_CANONICAL_INSTALL`
**Prior block:** `V4_OPENCODE_DISPATCH` → STOP `OPENCODE_NOT_INSTALLED`
**Starting HEAD / expected origin/main:** `dddb327cad2c9f09cbe8149392ead29a17708d72`
**Status:** **PASS** — `DISPATCH_READY` boundary implemented; no generation
**Install package:** `opencode-ai@latest` (npm global)

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main | PASS |
| CURRENT_FRONTIER blocker cleared | PASS |
| D-0025 CLOSED · gate CLOSED · WF61 inactive | PASS |
| npm available | PASS |

---

## Canonical install + CLI verify

| Field | Value |
|---|---|
| install command | `npm install -g opencode-ai@latest` |
| `opencode_available` | **true** |
| `opencode_version` | **1.18.25** |
| executable class | npm global shim (`opencode.cmd`) |
| `opencode run --help` | **present** |
| `opencode_dispatch_interface_resolved` | **true** |

Noninteractive dispatch syntax (from installed `--help`):

```text
opencode run --dir <repository> -m qwen_local/<llama_cpp_model_id> --format json --auto <message>
```

No `opencode run <prompt>` executed. No provider authentication.

---

## Deliverables

| Artifact | Path |
|---|---|
| Dispatch contract | `docs/contracts/opencode-execution-dispatch-v1.md` |
| Dispatch schema | `docs/contracts/opencode-execution-dispatch-v1.schema.json` |
| OpenCode probe | `tools/probe-opencode-local-v1.mjs` |
| Dispatch tool | `tools/dispatch-opencode-execution-v1.mjs` |
| Tests | `tests/opencode-execution-dispatch/run.mjs` |

## RESOURCE_STATUS overlay

Extended `tools/collect-qwen-local-resource-status-v1.mjs` to compose OpenCode `local_probe` overlay when CLI resolves. Committed `configs/resources/status.fail-closed.json` **unchanged**.

OpenCode READY entry: `available=true` · `cost_mode=free` · `source=local_probe` · fresh `updated_at`.

---

## Route acceptance

Only `ROUTED` + `implementer=opencode` + `model=qwen_local` → may reach `DISPATCH_READY`. All other routes fail closed (`ROUTE_NOT_OPENCODE_QWEN_LOCAL`).

Execution packet validated via existing `validate-execution-packet-v1` — **unchanged**.

Qwen binding: logical `qwen_local` · profile **`fast_8k`** · DFlash2 required · `127.0.0.1:8080` OpenAI-compatible endpoint in provider overlay (no API key).

---

## Tests

| Suite | Result |
|---|---|
| `tests/opencode-execution-dispatch/run.mjs` (A–J) | **ALL_PASS** |
| `tests/execution-router/run.mjs` | **PASS** |
| `tests/qwen-local-session-manager/run.mjs` | **PASS** |
| `tests/qwen-local-resource-status-overlay/run.mjs` | **14/14 PASS** |

`execution_performed=false` enforced in all paths.

---

## Counters

| Counter | Value |
|---|---|
| generation_calls | **0** |
| provider_calls | **0** |
| litellm_calls | **0** |
| glm_calls | **0** |
| codex_calls | **0** |
| qwen_generation_calls | **0** |
| execution_performed | **false** |
| n8n_mutations | **0** |
| workflow_mutations | **0** |
| d0025_mutations | **0** |
| secret_exposure | **false** |

---

## Bugbot

Initial review flagged overlay test assumption for probed OpenCode — **fixed** (`othersRemainFailClosed` excludes intentional `opencode` probe). **PASS_NO_FINDINGS** after fix.

---

## Persisted fields

```yaml
result_cursor: PASS_OPENCODE_DISPATCH_READY
opencode_install_package: opencode-ai
opencode_available: true
opencode_version: 1.18.25
opencode_dispatch_interface_resolved: true
resource_status_opencode_overlay: true
qwen_session_manager_reused: true
qwen_profile: fast_8k
dflash_required: true
dispatch_contract_path: docs/contracts/opencode-execution-dispatch-v1.md
dispatch_tool_path: tools/dispatch-opencode-execution-v1.mjs
dispatch_test_path: tests/opencode-execution-dispatch/run.mjs
tests_result: ALL_PASS
bugbot_review: PASS_NO_FINDINGS
NEXT: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF
```

---

## Output line

`PASS — V4 OPENCODE DISPATCH READY / OPENCODE_INSTALLED=TRUE / EXECUTION_PERFORMED=FALSE / QWEN_GENERATION_CALLS=0`
