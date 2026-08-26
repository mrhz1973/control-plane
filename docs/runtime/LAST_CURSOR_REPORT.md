# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: WORK_LOCAL_SYNC_AND_AGG_FRONTIER_PERSISTENCE
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

FRONTIER_UPDATE_COMMIT: d909f0de11256a421efd04e10889e0d933cdcfaa
LOCAL_BRANCH: main
LOCAL_FINAL_HEAD: d909f0de11256a421efd04e10889e0d933cdcfaa
ORIGIN_MAIN: d909f0de11256a421efd04e10889e0d933cdcfaa
REMOTE_MAIN: d909f0de11256a421efd04e10889e0d933cdcfaa
WORKSPACE_CLEAN: true

RUNTIME_MUTATIONS: 0
MODEL_INVOCATIONS: 0
AUTH_MUTATIONS: 0

NEXT_GATE_CLASSIFICATION: CODEX_VPS_DIRECT_SMOKE_GATE_REQUIRED
```

## Evidence boundary

Docs-only local sync + `CURRENT_FRONTIER.md` persistence only. No runtime mutation, no model/provider invocation, no auth mutation. Frontier advanced to `CODEX_VPS_DIRECT_SMOKE_GATE_REQUIRED` at `d909f0de11256a421efd04e10889e0d933cdcfaa`. Local `main` clean and equal to `origin/main` / remote `main` at report time.

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
