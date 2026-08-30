# V4 — OpenCode execution dispatch

**Block ID:** `V4_OPENCODE_DISPATCH`  
**Starting HEAD / expected origin/main:** `b23e72bbc87f335752d92ed703400d66ede52fa9`  
**Status:** **STOP** — `OPENCODE_NOT_INSTALLED`  
**Generation calls:** **0** · provider calls **0**

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER NEXT = `V4_OPENCODE_DISPATCH` | PASS |
| D-0025 issue #31 CLOSED / COMPLETE | PASS (`reports/architecture/d0025_issue31_closure.md`) |
| D-0025 runtime gate CLOSED · WF61 inactive | PASS (frontier) |

---

## OpenCode read-only preflight (Cursor execution environment)

Platform: Windows (PowerShell). Read-only discovery only; no install/upgrade.

| Probe | Result |
|---|---|
| `Get-Command opencode` | **not found** |
| `where.exe opencode` | **not found** |
| `Get-Command opencode-go` | **not found** |
| Global npm binary `opencode*` under `%APPDATA%\npm` | **none** (only OpenClaw extension paths under `openclaw` package) |
| `npm search opencode` / `npx opencode` | package **not in npm registry** |

### Persisted preflight fields

| Field | Value |
|---|---|
| `opencode_available` | **false** |
| `opencode_version` | **null** (CLI absent) |
| executable class | **not on PATH**; no standalone `opencode` or `opencode-go` shim discovered |
| `--help` / dispatch syntax | **not obtainable** — CLI absent |

OpenClaw-related paths under `%APPDATA%\npm\node_modules\openclaw\dist\extensions\opencode*` are **plugin documentation/extensions**, not an invocable OpenCode dispatch CLI in PATH.

---

## Stop decision

Per block specification: when OpenCode is absent, stop with **`OPENCODE_NOT_INSTALLED`**, zero model/provider calls, and **no implementation mutation**.

Therefore **not performed** in this pass:

- dispatch contract / schema
- `tools/dispatch-opencode-execution-v1.mjs`
- OpenCode RESOURCE_STATUS local probe overlay
- deterministic dispatch test suite
- Bugbot review (no implementation delta)

---

## Unblocked next step (operator/environment)

Install or expose a canonical OpenCode CLI on the execution host PATH, then re-run `V4_OPENCODE_DISPATCH` so read-only preflight can capture `--version` / `--help` and establish deterministic noninteractive dispatch syntax before implementation.

Do **not** install OpenCode in this stopped pass.

---

## Persisted fields

```yaml
result_cursor: STOP_OPENCODE_NOT_INSTALLED
starting_head: b23e72bbc87f335752d92ed703400d66ede52fa9
final_head: PENDING_COMMIT

opencode_available: false
opencode_version: null
opencode_dispatch_interface_resolved: false

resource_status_opencode_overlay: not_implemented
qwen_session_manager_reused: not_applicable
qwen_profile: fast_8k
dflash_required: true

dispatch_contract_path: null
dispatch_tool_path: null
dispatch_test_path: null

tests_result: not_run
execution_router_tests: not_run
qwen_session_tests: not_run
qwen_status_overlay_tests: not_run

generation_calls: 0
provider_calls: 0
litellm_calls: 0
glm_calls: 0
codex_calls: 0
qwen_generation_calls: 0

execution_performed: false
n8n_mutations: 0
workflow_mutations: 0
d0025_mutations: 0
secret_exposure: false

bugbot_review: not_applicable
architecture_report: reports/architecture/v4_opencode_dispatch.md
NEXT: V4_OPENCODE_DISPATCH
```

---

## Output line

`STOP — OPENCODE_NOT_INSTALLED / GENERATION_CALLS=0`
