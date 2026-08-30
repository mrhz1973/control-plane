# v4-execution-adapter-registry-v1

Validated execution-adapter registry boundary. Owns **registration identity
and exact route_id lookup only**. Does not select implementer/model
(EXECUTION_ROUTER owns that), does not authorize, and does not execute.

```text
register / validate / snapshot
        |
        v
exact route_id lookup  ->  adapter entry { route_id, adapter_id,
                                           implementer, model,
                                           dispatch_required, run }
```

## Entry identity

Each registration requires:

| Field | Rule |
|---|---|
| `route_id` | non-empty exact identifier; no wildcards / catch-all |
| `adapter_id` | non-empty |
| `implementer` | non-empty |
| `model` | non-empty |
| `route_id` | must equal `` `${implementer}+${model}` `` |
| `dispatch_required` | boolean |
| `run` | function (runtime only; never serialized) |

Fail-closed: duplicate `route_id`, ambiguous duplicate `adapter_id`,
wildcard routes, aliases, fallbacks, and catch-all entries are rejected.

## Default

Exactly one route is registered by default:

```text
route_id            = opencode+qwen_local
adapter_id          = opencode-execution-adapter-v1
implementer         = opencode
model               = qwen_local
dispatch_required   = true
```

No other executor (including Grok Bot) is registered here.
`configs/resources/registry.json` is unchanged; `grok_bot` remains
`roles: [routing_arbiter]`.

## Snapshot

`registrySnapshot` emits serializable metadata only (`schema_version`,
entries without `run`). The runtime `run` function must never appear in
snapshots or persisted evidence.

## Tool

`tools/v4-execution-adapter-registry-v1.mjs`
