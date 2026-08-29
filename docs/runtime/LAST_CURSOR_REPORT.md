# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_TRANCHE02_LIVE_EVENT_02
result_cursor: STOP_HTTP_WALL_TIMEOUT
reported_via: cursor_direct_persistence
starting_head: a5677f6b1f81c3949866920d521ce43045c16858
trigger_sha: 51c0db84ebc8c3d3fef133bfae416341a72a88ed
final_head: ac70a2a8c3425888b1f8b4ce8bd3a1c46f80c47e

wf40_exec: 287008
wf61_exec: 287009
wf61_status: error
transport_classification: HTTP_WALL_TIMEOUT
transport_elapsed_ms: 115003
transport_body_bytes: 0
http_status: 0
not_http_bridge_output_invalid: true
packet_census: unavailable
deterministic_completion: unavailable
schema_result: not_reached
policy_result: not_reached
litellm_delta: 0
glm_delta: 0
tranche_02_glm_used: 0/10
tranche_02_litellm_used: 0/10
historical_litellm_total: 10
cursor_dispatch: 0
retry: 0
fallback: 0
qwen: 0
codex: 0
gate_closed_final: true
WF61_final: inactive
hangproof_preserved_after_restore: true
secondary_6112_json_shape_finding: observed_out_of_scope
issue_31: OPEN
workflows_mutated: false
tools_mutated: false

architecture_report: reports/architecture/d0025_glm_tranche02_live_event02.md

NEXT: offline AUTO-VIA diagnose hang-proof HTTP_WALL_TIMEOUT with LiteLLM delta 0 before another tranche-02 live spend
```
