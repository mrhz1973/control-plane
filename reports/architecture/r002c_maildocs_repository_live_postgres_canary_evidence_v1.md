# R002C — MaildocsRepository live PostgreSQL canary evidence (2026-09-20)

Bounded live canary of the real Python repository package
`src/maildocs` against the already-allocated `maildocs` PostgreSQL database
on `ionos-n8n-new`, executed from a Cursor agent under the authorization
recorded in `mrhz1973/control-plane#112` and the execution handoff
`docs/execution-handoffs/R002C_LIVE_POSTGRES_CANARY_CURSOR.md` in the
application repository (`mrhz1973/Automazione-Posta-Documenti-Gdrive` issue #5).

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
TARGET_PUBLIC_IP_OBSERVED=31.70.139.73
APP_REVISION_EXECUTED=b2821e0cbf290003eb5b56cfa5d4bbd08c1afda7
APP_REVISION_SHORT=b2821e0
CANARY_RUN_ID=r002c-20260920T073704Z-b2821e0
PYTHON_VERSION=3.12.3
PSYCOPG_VERSION=3.3.6
DEPENDENCY_ACQUISITION=workstation PyPI download of manylinux cp312 wheels (psycopg[binary]>=3.1,<4) + scp to VPS + isolated venv --no-index install; no apt/system package mutation
PG_HOST_USED=172.18.0.2 (Docker bridge IP of root-postgres-1 on root_default; public IP NOT used)
PG_PORT=5432
PG_DB=maildocs
PG_USER=maildocs_app
PG_SCHEMA=maildocs
PASSWORD_SOURCE=/root/.maildocs-r002/app_db_password (mode 0600 root:root; never printed; never in argv)
HARNESS=tools/r002c_repository_live_canary.py (secret-free; no DELETE/TRUNCATE/DROP)

EMAIL_FIRST_STATUS=created
EMAIL_SECOND_STATUS=existing
EMAIL_ID_EQUALITY=YES (id=4 both times)
EMAIL_RICH_METADATA_PRESERVED=YES
XMAX_LIVE_CONCLUSION=PASS (created→existing on live PostgreSQL 16.15)

ATTACHMENT_A1_INSTANCE=created_instance→existing_instance (id=7)
ATTACHMENT_A1_CONTENT=content_first_seen
SHA_UPPERCASE_INPUT_STORED_LOWERCASE=YES
SHA_CONFLICT_RAISED_VALUEERROR=YES
SHA_CONFLICT_NO_PARTIAL_METADATA_UPDATE=YES (filename/mime/size/sha unchanged after conflict)

ATTACHMENT_A2_INSTANCE=created_instance (id=11, distinct from A1)
ATTACHMENT_A2_CONTENT=content_seen_before
ATTACHMENT_A2_PRIOR_CONTAINS_A1=YES
ATTACHMENT_A2_SAME_SHA_AS_A1=YES
ATTACHMENT_A3_INSTANCE=created_instance (id=12)
ATTACHMENT_A3_CONTENT=content_first_seen
ATTACHMENT_A3_DIFFERENT_SHA=YES

IDEMPOTENCY_FIRST=created hit_count=1
IDEMPOTENCY_SECOND=hit hit_count=2
IDEMPOTENCY_ROW_COUNT=1

PROCESSING_EVENTS_COUNT=2
PROCESSING_EVENT_IDS=3,4 (distinct)
PROCESSING_EVENTS_APPEND_ONLY=YES

PRE_CLEANUP_COUNTS=emails=1 attachments=3 idem=1 events=2 foreign_run_rows=0
ADMIN_CLEANUP=DELETE-only transaction scoped to exact run-id (events→idem→attachments→emails)
POST_CLEANUP_RESIDUAL=emails=0 attachments=0 idem=0 events=0

N8N_CONTAINER_ID_BEFORE=d20d2ddb448a279ef37
N8N_CONTAINER_ID_AFTER=d20d2ddb448a279ef37
N8N_STARTED_AT_BEFORE=2026-09-16T10:07:29.656011206Z
N8N_STARTED_AT_AFTER=2026-09-16T10:07:29.656011206Z
PG_CONTAINER_ID_BEFORE=62aceb825bffb1746d5
PG_CONTAINER_ID_AFTER=62aceb825bffb1746d5
PG_STARTED_AT_BEFORE=2026-09-07T10:46:04.514218954Z
PG_STARTED_AT_AFTER=2026-09-07T10:46:04.514218954Z
PG_HEALTH_BEFORE=healthy
PG_HEALTH_AFTER=healthy
ACTIVE_WORKFLOW_COUNT=4 (unchanged)
LISTENER_DELTA=NONE
NEW_PUBLIC_PORTS=NONE
SERVICE_RESTART=NONE
COMPOSE_ENV_MUTATION=NONE
N8N_MUTATION=NONE
GMAIL_DRIVE_ACTIONS=0
TEMP_ARTIFACTS_AFTER=venv removed; wheels removed; bundle removed; cleanup SQL shredded; secret-free evidence JSON retained under /root/.maildocs-r002/
PASSWORD_FILE_STILL_0600=YES
SECRETS_EXPOSED=0
```

## Live fixes discovered by the canary (committed before PASS)

1. `AmbiguousColumn` on email upsert: bare `COALESCE(%(field)s, field)` inside
   `ON CONFLICT DO UPDATE` is ambiguous with `EXCLUDED.field` on live PostgreSQL.
   Fix: qualify as `email_messages.<field>` (`f87ba2a`).
2. `append_processing_event` with psycopg `dict_row`: unpacking `fetchone()` as a
   tuple yielded the key `"id"` and `int("id")` failed after commit of the first
   event. Fix: accept both dict and sequence rows (`b2821e0`).

Local suite after both fixes: **53/53 PASS**.

## Method notes

- Application checkout on the VPS updated via credential-free git bundle + scp
  to `/root/local-files/handoff-runtime/automazione-posta-documenti-gdrive/repo`.
- Canary exercised the real `MaildocsRepository` / `maildocs.hashing` only;
  no reimplemented SQL in the harness.
- Cleanup used the PostgreSQL admin role (`n8n`) with DELETE only, exact
  run-id scope gates, and residual-zero verification. Runtime role
  `maildocs_app` never performed DELETE/TRUNCATE.
- n8n was never mutated, restarted, published, or activated.
