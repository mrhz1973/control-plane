#!/usr/bin/env node
/**
 * V4 — Deterministic resource-registry-v1 validator.
 *
 * Validates one JSON resource-registry file (CLI) or object (library)
 * against docs/contracts/resource-registry-v1.schema.json using the same
 * local ajv resolution path as execution-packet-v1 (no new deps).
 * Adds semantic checks for compatible_resources cross-refs.
 *
 * Usage:
 *   node tools/validate-resource-registry-v1.mjs <registry.json>
 *
 * Exit: 0 PASS, non-zero FAIL.
 * Stdout: one machine-readable JSON result object.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  resolveAjvModules,
  classifyAjvError,
} from "./validate-execution-packet-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/resource-registry-v1.schema.json",
);

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function fail(classification, reason, extra = {}) {
  emit(
    {
      ok: false,
      classification,
      reason,
      schema_path: SCHEMA_PATH,
      ...extra,
    },
    1,
  );
}

function classifyRegistryError(err) {
  const keyword = err && err.keyword ? err.keyword : "unknown";
  const instancePath = err && err.instancePath ? err.instancePath : "";
  if (keyword === "const" && (instancePath === "/schema_version" || instancePath === "")) {
    return {
      classification: "INVALID_SCHEMA_VERSION",
      reason: `Invalid schema_version at ${instancePath || "/schema_version"}`,
    };
  }
  if (keyword === "uniqueItems") {
    return {
      classification: "DUPLICATE_ITEMS",
      reason: `Duplicate items at ${instancePath || "/"}`,
    };
  }
  return classifyAjvError(err);
}

/**
 * Cross-resource semantic checks (not expressible fully in JSON Schema alone).
 */
export function validateCompatibleResourcesSemantics(doc) {
  const resources =
    doc && typeof doc === "object" && doc.resources && typeof doc.resources === "object"
      ? doc.resources
      : null;
  if (!resources) {
    return {
      ok: false,
      classification: "MISSING_REQUIRED_FIELD",
      reason: "Missing required field: resources",
    };
  }

  for (const [resourceId, entry] of Object.entries(resources)) {
    const refs = entry && Array.isArray(entry.compatible_resources)
      ? entry.compatible_resources
      : [];
    for (const ref of refs) {
      if (ref === resourceId) {
        return {
          ok: false,
          classification: "SELF_COMPATIBLE_REFERENCE",
          reason: `Resource "${resourceId}" must not reference itself in compatible_resources`,
          resource_id: resourceId,
          ref,
        };
      }
      if (!Object.prototype.hasOwnProperty.call(resources, ref)) {
        return {
          ok: false,
          classification: "UNKNOWN_COMPATIBLE_RESOURCE",
          reason: `Resource "${resourceId}" references nonexistent compatible resource "${ref}"`,
          resource_id: resourceId,
          ref,
        };
      }
    }
  }

  return { ok: true };
}

let cachedValidate = null;

async function loadValidate() {
  if (cachedValidate) return cachedValidate;
  const { ajv2020Path, formatsPath } = resolveAjvModules();
  const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
    import(pathToFileURL(ajv2020Path).href),
    import(pathToFileURL(formatsPath).href),
  ]);
  const addFormats = formatsMod.default || formatsMod;
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: true,
  });
  addFormats(ajv);
  const schema = JSON.parse(
    readFileSync(SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""),
  );
  cachedValidate = ajv.compile(schema);
  return cachedValidate;
}

/**
 * Registry v2 keeps a verbatim v1 `resources` projection. To stay backward
 * compatible, project v2 -> v1 (drop v2-only sections, restore the v1
 * schema_version) before validating against the v1 schema. The `resources`
 * object itself is validated as-is, byte-identical semantics preserved.
 */
export function projectRegistryV2ToV1(doc) {
  if (
    doc &&
    typeof doc === "object" &&
    doc.schema_version === "resource-registry-v2" &&
    doc.resources &&
    typeof doc.resources === "object"
  ) {
    return { schema_version: "resource-registry-v1", resources: doc.resources };
  }
  return doc;
}

/**
 * Validate an in-memory resource-registry object against the canonical schema
 * plus compatible_resources semantic rules. Accepts resource-registry-v1 and
 * resource-registry-v2 (via verbatim `resources` projection).
 */
export async function validateResourceRegistryObject(doc) {
  // v2 shape must be structurally plausible before projection; a v2 doc without
  // the mandatory v2 sections is rejected fail-closed rather than misread as v1.
  if (
    doc &&
    typeof doc === "object" &&
    doc.schema_version === "resource-registry-v2"
  ) {
    const v2Sections = ["models", "access_surfaces", "quota_pools"];
    for (const section of v2Sections) {
      if (!doc[section] || typeof doc[section] !== "object") {
        return {
          ok: false,
          classification: "INVALID_SCHEMA_VERSION",
          reason: `resource-registry-v2 document missing required section "${section}"`,
          schema_path: SCHEMA_PATH,
        };
      }
    }
    doc = projectRegistryV2ToV1(doc);
  }
  let validate;
  try {
    validate = await loadValidate();
  } catch (err) {
    return {
      ok: false,
      classification: err.classification || "SCHEMA_ENGINE_UNAVAILABLE",
      reason: String(err.message || err),
      schema_path: SCHEMA_PATH,
      detail: err.detail,
    };
  }

  const ok = validate(doc);
  if (!ok) {
    const errors = Array.isArray(validate.errors) ? validate.errors : [];
    const primary = errors[0] || {
      keyword: "unknown",
      message: "validation failed",
      instancePath: "",
      params: {},
    };
    const classified = classifyRegistryError(primary);
    return {
      ok: false,
      classification: classified.classification,
      reason: classified.reason,
      schema_path: SCHEMA_PATH,
      errors: errors.map((e) => ({
        keyword: e.keyword,
        instancePath: e.instancePath,
        message: e.message,
        params: e.params,
      })),
    };
  }

  const semantic = validateCompatibleResourcesSemantics(doc);
  if (!semantic.ok) {
    return {
      ok: false,
      classification: semantic.classification,
      reason: semantic.reason,
      schema_path: SCHEMA_PATH,
      resource_id: semantic.resource_id,
      ref: semantic.ref,
    };
  }

  return {
    ok: true,
    classification: "PASS",
    reason: "Document validates against resource-registry-v1.schema.json",
    schema_path: SCHEMA_PATH,
  };
}

function readJsonFile(path, classificationPrefix) {
  if (!existsSync(path)) {
    fail(`${classificationPrefix}_NOT_FOUND`, `File not found: ${path}`, {
      path,
    });
  }
  let text;
  try {
    text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  } catch (err) {
    fail(`${classificationPrefix}_READ_ERROR`, String(err.message || err), {
      path,
    });
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    fail(`${classificationPrefix}_JSON_PARSE_ERROR`, String(err.message || err), {
      path,
    });
  }
}

async function main() {
  const registryPath = process.argv[2];
  if (!registryPath) {
    fail(
      "USAGE_ERROR",
      "Usage: node tools/validate-resource-registry-v1.mjs <registry.json>",
    );
  }

  const absRegistry = resolve(process.cwd(), registryPath);
  const doc = readJsonFile(absRegistry, "REGISTRY");
  const result = await validateResourceRegistryObject(doc);
  emit(
    {
      ...result,
      registry_path: absRegistry,
    },
    result.ok ? 0 : 1,
  );
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    fail("VALIDATOR_INTERNAL_ERROR", String(err && err.stack ? err.stack : err));
  });
}
