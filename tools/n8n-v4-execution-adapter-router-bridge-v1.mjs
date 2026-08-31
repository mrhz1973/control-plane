#!/usr/bin/env node
/**
 * V4 — n8n-facing execution-adapter-router bridge (OFFLINE / live-incapable).
 * Delegates to routeToExecutionAdapter() + canonical registry.
 * Never synthesizes dispatch/authorization.
 * Never injects getOccupancy / guardStart / runOpenCode / live runner.
 * execution_performed is always false at the bridge boundary.
 */
import { routeToExecutionAdapter } from "./v4-execution-adapter-router-v1.mjs";
import { createDefaultExecutionAdapterRegistry } from "./v4-execution-adapter-registry-v1.mjs";

export const RESULT_SCHEMA = "n8n-v4-execution-adapter-router-bridge-result-v1";
export const INPUT_SCHEMA = "n8n-v4-execution-adapter-router-bridge-input-v1";
export const UNEXPECTED_LIVE = "UNEXPECTED_LIVE_EXECUTION";
export const BRIDGE_INPUT_INVALID = "BRIDGE_INPUT_INVALID";

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function base(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    ok: partial.ok === true,
    classification: partial.classification ?? BRIDGE_INPUT_INVALID,
    execution_id: partial.execution_id ?? null,
    route_id: partial.route_id ?? null,
    adapter_id: partial.adapter_id ?? null,
    implementer: partial.implementer ?? null,
    model: partial.model ?? null,
    dispatch_supplied: Boolean(partial.dispatch_supplied),
    runtime_authorization_supplied: Boolean(partial.runtime_authorization_supplied),
    execution_performed: false,
    reason_codes: partial.reason_codes || [],
    router_result: partial.router_result ?? null,
  };
}

/**
 * Build the exact request forwarded to the canonical router.
 * Optional dispatch/auth are included ONLY when really supplied as objects.
 * Dangerous live-runner keys are never forwarded.
 */
export function buildRouterRequest(input) {
  const dispatch_supplied = isPlainObject(input?.dispatch_result);
  const runtime_authorization_supplied = isPlainObject(input?.runtime_authorization);
  const request = {
    execution_id:
      typeof input?.execution_id === "string" && input.execution_id.trim()
        ? input.execution_id.trim()
        : undefined,
    execution_route_result: input?.execution_route_result,
    execution_packet: input?.execution_packet,
  };
  if (dispatch_supplied) {
    request.dispatch_result = input.dispatch_result;
  }
  if (runtime_authorization_supplied) {
    request.runtime_authorization = input.runtime_authorization;
  }
  return { request, dispatch_supplied, runtime_authorization_supplied };
}

function validateInputShape(input) {
  if (!isPlainObject(input)) {
    return { ok: false, reason_codes: [BRIDGE_INPUT_INVALID, "INPUT_MISSING"] };
  }
  if (
    input.schema_version !== undefined &&
    input.schema_version !== INPUT_SCHEMA
  ) {
    return { ok: false, reason_codes: [BRIDGE_INPUT_INVALID, "INPUT_SCHEMA_MISMATCH"] };
  }
  if (!isPlainObject(input.execution_route_result)) {
    return { ok: false, reason_codes: [BRIDGE_INPUT_INVALID, "MISSING_ROUTE_RESULT"] };
  }
  if (!isPlainObject(input.execution_packet)) {
    return { ok: false, reason_codes: [BRIDGE_INPUT_INVALID, "MISSING_EXECUTION_PACKET"] };
  }
  return { ok: true, reason_codes: [] };
}

/**
 * Run the offline n8n adapter-router bridge.
 * options.registry — optional injected validated registry (tests only).
 * Never accepts/forwards occupancy/runner callbacks.
 */
export async function runN8nExecutionAdapterRouterBridge(input, options = {}) {
  const shape = validateInputShape(input);
  if (!shape.ok) {
    return base({
      ok: false,
      classification: BRIDGE_INPUT_INVALID,
      execution_id:
        typeof input?.execution_id === "string" ? input.execution_id : null,
      reason_codes: shape.reason_codes,
      dispatch_supplied: isPlainObject(input?.dispatch_result),
      runtime_authorization_supplied: isPlainObject(input?.runtime_authorization),
    });
  }

  const { request, dispatch_supplied, runtime_authorization_supplied } =
    buildRouterRequest(input);

  const routerOptions = {};
  if (options.registry !== undefined) {
    routerOptions.registry = options.registry;
  }

  let routerResult;
  try {
    routerResult = await routeToExecutionAdapter(request, routerOptions);
  } catch {
    return base({
      ok: false,
      classification: BRIDGE_INPUT_INVALID,
      execution_id: request.execution_id ?? null,
      dispatch_supplied,
      runtime_authorization_supplied,
      reason_codes: [BRIDGE_INPUT_INVALID, "ROUTER_INVOCATION_ERROR"],
    });
  }

  if (!isPlainObject(routerResult)) {
    return base({
      ok: false,
      classification: BRIDGE_INPUT_INVALID,
      execution_id: request.execution_id ?? null,
      dispatch_supplied,
      runtime_authorization_supplied,
      reason_codes: [BRIDGE_INPUT_INVALID, "ROUTER_RESULT_INVALID"],
    });
  }

  if (routerResult.execution_performed === true) {
    return base({
      ok: false,
      classification: UNEXPECTED_LIVE,
      execution_id: routerResult.execution_id ?? request.execution_id ?? null,
      route_id: routerResult.route_id ?? null,
      adapter_id: routerResult.adapter_id ?? null,
      implementer: routerResult.implementer ?? null,
      model: routerResult.model ?? null,
      dispatch_supplied,
      runtime_authorization_supplied,
      reason_codes: [UNEXPECTED_LIVE, "DELEGATED_ROUTER_CLAIMED_LIVE_EXECUTION"],
      router_result: {
        ...routerResult,
        execution_performed: false,
      },
    });
  }

  return base({
    ok: true,
    classification: routerResult.classification,
    execution_id: routerResult.execution_id ?? request.execution_id ?? null,
    route_id: routerResult.route_id ?? null,
    adapter_id: routerResult.adapter_id ?? null,
    implementer: routerResult.implementer ?? null,
    model: routerResult.model ?? null,
    dispatch_supplied,
    runtime_authorization_supplied,
    reason_codes: ["ADAPTER_ROUTER_BRIDGE_DELEGATED", ...(routerResult.reason_codes || [])],
    router_result: routerResult,
  });
}

function decodeInputB64(value) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: "INPUT_B64_MISSING" };
  }
  try {
    const text = Buffer.from(value, "base64").toString("utf8");
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: "INPUT_B64_MALFORMED" };
  }
}

const isMain =
  process.argv[1] &&
  process.argv[1]
    .replace(/\\/g, "/")
    .endsWith("n8n-v4-execution-adapter-router-bridge-v1.mjs");

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const decoded = decodeInputB64(args.get("--input-b64"));
  if (!decoded.ok) {
    process.stdout.write(
      `${JSON.stringify(
        base({
          ok: false,
          classification: BRIDGE_INPUT_INVALID,
          reason_codes: [BRIDGE_INPUT_INVALID, decoded.error],
        }),
      )}\n`,
    );
    process.exit(0);
  }
  runN8nExecutionAdapterRouterBridge(decoded.value)
    .then((r) => {
      process.stdout.write(`${JSON.stringify(r)}\n`);
    })
    .catch(() => {
      process.stdout.write(
        `${JSON.stringify(
          base({
            ok: false,
            classification: BRIDGE_INPUT_INVALID,
            reason_codes: [BRIDGE_INPUT_INVALID, "BRIDGE_ERROR"],
          }),
        )}\n`,
      );
      process.exit(0);
    });
}

export { createDefaultExecutionAdapterRegistry };
