# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0009-Z_ZAI_CODING_GLOBAL_CREDENTIAL_REPAIR
result_cursor: PASS_LOCAL_INTEGRATION_REPAIR_READ_ONLY_VERIFIED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: pending_this_commit

repo_head_observed_at_task: 0d4af30c9d29a80605f6bee14a9c8866ef8d46ec
workspace_at_start: clean
active_work: github:issue/8
operator_gate: repair authorized in-band 2026-08-26 (zai-coding-global, Control Plane dashboard key, terminal-only entry)

repair_type: vps_openclaw_zai_coding_global_onboard_official_path
vps: ionos-n8n
openclaw_core: 2026.8.1-beta.3 (5831b80) unchanged
zai_provider_plugin: 2026.8.1-beta.3 (active generation) unchanged
node_runtime: /opt/openclaw-node/current v24.19.0 (system node v18 cannot run core)

onboard_command_surface: zai-coding-global
skip_flags: daemon channels skills hooks search bootstrap ui health
secret_entry: operator interactive terminal (ssh -t) — never in chat
secret_exposed: false
secret_logged: false
secret_persisted_in_github: false

POST_REPAIR_LOCAL_VERIFICATION:
  provider: zai
  baseUrl: https://api.z.ai/api/coding/paas/v4
  baseUrl_matches_expected_global_coding_plan: true
  auth_profile_created: zai:default
  auth_type: api_key
  credential_format: matches documented {32-hex}.{16-alnum} structure (metadata check only, value withheld)
  legacy_profile_zai_manual: still present, still nonconforming, not reused, removal not authorized by this gate
  auth_profile_order_override: none (automatic selection prefers zai:default)
  model_catalog_contains: glm-5.3 glm-5.2 glm-5-turbo glm-5v-turbo glm-5.1
  primary_model: zai/glm-5.3
  alias: GLM -> zai/glm-5.3
  allowed_models: openai/gpt-5.6-sol, zai/glm-5.3
  gateway_service: inactive (unchanged, required by frontier)
  gateway_ports: 18789 free
  residual_processes: none

provider_model_request_count: 0
credential_mutation: true (authorized repair — new zai:default profile written via official onboard path; malformed zai:manual preserved not deleted)
config_mutation: true (authorized repair — baseUrl CN->Global, zai catalog populated, primary model set)
runtime_mutation: false
network_mutation: false
daemon_or_service_mutation: false

LOCAL_VALIDATION: PASS
LIVE_PROVIDER_VALIDATION: BLOCKED (requires new explicit runtime authorization per policy; repair and invocation are separate gates)

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
SECRET_VALUE_HASHED: false
SECRET_VALUE_MEASURED: false
AUTHORIZATION_DATA_EXPOSED: false

NEXT_RECOMMENDED_GATE: explicit runtime authorization for a single bounded live zai/glm-5.3 verification request through the repaired credential, before any broader provider usage or support escalation
```
