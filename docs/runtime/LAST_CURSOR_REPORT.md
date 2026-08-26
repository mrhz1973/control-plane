# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: VPS_CODEX_OAUTH_STALE_PROCESS_CLEANUP
result_cursor: PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 6b547856ed50b787e415053a7306b298f9499182
workspace: clean

CMD_MATCH_COUNT: 1
SSH_MATCH_COUNT: 1
CMD_PID: 77468
SSH_PID: 20676
SSH_PARENT_PID: 77468
PROCESS_TREE_MATCH: true
CMD_IDENTITY_RECHECK: PASS
SSH_IDENTITY_RECHECK: PASS

SSH_TERMINATED: true
CMD_TERMINATION: TERMINATED

LOCAL_OAUTH_WRAPPER_RUNNING: false
LOCAL_OAUTH_SSH_RUNNING: false
LOCAL_OAUTH_PROCESS_COUNT: 0

VPS_OAUTH_LOGIN_RUNNING: false
VPS_OAUTH_PROCESS_COUNT: 0

CODEX_AUTH_CURRENT: missing
CODEX_PROVIDER_CURRENT: missing

PORT_18789: free
GATEWAY_RUNNING: false

processes_stopped: 2
unrelated_processes_stopped: 0
oauth_invocations: 0
planner_invocations: 0
auth_mutations: 0
vps_processes_stopped: 0
secret_values_exposed: false

NEXT_GATE_CLASSIFICATION: OAUTH_HEADLESS_CALLBACK_RECOVERY_GATE_REQUIRED
```

## Evidence boundary

Cleanup autorizzato: terminati solo il wrapper `cmd.exe` (`vps_codex_oauth_login.cmd`, PID 77468) e il figlio `ssh.exe` OAuth (PID 20676, parent 77468). Nessun kill generico, nessun kill VPS, nessun retry OAuth, nessuna mutazione auth/gateway. Post-verify locale e VPS a zero processi OAuth; Codex auth ancora `missing`; porta 18789 libera.

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
