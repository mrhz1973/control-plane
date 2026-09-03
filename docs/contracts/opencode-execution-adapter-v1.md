# opencode-execution-adapter-v1

Production bounded execution adapter for the proven `opencode + qwen_local`
route. Sits **after** the unchanged `DISPATCH_READY` boundary and executes
only behind an explicit runtime authorization.

```text
route/packet → dispatch boundary (unchanged)
  → runtime authorization check (fail-closed)
  → shared-runtime occupancy gate (canonical result)
  → single-generation guard (hard ceiling)
  → exactly one OpenCode process
  → structural accounting/result
  → authorization consumed/terminal
```

## Default fail-closed

Without explicit runtime authorization: `execution_performed=false`, no
OpenCode process, no guard, no model/session start. `execute=true` alone does
**not** authorize.

## Runtime authorization contract

Validates (fail-closed before any execution-side action):

- present · schema `operator-runtime-authorization-v1`
- `state == ACTIVE` / unused
- route exactly `opencode+qwen_local`
- `max_opencode_executions == 1`
- `max_qwen_generation_calls == 1`
- `retry == 0` · `fallback == 0`
- `single_generation_guard_required == true`
- `profile_id == qwen38-dcfr-iq3-agent-24k` · `role == FAST_AGENT` · no `dflash_required`

Spent / absent / malformed / wrong-route / over-broad → fail closed.

## Occupancy gate

Accepts only canonical `QWEN_READY_IDLE` / `QWEN_NOT_RUNNING_SAFE_TO_START`.
`BUSY` / `UNCERTAIN` → terminal fail-closed. Never kills/stops processes.

## Guard boundary

Every generation path uses `tools/opencode-single-generation-guard-v1.mjs`.
OpenCode target = guard base URL only; never direct `:8080`. Invariant
`upstream_generation_requests <= 1`. No `steps`/`maxSteps` ceilings.

## Bounds enforcement

Adapter rejects runner/accounting indicating `opencode_execution_count > 1`,
`upstream_generation_requests > 1`, `qwen_generation_calls > 1`,
`retry_calls > 0`, `fallback_calls > 0` → fail-closed classification.

## Result

`opencode-execution-result-v1` — see schema. Structural fields only; no
prompt/body/model-output persistence beyond a bounded sanitized validation
summary.

## Tool

`tools/opencode-execution-adapter-v1.mjs` (DI for offline tests: occupancy,
guard, runner injectable).
