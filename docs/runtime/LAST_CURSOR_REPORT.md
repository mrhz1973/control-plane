# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_TRANCHE02_LIVE_EVENT_01
result_cursor: STOP_HTTP_BRIDGE_OUTPUT_INVALID
reported_via: cursor_direct_persistence
starting_head: 13b263fc3f6951791459797d83d0da41e0517f03
trigger_sha: 1a9c08615104185da3178d6dd4b719e8f6346665
final_head: bfdfeb925e82d609ce404fe70933d834a821c4d2

wf40_exec: 286896
wf61_exec: 286897
wf61_status: error
transport_classification: HTTP_BRIDGE_OUTPUT_INVALID
http_status: 0
transport_elapsed_ms: null
transport_body_bytes: 0
cycle_classification: LITELLM_HTTP_FAILURE
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
issue_31: OPEN
workflows_mutated: false
tools_mutated: false
schema_mutated: false
normalizer_mutated: false
case_b_mutated: false

architecture_report: reports/architecture/d0025_glm_tranche02_live_event01.md

NEXT: offline AUTO-VIA diagnose/fix hang-proof bridge output invalidation before another tranche-02 live spend
```
