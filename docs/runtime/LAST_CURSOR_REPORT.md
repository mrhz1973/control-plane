# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0010-Z_ZAI_GLM53_SINGLE_LIVE_VERIFICATION
result_cursor: COMPLETED_ONE_BOUNDED_REQUEST_OUTCOME_HTTP500
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: pending_this_commit

repo_head_observed_at_task: f44af1b9488a380fffdeddb146fb8f3d304886e3
workspace_at_start: clean
active_work: github:issue/8
operator_gate: live single-request authorized in-band 2026-08-26 (one zai/glm-5.3 request via zai:default, Global Coding Plan, zero retry, zero fallback)

live_request:
  count: 1
  method: POST
  url: https://api.z.ai/api/coding/paas/v4/chat/completions
  provider: zai
  model: glm-5.3
  auth_profile_selection: automatic (prefers zai:default)
  thinking: low
  status: 500
  elapsed_ms: 412
  content_type: application/json
  retry: 0
  fallback: 0
  transport_error: none
  outcome: 500 Internal service error — no text output

post_request_state:
  baseUrl_unchanged: https://api.z.ai/api/coding/paas/v4
  primary_model_unchanged: zai/glm-5.3
  gateway: inactive
  port_18789: free
  config_mutation: false
  auth_mutation: false
  runtime_mutation: false
  network_mutation: false

MATERIAL_FINDING:
  uniform_http500_persists_with_documented_format_credential_on_global_coding_plan
  malformed_zai_manual_credential_no_longer_sole_explanation_for_http500
  remaining_discriminators_include_model_variant_vs_host_geography_vs_key_binding
  prior_local_windows_evidence_shows_same_format_key_family_succeeding_on_same_endpoint_with_glm-5.1

provider_model_request_count: 1 (exactly as authorized)
secret_exposed: false
secret_logged: false
secret_persisted: false
secret_derived_data_persisted: false

NEXT_RECOMMENDED_GATE: real human gate to select the next bounded discriminator (e.g. glm-5.1 vs glm-5.3 on same host/key, or same model from a different egress) or escalate to provider support with sanitized evidence; no further requests without new authorization
```
