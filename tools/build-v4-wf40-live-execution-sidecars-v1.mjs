#!/usr/bin/env node
/**
 * V4 — WF40 post-WF61 live execution sidecar builder (OFFLINE).
 * Pure deterministic builder/validator. Zero network / model / runtime calls.
 */
import { createHash } from "node:crypto";
import { validatePacketObject } from "./validate-execution-packet-v1.mjs";
import {
  CANONICAL_SCOPE_DIGEST_V2,
  FIXED_AUTHORIZATION_SCOPE_V2,
  canonicalScopeDigestV2,
  compactScopeV2Json,
} from "./qwen-execution-scope-v2.mjs";

export const REGISTER_SCHEMA =
  "v4-runtime-authorization-register-pending-request-v1";
export const STATUS_SCHEMA = "v4-runtime-authorization-status-request-v1";
export const AUTH_SCHEMA = "operator-runtime-authorization-v1";
export const DISPATCH_RESULT_SCHEMA = "opencode-execution-dispatch-result-v1";
export const REQUIRED_ROUTE_ID = "opencode+qwen_local";
export const REQUIRED_IMPLEMENTER = "opencode";
export const REQUIRED_MODEL = "qwen_local";
export const PENDING_TTL_SECONDS = 900;
export const STATUS_POLL_MAX = 300;
export const ID_MAX = 200;

/** Exact fixed scope v2 — key order is part of the canonical digest. */
export const FIXED_AUTHORIZATION_SCOPE = FIXED_AUTHORIZATION_SCOPE_V2;

export const CANONICAL_SCOPE_DIGEST = CANONICAL_SCOPE_DIGEST_V2;

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function sha256Hex(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex");
}

export function compactScopeJson(scope = FIXED_AUTHORIZATION_SCOPE) {
  return compactScopeV2Json(scope);
}

export function canonicalScopeDigest(scope = FIXED_AUTHORIZATION_SCOPE) {
  return canonicalScopeDigestV2(scope);
}

export function buildExecutionId(taskId, packetId) {
  const task = typeof taskId === "string" ? taskId.trim() : "";
  const packet = typeof packetId === "string" ? packetId.trim() : "";
  if (!task || !packet) {
    return { ok: false, reason_codes: ["TASK_OR_PACKET_ID_MISSING"], execution_id: null };
  }
  const execution_id = `wf40:${task}:${packet}`;
  if (execution_id.length > ID_MAX) {
    return { ok: false, reason_codes: ["EXECUTION_ID_TOO_LONG"], execution_id: null };
  }
  return { ok: true, reason_codes: [], execution_id };
}

export function deriveAuthorizationIds(executionId) {
  if (typeof executionId !== "string" || !executionId.trim()) {
    return {
      ok: false,
      reason_codes: ["EXECUTION_ID_MISSING"],
      pending_decision_id: null,
      authorization_id: null,
      digest: null,
    };
  }
  const digest = sha256Hex(executionId.trim());
  const pending_decision_id = `PEND-WF40-${digest}`;
  const authorization_id = `AUTH-WF40-${digest}`;
  if (pending_decision_id.length > ID_MAX || authorization_id.length > ID_MAX) {
    return {
      ok: false,
      reason_codes: ["DERIVED_ID_TOO_LONG"],
      pending_decision_id: null,
      authorization_id: null,
      digest,
    };
  }
  return {
    ok: true,
    reason_codes: [],
    pending_decision_id,
    authorization_id,
    digest,
  };
}

export function buildRegisterPendingRequest({ task_id, packet_id }) {
  const exec = buildExecutionId(task_id, packet_id);
  if (!exec.ok) {
    return {
      ok: false,
      classification: "REGISTER_REQUEST_BUILD_FAILED",
      reason_codes: exec.reason_codes,
      request: null,
    };
  }
  const ids = deriveAuthorizationIds(exec.execution_id);
  if (!ids.ok) {
    return {
      ok: false,
      classification: "REGISTER_REQUEST_BUILD_FAILED",
      reason_codes: ids.reason_codes,
      request: null,
    };
  }
  const digest = canonicalScopeDigest();
  if (digest !== CANONICAL_SCOPE_DIGEST) {
    return {
      ok: false,
      classification: "REGISTER_REQUEST_BUILD_FAILED",
      reason_codes: ["SCOPE_DIGEST_MISMATCH"],
      request: null,
    };
  }
  const request = {
    schema_version: REGISTER_SCHEMA,
    pending_decision_id: ids.pending_decision_id,
    authorization_id: ids.authorization_id,
    task_id: String(task_id).trim(),
    execution_id: exec.execution_id,
    route_id: REQUIRED_ROUTE_ID,
    scope_digest: digest,
    pending_ttl_seconds: PENDING_TTL_SECONDS,
  };
  const keys = Object.keys(request).sort();
  const expected = [
    "authorization_id",
    "execution_id",
    "pending_decision_id",
    "pending_ttl_seconds",
    "route_id",
    "schema_version",
    "scope_digest",
    "task_id",
  ];
  if (keys.length !== 8 || keys.some((k, i) => k !== expected[i])) {
    return {
      ok: false,
      classification: "REGISTER_REQUEST_BUILD_FAILED",
      reason_codes: ["REGISTER_KEYSET_INVALID"],
      request: null,
    };
  }
  return {
    ok: true,
    classification: "REGISTER_REQUEST_READY",
    reason_codes: [],
    request,
    pending_decision_id: ids.pending_decision_id,
    authorization_id: ids.authorization_id,
    execution_id: exec.execution_id,
  };
}

export function buildStatusRequest(pendingDecisionId) {
  if (typeof pendingDecisionId !== "string" || !pendingDecisionId.trim()) {
    return {
      ok: false,
      classification: "STATUS_REQUEST_BUILD_FAILED",
      reason_codes: ["PENDING_DECISION_ID_MISSING"],
      request: null,
    };
  }
  const request = {
    schema_version: STATUS_SCHEMA,
    pending_decision_id: pendingDecisionId.trim(),
  };
  const keys = Object.keys(request).sort();
  if (keys.length !== 2 || keys[0] !== "pending_decision_id" || keys[1] !== "schema_version") {
    return {
      ok: false,
      classification: "STATUS_REQUEST_BUILD_FAILED",
      reason_codes: ["STATUS_KEYSET_INVALID"],
      request: null,
    };
  }
  return {
    ok: true,
    classification: "STATUS_REQUEST_READY",
    reason_codes: [],
    request,
  };
}

function extractRoute(executionRouteResult) {
  if (!isPlainObject(executionRouteResult)) return null;
  if (executionRouteResult.status !== "ROUTED") return null;
  const route = isPlainObject(executionRouteResult.execution_route)
    ? executionRouteResult.execution_route
    : null;
  if (!route) return null;
  const route_id =
    typeof route.route_id === "string"
      ? route.route_id
      : typeof executionRouteResult.route_id === "string"
        ? executionRouteResult.route_id
        : null;
  if (
    route_id !== REQUIRED_ROUTE_ID ||
    route.implementer !== REQUIRED_IMPLEMENTER ||
    route.model !== REQUIRED_MODEL
  ) {
    return null;
  }
  return {
    route_id,
    implementer: route.implementer,
    model: route.model,
  };
}

function resourceAvailable(resourceStatus, key) {
  const resources = isPlainObject(resourceStatus?.resources)
    ? resourceStatus.resources
    : null;
  const entry = resources && isPlainObject(resources[key]) ? resources[key] : null;
  return entry?.available === true;
}

/**
 * Build structural DISPATCH_READY sidecar from post-WF61 evidence only.
 * Never probes runtime occupancy / OpenCode / Qwen.
 */
export async function buildDispatchReadySidecar({
  execution_packet,
  execution_route_result,
  resource_status,
  task_id,
}) {
  if (!isPlainObject(execution_packet)) {
    return {
      ok: false,
      classification: "PACKET_MISSING",
      reason_codes: ["PACKET_MISSING"],
      dispatch_result: null,
    };
  }
  const packetCheck = await validatePacketObject(execution_packet);
  if (!packetCheck.ok) {
    return {
      ok: false,
      classification: "PACKET_INVALID",
      reason_codes: ["PACKET_INVALID", packetCheck.classification],
      dispatch_result: null,
    };
  }
  const route = extractRoute(execution_route_result);
  if (!route) {
    const status = isPlainObject(execution_route_result)
      ? execution_route_result.status
      : null;
    return {
      ok: false,
      classification:
        status && status !== "ROUTED"
          ? "ROUTE_NOT_OPENCODE_QWEN_LOCAL"
          : "ROUTE_INVALID",
      reason_codes: [
        status && status !== "ROUTED"
          ? "ROUTE_NOT_OPENCODE_QWEN_LOCAL"
          : "ROUTE_INVALID",
      ],
      dispatch_result: null,
    };
  }
  if (!resourceAvailable(resource_status, "opencode")) {
    return {
      ok: false,
      classification: "OPENCODE_UNAVAILABLE",
      reason_codes: ["OPENCODE_UNAVAILABLE"],
      dispatch_result: null,
    };
  }
  if (!resourceAvailable(resource_status, "qwen_local")) {
    return {
      ok: false,
      classification: "QWEN_LOCAL_UNAVAILABLE",
      reason_codes: ["QWEN_LOCAL_UNAVAILABLE"],
      dispatch_result: null,
    };
  }

  const task =
    typeof task_id === "string" && task_id.trim()
      ? task_id.trim()
      : typeof execution_packet.task_id === "string"
        ? execution_packet.task_id
        : "";
  const packetId =
    typeof execution_packet.packet_id === "string"
      ? execution_packet.packet_id
      : "";
  const exec = buildExecutionId(task, packetId);
  const dispatch_id = exec.ok
    ? `disp:${exec.execution_id}`
    : `disp:${packetId || "unknown"}`;

  const dispatch_result = {
    schema_version: DISPATCH_RESULT_SCHEMA,
    dispatch_id,
    status: "READY",
    route_id: route.route_id,
    implementer: route.implementer,
    model: route.model,
    qwen_session_status: "READY_ASSERTED_BY_RESOURCE_STATUS",
    opencode_available: true,
    dispatch_ready: true,
    execution_performed: false,
    classification: "DISPATCH_READY",
    reason_codes: ["DISPATCH_READY", "RESOURCE_STATUS_AVAILABLE"],
    dispatch_spec: {
      schema_version: "opencode-dispatch-spec-v1",
      route_id: route.route_id,
      implementer: route.implementer,
      model: route.model,
      source: "wf40-post-wf61-sidecar",
    },
  };

  return {
    ok: true,
    classification: "DISPATCH_READY",
    reason_codes: ["DISPATCH_READY"],
    dispatch_result,
  };
}

/**
 * Parse one WF40 authorization status poll step (mirrors n8n post-WF61 lane).
 * Transient HTTP/transport/parse failures remain in the bounded poll loop.
 */
export function parseAuthorizationStatusPoll({
  waited = {},
  http_raw = null,
  poll_max = STATUS_POLL_MAX,
  now_ms = Date.now(),
}) {
  const poll = Number(waited.poll_count || 0) + 1;
  const pendingId = waited.pending_decision_id ?? null;
  const authId = waited.authorization_id ?? null;
  const pendingExpiresAt = waited.pending_expires_at ?? null;
  const expiresMs = pendingExpiresAt ? Date.parse(pendingExpiresAt) : NaN;
  const ttlExpired = Number.isFinite(expiresMs) && expiresMs <= now_ms;
  const pollExhausted = poll >= poll_max;

  const base = {
    schema_version: "wf40-live-authorization-status-result-v1",
    poll_count: poll,
    pending_decision_id: pendingId,
    authorization_id: authId,
    execution_id: waited.execution_id ?? null,
    status_request: waited.status_request ?? null,
    dispatch_result: waited.dispatch_result ?? null,
    execution_performed: false,
    register_request: null,
  };

  const failClosed = (classification, reason_codes, extra = {}) => ({
    ...base,
    ok: false,
    classification,
    reason_codes,
    issued: false,
    still_pending: false,
    terminal: true,
    authorization_issued: false,
    status_result: extra.status_result ?? null,
    ...extra,
  });

  const carryPending = (classification, reason_codes, extra = {}) => ({
    ...base,
    ok: false,
    classification,
    reason_codes,
    issued: false,
    still_pending: true,
    terminal: false,
    authorization_issued: false,
    status_result: extra.status_result ?? null,
    ...extra,
  });

  let body = http_raw;
  if (http_raw && typeof http_raw === "object" && !Array.isArray(http_raw)) {
    if (http_raw.body && typeof http_raw.body === "object" && !Array.isArray(http_raw.body)) {
      body = http_raw.body;
    } else if (http_raw.error || http_raw.statusCode || http_raw.code) {
      body = null;
    }
  }

  const validObject =
    body && typeof body === "object" && !Array.isArray(body) ? body : null;

  if (
    validObject &&
    validObject.pending_decision_id &&
    validObject.pending_decision_id !== pendingId
  ) {
    return failClosed("PENDING_ID_MISMATCH", ["PENDING_ID_MISMATCH"], {
      state: validObject.state ?? null,
      status_result: validObject,
    });
  }
  if (
    validObject &&
    validObject.authorization_id &&
    validObject.authorization_id !== authId
  ) {
    return failClosed("AUTHORIZATION_ID_MISMATCH", ["AUTHORIZATION_ID_MISMATCH"], {
      state: validObject.state ?? null,
      status_result: validObject,
    });
  }

  if (!validObject || validObject.ok !== true) {
    if (pollExhausted || ttlExpired) {
      return failClosed("AUTHORIZATION_POLL_EXHAUSTED", [
        "AUTHORIZATION_POLL_EXHAUSTED",
        validObject ? "STATUS_NOT_OK" : "STATUS_TRANSIENT_UNAVAILABLE",
      ]);
    }
    return carryPending("AUTHORIZATION_STATUS_TRANSIENT", [
      "AUTHORIZATION_STATUS_TRANSIENT",
      validObject ? "STATUS_NOT_OK" : "STATUS_RESPONSE_UNAVAILABLE",
    ], {
      state: validObject?.state ?? null,
      status_result: validObject,
    });
  }

  const state = validObject.state ?? null;

  if (state === "REJECTED") {
    return failClosed("AUTHORIZATION_REJECTED", ["AUTHORIZATION_REJECTED"], {
      state,
      status_result: validObject,
    });
  }
  if (state === "EXPIRED") {
    return failClosed("AUTHORIZATION_EXPIRED", ["AUTHORIZATION_EXPIRED"], {
      state,
      status_result: validObject,
    });
  }

  if (
    state === "ISSUED" &&
    validObject.pending_decision_id === pendingId &&
    validObject.authorization_id === authId &&
    typeof validObject.authorization_expires_at === "string"
  ) {
    return {
      ...base,
      ok: true,
      classification: "AUTHORIZATION_ISSUED",
      reason_codes: ["AUTHORIZATION_ISSUED"],
      issued: true,
      still_pending: false,
      terminal: false,
      authorization_issued: true,
      state,
      authorization_expires_at: validObject.authorization_expires_at,
      status_result: validObject,
    };
  }

  if (state === "PENDING" && validObject.pending_decision_id === pendingId) {
    if (pollExhausted || ttlExpired) {
      return failClosed("AUTHORIZATION_POLL_EXHAUSTED", [
        "AUTHORIZATION_POLL_EXHAUSTED",
        "AUTHORIZATION_PENDING",
      ], {
        state,
        status_result: validObject,
      });
    }
    return carryPending("AUTHORIZATION_PENDING", ["AUTHORIZATION_PENDING"], {
      state,
      status_result: validObject,
    });
  }

  if (pollExhausted || ttlExpired) {
    return failClosed("AUTHORIZATION_POLL_EXHAUSTED", [
      "AUTHORIZATION_POLL_EXHAUSTED",
      "AUTHORIZATION_STATUS_INVALID",
    ], {
      state,
      status_result: validObject,
    });
  }

  return carryPending("AUTHORIZATION_STATUS_TRANSIENT", [
    "AUTHORIZATION_STATUS_TRANSIENT",
    "AUTHORIZATION_STATUS_INVALID",
  ], {
    state,
    status_result: validObject,
  });
}

/**
 * Build ACTIVE runtime authorization envelope only from server-attested ISSUED status.
 */
export function buildRuntimeAuthorizationFromStatus({
  status_result,
  expected_pending_decision_id,
  expected_authorization_id,
  nowMs = Date.now(),
}) {
  if (!isPlainObject(status_result)) {
    return {
      ok: false,
      classification: "STATUS_MISSING",
      reason_codes: ["STATUS_MISSING"],
      runtime_authorization: null,
    };
  }
  if (status_result.ok !== true) {
    return {
      ok: false,
      classification: "STATUS_NOT_OK",
      reason_codes: ["STATUS_NOT_OK"],
      runtime_authorization: null,
    };
  }
  if (status_result.pending_decision_id !== expected_pending_decision_id) {
    return {
      ok: false,
      classification: "PENDING_ID_MISMATCH",
      reason_codes: ["PENDING_ID_MISMATCH"],
      runtime_authorization: null,
    };
  }
  if (status_result.authorization_id !== expected_authorization_id) {
    return {
      ok: false,
      classification: "AUTHORIZATION_ID_MISMATCH",
      reason_codes: ["AUTHORIZATION_ID_MISMATCH"],
      runtime_authorization: null,
    };
  }
  const state = status_result.state;
  if (state === "PENDING") {
    return {
      ok: false,
      classification: "AUTHORIZATION_PENDING",
      reason_codes: ["AUTHORIZATION_PENDING"],
      runtime_authorization: null,
    };
  }
  if (state === "REJECTED") {
    return {
      ok: false,
      classification: "AUTHORIZATION_REJECTED",
      reason_codes: ["AUTHORIZATION_REJECTED"],
      runtime_authorization: null,
    };
  }
  if (state === "EXPIRED") {
    return {
      ok: false,
      classification: "AUTHORIZATION_EXPIRED",
      reason_codes: ["AUTHORIZATION_EXPIRED"],
      runtime_authorization: null,
    };
  }
  if (state !== "ISSUED") {
    return {
      ok: false,
      classification: "AUTHORIZATION_NOT_ISSUED",
      reason_codes: ["AUTHORIZATION_NOT_ISSUED", `STATE:${String(state)}`],
      runtime_authorization: null,
    };
  }
  const expiresAt = Date.parse(status_result.authorization_expires_at);
  if (!Number.isFinite(expiresAt)) {
    return {
      ok: false,
      classification: "AUTHORIZATION_EXPIRES_INVALID",
      reason_codes: ["AUTHORIZATION_EXPIRES_INVALID"],
      runtime_authorization: null,
    };
  }
  if (expiresAt <= nowMs) {
    return {
      ok: false,
      classification: "AUTHORIZATION_EXPIRES_PAST",
      reason_codes: ["AUTHORIZATION_EXPIRES_PAST"],
      runtime_authorization: null,
    };
  }

  const runtime_authorization = {
    schema_version: AUTH_SCHEMA,
    authorization_id: expected_authorization_id,
    authorization_state: "ACTIVE",
    route_id: REQUIRED_ROUTE_ID,
    scope: { ...FIXED_AUTHORIZATION_SCOPE },
  };

  return {
    ok: true,
    classification: "RUNTIME_AUTHORIZATION_ACTIVE",
    reason_codes: ["RUNTIME_AUTHORIZATION_ACTIVE"],
    runtime_authorization,
  };
}

/**
 * High-level proposal bundle used by WF40 after routing is ready.
 */
export async function buildLiveExecutionProposal({
  task_id,
  execution_packet,
  execution_route_result,
  resource_status,
}) {
  const packetId =
    isPlainObject(execution_packet) && typeof execution_packet.packet_id === "string"
      ? execution_packet.packet_id
      : null;
  const task =
    typeof task_id === "string" && task_id.trim()
      ? task_id.trim()
      : isPlainObject(execution_packet) && typeof execution_packet.task_id === "string"
        ? execution_packet.task_id
        : null;

  const register = buildRegisterPendingRequest({
    task_id: task,
    packet_id: packetId,
  });
  if (!register.ok) {
    return {
      ok: false,
      classification: register.classification,
      reason_codes: register.reason_codes,
      proposal_ready: false,
      register_request: null,
      status_request: null,
      pending_decision_id: null,
      authorization_id: null,
      execution_id: null,
      dispatch_result: null,
    };
  }

  const dispatch = await buildDispatchReadySidecar({
    execution_packet,
    execution_route_result,
    resource_status,
    task_id: task,
  });
  if (!dispatch.ok) {
    return {
      ok: false,
      classification: dispatch.classification,
      reason_codes: dispatch.reason_codes,
      proposal_ready: false,
      register_request: register.request,
      status_request: buildStatusRequest(register.pending_decision_id).request,
      pending_decision_id: register.pending_decision_id,
      authorization_id: register.authorization_id,
      execution_id: register.execution_id,
      dispatch_result: null,
    };
  }

  const status = buildStatusRequest(register.pending_decision_id);
  return {
    ok: true,
    classification: "LIVE_PROPOSAL_READY",
    reason_codes: ["LIVE_PROPOSAL_READY"],
    proposal_ready: true,
    register_request: register.request,
    status_request: status.request,
    pending_decision_id: register.pending_decision_id,
    authorization_id: register.authorization_id,
    execution_id: register.execution_id,
    dispatch_result: dispatch.dispatch_result,
  };
}

function decodeInputB64(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, value: null, reason_codes: ["INPUT_B64_MISSING"] };
  }
  try {
    const text = Buffer.from(raw.trim(), "base64").toString("utf8");
    const value = JSON.parse(text);
    return { ok: true, value, reason_codes: [] };
  } catch {
    return { ok: false, value: null, reason_codes: ["INPUT_B64_INVALID"] };
  }
}

async function runCli(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length - 1; i += 2) {
    args.set(argv[i], argv[i + 1]);
  }
  const mode = args.get("--mode") || "proposal";
  const decoded = decodeInputB64(args.get("--input-b64"));
  if (!decoded.ok) {
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        classification: "INPUT_INVALID",
        reason_codes: decoded.reason_codes,
      })}\n`,
    );
    return;
  }
  if (mode === "proposal") {
    const out = await buildLiveExecutionProposal(decoded.value);
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }
  if (mode === "issued-sidecars") {
    const input = decoded.value || {};
    const auth = buildRuntimeAuthorizationFromStatus({
      status_result: input.status_result,
      expected_pending_decision_id: input.expected_pending_decision_id,
      expected_authorization_id: input.expected_authorization_id,
      nowMs: typeof input.nowMs === "number" ? input.nowMs : Date.now(),
    });
    const dispatch = input.dispatch_result;
    const ready = Boolean(
      auth.ok === true &&
        auth.runtime_authorization &&
        dispatch &&
        typeof dispatch === "object" &&
        dispatch.classification === "DISPATCH_READY" &&
        dispatch.dispatch_ready === true &&
        dispatch.execution_performed === false,
    );
    process.stdout.write(
      `${JSON.stringify({
        ok: ready,
        classification: ready
          ? "ISSUED_SIDECARS_READY"
          : auth.classification || "ISSUED_SIDECARS_NOT_READY",
        reason_codes: ready
          ? ["ISSUED_SIDECARS_READY"]
          : auth.reason_codes || ["ISSUED_SIDECARS_NOT_READY"],
        runtime_authorization: auth.runtime_authorization,
        dispatch_result: ready ? dispatch : null,
        pending_decision_id: input.expected_pending_decision_id ?? null,
        authorization_id: input.expected_authorization_id ?? null,
      })}\n`,
    );
    return;
  }
  process.stdout.write(
    `${JSON.stringify({
      ok: false,
      classification: "MODE_INVALID",
      reason_codes: ["MODE_INVALID"],
    })}\n`,
  );
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith(
    "build-v4-wf40-live-execution-sidecars-v1.mjs",
  );

if (isMain) {
  runCli(process.argv).catch((err) => {
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        classification: "HELPER_ERROR",
        reason_codes: ["HELPER_ERROR", String(err && err.message ? err.message : err)],
      })}\n`,
    );
  });
}
