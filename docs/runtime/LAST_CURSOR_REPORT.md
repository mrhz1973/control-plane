# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION_FIX_AND_RESUME
result_cursor: STOP_D0025_RETRY7_LITELLM_HTTP_429_ZAI_5H_USAGE_LIMIT
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_offline_suite_18_18_plus_wf40_rundata_plus_litellm_logs
report_persistence_commit: PENDING_SELF_REFERENCE
classification: PHASE_A_SSE_NORMALIZER_PASS_PHASE_B_ZAI_RATE_LIMIT

repo_head_at_start: 8c35ff7ad01398bb36072ac419dc0de28836c172
authoritative_artifact: docs/runtime/PATCH_D0025_W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION.gpt-web.json
normalizer_commit: a8b051f664c7f6ecc37c1cd468796c4a65dcdf38
targeted_tests: PASS (finalize-sse-output-item-done-without-completed-pass, finalize-sse-no-completed-no-output-fail-closed)
offline_suite: PASS 18/18
phase_a_provider_calls: 0
phase_b_entered: true
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
auto_via_release: github:issue/31#issuecomment-5458616370

trigger_commit_sha: 9b40ff25ca97d09bca393c9294095c272e6330c4
WF40_execution_id: 285015
WF61_execution_id: 285016
litellm_request_delta: 1
provider_attempt_delta: 1
http_status: 429
response_source_format: NOT_REACHED
normalization_classification: NOT_REACHED
terminal_classification: LITELLM_HTTP_FAILURE
terminal_reason_sanitized: Single LiteLLM HTTP attempt did not return 2xx; retry is forbidden (ZAI 5-hour usage limit; reset 2026-08-29 09:12:41)
response_gate: NOT_REACHED
schema_gate: NOT_REACHED
packet_policy: NOT_REACHED
packet_path: null

runtime_gate_before: {enabled: false, provider_calls_authorized_per_event: 0}
runtime_gate_during: {enabled: true, provider_calls_authorized_per_event: 1, allowed_planners: [glm]}
runtime_gate_after: {enabled: false, provider_calls_authorized_per_event: 0}
final_gate_closed: true

WF61_state_before: inactive
WF61_state_during: active_temporarily
WF61_state_after: inactive

retry: 0
fallback: 0
qwen: 0
codex: 0
cursor_dispatch: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
glm_budget: 3/10
litellm_total_v1_responses: 3

NEXT_GATE: after ZAI 5-hour usage window reset 2026-08-29 09:12:41, one bounded resume of D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001 (SSE normalizer already applied)

APPLY_REPORT: reports/architecture/d0025_sse_output_item_done_normalization_fix.md
REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
