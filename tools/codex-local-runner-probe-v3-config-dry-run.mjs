#!/usr/bin/env node
/**
 * PM-47 — Proposed PM-48 runner v3 config (dry-run only; never invokes Codex).
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hasForbidden } from "./codex-runner-classify.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(
  ROOT,
  "docs/examples/pm47-codex-runner-v3-config.sample.json"
);

const FORBIDDEN_FLAGS = [
  "--approval",
  "--ask-for-approval",
  "--dangerously-bypass-approvals-and-sandbox",
  "danger-full-access",
];

const ARGS_PATTERN = [
  "exec",
  "--sandbox",
  "read-only",
  "--cd",
  "<repo>",
  "<prompt>",
];

function main() {
  const config = {
    schema_version: "pm47-codex-runner-v3-config-v1",
    source: "dry-run-config",
    codex_invoked: false,
    shell_invoked: false,
    runner_version: "v3",
    args_pattern: ARGS_PATTERN,
    removed_flags: ["--approval"],
    forbidden_flags_absent: true,
    prompt_delivery: "single_argument_known_good_pattern",
    fallback_future_option: "prompt_file_or_stdin_if_v3_still_exit_2",
    one_shot_only: true,
    n8n_touched: false,
    worker_enabled: false,
    pm34_unblocked: false,
    notes: [
      "Matches PM-35/36/38 known-good manual argv order.",
      "Does not pass approval CLI flag; approval never observed in metadata only.",
      "PM-48 must be one Codex invocation with no retry.",
    ],
  };

  const activeArgs = JSON.stringify(config.args_pattern);
  for (const flag of FORBIDDEN_FLAGS) {
    if (activeArgs.includes(flag)) {
      throw new Error(`forbidden flag in v3 args_pattern: ${flag}`);
    }
  }
  const serialized = JSON.stringify(config);
  if (config.pm34_unblocked) throw new Error("PM-34 must remain blocked");
  if (hasForbidden(serialized)) throw new Error("forbidden pattern in config");

  writeFileSync(OUT, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ ok: true, runner_version: "v3" }, null, 2));
}

main();
