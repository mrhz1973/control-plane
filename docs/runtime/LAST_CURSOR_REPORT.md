# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_OFFLINE
result_cursor: STOP_TARGET_SUITE_3_OF_15_FAILED_OPERATOR_RELAYED
evidence_class: operator-relayed_not_independently_verified
starting_head: 7f0eeba57f19924f522cbc67fa504369b4059ef2
final_head: 7f0eeba57f19924f522cbc67fa504369b4059ef2
commit_push_performed: false
workspace_after_stop: DIRTY_BLOCK_FILES_ONLY_REPORTED

target_tests: STOP_12_OF_15_PASS_3_FAIL
regression_tests: PASS
  - execution-router: PASS_12_OF_12
  - opencode-execution-dispatch: ALL_PASS_13_SUITES
  - opencode-execution-adapter: PASS_23_OF_23

failure_1: valid-delegates-exactly-once_capture_not_exposed
failure_2: no-direct-qwen-endpoint_capture_not_exposed
failure_3: default-no-runner_expected_classification_mismatch

production_misbehavior_evidenced: false
corrective_scope: TEST_HARNESS_ONLY
bugbot_result: NOT_RUN_BY_ONE_PASS_STOP

qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_opencode_control_plane_routing_integration_offline_stop_operator_relay.md
NEXT: V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_TEST_HARNESS_CORRECTION_ONE_PASS
```

## NOTE

This report was persisted by GPT Web from the complete Cursor terminal report supplied by the operator after Cursor intentionally stopped before commit/push under the one-pass rule. It is not an independently verified pushed Cursor report.
