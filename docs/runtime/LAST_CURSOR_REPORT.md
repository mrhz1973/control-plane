# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_VPS_DIRECT_SMOKE
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: e472bb0b1860e2ddb07ffee7f718e576952afdf6
workspace: clean

OPENCLAW_VERSION: 2026.7.1-2 (0790d9f)

ZAI_AUTH_BEFORE: configured
ZAI_PROFILE_PRESENT_BEFORE: true
ZAI_PROVIDER_BEFORE: available

DIRECT_LOCAL_COMMAND_SUPPORTED: true
ZAI_GLM53_MODEL_ID: NOT_FOUND
EXPLICIT_MODEL_SELECTION_SUPPORTED: true
DIRECT_COMMAND_FORM: openclaw infer model run --local --model <provider/model> --prompt <text>

ZAI_MODELS_OBSERVED:
  - zai/glm-4.5
  - zai/glm-4.5-air
  - zai/glm-4.5-flash
  - zai/glm-4.5v
  - zai/glm-4.6
  - zai/glm-4.6v
  - zai/glm-4.7
  - zai/glm-4.7-flash
  - zai/glm-4.7-flashx
  - zai/glm-5
  - zai/glm-5-turbo
  - zai/glm-5.1
  - zai/glm-5.2
  - zai/glm-5v-turbo

GLM_ZAI_MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
AUTOMATIC_RETRY_COUNT: 0

SMOKE_EXIT_CODE: NOT_RUN
SMOKE_RESPONSE_RECEIVED: false
SMOKE_MARKER_MATCH: false

ZAI_AUTH_AFTER: configured
ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROVIDER_AFTER: available

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

GATEWAY_MUTATION: false
SERVICE_MUTATION: false
AUTH_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
QWEN_CHANGED: false
CODEX_CHANGED: false
SECRET_VALUES_PERSISTED: false

BLOCKER: BLOCKED_EXACT_GLM53_MODEL_NOT_AVAILABLE
NEXT_GATE_CLASSIFICATION: BLOCKED_EXACT_GLM53_MODEL_NOT_AVAILABLE
```

## Evidence boundary

Read-only discovery on VPS `ionos-n8n`: Z.AI auth configured (`zai:manual`), provider available. Direct/local invocation form exists (`infer model run --local --model …`). Exact GLM 5.3 model id is **not** exposed by authenticated Z.AI catalog (nearest observed: `zai/glm-5`, `zai/glm-5.1`, `zai/glm-5.2`; no `glm-5.3`). Per authorization, no silent substitution and no invocation. Codex not invoked. Gateway remained inactive; port 18789 free.

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
