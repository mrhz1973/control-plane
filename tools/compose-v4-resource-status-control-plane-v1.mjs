#!/usr/bin/env node
/**
 * V4 — compose resource-status-v1 from registry + fail-closed baseline +
 * explicit transient contributions (OFFLINE). Never collects. Never probes.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  resolveAjvModules,
  classifyAjvError,
} from "./validate-execution-packet-v1.mjs";
import { validateResourceRegistryObject } from "./validate-resource-registry-v1.mjs";
import { validateResourceStatusObject } from "./validate-resource-status-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RESULT_SCHEMA = "v4-resource-status-control-plane-source-result-v1";
export const CONTRIBUTION_SCHEMA = "v4-resource-status-contribution-v1";
export const STATUS_MAX_AGE_MS = 300_000;
export const DEFAULT_REGISTRY_PATH = resolve(ROOT, "configs/resources/registry.json");
export const DEFAULT_BASELINE_PATH = resolve(
  ROOT,
  "configs/resources/status.fail-closed.json",
);
export const CONTRIBUTION_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/v4-resource-status-contribution-v1.schema.json",
);
export const RESULT_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/v4-resource-status-control-plane-source-result-v1.schema.json",
);
export const RESOURCE_STATUS_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/resource-status-v1.schema.json",
);

const SOURCE_PRIORITY = {
  local_probe: 5,
  provider_api: 4,
  dashboard_snapshot: 3,
  internal_ledger: 2,
  manual: 1,
};

const STATUS_LOCATIONS = new Set(["local", "cloud", "remote", "hybrid", "unknown"]);

const SECRET_RE =
  /Bearer\s+[A-Za-z0-9._\-+=\/]{8,}|sk-[A-Za-z0-9]{10,}|"authorization"\s*:\s*"|api[_-]?key|password\s*[:=]|cookie\s*[:=]|session[_-]?token/i;

const validatorCache = new Map();

async function loadSchemaValidator(schemaPath) {
  if (validatorCache.has(schemaPath)) return validatorCache.get(schemaPath);
  const { ajv2020Path, formatsPath } = resolveAjvModules();
  const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
    import(pathToFileURL(ajv2020Path).href),
    import(pathToFileURL(formatsPath).href),
  ]);
  const addFormats = formatsMod.default || formatsMod;
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync(schemaPath, "utf8").replace(/^\uFEFF/, ""));
  if (schemaPath === RESULT_SCHEMA_PATH) {
    ajv.addSchema(
      JSON.parse(readFileSync(RESOURCE_STATUS_SCHEMA_PATH, "utf8").replace(/^\uFEFF/, "")),
    );
  }
  const validate = ajv.compile(schema);
  validatorCache.set(schemaPath, validate);
  return validate;
}

export async function validateAgainstSchema(schemaPath, doc) {
  try {
    const validate = await loadSchemaValidator(schemaPath);
    const ok = validate(doc);
    if (ok) return { ok: true, reason_codes: [] };
    const err = (validate.errors && validate.errors[0]) || {
      keyword: "unknown",
      instancePath: "",
    };
    const classified = classifyAjvError(err);
    return {
      ok: false,
      reason_codes: [
        classified.classification || "SCHEMA_INVALID",
        classified.reason || "invalid",
      ],
      errors: validate.errors || [],
    };
  } catch (err) {
    return {
      ok: false,
      reason_codes: [
        "SCHEMA_ENGINE_UNAVAILABLE",
        String(err && err.message ? err.message : err),
      ],
    };
  }
}

function hasSecretLike(obj) {
  try {
    return SECRET_RE.test(JSON.stringify(obj));
  } catch {
    return true;
  }
}

function isoFromMs(ms) {
  return new Date(ms).toISOString();
}

function parseTime(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : NaN;
}

function ageOk(tsMs, nowMs) {
  if (!Number.isFinite(tsMs)) return false;
  if (tsMs > nowMs) return false;
  return nowMs - tsMs <= STATUS_MAX_AGE_MS;
}

function isLocalRegistryLocation(loc) {
  return loc === "local";
}

function mapRegistryLocation(executionLocation) {
  if (STATUS_LOCATIONS.has(executionLocation)) return executionLocation;
  return "unknown";
}

function cloneJson(v) {
  return structuredClone(v);
}

function safeShell(resourceId, registryEntry, nowMs) {
  return {
    available: false,
    quota_remaining: { value: null, unit: "unknown" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode: "unknown",
    location: mapRegistryLocation(registryEntry?.execution_location),
    source: "unknown",
    updated_at: isoFromMs(nowMs),
  };
}

function seedFromBaseline(registry, baseline, nowMs) {
  const out = {};
  const decisions = {};
  for (const [resourceId, entry] of Object.entries(registry.resources)) {
    const base = baseline.resources?.[resourceId];
    if (base && typeof base === "object") {
      out[resourceId] = cloneJson(base);
    } else {
      out[resourceId] = safeShell(resourceId, entry, nowMs);
    }
    decisions[resourceId] = {
      selected_contribution_id: null,
      selected_source: "unknown",
      classification: "FAIL_CLOSED_NO_VALID_OBSERVATION",
      reason_codes: ["SEEDED_FAIL_CLOSED"],
    };
  }
  return { resources: out, decisions };
}

function normalizeObservedStatus(mapped) {
  return JSON.stringify({
    available: mapped.available,
    quota_remaining: mapped.quota_remaining,
    reset_at: mapped.reset_at,
    cost_mode: mapped.cost_mode,
    location: mapped.location,
    source: mapped.source,
    updated_at: mapped.updated_at,
  });
}

function sourceCompatible(source, registryEntry) {
  const loc = registryEntry?.execution_location;
  if (source === "local_probe") return isLocalRegistryLocation(loc);
  if (
    source === "provider_api" ||
    source === "dashboard_snapshot" ||
    source === "internal_ledger"
  ) {
    return !isLocalRegistryLocation(loc);
  }
  if (source === "manual") return true;
  return false;
}

/**
 * Apply Qwen hard gate. Returns { available, classification, reason_codes, reject }.
 * reject=true means observation cannot be selected at all (e.g. manual available=true).
 */
function applyQwenGate(resourceId, source, observation) {
  if (resourceId !== "qwen_local") {
    return {
      available: observation.available === true,
      classification: null,
      reason_codes: [],
      reject: false,
    };
  }

  const evidence = observation.evidence || {};
  const codes = [];

  if (source === "manual" && observation.available === true) {
    return {
      available: false,
      classification: "CONTRIBUTION_SOURCE_INCOMPATIBLE",
      reason_codes: ["QWEN_MANUAL_AVAILABLE_REJECTED"],
      reject: true,
    };
  }

  if (observation.available !== true) {
    const cls = evidence.classification;
    if (cls === "QWEN_BUSY_SHARED_RUNTIME") {
      return {
        available: false,
        classification: "QWEN_BUSY_FAIL_CLOSED",
        reason_codes: ["QWEN_BUSY_SHARED_RUNTIME"],
        reject: false,
      };
    }
    if (cls === "QWEN_OCCUPANCY_UNCERTAIN") {
      return {
        available: false,
        classification: "QWEN_OCCUPANCY_UNCERTAIN_FAIL_CLOSED",
        reason_codes: ["QWEN_OCCUPANCY_UNCERTAIN"],
        reject: false,
      };
    }
    if (cls === "QWEN_NOT_RUNNING_SAFE_TO_START") {
      return {
        available: false,
        classification: "QWEN_NOT_RUNNING_FAIL_CLOSED",
        reason_codes: ["QWEN_NOT_RUNNING_SAFE_TO_START"],
        reject: false,
      };
    }
    return {
      available: false,
      classification: "FAIL_CLOSED_NO_VALID_OBSERVATION",
      reason_codes: ["QWEN_UNAVAILABLE_OBSERVATION"],
      reject: false,
    };
  }

  // Positive availability request
  if (source !== "local_probe") {
    return {
      available: false,
      classification: "CONTRIBUTION_SOURCE_INCOMPATIBLE",
      reason_codes: ["QWEN_POSITIVE_REQUIRES_LOCAL_PROBE"],
      reject: true,
    };
  }
  if (evidence.kind !== "qwen_occupancy") {
    return {
      available: false,
      classification: "CONTRIBUTION_SOURCE_INCOMPATIBLE",
      reason_codes: ["QWEN_EVIDENCE_KIND_REQUIRED"],
      reject: true,
    };
  }
  if (evidence.classification === "QWEN_BUSY_SHARED_RUNTIME") {
    return {
      available: false,
      classification: "QWEN_BUSY_FAIL_CLOSED",
      reason_codes: ["QWEN_BUSY_SHARED_RUNTIME"],
      reject: false,
    };
  }
  if (evidence.classification === "QWEN_OCCUPANCY_UNCERTAIN") {
    return {
      available: false,
      classification: "QWEN_OCCUPANCY_UNCERTAIN_FAIL_CLOSED",
      reason_codes: ["QWEN_OCCUPANCY_UNCERTAIN"],
      reject: false,
    };
  }
  if (evidence.classification === "QWEN_NOT_RUNNING_SAFE_TO_START") {
    return {
      available: false,
      classification: "QWEN_NOT_RUNNING_FAIL_CLOSED",
      reason_codes: ["QWEN_NOT_RUNNING_SAFE_TO_START"],
      reject: false,
    };
  }
  if (evidence.classification !== "QWEN_READY_IDLE") {
    return {
      available: false,
      classification: "FAIL_CLOSED_NO_VALID_OBSERVATION",
      reason_codes: ["QWEN_READY_IDLE_REQUIRED"],
      reject: false,
    };
  }
  if (evidence.launch_performed === true) {
    return {
      available: false,
      classification: "QWEN_LAUNCH_FORBIDDEN_FAIL_CLOSED",
      reason_codes: ["QWEN_LAUNCH_PERFORMED"],
      reject: false,
    };
  }
  if (Number(evidence.generation_calls || 0) > 0) {
    return {
      available: false,
      classification: "QWEN_GENERATION_FORBIDDEN_FAIL_CLOSED",
      reason_codes: ["QWEN_GENERATION_CALLS_NONZERO"],
      reject: false,
    };
  }
  if (evidence.launch_performed !== false) {
    codes.push("QWEN_LAUNCH_PERFORMED_MUST_BE_FALSE");
    return {
      available: false,
      classification: "QWEN_LAUNCH_FORBIDDEN_FAIL_CLOSED",
      reason_codes: codes,
      reject: false,
    };
  }
  if (evidence.generation_calls !== 0 && evidence.generation_calls !== null) {
    // require exact 0 when claiming ready
    if (evidence.generation_calls !== 0) {
      return {
        available: false,
        classification: "QWEN_GENERATION_FORBIDDEN_FAIL_CLOSED",
        reason_codes: ["QWEN_GENERATION_CALLS_NONZERO"],
        reject: false,
      };
    }
  }
  // Require explicit generation_calls === 0
  if (evidence.generation_calls !== 0) {
    return {
      available: false,
      classification: "QWEN_GENERATION_FORBIDDEN_FAIL_CLOSED",
      reason_codes: ["QWEN_GENERATION_CALLS_REQUIRED_ZERO"],
      reject: false,
    };
  }

  return {
    available: true,
    classification: "QWEN_READY_IDLE_ACCEPTED",
    reason_codes: ["QWEN_READY_IDLE"],
    reject: false,
  };
}

function mapWinningObservation(source, observation, reserveFloor, qwenGate) {
  return {
    available: qwenGate ? qwenGate.available : observation.available === true,
    quota_remaining: cloneJson(observation.quota_remaining),
    reserve_floor: cloneJson(reserveFloor),
    reset_at: observation.reset_at ?? null,
    cost_mode: observation.cost_mode,
    location: observation.location,
    source,
    updated_at: observation.updated_at,
  };
}

function failWhole(classification, reason_codes) {
  return {
    schema_version: RESULT_SCHEMA,
    ok: false,
    classification,
    resource_status: null,
    resource_decisions: {},
    rejected_contributions: [],
    reason_codes: reason_codes || [classification],
  };
}

/**
 * Compose RESOURCE_STATUS from registry + baseline + contributions.
 */
export async function composeV4ResourceStatus(inputs = {}, options = {}) {
  const nowMs =
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs)
      ? options.nowMs
      : Date.now();

  const registry = inputs.registry;
  const baseline = inputs.baseline;
  const contributionsIn = Array.isArray(inputs.contributions)
    ? inputs.contributions
    : [];

  const regCheck = await validateResourceRegistryObject(registry);
  if (!regCheck.ok) {
    return failWhole("RESOURCE_REGISTRY_INVALID", [
      "RESOURCE_REGISTRY_INVALID",
      regCheck.classification,
    ]);
  }

  const baseCheck = await validateResourceStatusObject(baseline);
  if (!baseCheck.ok) {
    return failWhole("FAIL_CLOSED_BASELINE_INVALID", [
      "FAIL_CLOSED_BASELINE_INVALID",
      baseCheck.classification,
    ]);
  }

  const { resources: seeded, decisions } = seedFromBaseline(registry, baseline, nowMs);
  const rejected = [];
  const reason_codes = [];

  // Duplicate contribution_id → discard all copies with that id.
  const idCounts = new Map();
  for (const c of contributionsIn) {
    const id =
      c && typeof c === "object" && typeof c.contribution_id === "string"
        ? c.contribution_id
        : null;
    if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }
  const duplicatedIds = new Set(
    [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id),
  );

  /** @type {Map<string, Array>} resourceId -> candidate list */
  const candidates = new Map();
  for (const resourceId of Object.keys(registry.resources)) {
    candidates.set(resourceId, []);
  }

  for (const contrib of contributionsIn) {
    const cid =
      contrib && typeof contrib === "object" && typeof contrib.contribution_id === "string"
        ? contrib.contribution_id
        : null;

    if (cid && duplicatedIds.has(cid)) {
      rejected.push({
        contribution_id: cid,
        classification: "CONTRIBUTION_DUPLICATE_ID",
      });
      continue;
    }

    if (!contrib || typeof contrib !== "object" || Array.isArray(contrib)) {
      rejected.push({
        contribution_id: null,
        classification: "CONTRIBUTION_SCHEMA_INVALID",
      });
      continue;
    }

    if (hasSecretLike(contrib)) {
      rejected.push({
        contribution_id: cid,
        classification: "CONTRIBUTION_SECRET_LIKE",
      });
      continue;
    }

    const schemaCheck = await validateAgainstSchema(CONTRIBUTION_SCHEMA_PATH, contrib);
    if (!schemaCheck.ok) {
      rejected.push({
        contribution_id: cid,
        classification: "CONTRIBUTION_SCHEMA_INVALID",
      });
      continue;
    }

    const producedAt = parseTime(contrib.produced_at);
    if (!Number.isFinite(producedAt)) {
      rejected.push({
        contribution_id: cid,
        classification: "CONTRIBUTION_SCHEMA_INVALID",
      });
      continue;
    }
    if (producedAt > nowMs) {
      rejected.push({
        contribution_id: cid,
        classification: "CONTRIBUTION_FUTURE_DATED",
      });
      continue;
    }
    if (nowMs - producedAt > STATUS_MAX_AGE_MS) {
      rejected.push({
        contribution_id: cid,
        classification: "CONTRIBUTION_STALE",
      });
      continue;
    }

    const source = contrib.source;
    let anyAccepted = false;

    for (const [resourceId, observation] of Object.entries(contrib.resources || {})) {
      if (!Object.prototype.hasOwnProperty.call(registry.resources, resourceId)) {
        rejected.push({
          contribution_id: cid,
          classification: "CONTRIBUTION_RESOURCE_UNKNOWN",
        });
        continue;
      }

      const updatedAt = parseTime(observation.updated_at);
      if (!Number.isFinite(updatedAt)) {
        rejected.push({
          contribution_id: cid,
          classification: "CONTRIBUTION_SCHEMA_INVALID",
        });
        continue;
      }
      if (updatedAt > nowMs) {
        rejected.push({
          contribution_id: cid,
          classification: "CONTRIBUTION_FUTURE_DATED",
        });
        continue;
      }
      if (nowMs - updatedAt > STATUS_MAX_AGE_MS) {
        rejected.push({
          contribution_id: cid,
          classification: "CONTRIBUTION_STALE",
        });
        continue;
      }

      const regEntry = registry.resources[resourceId];
      if (!sourceCompatible(source, regEntry)) {
        rejected.push({
          contribution_id: cid,
          classification: "CONTRIBUTION_SOURCE_INCOMPATIBLE",
        });
        continue;
      }

      // Positive availability also checked against registry location via sourceCompatible.
      // Extra: local_probe must not assert positive cloud via observation.location alone —
      // registry location is authoritative.

      const qwenGate = applyQwenGate(resourceId, source, observation);
      if (qwenGate.reject) {
        rejected.push({
          contribution_id: cid,
          classification: qwenGate.classification || "CONTRIBUTION_SOURCE_INCOMPATIBLE",
        });
        continue;
      }

      const reserveFloor = seeded[resourceId].reserve_floor;
      const mapped = mapWinningObservation(source, observation, reserveFloor, qwenGate);

      candidates.get(resourceId).push({
        contribution_id: cid,
        source,
        priority: SOURCE_PRIORITY[source] || 0,
        updated_at_ms: updatedAt,
        mapped,
        qwen_classification: qwenGate.classification,
        qwen_reason_codes: qwenGate.reason_codes,
        normalized: normalizeObservedStatus(mapped),
      });
      anyAccepted = true;
    }

    if (!anyAccepted && !rejected.some((r) => r.contribution_id === cid)) {
      // contribution valid but all observations filtered — leave without extra reject
    }
  }

  // Select winners per resource
  for (const resourceId of Object.keys(registry.resources)) {
    const list = candidates.get(resourceId) || [];
    if (!list.length) {
      decisions[resourceId] = {
        selected_contribution_id: null,
        selected_source: "unknown",
        classification: "FAIL_CLOSED_NO_VALID_OBSERVATION",
        reason_codes: ["NO_VALID_CONTRIBUTION"],
      };
      continue;
    }

    list.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (b.updated_at_ms !== a.updated_at_ms) return b.updated_at_ms - a.updated_at_ms;
      return String(a.contribution_id).localeCompare(String(b.contribution_id));
    });

    const top = list[0];
    const sameRankSameTime = list.filter(
      (c) => c.priority === top.priority && c.updated_at_ms === top.updated_at_ms,
    );

    if (sameRankSameTime.length > 1) {
      const norms = new Set(sameRankSameTime.map((c) => c.normalized));
      if (norms.size > 1) {
        decisions[resourceId] = {
          selected_contribution_id: null,
          selected_source: "unknown",
          classification: "CONTRIBUTION_CONFLICT_FAIL_CLOSED",
          reason_codes: ["SAME_RANK_SAME_TIME_CONFLICT"],
        };
        // keep seeded fail-closed
        continue;
      }
      // equivalent — pick lexical contribution_id (already sorted)
      sameRankSameTime.sort((a, b) =>
        String(a.contribution_id).localeCompare(String(b.contribution_id)),
      );
      const winner = sameRankSameTime[0];
      seeded[resourceId] = winner.mapped;
      decisions[resourceId] = {
        selected_contribution_id: winner.contribution_id,
        selected_source: winner.source,
        classification:
          winner.qwen_classification || "OBSERVATION_SELECTED",
        reason_codes: [
          "SAME_RANK_EQUIVALENT_DETERMINISTIC",
          ...(winner.qwen_reason_codes || []),
        ],
      };
      continue;
    }

    seeded[resourceId] = top.mapped;
    decisions[resourceId] = {
      selected_contribution_id: top.contribution_id,
      selected_source: top.source,
      classification: top.qwen_classification || "OBSERVATION_SELECTED",
      reason_codes: top.qwen_reason_codes?.length
        ? top.qwen_reason_codes
        : ["OBSERVATION_SELECTED"],
    };
  }

  const resource_status = {
    schema_version: "resource-status-v1",
    generated_at: isoFromMs(nowMs),
    resources: seeded,
  };

  const statusCheck = await validateResourceStatusObject(resource_status);
  if (!statusCheck.ok) {
    return failWhole("COMPOSITION_OUTPUT_INVALID", [
      "COMPOSITION_OUTPUT_INVALID",
      statusCheck.classification,
    ]);
  }

  const result = {
    schema_version: RESULT_SCHEMA,
    ok: true,
    classification: "PASS_RESOURCE_STATUS_COMPOSED",
    resource_status,
    resource_decisions: decisions,
    rejected_contributions: rejected,
    reason_codes: reason_codes.length
      ? reason_codes
      : ["PASS_RESOURCE_STATUS_COMPOSED"],
  };

  const wrapCheck = await validateAgainstSchema(RESULT_SCHEMA_PATH, result);
  if (!wrapCheck.ok) {
    return failWhole("COMPOSITION_OUTPUT_INVALID", [
      "RESULT_WRAPPER_INVALID",
      ...wrapCheck.reason_codes,
    ]);
  }

  return result;
}

export async function validateComposerResult(result) {
  return validateAgainstSchema(RESULT_SCHEMA_PATH, result);
}

function decodeB64Json(label, value) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: `${label}_MISSING` };
  }
  try {
    const text = Buffer.from(value, "base64").toString("utf8");
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: `${label}_MALFORMED` };
  }
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("compose-v4-resource-status-control-plane-v1.mjs");

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }

  const registryPath = args.get("--registry") || DEFAULT_REGISTRY_PATH;
  const baselinePath = args.get("--baseline") || DEFAULT_BASELINE_PATH;

  let contributions = [];
  if (args.has("--contributions-b64")) {
    const decoded = decodeB64Json("CONTRIBUTIONS", args.get("--contributions-b64"));
    if (!decoded.ok || !Array.isArray(decoded.value)) {
      process.stdout.write(
        `${JSON.stringify(
          failWhole("COMPOSITION_OUTPUT_INVALID", [
            decoded.error || "CONTRIBUTIONS_NOT_ARRAY",
          ]),
        )}\n`,
      );
      process.exit(0);
    }
    contributions = decoded.value;
  }

  let registry;
  let baseline;
  try {
    registry = loadJson(resolve(registryPath));
    baseline = loadJson(resolve(baselinePath));
  } catch (err) {
    process.stdout.write(
      `${JSON.stringify(
        failWhole("COMPOSITION_OUTPUT_INVALID", [
          "INPUT_LOAD_FAILED",
          String(err && err.message ? err.message : err),
        ]),
      )}\n`,
    );
    process.exit(0);
  }

  composeV4ResourceStatus({ registry, baseline, contributions })
    .then((r) => {
      process.stdout.write(`${JSON.stringify(r)}\n`);
    })
    .catch((err) => {
      process.stdout.write(
        `${JSON.stringify(
          failWhole("COMPOSITION_OUTPUT_INVALID", [
            "COMPOSER_ERROR",
            String(err && err.message ? err.message : err),
          ]),
        )}\n`,
      );
      process.exit(0);
    });
}
