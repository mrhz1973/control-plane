#!/usr/bin/env node
/**
 * D-9406-A — Hermes shadow-proof validator focused test runner.
 *
 * Runs deterministic fixture-based validation tests against
 * tools/validate-hermes-shadow-proof-v1.mjs and asserts exact
 * classification, ok, reason codes, and exit code.
 *
 * Usage:
 *   node tests/hermes-shadow-proof-validator-v1/run.mjs
 *
 * Exit: 0 all tests pass, 1 any test fails, 2 internal/usage error.
 * Stdout: one compact JSON summary only.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VALIDATOR = join(ROOT, "tools", "validate-hermes-shadow-proof-v1.mjs");

const HEAD_A = "aa".repeat(20);
const HEAD_B = "bb".repeat(20);

function makeFixture(overrides) {
  const base = {
    schema_version: "hermes-shadow-proof-packet-v1",
    issue: 73,
    repository: "mrhz1973/control-plane",
    branch: "main",
    route: {
      controller: "qwen_local",
      bridge: "hermes",
      target: "chatgpt_web",
    },
    shadow_only: true,
    production_dispatch: false,
    self_authorizing: false,
    credential_material_in_packet: false,
    base_head: HEAD_A,
    allowed_scope: ["tools/", "tests/", "reports/architecture/"],
    hard_walls: [
      "no production dispatch",
      "no OLD mutation/decommission",
      "no D-0025 reopening",
      "no public CDP/noVNC/Funnel",
      "no credentials/cookies/secrets persistence",
      "no claim ChatGPT Web is unlimited/infinite",
    ],
    acceptance: [
      "exact route identity qwen_local->hermes->chatgpt_web",
      "real authenticated Web surface observation",
      "bounded fresh observation timestamp/freshness",
      "no hidden fallback",
      "no production mutation",
      "deterministic PASS/STOP evidence",
    ],
    stop_conditions: [
      "stale/wrong base head",
      "unavailable/unhealthy Hermes",
      "unavailable/unhealthy Web surface",
      "auth ambiguity",
      "route/model mismatch",
      "scope expansion",
      "hidden fallback",
      "production mutation attempt",
    ],
    model_selection: "dynamic",
  };
  const merged = JSON.parse(JSON.stringify(base));
  applyOverrides(merged, overrides);
  return merged;
}

function applyOverrides(obj, overrides) {
  for (const [k, v] of Object.entries(overrides || {})) {
    if (v === null && (k in obj)) delete obj[k];
    else obj[k] = JSON.parse(JSON.stringify(v));
  }
}

function runValidator(args) {
  try {
    const out = execFileSync(
      process.execPath,
      [VALIDATOR, ...args],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return { exitCode: 0, stdout: out };
  } catch (err) {
    return { exitCode: err.status, stdout: String(err.stdout || "") };
  }
}

function parseOut(stdout) {
  try {
    return JSON.parse(stdout.trim().split("\n").pop() || "{}");
  } catch {
    return {};
  }
}

function testFixture(name, fixtureOrText, args, expected) {
  if (fixtureOrText === null) {
    const r = runValidator([...(args || [])]);
    return runValidatorChecks(name, r, expected);
  }
  const dir = mkdtempSync(join(tmpdir(), "hermes-shadow-proof-"));
  const path = join(dir, `${name}.json`);
  const text =
    typeof fixtureOrText === "string"
      ? fixtureOrText
      : JSON.stringify(fixtureOrText, null, 2);
  writeFileSync(path, text, "utf8");
  const r = runValidator([path, ...(args || [])]);
  return runValidatorChecks(name, r, expected);
}

function runValidatorChecks(name, r, expected) {
  const out = parseOut(r.stdout);

  const failures = [];
  if (r.exitCode !== expected.exitCode)
    failures.push(`exit=${r.exitCode} expected=${expected.exitCode}`);
  if (out.ok !== expected.ok) failures.push(`ok=${out.ok}`);
  if (out.classification !== expected.classification)
    failures.push(`classification=${out.classification}`);
  if (out.schema_version !== "hermes-shadow-proof-validation-v1")
    failures.push(`schema_version=${out.schema_version}`);
  if (!Array.isArray(out.reason_codes) || out.reason_codes.length > 16)
    failures.push("reason_codes length/shape");
  if (expected.reason_codes) {
    for (const code of expected.reason_codes) {
      if (!out.reason_codes.includes(code))
        failures.push(`missing_reason_code:${code}`);
    }
  }
  if (expected.forbidden_codes) {
    for (const code of expected.forbidden_codes) {
      if (out.reason_codes.includes(code))
        failures.push(`unexpected_code:${code}`);
    }
  }
  const stdoutBlob = (r.stdout || "").toLowerCase();
  if (expected.forbidden_in_output) {
    for (const needle of expected.forbidden_in_output) {
      if (stdoutBlob.includes(needle))
        failures.push(`output_contains:${needle}`);
    }
  }
  if (expected.require_in_output) {
    for (const needle of expected.require_in_output) {
      if (!stdoutBlob.includes(needle))
        failures.push(`output_missing:${needle}`);
    }
  }

  return { name, passed: failures.length === 0, failures, exitCode: r.exitCode, out };
}

const GOOD = makeFixture({});

const tests = [
  testFixture(
    "pass_good",
    GOOD,
    [],
    {
      exitCode: 0,
      ok: true,
      classification: "PASS",
      reason_codes: [],
      forbidden_codes: ["STALE_BASE_HEAD", "USAGE_ERROR", "MALFORMED_JSON"],
    },
  ),
  testFixture(
    "pass_expected_head_match",
    GOOD,
    ["--expected-head", HEAD_A],
    {
      exitCode: 0,
      ok: true,
      classification: "PASS",
    },
  ),
  testFixture(
    "stop_stale_base_head",
    GOOD,
    ["--expected-head", HEAD_B],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["STALE_BASE_HEAD"],
    },
  ),
  testFixture(
    "stop_malformed_json",
    "{not-json",
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["MALFORMED_JSON"],
    },
  ),
  testFixture(
    "stop_bad_schema_version",
    makeFixture({ schema_version: "wrong" }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["BAD_SCHEMA_VERSION"],
    },
  ),
  testFixture(
    "stop_bad_route_identity",
    makeFixture({ route: { controller: "x", bridge: "y", target: "z" } }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["BAD_ROUTE_IDENTITY"],
    },
  ),
  testFixture(
    "stop_bad_base_head_not_hex",
    makeFixture({ base_head: "NOTHEX" }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["BAD_BASE_HEAD"],
    },
  ),
  testFixture(
    "stop_bad_allowed_scope",
    makeFixture({ allowed_scope: [] }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["BAD_ALLOWED_SCOPE"],
    },
  ),
  testFixture(
    "stop_bad_allowed_scope_entry_traversal",
    makeFixture({ allowed_scope: ["../x"] }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["BAD_ALLOWED_SCOPE_ENTRY"],
    },
  ),
  testFixture(
    "stop_bad_allowed_scope_entry_absolute",
    makeFixture({ allowed_scope: ["/etc/passwd"] }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["BAD_ALLOWED_SCOPE_ENTRY"],
    },
  ),
  testFixture(
    "stop_hard_walls_coverage_missing",
    makeFixture({ hard_walls: ["foo"] }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["HARD_WALLS_COVERAGE"],
    },
  ),
  testFixture(
    "stop_acceptance_coverage_missing",
    makeFixture({ acceptance: ["foo"] }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["ACCEPTANCE_COVERAGE"],
    },
  ),
  testFixture(
    "stop_stop_conditions_coverage_missing",
    makeFixture({ stop_conditions: ["foo"] }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["STOP_CONDITIONS_COVERAGE"],
    },
  ),
  testFixture(
    "stop_credential_key_in_packet",
    makeFixture({ extra: { access_token: "abc" } }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["PACKET_CONTAINS_CREDENTIAL_KEYS"],
      forbidden_in_output: ["abc"],
    },
  ),
  testFixture(
    "stop_credential_value_bearer",
    makeFixture({ extra: { note: "bearer abc.def-ghi" } }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["PACKET_CONTAINS_CREDENTIAL_VALUES"],
      forbidden_in_output: ["abc.def-ghi"],
    },
  ),
  testFixture(
    "stop_frozen_chatgpt_web_model_allowlist",
    makeFixture({
      model_allowlist: ["gpt-4", "gpt-4o"],
    }),
    [],
    {
      exitCode: 2,
      ok: false,
      classification: "STOP",
      reason_codes: ["PACKET_FREEZES_CHATGPT_WEB_MODEL_ALLOWLIST"],
    },
  ),
  testFixture(
    "usage_missing_packet_path",
    null,
    [],
    {
      exitCode: 1,
      ok: false,
      classification: "STOP",
      reason_codes: ["USAGE_ERROR"],
    },
  ),
];

const passed = tests.filter((t) => t.passed).length;
const failed = tests.length - passed;
const failures = tests
  .filter((t) => !t.passed)
  .map((t) => ({ name: t.name, failures: t.failures }));

process.stdout.write(
  `${JSON.stringify({
    schema_version: "hermes-shadow-proof-validator-test-run-v1",
    ok: failed === 0,
    total: tests.length,
    passed,
    failed,
    failures,
  })}\n`,
);
process.exit(failed === 0 ? 0 : 1);
