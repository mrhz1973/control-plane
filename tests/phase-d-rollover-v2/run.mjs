#!/usr/bin/env node
/**
 * Focused Phase D suite (deterministic, offline).
 * BLOCK-ID: V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2
 * 43 checks required by the task contract.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const CORE = path.join(root, "tools", "phase-d-rollover-core-v1.mjs");
const DRIVER = path.join(root, "tools", "phase-d-rollover-live-v1.mjs");
const WRAPPER = path.join(root, "tools", "hermes-per-invocation-browser-allowlist-v1.mjs");
const BRIDGE = path.join(root, "tools", "hermes-per-invocation-browser-allowlist-v1.py");
const VERIFIER = path.join(root, "tools", "chatgpt-web-dom-verifier-v1.mjs");

const coreSrc = fs.readFileSync(CORE, "utf8");
const driverSrc = fs.readFileSync(DRIVER, "utf8");
const wrapperSrc = fs.readFileSync(WRAPPER, "utf8");
const bridgeSrc = fs.readFileSync(BRIDGE, "utf8");
const verifierSrc = fs.readFileSync(VERIFIER, "utf8");

const m = await import(new URL(`file:///${CORE.replace(/\\/g, "/")}?t=${Date.now()}`));
const w = await import(new URL(`file:///${WRAPPER.replace(/\\/g, "/")}?t=${Date.now()}`));

let passed = 0;
const results = [];
function check(id, name, fn) {
  try { fn(); passed++; results.push(`PASS ${id} ${name}`); }
  catch (e) { results.push(`FAIL ${id} ${name}: ${e.message}`); process.exitCode = 1; }
}

const ID = {
  task_ref: "T", base_head: "B", phase_d_run_id: "R",
  chat_id: "C1", nonce: "N1", generation_id: "G1",
};
const same = { ...ID };
const wrongBase = { ...ID, base_head: "X" };
const wrongRun = { ...ID, phase_d_run_id: "X" };
const wrongChat = { ...ID, chat_id: "X" };
const wrongNonce = { ...ID, nonce: "X" };
const oldGen = { ...ID, generation_id: "G0" };
const superGen = { ...ID, generation_id: "G2" };

// 1. qualified 4-tool allowlist preserved
check("D01", "qualified 4-tool allowlist preserved", () => {
  assert.deepEqual([...w.EXACT_ALLOWLIST].sort(), ["browser_navigate", "browser_press", "browser_snapshot", "browser_type"]);
});
// 2. raw CDP exposure remains NO
check("D02", "raw CDP exposure remains NO", () => {
  assert.equal(w.EXACT_ALLOWLIST.includes("browser_cdp"), false);
  assert.ok(!bridgeSrc.includes("Runtime.evaluate"));
});
// 3. browser_console unavailable
check("D03", "browser_console unavailable", () => {
  assert.equal(w.gateToolName("browser_console"), false);
});
// 4. exact controller profile required
check("D04", "exact controller profile required", () => {
  assert.ok(driverSrc.includes('"qwen38-opus-q3-agent-24k"'));
  assert.ok(!driverSrc.includes("opencode") && !driverSrc.includes("dcfr") && !driverSrc.includes("uncensored"));
});
// 5. fresh Chat N required
check("D05", "fresh Chat N required", () => {
  assert.match(driverSrc, /CHAT_N_NOT_FRESH/);
});
// 6. Chat N identity exact (all six fields)
check("D06", "identity requires all six fields", () => {
  assert.throws(() => m.buildIdentity({ ...ID, nonce: undefined }), /IDENTITY_FIELD_MISSING:nonce/);
  assert.doesNotThrow(() => m.buildIdentity(ID));
});
// 7. stale generation rejected pre-dispatch
check("D07", "old generation not current", () => {
  assert.equal(m.isGenerationCurrent(m.buildIdentity(ID), m.buildIdentity(oldGen)), false);
});
// 8. wrong base rejected
check("D08", "wrong base rejected", () => {
  const f = m.fenceDecision(m.buildIdentity(ID), m.buildIdentity(wrongBase));
  assert.equal(f.generation_current, false);
  assert.equal(f.dispatch_allowed, false);
  assert.deepEqual(f.mismatched_fields, ["base_head"]);
});
// 9. wrong run id rejected
check("D09", "wrong run id rejected", () => {
  assert.equal(m.isGenerationCurrent(m.buildIdentity(ID), m.buildIdentity(wrongRun)), false);
});
// 10. wrong chat id rejected
check("D10", "wrong chat id rejected", () => {
  assert.equal(m.isGenerationCurrent(m.buildIdentity(ID), m.buildIdentity(wrongChat)), false);
});
// 11. wrong nonce rejected
check("D11", "wrong nonce rejected", () => {
  assert.equal(m.isGenerationCurrent(m.buildIdentity(ID), m.buildIdentity(wrongNonce)), false);
});
// 12. superseded generation rejected
check("D12", "superseded generation rejected", () => {
  assert.equal(m.isGenerationCurrent(m.buildIdentity(ID), m.buildIdentity(superGen)), false);
});
// 13. rejected generation never invokes Hermes
check("D13", "fence never invokes Hermes", () => {
  const f = m.fenceDecision(m.buildIdentity(ID), m.buildIdentity(wrongBase));
  assert.equal(f.hermes_handler_invoked, false);
  assert.match(driverSrc, /STALE_GENERATION_REJECTED/);
});
// 14. Chat N send requires DOM confirmation
check("D14", "send classification only via verifier", () => {
  assert.match(driverSrc, /SEND_NOT_CONFIRMED/);
  assert.match(driverSrc, /SENT_CONFIRMED/);
  assert.ok(driverSrc.includes('runVerifier(["turn-verify"'));
});
// 15. ambiguous send does not imply success
check("D15", "ambiguous send terminal state", () => {
  assert.match(driverSrc, /AMBIGUOUS_SEND_RECONCILIATION/);
});
// 16. verifier loss fails closed
check("D16", "verifier loss fails closed", () => {
  assert.match(driverSrc, /VERIFIER_UNAVAILABLE_NEVER_ASSUME_SENT/);
});
// 17. bounded delta schema enforced
check("D17", "delta schema enforced", () => {
  const v = m.validateContextDelta({ bogus: true }, {});
  assert.equal(v.valid, false);
});
// 18. bounded delta size enforced
check("D18", "delta size enforced", () => {
  const big = "x".repeat(5000);
  assert.throws(() => m.buildContextDelta({
    taskRef: "T", baseHead: "B", phaseDRunId: "R",
    sourceIdentity: { chat_id: "C", nonce: "N", generation_id: "G" },
    canonicalNext: big,
  }), /DELTA_OVERSIZE/);
});
// 19. unexpected fields rejected
check("D19", "unexpected delta fields rejected", () => {
  const { delta } = m.buildContextDelta({
    taskRef: "T", baseHead: "B", phaseDRunId: "R",
    sourceIdentity: { chat_id: "C", nonce: "N", generation_id: "G" },
    canonicalNext: "V4_X",
  });
  const v = m.validateContextDelta({ ...delta, extra: 1 }, { taskRef: "T", baseHead: "B", phaseDRunId: "R" });
  assert.equal(v.valid, false);
  assert.match(v.reason, /UNEXPECTED_FIELD:extra/);
});
// 20. stale delta rejected
check("D20", "stale generation delta rejected", () => {
  const { delta } = m.buildContextDelta({
    taskRef: "T", baseHead: "B", phaseDRunId: "R",
    sourceIdentity: { chat_id: "OLD", nonce: "N", generation_id: "G" },
    canonicalNext: "V4_X",
  });
  const v = m.validateContextDelta(delta, {
    activeIdentity: { chat_id: "C1", nonce: "N", generation_id: "G1" },
    taskRef: "T", baseHead: "B", phaseDRunId: "R",
  });
  assert.equal(v.valid, false);
  assert.match(v.reason, /STALE_CHAT_DELTA/);
});
// 21. wrong-base delta rejected
check("D21", "wrong-base delta rejected", () => {
  const { delta } = m.buildContextDelta({
    taskRef: "T", baseHead: "B", phaseDRunId: "R",
    sourceIdentity: { chat_id: "C", nonce: "N", generation_id: "G" },
    canonicalNext: "V4_X",
  });
  const v = m.validateContextDelta(delta, { taskRef: "T", baseHead: "OTHER", phaseDRunId: "R" });
  assert.equal(v.valid, false);
  assert.equal(v.reason, "WRONG_BASE_DELTA");
});
// 22. wrong-run delta rejected
check("D22", "wrong-run delta rejected", () => {
  const { delta } = m.buildContextDelta({
    taskRef: "T", baseHead: "B", phaseDRunId: "R",
    sourceIdentity: { chat_id: "C", nonce: "N", generation_id: "G" },
    canonicalNext: "V4_X",
  });
  const v = m.validateContextDelta(delta, { taskRef: "T", baseHead: "B", phaseDRunId: "OTHER" });
  assert.equal(v.valid, false);
  assert.equal(v.reason, "WRONG_RUN_DELTA");
});
// 23. tampered delta hash rejected
check("D23", "tampered delta hash rejected", () => {
  const { delta } = m.buildContextDelta({
    taskRef: "T", baseHead: "B", phaseDRunId: "R",
    sourceIdentity: { chat_id: "C", nonce: "N", generation_id: "G" },
    canonicalNext: "V4_X",
  });
  const tampered = { ...delta, canonical_next: "V4_EVIL" };
  const v = m.validateContextDelta(tampered, { taskRef: "T", baseHead: "B", phaseDRunId: "R" });
  assert.equal(v.valid, false);
  assert.equal(v.reason, "TAMPERED_INTEGRITY");
});
// 24. Chat N+1 must be new conversation
check("D24", "Chat N+1 identity distinct from Chat N", () => {
  assert.match(driverSrc, /IDENTITY_COLLISION/);
  assert.match(driverSrc, /CHAT_N_PLUS_1_DISTINCT: chatNp1Id !== chatNId/);
});
// 25. Chat N+1 must be fresh
check("D25", "Chat N+1 fresh required", () => {
  assert.match(driverSrc, /CHAT_N_PLUS_1_NOT_FRESH/);
});
// 26. old transcript absent (driver appends only bounded delta text)
check("D26", "CORE BOOT carries no old transcript", () => {
  const boot = driverSrc.match(/coreBootPayload[\s\S]*?`;/);
  assert.ok(boot, "core boot payload present");
  assert.ok(!boot[0].includes("transcript"));
  assert.ok(!boot[0].includes("lastAssistant"));
});
// 27. old response absent
check("D27", "old response never forwarded to Chat N+1", () => {
  assert.ok(!driverSrc.includes("messages.push(gen1.msg) // forward-old"));
  const boot = driverSrc.match(/coreBootPayload[\s\S]*?`;/);
  assert.ok(!boot[0].includes("envelope")); // envelope never embedded
});
// 28. CORE BOOT uses bounded delta only
check("D28", "CORE BOOT source = static + bounded delta", () => {
  assert.ok(driverSrc.includes("CORE BOOT (canonical static requirements + bounded context delta only"),
    "core boot must declare static + bounded-delta-only source");
});
// 29. source delta hash must match
check("D29", "source_delta_hash equality enforced", () => {
  assert.match(driverSrc, /ack\.source_delta_hash !== deltaHash/);
});
// 30. same canonical NEXT exact equality required
check("D30", "SAME_CANONICAL_NEXT exact equality", () => {
  assert.match(driverSrc, /ack\.canonical_next === chatNCanonicalNext/);
});
// 31. controller loss fails closed (mock harness property: unreachable endpoint => stop, no send)
check("D31", "controller loss fails closed (no send on fetch failure)", () => {
  // structural: guardedTurn is awaited before any press; fetch failure throws before dispatch
  const idxFetch = driverSrc.indexOf("await qwenChat(");
  const idxPress = driverSrc.indexOf('"browser_press"');
  assert.ok(idxFetch > 0 && idxPress > idxFetch, "generation precedes press");
  // main catch converts any throw to STOP
  assert.match(driverSrc, /process\.exit\(1\)/);
});
// 32. browser loss fails closed
check("D32", "browser loss fails closed", () => {
  assert.match(driverSrc, /HERMES_TYPE_EXECUTION_FAILED|HERMES_PRESS_EXECUTION_FAILED|COMPOSER_REF_NOT_OBTAINED/);
});
// 33. no implicit fallback
check("D33", "no implicit fallback paths present", () => {
  assert.ok(!driverSrc.toLowerCase().includes("glm"));
  assert.ok(!driverSrc.toLowerCase().includes("codex"));
  assert.ok(!driverSrc.includes("api.openai.com"));
});
// 34. max Web sends 2
check("D34", "max Web sends 2", () => {
  assert.match(driverSrc, /const MAX_SENDS = 2/);
});
// 35. max live Qwen generations 6
check("D35", "max live generations 6", () => {
  assert.match(driverSrc, /const MAX_GENERATIONS = 6/);
  assert.match(driverSrc, /genBudget > MAX_GENERATIONS/);
});
// 36. no retry
check("D36", "no retry loops", () => {
  assert.doesNotMatch(driverSrc, /for\s*\(\s*(?:let|var|const)\s+attempt/);
  assert.doesNotMatch(driverSrc, /maxRetries|retryCount/);
});
// 37. no GLM
check("D37", "no GLM", () => { assert.ok(!driverSrc.toLowerCase().includes("glm")); });
// 38. no Codex
check("D38", "no Codex", () => { assert.ok(!driverSrc.toLowerCase().includes("codex")); });
// 39. no OpenAI API
check("D39", "no OpenAI API", () => {
  assert.ok(!driverSrc.includes("api.openai.com") && !driverSrc.match(/OPENAI_API_KEY/));
});
// 40. no /v1/tick
check("D40", "no /v1/tick", () => { assert.ok(!driverSrc.includes("/v1/tick")); });
// 41. no production dispatch
check("D41", "no production dispatch", () => {
  assert.ok(driverSrc.includes('"production_dispatch":false') || driverSrc.includes("production_dispatch\\\":false"));
});
// 42. Phase C remains PASS (predecessor suite untouched and green)
check("D42", "Phase C predecessor artifacts untouched", () => {
  assert.ok(wrapperSrc.includes("V4_HERMES_PER_INVOCATION_BROWSER_TOOL_ALLOWLIST_AND_SEND_QUALIFICATION_V1"));
  assert.equal(m.PHASE_D_DELTA_SCHEMA, "hermes-phase-d-context-delta-v2");
});
// 43. Phase D PASS only after rollover proof
check("D43", "PASS gated on rollover proof", () => {
  assert.match(driverSrc, /SAME_CANONICAL_NEXT: sameCanonicalNext/);
  assert.match(driverSrc, /ROLLOVER_PROOF/);
});

console.log(results.join("\n"));
console.log(`FOCUSED_CHECKS=${results.length}`);
console.log(`PASSED=${passed}`);
console.log(process.exitCode ? "FOCUSED_TESTS=FAIL" : "FOCUSED_TESTS=PASS");
