// One-shot bounded NON-EDIT smoke for the migrated OpenCode DEV profiles.
// Reuses the PROVEN components verbatim (guard, overlay, permission overlay,
// spawn-target resolution). Read-only prompt; repo untouched; no git writes.
// Usage: node opencode-nomenclature-smoke-v1.mjs <profile_id>
import { startLocalDevGenerationGuard } from "../../../tools/local-dev-generation-guard-v1.mjs";
import { buildOpenCodeProviderOverlay } from "../../../tools/dispatch-opencode-execution-v1.mjs";
import { probeOpenCodeLocal } from "../../../tools/probe-opencode-local-v1.mjs";
import { buildOpenCodeRuntimeConfig, buildPermissionOverlay, resolveOpenCodeSpawnTarget } from "../../../tools/run-local-dev-executor-v1.mjs";
import { mkdtempSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const profileId = process.argv[2];
const allowed = new Set(["qwen38-opus-q3-opencode-24k", "qwen38-opus-q3-opencode-64k"]);
if (!allowed.has(profileId)) {
  console.error(`usage: node opencode-nomenclature-smoke-v1.mjs <${[...allowed].join("|")}>`);
  process.exit(2);
}
const modelSelector = `qwen_local/${profileId}`;

// 1. Probe the installed OpenCode exactly like the runner.
const probe = probeOpenCodeLocal();
if (!probe?.available || !probe.dispatch_interface_resolved) {
  console.error("PREFLIGHT_TOOLING_UNAVAILABLE: opencode probe failed");
  process.exit(1);
}

// resolve real exe (no .cmd shim spawn without shell)
const probePath = probe.executable;
// resolve real package binary exactly like the proven runner (no .cmd shim).
const spawnTarget = resolveOpenCodeSpawnTarget(probePath);
if (!spawnTarget.executable) {
  console.error(`spawn target unresolved: ${spawnTarget.reason_code}`);
  process.exit(1);
}
const exe = spawnTarget.executable;
const isCmd = false;

// 2. Guard: hard 3-generation ceiling, ephemeral port, upstream :8080.
const guard = await startLocalDevGenerationGuard({ maxAgentTurns: 3 });
if (!guard.ready) {
  console.error("guard not ready");
  process.exit(1);
}
await new Promise((r) => setTimeout(r, 200));

// NON-EDIT smoke: deny-all-first ratified V1 overlay with ZERO allowed
// commands (read-only), zero allowed paths, localhost_only network.
const permissionOverlay = buildPermissionOverlay({
  allowedCommands: [],
  allowedPaths: [],
  networkPolicy: "localhost_only",
});
const providerOverlay = buildOpenCodeProviderOverlay({ baseUrl: guard.base_url, modelId: profileId });
const runtimeConfig = buildOpenCodeRuntimeConfig({ providerOverlay, permissionOverlay });
const dir = mkdtempSync(join(tmpdir(), "oc-nomen-smoke-"));
const configPath = join(dir, "opencode.json");
writeFileSync(configPath, JSON.stringify(runtimeConfig), "utf8");

const argv = [
  probe.capabilities.subcommand,
  probe.capabilities.directory_flag, process.cwd(),
  probe.capabilities.model_flag, modelSelector,
  probe.capabilities.format_flag, probe.capabilities.format_json_value,
  probe.capabilities.auto_flag,
  "Read-only nomenclature smoke test. Reply with exactly the single word: ACKNOWLEDGED. Do not read, create, modify, or delete any file.",
];

const t0 = Date.now();
const child = spawn(exe, argv, {
  cwd: process.cwd(),
  // stdin IGNORED — the ratified invocation shape (open stdin pipe stalls
  // OpenCode bootstrap post-init; RETRY4/RETRY5 pre-generation stall).
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
  env: {
    ...process.env,
    OPENCODE_CONFIG: configPath,
    OPENCODE_DISABLE_TITLE: "1",
    OPENCODE_DISABLE_AUTOCOMPACT: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
    OPENCODE_DISABLE_CLAUDE_CODE: "1",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_PRUNE: "1",
  },
  shell: false,
});

let out = "";
let err = "";
child.stdout.on("data", (d) => { out += d; });
child.stderr.on("data", (d) => { err += d; });

const killTimer = setTimeout(() => { try { child.kill(); } catch {} }, 240_000);

const code = await new Promise((resolve) => child.on("close", (c) => resolve(c)));
clearTimeout(killTimer);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const accounting = guard.getAccounting ? guard.getAccounting() : null;
await guard.close();
try { unlinkSync(configPath); } catch {}

const summary = {
  profile_id: profileId,
  model_selector: modelSelector,
  exit_code: code,
  seconds: Number(secs),
  guard_accounting: accounting,
  stdout_excerpt: out.slice(0, 400),
  stderr_excerpt: err.slice(0, 400),
};
console.log(JSON.stringify(summary, null, 2));
process.exit(code === 0 ? 0 : 1);
