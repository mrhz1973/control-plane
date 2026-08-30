# V4 — RESOURCE_STATUS control-plane composer (offline)

**Block ID:** `V4_RESOURCE_STATUS_CONTROL_PLANE_COMPOSER_OFFLINE`  
**Starting HEAD:** `57a1aa45afb8558ea6b72a3d0e0a65c3fd1a7508`  
**Final HEAD:** `PENDING_COMMIT`  
**Category:** IMPLEMENTAZIONE OFFLINE  
**Runtime authorized:** NO

## Decision

Pure offline deterministic composer builds `resource-status-v1` from:

1. canonical `RESOURCE_REGISTRY`
2. committed fail-closed baseline
3. zero or more explicit `v4-resource-status-contribution-v1` observations
4. injectable evaluation clock

The composer **validates and merges**. It does **not** collect.

## Files

| Path | Role |
|---|---|
| `docs/contracts/v4-resource-status-control-plane-source-result-v1.schema.json` | Result wrapper schema |
| `tools/compose-v4-resource-status-control-plane-v1.mjs` | Composer library + CLI |
| `tests/v4-resource-status-control-plane-source/run.mjs` | Target suite |
| `tests/v4-resource-status-control-plane-source/fixtures/**` | Fixtures |
| `reports/architecture/v4_resource_status_control_plane_composer_offline.md` | This report |

## Behavior locked

- Registry closure: every registry resource present in output (`composer` synthetic shell when absent from baseline)
- `reserve_floor` from baseline / `{value:0,unit:none}` only — never from contributions
- Freshness ≤300s (exactly 300s accepted); future/stale ignored
- Precedence: `local_probe > provider_api > dashboard_snapshot > internal_ledger > manual`
- Same-rank/same-time conflict → fail-closed
- Qwen `available=true` only for `local_probe` + `QWEN_READY_IDLE` + `launch_performed=false` + `generation_calls=0`
- Zero collectors / session manager / network / subprocess

## Tests (once each)

| Suite | Result |
|---|---|
| `node tests/v4-resource-status-control-plane-source/run.mjs` | **PASS 34/34** |
| `node tests/resource-registry-validator/run.mjs` | **PASS 7/7** |
| `node tests/resource-status-validator/run.mjs` | **PASS 6/6** |
| `node tests/execution-router/run.mjs` | **PASS 12/12** |
| `node tests/v4-execution-route-sidecar-source/run.mjs` | **PASS 24/24** |
| `node tests/n8n-v4-execution-routing-bridge/run.mjs` | **PASS 23/23** |

## Counters

```yaml
workflow_execution_calls: 0
workflow_mutations: 0
provider_calls: 0
dashboard_calls: 0
qwen_generation_calls: 0
qwen_session_manager_calls: 0
qwen_probe_calls: 0
qwen_runtime_mutations: 0
opencode_execution_count: 0
opencode_probe_calls: 0
network_calls: 0
network_mutations: 0
collector_calls: 0
secret_exposure: false
```

## Unchanged (required)

- source contract / contribution schema
- `configs/resources/registry.json`
- `configs/resources/status.fail-closed.json`
- collectors / session manager / evaluate-execution-route / sidecar builder
- `workflows/**`

## NEXT

`V4_RESOURCE_STATUS_LOCAL_RUNTIME_READONLY_CONTRIBUTION_ADAPTER`
