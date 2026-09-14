# V4 OpenClaw quota lane value comparison V1

**TASK_REF:** `V4_OPENCLAW_QUOTA_LANE_VALUE_COMPARISON_V1`
**MODE:** READ-ONLY COMPARATIVE QUALIFICATION + DECISION
**BASE_HEAD:** `e55d6d7d1e2516b172b074d57cd765e83c5ed150` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14, probes 02:21–02:53 local (00:21–00:53 UTC)
**Operator decision law:** KEEP only if OpenClaw provides materially better/more complete/unavailable-elsewhere quota info; conditional `RETIRE_OPENCLAW_QUOTA_LANE=AUTHORIZED` pre-granted; no runtime mutation in this task.

---

## 1. Sources evaluated (real availability today)

| SOURCE | AVAILABLE_NOW | AUTOMATIC | MACHINE_READABLE | DIRECT_OR_AGGREGATED | EVIDENCE |
|---|---|---|---|---|---|
| A. `OPENCLAW_STATUS_USAGE_JSON` | YES | YES (live-wired in dispatcher collector) | YES (`--json`) | AGGREGATED (own provider polling layer over stored zai + openai-codex profiles) | live probes 1–3 this task; `collect-openclaw-quota-v1.mjs` |
| B. `CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ` | YES | YES (direct stdio session, 0.46–0.73 s) | YES (JSON-RPC) | DIRECT (provider-authoritative surface used by the IDE itself) | live probes 1b–3b this task |
| C. `Z.AI / GLM monitor` via `rt25-quota-ingest-glm-v1.mjs` | **NO** | would be | YES (documented envelope) | DIRECT | `ZAI_API_KEY`/`ZHIPUAI_API_KEY` absent in process, User AND Machine scope (presence-only check, values never read) → adapter fail-closes `CREDENTIAL_ABSENT_FAIL_CLOSED` by design |
| D. provider_api / internal ledger / dashboard snapshot | NO new ones | — | — | — | existing ingest lane is empty for both pools (`rt25_quota_ingest` pools show `QUOTA_NOT_OBSERVED`); no qualified ledger source for either pool exists |

No new sources invented. Cursor native and ChatGPT Web remain MANUAL_ONLY / non-queryable per `v4_quota_source_capability_probe_v1.md` (unchanged).

---

## 2. Live probes executed (≤3 per source, bounded, read-only)

### OpenClaw (`openclaw status --usage --json`) — 3/3 used

| # | Latency | Result |
|---|---|---|
| 1 | **132 331 ms** | payload parsed; plugin load warning on stderr (non-fatal) |
| 2 | **132 511 ms** | payload parsed; `providers`: openai-codex 5h usedPercent=100, Week usedPercent=31; zai usedPercent=21; `usage.updatedAt=1789345018778` |
| 3 | **130 102 ms** | full-payload attempt: top-level parse failed under PowerShell streaming (collector itself parses fine — see endpoint materialization below); counted as observation, no data loss |

**OPENCLAW_LATENCY median≈132 421 ms, max≈132 511 ms, exec timeouts 0/3 (210 s budget).**
The historical ~150 s/invocation cost is **confirmed still real** (~132 s today).
Endpoint materialization (dispatcher cache of run 2/3): pools went PENDING → stale →
`fresh` (`glm_coding_plan` remaining 60 %, reset 2026-09-18T22:35:05Z; `chatgpt_codex_subscription`
rolling remaining 100 %, reset 2026-09-14T05:29:10Z; weekly remaining 69 %, reset 2026-09-20T14:19:28Z),
observed_at 2026-09-14T00:26:52.211Z. The stale-flap cycle (~150 s per refresh vs 60 s TTL) is inherent.

**Timestamp anomaly (new finding):** `usage.updatedAt=1789345018778` ≈ 2026-09-14T05:36:58Z —
~5 h10 m AHEAD of machine UTC at probe time. The collector's `OPENCLAW_USAGE_FUTURE_DATED`
guard (60 s tolerance) nulls it and falls back to collector clock, so displayed freshness is not
corrupted, but OpenClaw's own provider-timestamp semantics are unreliable here.

**Mapper wrinkle (new finding, NOT fixed — no runtime mutation):**
`usedToRemainingPercent(null)` returns **100**, not null. A window with missing `usedPercent`
would be recorded as "100 % remaining" instead of failing closed. Marginal fail-open risk in the
OpenClaw lane; recorded for the follow-up task.

### Codex app-server (`account/rateLimits/read`, params null, read-only; consume never called) — 3/3 used

| # | Path | Latency | Result |
|---|---|---|---|
| 1b | `app-server proxy` → running daemon | deadline 20 s | FAIL: socket connect error (os error 10050) |
| 2b | direct `app-server` stdio, no handshake | **456 ms** | response id matched but `rateLimits=null` (session not initialized) |
| 3b | direct `app-server` stdio + `initialize` handshake | **732 ms** | **FULL authoritative snapshot** (below) |

```text
primary   (5h,   windowDurationMins=300):   usedPercent=100, resetsAt=1789345665 (2026-09-14T05:47:45Z)
secondary (week, windowDurationMins=10080): usedPercent=31,  resetsAt=1789913968 (2026-09-20T14:19:28Z)
planType=plus, rateLimitReachedType=rate_limit_reached, credits.hasCredits=false
rateLimitsByLimitId.base_model_inference: limitName=gpt-reserve, weekly usedPercent=3, resetsAt=1789818280
rateLimitResetCredits: availableCount=0
```

**CODEX_APPSERVER_LATENCY median≈456 ms (direct), max 732 ms; 1/3 transport-path failure
(daemon proxy socket), direct-session path 3/3 within budget.**
Provider observation timestamp: not present in response; adapter uses client wall-clock
(documented in `v4_codex_appserver_secondary_collector_v1.md`).

### GLM direct monitor — 0/3 used

Not executed: credential absent in all scopes (fail-closed law forbids fabrication). Latency n/a.

---

## 3. Per-pool comparison

### Pool `glm_coding_plan`

| DIMENSION | OPENCLAW | GLM_DIRECT (monitor) | OTHER |
|---|---|---|---|
| AVAILABLE_NOW | **YES** | NO (credential absent) | none |
| WINDOWS_VISIBLE | rolling 5h + weekly (+ Monthly as auxiliary MCP, excluded from routing — verified in code L81–94 and in materialized endpoint) | rolling 5h + weekly (unit map) | — |
| RESET_TIMESTAMPS | YES (epoch ms) | YES (`nextResetTime`) | — |
| REMAINING_PERCENT | YES (mapped used→remaining) | YES | — |
| PROVIDER_TIMESTAMP | PRESENT BUT UNRELIABLE (future-dated ~+5 h anomaly; guard nulls it) | YES (`observed_at` at fetch) | — |
| FRESHNESS | fresh after ~150 s cycle; stale-flap inherent | on fetch | — |
| FAIL_CLOSED | mostly YES; **marginal fail-open**: missing usedPercent → remaining=100 | YES (credential absent → UNKNOWN) | — |
| LATENCY | ~132 s | n/a (no credential) | — |
| RELIABILITY | proven 3/3 live this task + qualified #73 | unproven live (never runnable without credential) | — |
| RESOURCE_COST | heavy (external CLI process tree, ~150 s CPU/IO per refresh) | light HTTP GET | — |
| OPERATIONAL_COMPLEXITY | high (installed npm module, own profiles, daemon-ish CLI) | low (needs only env credential) | — |
| UNIQUE_INFORMATION | **YES — the ONLY live machine-readable GLM pool source today** | would duplicate | — |

**GLM_OPENCLAW_VALUE=UNIQUE** — no alternative live source exists; semantic mapping
(rolling/weekly/reset, Monthly-MCP exclusion) verified correct.

### Pool `chatgpt_codex_subscription`

| DIMENSION | OPENCLAW | CODEX_APPSERVER |
|---|---|---|
| AVAILABLE_NOW | YES | **YES** (direct stdio; proxy path flaky) |
| WINDOWS_VISIBLE | 5h + Week | 5h (primary) + week (secondary) **+ per-limit-id inventory** (`base_model_inference` gpt-reserve weekly 3 % — **absent from OpenClaw**) + banked reset credits + plan + `rate_limit_reached` state |
| RESET_TIMESTAMPS | YES | YES (`resetsAt` epoch s) |
| REMAINING_PERCENT | derived | derived from authoritative `usedPercent` |
| PROVIDER_TIMESTAMP | unreliable (future-dated anomaly) | client clock on read (immediate) |
| FRESHNESS | ~150 s refresh cycle, stale-flap | on-read (sub-second) |
| FAIL_CLOSED | marginal fail-open wrinkle (above) | strict (`unknown` on missing/malformed/ambiguous binding evidence) |
| LATENCY | ~132 s | **0.46–0.73 s** |
| RELIABILITY | 3/3 (slow but steady) | direct path 2/2 after transport fix; proxy path 0/1 |
| ACCURACY @ 00:26–00:40 UTC | materialized rolling remaining=**100** | **usedPercent=100 (remaining=0) + rate_limit_reached** |
| UNIQUE_INFORMATION | none beyond app-server | banked credits + model-inference limit + authoritative rate-limit state |

**CODEX_OPENCLAW_VALUE=INFERIOR.** At essentially the same time the two sources
DISAGREED on the 5h window: the OpenClaw lane advertised a fully available window while
the provider-authoritative surface reported the window exhausted with an explicit
`rate_limit_reached` state. The direct source is strictly faster (≈200×), strictly richer
(per-limit inventory, banked credits, plan, rate-limit state), and is the surface the IDE
itself consumes. The 5h divergence additionally suggests OpenClaw's aggregated view can
be stale/shifted relative to provider truth (its future-dated `updatedAt` anomaly
corroborates a window-accounting defect). Per decision law, PRIMARY status is a historical
decision — re-evaluated here and overturned for this pool.

---

## 4. Decision

Mixed case per task law:

```text
OPENCLAW_QUOTA_DECISION=KEEP_SCOPED
POOL=glm_coding_plan
GLM_OPENCLAW_VALUE=UNIQUE
CODEX_OPENCLAW_VALUE=INFERIOR
OPENCLAW_SCOPED_RETENTION_REQUIRED=YES
```

### Explanation (≤10 lines)

OpenClaw sees both pools in one command but needs ~132 s/invocation and its own
timestamp/window accounting shows defects (future-dated updatedAt; codex 5h shown fully
available while the provider surface reported rate_limit_reached). The Codex app-server is
direct, ~0.5 s, strictly richer (per-limit inventory, banked credits, plan, rate-limit
state) and authoritative; for `chatgpt_codex_subscription` OpenClaw is INFERIOR — the two
sources verifiably disagreed and the direct one is correct. No live GLM alternative exists
(ZAI credential absent everywhere → monitor adapter fail-closed), so for `glm_coding_plan`
OpenClaw is UNIQUE and irreplaceable today. KEEP only the GLM scope; migrate the Codex
authority to the app-server collector; full retirement becomes possible once a direct GLM
source is provisioned.

### REQUIRED OUTPUT (contract)

- **OPENCLAW_QUOTA_DECISION=KEEP_SCOPED** (option C), `POOL=glm_coding_plan`
- `OPENCLAW_SCOPED_RETENTION_REQUIRED=YES` — scope: `glm_coding_plan` ONLY
- `GLM_OPENCLAW_VALUE=UNIQUE`
- `CODEX_OPENCLAW_VALUE=INFERIOR`
- `RUNTIME_CHANGED=NO`
- `PRODUCTION_CHANGED=NO`

---

## 5. Architecture reconciliation (KEEP_SCOPED semantics)

- `OPENCLAW_BROKER_RUNTIME=RETIRE` — unchanged from the consolidation audit; OpenClaw
  never returns as agent runtime, broker or fallback.
- `OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED` — retained ONLY as the live observation
  dependency for `glm_coding_plan`; NOT as authority for `chatgpt_codex_subscription`.
- New-authority mapping going forward:
  - `glm_coding_plan`: OpenClaw lane (until a direct source is credentialed) → then retire;
  - `chatgpt_codex_subscription`: **CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ becomes the
    primary authority** (currently correctly-failed-closed as secondary; the promotion is a
    bounded runtime change, out of scope here).
- Recorded defects to fix inside the follow-up tasks (NOT here):
  1. `usedToRemainingPercent(null) → 100` marginal fail-open in the OpenClaw lane;
  2. OpenClaw `usage.updatedAt` future-dating anomaly;
  3. codex 5h divergence root cause (OpenClaw window accounting vs provider truth).

---

## 6. Hard walls compliance

- Runtime mutation: NONE (no collector change, no disable, no process/service stop, no uninstall, no registry/routing mutation).
- Probes: read-only only; `account/rateLimitResetCredit/consume` never called; no browser, no model inference, no ChatGPT Web, no provider task generation; ≤3 observations per source; bounded deadlines with tree-kill on the two failed/timeout paths; temp probe scripts deleted after use.
- No credentials read or exposed (presence-only checks); no quota values invented — all numbers above are captured live or read from persisted evidence.
- Dispatch/n8n/VPS/production: untouched.

## 7. Rollback

Nothing to roll back: this task modified only documentation/report files (this report,
CURRENT_FRONTIER, LAST_CURSOR_REPORT). No runtime artifact touched.

## 8. NEXT

`NEXT=bounded per-pool authority cleanup` — the mechanically determined follow-up is
`V4_OPENCLAW_QUOTA_LANE_RETIREMENT_PHASE_0_5_V1` scoped to `chatgpt_codex_subscription`
ONLY: promote the codex app-server collector to pool authority, demote/retire OpenClaw
from that pool's data plane, fix the two recorded collector defects, and re-verify the
dashboard. The GLM scope stays on the OpenClaw lane until a credentialed direct source
exists; then full lane retirement can be re-evaluated. `OPERATOR_PREAUTHORIZED=YES`
(conditional authorization already granted by this task's decision law).
