#!/usr/bin/env node
/**
 * Target suite for the offline runtime authorization issuance implementation.
 * Offline only. Real Telegram Bot API calls = 0 (fake injected clients only).
 * No production registry/pending-store/ledger mutations — temp dirs only.
 * No HTTP execution endpoint requests. No OpenCode/Qwen/provider calls.
 */
import { strict as assert } from "node:assert";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const ISSUANCE_TOOL = join(ROOT, "tools", "v4-runtime-authorization-issuance-v1.mjs");
const SERVE_TOOL = join(ROOT, "tools", "serve-v4-runtime-authorization-issuance-v1.mjs");
const REGISTRY_TOOL = join(ROOT, "tools", "v4-runtime-authorization-provenance-registry-v1.mjs");

const issuance = await import(pathToFileURL(ISSUANCE_TOOL).href);
const serve = await import(pathToFileURL(SERVE_TOOL).href);
const registry = await import(pathToFileURL(REGISTRY_TOOL).href);

let pass = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    pass += 1;
    console.log(`ok ${pass} - ${name}`);
  } catch (err) {
    failures.push({ name, message: String(err && err.message) });
    console.log(`FAIL - ${name}: ${err && err.message}`);
  }
}

const DIR = mkdtempSync(join(tmpdir(), "v4-issuance-"));

const SCOPE_DIGEST = "a".repeat(64);
const CHAT_ID = "111111";
const USER_ID = "222222";
const TOKEN = "FAKE-TOKEN-ONLY";

function fakeConfig(overrides = {}) {
  return {
    operator_telegram_chat_id: CHAT_ID,
    operator_telegram_user_id: USER_ID,
    telegram_bot_token: TOKEN,
    pending_store_path: overrides.pending_store_path || join(DIR, "pending.json"),
    registry_path: overrides.registry_path || join(DIR, "registry.json"),
    allowed_routes: ["opencode+qwen_local"],
    pending_ttl_seconds_default: 900,
    pending_ttl_seconds_max: 900,
    authorization_ttl_seconds_default: 3600,
    authorization_ttl_seconds_max: 3600,
    ...overrides,
  };
}

function writeStore(path, decisions) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(
      { schema_version: issuance.PENDING_STORE_SCHEMA_VERSION, decisions },
      null,
      2,
    )}\n`,
  );
}

function writeRegistry(path, entries) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(
      { schema_version: registry.REGISTRY_SCHEMA_VERSION, entries },
      null,
      2,
    )}\n`,
  );
}

function pendingRecord(overrides = {}) {
  return {
    pending_decision_id: overrides.pending_decision_id || "PEND-1",
    authorization_id: overrides.authorization_id || "AUTH-1",
    task_id: overrides.task_id || "T-1",
    execution_id: overrides.execution_id || "EXEC-1",
    route_id: "opencode+qwen_local",
    scope_digest: overrides.scope_digest || SCOPE_DIGEST,
    created_at: overrides.created_at || "2026-08-31T12:00:00.000Z",
    pending_expires_at:
      overrides.pending_expires_at || "2026-08-31T12:15:00.000Z",
    state: overrides.state || "PENDING",
    decision_at: overrides.decision_at ?? null,
    selected_option: overrides.selected_option ?? null,
    telegram_update_id: overrides.telegram_update_id ?? null,
    telegram_chat_id: overrides.telegram_chat_id ?? null,
    telegram_user_id: overrides.telegram_user_id ?? null,
    authorization_expires_at: overrides.authorization_expires_at ?? null,
    issued_at: overrides.issued_at ?? null,
  };
}

function registerRequest(overrides = {}) {
  return {
    schema_version: issuance.REGISTER_PENDING_REQUEST_SCHEMA,
    pending_decision_id: overrides.pending_decision_id || "PEND-1",
    authorization_id: overrides.authorization_id || "AUTH-1",
    task_id: overrides.task_id || "T-1",
    execution_id: overrides.execution_id || "EXEC-1",
    route_id: "opencode+qwen_local",
    scope_digest: overrides.scope_digest || SCOPE_DIGEST,
    pending_ttl_seconds: overrides.pending_ttl_seconds ?? 900,
    ...overrides,
  };
}

function telegramUpdate(overrides = {}) {
  return {
    update_id: overrides.update_id ?? 1001,
    callback_query: {
      id: overrides.callback_id || "cbq-1",
      from: { id: overrides.from_id ?? Number(USER_ID) },
      message: { chat: { id: overrides.chat_id ?? Number(CHAT_ID) } },
      data:
        overrides.data ??
        `ra:${overrides.pending_decision_id || "PEND-1"}:${overrides.option || "approve"}`,
    },
  };
}

function fakeTelegram() {
  const calls = { send: [], ack: [] };
  let sendResult = { ok: true };
  return {
    calls,
    setSendResult(r) {
      sendResult = r;
    },
    async sendDecisionMessage(chatId, text, keyboard) {
      calls.send.push({ chatId, text, keyboard });
      return sendResult;
    },
    async pollUpdates() {
      return { ok: true, result: [] };
    },
    async acknowledgeCallback(id) {
      calls.ack.push(id);
      return { ok: true };
    },
  };
}

/* ------------------------------------------------------------------ */
/* 1–5 store core                                                      */
/* ------------------------------------------------------------------ */

await test("1 empty pending store valid", async () => {
  const p = join(DIR, "t1-pending.json");
  writeStore(p, []);
  const r = issuance.loadPendingStore(p);
  assert.equal(r.ok, true);
  assert.equal(r.store.decisions.length, 0);
  const v = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [],
  });
  assert.equal(v.ok, true);
});

await test("2 malformed pending store fail closed", async () => {
  const p = join(DIR, "t2-pending.json");
  writeFileSync(p, "{ not json");
  const r = issuance.loadPendingStore(p);
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_PENDING_STORE_INVALID"));
  const missing = issuance.loadPendingStore(join(DIR, "nope.json"));
  assert.equal(missing.ok, false);
  assert.ok(missing.reason_codes.includes("ISSUANCE_PENDING_STORE_UNAVAILABLE"));
});

await test("3 duplicate pending_decision_id invalid", async () => {
  const v = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [pendingRecord(), pendingRecord({ authorization_id: "AUTH-2" })],
  });
  assert.equal(v.ok, false);
  assert.equal(v.reason, "ISSUANCE_PENDING_STORE_INVALID");
});

await test("4 duplicate authorization_id invalid", async () => {
  const v = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [pendingRecord(), pendingRecord({ pending_decision_id: "PEND-2" })],
  });
  assert.equal(v.ok, false);
  assert.equal(v.reason, "ISSUANCE_PENDING_STORE_INVALID");
});

await test("5 register creates exactly one PENDING", async () => {
  const store = join(DIR, "t5-pending.json");
  const reg = join(DIR, "t5-registry.json");
  writeStore(store, []);
  writeRegistry(reg, []);
  const tg = fakeTelegram();
  const now = new Date("2026-08-31T12:00:00Z");
  const r = await issuance.registerPendingAuthorization(store, registerRequest(), {
    config: fakeConfig({ pending_store_path: store, registry_path: reg }),
    telegram: tg,
    now,
    loadRegistry: registry.loadRegistry,
  });
  assert.equal(r.ok, true);
  assert.equal(r.state, "PENDING");
  const after = JSON.parse(readFileSync(store, "utf8"));
  assert.equal(after.decisions.length, 1);
  assert.equal(after.decisions[0].state, "PENDING");
  assert.equal(after.decisions[0].pending_expires_at, "2026-08-31T12:15:00.000Z");
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

/* ------------------------------------------------------------------ */
/* 6–11 register boundary                                              */
/* ------------------------------------------------------------------ */

await test("6 immutable bindings preserved", async () => {
  const store = join(DIR, "t6-pending.json");
  const reg = join(DIR, "t6-registry.json");
  writeStore(store, []);
  writeRegistry(reg, []);
  const tg = fakeTelegram();
  await issuance.registerPendingAuthorization(
    store,
    registerRequest({
      pending_decision_id: "PEND-6",
      authorization_id: "AUTH-6",
      task_id: "T-6",
      execution_id: "EXEC-6",
    }),
    {
      config: fakeConfig({ pending_store_path: store, registry_path: reg }),
      telegram: tg,
      loadRegistry: registry.loadRegistry,
    },
  );
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  assert.equal(d.pending_decision_id, "PEND-6");
  assert.equal(d.authorization_id, "AUTH-6");
  assert.equal(d.task_id, "T-6");
  assert.equal(d.execution_id, "EXEC-6");
  assert.equal(d.route_id, "opencode+qwen_local");
  assert.equal(d.scope_digest, SCOPE_DIGEST);
});

await test("7 register invokes injected Telegram sender exactly once", async () => {
  const store = join(DIR, "t7-pending.json");
  const reg = join(DIR, "t7-registry.json");
  writeStore(store, []);
  writeRegistry(reg, []);
  const tg = fakeTelegram();
  await issuance.registerPendingAuthorization(store, registerRequest(), {
    config: fakeConfig({ pending_store_path: store, registry_path: reg }),
    telegram: tg,
    loadRegistry: registry.loadRegistry,
  });
  assert.equal(tg.calls.send.length, 1);
  const msg = tg.calls.send[0];
  assert.equal(msg.chatId, CHAT_ID);
  assert.ok(msg.text.includes("AUTH-1"));
  assert.ok(msg.text.includes("T-1"));
  assert.ok(!msg.text.includes(TOKEN));
  const buttons = msg.keyboard[0].map((b) => b.callback_data).sort();
  assert.deepEqual(buttons, ["ra:PEND-1:approve", "ra:PEND-1:reject"].sort());
});

await test("8 Telegram send failure fail closed; registry untouched", async () => {
  const store = join(DIR, "t8-pending.json");
  const reg = join(DIR, "t8-registry.json");
  writeStore(store, []);
  writeRegistry(reg, []);
  const tg = fakeTelegram();
  tg.setSendResult({ ok: false });
  const r = await issuance.registerPendingAuthorization(store, registerRequest(), {
    config: fakeConfig({ pending_store_path: store, registry_path: reg }),
    telegram: tg,
    loadRegistry: registry.loadRegistry,
  });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_TELEGRAM_DELIVERY_FAILED"));
  const afterStore = JSON.parse(readFileSync(store, "utf8"));
  assert.equal(afterStore.decisions.length, 0);
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

await test("9 caller cannot provide registry/store paths", async () => {
  const store = join(DIR, "t9-pending.json");
  writeStore(store, []);
  const bad = registerRequest({
    registry_path: "C:\\evil\\registry.json",
    pending_store_path: "C:\\evil\\pending.json",
    authorization_id: "AUTH-9",
    pending_decision_id: "PEND-9",
  });
  const tg = fakeTelegram();
  const r = await issuance.registerPendingAuthorization(store, bad, {
    config: fakeConfig({ pending_store_path: store }),
    telegram: tg,
  });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_REGISTER_REQUEST_INVALID"));
});

await test("10 caller cannot provide Telegram identity/token", async () => {
  const store = join(DIR, "t10-pending.json");
  writeStore(store, []);
  const bad = registerRequest({
    operator_telegram_chat_id: "999",
    operator_telegram_user_id: "888",
    telegram_bot_token: "STOLEN",
    authorization_id: "AUTH-10",
    pending_decision_id: "PEND-10",
  });
  const tg = fakeTelegram();
  const r = await issuance.registerPendingAuthorization(store, bad, {
    config: fakeConfig({ pending_store_path: store }),
    telegram: tg,
  });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_REGISTER_REQUEST_INVALID"));
});

await test("11 no HTTP /issue — service surface rejects it", async () => {
  const svc = await serve.startRuntimeAuthorizationIssuanceService({ port: 0 });
  try {
    for (const path of ["/v4/authorization/issue", "/issue", "/v4/authorization/approve", "/v4/authorization/reject"]) {
      const res = await fetch(`http://127.0.0.1:${svc.address.port}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ any: "human decision attempt" }),
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.ok, false);
    }
  } finally {
    await svc.close();
  }
});

/* ------------------------------------------------------------------ */
/* 12–13 status                                                        */
/* ------------------------------------------------------------------ */

await test("12 status is read-only", async () => {
  const store = join(DIR, "t12-pending.json");
  writeStore(store, [pendingRecord()]);
  const before = readFileSync(store, "utf8");
  const r = issuance.getPendingAuthorizationStatus(store, "PEND-1", {
    now: new Date("2026-08-31T12:01:00Z"),
  });
  assert.equal(r.ok, true);
  assert.equal(r.state, "PENDING");
  assert.equal(readFileSync(store, "utf8"), before);
});

await test("13 status unknown pending fail closed", async () => {
  const store = join(DIR, "t13-pending.json");
  writeStore(store, []);
  const r = issuance.getPendingAuthorizationStatus(store, "PEND-NOPE");
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_PENDING_NOT_FOUND"));
});

/* ------------------------------------------------------------------ */
/* 14–19 direct Telegram identity/expiry guards                        */
/* ------------------------------------------------------------------ */

function decisionOptions(overrides = {}) {
  const store = overrides.store || join(DIR, "t-pending.json");
  const reg = overrides.registry || join(DIR, "t-registry.json");
  const config = fakeConfig({ pending_store_path: store, registry_path: reg });
  return {
    config,
    pendingStorePath: store,
    now: overrides.now || new Date("2026-08-31T12:05:00Z"),
    loadRegistry: registry.loadRegistry,
    issueActiveEntry: registry.issueActiveEntry,
    ...overrides,
  };
}

await test("14 wrong Telegram chat id → no issuance", async () => {
  const store = join(DIR, "t14-pending.json");
  const reg = join(DIR, "t14-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ chat_id: 999999 }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_OPERATOR_IDENTITY_MISMATCH"));
  assert.equal(JSON.parse(readFileSync(store, "utf8")).decisions[0].state, "PENDING");
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

await test("15 wrong Telegram user id → no issuance", async () => {
  const store = join(DIR, "t15-pending.json");
  const reg = join(DIR, "t15-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ from_id: 999999 }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_OPERATOR_IDENTITY_MISMATCH"));
  assert.equal(JSON.parse(readFileSync(store, "utf8")).decisions[0].state, "PENDING");
});

await test("16 malformed callback → no issuance", async () => {
  const store = join(DIR, "t16-pending.json");
  const reg = join(DIR, "t16-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ data: "garbage" }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_TELEGRAM_UPDATE_INVALID"));
});

await test("17 unknown pending callback → no issuance", async () => {
  const store = join(DIR, "t17-pending.json");
  const reg = join(DIR, "t17-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ pending_decision_id: "PEND-UNKNOWN" }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_PENDING_NOT_FOUND"));
});

await test("18 expired pending → EXPIRED/no issuance", async () => {
  const store = join(DIR, "t18-pending.json");
  const reg = join(DIR, "t18-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const late = new Date("2026-08-31T12:15:01Z");
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate(),
    decisionOptions({ store, registry: reg, now: late }),
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_EXPIRED"));
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
  // status also materializes EXPIRED
  const s = issuance.getPendingAuthorizationStatus(store, "PEND-1", { now: late });
  assert.equal(s.state, "EXPIRED");
});

await test("19 valid REJECT → REJECTED; registry unchanged", async () => {
  const store = join(DIR, "t19-pending.json");
  const reg = join(DIR, "t19-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ option: "reject" }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r.ok, true);
  assert.equal(r.state, "REJECTED");
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  assert.equal(d.state, "REJECTED");
  assert.equal(d.selected_option, "REJECT");
  assert.equal(d.telegram_update_id, "1001");
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

/* ------------------------------------------------------------------ */
/* 20–24 APPROVE lifecycle + replay                                    */
/* ------------------------------------------------------------------ */

await test("20 valid APPROVE: PENDING→APPROVED→registry ACTIVE→ISSUED", async () => {
  const store = join(DIR, "t20-pending.json");
  const reg = join(DIR, "t20-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const now = new Date("2026-08-31T12:05:00Z");
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate(),
    decisionOptions({ store, registry: reg, now }),
  );
  assert.equal(r.ok, true);
  assert.equal(r.state, "ISSUED");
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  assert.equal(d.state, "ISSUED");
  assert.equal(d.selected_option, "APPROVE");
  assert.equal(d.issued_at, now.toISOString());
  const entries = JSON.parse(readFileSync(reg, "utf8")).entries;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].authorization_id, "AUTH-1");
  assert.equal(entries[0].state, "ACTIVE");
  assert.equal(entries[0].route_id, "opencode+qwen_local");
  assert.equal(entries[0].issued_at, now.toISOString());
});

await test("21 authorization expiry server-derived <=3600 sec", async () => {
  const store = join(DIR, "t21-pending.json");
  const reg = join(DIR, "t21-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const now = new Date("2026-08-31T12:05:00Z");
  await issuance.handleTelegramDecisionUpdate(
    telegramUpdate(),
    decisionOptions({ store, registry: reg, now }),
  );
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  const delta =
    (Date.parse(d.authorization_expires_at) - now.getTime()) / 1000;
  assert.ok(delta > 0 && delta <= 3600);
  const entry = JSON.parse(readFileSync(reg, "utf8")).entries[0];
  assert.equal(entry.expires_at, d.authorization_expires_at);
});

await test("22 duplicate Telegram update id blocked", async () => {
  const store = join(DIR, "t22-pending.json");
  const reg = join(DIR, "t22-registry.json");
  writeStore(store, [
    pendingRecord(),
    pendingRecord({ pending_decision_id: "PEND-2", authorization_id: "AUTH-2" }),
  ]);
  writeRegistry(reg, []);
  // PEND-2 first consumes update 1001 via REJECT
  const r1 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ pending_decision_id: "PEND-2", option: "reject" }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r1.ok, true);
  // PEND-1 tries the SAME update id
  const r2 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate(),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r2.ok, false);
  assert.ok(r2.reason_codes.includes("ISSUANCE_TELEGRAM_UPDATE_REUSED"));
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

await test("23 double APPROVE blocked", async () => {
  const store = join(DIR, "t23-pending.json");
  const reg = join(DIR, "t23-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const opts = decisionOptions({ store, registry: reg });
  const r1 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ update_id: 2001 }),
    opts,
  );
  assert.equal(r1.ok, true);
  const r2 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ update_id: 2002 }),
    opts,
  );
  assert.equal(r2.ok, false);
  assert.ok(r2.reason_codes.includes("ISSUANCE_DECISION_ALREADY_CONSUMED"));
  const entries = JSON.parse(readFileSync(reg, "utf8")).entries;
  assert.equal(entries.length, 1);
});

await test("24 REJECT then APPROVE blocked", async () => {
  const store = join(DIR, "t24-pending.json");
  const reg = join(DIR, "t24-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const opts = decisionOptions({ store, registry: reg });
  const r1 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ update_id: 3001, option: "reject" }),
    opts,
  );
  assert.equal(r1.ok, true);
  assert.equal(r1.state, "REJECTED");
  const r2 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ update_id: 3002 }),
    opts,
  );
  assert.equal(r2.ok, false);
  assert.ok(r2.reason_codes.includes("ISSUANCE_DECISION_ALREADY_CONSUMED"));
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

/* ------------------------------------------------------------------ */
/* 25–28 registry failure + reconciliation                             */
/* ------------------------------------------------------------------ */

await test("25 registry collision blocks issuance", async () => {
  const store = join(DIR, "t25-pending.json");
  const reg = join(DIR, "t25-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, [
    {
      authorization_id: "AUTH-1",
      state: "ACTIVE",
      route_id: "opencode+qwen_local",
      issued_at: "2026-08-31T10:00:00.000Z",
      expires_at: "2026-08-31T11:00:00.000Z",
      spent_at: null,
    },
  ]);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate(),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_AUTHORIZATION_ID_CONFLICT"));
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  assert.equal(d.state, "APPROVED");
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 1);
});

await test("26 registry failure after APPROVED leaves APPROVED", async () => {
  const store = join(DIR, "t26-pending.json");
  const reg = join(DIR, "t26-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate(),
    decisionOptions({
      store,
      registry: reg,
      issueActiveEntry: () => ({
        ok: false,
        classification: "AUTHORIZATION_REJECTED",
        reason_codes: ["AUTHORIZATION_REGISTRY_UNAVAILABLE"],
      }),
    }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.state, "APPROVED");
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  assert.equal(d.state, "APPROVED");
  assert.equal(d.selected_option, "APPROVE");
  assert.equal(d.authorization_expires_at !== null, true);
  assert.equal(d.issued_at, null);
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

await test("27 exact reconciliation completes only same pre-bound authorization", async () => {
  const store = join(DIR, "t27-pending.json");
  const reg = join(DIR, "t27-registry.json");
  writeStore(store, [
    pendingRecord({
      state: "APPROVED",
      decision_at: "2026-08-31T12:05:00.000Z",
      selected_option: "APPROVE",
      telegram_update_id: "1001",
      telegram_chat_id: CHAT_ID,
      telegram_user_id: USER_ID,
      authorization_expires_at: "2026-08-31T13:05:00.000Z",
    }),
  ]);
  writeRegistry(reg, []);
  const r = issuance.reconcileApprovedPending(store, "PEND-1", {
    config: fakeConfig({ pending_store_path: store, registry_path: reg }),
    loadRegistry: registry.loadRegistry,
    issueActiveEntry: registry.issueActiveEntry,
    now: new Date("2026-08-31T12:10:00Z"),
  });
  assert.equal(r.ok, true);
  assert.equal(r.state, "ISSUED");
  const entries = JSON.parse(readFileSync(reg, "utf8")).entries;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].authorization_id, "AUTH-1");
  assert.equal(entries[0].expires_at, "2026-08-31T13:05:00.000Z");
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  assert.equal(d.state, "ISSUED");
  assert.equal(d.authorization_id, "AUTH-1");
});

await test("28 changed-binding reconciliation blocked", async () => {
  const store = join(DIR, "t28-pending.json");
  const reg = join(DIR, "t28-registry.json");
  writeStore(store, [
    pendingRecord({
      pending_decision_id: "PEND-28",
      authorization_id: "AUTH-28",
      state: "APPROVED",
      decision_at: "2026-08-31T12:05:00.000Z",
      selected_option: "APPROVE",
      telegram_update_id: "1001",
      telegram_chat_id: CHAT_ID,
      telegram_user_id: USER_ID,
      authorization_expires_at: "2026-08-31T13:05:00.000Z",
    }),
  ]);
  writeRegistry(reg, [
    {
      // registry already holds a DIFFERENT entry for the same id
      authorization_id: "AUTH-28",
      state: "ACTIVE",
      route_id: "opencode+qwen_local",
      issued_at: "2026-08-31T10:00:00.000Z",
      expires_at: "2026-08-31T10:59:00.000Z",
      spent_at: null,
    },
  ]);
  const r = issuance.reconcileApprovedPending(store, "PEND-28", {
    config: fakeConfig({ pending_store_path: store, registry_path: reg }),
    loadRegistry: registry.loadRegistry,
    issueActiveEntry: registry.issueActiveEntry,
  });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("ISSUANCE_AUTHORIZATION_ID_CONFLICT"));
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 1);
});

/* ------------------------------------------------------------------ */
/* 29–32 durability, registry owner, CLI, ledger                       */
/* ------------------------------------------------------------------ */

await test("29 service restart with durable pending store preserves state", async () => {
  const store = join(DIR, "t29-pending.json");
  const reg = join(DIR, "t29-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const opts = decisionOptions({ store, registry: reg });
  const r1 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ update_id: 4001 }),
    opts,
  );
  assert.equal(r1.ok, true);
  // Simulate restart: all in-memory state gone; fresh call from disk only
  const r2 = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ update_id: 4002 }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r2.ok, false);
  assert.ok(r2.reason_codes.includes("ISSUANCE_DECISION_ALREADY_CONSUMED"));
  const d = JSON.parse(readFileSync(store, "utf8")).decisions[0];
  assert.equal(d.state, "ISSUED");
  assert.equal(d.telegram_update_id, "4001");
});

await test("30 provenance issueActiveEntry appends one ACTIVE only", async () => {
  const reg = join(DIR, "t30-registry.json");
  writeRegistry(reg, []);
  const now = new Date("2026-08-31T12:00:00Z");
  const r1 = registry.issueActiveEntry(reg, {
    authorization_id: "AUTH-30",
    route_id: "opencode+qwen_local",
    expires_at: "2026-08-31T13:00:00.000Z",
  }, { now });
  assert.equal(r1.ok, true);
  const r2 = registry.issueActiveEntry(reg, {
    authorization_id: "AUTH-30",
    route_id: "opencode+qwen_local",
    expires_at: "2026-08-31T13:00:00.000Z",
  }, { now });
  assert.equal(r2.ok, false);
  assert.equal(r2.collision, true);
  const entries = JSON.parse(readFileSync(reg, "utf8")).entries;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].state, "ACTIVE");
  assert.equal(entries[0].spent_at, null);
});

await test("31 provenance CLI remains validation-only", async () => {
  const reg = join(DIR, "t31-registry.json");
  writeRegistry(reg, []);
  const run = spawnSync(process.execPath, [REGISTRY_TOOL, "--registry", reg], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0);
  const out = JSON.parse(run.stdout);
  assert.equal(out.ok, true);
  assert.equal(out.entry_count, 0);
  // No CLI flag exists that can create ACTIVE
  const run2 = spawnSync(
    process.execPath,
    [
      REGISTRY_TOOL,
      "--registry", reg,
      "--issue", "AUTH-CLI",
      "--route", "opencode+qwen_local",
    ],
    { encoding: "utf8" },
  );
  assert.equal(run2.status, 0);
  const out2 = JSON.parse(run2.stdout);
  assert.equal(out2.ok, true);
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

await test("32 spend ledger write calls = 0 across full APPROVE path", async () => {
  const store = join(DIR, "t32-pending.json");
  const reg = join(DIR, "t32-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  let ledgerCalls = 0;
  const opts = decisionOptions({
    store,
    registry: reg,
    recordDurableSpend: () => {
      ledgerCalls += 1;
      return { ok: true };
    },
  });
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate(),
    opts,
  );
  assert.equal(r.ok, true);
  assert.equal(ledgerCalls, 0);
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 1);
});

/* ------------------------------------------------------------------ */
/* 33–35 leakage + n8n boundary + service HTTP                         */
/* ------------------------------------------------------------------ */

await test("33 responses leak no paths/token/operator ids", async () => {
  const store = join(DIR, "t33-pending.json");
  const reg = join(DIR, "t33-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r = await issuance.handleTelegramDecisionUpdate(
    telegramUpdate({ chat_id: 999 }),
    decisionOptions({ store, registry: reg }),
  );
  assert.equal(r.ok, false);
  const serialized = JSON.stringify(r);
  assert.ok(!serialized.includes(TOKEN));
  assert.ok(!serialized.includes(CHAT_ID));
  assert.ok(!serialized.includes(USER_ID));
  assert.ok(!serialized.toLowerCase().includes(DIR.toLowerCase()));
  assert.ok(!serialized.includes("C:"));
  const status = issuance.getPendingAuthorizationStatus(store, "PEND-NOPE");
  const statusStr = JSON.stringify(status);
  assert.ok(!statusStr.toLowerCase().includes(DIR.toLowerCase()));
});

await test("34 adapter/OpenCode/Qwen calls = 0 (no execution imports)", async () => {
  const src = readFileSync(ISSUANCE_TOOL, "utf8");
  assert.ok(!src.includes("opencode-execution-adapter"));
  assert.ok(!src.includes("executeOpenCodeBounded"));
  assert.ok(!src.includes("durable-spend-ledger"));
  const serveSrc = readFileSync(SERVE_TOOL, "utf8");
  assert.ok(!serveSrc.includes("opencode-execution-adapter"));
  assert.ok(!serveSrc.includes("durable-spend-ledger"));
});

await test("35 no n8n-forwarded decision path exists", async () => {
  const src = readFileSync(ISSUANCE_TOOL, "utf8");
  const serveSrc = readFileSync(SERVE_TOOL, "utf8");
  for (const s of [src, serveSrc]) {
    assert.ok(!s.includes("n8n_attest"));
    assert.ok(!s.includes("attested_option"));
  }
  // The only two external paths the service handler routes
  assert.equal(serve.REGISTER_PENDING_PATH, "/v4/authorization/register-pending");
  assert.equal(serve.STATUS_PATH, "/v4/authorization/status");
  const store = join(DIR, "t35-pending.json");
  const reg = join(DIR, "t35-registry.json");
  writeStore(store, [pendingRecord()]);
  writeRegistry(reg, []);
  const r2 = await issuance.handleTelegramDecisionUpdate(
    {
      update_id: 5001,
      callback_query: {
        id: "cbq-x",
        from: { id: Number(USER_ID) },
        message: { chat: { id: Number(CHAT_ID) } },
        data: "ra:PEND-1:approve",
      },
      // spoofed n8n-style attestation fields must be inert
      operator_telegram_chat_id: "999",
      operator_telegram_user_id: "888",
      selected_option: "APPROVE",
    },
    decisionOptions({ store, registry: reg }),
  );
  // valid because identity came from the update itself; spoofed fields ignored
  assert.equal(r2.ok, true);
  assert.equal(r2.state, "ISSUED");
  // n8n-caller simulation: register+status only, never a decision surface
  const svc = await serve.startRuntimeAuthorizationIssuanceService({
    port: 0,
    issuanceConfigPath: join(DIR, "t35-config.json"),
    loadIssuanceConfig: () => ({
      ok: true,
      config: fakeConfig({ pending_store_path: store, registry_path: reg }),
    }),
    telegram: fakeTelegram(),
    loadRegistry: registry.loadRegistry,
  });
  try {
    const res = await fetch(
      `http://127.0.0.1:${svc.address.port}/v4/authorization/register-pending`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema_version: issuance.REGISTER_PENDING_REQUEST_SCHEMA,
          pending_decision_id: "PEND-35",
          authorization_id: "AUTH-35",
          task_id: "T",
          execution_id: "E",
          route_id: "opencode+qwen_local",
          scope_digest: SCOPE_DIGEST,
          pending_ttl_seconds: 900,
          // n8n attempts to smuggle a decision
          selected_option: "APPROVE",
          operator_telegram_chat_id: CHAT_ID,
          operator_telegram_user_id: USER_ID,
          telegram_bot_token: TOKEN,
        }),
      },
    );
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.ok(body.reason_codes.includes("ISSUANCE_REGISTER_REQUEST_INVALID"));
    assert.equal(JSON.parse(readFileSync(store, "utf8")).decisions.length, 1);
  } finally {
    await svc.close();
  }
});

/* ------------------------------------------------------------------ */
/* Extra: service-level register + status through real HTTP (port 0)   */
/* ------------------------------------------------------------------ */

await test("36 service register+status round trip on ephemeral port", async () => {
  const store = join(DIR, "t36-pending.json");
  const reg = join(DIR, "t36-registry.json");
  writeStore(store, []);
  writeRegistry(reg, []);
  const tg = fakeTelegram();
  const svc = await serve.startRuntimeAuthorizationIssuanceService({
    port: 0,
    issuanceConfigPath: join(DIR, "t36-config.json"),
    loadIssuanceConfig: () => ({
      ok: true,
      config: fakeConfig({ pending_store_path: store, registry_path: reg }),
    }),
    telegram: tg,
    loadRegistry: registry.loadRegistry,
  });
  try {
    const base = `http://127.0.0.1:${svc.address.port}`;
    const regRes = await fetch(`${base}${serve.REGISTER_PENDING_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        registerRequest({ pending_decision_id: "PEND-36", authorization_id: "AUTH-36" }),
      ),
    });
    assert.equal(regRes.status, 200);
    const regBody = await regRes.json();
    assert.equal(regBody.ok, true);
    assert.equal(regBody.state, "PENDING");
    const statusRes = await fetch(`${base}${serve.STATUS_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schema_version: issuance.STATUS_REQUEST_SCHEMA,
        pending_decision_id: "PEND-36",
      }),
    });
    const statusBody = await statusRes.json();
    assert.equal(statusBody.ok, true);
    assert.equal(statusBody.state, "PENDING");
    assert.equal(statusBody.authorization_id, "AUTH-36");
    const serialized = JSON.stringify(statusBody);
    assert.ok(!serialized.includes(TOKEN));
    assert.ok(!serialized.toLowerCase().includes(DIR.toLowerCase()));
  } finally {
    await svc.close();
  }
});

/* ------------------------------------------------------------------ */
/* BugBot correction regressions (CLI parsers, EXPIRED validation)     */
/* ------------------------------------------------------------------ */

await test("37 service CLI parser acquires --issuance-config (A)", async () => {
  const configPath = join(DIR, "t37-config.json");
  writeFileSync(
    configPath,
    `${JSON.stringify(
      fakeConfig({ pending_store_path: join(DIR, "t37-pending.json") }),
      null,
      2,
    )}\n`,
  );
  // Async spawn: read the startup JSON line, then kill (service keeps serving)
  const child = spawn(process.execPath, [
    SERVE_TOOL,
    "--issuance-config", configPath,
    "--port", "0",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  let err = "";
  child.stdout.on("data", (c) => {
    out += c;
  });
  child.stderr.on("data", (c) => {
    err += c;
  });
  const startup = await new Promise((resolvePromise) => {
    const timer = setTimeout(() => resolvePromise(null), 8000);
    const poll = setInterval(() => {
      if (out.includes("\n") || err.includes("\n")) {
        clearTimeout(timer);
        clearInterval(poll);
        resolvePromise(out.trim() || err.trim());
      }
    }, 25);
    child.on("exit", () => {
      clearTimeout(timer);
      clearInterval(poll);
      resolvePromise(out.trim() || err.trim() || null);
    });
  });
  try {
    child.kill();
  } catch {
    /* already exited */
  }
  assert.notEqual(startup, null);
  const parsed = JSON.parse(startup);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.error_class, undefined);
  assert.equal(parsed.register_pending_path, serve.REGISTER_PENDING_PATH);
  assert.equal(parsed.status_path, serve.STATUS_PATH);
  assert.ok(parsed.port >= 0);
  // Explicit negative: no flag fails fast with CONFIG_REQUIRED
  const run2 = spawnSync(process.execPath, [SERVE_TOOL], { encoding: "utf8" });
  const out2 = JSON.parse(run2.stderr || run2.stdout);
  assert.equal(out2.error_class, "ISSUANCE_CONFIG_REQUIRED");
});

await test("38 pending-store CLI acquires --pending-store (B)", async () => {
  const store = join(DIR, "t38-pending.json");
  writeStore(store, []);
  const run = spawnSync(process.execPath, [ISSUANCE_TOOL, "--pending-store", store], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0);
  const out = JSON.parse(run.stdout);
  assert.equal(out.ok, true);
});

await test("39 valid EXPIRED pending record passes validation (C)", async () => {
  const v = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [
      pendingRecord({
        state: "EXPIRED",
        pending_expires_at: "2026-08-31T12:15:00.000Z",
      }),
    ],
  });
  assert.equal(v.ok, true);
  // Also loadable from disk
  const store = join(DIR, "t39-pending.json");
  writeStore(store, [pendingRecord({ state: "EXPIRED" })]);
  const r = issuance.loadPendingStore(store);
  assert.equal(r.ok, true);
});

await test("40 malformed EXPIRED/state-inconsistent fails closed (D)", async () => {
  // EXPIRED with smuggled receipt fields must fail
  const bad1 = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [
      pendingRecord({
        state: "EXPIRED",
        selected_option: "APPROVE",
        decision_at: "2026-08-31T12:05:00.000Z",
        telegram_update_id: "1001",
        telegram_chat_id: CHAT_ID,
        telegram_user_id: USER_ID,
      }),
    ],
  });
  assert.equal(bad1.ok, false);
  // EXPIRED with issued_at must fail
  const bad2 = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [pendingRecord({ state: "EXPIRED", issued_at: "2026-08-31T12:06:00.000Z" })],
  });
  assert.equal(bad2.ok, false);
  // PENDING with any receipt must still fail
  const bad3 = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [pendingRecord({ decision_at: "2026-08-31T12:05:00.000Z" })],
  });
  assert.equal(bad3.ok, false);
});

await test("41 APPROVED/REJECTED/ISSUED receipt validation unchanged (E)", async () => {
  const approved = pendingRecord({
    state: "APPROVED",
    selected_option: "APPROVE",
    decision_at: "2026-08-31T12:05:00.000Z",
    telegram_update_id: "1001",
    telegram_chat_id: CHAT_ID,
    telegram_user_id: USER_ID,
    authorization_expires_at: "2026-08-31T13:05:00.000Z",
  });
  assert.equal(
    issuance.validatePendingStoreObject({
      schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
      decisions: [approved],
    }).ok,
    true,
  );
  // APPROVED with REJECT option must fail
  const approvedWrong = { ...approved, selected_option: "REJECT" };
  assert.equal(
    issuance.validatePendingStoreObject({
      schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
      decisions: [approvedWrong],
    }).ok,
    false,
  );
  const rejected = pendingRecord({
    state: "REJECTED",
    selected_option: "REJECT",
    decision_at: "2026-08-31T12:05:00.000Z",
    telegram_update_id: "1002",
    telegram_chat_id: CHAT_ID,
    telegram_user_id: USER_ID,
  });
  assert.equal(
    issuance.validatePendingStoreObject({
      schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
      decisions: [rejected],
    }).ok,
    true,
  );
  // REJECTED with authorization_expires_at must fail
  const rejectedBad = { ...rejected, authorization_expires_at: "2026-08-31T13:05:00.000Z" };
  assert.equal(
    issuance.validatePendingStoreObject({
      schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
      decisions: [rejectedBad],
    }).ok,
    false,
  );
  const issued = pendingRecord({
    state: "ISSUED",
    selected_option: "APPROVE",
    decision_at: "2026-08-31T12:05:00.000Z",
    telegram_update_id: "1003",
    telegram_chat_id: CHAT_ID,
    telegram_user_id: USER_ID,
    authorization_expires_at: "2026-08-31T13:05:00.000Z",
    issued_at: "2026-08-31T12:05:30.000Z",
  });
  assert.equal(
    issuance.validatePendingStoreObject({
      schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
      decisions: [issued],
    }).ok,
    true,
  );
  // ISSUED without issued_at must fail
  const issuedBad = { ...issued, issued_at: null };
  assert.equal(
    issuance.validatePendingStoreObject({
      schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
      decisions: [issuedBad],
    }).ok,
    false,
  );
  // Duplicate telegram_update_id across two receipt records must fail
  const dup = issuance.validatePendingStoreObject({
    schema_version: issuance.PENDING_STORE_SCHEMA_VERSION,
    decisions: [
      { ...rejected, telegram_update_id: "1002" },
      { ...issued, telegram_update_id: "1002", authorization_id: "AUTH-X", pending_decision_id: "PEND-X" },
    ],
  });
  assert.equal(dup.ok, false);
});

await test("42 pending-store CLI emits correct decision_count (F)", async () => {
  const store = join(DIR, "t42-pending.json");
  writeStore(store, [
    pendingRecord(),
    pendingRecord({
      pending_decision_id: "PEND-42B",
      authorization_id: "AUTH-42B",
      state: "REJECTED",
      selected_option: "REJECT",
      decision_at: "2026-08-31T12:05:00.000Z",
      telegram_update_id: "4201",
      telegram_chat_id: CHAT_ID,
      telegram_user_id: USER_ID,
    }),
  ]);
  const run = spawnSync(process.execPath, [ISSUANCE_TOOL, "--pending-store", store], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0);
  const out = JSON.parse(run.stdout);
  assert.equal(out.ok, true);
  assert.equal(out.decision_count, 2);
  assert.ok(!run.stdout.includes("AUTH-"));
  assert.ok(!run.stdout.includes(CHAT_ID));
});

await test("43 provenance registry CLI retains zero issuance capability (G)", async () => {
  const reg = join(DIR, "t43-registry.json");
  writeRegistry(reg, []);
  const run = spawnSync(process.execPath, [REGISTRY_TOOL, "--registry", reg], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0);
  const out = JSON.parse(run.stdout);
  assert.equal(out.ok, true);
  assert.equal(out.entry_count, 0);
  assert.equal(JSON.parse(readFileSync(reg, "utf8")).entries.length, 0);
});

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`- ${f.name}: ${f.message}`);
  process.exit(1);
}
process.exit(0);
