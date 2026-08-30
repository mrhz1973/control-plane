#!/usr/bin/env node
/**
 * V4 — execution-adapter routing bridge (additive, offline-first).
 * Maps an already-selected route to a registered execution adapter.
 * Never selects implementer/model (EXECUTION_ROUTER owns selection).
 * Never validates/weakens authorization (adapter owns that boundary).
 * Fail-closed: unsupported route => ADAPTER_NOT_REGISTERED, no fallback.
 */
import { executeOpenCodeBounded } from "./opencode-execution-adapter-v1.mjs";

export const RESULT_SCHEMA = "v4-execution-adapter-routing-result-v1";
export const OPENCODE_QWEN_LOCAL_ROUTE = "opencode+qwen_local";
export const DISPATCH_READY_CLASSIFICATION = "DISPATCH_READY";

function baseResult(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    execution_id: partial.execution_id ?? null,
    status: partial.status ?? "BLOCKED",
    classification: partial.classification ?? "ADAPTER_NOT_REGISTERED",
    execution_performed: partial.execution_performed === true,
    route_id: partial.route_id ?? null,
    implementer: partial.implementer ?? null,
    model: partial.model ?? null,
    adapter_id: partial.adapter_id ?? null,
    adapter_registered: Boolean(partial.adapter_registered),
    dispatch_required: Boolean(partial.dispatch_required),
    dispatch_classification: partial.dispatch_classification ?? null,
    adapter_result: partial.adapter_result ?? null,
    reason_codes: partial.reason_codes || [],
  };
}

/**
 * Adapter registry — extensible without modifying EXECUTION_ROUTER.
 * Each entry: { route_id, adapter_id, dispatch_required, run(request, options) }
 */
export function defaultAdapterRegistry(options = {}) {
  const registry = new Map();
  registry.set(OPENCODE_QWEN_LOCAL_ROUTE, {
    route_id: OPENCODE_QWEN_LOCAL_ROUTE,
    adapter_id: "opencode-execution-adapter-v1",
    dispatch_required: true,
    // request routing shape for the opencode execution adapter
    async run(request) {
      return executeOpenCodeBounded(
        {
          execution_id: request.execution_id,
          runtime_authorization: request.runtime_authorization ?? null,
          message: request.execution_packet?.goal ?? null,
        },
        {
          getOccupancy: request.getOccupancy,
          guardStart: request.guardStart,
          runOpenCode: request.runOpenCode,
          upstreamOrigin: request.upstreamOrigin,
        },
      );
    },
  });
  return registry;
}

/**
 * Route an already-selected execution route to its registered adapter.
 *
 * request:
 *   execution_id            string
 *   execution_route_result  ROUTED result from evaluate-execution-route
 *   execution_packet        object
 *   runtime_authorization?  object (passed through; validated by adapter)
 *   dispatch_result?        prebuilt OpenCode dispatch result
 *   getOccupancy/guardStart/runOpenCode/upstreamOrigin?  injected adapter deps
 *
 * options:
 *   registry — Map of route_id -> adapter entry (default: opencode+qwen_local only)
 */
export async function routeToExecutionAdapter(request, options = {}) {
  const executionId =
    request && typeof request.execution_id === "string" && request.execution_id.trim()
      ? request.execution_id.trim()
      : `route-${Date.now()}`;

  const routeResult = request?.execution_route_result;
  if (!routeResult || typeof routeResult !== "object" || Array.isArray(routeResult)) {
    return baseResult({
      execution_id: executionId,
      classification: "INVALID_INPUT",
      reason_codes: ["INVALID_INPUT", "MISSING_ROUTE_RESULT"],
    });
  }
  if (!request.execution_packet || typeof request.execution_packet !== "object") {
    return baseResult({
      execution_id: executionId,
      route_id: routeResult.execution_route?.route_id ?? null,
      implementer: routeResult.execution_route?.implementer ?? null,
      model: routeResult.execution_route?.model ?? null,
      classification: "INVALID_INPUT",
      reason_codes: ["INVALID_INPUT", "MISSING_EXECUTION_PACKET"],
    });
  }
  if (routeResult.status !== "ROUTED") {
    return baseResult({
      execution_id: executionId,
      route_id: routeResult.execution_route?.route_id ?? null,
      implementer: routeResult.execution_route?.implementer ?? null,
      model: routeResult.execution_route?.model ?? null,
      classification: "ROUTE_NOT_ROUTED",
      adapter_registered: false,
      reason_codes: ["ROUTE_NOT_ROUTED", String(routeResult.status || "UNKNOWN")],
    });
  }

  const route = routeResult.execution_route;
  const registry = options.registry || defaultAdapterRegistry();
  const entry = registry.get(route.route_id);

  if (!entry || typeof entry.run !== "function") {
    return baseResult({
      execution_id: executionId,
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      classification: "ADAPTER_NOT_REGISTERED",
      adapter_registered: false,
      reason_codes: ["ADAPTER_NOT_REGISTERED", `ROUTE:${route.route_id}`],
    });
  }

  // Dispatch gate for adapters that require DISPATCH_READY first.
  if (entry.dispatch_required) {
    const dispatch = request.dispatch_result;
    const valid =
      dispatch &&
      typeof dispatch === "object" &&
      dispatch.classification === DISPATCH_READY_CLASSIFICATION &&
      dispatch.dispatch_ready === true &&
      dispatch.execution_performed === false;
    if (!valid) {
      return baseResult({
        execution_id: executionId,
        route_id: route.route_id,
        implementer: route.implementer,
        model: route.model,
        adapter_id: entry.adapter_id,
        adapter_registered: true,
        dispatch_required: true,
        dispatch_classification:
          dispatch && typeof dispatch === "object" && dispatch.classification
            ? dispatch.classification
            : null,
        classification: "DISPATCH_NOT_READY",
        reason_codes: [
          "DISPATCH_NOT_READY",
          ...(dispatch && typeof dispatch === "object" && dispatch.classification
            ? [`DISPATCH_CLASSIFICATION:${dispatch.classification}`]
            : ["DISPATCH_MISSING"]),
        ],
      });
    }
  }

  let adapterResult = null;
  try {
    adapterResult = await entry.run(request);
  } catch (err) {
    return baseResult({
      execution_id: executionId,
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      adapter_id: entry.adapter_id,
      adapter_registered: true,
      dispatch_required: Boolean(entry.dispatch_required),
      dispatch_classification: request.dispatch_result?.classification ?? null,
      status: "ERROR",
      classification: "ADAPTER_INVOCATION_ERROR",
      reason_codes: ["ADAPTER_INVOCATION_ERROR", String(err && err.message ? err.message : "unknown")],
    });
  }

  if (!adapterResult || typeof adapterResult !== "object") {
    return baseResult({
      execution_id: executionId,
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      adapter_id: entry.adapter_id,
      adapter_registered: true,
      dispatch_required: Boolean(entry.dispatch_required),
      dispatch_classification: request.dispatch_result?.classification ?? null,
      status: "ERROR",
      classification: "ADAPTER_RESULT_INVALID",
      reason_codes: ["ADAPTER_RESULT_INVALID"],
    });
  }

  return baseResult({
    execution_id: executionId,
    route_id: route.route_id,
    implementer: route.implementer,
    model: route.model,
    adapter_id: entry.adapter_id,
    adapter_registered: true,
    dispatch_required: Boolean(entry.dispatch_required),
    dispatch_classification: request.dispatch_result?.classification ?? null,
    status: adapterResult.status === "EXECUTED" ? "EXECUTED" : adapterResult.status,
    classification: adapterResult.classification,
    execution_performed: adapterResult.execution_performed === true,
    adapter_result: adapterResult,
    reason_codes: ["ADAPTER_DELEGATED", ...(adapterResult.reason_codes || [])],
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("v4-execution-adapter-router-v1.mjs");

if (isMain) {
  // Default CLI: no route input => fail-closed, zero live execution.
  routeToExecutionAdapter({ execution_id: "cli-default-no-execution" })
    .then((r) => process.stdout.write(`${JSON.stringify(r, null, 2)}\n`))
    .catch((err) => {
      process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
      process.exit(1);
    });
}
