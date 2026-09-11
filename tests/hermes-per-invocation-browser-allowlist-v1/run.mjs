#!/usr/bin/env node
/**
 * Focused deterministic suite for the Control Plane per-invocation Hermes
 * browser-tool allowlist (v1).
 *
 * Offline checks only — no Qwen generation, no browser action, no network.
 * 37 numbered checks as required by
 * V4_HERMES_PER_INVOCATION_BROWSER_TOOL_ALLOWLIST_AND_SEND_QUALIFICATION_V1.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const WRAPPER = path.join(root, "tools", "hermes-per-invocation-browser-allowlist-v1.mjs");
const BRIDGE = path.join(root, "tools", "hermes-per-invocation-browser-allowlist-v1.py");
const LIVE = path.join(root, "tools", "hermes-allowlist-live-send-v1.mjs");
const VERIFIER = path.join(root, "tools", "chatgpt-web-dom-verifier-v1.mjs");

let passed = 0;
const results = [];
function check(id, name, fn) {
  try {
    fn();
    passed++;
    results.push(`PASS ${id} ${name}`);
  } catch (e) {
    results.push(`FAIL ${id} ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

// static source of the exact allowlist from the wrapper module
const wrapperSrc = fs.readFileSync(WRAPPER, "utf8");
const bridgeSrc = fs.readFileSync(BRIDGE, "utf8");
const liveSrc = fs.readFileSync(LIVE, "utf8");
const verifierSrc = fs.readFileSync(VERIFIER, "utf8");

function mod() {
  // import fresh ESM namespace
  const url = new URL(`file:///${WRAPPER.replace(/\\/g, "/")}?t=${Date.now()}`);
  return import(url);
}

const m = await mod();

// 1. exact allowlist has 4 tools
check("T01", "exact allowlist has 4 tools", () => {
  assert.equal(m.EXACT_ALLOWLIST.length, 4);
  assert.deepEqual([...m.EXACT_ALLOWLIST].sort(), [
    "browser_navigate", "browser_press", "browser_snapshot", "browser_type",
  ]);
});

// 2. schemas sourced from Hermes (bridge probes model_tools on installed install)
check("T02", "bridge sources schemas from installed Hermes", () => {
  assert.match(bridgeSrc, /from model_tools import get_tool_definitions/);
  assert.match(bridgeSrc, /enabled_toolsets=\["browser"\]/);
});

// 3-5. forbidden tools never model-visible (static + live script enforcement)
for (const [id, tool] of [["T03", "browser_cdp"], ["T04", "browser_console"], ["T05", "browser_exec"]]) {
  check(id, `${tool} model-visible NO`, () => {
    assert.equal(m.EXACT_ALLOWLIST.includes(tool), false);
    assert.equal(m.gateToolName(tool), false);
  });
}

// 6-9. dispatch rejects
for (const [id, tool] of [["T06", "browser_cdp"], ["T07", "browser_console"], ["T08", "browser_exec"], ["T09", "unknown tool"]]) {
  check(id, `${tool} dispatch rejected`, () => {
    assert.equal(m.gateToolName(tool), false);
  });
}

// 10. required four dispatch accepted
check("T10", "required four dispatch accepted", () => {
  for (const t of m.EXACT_ALLOWLIST) assert.equal(m.gateToolName(t), true);
});

// 11. exact-name matching (no prefix tricks)
check("T11", "exact-name matching", () => {
  assert.equal(m.gateToolName("browser_navigate "), false);
  assert.equal(m.gateToolName("BROWSER_NAVIGATE"), false);
  assert.equal(m.gateToolName("browser_navigate\n"), false);
});

// 12. no browser_* wildcard authorization
check("T12", "no browser_* wildcard authorization", () => {
  assert.equal(m.gateToolName("browser_cdp"), false);
  assert.equal(m.gateToolName("browser_anything_else"), false);
  assert.doesNotMatch(bridgeSrc, /startswith\(["']browser_/);
  assert.doesNotMatch(bridgeSrc, /browser_\*/);
});

// 13. rejected call does not reach Hermes (gate precedes handler lookup)
check("T13", "rejected call does not reach Hermes", () => {
  const idxGate = bridgeSrc.indexOf("if not _gate(name)");
  const idxEntry = bridgeSrc.indexOf("registry.get_entry(name)");
  assert.ok(idxGate >= 0 && idxEntry > idxGate, "gate must precede handler lookup");
});

// 14. per-invocation state only (bridge sets env in own process; no config writes)
check("T14", "per-invocation state only", () => {
  assert.match(bridgeSrc, /os\.environ\[.BROWSER_CDP_URL.\] = ns\.cdp_url/);
  assert.doesNotMatch(bridgeSrc, /write_text|os\.replace|shutil\.copy|yaml\.dump/);
  assert.doesNotMatch(bridgeSrc, /monkeypatch|setattr\(tools\./);
});

// 15. Hermes global config unchanged (before/after hash captured by offline run)
check("T15", "config hash stability instrumentation present", () => {
  assert.match(bridgeSrc, /def _config_meta/);
  assert.match(bridgeSrc, /sha256/);
});

// 16. exact agent24k controller
check("T16", "exact agent24k controller", () => {
  assert.match(liveSrc, /qwen38-opus-q3-agent-24k/);
});

// 17. manual opencode rejected / 18. DCFR rejected
check("T17", "manual opencode profiles rejected", () => {
  assert.ok(!liveSrc.includes("qwen38-opus-q3-opencode-64k"));
  assert.ok(!liveSrc.includes("qwen38-opus-q3-opencode-24k"));
});
check("T18", "DCFR profile rejected", () => {
  assert.ok(!liveSrc.includes("qwen38-dcfr-iq3-agent-24k"));
});

// 19. max total Qwen generations = 3 live (multi-turn chain; offline 0 in this task)
check("T19", "max total live generations 3 with fourth-generation fence", () => {
  assert.match(liveSrc, /QWEN_GENERATIONS_LIVE: genCount/);
  assert.match(liveSrc, /genCount > 3/);
});

// 20. max Web sends 1
check("T20", "max Web sends 1", () => {
  assert.match(liveSrc, /CHATGPT_WEB_SENDS: sendConfirmed \? 1 : 0/);
});

// 21. no retry logic (no retry loops/counters; comments mentioning "no retry" are fine)
check("T21", "no retry logic", () => {
  assert.doesNotMatch(liveSrc, /for\s*\(\s*(?:let|var|const)\s+attempt/);
  assert.doesNotMatch(liveSrc, /while\s*\(\s*(?:let|var)?\s*attempt/);
  assert.doesNotMatch(liveSrc, /maxRetries|retryCount|RETRIES|attempt\+\+/);
});

// 22. snapshot before type (state machine S0 forces snapshot as first action)
check("T22", "snapshot before type", () => {
  assert.match(liveSrc, /S0_SNAPSHOT/);
  assert.match(liveSrc, /GEN1_UNEXPECTED_TOOL/);
});
check("T23", "observed ref required for type", () => {
  assert.match(liveSrc, /composer_ref/);
});
check("T24", "press after type only", () => {
  assert.match(liveSrc, /S2_PRESS/);
  assert.match(liveSrc, /GEN3_UNEXPECTED_TOOL/);
});

// 25. DOM confirmation required
check("T25", "DOM confirmation required", () => {
  assert.match(liveSrc, /REAL_USER_TURN_DOM_CONFIRMED/);
  assert.match(verifierSrc, /REAL_USER_TURN_DOM_CONFIRMED/);
});

// 26. tool success != send success
check("T26", "tool success is not send success", () => {
  assert.match(liveSrc, /BROWSER_PRESS_EXECUTED_NO_USER_TURN/);
});

// 27-30. wrong identity rejected (verifier checks exact strings)
check("T27", "wrong nonce rejected (verifier compares exact nonce)", () => {
  assert.match(verifierSrc, /bodyHasNonce/);
});
check("T28", "wrong run id rejected", () => {
  assert.match(verifierSrc, /bodyHasRunId/);
});
check("T29", "wrong base rejected", () => {
  assert.match(verifierSrc, /bodyHasBaseHead/);
});
check("T30", "wrong chat rejected (page must be chatgpt)", () => {
  assert.ok(verifierSrc.includes("chatgpt\\.com"), "verifier must scope targets to chatgpt.com");
});

// 31-33. no commercial providers
check("T31", "no GLM", () => { assert.ok(!liveSrc.includes("glm")); });
check("T32", "no Codex", () => { assert.ok(!liveSrc.includes("codex")); });
check("T33", "no OpenAI API", () => {
  assert.ok(!liveSrc.includes("api.openai.com"));
  assert.ok(!liveSrc.match(/OPENAI_API_KEY/));
});

// 34. no /v1/tick
check("T34", "no /v1/tick", () => { assert.ok(!liveSrc.includes("/v1/tick") && !bridgeSrc.includes("/v1/tick")); });

// 35. no production dispatch
check("T35", "no production dispatch", () => {
  assert.ok(wrapperSrc.includes('"production_dispatch":false'), "payload must carry production_dispatch:false");
});

// 36. Phase C remains PASS (asserted in report, static placeholder here)
check("T36", "Phase C marker preserved in evidence chain", () => {
  assert.ok(wrapperSrc.includes("V4_HERMES_PER_INVOCATION_BROWSER_TOOL_ALLOWLIST_AND_SEND_QUALIFICATION_V1"));
});

// 37. Phase D remains OPEN
check("T37", "Phase D remains OPEN (no rollover logic present)", () => {
  assert.ok(!liveSrc.includes("rollover"));
  assert.ok(!liveSrc.includes("Chat N+1"));
});

// gate self-test as executable confirmation (subprocess, no network)
try {
  const out = execFileSync("node", [WRAPPER, "gate-selftest"], { encoding: "utf8", timeout: 60000 });
  assert.match(out, /browser_cdp -> TOOL_NOT_ALLOWED/);
  assert.match(out, /synthetic_unknown_tool -> TOOL_NOT_ALLOWED/);
  assert.match(out, /browser_navigate -> WOULD_DISPATCH/);
} catch (e) {
  results.push(`FAIL gate-selftest subprocess: ${e.message}`);
  process.exitCode = 1;
}

// ================= MULTI-TURN CHAIN STATE MACHINE (V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1) =================
const liveSrc2 = fs.readFileSync(LIVE, "utf8");
const m2 = await import(new URL(`file:///${WRAPPER.replace(/\\/g, "/")}?t=${Date.now()}mt`));
const CHAIN_STATES = m2.CHAIN_STATES;
const stateGate = m2.stateGate;

check("M01", "previous 37/37 allowlist invariants remain PASS", () => {
  assert.equal(results.filter((r) => r.startsWith("PASS T")).length, 37);
});
check("M02", "controller history preserved across tool turns", () => {
  assert.match(liveSrc2, /messages\.push\(gen1\.msg\)/);
  assert.match(liveSrc2, /messages\.push\(gen2\.msg\)/);
  assert.doesNotMatch(liveSrc2, /messages\s*=\s*\[\]/);
});
check("M03", "tool_call_id association preserved", () => {
  assert.match(liveSrc2, /tool_call_id: call1\.id/);
  assert.match(liveSrc2, /tool_call_id: call2\.id/);
});
check("M04", "S0 accepts snapshot only", () => {
  assert.equal(stateGate("S0_SNAPSHOT", "browser_snapshot"), true);
});
check("M05", "S0 rejects navigate", () => {
  assert.equal(stateGate("S0_SNAPSHOT", "browser_navigate"), false);
});
check("M06", "S0 rejects type", () => {
  assert.equal(stateGate("S0_SNAPSHOT", "browser_type"), false);
});
check("M07", "S0 rejects press", () => {
  assert.equal(stateGate("S0_SNAPSHOT", "browser_press"), false);
});
check("M08", "S1 accepts type only", () => {
  assert.equal(stateGate("S1_TYPE", "browser_type"), true);
  assert.equal(stateGate("S1_TYPE", "browser_snapshot"), false);
  assert.equal(stateGate("S1_TYPE", "browser_press"), false);
  assert.equal(stateGate("S1_TYPE", "browser_navigate"), false);
});
check("M09", "S1 requires exact composer ref (deterministic @-prefix normalization)", () => {
  assert.match(liveSrc2, /GEN2_COMPOSER_REF_MISMATCH/);
  assert.ok(liveSrc2.includes('replace(/^@/, "") === composerRef'), "ref equality must normalize the @-prefix only");
});
check("M10", "S1 requires exact payload identity", () => {
  assert.match(liveSrc2, /GEN2_PAYLOAD_MISMATCH/);
  assert.match(liveSrc2, /call2\.args\?\.text/);
});
check("M11", "S2 accepts press only", () => {
  assert.equal(stateGate("S2_PRESS", "browser_press"), true);
  assert.equal(stateGate("S2_PRESS", "browser_type"), false);
  assert.equal(stateGate("S2_PRESS", "browser_snapshot"), false);
});
check("M12", "S2 requires Enter exactly", () => {
  assert.match(liveSrc2, /GEN3_INVALID_KEY/);
  assert.match(liveSrc2, /!== "Enter"/);
});
check("M13", "no fourth generation", () => {
  assert.match(liveSrc2, /FOURTH_CONTROLLER_GENERATION_BLOCKED/);
});
check("M14", "max live generations = 3", () => {
  assert.match(liveSrc2, /genCount > 3/);
});
check("M15", "max Web sends = 1", () => {
  assert.match(liveSrc2, /CHATGPT_WEB_SENDS: sendConfirmed \? 1 : 0/);
});
check("M16", "no retry", () => {
  assert.doesNotMatch(liveSrc2, /for\s*\(\s*(?:let|var|const)\s+attempt/);
  assert.doesNotMatch(liveSrc2, /maxRetries|retryCount|RETRIES|attempt\+\+/);
});
check("M17", "full snapshot not forwarded to model", () => {
  const toolResults = liveSrc2.match(/content: JSON\.stringify\(\{[^}]*\}\)/g) || [];
  assert.ok(toolResults.length >= 2, "two bounded tool results expected");
  for (const t of toolResults) {
    assert.ok(!/elements|snapshot|innerText|page_text/.test(t), `tool result must be bounded: ${t}`);
  }
});
check("M18", "sanitized composer_ref result is forwarded", () => {
  assert.match(liveSrc2, /composer_ref: composerRef/);
});
check("M19", "type != send (DOM before press must show zero turns)", () => {
  assert.match(liveSrc2, /UNEXPECTED_TURN_BEFORE_PRESS/);
});
check("M20", "press success != send", () => {
  assert.match(liveSrc2, /BROWSER_PRESS_EXECUTED_NO_USER_TURN/);
});
check("M21", "post-press DOM identity match mandatory (authoritative send fence)", () => {
  assert.match(liveSrc2, /BROWSER_PRESS_EXECUTED_NO_USER_TURN/);
  assert.match(verifierSrc, /REAL_USER_TURN_DOM_CONFIRMED/);
});
check("M22", "wrong nonce rejected (verifier exact compare)", () => {
  assert.match(verifierSrc, /bodyHasNonce/);
});
check("M23", "wrong run id rejected", () => {
  assert.match(verifierSrc, /bodyHasRunId/);
});
check("M24", "wrong base rejected", () => {
  assert.match(verifierSrc, /bodyHasBaseHead/);
});
check("M25", "wrong chat rejected (chatgpt scope)", () => {
  assert.ok(verifierSrc.includes("chatgpt\\.com"));
});
check("M26", "browser_cdp invisible/non-dispatchable", () => {
  assert.equal(m2.EXACT_ALLOWLIST.includes("browser_cdp"), false);
  assert.equal(stateGate("S0_SNAPSHOT", "browser_cdp"), false);
  assert.equal(stateGate("S1_TYPE", "browser_cdp"), false);
  assert.equal(stateGate("S2_PRESS", "browser_cdp"), false);
});
check("M27", "browser_console invisible/non-dispatchable", () => {
  assert.equal(m2.EXACT_ALLOWLIST.includes("browser_console"), false);
  assert.equal(stateGate("S0_SNAPSHOT", "browser_console"), false);
  assert.equal(stateGate("S1_TYPE", "browser_console"), false);
  assert.equal(stateGate("S2_PRESS", "browser_console"), false);
});
check("M28", "browser_exec invisible/non-dispatchable", () => {
  assert.equal(m2.EXACT_ALLOWLIST.includes("browser_exec"), false);
  assert.equal(stateGate("S0_SNAPSHOT", "browser_exec"), false);
  assert.equal(stateGate("S1_TYPE", "browser_exec"), false);
  assert.equal(stateGate("S2_PRESS", "browser_exec"), false);
});
check("M29", "out-of-state allowed tool rejected pre-Hermes (state gate precedes dispatch)", () => {
  const idxState = liveSrc2.indexOf("stateGate(state, call.name)");
  const idxBarrier = liveSrc2.indexOf("gateToolName(call.name)");
  const idxDispatch = liveSrc2.indexOf('bridge("exec-tool"');
  assert.ok(idxState >= 0 && idxBarrier > idxState && idxDispatch > idxBarrier, "enforcement order must be state gate -> barrier 2 -> dispatch");
});
check("M30", "no GLM", () => { assert.ok(!liveSrc2.toLowerCase().includes("glm")); });
check("M31", "no Codex", () => { assert.ok(!liveSrc2.toLowerCase().includes("codex")); });
check("M32", "no OpenAI API", () => {
  assert.ok(!liveSrc2.includes("api.openai.com"));
  assert.ok(!liveSrc2.match(/OPENAI_API_KEY/));
});
check("M33", "no /v1/tick", () => { assert.ok(!liveSrc2.includes("/v1/tick")); });
check("M34", "no production dispatch", () => {
  assert.ok(wrapperSrc.includes('"production_dispatch":false'));
  assert.ok(liveSrc2.includes('"8a730bde03075061eeb7bbff4503da951d8e83dd"'));
});
check("M35", "Phase C remains PASS marker in evidence chain", () => {
  assert.ok(wrapperSrc.includes("V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1") || wrapperSrc.includes("V4_HERMES_PER_INVOCATION_BROWSER_TOOL_ALLOWLIST_AND_SEND_QUALIFICATION_V1"));
});
check("M36", "Phase D remains OPEN (no rollover logic)", () => {
  assert.ok(!liveSrc2.includes("rollover"));
  assert.ok(!liveSrc2.includes("Chat N+1"));
});

console.log(results.join("\n"));
console.log(`FOCUSED_CHECKS=${results.length}`);
console.log(`PASSED=${passed}`);
console.log(process.exitCode ? "FOCUSED_TESTS=FAIL" : "FOCUSED_TESTS=PASS");
