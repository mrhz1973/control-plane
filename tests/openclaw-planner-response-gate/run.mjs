#!/usr/bin/env node
/**
 * D-0018-W — local fixture runner for OpenClaw planner-response gate.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const GATE = join(ROOT, "tools/validate-openclaw-planner-response-gate.mjs");
const FIX = join(HERE, "fixtures");
const VALID_INPUT = join(FIX, "consumer-input-valid.json");

const CASES = [
  {
    name: "valid",
    response: "response-valid.json",
    input: VALID_INPUT,
    expectOk: true,
    expectClassification: "PASS",
  },
  {
    name: "no-function-call",
    response: "response-no-function-call.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "FUNCTION_CALL_COUNT",
  },
  {
    name: "two-function-calls",
    response: "response-two-function-calls.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "FUNCTION_CALL_COUNT",
  },
  {
    name: "wrong-function-name",
    response: "response-wrong-function-name.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "FUNCTION_CALL_NAME",
  },
  {
    name: "malformed-arguments",
    response: "response-malformed-arguments.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "ARGUMENTS_JSON_PARSE",
  },
  {
    name: "schema-invalid-packet",
    response: "response-schema-invalid-packet.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "PACKET_SCHEMA_INVALID",
  },
  {
    name: "input-mismatch",
    response: "response-input-mismatch.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "INPUT_MISMATCH",
  },
  {
    name: "planner-mismatch",
    response: "response-planner-mismatch.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "PLANNER_MISMATCH",
  },
  {
    name: "fallback-invalid",
    response: "response-fallback-invalid.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "FALLBACK_METADATA_INVALID",
  },
  {
    name: "hard-constraints-identical",
    response: "response-hard-constraints-match.json",
    input: join(FIX, "consumer-input-hard-constraints.json"),
    expectOk: true,
    expectClassification: "PASS",
  },
  {
    name: "hard-constraints-missing",
    response: "response-hard-constraints-missing.json",
    input: join(FIX, "consumer-input-hard-constraints.json"),
    expectOk: false,
    expectClassification: "HARD_CONSTRAINT_MISMATCH",
  },
  {
    name: "hard-constraints-reordered",
    response: "response-hard-constraints-reordered.json",
    input: join(FIX, "consumer-input-hard-constraints.json"),
    expectOk: false,
    expectClassification: "HARD_CONSTRAINT_MISMATCH",
  },
  {
    name: "hard-constraints-modified",
    response: "response-hard-constraints-modified.json",
    input: join(FIX, "consumer-input-hard-constraints.json"),
    expectOk: false,
    expectClassification: "HARD_CONSTRAINT_MISMATCH",
  },
  {
    name: "hard-constraints-empty-ok",
    response: "response-hard-constraints-empty-ok.json",
    input: VALID_INPUT,
    expectOk: true,
    expectClassification: "PASS",
  },
  {
    name: "hard-constraints-empty-input-nonempty-packet",
    response: "response-hard-constraints-empty-input-nonempty-packet.json",
    input: VALID_INPUT,
    expectOk: false,
    expectClassification: "HARD_CONSTRAINT_MISMATCH",
  },
];

function runCase(c) {
  const response = join(FIX, c.response);
  const input = c.input.startsWith(FIX) ? c.input : join(FIX, c.input);
  const proc = spawnSync(process.execPath, [GATE, response, input], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const stdout = (proc.stdout || "").trim();
  let result;
  try {
    result = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).pop());
  } catch {
    return {
      name: c.name,
      pass: false,
      detail: `non-JSON stdout=${stdout.slice(0, 400)} stderr=${(proc.stderr || "").slice(0, 400)}`,
    };
  }
  const exitOk = c.expectOk ? proc.status === 0 : proc.status !== 0;
  const classOk = result.classification === c.expectClassification;
  const okFlag = result.ok === c.expectOk;
  const pass = exitOk && classOk && okFlag;
  return {
    name: c.name,
    pass,
    detail: pass
      ? "ok"
      : `expected ok=${c.expectOk} classification=${c.expectClassification} exit ${c.expectOk ? 0 : "non-zero"}; got ok=${result.ok} classification=${result.classification} exit=${proc.status} reason=${result.reason}`,
  };
}

const results = CASES.map(runCase);
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
