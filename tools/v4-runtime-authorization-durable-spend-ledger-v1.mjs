#!/usr/bin/env node
/**
 * V4 — durable global authorization spend ledger (v1).
 * Authority for durable consumed-authorization history across routes.
 * User-local, outside Git. Append-only; no issuance/delete/compaction API.
 * The caller can NEVER select the ledger path or mutate contents via HTTP.
 */
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const LEDGER_SCHEMA_VERSION =
  "v4-runtime-authorization-durable-spend-ledger-v1";
export const LEDGER_REJECT = "AUTHORIZATION_REJECTED";
export const SPEND_KIND_ADMISSION = "ADMISSION_CONSUMED";

const RFC3339_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function reject(reason, extra = {}) {
  return {
    ok: false,
    classification: LEDGER_REJECT,
    reason_codes: [reason],
    ...extra,
  };
}

function validDate(value) {
  return typeof value === "string" && RFC3339_RE.test(value);
}

function validId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 200;
}

/**
 * Validate a parsed ledger object (pure). Duplicate authorization_ids,
 * malformed dates/kinds, wrong schema → INVALID.
 */
export function validateSpendLedgerObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
  }
  if (obj.schema_version !== LEDGER_SCHEMA_VERSION) {
    return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
  }
  if (!Array.isArray(obj.spends)) {
    return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
  }
  const seen = new Set();
  for (const entry of obj.spends) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
    if (!validId(entry.authorization_id)) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
    if (seen.has(entry.authorization_id)) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
    seen.add(entry.authorization_id);
    if (!validId(entry.execution_id)) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
    if (!validId(entry.route_id)) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
    if (!validDate(entry.spent_at)) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
    if (entry.spend_kind !== SPEND_KIND_ADMISSION) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
    const keys = Object.keys(entry).sort();
    const expected = [
      "authorization_id",
      "execution_id",
      "route_id",
      "spend_kind",
      "spent_at",
    ].sort();
    if (keys.length !== expected.length || keys.some((k, i) => k !== expected[i])) {
      return { ok: false, reason: "AUTHORIZATION_SPEND_LEDGER_INVALID" };
    }
  }
  return { ok: true, spends: obj.spends };
}

/** Read + validate the ledger from a server-side absolute path. */
export function loadSpendLedger(ledgerPath) {
  if (!ledgerPath || typeof ledgerPath !== "string" || !isAbsolute(ledgerPath)) {
    return reject("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE");
  }
  if (!existsSync(ledgerPath)) {
    return reject("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE");
  }
  let obj;
  try {
    obj = JSON.parse(readFileSync(ledgerPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return reject("AUTHORIZATION_SPEND_LEDGER_INVALID");
  }
  const validated = validateSpendLedgerObject(obj);
  if (!validated.ok) {
    return reject(validated.reason);
  }
  return { ok: true, ledger: obj, ledgerPath };
}

/** Atomic temp+rename persistence (same directory). */
export function persistSpendLedger(ledgerPath, obj, options = {}) {
  const writeFileImpl = options.writeFile || writeFileSync;
  const renameImpl = options.rename || renameSync;
  const mkName =
    options.tempName || (() => `${resolve(ledgerPath)}.${randomUUID()}.tmp`);
  const temp = mkName();
  writeFileImpl(temp, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
  renameImpl(temp, ledgerPath);
}

/**
 * Read-only durable spend inspect. Does NOT append.
 * Already present → AUTHORIZATION_ALREADY_SPENT (global, route-independent).
 */
export function inspectDurableSpend(ledgerPath, authorizationId, options = {}) {
  const load = options.loadSpendLedger || loadSpendLedger;

  if (!validId(authorizationId)) {
    return reject("AUTHORIZATION_SPEND_LEDGER_INVALID");
  }

  const loaded = load(ledgerPath);
  if (!loaded.ok) {
    return reject(loaded.reason_codes[0]);
  }

  const found = loaded.ledger.spends.find(
    (e) => e.authorization_id === authorizationId,
  );
  if (found) {
    return reject("AUTHORIZATION_ALREADY_SPENT", {
      existing: {
        authorization_id: found.authorization_id,
        execution_id: found.execution_id,
        route_id: found.route_id,
        spend_kind: found.spend_kind,
      },
    });
  }

  return { ok: true, authorization_id: authorizationId, ledger: loaded.ledger };
}

/**
 * Append one ADMISSION_CONSUMED record and persist atomically.
 * Existing records remain immutable; duplicate authorization_id rejected.
 */
export function recordDurableSpend(ledgerPath, record, options = {}) {
  const load = options.loadSpendLedger || loadSpendLedger;
  const persist = options.persistSpendLedger || persistSpendLedger;
  const now = options.now || new Date();

  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return reject("AUTHORIZATION_SPEND_LEDGER_INVALID");
  }

  const spentAt =
    record.spent_at ||
    (now instanceof Date ? now.toISOString() : new Date(now).toISOString());
  const spendKind = record.spend_kind || SPEND_KIND_ADMISSION;
  const entry = {
    authorization_id: record.authorization_id,
    execution_id: record.execution_id,
    route_id: record.route_id,
    spent_at: spentAt,
    spend_kind: spendKind,
  };

  const shape = validateSpendLedgerObject({
    schema_version: LEDGER_SCHEMA_VERSION,
    spends: [entry],
  });
  if (!shape.ok) {
    return reject(shape.reason);
  }

  const inspected = inspectDurableSpend(ledgerPath, entry.authorization_id, {
    loadSpendLedger: load,
  });
  if (!inspected.ok) {
    return inspected;
  }

  // Preserve prior records byte-identity by cloning then appending only.
  const prior = inspected.ledger.spends.map((e) => ({ ...e }));
  const next = {
    schema_version: LEDGER_SCHEMA_VERSION,
    spends: [...prior, entry],
  };

  try {
    persist(ledgerPath, next, options);
  } catch {
    return reject("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE");
  }

  return {
    ok: true,
    recorded: true,
    authorization_id: entry.authorization_id,
    spend: entry,
  };
}

const isMain =
  process.argv[1] &&
  process.argv[1]
    .replace(/\\/g, "/")
    .endsWith("v4-runtime-authorization-durable-spend-ledger-v1.mjs");

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const ledgerPath = args.get("--ledger");
  const result = ledgerPath
    ? loadSpendLedger(ledgerPath)
    : reject("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE");
  process.stdout.write(
    `${JSON.stringify({
      schema_version: "v4-runtime-authorization-durable-spend-ledger-check-v1",
      ok: result.ok === true,
      ...(result.ledgerPath ? { ledger_path: result.ledgerPath } : {}),
      ...(result.ledger ? { spend_count: result.ledger.spends.length } : {}),
      ...(result.reason_codes ? { reason_codes: result.reason_codes } : {}),
    })}\n`,
  );
  process.exit(result.ok === true ? 0 : 1);
}
