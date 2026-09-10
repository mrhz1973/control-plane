# V4 Local Dev quota reset live-source qualification V1

**TASK_REF:** `V4_LOCAL_DEV_QUOTA_RESET_LIVE_SOURCE_QUALIFICATION_V1`
**Classification:** `PASS`
**BASE_HEAD:** `ec6d3853e79167b27fe2bc1c77854f172e69c496`
**Date:** 2026-09-10 (Europe/Rome)

## Scope and safety result

This qualification audited the existing read-only quota path only. No Qwen,
GLM, Codex, Cursor, Hermes, ChatGPT Web, provider, `/v1/tick`, queue,
receipt, n8n, VPS, browser, credential, token, cookie, or production-routing
operation was performed. `MODEL_INFERENCE_CALLS=0` and
`QUOTA_RESET_VALUES_INVENTED=NO`.

## Preflight

- `branch=main`.
- `origin/main=ec6d3853e79167b27fe2bc1c77854f172e69c496`.
- `HEAD=ec6d3853e79167b27fe2bc1c77854f172e69c496`.
- Tracked worktree was clean before the qualification.

## Live source qualification

The fixed, repository-owned OpenClaw source is exactly:

```text
openclaw status --usage --json
```

It is launched by the collector with fixed `execFile`/spawn arguments and is
read-only. The bounded live observation completed with:

```text
OPENCLAW_USAGE_TIMEOUT
ok=false
payload_materialized=false
contributions=0
```

Therefore the four requested live reset fields are not provided by the live
source in this observation:

```text
CODEX_5H_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
CODEX_WEEKLY_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
GLM_5H_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
GLM_WEEKLY_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
```

This is a source availability/timeout result, not a collector or dashboard
drop. The collector's bounded failure law exposes both commercial pools as
`UNKNOWN/STALE` with `reset_at=null` and emits no contribution. After the
bounded service recycle, `/v1/resources` first reported the normal
`OPENCLAW_USAGE_PENDING` state while the same bounded refresh was in flight;
no stale number was promoted to fresh.

The existing source-to-canonical contract was also verified with sanitized
fixtures: OpenClaw `resetAt` survives conversion to `windows[].reset_at`,
the limiting binding window supplies the pool reset, and the Codex app-server
adapter preserves its reset fields offline. No source-side drop was found,
so no runtime or validator fix was warranted.

## Provider mapping and secondary adapter

- Z.AI `Tokens (5h)` maps to `rolling`.
- Z.AI `Tokens (Limit)` maps to `weekly`.
- Z.AI `Monthly` is retained only as auxiliary MCP metadata and never enters
  routing capacity.
- `account/rateLimits/read` is an offline-only Codex secondary adapter; no RPC
  was made. It cannot overwrite the OpenClaw primary or create a second pool.
- No safe Cursor plan-reset source/config was present. The dashboard renders a
  plan reset only from explicit `plan_reset_at` evidence, so the correct state
  is `CURSOR_PLAN_RESET_SOURCE=MANUAL_REQUIRED`.

## Runtime smoke

- The exact scheduled task `ControlPlane-V4-LocalDevDispatcher` was identity
  checked and recycled once, stopping only the identified canonical server PID
  and starting the same task action.
- New server PID: `43572`; bind remained loopback `127.0.0.1:18793`.
- Local GET `/dashboard`, `/v1/status`, `/v1/diagnostics`, and
  `/v1/resources`: `200`.
- Private Tailscale GET for the same four paths: `200`.
- The local and private dashboard payloads had the same SHA-256:
  `f0f0e7dea1e89b42fdef814288218874b9f1d35ca953a8b4fdd2dc2eba09ae5f`.
- No manual tick, queue mutation, receipt mutation, model generation, or
  production dispatch occurred.

## Validation

- OpenClaw collector contract: `26/26 PASS` (elevated Windows context only
  to resolve the installed module path).
- Codex app-server secondary adapter: `PASS`.
- Dashboard quota reset focused suite: `FOCUSED_TESTS=PASS`.
- Resource observability integrity: `7/7 PASS`.
- Italian dashboard labels: `FOCUSED_TESTS=PASS`.
- Dispatcher service regression: `69 passed, 0 failed`.
- Registry V2: `76/76 PASS`.
- `git diff --check`: `PASS`.

## Canonical markers

```text
CODEX_5H_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
CODEX_WEEKLY_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
GLM_5H_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
GLM_WEEKLY_RESET_LIVE=NOT_PROVIDED_BY_SOURCE
CURSOR_PLAN_RESET_SOURCE=MANUAL_REQUIRED
QUOTA_RESET_VALUES_INVENTED=NO
MODEL_INFERENCE_CALLS=0
```

`#73` remains OPEN with `ISSUE_73_PHASE_C=PASS`; Phase D is not promoted.
The next real gate is `HUMAN_GATE_CURSOR_PLAN_RESET_DATE`.
