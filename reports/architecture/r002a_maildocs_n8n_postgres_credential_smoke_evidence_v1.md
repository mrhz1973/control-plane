# R002A — Maildocs n8n Postgres credential + connectivity smoke evidence (2026-09-19)

Bounded n8n credential creation and non-active connectivity smoke for project
`mrhz1973/Automazione-Posta-Documenti-Gdrive`, executed from a Cursor agent
under the authorization recorded in `mrhz1973/control-plane#111` and the
execution handoff `docs/execution-handoffs/R002A_N8N_POSTGRES_CREDENTIAL_CURSOR.md`
in the application repository.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
TARGET_PUBLIC_IP_OBSERVED=31.70.139.73
N8N_VERSION=2.33.3
N8N_CONTAINER=root-n8n-1
PG_CONTAINER=root-postgres-1
SHARED_NETWORK=root_default
CREDENTIAL_ID=aw36feohto4X9BPz
CREDENTIAL_NAME=Maildocs PostgreSQL — maildocs_app
CREDENTIAL_TYPE=postgres
CREDENTIAL_OWNER_PROJECT=LDClSIYXEoEFQyMv (personal project, owner mrhz1973@gmail.com)
CREDENTIAL_SHARED_ROLE=credential:owner
CREDENTIAL_COUNT_BEFORE=3
CREDENTIAL_COUNT_AFTER=4 (delta +1 exactly)
CREDENTIAL_DATA_ENCRYPTED_IN_N8N_DB=YES (no plaintext at rest; imported via CLI, never exported)
PG_HOST_REPRESENTATION=root-postgres-1 (Docker DNS on root_default; public IP NOT used)
PG_PORT=5432
PG_SSL=disable (private Docker network)
PG_SSH_TUNNEL=disabled
TEMP_SMOKE_WORKFLOW_ID=R002aSmoke00001x
TEMP_SMOKE_WORKFLOW_NAME=MAILDOCS R002A POSTGRES CONNECTIVITY SMOKE — INACTIVE
TEMP_SMOKE_WORKFLOW_ACTIVE=FALSE (never activated/published)
SMOKE_EXECUTE_MODE=server CLI `n8n execute --id=...` (process-local N8N_RUNNERS_BROKER_PORT override to avoid clash with live server task broker; server env/compose untouched)
CONNECTIVITY_RESULT=current_database=maildocs; current_user=maildocs_app; current_schema=public; postgres_version=PostgreSQL 16.15
PRIV_INSERT_IDEMPOTENCY_KEYS=OK
PRIV_SELECT_IDEMPOTENCY_KEYS=OK
PRIV_UPDATE_IDEMPOTENCY_KEYS=OK (hit_count 1 -> 2)
PRIV_DELETE=DENIED_OK (permission denied for table idempotency_keys)
PRIV_TRUNCATE=DENIED_OK (permission denied for table idempotency_keys)
PROBE_ROWS_AFTER_RUNTIME_PHASE=1 (expected; runtime role cannot delete)
PROBE_ROWS_AFTER_ADMIN_CLEANUP=0 (removed by admin role, residual 0)
WORKFLOW_COUNT_BEFORE=50
WORKFLOW_COUNT_AFTER=51 (delta +1 = the temporary smoke workflow only)
ACTIVE_WORKFLOW_COUNT_BEFORE=4
ACTIVE_WORKFLOW_COUNT_AFTER=4 (unchanged)
TEMP_WORKFLOW_DISPOSITION=LEFT_INACTIVE_AND_RECORDED: n8n 2.33.3 server CLI has no workflow delete command (`n8n delete` not found); removal would require a separate gated procedure; workflow is manual-trigger only, never published
N8N_CONTAINER_ID_BEFORE=d20d2ddb448a279ef3
N8N_CONTAINER_ID_AFTER=d20d2ddb448a279ef3
N8N_STARTED_AT_BEFORE=2026-09-16T10:07:29.656011206Z
N8N_STARTED_AT_AFTER=2026-09-16T10:07:29.656011206Z
PG_CONTAINER_ID_BEFORE=62aceb825bffb1746d
PG_CONTAINER_ID_AFTER=62aceb825bffb1746d
PG_STARTED_AT_BEFORE=2026-09-07T10:46:04.514218954Z
PG_STARTED_AT_AFTER=2026-09-07T10:46:04.514218954Z
PG_HEALTH_BEFORE=healthy
PG_HEALTH_AFTER=healthy
EXISTING_CREDENTIALS_UNCHANGED=YES (GitHub account / CONTROL PLANE - Telegram Bot / Header Auth account)
LISTENER_DELTA=NONE
NEW_PUBLIC_PORTS=NONE
SERVICE_RESTART=NONE
COMPOSE_ENV_MUTATION=NONE
GMAIL_DRIVE_ACTIONS=0
SECRETS_EXPOSED=0
```

## Method notes

- Postgres credential schema discovered read-only from the installed
  `n8n-nodes-base` package (16 properties; `ssl` option values
  allow/disable/require; `sshTunnel` flag) before building the credential JSON.
- Password read exclusively on the VPS from the root-only file
  `/root/.maildocs-r002/app_db_password` (0600) by a local Python step that
  wrote the credential JSON; the secret never appeared in shell arguments,
  environment variables, or command output.
- Temporary plaintext credential file existed only as root-owned 0600 on the
  host and node-owned 0600 inside the container, then wiped with verified
  absence (host + container `/tmp` clean).
- One intermediate host-side `docker cp` attempt left a root-owned plaintext
  copy in the container `/tmp` that could not be removed from inside the
  container (containerd snapshotter UID mapping); it was located via
  `/proc/<pid>/mountinfo` upperdir and removed host-side before any successful
  import. Final state: zero plaintext artifacts.
- Credential import required an explicit credential `id` in the JSON array
  (n8n 2.33.3 CLI behavior) and `--projectId` ownership assignment.
- Connectivity and privilege probes ran through the temporary INACTIVE
  workflow executed once via `n8n execute`; DELETE/TRUNCATE denial nodes used
  continue-on-error so denials were captured as evidence, then the probe row
  was removed by the PostgreSQL admin role.

## Pending (out of scope)

- Removal of the temporary smoke workflow (left INACTIVE, reason recorded).
- Runtime use of the credential by real workflows (R003 onward).
