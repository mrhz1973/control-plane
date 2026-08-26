# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_VERSION_RESOLUTION
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: f03e741a8c6e02235b300a7d944f1b69448cd19e
workspace: clean

OPENCLAW_VERSION: 2026.7.1-2 (0790d9f)

ZAI_PLUGIN_VERSION_BEFORE: 2026.7.1
ZAI_PLUGIN_VERSION_LATEST_OFFICIAL: 2026.7.1
ZAI_PLUGIN_VERSION_BETA_WITH_GLM53: 2026.8.1-beta.3
PLUGIN_COMPATIBILITY_VERIFIED: false
PLUGIN_COMPATIBILITY_DETAIL: "@openclaw/zai-provider@2026.8.1-beta.3 peerDependencies.openclaw >=2026.8.1-beta.3; host OpenClaw 2026.7.1-2 incompatible for plugin-only upgrade"

GLM53_OFFICIAL_SUPPORT_FOUND: true
GLM53_SUPPORT_PATH: core_upgrade_required

PLUGIN_MUTATION: false
PROVIDER_CONFIG_MUTATION: false
OPENCLAW_CORE_MUTATION: false

EXACT_MODEL_REF_VISIBLE: false

ZAI_AUTH_AFTER: configured
ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROVIDER_AFTER: available
ZAI_PLUGIN_VERSION_AFTER: 2026.7.1

MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

GATEWAY_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
QWEN_CHANGED: false
SECRET_VALUES_PERSISTED: false

BLOCKER: BLOCKED_OPENCLAW_CORE_UPGRADE_REQUIRED
NEXT_GATE_CLASSIFICATION: OPENCLAW_CORE_UPGRADE_GATE_REQUIRED
```

## Evidence boundary

Read-only resolution on VPS `ionos-n8n`. Installed `@openclaw/zai-provider@2026.7.1` (npm `latest`) does **not** expose `zai/glm-5.3` (catalog tops at `glm-5.2`). Official npm beta `@openclaw/zai-provider@2026.8.1-beta.3` **does** define `glm-5.3`, but requires OpenClaw core `>=2026.8.1-beta.3` (peer/`pluginApi`). Current core `2026.7.1-2` is incompatible with a plugin-only upgrade. No supported non-patch config path applied; no alias/fallback/core upgrade/model invocation. Auth unchanged; gateway inactive; port 18789 free.

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
