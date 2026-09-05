# V4 Codex Subscription Quota Pool Snapshot Translator V1

- **BLOCK-ID**: `V4_CODEX_SUBSCRIPTION_QUOTA_POOL_SNAPSHOT_TRANSLATOR_V1`
- **Campaign**: `V4_QUOTA_AWARE_ROUTING_AUTONOMOUS_90M_SPRINT_V2` PHASE 1 (issue #39, parent #32)
- **Date**: 2026-09-05
- **Base HEAD**: `b6c8ab0bed41ddc58f60240e7e053bc7beb6e8b8` (= origin/main, tracked clean at phase start)
- **Result**: **PASS**

## Why a complementary contract was required

`resource-status-v1` is keyed by **resource id**. A shared pool observed once
(e.g. `chatgpt_codex_subscription`, serving both `codex_ide_cursor_extension` and
`codex_external_planner`) cannot be represented there without duplicating the same
allowance state across multiple resource entries — exactly the double-counting #32
forbids. Per phase-1 authorization, the minimal complementary contract
**`quota-pool-status-v1`** was added, keyed by registry-v2 `quota_pool_id`.

## Files (this phase)

| File | Change |
|---|---|
| `docs/contracts/quota-pool-status-v1.schema.json` | new — minimal shared-pool dynamic status schema |
| `docs/contracts/quota-pool-status-v1.md` | new — contract: identity/sharing law, static/dynamic boundary, freshness, translator law, result wrapper |
| `tools/translate-quota-pool-snapshot-v1.mjs` | new — deterministic OFFLINE translator (`codex` kind this phase; `glm` pool id pre-bound for phase 2) |
| `tests/quota-pool-codex-translator/run.mjs` | new — focused suite **33/33 PASS** |
| `reports/architecture/v4_codex_subscription_quota_pool_snapshot_translator_v1.md` | new — this report |

No existing file modified. Registry untouched (re-validated in-suite). No workflow/
n8n/runtime/router change. No CURRENT_FRONTIER change (capability not yet routed).

## Representation

One status entry per POOL (schema `quota-pool-status-v1`):

- `quota_pool_id` (binding to registry-v2 `quota_pools`; unknown pool id → `QUOTA_POOL_UNKNOWN` intent),
- `state`: `available` (observed remaining > 0) / `exhausted` (all observed windows 0) / `unknown` (insufficient evidence — **missing data is never availability**),
- `windows[]`: `rolling`/`weekly`/`monthly`/`unknown` × `remaining` (`percent` 0–100, `normalized` 0–1, `unknown`+null), optional evidence-only `window_ends_at`/`reset_at`, per-window freshness,
- `source`: `dashboard_snapshot`/`manual`/`provider_api`/`internal_ledger` (output binds `dashboard_snapshot` for dashboard input; other enum values exist for the shared law, non-dashboard sources rejected by this translator),
- `observed_at` (from snapshot; translator never restamps), `updated_at` (evaluation time), `freshness` (`fresh` iff age ≤ 300000 ms, aligned with resource-status-v1),
- `reserve_policy_ref`: reference to separately governed reserve policy, or null (**policy is not observation**),
- `economics`: only when explicitly supplied AND `verified: true`; otherwise `null` = unknown — unknown economics are never cheap.

## Translator law compliance (offline, no invention)

- No ChatGPT/Codex/UI access, no scraping/browser automation, no Codex invocation, no
  OpenAI API call, no credential/cookie reading — the tool is pure input→output
  transformation (`translateQuotaPoolSnapshot(snapshot, {kind, nowMs})`),
- injectable `nowMs` clock → deterministic tests,
- zero hardcoded live values (values enter only via input; suite proves two different
  inputs yield different outputs and regex-scans the tool source for embedded
  percentages — clean),
- fail-closed classifications: `SNAPSHOT_MISSING_DATA`, `SNAPSHOT_INVALID_PERCENT`,
  `SNAPSHOT_INVALID_RESET_AT`, `SNAPSHOT_STALE` (with stale fail-closed status echo),
  `SNAPSHOT_FUTURE_DATED`, `SNAPSHOT_SECRET_LIKE`, `SNAPSHOT_INVALID`.

## Shared-pool identity proof

`chatgpt_codex_subscription` is produced ONCE and the registry binds BOTH surfaces to
the same id — one observation serves `codex_ide_cursor_extension` +
`codex_external_planner` (suite checks: pool binding + both-surface identity +
single-entry output). No per-surface duplication exists anywhere in the output shape.

## Focused tests (33/33 PASS)

pool binding (2) · valid normalization incl. doc validates against new schema (5) ·
rolling window (1) · weekly window normalized (1) · unknown window stays unknown (1) ·
missing windows/observed_at/source fail closed (3) · invalid percent/normalized/
non-numeric rejected (3) · invalid reset timestamp rejected (1) · stale → `SNAPSHOT_STALE`
+ fail-closed status (1) · exact max-age boundary fresh (1) · future-dated rejected (1) ·
single pool serves both surfaces (1) · values input-driven not hardcoded (2) · no
OpenAI API/BYOK semantics in tool or output + forbidden sources rejected (2) ·
secret-like rejected (1) · reserve ref passthrough (1) · unverified economics → null,
verified economics passthrough (2) · zero-remaining → exhausted (1) · GLM binding for
phase 2 (1) · CLI single-JSON contract (1) · registry still valid/untouched (1).

## Codex usage / evidence provenance

No Codex generation or probe was performed in this phase. Snapshot values used in
tests are synthetic fixture values (62/88/7/5/150/0...), explicitly NOT the operator's
live observations; no live percentage/reset timestamp is persisted anywhere.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
