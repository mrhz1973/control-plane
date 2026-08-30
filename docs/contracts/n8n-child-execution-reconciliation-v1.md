# n8n child execution reconciliation v1

**Schema:** `n8n-child-execution-reconciliation-v1`  
**Status:** CANONICAL · additive overlay only  
**Date:** 2026-08-30  
**Mutates n8n DB:** **NEVER** (v1)

---

## Purpose

Integrated n8n child workflows (e.g. WF61 invoked by WF40 Execute Workflow) maintain two distinct views:

| View | Source | Role |
|---|---|---|
| **Logical execution state** | Parent sub-workflow result + child engine terminal evidence + runtime leak checks | Authoritative for control-plane forward progress |
| **n8n accounting state** | `execution_entity` / `execution_data` | Useful historical evidence; **not authoritative** when contradicted by stronger terminal evidence |

Diagnosed case **287888** (`EXECUTION_ENGINE_CHILD_FINALIZATION_BUG`): child logged `n8n.workflow.success`, parent received canonical cycle result, yet `execution_entity` remained `running` before later purge.

This contract defines a deterministic reconciliation overlay that **never** mutates historical n8n rows.

---

## Input (sanitized evidence object)

Required top-level fields:

| Field | Type | Notes |
|---|---|---|
| `parent_execution_id` | string | Parent workflow execution id |
| `child_execution_id` | string | Child (sub-workflow) execution id |
| `child_workflow_id` | string | Child workflow id |
| `parent` | object | See below |
| `child_accounting` | object | See below |
| `child_engine_evidence` | object | See below |
| `runtime` | object | See below |

### `parent`

| Field | Type |
|---|---|
| `status` | string (`success`, `error`, `running`, …) |
| `subexecution_id` | string \| null |
| `returned_result_seen` | boolean |

### `child_accounting`

| Field | Type |
|---|---|
| `row_exists` | boolean |
| `status` | string \| null |
| `stopped_at` | string \| null |
| `finished` | boolean \| number \| null |

### `child_engine_evidence`

| Field | Type |
|---|---|
| `workflow_success_seen` | boolean |
| `terminal_return_seen` | boolean |

### `runtime`

| Field | Type |
|---|---|
| `live_process_seen` | boolean |
| `task_runner_leak_seen` | boolean |
| `helper_process_leak_seen` | boolean |

**Forbidden in input:** credentials, response bodies, model prose, secrets.

---

## Output

Schema identifier: **`n8n-child-execution-reconciliation-v1`**

| Field | Values / type |
|---|---|
| `schema` | `n8n-child-execution-reconciliation-v1` |
| `parent_execution_id` | echoed |
| `child_execution_id` | echoed |
| `logical_state` | `TERMINAL_SUCCESS` \| `TERMINAL_FAILURE` \| `RUNNING_OR_UNKNOWN` |
| `accounting_state` | `CONSISTENT_TERMINAL` \| `STALE_RUNNING` \| `PURGED` \| `UNKNOWN` |
| `reconciliation_classification` | see below |
| `operational_block` | boolean |
| `historical_row_mutation_allowed` | boolean — **always `false` in v1** |
| `reason_codes` | string[] |

### `logical_state`

**`TERMINAL_SUCCESS`** requires **ALL**:

- `parent.status === "success"`
- `parent.subexecution_id === child_execution_id` (string-normalized)
- `parent.returned_result_seen === true`
- `child_engine_evidence.workflow_success_seen === true`
- `child_engine_evidence.terminal_return_seen === true`
- `runtime.live_process_seen === false`
- `runtime.task_runner_leak_seen === false`
- `runtime.helper_process_leak_seen === false`

Do **not** infer terminal success from parent success alone.

**`TERMINAL_FAILURE`**: reserved for v1 extensions when explicit terminal failure evidence is supplied (not inferred in v1 unless explicitly added later).

**`RUNNING_OR_UNKNOWN`**: default when terminal success conditions are not met or live-leak fail-closed applies.

### `accounting_state`

| Value | Condition |
|---|---|
| `CONSISTENT_TERMINAL` | `row_exists` and terminal status (`success`/`error`/`crashed`/`canceled`) or `finished` truthy |
| `STALE_RUNNING` | `row_exists` and `status === "running"` |
| `PURGED` | `row_exists === false` |
| `UNKNOWN` | otherwise |

### `reconciliation_classification`

| Value | Meaning |
|---|---|
| `CONSISTENT` | Logical terminal success + accounting consistent terminal |
| `LOGICALLY_TERMINAL_ACCOUNTING_STALE` | Logical terminal success + accounting stale `running` |
| `LOGICALLY_TERMINAL_ACCOUNTING_PURGED` | Logical terminal success + accounting row purged |
| `POSSIBLE_LIVE_EXECUTION` | Any runtime leak flag true — fail-closed |
| `INSUFFICIENT_EVIDENCE` | Terminal evidence incomplete or subexecution mismatch |

### Fail-closed

If **any** of `live_process_seen`, `task_runner_leak_seen`, `helper_process_leak_seen` is true:

- Do **not** infer logical terminal from stale accounting alone.
- Return `POSSIBLE_LIVE_EXECUTION`, `operational_block=true`.

---

## Policy effect (v1)

1. n8n `execution_entity` remains useful accounting evidence.
2. It is **not authoritative** over stronger engine + parent terminal evidence.
3. Reconciled stale/purged children **do not block** future control-plane work when `operational_block=false`.
4. Reconciliation is overlay/reporting only.
5. v1 **NEVER** mutates historical n8n DB rows.
6. DB repair/cleanup requires a **separate explicit gate**.
7. Runtime process/task/helper leak **always overrides** accounting reconciliation.

---

## Tooling

Implementation: `tools/reconcile-n8n-child-execution-v1.mjs`

Usage:

```bash
node tools/reconcile-n8n-child-execution-v1.mjs --input-file evidence.json
# or stdin JSON
cat evidence.json | node tools/reconcile-n8n-child-execution-v1.mjs
```

Zero provider calls. Zero DB access in v1.
