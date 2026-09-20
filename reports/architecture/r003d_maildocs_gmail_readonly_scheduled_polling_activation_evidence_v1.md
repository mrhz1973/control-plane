# R003D — Maildocs Gmail read-only scheduled polling activation evidence (2026-09-20)

Bounded attempt to activate scheduled Gmail read-only polling for
`mrhz1973/Automazione-Posta-Documenti-Gdrive` under
`mrhz1973/control-plane#122` / application issue #10.

```text
RESULT=STOP
STOP_REASON=NATURAL_SCHEDULED_TICK_NOT_OBSERVED
IMPLEMENTATION_COMMIT=2bc69f855818ed52947d73f8cd570c48b4364f9c
LOCAL_SUITE=123 passed
CLASSIFIER_PARITY=PASS
CONFIG_DIGEST=975b0fb97d403dbd3ce26d865fcf2b38c0c3b832f1c821d77e993885c31869e7
WORKFLOW_VERSION=r003d-v1
SCHEDULE_CADENCE_CONFIGURED=15m
GMAIL_QUERY=in:inbox newer_than:30d
GMAIL_LIMIT=50

SYNTHETIC_PROBE=PASS (forced 1/0 rollback kept DISCOVERED; valid finalize -> CLASSIFIED_SHADOW; noop second finalize; admin cleanup residual 0)
INACTIVE_MANUAL_DUAL=PASS (exec 357415 finalize, 357416 terminal-skip)
TERMINAL_SKIP_MANUAL=PASS (events 30->46->46; idem_sum 30->31->31; hit_count not inflated on existing keys)
GMAIL_MUTATION_MISMATCHES=0
DB_CLASSIFIED_SHADOW=16 retained
DB_EVENTS=46 retained
DB_IDEMPOTENCY_SUM=31 retained

PUBLISH_CLI=active=true observed in DB (active workflows 4->5)
TRIGGER_COUNT_AFTER_PUBLISH=0
NATURAL_TICK_EXECS_AFTER_17M=0
CLI_WARNING=Changes will not take effect if n8n is running; restart requested by CLI
RESTART_AUTHORIZED=NO

ROLLBACK=n8n unpublish:workflow --id=WF01GmailShadowR003B
ACTIVE_AFTER_ROLLBACK=4
WF01_ACTIVE_AFTER_ROLLBACK=false
CP_FOUR_WORKFLOWS_UNCHANGED=YES
N8N_CONTAINER_ID=d20d2ddb448a279ef37 (unchanged)
PG_CONTAINER_ID=62aceb825bffb1746d5 (unchanged)
LISTENER_DELTA=NONE
SECRETS_EXPOSED=0

APP_ISSUE_10=OPEN
CONTROL_PLANE_ISSUE_122=OPEN
```

## Stop detail

`n8n publish:workflow --id=WF01GmailShadowR003B` flipped `workflow_entity.active`
to true (total active 5) but the running n8n 2.33.3 process did not register
the Schedule Trigger (`triggerCount` remained 0). No natural execution appeared
for >17 minutes after publish. Control-plane #122 forbids n8n restart/recreate.

Rollback used only:
`n8n unpublish:workflow --id=WF01GmailShadowR003B`

Active workflow count returned to 4. Durable Gmail/DB intake rows from
inactive/manual validation were retained.

## Exact next human step

Activate/publish WF01 through the n8n UI over the existing SSH tunnel so the
running ActiveWorkflowManager registers the 15-minute schedule **without**
container restart; then prove one natural tick (terminal-skip + invariants).

Alternatively, authorize a single `root-n8n-1` restart after publish as a
separate control-plane decision (out of scope for #122 as written).
