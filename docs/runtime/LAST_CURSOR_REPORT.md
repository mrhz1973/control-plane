# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: CODEX_VPS_DIRECT_SMOKE
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: ef2e53a2b2cf7f2507e05bef35dea24e5c480285
workspace: clean

OPENCLAW_VERSION: 2026.7.1-2 (0790d9f)
CODEX_AUTH_BEFORE: configured
CODEX_PROVIDER_BEFORE: usable
PORT_18789_BEFORE: free
GATEWAY_RUNNING_BEFORE: false

DIRECT_LOCAL_COMMAND_SUPPORTED: true
DIRECT_COMMAND_FORM: openclaw infer model run --local --model <provider/model> --prompt <text>
EXPLICIT_MODEL_SELECTION_SUPPORTED: true

MODEL_INVOCATION_COUNT: 1
SMOKE_EXIT_CODE: 0
SMOKE_RESPONSE_RECEIVED: true
SMOKE_MARKER_MATCH: true

CODEX_AUTH_AFTER: configured
CODEX_PROVIDER_AFTER: usable
PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTOMATIC_RETRY_COUNT: 0

GATEWAY_MUTATION: false
SERVICE_MUTATION: false
AUTH_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
GLM_CONFIG_CHANGED: false
QWEN_CHANGED: false
SECRET_VALUES_PERSISTED: false

NEXT_GATE_CLASSIFICATION: CODEX_VPS_SMOKE_PASS_NEXT_PROVIDER_OR_BROKER_GATE_REQUIRED
```

## Evidence boundary

Exactly one direct/local OpenClaw inference on VPS `ionos-n8n` via `infer model run --local` with explicit `openai/gpt-5.5` selection. Prompt required exact marker `CODEX_VPS_SMOKE_OK`. Exit 0; marker matched. No gateway/service start, no auth mutation, no n8n/Docker/Tailscale change, no GLM/Qwen change, no retry, no secrets persisted.

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
