#!/usr/bin/env node
/**
 * Offline mock tests for classifier-wrapper-v1 (C1a).
 * No external services. Mock mode only.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildGeneratePayload,
  classifyEvent,
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
} from "../../tools/classifier-wrapper-v1.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const casesPath = resolve(__dirname, "cases.json");
const casesDoc = JSON.parse(readFileSync(casesPath, "utf8"));

const RISK_ORDER = { low: 1, medium: 2, high: 3 };

function assertPayloadShape() {
  const { body } = buildGeneratePayload({
    model: DEFAULT_MODEL,
    prompt: "test",
    baseUrl: DEFAULT_BASE_URL,
  });

  const failures = [];
  if (body.stream !== false) failures.push("stream must be false");
  if (body.think !== false) failures.push("think must be false");
  if (body.format !== "json") failures.push('format must be "json"');

  if (failures.length > 0) {
    throw new Error(`payload shape assertion failed: ${failures.join("; ")}`);
  }

  console.log("PASS static payload assertion: stream:false, think:false, format:json");
}

function assertCaseOutput(caseDef, actual) {
  const exp = caseDef.expected;
  const errors = [];

  if (exp.risk && actual.risk !== exp.risk) {
    errors.push(`risk expected ${exp.risk}, got ${actual.risk}`);
  }
  if (exp.minRisk) {
    if ((RISK_ORDER[actual.risk] || 0) < RISK_ORDER[exp.minRisk]) {
      errors.push(`risk expected >= ${exp.minRisk}, got ${actual.risk}`);
    }
  }
  if (exp.route && actual.route !== exp.route) {
    errors.push(`route expected ${exp.route}, got ${actual.route}`);
  }
  if (typeof exp.requires_human === "boolean" && actual.requires_human !== exp.requires_human) {
    errors.push(
      `requires_human expected ${exp.requires_human}, got ${actual.requires_human}`,
    );
  }
  if (exp.confidence && actual.confidence !== exp.confidence) {
    errors.push(`confidence expected ${exp.confidence}, got ${actual.confidence}`);
  }
  if (exp.reasonIncludes && !String(actual.reason).includes(exp.reasonIncludes)) {
    errors.push(`reason expected to include ${exp.reasonIncludes}, got ${actual.reason}`);
  }

  for (const key of ["risk", "route", "reason", "confidence", "requires_human"]) {
    if (!(key in actual)) {
      errors.push(`missing output key: ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

async function runCases() {
  let passed = 0;

  for (const caseDef of casesDoc.cases) {
    const out = await classifyEvent(caseDef.input, {
      mock: true,
      mockResponse: caseDef.mockModelResponse,
    });

    try {
      assertCaseOutput(caseDef, out);
      console.log(`PASS case ${caseDef.id}: ${caseDef.name}`);
      passed += 1;
    } catch (err) {
      console.error(`FAIL case ${caseDef.id}: ${caseDef.name}`);
      console.error(`  actual: ${JSON.stringify(out)}`);
      console.error(`  ${err.message}`);
      process.exitCode = 1;
      return passed;
    }
  }

  return passed;
}

async function main() {
  assertPayloadShape();
  const passed = await runCases();

  if (process.exitCode) {
    console.error(`offline tests failed (${passed}/${casesDoc.cases.length} passed)`);
    process.exit(process.exitCode);
  }

  console.log(`offline tests passed (${passed}/${casesDoc.cases.length})`);
}

main().catch((err) => {
  console.error(`offline test runner error: ${err.message}`);
  process.exit(1);
});
