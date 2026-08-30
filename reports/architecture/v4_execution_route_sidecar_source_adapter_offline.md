# V4 — execution route sidecar source adapter (offline)

**Block ID:** `V4_EXECUTION_ROUTE_SIDECAR_SOURCE_ADAPTER_OFFLINE`  
**Starting HEAD:** `b296547f56cbc3afcd35fc56eef0325142b1d1ee`  
**Final HEAD:** `PENDING_COMMIT`  
**Category:** IMPLEMENTAZIONE OFFLINE  
**Runtime authorized:** NO

## Decision

Deterministic offline adapter builds the exact sidecars required by the installed WF40 V4 routing lane from:

1. GPT-Web-authored same-commit route source (`v4-execution-route-source-v1`)
2. Optional explicit fresh `resource-status-v1`, else committed fail-closed baseline

The adapter **consumes** status. It does **not** collect status.

## Files

| Path | Role |
|---|---|
| `docs/contracts/v4-execution-routing-sidecar-bundle-v1.schema.json` | Bundle output schema |
| `tools/build-v4-execution-routing-sidecars-v1.mjs` | Offline adapter + n8n-compatible CLI |
| `tests/v4-execution-route-sidecar-source/run.mjs` | Target suite (24 checks) |
| `tests/v4-execution-route-sidecar-source/fixtures/**` | Synthetic fixtures |
| `reports/architecture/v4_execution_route_sidecar_source_adapter_offline.md` | This report |

## Bindings enforced

- `schema_version` exact `v4-execution-route-source-v1`
- `created_by` exact `gpt-web`
- `task_id` == input task_id
- `source_backlog_path` == input backlog_path
- `route_source_commit` == `backlog_commit` (same-commit)
- `risk_level` == input backlog risk_hint
- `technical_requirements` non-empty, unique, canonical vocabulary only — never synthesized
- Mapping: `request_id = task_id`; requirements/risk copied verbatim into `execution-route-request-v1`

## RESOURCE_STATUS

- Explicit transient: validate schema, no secret-like material, `generated_at <= clock`, age `<= 300s` (exactly 300s accepted)
- Absent / malformed / stale / future / secret-like → `configs/resources/status.fail-closed.json` verbatim (no restamp)
- Never invokes collectors, Qwen, session manager, providers, network, n8n

## Tests (once each)

| Suite | Result |
|---|---|
| `node tests/v4-execution-route-sidecar-source/run.mjs` | **PASS 24/24** |
| `node tests/resource-status-validator/run.mjs` | **PASS 6/6** |
| `node tests/execution-router/run.mjs` | **PASS 12/12** |
| `node tests/n8n-v4-execution-routing-bridge/run.mjs` | **PASS 23/23** |

## Counters

```yaml
workflow_execution_calls: 0
workflow_mutations: 0
provider_calls: 0
qwen_generation_calls: 0
qwen_session_manager_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
network_calls: 0
network_mutations: 0
secret_exposure: false
status_collector_invoked: false
technical_requirements_synthesized: false
```

## Unchanged (required)

- `workflows/**`
- `tools/n8n-v4-execution-routing-bridge-v1.mjs`
- `tools/evaluate-execution-route.mjs`
- `tools/collect-qwen-local-resource-status-v1.mjs`
- `tools/qwen-local-session-manager-v1.mjs`
- `configs/resources/status.fail-closed.json`
- `configs/resources/registry.json`

## NEXT

`V4_WF40_SIDECAR_SOURCE_PATCH_AUTHORING` (GPT-Web-owned) — additive WF40 delta to fetch same-commit `EXECUTION_ROUTE_<task_id>.json`, invoke this adapter, place sidecars before the installed V4 capture node. No WF40 mutation in this Cursor pass.
