# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRODUCTION_SERVICE_WIRING_AND_PERSISTENCE_BUGBOT_CORRECTION
result_cursor: PASS
starting_head: 41e24f278a694b87acc560987e0c359704d09651
dispatch_base_head: 41e24f278a694b87acc560987e0c359704d09651
# final_head filled after commit

category: ROUTINE_CORRECTIVE_RUNTIME (corrective pass over STOP 41e24f2)
bugbot_corrections: 1
bugbot_result: PASS_NO_FINDINGS

race_fix: pending-store single-writer async mutation lane (register holds through send+persist)
race_regression_tests: 58 APPROVE / 59 REJECT / 60 reconcile+register

real_telegram_decision_messages: 0
telegram_health_getMe: ok
telegram_health_getUpdates: ok
runtime_mutations: 1 (Scheduled Task + listener 18792)
workflow_mutations: 0
network_mutations: 1 (Tailscale private routes additive)
tailscale_funnel: absent (tailnet only)
scheduled_task: ControlPlane-V4-RuntimeAuthorizationIssuance
listener_18792: exactly_one
direct_telegram_poller: active
production_pending_store_mutations: 0 (remains empty)
production_registry_mutations: 0
production_spend_ledger_mutations: 0
n8n_mutations: 0
http_execution_endpoint_requests: 0
wf40_executions: 0
wf61_executions: 0
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
authorization_issuance: 0
authorization_spends_production: 0
active_production_issuance: 0
secret_exposure: false
token_on_cmdline: false
wf40_node_count_unchanged: 71
wf61_active: false
d0025_gate_closed: true
live_execution: 0
live_issuance: 0

local_smoke_status: HTTP 200 ISSUANCE_PENDING_NOT_FOUND
vps_smoke_status: HTTP 200 ISSUANCE_PENDING_NOT_FOUND

target_suites:
  - tests/v4-runtime-authorization-issuance/run.mjs: 60/60 PASS
  - tests/v4-windows-local-execution-endpoint/run.mjs: 61/61 PASS
  - tests/v4-runtime-authorization-durable-spend-ledger/run.mjs: 13/13 PASS

regressions:
  - opencode-execution-adapter: 23/23 PASS
  - opencode-single-generation-guard: 16/16 PASS
  - v4-local-runtime-readonly-contribution: 29/29 PASS
  - v4-local-runtime-readonly-private-endpoint: 22/22 PASS

git_diff_check: PASS

pass_state:
  - ISSUANCE_PRODUCTION_SERVICE_PERSISTED
  - PENDING_STORE_SINGLE_WRITER_PROTECTED
  - DIRECT_TELEGRAM_POLLER_ACTIVE
  - ISSUANCE_PRIVATE_ROUTE_ACTIVE
  - PENDING_STORE_EMPTY
  - PRODUCTION_REGISTRY_EMPTY
  - PRODUCTION_LEDGER_EMPTY
  - READY_FOR_FIRST_LIVE_APPROVAL
  - LIVE_EXECUTION_CLOSED

next: V4_RUNTIME_AUTHORIZATION_FIRST_LIVE_APPROVAL_AND_EXECUTION_PROOF

evidence:
  - reports/architecture/v4_runtime_authorization_issuance_production_service_wiring_and_persistence.md
  - docs/runtime/CURRENT_FRONTIER.md
  - docs/runtime/LAST_CURSOR_REPORT.md
```
