# V4 OpenClaw quota lane retirement PHASE 0.5 V1

**TASK_REF:** `V4_OPENCLAW_QUOTA_LANE_RETIREMENT_PHASE_0_5_V1`
**Classification:** `PASS`
**BASE_HEAD:** `48092420d7c8b11e5cc4e2d21ef45483dd3c78f8` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14 — implementation 06:51–07:16, persistence before 07:50 cutoff
**Authorization:** `OPERATOR_PREAUTHORIZED=YES` (from V4_OPENCLAW_QUOTA_LANE_VALUE_COMPARISON_V1: `OPENCLAW_QUOTA_DECISION=KEEP_SCOPED`, `CODEX_OPENCLAW_VALUE=INFERIOR`)
**Worktree note:** two pre-existing dirty artifacts (`reports/runtime/cursor-acp/mcp-gate-suite-results.json`, `mcp-gate-wiring-result.json`) were present before task start and are NOT part of this commit.

---

## 1. Canonical markers

```text
OPENCLAW_BROKER_RUNTIME=RETIRE
OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED
OPENCLAW_QUOTA_SCOPE=glm_coding_plan
CODEX_PRIMARY_SOURCE=CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ
CODEX_OPENCLAW_DEPENDENCY=RETIRED
GLM_OPENCLAW_DEPENDENCY=KEPT
CODEX_QUOTA_AUTHORITY=CODEX_APP_SERVER
CODEX_OPENCLAW_AUTHORITY=NO
CODEX_OPENCLAW_FALLBACK=NO
GLM_QUOTA_AUTHORITY=OPENCLAW
GLM_BEHAVIOR_CHANGED=NO
CODEX_FAIL_CLOSED_WITHOUT_APPSERVER=PASS
DISPATCHER_RESOURCE_ENDPOINT=PASS
REGRESSIONS=PASS
MODEL_INFERENCE=0
PRODUCTION_DISPATCH_CHANGED=NO
COMPLETED_BEFORE_0800=YES
```

## 2. Exact canonical files modified

| File | Change |
|---|---|
| `tools/collect-openclaw-quota-v1.mjs` | Codex pool authority retired at the SOURCE: pool `chatgpt_codex_subscription` is force-reported `unknown/stale` with `reason_code=OPENCLAW_CODEX_AUTHORITY_RETIRED`; zero codex contributions emitted (so canonical composition can never receive OpenClaw codex data). GLM path byte-identical in behavior. `effective_remaining_percent` also nulled. |
| `tools/collect-codex-appserver-quota-v1.mjs` | Reconciliation law flipped: `reconcileCodexQuotaObservations(authority, legacyDiagnostic)` — app-server is PRIMARY AUTHORITY (`primary_source=CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ`, `routing_authority=CODEX_APPSERVER_PRIMARY`); OpenClaw codex role = `DIAGNOSTIC_ONLY`; effective value always from app-server. Old fields preserved for backward compatibility. |
| `tools/v4-codex-pool-authority-v1.mjs` (NEW) | Authority module: `codexAuthorityObservation()` accepts ONLY ok+fresh normalized app-server input; absent/stale/malformed → null (fail-closed). Exports `CODEX_PRIMARY_SOURCE`. |
| `tools/codex-appserver-rate-limit-reader-v1.mjs` (NEW) | Live read-only reader: `codex app-server` stdio JSON-RPC (`initialize` → `account/rateLimits/read`, params null), fixed binary resolution (bundled extension `codex.exe` → PATH fallback), 20 s absolute deadline with `taskkill /T /F` tree kill, null on any failure. NEVER calls `account/rateLimitResetCredit/consume`. No credentials, no inference. |
| `tools/local-dev-resource-observatory-v1.mjs` | Codex card authority rebuild: when app-server ok+fresh → windows/remaining/reset/observed_at/freshness/state rebuilt from authority (canonical MIN-window semantics preserved; `exhausted` honored); otherwise → pool EXPLICITLY vetoed to `UNKNOWN/stale` with `CODEX_APPSERVER_UNAVAILABLE|STALE|MALFORMED` and OpenClaw-derived values stripped. Exposes `codex_quota_authority` + `glm_quota_authority` metadata. Reconciliation now app-server-primary. |
| `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` | Live wiring: `GET /v1/resources` fetches the bounded codex authority observation per request cycle and injects it into `buildResourceObservatory`. GLM untouched. |
| Tests updated to the new law | `tests/openclaw-quota-collector-v1/run.mjs` (26/26), `tests/codex-appserver-quota-v1/run.mjs` (PASS), `tests/local-dev-resource-observatory-v1/run.mjs` (PASS), `tests/local-dev-dispatcher-service-v1/run.mjs` (69/69; S58 now asserts the fail-closed case with fresh OpenClaw codex data present). |
| Tests new | `tests/v4-codex-pool-authority-phase-0-5/run.mjs` (8/8), `tests/v4-codex-authority-dashboard-compat/run.mjs` (PASS). |

## 3. Mandatory fail-closed test (T2 — the core law)

Scenario: codex app-server observation ABSENT while OpenClaw reports codex pool
`available` with `effective_remaining_percent=84` and fresh windows.

Result (deterministic, injected fixtures, zero live calls):

```text
codex pool state = UNKNOWN
codex pool freshness = stale
codex reason_code = CODEX_APPSERVER_UNAVAILABLE
codex remaining_percent = null     (OpenClaw's 84 must NOT appear)
codex windows = []
GLM pool = AVAILABLE via openclaw_usage_live (unchanged)
```

Additional fail-closed variants: app-server STALE (observed_at 6 min old > 5 min
max age) → `CODEX_APPSERVER_STALE`; app-server MALFORMED →
`CODEX_APPSERVER_MALFORMED`; rate_limit_reached fixture (5h used 100%) → pool
`EXHAUSTED`, remaining 0, OpenClaw's healthier numbers CANNOT override.

## 4. Regression result (minimal, task-relevant only)

| Suite | Result |
|---|---|
| `tests/v4-codex-pool-authority-phase-0-5/run.mjs` | **8/8 PASS** |
| `tests/codex-appserver-quota-v1/run.mjs` | **PASS** (authority-law assertions updated) |
| `tests/openclaw-quota-collector-v1/run.mjs` | **26/26 PASS** (codex tests re-encoded to retired-authority law; GLM reset/direction/MCP laws unchanged and still green) |
| `tests/local-dev-resource-observatory-v1/run.mjs` | **PASS** (reconciliation = UNKNOWN when OpenClaw side stale; effective still authority-sourced) |
| `tests/local-dev-dispatcher-service-v1/run.mjs` | **69 passed, 0 failed** |
| `tests/v4-codex-authority-dashboard-compat/run.mjs` | **PASS** |

Unrelated suites skipped per TIMEBOX_OVERRIDES_NONESSENTIAL_VALIDATION=YES.

## 5. Live validation (single cycle, bounded, read-only)

- Dispatcher `ControlPlane-V4-LocalDevDispatcher` restarted twice bounded (identity-preserved scheduled-task action; old PIDs 27964 → 24852 → 32520; loopback 127.0.0.1:18793 unchanged).
- `GET /v1/resources` live at 07:13 (before live reader wiring): `codex_quota_authority=CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ`, codex pool `UNKNOWN` fail-closed, GLM authority metadata OPENCLAW.
- `GET /v1/resources` live at 07:15 (after live reader wiring + restart): codex pool **AVAILABLE/fresh from the app-server authority** — rolling 25 % remaining (reset 2026-09-14T05:29:48Z), weekly 57 % (reset 2026-09-20T14:19:28Z), `authority_source=CODEX_APP_SERVER…`, observed_at = client read time. GLM pool remained on the OpenClaw collector cycle (mid-refresh at probe time — PENDING/stale by its own ~150 s law, unaffected by this task).
- The live 5h value (25 % remaining) differs from the exhausted state observed at 00:40 UTC — consistent with a provider-side window rollover in the interim; the authority path reports provider truth directly.
- `MODEL_INFERENCE=0`; no browser, no ChatGPT Web, no Telegram, no provider task generation; the read RPC is `account/rateLimits/read` with `params: null` only; consume method never represented or called.

## 6. GLM behavior proof (unchanged)

- Collector emits exactly ONE glm contribution per observation (C5/C6 green).
- `Tokens (Limit)`→weekly, `Tokens (5h)`→rolling, Monthly→auxiliary MCP non-routing (C18 green).
- GLM weekly-zero exhaustion law (C18b) green.
- Live GLM card continues on `openclaw_usage_live` collector with its own freshness law.

## 7. Rollback

`git revert` of this task's commit restores: OpenClaw codex contributions, the
`OPENCLAW_PRIMARY` reconciliation law, and the pre-Phase-0.5 observatory codex
card. No runtime procedure needed beyond a dispatcher restart (the live reader
module is additive and inert without the observatory consuming it).

## 8. Deferred follow-ups (GLM scope, per task law DO-NOT-FIX)

1. `usedToRemainingPercent(null) → 100` marginal fail-open in the OpenClaw lane;
2. OpenClaw `usage.updatedAt` future-dating anomaly;
3. Optional: retire the GLM OpenClaw dependency later if a credentialed Z.AI
   monitor source is provisioned (then full lane retirement becomes possible).

## 9. NEXT

`NEXT=bounded reconciliation of OpenClaw retirement scope: broker/fallback
retired, GLM quota collector retained.` No further retirement executes
automatically.
