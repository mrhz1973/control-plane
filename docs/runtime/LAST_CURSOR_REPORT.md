# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0008-Z_ZAI_OFFICIAL_ENDPOINT_AUTODETECT_DIAGNOSIS
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: da99847c61495f316d60988636236d1bc41febd2
workspace_at_start: clean
execution_packet: docs/runtime/ISSUE_8_ZAI_AUTODETECTION_PACKET.yaml
execution_packet_revision: 4

OPENCLAW_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

PLANNER_REQUESTED: codex
PLANNER_USED: codex
PLANNER_FALLBACK_USED: false
CODEX_PLANNER_INVOCATION_COUNT: 4
PLANNER_PACKET_SCHEMA_RESULT: PASS_R4

ZAI_PROFILE_PRESENT: true
ZAI_PROFILE_ID: zai:manual
ZAI_AUTH_TYPE: api_key
EFFECTIVE_ZAI_BASE_ENDPOINT_BEFORE: https://open.bigmodel.cn/api/coding/paas/v4

ZAI_PRIMARY_PROBE_REQUEST_COUNT: 4
AUTOMATIC_RETRY_COUNT: 0
REDIRECT_FOLLOW_COUNT: 0
FIRST_HTTP_SUCCESS_FOUND: false
MATRIX_STOP_REASON: ALL_OFFICIAL_PRIMARY_SURFACES_FAILED

PROBES:
  - invocation_count: 1
    surface: General Global
    endpoint: https://api.z.ai/api/paas/v4/chat/completions
    model: glm-5.2
    http_status: 500
    result_classification: HTTP_UPSTREAM_ERROR
  - invocation_count: 2
    surface: General CN
    endpoint: https://open.bigmodel.cn/api/paas/v4/chat/completions
    model: glm-5.2
    http_status: 500
    result_classification: HTTP_UPSTREAM_ERROR
  - invocation_count: 3
    surface: Coding Global
    endpoint: https://api.z.ai/api/coding/paas/v4/chat/completions
    model: glm-5.3
    http_status: 500
    result_classification: HTTP_UPSTREAM_ERROR
  - invocation_count: 4
    surface: Coding CN
    endpoint: https://open.bigmodel.cn/api/coding/paas/v4/chat/completions
    model: glm-5.3
    http_status: 500
    result_classification: HTTP_UPSTREAM_ERROR

POST_MATRIX_PROVIDER_REQUEST_COUNT: 0
POST_MATRIX_MODEL_INVOCATION_COUNT: 0
DIAGNOSTIC_LOOP_ENTERED: true
DIAGNOSTIC_ROUNDS_COMPLETED: 3
DIAGNOSTIC_MAX_ROUNDS: 3
DIAGNOSTIC_STOP_REASON: REAL_HUMAN_GATE_REQUIRED

ROUND_1_RESULT: "PASS: installed zai-provider 2026.8.1-beta.3 detector endpoints, models, Bearer header name and request body match the authorized matrix; zai:manual metadata is zai/api_key"
ROUND_2_RESULT: "PASS: NTP synchronized; DNS and certificate-validating TLS handshakes pass for api.z.ai and open.bigmodel.cn"
ROUND_3_RESULT: "uniform HTTP 500 across all four official primary surfaces with local routing/profile/clock/DNS/TLS checks passing"

ROOT_CAUSE_CLASSIFICATION: PROVIDER_OR_ACCOUNT_SPECIFIC_UPSTREAM_FAILURE_ACROSS_ALL_OFFICIAL_PRIMARY_SURFACES
CANDIDATE_REMEDIATION: PROVIDER_ACCOUNT_PLAN_ENTITLEMENT_SUPPORT_VERIFICATION
CANDIDATE_REMEDIATION_APPLIED: false
BLOCKER: BLOCKED_ALL_ZAI_OFFICIAL_PRIMARY_SURFACES_HTTP500
NEXT_GATE_CLASSIFICATION: ZAI_PROVIDER_ACCOUNT_PLAN_ENTITLEMENT_SUPPORT_GATE_REQUIRED

ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROFILE_ID_AFTER: zai:manual
EFFECTIVE_ZAI_BASE_ENDPOINT_AFTER: https://open.bigmodel.cn/api/coding/paas/v4
PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

SECRET_LOADED_OPAQUELY_IN_REQUEST_PROCESS: true
SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
SECRET_VALUE_HASHED: false
SECRET_VALUE_MEASURED: false
AUTHORIZATION_DATA_EXPOSED: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
PROFILE_MUTATION: false
ENDPOINT_MUTATION: false
MODEL_CATALOG_MUTATION: false
RUNTIME_MUTATION: false
NETWORK_MUTATION: false
```
