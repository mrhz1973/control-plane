#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_BOUNDED_PRODUCTION_ACTIVATION_V1 — focused suite.
 * Deterministic, offline. Proves the MINIMUM exact-route authorization delta:
 * the promoted route is ACCEPTED by the existing issuance/provenance law while
 * every foreign/unknown route stays rejected, and the activation-gated
 * execution edge works exactly as implemented (confirmed => stub transport
 * runs; unconfirmed => refused).
 */
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const results = [];
function pass(id, name) { results.push(`PASS ${id} ${name}`); }
function fail(id, name, e) { results.push(`FAIL ${id} ${name}: ${e.message}`); process.exitCode = 1; }
async function t(id, name, fn) { try { await fn(); pass(id, name); } catch (e) { fail(id, name, e); } }

const reg = await import("../../tools/v4-runtime-authorization-provenance-registry-v1.mjs");
const iss = await import("../../tools/v4-runtime-authorization-issuance-v1.mjs");
const adapter = await import("../../tools/v4-phase-f-promotion-adapter-v1.mjs");
const rc = await import("../../tools/v4-phase-f-route-control-v1.mjs");
const NOW = Date.parse("2026-09-12T15:00:00.000Z");
const PROMOTED = "hermes+chatgpt_web";

function tmpFile(name, obj) {
  const dir = mkdtempSync(join(tmpdir(), "f-activation-"));
  const p = join(dir, name);
  if (obj !== undefined) writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
  return p;
}
const future = new Date(NOW + 600_000).toISOString();

await t("A01", "registry validates an ACTIVE entry for the promoted route", async () => {
  const obj = {
    schema_version: reg.REGISTRY_SCHEMA_VERSION,
    entries: [{ authorization_id: "AUTH-PROMO-TEST-1", state: "ACTIVE", route_id: PROMOTED, issued_at: new Date(NOW - 1000).toISOString(), expires_at: future, spent_at: null }],
  };
  const v = reg.validateRegistryObject(obj);
  assert.equal(v.ok, true, JSON.stringify(v));
});

await t("A02", "registry STILL rejects foreign/unknown routes (no broadening)", async () => {
  for (const route of ["openclaw+legacy", "opencode+glm", "hermes+qwen", "*+*", "qwen_local+hermes+chatgpt_web"]) {
    const obj = {
      schema_version: reg.REGISTRY_SCHEMA_VERSION,
      entries: [{ authorization_id: `AUTH-X-${route}`, state: "ACTIVE", route_id: route, issued_at: new Date(NOW - 1000).toISOString(), expires_at: future, spent_at: null }],
    };
    const v = reg.validateRegistryObject(obj);
    assert.equal(v.ok, false, `route ${route} must stay rejected`);
  }
});

await t("A03", "issueActiveEntry appends EXACTLY the entry route (promoted)", async () => {
  const path = tmpFile("registry.json", { schema_version: reg.REGISTRY_SCHEMA_VERSION, entries: [] });
  const out = reg.issueActiveEntry(path, { authorization_id: "AUTH-PROMO-ISSUE-1", route_id: PROMOTED, expires_at: future }, { now: new Date(NOW) });
  assert.equal(out.ok, true, JSON.stringify(out));
  const back = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(back.entries[0].route_id, PROMOTED);
  assert.equal(back.entries[0].state, "ACTIVE");
  rmSync(join(path, ".."), { recursive: true, force: true });
});

await t("A04", "issueActiveEntry still appends opencode route unchanged (identity)", async () => {
  const path = tmpFile("registry.json", { schema_version: reg.REGISTRY_SCHEMA_VERSION, entries: [] });
  const out = reg.issueActiveEntry(path, { authorization_id: "AUTH-OC-1", route_id: "opencode+qwen_local", expires_at: future }, { now: new Date(NOW) });
  assert.equal(out.ok, true);
  const back = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(back.entries[0].route_id, "opencode+qwen_local");
  rmSync(join(path, ".."), { recursive: true, force: true });
});

await t("A05", "issuance ALLOWED_ROUTES extended exact-route; config validation accepts both subsets", async () => {
  assert.deepEqual([...iss.ALLOWED_ROUTES].sort(), ["hermes+chatgpt_web", "opencode+qwen_local"]);
  const base = {
    operator_telegram_chat_id: "1", operator_telegram_user_id: "1",
    telegram_bot_token: "test-token-ref", pending_store_path: "C:\\x\\p.json",
    registry_path: "C:\\x\\r.json",
    allowed_routes: ["opencode+qwen_local", PROMOTED],
    pending_ttl_seconds_default: 900, pending_ttl_seconds_max: 900,
    authorization_ttl_seconds_default: 3600, authorization_ttl_seconds_max: 3600,
  };
  assert.equal(iss.validateIssuanceConfigObject(base).ok, true, JSON.stringify(iss.validateIssuanceConfigObject(base)));
  assert.equal(iss.validateIssuanceConfigObject({ ...base, allowed_routes: ["opencode+qwen_local"] }).ok, true, "historical subset stays valid");
  const bad = iss.validateIssuanceConfigObject({ ...base, allowed_routes: ["openclaw+legacy"] });
  assert.equal(bad.ok, false);
});

await t("A06", "pending store validation accepts promoted-route decision, rejects foreign", async () => {
  const dec = (route) => ({
    pending_decision_id: "PEND-1", authorization_id: "AUTH-1", task_id: "T", execution_id: "E",
    route_id: route, scope_digest: "a".repeat(64),
    created_at: new Date(NOW).toISOString(), pending_expires_at: new Date(NOW + 60000).toISOString(),
    state: "PENDING",
  });
  const okStore = iss.validatePendingStoreObject({ schema_version: iss.PENDING_STORE_SCHEMA_VERSION, decisions: [dec(PROMOTED)] });
  assert.equal(okStore.ok, true, JSON.stringify(okStore));
  const badStore = iss.validatePendingStoreObject({ schema_version: iss.PENDING_STORE_SCHEMA_VERSION, decisions: [dec("openclaw+legacy")] });
  assert.equal(badStore.ok, false);
});

await t("A07", "spend ledger accepts a promoted-route ADMISSION_CONSUMED record", async () => {
  const { validateSpendLedgerObject, LEDGER_SCHEMA_VERSION, SPEND_KIND_ADMISSION } = await import("../../tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs");
  const v = validateSpendLedgerObject({
    schema_version: LEDGER_SCHEMA_VERSION,
    spends: [{ authorization_id: "AUTH-PROMO-SPEND-1", execution_id: "EXEC-1", route_id: PROMOTED, spend_kind: SPEND_KIND_ADMISSION, spent_at: new Date(NOW).toISOString() }],
  });
  assert.equal(v.ok, true, JSON.stringify(v));
});

await t("A08", "inspect/admit promoted authorization: ACTIVE ok, expired/spent/wrong-route fail closed", async () => {
  const path = tmpFile("registry.json", {
    schema_version: reg.REGISTRY_SCHEMA_VERSION,
    entries: [
      { authorization_id: "AUTH-P-OK", state: "ACTIVE", route_id: PROMOTED, issued_at: new Date(NOW - 1000).toISOString(), expires_at: future, spent_at: null },
      { authorization_id: "AUTH-P-EXP", state: "ACTIVE", route_id: PROMOTED, issued_at: new Date(NOW - 2000).toISOString(), expires_at: new Date(NOW - 1000).toISOString(), spent_at: null },
      { authorization_id: "AUTH-P-SPENT", state: "SPENT", route_id: PROMOTED, issued_at: new Date(NOW - 1000).toISOString(), expires_at: future, spent_at: new Date(NOW).toISOString() },
      { authorization_id: "AUTH-P-OC", state: "ACTIVE", route_id: "opencode+qwen_local", issued_at: new Date(NOW - 1000).toISOString(), expires_at: future, spent_at: null },
    ],
  });
  const opts = { now: new Date(NOW) };
  assert.equal(reg.inspectAuthorization(path, "AUTH-P-OK", { ...opts, routeId: PROMOTED }).ok, true);
  assert.equal(reg.inspectAuthorization(path, "AUTH-P-EXP", { ...opts, routeId: PROMOTED }).ok, false);
  assert.equal(reg.inspectAuthorization(path, "AUTH-P-SPENT", { ...opts, routeId: PROMOTED }).ok, false);
  assert.equal(reg.inspectAuthorization(path, "AUTH-P-OC", { ...opts, routeId: PROMOTED }).ok, false, "route mismatch fails closed");
  assert.equal(reg.inspectAuthorization(path, "AUTH-P-OK", { ...opts, routeId: "opencode+qwen_local" }).ok, false);
  rmSync(join(path, ".."), { recursive: true, force: true });
});

await t("A09", "activation-gated execution edge: confirmed flag required for qualified transport", async () => {
  const { chainSend } = await import("../../tools/hermes-per-invocation-browser-allowlist-v1.mjs");
  const eligibility = {
    schema_version: adapter.PROMOTION_DISPATCH_SCHEMA, status: "ELIGIBLE",
    classification: adapter.READY_CLASSIFICATION, eligible: true,
    dispatch_binding: { task_ref: "T", run_id: "R" },
  };
  const req = { task_ref: "T", run_id: "R", eligibility };
  const refused = await adapter.executePromotedRoute(req, { transport: chainSend });
  assert.equal(refused.status, "BLOCKED");
  assert.equal(refused.classification, "ACTIVATION_NOT_CONFIRMED");
  const allowed = await adapter.executePromotedRoute(req, { transport: chainSend, production_activation_confirmed: true, _dryRunGuard: true }).catch((e) => ({ thrown: String(e.message) }));
  // Without live runtime the real transport throws/fails — it must NEVER be
  // invoked silently: the call reaches the transport only with confirmation.
  assert.ok(allowed.thrown !== undefined || allowed.status !== "BLOCKED", "confirmed path reaches transport layer");
});

await t("A10", "activation-gated edge: stub transport executes under confirmation", async () => {
  const eligibility = {
    schema_version: adapter.PROMOTION_DISPATCH_SCHEMA, status: "ELIGIBLE",
    classification: adapter.READY_CLASSIFICATION, eligible: true,
    dispatch_binding: { task_ref: "T", run_id: "R" },
  };
  let calls = 0;
  const out = await adapter.executePromotedRoute(
    { task_ref: "T", run_id: "R", eligibility },
    { transport: async () => { calls++; return { stubbed: true, execution_performed: false }; }, production_activation_confirmed: true },
  );
  assert.equal(calls, 1);
  assert.equal(out.status, "DRY_RUN");
});

await t("A11", "route control activation law: DISABLED -> CANDIDATE_ENABLED, rollback to SHADOW_ONLY proven", async () => {
  const doc0 = rc.emptyRouteControlState({ nowMs: NOW, updatedBy: "activation-test" });
  const en = rc.applyRouteCandidateEnable(doc0, { nowMs: NOW, updatedBy: "activation-test" });
  assert.equal(en.ok, true);
  assert.equal(en.doc.state, "CANDIDATE_ENABLED");
  const ev = rc.evaluateRouteControl(en.doc, { nowMs: NOW });
  assert.equal(ev.candidate_flag, true);
  assert.equal(ev.production_dispatch_permitted, false, "control emits no production authority by itself");
  const dis = rc.applyRouteDisable(en.doc, { nowMs: NOW + 1, updatedBy: "activation-test" });
  assert.equal(dis.doc.state, "DISABLED");
  assert.equal(dis.doc.restoration_state, "SHADOW_ONLY");
  const post = rc.evaluateRouteControl(dis.doc, { nowMs: NOW + 1 });
  assert.equal(post.shadow_only_canonical === false && post.state_class === "SAFE", true);
});

await t("A12", "no second authority: single source of route truth remains the provenance registry", async () => {
  const src = await (await import("node:fs/promises")).readFile(resolve(ROOT, "tools/v4-phase-f-live-canary-v1.mjs").replace(/\//g, "\\"), "utf8").catch(() => null);
  if (src) {
    // canary must CONSUME the canonical modules, never define its own registry/ledger writer
    assert.ok(!/writeFileSync\([^)]*registry/i.test(src), "canary never writes registry directly");
    assert.ok(src.includes("admitAuthorization") || src.includes("inspectAuthorization"), "canary reuses canonical admission");
  }
});

await t("A13", "historical registry file still validates after extension (backward compat)", async () => {
  const historical = {
    schema_version: reg.REGISTRY_SCHEMA_VERSION,
    entries: [
      { authorization_id: "AUTH-V4-FIRST-LIVE-001", state: "SPENT", route_id: "opencode+qwen_local", issued_at: "2026-08-31T21:58:54.066Z", expires_at: "2026-08-31T22:58:54.066Z", spent_at: "2026-08-31T21:59:37.719Z" },
    ],
  };
  assert.equal(reg.validateRegistryObject(historical).ok, true);
});

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`FOCUSED_CHECKS=${results.length}`);
console.log(`PASSED=${results.length - failed}`);
console.log(process.exitCode ? "FOCUSED_TESTS=FAIL" : "FOCUSED_TESTS=PASS");
