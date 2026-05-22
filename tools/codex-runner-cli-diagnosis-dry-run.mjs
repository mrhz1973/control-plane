#!/usr/bin/env node
/**
 * PM-47 — Codex runner/CLI diagnosis (static analysis only; never invokes Codex).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hasForbidden } from "./codex-runner-classify.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(
  ROOT,
  "docs/examples/pm47-codex-runner-cli-diagnosis.sample.json"
);

const PROBE_V2 = resolve(ROOT, "tools/codex-local-runner-probe-v2.mjs");
const PROBE_V1 = resolve(ROOT, "tools/codex-local-runner-probe.mjs");
const PM46_ARTIFACT = resolve(
  ROOT,
  "docs/examples/pm46-codex-local-runner-v2-result.sample.json"
);
const PM44_ARTIFACT = resolve(
  ROOT,
  "docs/examples/pm44-codex-local-runner-probe-result.sample.json"
);

const FORBIDDEN =
  /session id|id_token|access_token|refresh_token|Authorization|Bearer|api\.telegram\.org\/bot|sk-|oauth\/authorize|localhost:1455|tokens used/i;

function readText(path) {
  return readFileSync(path, "utf8").replace(/^\uFEFF/, "");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function assertNoSecrets(text, label) {
  if (FORBIDDEN.test(text)) throw new Error(`${label}: forbidden pattern`);
}

function extractCodexArgsBlock(source, label) {
  const match = source.match(
    /const\s+(?:codexArgs|args)\s*=\s*\[([\s\S]*?)\];/
  );
  if (!match) throw new Error(`${label}: could not find args array`);
  return match[1];
}

function analyzeArgsArray(block) {
  const flags = [];
  const re = /"(--[^"]+)"/g;
  let m;
  while ((m = re.exec(block)) !== null) flags.push(m[1]);
  return {
    flags,
    uses_approval_flag: flags.includes("--approval"),
    uses_sandbox_read_only:
      flags.includes("--sandbox") && block.includes("read-only"),
    uses_cd: flags.includes("--cd"),
    uses_prompt_placeholder: block.includes("PROMPT"),
  };
}

function analyzeSpawn(source, label) {
  return {
    uses_shell_true: /shell:\s*true/.test(source),
    uses_cmd_exe_c:
      /cmd\.exe/.test(source) &&
      /\/c/.test(source) &&
      /codex\.cmd/.test(source),
    uses_spawn_sync_codex_direct:
      /spawnSync\(\s*["']codex\.cmd["']/.test(source) && !/cmd\.exe/.test(source),
    label,
  };
}

function main() {
  const v2Src = readText(PROBE_V2);
  const v1Src = readText(PROBE_V1);
  const pm46 = readJson(PM46_ARTIFACT);
  const pm44 = readJson(PM44_ARTIFACT);

  const v2Args = analyzeArgsArray(extractCodexArgsBlock(v2Src, "PM-46 v2"));
  const v1Args = analyzeArgsArray(extractCodexArgsBlock(v1Src, "PM-44"));
  const v2Spawn = analyzeSpawn(v2Src, "PM-46");
  const v1Spawn = analyzeSpawn(v1Src, "PM-44");

  const knownGood = {
    uses_codex_cmd_exec: true,
    uses_sandbox_read_only: true,
    uses_cd: true,
    uses_approval_flag: false,
    observed_successes: ["PM-35", "PM-36", "PM-38"],
  };

  const pm46DiffersFromKnownGood =
    v2Args.uses_approval_flag ||
    v2Spawn.uses_cmd_exe_c ||
    !v2Args.flags.every((f) =>
      ["--sandbox", "--cd"].includes(f) || f === "--approval"
    );

  const diagnosis = {
    schema_version: "pm47-codex-runner-cli-diagnosis-v1",
    source: "dry-run-static-analysis",
    codex_invoked: false,
    shell_invoked: false,
    n8n_touched: false,
    worker_enabled: false,
    known_good_manual_pattern: knownGood,
    pm46_runner_findings: {
      uses_approval_flag: v2Args.uses_approval_flag,
      uses_cmd_exe_c: v2Spawn.uses_cmd_exe_c,
      uses_prompt_as_single_arg: v2Args.uses_prompt_placeholder,
      likely_exit_2_cause: "invalid_cli_option_or_argv_quoting",
    },
    diagnosis: {
      primary_hypothesis:
        "runner_cli_args_differ_from_known_good_manual_invocation",
      likely_bad_arg: v2Args.uses_approval_flag ? "--approval" : null,
      pm44_note: `PM-44 exit ${pm44.exit_code ?? 2} without approval flag; shell:true=${v1Spawn.uses_shell_true}; differs from manual PowerShell.`,
      exit_code_2_interpretation:
        "CLI usage/argument parse failure before strict artifact",
      model_output_problem: false,
      parser_problem: false,
    },
    recommended_pm48_runner_change: {
      remove_approval_flag: true,
      use_known_good_arg_order: true,
      avoid_nested_codex: true,
      consider_prompt_file_or_stdin: true,
      still_one_shot: true,
      prefer_direct_codex_spawn_or_manual_parity:
        "match PM-35/36/38 PowerShell argv; avoid experimental cmd.exe /c unless required",
    },
    pm34_unblocked: false,
    future_pm48_required: true,
    notes: [
      "PM-35/36/38 manual: codex.cmd exec --sandbox read-only --cd <repo> <prompt> (no --approval CLI flag).",
      "PM-46 v2 added --approval never; PM-44 used shell:true; both failed exit 2 without strict markers.",
      "PM-47 does not invoke Codex.",
    ],
  };

  if (diagnosis.pm34_unblocked) {
    throw new Error("PM-34 must remain blocked");
  }
  if (!pm46DiffersFromKnownGood && !v2Args.uses_approval_flag) {
    throw new Error("expected PM-46 to differ from known-good pattern");
  }

  const text = JSON.stringify(diagnosis, null, 2) + "\n";
  assertNoSecrets(text, "diagnosis");
  writeFileSync(OUT, text, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        likely_bad_arg: diagnosis.diagnosis.likely_bad_arg,
        pm46_uses_approval: diagnosis.pm46_runner_findings.uses_approval_flag,
        pm44_uses_approval: v1Args.uses_approval_flag,
      },
      null,
      2
    )
  );
}

main();
