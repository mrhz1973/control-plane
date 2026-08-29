# V4 — RESOURCE_STATUS contract

**Block ID:** `V4_RESOURCE_STATUS_CONTRACT`  
**Starting HEAD:** `5a38939d4908de54c9b7f846ffcf87b43111cea9`  
**Final HEAD (contract commit):** `0dec10fae66014a261c5388db08831859f4a14ef`  
**Category:** FOUNDATION / ADDITIVE / OFFLINE  
**Provider calls:** 0  
**LiteLLM calls:** 0  
**n8n mutations:** 0  
**workflow mutations:** 0  
**execution-packet mutations:** 0  
**planner-selection mutations:** 0  
**D-0025-W mutations:** 0  
**secret exposure:** false

## Files created

| Path | Role |
|---|---|
| `docs/contracts/resource-status-v1.schema.json` | Canonical JSON Schema (draft 2020-12) |
| `configs/resources/status.fail-closed.json` | Committed fail-closed baseline snapshot |
| `tools/validate-resource-status-v1.mjs` | Offline validator (reuses ajv resolution from execution-packet validator) |
| `tests/resource-status-validator/run.mjs` | Targeted fixture runner (6 cases) |
| `tests/resource-status-validator/fixtures/*` | PASS/FAIL fixtures |

## Schema structure

Top-level required:

- `schema_version` = `"resource-status-v1"`
- `generated_at` (ISO-8601 date-time)
- `resources` (map of `resource_id` → status object)

Each resource object has **exactly these 8 semantic fields** (`additionalProperties: false`):

| # | Field | Type / constraint |
|---|---|---|
| 1 | `available` | boolean — operational selectability |
| 2 | `quota_remaining` | `{ value: number\|null, unit: percent\|calls\|tokens\|credits\|unlimited\|unknown }`; `unlimited` ⇒ `value` MUST be `null` |
| 3 | `reserve_floor` | `{ value: number\|null, unit: percent\|calls\|tokens\|credits\|none\|unknown }`; `none` ⇒ `value` MUST be `0` or `null` |
| 4 | `reset_at` | ISO-8601 date-time or `null` (no invented reset) |
| 5 | `cost_mode` | `free` \| `included` \| `metered` \| `on_demand` \| `unknown` |
| 6 | `location` | `local` \| `cloud` \| `remote` \| `hybrid` \| `unknown` |
| 7 | `source` | `provider_api` \| `internal_ledger` \| `dashboard_snapshot` \| `local_probe` \| `manual` \| `unknown` |
| 8 | `updated_at` | required ISO-8601 date-time |

## Fail-closed behavior

`configs/resources/status.fail-closed.json` is a **committed baseline**, not live status.

Resource IDs included: `cursor`, `grok_bot`, `opencode`, `qwen_local`, `glm`, `codex`.

All entries:

- `available: false`
- unknown quotas (`unit: unknown`, `value: null`)
- `reset_at: null`
- no dashboard percentages, GLM budgets, tokens, API keys, or guessed resets

## Committed vs live

| Layer | Path / nature | Committed? |
|---|---|---|
| Fail-closed baseline | `configs/resources/status.fail-closed.json` | **yes** |
| Live RESOURCE_STATUS | runtime overlay generated later | **no** (future) |

Live overlay (not implemented in this pass) MUST identify `source` and `updated_at` and MUST NOT fake realtime freshness.

Source semantics (documented only):

- `provider_api` — provider/API state
- `internal_ledger` — control-plane reconstructed consumption
- `dashboard_snapshot` — web/dashboard snapshot
- `local_probe` — local resource probe

No live collector in this pass.

## V4 decisions recorded

| Concept | Meaning |
|---|---|
| **RESOURCE_STATUS** | Dynamic operational availability / quota / cost / reset / freshness state |
| **RESOURCE_REGISTRY** | Future static capability registry |

They **MUST remain separate**. This pass does not create RESOURCE_REGISTRY.

n8n remains the future CONTROL PLANE.  
Telegram remains the future OPERATOR INTERFACE.  
This pass does not implement their integration.

## Validation results

Targeted offline suite: `node tests/resource-status-validator/run.mjs`

| Case | Expected | Result |
|---|---|---|
| `status.fail-closed.json` validates | PASS | PASS |
| resource missing required field | FAIL `MISSING_REQUIRED_FIELD` | PASS |
| invalid `quota_remaining.unit` | FAIL `INVALID_ENUM` | PASS |
| invalid `reset_at` date-time | FAIL `INVALID_FORMAT` | PASS |
| unlimited quota with `value=null` | PASS | PASS |
| unknown quota/reset representable | PASS | PASS |

Summary: **6/6 PASS**  
JSON syntax checks: OK  
`git diff --check`: clean  

Schema engine: existing local/VPS ajv resolution via `CONTROL_PLANE_AJV_NODE_MODULES` / `resolveAjvModules` — no new repository dependency.

## Preserve (unchanged)

- V3.2 live path / D-0025-W frontier state
- execution-packet contracts and validators
- planner-selection evaluator / planner-routing-input
- WF40 / WF61 / workflows / n8n / LiteLLM / OpenClaw
- D-0025 backlog YAML / runtime GLM gate
- Qwen remains disabled

Not created (later blocks): PLANNER_ROUTER, PLANNER_DISPATCH service, IMPLEMENTER_ROUTER, IMPLEMENTATION_MODEL_ROUTER, EXECUTION_ROUTER, REVIEW_ROUTER, RESOURCE_REGISTRY.
