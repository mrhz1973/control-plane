# V4 Quota-Aware Routing Autonomous 90m Sprint V2

- **CAMPAIGN-ID**: `V4_QUOTA_AWARE_ROUTING_AUTONOMOUS_90M_SPRINT_V2`
- **Tracking**: GitHub issue #39 · Parent #32
- **Date**: 2026-09-05
- **Mode**: unattended sequential campaign (PHASE 1 → 2 → 3, per-phase law A–J)
- **Result**: **PASS — ALL 3 PHASES + CLOSURE**

## Starting state

- Canonical start HEAD: `b6c8ab0bed41ddc58f60240e7e053bc7beb6e8b8` (== origin/main, branch main, tracked clean at startup)
- Startup verification: repo/origin/branch verified, fetch applied, HEAD == origin/main == canonical start. No reset/rebase/force-push/stash/clean used during the campaign (one bounded correction cycle inside phase 3 test development, no Git history rewrite).

## Phase commits and tests

| Phase | Commit (remote-verified) | Subject | Focused tests |
|---|---|---|---|
| 1 | `b28fd62b444ced5a2e538cb3b67e3e930130ea08` | `cursor-pass: V4_CODEX_SUBSCRIPTION_QUOTA_POOL_SNAPSHOT_TRANSLATOR_V1` | **33/33 PASS** |
| 2 | `bcc537e28e94dca86441646d50a9942b077f9ec8` | `cursor-pass: V4_GLM_CODING_PLAN_SHARED_QUOTA_POOL_TRANSLATOR_V1` | **25/25 PASS** |
| 3 | `23365e650553a59ead0aca077a5e4e84b7b98857` | `cursor-pass: V4_OFFLINE_QUOTA_POOL_AWARE_ROUTE_SELECTION_V1` | **18/18 PASS** (+ regression: codex 33, glm 25, registry-v2 64, execution-router 12 — all PASS) |
| FINAL | this commit | `cursor-pass: V4_QUOTA_AWARE_ROUTING_AUTONOMOUS_90M_SPRINT_V2` | closure only |

Each phase: tracked-clean + HEAD==origin/main at entry · `git diff --check` clean ·
selective staging · push · remote verify before next phase.

## Files changed by phase

**PHASE 1** (new): `docs/contracts/quota-pool-status-v1.schema.json`,
`docs/contracts/quota-pool-status-v1.md`, `tools/translate-quota-pool-snapshot-v1.mjs`,
`tests/quota-pool-codex-translator/run.mjs`,
`reports/architecture/v4_codex_subscription_quota_pool_snapshot_translator_v1.md`.

**PHASE 2** (new): `tests/quota-pool-glm-translator/run.mjs`,
`reports/architecture/v4_glm_coding_plan_shared_quota_pool_translator_v1.md`.

**PHASE 3** (new): `tools/evaluate-quota-aware-route-v1.mjs`,
`tests/quota-aware-route-selection/run.mjs`,
`reports/architecture/v4_offline_quota_pool_aware_route_selection_v1.md`.

**FINAL** (new/updated): `reports/architecture/v4_quota_aware_routing_autonomous_90m_sprint_v2.md`
(this file), `docs/runtime/LAST_CURSOR_REPORT.md`.
No pre-existing file modified in any phase except `LAST_CURSOR_REPORT.md` at closure.
`CURRENT_FRONTIER` untouched: the delivered capabilities are offline/manual-snapshot
only, not live-canonical (frontier row for RESOURCE_REGISTRY remains accurate as-is).

## What was actually delivered (canonical + proven)

1. **quota-pool-status-v1** — minimal complementary contract keyed by registry-v2
   `quota_pool_id`: one status per shared pool; freshness (fresh/stale, 300s),
   state (available/exhausted/unknown), windows (rolling/weekly/monthly/unknown ×
   percent/normalized/unknown), evidence-only reset/window timestamps,
   `reserve_policy_ref` (policy ≠ observation), economics only when `verified: true`;
   fail-closed classifications (STALE/FUTURE_DATED/MISSING_DATA/INVALID_PERCENT/
   INVALID_RESET_AT/SECRET_LIKE).
2. **Codex subscription snapshot translator** — deterministic offline translation of an
   already-collected dashboard snapshot bound to `chatgpt_codex_subscription`
   (source `dashboard_snapshot`), serving both Codex surfaces via the single pool id.
3. **GLM Coding Plan shared translator** — same law bound to `glm_coding_plan`; one
   pool observation drives `glm-5.3` + `glm-5.3-flash`; no per-model counters
   representable; unknown economics explicit.
4. **Offline quota-pool-aware route evaluator** — pure library composing
   model→surface→pool→pool-status with laws: shared pool evaluated once;
   missing/stale/unknown → CONSERVE_UNKNOWN; reserve floor block; adequate unmetered
   local preferred (scarce pools preserved); no silent capability/quality substitution;
   urgent never deferred; deferral only with explicit policy; unknown economics never
   cheap; API/BYOK structurally forbidden (robust even against tampered registry);
   evaluator purity (no registry mutation).

## Explicit non-claims (fail-closed honesty)

- Codex qualification generation used: **NO** (no Codex probe/generation performed);
- OpenAI API / BYOK / API billing used or introduced: **NO** (ChatGPT Plus/Codex
  subscription policy preserved everywhere);
- Qwen quota-discovery generation: **NO** (no Qwen call at all);
- live provider scraping / browser automation: **NO**;
- runtime / n8n / WF40 / WF61 / D-0025 / dispatcher / Tailscale / production changed: **NO**;
- live automatic Codex collector: **NOT implemented** (translator consumes
  already-collected snapshots only);
- live automatic GLM collector: **NOT implemented** (same);
- production quota-aware routing: **NOT activated** (phase-3 evaluator is offline,
  unwired, no authorization change).

## Remaining #32 dependency (unchanged)

Source-specific live collectors/translators for Codex + GLM (freshness-governed),
verified provider economics/time-window evidence (e.g. GLM window multipliers remain
unverified), time-window economic routing, wiring of the offline evaluator into the
canonical router path behind a separately governed authorization, consumer migration
off the v1 `resources` projection.

## Provider evidence status

Only offline/manual snapshot ingestion exists. All percentages/timestamps in tests are
synthetic fixtures. No real provider quota/reset/cost value was persisted by this
campaign.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
