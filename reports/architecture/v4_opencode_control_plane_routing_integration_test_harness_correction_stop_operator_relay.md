# V4 — OpenCode control-plane routing integration corrective STOP (operator-relayed)

**Evidence class:** `operator-relayed` / not independently verified from a pushed Cursor commit.

**Task:** `V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_TEST_HARNESS_CORRECTION_ONE_PASS`

**Result:** `STOP — OPERATOR_RELAYED_TEST_DIAGNOSIS_INVALID / TARGET=14_OF_15 / GENERATIONS=0`

## Reported repository state

- HEAD/origin/main at execution: `83c0502e40292fdb7bff1a493d717d60f4877217`
- branch: `main`
- commit/push: not performed
- workspace: dirty with restored routing-integration block artifacts + corrected test harness
- preservation stash remains present: `v4-routing-integration-one-pass-stop-preserve`

## What the corrective pass established

The two originally diagnosed harness-observability issues were corrected successfully:

- `runCalls` is observable and equals `1`
- `guardStarts` is observable and equals `1`
- `guardBaseUrl` is observable
- default no-deps expectation now correctly passes on occupancy-first fail-closed behavior: `OCCUPANCY_BLOCKED` + `OCCUPANCY_SOURCE_MISSING` + `execution_performed=false`

The remaining failure is a production contract defect in the new routing bridge rather than a test-harness defect.

## Confirmed production defect

In `tools/v4-execution-adapter-router-v1.mjs`, `baseResult()` hardcodes top-level `execution_performed: false` and does not propagate a delegated success value from `partial.execution_performed`.

Therefore a successful delegated execution can return:

- nested `adapter_result.execution_performed=true`
- top-level routing result `execution_performed=false`

This under-reports execution at the control-plane bridge boundary and violates the intended accounting contract expressed by the routing block/schema.

### Minimal remediation

Change only the routing bridge result construction so top-level `execution_performed` truthfully propagates delegated execution, e.g. equivalent semantics to:

`execution_performed: partial.execution_performed === true`

No router redesign is indicated.

## Test outcome reported

Target suite, exactly one run:

- `tests/v4-execution-adapter-router/run.mjs`: **14/15 PASS**
- only failing check: `valid-delegates-exactly-once`, specifically the top-level `execution_performed === true` conjunct

Regressions also ran in the same shell invocation despite target not reaching 15/15; all remained PASS:

- execution-router: 12/12
- opencode-execution-dispatch: ALL_PASS (13 suites)
- opencode-execution-adapter: 23/23

No edits were made after the target run and no second test run occurred.

## Counters

```yaml
qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false
```

## Canonical next

`V4_OPENCODE_ROUTING_EXECUTION_PERFORMED_PROPAGATION_FIX_ONE_PASS`

Scope: one-line/minimal production correction in `tools/v4-execution-adapter-router-v1.mjs`, then target suite once + three regressions once; STOP on any failure; no additional loop, no live execution.
