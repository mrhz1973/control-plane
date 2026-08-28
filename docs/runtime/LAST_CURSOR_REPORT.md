# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PHASE_B_LIVE_READONLY_PREFLIGHT
result_cursor: PASS_D0025_PHASE_B_LIVE_READONLY_PREFLIGHT_WF40_MATCH_WF60_MATCH
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_ssh_readonly_preflight
report_persistence_commit: pending
classification: D0025_PHASE_B_LIVE_READONLY_PREFLIGHT_PASS

repo_head_observed_at_task: aab375c4490135205a168ceb50b0a9a70fe81b01
workspace_at_start: clean
operator_gate_ref: github:issue/31
issue_31_state: OPEN

PRECHECK:
  fetch_ff_only: PASS
  core_boot: PASS
  teamviewer_network_mutations: 0

ACCESS_METHOD:
  vps_ssh: ionos-n8n
  n8n_api: not_used
  n8n_api_key_in_container: absent
  workflow_read: n8n_export_workflow_cli_inside_root-n8n-1

WF40_LIVE:
  id: 9ZMj2ACTKyDVhCue
  name: "40 - CP v4 multirepo + classifier bridge - ACTIVE"
  active: true
  versionId: 86ed5569-ce2b-49bb-9f3b-30f4e7fa918b
  nodeCount: 35
  ifNewCommit: present
  ifPlanDetected: present
  wf60ExecuteCount: 1
  wf60Target: d0015600-4001-8001-0001-0653506aabcd
  plannerSelectionNode: absent
  litellmNode: absent
  pm21Classifier: present_not_planner_selection
  repo_delta_class: MATCH

WF60_LIVE:
  id: d0015600-4001-8001-0001-0653506aabcd
  exists: true
  name: "60 - OpenClaw broker fallback resolver - tailnet private - GPT-Web authored"
  active: false
  versionId: dacd0594-5e5a-41e8-a6cc-6088c5f7c14c
  nodeCount: 7
  health_resolver_only: true
  provider_invocation_added: false
  repo_delta_class: MATCH

N8N_SURFACE:
  class: docker_container_root_n8n_1_on_root_default_loopback_5678
  container: root-n8n-1
  image: docker.n8n.io/n8nio/n8n
  n8n_version: "2.19.5"
  container_node: v24.14.1
  host_node: v18.19.1
  host_os: Ubuntu_6.8.0-138-generic
  network: root_default
  container_ip_class: 172.18.0.2
  port_binding: 127.0.0.1:5678

CONTROL_PLANE_TOOLS:
  available_on_n8n_surface: false
  control_plane_mount_under_handoff_runtime: absent
  handoff_runtime_dirs: [dev-method, cursor-coordinate-converter, Planet-Clone, _quarantine]

SCHEMA_ENGINE:
  ajv_on_vps_host: false
  ajv_on_n8n_container: false
  control_plane_ajv_env_on_n8n: unset

LITELLM_PLACEMENT:
  preferred_class: B_sibling_docker_container_on_root_default
  candidate_url_class: http://litellm-primary:4000/v1/responses
  public_exposure_required: false
  install_started_this_pass: false

PLANNER_INGRESS_GAP:
  confirmed_live: true
  planner_selection_v1_producer: absent
  openclaw_consumer_input_v1_producer: absent
  pm21_not_promoted: true

BUDGET_THIS_PASS:
  provider_calls: 0
  inference: 0
  workflow_mutations: 0
  network_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
