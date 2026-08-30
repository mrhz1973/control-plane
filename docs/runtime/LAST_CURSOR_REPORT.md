# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_ROUTING_EXECUTION_PERFORMED_PROPAGATION_FIX_ONE_PASS
result_cursor: PASS_ROUTING_INTEGRATION_COMPLETE
starting_remote_head: 619201f6ab263d749e422a0d380eb84a58e5037f
local_preserved_from_head: 83c0502e40292fdb7bff1a493d717d60f4877217
final_head: <stamped post-commit>

workspace_reconciliation: PASS_stash_preserve_hard_reset_restore_block_artifacts_only
test_harness_only_correction: done_in_prior_pass_14_of_15
production_fix_path: tools/v4-execution-adapter-router-v1.mjs
production_fix_summary: baseResult_execution_performed_now_propagates_partial_execution_performed_eq_true
execution_performed_propagation_fixed: true

target_tests: PASS_15_OF_15
  - valid-delegates-exactly-once: runCalls=1 guardStarts=1 adapter_result.execution_performed=true top-level=true
regression_tests: PASS
  - execution-router: PASS_12_OF_12
  - opencode-execution-dispatch: ALL_PASS_13_SUITES
  - opencode-execution-adapter: PASS_23_OF_23

registered_adapters: opencode+qwen_local_only
execution_router_modified: false
dispatch_boundary_modified: false
execution_adapter_modified: false

qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_opencode_control_plane_routing_integration_offline.md
NEXT: V4_EXECUTION_ADAPTER_REGISTRY_BOUNDARY
```

## NOTE

- Full routing-integration deliverable committed in this pass: original
  uncommitted routing artifacts + corrected test harness + minimal
  propagation fix + evidence updates.
- Both preservation stashes dropped by message match only after verified
  push: `v4-routing-integration-one-pass-stop-preserve`,
  `v4-routing-propagation-fix-current-preserve`.
