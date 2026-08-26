# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_CREDENTIAL_REMEDIATION_DOUBLE_PASTE_FIX
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: d81dd054bd52e03b6f5555242feed8f802d1000d
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3 (5831b80)

ZAI_PROFILE_PRESENT_BEFORE: true
ZAI_PROFILE_ID_BEFORE: zai:manual
ZAI_AUTH_TYPE_BEFORE: api_key
STORED_KEY_STRUCTURAL_STATUS_BEFORE: malformed_double_paste

AUTH_REMEDIATION_EXIT_CODE: 0
AUTH_UX: "silent read-s once; structural check; auto-save via stdin paste-api-key; no Y confirm"

ZAI_PROFILE_PRESENT_AFTER: true
ZAI_PROFILE_ID_AFTER: zai:manual
ZAI_AUTH_TYPE_AFTER: api_key
ZAI_PROVIDER_AFTER: available
EXACT_GLM53_MODEL_REF_VISIBLE_AFTER: true

STORED_KEY_STRUCTURAL_STATUS_AFTER: single_nonduplicated_candidate
DOUBLE_PASTE_PATTERN_AFTER: false

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTH_MUTATION: true
CONFIG_MUTATION: false
ENDPOINT_MUTATION: false
CORE_PLUGIN_MUTATION: false
GATEWAY_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false

PROVIDER_REQUEST_COUNT: 0
MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

SECRET_VALUES_PERSISTED: false

NEXT_GATE_CLASSIFICATION: GLM_ZAI_POST_REMEDIATION_SMOKE_GATE_REQUIRED
```

## Evidence boundary

Replaced malformed double-pasted Z.AI credential for profile `zai:manual` on VPS `ionos-n8n`. Operator pasted once in visible console (hidden input); local structural check passed; key piped via stdin to `models auth paste-api-key --provider zai` (exit 0). Postcheck: stored credential is single nonduplicated candidate; profile/provider/`zai/glm-5.3` preserved; gateway off; port free. No model invocation, provider probe, or endpoint change. PASS proves local structural repair only, not provider acceptance.

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
