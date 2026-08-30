# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_SINGLE_GENERATION_GUARD_OFFLINE
result_cursor: PASS_SINGLE_GENERATION_GUARD_READY
starting_head: 7ee35748903376e080558cb66fd833c451abf292
final_head: 0aa2d086350e57692bbde6271ba840b70534df44

guard_contract_path: docs/contracts/opencode-single-generation-guard-v1.md
guard_schema_path: docs/contracts/opencode-single-generation-guard-v1.schema.json
guard_tool_path: tools/opencode-single-generation-guard-v1.mjs
guard_test_path: tests/opencode-single-generation-guard/run.mjs

bind_host: 127.0.0.1
loopback_only: true
max_upstream_generation_requests: 1

first_request_forwarded: true
second_request_blocked: true
concurrent_race_test: true
failed_first_consumes_budget: true
streaming_passthrough_test: true
models_probe_budget_free: true
alternate_generation_endpoints_blocked: true
secret_header_rejection: true
body_persistence: false
tests_result: PASS_16_of_16_plus_regressions

qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_opencode_single_generation_guard_offline.md
NEXT: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2
```
