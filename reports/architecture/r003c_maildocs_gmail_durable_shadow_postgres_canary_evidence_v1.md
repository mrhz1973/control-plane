# R003C — Maildocs durable Gmail shadow → PostgreSQL canary evidence (2026-09-20)

Bounded inactive durable Gmail shadow intake for
`mrhz1973/Automazione-Posta-Documenti-Gdrive`, executed under
`mrhz1973/control-plane#119` and application issue #9.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
TARGET_PUBLIC_IP_OBSERVED=31.70.139.73
N8N_VERSION=2.33.3
IMPLEMENTATION_COMMIT=8194886d0f66a647cddbc905695feeb96c380c15
LOCAL_SUITE=117 passed
CLASSIFIER_PARITY=PASS (Python ↔ generated JS over all R003A fixtures)
CONFIG_DIGEST=975b0fb97d403dbd3ce26d865fcf2b38c0c3b832f1c821d77e993885c31869e7
CLASSIFIER_VERSION=r003a-v1
WORKFLOW_VERSION=r003c-v1

GMAIL_NODE=n8n-nodes-base.gmail@2.2 message:getAll simple limit=15
POSTGRES_NODE=n8n-nodes-base.postgres@2.5 executeQuery parameterized
GMAIL_CREDENTIAL_ID=xz6lufyo9JjjBG6i
GMAIL_CREDENTIAL_NAME=Maildocs Gmail — READ ONLY
PG_CREDENTIAL_ID=aw36feohto4X9BPz
PG_CREDENTIAL_NAME=Maildocs PostgreSQL — maildocs_app

WORKFLOW_ID=WF01GmailShadowR003B
WORKFLOW_NAME=WF01 Gmail Intake Shadow — READ ONLY
WORKFLOW_ACTIVE=false

CANARY_EXEC_1=357375 success
CANARY_EXEC_2=357376 success
RUN1_SAMPLE=15
RUN2_SAMPLE=15
COMMON_IDS=15
DB_EMAIL_ROWS=15 (unique provider+message_id)
DB_IDEMPOTENCY_ROWS=15
DB_IDEMPOTENCY_HIT_COUNT=2 (all common IDs)
DB_PROCESSING_EVENTS=30 (GMAIL_SHADOW_CLASSIFIED; PASS=4 REVIEW_REQUIRED=26)
CLASSIFICATION_ROLLUP=HIGH=1 MEDIUM=1 LOW=13
MATCHED_RULES=iren.emissione_bolletta,tim.scadenza_fattura
LABELS_TO_ADD_APPLIED=NO
GMAIL_MUTATION_MISMATCHES=0
DB_ROWS_RETAINED=YES (real intake state)

ACTIVE_WORKFLOWS_PRE=4
ACTIVE_WORKFLOWS_POST=4
N8N_CONTAINER_ID=d20d2ddb448a279ef37 (unchanged)
N8N_STARTED_AT=2026-09-16T10:07:29.656011206Z (unchanged)
PG_CONTAINER_ID=62aceb825bffb1746d5 (unchanged)
PG_STARTED_AT=2026-09-07T10:46:04.514218954Z (unchanged)
LISTENER_DELTA=NONE
SERVICE_RESTART=NONE
PUBLIC_EXPOSURE=NO
SECRETS_EXPOSED=0

APP_ISSUE_9=COMPLETED
CONTROL_PLANE_ISSUE_119=COMPLETED
```

## Method notes

- Classifier/runtime generated from canonical
  `config/gmail-taxonomy.json` + `config/gmail-provider-rules.json`
  via `tools/build_wf01_gmail_shadow.py` (no hand-copied rule table).
- WF01 imported inactive; CLI execute used broker ports `45681`/`45682`.
- Public evidence uses `sha256(provider_message_id)[:16]` only.
- Successful canary rows retained intentionally as initial durable intake.
