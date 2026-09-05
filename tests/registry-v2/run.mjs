#!/usr/bin/env node
/**
 * V4 — focused tests for RESOURCE_REGISTRY v2 (issue #37 slice).
 * model / access-surface / quota-pool separation with backward-compatible
 * v1 `resources` projection.
 *
 * Offline only. No network. No provider calls. No generation. No n8n.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateResourceRegistryObject } from "../../tools/validate-resource-registry-v1.mjs";
import { evaluateExecutionRoute } from "../../tools/evaluate-execution-route.mjs";
import { REGISTRY_SCHEMAS_V1_V2 } from "../../tools/n8n-v4-execution-routing-bridge-v1.mjs";
import { resolveAjvModules } from "../../tools/validate-execution-packet-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const REGISTRY_PATH = resolve(ROOT, "configs/resources/registry.json");
const V2_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/resource-registry-v2.schema.json",
);

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail });
}

const REGISTRY = JSON.parse(
  readFileSync(REGISTRY_PATH, "utf8").replace(/^\uFEFF/, ""),
);

// ---------------------------------------------------------------- v1 baseline
const V1_GIT_SHOW = spawnSync(
  "git",
  ["show", "e07aa2661a55282055f27eb6c684564d66ae3078:configs/resources/registry.json"],
  { cwd: ROOT, encoding: "utf8" },
);
let V1 = null;
try {
  V1 = JSON.parse((V1_GIT_SHOW.stdout || "").replace(/^\uFEFF/, ""));
} catch {
  // handled below
}

// ---------------------------------------------------------------- 1. structure
check(
  "schema-version-is-v2",
  REGISTRY.schema_version === "resource-registry-v2",
  REGISTRY.schema_version,
);
for (const section of ["models", "access_surfaces", "quota_pools", "resources", "registry_metadata"]) {
  check(
    `section-present-${section}`,
    REGISTRY[section] && typeof REGISTRY[section] === "object",
  );
}

// ------------------------------------------------- 2. v1 projection byte-equal
check("v1-baseline-loadable", V1 !== null, V1_GIT_SHOW.stderr?.slice(0, 200));
if (V1) {
  check(
    "resources-projection-deep-equal-v1",
    JSON.stringify(REGISTRY.resources) === JSON.stringify(V1.resources),
  );
  check(
    "resources-projection-keys-identical",
    JSON.stringify(Object.keys(REGISTRY.resources).sort()) ===
      JSON.stringify(Object.keys(V1.resources).sort()),
  );
}

// ------------------------------------------------------- 3. shared-pool proofs
const SURFACES = REGISTRY.access_surfaces;
const POOLS = REGISTRY.quota_pools;
const MODELS = REGISTRY.models;

check(
  "codex-both-surfaces-share-subscription-pool",
  SURFACES.codex_ide_cursor_extension?.quota_pool_id ===
    "chatgpt_codex_subscription" &&
    SURFACES.codex_external_planner?.quota_pool_id ===
      "chatgpt_codex_subscription",
);
check(
  "subscription-pool-declares-both-surfaces",
  JSON.stringify([...(POOLS.chatgpt_codex_subscription?.shared_by_surfaces || [])].sort()) ===
    JSON.stringify(["codex_external_planner", "codex_ide_cursor_extension"]),
);
// --- #34 reconciliation: Codex IDE runtime-qualified, collector still missing ---
check(
  "codex-ide-runtime-qualified",
  SURFACES.codex_ide_cursor_extension?.qualification?.runtime_qualified === true,
  JSON.stringify(SURFACES.codex_ide_cursor_extension?.qualification)?.slice(0, 120),
);
check(
  "codex-ide-auth-qualified-subscription-only",
  JSON.stringify(SURFACES.codex_ide_cursor_extension?.auth?.allowed) ===
    JSON.stringify(["chatgpt_subscription"]),
);
check(
  "codex-ide-evidence-references-34",
  /#34/.test(SURFACES.codex_ide_cursor_extension?.qualification?.note || "") &&
    /ad3e5cb/.test(SURFACES.codex_ide_cursor_extension?.qualification?.note || ""),
);
check(
  "codex-ide-no-dynamic-quota-in-evidence",
  !/(\d+\s*%|\d+%|percent|reset_at|resets|multiplier)/i.test(
    SURFACES.codex_ide_cursor_extension?.qualification?.note || "",
  ),
);
check(
  "codex-ide-distinct-runtime-vs-collector-status",
  /runtime_qualified/.test(SURFACES.codex_ide_cursor_extension?.status || "") &&
    /live_quota_collector_missing/.test(SURFACES.codex_ide_cursor_extension?.status || ""),
);
check(
  "no-stale-qualification-pending-wording-anywhere",
  !/not_yet_runtime_qualified|qualification_pending|runtime_qualification_pending|ide_surface_runtime_qualification_pending|represented_not_yet/.test(
    JSON.stringify({ models: MODELS, surfaces: SURFACES, pools: POOLS }),
  ),
);
check(
  "pool-still-no-live-collector",
  POOLS.chatgpt_codex_subscription?.status === "active_pool_no_live_collector",
  POOLS.chatgpt_codex_subscription?.status,
);
check(
  "external-planner-also-marked-runtime-qualified",
  SURFACES.codex_external_planner?.qualification?.runtime_qualified === true,
);
check(
  "glm-models-distinct-and-shared-pool",
  MODELS["glm-5.3"] &&
    MODELS["glm-5.3-flash"] &&
    MODELS["glm-5.3"] !== MODELS["glm-5.3-flash"] &&
    SURFACES.glm_coding_plan_client?.quota_pool_id === "glm_coding_plan" &&
    SURFACES.cursor_byok_route?.quota_pool_id === "glm_coding_plan" &&
    JSON.stringify([...(POOLS.glm_coding_plan?.shared_by_models || [])].sort()) ===
      JSON.stringify(["glm-5.3", "glm-5.3-flash"]),
);

// ------------------------------------------- 4. Codex subscription-only boundary
for (const surfaceId of ["codex_ide_cursor_extension", "codex_external_planner"]) {
  const s = SURFACES[surfaceId] || {};
  check(
    `${surfaceId}-subscription-only-auth`,
    JSON.stringify(s.auth?.allowed) === JSON.stringify(["chatgpt_subscription"]) &&
      ["openai_api_key", "byok_openai", "api_billing"].every((f) =>
        (s.auth?.forbidden || []).includes(f),
      ),
    JSON.stringify(s.auth),
  );
}
check(
  "openai-api-route-forbidden-representational",
  SURFACES.openai_api_route?.surface_type === "none" &&
    SURFACES.openai_api_route?.representational_only === true &&
    SURFACES.openai_api_route?.status === "forbidden" &&
    SURFACES.openai_api_route?.quota_pool_id === null,
);
// No other surface may point at an OpenAI API pool (no such pool exists at all).
check(
  "no-openai-api-pool-exists",
  !Object.keys(POOLS).some((id) => /openai_api|api_key|byok/i.test(id)),
  Object.keys(POOLS).join(","),
);

// ------------------------------------------------ 5. Cursor harness, not a pool
check(
  "cursor-is-harness-in-projection",
  REGISTRY.resources.cursor?.resource_type === "harness",
);
check(
  "no-cursor-quota-pool-exists",
  !Object.keys(POOLS).some((id) => /cursor/i.test(id)),
  Object.keys(POOLS).join(","),
);
check(
  "cursor-native-route-allowance-unverified",
  SURFACES.cursor_native_model_route?.quota_pool_id === null &&
    SURFACES.cursor_native_model_route?.allowance_ownership?.state === "unverified",
);
check(
  "cursor-surfaces-host-harness-is-cursor",
  ["cursor_native_model_route", "cursor_byok_route", "codex_ide_cursor_extension"]
    .every((id) => SURFACES[id]?.host_harness === "cursor"),
);

// ------------------------------------------- 6. Qwen/OpenCode local, unmetered
check(
  "opencode-surface-local-unmetered",
  SURFACES.opencode_local_harness?.quota_pool_id === null &&
    SURFACES.opencode_local_harness?.commercial_quota === "none_local_unmetered",
);
check(
  "qwen-local-model-no-commercial-pool",
  MODELS.qwen_local?.default_access_surface === "opencode_local_harness" &&
    !String(MODELS.qwen_local?.status || "").match(/quota/i),
);

// --------------------------------------------- 7. no dynamic quota hardcoded
const poolKeys = new Set();
for (const [poolId, pool] of Object.entries(POOLS)) {
  const flat = JSON.stringify(pool);
  check(
    `pool-${poolId}-forbids-dynamic-values`,
    pool.dynamic_values === "forbidden_in_registry" &&
      !/"(quota_remaining|remaining|used|usage_percent|percent_used|reset_at|resets_at|multiplier|effective_multiplier|value)"\s*:/.test(flat),
    flat.slice(0, 120),
  );
  for (const key of [
    ...(pool.shared_by_surfaces || []),
    ...(pool.shared_by_models || []),
  ]) {
    poolKeys.add(key);
  }
}
check(
  "no-numeric-dynamic-fields-anywhere-in-pools",
  !/"(quota_remaining|remaining|percent|multiplier|reset_at|window_ends_at|next_cheaper_at)"\s*:\s*(\d|"\d)/.test(
    JSON.stringify(POOLS),
  ),
);

// --------------------------------------- 8. dynamic model selection, no freeze
for (const [id, policy] of [
  ["models.codex_subscription_models", MODELS.codex_subscription_models?.model_selection_policy],
  ["surfaces.codex_ide_cursor_extension", SURFACES.codex_ide_cursor_extension?.model_selection_policy],
  ["surfaces.codex_external_planner", SURFACES.codex_external_planner?.model_selection_policy],
  ["surfaces.cursor_native_model_route", SURFACES.cursor_native_model_route?.model_selection_policy],
]) {
  check(
    `model-selection-not-frozen-${id}`,
    policy && policy.frozen_list === false,
    JSON.stringify(policy)?.slice(0, 100),
  );
}
check(
  "codex-observed-models-not-frozen-as-list",
  !MODELS.sol && !MODELS.terra && !MODELS.luna && !MODELS.astra,
  Object.keys(MODELS).join(","),
);

// --------------------------------------------- 9. referential integrity v2
for (const [modelId, model] of Object.entries(MODELS)) {
  check(
    `model-${modelId}-default-surface-exists`,
    Object.prototype.hasOwnProperty.call(SURFACES, model.default_access_surface),
    model.default_access_surface,
  );
}
for (const [surfaceId, surface] of Object.entries(SURFACES)) {
  const poolId = surface.quota_pool_id;
  check(
    `surface-${surfaceId}-pool-ref-valid-or-null`,
    poolId === null || Object.prototype.hasOwnProperty.call(POOLS, poolId),
    String(poolId),
  );
}
for (const [poolId, pool] of Object.entries(POOLS)) {
  for (const surfaceRef of pool.shared_by_surfaces || []) {
    check(
      `pool-${poolId}-surface-ref-exists-${surfaceRef}`,
      Object.prototype.hasOwnProperty.call(SURFACES, surfaceRef),
      surfaceRef,
    );
  }
}

// ------------------------------------------------- 10. schema validation (Ajv)
let ajvSchemaResult = null;
try {
  const { ajv2020Path, formatsPath } = resolveAjvModules();
  const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
    import(pathToFileURL(ajv2020Path).href),
    import(pathToFileURL(formatsPath).href),
  ]);
  const addFormats = formatsMod.default || formatsMod;
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  addFormats(ajv);
  const v2Schema = JSON.parse(
    readFileSync(V2_SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""),
  );
  const validate = ajv.compile(v2Schema);
  const ok = validate(REGISTRY);
  ajvSchemaResult = { ok, errors: validate.errors };
  check(
    "canonical-registry-validates-against-v2-schema",
    ok === true,
    ok ? "ok" : JSON.stringify(validate.errors?.slice(0, 4)),
  );
} catch (err) {
  check("v2-schema-engine-available", false, String(err.message || err));
}

// Negative schema check: schema-level consts must actually reject violations.
if (ajvSchemaResult) {
  try {
    const { ajv2020Path, formatsPath } = resolveAjvModules();
    const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
      import(pathToFileURL(ajv2020Path).href),
      import(pathToFileURL(formatsPath).href),
    ]);
    const addFormats = formatsMod.default || formatsMod;
    const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
    addFormats(ajv);
    const v2Schema = JSON.parse(
      readFileSync(V2_SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""),
    );
    const validate = ajv.compile(v2Schema);
    const badFrozen = JSON.parse(JSON.stringify(REGISTRY));
    badFrozen.access_surfaces.codex_ide_cursor_extension.model_selection_policy.frozen_list =
      true;
    const badDynamic = JSON.parse(JSON.stringify(REGISTRY));
    badDynamic.quota_pools.chatgpt_codex_subscription.dynamic_values = "allowed";
    check(
      "v2-schema-rejects-frozen-model-list",
      validate(badFrozen) === false,
      "frozen_list=true accepted",
    );
    check(
      "v2-schema-rejects-dynamic-values-in-pool",
      validate(badDynamic) === false,
      "dynamic_values mutation accepted",
    );
  } catch {
    // engine unavailable already recorded above
  }
}

// Referential integrity (suite-owned; shape-only schema intentionally does not
// enforce cross-section refs): the same detector must pass canonical and flag
// a mutated unbound pool reference.
function badPoolRefs(reg) {
  const bad = [];
  for (const [surfaceId, surface] of Object.entries(reg.access_surfaces || {})) {
    const poolId = surface.quota_pool_id;
    if (poolId !== null && poolId !== undefined && !Object.prototype.hasOwnProperty.call(reg.quota_pools || {}, poolId)) {
      bad.push(`${surfaceId}->${poolId}`);
    }
  }
  return bad;
}
check("canonical-registry-has-no-unbound-pool-refs", badPoolRefs(REGISTRY).length === 0);
const regMutated = JSON.parse(JSON.stringify(REGISTRY));
regMutated.access_surfaces.codex_ide_cursor_extension.quota_pool_id = "some_new_api_pool";
check(
  "referential-detector-flags-unbound-pool-ref",
  JSON.stringify(badPoolRefs(regMutated)) ===
    JSON.stringify(["codex_ide_cursor_extension->some_new_api_pool"]),
);

// ------------------------------------- 11. v1 validator shim accepts canonical
const shim = await validateResourceRegistryObject(REGISTRY);
check(
  "v1-validator-accepts-v2-via-projection",
  shim.ok === true && shim.classification === "PASS",
  JSON.stringify({ ok: shim.ok, classification: shim.classification, reason: shim.reason }),
);
const shimBadV2 = await validateResourceRegistryObject({
  schema_version: "resource-registry-v2",
  models: {},
});
check(
  "v1-validator-fails-closed-on-truncated-v2",
  shimBadV2.ok === false,
  JSON.stringify(shimBadV2),
);

// --------------------------- 12. consumer compatibility: execution router v2
function statusEntry(overrides = {}) {
  return {
    available: false,
    quota_remaining: { value: null, unit: "unknown" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode: "unknown",
    location: "unknown",
    source: "manual",
    updated_at: "2026-08-29T00:00:00.000Z",
    ...overrides,
  };
}
function statusDoc(map) {
  return {
    schema_version: "resource-status-v1",
    generated_at: "2026-08-29T00:00:00.000Z",
    resources: map,
  };
}
const allAvailable = {};
for (const id of Object.keys(REGISTRY.resources)) {
  allAvailable[id] = statusEntry({
    available: true,
    location: REGISTRY.resources[id].execution_location || "unknown",
    cost_mode: id === "qwen_local" ? "free" : "unknown",
  });
}
// Same deterministic ROUTED decision as under v1 (local zero-cost Qwen pair).
const routeV2 = await evaluateExecutionRoute(
  {
    schema_version: "execution-route-request-v1",
    request_id: "regv2-compat-1",
    risk_level: "low",
    technical_requirements: ["filesystem", "terminal", "code_edit"],
  },
  { registry: REGISTRY, status: statusDoc(allAvailable) },
);
const routeV1 = await evaluateExecutionRoute(
  {
    schema_version: "execution-route-request-v1",
    request_id: "regv2-compat-1-v1",
    risk_level: "low",
    technical_requirements: ["filesystem", "terminal", "code_edit"],
  },
  { registry: V1, status: statusDoc(allAvailable) },
);
check(
  "router-v2-registry-routes-identically-to-v1",
  routeV2.status === "ROUTED" &&
    routeV1.status === "ROUTED" &&
    routeV2.execution_route?.route_id === routeV1.execution_route?.route_id,
  JSON.stringify({ v2: routeV2.execution_route, v1: routeV1.execution_route }),
);
// v2 truncated behaves IDENTICALLY to v1 truncated (parity property):
// both fail closed with NO_ROUTE / NO_TECHNICAL_ROUTE — no route invented.
const routeBadV2 = await evaluateExecutionRoute(
  {
    schema_version: "execution-route-request-v1",
    request_id: "regv2-bad",
    risk_level: "low",
    technical_requirements: ["filesystem"],
  },
  {
    registry: { schema_version: "resource-registry-v2", resources: {} },
    status: statusDoc({}),
  },
);
const routeBadV1 = await evaluateExecutionRoute(
  {
    schema_version: "execution-route-request-v1",
    request_id: "regv2-bad-v1",
    risk_level: "low",
    technical_requirements: ["filesystem"],
  },
  {
    registry: { schema_version: "resource-registry-v1", resources: {} },
    status: statusDoc({}),
  },
);
check(
  "router-fails-closed-on-truncated-registry-v1-and-v2-identically",
  routeBadV2.status === "NO_ROUTE" &&
    routeBadV1.status === "NO_ROUTE" &&
    JSON.stringify(routeBadV2.reason_codes) === JSON.stringify(routeBadV1.reason_codes),
  JSON.stringify({ v2: routeBadV2.reason_codes, v1: routeBadV1.reason_codes }),
);

// ------------------------------------------ 13. bridge exports both schemas
check(
  "bridge-accepts-v1-and-v2-schema-constants",
  Array.isArray(REGISTRY_SCHEMAS_V1_V2) &&
    REGISTRY_SCHEMAS_V1_V2.includes("resource-registry-v1") &&
    REGISTRY_SCHEMAS_V1_V2.includes("resource-registry-v2"),
);

// ------------------------------------------------------------------- summary
const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
}
const summary = {
  ok: failed.length === 0,
  classification: failed.length === 0 ? "PASS" : "FAIL",
  passed: results.filter((r) => r.pass).length,
  failed: failed.length,
  total: results.length,
};
console.log(JSON.stringify(summary));
process.exit(failed.length === 0 ? 0 : 1);
