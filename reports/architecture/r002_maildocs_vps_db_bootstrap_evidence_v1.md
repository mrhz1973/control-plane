# R002 — Maildocs VPS DB bootstrap evidence (2026-09-19)

Bounded additive PostgreSQL bootstrap for project
`mrhz1973/Automazione-Posta-Documenti-Gdrive`, executed from a Cursor agent
under the authorization recorded in `mrhz1973/control-plane#107` and the
execution handoff `docs/execution-handoffs/R002_VPS_DB_BOOTSTRAP_CURSOR.md`
in the application repository.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
TARGET_PUBLIC_IP_OBSERVED=31.70.139.73
PG_CONTAINER=root-postgres-1
PG_CONTAINER_HEALTH_BEFORE=healthy
PG_CONTAINER_HEALTH_AFTER=healthy
N8N_CONTAINER=root-n8n-1
N8N_STATE_BEFORE=running
N8N_STATE_AFTER=running
PG_ADMIN_USER=n8n
PG_ADMIN_DB=n8n
PG_SERVER_VERSION=16.15
SHARED_NETWORK=root_default
PG_CONTAINER_IP=172.18.0.2
N8N_CONTAINER_IP=172.18.0.3
N8N_TO_PG_TCP_REACHABILITY=OK
ROLE_CREATED=maildocs_app
ROLE_FLAGS=LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
ROLE_MEMBERSHIPS=0
DATABASE_CREATED=maildocs
SCHEMA_CREATED=maildocs
MIGRATION_APPLIED=001_core
SCHEMA_MIGRATIONS_ROWS=1 (001_core, single row)
TABLES_CREATED=attachments,documents,drive_objects,email_messages,idempotency_keys,processing_events,schema_migrations
BOOTSTRAP_RUNS=2 (initial + idempotency rerun)
IDEMPOTENCY_RERUN=PASS (no duplicate objects, no errors, version single-row)
PRIV_INSERT_APP_TABLES=OK
PRIV_UPDATE_APP_TABLES=OK
PRIV_SELECT=OK
PRIV_DELETE_APP_TABLES=DENIED_OK
PRIV_TRUNCATE_APP_TABLES=DENIED_OK
PRIV_UPDATE_PROCESSING_EVENTS=DENIED_OK
PRIV_DELETE_PROCESSING_EVENTS=DENIED_OK
PRIV_TRUNCATE_PROCESSING_EVENTS=DENIED_OK
PRIV_CREATE_TABLE_AS_RUNTIME=DENIED_OK
PROBE_ROWS_CLEANUP=OK (admin-side, 0 residual)
LISTENER_DELTA=NONE
NEW_PUBLIC_PORTS=NONE
CONTAINER_RESTARTS=NONE
VPS_REBOOT=NO
UPGRADES=NONE
SECRETS_EXPOSED=0
```

## Method

- read-only preflight over canonical SSH alias `ionos-n8n-new` (identity,
  container health, admin flags from container metadata — admin password never
  read — collision check on DB/role/runtime root);
- application repository transferred to the VPS as a signed-free local git
  bundle and cloned under the approved runtime root
  `/root/local-files/handoff-runtime/automazione-posta-documenti-gdrive/repo`
  at revision `007b895`; no credentials placed on the VPS;
- runtime password generated on the VPS with `openssl rand -base64 36`,
  persisted only in `/root/.maildocs-r002/app_db_password` (root-only, 0600),
  never echoed, never committed;
- `deploy/vps/bootstrap-live.sh` executed twice (initial + idempotency rerun),
  using repository SQL as source of truth;
- privilege probes executed as `SET ROLE maildocs_app` (insert/update allowed
  on application tables; delete/truncate denied everywhere; `processing_events`
  update/delete/truncate denied); probe rows removed afterwards by the admin
  role inside a single `ON_ERROR_STOP` transaction;
- before/after `ss -tln` listener snapshots compared: zero delta;
- containers inspected before/after: health/state unchanged, no restart, no
  publication change (n8n remains `127.0.0.1:5678` only).

## Out of scope / pending

- n8n PostgreSQL credential creation for `maildocs_app` (separate bounded step);
- repository layer, message-id dedupe and attachment SHA-256 runtime tests
  (application issue #2 remains OPEN).
