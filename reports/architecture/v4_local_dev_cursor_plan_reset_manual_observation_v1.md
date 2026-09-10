# V4 Local Dev Cursor plan-reset manual observation V1

**TASK_REF:** `V4_LOCAL_DEV_CURSOR_PLAN_RESET_MANUAL_OBSERVATION_V1`
**Classification:** `PASS`
**BASE_HEAD:** `4367d0336515e23d62ae31ec2e651604598c4356`
**Evidence source:** `operator_screenshot · Cursor → Plan & Usage`
**Evidence date:** 2026-09-10 (Europe/Rome)

## Human gate and observed evidence

The human gate `HUMAN_GATE_CURSOR_PLAN_RESET_DATE` is resolved by the operator
evidence supplied for this task. The screenshot showed `CURRENT PLAN: Pro+`
and the text `Usage limits reset on Sep 19 (9 days left)`.

The screenshot showed no reset time. The governed canonical representation is
therefore date-only:

```text
CURSOR_PLAN=Pro+
CURSOR_PLAN_RESET_DATE=2026-09-19
CURSOR_PLAN_RESET_PRECISION=DATE_ONLY
CURSOR_PLAN_RESET_TIME=NOT_OBSERVED
CURSOR_RESET_TIME_INVENTED=NO
```

Observed usage was preserved as raw provenance and converted arithmetically
to the dashboard's remaining-percent labels:

```text
Cursor Models: 100% used -> 0% remaining
Other Models: 99% used -> 1% remaining
On-Demand Spending: Disabled
Monthly Limit: Disabled
```

No screenshot, payment detail, credential, token, cookie, session, or auth
material was stored.

## Repository implementation

The existing manual authority is now present at
`configs/runtime/quota-observatory/cursor-manual-observation.json`. The
resource observatory accepts additive `plan_reset_date` and
`plan_reset_precision` fields while keeping `plan_reset_at=null` when no time
was observed. Date-only validation is fail-safe and never constructs a
midnight or other synthetic instant. Manual labels remain explicitly
`labels_are_remaining_percent`; raw used values remain under `source_usage`.

The dashboard uses `cursorPlanResetLabel()` for the additive date-only path:
`Reset piano: 19 set 2026`. A precise timestamp, when supplied by future
evidence, continues through the existing Europe/Rome timestamp formatter.
Invalid or absent dates render `Reset piano: Non osservato`.

The usage snapshot is freshness-aware. At validation time the 2026-09-10
manual percentage snapshot was `STALE`, so 0%/1% remain visibly identified as
observed manual values rather than being presented as indefinitely live. The
plan reset date remains available independently and is not converted into a
timestamp because the screenshot contained no time.

## Live validation

- Preflight passed: `branch=main`, `HEAD=origin/main=`
  `4367d0336515e23d62ae31ec2e651604598c4356`, tracked worktree clean.
- The exact `ControlPlane-V4-LocalDevDispatcher` process/task identity was
  checked; only that task was bounded-recycled. New process PID: `47876`.
- Local GET `/dashboard`, `/v1/status`, `/v1/diagnostics`, and
  `/v1/resources`: `200`.
- Sanitized local `/v1/resources` returned
  `cursor.labels.cursor_models=0`, `cursor.labels.other_models=1`,
  `cursor.plan_reset_date=2026-09-19`, `cursor.plan_reset_at=null`,
  `cursor.plan_reset_precision=date`, and
  `collector_id=cursor_manual`.
- Private Tailscale `/dashboard`: `200`. Local and private dashboard bodies
  matched at SHA-256
  `5562adf6aaf1ede75ddbb192c73b4e54a31760f3a54d5c7a460bfd0aa5e53795`.
  Date-only support was present and no visible quota `Effettivo` bar was
  introduced.
- No browser automation, `/v1/tick`, queue/receipt mutation, model load or
  inference, Hermes/ChatGPT Web, n8n, VPS, OLD, or Tailscale mutation occurred.

## Validation

- Manual Cursor focused contract: `FOCUSED_TESTS=PASS`.
- Dashboard quota reset regression: `FOCUSED_TESTS=PASS`.
- Dispatcher regression: `69 passed, 0 failed`.
- Resource observability integrity: `7/7 focused checks passed`.
- Hermes/OpenCode operator visibility: `FOCUSED_TESTS=PASS`.
- Registry V2: `76/76 PASS`.
- `git diff --check`: `PASS`.

```text
HUMAN_GATE_CURSOR_PLAN_RESET_DATE=RESOLVED
CURSOR_PLAN=Pro+
CURSOR_PLAN_RESET_DATE=2026-09-19
CURSOR_PLAN_RESET_PRECISION=DATE_ONLY
CURSOR_PLAN_RESET_TIME=NOT_OBSERVED
CURSOR_MODELS_REMAINING_MANUAL=0
CURSOR_OTHER_MODELS_REMAINING_MANUAL=1
CURSOR_USAGE_SOURCE=OPERATOR_MANUAL_OBSERVATION
CURSOR_RESET_TIME_INVENTED=NO
MODEL_INFERENCE_CALLS=0
```

`#73` and `ISSUE_73_PHASE_C=PASS` remain unchanged; Phase D is not claimed.
NEXT is `V4_HERMES_PRIVATE_NOVNC_OPERATOR_LINK_V1`.
