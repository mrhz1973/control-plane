#!/usr/bin/env node
/**
 * V4 — build execution-routing sidecar bundle (OFFLINE).
 * Maps GPT-Web route-source + optional explicit RESOURCE_STATUS into the
 * sidecars required by the installed WF40 V4 capture lane.
 * Consumes status; never collects. Never synthesizes technical_requirements.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  resolveAjvModules,
  classifyAjvError,
} from "./validate-execution-packet-v1.mjs";
import { validateResourceStatusObject } from "./validate-resource-status-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const BUNDLE_SCHEMA = "v4-execution-routing-sidecar-bundle-v1";
export const ROUTE_SOURCE_SCHEMA = "v4-execution-route-source-v1";
export const ROUTE_REQUEST_SCHEMA = "execution-route-request-v1";
export const STATUS_MAX_AGE_MS = 300_000;
export const FAIL_CLOSED_STATUS_PATH = resolve(
  ROOT,
  "configs/resources/status.fail-closed.json",
);
export const ROUTE_SOURCE_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/v4-execution-route-sidecar-source-v1.schema.json",
);
export const ROUTE_REQUEST_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/execution-route-request-v1.schema.json",
);
export const BUNDLE_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/v4-execution-routing-sidecar-bundle-v1.schema.json",
);

const CAPABILITIES = new Set([
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

const SECRET_RE =
  /Bearer\s+[A-Za-z0-9._\-+=\/]{8,}|sk-[A-Za-z0-9]{10,}|"authorization"\s*:\s*"|api[_-]?key|password\s*[:=]/i;

function bundle(partial) {
  return {
    schema_version: BUNDLE_SCHEMA,
    ok: partial.ok === true,
    classification: partial.classification ?? "ROUTE_SOURCE_SCHEMA_INVALID",
    task_id: partial.task_id ?? null,
    execution_route_request: partial.execution_route_request ?? null,
    resource_status: partial.resource_status ?? null,
    route_source: {
      path: partial.route_source?.path ?? null,
      commit: partial.route_source?.commit ?? null,
    },
    status_source: partial.status_source ?? null,
    status_classification: partial.status_classification ?? null,
    reason_codes: partial.reason_codes || [],
  };
}

function failRoute(classification, reason_codes, extras = {}) {
  return bundle({
    ok: false,
    classification,
    task_id: extras.task_id ?? null,
    execution_route_request: null,
    resource_status: null,
    route_source: {
      path: extras.route_path ?? null,
      commit: extras.route_commit ?? null,
    },
    status_source: null,
    status_classification: null,
    reason_codes,
  });
}

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
  // Bundle schema $ref's external schemas — load them into AJV for validateBundle.
  if (schemaPath === BUNDLE_SCHEMA_PATH) {
    ajv.addSchema(
      JSON.parse(readFileSync(ROUTE_REQUEST_SCHEMA_PATH, "utf8").replace(/^\uFEFF/, "")),
    );
    ajv.addSchema(
      JSON.parse(
        readFileSync(resolve(ROOT, "docs/contracts/resource-status-v1.schema.json"), "utf8").replace(
          /^\uFEFF/,
          "",
        ),
      ),
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
    const err = (validate.errors && validate.errors[0]) || { keyword: "unknown", instancePath: "" };
    const classified = classifyAjvError(err);
    return {
      ok: false,
      reason_codes: [classified.classification || "SCHEMA_INVALID", classified.reason || "invalid"],
      errors: validate.errors || [],
    };
  } catch (err) {
    return {
      ok: false,
      reason_codes: ["SCHEMA_ENGINE_UNAVAILABLE", String(err && err.message ? err.message : err)],
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

function loadFailClosedBaseline() {
  return JSON.parse(readFileSync(FAIL_CLOSED_STATUS_PATH, "utf8").replace(/^\uFEFF/, ""));
}

/**
 * Resolve resource_status: explicit fresh transient OR fail-closed baseline.
 * Never collects. Never restamps baseline.
 */
export async function resolveResourceStatus(explicitStatus, nowMs) {
  if (explicitStatus === undefined || explicitStatus === null) {
    return {
      status: loadFailClosedBaseline(),
      status_source: "fail_closed_baseline",
      status_classification: "RESOURCE_STATUS_FAIL_CLOSED_BASELINE",
      reason_codes: ["STATUS_ABSENT"],
    };
  }

  const schemaCheck = await validateResourceStatusObject(explicitStatus);
  if (!schemaCheck.ok) {
    return {
      status: loadFailClosedBaseline(),
      status_source: "fail_closed_baseline",
      status_classification: "RESOURCE_STATUS_FAIL_CLOSED_BASELINE",
      reason_codes: ["STATUS_SCHEMA_INVALID", schemaCheck.classification],
    };
  }

  if (hasSecretLike(explicitStatus)) {
    return {
      status: loadFailClosedBaseline(),
      status_source: "fail_closed_baseline",
      status_classification: "RESOURCE_STATUS_FAIL_CLOSED_BASELINE",
      reason_codes: ["STATUS_SECRET_LIKE"],
    };
  }

  const generatedAt = Date.parse(explicitStatus.generated_at);
  if (!Number.isFinite(generatedAt)) {
    return {
      status: loadFailClosedBaseline(),
      status_source: "fail_closed_baseline",
      status_classification: "RESOURCE_STATUS_FAIL_CLOSED_BASELINE",
      reason_codes: ["STATUS_GENERATED_AT_INVALID"],
    };
  }
  if (generatedAt > nowMs) {
    return {
      status: loadFailClosedBaseline(),
      status_source: "fail_closed_baseline",
      status_classification: "RESOURCE_STATUS_FAIL_CLOSED_BASELINE",
      reason_codes: ["STATUS_FUTURE_DATED"],
    };
  }
  const age = nowMs - generatedAt;
  if (age > STATUS_MAX_AGE_MS) {
    return {
      status: loadFailClosedBaseline(),
      status_source: "fail_closed_baseline",
      status_classification: "RESOURCE_STATUS_FAIL_CLOSED_BASELINE",
      reason_codes: ["STATUS_STALE"],
    };
  }

  return {
    status: explicitStatus,
    status_source: "explicit_transient",
    status_classification: "RESOURCE_STATUS_EXPLICIT_FRESH",
    reason_codes: ["STATUS_EXPLICIT_FRESH"],
  };
}

/**
 * Build sidecar bundle.
 *
 * inputs:
 *  task_id, backlog_path, backlog_commit, risk_hint,
 *  route_source_path, route_source_commit, route_source,
 *  status? (optional explicit resource-status-v1)
 * options:
 *  nowMs? — injectable evaluation clock (ms since epoch)
 */
export async function buildV4ExecutionRoutingSidecars(inputs = {}, options = {}) {
  const taskId = typeof inputs.task_id === "string" ? inputs.task_id.trim() : "";
  const backlogPath = typeof inputs.backlog_path === "string" ? inputs.backlog_path.trim() : "";
  const backlogCommit =
    typeof inputs.backlog_commit === "string" ? inputs.backlog_commit.trim() : "";
  const riskHint = typeof inputs.risk_hint === "string" ? inputs.risk_hint.trim() : "";
  const routePath =
    typeof inputs.route_source_path === "string" ? inputs.route_source_path.trim() : "";
  const routeCommit =
    typeof inputs.route_source_commit === "string" ? inputs.route_source_commit.trim() : "";
  const routeSource = inputs.route_source;
  const nowMs =
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs)
      ? options.nowMs
      : Date.now();

  const provenance = {
    task_id: taskId || null,
    route_path: routePath || null,
    route_commit: routeCommit || null,
  };

  if (!taskId || !backlogPath || !backlogCommit || !riskHint || !routePath || !routeCommit) {
    return failRoute("ROUTE_SOURCE_MISSING", ["INPUT_FIELDS_MISSING"], provenance);
  }

  if (!routeSource || typeof routeSource !== "object" || Array.isArray(routeSource)) {
    return failRoute("ROUTE_SOURCE_MISSING", ["ROUTE_SOURCE_OBJECT_MISSING"], provenance);
  }

  // Same-commit binding: route_source_commit must equal backlog_commit.
  if (routeCommit !== backlogCommit) {
    return failRoute("ROUTE_SOURCE_COMMIT_MISMATCH", ["ROUTE_SOURCE_COMMIT_MISMATCH"], provenance);
  }

  const schemaCheck = await validateAgainstSchema(ROUTE_SOURCE_SCHEMA_PATH, routeSource);
  if (!schemaCheck.ok) {
    const codes = ["ROUTE_SOURCE_SCHEMA_INVALID", ...schemaCheck.reason_codes];
    // Distinguish created_by / capability / etc. where possible from raw shape.
    if (routeSource.created_by !== undefined && routeSource.created_by !== "gpt-web") {
      return failRoute("ROUTE_SOURCE_SCHEMA_INVALID", ["CREATED_BY_NOT_GPT_WEB", ...codes], provenance);
    }
    if (Array.isArray(routeSource.technical_requirements)) {
      const bad = routeSource.technical_requirements.filter((c) => !CAPABILITIES.has(c));
      if (bad.length) {
        return failRoute(
          "ROUTE_SOURCE_SCHEMA_INVALID",
          ["UNSUPPORTED_CAPABILITY", ...bad, ...codes],
          provenance,
        );
      }
    }
    return failRoute("ROUTE_SOURCE_SCHEMA_INVALID", codes, provenance);
  }

  if (routeSource.task_id !== taskId) {
    return failRoute("ROUTE_SOURCE_TASK_MISMATCH", ["ROUTE_SOURCE_TASK_MISMATCH"], provenance);
  }
  if (routeSource.source_backlog_path !== backlogPath) {
    return failRoute("ROUTE_SOURCE_BACKLOG_MISMATCH", ["ROUTE_SOURCE_BACKLOG_MISMATCH"], provenance);
  }
  if (routeSource.risk_level !== riskHint) {
    return failRoute("ROUTE_SOURCE_RISK_MISMATCH", ["ROUTE_SOURCE_RISK_MISMATCH"], provenance);
  }

  // Deterministic mapping only — no synthesis.
  const executionRouteRequest = {
    schema_version: ROUTE_REQUEST_SCHEMA,
    request_id: taskId,
    technical_requirements: [...routeSource.technical_requirements],
    risk_level: routeSource.risk_level,
  };
  const reqCheck = await validateAgainstSchema(ROUTE_REQUEST_SCHEMA_PATH, executionRouteRequest);
  if (!reqCheck.ok) {
    return failRoute(
      "ROUTE_SOURCE_SCHEMA_INVALID",
      ["EXECUTION_ROUTE_REQUEST_INVALID", ...reqCheck.reason_codes],
      provenance,
    );
  }

  const statusResolved = await resolveResourceStatus(inputs.status, nowMs);

  return bundle({
    ok: true,
    classification: "PASS_SIDECARS_READY",
    task_id: taskId,
    execution_route_request: executionRouteRequest,
    resource_status: statusResolved.status,
    route_source: { path: routePath, commit: routeCommit },
    status_source: statusResolved.status_source,
    status_classification: statusResolved.status_classification,
    reason_codes: ["PASS_SIDECARS_READY", ...statusResolved.reason_codes],
  });
}

export async function validateSidecarBundle(bundleObj) {
  return validateAgainstSchema(BUNDLE_SCHEMA_PATH, bundleObj);
}

function decodeB64(label, value) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: `${label}_MISSING` };
  }
  try {
    return { ok: true, value: Buffer.from(value, "base64").toString("utf8") };
  } catch {
    return { ok: false, error: `${label}_MALFORMED` };
  }
}

function decodeB64Json(label, value) {
  const text = decodeB64(label, value);
  if (!text.ok) return text;
  try {
    return { ok: true, value: JSON.parse(text.value) };
  } catch {
    return { ok: false, error: `${label}_JSON_MALFORMED` };
  }
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("build-v4-execution-routing-sidecars-v1.mjs");

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }

  const req = (flag, label) => decodeB64(label, args.get(flag));
  const task = req("--task-id-b64", "TASK_ID");
  const backlogPath = req("--backlog-path-b64", "BACKLOG_PATH");
  const backlogCommit = req("--backlog-commit-b64", "BACKLOG_COMMIT");
  const riskHint = req("--risk-hint-b64", "RISK_HINT");
  const routePath = req("--route-source-path-b64", "ROUTE_SOURCE_PATH");
  const routeCommit = req("--route-source-commit-b64", "ROUTE_SOURCE_COMMIT");
  const routeJson = decodeB64Json("ROUTE_SOURCE", args.get("--route-source-b64"));

  const failures = [task, backlogPath, backlogCommit, riskHint, routePath, routeCommit, routeJson].filter(
    (d) => !d.ok,
  );
  if (failures.length) {
    process.stdout.write(
      `${JSON.stringify(
        failRoute(
          "ROUTE_SOURCE_MISSING",
          failures.map((f) => f.error),
        ),
      )}\n`,
    );
    process.exit(0);
  }

  let status = undefined;
  if (args.has("--status-b64")) {
    const st = decodeB64Json("STATUS", args.get("--status-b64"));
    if (!st.ok) {
      // Malformed explicit status is handled as fail-closed baseline inside builder
      // only when an object is passed; for CLI malformed b64 we pass a sentinel
      // non-object via null and let resolve treat as absent? Spec: malformed
      // explicit status -> baseline. Pass an invalid marker object.
      status = { schema_version: "__malformed_cli_status__" };
    } else {
      status = st.value;
    }
  }

  buildV4ExecutionRoutingSidecars({
    task_id: task.value,
    backlog_path: backlogPath.value,
    backlog_commit: backlogCommit.value,
    risk_hint: riskHint.value,
    route_source_path: routePath.value,
    route_source_commit: routeCommit.value,
    route_source: routeJson.value,
    status,
  })
    .then((r) => {
      process.stdout.write(`${JSON.stringify(r)}\n`);
    })
    .catch((err) => {
      process.stdout.write(
        `${JSON.stringify(
          failRoute("ROUTE_SOURCE_SCHEMA_INVALID", [
            "BRIDGE_ERROR",
            String(err && err.message ? err.message : err),
          ]),
        )}\n`,
      );
      process.exit(0);
    });
}
