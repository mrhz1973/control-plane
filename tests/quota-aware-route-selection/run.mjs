#!/usr/bin/env node
/**
 * V4 — focused tests: offline quota-pool-aware route selection (campaign #39
 * phase 3). Deterministic, offline. Laws A–M from the campaign dispatch.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateQuotaAwareRoute,
  deriveCandidates,
} from "../../tools/evaluate-quota-aware-route-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const REGISTRY = JSON.parse(
  readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""),
);

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const OBS = "2026-09-05T15:58:00.000Z";

function poolStatus(entries) {
  return {
    schema_version: "quota-pool-status-v1",
    generated_at: "2026-09-05T16:00:00.000Z",
    quota_pools: entries,
  };
}
function healthyPool(id, pct) {
  return {
    quota_pool_id: id,
    state: "available",
    windows: [{ window_type: "rolling", remaining: { value: pct, unit: "percent" }, freshness: "fresh" }],
    source: "dashboard_snapshot",
    observed_at: OBS,
    updated_at: "2026-09-05T16:00:00.000Z",
    freshness: "fresh",
    reserve_policy_ref: null,
    economics: null,
  };
}
const baseOpts = {
  registry: REGISTRY,
  // Pool-focused fixtures: local unmetered route unavailable unless a test
  // explicitly enables it (e.g. law G).
  surfaceAvailability: { opencode_local_harness: false },
};

function req(overrides = {}) {
  return {
    request_id: "t",
    required_capabilities: ["planning"],
    urgency: "normal",
    defer_allowed: false,
    ...overrides,
  };
}

// Candidate derivation sanity (registry-v2 bindings)
const candidates = deriveCandidates(REGISTRY);
check(
  "candidates-include-codex-and-glm-and-local",
  candidates.some((c) => c.quota_pool_id === "chatgpt_codex_subscription") &&
    candidates.some((c) => c.quota_pool_id === "glm_coding_plan") &&
    candidates.some((c) => c.model_id === "qwen_local"),
);
check(
  "forbidden-openai-api-route-never-candidate",
  !candidates.some((c) => c.surface_id === "openai_api_route"),
);

// A. Codex IDE + external Codex share ONE pool observation
{
  const r = evaluateQuotaAwareRoute(req(), {
    ...baseOpts,
    poolStatus: poolStatus({ chatgpt_codex_subscription: healthyPool("chatgpt_codex_subscription", 62) }),
  });
  check(
    "A-codex-shared-pool-selected-and-single-healthy",
    r.status === "ROUTE_SELECTED" &&
      r.selection.quota_pool_id === "chatgpt_codex_subscription" &&
      r.selection.model === "codex_subscription_models" &&
      r.pool_evaluations.chatgpt_codex_subscription?.evaluation === "POOL_HEALTHY" &&
      r.pool_evaluations.chatgpt_codex_subscription?.remaining_percent === 62,
    JSON.stringify(r),
  );
}

// B. GLM 5.3 + Flash share ONE pool observation
{
  const r = evaluateQuotaAwareRoute(
    req({ required_capabilities: ["planning", "code_generation"] }),
    {
      ...baseOpts,
      poolStatus: poolStatus({ glm_coding_plan: healthyPool("glm_coding_plan", 41) }),
    },
  );
  check(
    "B-glm-shared-pool-selected-and-single-healthy",
    r.status === "ROUTE_SELECTED" &&
      r.selection.quota_pool_id === "glm_coding_plan" &&
      ["glm-5.3", "glm-5.3-flash"].includes(r.selection.model) &&
      r.pool_evaluations.glm_coding_plan?.evaluation === "POOL_HEALTHY" &&
      r.pool_evaluations.glm_coding_plan?.remaining_percent === 41,
    JSON.stringify(r),
  );
}

// C. missing shared-pool status -> CONSERVE_UNKNOWN
{
  const r = evaluateQuotaAwareRoute(req(), { ...baseOpts, poolStatus: poolStatus({}) });
  check(
    "C-missing-pool-status-conserve-unknown",
    r.status === "CONSERVE_UNKNOWN" &&
      r.pool_evaluations.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_MISSING",
    JSON.stringify(r),
  );
}

// D. stale shared-pool status -> CONSERVE_UNKNOWN
{
  const stale = healthyPool("chatgpt_codex_subscription", 90);
  stale.freshness = "stale";
  stale.windows[0].freshness = "stale";
  const r = evaluateQuotaAwareRoute(req(), {
    ...baseOpts,
    poolStatus: poolStatus({ chatgpt_codex_subscription: stale }),
  });
  check(
    "D-stale-pool-status-conserve-unknown",
    r.status === "CONSERVE_UNKNOWN" &&
      r.pool_evaluations.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_STALE",
    JSON.stringify(r),
  );
}

// E. reserve-floor block
{
  const r = evaluateQuotaAwareRoute(req(), {
    ...baseOpts,
    poolStatus: poolStatus({ chatgpt_codex_subscription: healthyPool("chatgpt_codex_subscription", 12) }),
    reservePolicy: { chatgpt_codex_subscription: { floor: 20, policy_ref: "codex-reserve-v1" } },
  });
  check(
    "E-reserve-floor-blocks",
    r.status === "NO_ROUTE" && r.reason_codes.includes("RESERVE_FLOOR_BLOCK"),
    JSON.stringify(r),
  );
}

// F. sufficient healthy quota -> selected
{
  const r = evaluateQuotaAwareRoute(req(), {
    ...baseOpts,
    poolStatus: poolStatus({ chatgpt_codex_subscription: healthyPool("chatgpt_codex_subscription", 80) }),
    reservePolicy: { chatgpt_codex_subscription: { floor: 20, policy_ref: "codex-reserve-v1" } },
  });
  check(
    "F-sufficient-healthy-quota-selected",
    r.status === "ROUTE_SELECTED" && r.selection.quota_pool_id === "chatgpt_codex_subscription",
    JSON.stringify(r),
  );
}

// G. adequate unmetered Qwen route preferred over scarce remote pool
{
  const lowPool = healthyPool("chatgpt_codex_subscription", 25);
  const r = evaluateQuotaAwareRoute(req(), {
    ...baseOpts,
    surfaceAvailability: { opencode_local_harness: true },
    poolStatus: poolStatus({ chatgpt_codex_subscription: lowPool }),
  });
  check(
    "G-unmetered-local-preferred-scarce-preserved",
    r.status === "ROUTE_SELECTED" &&
      r.selection.model === "qwen_local" &&
      r.selection.reason === "LOCAL_UNMETERED_ADEQUATE" &&
      r.reason_codes.includes("SCARCE_POOL_PRESERVED"),
    JSON.stringify(r),
  );
}

// H. Qwen inadequate capability -> cannot silently substitute
{
  const r = evaluateQuotaAwareRoute(
    req({ required_capabilities: ["planning", "browser"] }),
    { ...baseOpts, poolStatus: poolStatus({}) },
  );
  check(
    "H-inadequate-capability-no-silent-substitution",
    r.status === "NO_ROUTE" && r.reason_codes.includes("NO_ADEQUATE_CAPABILITY"),
    JSON.stringify(r),
  );
}

// I. urgent task cannot be deferred incorrectly
{
  const r = evaluateQuotaAwareRoute(req({ urgency: "urgent", defer_allowed: true }), {
    ...baseOpts,
    poolStatus: poolStatus({ chatgpt_codex_subscription: healthyPool("chatgpt_codex_subscription", 12) }),
    reservePolicy: { chatgpt_codex_subscription: { floor: 20, policy_ref: "codex-reserve-v1" } },
  });
  check(
    "I-urgent-never-deferred",
    r.status !== "DEFERRED" && r.reason_codes.includes("URGENT_NO_DEFER"),
    JSON.stringify(r),
  );
}

// J. non-urgent deferral only when policy permits
{
  const deferDenied = evaluateQuotaAwareRoute(req({ defer_allowed: false }), {
    ...baseOpts,
    poolStatus: poolStatus({ chatgpt_codex_subscription: healthyPool("chatgpt_codex_subscription", 12) }),
    reservePolicy: { chatgpt_codex_subscription: { floor: 20, policy_ref: "codex-reserve-v1" } },
  });
  check(
    "J1-deferral-denied-without-policy",
    deferDenied.status === "NO_ROUTE" && !deferDenied.reason_codes.includes("DEFER_POLICY_PERMITTED"),
    JSON.stringify(deferDenied),
  );
  const deferred = evaluateQuotaAwareRoute(req({ defer_allowed: true }), {
    ...baseOpts,
    poolStatus: poolStatus({ chatgpt_codex_subscription: healthyPool("chatgpt_codex_subscription", 12) }),
    reservePolicy: { chatgpt_codex_subscription: { floor: 20, policy_ref: "codex-reserve-v1" } },
  });
  check(
    "J2-deferral-only-with-policy",
    deferred.status === "DEFERRED" &&
      deferred.classification === "DEFER_UNTIL_CHEAPER_WINDOW" &&
      deferred.reason_codes.includes("DEFER_POLICY_PERMITTED"),
    JSON.stringify(deferred),
  );
}

// K. unknown cost/allowance state never treated as cheap
{
  // cursor_native_model_route: pool null + allowance unverified -> blocked, not cheap
  const r = evaluateQuotaAwareRoute(
    req({ required_capabilities: ["code_generation"] }),
    { ...baseOpts, surfaceAvailability: { opencode_local_harness: false } },
  );
check(
  "K-unverified-allowance-not-cheap",
  r.status !== "ROUTE_SELECTED" &&
    r.selection === null &&
    r.reason_codes.includes("UNVERIFIED_ALLOWANCE_UNKNOWN"),
  JSON.stringify(r),
);
}

// L. OpenAI API/BYOK forbidden
{
  // Even with a tampered registry where composer points at an "active" API/BYOK
  // surface, the evaluator must NOT select it (fail closed). The tampered
  // candidate must never appear as selection.
  const tampered = JSON.parse(JSON.stringify(REGISTRY));
  tampered.access_surfaces.openai_api_route.surface_type = "byok_route";
  tampered.access_surfaces.openai_api_route.auth = { allowed: ["openai_api_key"], forbidden: [] };
  tampered.access_surfaces.openai_api_route.status = "active";
  tampered.access_surfaces.openai_api_route.quota_pool_id = null;
  tampered.models.composer.default_access_surface = "openai_api_route";
  const r = evaluateQuotaAwareRoute(req({ required_capabilities: ["code_generation"] }), {
    registry: tampered,
    surfaceAvailability: { opencode_local_harness: false },
  });
  const tamperedSelected = Boolean(
    r.selection &&
      (r.selection.access_surface === "openai_api_route" ||
        /openai[-_]api|byok/i.test(JSON.stringify(r.selection))),
  );
  check(
    "L-openai-api-byok-forbidden",
    r.status !== "ROUTE_SELECTED" && r.selection === null && tamperedSelected === false,
    JSON.stringify(r),
  );
}

// M. duplicate model references do not double-count pool capacity
{
  // Both codex surfaces + both glm models share pools; each pool evaluated exactly once.
  const r = evaluateQuotaAwareRoute(
    req({ required_capabilities: ["planning", "code_generation"] }),
    {
      ...baseOpts,
      surfaceAvailability: { opencode_local_harness: false },
      poolStatus: poolStatus({
        chatgpt_codex_subscription: healthyPool("chatgpt_codex_subscription", 62),
        glm_coding_plan: healthyPool("glm_coding_plan", 41),
      }),
    },
  );
  check(
    "M-shared-pools-evaluated-once",
    r.status === "ROUTE_SELECTED" && Object.keys(r.pool_evaluations).length === 2,
    JSON.stringify(r),
  );
  // duplicate surface entries in the shared list would not create duplicate evaluations
  const seen = new Set();
  let dup = false;
  for (const c of candidates) {
    const key = `${c.model_id}|${c.surface_id}`;
    if (seen.has(key)) dup = true;
    seen.add(key);
  }
  check("M2-no-duplicate-candidate-entries", dup === false);
}

// Existing-law preservation: registry-v2 focused suite still green is verified
// separately by the campaign runner; here we assert evaluator purity (no mutation).
{
  const before = JSON.stringify(REGISTRY);
  evaluateQuotaAwareRoute(req(), { ...baseOpts, poolStatus: poolStatus({}) });
  check("registry-not-mutated-by-evaluator", JSON.stringify(REGISTRY) === before);
}

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
