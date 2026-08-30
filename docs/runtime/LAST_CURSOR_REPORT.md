# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_N8N_EXECUTION_ROUTING_BRIDGE_CORRECTION_ONE_PASS
result_cursor: STOP_REGRESSION_LITELLM_PRIMARY_CYCLE_WF61_STRUCTURAL_FAIL
reported_via: operator_relay_from_cursor_terminal
bridge_pass_independent_verification: false
regression_baseline_drift_independently_repo_verified: true
starting_remote_head: 3508b7158d4047a82f6cb7c8580fac9ae5242211
final_head: 3508b7158d4047a82f6cb7c8580fac9ae5242211
commit_push_performed: false
preservation_stash: v4-n8n-routing-bridge-correction-preserve

workspace_reconciliation: PASS
production_fix_path: tools/n8n-v4-execution-routing-bridge-v1.mjs
production_fix_summary: base_ok_propagates_p_ok_eq_true
top_level_ok_propagation_fixed: true
fixture_fix_path: tests/n8n-v4-execution-routing-bridge/run.mjs
unsupported_route_fixture_isolated: true

target_tests: PASS_23_OF_23
regression_tests:
  - v4-execution-adapter-registry: PASS_19_OF_19
  - v4-execution-adapter-router: PASS_15_OF_15
  - execution-router: PASS_12_OF_12
  - litellm-primary-cycle: STOP_17_OF_18_WF61_STRUCTURAL_FAIL

regression_blocker: wf61-structural-pass_expected_1_httpRequest_found_0
regression_root_cause: PRE_EXISTING_STRUCTURAL_TEST_DRIFT_AFTER_CANONICAL_WF61_6106_EXECUTECOMMAND_RESYNC
wf61_resync_commit: 00f01325eaf2f218d0dc3578ec1eed278cbd4403
stale_test_commit_pre_resync: 11017d1ac662c4ccddb351b476690ee72ba62582
d0025_reopened: false

qwen_generation_calls: 0
qwen_session_manager_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
provider_calls: 0
n8n_execution_calls: 0
workflow_mutations: 0
network_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_n8n_execution_routing_bridge_correction_regression_stop_operator_relay.md
NEXT: WF61_STRUCTURAL_REGRESSION_BASELINE_RECONCILIATION_OFFLINE_ONE_PASS
```

## NOTE

The uncommitted bridge corrective result remains operator-relayed because Cursor stopped before commit/push. The unrelated WF61 regression baseline drift was independently verified from canonical repository history by GPT Web. D-0025 remains closed; the next block is offline historical regression maintenance only.
