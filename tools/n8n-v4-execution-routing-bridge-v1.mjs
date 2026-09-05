#!/usr/bin/env node
/**
 * V4 — n8n-facing execution-routing bridge (OFFLINE).
 * WF61 planner-cycle result + explicit route-request sidecar + explicit
 * RESOURCE_STATUS snapshot -> EXECUTION_ROUTER -> adapter metadata resolution.
 * STOPS before dispatch/execution: dispatch_prepared=false, execution_performed=false.
 * Never calls adapter.run(), Qwen, session manager, providers, or n8n.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateExecutionRoute } from "./evaluate-execution-route.mjs";
import {
  createDefaultExecutionAdapterRegistry,
  validateExecutionAdapterRegistry,
} from "./v4-execution-adapter-registry-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RESULT_SCHEMA = "n8n-v4-execution-routing-bridge-result-v1";
export const CYCLE_SCHEMA = "n8n-litellm-primary-cycle-result-v1";
export const ROUTE_REQUEST_SCHEMA = "execution-route-request-v1";
export const REGISTRY_SCHEMA = "resource-registry-v1";
// Registry v2 keeps a verbatim v1 `resources` projection; both schema versions
// are accepted for the identical projection shape (registry-v2 migration).
export const REGISTRY_SCHEMAS_V1_V2 = ["resource-registry-v1", "resource-registry-v2"];
export const STATUS_SCHEMA = "resource-status-v1";
export const POLICY_DECISIONS = ["PROCEED", "GATE", "BLOCKED"];
export const DEFAULT_REGISTRY_PATH = resolve(ROOT, "configs/resources/registry.json");

function base(p) {
  return {
    schema_version: RESULT_SCHEMA,
    ok: p.ok === true,
    classification: p.classification ?? "CYCLE_RESULT_INVALID",
    task_id: p.task_id ?? null,
    packet_id: p.packet_id ?? null,
    route_request_id: p.route_request_id ?? null,
    policy_decision: p.policy_decision ?? null,
    route_status: p.route_status ?? null,
    execution_route_result: p.execution_route_result ?? null,
    route_id: p.route_id ?? null,
    implementer: p.implementer ?? null,
    model: p.model ?? null,
    adapter_registered: Boolean(p.adapter_registered),
    adapter_id: p.adapter_id ?? null,
    dispatch_required: Boolean(p.dispatch_required),
    dispatch_prepared: false,
    execution_performed: false,
    // V4_RT25_T21: normalized quota-aware decision consumption (optional input).
    quota_decision_consumed: Boolean(p.quota_decision_consumed),
    quota_decision_provenance: p.quota_decision_provenance ?? null,
    reason_codes: p.reason_codes || [],
  };
}

/**
 * V4_RT25_T21 — consume an optional quota-aware decision envelope (any RT25
 * selector output). Absent → null provenance (bridge unchanged). Present but
 * structurally invalid → { invalid: true } so the bridge fails closed rather
 * than silently ignoring operator-supplied decision metadata.
 */
function consumeQuotaDecision(quotaDecision) {
  if (quotaDecision === undefined || quotaDecision === null) {
    return { consumed: false, provenance: null, invalid: false };
  }
  if (typeof quotaDecision !== "object" || Array.isArray(quotaDecision) || typeof quotaDecision.schema_version !== "string") {
    return { consumed: false, provenance: null, invalid: true };
  }
  const isRt25Envelope = /^v4-rt25-(planner|execution|reviewer|retry)-quota-aware-decision-v1$/.test(quotaDecision.schema_version);
  if (!isRt25Envelope || typeof quotaDecision.status !== "string") {
    return { consumed: false, provenance: null, invalid: true };
  }
  const sel = quotaDecision.status === "ROUTE_SELECTED" || quotaDecision.status === "RETRY_ROUTE_SELECTED"
    ? quotaDecision.selected ?? null
    : null;
  const poolSummaries = {};
  for (const [poolId, ev] of Object.entries(quotaDecision.pool_evaluations || {})) {
    poolSummaries[poolId] = { evaluation: ev?.evaluation ?? null, freshness: ev?.freshness ?? null };
  }
  return {
    consumed: true,
    invalid: false,
    provenance: {
      decision_schema: quotaDecision.schema_version,
      decision_id: quotaDecision.decision_id ?? null,
      decision_role: quotaDecision.decision_role ?? null,
      status: quotaDecision.status,
      selected_route: sel?.route_id ?? null,
      selected_model: sel?.model ?? null,
      selected_quota_pool_id: sel?.quota_pool_id ?? null,
      pool_evaluations: poolSummaries,
      authorization_note: "routing metadata only; no authorization gate changed",
    },
  };
}

function validateCycleResult(cycleResult) {
  const codes = [];
  if (!cycleResult || typeof cycleResult !== "object" || Array.isArray(cycleResult)) {
    return { ok: false, reason_codes: ["CYCLE_RESULT_INVALID", "CYCLE_RESULT_MISSING"] };
  }
  const schema = cycleResult.schema || cycleResult.schema_version;
  if (schema !== CYCLE_SCHEMA) codes.push("CYCLE_SCHEMA_MISMATCH");
  if (cycleResult.ok !== true) codes.push("CYCLE_NOT_OK");
  if (cycleResult.classification !== "PASS") codes.push("CYCLE_NOT_PASS");
  if (!cycleResult.packet || typeof cycleResult.packet !== "object") codes.push("PACKET_MISSING");
  if (!cycleResult.policy || typeof cycleResult.policy !== "object") codes.push("POLICY_MISSING");
  if (codes.length) return { ok: false, reason_codes: ["CYCLE_RESULT_INVALID", ...codes] };
  return { ok: true, reason_codes: [] };
}

function validatePolicy(policy) {
  if (!policy || typeof policy !== "object") {
    return { ok: false, reason_codes: ["POLICY_INVALID", "POLICY_MISSING"] };
  }
  const decision = policy.decision ?? policy.policy_decision;
  if (!POLICY_DECISIONS.includes(decision)) {
    return { ok: false, reason_codes: ["POLICY_INVALID", `POLICY_DECISION:${String(decision)}`] };
  }
  return { ok: true, decision, reason_codes: [] };
}

function validateRouteRequestSidecar(routeRequest) {
  if (!routeRequest || typeof routeRequest !== "object" || Array.isArray(routeRequest)) {
    return { ok: false, reason_codes: ["ROUTE_REQUEST_INVALID", "ROUTE_REQUEST_MISSING"] };
  }
  if (routeRequest.schema_version !== ROUTE_REQUEST_SCHEMA) {
    return { ok: false, reason_codes: ["ROUTE_REQUEST_INVALID", "ROUTE_REQUEST_SCHEMA_MISMATCH"] };
  }
  if (typeof routeRequest.request_id !== "string" || !routeRequest.request_id.trim()) {
    return { ok: false, reason_codes: ["ROUTE_REQUEST_INVALID", "ROUTE_REQUEST_ID_MISSING"] };
  }
  if (!Array.isArray(routeRequest.technical_requirements) || routeRequest.technical_requirements.length === 0) {
    return { ok: false, reason_codes: ["ROUTE_REQUEST_INVALID", "TECHNICAL_REQUIREMENTS_MISSING"] };
  }
  return { ok: true, reason_codes: [] };
}

/**
 * Evaluate the offline routing bridge.
 *
 * inputs: { cycle_result, route_request, status, registry? }
 * options: { registryPath?, semanticArbiter? (injectable offline only), adapterRegistry? }
 */
export async function runN8nExecutionRoutingBridge(inputs, options = {}) {
  const cycleCheck = validateCycleResult(inputs?.cycle_result);
  const cycle = inputs?.cycle_result;
  const taskId = typeof cycle?.task_id === "string" ? cycle.task_id : null;
  const packetId =
    cycle?.packet && typeof cycle.packet === "object" && typeof cycle.packet.packet_id === "string"
      ? cycle.packet.packet_id
      : null;

  // V4_RT25_T21: optional quota-aware decision metadata; invalid → fail closed.
  const quotaConsumption = consumeQuotaDecision(inputs?.quota_decision);
  if (quotaConsumption.invalid) {
    return base({
      task_id: taskId,
      packet_id: packetId,
      classification: "QUOTA_DECISION_INVALID",
      reason_codes: ["QUOTA_DECISION_INVALID"],
    });
  }

  if (!cycleCheck.ok) {
    return base({ task_id: taskId, packet_id: packetId, classification: "CYCLE_RESULT_INVALID", reason_codes: cycleCheck.reason_codes });
  }

  const policyCheck = validatePolicy(cycle.policy);
  if (!policyCheck.ok) {
    return base({
      task_id: taskId,
      packet_id: packetId,
      classification: "POLICY_INVALID",
      reason_codes: policyCheck.reason_codes,
    });
  }
  if (policyCheck.decision !== "PROCEED") {
    return base({
      task_id: taskId,
      packet_id: packetId,
      policy_decision: policyCheck.decision,
      classification: policyCheck.decision === "GATE" ? "POLICY_GATE_REQUIRED" : "POLICY_BLOCKED",
      reason_codes: [`POLICY_${policyCheck.decision}`],
    });
  }

  const routeRequestCheck = validateRouteRequestSidecar(inputs.route_request);
  if (!routeRequestCheck.ok) {
    return base({
      task_id: taskId,
      packet_id: packetId,
      policy_decision: "PROCEED",
      classification: "ROUTE_REQUEST_INVALID",
      reason_codes: routeRequestCheck.reason_codes,
    });
  }

  // RESOURCE_STATUS must be explicit input; never collected live.
  const status = inputs.status;
  if (!status || typeof status !== "object" || status.schema_version !== STATUS_SCHEMA) {
    return base({
      task_id: taskId,
      packet_id: packetId,
      policy_decision: "PROCEED",
      route_request_id: inputs.route_request.request_id,
      classification: "RESOURCE_STATUS_INVALID",
      reason_codes: ["RESOURCE_STATUS_INVALID", "STATUS_MISSING_OR_SCHEMA_MISMATCH"],
    });
  }

  // RESOURCE_REGISTRY: explicit object or canonical static file (never network).
  let registry = inputs.registry ?? null;
  if (!registry) {
    try {
      registry = JSON.parse(
        readFileSync(options.registryPath || DEFAULT_REGISTRY_PATH, "utf8").replace(/^\uFEFF/, ""),
      );
    } catch {
      return base({
        task_id: taskId,
        packet_id: packetId,
        policy_decision: "PROCEED",
        route_request_id: inputs.route_request.request_id,
        classification: "RESOURCE_REGISTRY_INVALID",
        reason_codes: ["RESOURCE_REGISTRY_INVALID", "REGISTRY_FILE_UNREADABLE"],
      });
    }
  }
  if (!REGISTRY_SCHEMAS_V1_V2.includes(registry?.schema_version)) {
    return base({
      task_id: taskId,
      packet_id: packetId,
      policy_decision: "PROCEED",
      route_request_id: inputs.route_request.request_id,
      classification: "RESOURCE_REGISTRY_INVALID",
      reason_codes: ["RESOURCE_REGISTRY_INVALID", "REGISTRY_SCHEMA_MISMATCH"],
    });
  }

  // EXECUTION_ROUTER (reused, unchanged). Offline injectable arbiter only.
  const routeResult = await evaluateExecutionRoute(inputs.route_request, {
    registry,
    status,
    ...(options.semanticArbiter ? { semanticArbiter: options.semanticArbiter } : {}),
  });

  const routeRequestId = inputs.route_request.request_id;
  if (routeResult.status !== "ROUTED") {
    return base({
      task_id: taskId,
      packet_id: packetId,
      policy_decision: "PROCEED",
      route_request_id: routeRequestId,
      route_status: routeResult.status,
      execution_route_result: routeResult,
      classification: "NO_ROUTE",
      reason_codes: ["NO_ROUTE", ...routeResult.reason_codes],
    });
  }

  const route = routeResult.execution_route;

  // Adapter registry validation + exact metadata resolution (no run()).
  const adapterRegistry = options.adapterRegistry ?? createDefaultExecutionAdapterRegistry();
  const registryValid = validateExecutionAdapterRegistry(adapterRegistry);
  if (!registryValid.ok) {
    return base({
      task_id: taskId,
      packet_id: packetId,
      policy_decision: "PROCEED",
      route_request_id: routeRequestId,
      route_status: "ROUTED",
      execution_route_result: routeResult,
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      classification: "ADAPTER_REGISTRY_INVALID",
      reason_codes: ["ADAPTER_REGISTRY_INVALID", ...registryValid.reason_codes],
    });
  }

  const entry =
    typeof adapterRegistry.get === "function" ? adapterRegistry.get(route.route_id) : null;
  if (!entry || typeof entry.run !== "function") {
    return base({
      task_id: taskId,
      packet_id: packetId,
      policy_decision: "PROCEED",
      route_request_id: routeRequestId,
      route_status: "ROUTED",
      execution_route_result: routeResult,
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      classification: "ADAPTER_NOT_REGISTERED",
      reason_codes: ["ADAPTER_NOT_REGISTERED", `ROUTE:${route.route_id}`],
    });
  }

  return base({
    ok: true,
    classification: "ROUTING_READY_FOR_DISPATCH",
    task_id: taskId,
    packet_id: packetId,
    policy_decision: "PROCEED",
    route_request_id: routeRequestId,
    route_status: "ROUTED",
    execution_route_result: routeResult,
    route_id: route.route_id,
    implementer: route.implementer,
    model: route.model,
    adapter_registered: true,
    adapter_id: entry.adapter_id,
    dispatch_required: Boolean(entry.dispatch_required),
    quota_decision_consumed: quotaConsumption.consumed,
    quota_decision_provenance: quotaConsumption.provenance,
    reason_codes: [
      "ROUTING_READY_FOR_DISPATCH",
      ...routeResult.reason_codes,
      `ADAPTER:${entry.adapter_id}`,
      ...(quotaConsumption.consumed ? ["QUOTA_DECISION_CONSUMED"] : []),
    ],
  });
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

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("n8n-v4-execution-routing-bridge-v1.mjs");

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const decode = (flag, label) => {
    if (!args.has(flag)) return { ok: false, error: `${label}_MISSING` };
    return decodeB64Json(label, args.get(flag));
  };
  const cycleRes = decode("--cycle-result-b64", "CYCLE_RESULT");
  const routeReq = decode("--route-request-b64", "ROUTE_REQUEST");
  const statusRes = decode("--status-b64", "RESOURCE_STATUS");

  // Fail closed on any malformed/missing input; single structural JSON out.
  const failClosed = (classification, reason_codes) =>
    base({ classification, reason_codes });

  if (!cycleRes.ok || !routeReq.ok || !statusRes.ok) {
    const reasons = [cycleRes, routeReq, statusRes]
      .filter((d) => !d.ok)
      .map((d) => d.error);
    const classification =
      reasons.includes("CYCLE_RESULT_MISSING") || reasons.includes("CYCLE_RESULT_MALFORMED")
        ? "CYCLE_RESULT_INVALID"
        : reasons.includes("ROUTE_REQUEST_MISSING") || reasons.includes("ROUTE_REQUEST_MALFORMED")
          ? "ROUTE_REQUEST_INVALID"
          : "RESOURCE_STATUS_INVALID";
    process.stdout.write(`${JSON.stringify(failClosed(classification, reasons))}\n`);
    process.exit(0);
  }

  runN8nExecutionRoutingBridge({
    cycle_result: cycleRes.value,
    route_request: routeReq.value,
    status: statusRes.value,
  })
    .then((r) => {
      process.stdout.write(`${JSON.stringify(r)}\n`);
    })
    .catch(() => {
      process.stdout.write(`${JSON.stringify(failClosed("CYCLE_RESULT_INVALID", ["BRIDGE_ERROR"]))}\n`);
      process.exit(0);
    });
}
