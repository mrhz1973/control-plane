#!/usr/bin/env node
/**
 * PM-46 — Real local Codex runner probe v2 (single codex.cmd invocation).
 * Raw stdout/stderr in memory only; never committed.
 * spawnSync with argv array (no shell:true string concatenation).
 */
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { platform } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  hasForbidden,
  classifyCodexRunnerOutput,
  POLICY_BLOCK,
} from "./codex-runner-classify.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_OUT = resolve(
  ROOT,
  "docs/examples/pm46-codex-local-runner-v2-result.sample.json"
);

const CODEX_INVOCATION_COUNT = 1;
const RETRY_COUNT = 0;

const PROMPT = `PM-46 REAL LOCAL RUNNER V2.

Read only this file:
docs/PM35_CODEX_NOOP_PROBE.md

Do not modify files.
Do not run git commands.
Do not access secrets.
Do not touch n8n.
Do not enable any worker.

Return exactly this marker-delimited JSON block.
No prose before or after.
No markdown.
No alternative markers.
No renamed fields.

CONTROL_PLANE_JSON_START
{"schema_version":"pm37-codex-structured-output-v1","status":"pass","target_file":"docs/PM35_CODEX_NOOP_PROBE.md","pm35_status":"PASS","file_modified":false,"git_command_used":false,"secret_accessed":false,"n8n_touched":false,"worker_enabled":false}
CONTROL_PLANE_JSON_END

If you cannot comply, return the same block with "status":"fail" and keep all safety booleans false.`;

function buildPm46Artifact(classification, spawnMeta) {
  const strict_pass = classification.strict_pass === true;
  const exitCode = spawnMeta.exitCode;
  const artifact = {
    schema_version: "pm46-codex-local-runner-v2-result-v1",
    source: "local-runner-v2",
    command_family: "codex.cmd exec",
    sandbox: "read-only",
    codex_invoked: spawnMeta.codex_invoked,
    runtime_executed: spawnMeta.runtime_executed,
    exit_code: exitCode,
    exit_code_recorded: exitCode != null,
    classification: classification.classification,
    failure_mode: classification.failure_mode ?? null,
    strict_pass,
    pm34_unblocked: false,
    n8n_usable_future_artifact: strict_pass,
    target_file: "docs/PM35_CODEX_NOOP_PROBE.md",
    markers_found: classification.markers_found ?? false,
    json_valid: classification.json_valid ?? false,
    schema_contract_pass: classification.schema_contract_pass ?? false,
    pm35_status: classification.pm35_status ?? null,
    file_modified: false,
    git_command_used: false,
    secret_accessed: false,
    n8n_touched: false,
    worker_enabled: false,
    workflow_40_touched: false,
    workflow_41_touched: false,
    raw_runtime_metadata_redacted: spawnMeta.raw_runtime_metadata_redacted,
    raw_stdout_committed: false,
    raw_stderr_committed: false,
    codex_invocation_count: CODEX_INVOCATION_COUNT,
    retry_count: RETRY_COUNT,
    notes: [
      "Raw stdout/stderr were not committed.",
      "PM-34 remains blocked pending separate gate.",
      ...(classification.notes ?? []),
    ],
  };

  if (strict_pass) {
    artifact.notes.push(
      "Strict artifact exists, but PM-34 still requires separate gate."
    );
  }

  const text = JSON.stringify(artifact);
  if (hasForbidden(text)) {
    throw new Error("artifact contains forbidden pattern");
  }
  return artifact;
}

/**
 * Single Codex invocation via argv array (Windows: cmd.exe /c codex.cmd …).
 */
function runCodexOnceV2() {
  const codexArgs = [
    "exec",
    "--sandbox",
    "read-only",
    "--approval",
    "never",
    "--cd",
    ROOT,
    PROMPT,
  ];

  let spawnError = null;
  let result;

  const spawnOpts = {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 600_000,
    windowsHide: true,
  };

  try {
    if (platform() === "win32") {
      result = spawnSync(
        process.env.ComSpec || "cmd.exe",
        ["/d", "/s", "/c", "codex.cmd", ...codexArgs],
        spawnOpts
      );
    } else {
      result = spawnSync("codex.cmd", codexArgs, spawnOpts);
    }
  } catch (err) {
    spawnError = err;
    result = { status: null, stdout: "", stderr: String(err?.message ?? err), error: err };
  }

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = `${stdout}\n${stderr}`;
  const codex_invoked = !spawnError && !result.error && result.status !== null;
  const runtime_executed =
    codex_invoked && result.status !== null && !POLICY_BLOCK.test(combined);

  return {
    codex_invoked,
    runtime_executed,
    stdout,
    stderr,
    exitCode: result.status,
    spawnError: spawnError ?? result.error ?? null,
    raw_runtime_metadata_redacted: hasForbidden(combined),
  };
}

function main() {
  console.log("PM-46: starting single codex.cmd exec probe v2...");
  const spawnMeta = runCodexOnceV2();
  const classification = classifyCodexRunnerOutput(spawnMeta);
  const artifact = buildPm46Artifact(classification, spawnMeta);

  writeFileSync(ARTIFACT_OUT, JSON.stringify(artifact, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        classification: artifact.classification,
        failure_mode: artifact.failure_mode,
        strict_pass: artifact.strict_pass,
        exit_code: artifact.exit_code,
        codex_invocation_count: artifact.codex_invocation_count,
        codex_invoked: artifact.codex_invoked,
        pm34_unblocked: artifact.pm34_unblocked,
        artifact: "docs/examples/pm46-codex-local-runner-v2-result.sample.json",
      },
      null,
      2
    )
  );
}

main();
