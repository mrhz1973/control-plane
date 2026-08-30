# V4 — OpenCode Execution Adapter v1 (offline implementation)

**Block:** `V4_OPENCODE_EXECUTION_ADAPTER_V1` · **Date:** 2026-08-30 · **Result:** PASS

## Summary

Additive production bounded execution adapter for the proven `opencode +
qwen_local` route. Sits **after** the unchanged `DISPATCH_READY` boundary
(`tools/dispatch-opencode-execution-v1.mjs` untouched) and executes only
behind an explicit runtime authorization. The external single-generation
guard remains the hard generation ceiling. This pass was fully offline:
zero OpenCode executions, zero Qwen generations, zero provider calls.

## Shape

```text
route/packet
  -> existing dispatch boundary (UNCHANGED)
  -> explicit runtime authorization check     (fail-closed)
  -> shared-runtime occupancy gate            (canonical classification only)
  -> single-generation guard                  (upstream_generation_requests <= 1)
  -> exactly one OpenCode process             (injectable runner)
  -> structural accounting/result             (opencode-execution-result-v1)
  -> authorization consumed/terminal
```

## Runtime authorization contract

`validateRuntimeAuthorization` rejects (fail-closed, before any
execution-side action): absent, non-object, missing/incorrect
`schema_version` (`operator-runtime-authorization-v1` required exactly),
missing id, non-ACTIVE state, `spent`/`used` flags, missing scope, wrong
implementer/model, guard not required, `max_opencode_executions != 1`,
`max_qwen_generation_calls != 1`, `retry != 0`, `fallback != 0`, wrong
profile (`fast_8k`), `dflash_required != true`, wrong `route_id` when
expressed. A boolean like `execute=true` can never satisfy the object
contract. Historical REAUTH artifacts are not referenced as reusable.

## Occupancy gate

Consumes the canonical occupancy classification (no duplicate classifier).
Only `QWEN_READY_IDLE` / `QWEN_NOT_RUNNING_SAFE_TO_START` proceed;
`QWEN_BUSY_SHARED_RUNTIME` / `QWEN_OCCUPANCY_UNCERTAIN` / anything else
return terminal fail-closed. The adapter never kills or stops processes.

## Guard boundary

Every authorized path starts one guard (`guardStart` injectable; production
default `startSingleGenerationGuard`). A guard whose `base_url` equals the
direct canonical endpoint `http://127.0.0.1:8080` is rejected
(`GUARD_TARGET_IS_DIRECT_QWEN_ENDPOINT`). Guard accounting is authoritative:
`upstream = max(guard.upstream_generation_requests, runner claim)` so the
runner can never mask generations. No `steps`/`maxSteps` ceiling is used.

## Runner-failure integrity

If the runner throws after a generation was forwarded, the catch block reads
`guard.getAccounting()` **before** `finally` closes the owned guard, so the
terminal result still reports truthful `guard_upstream_generation_requests`.
Owned guard is closed on both PASS and terminal failure paths.

## Bounds enforcement

`EXECUTION_BOUNDS_VIOLATION` (status ERROR, fail-closed) on:
`opencode_execution_count > 1`, `upstream_generation_requests > 1`,
`qwen_generation_calls > 1`, `retry_calls > 0`, `fallback_calls > 0`.

## Result contract

`opencode-execution-result-v1` (schema in
`docs/contracts/opencode-execution-adapter-v1.schema.json`): structural
fields only — ids, statuses, classifications, occupancy classification,
guard counters, execution counters, bounded `response_validation`
(`VALID|INVALID|NOT_VALIDATED`), `reason_codes`. No prompt/body/model-output
persistence anywhere.

## Dependency injection

`executeOpenCodeBounded(request, options)` accepts `getOccupancy`,
`guardStart`, `runOpenCode`, `upstreamOrigin`. Production defaults use the
real guard; with no `runOpenCode` injected the adapter returns
`RUNNER_NOT_PROVIDED` / `NO_LIVE_EXECUTION_DEFAULT` — the default path
performs no live execution. CLI default invocation prints a fail-closed
`AUTHORIZATION_REJECTED` result.

## Proofs (offline, mocked)

`node tests/opencode-execution-adapter/run.mjs` — 23/23 PASS covering all
17 mandated scenarios plus: direct-endpoint guard rejection,
runner-throws-after-generation accounting integrity, missing-schema_version
fail-closed, validator spot checks.

Regressions all PASS:

- `tests/opencode-single-generation-guard/run.mjs` — 16/16
- `tests/opencode-execution-dispatch/run.mjs` — ALL_PASS (13 suites)
- `tests/qwen-local-session-manager/run.mjs` — 14/14
- `tests/qwen-local-resource-status-overlay/run.mjs` — 14/14

## BugBot

Prior pass STOPPED on 2 findings (runner-throw accounting discarded;
schema_version fail-open). Both fixed in this pass with regression tests.
This pass: exactly one review — **PASS_NO_FINDINGS**.

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

`V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_OFFLINE` — smallest additive
step wiring the adapter into V4 control-plane routing without live
execution; no n8n/workflows mutation.
