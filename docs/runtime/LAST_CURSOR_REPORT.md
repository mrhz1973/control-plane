# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF61_TEMPLATE_CODE_NODE_ITEM_ACCESS_FIX
result_cursor: PASS_D0025_WF61_ITEM_ACCESS_FIX
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_export_post_apply
report_persistence_commit: PENDING_SELF_REFERENCE
classification: WF61_TEMPLATE_AND_LIVE_CODE_ACCESS_FIXED

repo_head_at_start: 2f04bddc74c852191c2f9e50a68224f94910cfe9
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
patch_artifact: workflows/patches/d0025-w-wf61-code-node-item-access-fix.gpt-web.json

source_template_commit: 10bb1791f42e44de5aa3899f0caaead77ec6eb29

wf61_live_version_before: 30c539f8-5c6b-46b2-912a-8c246f72ffe4
wf61_live_version_after: e231817d-772c-4db0-80e6-3409fe259059
wf61_node_count: 13

five_target_ids:
  - d0025-6104-4004-8004-000000000004
  - d0025-6107-4007-8007-000000000007
  - d0025-6110-4010-8010-000000000010
  - d0025-6111-4011-8011-000000000011
  - d0025-6112-4012-8012-000000000012

mode_before_after: runOnceForEachItem -> runOnceForEachItem (all five preserved)
invalid_input_first_count_targets_before: 3
invalid_input_first_count_targets_after: 0
graph_equivalence: PASS_except_five_jsCode_fields
wf61_active_state: inactive (never activated this pass)
runtime_gate_state: CLOSED
provider_calls: 0
inference: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
wf40_unchanged: true
litellm_container_unchanged: true

NEXT_GATE: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001

REPORT: reports/architecture/d0025_wf61_code_node_item_access_fix_apply.md
```
