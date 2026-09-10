#!/usr/bin/env node
/** Offline focused tests for the Hermes Codex dynamic model router. */

import assert from "node:assert/strict";
import {
  DynamicCodexModelRouter,
  DynamicModelRouterError,
  MODEL_SELECTION_MODE,
  discoverLiveCatalog,
  validateAllSelectableModels,
} from "../../tools/hermes-codex-dynamic-model-router-v1.mjs";

const model = (id, extra = {}) => ({
  id,
  model: id,
  displayName: id,
  description: "synthetic subscription model",
  hidden: false,
  isDefault: id === "A",
  supportedReasoningEfforts: [
    { reasoningEffort: "low", description: "low" },
    { reasoningEffort: "high", description: "high" },
  ],
  defaultReasoningEffort: "low",
  ...extra,
});

function rpcFor(pages, threadModels = {}) {
  let page = 0;
  const calls = [];
  return {
    calls,
    async request(method, params) {
      calls.push({ method, params: structuredClone(params) });
      if (method === "model/list") {
        const response = pages[Math.min(page, pages.length - 1)] ?? { data: [], nextCursor: null };
        page += 1;
        return response;
      }
      if (method === "thread/start") {
        const selected = threadModels[params.model] ?? params.model ?? "A";
        return { model: selected, modelProvider: "openai", reasoningEffort: "low", thread: { id: `thread-${selected}` } };
      }
      if (method === "turn/start") return { turn: { id: "turn-1", status: "inProgress" } };
      throw new Error(`unexpected method ${method}`);
    },
  };
}

function expectCode(promise, code) {
  return promise.then(
    () => assert.fail(`expected ${code}`),
    (error) => assert.equal(error.code, code),
  );
}

const t0 = rpcFor([
  { data: [model("A")], nextCursor: "page-2" },
  { data: [model("B")], nextCursor: null },
]);
const catalog = await discoverLiveCatalog(t0);
assert.equal(catalog.state, "LIVE");
assert.equal(catalog.pages, 2);
assert.deepEqual(catalog.models.map((item) => item.id), ["A", "B"]);
assert.equal(t0.calls[1].params.cursor, "page-2");

const router = new DynamicCodexModelRouter({ rpc: rpcFor([{ data: [model("A"), model("B")], nextCursor: null }]), codexAuthState: "PASS" });
const selected = await router.setModel("A", { reasoningEffort: "high" });
assert.equal(selected.selection_exact, true);
assert.equal(selected.selected_model, "A");
assert.equal(selected.controller_lane, "CODEX_SUBSCRIPTION");
assert.equal(selected.quota_pool, "chatgpt_codex_subscription");
assert.equal(selected.fallback_used, false);
assert.equal(selected.openai_api_used, false);
assert.equal(selected.byok_used, false);
assert.equal(router.buildTurnStartParams("harmless").model, "A");
assert.equal(router.buildTurnStartParams("harmless").effort, "high");
await router.startTurn("harmless");

await expectCode(router.setModel("unknown"), "MODEL_NOT_AVAILABLE");
await expectCode(router.setReasoningEffort("xhigh", { modelId: "A" }), "REASONING_EFFORT_NOT_SUPPORTED");

const unavailable = new DynamicCodexModelRouter({
  rpc: { request: async () => { throw new Error("disconnected"); } },
});
await expectCode(unavailable.listModels(), "CATALOG_UNAVAILABLE");

const mismatch = new DynamicCodexModelRouter({
  rpc: rpcFor([{ data: [model("A")], nextCursor: null }], { A: "B" }),
});
await expectCode(mismatch.setModel("A"), "EFFECTIVE_MODEL_MISMATCH");

const runtimeRejected = new DynamicCodexModelRouter({
  rpc: {
    async request(method, params) {
      if (method === "model/list") return { data: [model("A")], nextCursor: null };
      if (method === "thread/start") return { model: params.model, modelProvider: "openai", thread: { id: "thread-A" } };
      if (method === "turn/start") throw new Error("subscription rejected model");
      throw new Error(`unexpected method ${method}`);
    },
  },
});
await runtimeRejected.setModel("A");
await expectCode(runtimeRejected.startTurn("harmless"), "MODEL_EXECUTION_FAILED");

const noEffort = new DynamicCodexModelRouter({
  rpc: rpcFor([{ data: [model("A", { supportedReasoningEfforts: undefined })], nextCursor: null }]),
});
assert.equal((await noEffort.listReasoningEfforts("A")).state, "NOT_ADVERTISED");
await expectCode(noEffort.setReasoningEffort("low", { modelId: "A" }), "REASONING_EFFORT_NOT_SUPPORTED");

const futureRpc = rpcFor([{ data: [model("A"), model("B"), model("NEW")], nextCursor: null }]);
const futureRouter = new DynamicCodexModelRouter({ rpc: futureRpc });
assert.deepEqual((await futureRouter.listModels()).models.map((item) => item.id), ["A", "B", "NEW"]);
assert.equal((await futureRouter.setModel("NEW")).selected_model, "NEW");
await expectCode(new DynamicCodexModelRouter({ rpc: rpcFor([{ data: [model("A")], nextCursor: null }]) }).setModel("B"), "MODEL_NOT_AVAILABLE");
await expectCode(new DynamicCodexModelRouter({ rpc: rpcFor([{ data: [model("A")], nextCursor: null }]) }).setModel("gpt-5.5-latest"), "MODEL_NOT_AVAILABLE");

const native = new DynamicCodexModelRouter({ rpc: rpcFor([{ data: [model("A"), model("B")], nextCursor: null }]) });
const nativeReceipt = await native.useNativeDefault();
assert.equal(nativeReceipt.selection_mode, MODEL_SELECTION_MODE.NATIVE_DEFAULT);
assert.equal(nativeReceipt.requested_model, null);
assert.equal(nativeReceipt.selection_exact, false);

const all = await validateAllSelectableModels(new DynamicCodexModelRouter({ rpc: rpcFor([{ data: [model("A"), model("B"), model("NEW")], nextCursor: null }]) }));
assert.equal(all.status, "PASS");
assert.equal(`${all.validated_count}/${all.catalog_count}`, "3/3");

let retired = 0;
const switching = new DynamicCodexModelRouter({
  rpc: rpcFor([{ data: [model("A"), model("B")], nextCursor: null }]),
  retireCurrentSession: async () => { retired += 1; },
});
await switching.setModel("A");
await switching.setModel("B");
assert.equal(retired, 1);

console.log(JSON.stringify({
  FOCUSED_TESTS: "PASS",
  CASES: 19,
  DYNAMIC_CATALOG: "PASS",
  EXACT_SELECTION: "PASS",
  NO_SILENT_FALLBACK: "PASS",
  FUTURE_MODEL_AUTO_DISCOVERY: "PASS",
  STALE_MODEL_FAIL_CLOSED: "PASS",
}));
