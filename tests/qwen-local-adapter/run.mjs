#!/usr/bin/env node
/**
 * V4 — offline mock tests for qwen-local-adapter-v1.
 * No Ollama generate. No network required.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOGICAL_RESOURCE,
  runQwenLocalAdapter,
} from "../../tools/qwen-local-adapter-v1.mjs";
import { resolveOllamaConfig } from "../../tools/ollama-json-client-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function baseContract(extra = {}) {
  return {
    required: ["summary"],
    properties: {
      summary: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high", "unknown"] },
    },
    additionalProperties: false,
    ...extra,
  };
}

function request(partial) {
  return {
    schema_version: "qwen-local-adapter-request-v1",
    request_id: "req-1",
    role: "planner",
    instruction: "Produce a structured result.",
    context: {},
    output_contract: baseContract(),
    ...partial,
  };
}

const CASES = [
  {
    name: "planner-mock-pass",
    expectOk: true,
    expectClassification: "LOCAL_MODEL_RESULT",
    run: () =>
      runQwenLocalAdapter(
        request({
          role: "planner",
          output_contract: baseContract({
            required: ["plan_summary", "next_step"],
            properties: {
              plan_summary: { type: "string" },
              next_step: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high", "unknown"] },
            },
          }),
        }),
        {
          mock: true,
          mockResponse: {
            plan_summary: "bounded offline plan",
            next_step: "await gate",
            confidence: "high",
          },
        },
      ),
  },
  {
    name: "routing-arbiter-mock-pass",
    expectOk: true,
    expectClassification: "LOCAL_MODEL_RESULT",
    run: () =>
      runQwenLocalAdapter(
        request({
          role: "routing_arbiter",
          instruction: "Choose only among supplied candidates.",
          context: { candidates: ["cursor", "opencode"] },
          output_contract: baseContract({
            required: ["selected", "rationale"],
            properties: {
              selected: { type: "string", enum: ["cursor", "opencode"] },
              rationale: { type: "string" },
            },
          }),
        }),
        {
          mock: true,
          mockResponse: { selected: "opencode", rationale: "local harness for qwen_local" },
        },
      ),
  },
  {
    name: "reviewer-mock-pass",
    expectOk: true,
    expectClassification: "LOCAL_MODEL_RESULT",
    run: () =>
      runQwenLocalAdapter(
        request({
          role: "reviewer",
          output_contract: baseContract({
            required: ["verdict", "findings"],
            properties: {
              verdict: { type: "string", enum: ["pass", "fail", "gate"] },
              findings: { type: "array" },
            },
          }),
        }),
        {
          mock: true,
          mockResponse: { verdict: "pass", findings: [] },
        },
      ),
  },
  {
    name: "invalid-role-fail",
    expectOk: false,
    expectClassification: "INVALID_INPUT",
    run: () =>
      runQwenLocalAdapter(request({ role: "executor" }), {
        mock: true,
        mockResponse: { summary: "x" },
      }),
  },
  {
    name: "empty-instruction-fail",
    expectOk: false,
    expectClassification: "INVALID_INPUT",
    run: () =>
      runQwenLocalAdapter(request({ instruction: "   " }), {
        mock: true,
        mockResponse: { summary: "x" },
      }),
  },
  {
    name: "invalid-json-fail",
    expectOk: false,
    expectClassification: "INVALID_JSON",
    run: () =>
      runQwenLocalAdapter(request({}), {
        mock: true,
        mockResponse: "{not-json",
      }),
  },
  {
    name: "missing-required-field-fail",
    expectOk: false,
    expectClassification: "OUTPUT_CONTRACT_MISMATCH",
    run: () =>
      runQwenLocalAdapter(
        request({
          output_contract: baseContract({
            required: ["summary", "must_exist"],
            properties: {
              summary: { type: "string" },
              must_exist: { type: "string" },
            },
          }),
        }),
        {
          mock: true,
          mockResponse: { summary: "present" },
        },
      ),
  },
  {
    name: "enum-outside-allowed-fail",
    expectOk: false,
    expectClassification: "OUTPUT_CONTRACT_MISMATCH",
    run: () =>
      runQwenLocalAdapter(
        request({
          role: "reviewer",
          output_contract: baseContract({
            required: ["verdict"],
            properties: {
              verdict: { type: "string", enum: ["pass", "fail", "gate"] },
            },
          }),
        }),
        {
          mock: true,
          mockResponse: { verdict: "ship_it" },
        },
      ),
  },
];

function checkLogicalBindingNoHardcode() {
  const registry = JSON.parse(
    readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"),
  );
  const status = JSON.parse(
    readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"),
  );
  const adapterSrc = readFileSync(
    resolve(ROOT, "tools/qwen-local-adapter-v1.mjs"),
    "utf8",
  );
  const qwenReg = registry.resources && registry.resources.qwen_local;
  const qwenStatus = status.resources && status.resources.qwen_local;
  const adapterHardcodes = /qwen3\s*:|qwen3:14b/.test(adapterSrc);
  const cfg = resolveOllamaConfig({ model: "custom-local-model" });
  const pass =
    LOGICAL_RESOURCE === "qwen_local" &&
    qwenReg &&
    qwenReg.resource_type === "model" &&
    qwenStatus &&
    qwenStatus.available === false &&
    !adapterHardcodes &&
    cfg.model === "custom-local-model";
  return {
    name: "qwen-local-logical-binding-no-hardcoded-qwen3",
    pass,
    detail: pass
      ? "ok"
      : `reg=${Boolean(qwenReg)} status_available=${qwenStatus && qwenStatus.available} adapter_hardcode=${adapterHardcodes} cfg.model=${cfg.model}`,
  };
}

async function runCase(c) {
  const out = await c.run();
  const pass =
    out.ok === c.expectOk && out.classification === c.expectClassification;
  return {
    name: c.name,
    pass,
    detail: pass
      ? "ok"
      : `expected ok=${c.expectOk} classification=${c.expectClassification}; got ok=${out.ok} classification=${out.classification}`,
    out,
  };
}

const results = [];
for (const c of CASES) {
  results.push(await runCase(c));
}
results.push(checkLogicalBindingNoHardcode());

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
}
const summary = {
  ok: failed.length === 0,
  classification: failed.length === 0 ? "PASS" : "FAIL",
  passed: results.filter((r) => r.pass).length,
  failed: failed.length,
  total: results.length,
};
console.log(JSON.stringify(summary));
process.exit(failed.length === 0 ? 0 : 1);
