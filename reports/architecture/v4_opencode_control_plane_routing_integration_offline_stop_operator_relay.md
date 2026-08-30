# V4 — OpenCode control-plane routing integration offline — operator-relayed STOP

**Task:** `V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_OFFLINE`

**Status:** `STOP — TARGET_SUITE_3_OF_15_FAILED`

**Evidence class:** `operator-relayed` — copied from the complete Cursor terminal report supplied by the operator; not independently verified from a pushed Cursor commit because Cursor intentionally stopped before commit/push under the one-pass rule.

## Repository/workspace state reported

- HEAD remained `7f0eeba57f19924f522cbc67fa504369b4059ef2`.
- No commit/push was performed.
- Workspace was reported dirty only with the new files from this block.
- No BugBot invocation.
- No live execution.

## Test result reported

Target suite: `tests/v4-execution-adapter-router/run.mjs` — **12/15 PASS**, 3 failures.

Regressions, each run once:

- execution-router: **12/12 PASS**
- opencode-execution-dispatch: **ALL_PASS (13 suites)**
- opencode-execution-adapter: **23/23 PASS**

## Three target failures

1. `valid-delegates-exactly-once`
   - Observed production classification: `EXECUTED_OK`.
   - Assertion counters `runCalls` / `guardStarts` were `undefined`.
   - Reported diagnosis: test harness capture bug. `mockAdapterDeps()` increments counters on a closure-local `captures` object that is not returned/exposed, so the assertion cannot observe the counts.

2. `no-direct-qwen-endpoint`
   - `deps.guardBaseUrl` was `undefined`.
   - Same reported harness observability bug; no direct `http://127.0.0.1:8080/v1` appeared in result JSON.

3. `default-no-runner-injected-no-execution`
   - Observed classification: `OCCUPANCY_BLOCKED` with `OCCUPANCY_SOURCE_MISSING`.
   - Expected by test: `RUNNER_NOT_PROVIDED`.
   - Reported diagnosis: expectation mismatch, not production defect. Occupancy is intentionally checked before runner presence; execution remained false and guard never started.

## Reported assessment

No production misbehavior was evidenced by the failed assertions. The bridge, contract, and schema were implemented but remained uncommitted because the one-pass rule required STOP at the first test outcome.

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

## Determined corrective path

A single bounded corrective pass is sufficient:

- expose the mock capture object/counters from `mockAdapterDeps()` so tests can observe exactly-once delegation and guard target;
- change the default-path assertion to the actual intended fail-closed outcome `OCCUPANCY_BLOCKED` / `OCCUPANCY_SOURCE_MISSING`;
- do not redesign production behavior;
- run the target suite once and the three regressions once;
- if anything still fails, STOP immediately; no further fix/test loop in the same pass.
