# V4 Local Dev dashboard quota reset times V1

**TASK_REF:** `V4_LOCAL_DEV_DASHBOARD_QUOTA_RESET_TIMES_V1`
**Classification:** `PASS`
**Base head:** `d283883e71ed9e8657d4771ae99e8ba95004de30`
**Date (UTC):** 2026-09-10

## Layout delta

PRE:

- Codex and GLM presented a generic `Effettivo` bar based on the pool
  headline, followed by per-window bars.
- Pool detail displayed a generic pool reset line.
- Cursor displayed observed labels/allowances but had no plan-reset line.

POST:

- Codex renders the source `rolling` window as `5h` and the source `weekly`
  window as `Settim.`. Each window owns its own bar, percentage, and `Reset:`
  line.
- GLM uses the same shared window renderer. A missing reset is shown as
  `Reset: Non osservato`; a supplied `reset_at` is formatted and displayed.
- The operator-facing `Effettivo` bar/riga is removed from Codex and GLM.
  `pool.remaining_percent` and effective MIN semantics remain in the API and
  internal logic.
- Cursor keeps `Cursor Models`, `Other Models`, and real allowances. It shows
  `Reset piano: <data>` only when `plan_reset_at` is observed; otherwise it
  shows `Reset piano: Non osservato`.
- Resource order remains `workstation → vps → qwen → glm → codex → cursor`.

## Authorities and formatting

Codex/GLM percentages continue to come exactly from each corresponding
`windows[].remaining_percent`. Reset values come from `win.reset_at`, with
`window_ends_at` accepted as the current contract-equivalent fallback. The
generic pool `reset_at` is no longer rendered in the ordinary quota details.

`quotaResetLabel(timestamp)` is the single operator-facing formatter. It
returns `Non osservato` for null/invalid input, uses `Intl.DateTimeFormat` with
`Europe/Rome`, handles CET and CEST, and produces compact Italian output such
as `oggi · 23:16`, `domani · 08:00`, or `16 set · 10:09`. Raw ISO values remain
available only in API/technical data where applicable.

Cursor `loadCursorManualObservation()` accepts the additive optional
`plan_reset_at` field and exposes it read-only as `quotas.cursor.plan_reset_at`.
No `ACCOUNTING_MAPPING` qualification was added; it remains `UNVERIFIED`.
The repository currently has no observed Cursor plan-reset value, so the live
dashboard correctly shows `Reset piano: Non osservato`.

## Validation

- `node tests/local-dev-dashboard-quota-reset-times-v1/run.mjs` — PASS
- `node tests/local-dev-dashboard-visible-labels-italian-v1/run.mjs` — PASS
- `node tests/local-dev-hermes-opencode-operator-visibility-v1/run.mjs` — PASS
- `node tests/local-dev-dispatcher-service-v1/run.mjs` — 69/69 PASS
- `node tests/local-dev-resource-observability-integrity-v1/run.mjs` — 7/7 PASS
- `node tests/registry-v2/run.mjs` — 76/76 PASS
- `git diff --check` — PASS

The focused quota test covers Codex rolling/weekly percentages and reset
authorities, GLM observed/unobserved reset branches, Cursor labels and
`plan_reset_at` branches, CET and CEST conversion, unchanged internal
`remaining_percent`, unchanged API window reset fields, Italian localization,
and canonical resource order.

## Live read-only smoke

The exact canonical scheduled task `ControlPlane-V4-LocalDevDispatcher` was
identity-checked and recycled boundedly: listener PID `20748` was stopped and
the task restarted, producing listener PID `47428` on `127.0.0.1:18793`.

Local GET checks returned HTTP 200 for `/dashboard`, `/v1/status`,
`/v1/diagnostics`, and `/v1/resources`. The live dashboard source contains
`quotaResetLabel`, `quota-window-block`, and `Reset piano`, and contains no
operator-facing `Effettivo` token. Live status was `active=false`, `phase=IDLE`;
Qwen was `health_state=AVAILABLE`, `observation_state=OBSERVED`. The live
quota source currently provides no Codex/GLM reset or Cursor plan-reset value,
so those fields remain `Non osservato` as required.

Private Tailscale GET checks returned HTTP 200 for the same four paths and
served the same quota revision. Tailscale Serve configuration was not changed
and no Funnel was used.

## Hard-wall accounting

- `/v1/tick`: not invoked
- manual ticks: 0
- queue mutations: 0
- receipt mutations: 0
- Qwen loads/generations: 0
- GLM/Codex/Cursor execution: 0
- production dispatch: 0
- Hermes/browser/ChatGPT Web interaction: 0
- credentials, cookies, tokens, and session material: not accessed or persisted

Preserved markers: `LOCAL_DEV_DASHBOARD_VISIBLE_LANGUAGE=ITALIAN`,
`LOCAL_DEV_HERMES_OPERATOR_VISIBILITY=PASS`,
`LOCAL_DEV_OPENCODE_OPERATOR_VISIBILITY=PASS`,
`CHAIN_OF_THOUGHT_DISPLAY=NO`, `TAILSCALE_DASHBOARD_SURFACE=LIVE`,
`QWEN_RESOURCE_HEALTH=AVAILABLE`, and `DISPATCHER_RUNTIME_REVISION=ALIGNED`.

`#73` remains OPEN with `ISSUE_73_PHASE_C=PASS` and `PHASE_D=OPEN`. NEXT is
`V4_HERMES_PRIVATE_NOVNC_OPERATOR_LINK_V1`.
