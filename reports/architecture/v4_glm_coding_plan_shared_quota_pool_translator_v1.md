# V4 GLM Coding Plan Shared Quota Pool Translator V1

- **BLOCK-ID**: `V4_GLM_CODING_PLAN_SHARED_QUOTA_POOL_TRANSLATOR_V1`
- **Campaign**: `V4_QUOTA_AWARE_ROUTING_AUTONOMOUS_90M_SPRINT_V2` PHASE 2 (issue #39, parent #32)
- **Date**: 2026-09-05
- **Base HEAD**: `b28fd62b444ced5a2e538cb3b67e3e930130ea08` (= origin/main, tracked clean at phase start; PHASE 1 PASS preverified)
- **Result**: **PASS**

## Reuse of the Phase 1 quota-pool law

No new contract needed: the phase-1 `quota-pool-status-v1` contract/schema and the
deterministic translator `tools/translate-quota-pool-snapshot-v1.mjs` already carry the
full shared-pool law. The GLM kind is bound to registry-v2 pool
**`glm_coding_plan`** (`POOL_IDS.glm`), which was pre-registered in phase 1.

## One shared allowance serves both GLM models

- `glm-5.3` and `glm-5.3-flash` are distinct model identities in registry-v2;
- both `glm_coding_plan_client` and `cursor_byok_route` surfaces bind to the single
  `glm_coding_plan` pool; pool `shared_by_models == [glm-5.3, glm-5.3-flash]`;
- the translator emits **one** pool entry — the output shape contains no per-model
  quota counters (suite proves the serialized doc never mentions either model id and
  contains exactly one `quota_pools` key). No double counting is representable.

## Input / output

Input: already-collected normalized/manual provider evidence
(`dashboard_snapshot` | `manual` source; others rejected). When supplied it may carry:
remaining quota/capacity (percent 0–100 / normalized 0–1 / unknown), window type +
`reset_at`/`window_ends_at` (evidence-only, ISO-validated), observation timestamp,
optional economics **only when `verified: true`**. Output: one `quota-pool-status-v1`
entry + `quota-pool-status-translate-result-v1` wrapper (same classifications/law as
phase 1: `SNAPSHOT_STALE` fail-closed echo, `SNAPSHOT_FUTURE_DATED`,
`SNAPSHOT_MISSING_DATA`, `SNAPSHOT_INVALID_PERCENT`, `SNAPSHOT_INVALID_RESET_AT`,
`SNAPSHOT_SECRET_LIKE`).

## No invention (economics + values)

- No hardcoded current quota percentages, no reset time, **no assumed 3× morning
  multiplier** — tool source regex-scanned clean (`3x|multiplier\s*[:=]\s*\d|morning`);
- unknown/absent economics → `economics: null` = explicit UNKNOWN, never cheap;
- unknown economics supplied with `verified: false` are dropped (→ null);
- unknown window/remaining stays `state: "unknown"`; zero observed → `exhausted`;
- no provider inference/model call for quota discovery (translator is pure).

## Files (this phase)

| File | Change |
|---|---|
| `tests/quota-pool-glm-translator/run.mjs` | new — focused suite **25/25 PASS** |
| `reports/architecture/v4_glm_coding_plan_shared_quota_pool_translator_v1.md` | new — this report |

No source/tool/schema/registry modification in this phase (phase-1 translator reused
as-is; GLM kind was already implemented there). No workflow/n8n/runtime change.

## Focused tests (25/25 PASS)

distinct GLM identities exist (1) · both share one pool + surfaces collapse to one
pool id (2) · single-entry doc, no per-model counters, validates vs schema (3) ·
monthly window + reset passthrough (1) · manual evidence accepted (1) · stale fail
closed (1) · missing windows/snapshot fail closed (2) · invalid percent + invalid
reset rejected (2) · unverified economics → null, absent → null, verified →
passthrough (3) · no 3x/multiplier hardcoded, no live percent/reset hardcoded (2) ·
no OpenAI API/BYOK semantics (1) · exhausted law (1) · future-dated rejected (1) ·
registry untouched (1) · CLI glm single-JSON (1).

## Provider evidence status

No GLM provider call, no dashboard scraping, no model inference for quota discovery.
All fixture values are synthetic (41/137/10/0...). Provider economics remain
**unverified** and are represented as unknown until real verified evidence arrives.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
