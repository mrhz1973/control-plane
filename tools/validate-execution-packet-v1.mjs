#!/usr/bin/env node
/**
 * D-0017-W — Deterministic execution-packet-v1 validator.
 *
 * Validates one JSON Execution Packet file against
 * docs/contracts/execution-packet-v1.schema.json using a JSON Schema
 * engine already present in the local environment (ajv). Does not
 * duplicate required fields/enums from the schema into hand-written rules.
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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = resolve(ROOT, "docs/contracts/execution-packet-v1.schema.json");

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

function resolveAjvModules() {
  let npmRootG = "";
  try {
    npmRootG = execSync("npm root -g", { encoding: "utf8" }).trim();
  } catch {
    npmRootG = "";
  }
  const paths = [
    npmRootG,
    npmRootG ? join(npmRootG, "firebase-tools", "node_modules") : "",
    npmRootG
      ? join(npmRootG, "firebase-tools", "node_modules", "ajv-formats", "node_modules")
      : "",
    join(ROOT, "node_modules"),
  ].filter(Boolean);

  try {
    const ajv2020Path = require.resolve("ajv/dist/2020.js", { paths });
    const formatsPath = require.resolve("ajv-formats", { paths });
    return { ajv2020Path, formatsPath, paths };
  } catch (err) {
    fail(
      "SCHEMA_ENGINE_UNAVAILABLE",
      "JSON Schema engine (ajv draft 2020-12 + ajv-formats) is not resolvable from the repository or local environment without installing new packages",
      { detail: String(err && err.message ? err.message : err) },
    );
  }
}

async function loadAjv() {
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
  return ajv;
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

function classifyAjvError(err) {
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
    // schema version is modeled as const on /schema
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
    reason: err.message || `Schema validation failed (${keyword}) at ${instancePath || "/"}`,
  };
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
  const schema = readJsonFile(SCHEMA_PATH, "SCHEMA");
  const packet = readJsonFile(absPacket, "PACKET");

  const ajv = await loadAjv();
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    fail("SCHEMA_COMPILE_ERROR", String(err.message || err), {
      schema_path: SCHEMA_PATH,
    });
  }

  const ok = validate(packet);
  if (ok) {
    emit(
      {
        ok: true,
        classification: "PASS",
        reason: "Packet validates against execution-packet-v1.schema.json",
        schema_path: SCHEMA_PATH,
        packet_path: absPacket,
      },
      0,
    );
  }

  const errors = Array.isArray(validate.errors) ? validate.errors : [];
  const primary = errors[0] || {
    keyword: "unknown",
    message: "validation failed",
    instancePath: "",
    params: {},
  };
  const classified = classifyAjvError(primary);
  emit(
    {
      ok: false,
      classification: classified.classification,
      reason: classified.reason,
      schema_path: SCHEMA_PATH,
      packet_path: absPacket,
      errors: errors.map((e) => ({
        keyword: e.keyword,
        instancePath: e.instancePath,
        message: e.message,
        params: e.params,
      })),
    },
    1,
  );
}

main().catch((err) => {
  fail("VALIDATOR_INTERNAL_ERROR", String(err && err.stack ? err.stack : err));
});
