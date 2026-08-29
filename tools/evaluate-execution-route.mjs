#!/usr/bin/env node
/**
 * V4 EXECUTION_ROUTER — evaluate-execution-route.mjs
 *
 * Deterministic-first selection of implementation harness + model from
 * RESOURCE_REGISTRY + RESOURCE_STATUS. Semantic arbitration via injectable
 * qwen-local adapter ONLY when >1 equivalent route remains.
 *
 * Usage:
 *   node tools/evaluate-execution-route.mjs <request.json> [registry.json] [status.json]
 *
 * Exit: ROUTED -> 0; NO_ROUTE / invalid -> 1
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const REQUEST_SCHEMA = "execution-route-request-v1";
export const RESULT_SCHEMA = "execution-route-result-v1";

export const DEFAULT_REGISTRY_PATH = resolve(ROOT, "configs/resources/registry.json");
export const DEFAULT_STATUS_PATH = resolve(
  ROOT,
  "configs/resources/status.fail-closed.json",
);

export const CAPABILITIES = Object.freeze([
  "filesystem",
  "terminal",
  "code_edit",
  "planning",
  "classification",
  "routing_arbitration",
  "code_generation",
  "review",
  "persistent_agent",
  "browser",
]);

export const REASON_CODES = Object.freeze({
  TECHNICAL_REQUIREMENTS_MATCH: "TECHNICAL_REQUIREMENTS_MATCH",
  AVAILABLE_COMPATIBLE_ROUTE: "AVAILABLE_COMPATIBLE_ROUTE",
  RESERVE_PROTECTED: "RESERVE_PROTECTED",
  LOWER_COST: "LOWER_COST",
  LOCAL_ZERO_COST_SUFFICIENT: "LOCAL_ZERO_COST_SUFFICIENT",
  SEMANTIC_ARBITRATION: "SEMANTIC_ARBITRATION",
  NO_TECHNICAL_ROUTE: "NO_TECHNICAL_ROUTE",
  NO_AVAILABLE_ROUTE: "NO_AVAILABLE_ROUTE",
  NO_COMPATIBLE_ROUTE: "NO_COMPATIBLE_ROUTE",
  RESERVE_BLOCKED: "RESERVE_BLOCKED",
  ARBITER_UNAVAILABLE: "ARBITER_UNAVAILABLE",
  ARBITRATION_INVALID: "ARBITRATION_INVALID",
  INVALID_INPUT: "INVALID_INPUT",
});

const COST_RANK = Object.freeze({
  free: 0,
  included: 1,
  metered: 2,
  on_demand: 2,
  unknown: 99,
});

const CAP_SET = new Set(CAPABILITIES);

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function noRoute(requestId, reasonCodes, arbitration = null, arbiterCallCount = 0) {
  return {
    schema_version: RESULT_SCHEMA,
    request_id: requestId,
    status: "NO_ROUTE",
    execution_route: null,
    arbitration: arbitration || { required: false, used: false, arbiter: null },
    reason_codes: [...new Set(reasonCodes)],
    arbiter_call_count: arbiterCallCount,
  };
}

function routed(requestId, route, arbitration, reasonCodes, arbiterCallCount) {
  return {
    schema_version: RESULT_SCHEMA,
    request_id: requestId,
    status: "ROUTED",
    execution_route: route,
    arbitration,
    reason_codes: [...new Set(reasonCodes)],
    arbiter_call_count: arbiterCallCount,
  };
}

export function validateRouteRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, reason: "request must be object" };
  }
  if (input.schema_version !== REQUEST_SCHEMA) {
    return { ok: false, reason: "invalid schema_version" };
  }
  if (typeof input.request_id !== "string" || !input.request_id.trim()) {
    return { ok: false, reason: "request_id required" };
  }
  if (!["low", "medium", "high"].includes(input.risk_level)) {
    return { ok: false, reason: "invalid risk_level" };
  }
  if (!Array.isArray(input.technical_requirements) || input.technical_requirements.length === 0) {
    return { ok: false, reason: "technical_requirements required" };
  }
  const seen = new Set();
  for (const cap of input.technical_requirements) {
    if (!CAP_SET.has(cap)) {
      return { ok: false, reason: `unknown capability: ${cap}` };
    }
    if (seen.has(cap)) {
      return { ok: false, reason: "duplicate technical_requirements" };
    }
    seen.add(cap);
  }
  return { ok: true, value: input };
}

function hasRole(entry, role) {
  return Array.isArray(entry?.roles) && entry.roles.includes(role);
}

function isAvailable(statusDoc, resourceId) {
  const st = statusDoc?.resources?.[resourceId];
  if (!st || typeof st !== "object") return false;
  return st.available === true;
}

function getStatus(statusDoc, resourceId) {
  return statusDoc?.resources?.[resourceId] || null;
}

function compatiblePair(harnessId, harness, modelId, model) {
  const hToM =
    Array.isArray(harness.compatible_resources) &&
    harness.compatible_resources.includes(modelId);
  const mToH =
    Array.isArray(model.compatible_resources) &&
    model.compatible_resources.includes(harnessId);
  return hToM || mToH;
}

function harnessMeetsRequirements(harness, requirements) {
  const caps = new Set(Array.isArray(harness.capabilities) ? harness.capabilities : []);
  return requirements.every((r) => caps.has(r));
}

/**
 * Reserve/quota gate per RESOURCE_STATUS.
 * - remaining <= reserve_floor (comparable finite) => blocked
 * - positive reserve + unknown remaining => fail closed
 */
export function reserveBlocks(statusEntry) {
  if (!statusEntry) return { blocked: true, reason: REASON_CODES.RESERVE_BLOCKED };

  const floor = statusEntry.reserve_floor || {};
  const quota = statusEntry.quota_remaining || {};
  const floorUnit = floor.unit;
  const floorValue = floor.value;
  const quotaUnit = quota.unit;
  const quotaValue = quota.value;

  const floorActive =
    floorUnit !== "none" &&
    floorUnit !== "unknown" &&
    typeof floorValue === "number" &&
    floorValue > 0;

  if (!floorActive) {
    return { blocked: false };
  }

  if (quotaUnit === "unlimited") {
    return { blocked: false };
  }

  if (quotaUnit === "unknown" || quotaValue === null || typeof quotaValue !== "number") {
    return { blocked: true, reason: REASON_CODES.RESERVE_BLOCKED };
  }

  // Comparable only when units match (or both numeric same unit family).
  if (quotaUnit !== floorUnit) {
    return { blocked: true, reason: REASON_CODES.RESERVE_BLOCKED };
  }

  if (quotaValue <= floorValue) {
    return { blocked: true, reason: REASON_CODES.RESERVE_BLOCKED };
  }

  return { blocked: false };
}

function costRank(statusEntry) {
  const mode = statusEntry?.cost_mode || "unknown";
  return Object.prototype.hasOwnProperty.call(COST_RANK, mode)
    ? COST_RANK[mode]
    : COST_RANK.unknown;
}

function routeId(harnessId, modelId) {
  return `${harnessId}+${modelId}`;
}

function deriveCandidatePairs(registry, requirements) {
  const resources = registry?.resources || {};
  const harnesses = [];
  const models = [];

  for (const [id, entry] of Object.entries(resources)) {
    if (hasRole(entry, "implementation_harness")) harnesses.push([id, entry]);
    if (hasRole(entry, "implementation_model")) models.push([id, entry]);
  }

  const technicalHarnesses = harnesses.filter(([, h]) =>
    harnessMeetsRequirements(h, requirements),
  );

  if (technicalHarnesses.length === 0) {
    return { pairs: [], stageFail: REASON_CODES.NO_TECHNICAL_ROUTE };
  }

  const pairs = [];
  for (const [hId, h] of technicalHarnesses) {
    for (const [mId, m] of models) {
      if (compatiblePair(hId, h, mId, m)) {
        pairs.push({
          route_id: routeId(hId, mId),
          implementer: hId,
          model: mId,
          harness: h,
          modelEntry: m,
        });
      }
    }
  }

  if (pairs.length === 0) {
    return { pairs: [], stageFail: REASON_CODES.NO_COMPATIBLE_ROUTE };
  }

  return { pairs, stageFail: null };
}

function filterAvailable(pairs, statusDoc) {
  return pairs.filter(
    (p) => isAvailable(statusDoc, p.implementer) && isAvailable(statusDoc, p.model),
  );
}

function filterReserve(pairs, statusDoc) {
  const kept = [];
  let anyBlocked = false;
  for (const p of pairs) {
    const hBlock = reserveBlocks(getStatus(statusDoc, p.implementer));
    const mBlock = reserveBlocks(getStatus(statusDoc, p.model));
    if (hBlock.blocked || mBlock.blocked) {
      anyBlocked = true;
      continue;
    }
    kept.push(p);
  }
  return { kept, anyBlocked };
}

function pairCost(pair, statusDoc) {
  const h = costRank(getStatus(statusDoc, pair.implementer));
  const m = costRank(getStatus(statusDoc, pair.model));
  // Prefer free model strongly; harness unknown cost does not invent free.
  return Math.max(h, m);
}

function filterByLowestCost(pairs, statusDoc) {
  if (pairs.length <= 1) return { kept: pairs, reduced: false };
  let best = Infinity;
  for (const p of pairs) {
    best = Math.min(best, pairCost(p, statusDoc));
  }
  // unknown (99) alone does not invent preference among unknowns.
  const kept = pairs.filter((p) => pairCost(p, statusDoc) === best);
  return { kept, reduced: kept.length < pairs.length, bestCost: best };
}

function filterLocalZeroCost(pairs, statusDoc) {
  if (pairs.length <= 1) return { kept: pairs, applied: false };
  const freeLocal = pairs.filter((p) => {
    const mSt = getStatus(statusDoc, p.model);
    const h = p.harness;
    return (
      mSt?.cost_mode === "free" &&
      h?.execution_location === "local" &&
      p.modelEntry?.execution_location === "local"
    );
  });
  if (freeLocal.length === 1) {
    return { kept: freeLocal, applied: true };
  }
  if (freeLocal.length > 1) {
    return { kept: freeLocal, applied: true };
  }
  return { kept: pairs, applied: false };
}

function isArbiterReady(registry, statusDoc) {
  const entry = registry?.resources?.qwen_local;
  if (!entry || !hasRole(entry, "routing_arbiter")) return false;
  if (!Array.isArray(entry.capabilities) || !entry.capabilities.includes("routing_arbitration")) {
    return false;
  }
  return isAvailable(statusDoc, "qwen_local");
}

/**
 * Evaluate one execution-route request.
 *
 * options:
 *   registry / status — objects (preferred) or loaded from paths
 *   semanticArbiter — async (payload) => { selection: route_id, ... } | throw
 *                     If omitted and arbitration needed -> ARBITER_UNAVAILABLE
 */
export async function evaluateExecutionRoute(request, options = {}) {
  const validated = validateRouteRequest(request);
  if (!validated.ok) {
    return noRoute(
      typeof request?.request_id === "string" ? request.request_id : null,
      [REASON_CODES.INVALID_INPUT],
    );
  }
  const req = validated.value;

  const registry =
    options.registry ||
    readJson(options.registryPath || DEFAULT_REGISTRY_PATH);
  const statusDoc =
    options.status ||
    readJson(options.statusPath || DEFAULT_STATUS_PATH);

  if (registry?.schema_version !== "resource-registry-v1") {
    return noRoute(req.request_id, [REASON_CODES.INVALID_INPUT]);
  }
  if (statusDoc?.schema_version !== "resource-status-v1") {
    return noRoute(req.request_id, [REASON_CODES.INVALID_INPUT]);
  }

  // 1 + 3 technical + compatibility derivation
  const derived = deriveCandidatePairs(registry, req.technical_requirements);
  if (derived.stageFail === REASON_CODES.NO_TECHNICAL_ROUTE) {
    return noRoute(req.request_id, [REASON_CODES.NO_TECHNICAL_ROUTE]);
  }
  if (derived.stageFail === REASON_CODES.NO_COMPATIBLE_ROUTE) {
    return noRoute(req.request_id, [
      REASON_CODES.TECHNICAL_REQUIREMENTS_MATCH,
      REASON_CODES.NO_COMPATIBLE_ROUTE,
    ]);
  }

  let pairs = derived.pairs;

  // 2 availability
  pairs = filterAvailable(pairs, statusDoc);
  if (pairs.length === 0) {
    return noRoute(req.request_id, [
      REASON_CODES.TECHNICAL_REQUIREMENTS_MATCH,
      REASON_CODES.NO_AVAILABLE_ROUTE,
    ]);
  }

  // 4 risk/policy: no additional inventable exclusions in this block

  // 5 reserve/quota
  const reserve = filterReserve(pairs, statusDoc);
  pairs = reserve.kept;
  if (pairs.length === 0) {
    return noRoute(req.request_id, [
      REASON_CODES.TECHNICAL_REQUIREMENTS_MATCH,
      REASON_CODES.RESERVE_BLOCKED,
    ]);
  }

  const reasonAccum = [
    REASON_CODES.TECHNICAL_REQUIREMENTS_MATCH,
    REASON_CODES.AVAILABLE_COMPATIBLE_ROUTE,
    REASON_CODES.RESERVE_PROTECTED,
  ];

  // 6 cost
  const cost = filterByLowestCost(pairs, statusDoc);
  pairs = cost.kept;
  if (cost.reduced) {
    reasonAccum.push(REASON_CODES.LOWER_COST);
  }

  // 7 static non-semantic: free local preference when it uniquely narrows
  const localPref = filterLocalZeroCost(pairs, statusDoc);
  pairs = localPref.kept;
  if (localPref.applied && pairs.length === 1) {
    reasonAccum.push(REASON_CODES.LOCAL_ZERO_COST_SUFFICIENT);
  } else if (localPref.applied && pairs.length > 1) {
    reasonAccum.push(REASON_CODES.LOCAL_ZERO_COST_SUFFICIENT);
  }

  // Unique deterministic
  if (pairs.length === 1) {
    const p = pairs[0];
    return routed(
      req.request_id,
      {
        route_id: p.route_id,
        implementer: p.implementer,
        model: p.model,
        confidence: "high",
        reason_codes: [...new Set(reasonAccum)],
      },
      { required: false, used: false, arbiter: null },
      reasonAccum,
      0,
    );
  }

  // 8 semantic arbitration required
  if (!isArbiterReady(registry, statusDoc)) {
    return noRoute(
      req.request_id,
      [...reasonAccum, REASON_CODES.ARBITER_UNAVAILABLE],
      { required: true, used: false, arbiter: null },
      0,
    );
  }

  const survivors = pairs.map((p) => p.route_id);
  const arbiterFn = options.semanticArbiter;
  if (typeof arbiterFn !== "function") {
    return noRoute(
      req.request_id,
      [...reasonAccum, REASON_CODES.ARBITER_UNAVAILABLE],
      { required: true, used: false, arbiter: null },
      0,
    );
  }

  let arbOut;
  try {
    arbOut = await arbiterFn({
      survivors,
      request_id: req.request_id,
      risk_level: req.risk_level,
      technical_requirements: req.technical_requirements,
    });
  } catch {
    return noRoute(
      req.request_id,
      [...reasonAccum, REASON_CODES.ARBITRATION_INVALID],
      { required: true, used: true, arbiter: "qwen_local" },
      1,
    );
  }

  const selection =
    arbOut && typeof arbOut === "object" ? arbOut.selection : null;
  if (typeof selection !== "string" || !survivors.includes(selection)) {
    return noRoute(
      req.request_id,
      [...reasonAccum, REASON_CODES.ARBITRATION_INVALID],
      { required: true, used: true, arbiter: "qwen_local" },
      1,
    );
  }

  const chosen = pairs.find((p) => p.route_id === selection);
  const finalReasons = [
    ...reasonAccum,
    REASON_CODES.SEMANTIC_ARBITRATION,
  ];
  return routed(
    req.request_id,
    {
      route_id: chosen.route_id,
      implementer: chosen.implementer,
      model: chosen.model,
      confidence:
        arbOut.confidence === "low" ||
        arbOut.confidence === "medium" ||
        arbOut.confidence === "high"
          ? arbOut.confidence
          : "medium",
      reason_codes: [...new Set(finalReasons)],
    },
    { required: true, used: true, arbiter: "qwen_local" },
    finalReasons,
    1,
  );
}

async function main() {
  const requestPath = process.argv[2];
  if (!requestPath) {
    emit(
      noRoute(null, [REASON_CODES.INVALID_INPUT]),
      1,
    );
  }
  const absReq = resolve(process.cwd(), requestPath);
  if (!existsSync(absReq)) {
    emit(noRoute(null, [REASON_CODES.INVALID_INPUT]), 1);
  }
  const registryPath = process.argv[3]
    ? resolve(process.cwd(), process.argv[3])
    : DEFAULT_REGISTRY_PATH;
  const statusPath = process.argv[4]
    ? resolve(process.cwd(), process.argv[4])
    : DEFAULT_STATUS_PATH;

  const request = readJson(absReq);
  const result = await evaluateExecutionRoute(request, {
    registryPath,
    statusPath,
  });
  emit(result, result.status === "ROUTED" ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("evaluate-execution-route.mjs") ||
    process.argv[1].replace(/\\/g, "/").endsWith("tools/evaluate-execution-route.mjs"));

if (isMain) {
  main().catch((err) => {
    emit(
      {
        schema_version: RESULT_SCHEMA,
        request_id: null,
        status: "NO_ROUTE",
        execution_route: null,
        arbitration: { required: false, used: false, arbiter: null },
        reason_codes: [REASON_CODES.INVALID_INPUT],
        arbiter_call_count: 0,
        detail: String(err && err.message ? err.message : err),
      },
      1,
    );
  });
}
