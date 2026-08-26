# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0011-Z_ZAI_GLM51_SINGLE_LIVE_DISCRIMINATOR
result_cursor: COMPLETED_ONE_BOUNDED_REQUEST_OUTCOME_HTTP500
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: pending_this_commit

repo_head_observed_at_task: 8cdcc83fcd942219c3b44cd793de362c27bf53ce
workspace_at_start: clean
active_work: github:issue/8
operator_gate: live single-request discriminator authorized in-band 2026-08-26 (one glm-5.1 request via zai:default, Global Coding Plan, zero retry, zero fallback)

live_request:
  count: 1
  method: POST
  url: https://api.z.ai/api/coding/paas/v4/chat/completions
  provider: zai
  model: glm-5.1
  auth_profile_selection: automatic (prefers zai:default)
  thinking: low
  status: 500
  elapsed_ms: 183
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

DISCRIMINATOR_ANALYSIS:
  tested_so_far:
    credential_format: eliminated as sole cause (documented-format key still gets 500)
    model_variant: eliminated as sole cause (glm-5.1 AND glm-5.3 both 500 on VPS)
  cross_host_evidence:
    windows_pc_same_key_family_same_endpoint: glm-5.1 SUCCESS (2026-08-26, local OpenClaw evidence)
    vps_ionos_same_endpoint: glm-5.1 HTTP500 AND glm-5.3 HTTP500
  remaining_discriminators:
    - host egress geography / datacenter IP reputation (VPS IONOS DE vs residential/other egress)
    - VPS-side network path interference (hoster firewall, transparent proxy)
  boundary: no conclusion beyond this evidence; no network test performed or authorized

provider_model_request_count_this_task: 1 (exactly as authorized)
secret_exposed: false
secret_logged: false
secret_persisted: false
secret_derived_data_persisted: false

NEXT_RECOMMENDED_GATE: real human gate — either (a) authorize a bounded VPS egress-path diagnostic (e.g. curl -v to the endpoint from VPS vs from Windows to compare TLS/routing behavior, no auth headers), or (b) escalate to Z.AI support with sanitized evidence including the cross-host asymmetry; no further authenticated requests without new authorization
```
