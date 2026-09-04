#!/usr/bin/env node
/**
 * V4 — OpenCode executable resolution (shared helper, no-shell, fail-closed).
 *
 * Windows npm-shim spawn fix: spawn() with shell:false cannot execute
 * `.cmd` shims (EINVAL), and shell:true is forbidden (Node DEP0190 +
 * injection surface). Resolve the REAL package executable instead of the
 * shim so argv stays literal data. Shared by the live runner and the local
 * CLI probe; imports node builtins only (no circular dependencies).
 *
 * Resolution order (when the requested executable is a `.cmd`/`.bat` shim):
 *   1. %APPDATA%\npm\node_modules\opencode-ai\bin\opencode.exe  (real binary)
 *   2. <dir(executable)>\node_modules\opencode-ai\bin\opencode.exe
 * A shim that cannot be resolved to the real binary is rejected fail-closed
 * (never silently shelled out).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export function resolveOpenCodeSpawnTarget(executable) {
  const exe = String(executable || "").trim();
  const isCmdShim = /\.cmd$/i.test(exe) || /\.bat$/i.test(exe);
  if (!isCmdShim) {
    return { executable: exe, resolved_from: "direct" };
  }
  const candidates = [];
  const appdata = process.env.APPDATA;
  if (appdata) {
    candidates.push(join(appdata, "npm", "node_modules", "opencode-ai", "bin", "opencode.exe"));
  }
  candidates.push(join(dirname(exe), "node_modules", "opencode-ai", "bin", "opencode.exe"));
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return { executable: candidate, resolved_from: "npm-package-real-binary" };
    }
  }
  return {
    executable: null,
    resolved_from: "unresolved_cmd_shim",
    reason_code: "OPENCODE_CMD_SHIM_UNRESOLVED",
    reason: "opencode resolved to a .cmd shim and the real package binary was not found; refusing shell fallback",
  };
}
