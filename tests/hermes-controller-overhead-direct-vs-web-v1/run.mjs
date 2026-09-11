import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARMS,
  CASE_COUNT,
  CODEX_QUOTA_POOL,
  computeTotal,
  GOVERNED_HERMES_OPERATIONS,
  HERMES_TOOL_NAME,
  MAX_CODEX_INFERENCE_TURNS,
  TASK_REF,
  aggregateRatios,
  classifyRatio,
  computeOutputRatioPct,
  computeRatioPct,
  loadFixture,
  sanitizeEvidence,
  sanitizeUsage,
  sameModelInvariant,
  validateHermesTrace,
} from "../../tools/benchmarks/hermes-controller-overhead-direct-vs-web-v1.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const source = fs.readFileSync(path.join(root, "tools/benchmarks/hermes-controller-overhead-direct-vs-web-v1.mjs"), "utf8");
const fixture = loadFixture();

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
}

test("hard bounded inference budget is six", () => assert.equal(MAX_CODEX_INFERENCE_TURNS, 6));
test("fixture has exactly three synthetic cases", () => assert.equal(fixture.cases.length, CASE_COUNT));
test("arms are DIRECT and HERMES_CONTROLLER", () => assert.deepEqual(ARMS, ["DIRECT", "HERMES_CONTROLLER"]));
test("same model invariant rejects model switching", () => {
  assert.equal(sameModelInvariant([{ model_id: "gpt-5.5" }, { model_id: "gpt-5.5" }]), true);
  assert.equal(sameModelInvariant([{ model_id: "gpt-5.5" }, { model_id: "gpt-6-astra" }]), false);
});
test("quota lane is Codex subscription and no GLM/Qwen path exists", () => {
  assert.equal(CODEX_QUOTA_POOL, "chatgpt_codex_subscription");
  assert.match(source, /glm_calls:\s*0/);
  assert.match(source, /qwen_calls:\s*0/);
  assert.doesNotMatch(source, /GLM_ELIGIBLE\s*=\s*YES/);
});
test("API and BYOK are hard-walled", () => {
  assert.match(source, /No prompt body, model output/);
  assert.match(source, /openai_api|BYOK|API\/BYOK|OpenAI API\/BYOK/);
  assert.doesNotMatch(source, /OPENAI_API_KEY/);
});
test("Web send and submit are absent", () => {
  assert.match(source, /chatgpt_web_sends:\s*0/);
  assert.match(source, /Never send, submit, click send/);
  assert.doesNotMatch(source, /Page\.navigate/);
});
test("only governed Hermes operations are accepted", () => {
  assert.equal(HERMES_TOOL_NAME, "control_plane_chatgpt_composer_cdp");
  assert.deepEqual(GOVERNED_HERMES_OPERATIONS, ["DISCOVER_CHATGPT_TARGET", "GET_COMPOSER_STATE", "PREFILL_SINGLE_LINE", "CLEAR_COMPOSER"]);
  const trace = validateHermesTrace({ items: [
    { type: "mcpToolCall", server: "hermes-tools", tool: HERMES_TOOL_NAME, arguments: { operation: "DISCOVER_CHATGPT_TARGET" }, status: "completed", result: { structuredContent: { ok: true } } },
    { type: "mcpToolCall", server: "hermes-tools", tool: HERMES_TOOL_NAME, arguments: { operation: "GET_COMPOSER_STATE" }, status: "completed", result: { structuredContent: { ok: true, empty: true } } },
    { type: "mcpToolCall", server: "hermes-tools", tool: HERMES_TOOL_NAME, arguments: { operation: "PREFILL_SINGLE_LINE" }, status: "completed", result: { structuredContent: { ok: true } } },
    { type: "mcpToolCall", server: "hermes-tools", tool: HERMES_TOOL_NAME, arguments: { operation: "CLEAR_COMPOSER" }, status: "completed", result: { structuredContent: { ok: true, empty: true, char_count: 0 } } },
  ] });
  assert.equal(trace.ok, true);
  assert.equal(validateHermesTrace({ items: [{ type: "mcpToolCall", server: "hermes-tools", tool: "browser_snapshot", arguments: {}, status: "completed" }] }).ok, false);
});
test("composer must be cleared after each controller case", () => {
  assert.match(source, /FINAL_CLEAR_NOT_CONFIRMED/);
  assert.match(source, /clear_confirmed/);
});
test("Phase D stays open and production routing stays disabled", () => {
  assert.match(source, /phase_d:\s*"OPEN"/);
  assert.match(source, /production_routing_enabled:\s*"NO"/);
});
test("no planner selector quota or dispatcher mutation is present", () => {
  assert.doesNotMatch(source, /selectCodexWindowController/);
  assert.doesNotMatch(source, /dispatcher.*recycle/i);
  assert.match(source, /non-production|non-production/i);
});
test("evidence is sanitized to bounded fields", () => {
  const record = sanitizeEvidence({ case_id: "CASE_A", arm: "DIRECT", model_id: "gpt-5.5", usage: { input_tokens: 1 }, elapsed_ms: 4, status: "PASS", prompt_sha256: "a".repeat(64), output_sha256: null, output: "secret cognitive output" });
  assert.deepEqual(Object.keys(record).sort(), ["arm", "case_id", "elapsed_ms", "model_id", "output_sha256", "prompt_sha256", "status", "usage"].sort());
  assert.equal("output" in record, false);
});
test("ratio math is deterministic", () => {
  assert.equal(computeRatioPct(25, 100), 25);
  assert.equal(computeOutputRatioPct(5, 10), 50);
  assert.equal(computeRatioPct(10, 0), null);
  assert.equal(classifyRatio(30), "STRONG_CANDIDATE");
  assert.equal(classifyRatio(40), "MIXED_NEEDS_MORE_EVIDENCE");
  assert.equal(classifyRatio(45), "WEAK");
  assert.equal(classifyRatio(50), "POOR_FOR_QUOTA_SAVING_ONLY");
  assert.deepEqual(aggregateRatios([20, 40, 30]), { mean: 30, median: 30, heuristic: "STRONG_CANDIDATE" });
});
test("ambiguous usage is NOT_COMPUTABLE", () => {
  assert.equal(computeTotal(sanitizeUsage({ inputTokens: 10, outputTokens: 2 })), null);
  assert.deepEqual(aggregateRatios([null, null, null]), { mean: null, median: null, heuristic: "NOT_COMPUTABLE" });
});
test("fixture prompts are sanitized hashes and single-line", () => {
  for (const item of fixture.cases) {
    assert.equal(/\r|\n/.test(item.prompt), false);
    assert.equal(item.prompt.length > 0, true);
  }
  assert.match(source, /prompt_sha256/);
  assert.doesNotMatch(source, /output_sha256:\s*sha256\(.*completed/i);
});

if (process.exitCode) process.exit(1);
console.log(`FOCUSED_TESTS=PASS ${TASK_REF}`);
