# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0015-W_WF60_IMPORT_CREDENTIAL_METADATA_PARENT_TARGET
result_cursor: PASS_WF60_IMPORTED_CALLABLE_PARENT_WIRING_READY_FOR_GPT_WEB_DELTA
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: f863a1730231bc00786533ee6c9eb68476b520a5

repo_head_observed_at_task: 604bfa00866aaef30ce42dd2325bcfc77319d240
workspace_at_start: clean
operator_gate_ref: github:issue/21#issuecomment-5431911525
operator_credential_attestation_ref: github:issue/21#issuecomment-5432643248

N8N_CREDENTIAL_METADATA:
  present: true
  id: Qy4tQ7a7ld5loSdV
  name: Header Auth account
  type: httpHeaderAuth
  uniquely_identifiable_without_secret: true
  uniqueness_basis: only httpHeaderAuth credential in n8n store; operator-attested OpenClaw Windows gateway token binding
  secret_read_or_persisted: false

WF60_IMPORT:
  source_artifact: workflows/60-openclaw-broker-fallback-resolver.template.json
  import_method: n8n CLI import:workflow inside root-n8n-1
  mechanical_import_envelope: top_level_workflow_id_only required by n8n importer; node logic unchanged
  live_workflow_id: d0015600-4001-8001-0001-0653506aabcd
  live_workflow_name: "60 - OpenClaw broker fallback resolver - tailnet private - GPT-Web authored"
  active: false
  shared_workflow_role: workflow:owner
  execute_workflow_trigger_present: true
  callable_via_execute_workflow_node: true

WF60_HEALTH_VALIDATION:
  method: n8n_container_equivalent_health_resolution
  n8n_cli_execute_note: blocked because task broker port 5679 already in use by running n8n instance
  primary_health_url: https://ubuntu.tailc01234.ts.net/health
  primary_status: 404
  fallback_health_url: https://asusdesktop.tailc01234.ts.net/health
  fallback_status: 200
  broker_selected: windows_private_fallback
  reason: PRIMARY_UNAVAILABLE_FALLBACK_HEALTHY
  selected_base_url: https://asusdesktop.tailc01234.ts.net
  provider_model_request_count: 0

PARENT_WIRING_TARGET_FOR_GPT_WEB:
  do_not_modify_in_this_pass: true
  recommended_primary_parent:
    live_id: 9ZMj2ACTKyDVhCue
    name: "40 - CP v4 multirepo + classifier bridge - ACTIVE"
    insertion: add Execute Workflow node upstream of any future authenticated OpenClaw invocation; target WF60 id d0015600-4001-8001-0001-0653506aabcd
  secondary_candidate:
    live_id: HVCzN3FoBdLGe9Hx
    name: "42 - CP diff summary Telegram MVP - cursor-coordinate-converter - TEMPLATE"
  wf60_subworkflow_trigger_node: When Executed by Another Workflow
  authenticated_openclaw_calls: must use Header Auth credential id Qy4tQ7a7ld5loSdV when GPT Web wires authenticated HTTP nodes; not applied in WF60 health-only resolver

gateway_auth_mode_mutation: false
vps_openclaw_mutation: false
parent_workflow_mutation: false
wf40_wf42_wf41_mutation: false
public_exposure: false

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
