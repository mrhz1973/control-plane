# LOCAL_DEV Dispatcher — Operating Model and Runtime Setup

**Repository:** `mrhz1973/control-plane`  
**Scope:** workstation-local LOCAL_DEV dispatcher, queue selection, Qwen/OpenCode execution, receipts, observability and remote read-only dashboard access  
**Authority:** GitHub + deterministic selector/admission/receipt logic remain authoritative; this document does not activate new routing or authorization  
**Status:** current qualified runtime + operator-visible setup, with pending items explicitly marked

---

## 1. What the LOCAL_DEV dispatcher is

The LOCAL_DEV dispatcher is the workstation-side execution control service for bounded development tasks. It watches the canonical dev queue, applies deterministic selection/admission rules, prevents duplicate execution through receipts/claims, prepares the selected task for execution, drives the qualified local Qwen → OpenCode route where permitted, records the execution outcome, and exposes a read-only dashboard for operator observability.

It is **not** the strategic backlog owner, not a second Control Plane, and not a model router by itself. GitHub remains the source of truth; n8n/WF90 may trigger the dispatcher tick, but deterministic local logic controls whether anything is actually selectable/admissible.

Canonical work chain:

```text
GitHub backlog / queue item
  ↓
LOCAL_DEV selector
  ↓
claim / receipt duplicate-prevention
  ↓
admission + workstation/Qwen preflight
  ↓
execution envelope
  ↓
Qwen local → OpenCode (qualified path, when task/profile permits)
  ↓
tests / git diff / persistence
  ↓
receipt / result
  ↓
next queue item
```

---

## 2. Workstation service

Canonical Windows service entry point:

```text
Scheduled Task: ControlPlane-V4-LocalDevDispatcher
  → powershell.exe
  → tools/run-local-dev-dispatcher-supervisor-v1.ps1
  → node tools/serve-local-dev-autonomous-dispatcher-v1.mjs
```

The repository PowerShell supervisor is the canonical lifetime owner for the Node child. It keeps exactly one dispatcher child active, writes durable runtime logs outside the Git worktree under `%LOCALAPPDATA%\ControlPlane\logs\local-dev-dispatcher.log`, and restarts an unexpectedly exited Node child after a bounded 10-second backoff. This preserves the single Windows Scheduled Task authority; it does not introduce a second scheduler, daemon, tick source, or dispatch authority. Task Scheduler restart-on-failure is not relied upon as the primary child-recovery mechanism.

### Safe maintenance restart gate (#115)

ALL operator / Cursor maintenance restarts of `ControlPlane-V4-LocalDevDispatcher` MUST go through the canonical fail-closed gate:

```text
tools/safe-restart-local-dev-dispatcher-v1.ps1
  → node tools/safe-restart-local-dev-dispatcher-v1.mjs
```

Two-phase live idle fence (LIVE `GET /v1/status` only; never cached diagnostics):

1. `PRECHECK_IDLE` — require `active === false` and no in-flight phase;
2. bounded race delay;
3. `FINAL_PREKILL_IDLE_CHECK` — re-query live status before any terminate.

If either fence fails (active / BUSY / EXECUTING / unavailable / malformed / ambiguous): abort with `RESTART_DEFERRED_ACTIVE_EXECUTION` (or precise unavailable/ambiguous class). Zero `Stop-ScheduledTask` / `schtasks /End` / process kill. Do not invent ad-hoc restart snippets outside this entrypoint.

Primary local bind:

```text
127.0.0.1:18793
```

The dispatcher is intentionally loopback-bound. The raw `18793` listener is not opened directly to the public Internet.

Key local endpoints:

```text
GET  /dashboard
GET  /v1/status
GET  /v1/diagnostics
GET  /v1/resources
GET  /v1/history
POST /v1/tick
```

`/dashboard`, `/v1/status`, `/v1/diagnostics`, `/v1/resources`, and `/v1/history` are observability surfaces. `/v1/tick` is operational and must not be treated as part of the ordinary read-only dashboard surface.

---

## 3. Core deterministic components

### Queue selection

```text
tools/select-local-dev-queue-item-v1.mjs
```

Responsibilities:
- inspect canonical LOCAL_DEV queue items;
- apply selector law;
- exclude tasks already blocked by receipt/claim history;
- return one bounded candidate per tick when eligible.

### Backlog/envelope bridge

```text
tools/bridge-backlog-to-local-dev-envelope-v1.mjs
```

Transforms the selected backlog item into the bounded execution/envelope representation expected by the local lane.

### Dispatcher service

```text
tools/serve-local-dev-autonomous-dispatcher-v1.mjs
```

Responsibilities include:
- HTTP service;
- status/diagnostics/resources/dashboard responses;
- tick lifecycle;
- selection integration;
- persistence boundaries;
- Qwen readiness/preflight integration;
- execution/result orchestration;
- fail-closed handling for invalid receipt-ledger reads.

### Receipt/claim authority

The receipt ledger is part of duplicate-prevention authority. A matching blocking receipt/claim prevents a READY-looking historical queue file from being selected again. Dashboard wording such as `CLAIM_ALREADY_EXISTS` therefore means “selection suppressed by existing execution history”, not automatically “task failed”. Exact terminal state must come from the receipt/result evidence when available.

Invalid or unreadable receipt ledgers fail closed and must not silently become an empty ledger.

---

## 4. Qwen / OpenCode execution path

Canonical qualified local route:

```text
Qwen local
  ↓
OpenCode
  ↓
filesystem / terminal / tests / Git
```

Qualified campaign state:

```text
QWEN_INDEPENDENT_QUALIFIED=YES
```

Operational laws:
- Qwen local has no commercial model quota;
- occupancy/readiness still matters;
- use canonical Qwen profile IDs rather than stale parameter-count labels;
- only one authorized workload should own the shared local Qwen runtime at a time;
- no concurrent second Qwen harness unless occupancy is clear and separately allowed;
- commercial fallback is task-specific, never implicit.

Historical Qwen → Cline → Cursor exists as experimental evidence but is not the canonical qualified local execution route.

---

## 5. Dispatcher observability dashboard

Main UI:

```text
http://127.0.0.1:18793/dashboard
```

Primary backing reads:

```text
GET /v1/status
GET /v1/diagnostics
GET /v1/resources
GET /v1/history
```

Mission Control V2 tabs (issue #94):
- `OPERAZIONI` (default human-first view): PRIMA / ADESSO / DOPO cards, canonical seven-phase task rail (Selezione → Preflight → Runtime → Executor → Test → Persistenza → PASS/STOP, evidence-only completion), active/last-terminal/latest-tick as distinct concepts;
- `STORICO`: task-centric history derived from the authoritative receipt ledger plus the durable journal — ordinary IDLE ticks are never engineering tasks;
- `COMPONENTI`: human-readable role cards (WF90, Dispatcher, Supervisor, Qwen Local, OpenCode, Receipt Ledger, GitHub, Hermes) with "COSA SUCCEDE SE LO CHIUDI?";
- `TECNICO`: previous technical sections (resources/observatory, operator visibility, queue, agent ops, dispatcher facts).

Durable operational history (issue #94):

```text
%LOCALAPPDATA%\ControlPlane\runtime\mission-control-events.jsonl
```

Append-only JSONL journal outside the Git worktree. Strict field allow-list with bounded sizes; no secrets, no raw stdout, no full command lines, no environment variables. Only real dispatcher lifecycle transitions emit events (`TASK_SELECTED`, `PREFLIGHT_PASS`, `RUNTIME_READY`, `EXECUTOR_STARTED`, `TESTS_STARTED`/`TESTS_PASS`/`TESTS_FAIL`, `PERSISTENCE_STARTED`, `TASK_PASS`, `TASK_STOP`, `HUMAN_GATE_REQUIRED`); `IDLE_CLEAN` ticks emit nothing. Injected-deps ticks never write the real journal (isolation law). `GET /v1/history` exposes a bounded read-only recent view; it duplicates no execution authority and never mutates receipts.

Current dashboard purpose:
- dispatcher health/state;
- current/next task selection context;
- queue diagnostics;
- Qwen model/readiness/dispatcher-observed usage;
- workstation CPU/RAM/disk/GPU observations;
- commercial quota observations for GLM/Codex when fresh sources exist;
- Cursor native quota remains manual/unverified unless a qualified source is added;
- UNKNOWN / STALE / UNAVAILABLE are valid states and must never be replaced by invented values.

Resource/quota observatory:

```text
tools/local-dev-resource-observatory-v1.mjs
```

Dashboard file:

```text
tools/local-dev-dispatcher-dashboard-v1.html
```

---

## 6. Current quota/resource observations

### Qwen

```text
commercial quota: N/A
capacity type: LOCAL_COMPUTE
```

Readiness/occupancy/GPU state are local resource observations, not commercial quota.

### GLM

Shared pool:

```text
glm_coding_plan
```

Consumers include GLM-5.3 and GLM-5.3-Flash. They must not be counted as separate commercial pools.

Current multi-window law:

```text
effective remaining = MIN(all fresh binding model-quota windows)
```

For Z.AI/OpenClaw mapping:
- `Tokens (5h)` → rolling 5h binding window;
- `Tokens (Limit)` → weekly binding window;
- `Monthly` → MCP auxiliary/non-routing observation;
- MCP must not inflate GLM model quota.

Operator policy target includes GLM blackout 08:00–12:00 Europe/Rome for the whole `glm_coding_plan`; this is a policy/admission concern and must not be confused with provider quota state.

### Codex

Shared pool:

```text
chatgpt_codex_subscription
```

Both the external Codex planner surface and official Codex IDE extension inside Cursor consume/observe this same pool; do not invent a second Codex pool.

Current primary live observation path:

```text
OpenClaw status --usage --json
  → 

> **PHASE_0_5 AUTHORITY LAW (V4_OPENCLAW_QUOTA_LANE_RETIREMENT_PHASE_0_5_V1):**
> OpenClaw quota observation is scoped to `glm_coding_plan` ONLY
> (`OPENCLAW_QUOTA_SCOPE=glm_coding_plan`). The `chatgpt_codex_subscription`
> pool authority is `CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ`
> (bounded read-only `codex app-server` RPC). `CODEX_OPENCLAW_AUTHORITY=NO`,
> `CODEX_OPENCLAW_FALLBACK=NO`: without a fresh app-server observation the
> codex pool renders UNKNOWN/STALE — OpenClaw codex data is diagnostic-only
> and can never govern or restore the pool.
collect-openclaw-quota-v1
  → canonical quota state
  → /v1/resources
```

Official Codex runtime also exposes a machine-readable local app-server method:

```text
account/rateLimits/read
```

This is a candidate secondary cross-check/collector for 5h, weekly, plan and banked reset-credit inventory. Observation is distinct from reset consumption; `account/rateLimitResetCredit/consume` is mutating and must remain gated.

### Cursor native allowance

Current classification:

```text
Cursor Models: MANUAL_ONLY
Other Models:  MANUAL_ONLY
ACCOUNTING_MAPPING=UNVERIFIED
```

No stable local machine-readable Cursor-native quota source has yet been qualified. Do not conflate Cursor native allowance with ChatGPT Codex quota just because Codex runs inside the Cursor IDE.

---

## 7. OpenClaw quota collector

Collector:

```text
tools/collect-openclaw-quota-v1.mjs
```

Read-only command surface:

```text
openclaw status --usage --json
```

Laws:
- fixed read-only arguments;
- no model inference;
- no provider prompt;
- no OpenClaw gateway activation;
- no credential persistence;
- bounded timeout/cache;
- stale/failed refresh degrades to STALE/UNKNOWN;
- same pool is observed once, not duplicated per access surface.

---

## 8. Tailscale remote dashboard access

The workstation dashboard is also exposed privately through Tailscale Serve while the dispatcher itself remains bound to loopback.

Current private hostname:

```text
https://asusdesktop.tailc01234.ts.net
```

Read-only dashboard routes:

```text
/dashboard        → http://127.0.0.1:18793/dashboard
/v1/status        → http://127.0.0.1:18793/v1/status
/v1/diagnostics   → http://127.0.0.1:18793/v1/diagnostics
/v1/resources     → http://127.0.0.1:18793/v1/resources
```

Existing operational route preserved separately:

```text
/v4/local-dev/dispatch-tick → http://127.0.0.1:18793/v1/tick
```

Other pre-existing Tailscale Serve routes are outside the dashboard scope and must not be reset/replaced when changing dashboard routes.

Remote access policy:
- tailnet-only;
- no public Funnel;
- no direct public exposure of port 18793;
- work-PC access is granted narrowly to the workstation HTTPS surface rather than broad network access.

---

## 9. n8n / WF90 relationship

WF90 can trigger the canonical local dispatch tick through the private Tailscale route, but WF90 does not override selector/admission/receipt authority.

WF90 live schedule (since `V4_WF90_2MIN_DASHBOARD_COUNTDOWN_AND_D9410A_UNBLOCK_V1`, 2026-09-15): **every 2 minutes** (`WF90_SCHEDULE_INTERVAL_SECONDS=120`; historical 5-minute cadence before version `dccaff58-…`). WF90 remains the sole periodic tick owner. The dispatcher exposes the observed cadence through the read-only diagnostics `tick_clock` block (`wf90_interval_seconds`, `last_observed_tick_at`, `next_expected_tick_at = last real tick + 120000 ms`); the dashboard countdown anchors exclusively on real ticks and shows "ATTESA TICK N8N" past the expected time instead of restarting a synthetic countdown.

WF90 HTTP tick timeout (since `V4_WF90_TELEGRAM_HUMAN_GATE_RELIABILITY_V1`, 2026-09-16, live version `369b2fdd-…`): **3900000 ms** (65 min) to safely cover the canonical 3600 s LOCAL_DEV executor timebox plus transport/finalization margin (was 900000 ms, which timed out mid-execution on the ~29-min D-9410-A run). Telegram gate notifications are sent with explicit `parse_mode: HTML` and a normalizer-built plain text body (`telegram_text`, HTML-escaped dynamic values, ASCII header): the n8n Telegram node forces legacy Markdown parse mode when unset, which rejected underscore-bearing tokens like `HUMAN_GATE_REQUIRED` with HTTP 400 "can't parse entities". Notification policy is unchanged: HUMAN_GATE_REQUIRED / WORK_EXECUTED_STOP / SERVICE_ERROR only.

Important separation:

```text
WF90 / n8n = trigger / orchestration seam
LOCAL_DEV deterministic core = selection/admission/duplicate-prevention authority
Qwen/OpenCode = implementer path when admitted
GitHub = source of truth
```

No manual n8n Execute/Retry/Test should be used as a normal substitute for the natural dispatcher workflow.

---

## 10. Safety / authority boundaries

The dispatcher must not silently:
- broaden task scope;
- bypass receipt/claim history;
- infer missing quota values;
- activate unqualified routes;
- consume banked provider resets;
- modify credentials;
- change VPS/n8n/Tailscale configuration as part of an unrelated task;
- treat ChatGPT Web as unlimited;
- run concurrent Qwen work against the same shared local runtime.

A real destructive/irreversible action, credential/billing mutation, reset consumption, unresolved architecture decision, or live resource conflict remains a human/explicit gate.

---

## 11. Operator-facing state semantics

Typical states should be read as follows:

```text
READY / candidate        = task is potentially selectable
CLAIM_ALREADY_EXISTS     = historical/current claim/receipt suppresses duplicate selection
QWEN_PREFLIGHT           = Qwen preparation/readiness phase, not necessarily inference
OPENCODE                 = active local implementation harness phase
TESTS / PERSISTENCE      = task still active, Qwen may no longer be in inference
PASS                     = bounded acceptance/result proven
STOP                     = task stopped by deterministic condition
DEFER                    = pending for a later permitted/adequate route; not failure
SERVICE_ERROR            = infrastructure/runtime fault
HUMAN_GATE               = explicit operator decision required
```

---

## 12. Pending / not yet promoted

The following are intentionally not represented as fully active merely because design/probe work exists:

- full quota pacing controller using reset horizons, burn-rate, reserve floors and model-class downgrades;
- automatic banked Codex reset consumption;
- automatic Cursor-native quota collection;
- production promotion of Qwen → Hermes → ChatGPT Web quota-degraded routing;
- general autonomous retry beyond separately qualified boundaries;
- any broadened remote-control surface beyond the existing private routes.

The deterministic quota pacing simulator task `D-9407-A` is preparation/design work only until its execution result is terminal and any later runtime promotion is separately authorized.

---

## 12b. Post-execution main-race integration fence

Concurrent remote `main` advancement during a LOCAL_DEV execution is tolerated automatically **only** for a proven, structurally bounded, **disjoint** post-execution integration:

- execution base is known (`dispatch_base_head`);
- local task history since base is bounded and non-merge;
- tracked worktree is clean;
- remote advancement is a descendant of the execution base;
- task-changed files and remote-changed files since base are disjoint;
- rescue ref is recorded before replay;
- focused tests + `git diff --check` pass after replay;
- final push remains ordinary fast-forward only (never force).

Overlap, ambiguous ancestry, dirty tracked worktree, failed replay tests, or origin moving again after reconciliation → **fail closed** with precise `POST_EXEC_*` reason codes (not a generic overloaded `HEAD_ORIGIN_DIVERGED`). Neither side is discarded; rescue evidence is preserved.

Observability: `/v1/diagnostics` exposes `post_exec_integration` from the last tick (`normal_ff` | `safe_disjoint_replay` | `stop`).

Implementation:

```text
tools/local-dev-post-exec-integration-fence-v1.mjs
tools/run-local-dev-executor-v1.mjs (makePersistGit)
```

---

## 13. Canonical references

Primary implementation / observability references:

```text
tools/serve-local-dev-autonomous-dispatcher-v1.mjs
tools/select-local-dev-queue-item-v1.mjs
tools/bridge-backlog-to-local-dev-envelope-v1.mjs
tools/local-dev-resource-observatory-v1.mjs
tools/local-dev-dispatcher-dashboard-v1.html
tools/collect-openclaw-quota-v1.mjs
tools/local-dev-post-exec-integration-fence-v1.mjs
docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md
reports/architecture/local_dev_dispatcher_observability_micro_ui_v1.md
reports/architecture/v4_cursor_codex_ide_quota_source_probe_v1.md
docs/runtime/CURRENT_FRONTIER.md
```

When this document conflicts with live runtime evidence, `origin/main` implementation + current runtime evidence + `docs/runtime/CURRENT_FRONTIER.md` take precedence.
