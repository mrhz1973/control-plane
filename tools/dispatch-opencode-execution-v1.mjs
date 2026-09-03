#!/usr/bin/env node
/**
 * V4 — OpenCode execution dispatch boundary (DISPATCH_READY only; no generation).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validatePacketObject } from "./validate-execution-packet-v1.mjs";
import { ensureQwenLocalReady } from "./qwen-local-session-manager-v1.mjs";
import { getProfile, loadQwenLocalRuntime, roleQualifiedForLiveExecution } from "./qwen-local-runtime-v1.mjs";
import { probeOpenCodeLocal, DISPATCH_CLI_CAPABILITIES } from "./probe-opencode-local-v1.mjs";


export const REQUEST_SCHEMA = "opencode-execution-dispatch-v1";
export const RESULT_SCHEMA = "opencode-execution-dispatch-result-v1";
export const SPEC_SCHEMA = "opencode-dispatch-spec-v1";

export const ALLOWED_IMPLEMENTER = "opencode";
export const ALLOWED_MODEL = "qwen_local";
export const DEFAULT_PROFILE = "qwen38-dcfr-iq3-agent-24k";
export const DEFAULT_EXECUTION_ROLE = "FAST_AGENT";
export const QWEN_LOCAL_PROVIDER_ID = "qwen_local";


const SECRET_PATTERNS = [
  /\bsk-[a-zA-Z0-9]{8,}\b/,
  /\bBearer\s+[a-zA-Z0-9._-]{8,}\b/i,
  /\bapi[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9._-]{8,}/i,
  /\bsecret\s*[:=]\s*['"]?[a-zA-Z0-9._-]{8,}/i,
  /\btoken\s*[:=]\s*['"]?[a-zA-Z0-9._-]{8,}/i,
];

function result(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    dispatch_id: partial.dispatch_id ?? null,
    status: partial.status,
    route_id: partial.route_id ?? null,
    implementer: partial.implementer ?? null,
    model: partial.model ?? null,
    qwen_session_status: partial.qwen_session_status ?? null,
    opencode_available: Boolean(partial.opencode_available),
    dispatch_ready: Boolean(partial.dispatch_ready),
    execution_performed: false,
    classification: partial.classification,
    reason_codes: partial.reason_codes || [],
    dispatch_spec: partial.dispatch_spec ?? null,
  };
}

function fail(dispatchId, classification, reasonCodes, extra = {}) {
  return result({
    dispatch_id: dispatchId,
    status: "FAILED",
    classification,
    reason_codes: reasonCodes,
    dispatch_ready: false,
    opencode_available: extra.opencode_available ?? false,
    qwen_session_status: extra.qwen_session_status ?? null,
    route_id: extra.route_id ?? null,
    implementer: extra.implementer ?? null,
    model: extra.model ?? null,
    dispatch_spec: null,
  });
}

function validateRequestShape(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    return { ok: false, reason_codes: ["INVALID_INPUT"] };
  }
  if (request.schema_version !== REQUEST_SCHEMA) {
    return { ok: false, reason_codes: ["INVALID_INPUT", "INVALID_SCHEMA_VERSION"] };
  }
  if (typeof request.dispatch_id !== "string" || !request.dispatch_id.trim()) {
    return { ok: false, reason_codes: ["INVALID_INPUT", "MISSING_DISPATCH_ID"] };
  }
  if (!request.execution_route_result || typeof request.execution_route_result !== "object") {
    return { ok: false, reason_codes: ["INVALID_INPUT", "MISSING_ROUTE_RESULT"] };
  }
  if (!request.execution_packet || typeof request.execution_packet !== "object") {
    return { ok: false, reason_codes: ["INVALID_INPUT", "MISSING_EXECUTION_PACKET"] };
  }
  if (typeof request.repository !== "string" || !request.repository.trim()) {
    return { ok: false, reason_codes: ["INVALID_INPUT", "MISSING_REPOSITORY"] };
  }
  if (typeof request.branch !== "string" || !request.branch.trim()) {
    return { ok: false, reason_codes: ["INVALID_INPUT", "MISSING_BRANCH"] };
  }
  return { ok: true, dispatch_id: request.dispatch_id.trim() };
}

function validateRoute(executionRouteResult) {
  const routeResult = executionRouteResult;
  if (routeResult.status !== "ROUTED") {
    return {
      ok: false,
      classification: routeResult.status === "NO_ROUTE" ? "INVALID_INPUT" : "ROUTE_NOT_OPENCODE_QWEN_LOCAL",
      reason_codes:
        routeResult.status === "NO_ROUTE"
          ? ["NO_ROUTE", "ROUTE_NOT_OPENCODE_QWEN_LOCAL"]
          : ["ROUTE_NOT_OPENCODE_QWEN_LOCAL"],
    };
  }
  const route = routeResult.execution_route;
  if (!route || typeof route !== "object") {
    return {
      ok: false,
      classification: "ROUTE_NOT_OPENCODE_QWEN_LOCAL",
      reason_codes: ["ROUTE_NOT_OPENCODE_QWEN_LOCAL", "MISSING_EXECUTION_ROUTE"],
    };
  }
  if (route.implementer !== ALLOWED_IMPLEMENTER || route.model !== ALLOWED_MODEL) {
    return {
      ok: false,
      classification: "ROUTE_NOT_OPENCODE_QWEN_LOCAL",
      reason_codes: ["ROUTE_NOT_OPENCODE_QWEN_LOCAL"],
      route,
    };
  }
  return { ok: true, route };
}

export function deriveDispatchMessage(packet) {
  const goal = typeof packet.goal === "string" ? packet.goal.trim() : "";
  if (!goal) return "Execute the bounded task described in the execution packet.";
  return goal.length > 4000 ? goal.slice(0, 4000) : goal;
}

export function buildOpenCodeProviderOverlay({ baseUrl, modelId }) {
  const base = String(baseUrl).replace(/\/$/, "");
  const openaiBase = base.endsWith("/v1") ? base : `${base}/v1`;
  return {
    $schema: "https://opencode.ai/config.json",
    provider: {
      [QWEN_LOCAL_PROVIDER_ID]: {
        npm: "@ai-sdk/openai-compatible",
        name: "qwen_local llama.cpp DFlash2",
        api: openaiBase,
        options: {
          baseURL: openaiBase,
        },
        models: {
          [modelId]: {
            name: "Qwen 3.8 DFlash2 local",
          },
        },
      },
    },
  };
}

export function buildOpenCodeDispatchSpec({
  repository,
  branch,
  packet,
  qwenSession,
  opencodeProbe,
  profile = DEFAULT_PROFILE,
}) {
  const runtime = loadQwenLocalRuntime();
  const profileResult = getProfile(runtime, profile);
  if (!profileResult.ok) {
    throw new Error(`DISPATCH_BUILD_FAILED: ${profileResult.reason || profileResult.classification}`);
  }
  const prof = profileResult.profile;
  const modelId = prof.llama_cpp_model_id;
  const modelSelector = `${QWEN_LOCAL_PROVIDER_ID}/${modelId}`;
  const message = deriveDispatchMessage(packet);
  const caps = opencodeProbe?.capabilities || DISPATCH_CLI_CAPABILITIES;

  const argv = [
    caps.subcommand,
    caps.directory_flag,
    repository,
    caps.model_flag,
    modelSelector,
    caps.format_flag,
    caps.format_json_value,
    caps.auto_flag,
    message,
  ];

  return {
    schema_version: SPEC_SCHEMA,
    cli_version: opencodeProbe?.version || null,
    executable: opencodeProbe?.executable || "opencode",
    invocation: {
      argv,
      cwd: repository,
      branch,
    },
    model_selector: modelSelector,
    logical_model: ALLOWED_MODEL,
    qwen_local: {
      profile,
      llama_cpp_model_id: modelId,
      base_url: qwenSession.base_url,
      dflash_required: false,
      canonical_endpoint: "http://127.0.0.1:8080",
    },
    provider_config_overlay: buildOpenCodeProviderOverlay({
      baseUrl: qwenSession.base_url,
      modelId,
    }),
    config_delivery:
      "Provide provider_config_overlay via project opencode.json or OPENCODE_CONFIG for live proof; local endpoint requires no API key.",
    message_source: "execution_packet.goal",
    execution_permitted: false,
  };
}

export function containsSecretMaterial(text) {
  const s = typeof text === "string" ? text : JSON.stringify(text);
  return SECRET_PATTERNS.some((re) => re.test(s));
}

function isQwenReady(session) {
  return (
    session &&
    session.ready === true &&
    (session.status === "READY" || session.status === "LAUNCH_STARTED_AND_READY")
  );
}

/**
 * Build dispatch result only. Never executes OpenCode unless options.execute === true
 * (explicitly forbidden in v1 default / this pass).
 */
export async function dispatchOpenCodeExecution(request, options = {}) {
  const shape = validateRequestShape(request);
  if (!shape.ok) {
    return fail(null, "INVALID_INPUT", shape.reason_codes);
  }
  const dispatchId = shape.dispatch_id;

  if (options.execute === true) {
    return fail(dispatchId, "DISPATCH_BUILD_FAILED", [
      "EXECUTION_FORBIDDEN_IN_DISPATCH_READY_MODE",
    ]);
  }

  const routeCheck = validateRoute(request.execution_route_result);
  if (!routeCheck.ok) {
    return fail(dispatchId, routeCheck.classification, routeCheck.reason_codes, {
      route_id: routeCheck.route?.route_id ?? null,
      implementer: routeCheck.route?.implementer ?? null,
      model: routeCheck.route?.model ?? null,
    });
  }
  const route = routeCheck.route;

  const packetValidation = await (
    options.validatePacket || validatePacketObject
  )(request.execution_packet);
  if (!packetValidation.ok) {
    return fail(dispatchId, "PACKET_INVALID", ["PACKET_INVALID", packetValidation.classification], {
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
    });
  }

  const opencodeProbe = options.opencodeProbe ||
    (options.probeOpenCode || probeOpenCodeLocal)(options.opencodeProbeOptions);
  if (!opencodeProbe.available || !opencodeProbe.dispatch_interface_resolved) {
    return fail(dispatchId, "OPENCODE_UNAVAILABLE", ["OPENCODE_UNAVAILABLE"], {
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      opencode_available: false,
    });
  }

  let qwenSession;
  try {
    qwenSession = await (options.ensureQwenReady || ensureQwenLocalReady)({
      profile: options.profile || DEFAULT_PROFILE,
      ...options.qwenSessionOptions,
    });
  } catch {
    return fail(dispatchId, "QWEN_LOCAL_UNAVAILABLE", ["QWEN_LOCAL_UNAVAILABLE"], {
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      opencode_available: true,
      qwen_session_status: "SESSION_MANAGER_ERROR",
    });
  }

  if (!isQwenReady(qwenSession)) {
    return fail(dispatchId, "QWEN_LOCAL_UNAVAILABLE", ["QWEN_LOCAL_UNAVAILABLE"], {
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      opencode_available: true,
      qwen_session_status: qwenSession?.status ?? "NOT_READY",
    });
  }

  let dispatchSpec;
  try {
    dispatchSpec = buildOpenCodeDispatchSpec({
      repository: request.repository,
      branch: request.branch,
      packet: request.execution_packet,
      qwenSession,
      opencodeProbe,
      profile: options.profile || DEFAULT_PROFILE,
    });
  } catch {
    return fail(dispatchId, "DISPATCH_BUILD_FAILED", ["DISPATCH_BUILD_FAILED"], {
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      opencode_available: true,
      qwen_session_status: qwenSession.status,
    });
  }

  // AGG 2026-09-03: role-qualification gate at the DISPATCH_READY boundary.
  // The dispatch profile's live-execution role must be qualified. The default
  // executor (FAST_AGENT on DCFR 24K) is UNQUALIFIED pending requalification,
  // so DISPATCH_READY must not be asserted for it. DCFR long-task dispatch
  // remains available via an explicitly qualified role/profile.
  const profileForGate = options.profile || DEFAULT_PROFILE;
  const roleForGate =
    typeof options.role === "string" && options.role.trim()
      ? options.role
      : DEFAULT_EXECUTION_ROLE;
  const roleGate = options.roleGate || roleQualifiedForLiveExecution;
  const gate = roleGate(roleForGate);
  if (!gate.qualified) {
    return fail(dispatchId, "PROFILE_ROLE_UNQUALIFIED", [
      "PROFILE_ROLE_UNQUALIFIED",
      "ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION",
      `PROFILE:${profileForGate}`,
      `ROLE:${roleForGate}`,
    ], {
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      opencode_available: true,
      qwen_session_status: qwenSession.status,
    });
  }


  if (containsSecretMaterial(JSON.stringify(dispatchSpec))) {
    return fail(dispatchId, "DISPATCH_BUILD_FAILED", ["DISPATCH_SPEC_SECRET_SUSPECT"], {
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      opencode_available: true,
      qwen_session_status: qwenSession.status,
    });
  }

  if (options.onWouldExecute) {
    options.onWouldExecute(dispatchSpec);
  }

  return result({
    dispatch_id: dispatchId,
    status: "READY",
    route_id: route.route_id,
    implementer: route.implementer,
    model: route.model,
    qwen_session_status: qwenSession.status,
    opencode_available: true,
    dispatch_ready: true,
    classification: "DISPATCH_READY",
    reason_codes: ["DISPATCH_READY"],
    dispatch_spec: dispatchSpec,
  });
}

function parseArgs(argv) {
  const opts = { inputFile: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--input-file" && argv[i + 1]) {
      opts.inputFile = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      opts.help = true;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    process.stderr.write(
      "Usage: node tools/dispatch-opencode-execution-v1.mjs --input-file <request.json>\n",
    );
    process.exit(0);
  }
  if (!opts.inputFile) {
    process.stderr.write("error: --input-file required\n");
    process.exit(1);
  }
  const request = JSON.parse(
    readFileSync(resolve(process.cwd(), opts.inputFile), "utf8").replace(/^\uFEFF/, ""),
  );
  const out = await dispatchOpenCodeExecution(request);
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  process.exit(out.classification === "DISPATCH_READY" ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("dispatch-opencode-execution-v1.mjs");

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
