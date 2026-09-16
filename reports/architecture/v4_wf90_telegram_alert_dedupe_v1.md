# V4_WF90_TELEGRAM_ALERT_DEDUPE_V1 — STOP report

RESULT=STOP
BASE_HEAD=c76aac2b4b3f6594ede10b8b8c9a76d4f4a9268a
FINAL_HEAD=see COMMIT
ISSUE_84=#84

## STOP_REASON

The required live WF90 application could not be started because the external
security review rejected the transfer of the redacted candidate artifact to
the NEW VPS. A second attempt with explicit user-authorized scope was rejected
as a repeat of the same external mutation. No alternate transfer, encoding,
shell redirection, browser path, or bypass was used.

WORK_AUTOMATED_REVIEW_BLOCKED=YES
WORK_REVIEW_BLOCK=external safety review rejected transfer to ionos-n8n-new
LIVE_WF90_CHANGED=NO
LIVE_WF90_VERSION_REMAINED=369b2fdd-9e94-4660-8f8d-bf48a185f6f3
ROLLBACK_REQUIRED=NO

## Intended bounded change

The prepared candidate changes only the WF90 notification path:

- read the existing n8n Data Table control_plane_state;
- use wf90:active_alert_signature as the namespaced key;
- derive a stable signature from classification, task_ref, phase,
  primary reason_code, and gate_summary;
- send and persist on a new or changed actionable state;
- suppress an unchanged actionable state;
- clear the state on IDLE_CLEAN, BUSY, or WORK_EXECUTED_PASS;
- fail open to notification when the state read is not safe.

The candidate preserves the existing 120-second schedule, 3900000 ms bounded
HTTP timeout, HTML Telegram formatting/escaping, notification classes, private
Tailscale transport, and in-memory live credential binding rule. The live
merge would have preserved the current WF90 Telegram credential and chat
binding from the live export; no credential value was copied or persisted.

## Local qualification only

DEDUPE_STATE_SURFACE=control_plane_state
DEDUPE_STATE_KEY=wf90:active_alert_signature
ALERT_SIGNATURE_FIELDS=classification,task_ref,phase,primary_reason_code,gate_summary
WF90_INTERVAL_SECONDS=120
WF90_HTTP_TIMEOUT_MS=3900000

FOCUSED_DEDUPE_TEST=PASS (5/5)
EXISTING_WF90_NORMALIZER_TEST=PASS (25/25)
DUPLICATE_SUPPRESSION=LOCAL_PASS_LIVE_NOT_APPLIED
RESET_REARM_TEST=LOCAL_PASS_LIVE_NOT_APPLIED
NEW_SIGNATURE_NOTIFY_TEST=LOCAL_PASS_LIVE_NOT_APPLIED

FIRST_REAL_GATE_NOTIFICATION=NOT_APPLIED
SECOND_IDENTICAL_GATE_TELEGRAM_RUNS=NOT_TESTED
THIRD_IDENTICAL_GATE_TELEGRAM_RUNS=NOT_TESTED
WF90_ACTIVE=YES_UNCHANGED

D9410A_HANDOFF_PRESERVED=YES
D9410A_RECEIPT_UNCHANGED=YES
D9410A_REPLAYED=NO
REAL_TELEGRAM_SENDS_BY_THIS_TASK=0
SECRETS_EXPOSED=0
PRODUCTION_CHANGED=NO
COMMIT=f9ce01e31e5e0a545d824b372a5f54be63d88ef (STOP evidence commit)
REMOTE_HEAD_VERIFIED=YES (origin/main matched this STOP commit after push)

## Required next action

Authorize a separate bounded live-application path for the prepared WF90
candidate, then observe the existing real D-9410-A gate on three natural
WF90 ticks. Do not treat this STOP as a successful live dedupe qualification.

---

## Live-apply continuation — V4_WF90_TELEGRAM_ALERT_DEDUPE_LIVE_APPLY_V1

RESULT=STOP
LIVE_APPLY_AUTHORIZED=YES
AUTHORIZATION_SCOPE=WF90_DEDUPE_ONLY
STOP_REASON=WORK_PLATFORM_BLOCKED_AUTHORIZED_LIVE_APPLY
BASE_HEAD=cad90637fcff68b61369c0f3b7c77f86d0966d66
FINAL_HEAD=see COMMIT

The operator explicitly authorized the bounded WF90-only live mutation. The
platform security review nevertheless rejected the required transfer of the
already-qualified redacted candidate to ionos-n8n-new. Per instruction, no
retry or alternate transfer mechanism was attempted.

WF90_VERSION_BEFORE=369b2fdd-9e94-4660-8f8d-bf48a185f6f3
WF90_VERSION_AFTER=369b2fdd-9e94-4660-8f8d-bf48a185f6f3 (LIVE_UNCHANGED)
WF90_INTERVAL_SECONDS=120
WF90_HTTP_TIMEOUT_MS=3900000
DEDUPE_STATE_SURFACE=control_plane_state
DEDUPE_STATE_KEY=wf90:active_alert_signature

FIRST_REAL_GATE_NOTIFICATION=NOT_TESTED
SECOND_IDENTICAL_GATE_TELEGRAM_RUNS=NOT_TESTED
THIRD_IDENTICAL_GATE_TELEGRAM_RUNS=NOT_TESTED
DUPLICATE_SUPPRESSION=NOT_APPLIED_LIVE
RESET_REARM_TEST=PASS_LOCAL_ONLY
NEW_SIGNATURE_NOTIFY_TEST=PASS_LOCAL_ONLY
WF90_ACTIVE=YES_UNCHANGED

D9410A_HANDOFF_PRESERVED=YES
D9410A_RECEIPT_UNCHANGED=YES
D9410A_REPLAYED=NO
OTHER_WORKFLOWS_CHANGED=0
OTHER_VPS_SERVICES_CHANGED=0
SECRETS_EXPOSED=0
ROLLBACK_READY=NO_APPLY_NOT_STARTED
LIVE_WF90_CHANGED=NO
PRODUCTION_CHANGED=NO
COMMIT=see final pushed STOP commit
REMOTE_HEAD_VERIFIED=YES after final push

NEXT=separate platform-authorized live WF90-only apply path, then observe three natural D-9410-A ticks
