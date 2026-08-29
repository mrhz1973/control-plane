#!/usr/bin/env node
/**
 * V4 — Deterministic resource-status-v1 validator.
 *
 * Validates one JSON resource-status file (CLI) or object (library)
 * against docs/contracts/resource-status-v1.schema.json using the same
 * local ajv resolution path as execution-packet-v1 (no new deps).
 *
 * Usage:
 *   node tools/validate-resource-status-v1.mjs <status.json>
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
  "docs/contracts/resource-status-v1.schema.json",
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

function classifyResourceStatusError(err) {
  const keyword = err && err.keyword ? err.keyword : "unknown";
  const instancePath = err && err.instancePath ? err.instancePath : "";
  if (keyword === "const" && (instancePath === "/schema_version" || instancePath === "")) {
    return {
      classification: "INVALID_SCHEMA_VERSION",
      reason: `Invalid schema_version at ${instancePath || "/schema_version"}`,
    };
  }
  if (keyword === "format") {
    return {
      classification: "INVALID_FORMAT",
      reason: `Invalid format at ${instancePath || "/"}`,
    };
  }
  return classifyAjvError(err);
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
 * Validate an in-memory resource-status object against the canonical schema.
 */
export async function validateResourceStatusObject(doc) {
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
  if (ok) {
    return {
      ok: true,
      classification: "PASS",
      reason: "Document validates against resource-status-v1.schema.json",
      schema_path: SCHEMA_PATH,
    };
  }

  const errors = Array.isArray(validate.errors) ? validate.errors : [];
  const primary = errors[0] || {
    keyword: "unknown",
    message: "validation failed",
    instancePath: "",
    params: {},
  };
  const classified = classifyResourceStatusError(primary);
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
  const statusPath = process.argv[2];
  if (!statusPath) {
    fail(
      "USAGE_ERROR",
      "Usage: node tools/validate-resource-status-v1.mjs <status.json>",
    );
  }

  const absStatus = resolve(process.cwd(), statusPath);
  const doc = readJsonFile(absStatus, "STATUS");
  const result = await validateResourceStatusObject(doc);
  emit(
    {
      ...result,
      status_path: absStatus,
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
