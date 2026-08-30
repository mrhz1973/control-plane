# V4 — OpenCode control-plane routing integration (offline)

**Block:** `V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_OFFLINE` (+ test-harness correction pass and minimal `execution_performed` propagation fix) · **Date:** 2026-08-30 · **Result:** PASS

## Summary

Additive execution-adapter routing bridge wiring the completed OpenCode
execution adapter into the V4 control-plane path, fully offline. The bridge
maps an **already-selected** route (EXECUTION_ROUTER unchanged and still the
sole owner of implementer+model selection) to a registered execution adapter.

```text
execution_route_result + execution_packet + optional runtime_authorization
  -> v4-execution-adapter-router-v1
       |-- opencode+qwen_local -> dispatch gate (DISPATCH_READY required)
       |                          -> tools/opencode-execution-adapter-v1.mjs
       |-- other routes         -> ADAPTER_NOT_REGISTERED (no fallback)
       '-- not ROUTED           -> ROUTE_NOT_ROUTED (no adapter invocation)
```

## Registry (extensible)

`defaultAdapterRegistry()` registers only `opencode+qwen_local` this pass.
A future executor (e.g. Grok Bot) can be registered additively without
touching EXECUTION_ROUTER. No fallback exists in this layer by design.

## Fail-closed guarantees

- Route result alone never authorizes execution; authorization validation
  stays solely inside the execution adapter (validator not duplicated).
- `opencode+qwen_local` delegation requires a prebuilt dispatch result with
  `classification=DISPATCH_READY`, `dispatch_ready=true`,
  `execution_performed=false`; otherwise terminal `DISPATCH_NOT_READY`.
- Unsupported adapter is never permission to fall back.
- Default CLI / no-deps invocation performs zero live execution (occupancy
  gate fires first: `OCCUPANCY_BLOCKED` / `OCCUPANCY_SOURCE_MISSING`).
- OpenCode provider target is the guard base URL only; no direct
  `http://127.0.0.1:8080/v1` endpoint is ever introduced.

## Truthful top-level accounting

`baseResult()` propagates `execution_performed: partial.execution_performed
=== true`, so a delegated successful execution is truthfully reflected at
the bridge top level while every blocked/unsupported/no-route path stays
`false`. Nested `adapter_result` semantics are unchanged.

## Pass history

1. First pass STOPPED (one-pass rule) at 12/15 target: two harness
   observability bugs (closure-local mock captures) + one expectation
   mismatch (occupancy precedes runner check by design).
2. Harness-correction pass STOPPED at 14/15: exposing captures proved the
   relayed diagnosis incomplete — a real minimal production defect
   (`baseResult` hardcoding `execution_performed: false`).
3. This minimal-fix pass: one-line propagation fix; target 15/15; all
   regressions PASS; full deliverable committed.

## Proofs (offline, mocked; each run exactly once)

- `node tests/v4-execution-adapter-router/run.mjs` — **15/15 PASS**
  (NO_ROUTE, cursor routes → ADAPTER_NOT_REGISTERED, missing/invalid
  dispatch blocked, no-auth no-execution, exactly-once delegation with
  observable `runCalls===1`/`guardStarts===1`, guard-target check,
  structural propagation, no fallback, no router/dispatch/adapter mutation,
  default zero live execution, occupancy-first fail-closed ordering)
- `node tests/execution-router/run.mjs` — 12/12 PASS
- `node tests/opencode-execution-dispatch/run.mjs` — ALL_PASS (13 suites)
- `node tests/opencode-execution-adapter/run.mjs` — 23/23 PASS

## Pass counters

```yaml
qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false
```

## NEXT

`V4_EXECUTION_ADAPTER_REGISTRY_BOUNDARY` — harden the registry boundary
(contract + validation for registering new adapters) so a future executor
such as Grok Bot can be added without modifying EXECUTION_ROUTER, before
any n8n/Telegram wiring.
