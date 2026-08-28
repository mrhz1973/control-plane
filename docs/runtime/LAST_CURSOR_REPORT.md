# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PRIMARY_CYCLE_RUNNER
result_cursor: PASS_D0025_PRIMARY_CYCLE_RUNNER_PREPARE_FINALIZE_WF61_STRUCTURE
reported_via: cursor_direct_persistence
independent_verification: cursor_offline_runner_implementation_work_pc
report_persistence_commit: pending
classification: D0025_PRIMARY_CYCLE_RUNNER_PASS

repo_head_observed_at_task: 19097d5aeda720fe2b688ac945be8eacee383686
workspace_at_start: clean
operator_gate_ref: github:issue/31
issue_31_state: OPEN

RUNNER:
  tool: tools/run-litellm-primary-cycle.mjs
  contract: docs/contracts/litellm-primary-cycle-runner-v1.md
  modes: [prepare, finalize]
  network_calls: 0

TEST_SUITE:
  path: tests/litellm-primary-cycle/run.mjs
  result: PASS
  passed: 16
  failed: 0
  cases:
    - glm_prepare_pass
    - codex_prepare_pass
    - qwen_preferred_fail
    - nonempty_fallback_fail
    - fallback_policy_not_gate_only_fail
    - task_id_mismatch_fail
    - planner_requested_mismatch_fail
    - prepare_cli_pass
    - finalize_json_pass
    - finalize_codex_sse_pass
    - malformed_sse_fail
    - hard_constraints_mismatch_fail
    - policy_gate_preserved
    - cursor_dispatch_allowed_always_false
    - no_secret_shaped_output
    - wf61_structural_pass

WF61:
  artifact: workflows/61-litellm-primary-remote-planner.template.json
  structural_validation: PASS
  n8n_target_version: "2.19.5"
  modified_by_cursor: false

SCHEMA_ENGINE:
  resolver_env: CONTROL_PLANE_AJV_NODE_MODULES
  repo_ajv_added: false

BUDGET_THIS_PASS:
  provider_calls: 0
  inference: 0
  network_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
