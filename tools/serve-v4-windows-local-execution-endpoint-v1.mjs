#!/usr/bin/env node
/**
 * V4 — Windows-local OpenCode execution endpoint (OFFLINE-capable, live-incapable by default).
 * POST-only private transport adapter into executeOpenCodeBounded().
 * Never synthesizes auth/dispatch. Never provides custom guardStart.
 * Production bind target: 127.0.0.1:18791. Tests MUST use ephemeral port 0.
 */
import http from "node:http";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import {
  executeOpenCodeBounded,
  DIRECT_QWEN_ENDPOINT_FORBIDDEN,
} from "./opencode-execution-adapter-v1.mjs";
import {
  loadRuntimeConfig,
  gatherQwenDiagnostics,
  classifyQwenSharedRuntime,
  gatherOpenCodeFilesystemEvidence,
} from "./produce-v4-local-runtime-readonly-contribution-v1.mjs";
import {
  admitAuthorization,
  inspectAuthorization,
} from "./v4-runtime-authorization-provenance-registry-v1.mjs";
import {
  DISPATCH_CLI_CAPABILITIES,
} from "./probe-opencode-local-v1.mjs";
import { buildOpenCodeProviderOverlay } from "./dispatch-opencode-execution-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RESULT_SCHEMA = "v4-windows-local-execution-endpoint-result-v1";
export const REQUEST_SCHEMA = "v4-windows-local-execution-endpoint-request-v1";
export const CANONICAL_PATH = "/v4/execution/opencode-local";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 18791;
export const CACHE_LIMIT = 64;

const REQUEST_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json",
);

const require = createRequire(import.meta.url);

function resolveAjvModules() {
  let npmRootG = "";
  try {
    npmRootG = execSync("npm root -g", { encoding: "utf8" }).trim();
  } catch {
    npmRootG = "";
  }
  const paths = [
    process.env.CONTROL_PLANE_AJV_NODE_MODULES,
    npmRootG,
    npmRootG ? join(npmRootG, "firebase-tools", "node_modules") : "",
    join(ROOT, "node_modules"),
  ].filter(Boolean);
  const ajv2020Path = require.resolve("ajv/dist/2020.js", { paths });
  const formatsPath = require.resolve("ajv-formats", { paths });
  return { ajv2020Path, formatsPath };
}

let cachedRequestValidate = null;
async function getRequestValidate() {
  if (cachedRequestValidate) return cachedRequestValidate;
  const { ajv2020Path, formatsPath } = resolveAjvModules();
  const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
    import(pathToFileURL(ajv2020Path).href),
    import(pathToFileURL(formatsPath).href),
  ]);
  const addFormats = formatsMod.default || formatsMod;
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync(REQUEST_SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""));
  cachedRequestValidate = ajv.compile(schema);
  return cachedRequestValidate;
}

export function wrapResult(partial) {
  const adapter = partial.adapter_result ?? null;
  const performed =
    adapter && typeof adapter === "object"
      ? adapter.execution_performed === true
      : false;
  return {
    schema_version: RESULT_SCHEMA,
    ok: partial.ok === true,
    classification: partial.classification ?? "ENDPOINT_INTERNAL_FAIL_CLOSED",
    execution_id: partial.execution_id ?? null,
    replayed: partial.replayed === true,
    execution_performed: performed,
    adapter_result: adapter,
    reason_codes: partial.reason_codes || [],
  };
}

export function requestFingerprint(body) {
  const canonical = JSON.stringify({
    schema_version: body.schema_version,
    execution_id: body.execution_id,
    runtime_authorization: body.runtime_authorization,
    message: body.message,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Resolve a no-shell OpenCode invocation from existing install metadata.
 * Uses node + opencode-ai package bin entry (never .cmd via shell).
 */
export function resolveOpenCodeNoShellInvocation(options = {}) {
  const evidence =
    options.fsEvidence || gatherOpenCodeFilesystemEvidence(process.platform);
  if (!evidence.shimExists && !evidence.binExists) {
    return {
      ok: false,
      classification: "SAFE_OPENCODE_RUNNER_RESOLUTION_UNAVAILABLE",
      reason_codes: ["SAFE_OPENCODE_RUNNER_RESOLUTION_UNAVAILABLE", "OPENCODE_INSTALL_MISSING"],
    };
  }
  if (!evidence.binExists || !evidence.binEntry || !evidence.packageJsonPath) {
    return {
      ok: false,
      classification: "SAFE_OPENCODE_RUNNER_RESOLUTION_UNAVAILABLE",
      reason_codes: ["SAFE_OPENCODE_RUNNER_RESOLUTION_UNAVAILABLE", "OPENCODE_BIN_UNRESOLVED"],
    };
  }
  const packageDir = dirname(evidence.packageJsonPath);
  const scriptPath = join(packageDir, evidence.binEntry);
  if (!existsSync(scriptPath)) {
    return {
      ok: false,
      classification: "SAFE_OPENCODE_RUNNER_RESOLUTION_UNAVAILABLE",
      reason_codes: ["SAFE_OPENCODE_RUNNER_RESOLUTION_UNAVAILABLE", "OPENCODE_BIN_MISSING"],
    };
  }
  return {
    ok: true,
    nodePath: process.execPath,
    scriptPath,
    shell: false,
    reason_codes: [],
  };
}

export function buildOpenCodeArgv({ workspaceRoot, modelId, message }) {
  const caps = DISPATCH_CLI_CAPABILITIES;
  const model = `qwen_local/${modelId}`;
  return [
    caps.subcommand,
    caps.directory_flag,
    workspaceRoot,
    caps.model_flag,
    model,
    caps.format_flag,
    caps.format_json_value,
    caps.auto_flag,
    message,
  ];
}

/**
 * Production getOccupancy: one diagnostics gather + canonical classifier.
 */
export function createProductionGetOccupancy(options = {}) {
  const loadConfig = options.loadRuntimeConfig || loadRuntimeConfig;
  const gather = options.gatherQwenDiagnostics || gatherQwenDiagnostics;
  const classify = options.classifyQwenSharedRuntime || classifyQwenSharedRuntime;
  return async function getOccupancy() {
    const runtimeConfig = loadConfig();
    const diagnostics = gather(runtimeConfig);
    const classified = classify(
      diagnostics.sampleA,
      diagnostics.sampleB,
      runtimeConfig,
    );
    return classified.classification;
  };
}

/**
 * Production runOpenCode: fixed no-shell spawn. Not invoked by offline tests.
 */
export function createProductionRunOpenCode(options = {}) {
  const workspaceRoot = options.workspaceRoot;
  const resolveInvocation =
    options.resolveOpenCodeNoShellInvocation || resolveOpenCodeNoShellInvocation;
  const spawnImpl = options.spawnImpl || spawn;
  const writeOverlay = options.writeOverlay || defaultWriteOverlay;

  return async function runOpenCode(ctx) {
    if (!workspaceRoot || typeof workspaceRoot !== "string" || !isAbsolute(workspaceRoot)) {
      throw new Error("WORKSPACE_ROOT_INVALID");
    }
    if (!existsSync(workspaceRoot)) {
      throw new Error("WORKSPACE_ROOT_MISSING");
    }
    const guardBaseUrl = String(ctx.guardBaseUrl || "");
    if (!guardBaseUrl) {
      throw new Error("GUARD_BASE_URL_INVALID");
    }
    if (guardBaseUrl === DIRECT_QWEN_ENDPOINT_FORBIDDEN) {
      throw new Error("DIRECT_QWEN_ENDPOINT_FORBIDDEN");
    }
    const modelId = String(ctx.modelId || "").trim();
    if (!modelId) throw new Error("MODEL_ID_MISSING");
    const message = typeof ctx.message === "string" ? ctx.message : "";
    if (!message) throw new Error("MESSAGE_MISSING");

    const resolved = resolveInvocation();
    if (!resolved.ok) {
      throw new Error(resolved.classification);
    }

    const argv = buildOpenCodeArgv({ workspaceRoot, modelId, message });
    const overlayPath = writeOverlay({
      guardBaseUrl,
      modelId,
    });

    const childEnv = {
      ...process.env,
      OPENCODE_CONFIG: overlayPath,
    };
    // Never pass request-supplied env. Never set shell.

    const accounting = await new Promise((resolvePromise, rejectPromise) => {
      const child = spawnImpl(resolved.nodePath, [resolved.scriptPath, ...argv], {
        cwd: workspaceRoot,
        env: childEnv,
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let settled = false;
      const finish = (err, value) => {
        if (settled) return;
        settled = true;
        if (err) rejectPromise(err);
        else resolvePromise(value);
      };
      // Drain child pipes without retaining any output content.
      drainChildOutput(child.stdout);
      drainChildOutput(child.stderr);
      child.on("error", (e) => finish(e));
      child.on("close", (code, signal) => {
        // Structural accounting only — never return raw stdout/stderr to HTTP.
        if (code === 0 && !signal) {
          // Attest only what this runner observes. Do NOT synthesize
          // qwen_generation_calls / upstream_generation_requests — the
          // adapter-owned guard accounting is authoritative for those.
          finish(null, {
            opencode_execution_count: 1,
            retry_calls: 0,
            fallback_calls: 0,
            response_validation: "NOT_VALIDATED",
          });
          return;
        }
        if (signal) {
          finish(new Error("OPENCODE_TERMINATED_BY_SIGNAL"));
          return;
        }
        finish(new Error("OPENCODE_EXIT_NONZERO"));
      });
    });
    return accounting;
  };
}

/** Drain a child pipe without retaining chunk contents. */
export function drainChildOutput(stream) {
  if (!stream) return;
  if (typeof stream.resume === "function") {
    stream.resume();
    return;
  }
  if (typeof stream.on === "function") {
    stream.on("data", () => {});
  }
}

function defaultWriteOverlay({ guardBaseUrl, modelId }) {
  const dir = join(tmpdir(), "control-plane-v4-exec-overlays");
  mkdirSync(dir, { recursive: true });
  const overlay = buildOpenCodeProviderOverlay({
    baseUrl: guardBaseUrl,
    modelId,
  });
  const path = join(
    dir,
    `opencode-overlay-${createHash("sha256").update(`${guardBaseUrl}|${modelId}`).digest("hex").slice(0, 16)}.json`,
  );
  writeFileSync(path, `${JSON.stringify(overlay, null, 2)}\n`);
  return path;
}

/**
 * In-memory admission / replay / concurrency state for one service instance.
 */
export function createExecutionState(options = {}) {
  const cacheLimit = options.cacheLimit ?? CACHE_LIMIT;
  return {
    inFlight: false,
    byExecutionId: new Map(), // id -> { fingerprint, response }
    authBinding: new Map(), // authId -> execution_id
    spentAuth: new Set(),
    cacheLimit,
  };
}

/**
 * Handle one validated request body. options inject execute/getOccupancy/runOpenCode.
 */
export async function handleExecutionRequest(body, options = {}) {
  const state = options.state || createExecutionState();
  const fingerprint = requestFingerprint(body);
  const executionId = body.execution_id;
  const authId = body.runtime_authorization.authorization_id;

  const cached = state.byExecutionId.get(executionId);
  if (cached) {
    if (cached.fingerprint !== fingerprint) {
      return {
        status: 409,
        body: wrapResult({
          ok: false,
          classification: "EXECUTION_ID_CONFLICT",
          execution_id: executionId,
          reason_codes: ["EXECUTION_ID_CONFLICT"],
        }),
      };
    }
    return {
      status: 200,
      body: { ...cached.response, replayed: true },
    };
  }

  const registryPath = options.authorizationRegistryPath || null;
  const inspect = options.inspectAuthorization || inspectAuthorization;
  const admit = options.admitAuthorization || admitAuthorization;

  if (!registryPath) {
    return {
      status: 200,
      body: wrapResult({
        ok: false,
        classification: "AUTHORIZATION_REJECTED",
        execution_id: executionId,
        reason_codes: ["AUTHORIZATION_REGISTRY_UNAVAILABLE"],
      }),
    };
  }

  const provenance = inspect(registryPath, authId, {
    routeId: body.runtime_authorization.route_id,
  });
  if (!provenance.ok) {
    return {
      status: 200,
      body: wrapResult({
        ok: false,
        classification: "AUTHORIZATION_REJECTED",
        execution_id: executionId,
        reason_codes: provenance.reason_codes,
      }),
    };
  }

  const bound = state.authBinding.get(authId);
  if (bound && bound !== executionId) {
    return {
      status: 409,
      body: wrapResult({
        ok: false,
        classification: "AUTHORIZATION_ID_REUSED",
        execution_id: executionId,
        reason_codes: ["AUTHORIZATION_ID_REUSED"],
      }),
    };
  }

  if (state.inFlight) {
    return {
      status: 409,
      body: wrapResult({
        ok: false,
        classification: "EXECUTION_BUSY",
        execution_id: executionId,
        reason_codes: ["EXECUTION_BUSY"],
      }),
    };
  }

  state.inFlight = true;
  state.authBinding.set(authId, executionId);

  // Atomic ACTIVE -> SPENT persistence before adapter/occupancy/guard/runner.
  const admitted = admit(registryPath, authId, {
    routeId: body.runtime_authorization.route_id,
  });
  if (!admitted.ok) {
    state.inFlight = false;
    state.authBinding.delete(authId);
    return {
      status: 200,
      body: wrapResult({
        ok: false,
        classification: "AUTHORIZATION_REJECTED",
        execution_id: executionId,
        reason_codes: admitted.reason_codes,
      }),
    };
  }

  try {
    const getOccupancy =
      options.getOccupancy || createProductionGetOccupancy(options);
    const runOpenCode =
      options.runOpenCode ||
      createProductionRunOpenCode({
        workspaceRoot: options.workspaceRoot,
        resolveOpenCodeNoShellInvocation: options.resolveOpenCodeNoShellInvocation,
        spawnImpl: options.spawnImpl,
        writeOverlay: options.writeOverlay,
      });

    const execute = options.executeOpenCodeBounded || executeOpenCodeBounded;
    const adapter_result = await execute(
      {
        execution_id: executionId,
        runtime_authorization: body.runtime_authorization,
        message: body.message,
      },
      {
        getOccupancy,
        runOpenCode,
        // adapter production default single-generation guard remains authoritative
      },
    );

    if (adapter_result?.authorization_state_final === "SPENT") {
      state.spentAuth.add(authId);
    }

    const response = wrapResult({
      ok: true,
      classification: adapter_result?.classification || "ADAPTER_RESULT_INVALID",
      execution_id: executionId,
      replayed: false,
      adapter_result,
      reason_codes: ["ENDPOINT_ADAPTER_DELEGATED", ...(adapter_result?.reason_codes || [])],
    });

    // Bound cache
    state.byExecutionId.set(executionId, { fingerprint, response });
    while (state.byExecutionId.size > state.cacheLimit) {
      const oldest = state.byExecutionId.keys().next().value;
      state.byExecutionId.delete(oldest);
    }

    return { status: 200, body: response };
  } catch {
    return {
      status: 500,
      body: wrapResult({
        ok: false,
        classification: "ENDPOINT_INTERNAL_FAIL_CLOSED",
        execution_id: executionId,
        reason_codes: ["ENDPOINT_INTERNAL_FAIL_CLOSED"],
      }),
    };
  } finally {
    state.inFlight = false;
  }
}

export async function createExecutionRequestHandler(options = {}) {
  const state = options.state || createExecutionState();
  const validate = options.validateRequest || (await getRequestValidate());

  return async function handle(req, res) {
    const send = (status, obj) => {
      try {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(`${JSON.stringify(obj)}\n`);
      } catch {
        /* client gone */
      }
    };

    if (req.method !== "POST") {
      send(
        405,
        wrapResult({
          ok: false,
          classification: "ENDPOINT_METHOD_REJECTED",
          reason_codes: ["POST_ONLY"],
        }),
      );
      return;
    }

    let url;
    try {
      url = new URL(req.url, "http://127.0.0.1");
    } catch {
      send(
        400,
        wrapResult({
          ok: false,
          classification: "ENDPOINT_URL_INVALID",
          reason_codes: ["URL_UNPARSEABLE"],
        }),
      );
      return;
    }
    if (url.search && url.search.length > 0) {
      send(
        400,
        wrapResult({
          ok: false,
          classification: "ENDPOINT_QUERY_REJECTED",
          reason_codes: ["QUERY_PARAMETERS_FORBIDDEN"],
        }),
      );
      return;
    }
    if (url.pathname !== CANONICAL_PATH && url.pathname !== "/") {
      send(
        404,
        wrapResult({
          ok: false,
          classification: "ENDPOINT_PATH_REJECTED",
          reason_codes: ["PATH_NOT_FOUND"],
        }),
      );
      return;
    }

    const ctype = String(req.headers["content-type"] || "").toLowerCase();
    if (!ctype.includes("application/json")) {
      send(
        400,
        wrapResult({
          ok: false,
          classification: "ENDPOINT_CONTENT_TYPE_REJECTED",
          reason_codes: ["APPLICATION_JSON_REQUIRED"],
        }),
      );
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      send(
        400,
        wrapResult({
          ok: false,
          classification: "ENDPOINT_BODY_INVALID",
          reason_codes: ["JSON_UNPARSEABLE"],
        }),
      );
      return;
    }

    const valid = validate(body);
    if (!valid) {
      send(
        400,
        wrapResult({
          ok: false,
          classification: "ENDPOINT_SCHEMA_REJECTED",
          reason_codes: ["REQUEST_SCHEMA_INVALID"],
        }),
      );
      return;
    }

    const result = await handleExecutionRequest(body, { ...options, state });
    send(result.status, result.body);
  };
}

/**
 * Start HTTP service. host/port injectable; tests MUST use port 0.
 */
export async function startWindowsLocalExecutionService(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const handler = await createExecutionRequestHandler(options);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handler(req, res).catch(() => {
        try {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            `${JSON.stringify(
              wrapResult({
                ok: false,
                classification: "ENDPOINT_INTERNAL_FAIL_CLOSED",
                reason_codes: ["HANDLER_ERROR"],
              }),
            )}\n`,
          );
        } catch {
          /* ignore */
        }
      });
    });
    server.on("error", reject);
    server.listen(port, host, () => {
      resolve({
        server,
        address: server.address(),
        close: () =>
          new Promise((r) => {
            server.close(() => r());
          }),
      });
    });
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1]
    .replace(/\\/g, "/")
    .endsWith("serve-v4-windows-local-execution-endpoint-v1.mjs");

if (isMain) {
  // Production CLI exists but this offline pass does not start it as a service.
  // Binding here is only for explicit operator launch of the tool.
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const host = args.get("--host") || DEFAULT_HOST;
  const port = Number(args.get("--port") || DEFAULT_PORT);
  const workspaceRoot = args.get("--workspace-root") || process.cwd();
  const authorizationRegistry = args.get("--authorization-registry") || "";
  if (!authorizationRegistry || !isAbsolute(authorizationRegistry)) {
    process.stderr.write(
      `${JSON.stringify({
        schema_version: "v4-windows-local-execution-endpoint-started-v1",
        ok: false,
        error_class: "AUTHORIZATION_REGISTRY_REQUIRED",
      })}\n`,
    );
    process.exit(1);
  }
  startWindowsLocalExecutionService({
    host,
    port,
    workspaceRoot,
    authorizationRegistryPath: authorizationRegistry,
  })
    .then(({ address }) => {
      process.stdout.write(
        `${JSON.stringify({
          schema_version: "v4-windows-local-execution-endpoint-started-v1",
          ok: true,
          host: address.address,
          port: address.port,
          canonical_path: CANONICAL_PATH,
        })}\n`,
      );
    })
    .catch(() => {
      process.stderr.write(
        `${JSON.stringify({
          schema_version: "v4-windows-local-execution-endpoint-started-v1",
          ok: false,
          error_class: "ENDPOINT_BIND_FAILED",
        })}\n`,
      );
      process.exit(1);
    });
}
