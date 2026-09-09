# Quota Source Capability Probe

**Repository:** `mrhz1973/control-plane`
**Report:** `reports/architecture/v4_quota_source_capability_probe_v1.md`
**Issue:** #73 (quota observability lineage)
**Scope:** OBSERVATION ONLY — no collectors implemented, no inference invoked, no activation
**Companion contracts:** `docs/contracts/quota-pool-status-v1.md`, `resource-registry-v2`

---

## Environment

- **HEAD:** `2ace37cfd4115327415644e4e55ec5382f66616e` (== `origin/main`, tracked clean at start and at persist time)
- **Date/time (Europe/Rome):** 2026-09-09, probes run ~04:48–06:55 UTC+2; report persisted ~07:05 UTC+2
- **Method:** read-only CLI surface inspection (`Get-Command`, `--version`, `--help`, proven read-only `status` commands), one read-only SSH inspection of the staged NEW VPS OpenClaw tree, and comparison against existing canonical quota contracts
- **Read-only guarantees:** no POST `/v1/tick`; no Qwen/GLM/Codex/ChatGPT Web invocation; no OpenClaw activation (Windows gateway stayed stopped `ECONNREFUSED 127.0.0.1:18789`; VPS units none/listener none); no Hermes browser action or prompt; no login/logout/credential refresh; no config write; no plugin/package install; no n8n/VPS/Tailscale/receipt/queue mutation; no Git-tracked file change before this report
- **Redaction law applied during probing:** token/secret/password/cookie/authorization/API-key/credential fields redacted at capture; long strings and credential-like values never persisted

---

## Capability matrix

| SOURCE | LOCATION | AVAILABLE | GLM_QUOTA | CODEX_QUOTA | CURSOR_ALLOWANCE | CHATGPT_WEB_LIMITS | MACHINE_READABLE | AUTH_CONTEXT | SAFE_READ_ONLY | CAN_FEED_CANONICAL_STATE | NOTES |
|--------|----------|-----------|-----------|-------------|------------------|--------------------|------------------|--------------|----------------|--------------------------|-------|
| OpenClaw CLI | Windows workstation (`C:\Users\mrhz\AppData\Roaming\npm\openclaw.ps1`) | YES (`2026.5.20 (e510042)`) | **REAL_VALUES** (`zai`: Tokens 5h / Tokens Limit / Monthly usedPercent + resetAt) | **REAL_VALUES** (`openai-codex`: 5h / Week usedPercent + resetAt, plan `plus`) | NO | NO | YES (`status --json`, `status --usage --json`) | Existing stored profiles (zai API-key profile; openai-codex OAuth profile present but marked `expired` in models-status view) | YES proven live (`status --usage --json` executed; gateway stopped; no mutation) | **YES** — bounded adapter can map `usage.providers[]` into existing pool statuses | Live observation this probe: zai Limit window usedPercent 75, resetAt `1789166105998`; Monthly usedPercent 0, resetAt `1791153305999`; codex 5h usedPercent 0, Week usedPercent 16, plan `plus ($0.00)`; no cursor/chatgpt-web provider entries |
| OpenClaw staged | NEW VPS `/opt/openclaw-app/bin/openclaw` | YES staged (`2026.8.1-beta.3 (5831b80)`), symlink → `../lib/node_modules/openclaw/openclaw.mjs` | SUPPORTED_CLI (help proves `status --usage` exists in this version) | SUPPORTED_CLI (same) | NO | NO | YES (help proves `--json`) | **ABSENT**: no `/root/.openclaw` state, no units, no listener — auth/onboarding was never migrated | STAGED, do not run status (would require activation/onboarding = mutation) | Potential only after separately gated activation | `KEEP_STAGED_PENDING` respected; recorded as `STAGED_STATUS_REQUIRES_ACTIVATION` |
| Hermes Agent | Windows workstation (`C:\Users\mrhz\AppData\Local\hermes\bin\hermes.exe`) | YES (`v0.21.0 (2026.8.31)`, git install) | NO (no Z.AI/GLM credentials configured; status shows `✗ not configured`) | NO (Codex auth: `No Codex credentials stored`) | NO | INDIRECT only (browser/tool surface toward authenticated ChatGPT Web is the qualified concept; account limits not exposed as a read-only CLI query) | PARTIAL (`hermes insights` = session analytics; `--usage-file` writes JSON usage **after a one-shot `-z` run**, i.e. requires an agent run = inference — forbidden) | Mostly absent (OpenRouter/OpenAI/Z.AI/… all `not set`; Nous Portal, Codex OAuth, Qwen OAuth, xAI OAuth all `not logged in`) | YES for `status`/`insights` help-level inspection | WEAK — insights are local session analytics, not provider-account quota | `HERMES_USAGE_CAPABILITY=INTERACTIVE_ONLY` for provider usage (inside an authenticated interactive session/agent run); no safe non-interactive commercial-quota query on this install |
| OpenCode core | Windows workstation (`C:\Users\mrhz\AppData\Roaming\npm\opencode.ps1`) | YES (`1.18.25`) | NO | NO (no provider-account quota; `stats` reports **local session** token/cost aggregates only — observed `Total Cost $0.00`, sessions/messages/tool usage) | NO | NO | PARTIAL (`opencode stats` local aggregates; `providers list` shows configured credentials) | Provider credentials configurable via `providers login` (NOT exercised — login forbidden) | YES for `--help`/`stats`/`providers list` (no inference performed) | NO for commercial pools | `OPENCODE_CORE_QUOTA=NOT_SUPPORTED`; third-party quota plugins exist in the ecosystem — **THIRD_PARTY_PLUGIN_ONLY**, not installed per hard wall |
| Cursor | Windows workstation (IDE app) | Installed as app; no stable local CLI quota surface identified in this probe | NO | NO | **NOT from CLI** (no `Get-Command` surface; no stable machine-readable allowance output found; UI scraping forbidden) | NO | NO proven | Cursor account session exists in IDE only | n/a | NO | `CURSOR_QUOTA_SOURCE=MANUAL_ONLY` (existing manual observation file lane); `ACCOUNTING_MAPPING=UNVERIFIED` is preserved — this probe produced no evidence to change it |
| ChatGPT Web | Browser session (Hermes-driven surface per canonical docs) | Available as cognitive domain, not as a quota probe | NO | NO | NO | **NOT read-only-queryable** without an authenticated interactive session + browser action (both forbidden here) | NO | Authenticated browser session only | Not applicable without browser action | NO | Remains `SEPARATE_AVAILABILITY_DOMAIN`; no safe non-interactive limits source found |

---

## Best source by accounting domain

- **GLM_BEST_SOURCE=** Windows OpenClaw `openclaw status --usage --json` → provider `zai` windows (Tokens 5h / Tokens Limit / Monthly). Only live source that returned real GLM-pool numbers this probe. Runner-up (already canonical when a credential is provisioned): `tools/rt25-quota-ingest-glm-v1.mjs` monitor mode (`GET /api/monitor/usage/quota/limit`, env `ZAI_API_KEY`/`ZHIPUAI_API_KEY` presence-checked only).
- **CODEX_BEST_SOURCE=** Windows OpenClaw `openclaw status --usage --json` → provider `openai-codex` windows (5h / Week + plan). Runner-up: existing manual dashboard snapshot lane through `tools/rt25-quota-ingest-codex-v1.mjs` (`MANUAL_DASHBOARD_ONLY` law, unchanged).
- **CURSOR_BEST_SOURCE=** None machine-readable. Keep existing manual observation lane (`configs/runtime/quota-observatory/cursor-manual-observation.json` consumed by `tools/local-dev-resource-observatory-v1.mjs`), `accounting_mapping=UNVERIFIED` preserved.
- **CHATGPT_WEB_BEST_SOURCE=** None safe non-interactive. The only qualified path is the Hermes-driven browser surface inside an authorized session (cognitive work), which is not a quota collector; availability stays observed per existing `chatgpt_web` observatory entry (`SEPARATE_AVAILABILITY_DOMAIN`).

---

## Recommended architecture

- **PRIMARY_QUOTA_COLLECTOR=** Windows OpenClaw `openclaw status --usage --json` (read-only; already-stored profiles; proven machine-readable for both `glm_coding_plan` (zai) and `chatgpt_codex_subscription` (openai-codex) pool domains)
- **SECONDARY_CROSSCHECK=** GLM: Z.AI monitor endpoint via existing `rt25-quota-ingest-glm-v1.mjs` monitor mode when the operator provisions a credential. Codex: existing manual dashboard snapshot ingest (`rt25-quota-ingest-codex-v1.mjs`). Periodic human re-verification that OpenClaw usage windows keep matching provider dashboards.
- **MANUAL_FALLBACK=** Cursor: manual observation file (current law, `ACCOUNTING_MAPPING=UNVERIFIED`). ChatGPT Web: operator-observed availability entries (current law). Codex/OpenClaw unavailability: manual dashboard snapshots.
- **UNKNOWN_POLICY=FAIL_CLOSED**

---

## Integration target (no second authority)

For every viable source, the only permitted path is:

```text
source probe
  ↓ bounded adapter (new, future task; NOT implemented here)
  ↓ EXISTING canonical quota state (docs/contracts/quota-pool-status-v1.md via
    tools/rt25-canonical-quota-state-v1.mjs + translate-quota-pool-snapshot-v1.mjs;
    source law becomes e.g. provider_api/observed snapshot — values never invented)
  ↓ GET /v1/resources (tools/local-dev-resource-observatory-v1.mjs consumes
    canonical quota compose; pools glm_coding_plan + chatgpt_codex_subscription,
    single entry per pool, shared_by_models/surfaces unchanged)
  ↓ dispatcher dashboard (http://127.0.0.1:18793/dashboard)
```

Feasibility per domain:

- **glm_coding_plan:** FEASIBLE — OpenClaw `usage.providers[provider=zai].windows[]` carries `label` (5h/limit/monthly → `rolling`/`weekly`/`monthly` mapping decision needed in the future adapter), `usedPercent` (translator consumes remaining-or-used with explicit direction), `resetAt` epoch ms → `reset_at`. Must respect one-pool-two-models law (serves glm-5.3 + glm-5.3-flash; OpenClaw reports pool-level usage, not per-model).
- **chatgpt_codex_subscription:** FEASIBLE — `usage.providers[provider=openai-codex].windows[]` (5h → rolling, Week → weekly) + optional `plan` string as source metadata only (economics stay `null` unless separately verified). Must serve both Codex surfaces from the single pool entry.
- **cursor allowance:** NOT FEASIBLE from these sources — manual lane unchanged, mapping stays UNVERIFIED.
- **chatgpt_web:** NOT FEASIBLE as quota — stays a separate availability-domain observation.

Freshness: statuses inherit the existing deterministic fresh/stale law (`quota-pool-status-v1` §4, injectable `nowMs`); OpenClaw `usage.updatedAt` becomes the observation timestamp; an absent/stale OpenClaw observation must degrade pools to `unknown` (fail closed), never to healthy.

No schema changes, no second quota authority, no double-counting: adapters (future) write only through the existing RT25 ingest lane (`v4-rt25-quota-ingest-result-v1`) exactly like today's manual/monitor ingests.

---

## Secrets / privacy

- **SECRETS_PERSISTED=NO**
- **RAW_AUTH_MATERIAL_PERSISTED=NO**
- During probing, token/secret/cookie/authorization/API-key/credential fields and any long credential-like string were redacted before storage; this report contains only normalized percentages, window labels, plan tier label, and epoch reset timestamps. VPS paths and SSH host aliases referenced are already canonical in repo docs; no credential material or private key content is included.

---

## Final

- **FINAL_STATUS=PASS_WITH_UNAVAILABLE_SOURCES** (real values proven for GLM + Codex via Windows OpenClaw; VPS OpenClaw staged-not-activated; Cursor machine-readable source unavailable; ChatGPT Web limits non-interactive unavailable; Hermes interactive-only)
