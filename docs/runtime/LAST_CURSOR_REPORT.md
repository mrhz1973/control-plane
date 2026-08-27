# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0015-W_WF40_LIVE_STRUCTURE_MAP
result_cursor: PASS_WF40_LIVE_STRUCTURE_MAP_PERSISTED_FOR_GPT_WEB_WIRING_DELTA
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_readonly_n8n_export
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 355f8a109afa065700d01d861ef1561df5e9ab0f
workspace_at_start: clean
operator_gate_ref: github:issue/21#issuecomment-5431911525
inspection_method: read_only
  - ssh ionos-n8n
  - docker exec root-n8n-1 n8n export:workflow --id=9ZMj2ACTKyDVhCue
  - host-side python3 structural sanitize (no credential values)
  - temp export file removed after inspection
n8n_mutation: false
workflow_execution: false
provider_model_calls: 0

WF40_LIVE_IDENTITY:
  live_id: 9ZMj2ACTKyDVhCue
  live_name: "40 - CP v4 multirepo + classifier bridge - ACTIVE"
  active: true
  node_count: 34
  updatedAt: "2026-05-21T23:33:35.671Z"
  versionId: 028cd44a-508d-4573-b9cd-70d6338110b3
  triggers:
    manual_trigger: true
    schedule_trigger_controlled_polling: true

IF_NEW_COMMIT_NODE:
  id: b4bf4e90-f17e-4edc-b2d0-4bba669d985c
  name: "IF - New commit?"
  type: n8n-nodes-base.if
  upstream_immediate:
    - from: "Decide Data Table dedupe"
      branch: main
  true_downstream_main_index_0_parallel_fork:
    - to: "IF - GIS repo for handoff?"
      target_id: 1f2cbff4-feac-4734-bb60-04b34ad10887
      target_type: n8n-nodes-base.if
    - to: "Data Table - Upsert last seen commit"
      target_id: 6b3a3565-3d0d-47e1-aa46-0d3670b0db26
      target_type: n8n-nodes-base.dataTable
    - to: "Code - Plan watcher repo gate stub"
      target_id: 429cde10-b360-4396-9f57-ffeac563d2fe
      target_type: n8n-nodes-base.code
  false_downstream_main_index_1:
    - to: "Duplicate skip - no Telegram"
      target_id: b463da87-997b-416d-8796-911cecd55273
      target_type: n8n-nodes-base.code

KEY_TRUE_BRANCH_CHAINS:
  gis_handoff_branch:
    - "IF - GIS repo for handoff?" -> "Execute Command - handoff dry-run" -> "Parse handoff stdout" -> Telegram handoff nodes
  plan_watcher_branch:
    - "Code - Plan watcher repo gate stub" -> "GitHub - Fetch commit details (plan files)" -> "Code - Detect real docs/plans plan files" -> "IF - plan_detected?" -> Gate D Telegram/file chain OR no_plan_detected
  classifier_bridge_branch_on_plan_detected_true:
    - "IF - plan_detected?" true -> "Code - PM21 classifier decision" -> "Code - PM21 bridge result" -> "Code - PM21 format Telegram bridge summary" -> "Telegram - Send PM21 bridge summary"
  dedupe_notify_parallel_on_true:
    - "Data Table - Upsert last seen commit" -> "Format Data Table Telegram message" -> "Telegram - Send Data Table deduped message"

EXECUTE_WORKFLOW_NODES_LIVE: []
OPENCLAW_NAMED_NODES_LIVE: []
HTTP_NODES_LIVE_METADATA_ONLY:
  - name: "GitHub - Fetch latest commit (per repo)"
    id: ce3f4bb1-8b81-4ede-b3b5-8701133f5abb
    url_pattern: "=https://api.github.com/repos/{{ $json.ownerRepo }}/commits?per_page=1"
  - name: "GitHub - Fetch commit details (plan files)"
    id: 52e94e9c-986f-4f93-bac3-2c20ec4a60a1
    url_pattern: "=https://api.github.com/repos/{{ $json.repo }}/commits/{{ $json.currentSha }}"
  - name: "HTTP Request - Fetch raw Gate D plan file"
    id: 4fda089d-01fe-4d7f-b98c-308394eb1627
    url_pattern: "={{ $json.rawPlanUrl }}"

MERGE_SWITCH_NODES_LIVE: none

WF60_INSERTION_CANDIDATES_FOR_GPT_WEB:
  primary_fork: IF - New commit? true (main[0]) parallel targets unchanged vs repo snapshot
  recommended_parent: live WF40 id 9ZMj2ACTKyDVhCue
  wf60_live_target_id: d0015600-4001-8001-0001-0653506aabcd
  header_auth_credential_id_for_future_openclaw_http: Qy4tQ7a7ld5loSdV
  note: no Execute Workflow or OpenClaw HTTP nodes exist yet on live WF40; GPT Web must author verbatim wiring delta

REPO_SNAPSHOT_DIVERGENCE:
  compared_to: workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json
  snapshot_name: "40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE"
  snapshot_node_count: 30
  live_node_count: 34
  if_new_commit_topology: MATCH (same 3-way true fork + false duplicate skip)
  live_only_vs_ready_import_40:
    - PM21 classifier bridge chain present on live (Code/Telegram PM21 nodes)
    - live workflow display name includes "classifier bridge"
  ready_import_42_note: PM21 chain mirrors workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json pattern now merged into live WF40

parent_workflow_mutation: false
wf40_wf42_wf41_wf60_mutation: false
credential_values_read: false

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
