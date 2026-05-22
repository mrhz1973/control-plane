#!/usr/bin/env node
/**
 * PM-44 — Real local Codex runner probe (single codex.cmd invocation).
 * Raw stdout/stderr stay in memory only; never written to disk.
 *
 * PM-45: classification extracted to codex-runner-classify.mjs.
 * Exit code 2 without markers => fail + failure_mode cli_exit_nonzero (PM-44 pattern).
 */
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TARGET_FILE,
  hasForbidden,
  classifyRun,
  buildSanitizedArtifact,
  POLICY_BLOCK,
} from "./codex-runner-classify.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_OUT = resolve(
  ROOT,
  "docs/examples/pm44-codex-local-runner-probe-result.sample.json"
);

const PROMPT = `PM-44 REAL LOCAL RUNNER PROBE.

Read only this file:
docs/PM35_CODEX_NOOP_PROBE.md

Do not modify files.
Do not run git commands.
Do not access secrets.
Do not touch n8n.
Do not enable any worker.

Return a marker-delimited JSON block with exactly these markers and fields:
CONTROL_PLANE_JSON_START
{"schema_version":"pm37-codex-structured-output-v1","status":"pass","target_file":"docs/PM35_CODEX_NOOP_PROBE.md","pm35_status":"PASS","file_modified":false,"git_command_used":false,"secret_accessed":false,"n8n_touched":false,"worker_enabled":false}
CONTROL_PLANE_JSON_END

No alternative markers.
Do not rename fields.
Do not add fields.
Do not omit fields.`;

function runCodexOnce() {
  const args = ["exec", "--sandbox", "read-only", "--cd", ROOT, PROMPT];
  let spawnError = null;
  let result;

  try {
    result = spawnSync("codex.cmd", args, {
      cwd: ROOT,
      encoding: "utf8",
      shell: true,
      maxBuffer: 16 * 1024 * 1024,
      timeout: 600_000,
    });
  } catch (err) {
    spawnError = err;
    result = { status: null, stdout: "", stderr: String(err?.message ?? err) };
  }

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = `${stdout}\n${stderr}`;
  const codex_invoked = !spawnError;
  const runtime_executed =
    codex_invoked && result.status !== null && !POLICY_BLOCK.test(combined);

  return {
    codex_invoked,
    runtime_executed,
    stdout,
    stderr,
    exitCode: result.status,
    spawnError,
    raw_runtime_metadata_redacted: hasForbidden(combined),
  };
}

function main() {
  console.log("PM-44: starting single codex.cmd exec probe...");
  const spawnMeta = runCodexOnce();
  const classification = classifyRun(spawnMeta);
  const artifact = buildSanitizedArtifact(
    classification,
    {
      source: "local-runner",
      codex_invoked: spawnMeta.codex_invoked,
      runtime_executed: spawnMeta.runtime_executed,
      exitCode: spawnMeta.exitCode,
      raw_runtime_metadata_redacted: spawnMeta.raw_runtime_metadata_redacted,
    },
    "pm44-codex-local-runner-probe-result-v1"
  );

  writeFileSync(ARTIFACT_OUT, JSON.stringify(artifact, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        classification: artifact.classification,
        strict_pass: artifact.strict_pass,
        failure_mode: artifact.failure_mode,
        exit_code: artifact.exit_code,
        codex_invoked: artifact.codex_invoked,
        pm34_unblocked: artifact.pm34_unblocked,
        artifact: "docs/examples/pm44-codex-local-runner-probe-result.sample.json",
      },
      null,
      2
    )
  );
}

main();
