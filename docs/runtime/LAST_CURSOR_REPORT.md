# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_TRANCHE02_EVENT02_HTTP_WALL_TIMEOUT_OFFLINE_DIAGNOSIS
result_cursor: PASS_EVIDENCE_INSUFFICIENT
classification: EVIDENCE_INSUFFICIENT
reported_via: cursor_direct_persistence
starting_head: 4668b209587cac8ebd3ffac1f5f3a3e476ba41d2
final_head: PENDING_COMMIT

event02_wf40: 287008
event02_wf61: 287009
dns_current: OK_172.18.0.3
tcp_4000_current: OK
readiness_current: 200
docker_network_current: shared_root_default
litellm_request_seen: false
provider_dispatch_seen: false
post_timeout_completion_seen: false
client_disconnect_seen: false
helper_wall_ms: 115000
provider_calls_delta: 0
tranche_02_glm_used: 0/10
tranche_02_litellm_used: 0/10
historical_litellm_total: 10
gate_closed_final: true
WF61_final: inactive
secondary_6112_json_shape_finding: observed_out_of_scope
issue_31: OPEN
workflows_mutated: false
tools_mutated: false
litellm_config_mutated: false
network_mutated: false

architecture_report: reports/architecture/d0025_tranche02_event02_http_wall_timeout_offline_diagnosis.md

NEXT: smallest additional zero-provider diagnostic — LiteLLM request-start and/or incomplete-request/disconnect observability so the next HTTP_WALL_TIMEOUT can be classified A vs B/C/D deterministically (do not spend tranche 02)
```
