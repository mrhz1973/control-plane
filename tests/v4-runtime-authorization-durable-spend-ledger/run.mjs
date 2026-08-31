#!/usr/bin/env node
/**
 * Target suite for tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs
 * Offline only. No endpoint HTTP. No OpenCode/Qwen/provider.
 */
import { strict as assert } from "node:assert";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const TOOL = join(ROOT, "tools", "v4-runtime-authorization-durable-spend-ledger-v1.mjs");
const mod = await import(pathToFileURL(TOOL).href);

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

const DIR = mkdtempSync(join(tmpdir(), "v4-spend-ledger-"));

function writeLedger(path, spends) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        schema_version: mod.LEDGER_SCHEMA_VERSION,
        spends,
      },
      null,
      2,
    )}\n`,
  );
}

function spend(overrides = {}) {
  return {
    authorization_id: overrides.authorization_id || "AUTH-1",
    execution_id: overrides.execution_id || "exec-1",
    route_id: overrides.route_id || "opencode+qwen_local",
    spent_at: overrides.spent_at || new Date().toISOString(),
    spend_kind: overrides.spend_kind || "ADMISSION_CONSUMED",
  };
}

await test("1 empty valid ledger PASS", async () => {
  const p = join(DIR, "empty.json");
  writeLedger(p, []);
  const r = mod.loadSpendLedger(p);
  assert.equal(r.ok, true);
  assert.equal(r.ledger.spends.length, 0);
  const v = mod.validateSpendLedgerObject({
    schema_version: mod.LEDGER_SCHEMA_VERSION,
    spends: [],
  });
  assert.equal(v.ok, true);
});

await test("2 missing ledger fail closed", async () => {
  const r = mod.loadSpendLedger(join(DIR, "missing.json"));
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE"));
});

await test("3 malformed ledger fail closed", async () => {
  const p = join(DIR, "malformed.json");
  writeFileSync(p, "{ not json");
  const r = mod.loadSpendLedger(p);
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_INVALID"));
});

await test("4 duplicate authorization_id invalid", async () => {
  const p = join(DIR, "dup.json");
  writeLedger(p, [spend({ authorization_id: "DUP" }), spend({ authorization_id: "DUP", execution_id: "e2" })]);
  const r = mod.loadSpendLedger(p);
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_INVALID"));
});

await test("5 existing spend → AUTHORIZATION_ALREADY_SPENT", async () => {
  const p = join(DIR, "spent.json");
  writeLedger(p, [spend({ authorization_id: "AUTH-SPENT" })]);
  const r = mod.inspectDurableSpend(p, "AUTH-SPENT");
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
});

await test("6 spent id blocked regardless of route in ledger tool", async () => {
  const p = join(DIR, "route-indep.json");
  writeLedger(p, [
    spend({
      authorization_id: "AUTH-ROUTE",
      route_id: "future+other_route",
    }),
  ]);
  const r = mod.inspectDurableSpend(p, "AUTH-ROUTE");
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
  assert.equal(r.existing.route_id, "future+other_route");
});

await test("7 append adds exactly one record", async () => {
  const p = join(DIR, "append.json");
  writeLedger(p, []);
  const r = mod.recordDurableSpend(p, {
    authorization_id: "AUTH-APPEND",
    execution_id: "exec-a",
    route_id: "opencode+qwen_local",
  });
  assert.equal(r.ok, true);
  const after = JSON.parse(readFileSync(p, "utf8"));
  assert.equal(after.spends.length, 1);
  assert.equal(after.spends[0].authorization_id, "AUTH-APPEND");
  assert.equal(after.spends[0].spend_kind, "ADMISSION_CONSUMED");
});

await test("8 prior records remain immutable", async () => {
  const p = join(DIR, "immutable.json");
  const prior = spend({
    authorization_id: "AUTH-PRIOR",
    execution_id: "exec-prior",
    spent_at: "2026-01-01T00:00:00.000Z",
  });
  writeLedger(p, [prior]);
  const before = JSON.parse(readFileSync(p, "utf8")).spends[0];
  const r = mod.recordDurableSpend(p, {
    authorization_id: "AUTH-NEW",
    execution_id: "exec-new",
    route_id: "opencode+qwen_local",
  });
  assert.equal(r.ok, true);
  const after = JSON.parse(readFileSync(p, "utf8"));
  assert.equal(after.spends.length, 2);
  assert.deepEqual(after.spends[0], before);
});

await test("9 second append same id reject", async () => {
  const p = join(DIR, "second.json");
  writeLedger(p, []);
  const r1 = mod.recordDurableSpend(p, {
    authorization_id: "AUTH-ONCE",
    execution_id: "e1",
    route_id: "opencode+qwen_local",
  });
  assert.equal(r1.ok, true);
  const r2 = mod.recordDurableSpend(p, {
    authorization_id: "AUTH-ONCE",
    execution_id: "e2",
    route_id: "opencode+qwen_local",
  });
  assert.equal(r2.ok, false);
  assert.ok(r2.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
  assert.equal(JSON.parse(readFileSync(p, "utf8")).spends.length, 1);
});

await test("10 invalid spent_at reject", async () => {
  const v = mod.validateSpendLedgerObject({
    schema_version: mod.LEDGER_SCHEMA_VERSION,
    spends: [spend({ spent_at: "not-a-date" })],
  });
  assert.equal(v.ok, false);
  assert.equal(v.reason, "AUTHORIZATION_SPEND_LEDGER_INVALID");
});

await test("11 invalid spend_kind reject", async () => {
  const v = mod.validateSpendLedgerObject({
    schema_version: mod.LEDGER_SCHEMA_VERSION,
    spends: [spend({ spend_kind: "OTHER" })],
  });
  assert.equal(v.ok, false);
  assert.equal(v.reason, "AUTHORIZATION_SPEND_LEDGER_INVALID");
});

await test("12 path non absolute fail closed", async () => {
  const r = mod.loadSpendLedger("relative/ledger.json");
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE"));
  const r2 = mod.inspectDurableSpend("relative/ledger.json", "AUTH-X");
  assert.equal(r2.ok, false);
  assert.ok(r2.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE"));
});

await test("persist failure returns UNAVAILABLE", async () => {
  const p = join(DIR, "persist-fail.json");
  writeLedger(p, []);
  const r = mod.recordDurableSpend(
    p,
    {
      authorization_id: "AUTH-PF",
      execution_id: "e",
      route_id: "opencode+qwen_local",
    },
    {
      persistSpendLedger: () => {
        throw new Error("DISK");
      },
    },
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE"));
  assert.equal(JSON.parse(readFileSync(p, "utf8")).spends.length, 0);
  assert.ok(existsSync(p));
});

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`- ${f.name}: ${f.message}`);
  process.exit(1);
}
process.exit(0);
