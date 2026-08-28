#!/usr/bin/env node
/**
 * D-0024-W — offline Codex compatibility recovery regression tests.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deepStrictEqual } from "node:assert";
import {
  normalizeResponsesBody,
  collectFunctionCalls,
} from "../../tools/normalize-litellm-responses-body.mjs";
import { PLANNER_INSTRUCTIONS } from "../../tools/build-openclaw-responses-request.mjs";
import { checkHardConstraintsExact } from "../../tools/validate-openclaw-planner-response-gate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const FIX = join(HERE, "fixtures");
const CONSUMER = join(
  ROOT,
  "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json",
);
const SSE_FIXTURE = join(FIX, "response-codex-repilot-sse.sse");
const PACKET_MISMATCH = join(
  FIX,
  "packet-codex-repilot-hard-constraint-mismatch.json",
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function readText(path) {
  return readFileSync(path, "utf8").replace(/^\uFEFF/, "");
}

function deepEqual(a, b) {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

function hasSecretLeak(blob) {
  return (
    /Bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob) ||
    /"access_token"\s*:\s*"/i.test(blob) ||
    /"refresh_token"\s*:\s*"/i.test(blob)
  );
}

function buildResponseFromPacket(packet) {
  return {
    object: "response",
    status: "completed",
    output: [
      {
        type: "function_call",
        name: "emit_execution_packet",
        arguments: JSON.stringify(packet),
      },
    ],
  };
}

const baseConsumer = readJson(CONSUMER);
const codexConsumer = { ...baseConsumer, planner_requested: "codex" };
const capturedSse = readText(SSE_FIXTURE);
const capturedPacket = readJson(PACKET_MISMATCH);

const CASES = [
  {
    name: "json-normal-pass-through",
    run() {
      const response = buildResponseFromPacket({
        ...capturedPacket,
        hard_constraints: [...codexConsumer.hard_constraints],
        planner: {
          requested: "codex",
          used: "codex",
          fallback_used: false,
          fallback_reason: null,
          provider_state_ref: null,
        },
      });
      const body = JSON.stringify(response);
      const norm = normalizeResponsesBody(body);
      if (!norm.ok || norm.source_format !== "json") return `expected json pass; got ${norm.classification}`;
      if (!deepEqual(norm.response, response)) return "json semantic mutation";
      return null;
    },
  },
  {
    name: "captured-sse-to-completed-response",
    run() {
      const norm = normalizeResponsesBody(capturedSse);
      if (!norm.ok || norm.source_format !== "sse") {
        return `expected sse normalize PASS; got ${norm.classification}`;
      }
      if (norm.response.status !== "completed") {
        return `expected completed status; got ${norm.response.status}`;
      }
      return null;
    },
  },
  {
    name: "captured-sse-single-emit-function-call",
    run() {
      const norm = normalizeResponsesBody(capturedSse);
      if (!norm.ok) return norm.classification;
      const calls = collectFunctionCalls(norm.response.output);
      if (calls.length !== 1 || calls[0].name !== "emit_execution_packet") {
        return `expected one emit_execution_packet; got ${calls.length}`;
      }
      return null;
    },
  },
  {
    name: "captured-sse-arguments-preserved",
    run() {
      const norm = normalizeResponsesBody(capturedSse);
      if (!norm.ok) return norm.classification;
      const call = collectFunctionCalls(norm.response.output)[0];
      const args = typeof call.arguments === "string" ? call.arguments : JSON.stringify(call.arguments);
      if (!args.includes('"schema":"execution-packet-v1"')) return "arguments missing schema marker";
      if (!args.includes('"task_id":"D-0020-W"')) return "arguments missing task_id";
      const parsed = JSON.parse(args);
      if (parsed.hard_constraints.length !== 6) return "unexpected hard_constraints length in captured args";
      return null;
    },
  },
  {
    name: "malformed-sse-fail-closed",
    run() {
      const norm = normalizeResponsesBody("data: {not-json}\n");
      if (norm.ok || norm.classification !== "SSE_MALFORMED") {
        return `expected SSE_MALFORMED; got ${JSON.stringify(norm)}`;
      }
      return null;
    },
  },
  {
    name: "duplicate-terminal-response-fail-closed",
    run() {
      const body = [
        'data: {"type":"response.completed","response":{"object":"response","status":"completed","output":[]}}',
        'data: {"type":"response.completed","response":{"object":"response","status":"completed","output":[]}}',
      ].join("\n");
      const norm = normalizeResponsesBody(body);
      if (norm.ok || norm.classification !== "SSE_MULTIPLE_TERMINAL_RESPONSES") {
        return `expected SSE_MULTIPLE_TERMINAL_RESPONSES; got ${norm.classification}`;
      }
      return null;
    },
  },
  {
    name: "exact-hard-constraints-pass-structural",
    run() {
      const packet = {
        ...capturedPacket,
        hard_constraints: [...codexConsumer.hard_constraints],
      };
      const result = checkHardConstraintsExact(packet, codexConsumer);
      if (!result.ok) return `expected PASS; got ${result.classification}`;
      return null;
    },
  },
  {
    name: "extra-hard-constraint-mismatch",
    run() {
      const result = checkHardConstraintsExact(capturedPacket, codexConsumer);
      if (result.classification !== "HARD_CONSTRAINT_MISMATCH") {
        return `expected HARD_CONSTRAINT_MISMATCH; got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "reordered-hard-constraints-mismatch",
    run() {
      const packet = {
        ...capturedPacket,
        hard_constraints: ["no-provider-calls", "no-n8n-mutation"],
      };
      const result = checkHardConstraintsExact(packet, codexConsumer);
      if (result.classification !== "HARD_CONSTRAINT_MISMATCH") {
        return `expected HARD_CONSTRAINT_MISMATCH; got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "rephrased-hard-constraint-mismatch",
    run() {
      const packet = {
        ...capturedPacket,
        hard_constraints: ["no-n8n-mutation", "no provider calls"],
      };
      const result = checkHardConstraintsExact(packet, codexConsumer);
      if (result.classification !== "HARD_CONSTRAINT_MISMATCH") {
        return `expected HARD_CONSTRAINT_MISMATCH; got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "planner-instructions-exact-hard-constraints-copy",
    run() {
      const required =
        "hard_constraints MUST equal consumer_input.hard_constraints exactly";
      if (!PLANNER_INSTRUCTIONS.includes(required)) {
        return "PLANNER_INSTRUCTIONS missing exact-copy obligation";
      }
      return null;
    },
  },
  {
    name: "normalizer-output-no-secrets",
    run() {
      const norm = normalizeResponsesBody(capturedSse);
      if (!norm.ok) return norm.classification;
      const blob = JSON.stringify(norm);
      if (hasSecretLeak(blob)) return "secret-like material in normalized output";
      return null;
    },
  },
  {
    name: "hard-constraints-delta-metadata",
    run() {
      const expected = codexConsumer.hard_constraints.length;
      const actual = capturedPacket.hard_constraints.length;
      if (expected !== 2 || actual !== 6) {
        return `unexpected counts expected=${expected} actual=${actual}`;
      }
      const added = capturedPacket.hard_constraints.filter(
        (v) => !codexConsumer.hard_constraints.includes(v),
      );
      if (added.length !== 4) return `expected 4 added constraints; got ${added.length}`;
      return null;
    },
  },
];

const results = [];
for (const c of CASES) {
  let detail;
  try {
    detail = await c.run();
  } catch (err) {
    detail = String(err && err.stack ? err.stack : err);
  }
  const pass = detail === null;
  results.push({ name: c.name, pass, detail: pass ? "ok" : detail });
}

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
  provider_calls_this_pass: 0,
  inference_this_pass: 0,
  network_access: false,
};
console.log(JSON.stringify(summary));
process.exit(failed.length === 0 ? 0 : 1);
