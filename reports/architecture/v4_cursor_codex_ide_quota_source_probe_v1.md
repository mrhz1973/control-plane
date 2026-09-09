# Cursor + Codex IDE Quota Source Probe

**Repository:** `mrhz1973/control-plane`
**Report:** `reports/architecture/v4_cursor_codex_ide_quota_source_probe_v1.md`
**Issue:** #73
**Scope:** READ-ONLY capability probe — no collector implemented, no model inference, no pacing, no auth mutation
**Identity law preserved:** `codex_ide_cursor_extension` ≠ Cursor native picker ≠ `codex_external_planner` ≠ OpenAI API/BYOK; both Codex surfaces share one pool `chatgpt_codex_subscription`

---

## Environment

| Field | Value |
|-------|-------|
| **HEAD** | `79102a7d137145e1b81e9c59fcb4ae7122d77d64` (== `origin/main` at probe start) |
| **Date/time (Europe/Rome)** | 2026-09-09 (~10:04–10:20 local) |
| **Cursor version** | `3.19.13` (`dd066f332fcea7382764400fde902f61920648d0`, x64) |
| **Cursor CLI** | `C:\Program Files\cursor\resources\app\bin\cursor.cmd` — editor open/diff/merge only; **no usage/quota subcommand** |
| **Codex extension ID** | `openai.chatgpt` |
| **Codex extension version** | `26.721.30844` (folder `openai.chatgpt-26.721.30844-win32-x64`) |
| **Codex extension displayName** | Codex – OpenAI’s coding agent |
| **Codex extension path** | `C:\Users\mrhz\.cursor\extensions\openai.chatgpt-26.721.30844-win32-x64` |
| **Bundled Codex runtime** | YES — `bin\windows-x86_64\codex.exe` → `codex-cli 0.146.0-alpha.3` |
| **PATH Codex CLI** | YES — `@openai/codex` → `codex-cli 0.133.0` (separate from bundled) |
| **OpenClaw (cross-check)** | `openclaw status --usage --json` via node entry `%APPDATA%\npm\node_modules\openclaw\openclaw.mjs` |

**Probe method (allowed only):** `Get-Command` / `--version` / `--help`; extension `package.json` + static keyword scan; official `codex app-server generate-json-schema` (local protocol surface); bounded Cursor `state.vscdb` **key-name** enumeration (values only for clearly non-auth usage-ish keys); OpenClaw read-only usage JSON.

**Hard walls respected:** no Cursor/ChatGPT UI scraping; no browser automation; no model inference; no Codex prompt; no login/logout/auth refresh; no credential/token reads persisted; no private undocumented HTTP provider calls; no `account/rateLimitResetCredit/consume`; no collector/pacing implementation; no production code changes beyond this report.

---

## Cursor native allowance capability

Cursor UI buckets commonly shown as **Cursor Models** and **Other Models** were searched in priority order.

### Search results

1. **Cursor CLI** — no documented/current read-only usage/quota/allowance command (`cursor --help` = editor surface only).
2. **Stable local runtime/status API** — none identified for allowance percentages.
3. **Local cached runtime state intended for usage display** — `ItemTable` / `cursorDiskKV` in `%APPDATA%\Cursor\User\globalStorage\state.vscdb` enumerated for usage/quota/allowance/billing/entitlement key **names**. No keys exposing Cursor Models / Other Models remaining/used percentages or reset horizons. Closest non-quota signals: `cursorAuth/stripeMembershipType` = `pro_plus` (plan label only); billing banner / credit-grant **dismissal** keys (not allowance meters).
4. **Extension/runtime logs** — not used as a normalized usage source (no stable machine-readable allowance contract found).
5. **Bounded application state** — schema/key enumeration only; no DB dump; auth/token/session keys skipped; no secrets persisted.

Existing observatory lane remains: `configs/runtime/quota-observatory/cursor-manual-observation.json` consumed by `tools/local-dev-resource-observatory-v1.mjs` with `accounting_mapping=UNVERIFIED`.

### Cursor Models

| Attribute | Finding |
|-----------|---------|
| **source** | MANUAL_ONLY (operator/manual observation file; Cursor Settings/usage UI) |
| **machine readable** | NO |
| **current value** | NOT_OBSERVED (no safe machine-readable local meter) |
| **semantics** | UNVERIFIED (USED vs REMAINING unknown without UI proof tied to a stable source) |
| **reset** | NOT_AVAILABLE from local machine-readable sources |
| **freshness** | manual only |
| **support/stability** | unsupported as automated source |

**CURSOR_MODELS_SOURCE=MANUAL_ONLY**

### Other Models

| Attribute | Finding |
|-----------|---------|
| **source** | MANUAL_ONLY |
| **machine readable** | NO |
| **current value** | NOT_OBSERVED |
| **semantics** | UNVERIFIED |
| **reset** | NOT_AVAILABLE |
| **freshness** | manual only |
| **support/stability** | unsupported as automated source |

**OTHER_MODELS_SOURCE=MANUAL_ONLY**

**CURSOR_ACCOUNTING_MAPPING=UNVERIFIED** — membership label `pro_plus` does **not** prove bucket mapping of models into Cursor Models vs Other Models.

---

## Codex IDE quota capability

### Inventory

- Official extension `openai.chatgpt` v`26.721.30844` installed under Cursor extensions.
- Bundled runtime `codex.exe` `0.146.0-alpha.3`; PATH CLI `0.133.0`.
- CLI subcommands include `doctor`, `app-server`, `features`, etc. **No** dedicated `usage` / `quota` / `rate-limit` CLI subcommand on `--help`.
- `codex doctor --json` (bundled): health report only — **no** usage/quota fields among keys (auth credential presence noted as secretish key name only; values not persisted).
- `~/.codex/.codex-global-state.json`: UI/project persistence; **no** durable 5h/weekly quota snapshot.

### Stable local machine-readable wrapper (protocol, not invoked live)

Official bundled CLI can emit the app-server protocol schema:

`codex app-server generate-json-schema`

Proven **read-only** local RPC method:

- **`account/rateLimits/read`** (params: `null`)
- Response: `GetAccountRateLimitsResponse`
  - `rateLimits` / `rateLimitsByLimitId` → `RateLimitSnapshot`
  - `primary` / `secondary` → `RateLimitWindow` with **`usedPercent`** (USED semantics) + optional **`resetsAt`** + optional `windowDurationMins`
  - optional `planType`
  - optional **`rateLimitResetCredits`** → banked reset inventory (see below)
- Sparse push: `AccountRateLimitsUpdatedNotification` (merge into last read)

Extension static clues (keyword hits only; source not persisted): IPC/event strings such as `account/rateLimits/updated`, `thread/tokenUsage/updated`. No dedicated VS Code command exposing quota to the shell (`chatgpt.resetNuxState` is unrelated NUX debug).

**Live values were NOT fetched** from `account/rateLimits/read` this probe (no app-server RPC session started; avoids auth-adjacent network path and mutation surface). Capability is classified from the official local protocol schema + extension inventory.

| Field | Capability |
|-------|------------|
| **5h** | AVAILABLE via protocol (`RateLimitWindow` primary/secondary + `windowDurationMins`); live IDE value NOT_OBSERVED this probe |
| **weekly** | AVAILABLE via protocol (second window); live IDE value NOT_OBSERVED this probe |
| **plan** | AVAILABLE via protocol (`planType`); live IDE value NOT_OBSERVED this probe |
| **observation timestamp** | AVAILABLE when RPC/notification observed (client wall-clock / notification time); not observed this probe |
| **source** | Codex app-server local method `account/rateLimits/read` (bundled/PATH Codex runtime used by extension) |

**CODEX_IDE_USAGE_SOURCE=MACHINE_READABLE**
(stable local app-server wrapper exists; current live snapshot not read this probe)

Semantics for windows: **USED** (`usedPercent`); remaining = `100 - usedPercent` when deriving effective remaining.

---

## OpenClaw cross-check

Same shared pool: **`chatgpt_codex_subscription`** (OpenClaw provider `openai-codex`).

Live read-only observation this probe:

| Window | usedPercent | remaining (derived) | resetAt (ISO) |
|--------|-------------|---------------------|---------------|
| 5h | 0 | 100% | `2026-09-09T13:14:40.000Z` |
| Week | 16 | 84% | `2026-09-15T23:42:41.000Z` |
| plan | `plus ($0.00)` | — | — |
| updatedAt | `2026-09-09T08:12:11.242Z` | — | — |

Operator correlation (ChatGPT Usage UI, not hardcoded): ~5h 100% remaining / weekly ~84% remaining — **compatible** with this OpenClaw observation.

**CODEX_IDE_VS_OPENCLAW=NOT_COMPARABLE**
(IDE `account/rateLimits/read` not executed; cannot assert match/mismatch against OpenClaw. Both are observations of the **same** pool when both are live.)

---

## Banked reset capability

Protocol fields on `GetAccountRateLimitsResponse.rateLimitResetCredits` (`RateLimitResetCreditsSummary`):

| Field | Protocol |
|-------|----------|
| **count** | `availableCount` (integer) |
| **scope** | per-credit `resetType` enum includes `codexRateLimits` (maps to Codex rate-limit windows; aligns with UI “weekly + 5h” complete reset narrative) |
| **expiry** | per-credit `expiresAt` (unix seconds, nullable) |
| **eligible / availability** | credit `status`: `available` \| `redeeming` \| `redeemed` \| `unknown` |
| **mutation** | `account/rateLimitResetCredit/consume` exists — **NOT called**; **mutation required = NO** for observation |

Static extension keyword `banked`: **0** hits (UI may use different wording; protocol uses “rate limit reset credits”).

Operator ChatGPT Usage evidence (correlation only): ≥1 banked reset visible; complete weekly+5h reset; expiry ~2026-10-05 00:43 Europe/Rome — **not** machine-read this probe.

**BANKED_RESET_SOURCE=MACHINE_READABLE** via same `account/rateLimits/read` → `rateLimitResetCredits`
**BANKED_RESET_COUNT=NOT_OBSERVED** (RPC not invoked)
**BANKED_RESET_EXPIRY=NOT_OBSERVED**
ChatGPT Web UI remains a manual correlation path only; no UI scraping performed.

---

## Accounting boundaries

| Domain | What it is | What it is not |
|--------|------------|----------------|
| **A. Cursor native subscription allowance** | Cursor Models / Other Models meters (UI); manual observatory lane; mapping UNVERIFIED | Not ChatGPT Codex 5h/weekly |
| **B. ChatGPT Codex subscription quota** | 5h + weekly (+ banked reset credits) for `chatgpt_codex_subscription` | Not Cursor native allowance |

**Codex extension running inside Cursor does not imply Codex burn belongs to Cursor Models / Other Models.**
Surfaces `codex_ide_cursor_extension` and `codex_external_planner` share **one** pool: `chatgpt_codex_subscription`. No second Codex pool invented.

---

## Future pacing inputs matrix

| FIELD | SOURCE | MACHINE_READABLE | FRESHNESS | SAFE | NOTES |
|-------|--------|------------------|-----------|------|-------|
| effective remaining (Codex) | OpenClaw `status --usage --json` (primary today); future Codex `account/rateLimits/read` | AVAILABLE_MACHINE_READABLE | OpenClaw: provider `updatedAt` + collector TTL; Codex RPC: on-read | YES read-only | MIN of binding windows; same pool |
| short-window reset horizon (5h) | OpenClaw window resetAt; Codex `RateLimitWindow.resetsAt` | AVAILABLE_MACHINE_READABLE | on observation | YES | |
| long-window reset horizon (weekly) | OpenClaw Week resetAt; Codex secondary window | AVAILABLE_MACHINE_READABLE | on observation | YES | |
| banked reset inventory + expiry | Codex `rateLimitResetCredits` | AVAILABLE_MACHINE_READABLE | on `account/rateLimits/read` | YES observe / NO consume | ChatGPT UI = AVAILABLE_MANUAL correlation |
| observation timestamp/freshness | OpenClaw `usage.updatedAt`; Codex client clock on RPC | AVAILABLE_MACHINE_READABLE | — | YES | |
| model/accounting bucket identity (Cursor Models / Other Models) | Cursor UI / manual file | AVAILABLE_MANUAL | operator | YES manual | ACCOUNTING_MAPPING=UNVERIFIED |
| Cursor native remaining % | none machine-readable found | NOT_AVAILABLE | — | — | MANUAL_ONLY |
| Qwen local availability | existing observatory (out of scope detail) | UNVERIFIED here | — | — | pacing combiner input later |
| GLM blackout 08:00–12:00 Europe/Rome | policy/config (later) | UNVERIFIED here | — | — | not probed |
| commercial reserve floors / burn rate / quality | future controller | NOT_AVAILABLE | — | — | no pacing implemented |

---

## Recommendation

```text
CURSOR_NATIVE_PRIMARY_SOURCE=MANUAL_OBSERVATION_FILE
CODEX_PRIMARY_SOURCE=OPENCLAW_STATUS_USAGE_JSON
CODEX_SECONDARY_CROSSCHECK=CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ
BANKED_RESET_SOURCE=CODEX_APP_SERVER_RATE_LIMIT_RESET_CREDITS
COLLECTOR_IMPLEMENTATION_FEASIBLE=PARTIAL
```

- **Cursor native collector:** not feasible from local machine-readable sources found; keep manual lane + UNVERIFIED mapping.
- **Codex IDE collector:** feasible **later** via gated adapter to local `account/rateLimits/read` (params null; never call consume); must share `chatgpt_codex_subscription` with OpenClaw — no second pool.
- **Near-term:** keep OpenClaw as primary live Codex pool source (already proven); treat Codex app-server as secondary cross-check once a separate implementation task authorizes the RPC.
- **Banked resets:** observe only via `rateLimitResetCredits`; never consume in automation without an explicit human gate.

---

## Security

- **SECRETS_PERSISTED=NO**
- **RAW_AUTH_MATERIAL_PERSISTED=NO**
- **PRIVATE_PROVIDER_ENDPOINT_CALLED=NO** (no direct undocumented HTTPS; no `account/rateLimits/read` RPC executed)
- **MODEL_INFERENCE=NO**
- Schema generation and static scans used only; doctor JSON keys summarized without credential values; Cursor DB values skipped for auth-like keys.

---

## Final

**FINAL_STATUS=PASS_WITH_MANUAL_GAPS**

Gaps: Cursor Models / Other Models remain MANUAL_ONLY + UNVERIFIED; Codex IDE and banked-reset **live** percentages/counts not observed this probe (protocol capability proven, RPC not invoked); OpenClaw cross-check cannot be matched to a simultaneous IDE RPC snapshot.
