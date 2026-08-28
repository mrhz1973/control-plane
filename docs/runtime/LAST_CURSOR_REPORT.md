# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF61_TEMPLATE_ITEM_RETURN_SHAPE_FIX
result_cursor: PASS_WF61_PER_ITEM_RETURN_SHAPE_FIX_APPLIED
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_export_plus_template_graph_equiv
report_persistence_commit: f0897ec61b209b5281022ecd32557e72448d66ec
classification: WF61_RETURN_SHAPE_FIXED_INACTIVE_GATE_CLOSED

repo_head_at_start: 1f46638ccce5dad9bcd8d03ac2236cc334ee2a97
template_apply_commit: 8812c1b6f22f92da1b9efa00fbd5d462c7341df3
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
gpt_web_artifact: workflows/patches/d0025-w-wf61-item-return-shape-fix.gpt-web.json

source_template_pre_commit: 1f46638
source_template_post_commit: 8812c1b
live_wf61_pre_versionId: e94c8529-bf3c-4f0e-b09c-2dca6dfa0dad
live_wf61_post_versionId: ab504cd5-1f14-4097-9e78-6aa6cf10cd1a
node_count: 13

target_node_ids:
  - d0025-6104-4004-8004-000000000004
  - d0025-6107-4007-8007-000000000007
  - d0025-6110-4010-8010-000000000010
  - d0025-6111-4011-8011-000000000011
  - d0025-6112-4012-8012-000000000012

mode_before_after: runOnceForEachItem (unchanged on all five)
invalid_array_return_count_before: 5
invalid_array_return_count_after: 0
input_first_in_targets: 0
graph_equivalence: PASS except five jsCode return-shape fields

WF61_state: inactive
runtime_gate: CLOSED
litellm_requests: 0
provider_calls: 0
inference: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
wf40_unchanged: true
wf61_executions_total: 2

NEXT_GATE: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001

REPORT: reports/architecture/d0025_wf61_item_return_shape_fix_apply.md
```
