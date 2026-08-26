# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: VPS_CODEX_OAUTH_LOGIN_AND_VERIFY
result_cursor: BLOCKED
result_runtime: BLOCKED_OAUTH_SINGLE_ATTEMPT_FAILED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

operator_stop: true
oauth_retry_forbidden: true

FIRST_OAUTH_INVOCATION_COUNT: 1
RETRY_OAUTH_INVOCATION_COUNT: 0
OAUTH_PROCESS_STILL_RUNNING: true
OAUTH_PROCESS_STILL_RUNNING_DETAIL:
  local:
    - cmd.exe wrapper vps_codex_oauth_login.cmd
    - ssh -tt ionos-n8n openclaw models auth login --provider openai-codex
  vps:
    - openclaw / openclaw-models PIDs observed during status check
  action_taken: REPORT_ONLY_NO_KILL_NO_RETRY

CODEX_AUTH_BEFORE: missing
CODEX_AUTH_AFTER: missing
CODEX_OAUTH_LOGIN: FAILED_OPERATOR_STOPPED
CODEX_AUTH_PROFILE_PRESENT: false
CODEX_PROVIDER_EFFECTIVE: missing

PORT_18789: free
GATEWAY_RUNNING: false
PLANNER_INVOCATION_COUNT: 0

WINDOWS_AUTH_STATE_COPIED: false
SECRET_VALUES_EXPOSED: false

NEXT_GATE_CLASSIFICATION: OAUTH_HEADLESS_CALLBACK_RECOVERY_GATE_REQUIRED
```

## Evidence boundary

OAuth VPS interrotto dall'operatore. Nessun retry. Nessun token/callback/code esposto nel report. Auth Codex sul VPS resta `missing`. Processi OAuth locali/VPS ancora osservati al momento del check — solo report, nessun kill/retry.

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
