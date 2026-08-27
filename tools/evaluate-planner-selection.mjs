#!/usr/bin/env node
/**
 * D-0022-W — Deterministic planner selection evaluator.
 *
 * Applies docs/contracts/planner-selection-evaluator-v1.md verbatim.
 * Validates against docs/contracts/planner-routing-input-v1.schema.json.
 * No provider/OpenClaw/network/credential/Cursor/Telegram access.
 *
 * Usage:
 *   node tools/evaluate-planner-selection.mjs <routing-input.json>
 *
 * Exit: PROCEED/GATE -> 0; BLOCKED/tooling error -> non-zero
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveAjvModules, ROOT } from "./validate-execution-packet-v1.mjs";

export const ROUTING_INPUT_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/planner-routing-input-v1.schema.json",
);
export const SELECTION_SCHEMA = "planner-selection-v1";

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function baseResult(extra = {}) {
  return {
    schema: SELECTION_SCHEMA,
    task_id: null,
    preferred: null,
    selected: null,
    fallback_used: false,
    fallback_reason: null,
    risk: null,
    complexity: null,
    policy_result: "BLOCKED",
    reason_codes: [],
    ...extra,
  };
}

function exitCodeFor(policyResult) {
  if (policyResult === "PROCEED" || policyResult === "GATE") return 0;
  return 1;
}

/**
 * Derive planner usability state per contract §2.
 * UNAVAILABLE checked before UNKNOWN when both could match.
 */
export function plannerState(name, providerState) {
  const st = providerState && providerState[name];
  if (!st || typeof st !== "object") return "UNKNOWN";

  if (name === "qwen") {
    if (st.available === false || st.resource_pressure === "high") {
      return "UNAVAILABLE";
    }
    if (st.available === "unknown" || st.resource_pressure === "unknown") {
      return "UNKNOWN";
    }
    if (
      st.available === true &&
      (st.resource_pressure === "low" || st.resource_pressure === "medium")
    ) {
      return "HEALTHY";
    }
    return "UNKNOWN";
  }

  // glm / codex
  if (st.available === false || st.quota_state === "exhausted") {
    return "UNAVAILABLE";
  }
  if (st.available === "unknown" || st.quota_state === "unknown") {
    return "UNKNOWN";
  }
  if (st.available === true && st.quota_state === "healthy") {
    return "HEALTHY";
  }
  if (st.available === true && st.quota_state === "conserve") {
    return "CONSERVE";
  }
  return "UNKNOWN";
}

function isRemote(name) {
  return name === "glm" || name === "codex";
}

let cachedValidate = null;

async function loadRoutingValidate() {
  if (cachedValidate) return cachedValidate;
  if (!existsSync(ROUTING_INPUT_SCHEMA_PATH)) {
    const err = new Error(
      `Routing input schema unavailable: ${ROUTING_INPUT_SCHEMA_PATH}`,
    );
    err.classification = "CONTRACT_SOURCE_UNAVAILABLE";
    throw err;
  }
  const schema = JSON.parse(
    readFileSync(ROUTING_INPUT_SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""),
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
    // GPT-Web schema uses contains under allOf/not without repeating type:array;
    // that is valid JSON Schema 2020-12, but Ajv strictTypes rejects it.
    strictTypes: false,
    validateFormats: true,
  });
  addFormats(ajv);
  cachedValidate = ajv.compile(schema);
  return cachedValidate;
}

/**
 * Evaluate planner-routing-input-v1 object.
 * Does not write stdout or exit.
 */
export async function evaluatePlannerSelection(input) {
  const taskId =
    input && typeof input === "object" && typeof input.task_id === "string"
      ? input.task_id
      : null;
  const preferred =
    input && typeof input === "object" && typeof input.preferred === "string"
      ? input.preferred
      : null;
  const risk =
    input && typeof input === "object" && typeof input.risk_hint === "string"
      ? input.risk_hint
      : null;
  const complexity =
    input &&
    typeof input === "object" &&
    typeof input.complexity_hint === "string"
      ? input.complexity_hint
      : null;

  let validate;
  try {
    validate = await loadRoutingValidate();
  } catch (err) {
    return baseResult({
      task_id: taskId,
      preferred,
      risk,
      complexity,
      policy_result: "BLOCKED",
      reason_codes: ["ROUTING_INPUT_INVALID"],
      reason: String(err.message || err),
    });
  }

  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !validate(input)
  ) {
    return baseResult({
      task_id: taskId,
      preferred,
      risk,
      complexity,
      policy_result: "BLOCKED",
      selected: null,
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["ROUTING_INPUT_INVALID"],
      schema_errors: Array.isArray(validate?.errors)
        ? validate.errors.map((e) => ({
            keyword: e.keyword,
            instancePath: e.instancePath,
            message: e.message,
            params: e.params,
          }))
        : undefined,
    });
  }

  const states = {
    qwen: plannerState("qwen", input.provider_state),
    glm: plannerState("glm", input.provider_state),
    codex: plannerState("codex", input.provider_state),
  };
  const prefState = states[input.preferred];
  const fallbackList = Array.isArray(input.fallback) ? input.fallback : [];
  const policy = input.fallback_policy;

  // B. Preferred HEALTHY
  if (prefState === "HEALTHY") {
    return baseResult({
      task_id: input.task_id,
      preferred: input.preferred,
      selected: input.preferred,
      fallback_used: false,
      fallback_reason: null,
      risk: input.risk_hint,
      complexity: input.complexity_hint,
      policy_result: "PROCEED",
      reason_codes: [],
      planner_states: states,
    });
  }

  // C. Preferred remote CONSERVE
  if (prefState === "CONSERVE" && isRemote(input.preferred)) {
    if (policy === "gate_only") {
      return baseResult({
        task_id: input.task_id,
        preferred: input.preferred,
        selected: input.preferred,
        fallback_used: false,
        fallback_reason: null,
        risk: input.risk_hint,
        complexity: input.complexity_hint,
        policy_result: "PROCEED",
        reason_codes: ["PREFERRED_CONSERVE_USED_GATE_ONLY"],
        planner_states: states,
      });
    }
    if (policy === "equivalent_or_gate") {
      return baseResult({
        task_id: input.task_id,
        preferred: input.preferred,
        selected: input.preferred,
        fallback_used: false,
        fallback_reason: null,
        risk: input.risk_hint,
        complexity: input.complexity_hint,
        policy_result: "PROCEED",
        reason_codes: ["PREFERRED_CONSERVE_USED_NO_EQUIVALENCE_FALLBACK"],
        planner_states: states,
      });
    }
    if (policy === "normal") {
      for (const fb of fallbackList) {
        if (states[fb] === "HEALTHY") {
          return baseResult({
            task_id: input.task_id,
            preferred: input.preferred,
            selected: fb,
            fallback_used: true,
            fallback_reason: "PREFERRED_QUOTA_CONSERVE",
            risk: input.risk_hint,
            complexity: input.complexity_hint,
            policy_result: "PROCEED",
            reason_codes: ["PREFERRED_QUOTA_CONSERVE"],
            planner_states: states,
          });
        }
      }
      return baseResult({
        task_id: input.task_id,
        preferred: input.preferred,
        selected: input.preferred,
        fallback_used: false,
        fallback_reason: null,
        risk: input.risk_hint,
        complexity: input.complexity_hint,
        policy_result: "PROCEED",
        reason_codes: ["PREFERRED_CONSERVE_NO_HEALTHY_FALLBACK"],
        planner_states: states,
      });
    }
  }

  // D. Preferred UNAVAILABLE or UNKNOWN
  if (prefState === "UNAVAILABLE" || prefState === "UNKNOWN") {
    const preferredReason =
      prefState === "UNAVAILABLE"
        ? "PREFERRED_UNAVAILABLE"
        : "PREFERRED_UNKNOWN";

    if (input.risk_hint === "high") {
      return baseResult({
        task_id: input.task_id,
        preferred: input.preferred,
        selected: null,
        fallback_used: false,
        fallback_reason: null,
        risk: input.risk_hint,
        complexity: input.complexity_hint,
        policy_result: "GATE",
        reason_codes: [
          prefState === "UNAVAILABLE"
            ? "HIGH_RISK_PREFERRED_UNAVAILABLE"
            : "HIGH_RISK_PREFERRED_UNKNOWN",
        ],
        planner_states: states,
      });
    }

    if (policy === "gate_only") {
      return baseResult({
        task_id: input.task_id,
        preferred: input.preferred,
        selected: null,
        fallback_used: false,
        fallback_reason: null,
        risk: input.risk_hint,
        complexity: input.complexity_hint,
        policy_result: "GATE",
        reason_codes: [
          prefState === "UNAVAILABLE"
            ? "PREFERRED_UNAVAILABLE_GATE_ONLY"
            : "PREFERRED_UNKNOWN_GATE_ONLY",
        ],
        planner_states: states,
      });
    }

    if (policy === "equivalent_or_gate") {
      return baseResult({
        task_id: input.task_id,
        preferred: input.preferred,
        selected: null,
        fallback_used: false,
        fallback_reason: null,
        risk: input.risk_hint,
        complexity: input.complexity_hint,
        policy_result: "GATE",
        reason_codes: ["EQUIVALENCE_ATTESTATION_UNAVAILABLE"],
        planner_states: states,
      });
    }

    if (
      policy === "normal" &&
      (input.risk_hint === "low" || input.risk_hint === "medium")
    ) {
      let selected = null;
      for (const fb of fallbackList) {
        if (states[fb] === "HEALTHY") {
          selected = fb;
          break;
        }
      }
      if (!selected) {
        for (const fb of fallbackList) {
          if (states[fb] === "CONSERVE" && isRemote(fb)) {
            selected = fb;
            break;
          }
        }
      }
      if (selected) {
        return baseResult({
          task_id: input.task_id,
          preferred: input.preferred,
          selected,
          fallback_used: true,
          fallback_reason: preferredReason,
          risk: input.risk_hint,
          complexity: input.complexity_hint,
          policy_result: "PROCEED",
          reason_codes: [preferredReason],
          planner_states: states,
        });
      }
      return baseResult({
        task_id: input.task_id,
        preferred: input.preferred,
        selected: null,
        fallback_used: false,
        fallback_reason: null,
        risk: input.risk_hint,
        complexity: input.complexity_hint,
        policy_result: "GATE",
        reason_codes: ["NO_USABLE_PLANNER"],
        planner_states: states,
      });
    }
  }

  // Fail closed if no branch matched (should not happen for schema-valid input).
  return baseResult({
    task_id: input.task_id,
    preferred: input.preferred,
    selected: null,
    fallback_used: false,
    fallback_reason: null,
    risk: input.risk_hint,
    complexity: input.complexity_hint,
    policy_result: "GATE",
    reason_codes: ["NO_USABLE_PLANNER"],
    planner_states: states,
  });
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    emit(
      baseResult({
        reason_codes: ["USAGE_ERROR"],
        reason:
          "Usage: node tools/evaluate-planner-selection.mjs <routing-input.json>",
      }),
      1,
    );
  }
  const abs = resolve(process.cwd(), inputPath);
  if (!existsSync(abs)) {
    emit(
      baseResult({
        reason_codes: ["ROUTING_INPUT_INVALID"],
        reason: `File not found: ${abs}`,
        path: abs,
      }),
      1,
    );
  }
  let input;
  try {
    input = JSON.parse(readFileSync(abs, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    emit(
      baseResult({
        reason_codes: ["ROUTING_INPUT_INVALID"],
        reason: `JSON parse failed: ${String(err.message || err)}`,
        path: abs,
      }),
      1,
    );
  }

  const result = await evaluatePlannerSelection(input);
  emit(
    {
      ...result,
      routing_input_path: abs,
    },
    exitCodeFor(result.policy_result),
  );
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    emit(
      baseResult({
        reason_codes: ["ROUTING_INPUT_INVALID"],
        reason: String(err && err.stack ? err.stack : err),
      }),
      1,
    );
  });
}
