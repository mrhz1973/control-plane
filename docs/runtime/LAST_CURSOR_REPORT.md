# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_CODING_PLAN_POST_REMEDIATION_52_SMOKE
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 50e4bb1fc866c3bb056f87201b0a2ef6e3c87cf2
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

MODEL_USED: zai/glm-5.2

ZAI_PROFILE_PRESENT_BEFORE: true
ZAI_PROFILE_ID_BEFORE: zai:manual
ZAI_PROVIDER_BEFORE: available

EFFECTIVE_ZAI_BASE_ENDPOINT_BEFORE: https://api.z.ai/api/coding/paas/v4
EXACT_GLM52_MODEL_REF_VISIBLE_BEFORE: true

CODING_PLAN_GLM52_SMOKE_INVOCATION_COUNT: 1
AUTOMATIC_RETRY_COUNT: 0

GLM53_INVOCATION_COUNT_THIS_TASK: 0
GLM51_INVOCATION_COUNT_THIS_TASK: 0
GLM5_INVOCATION_COUNT_THIS_TASK: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

SMOKE_EXIT_CODE: 1
SMOKE_RESPONSE_RECEIVED: true
SMOKE_MARKER_MATCH: false
SANITIZED_PROVIDER_ERROR: "500 Internal service error (provider=zai model=glm-5.2)"
OBSERVED_REQUEST_URL_SANITIZED: "https://api.z.ai/api/coding/paas/v4/chat/completions"

ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROFILE_ID_AFTER: zai:manual
ZAI_PROVIDER_AFTER: available
EFFECTIVE_ZAI_BASE_ENDPOINT_AFTER: https://api.z.ai/api/coding/paas/v4
EXACT_GLM52_MODEL_REF_VISIBLE_AFTER: true

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
ENDPOINT_MUTATION: false
CREDENTIAL_REENTRY: false
CORE_PLUGIN_MUTATION: false
GATEWAY_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false

SECRET_VALUES_PERSISTED: false

BLOCKER: BLOCKED_ZAI_PROVIDER_HTTP_500_INTERNAL_SERVICE_ERROR
NEXT_GATE_CLASSIFICATION: BLOCKED_ZAI_PROVIDER_HTTP_500_INTERNAL_SERVICE_ERROR
```

## Evidence boundary

Exactly one local smoke: `openclaw infer model run --local --model zai/glm-5.2` with the required marker prompt. Effective baseUrl remained Coding Plan (`/api/coding/paas/v4`). Transport hit `https://api.z.ai/api/coding/paas/v4/chat/completions` and returned provider HTTP 500. No retry, no fallback model, no auth/config/endpoint mutation. Gateway remained off.

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
