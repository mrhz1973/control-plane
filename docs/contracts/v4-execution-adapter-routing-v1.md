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

Extensible adapter registry keyed by `route_id`. Only
`opencode+qwen_local` is registered in this pass. A future executor
(e.g. Grok Bot) registers additively **without modifying EXECUTION_ROUTER**.

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
