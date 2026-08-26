# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: VPS_CODEX_OAUTH_STALE_PROCESS_RECHECK_READONLY
result_cursor: PASS
result_runtime: PASS_READONLY_STALE_PROCESS_RECHECK
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 218a0d76a0881b14de106337762efc576b63705a
workspace: clean

LOCAL_OAUTH_WRAPPER_RUNNING: true
LOCAL_OAUTH_SSH_RUNNING: true
LOCAL_OAUTH_PROCESS_COUNT: 2
LOCAL_OAUTH_PROCESS_SANITIZED:
  - cmd.exe wrapper vps_codex_oauth_login.cmd
  - ssh.exe associated with ionos-n8n openai-codex login

VPS_OAUTH_LOGIN_RUNNING: false
VPS_OAUTH_PROCESS_COUNT: 0

CODEX_AUTH_CURRENT: missing
CODEX_PROVIDER_CURRENT: missing

PORT_18789: free
GATEWAY_RUNNING: false

mutations: 0
processes_stopped: 0
oauth_invocations: 0
planner_invocations: 0
secret_values_exposed: false

STALE_OAUTH_PROCESS_STATE: PRESENT
NEXT_GATE_CLASSIFICATION: STALE_OAUTH_PROCESS_CLEANUP_GATE_REQUIRED
```

## Evidence boundary

Recheck read-only: processi OAuth locali ancora presenti; nessun login OpenClaw attivo sul VPS; auth Codex ancora `missing`; porta 18789 libera. Nessun kill/retry/OAuth/gateway mutation.

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
