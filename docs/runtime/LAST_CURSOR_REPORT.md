# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_BIGMODEL_CN_CURSOR_OPENCLAW_DELTA_DIAGNOSIS
result_cursor: PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 46a987f366815e2b1623ff166f1d0f1d4aed74b7
workspace: clean

CURSOR_VERSION: 3.15.6
CURSOR_GLM_PROVIDER_MODE: "catalog_vendor_ZAI_with_stored_openAIBaseUrl_but_useOpenAIKey_false"
CURSOR_MODEL_LABEL: "GLM 5.2"
CURSOR_MODEL_ID_IF_LOCALLY_VISIBLE: "glm-5.2"
CURSOR_OVERRIDE_BASE_URL: "https://open.bigmodel.cn/api/coding/paas/v4"
CURSOR_PROVIDER_COMPATIBILITY_MODE: "OpenAI Base URL override present in storage; useOpenAIKey=false"
CURSOR_OPENAI_COMPATIBLE_MODE: "override stored; BYOK flag disabled"
CURSOR_CUSTOM_MODEL_MODE: false

CURSOR_ACTUAL_REQUEST_URL: unknown
CURSOR_ACTUAL_REQUEST_PATH: unknown
CURSOR_REQUEST_API_STYLE: "openai-compatible chat/completions IF openAIBaseUrl BYOK path used; otherwise Cursor-mediated vendor ZAI unknown-on-wire"
CURSOR_REQUEST_MODEL_FIELD: "catalog serverModelName=glm-5.2; wire id unknown"
CURSOR_STREAM_SETTING: unknown
CURSOR_RELEVANT_HEADER_NAMES: "Content-Type, Authorization (proven only for openAIBaseUrl challenge helper)"
CURSOR_PROVIDER_SPECIFIC_ADAPTER: "availableDefaultModels2 vendor=ZAI for glm-5.2"
CURSOR_PROVIDER_SPECIFIC_TRANSFORM: "openAIBaseUrl normalize: if pathname=='/' then pathname='/v1'; then append '/chat/completions'"

CURSOR_BASE_URL_APPEND_RULE: "pathname '/' -> '/v1'; strip trailing slash; append '/chat/completions'"
CURSOR_RESOLVED_PATH_IF_PROVABLE: "/api/coding/paas/v4/chat/completions (from stored openAIBaseUrl + append rule); NOT proven as the live working call"

OPENCLAW_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3
OPENCLAW_BASE_URL: "https://open.bigmodel.cn/api/coding/paas/v4"
OPENCLAW_RESOLVED_REQUEST_URL: "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions"
OPENCLAW_API_STYLE: openai-completions
OPENCLAW_MODEL_FIELD: "model=glm-5.2"
OPENCLAW_STREAM_SETTING: "stream wrapper; infer uses provider stream path"
OPENCLAW_REASONING_FIELDS: "thinking/reasoning_effort by model family"
OPENCLAW_OPTIONAL_FIELDS: "tool_stream default true"
OPENCLAW_RELEVANT_HEADER_NAMES: "authorization, content-type"

CURSOR_PROVIDER_MODEL_ID: "glm-5.2 (catalog); wire unknown"
OPENCLAW_PROVIDER_MODEL_ID: glm-5.2
MODEL_ID_MATCH: unknown

BASE_URL_MATCH: true
REQUEST_PATH_MATCH: unknown
API_STYLE_MATCH: unknown
MODEL_FIELD_MATCH: unknown
STREAM_SETTING_MATCH: unknown
REASONING_FIELDS_MATCH: unknown
TOOL_PAYLOAD_MATCH: unknown
HEADER_NAME_SET_MATCH: unknown

DELTA_BASE_URL: "none vs stored Cursor openAIBaseUrl; operator-stated UI root https://open.bigmodel.cn/ would resolve to /v1/chat/completions and DIFFER (not current storage)"
DELTA_REQUEST_PATH: unknown
DELTA_MODEL_ID: unknown
DELTA_API_STYLE: unknown
DELTA_STREAM: unknown
DELTA_REASONING: unknown
DELTA_TOOLS: unknown
DELTA_HEADERS: unknown

CURSOR_BIGMODEL_ADAPTER_PRESENT: true
CURSOR_BIGMODEL_ADAPTER_BEHAVIOR: "First-party catalog model glm-5.2 vendor=ZAI; OpenAI override URL stored but useOpenAIKey=false and availableAPIKeyModels empty"
OPENCLAW_EQUIVALENT_PRESENT: "direct openai-completions to Coding Plan baseUrl; no Cursor vendor/cloud adapter"

CURSOR_SUCCESS_LOG_EVIDENCE_AVAILABLE: false
CURSOR_SUCCESS_STATUS: unknown
CURSOR_SUCCESS_HOST: unknown
CURSOR_SUCCESS_PATH: unknown
CURSOR_EFFECTIVE_MODEL_IF_VISIBLE: "operator-reported effective GLM 5.3; not proven in local logs"

ROOT_CAUSE_CLASSIFICATION: CURSOR_WORKING_PATH_NOT_RECONSTRUCTABLE_FROM_LOCAL_EVIDENCE

PROVIDER_REQUEST_COUNT: 0
MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

SECRET_VALUE_READ: false
SECRET_VALUES_PERSISTED: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
ENDPOINT_MUTATION: false
CURSOR_SETTING_MUTATION: false
RUNTIME_MUTATION: false

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

NEXT_GATE_CLASSIFICATION: GLM_BIGMODEL_CN_CURSOR_REQUEST_EVIDENCE_GATE_REQUIRED
```

## Evidence boundary

Read-only only. Cursor 3.15.6 storage: `openAIBaseUrl=https://open.bigmodel.cn/api/coding/paas/v4` (matches OpenClaw), but `useOpenAIKey=false` and `availableAPIKeyModels=[]`. Catalog lists `glm-5.2` under vendor ZAI. Cursor code appends `/chat/completions` after normalizing root `/` to `/v1`. No local log proves the live successful Cursor request host/path. Therefore the working Cursor wire path cannot be reconstructed; no OpenClaw-remediable delta is proven. No secrets read/persisted; no invocations.

## Completion persistence invariant

Per i task Cursor successivi, il report finale non deve restare soltanto nella chat Cursor.

Prima di dichiarare il task completamente chiuso, Cursor deve persistere in GitHub un aggiornamento docs-only di questo file con almeno:

- `task_ref` esatto;
- risultato `PASS|BLOCKED|FAILED`;
- evidence deterministica necessaria al gate/NEXT;
- HEAD/workspace osservati quando pertinenti;
- eventuali mutazioni runtime effettuate;
- `NEXT_GATE_CLASSIFICATION` o blocker esatto;
- nessun secret/token.

La persistenza del report è evidence bookkeeping recuperabile e non amplia lo scope runtime del task.

Se `agg` trova un `LAST_CURSOR_REPORT` che non corrisponde al pass Cursor atteso, deve classificare **`EVIDENCE_NOT_PERSISTED`**, non concludere che il task non sia stato eseguito.

## History

La cronologia precedente del rolling report resta recuperabile nella Git history. Il file corrente privilegia il LATEST necessario a `agg` e al resume lean.
