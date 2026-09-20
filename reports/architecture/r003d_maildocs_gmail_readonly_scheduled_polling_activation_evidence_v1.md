# R003D — Maildocs Gmail read-only scheduled polling activation evidence (2026-09-20)

Bounded activation of scheduled Gmail read-only polling for
`mrhz1973/Automazione-Posta-Documenti-Gdrive` under
`mrhz1973/control-plane#122` / application issue #10.

Supersedes the earlier STOP in this file (CLI publish left `triggerCount=0`
without natural tick; WF01 was unpublished; no restart). Final PASS used
**UI activation** over the existing private SSH tunnel so the running
ActiveWorkflowManager registered the Schedule Trigger without container restart.

```text
RESULT=PASS
TARGET_HOST=ionos-n8n-new
TARGET_HOSTNAME_OBSERVED=ubuntu
N8N_VERSION=2.33.3
IMPLEMENTATION_COMMIT=2bc69f855818ed52947d73f8cd570c48b4364f9c
LOCAL_SUITE=123 passed
CLASSIFIER_PARITY=PASS
CONFIG_DIGEST=975b0fb97d403dbd3ce26d865fcf2b38c0c3b832f1c821d77e993885c31869e7
WORKFLOW_VERSION=r003d-v1

WORKFLOW_ID=WF01GmailShadowR003B
WORKFLOW_NAME=WF01 Gmail Intake Shadow — READ ONLY
WORKFLOW_ACTIVE=true
TRIGGER_COUNT=1
SCHEDULE_TYPE=n8n-nodes-base.scheduleTrigger
SCHEDULE_CADENCE=every 15 minutes
GMAIL_NODE=n8n-nodes-base.gmail message:getAll simple
GMAIL_QUERY=in:inbox newer_than:30d
GMAIL_LIMIT=50
GMAIL_CREDENTIAL_ID=xz6lufyo9JjjBG6i
GMAIL_CREDENTIAL_NAME=Maildocs Gmail — READ ONLY
GMAIL_SCOPE=gmail.readonly (unchanged; no decrypt/export)
PG_CREDENTIAL_ID=aw36feohto4X9BPz

SYNTHETIC_PROBE=PASS (earlier in slice; residual 0)
INACTIVE_MANUAL_DUAL=PASS (exec 357415 finalize, 357416 terminal-skip)
TERMINAL_SKIP_MANUAL=PASS (events 30->46->46; idem_sum 30->31->31)

ACTIVATION_METHOD=n8n UI Active toggle via private SSH tunnel (no CLI publish; no restart)
ACTIVE_WORKFLOWS_TOTAL=5
ACTIVE_COMPOSITION=4 Control Plane unchanged + 1 Maildocs WF01
CP_FOUR_WORKFLOWS_UNCHANGED=YES

NATURAL_TICK_EXEC=357590
NATURAL_TICK_MODE=trigger
NATURAL_TICK_STATUS=success
NATURAL_TICK_TIME=2026-09-20 21:30:51.018+00
NATURAL_GATES=SKIP_TERMINAL:16
BASELINE_TERMINALS=16 CLASSIFIED_SHADOW
AUDIT_DELTA_TERMINALS=0
IDEMPOTENCY_DELTA_TERMINALS=0
EVENTS_TOTAL_BEFORE=46
EVENTS_TOTAL_AFTER=46
IDEM_SUM_BEFORE=31
IDEM_SUM_AFTER=31
NEW_MESSAGES_PROCESSED=0
GMAIL_MUTATION_MISMATCHES=0
GMAIL_COMPARE_COMMON_IDS=16 (Normalize labelIds_raw / unread / INBOX / TRASH / SPAM)

N8N_CONTAINER_ID=d20d2ddb448a279ef37 (unchanged)
N8N_STARTED_AT=2026-09-16T10:07:29… (unchanged)
PG_CONTAINER_ID=62aceb825bffb1746d5 (unchanged)
PG_STARTED_AT=2026-09-07T10:46:04… (unchanged)
LISTENER_DELTA=NONE
SERVICE_RESTART=NONE
PUBLIC_EXPOSURE=NO
OAUTH_SCOPE_CHANGE=NO
DRIVE_ACCESS=NO
SECRETS_EXPOSED=0

ROLLBACK_QUALIFIED=n8n UI deactivate / `n8n unpublish:workflow --id=WF01GmailShadowR003B` (UI preferred for trigger deregistration without restart)
APP_ISSUE_10=COMPLETED
CONTROL_PLANE_ISSUE_122=COMPLETED
```

## Method notes

- Terminal-skip gate: `CLASSIFIED_SHADOW` → `SKIP_TERMINAL` (no classify/finalize).
- Atomic finalize CTE only transitions `DISCOVERED` → `CLASSIFIED_SHADOW` with
  idempotency `ON CONFLICT DO NOTHING` and one audit event.
- Discover upsert may bump `updated_at` on re-poll; material fields
  (status/classification/confidence/workflow_version) and audit/idem counts
  stayed flat for all 16 baseline terminals on the natural tick.
- Public evidence uses `sha256(provider_message_id)[:16]` only.
- Prior STOP (CLI publish without schedule registration) remains historically
  accurate; this file now records the PASS after UI activation + natural tick.
