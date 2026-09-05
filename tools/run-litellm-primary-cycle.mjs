#!/usr/bin/env node
/**
 * D-0025-W — LiteLLM primary remote cycle runner (prepare | finalize).
 *
 * Contract: docs/contracts/litellm-primary-cycle-runner-v1.md
 * Zero HTTP/provider calls. Fail-closed.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluatePlannerSelection } from "./evaluate-planner-selection.mjs";
import { buildGatewayRequest } from "./build-llm-gateway-request.mjs";
import { normalizeResponsesBody } from "./normalize-litellm-responses-body.mjs";
import { evaluate as evaluateResponseGate } from "./validate-openclaw-planner-response-gate.mjs";
import { evaluatePacketPolicy } from "./evaluate-execution-packet-policy.mjs";
import {
  buildPacketCensus,
  completePrimaryRemotePacketSourceFields,
} from "./complete-primary-remote-packet-source-fields.mjs";
import { composeCanonicalQuotaState } from "./rt25-canonical-quota-state-v1.mjs";

export const PREPARED_SCHEMA = "litellm-primary-cycle-prepared-v1";
export const FINAL_SCHEMA = "litellm-primary-cycle-final-v1";
const REQUIRED_FUNCTION = "emit_execution_packet";

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function hasSecretLeak(blob) {
  return (
    /bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob) ||
    /"authorization"\s*:\s*"/i.test(blob) ||
    /"password"\s*:\s*"/i.test(blob) ||
    /"api[_-]?key"\s*:\s*"/i.test(blob) ||
    /"access_token"\s*:\s*"/i.test(blob) ||
    /"refresh_token"\s*:\s*"/i.test(blob) ||
    /sk-[A-Za-z0-9]{10,}/.test(blob)
  );
}

function decodeB64Json(label, b64) {
  if (typeof b64 !== "string" || b64.trim().length === 0) {
    return {
      ok: false,
      classification: "INPUT_INVALID",
      reason: `${label} base64 is required`,
    };
  }
  try {
    const text = Buffer.from(b64, "base64").toString("utf8");
    const value = JSON.parse(text.replace(/^\uFEFF/, ""));
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return {
        ok: false,
        classification: "INPUT_INVALID",
        reason: `${label} must decode to a JSON object`,
      };
    }
    return { ok: true, value };
  } catch (err) {
    return {
      ok: false,
      classification: "INPUT_INVALID",
      reason: `${label} base64 decode/parse failed: ${String(err.message || err)}`,
    };
  }
}

function decodeRawB64(label, b64) {
  if (typeof b64 !== "string" || b64.trim().length === 0) {
    return {
      ok: false,
      classification: "INPUT_INVALID",
      reason: `${label} base64 is required`,
    };
  }
  try {
    return { ok: true, value: Buffer.from(b64, "base64").toString("utf8") };
  } catch (err) {
    return {
      ok: false,
      classification: "INPUT_INVALID",
      reason: `${label} base64 decode failed: ${String(err.message || err)}`,
    };
  }
}

function failPrepare(classification, reason, extra = {}) {
  return {
    schema: PREPARED_SCHEMA,
    ok: false,
    classification,
    reason,
    task_id: extra.task_id ?? null,
    selected_planner: null,
    request_envelope: null,
    consumer_b64: extra.consumer_b64 ?? null,
    ...extra,
  };
}

function failFinalize(classification, reason, extra = {}) {
  return {
    schema: FINAL_SCHEMA,
    ok: false,
    classification,
    reason,
    task_id: extra.task_id ?? null,
    response_source_format: extra.response_source_format ?? null,
    response_gate: extra.response_gate ?? null,
    packet: null,
    policy: {
      decision: "BLOCKED",
      cursor_dispatch_allowed: false,
    },
    packet_census_before_completion: extra.packet_census_before_completion ?? null,
    deterministic_completion: extra.deterministic_completion ?? null,
    ...extra,
  };
}

function enforceD0025Policy(consumerInput, routingInput) {
  if (routingInput.schema !== "planner-routing-input-v1") {
    return {
      ok: false,
      classification: "ROUTING_SCHEMA_INVALID",
      reason: "routing_input.schema must be planner-routing-input-v1",
    };
  }
  if (
    !consumerInput.task_id ||
    !routingInput.task_id ||
    consumerInput.task_id !== routingInput.task_id
  ) {
    return {
      ok: false,
      classification: "TASK_ID_MISMATCH",
      reason: "consumer_input.task_id must match routing_input.task_id",
    };
  }
  if (!["glm", "codex"].includes(routingInput.preferred)) {
    return {
      ok: false,
      classification: "REMOTE_PLANNER_ONLY",
      reason: "preferred planner must be glm or codex",
    };
  }
  if (consumerInput.planner_requested !== routingInput.preferred) {
    return {
      ok: false,
      classification: "PLANNER_REQUEST_MISMATCH",
      reason: "consumer_input.planner_requested must equal routing_input.preferred",
    };
  }
  if (!Array.isArray(routingInput.fallback) || routingInput.fallback.length !== 0) {
    return {
      ok: false,
      classification: "PLANNER_FALLBACK_FORBIDDEN",
      reason: "routing_input.fallback must be []",
    };
  }
  if (routingInput.fallback_policy !== "gate_only") {
    return {
      ok: false,
      classification: "FALLBACK_POLICY_MUST_BE_GATE_ONLY",
      reason: "routing_input.fallback_policy must be gate_only",
    };
  }
  if (
    routingInput.preferred === "qwen" ||
    consumerInput.planner_requested === "qwen" ||
    routingInput.fallback.includes("qwen")
  ) {
    return {
      ok: false,
      classification: "QWEN_DEFERRED",
      reason: "Qwen is deferred on the primary remote path",
    };
  }
  return { ok: true };
}

function collectFunctionCalls(output) {
  if (!Array.isArray(output)) return [];
  return output.filter(
    (item) => item && typeof item === "object" && item.type === "function_call",
  );
}

function parseArguments(raw) {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return { ok: true, value: raw };
  }
  if (typeof raw !== "string") {
    return {
      ok: false,
      reason: "function_call.arguments must be a JSON string or object",
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, reason: "function_call.arguments JSON must decode to an object" };
    }
    return { ok: true, value: parsed };
  } catch (err) {
    return { ok: false, reason: String(err.message || err) };
  }
}

function extractPacketFromResponse(response) {
  const calls = collectFunctionCalls(response.output);
  if (calls.length !== 1) {
    return {
      ok: false,
      classification: "FUNCTION_CALL_COUNT",
      reason: `Expected exactly one function_call, found ${calls.length}`,
    };
  }
  const call = calls[0];
  if (call.name !== REQUIRED_FUNCTION) {
    return {
      ok: false,
      classification: "FUNCTION_CALL_NAME",
      reason: `Expected function name ${REQUIRED_FUNCTION}`,
    };
  }
  const parsed = parseArguments(call.arguments);
  if (!parsed.ok) {
    return {
      ok: false,
      classification: "ARGUMENTS_JSON_PARSE",
      reason: parsed.reason,
    };
  }
  return { ok: true, packet: parsed.value };
}

export async function prepareCycle({ consumerInput, routingInput, gatewayProfile, quotaStateOptions }) {
  const consumerB64 = Buffer.from(JSON.stringify(consumerInput), "utf8").toString("base64");
  const policy = enforceD0025Policy(consumerInput, routingInput);
  if (!policy.ok) {
    return failPrepare(policy.classification, policy.reason, {
      task_id: consumerInput.task_id ?? routingInput.task_id ?? null,
      consumer_b64: consumerB64,
    });
  }

  // V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION — canonical upstream composition
  // point: when the caller supplies quotaStateOptions (or asks for the default
  // canonical composition), the REAL quota-pool joined state is composed from
  // the real registry/baseline/ingest lane and handed to the canonical planner
  // evaluator. Fail-closed: requested-but-failed composition BLOCKS prepare
  // (never silently degrades to UNKNOWN). Absent options → legacy behavior.
  let quotaStateComposer = { requested: false, quotaState: null, source: null };
  if (quotaStateOptions && typeof quotaStateOptions === "object") {
    const canonical = await composeCanonicalQuotaState(quotaStateOptions);
    if (canonical.ok !== true || !canonical.joined) {
      return failPrepare("QUOTA_STATE_COMPOSITION_FAILED", "canonical quota-state composition failed (fail-closed)", {
        task_id: consumerInput.task_id,
        consumer_b64: consumerB64,
        quota_state_reason_codes: canonical.reason_codes,
      });
    }
    quotaStateComposer = { requested: true, quotaState: canonical.joined, source: canonical };
  }

  const selection = await evaluatePlannerSelection(routingInput, {
    ...(quotaStateComposer.quotaState ? { quotaState: quotaStateComposer.quotaState } : {}),
  });
  if (selection.policy_result !== "PROCEED") {
    return failPrepare("PLANNER_SELECTION_NOT_PROCEED", "planner selection did not PROCEED", {
      task_id: consumerInput.task_id,
      consumer_b64: consumerB64,
      planner_selection: selection,
    });
  }
  if (selection.fallback_used !== false) {
    return failPrepare("PLANNER_FALLBACK_FORBIDDEN", "planner selection fallback_used must be false", {
      task_id: consumerInput.task_id,
      consumer_b64: consumerB64,
    });
  }
  if (!["glm", "codex"].includes(selection.selected)) {
    return failPrepare("REMOTE_PLANNER_ONLY", "selected planner must be glm or codex", {
      task_id: consumerInput.task_id,
      consumer_b64: consumerB64,
    });
  }

  const built = await buildGatewayRequest(consumerInput, selection, gatewayProfile);
  if (
    built.classification !== "PASS" ||
    built.request_ready !== true ||
    !built.request_envelope
  ) {
    return failPrepare(built.classification || "BUILD_FAILED", built.reason || "build failed", {
      task_id: consumerInput.task_id,
      consumer_b64: consumerB64,
      selected_planner: selection.selected,
    });
  }

  const envelope = built.request_envelope;
  if (envelope.path !== "/v1/responses") {
    return failPrepare("REQUEST_SHAPE_INVALID", "request_envelope.path must be /v1/responses", {
      task_id: consumerInput.task_id,
      consumer_b64: consumerB64,
    });
  }
  if (envelope.body?.stream !== false) {
    return failPrepare("REQUEST_SHAPE_INVALID", "request_envelope.body.stream must be false", {
      task_id: consumerInput.task_id,
      consumer_b64: consumerB64,
    });
  }

  const serialized = JSON.stringify(built);
  if (hasSecretLeak(serialized)) {
    return failPrepare("SECRET_BOUNDARY", "Prepared output would leak secret-shaped data", {
      task_id: consumerInput.task_id,
      consumer_b64: consumerB64,
    });
  }

  return {
    schema: PREPARED_SCHEMA,
    ok: true,
    classification: "PASS",
    task_id: consumerInput.task_id,
    selected_planner: selection.selected,
    request_envelope: envelope,
    consumer_b64: consumerB64,
    // V4_RT25 canonical quota provenance (authorization-neutral metadata).
    ...(quotaStateComposer.requested
      ? {
          quota_state_consumed: true,
          quota_pool_reason_codes: selection.quota_pool_reason_codes || [],
          quota_pool_refinements: selection.quota_pool_refinements || {},
        }
      : { quota_state_consumed: false }),
  };
}

function rewriteFunctionCallArguments(response, packetObject) {
  const cloned = structuredClone(response);
  const calls = collectFunctionCalls(cloned.output);
  if (calls.length !== 1 || calls[0].name !== REQUIRED_FUNCTION) {
    return {
      ok: false,
      reason: "Cannot rewrite emit_execution_packet arguments on cloned response",
    };
  }
  // Locate the same call inside cloned.output and rewrite arguments only.
  for (let i = 0; i < cloned.output.length; i++) {
    const item = cloned.output[i];
    if (item && typeof item === "object" && item.type === "function_call" && item.name === REQUIRED_FUNCTION) {
      cloned.output[i] = {
        ...item,
        arguments: JSON.stringify(packetObject),
      };
      return { ok: true, response: cloned };
    }
  }
  return { ok: false, reason: "emit_execution_packet call not found in cloned output" };
}

export async function finalizeCycle({ consumerInput, rawResponseText, responseSourceFormat }) {
  const consumerB64 = Buffer.from(JSON.stringify(consumerInput), "utf8").toString("base64");
  let response;
  let sourceFormat = responseSourceFormat ?? null;

  if (sourceFormat === "json") {
    try {
      response = JSON.parse(String(rawResponseText).replace(/^\uFEFF/, "").trim());
    } catch (err) {
      return failFinalize("RESPONSE_JSON_PARSE", String(err.message || err), {
        task_id: consumerInput.task_id,
      });
    }
  } else {
    const normalized = normalizeResponsesBody(rawResponseText);
    if (!normalized.ok || !normalized.response) {
      return failFinalize(
        normalized.classification || "RESPONSE_NORMALIZE_FAILED",
        normalized.reason || "response normalization failed",
        {
          task_id: consumerInput.task_id,
          response_source_format: normalized.source_format ?? null,
        },
      );
    }
    response = normalized.response;
    sourceFormat = normalized.source_format;
  }

  // Locate + parse emit_execution_packet before completion / canonical gates.
  const extracted = extractPacketFromResponse(response);
  if (!extracted.ok) {
    return failFinalize(extracted.classification, extracted.reason, {
      task_id: consumerInput.task_id,
      response_source_format: sourceFormat,
    });
  }

  const packetCensus = buildPacketCensus(extracted.packet);
  const completion = completePrimaryRemotePacketSourceFields(
    extracted.packet,
    consumerInput,
  );
  if (!completion.ok) {
    return failFinalize(completion.classification, completion.reason, {
      task_id: consumerInput.task_id,
      response_source_format: sourceFormat,
      packet_census_before_completion: packetCensus,
      deterministic_completion: {
        applied: false,
        completed_fields: [],
      },
      field: completion.field ?? null,
    });
  }

  const rewritten = rewriteFunctionCallArguments(response, completion.packet);
  if (!rewritten.ok) {
    return failFinalize("RESPONSE_REWRITE_FAILED", rewritten.reason, {
      task_id: consumerInput.task_id,
      response_source_format: sourceFormat,
      packet_census_before_completion: packetCensus,
      deterministic_completion: completion.deterministic_completion,
    });
  }

  const gate = await evaluateResponseGate(rewritten.response, consumerInput);
  if (!gate.ok) {
    return failFinalize(gate.classification || "RESPONSE_GATE_FAIL", gate.reason || "response gate failed", {
      task_id: consumerInput.task_id,
      response_source_format: sourceFormat,
      response_gate: gate.classification,
      packet_census_before_completion: packetCensus,
      deterministic_completion: completion.deterministic_completion,
    });
  }

  const completedExtracted = extractPacketFromResponse(rewritten.response);
  if (!completedExtracted.ok) {
    return failFinalize(completedExtracted.classification, completedExtracted.reason, {
      task_id: consumerInput.task_id,
      response_source_format: sourceFormat,
      response_gate: "PASS",
      packet_census_before_completion: packetCensus,
      deterministic_completion: completion.deterministic_completion,
    });
  }

  const policy = await evaluatePacketPolicy(completedExtracted.packet);
  const result = {
    schema: FINAL_SCHEMA,
    ok: true,
    classification: "PASS",
    task_id: consumerInput.task_id,
    response_source_format: sourceFormat,
    response_gate: "PASS",
    packet: completedExtracted.packet,
    policy: {
      decision: policy.decision,
      cursor_dispatch_allowed: false,
      human_gate_required: policy.human_gate_required ?? false,
      reason_codes: policy.reason_codes ?? [],
    },
    packet_census_before_completion: packetCensus,
    deterministic_completion: completion.deterministic_completion,
  };

  if (hasSecretLeak(JSON.stringify(result))) {
    return failFinalize("SECRET_BOUNDARY", "Finalized output would leak secret-shaped data", {
      task_id: consumerInput.task_id,
      response_source_format: sourceFormat,
      packet_census_before_completion: packetCensus,
      deterministic_completion: completion.deterministic_completion,
    });
  }

  return result;
}

function parseFlags(argv, startIndex) {
  const flags = {};
  for (let i = startIndex; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    }
  }
  return flags;
}

async function main() {
  const mode = process.argv[2];
  const flags = parseFlags(process.argv, 3);

  if (mode === "prepare") {
    const consumerDecoded = decodeB64Json("consumer_input", flags["consumer-b64"]);
    if (!consumerDecoded.ok) {
      emit(failPrepare(consumerDecoded.classification, consumerDecoded.reason), 1);
    }
    const routingDecoded = decodeB64Json("routing_input", flags["routing-b64"]);
    if (!routingDecoded.ok) {
      emit(
        failPrepare(routingDecoded.classification, routingDecoded.reason, {
          task_id: consumerDecoded.value.task_id ?? null,
        }),
        1,
      );
    }
    const profilePath = flags.profile;
    if (!profilePath || typeof profilePath !== "string") {
      emit(failPrepare("USAGE_ERROR", "--profile is required"), 1);
    }
    const absProfile = resolve(process.cwd(), profilePath);
    if (!existsSync(absProfile)) {
      emit(failPrepare("PROFILE_NOT_FOUND", `Profile not found: ${absProfile}`), 1);
    }
    let gatewayProfile;
    try {
      gatewayProfile = JSON.parse(readFileSync(absProfile, "utf8").replace(/^\uFEFF/, ""));
    } catch (err) {
      emit(failPrepare("PROFILE_INVALID", String(err.message || err)), 1);
    }

    // V4_RT25 canonical quota-state composition options (optional JSON).
    let quotaStateOptions;
    if (flags["quota-state-options-b64"]) {
      const decoded = decodeB64Json("quota_state_options", flags["quota-state-options-b64"]);
      if (!decoded.ok) {
        emit(
          failPrepare(decoded.classification, decoded.reason, {
            task_id: consumerDecoded.value.task_id ?? null,
          }),
          1,
        );
      }
      quotaStateOptions = decoded.value;
    }

    const result = await prepareCycle({
      consumerInput: consumerDecoded.value,
      routingInput: routingDecoded.value,
      gatewayProfile,
      ...(quotaStateOptions ? { quotaStateOptions } : {}),
    });
    emit(result, result.ok ? 0 : 1);
  }

  if (mode === "finalize") {
    const consumerDecoded = decodeB64Json("consumer_input", flags["consumer-b64"]);
    if (!consumerDecoded.ok) {
      emit(failFinalize(consumerDecoded.classification, consumerDecoded.reason), 1);
    }
    const responseDecoded = decodeRawB64("response_body", flags["response-b64"]);
    if (!responseDecoded.ok) {
      emit(
        failFinalize(responseDecoded.classification, responseDecoded.reason, {
          task_id: consumerDecoded.value.task_id ?? null,
        }),
        1,
      );
    }

    const result = await finalizeCycle({
      consumerInput: consumerDecoded.value,
      rawResponseText: responseDecoded.value,
    });
    emit(result, result.ok ? 0 : 1);
  }

  emit(failPrepare("USAGE_ERROR", "Usage: prepare|finalize with contract flags"), 1);
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    emit(
      failPrepare("RUNNER_INTERNAL_ERROR", String(err && err.stack ? err.stack : err)),
      1,
    );
  });
}
