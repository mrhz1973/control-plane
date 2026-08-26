# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: VPS_CODEX_OAUTH_CALLBACK_VISIBLE_CONSOLE_RETRY
result_cursor: PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 781934469f801a1caf3775e8b025a815f97319f8
workspace: clean

LOCAL_1455_BEFORE: 0
STALE_OAUTH_CMD_COUNT: 0
STALE_OAUTH_SSH_COUNT: 0

VPS_1455_BEFORE: free
VPS_OAUTH_PROCESS_COUNT_BEFORE: 0
CODEX_AUTH_BEFORE: missing

EXTERNAL_OAUTH_CONSOLE_OPENED: true
LOGIN_INVOCATION_COUNT: 1
EXTERNAL_CONSOLE_EXIT_CODE: 0
SSH_TUNNEL_BIND_OBSERVED: true

CODEX_OAUTH_LOGIN: PASS
CODEX_AUTH_AFTER: configured
CODEX_AUTH_PROFILE_PRESENT: true
CODEX_PROVIDER_EFFECTIVE: usable

LOCAL_1455_AFTER: free
OAUTH_TUNNEL_SSH_REMAINS: false
VPS_1455_AFTER: free
VPS_OAUTH_PROCESS_COUNT_AFTER: 0

PORT_18789: free
GATEWAY_RUNNING: false

PLANNER_INVOCATION_COUNT: 0
AUTOMATIC_RETRY_COUNT: 0
WINDOWS_AUTH_STATE_COPIED: false
SECRET_VALUES_PERSISTED: false
OAUTH_STDOUT_PERSISTED: false
OAUTH_STDERR_PERSISTED: false

NEXT_GATE_CLASSIFICATION: CODEX_VPS_DIRECT_SMOKE_GATE_READY
```

## Evidence boundary

Exactly one visible external CMD (`CODEX VPS OAUTH - DO NOT CLOSE`) with temporary SSH `-L 127.0.0.1:1455:127.0.0.1:1455` and `ExitOnForwardFailure=yes`. No wrapper file, no OAuth stdout/stderr capture. Console exit 0; Codex auth on VPS became `configured` / provider `usable`. Tunnel closed; local/VPS 1455 free; gateway off; no automatic retry; no secrets persisted.

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
