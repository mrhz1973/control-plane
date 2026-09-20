# R002D — Maildocs retry state machine live canary evidence (2026-09-20)

Bounded additive migration + live canary of the persistent retry state machine
for `mrhz1973/Automazione-Posta-Documenti-Gdrive`, executed under
`mrhz1973/control-plane#114` and application issue #6 (parent #2).

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
TARGET_PUBLIC_IP_OBSERVED=31.70.139.73
IMPLEMENTATION_COMMIT=2d28b8469f8bb41a422e013ffe7ccec22ba20ca9
LOCAL_SUITE=83 passed
MIGRATION=db/migrations/002_retry_state.sql (additive, IF NOT EXISTS, ON CONFLICT DO NOTHING)
MIGRATION_FIRST_RUN=PASS (CREATE TABLE + INSERT 0 1)
MIGRATION_SECOND_RUN=PASS (NOTICE already exists; INSERT 0 0)
SCHEMA_MIGRATIONS=001_core,002_retry_state (exactly one 002_retry_state row)
RUNTIME_ROLE_SELECT=OK
RUNTIME_ROLE_DELETE=DENIED
RUNTIME_ROLE_TRUNCATE=DENIED
PYTHON_VERSION=3.12.3
PSYCOPG_VERSION=3.3.6
DEPENDENCY_ACQUISITION=PyPI manylinux wheels → scp → isolated venv --no-index (no apt)
CANARY_RUN_ID=r002d-20260920T075100Z-2d28b84
ANCHOR_EMAIL_ID=6

SCENARIO_A=PASS (claim1 attempt=1; duplicate lease_held; fail→RETRY_WAIT +60s; early not_due; claim2 attempt=2; SUCCEEDED; terminal blocked)
SCENARIO_B=PASS (max_attempts=2 exhaustion → REVIEW_REQUIRED attempt=2 next_retry_at=NULL; terminal blocked)
SCENARIO_C=PASS (retryable=false → REVIEW_REQUIRED attempt=1; terminal blocked)
SCENARIO_D=PASS (stale reclaim attempt=2; old token success/failure rejected; NEW token SUCCEEDED)

PRE_CLEANUP=emails=1 retry=4 events=17 foreign=0
RETRY_TERMINAL_STATES=SUCCEEDED,REVIEW_REQUIRED,REVIEW_REQUIRED,SUCCEEDED
EVENT_TYPES=RETRY_CLAIMED,RETRY_READY,RETRY_REVIEW_REQUIRED,RETRY_SCHEDULED,RETRY_STALE_LEASE_RECLAIMED,RETRY_SUCCEEDED
ADMIN_CLEANUP=DELETE 17 events + 4 retry + 0 attachments + 1 email
RESIDUAL=emails=0 retry=0 events=0

N8N_CONTAINER_ID=d20d2ddb448a279ef37 (unchanged)
N8N_STARTED_AT=2026-09-16T10:07:29.656011206Z (unchanged)
PG_CONTAINER_ID=62aceb825bffb1746d5 (unchanged)
PG_STARTED_AT=2026-09-07T10:46:04.514218954Z (unchanged)
PG_HEALTH=healthy
ACTIVE_WORKFLOWS=4 (unchanged)
LISTENER_DELTA=NONE
SERVICE_RESTART=NONE
N8N_MUTATION=NONE
GMAIL_DRIVE_ACTIONS=0
SECRETS_EXPOSED=0

PARENT_APP_ISSUE_2=COMPLETED (all original R002 scope/exit criteria satisfied)
```

## Method notes

- App checkout synced via credential-free git bundle to
  `/root/local-files/handoff-runtime/automazione-posta-documenti-gdrive/repo`
  at `2d28b84`.
- Migration applied via `docker cp` + `psql -f` as admin role `n8n`; table retained.
- Canary used real `MaildocsRepository` with injected timestamps (no real waits).
- Cleanup was DELETE-only, exact run-id scoped; migration/table intentionally kept.
