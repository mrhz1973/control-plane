#!/usr/bin/env node
/**
 * PM-45 — Codex local runner hardening dry-run (no Codex, no shell).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STRICT_START,
  STRICT_END,
  TARGET_FILE,
  EXPECTED_SCHEMA,
  hasForbidden,
  classifyRun,
  buildSanitizedArtifact,
} from "./codex-runner-classify.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PM44_IN = resolve(
  ROOT,
  "docs/examples/pm44-codex-local-runner-probe-result.sample.json"
);

const OUT = {
  strict_success: resolve(
    ROOT,
    "docs/examples/pm45-runner-hardening-strict-success.sample.json"
  ),
  exit2_fail: resolve(
    ROOT,
    "docs/examples/pm45-runner-hardening-exit2-fail.sample.json"
  ),
  policy_block: resolve(
    ROOT,
    "docs/examples/pm45-runner-hardening-policy-block.sample.json"
  ),
  scope_drift: resolve(
    ROOT,
    "docs/examples/pm45-runner-hardening-scope-drift.sample.json"
  ),
  malformed_json: resolve(
    ROOT,
    "docs/examples/pm45-runner-hardening-malformed-json.sample.json"
  ),
  summary: resolve(
    ROOT,
    "docs/examples/pm45-runner-hardening-summary.sample.json"
  ),
};

const STRICT_JSON = JSON.stringify({
  schema_version: EXPECTED_SCHEMA,
  status: "pass",
  target_file: TARGET_FILE,
  pm35_status: "PASS",
  file_modified: false,
  git_command_used: false,
  secret_accessed: false,
  n8n_touched: false,
  worker_enabled: false,
});

const FIXTURES = {
  strict_success_raw: {
    expected: "strict_pass",
    stdout: `${STRICT_START}\n${STRICT_JSON}\n${STRICT_END}\n`,
    stderr: "",
    exitCode: 0,
    codex_invoked: true,
    runtime_executed: true,
  },
  no_markers_exit_2: {
    expected: "fail",
    stdout: "",
    stderr: "error: invalid arguments\n",
    exitCode: 2,
    codex_invoked: true,
    runtime_executed: true,
  },
  policy_block: {
    expected: "blocked",
    stdout: "",
    stderr: "BLOCKED_BY_TOOL_POLICY: nested codex.cmd not allowed\n",
    exitCode: 1,
    codex_invoked: true,
    runtime_executed: true,
  },
  scope_drift: {
    expected: "fail_scope_drift",
    stdout:
      "Inspecting repo with rg and git status. Read multiple files under docs/.\n",
    stderr: "",
    exitCode: 0,
    codex_invoked: true,
    runtime_executed: true,
  },
  malformed_json: {
    expected: "fail",
    stdout: `${STRICT_START}\n{ not valid json }\n${STRICT_END}\n`,
    stderr: "",
    exitCode: 0,
    codex_invoked: true,
    runtime_executed: true,
  },
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function runFixture(name, fx) {
  const combined = `${fx.stdout}\n${fx.stderr}`;
  assertNoSecrets(combined, name);

  const result = classifyRun({
    codex_invoked: fx.codex_invoked,
    runtime_executed: fx.runtime_executed,
    stdout: fx.stdout,
    stderr: fx.stderr,
    exitCode: fx.exitCode,
    spawnError: null,
  });

  if (result.classification !== fx.expected) {
    throw new Error(
      `${name}: expected ${fx.expected}, got ${result.classification}`
    );
  }
  if (result.strict_pass !== (fx.expected === "strict_pass")) {
    throw new Error(`${name}: strict_pass mismatch`);
  }
  const n8n_usable = result.strict_pass === true;
  if (n8n_usable !== result.strict_pass) {
    throw new Error(`${name}: n8n_usable must match strict_pass`);
  }

  return buildSanitizedArtifact(
    result,
    {
      source: "dry-run-fixtures",
      codex_invoked: false,
      runtime_executed: false,
      exitCode: fx.exitCode,
      fixture: name,
      raw_runtime_metadata_redacted: hasForbidden(combined),
    },
    "pm45-runner-hardening-result-v1"
  );
}

function assertNoSecrets(text, label) {
  if (hasForbidden(text)) throw new Error(`${label}: forbidden pattern`);
}

function main() {
  const pm44 = readJson(PM44_IN);
  assertNoSecrets(JSON.stringify(pm44), "pm44 artifact");

  const results = {};
  const outputs = {};

  for (const [name, fx] of Object.entries(FIXTURES)) {
    const artifact = runFixture(name, fx);
    results[name] = artifact.classification;
    outputs[name] = artifact;
  }

  if (pm44.classification !== "fail" || pm44.strict_pass !== false) {
    throw new Error("PM-44 artifact must remain fail / strict_pass false");
  }

  const summary = {
    schema_version: "pm45-runner-hardening-summary-v1",
    source: "dry-run-fixtures",
    codex_invoked: false,
    shell_invoked: false,
    n8n_touched: false,
    worker_enabled: false,
    pm44_observed: {
      classification: pm44.classification,
      strict_pass: pm44.strict_pass,
      runtime_executed: pm44.runtime_executed,
      codex_invoked: pm44.codex_invoked,
      exit_code: pm44.exit_code ?? 2,
      failure_mode: pm44.failure_mode ?? "cli_exit_nonzero",
    },
    fixture_results: results,
    pm34_unblocked: false,
    future_pm46_required: true,
    notes: [
      "PM-45 does not retry Codex.",
      "PM-44 fail remains non-n8n-usable.",
      "Future PM-46 must run one real probe only after hardening.",
    ],
  };

  if (summary.pm34_unblocked) throw new Error("PM-34 must stay blocked");

  assertNoSecrets(JSON.stringify(summary), "summary");
  for (const a of Object.values(outputs)) {
    assertNoSecrets(JSON.stringify(a), a.fixture);
  }

  writeFileSync(OUT.strict_success, JSON.stringify(outputs.strict_success_raw, null, 2) + "\n");
  writeFileSync(OUT.exit2_fail, JSON.stringify(outputs.no_markers_exit_2, null, 2) + "\n");
  writeFileSync(OUT.policy_block, JSON.stringify(outputs.policy_block, null, 2) + "\n");
  writeFileSync(OUT.scope_drift, JSON.stringify(outputs.scope_drift, null, 2) + "\n");
  writeFileSync(OUT.malformed_json, JSON.stringify(outputs.malformed_json, null, 2) + "\n");
  writeFileSync(OUT.summary, JSON.stringify(summary, null, 2) + "\n");

  console.log(JSON.stringify({ ok: true, fixture_results: results, pm34_unblocked: false }, null, 2));
}

main();
