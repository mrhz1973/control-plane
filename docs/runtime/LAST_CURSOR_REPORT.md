# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_VPS_CREDENTIAL_CONFIG
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 808572bf6a43eda537d0647f730db706b9d34a6f
workspace: clean

OPENCLAW_VERSION: 2026.7.1-2 (0790d9f)

ZAI_PROVIDER_ID: zai
SECURE_INTERACTIVE_AUTH_SUPPORTED: true
AUTH_COMMAND_FORM: openclaw models auth paste-api-key --provider zai

GLM_ZAI_AUTH_BEFORE: missing
GLM_ZAI_PROVIDER_BEFORE: missing

AUTH_CONFIG_COMMAND_STARTED: true
AUTH_CONFIG_EXIT_CODE: 0
GLM_ZAI_AUTH_CONFIGURED: true

GLM_ZAI_AUTH_AFTER: configured
GLM_ZAI_PROFILE_PRESENT: true
GLM_ZAI_PROVIDER_EFFECTIVE: available

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

MODEL_INVOCATION_COUNT_DURING_TASK: 0
CODEX_INVOCATION_COUNT_DURING_TASK: 0

GATEWAY_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
QWEN_CHANGED: false
SECRET_VALUES_PERSISTED: false
WINDOWS_CREDENTIAL_STATE_COPIED: false

PLUGIN_INSTALL_REQUIRED: true
PLUGIN_INSTALLED: "@openclaw/zai-provider@2026.7.1"
PLUGIN_ID: zai

NEXT_GATE_CLASSIFICATION: GLM_ZAI_VPS_DIRECT_SMOKE_GATE_REQUIRED
```

## Evidence boundary

Official `@openclaw/zai-provider` installed on VPS (required; `models auth login --provider zai` otherwise reported no provider plugins). Credential entered only via visible external interactive console using `models auth paste-api-key --provider zai` (no CLI key argv, no chat paste, no transcript capture). Auth exit 0; profile `zai:manual` present; provider `zai` configured/available. No model invocation. Gateway remained inactive; port 18789 free. No secrets persisted to GitHub.

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
