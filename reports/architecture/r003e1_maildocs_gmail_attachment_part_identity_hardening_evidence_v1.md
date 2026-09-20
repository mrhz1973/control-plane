# R003E.1 — Maildocs Gmail attachment MIME-part identity hardening evidence (2026-09-20)

Additive identity hardening for
`mrhz1973/Automazione-Posta-Documenti-Gdrive` under
`mrhz1973/control-plane#125` / application issue #12.

WF01 unchanged/ACTIVE. WF02 updated INACTIVE only.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
N8N_VERSION=2.33.3
IMPLEMENTATION_COMMIT=0e54d25ef4ab15be71d18491985c50b2b79ad803
LOCAL_SUITE=177 passed
MIGRATION=003_attachment_part_identity
MIGRATION_DOUBLE_RUN=PASS
PROVIDER_PART_ID_COLUMN=PASS
PART_ID_UNIQUE_IDENTITY=PASS
LEGACY_NULL_ROWS_ALLOWED=PASS
SYNTHETIC_SAME_NAME_SIZE_DISTINCT_PARTS=PASS
SYNTHETIC_ATTACHMENT_ID_ROTATION=PASS

REAL_ROWS_RETAINED=YES
REAL_ROWS_RECONCILED=2
REAL_LEGACY_DUPLICATES_RETAINED=4
REAL_AMBIGUOUS_ROWS=0
LIVE_PART_IDS_OBSERVED=2
LIVE_ATTACHMENT_ID_ROTATION_SKIP=PASS
LIVE_NEW_DUPLICATE_ROWS=0
LIVE_REDOWNLOAD_COUNT=0
LIVE_DUPLICATE_HASH_EVENTS=0
GMAIL_MUTATION_MISMATCHES=0

WF01_ACTIVE=true
WF02_ACTIVE=false
ACTIVE_WORKFLOWS_TOTAL=5
N8N_CONTAINER_ID=d20d2ddb448a279ef37
PG_CONTAINER_ID=62aceb825bffb1746d5
PG_CONTAINER_UNCHANGED=YES
N8N_CONTAINER_UNCHANGED=YES
LISTENER_DELTA=NONE
DRIVE_ACCESS=0
SECRETS_EXPOSED=0

APP_ISSUE_12=COMPLETED
CONTROL_PLANE_ISSUE_125=COMPLETED
```

## Notes

- R003E filename+size durable skip superseded by `(email_message_id, provider_part_id)`.
- Legacy R003E HASHED rows with `provider_part_id` NULL retained (no delete/merge).
- Part-canonical live rows use observed Gmail `partId` values; `provider_attachment_id` remains fetch handle.
- Dual WF02 skip runs after part assignment: `downloaded_count=0`, hash events Δ=0, attachment count unchanged.
- Synthetic probes cleaned to residual 0; real Gmail rows not deleted.
- No raw bytes/base64/OAuth secrets in this evidence.
