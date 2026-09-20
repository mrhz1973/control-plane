# R003B — Maildocs n8n Gmail OAuth + read-only shadow canary evidence (2026-09-20)

Bounded Gmail OAuth credential + inactive shadow workflow + read-only canary
for `mrhz1973/Automazione-Posta-Documenti-Gdrive`, executed under
`mrhz1973/control-plane#117` and application issue #8.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
TARGET_PUBLIC_IP_OBSERVED=31.70.139.73
N8N_VERSION=2.33.3
N8N_CONTAINER=root-n8n-1
N8N_CONTAINER_ID=d20d2ddb448a279ef37 (unchanged)
N8N_STARTED_AT=2026-09-16T10:07:29.656011206Z (unchanged)
N8N_BIND=127.0.0.1:5678
PG_CONTAINER=root-postgres-1
PG_CONTAINER_ID=62aceb825bffb1746d5 (unchanged)
PG_STARTED_AT=2026-09-07T10:46:04.514218954Z (unchanged)
ACTIVE_WORKFLOWS=4 (unchanged)
TOTAL_WORKFLOWS=52 (+1 inactive WF01)
CREDENTIAL_COUNT=5

GMAIL_NODE_TYPE=n8n-nodes-base.gmail
GMAIL_CREDENTIAL_TYPE=gmailOAuth2
GMAIL_CREDENTIAL_ID=xz6lufyo9JjjBG6i
GMAIL_CREDENTIAL_NAME=Maildocs Gmail — READ ONLY
GMAIL_CREDENTIAL_PROJECT=LDClSIYXEoEFQyMv
GMAIL_SCOPE=https://www.googleapis.com/auth/gmail.readonly
OAUTH_CALLBACK=http://localhost:5678/rest/oauth2-credential/callback
PRIVATE_ACCESS=SSH_TUNNEL_LOCALHOST_5678
DECRYPTED_CREDENTIAL_EXPORT=NO

WORKFLOW_ID=WF01GmailShadowR003B
WORKFLOW_NAME=WF01 Gmail Intake Shadow — READ ONLY
WORKFLOW_ACTIVE=false
GMAIL_OPERATION=message:getAll
GMAIL_SIMPLE=true
GMAIL_LIMIT=15
DOWNLOAD_ATTACHMENTS=false
MUTATION_OPS_IN_WORKFLOW=NONE

CANARY_EXEC_1=357324 success
CANARY_EXEC_2=357327 success
SAMPLE_SIZE=15
COMMON_IDS=15
MUTATION_MISMATCHES=0
PROOF_FIELDS=labels,unread,in_inbox,in_trash,in_spam

CLASSIFIER=R003A gmail-classification-v1
CONFIDENCE_HIGH=1
CONFIDENCE_MEDIUM=1
CONFIDENCE_LOW=13
MATCHED_RULES=iren.emissione_bolletta,tim.scadenza_fattura
LABELS_TO_ADD_APPLIED=NO
REVIEW_REQUIRED_COUNT=13

LISTENER_DELTA=NONE
SERVICE_RESTART=NONE
PUBLIC_EXPOSURE=NO
GMAIL_MUTATIONS=0
SECRETS_EXPOSED=0

APP_ISSUE_8=COMPLETED
CONTROL_PLANE_ISSUE_117=COMPLETED
```

## Method notes

- Human Google Cloud + n8n Connect completed via private SSH tunnel; no secrets
  shared in chat/GitHub.
- Credential blob never decrypted/exported; scope recorded from operator Custom
  Scopes configuration (`gmail.readonly` only).
- WF01 imported inactive; CLI execute used ephemeral `N8N_RUNNERS_BROKER_PORT`
  overrides `45679`/`45680` (no n8n restart).
- Normalize node maps n8n simple-mode fields `Subject`/`From`/`labels[].id`.
- Public evidence uses SHA-256(message_id)[:16] only; private sample root-only
  on VPS under `/root/.maildocs-r002/`.
- App docs: `docs/r003b-gmail-oauth-discovery-2026-09-20.md`.
