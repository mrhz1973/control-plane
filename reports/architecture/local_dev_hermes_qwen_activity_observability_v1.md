# LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1

**Issue:** #79 — LOCAL_DEV dashboard observability for Hermes/Qwen browser operations
**Classification:** `PASS`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `b325d72eff18d3c1058f2b3d7705b9593598d02c`

## Result

The LOCAL_DEV dashboard now shows external Hermes/Qwen/browser operations
(`QWEN_LOCAL → HERMES → persistent Chrome/CDP → CHATGPT_WEB`) through a
dedicated read-only section, concurrently and without contradiction with
`DISPATCHER = IDLE_CLEAN`.

## SELECTED_TELEMETRY_PATTERN

**Local JSON ephemeral registry** (option 1 of the mission), consumed by the
existing dispatcher process. No new service was created; no loopback endpoint
daemon; the dispatcher reuses its existing HTTP handler.

- Registry file: `%LOCALAPPDATA%\control-plane\agent-activity-registry-v1.json`
  (override `AGENT_ACTIVITY_REGISTRY_PATH` for tests). Ephemeral by nature:
  bounded to the 20 most recent activities, safe to delete at any time.
- Writer: any Hermes/Qwen runner calls `publishActivity()` (merge-on-upsert by
  `activity_id`, sanitized, bounded, atomic single write).
- Reader: the dispatcher exposes `GET /v1/agent-activity` (GET-only, no tick
  lock, no mutations) and embeds the same sanitized section additively inside
  `GET /v1/diagnostics` as `agent_activity`.
- Dashboard: reads `d.agent_activity` from the already-polled diagnostics —
  zero additional HTTP calls in normal polling.

## ACTIVITY_SCHEMA

`local-dev-agent-activity-v1` — exactly the mission fields:
`activity_id, task_ref, activity_type, controller, bridge, browser_surface,
answer_surface, model_profile, started_at, last_progress_at, elapsed_seconds,
stage, state, timeout_total_seconds, timeout_remaining_seconds,
generation_state, capture_state, cdp_state, auth_state, qwen_occupancy,
stop_reason` plus server-side `received_at` and freshness-only
`state_reason`.

- STATES: `ACTIVE, WAITING, PASS, STOP, UNKNOWN, STALE`
- STAGES: `PREFLIGHT, QWEN_READY, HERMES_ATTACHED, BROWSER_READY,
  REQUEST_SENDING, WAITING_WEB_RESPONSE, WEB_RESPONSE_OBSERVED,
  RESULT_CAPTURE, VALIDATION, HUMAN_GATE, PASS, STOP`

## FRESHNESS LAW

Evaluated at READ time in `applyFreshness()` — pure function, no heartbeat
side effects, no write-back:

- `ACTIVE`/`WAITING` with `last_progress_at` (or `started_at`) older than
  90 s (`DEFAULT_FRESHNESS_MS`) ⇒ `STALE` (`state_reason=PROGRESS_TOO_OLD`).
- Missing/unparsable timestamps ⇒ `UNKNOWN`
  (`state_reason=NO_PROGRESS_TIMESTAMP`).
- Terminal `PASS`/`STOP` are NEVER reinterpreted (proven at +24 h and +1 h).
- Readers tolerate a missing or corrupt registry file by returning an empty
  list (fail-closed), never invented state.

## SANITIZATION

- The registry accepts ONLY the allow-listed schema fields; any other field
  (e.g. `cookie`, `token`, `credential`, `session_id`, `telegram_chat_id`,
  `account`, prompt/response content) is dropped before persist (proven by
  T8/T9: hostile payloads containing secrets leave zero trace on disk).
- `auth_state` is boolean-sanitized (`true/false/UNKNOWN/null`); it never
  carries account identity.
- All strings are control-char stripped and length-capped (activity_id 120,
  others 80/40).
- Raw session/gate identity is never stored; identity references are caller
  chosen `activity_id` values (the driver derives them from a truncated run
  id).

## READ_ONLY OBSERVABILITY (authority law)

`agent-activity-registry-v1.mjs` exports only
`publishActivity/readActivities/applyFreshness/registryPath` + schema
constants. No tick/claim/authorize/execute/dispatch surface exists. The
registry writer cannot create or claim tasks, mutate receipts, authorize
execution, invoke providers, control browsers or mutate routes. Publishing a
STOP/PASS record has zero effect on execution authority (proven by T11).
`/v1/agent-activity` performs no tick-lock acquisition (proven by T12).

## DASHBOARD_SECTION

New distinct section `AGENT` — **"Operazioni agente / browser"**
(`data-section="agentops"`, canonical order `resources, ops, agentops,
queue`), visually separated from dispatcher/queue/receipt/tick sections and
explicitly labelled *"Fuori dal ciclo di selezione/claim"*. Cards show:
activity type/id, STATE+STAGE, task ref, controller, bridge, browser/answer
surface, model profile, generation/capture state, CDP, sanitized auth, Qwen
occupancy, timeout budget, stop reason, started/last-progress/elapsed.
Malformed telemetry renders safe (null-safe helpers; T17B).

## WRITER INTEGRATION

`tools/hermes-allowlist-live-send-v1.mjs` (the smallest real
Hermes/Qwen→browser path the project owns) now publishes sanitized telemetry
along its state machine: PREFLIGHT → QWEN_READY → HERMES_ATTACHED →
BROWSER_READY → REQUEST_SENDING → WAITING_WEB_RESPONSE →
WEB_RESPONSE_OBSERVED → RESULT_CAPTURE → VALIDATION → PASS/STOP (with
`stop_reason`). Publishing is best-effort: any failure is logged to stderr
and swallowed — it can never alter gates, budgets or the send path. A merge
upsert lifecycle (ACTIVE → WAITING → STOP with field persistence) was proven
at wire level (`WIRE_LIFECYCLE_UPSERT=PASS`). No real send was performed in
this task.

## HUMAN GATE OBSERVABILITY

A runner parked on a human decision publishes
`state=WAITING, stage=HUMAN_GATE`; the dashboard shows it (T3). The lane
never polls Telegram and never reads the decision; the persistent
operator-wait law (`V4_CURSOR_ACP_MCP_HUMAN_GATE_PERSISTENT_OPERATOR_WAIT_V1`)
is untouched (MCP gate suite re-run: 37/37 PASS).

## Tests (tests/agent-activity-observability/run.mjs — 23/23 PASS)

T1 schema; T2 ACTIVE while dispatcher IDLE; T3 WAITING/HUMAN_GATE; T4 PASS
terminal; T5 STOP+reason; T6 stale⇒STALE; T7 missing⇒UNKNOWN; T8/T9
sanitization; T10 no task/receipt mutation; T11 no execution authorization
surface; T12 no tick side effects; T13 diagnostics additive (existing keys
unchanged); T14 bounded to 20; T15 malformed input + corrupt file fail
closed; T16 diagnostics backward compatible; T17/T17B dashboard section +
malformed-safe render; T18 dispatcher suite regressions; T19 synthetic
lifecycle; T20 default registry untouched by tests.

Regressions: dispatcher service suite **69/69 PASS** (S71 updated for the
new 4-section canonical layout — additive, intentional); MCP gate suite
**37/37 PASS**; dashboard inline script syntax PASS; module syntax PASS.

## Acceptance

```
EXTERNAL_ACTIVITY_TELEMETRY_CONTRACT=PASS
READ_ONLY_OBSERVABILITY=PASS
DISPATCHER_IDLE_WITH_EXTERNAL_ACTIVE=PASS
HUMAN_GATE_WAIT_VISIBLE=PASS
STALE_SEMANTICS=PASS
SANITIZATION=PASS
NO_EXECUTION_AUTHORITY_EXPANSION=PASS
NO_CLAIM_RECEIPT_MUTATION=PASS
DASHBOARD_SECTION=PASS
BACKWARD_COMPATIBILITY=PASS
REGRESSIONS=PASS
PRODUCTION_CHANGED=NO
```

## Hard walls respected

No production dispatch; no provider/model call; no route activation; no
D-0025 reopening; no OpenClaw activation; no OLD VPS mutation; no public
CDP/noVNC/Funnel; no credential/cookie/token persistence; no claim/receipt
mutation; no execution authority expansion; no automatic fallback; no visual
sidecar #78; no unrelated dashboard redesign.
