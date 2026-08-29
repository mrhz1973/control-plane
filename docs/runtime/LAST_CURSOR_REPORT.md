# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_TRANCHE02_LIVE_EVENT_03_WITH_NETWORK_OBSERVER
result_cursor: PASS_VALID_EXECUTION_PACKET
classification: HTTP_COMPLETED_PASS
reported_via: cursor_direct_persistence
starting_head: d49d53ba948d98a00ed377d1b1c5a0ff4d8e926c
trigger_sha: 989501e103090bf9a2dea2eb4e62a42c8add36ce
final_head: PENDING_COMMIT

wf40_exec: 287887
wf61_exec: 287888
observer_backend: tcpdump-4.99.4-text-metadata-only
observer_start: 2026-08-29T23:05:38.140Z
observer_end: 2026-08-29T23:10:38.245Z
n8n_to_litellm_seen: true
litellm_to_external_seen: false_ipv4_observer_coverage_gap_ipv6_upstream
client_close_seen: true_clean_fin_at_response
client_close_relative_to_wall_ms: n/a_no_wall
upstream_persisted_after_client_close: n/a
post_timeout_completion_seen: n/a_completion_at_23:08:40.916Z
transport_classification: none_http_200_completed
transport_elapsed_ms: ~96996
http_status: 200
litellm_delta: 1
glm_delta: 1
historical_litellm_total: 11
tranche_02_glm_used: 1/10
tranche_02_litellm_used: 1/10
packet_census: PASS
deterministic_completion: applied_true_final_report_contract
schema_result: PASS
policy_result: GATE
packet_id: EP-D-0025-W-GLM-LIVE-001
packet_status: READY_FOR_GATE
packet_path: docs/packets/EP-D-0025-W-GLM-LIVE-001.json
cursor_dispatch: 0
retry: 0
fallback: 0
qwen: 0
codex: 0
gate_closed_final: true
WF61_final: inactive
runtime_restarts: none
workflows_mutated: false
child_row_287888: stuck_running_recurrence_recorded_not_repaired
secondary_6112_finding: not_encountered_out_of_scope
issue_31: OPEN

architecture_report: reports/architecture/d0025_glm_tranche02_live_event03_with_network_observer.md

NEXT: canonical packet PASS path — advance per packet policy (no auto-dispatch; GATE respected); bounded follow-ups: child-row hang accounting, IPv6 observer coverage; issue #31 OPEN until acceptance complete
```
