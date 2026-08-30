# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_N8N_EXECUTION_ROUTING_BRIDGE_INTEGRATION_OFFLINE
result_cursor: STOP_TARGET_SUITE_3_OF_23_FAILED_OPERATOR_RELAYED
evidence_class: operator-relayed_not_independently_verified
starting_head: 42202d9ece9bfd2ed7d86bac317e8c2e38d342eb
final_head: 42202d9ece9bfd2ed7d86bac317e8c2e38d342eb
commit_push_performed: false
workspace_after_stop: DIRTY_BLOCK_FILES_ONLY_REPORTED

target_tests: STOP_20_OF_23_PASS_3_FAIL
regression_tests: NOT_RUN_BY_ONE_PASS_STOP

failure_1: routed-result-propagated_top_level_ok_dropped
failure_2: no-fallback-adapter-run-never-invoked_top_level_ok_dropped
failure_3: unsupported-route-fixture_did_not_isolate_cursor_route

production_defect_confirmed: true
production_fix_required: tools/n8n-v4-execution-routing-bridge-v1.mjs_base_ok_propagation
production_fix_summary: base_should_use_ok_eq_p_ok_eq_true
fixture_fix_required: tests/n8n-v4-execution-routing-bridge_only
fixture_fix_summary: make_opencode_qwen_local_unavailable_in_unsupported_route_case

qwen_generation_calls: 0
qwen_session_manager_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
provider_calls: 0
n8n_execution_calls: 0
workflow_mutations: 0
network_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_n8n_execution_routing_bridge_integration_offline_stop_operator_relay.md
NEXT: V4_N8N_EXECUTION_ROUTING_BRIDGE_CORRECTION_ONE_PASS
```

## NOTE

This report was persisted by GPT Web from the complete terminal report supplied by the operator after Cursor intentionally stopped before commit/push under the one-pass rule. The uncommitted bridge implementation is therefore not independently verified from Git history yet.
