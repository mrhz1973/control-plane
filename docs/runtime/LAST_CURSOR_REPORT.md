# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_52_DIRECT_SMOKE_EXACT
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: abf168d394e38425d33775169c1635d47423b85f
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3 (5831b80)
MODEL_USED: zai/glm-5.2

EXACT_GLM52_MODEL_REF_VISIBLE: true

STORED_KEY_STRUCTURAL_STATUS: single_nonduplicated_candidate
DOUBLE_PASTE_PATTERN: false

DIRECT_COMMAND_FORM: "openclaw infer model run --local --model zai/glm-5.2 --prompt <text>"

GLM52_SMOKE_INVOCATION_COUNT: 1
AUTOMATIC_RETRY_COUNT: 0
GLM53_INVOCATION_COUNT_THIS_TASK: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

SMOKE_EXIT_CODE: 1
SMOKE_RESPONSE_RECEIVED: false
SMOKE_MARKER_MATCH: false
SANITIZED_PROVIDER_ERROR: "500 Internal service error (provider=zai model=glm-5.2)"
OBSERVED_REQUEST_URL_SANITIZED: "https://api.z.ai/api/paas/v4/chat/completions"

BLOCKER: BLOCKED_ZAI_PROVIDER_HTTP_500_INTERNAL_SERVICE_ERROR

ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROVIDER_AFTER: available
EXACT_GLM52_MODEL_REF_VISIBLE_AFTER: true

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
ENDPOINT_MUTATION: false
CORE_PLUGIN_MUTATION: false
GATEWAY_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
SECRET_VALUES_PERSISTED: false

NEXT_GATE_CLASSIFICATION: GLM_ZAI_ENDPOINT_PRODUCT_COMPATIBILITY_GATE_REQUIRED
```

## Evidence boundary

Exact `zai/glm-5.2` was locally visible. Exactly one direct/local smoke on VPS `ionos-n8n` via OpenClaw `2026.8.1-beta.3`. Provider returned HTTP 500 Internal service error on general `…/api/paas/v4/chat/completions`; no text; marker not matched. No retry. No 5.3/5.1/5 fallback. No auth/config/endpoint mutation. Gateway remained inactive.

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
