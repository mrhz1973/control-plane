# R003E — Maildocs Gmail attachment SHA-256 dedupe canary evidence (2026-09-20)

Bounded inactive WF02 Gmail attachment intake for
`mrhz1973/Automazione-Posta-Documenti-Gdrive` under
`mrhz1973/control-plane#124` / application issue #11.

WF01 (`WF01GmailShadowR003B`) was not modified, replaced, or republished.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
PUBLIC_IP=31.70.139.73
N8N_VERSION=2.33.3
IMPLEMENTATION_COMMIT=17331f94e8b9b024067a8cd68e1676a86b6ba888
LOCAL_SUITE=166 passed
WORKFLOW_VERSION=r003e-v1
CONFIG_DIGEST_PREFIX=64d730124de0c198

WF02_ID=WF02GmailAttachmentsR003E
WF02_NAME=WF02 Gmail Attachment Intake — READ ONLY
WF02_ACTIVE=false
SCHEDULE_TRIGGER=NO
GMAIL_ACCESS=HTTP Request + gmailOAuth2 (messages.get format=full; attachments.get)
GMAIL_CREDENTIAL_ID=xz6lufyo9JjjBG6i
GMAIL_CREDENTIAL_NAME=Maildocs Gmail — READ ONLY
GMAIL_SCOPE=gmail.readonly (unchanged; no decrypt/export)
PG_CREDENTIAL_ID=aw36feohto4X9BPz
DRIVE_ACCESS=0

GMAIL_ATTACHMENT_CONTRACT=stock Gmail node cannot metadata-gate safely; HTTP format=full inventory + per-attachment get; attachmentId unstable across polls
EXECUTION_BINARY_RETENTION_PROOF=PASS (synthetic probe; saveData*=none; binary_data=0; empty execution payload)
SHA_REFERENCE_VECTOR=PASS (UTF-8 R003E-SYNTHETIC-PROBE-v1 → 389b7060…87f4)

REAL_MESSAGES_SELECTED=2 (eligible PDF parents within bounded CLASSIFIED_SHADOW window)
ATTACHMENTS_INVENTORIED>=2
ATTACHMENTS_ELIGIBLE=2
ATTACHMENTS_DOWNLOADED_RUN1=2
ATTACHMENTS_BYTES_RUN1=737957
ATTACHMENTS_HASHED=2 unique content SHA (+ later provider-id duplicate instances retained; no delete)
ATTACHMENT_INSTANCE_IDEMPOTENCY=PASS
SHA_IMMUTABILITY=PASS (atomic CTE; mismatch fail-closed)
CONTENT_DEDUPE_PROOF=PASS (real: 2 SHA each shared by 2 distinct attachment rows; no merge/delete)
DURABLE_SKIP_KEY=(email_message_id, filename_original, size_bytes)

RUN3_EXEC=357719 downloaded_count=0 first_hash_count=0 events_delta=0
RUN4_EXEC=357720 downloaded_count=0 first_hash_count=0 events_delta=0
RUN2_REDOWNLOAD_COUNT=0
RUN2_DUPLICATE_HASH_EVENTS=0
HASHED_ROWS_UNCHANGED=YES
BINARY_DATA_FINAL=0

GMAIL_MUTATION_MISMATCHES=0
GMAIL_COMPARE=labels/unread/INBOX/TRASH/SPAM before==after on hashed parents

WF01_ID=WF01GmailShadowR003B
WF01_ACTIVE=true
WF01_TRIGGER_COUNT=1
ACTIVE_WORKFLOWS_TOTAL=5
ACTIVE_COMPOSITION=4 Control Plane unchanged + 1 Maildocs WF01
WF02_REMAINS_INACTIVE=YES

N8N_CONTAINER_ID=d20d2ddb448a279ef37 (unchanged)
N8N_STARTED_AT=2026-09-16T10:07:29… (unchanged)
PG_CONTAINER_ID=62aceb825bffb1746d5 (unchanged)
PG_STARTED_AT=2026-09-07T10:46:04… (unchanged)
LISTENER_DELTA=NONE
SERVICE_RESTART=NONE
PUBLIC_EXPOSURE=NO
OAUTH_SCOPE_CHANGE=NO
SECRETS_EXPOSED=0

ROLLBACK_QUALIFIED=leave WF02 inactive / `n8n unpublish:workflow --id=WF02GmailAttachmentsR003E` (WF01 untouched)
APP_ISSUE_11=COMPLETED
CONTROL_PLANE_ISSUE_124=COMPLETED
```

## Method notes

- App discovery note (secret-free): `docs/r003e-gmail-attachment-contract-discovery.md` in the application repo.
- Pre-durable-skip Run2 re-downloaded because Gmail `body.attachmentId` changed between polls; residual duplicate HASHED rows retained (admin DELETE of real Gmail attachment rows not authorized).
- Post-fix Run3/Run4 prove no re-download / no additional `GMAIL_ATTACHMENT_HASHED` events for the same durable natural keys.
- No raw attachment bytes, base64, message bodies, OAuth secrets, or decrypted credentials in this evidence.
