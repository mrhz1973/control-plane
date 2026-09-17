# V4_CURSOR_CLI_LIVE_QUOTA_SOURCE_QUALIFICATION_AND_WIRING_V1

- **Issue**: #81 — Cursor CLI live quota source qualification and dashboard wiring
- **Status**: CLOSED / COMPLETED (PARTIAL_LIVE_QUALIFIED → plan-only wiring)
- **Date**: 2026-09-17 (UTC+2)

RESULT=PASS
TASK_REF=V4_CURSOR_CLI_LIVE_QUOTA_SOURCE_QUALIFICATION_AND_WIRING_V1
ISSUE_81=#81

BASE_HEAD=babd6c94469ca48f810019e0ef66a77e4438905f
FINAL_HEAD=cb6b7dba4253e6b88301898b382a10b6d95a1c8a

## Phase A — Installed Cursor inventory (read-only)

CURSOR_EXECUTABLES_FOUND=
- `C:\Program Files\cursor\resources\app\bin\cursor.cmd` (IDE launcher → `Cursor.exe … cli.js`)
- `C:\Program Files\cursor\resources\app\bin\cursor-tunnel.exe`
- `C:\Users\mrhz\AppData\Local\cursor-agent\cursor-agent.ps1` / `.cmd` (shim → `versions\<ver>\node.exe index.js`)
- `C:\Users\mrhz\AppData\Local\cursor-agent\agent.ps1` / `.cmd` (same shim)

CURSOR_VERSION=
- IDE `cursor --version` = 3.19.19 (commit 6496ea8a068aebfcd21990e70ff522e9abf10c80, x64)
- CLI `cursor-agent --version` = 2026.09.10-fd3934a (installed version dirs; `about` reports latestVersion 2026.09.15-d2fe57e — NOT installed/upgraded by this task)

CURSOR_CLI_SURFACE=cursor-agent (separate agent CLI, versioned node layout)
CURSOR_AGENT_SURFACE=same binary (`agent` alias of `cursor-agent`)

SUPPORTED_READ_ONLY_COMMANDS=
- `status|whoami [--format text|json]` — authentication status only (booleans + userInfo)
- `about [--format text|json]` — version/system/account info
- `models` — plain-text model list (no JSON)
- `mcp list` / `mcp list-tools` — MCP server inventory (not quota)
- `persist list` — session inventory (not quota)
- Interactive/agent surfaces (prompt runs, `--print`, `--resume`, `worker`) — OUT OF SCOPE (model work / quota consumption)

USAGE_COMMAND_PRESENT=NO — no `usage` (or equivalent) command exists in the documented help of cursor-agent 2026.09.10 or the IDE CLI (`cursor --help` = file/extension management only).
USAGE_SOURCE_TYPE=cursor-agent `about --format json` (first-party, authenticated, machine-readable, plan identity only)

First-party localhost endpoints: NONE — the 18 running Cursor IDE processes expose zero listening TCP sockets (OS-level read-only observation; no traffic interception).

Cursor IDE processes: 18 × `C:\Program Files\cursor\Cursor.exe` — never terminated, never mutated.

## Source classification

SOURCE_CLASSIFICATION=PARTIAL_LIVE_QUALIFIED
LIVE_SOURCE_QUALIFIED=YES (for plan identity only)
PARTIAL_SOURCE_QUALIFIED=YES

PLAN_LIVE_AVAILABLE=YES — `about --format json → subscriptionTier` ("Pro+", measured repeatable: 3 runs ≈1.2-1.3s each, identical output)
RESET_LIVE_AVAILABLE=NO — no reset date/time in any documented command
CURSOR_MODELS_LIVE_AVAILABLE=NO
OTHER_MODELS_LIVE_AVAILABLE=NO
ON_DEMAND_LIVE_AVAILABLE=NO

MACHINE_READABLE=YES (`--format json`; only `status`/`about` expose it)
INTERACTIVE_ONLY=NO (for the qualified surface; TUI `/usage`-like data does NOT exist in this CLI)
SEMANTICS_UNAMBIGUOUS=YES for `subscriptionTier` (= plan tier string). Auth-related `status` output contains `hasAccessToken`/`hasRefreshToken` booleans and `userInfo` — PERSONAL/AUTH material, fenced out (see secret fence).

Qualification evidence: `about --format json` keys = cliVersion, latestStatus, latestVersion, model, subscriptionTier, osPlatform, osArch, userEmail, terminalProgram, shell, lastRequestId. Only `subscriptionTier` (+`cliVersion` as collector metadata) is quota-meaningful and non-personal.

## Hard-wall compliance

LOGIN_LOGOUT_PERFORMED=NO
AUTH_MUTATION=NO
CREDENTIAL_FILES_READ=0
TOKENS_READ=0
COOKIES_READ=0
BROWSER_SCRAPING=NO
CDP_SCRAPING=NO
TRAFFIC_INTERCEPTION=NO
BINARY_PATCHING=NO
DECOMPILATION=NO
MODEL_GENERATIONS_FOR_QUALIFICATION=0
SYNTHETIC_QUOTA_CONSUMPTION=0
SECRET_OUTPUT_DETECTED=NO (status/about outputs contain auth-booleans + email; recorded here structurally only, never persisted raw)

Manual evidence check: `configs/runtime/quota-observatory/cursor-manual-observation.json` byte-identical to base; `v4_local_dev_cursor_plan_reset_manual_observation_v1.md` untouched.
MANUAL_EVIDENCE_PRESERVED=YES
MANUAL_SOURCE_RELABELED_LIVE=NO

## Phase B — Minimal live collector (plan-only)

COLLECTOR_IMPLEMENTED=YES
- NEW `tools/collect-cursor-cli-quota-v1.mjs` — bounded read-only adapter executing the FIXED command `about --format json` via the versioned node entry (`versions\<latest>\node.exe index.js about --format json`, mirroring the installed shim's own launch path; PATH `cursor-agent` fallback). Mirrors collect-openclaw-quota-v1 laws: fixed args (no shell), 15s timeout + 5s hard backstop (Windows taskkill tree-kill), 64KB stdout bound, secret scan fail-closed, personal-field allowlist (plan + cli_version ONLY; userEmail/userId/lastRequestId never copied), in-memory cache TTL 300s (= QUOTA_DISPLAY_FRESH_MS) + single-flight, failed refresh keeps previous value only as STALE/degraded. Scope declared in payload: `{plan:true, usage_pools:false, reset:false, on_demand:false}`.
- `tools/local-dev-resource-observatory-v1.mjs` — additive integration in `collectQuotaObservatory`: injectable `collectCursorCli` (tests can stub; `null` disables), fail-closed try/catch. Field-level provenance added: `plan_provenance` (LIVE|MANUAL), `plan_observed_at`, `plan_reset_provenance`, `labels_provenance`, `cli_live` sub-object (collector/freshness/reason/version/scope, sanitized). `plan` = LIVE value when fresh-valid observation exists, else manual value — no other field touches live data.

DASHBOARD_WIRING=YES (minimal)
- `tools/local-dev-dispatcher-dashboard-v1.html` Cursor card detail: `Piano: Pro+ [LIVE]` badge when `plan_provenance==='LIVE'`; `Reset piano: … [MANUAL]` badge; note updated. No layout/controls changes; #85/#86/#88/#89 surfaces untouched (regressions PASS).

FIELD_LEVEL_PROVENANCE=YES (per-field: plan=LIVE when live, reset/labels=MANUAL always until a qualified live source exists)
FAIL_CLOSED=YES (missing binary/timeout/malformed JSON/missing tier → UNKNOWN + bounded reason codes CURSOR_CLI_NOT_FOUND / CURSOR_CLI_TIMEOUT / CURSOR_CLI_JSON_INVALID / CURSOR_CLI_PLAN_MISSING / CURSOR_CLI_SECRET_LIKE_MATERIALIZED)

## Focused tests

FOCUSED_TESTS=PASS — `tests/cursor-cli-live-quota-source-v1/run.mjs` 11/11:
- T1 real-shaped sanitized fixture accepted (plan Pro+)
- T2 missing source → UNKNOWN (CURSOR_CLI_NOT_FOUND), no invented data
- T3 timeout → safe failure
- T4 malformed output → safe failure (JSON invalid / tier missing)
- T5 secret-looking tier fails closed; Bearer-like material never materializes; personal fields (userEmail/userId/lastRequestId) never copied
- T6 LIVE provenance only on successful fresh observation (failed live → plan stays MANUAL, cli_live.ok=false)
- T7 manual evidence never silently relabeled (null collector → all MANUAL; live plan + MANUAL reset/labels coexist with distinct provenance)
- T8 no fabricated pools (no remaining/used/reset numbers from plan-only source; manual labels preserved)
- T9 dashboard schema compatible (Piano+LIVE badge, Reset+MANUAL badge, labels preserved; manual-only mode shows no LIVE badge)
- T10 manual evidence files unchanged & readable
- cache: single-flight, TTL hit serves cache without CLI re-execution; failed refresh → STALE/degraded retention

Regression suites:
- `local-dev-resource-observability-integrity-v1` PASS (Cursor accounting separation preserved)
- `local-dev-resource-observatory-v1` PASS
- `local-dev-dispatcher-service-v1` 75/75 PASS (S62 #73 laws preserved)
- `dashboard-human-gate-view-v1` 18/18 PASS (#86 intact)
- `local-dev-dashboard-quota-reset-times-v1` PASS
- `dashboard-refresh-control-v1` 18/18 PASS (#85 intact)
- `local-dev-cursor-plan-reset-manual-observation-v1`: FAILS — **PRE-EXISTING at base babd6c9 (verified via git stash on the unmodified tree)**: its OpenClaw-fixture expectation of codex windows (2) no longer holds since the PHASE_0_5 codex authority retirement zeroes OpenClaw codex windows (`OPENCLAW_CODEX_AUTHORITY_RETIRED`). Unrelated to #81; no change made (out of scope; not a #81 regression).

## Live proof

LIVE_READ_PROOF=PASS
1. `node tools/collect-cursor-cli-quota-v1.mjs` (bypassCache) → ok=true, plan="Pro+", freshness=fresh, source=cursor_cli_about, scope.plan=true, scope.usage_pools=false (~2.1s wall).
2. Second read → identical plan="Pro+" (deterministic parsing; zero quota consumption; only `about` metadata read).
3. Service wiring live: dispatcher scheduled task `ControlPlane-V4-LocalDevDispatcher` recycled exactly once (status.active=false verified first; old PID 37848 → new PID 49624, canonical task only). `GET /v1/resources` now returns `quotas.cursor.plan=Pro+`, `plan_provenance=LIVE`, `plan_observed_at=2026-09-17T00:11:53.608Z`, `plan_reset_provenance=MANUAL`, `labels_provenance=MANUAL` (0/1 manual labels preserved), `cli_live={ok:true,freshness:fresh,cli_version:2026.09.10-fd3934a,scope:{plan:true,usage_pools:false,reset:false,on_demand:false}}`, collector_label="cursor-agent about --format json (plan) + manual runtime observation".
4. Dashboard live check: Cursor card renders `Piano: Pro+ LIVE` + `Reset piano: 19 set 2026 MANUAL` + Cursor Models 0% / Other Models 1% (manual). Screenshot: reports/runtime/dev-queue/dashboard-81-cursor-live.png.
5. Live-vs-manual comparison (allowed difference): live plan "Pro+" CONFIRMS the historical manual plan "Pro+"; manual reset date 2026-09-19 and labels 0/1 remain manual-only (no live equivalent exists).
6. Secret scan on live /v1/resources payload: CLEAN (no sk-/Bearer/JWT patterns, no personal email).

## Invariants

WF90_CHANGED=NO
N8N_CHANGED=NO
TELEGRAM_CHANGED=NO
QWEN_LIFECYCLE_CHANGED=NO (live check: Qwen STOPPED, port 8080 free throughout; polling never starts Cursor/Qwen model work)
ROUTING_CHANGED=NO
PRODUCTION_CHANGED=NO
D0025_CHANGED=NO
HERMES_CHANGED=NO

SECRETS_EXPOSED=0

ISSUE_81=CLOSED_COMPLETED
COMMIT=cb6b7dba4253e6b88301898b382a10b6d95a1c8a
REMOTE_HEAD_VERIFIED=YES
