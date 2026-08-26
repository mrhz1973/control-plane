# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_VPS_DIRECT_SMOKE_RETRY_EXACT_53
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 76499404aca2638ca34d4f075311d7bc0bc97096
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3 (5831b80)
MODEL_USED: zai/glm-5.3

DIRECT_COMMAND_FORM: "openclaw infer model run --local --model zai/glm-5.3 --prompt <text>"

GLM53_RETRY_INVOCATION_COUNT: 1
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0
AUTOMATIC_RETRY_COUNT: 0

SMOKE_EXIT_CODE: 1
SMOKE_RESPONSE_RECEIVED: false
SMOKE_MARKER_MATCH: false

BLOCKER: BLOCKED_ZAI_AUTH_401_TOKEN_EXPIRED_OR_INCORRECT
SANITIZED_PROVIDER_ERROR: "401 token expired or incorrect (provider=zai model=glm-5.3)"

ZAI_AUTH_AFTER: configured
ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROVIDER_AFTER: available
EXACT_GLM53_MODEL_REF_VISIBLE_AFTER: true

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
CORE_PLUGIN_MUTATION: false
GATEWAY_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
SECRET_VALUES_PERSISTED: false

NEXT_GATE_CLASSIFICATION: GLM_ZAI_PROVIDER_AUTH_REJECTED_AFTER_REFRESH_GATE_REQUIRED
```

## Evidence boundary

Exactly one post-refresh smoke of `zai/glm-5.3` on VPS `ionos-n8n` via OpenClaw `2026.8.1-beta.3`. Precheck: profile present, model visible, gateway off, port free. Provider returned HTTP 401 (token expired or incorrect); no text; marker not matched. No retry. No Codex/Qwen. Auth/config/core/plugin unchanged during this task. Local “configured/available” does not prove provider acceptance.

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
