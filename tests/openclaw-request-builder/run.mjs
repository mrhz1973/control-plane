#!/usr/bin/env node
/**
 * D-0019-W — local fixture runner for OpenClaw request builder.
 *
 * Canonical serialization note (matches builder): envelope keys fixed-order;
 * body.input preserves consumer_input key/array order; parameters deep-cloned
 * from docs/contracts/execution-packet-v1.schema.json; stdout is compact
 * JSON.stringify with no timestamps/random IDs.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deepStrictEqual } from "node:assert";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const BUILDER = join(ROOT, "tools/build-openclaw-responses-request.mjs");
const FIX = join(HERE, "fixtures");
const PACKET_SCHEMA = join(
  ROOT,
  "docs/contracts/execution-packet-v1.schema.json",
);
const VALID = join(FIX, "consumer-input-valid.json");

function runBuilder(inputPath) {
  const proc = spawnSync(process.execPath, [BUILDER, inputPath], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const stdout = (proc.stdout || "").trim();
  let result = null;
  try {
    result = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).pop());
  } catch {
    result = null;
  }
  return { proc, result, stdout };
}

function deepEqual(a, b) {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

const CASES = [
  {
    name: "valid-pass",
    run() {
      const { proc, result } = runBuilder(VALID);
      if (!result || proc.status !== 0 || result.ok !== true || result.classification !== "PASS") {
        return `expected PASS exit 0; got status=${proc.status} ok=${result && result.ok} classification=${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "missing-required",
    run() {
      const { proc, result } = runBuilder(join(FIX, "consumer-input-missing-required.json"));
      if (proc.status === 0 || !result || result.ok !== false || result.classification !== "INPUT_SCHEMA_INVALID") {
        return `expected INPUT_SCHEMA_INVALID; got status=${proc.status} classification=${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "invalid-planner-enum",
    run() {
      const { proc, result } = runBuilder(join(FIX, "consumer-input-invalid-planner-enum.json"));
      if (proc.status === 0 || !result || result.ok !== false || result.classification !== "INPUT_SCHEMA_INVALID") {
        return `expected INPUT_SCHEMA_INVALID; got status=${proc.status} classification=${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "additional-property",
    run() {
      const { proc, result } = runBuilder(join(FIX, "consumer-input-additional-property.json"));
      if (proc.status === 0 || !result || result.ok !== false || result.classification !== "INPUT_SCHEMA_INVALID") {
        return `expected INPUT_SCHEMA_INVALID; got status=${proc.status} classification=${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "exactly-one-function-tool",
    run() {
      const { result } = runBuilder(VALID);
      const tools = result && result.envelope && result.envelope.body && result.envelope.body.tools;
      if (!Array.isArray(tools) || tools.length !== 1 || tools[0].type !== "function") {
        return `expected exactly one function tool; got ${JSON.stringify(tools)}`;
      }
      return null;
    },
  },
  {
    name: "function-name-emit-execution-packet",
    run() {
      const { result } = runBuilder(VALID);
      const name = result && result.envelope && result.envelope.body.tools[0].name;
      if (name !== "emit_execution_packet") {
        return `expected emit_execution_packet; got ${name}`;
      }
      return null;
    },
  },
  {
    name: "parameters-deep-equal-packet-schema",
    run() {
      const { result } = runBuilder(VALID);
      const params = result && result.envelope && result.envelope.body.tools[0].parameters;
      const schema = JSON.parse(readFileSync(PACKET_SCHEMA, "utf8").replace(/^\uFEFF/, ""));
      if (!deepEqual(params, schema)) {
        return "tools[0].parameters is not deep-equal to execution-packet-v1.schema.json";
      }
      return null;
    },
  },
  {
    name: "tool-choice-pinned",
    run() {
      const { result } = runBuilder(VALID);
      const tc = result && result.envelope && result.envelope.body.tool_choice;
      if (!tc || tc.type !== "function" || tc.name !== "emit_execution_packet") {
        return `expected pinned tool_choice; got ${JSON.stringify(tc)}`;
      }
      return null;
    },
  },
  {
    name: "stream-false",
    run() {
      const { result } = runBuilder(VALID);
      if (!result || result.envelope.body.stream !== false) {
        return `expected stream false; got ${result && result.envelope.body.stream}`;
      }
      return null;
    },
  },
  {
    name: "model-openclaw-default",
    run() {
      const { result } = runBuilder(VALID);
      if (!result || result.envelope.body.model !== "openclaw/default") {
        return `expected model openclaw/default; got ${result && result.envelope.body.model}`;
      }
      return null;
    },
  },
  {
    name: "method-path",
    run() {
      const { result } = runBuilder(VALID);
      if (!result || result.envelope.method !== "POST" || result.envelope.path !== "/v1/responses") {
        return `expected POST /v1/responses; got ${result && result.envelope.method} ${result && result.envelope.path}`;
      }
      return null;
    },
  },
  {
    name: "agent-header-main",
    run() {
      const { result } = runBuilder(VALID);
      const h = result && result.envelope && result.envelope.headers;
      if (!h || h["x-openclaw-agent-id"] !== "main") {
        return `expected x-openclaw-agent-id main; got ${JSON.stringify(h)}`;
      }
      return null;
    },
  },
  {
    name: "no-authorization-token-secret",
    run() {
      const { result, stdout } = runBuilder(VALID);
      if (!result || !result.ok) return "valid build failed";
      const headers = result.envelope.headers || {};
      if (Object.keys(headers).some((k) => k.toLowerCase() === "authorization")) {
        return "Authorization header present";
      }
      if (result.envelope.auth && result.envelope.auth.authorization_value_included !== false) {
        return "authorization_value_included must be false";
      }
      if (/bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(stdout)) {
        return "bearer token material found in stdout";
      }
      if (/"password"\s*:\s*"/i.test(stdout) || /"api[_-]?key"\s*:\s*"/i.test(stdout)) {
        return "password/api key material found in stdout";
      }
      return null;
    },
  },
  {
    name: "provider-override-absent",
    run() {
      const { result } = runBuilder(VALID);
      const body = result && result.envelope && result.envelope.body;
      if (!body) return "missing body";
      if (
        Object.prototype.hasOwnProperty.call(body, "provider") ||
        Object.prototype.hasOwnProperty.call(body, "provider_override")
      ) {
        return "provider override present";
      }
      return null;
    },
  },
  {
    name: "deterministic-identical-output",
    run() {
      const a = runBuilder(VALID);
      const b = runBuilder(VALID);
      if (!a.result || !b.result || a.proc.status !== 0 || b.proc.status !== 0) {
        return "builds did not both PASS";
      }
      // Compare envelope only (paths may be absolute and identical too, but
      // envelope is the deterministic product under test).
      if (!deepEqual(a.result.envelope, b.result.envelope)) {
        return "envelopes differ across identical inputs";
      }
      if (JSON.stringify(a.result.envelope) !== JSON.stringify(b.result.envelope)) {
        return "envelope JSON serialization is not byte-identical across runs";
      }
      return null;
    },
  },
];

const results = CASES.map((c) => {
  let detail;
  try {
    detail = c.run();
  } catch (err) {
    detail = String(err && err.stack ? err.stack : err);
  }
  const pass = detail === null;
  return { name: c.name, pass, detail: pass ? "ok" : detail };
});

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
