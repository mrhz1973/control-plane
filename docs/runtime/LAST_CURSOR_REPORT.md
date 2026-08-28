# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_BACKLOG_PRIMARY_REMOTE_ADAPTER_IMPLEMENTATION
result_cursor: PASS_D0025_BACKLOG_PRIMARY_REMOTE_ADAPTER_READY
reported_via: cursor_direct_persistence
independent_verification: offline_fixture_suite
report_persistence_commit: PENDING_SELF_REFERENCE
classification: BACKLOG_PRIMARY_REMOTE_ADAPTER_READY

repo_head_observed_at_task: 49904c4ff1e80c372b1206976ecadcf44a39bacb
workspace_at_start: clean_after_ff
operator_gate_ref: github:issue/31
issue_31_state: OPEN

HELPER:
  path: tools/build-primary-remote-cycle-input-from-backlog.mjs
  implementation: PASS
  parser_strategy: bounded_backlog_item_v1_yaml_subset_no_runtime_install
  new_runtime_dependencies: 0
  package_json_added: false

TESTS:
  suite: tests/backlog-primary-remote-adapter/run.mjs
  passed: 18
  failed: 0
  total: 18
  contract_section_9_coverage: true
  glm_gate_disabled_dispatch_allowed: false
  codex_gate_disabled_dispatch_allowed: false
  glm_gate_enabled_fixture_REMOTE_DISPATCH_READY: true
  codex_gate_enabled_fixture_REMOTE_DISPATCH_READY: true
  http_provider_calls_in_tests: 0

PATCH_OFFLINE:
  path: workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json
  json_parse: PASS
  helper_ref_match: true
  contract_ref_match: true
  runtime_gate_ref_match: true
  runtime_gate_must_remain_disabled: true

CANONICAL_RUNTIME_GATE:
  path: configs/planner/primary-remote-runtime-gate.json
  unchanged: true
  enabled: false
  provider_calls_authorized_per_event: 0

PRESERVATION:
  workflow_mutations: 0
  wf40_unchanged: true
  wf60_unchanged: true
  wf61_unchanged: true
  litellm_unchanged: true
  gpt_web_patch_artifact_unchanged: true

BUDGET_THIS_PASS:
  provider_calls: 0
  inference: 0
  wf61_executions: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

NEXT_GATE: D-0025-W_WF40_PARENT_WIRING_APPLY

CONTRACT: docs/contracts/backlog-primary-remote-adapter-v1.md
```
