# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: VPS_ISOLATED_NODE24_INSTALL_AND_VERIFY
result_cursor: PASS
result_runtime: PASS_OPERATOR_RELAYED_CURSOR_EVIDENCE
reported_via: operator_pasted_cursor_output
independent_verification: false
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 69659a7de6b079bbb240201c4baf496e2328ed97
workspace: clean

OFFICIAL_NODE_VERSION: v24.19.0
OFFICIAL_ARCHIVE: node-v24.19.0-linux-x64.tar.xz
CHECKSUM_EXPECTED: 14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647
CHECKSUM_ACTUAL: 14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647
CHECKSUM_VERIFY: PASS

INSTALL_ROOT: /opt/openclaw-node/v24.19.0
CURRENT_SYMLINK: /opt/openclaw-node/current -> /opt/openclaw-node/v24.19.0
ISOLATED_NODE: v24.19.0
ISOLATED_NPM: 11.17.0
ISOLATED_NPX: 11.17.0
ISOLATED_NODE_ENGINE_COMPATIBLE: true

SYSTEM_NODE_BEFORE: v18.19.1
SYSTEM_NODE_AFTER: v18.19.1
SYSTEM_NPM_BEFORE: 9.2.0
SYSTEM_NPM_AFTER: 9.2.0
DEFAULT_NODE_PATH_UNCHANGED: true

CLAUDE_CODE_BEFORE: 2.1.139
CLAUDE_CODE_AFTER: 2.1.139
CLAUDE_CODE_REGRESSION: NONE

N8N_BEFORE: root-n8n-1 running
N8N_AFTER: root-n8n-1 running
TAILSCALE_BEFORE: PASS
TAILSCALE_AFTER: PASS

OPENCLAW_INSTALLED: false
OPENCLAW_STATE_DIR: ABSENT
PORT_18789: free

forbidden_mutations: 0
apt_changes: 0
system_node_changes: 0
openclaw_changes: 0
n8n_changes: 0
docker_changes: 0
tailscale_changes: 0
firewall_changes: 0
service_changes: 0
auth_changes: 0

NEXT_GATE_CLASSIFICATION: B. OPENCLAW_VPS_INSTALL_GATE_READY
```

## Evidence boundary

Questo LATEST è stato persistito da GPT Web a partire dal report Cursor incollato direttamente dall'operatore il 2026-08-26. Il contenuto è quindi **evidence operatore-relayed**, non verifica indipendente del filesystem VPS da parte di GPT Web.

Il PASS qui significa che il report ricevuto soddisfa i criteri deterministici del task e non presenta mutazioni fuori scope. Non implica che il commit che persiste questo file si auto-certifichi.

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
