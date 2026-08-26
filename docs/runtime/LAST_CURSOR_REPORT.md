# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_BIGMODEL_CN_CURSOR_REQUEST_EVIDENCE_CAPTURE
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 1795718af659f1d45b42cbf0ced031b8416d1ed2
workspace: clean

CURSOR_VERSION: 3.15.6

SAFE_CAPTURE_METHOD_AVAILABLE: false
SAFE_CAPTURE_METHOD: none

CURSOR_GLM_REQUEST_COUNT: 0
CURSOR_AUTOMATIC_RETRY_COUNT: 0

CURSOR_OBSERVED_HOST: n/a
CURSOR_OBSERVED_REQUEST_PATH: n/a
CURSOR_OBSERVED_FULL_URL_SANITIZED: n/a
CURSOR_OBSERVED_MODEL_ID: n/a
CURSOR_OBSERVED_STATUS: n/a
CURSOR_OBSERVED_PROVIDER: n/a
CURSOR_OBSERVED_ADAPTER: n/a
CURSOR_OBSERVED_HEADER_NAMES: n/a

CURSOR_USED_OPENAI_BASEURL_PATH: unknown
CURSOR_USED_CURSOR_VENDOR_MEDIATION: unknown
CURSOR_DIRECT_BIGMODEL_HOST_CONTACT: unknown

ROOT_CAUSE_CLASSIFICATION: EVIDENCE_CAPTURE_NOT_AVAILABLE
BLOCKER: EVIDENCE_CAPTURE_NOT_AVAILABLE

OPENCLAW_PROVIDER_REQUEST_COUNT: 0
OPENCLAW_MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

SECRET_VALUE_READ: false
SECRET_VALUES_PERSISTED: false
PROMPT_CONTENT_PERSISTED: false
RESPONSE_CONTENT_PERSISTED: false

CURSOR_SETTING_MUTATION: false
CURSOR_API_CONFIG_MUTATION: false
OPENCLAW_MUTATION: false
RUNTIME_MUTATION: false

PRECHECK_OPENAI_BASE_URL: https://open.bigmodel.cn/api/coding/paas/v4
PRECHECK_USE_OPENAI_KEY: false
PRECHECK_AVAILABLE_API_KEY_MODELS_COUNT: 0
PRECHECK_GLM52_VENDOR: ZAI

CAPTURE_ELIGIBILITY_NOTES: "No Cursor DevTools/CDP listen port already available; existing logs do not expose live request host/path; OS Get-NetTCPConnection can observe remote IPs only but cannot select/issue the operator GLM 5.2 UI path without settings mutation or non-equivalent agent invocation. Per gate: no GLM request issued."

NEXT_GATE_CLASSIFICATION: GLM_BIGMODEL_CN_CURSOR_REQUEST_EVIDENCE_ESCALATION_GATE_REQUIRED
```

## Evidence boundary

Eligibility gate failed before any Cursor GLM request. Preconditions matched (Cursor 3.15.6; stored Coding Plan baseUrl; useOpenAIKey=false; catalog glm-5.2 vendor ZAI). No already-available safe capture method can both (1) trigger the same UI GLM 5.2 path and (2) observe host/path without proxy/MITM/settings mutation/DevTools enablement. CURSOR_GLM_REQUEST_COUNT remains 0. No secrets/prompts/bodies captured. No OpenClaw/VPS mutation.

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
