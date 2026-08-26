# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: VPS_OPENCLAW_INSTALL_AND_VERIFY
result_cursor: PASS
result_runtime: PASS_ISOLATED_PREFIX_INSTALL_NO_GATEWAY_NO_AUTH
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 8bde762d0f58620d03596bf499a5b694f4a2c2d2
workspace: clean

OPENCLAW_PACKAGE: openclaw@2026.7.1-2
OPENCLAW_VERSION: 2026.7.1-2
OPENCLAW_ENGINES: '{"node":">=22.22.3 <23 || >=24.15.0 <25 || >=25.9.0"}'
OPENCLAW_DIST_INTEGRITY: sha512-ycF3yPcbjN6bUPeaUx6Mh6vze1hQWoD3CT/wWcmD7a8xaHHHRUaAlaq+lFxMHf1ssEgODVAwjlzYqp2twkYZ7g==
OPENCLAW_DIST_TARBALL: https://registry.npmjs.org/openclaw/-/openclaw-2026.7.1-2.tgz

INSTALL_PREFIX: /opt/openclaw-app
OPENCLAW_BINARY: /opt/openclaw-app/bin/openclaw
OPENCLAW_VERSION_VERIFY: OpenClaw 2026.7.1-2 (0790d9f)
INSTALL_METHOD: npm install -g --prefix /opt/openclaw-app openclaw@2026.7.1-2
ISOLATED_NODE_RUNTIME: /opt/openclaw-node/current

ISOLATED_NODE: v24.19.0
ISOLATED_NODE_ENGINE_COMPATIBLE: true

SYSTEM_NODE_BEFORE: v18.19.1
SYSTEM_NODE_AFTER: v18.19.1
SYSTEM_NPM_BEFORE: 9.2.0
SYSTEM_NPM_AFTER: 9.2.0
DEFAULT_NODE_PATH_UNCHANGED: true
SYSTEM_PATH_OPENCLAW_ABSENT: true

CLAUDE_CODE_BEFORE: 2.1.139 (Claude Code)
CLAUDE_CODE_AFTER: 2.1.139 (Claude Code)
CLAUDE_CODE_REGRESSION: NONE

N8N_BEFORE: root-n8n-1 docker.n8n.io/n8nio/n8n Up 4 days
N8N_AFTER: root-n8n-1 docker.n8n.io/n8nio/n8n Up 4 days Status=running
TAILSCALE_BEFORE: PASS
TAILSCALE_AFTER: PASS

OPENCLAW_STATE_PRE: ABSENT
OPENCLAW_STATE_POST: PRESENT
OPENCLAW_STATE_FILES:
  - /root/.openclaw/state/openclaw.sqlite
OPENCLAW_STATE_NOTE: created automatically by harmless openclaw --version/--help; no auth/config/oauth performed; no secrets dumped

PORT_18789: free
OPENCLAW_PROCESS_RUNNING: false

forbidden_mutations: 0
auth_changes: 0
gateway_changes: 0
service_changes: 0
firewall_changes: 0
n8n_changes: 0
system_node_changes: 0
apt_changes: 0
docker_changes: 0
tailscale_changes: 0

NEXT_GATE_CLASSIFICATION: CODEX_OAUTH_VPS_GATE_READY
```

## Evidence boundary

Questo LATEST è stato persistito direttamente da Cursor dopo verifica runtime SSH su `ionos-n8n` (`reported_via: cursor_direct_persistence`, `independent_verification: cursor_runtime_evidence`).

Il PASS qui significa installazione OpenClaw sotto prefix dedicato con Node isolato verificato, senza gateway start, OAuth, provider mutation o regressioni system/n8n/Tailscale/Claude. Non implica auto-certificazione del commit di persistenza.

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
