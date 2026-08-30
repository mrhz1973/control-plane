#!/usr/bin/env node
/**
 * V4 — read-only local OpenCode CLI probe (opencode-ai npm package).
 * No generation. No provider authentication.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const PROBE_SCHEMA = "opencode-local-probe-v1";
export const DISPATCH_SUBCOMMAND = "run";

/** CLI flags established from opencode 1.18.x --help (noninteractive dispatch). */
export const DISPATCH_CLI_CAPABILITIES = Object.freeze({
  subcommand: DISPATCH_SUBCOMMAND,
  model_flag: "-m",
  model_format: "provider/model",
  directory_flag: "--dir",
  format_flag: "--format",
  format_json_value: "json",
  auto_flag: "--auto",
  message_positionals: true,
});

function resolveDefaultExecutable() {
  if (process.platform === "win32") {
    const npmShim = join(homedir(), "AppData", "Roaming", "npm", "opencode.cmd");
    if (existsSync(npmShim)) return npmShim;
  }
  return "opencode";
}

function runOpencode(args, options = {}) {
  const executable = options.executable || resolveDefaultExecutable();
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    windowsHide: true,
    timeout: options.timeoutMs || 15_000,
    shell: process.platform === "win32",
  });
  return {
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error || null,
  };
}

function parseVersion(stdout) {
  const line = stdout.split(/\r?\n/).find((l) => /^\d+\.\d+\.\d+/.test(l.trim()));
  return line ? line.trim() : null;
}

/**
 * Probe local OpenCode CLI availability and noninteractive dispatch interface.
 *
 * options.executable — default "opencode"
 * options.runHelp — injectable for tests
 */
export function probeOpenCodeLocal(options = {}) {
  const executable = options.executable || resolveDefaultExecutable();
  const run = options.run || ((args) => runOpencode(args, { executable }));

  const versionRun = run(["--version"]);
  if (versionRun.error || versionRun.status !== 0) {
    return {
      schema_version: PROBE_SCHEMA,
      available: false,
      version: null,
      executable,
      dispatch_interface_resolved: false,
      reason_code: "OPENCODE_EXECUTABLE_NOT_FOUND",
      capabilities: null,
    };
  }

  const version = parseVersion(versionRun.stdout);
  if (!version) {
    return {
      schema_version: PROBE_SCHEMA,
      available: false,
      version: null,
      executable,
      dispatch_interface_resolved: false,
      reason_code: "OPENCODE_VERSION_UNPARSEABLE",
      capabilities: null,
    };
  }

  const runHelp = run(["run", "--help"]);
  if (runHelp.error || runHelp.status !== 0) {
    return {
      schema_version: PROBE_SCHEMA,
      available: true,
      version,
      executable,
      dispatch_interface_resolved: false,
      reason_code: "OPENCODE_RUN_HELP_UNAVAILABLE",
      capabilities: null,
    };
  }

  const help = `${runHelp.stdout}\n${runHelp.stderr}`;
  const hasRun = /\brun\b/.test(help);
  const hasModel = /\s-m,\s*--model\b/.test(help) || /--model\b/.test(help);
  const hasDir = /--dir\b/.test(help);
  const hasFormat = /--format\b/.test(help);
  const hasAuto = /--auto\b/.test(help);
  const hasMessage = /\bmessage\b/.test(help);

  if (!(hasRun && hasModel && hasDir && hasFormat && hasAuto && hasMessage)) {
    return {
      schema_version: PROBE_SCHEMA,
      available: true,
      version,
      executable,
      dispatch_interface_resolved: false,
      reason_code: "OPENCODE_RUN_INTERFACE_INCOMPLETE",
      capabilities: null,
    };
  }

  return {
    schema_version: PROBE_SCHEMA,
    available: true,
    version,
    executable,
    dispatch_interface_resolved: true,
    reason_code: "PASS",
    capabilities: { ...DISPATCH_CLI_CAPABILITIES },
  };
}

export function opencodeResourceEntryReady(updatedAt) {
  return {
    available: true,
    quota_remaining: { value: null, unit: "unlimited" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode: "free",
    location: "local",
    source: "local_probe",
    updated_at: updatedAt,
  };
}

export function opencodeResourceEntryUnavailable(updatedAt) {
  return {
    available: false,
    quota_remaining: { value: null, unit: "unknown" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode: "free",
    location: "local",
    source: "local_probe",
    updated_at: updatedAt,
  };
}
