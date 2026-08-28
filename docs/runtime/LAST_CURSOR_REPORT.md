# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PHASE_A
result_cursor: PASS_D0025_PHASE_A_FOUNDATION_SYNC_PRIMARY_CONFIG_N8N_MAP
reported_via: cursor_direct_persistence
independent_verification: cursor_repo_only_phase_a_work_pc
report_persistence_commit: pending
classification: D0025_PHASE_A_REPO_SYNC_COMPLETE

repo_head_observed_at_task: 7fe8b58ec32a40afedc7e3c1eb1f2250a31cc0c2
workspace_at_start: clean
operator_gate_ref: github:issue/31
issue_31_state: OPEN

PRECHECK:
  fetch_ff_only: PASS
  core_boot: PASS
  teamviewer_network_mutations: 0

FOUNDATION_SYNC:
  document: docs/foundation/PROJECT_VISION.md
  version: "3.2"
  litellm_primary_remote: documented
  openclaw_fallback_preserved: documented
  qwen_deferred: documented
  d0024_pass_recorded: true
  operator_decision_date: "2026-08-28"

PRIMARY_REMOTE_CONFIG:
  path: configs/litellm/control-plane-primary-remote.template.yaml
  status: NOT_ACTIVE
  aliases: [planner-glm-pilot, planner-codex-pilot]
  qwen_included: false
  offline_validation: PASS
  validation_suite: tests/llm-gateway-portability/run.mjs
  validation_case: litellm-primary-remote-config-checks
  litellm_package_parse: unavailable_on_host
  structural_validation: PASS

N8N_INTEGRATION_MAP:
  report: reports/architecture/d0025_phase_a_integration_map.md
  classification: REPO_GROUNDED_REVERIFY_REQUIRED
  live_n8n_api: unavailable
  n8n_api_key_set: false
  wf40_live_id: 9ZMj2ACTKyDVhCue
  wf60_live_id: d0015600-4001-8001-0001-0653506aabcd
  wf40_export_evidence: workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json
  live_workflow_mutation: 0
  planner_litellm_node_present_in_export: false
  wf60_openclaw_resolver_present: true

BUDGET_THIS_PASS:
  provider_calls: 0
  codex_inference: 0
  glm_inference: 0
  qwen_inference: 0
  expanded_glm_budget_used: 0
  expanded_codex_budget_used: 1
  expanded_codex_budget_remaining: 9
  retry: 0
  planner_fallback: 0
  gateway_fallback: 0
  network_config_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
