# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF_QUOTING_CORRECTION
result_cursor: PASS
starting_head: 637f087a7190722332cb26dfaaeb8ea599ea1475
final_head: pending_commit

category: ROUTINE
runtime_mutations: 0
workflow_mutations: 0
network_mutations: 0
tailscale_mutations: 0
service_mutations: 0
http_execution_endpoint_requests: 1
cumulative_proof_http_requests: 2
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
secret_exposure: false
wf40_node_count_unchanged: 66
wf61_active: false
d0025_gate_closed: true
live_execution: 0
bugbot_invoked: false

proof_lineage:
  attempt_1:
    task_ref: V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF
    result: STOP
    execution_id: v4-vps-unauthorized-reachability-proof-001
    http_status: 400
    classification: ENDPOINT_CONTENT_TYPE_REJECTED
    reason: APPLICATION_JSON_REQUIRED
    root_cause: curl Content-Type header lost to SSH inline quoting
    stop_evidence: reports/runtime/cursor-stops/20260831T114157Z__V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF.stop.json
  attempt_2:
    task_ref: V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF_QUOTING_CORRECTION
    result: PASS
    execution_id: v4-vps-unauthorized-reachability-proof-002
    authorization_id: V4_VPS_UNAUTHORIZED_REACHABILITY_PROOF_NON_ISSUED_002
    transport: SCP payload + SCP bash script; ssh bash /tmp/v4-vps-proof-002.sh
    http_status: 200
    classification: AUTHORIZATION_REJECTED
    reason_codes: [AUTHORIZATION_ID_NOT_ISSUED]
    execution_performed: false
    adapter_result: null
    replayed: false

post_proof:
  production_registry_entries_empty: true
  listener_127_0_0_1_18791: single active
  tailscale_routes_preserved: true
  funnel_absent: true

artifacts:
  - reports/architecture/v4_windows_local_execution_endpoint_vps_unauthorized_reachability_proof.md

architecture_report: reports/architecture/v4_windows_local_execution_endpoint_vps_unauthorized_reachability_proof.md
NEXT: V4_WF40_EXECUTION_TRANSPORT_PATCH_AUTHORING
```
