# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_PACKET_IPV6_OBSERVER_COVERAGE
result_cursor: PASS_IPV6_OBSERVER_COVERAGE
starting_head: b3aca3be5f340df673ed8fa8a13d3207f2485dae
final_head: aa1d377473697e9359bfe1cf5b370ac7fef8801d
packet_id: EP-D-0025-W-GLM-LIVE-001
operator_gate_resolution_seen: true
observer_ipv4_preserved: true
observer_ipv6_supported: true
ipv6_ingress_test: PASS
ipv6_outbound_test: PASS
ipv6_close_test: PASS
missing_ipv6_fallback_test: PASS
sanitization_test: PASS
tcpdump_payload_capture: none
provider_calls_delta: 0
litellm_responses_delta: 0
glm_delta: 0
historical_litellm_total: 11
tranche_02_glm_used: 1/10
tranche_02_litellm_used: 1/10
gate_closed_final: true
WF61_final: inactive
bugbot_review: PASS_NO_FINDINGS
architecture_report: reports/architecture/d0025_packet_ipv6_observer_coverage.md
checkpoint_path: docs/runtime/CHECKPOINT_D0025_W_PACKET_IPV6_OBSERVER_COVERAGE.md
issue_31: OPEN

NEXT: D0025_W_CHILD_ROW_287888_ACCOUNTING_DIAGNOSIS (do not execute in this pass)
```
