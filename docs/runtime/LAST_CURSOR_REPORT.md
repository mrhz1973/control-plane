# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF61_STRUCTURAL_VERIFY_AND_INACTIVE_IMPORT
result_cursor: PASS_D0025_WF61_IMPORTED_INACTIVE_STRUCTURAL_READY
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_import
report_persistence_commit: PENDING_SELF_REFERENCE
classification: WF61_IMPORTED_INACTIVE_STRUCTURAL_READY

repo_head_observed_at_task: 1a4fa636f7a7c98e77524dbd1931b78ebf5e879c
workspace_at_start: clean
operator_gate_ref: github:issue/31#5453475230
issue_31_state: OPEN

V1_MODELS:
  endpoint: /v1/models
  provider_calls: 0
  inference: 0
  aliases_present: [planner-glm-pilot, planner-codex-pilot]

WF61_IMPORT:
  artifact_blob: 528f40f2111850383953991b2f822ef2816ad621
  vps_checkout_synced: 1a4fa636f7a7c98e77524dbd1931b78ebf5e879c
  workflow_id: d0025-6100-4001-8001-000000000061
  name: 61 - LiteLLM primary remote planner cycle - GPT-Web authored - INACTIVE
  active: false
  import_mechanism: n8n import:workflow (staged id metadata only)
  mounted_artifact_modified: false
  semantic_equivalence: PASS
  http_credentialless: true
  http_url: http://litellm-primary:4000/v1/responses
  executed: false

LITELLM_PRESERVED:
  container_id: edbb03981626234b1f75bd91dd5cf205fca9922a1cbe1d38a2d07f0b8163f635
  wiring_unchanged: true

N8N_PRESERVATION:
  n8n_id_unchanged: true
  wf40_ok: true
  wf60_ok: true

BUDGET_THIS_PASS:
  runtime_mutations: 1
  provider_calls: 0
  inference: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

NEXT_GATE: D-0025-W_WF40_PARENT_WIRING

REPORT: reports/architecture/d0025_wf61_structural_verify_and_inactive_import.md
```
