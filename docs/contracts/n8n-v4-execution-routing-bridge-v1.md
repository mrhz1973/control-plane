# n8n-v4-execution-routing-bridge-v1

Canonical OFFLINE n8n-facing bridge between the existing WF61 planner-cycle
output and the completed V4 EXECUTION_ROUTER + execution-adapter registry.

```text
WF61 cycle result
+ explicit execution-route-request-v1 sidecar
+ explicit RESOURCE_STATUS snapshot
        |
        v
n8n-v4-execution-routing-bridge-v1
  +-> validate planner-cycle result (n8n-litellm-primary-cycle-result-v1)
  +-> enforce packet policy boundary (PROCEED/GATE/BLOCKED)
  +-> evaluate existing EXECUTION_ROUTER (evaluate-execution-route.mjs)
  +-> validate existing adapter registry
  +-> resolve exact registered adapter metadata
        |
        v
ROUTING_READY_FOR_DISPATCH   |   deterministic fail-closed result
```

**This bridge STOPS before dispatch or execution.** `dispatch_prepared` and
`execution_performed` are always `false`.

## Inputs

| Input | Rule |
|---|---|
| cycle result | `schema == n8n-litellm-primary-cycle-result-v1`, `ok == true`, `classification == PASS`, `packet` object, `policy` object |
| route request | **explicit** `execution-route-request-v1` sidecar — required; `technical_requirements` are NEVER synthesized from goal/paths/planner prose/commit/risk/classifier/chat |
| RESOURCE_STATUS | explicit snapshot object (never collected live) |
| RESOURCE_REGISTRY | defaults to canonical static `configs/resources/registry.json` |

## Policy semantics

- `PROCEED` → routing may continue
- `GATE` → `POLICY_GATE_REQUIRED`, no routing
- `BLOCKED` → `POLICY_BLOCKED`, no routing
- malformed/contradictory → `POLICY_INVALID`

Planner prose is never reinterpreted; GATE never becomes PROCEED.
`cursor_dispatch_allowed` (historical v3.2 policy output) never selects a
V4 executor.

## Routing + adapter resolution

Reuses `evaluateExecutionRoute` (options.registry/status objects, injectable
offline semanticArbiter; absent arbiter preserves ARBITER_UNAVAILABLE).
After ROUTED: validates the adapter registry, resolves the exact
`route_id`. Missing adapter → `ADAPTER_NOT_REGISTERED` (no fallback);
invalid registry → `ADAPTER_REGISTRY_INVALID`. **`adapter.run()` is never
called** — metadata resolution only.

## Result

`n8n-v4-execution-routing-bridge-result-v1` — see schema. Invariants:
`dispatch_prepared=false`, `execution_performed=false` always. No
prompts/model output persisted.

## CLI

```bash
node tools/n8n-v4-execution-routing-bridge-v1.mjs \
  --cycle-result-b64 '<base64-json>' \
  --route-request-b64 '<base64-json>' \
  --status-b64 '<base64-json>'
```

Base64 is transport encoding only. CLI: no network, no subprocess, no
model/provider call, exactly one final JSON result record, fail-closed on
malformed input, never reads secrets, never mutates repo/state.
