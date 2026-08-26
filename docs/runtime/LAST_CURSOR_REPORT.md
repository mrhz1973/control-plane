# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: VPS_CODEX_OAUTH_CALLBACK_TUNNEL_RECOVERY
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 5fe85c86b8cea9b0759d84ecb0540925a816a217
workspace: clean

LOCAL_1455_BEFORE: 0
STALE_CMD_COUNT: 0
STALE_SSH_COUNT: 0
VPS_1455_BEFORE: free
VPS_OAUTH_PROCESS_COUNT_BEFORE: 0

CODEX_AUTH_BEFORE: missing

SSH_TUNNEL_BIND: true
LOGIN_INVOCATION_COUNT: 1
CODEX_OAUTH_LOGIN: FAIL

CODEX_AUTH_AFTER: missing
CODEX_AUTH_PROFILE_PRESENT: false
CODEX_PROVIDER_EFFECTIVE: missing

AUTH_STATE_CHANGED: false
AUTH_STATE_PATHS_CHANGED: []
UNEXPECTED_CONFIG_PATHS_CHANGED: []

LOCAL_1455_AFTER: false
OAUTH_TUNNEL_SSH_REMAINS: false
VPS_1455_AFTER: free
VPS_OAUTH_PROCESS_COUNT_AFTER: 0

PORT_18789: free
GATEWAY_RUNNING: false

PLANNER_INVOCATION_COUNT: 0
WINDOWS_AUTH_STATE_COPIED: false
SECRET_VALUES_PERSISTED: false
GLM_CONFIG_CHANGED: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
FIREWALL_CHANGE: false
GATEWAY_CHANGE: false

NEXT_GATE_CLASSIFICATION: BLOCKED_CALLBACK_TUNNEL_OAUTH_FAILED
```

## Evidence boundary

Tunnel bind `127.0.0.1:1455` → VPS `127.0.0.1:1455` established once with `ExitOnForwardFailure=yes`. Exactly one OAuth invocation. Session exited without Codex auth becoming configured; auth remained `missing`. Tunnel closed afterward; local/VPS 1455 free; no OAuth process remains; gateway off. No second OAuth, no secrets persisted. Post-exit URL recovery also unavailable (`BLOCKED_CURRENT_OAUTH_URL_NOT_SURFACED`).

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
