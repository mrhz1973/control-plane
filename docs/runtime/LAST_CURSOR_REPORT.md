# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_VPS_CREDENTIAL_REFRESH
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: e31a7eff241d572b9ef435965a589d782b8796ca
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3 (5831b80)
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

ZAI_AUTH_BEFORE: configured
ZAI_PROFILE_PRESENT_BEFORE: true
ZAI_PROVIDER_BEFORE: available

SECURE_INTERACTIVE_AUTH_SUPPORTED: true
AUTH_COMMAND_FORM: "read -s into shell var; printf | openclaw models auth paste-api-key --provider zai"

AUTH_REFRESH_COMMAND_STARTED: true
AUTH_REFRESH_EXIT_CODE: 0
ZAI_CREDENTIAL_REFRESHED: true

ZAI_AUTH_AFTER: configured
ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROVIDER_AFTER: available
EXACT_GLM53_MODEL_REF_VISIBLE_AFTER: true

MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTH_MUTATION: true
CONFIG_MUTATION: false
GATEWAY_MUTATION: false
SERVICE_MUTATION: false
CORE_PLUGIN_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
SECRET_VALUES_PERSISTED: false
WINDOWS_CREDENTIAL_STATE_COPIED: false

NOTE: "Masked login/--force abandoned per operator; stdin paste-api-key path used. No model smoke."

NEXT_GATE_CLASSIFICATION: GLM_ZAI_VPS_DIRECT_SMOKE_RETRY_GATE_REQUIRED
```

## Evidence boundary

Z.AI credential refresh on VPS `ionos-n8n` for OpenClaw `2026.8.1-beta.3`. Operator entered key only in visible SSH console via silent `read -s`, piped to `models auth paste-api-key --provider zai` (no key in argv). Exit 0. Profile `zai:manual` present; provider available; exact `zai/glm-5.3` visible. Gateway inactive; port 18789 free. No model/Codex/Qwen invocation. No secrets persisted to GitHub.

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
