# LAST CURSOR REPORT

**BLOCK-ID:** `V4_RESOURCE_REGISTRY_V2_MODEL_SURFACE_QUOTA_POOL_V1` (GitHub issue #37, first slice of #32)
**Classification:** `PASS — REGISTRY V2 CANONICAL (MODEL/ACCESS-SURFACE/QUOTA-POOL SEPARATED); V1 RESOURCES PROJECTION PRESERVED; CODEX + GLM SHARED POOLS REPRESENTED; NO OPENAI API/BYOK ROUTE; RUNTIME/N8N UNCHANGED`
**Timestamp (local):** 2026-09-05 ~15:4x
**Base HEAD:** `e07aa2661a55282055f27eb6c684564d66ae3078` (preverified = origin/main, main, tracked clean)
**CLOSURE:** STANDARD_RUNTIME_BUNDLE

## Outcome

Canonical `configs/resources/registry.json` migrated to `resource-registry-v2`:

- New sections: `models` (glm-5.3, glm-5.3-flash, codex_subscription_models, qwen_local,
  composer), `access_surfaces` (codex_ide_cursor_extension, codex_external_planner,
  openai_api_route **forbidden/representational**, glm_coding_plan_client,
  cursor_native_model_route, cursor_byok_route, opencode_local_harness),
  `quota_pools` (chatgpt_codex_subscription, glm_coding_plan), `registry_metadata`.
- **Shared pools**: both Codex surfaces → one `chatgpt_codex_subscription`
  (subscription-only; NO OpenAI API key/BYOK/API billing); `glm-5.3` + `glm-5.3-flash`
  → one `glm_coding_plan`. No quota duplication/double-count fields.
- **Cursor = harness only**: no Cursor pool exists; native route allowance explicitly
  `unverified` with `quota_pool_id: null` (nothing invented).
- **Qwen/OpenCode local**: `quota_pool_id: null`, `commercial_quota:
  none_local_unmetered` — no commercial token pool modeled; Qwen runtime untouched.
- **No dynamic values**: pools carry `dynamic_values: forbidden_in_registry`; the
  85%/88% dashboard observations were NOT persisted; pool sources allowlisted
  (`dashboard_snapshot` / future normalized collector).
- **Dynamic model selection**: Codex observed models (Sol/Terra/Luna/Astra) NOT frozen;
  all `model_selection_policy.frozen_list: false` (schema `const`), reasoning/speed
  as per-invocation route metadata.

## Compatibility (v1 projection preserved)

`resources` = verbatim `resource-registry-v1` object (deep-equal to base HEAD,
test-proven). Compat edits (one scope each, behavior-preserving):
`validate-resource-registry-v1.mjs` projects v2→v1 (fail-closed on truncated v2);
`evaluate-execution-route.mjs` + `n8n-v4-execution-routing-bridge-v1.mjs` accept
v1|v2. Census: 6 direct consumers — all compatible. Projection removal deferred to a
later governed pass.

## Tests

- New focused suite `tests/registry-v2/run.mjs`: **56/56 PASS** — structure, projection
  deep-equal, shared-pool proofs, subscription-only boundary, no-dynamic-values regex,
  referential integrity, Ajv v2-schema positive+negative, validator shim, router parity
  v2-vs-v1 (identical ROUTED + identical fail-closed).
- 8 consumer suites re-run: **135/135 PASS** (registry-validator 7, execution-router 12,
  status-composer 34, qwen overlay 14, qwen-local-adapter 9, adapter-registry 19,
  routing-bridge 23, planner-selection-evaluator 17). `node --check` OK.

## Untouched (verified)

workflows/n8n · WF40/WF61/D-0025 · dispatcher 18793 · Tailscale · Qwen profiles/router/
runtime (`qwen-models.ini`, GGUF, 10 profile IDs) · provider credentials · billing ·
`status.fail-closed.json` · all other contracts/docs · historical reports. Zero
provider/generation calls. CURRENT_FRONTIER updated with `RESOURCE_REGISTRY` row
(registry v2 canonical + consumers proven; live quota collectors explicitly NOT yet
implemented — next #32 slice).

Full report:
`reports/architecture/v4_resource_registry_v2_model_surface_quota_pool_v1.md`
Contract: `docs/contracts/resource-registry-v2.md` +
`docs/contracts/resource-registry-v2.schema.json`.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
