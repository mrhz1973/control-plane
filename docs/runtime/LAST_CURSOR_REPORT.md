# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0010-Z_ZAI_GLM53_LIVE_SMOKE_GLOBAL
result_cursor: BLOCKED_LIVE_PROVIDER_HTTP500
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: pending_this_commit

repo_head_observed_at_task: f44af1b9488a380fffdeddb146fb8f3d304886e3
workspace_at_start: clean
active_work: github:issue/8
operator_gate: live smoke authorized in-band 2026-08-26 (exactly one bounded request)

live_smoke_type: single_bounded_provider_model_request
vps: ionos-n8n
provider: zai
auth_profile_intent: zai:default
model: zai/glm-5.3
surface: zai-coding-global
baseUrl_configured: https://api.z.ai/api/coding/paas/v4
request_url_observed: https://api.z.ai/api/coding/paas/v4/chat/completions
execution_mode: local
thinking: low
retry_count: 0
fallback_count: 0
prompt_class: minimal_bounded_text

HTTP_STATUS: 500
ERROR_CLASS: Internal service error
ELAPSED_MS: 193
EXIT_CODE: 1
TEXT_OUTPUT: none

interpretation: credential repair local PASS remains valid; repaired documented-format zai:default key on Global Coding Plan surface still returns HTTP 500 on first live glm-5.3 request — malformed-credential-alone no longer sufficient as sole explanation for Global surface failure

provider_model_request_count: 1
credential_mutation: false
config_mutation: false
runtime_mutation: false
network_mutation: false
daemon_or_service_mutation: false
gateway_service: inactive unchanged
gateway_ports: 18789 free

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
SECRET_VALUE_HASHED: false
AUTHORIZATION_DATA_EXPOSED: false

NEXT_RECOMMENDED_GATE: real human gate — provider/account support verification or bounded diagnostic on profile selection (zai:manual residual) before any further provider/model request
```
