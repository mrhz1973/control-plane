# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_BIGMODEL_CN_DIRECT_API_CONTROL_REQUEST
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 24438a8d8cb8688306557d72ef6c77eaac6d188f
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

ZAI_PROFILE_PRESENT_BEFORE: true
ZAI_PROFILE_ID_BEFORE: zai:manual
ZAI_AUTH_TYPE_BEFORE: api_key
EFFECTIVE_CONFIGURED_BASE_URL_BEFORE: https://open.bigmodel.cn/api/coding/paas/v4

DIRECT_REQUEST_ENDPOINT: https://open.bigmodel.cn/api/coding/paas/v4/chat/completions
DIRECT_REQUEST_MODEL: glm-5.2
DIRECT_REQUEST_STREAM: false

DIRECT_BIGMODEL_CN_PROVIDER_REQUEST_COUNT: 1
AUTOMATIC_RETRY_COUNT: 0

HTTP_STATUS: 500
RESPONSE_RECEIVED: true
MARKER_MATCH: false

SANITIZED_PROVIDER_ERROR_CODE: "500"
SANITIZED_PROVIDER_ERROR_MESSAGE: "内部服务器错误"
PROVIDER_REQUEST_ID: ""
PROVIDER_TRACE_ID: "f05c09d74c53ca35b8092fead25fe282"

SECRET_LOADED_IN_REQUEST_PROCESS: true
SECRET_EXPOSED: false
SECRET_PERSISTED: false

OPENCLAW_INFER_INVOCATION_COUNT: 0
CURSOR_GLM_REQUEST_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROFILE_ID_AFTER: zai:manual
EFFECTIVE_CONFIGURED_BASE_URL_AFTER: https://open.bigmodel.cn/api/coding/paas/v4

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
ENDPOINT_MUTATION: false
CREDENTIAL_REENTRY: false
CREDENTIAL_REPLACEMENT: false
RUNTIME_MUTATION: false

DIRECT_BIGMODEL_CN_API_CONTROL: BLOCKED
ROOT_CAUSE_CLASSIFICATION: DIRECT_BIGMODEL_CN_API_OR_ACCOUNT_PLAN_PATH_BLOCKED_INDEPENDENT_OF_OPENCLAW_INFER
BLOCKER: BLOCKED_DIRECT_BIGMODEL_CN_API_HTTP500
NEXT_GATE_CLASSIFICATION: GLM_BIGMODEL_CN_DIRECT_API_HTTP500_DIAGNOSIS_REQUIRED
```

## Evidence boundary

Exactly one in-process HTTPS POST to BigModel CN Coding Plan `/chat/completions` using `zai:manual` loaded only inside the Node process (no argv/env/file dump of the key). OpenClaw infer/adapter bypassed. Provider returned HTTP 500 (`内部服务器错误`) with response header `ga-traceid` captured as PROVIDER_TRACE_ID only. No retry. No auth/config/endpoint mutation. Gateway remained off.

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
