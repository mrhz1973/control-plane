# V4 — execution route sidecar source contract

**Block ID:** `V4_EXECUTION_ROUTE_SIDECAR_SOURCE_CONTRACT`  
**Authority:** GPT Web  
**Status:** **PASS — CONTRACT AUTHORED**  
**Runtime authorized:** NO

## Decision

The installed WF40 V4 routing lane must receive its two sidecars from explicit, separate authorities:

1. **Execution route request source** — persistent GPT-Web-authored sibling artifact:
   `docs/runtime/EXECUTION_ROUTE_<TASK_ID>.json`
2. **RESOURCE_STATUS source** — transient `resource-status-v1` runtime snapshot; if unavailable/unacceptable, use committed `configs/resources/status.fail-closed.json`.

No route semantics are inferred from planner/output/chat.

## Route-source invariants

- same Git commit as canonical backlog;
- task_id equals backlog id;
- source_backlog_path exact match;
- created_by=`gpt-web`;
- technical_requirements explicit from canonical capability vocabulary;
- risk_level explicit and equal to backlog risk_hint;
- deterministic mapping to `execution-route-request-v1` with `request_id = task_id`.

## RESOURCE_STATUS invariants

- status remains separate from persistent route source;
- explicit transient snapshot must validate against `resource-status-v1` and be <=300 seconds old;
- no guessed availability;
- absent/malformed/stale/future/secret-like snapshot degrades to committed fail-closed baseline;
- source adapter performs no provider/dashboard/Qwen/OpenCode/session/network collection itself.

## Shared-runtime rule

This contract does not authorize Qwen start/restart/probe. The existing Qwen overlay collector is not automatically invoked by the source adapter. Any later live status collector remains bound to the canonical Qwen occupancy gate.

## Integration seam

```text
backlog + same-commit EXECUTION_ROUTE_<task_id>.json
+ explicit/fail-closed RESOURCE_STATUS
  -> deterministic sidecar-source adapter
  -> existing WF40 sidecar capture
  -> WF61
  -> existing V4 routing bridge
```

No separate n8n V4 workflow. No executor dispatch is authorized by this contract.

## Files

- `docs/contracts/v4-execution-route-sidecar-source-v1.md`
- `docs/contracts/v4-execution-route-sidecar-source-v1.schema.json`
- `reports/architecture/v4_execution_route_sidecar_source_contract.md`

## Counters

```yaml
workflow_execution_calls: 0
provider_calls: 0
qwen_generation_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
workflow_mutations: 0
network_mutations: 0
secret_exposure: false
```

## NEXT

`V4_EXECUTION_ROUTE_SIDECAR_SOURCE_ADAPTER_OFFLINE`

Implement the deterministic source adapter and offline tests. Workflow wiring remains a later GPT-Web-authored delta.
