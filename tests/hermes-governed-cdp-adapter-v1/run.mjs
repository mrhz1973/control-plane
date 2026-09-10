import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CODEX_POOL, TIME_ZONE, selectCodexWindowController,
} from "../../tools/select-codex-window-controller-v1.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const adapter = fs.readFileSync(path.join(root, "tools/hermes_governed_cdp_composer_v1.py"), "utf8");
const installer = fs.readFileSync(path.join(root, "tools/apply-hermes-governed-cdp-v1.py"), "utf8");

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
}

test("adapter python syntax", () => {
  const py = process.platform === "win32" ? "python" : "python3";
  execFileSync(py, ["-m", "py_compile", path.join(root, "tools/hermes_governed_cdp_composer_v1.py")], { stdio: "pipe" });
});
test("fixed governed capability and four operations", () => {
  assert.match(adapter, /CONTROL_PLANE_CHATGPT_COMPOSER_CDP/);
  assert.match(adapter, /DISCOVER_CHATGPT_TARGET/);
  assert.match(adapter, /GET_COMPOSER_STATE/);
  assert.match(adapter, /PREFILL_SINGLE_LINE/);
  assert.match(adapter, /CLEAR_COMPOSER/);
  assert.match(adapter, /MAX_PREFILL_LENGTH = 4096/);
});
test("raw CDP and arbitrary controller inputs are absent from public adapter", () => {
  assert.doesNotMatch(adapter, /def\s+browser_cdp\s*\(/);
  assert.doesNotMatch(adapter, /kwargs\.get\(['"]method/);
  assert.doesNotMatch(adapter, /kwargs\.get\(['"]selector/);
  assert.doesNotMatch(adapter, /kwargs\.get\(['"]target_id/);
  assert.match(adapter, /MULTILINE_TEXT_REJECTED/);
  assert.doesNotMatch(adapter, /Enter/);
});
test("CDP method allowlist is fixed and send/navigation domains absent", () => {
  assert.match(adapter, /Target\.getTargets/);
  assert.match(adapter, /Target\.attachToTarget/);
  assert.match(adapter, /Runtime\.evaluate/);
  assert.match(adapter, /Input\.insertText/);
  assert.match(adapter, /Input\.dispatchKeyEvent/);
  assert.doesNotMatch(adapter, /Network\./);
  assert.doesNotMatch(adapter, /Storage\./);
  assert.doesNotMatch(adapter, /Page\.navigate/);
  assert.doesNotMatch(adapter, /Page\.captureScreenshot/);
});
test("adapter rejects forbidden controller arguments and operations", () => {
  const py = process.platform === "win32" ? "python" : "python3";
  const probe = [
    "import importlib.util, json",
    `spec = importlib.util.spec_from_file_location('adapter', ${JSON.stringify(path.join(root, "tools/hermes_governed_cdp_composer_v1.py"))})`,
    "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
    "cases = [",
    "  m.handle(operation='DISCOVER_CHATGPT_TARGET', method='Network.getCookies'),",
    "  m.handle(operation='DISCOVER_CHATGPT_TARGET', selector='body'),",
    "  m.handle(operation='DISCOVER_CHATGPT_TARGET', target_id='arbitrary'),",
    "  m.handle(operation='DISCOVER_CHATGPT_TARGET', javascript='document.body'),",
    "  m.handle(operation='PREFILL_SINGLE_LINE', text='x\\n'),",
    "  m.handle(operation='SEND'),",
    "]",
    "for raw in cases:",
    "  value = json.loads(raw)",
    "  assert value['ok'] is False",
    "  assert value['error'] in {'UNEXPECTED_ARGUMENT', 'MULTILINE_TEXT_REJECTED', 'UNSUPPORTED_OPERATION'}",
  ].join("\n");
  execFileSync(py, ["-c", probe], { stdio: "pipe" });
});
test("installer is version/hash guarded and supports apply verify rollback", () => {
  assert.match(installer, /EXPECTED_ORIGINAL_SHA256/);
  assert.match(installer, /HERMES_VERSION = "0\.21\.0"/);
  assert.match(installer, /choices=\(\"apply\", \"verify\", \"rollback\"\)/);
  assert.match(installer, /atomic_write/);
  assert.match(installer, /RAW_TOOL_NAME = "browser_cdp"/);
  assert.match(installer, /ungoverned browser tool exposed/);
  assert.match(installer, /CONTROL_PLANE_GOVERNED_ADAPTER_ROOT/);
  assert.match(installer, /MCP_GRACE_KEY = "mcp_optional_startup_grace_ms"/);
  assert.match(installer, /MCP_GRACE_KEY\} = 0/);
  assert.match(installer, /required\s*=\s*true/);
  assert.match(installer, /enabled_tools\s*=/);
  assert.match(installer, /enabled_tools = \["\{TOOL_NAME\}"\]/);
});

const ready = { auth_state: "authenticated", qualification_state: "qualified", availability_state: "available", quota_state: "unknown" };
const outside = (iso) => selectCodexWindowController({ now: new Date(iso), codexState: ready, outsideController: "EXISTING" });
const inside = (iso, state = ready) => selectCodexWindowController({ now: new Date(iso), codexState: state, outsideController: "EXISTING" });
test("Europe/Rome 07:59 preserves existing policy", () => assert.equal(outside("2026-01-15T06:59:00Z").selected_controller, "EXISTING"));
test("Europe/Rome 08:00 selects Codex", () => assert.equal(inside("2026-01-15T07:00:00Z").selected_controller, "CODEX_SUBSCRIPTION"));
test("Europe/Rome 11:59 selects Codex", () => assert.equal(inside("2026-01-15T10:59:00Z").selected_controller, "CODEX_SUBSCRIPTION"));
test("Europe/Rome 12:00 preserves existing policy", () => assert.equal(outside("2026-01-15T11:00:00Z").selected_controller, "EXISTING"));
test("CEST boundary is DST-aware", () => {
  assert.equal(outside("2026-07-15T05:59:00Z").window_match, false);
  assert.equal(inside("2026-07-15T06:00:00Z").window_match, true);
  assert.equal(outside("2026-07-15T10:00:00Z").window_match, false);
  assert.equal(TIME_ZONE, "Europe/Rome");
});
test("Codex missing/auth/qualification/unavailable fail closed and deny GLM", () => {
  for (const state of [
    { ...ready, auth_state: "missing" },
    { ...ready, qualification_state: "missing" },
    { ...ready, availability_state: "unavailable" },
    { ...ready, quota_state: "exhausted" },
  ]) {
    const result = inside("2026-01-15T08:00:00Z", state);
    assert.equal(result.selected_controller, null);
    assert.equal(result.glm_eligible, "NO");
    assert.equal(result.quota_pool_id, CODEX_POOL);
  }
});
test("payload proof remains one physical line and hashable", () => {
  const payload = `CODEX_GOVERNED_V7_LONG_BEGIN ${"x".repeat(844)} CODEX_GOVERNED_V7_LONG_END`;
  assert.equal(payload.includes("\n"), false);
  assert.equal(payload.length, 900);
  assert.equal(crypto.createHash("sha256").update(payload).digest("hex").length, 64);
});

if (process.exitCode) process.exit(1);
console.log("FOCUSED_TESTS=PASS");
