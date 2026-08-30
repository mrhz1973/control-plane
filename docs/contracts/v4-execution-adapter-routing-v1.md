# v4-execution-adapter-routing-v1

Downstream execution-adapter routing bridge. Maps an **already-selected**
route (from the unchanged EXECUTION_ROUTER `evaluate-execution-route.mjs`)
to the appropriate execution adapter. This layer never selects
implementer/model and never reinterprets or weakens authorization.

```text
execution_route_result + execution_packet + optional runtime_authorization
  |
  v
v4-execution-adapter-router-v1
  |-- opencode+qwen_local  -> dispatch gate (DISPATCH_READY required)
  |                           -> tools/opencode-execution-adapter-v1.mjs
  |-- every other route     -> ADAPTER_NOT_REGISTERED (no fallback, no execution)
  '-- NO_ROUTE / not ROUTED -> ROUTE_NOT_ROUTED (no adapter invocation)
```

## Registry

Validated registry boundary: `tools/v4-execution-adapter-registry-v1.mjs`
(see `docs/contracts/v4-execution-adapter-registry-v1.md`). Exact `route_id`
lookup only. No aliases, wildcards, fallbacks, or catch-all adapters.
Invalid injected registry => terminal `ADAPTER_REGISTRY_INVALID` with
`execution_performed=false` and zero adapter invocations.

Default registered route remains exactly:

```text
opencode+qwen_local  (adapter_id=opencode-execution-adapter-v1,
                      implementer=opencode, model=qwen_local,
                      dispatch_required=true)
```

A future executor registers additively through the registry boundary
**without modifying EXECUTION_ROUTER**. Grok Bot is not registered here;
RESOURCE_REGISTRY still lists it as `routing_arbiter` only.

## Dispatch gate (opencode+qwen_local only)

Delegation requires a valid prebuilt OpenCode dispatch result with:

- `classification === "DISPATCH_READY"`
- `dispatch_ready === true`
- `execution_performed === false`

Otherwise: terminal `DISPATCH_NOT_READY`, no adapter invocation.

## Fail-closed defaults

- Route result alone never authorizes execution.
- Unsupported adapter is never permission to fall back. No fallback layer.
- Authorization validation stays solely in the execution adapter
  (`opencode-execution-adapter-v1.mjs`); this bridge only passes it through.
- Default CLI invocation performs zero live execution.

## Result

`v4-execution-adapter-routing-result-v1` — see schema. Structural fields
only; the delegated adapter result is propagated structurally inside
`adapter_result`. No prompt/body/model-output persistence.
