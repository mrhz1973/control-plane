#!/usr/bin/env node
/**
 * D-0023-W — Deterministic LLM gateway portability adapter.
 *
 * Applies docs/contracts/llm-gateway-portability-v1.md verbatim.
 * Builds a non-secret /v1/responses envelope for LiteLLM (explicit alias)
 * or fail-closes OpenClaw legacy unverified binding.
 *
 * Usage:
 *   node tools/build-llm-gateway-request.mjs <consumer_input.json> <planner_selection.json> <gateway_profile.json>
 *
 * Exit: PASS -> 0; otherwise non-zero.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveAjvModules, ROOT } from "./validate-execution-packet-v1.mjs";
import {
  PLANNER_INSTRUCTIONS,
  TOOL_DESCRIPTION,
  EXECUTION_PACKET_SCHEMA_PATH,
  CONSUMER_INPUT_SCHEMA_PATH,
} from "./build-openclaw-responses-request.mjs";

export const PROFILE_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/llm-gateway-profile-v1.schema.json",
);
export const RESULT_SCHEMA = "llm-gateway-adapter-result-v1";

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function baseResult(extra = {}) {
  return {
    schema: RESULT_SCHEMA,
    task_id: null,
    gateway_kind: null,
    selected_planner: null,
    planner_binding_verified: false,
    request_ready: false,
    classification: "BUILD_FAILED",
    request_envelope: null,
    ...extra,
  };
}

function exitCodeFor(classification) {
  return classification === "PASS" ? 0 : 1;
}

function structuredCloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(abs) {
  return JSON.parse(readFileSync(abs, "utf8").replace(/^\uFEFF/, ""));
}

function hasSecretLeak(blob) {
  if (/bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob)) return true;
  if (/"authorization"\s*:\s*"/i.test(blob)) return true;
  if (/"password"\s*:\s*"/i.test(blob)) return true;
  if (/"api[_-]?key"\s*:\s*"/i.test(blob)) return true;
  if (/"access_token"\s*:\s*"/i.test(blob)) return true;
  if (/"refresh_token"\s*:\s*"/i.test(blob)) return true;
  return false;
}

let cachedConsumerValidate = null;
let cachedProfileValidate = null;

async function compileSchema(schemaPath) {
  const schema = JSON.parse(
    readFileSync(schemaPath, "utf8").replace(/^\uFEFF/, ""),
  );
  const { ajv2020Path, formatsPath } = resolveAjvModules();
  const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
    import(pathToFileURL(ajv2020Path).href),
    import(pathToFileURL(formatsPath).href),
  ]);
  const addFormats = formatsMod.default || formatsMod;
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictTypes: false,
    validateFormats: true,
  });
  addFormats(ajv);
  return ajv.compile(schema);
}

async function loadConsumerValidate() {
  if (!cachedConsumerValidate) {
    cachedConsumerValidate = await compileSchema(CONSUMER_INPUT_SCHEMA_PATH);
  }
  return cachedConsumerValidate;
}

async function loadProfileValidate() {
  if (!cachedProfileValidate) {
    cachedProfileValidate = await compileSchema(PROFILE_SCHEMA_PATH);
  }
  return cachedProfileValidate;
}

function buildEnvelope({ consumerInput, model, agentHeader, responsesPath }) {
  const packetSchema = JSON.parse(
    readFileSync(EXECUTION_PACKET_SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""),
  );
  const headers = {};
  if (agentHeader && typeof agentHeader === "object") {
    headers[agentHeader.name] = agentHeader.value;
  }
  return {
    method: "POST",
    path: responsesPath,
    headers,
    auth: {
      credential_required: true,
      scheme: "bearer",
      source: "existing_gateway_credential",
      authorization_value_included: false,
    },
    body: {
      model,
      stream: false,
      instructions: PLANNER_INSTRUCTIONS,
      input: structuredCloneJson(consumerInput),
      tools: [
        {
          type: "function",
          name: "emit_execution_packet",
          description: TOOL_DESCRIPTION,
          parameters: structuredCloneJson(packetSchema),
        },
      ],
      tool_choice: {
        type: "function",
        name: "emit_execution_packet",
      },
    },
  };
}

/**
 * Build gateway adapter result. Does not write stdout or exit.
 */
export async function buildGatewayRequest(
  consumerInput,
  plannerSelection,
  gatewayProfile,
) {
  const taskId =
    consumerInput && typeof consumerInput.task_id === "string"
      ? consumerInput.task_id
      : plannerSelection && typeof plannerSelection.task_id === "string"
        ? plannerSelection.task_id
        : null;

  try {
    const validateConsumer = await loadConsumerValidate();
    if (
      !consumerInput ||
      typeof consumerInput !== "object" ||
      Array.isArray(consumerInput) ||
      !validateConsumer(consumerInput)
    ) {
      return baseResult({
        task_id: taskId,
        classification: "INPUT_MISMATCH",
        reason: "consumer_input failed openclaw-consumer-input-v1 schema validation",
      });
    }

    if (
      !plannerSelection ||
      typeof plannerSelection !== "object" ||
      plannerSelection.schema !== "planner-selection-v1"
    ) {
      return baseResult({
        task_id: consumerInput.task_id,
        classification: "INPUT_MISMATCH",
        reason: "planner_selection.schema must be planner-selection-v1",
      });
    }

    if (consumerInput.task_id !== plannerSelection.task_id) {
      return baseResult({
        task_id: consumerInput.task_id,
        classification: "INPUT_MISMATCH",
        reason: "consumer_input.task_id does not match planner_selection.task_id",
      });
    }

    if (
      plannerSelection.policy_result !== "PROCEED" ||
      plannerSelection.selected == null
    ) {
      return baseResult({
        task_id: consumerInput.task_id,
        gateway_kind:
          gatewayProfile && gatewayProfile.gateway_kind
            ? gatewayProfile.gateway_kind
            : null,
        selected_planner: plannerSelection.selected ?? null,
        classification: "SELECTION_NOT_PROCEED",
        reason: `planner_selection.policy_result must be PROCEED with selected != null (got ${plannerSelection.policy_result}/${plannerSelection.selected})`,
      });
    }

    const selected = plannerSelection.selected;
    if (!["qwen", "glm", "codex"].includes(selected)) {
      return baseResult({
        task_id: consumerInput.task_id,
        selected_planner: selected,
        classification: "INPUT_MISMATCH",
        reason: "selected planner must be qwen|glm|codex",
      });
    }

    const validateProfile = await loadProfileValidate();
    if (
      !gatewayProfile ||
      typeof gatewayProfile !== "object" ||
      Array.isArray(gatewayProfile) ||
      !validateProfile(gatewayProfile)
    ) {
      return baseResult({
        task_id: consumerInput.task_id,
        selected_planner: selected,
        classification: "PROFILE_INVALID",
        reason: "gateway_profile failed llm-gateway-profile-v1 schema validation",
        schema_errors: Array.isArray(validateProfile.errors)
          ? validateProfile.errors.map((e) => ({
              keyword: e.keyword,
              instancePath: e.instancePath,
              message: e.message,
              params: e.params,
            }))
          : undefined,
      });
    }

    // Fail-closed: gateway_default_unverified never dispatch-ready.
    if (gatewayProfile.planner_binding_mode === "gateway_default_unverified") {
      return baseResult({
        task_id: consumerInput.task_id,
        gateway_kind: gatewayProfile.gateway_kind,
        selected_planner: selected,
        planner_binding_verified: false,
        request_ready: false,
        classification: "PLANNER_BINDING_UNVERIFIED",
        request_envelope: null,
        reason:
          "planner_binding_mode=gateway_default_unverified cannot machine-verify selected planner backend binding",
      });
    }

    // explicit_model_alias
    const alias =
      gatewayProfile.model_aliases && gatewayProfile.model_aliases[selected];
    if (typeof alias !== "string" || alias.length === 0) {
      return baseResult({
        task_id: consumerInput.task_id,
        gateway_kind: gatewayProfile.gateway_kind,
        selected_planner: selected,
        planner_binding_verified: false,
        request_ready: false,
        classification: "MODEL_ALIAS_MISSING",
        reason: `model alias missing/empty for selected planner ${selected}`,
      });
    }

    const envelope = buildEnvelope({
      consumerInput,
      model: alias,
      agentHeader: gatewayProfile.agent_header,
      responsesPath: gatewayProfile.responses_path,
    });

    if (gatewayProfile.gateway_kind === "litellm") {
      if (
        envelope.headers &&
        Object.prototype.hasOwnProperty.call(
          envelope.headers,
          "x-openclaw-agent-id",
        )
      ) {
        return baseResult({
          task_id: consumerInput.task_id,
          gateway_kind: "litellm",
          selected_planner: selected,
          classification: "BUILD_FAILED",
          reason: "LiteLLM envelope must not include x-openclaw-agent-id",
        });
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(envelope.body, "provider") ||
      Object.prototype.hasOwnProperty.call(envelope.body, "provider_override")
    ) {
      return baseResult({
        task_id: consumerInput.task_id,
        gateway_kind: gatewayProfile.gateway_kind,
        selected_planner: selected,
        classification: "BUILD_FAILED",
        reason: "provider override must be absent",
      });
    }

    const serialized = JSON.stringify(envelope);
    if (hasSecretLeak(serialized)) {
      return baseResult({
        task_id: consumerInput.task_id,
        gateway_kind: gatewayProfile.gateway_kind,
        selected_planner: selected,
        classification: "BUILD_FAILED",
        reason: "Secret-boundary violation in request envelope",
      });
    }

    return baseResult({
      task_id: consumerInput.task_id,
      gateway_kind: gatewayProfile.gateway_kind,
      selected_planner: selected,
      planner_binding_verified: true,
      request_ready: true,
      classification: "PASS",
      request_envelope: envelope,
      reason:
        "Deterministic Responses-compatible envelope built with verified planner model alias",
    });
  } catch (err) {
    return baseResult({
      task_id: taskId,
      classification: "BUILD_FAILED",
      reason: String(err && err.stack ? err.stack : err),
    });
  }
}

async function main() {
  const consumerPath = process.argv[2];
  const selectionPath = process.argv[3];
  const profilePath = process.argv[4];
  if (!consumerPath || !selectionPath || !profilePath) {
    emit(
      baseResult({
        classification: "BUILD_FAILED",
        reason:
          "Usage: node tools/build-llm-gateway-request.mjs <consumer_input.json> <planner_selection.json> <gateway_profile.json>",
      }),
      1,
    );
  }
  const absConsumer = resolve(process.cwd(), consumerPath);
  const absSelection = resolve(process.cwd(), selectionPath);
  const absProfile = resolve(process.cwd(), profilePath);
  for (const [label, abs] of [
    ["consumer_input", absConsumer],
    ["planner_selection", absSelection],
    ["gateway_profile", absProfile],
  ]) {
    if (!existsSync(abs)) {
      emit(
        baseResult({
          classification: "BUILD_FAILED",
          reason: `${label} file not found: ${abs}`,
        }),
        1,
      );
    }
  }

  let consumerInput;
  let plannerSelection;
  let gatewayProfile;
  try {
    consumerInput = readJson(absConsumer);
    plannerSelection = readJson(absSelection);
    gatewayProfile = readJson(absProfile);
  } catch (err) {
    emit(
      baseResult({
        classification: "BUILD_FAILED",
        reason: `JSON parse failed: ${String(err.message || err)}`,
      }),
      1,
    );
  }

  const result = await buildGatewayRequest(
    consumerInput,
    plannerSelection,
    gatewayProfile,
  );
  emit(
    {
      ...result,
      consumer_input_path: absConsumer,
      planner_selection_path: absSelection,
      gateway_profile_path: absProfile,
    },
    exitCodeFor(result.classification),
  );
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    emit(
      baseResult({
        classification: "BUILD_FAILED",
        reason: String(err && err.stack ? err.stack : err),
      }),
      1,
    );
  });
}
