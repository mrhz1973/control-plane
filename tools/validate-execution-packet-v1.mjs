#!/usr/bin/env node
/**
 * D-0017-W — Deterministic execution-packet-v1 validator.
 *
 * Validates one JSON Execution Packet file (CLI) or object (library)
 * against docs/contracts/execution-packet-v1.schema.json using a JSON
 * Schema engine already present in the local environment (ajv).
 *
 * Usage:
 *   node tools/validate-execution-packet-v1.mjs <packet.json>
 *
 * Exit: 0 PASS, non-zero FAIL.
 * Stdout: one machine-readable JSON result object.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/execution-packet-v1.schema.json",
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

export function resolveAjvModules() {
  let npmRootG = "";
  try {
    npmRootG = execSync("npm root -g", { encoding: "utf8" }).trim();
  } catch {
    npmRootG = "";
  }
  const envNodeModules = process.env.CONTROL_PLANE_AJV_NODE_MODULES;
  const paths = [
    typeof envNodeModules === "string" && envNodeModules.trim().length > 0
      ? envNodeModules.trim()
      : "",
    npmRootG,
    npmRootG ? join(npmRootG, "firebase-tools", "node_modules") : "",
    npmRootG
      ? join(
          npmRootG,
          "firebase-tools",
          "node_modules",
          "ajv-formats",
          "node_modules",
        )
      : "",
    join(ROOT, "node_modules"),
  ].filter(Boolean);

  try {
    const ajv2020Path = require.resolve("ajv/dist/2020.js", { paths });
    const formatsPath = require.resolve("ajv-formats", { paths });
    return { ajv2020Path, formatsPath, paths };
  } catch (err) {
    const detail = String(err && err.message ? err.message : err);
    const error = new Error(
      "JSON Schema engine (ajv draft 2020-12 + ajv-formats) is not resolvable from the repository or local environment without installing new packages",
    );
    error.classification = "SCHEMA_ENGINE_UNAVAILABLE";
    error.detail = detail;
    throw error;
  }
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

export function classifyAjvError(err) {
  const keyword = err && err.keyword ? err.keyword : "unknown";
  const instancePath = err && err.instancePath ? err.instancePath : "";
  const params = err && err.params ? err.params : {};
  if (keyword === "required") {
    return {
      classification: "MISSING_REQUIRED_FIELD",
      reason: `Missing required field: ${params.missingProperty || "unknown"}`,
    };
  }
  if (keyword === "enum") {
    return {
      classification: "INVALID_ENUM",
      reason: `Invalid enum at ${instancePath || "/"}`,
    };
  }
  if (keyword === "const") {
    if (instancePath === "/schema" || instancePath === "") {
      return {
        classification: "INVALID_SCHEMA_VERSION",
        reason: `Invalid schema const at ${instancePath || "/schema"}`,
      };
    }
    return {
      classification: "INVALID_CONST",
      reason: `Invalid const at ${instancePath || "/"}`,
    };
  }
  if (keyword === "additionalProperties") {
    return {
      classification: "ADDITIONAL_PROPERTY",
      reason: `Unexpected additional property: ${params.additionalProperty || "unknown"}`,
    };
  }
  return {
    classification: "SCHEMA_VALIDATION_FAILED",
    reason:
      err.message ||
      `Schema validation failed (${keyword}) at ${instancePath || "/"}`,
  };
}

/**
 * Validate an in-memory packet object against the canonical schema.
 * Does not write stdout or exit.
 */
export async function validatePacketObject(packet) {
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

  const ok = validate(packet);
  if (ok) {
    return {
      ok: true,
      classification: "PASS",
      reason: "Packet validates against execution-packet-v1.schema.json",
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
  const classified = classifyAjvError(primary);
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
  const packetPath = process.argv[2];
  if (!packetPath) {
    fail(
      "USAGE_ERROR",
      "Usage: node tools/validate-execution-packet-v1.mjs <packet.json>",
    );
  }

  const absPacket = resolve(process.cwd(), packetPath);
  const packet = readJsonFile(absPacket, "PACKET");
  const result = await validatePacketObject(packet);
  emit(
    {
      ...result,
      packet_path: absPacket,
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
