# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_TEST_HARNESS_CORRECTION_ONE_PASS
result_cursor: STOP_OPERATOR_RELAYED_TEST_DIAGNOSIS_INVALID
evidence_class: operator-relayed_not_independently_verified
starting_remote_head: 83c0502e40292fdb7bff1a493d717d60f4877217
final_head: 83c0502e40292fdb7bff1a493d717d60f4877217
commit_push_performed: false
workspace_after_stop: DIRTY_ROUTING_BLOCK_PLUS_CORRECTED_TESTS_REPORTED
preservation_stash_present: true

harness_observability_fix: PASS
runCalls_observed: 1
guardStarts_observed: 1
guardBaseUrl_observable: true
default_occupancy_first_expectation: PASS

target_tests: STOP_14_OF_15_PASS_1_FAIL
remaining_failure: valid-delegates-exactly-once_top_level_execution_performed_false
production_defect_confirmed: true
production_defect_location: tools/v4-execution-adapter-router-v1.mjs
production_defect_detail: baseResult_hardcodes_execution_performed_false_and_drops_partial_execution_performed
minimal_fix: propagate_partial_execution_performed_true_at_top_level

regression_tests: PASS
  - execution-router: PASS_12_OF_12
  - opencode-execution-dispatch: ALL_PASS_13_SUITES
  - opencode-execution-adapter: PASS_23_OF_23
procedural_note: regressions_ran_in_same_shell_invocation_after_target_failure

qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_opencode_control_plane_routing_integration_test_harness_correction_stop_operator_relay.md
NEXT: V4_OPENCODE_ROUTING_EXECUTION_PERFORMED_PROPAGATION_FIX_ONE_PASS
```

## NOTE

This rolling report was persisted by GPT Web from the complete Cursor terminal report supplied by the operator. Cursor intentionally stopped before commit/push under the one-pass rule, so this evidence is operator-relayed rather than independently verified from a pushed Cursor commit.
