# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_BIGMODEL_CN_CODING_ENDPOINT_REMEDIATION
result_cursor: PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: d0a324f971a915e151dd022f23fc0001159b38ea
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

ZAI_PROFILE_PRESENT_BEFORE: true
ZAI_PROFILE_ID_BEFORE: zai:manual
ZAI_AUTH_TYPE_BEFORE: api_key

ZAI_BASE_ENDPOINT_BEFORE: https://api.z.ai/api/coding/paas/v4
ZAI_BASE_ENDPOINT_AFTER: https://open.bigmodel.cn/api/coding/paas/v4

CONFIG_MUTATION_APPLIED: true
MUTATION_SCOPE: models.providers.zai.baseUrl only

ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROFILE_ID_AFTER: zai:manual
ZAI_AUTH_TYPE_AFTER: api_key

EXACT_GLM53_MODEL_REF_VISIBLE_AFTER: true
EXACT_GLM52_MODEL_REF_VISIBLE_AFTER: true

CREDENTIAL_REENTRY: false
AUTH_SECRET_CHANGED: false
AUTH_SECRET_VALUE_READ: false

PROVIDER_REQUEST_COUNT: 0
MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

CORE_PLUGIN_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
SECRET_VALUES_PERSISTED: false

NEXT_GATE_CLASSIFICATION: GLM_BIGMODEL_CN_POST_REMEDIATION_SMOKE_GATE_REQUIRED
```

## Evidence boundary

Bounded remediation only: `models.providers.zai.baseUrl` changed from `https://api.z.ai/api/coding/paas/v4` to `https://open.bigmodel.cn/api/coding/paas/v4`. Profile `zai:manual` preserved; no credential re-entry; no provider/model request; gateway remained off. PASS does not prove GLM works — smoke requires a separate gate.

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
