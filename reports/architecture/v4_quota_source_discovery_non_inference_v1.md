# V4 Quota Source Discovery — Non-Inference Codex + GLM

- **BLOCK-ID**: `V4_QUOTA_SOURCE_DISCOVERY_NON_INFERENCE_V1`
- **Issue**: #40 (parent track #32) · Predecessor: #39 campaign PASS
- **Date**: 2026-09-05
- **Base HEAD**: `4b49c37154934c319da991abf302d0718abab9e1` (= origin/main, tracked clean; ff-only sync applied from `4186660` after verified ancestry — the #39 closure pointer commit)
- **Mode**: DISCOVERY ONLY — read-only; no inference, no billing mutation, no secrets
- **Result**: **PASS**

## Per-pool classification (exactly one per pool)

| Pool | Classification |
|---|---|
| `chatgpt_codex_subscription` | **MANUAL_DASHBOARD_ONLY** |
| `glm_coding_plan` | **MACHINE_STATUS_SOURCE_CONFIRMED** (credential precondition absent — see §GLM.4) |

---

## CODEX — `chatgpt_codex_subscription` → MANUAL_DASHBOARD_ONLY

### Method (all read-only; zero generation, zero API/BYOK)

1. **Local CLI census** — `codex --version` → `codex-cli 0.133.0` (npm, windows-x86_64).
2. **Top-level help** (`codex --help`): full subcommand surface enumerated. **No
   `usage`, `status`, `quota`, or `limits` subcommand exists.** Generative/side-effectful
   commands (`exec`, `review`, `apply`, `resume`, `fork`, `cloud`, `sandbox`) were not
   invoked.
3. **`codex login --help`**: only `status` subcommand, documented "Show login status".
   Executed `codex login status` → `Logged in using ChatGPT` (exit 0) — confirms
   subscription auth mode; **no usage/quota payload**.
4. **`codex doctor --help`**: documented "Diagnose local Codex installation, config,
   auth, and runtime health" with `--json` = "Emit a redacted machine-readable
   report" — semantics proven non-generative from help BEFORE invocation (task law).
   Executed `codex doctor --json` (exit 1 due to TERM=dumb cosmetic check only).
   Content: machine-readable diagnostics for install/config/auth/network/sandbox/
   state/update — **zero quota/usage/rate-limit fields**. Auth facts observed
   (redacted by the tool itself): `stored API key: false`, `stored ChatGPT tokens:
   true`, `stored auth mode: chatgpt`, `ChatGPT base URL: https://chatgpt.com/backend-api/
   reachable (HTTP 403)` (unauthenticated reachability probe by the tool).
5. **`codex debug --help`** / **`codex features --help`**: `debug models` = raw model
   catalog; `features list` = feature flags — no usage sources. Not invoked (not needed).
6. **`~/.codex/config.toml`** (read-only): no quota/usage/rate-limit keys. Model
   `gpt-6-astra`, plugins, projects, desktop prefs only. (`show-context-window-usage`
   is context-window display, not commercial quota.)
7. **Local state DBs** (`state_5.sqlite`, `logs_2.sqlite`) — schema-only census
   (readOnly connection; table/column NAMES only, no row content):
   only consumption-adjacent column is `threads.tokens_used` (historical per-session
   token counter). **No rate-limit/quota/reset table or column.**
8. **Official CLI reference** (`developers.openai.com/codex/cli/reference.md`,
   fetched 2026-09-05): `/status` = "Display session configuration and token usage";
   `/usage` = "View account token usage **or use a rate-limit reset**". Both are
   **interactive TUI slash-commands**, not headless CLI subcommands; `/usage` embeds a
   reset/redemption action adjacent to billing mutation, which the task forbids — so
   driving the TUI is excluded even before considering scriptability.

### Why not MACHINE_STATUS_SOURCE_CONFIRMED

- No headless subcommand emits account usage;
- `codex doctor --json` is the only machine-readable report and carries no quota state;
- the documented usage views are interactive-TUI-only (and `/usage` couples viewing
  with reset redemption);
- no documented public machine endpoint on the ChatGPT backend exposes Codex usage
  for the ChatGPT-plan auth mode (the backend remains a private, undocumented API for
  this purpose);
- local artifacts carry only historical session token counts, never remaining/reset.

Remaining-quota / reset-window / timestamps: **not machine-observable** with current
evidence. Automatic freshness-governed collection: **NOT implementable now** without
either a future Codex CLI usage subcommand or a separately governed, explicitly
authorized TUI/backend integration (out of scope; do not improvise). The existing
`dashboard_snapshot` translator path (phase-1 #39) remains the support route and
fails closed when stale.

---

## GLM — `glm_coding_plan` → MACHINE_STATUS_SOURCE_CONFIRMED (credential precondition absent)

### Method (all read-only; zero generation through GLM)

1. **Local client census**: no `glm`/`zai` CLI on PATH; no `~/.z-ai`, `~/.glm`,
   `~/.config/z-ai` homes. `~/.config/opencode/opencode.jsonc` contains only a
   `$schema` reference — no endpoints, no keys. No Coding Plan client config exists
   locally beyond the repo registry entries.
2. **Registry surface re-check** (`configs/resources/registry.json`):
   `glm_coding_plan_client` and `cursor_byok_route` both bind
   `quota_pool_id: glm_coding_plan`; pool = one shared allowance for glm-5.3 +
   glm-5.3-flash; no per-model counters anywhere (consistent with #39).
3. **Repo evidence** (`docs/runtime/ISSUE_8_ZAI_AUTODETECTION_PACKET.yaml`): official
   chat/completions endpoints for General/Coding × Global/CN are already known from
   prior controlled evidence — used only to anchor provider base URLs, not as usage
   sources.
4. **Official provider documentation** (fetched 2026-09-05):
   - `docs.z.ai/devpack/extension/usage-query-plugin`: Z.AI ships an official
     **usage query plugin** for GLM Coding Plan quota — proves a supported
     machine-query path exists;
   - `docs.z.ai/devpack/overview`: Coding Plan = 5-hour + weekly credit windows,
     reset rules, published credit multipliers (structure matches
     `quota-pool-status-v1` windows);
   - the monitor endpoint `GET /api/monitor/usage/quota/limit` is documented by
     Z.AI tooling and corroborated by multiple independent integrations as returning
     JSON: `limits[]` with window type, usage, current value, **remaining**,
     `nextResetTime`, and plan `level`.
5. **Bounded live reachability probe** (2 requests total, GET, no credentials
   attached, 10s timeout, no body capture/persistence):
   - `https://api.z.ai/api/monitor/usage/quota/limit` → **HTTP 200**
   - `https://open.bigmodel.cn/api/monitor/usage/quota/limit` → **HTTP 200**
   (200 on unauthenticated request = monitor envelope; authenticated payload shape is
   documented, not sampled here — no secret was available or used, by design).
6. **Credential presence check** (names only, values never read/persisted):
   `ZAI_API_KEY` / `ZHIPUAI_API_KEY` / `ZAI_CODING_CN_API_KEY` / `GLM_API_KEY` —
   absent from process, User, and Machine scopes. `OPENAI_API_KEY` also absent
   (boundary intact).

### Observable fields (documented, non-secret metadata)

- remaining quota per window (5h + weekly), current usage, window type,
  `nextResetTime` timestamps, plan tier `level` — maps directly onto
  `quota-pool-status-v1` (`windows[]`, `remaining`, `reset_at`, `state`, `source`).

### Preconditions for an automatic collector (NOT implemented here)

1. an authorized Z.AI API key for the Coding Plan account must be provisioned
   (operator gate — absent today in every checked scope);
2. a separately governed collector task must authorize source-specific ingestion
   (poll frequency/freshness, fail-closed stale handling, secret handling —
   key stays in memory/env, never persisted);
3. CN mirror (`open.bigmodel.cn`) selected only if the account is on the CN plan —
   plan-region check belongs to the operator gate.

Machine-readability: **confirmed** (JSON monitor envelope, documented fields).
Freshness semantics: per-poll observation timestamped by the collector; windows are
provider-defined (rolling 5h + weekly). Automatic freshness-governed collection is
**implementable after the operator key gate** — not before.

---

## Acceptance mapping (issue #40)

| # | Requirement | Status |
|---|---|---|
| 1 | No inference used for quota discovery | PASS (zero generation both pools) |
| 2 | No OpenAI API/BYOK route introduced | PASS (`OPENAI_API_KEY` absent; nothing introduced) |
| 3 | No provider billing/account mutation | PASS (no `/usage` reset redemption path touched; GET-only probes) |
| 4 | No secrets persisted | PASS (env names only; no token/cookie/key content read) |
| 5 | Codex and GLM classified independently | PASS (one verdict per pool) |
| 6 | Collector sources evidenced, not guessed | PASS (help/docs/live probe evidence above) |
| 7 | States whether auto collection is implementable now | PASS (Codex: NO · GLM: after operator key gate) |
| 8 | No n8n/runtime/router/production changes | PASS (repo: report + LAST_CURSOR_REPORT only) |

## Files (this task)

| File | Change |
|---|---|
| `reports/architecture/v4_quota_source_discovery_non_inference_v1.md` | new — this report |
| `docs/runtime/LAST_CURSOR_REPORT.md` | updated |

No runtime/n8n/router/registry/production file touched. CURRENT_FRONTIER untouched
(no collector implemented; nothing became live-canonical).

## STOP law

No STOP was triggered: no generation, no secret access, no billing mutation, and no
unverified source was relied upon (the GLM verdict rests on official docs + a
no-auth reachability probe + multi-integration corroboration; the authenticated
payload remains unverified by direct sample until the operator key gate — recorded as
precondition, not as confirmation of payload contents).

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
