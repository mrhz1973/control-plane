# V4 — Execution adapter registry boundary (offline)

**Block:** `V4_EXECUTION_ADAPTER_REGISTRY_BOUNDARY` · **Date:** 2026-08-30 · **Result:** PASS

## Summary

Hardened the execution-adapter registry into an explicit validated boundary
so future adapters can register additively without modifying
EXECUTION_ROUTER. No new executor (including Grok Bot) was registered.
Fully offline; zero live execution.

## Boundary

```text
validateAdapterRegistration(entry)
createExecutionAdapterRegistry(entries)
registerExecutionAdapter(registry, entry)
validateExecutionAdapterRegistry(registry)
registrySnapshot(registry)   // metadata only — never serializes run
createDefaultExecutionAdapterRegistry()
```

Lookup remains deterministic by exact `route_id` (`.get(route_id)`).
No aliases, wildcards, fallbacks, or catch-all adapters.

## Default registration (unchanged identity)

```text
route_id          = opencode+qwen_local
adapter_id        = opencode-execution-adapter-v1
implementer       = opencode
model             = qwen_local
dispatch_required = true
```

## Fail-closed

- Invalid entry / duplicate route_id / ambiguous duplicate adapter_id /
  wildcard routes / implementer+model mismatch / missing run /
  non-boolean `dispatch_required` => rejected.
- Invalid injected registry at the routing bridge =>
  `ADAPTER_REGISTRY_INVALID`, `execution_performed=false`, zero adapter runs.
- Unsupported valid routes remain `ADAPTER_NOT_REGISTERED` (no fallback).

## Preserved

- `tools/evaluate-execution-route.mjs` — unchanged
- `tools/opencode-execution-adapter-v1.mjs` — unchanged
- `tools/dispatch-opencode-execution-v1.mjs` — unchanged
- `configs/resources/registry.json` — unchanged
- `grok_bot.roles = [routing_arbiter]` — unchanged

## Proofs (each run exactly once)

- `tests/v4-execution-adapter-registry/run.mjs` — **19/19 PASS**
- `tests/v4-execution-adapter-router/run.mjs` — 15/15 PASS
- `tests/execution-router/run.mjs` — 12/12 PASS
- `tests/opencode-execution-dispatch/run.mjs` — ALL_PASS (13 suites)
- `tests/opencode-execution-adapter/run.mjs` — 23/23 PASS

## Pass counters

```yaml
qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
n8n_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false
```

## NEXT

`V4_N8N_EXECUTION_ROUTING_BRIDGE_INTEGRATION_OFFLINE` — wire the completed
V4 route → adapter boundary into the existing n8n control-plane path,
offline first, without live executor calls. Do not mutate n8n/workflows
in the registry block (already satisfied).
