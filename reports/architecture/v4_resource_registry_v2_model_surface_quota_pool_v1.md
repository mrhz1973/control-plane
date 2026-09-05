# V4 Resource Registry V2 — Model / Access Surface / Quota Pool V1

- **BLOCK-ID**: `V4_RESOURCE_REGISTRY_V2_MODEL_SURFACE_QUOTA_POOL_V1`
- **GitHub issue**: #37 (first implementation slice of #32)
- **Date**: 2026-09-05
- **Base HEAD**: `e07aa2661a55282055f27eb6c684564d66ae3078` (verified = origin/main, branch main, tracked clean)
- **Result**: **PASS**

## Objective

Migrate the canonical static resource registry from `resource-registry-v1` to a
backward-safe `resource-registry-v2` that explicitly separates
`MODEL / ROLE -> ACCESS SURFACE -> QUOTA_POOL`, without enabling any new live route
and without changing any runtime/n8n behavior.

## Consumer census (bounded, before mutation)

Direct readers of `configs/resources/registry.json` / `resource-registry-v1`:

| # | Consumer | Registry usage |
|---|---|---|
| 1 | `tools/evaluate-execution-route.mjs` | `DEFAULT_REGISTRY_PATH`; strict `schema_version === "resource-registry-v1"`; reads `resources.*` (`roles`, `capabilities`, `compatible_resources`, `execution_location`) |
| 2 | `tools/n8n-v4-execution-routing-bridge-v1.mjs` | `REGISTRY_SCHEMA = "resource-registry-v1"` strict check; passes registry object to router |
| 3 | `tools/compose-v4-resource-status-control-plane-v1.mjs` | validates whole doc via `validateResourceRegistryObject`; seeds output keys from `resources`; source/location compatibility |
| 4 | `tools/validate-resource-registry-v1.mjs` | whole-doc validation vs `resource-registry-v1.schema.json` + `compatible_resources` semantics |
| 5 | `configs/resources/status.fail-closed.json` | implicitly keyed by resource id (not a reader of the file; baseline parity requirement) |
| 6 | Tests: `execution-router`, `v4-resource-status-control-plane-source`, `qwen-local-resource-status-overlay`, `qwen-local-adapter`, `v4-execution-adapter-registry`, `resource-registry-validator` | read `resources.*` from canonical file or feed it to router/composer/validator |

Docs/workflow references (`docs/contracts/*`, `workflows/patches/*`,
`docs/runtime/BACKLOG_V4_CODEX_IDE_CURSOR_QUALIFICATION.md`) mention the path but do
not parse the file; untouched.

## Schema v1 -> v2 mapping

| v1 | v2 |
|---|---|
| `schema_version: "resource-registry-v1"` | `schema_version: "resource-registry-v2"` |
| — | `registry_metadata` (version/purpose/compatibility/dynamic-data policy) |
| — | `models` (distinct identities: `glm-5.3`, `glm-5.3-flash`, `codex_subscription_models`, `qwen_local`, `composer`) |
| — | `access_surfaces` (`codex_ide_cursor_extension`, `codex_external_planner`, `openai_api_route` (forbidden/representational), `glm_coding_plan_client`, `cursor_native_model_route`, `cursor_byok_route`, `opencode_local_harness`) |
| — | `quota_pools` (`chatgpt_codex_subscription`, `glm_coding_plan`) |
| `resources` | `resources` — **verbatim v1 projection** (compatibility, see below) |

## Compatibility strategy

- `resources` is the previous canonical v1 object preserved **verbatim** (deep-equal
  to `e07aa2661a55282055f27eb6c684564d66ae3078:configs/resources/registry.json`,
  test-proven). Consumer #1–#6 semantics unchanged.
- `tools/validate-resource-registry-v1.mjs`: projects v2 → v1 (drop v2 sections,
  restore v1 `schema_version`, validate `resources` as-is) — fail-closed on truncated
  v2 docs missing mandatory sections.
- `tools/evaluate-execution-route.mjs` and
  `tools/n8n-v4-execution-routing-bridge-v1.mjs`: accept `"resource-registry-v1"` |
  `"resource-registry-v2"` (one-line scope each; identical projection shape).
- v1 consumers must not read `models`/`access_surfaces`/`quota_pools`; projection
  removal deferred to a later separately governed pass
  (`registry_metadata.compatibility.removal_policy`).

## Model -> surface -> pool matrix

| Model | Access surface(s) | Quota pool |
|---|---|---|
| `glm-5.3` | `glm_coding_plan_client`, `cursor_byok_route` | `glm_coding_plan` (shared) |
| `glm-5.3-flash` | `glm_coding_plan_client`, `cursor_byok_route` | `glm_coding_plan` (shared) |
| `codex_subscription_models` (dynamic: Sol/Terra/Luna/Astra observed 2026-09-05, NOT frozen) | `codex_external_planner`, `codex_ide_cursor_extension` | `chatgpt_codex_subscription` (shared) |
| `composer` | `cursor_native_model_route` | `null` — allowance `unverified`, no invented pool |
| `qwen_local` | `opencode_local_harness` | `null` — `commercial_quota: "none_local_unmetered"` |

## Shared-pool proofs (test-enforced)

- **Codex**: `codex_ide_cursor_extension.quota_pool_id == codex_external_planner.quota_pool_id == "chatgpt_codex_subscription"`; pool `shared_by_surfaces` lists exactly both; both surfaces allow only `chatgpt_subscription` and forbid `openai_api_key`/`byok_openai`/`api_billing`. One pool, two surfaces — no per-model duplication.
- **GLM**: `glm-5.3` ≠ `glm-5.3-flash` as model identities; both reach the single `glm_coding_plan` pool (surface refs + pool `shared_by_models == [glm-5.3, glm-5.3-flash]`); no quota double-counting fields exist.
- **No OpenAI API/BYOK route**: the only OpenAI-API-ish entry is `openai_api_route` with `surface_type: "none"`, `representational_only: true`, `status: "forbidden"`, `quota_pool_id: null`; no pool id matching `openai_api|api_key|byok` exists anywhere.

## Unknown/unverified handling (fail-closed)

- Cursor Composer/native allowance: `allowance_ownership.state: "unverified"`, `quota_pool_id: null` — nothing invented (issue #32 C).
- Codex IDE surface: `qualification.runtime_qualified: false` → must stay non-selectable until separately qualified.
- Qwen model identities: delegated to the Qwen runtime config, not duplicated; no concrete GGUF/profile data in registry (also preserves the existing "no hardcoded ollama model" validator rule).
- Pools declare `dynamic_values: "forbidden_in_registry"` + allowed observation sources (`dashboard_snapshot`, future normalized collector). **No 85%/88%/3x/multiplier/reset/timestamp numbers anywhere in the registry** (regex + structure test-enforced).
- All `model_selection_policy.frozen_list` are `false` (schema `const`); the suite rejects `frozen_list: true` and any `dynamic_values` mutation via the v2 schema.

## No dynamic quota hardcoded (proof)

- Suite checks: pools contain no `quota_remaining/remaining/percent/multiplier/reset_at/window_ends_at/next_cheaper_at` fields (regex over serialized pools);
- Codex dashboard observations (85%/88%) were **not** persisted; they remain runtime observations for future collectors under `resource-status-v1` (source `dashboard_snapshot`), which already exists unchanged;
- `tests/registry-v2/run.mjs` mutations `dynamic_values: "allowed"` and `frozen_list: true` are rejected by the v2 schema (negative tests).

## Focused tests

- `tests/registry-v2/run.mjs` — **56/56 PASS** (offline): structure, v1 deep-equal projection, shared-pool proofs, Codex subscription-only boundary, Cursor-not-a-pool, OpenCode unmetered, no-dynamic-values, dynamic model selection, referential integrity, Ajv validation vs `resource-registry-v2.schema.json` (positive + negative), v1-validator shim accept/fail-closed, router parity v2-vs-v1 (identical ROUTED decision; identical fail-closed on truncated registry).
- Consumer suites re-run after change — **135/135 PASS**: `resource-registry-validator` 7, `execution-router` 12, `v4-resource-status-control-plane-source` 34, `qwen-local-resource-status-overlay` 14, `qwen-local-adapter` 9, `v4-execution-adapter-registry` 19, `n8n-v4-execution-routing-bridge` 23, `planner-selection-evaluator` 17.
- `node --check` OK on all touched tools + new suite.

## Runtime/n8n untouched

No workflow, n8n, WF40/WF61/D-0025, dispatcher (18793), Tailscale, Qwen router/runtime, credential, billing or authorization change in this pass. No provider/generation calls made. `status.fail-closed.json` untouched (v1 shape + key parity with projection). Only files changed: registry data, new v2 schema/contract, one-scope compat edits in 3 consumer tools, new focused test suite, docs/reports.

## CURRENT_FRONTIER

Updated with a `RESOURCE_REGISTRY` row: registry v2 is now canonical and all current consumers are proven compatible (authorized by the dispatch since the migration is canonical + proven; collectors/routing explicitly NOT claimed complete).

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
