# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: OPENCLAW_CORE_UPGRADE_FOR_GLM53
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 7054e183e0f3ece19b2999518d98a0d44e253b6f
workspace: clean

OPENCLAW_VERSION_BEFORE: 2026.7.1-2 (0790d9f)
OPENCLAW_TARGET_VERSION: 2026.8.1-beta.3
OPENCLAW_VERSION_AFTER: 2026.8.1-beta.3 (5831b80)

ZAI_PLUGIN_VERSION_BEFORE: 2026.7.1
ZAI_PLUGIN_TARGET_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION_AFTER: 2026.8.1-beta.3

TARGET_COMPATIBILITY_VERIFIED: true
TARGET_SELECTION: "smallest official pair with glm-5.3: openclaw@2026.8.1-beta.3 + @openclaw/zai-provider@2026.8.1-beta.3"

ROLLBACK_METADATA_PREPARED: true
ROLLBACK_LOCATION: /root/openclaw-rollback/glm53-20260826T091609Z
ROLLBACK_EXECUTED: false

EXACT_GLM53_MODEL_REF_VISIBLE: true

ZAI_AUTH_BEFORE: configured
ZAI_AUTH_AFTER: configured
ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROVIDER_AFTER: available

ISOLATED_NODE_VERSION: v24.19.0
SYSTEM_NODE_VERSION_BEFORE: v18.19.1
SYSTEM_NODE_VERSION_AFTER: v18.19.1
SYSTEM_NPM_VERSION_BEFORE: 9.2.0
SYSTEM_NPM_VERSION_AFTER: 9.2.0

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

LAYOUT_NOTE: "npm installed into /opt/openclaw-app/node_modules; bin/lib path relinked to new package; stale 2026.7.1-2 moved into rollback dir"
DOCTOR_FIX_APPLIED: true
DOCTOR_FIX_REASON: "post-upgrade config schema migration required by OpenClaw 2026.8.1-beta.3 (structural only; no credential re-entry)"

NEXT_GATE_CLASSIFICATION: GLM_ZAI_VPS_DIRECT_SMOKE_GATE_REQUIRED
```

## Evidence boundary

Official smallest compatible upgrade on VPS `ionos-n8n`: OpenClaw core `2026.7.1-2` → `2026.8.1-beta.3`, Z.AI provider `2026.7.1` → `2026.8.1-beta.3`. Exact `zai/glm-5.3` now visible. Auth profile `zai:manual` preserved. Gateway remained inactive; port 18789 free. System Node/npm unchanged. No model/Codex invocation. VPS-only rollback metadata prepared; rollback not executed.

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
