#!/usr/bin/env node
/**
 * V4 — server-side issued-authorization provenance registry (v1).
 * Authority for authorization PROVENANCE and SPEND. User-local, outside Git.
 * The caller can NEVER select the registry path or add entries via HTTP.
 * Fail-closed on missing/malformed/duplicate/unknown/spent/expired.
 */
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const REGISTRY_SCHEMA_VERSION =
  "v4-runtime-authorization-provenance-registry-v1";
export const REGISTRY_REJECT = "AUTHORIZATION_REJECTED";

const RFC3339_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function reject(reason, extra = {}) {
  return { ok: false, classification: REGISTRY_REJECT, reason_codes: [reason], ...extra };
}

function validDate(value) {
  return typeof value === "string" && RFC3339_RE.test(value);
}

function parseInstant(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

/**
 * Validate a parsed registry object (pure). Duplicate ids, malformed states,
 * missing/malformed dates, wrong schema version -> invalid.
 */
export function validateRegistryObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
  }
  if (obj.schema_version !== REGISTRY_SCHEMA_VERSION) {
    return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
  }
  if (!Array.isArray(obj.entries)) {
    return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
  }
  const seen = new Set();
  for (const entry of obj.entries) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
    const id = entry.authorization_id;
    if (typeof id !== "string" || id.length === 0 || id.length > 200) {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
    if (seen.has(id)) {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
    seen.add(id);
    if (entry.state !== "ACTIVE" && entry.state !== "SPENT") {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
    if (entry.route_id !== "opencode+qwen_local") {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
    if (!validDate(entry.issued_at)) {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
    if (!validDate(entry.expires_at)) {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
    const spentOk =
      entry.state === "SPENT"
        ? validDate(entry.spent_at)
        : entry.spent_at === null || entry.spent_at === undefined;
    if (!spentOk) {
      return { ok: false, reason: "AUTHORIZATION_REGISTRY_INVALID" };
    }
  }
  return { ok: true, entries: obj.entries };
}

/** Read + validate the registry from a server-side absolute path. */
export function loadRegistry(registryPath) {
  if (!registryPath || typeof registryPath !== "string" || !isAbsolute(registryPath)) {
    return reject("AUTHORIZATION_REGISTRY_UNAVAILABLE");
  }
  if (!existsSync(registryPath)) {
    return reject("AUTHORIZATION_REGISTRY_UNAVAILABLE");
  }
  let obj;
  try {
    obj = JSON.parse(readFileSync(registryPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return reject("AUTHORIZATION_REGISTRY_INVALID");
  }
  const validated = validateRegistryObject(obj);
  if (!validated.ok) {
    return reject(validated.reason);
  }
  return { ok: true, registry: obj, registryPath };
}

/** Atomic temp+rename persistence (same directory). */
export function persistRegistry(registryPath, obj, options = {}) {
  const writeFileImpl = options.writeFile || writeFileSync;
  const renameImpl = options.rename || renameSync;
  const mkName = options.tempName || (() => `${resolve(registryPath)}.${randomUUID()}.tmp`);
  const temp = mkName();
  writeFileImpl(temp, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
  renameImpl(temp, registryPath);
}

/**
 * Read-only provenance inspect: load registry, lookup id, verify ACTIVE +
 * unexpired + route match. Does NOT spend. Used before in-memory binding.
 */
export function inspectAuthorization(registryPath, authorizationId, options = {}) {
  const routeId = options.routeId || "opencode+qwen_local";
  const load = options.loadRegistry || loadRegistry;
  const now = options.now || new Date();

  if (
    !authorizationId ||
    typeof authorizationId !== "string" ||
    authorizationId.length === 0 ||
    authorizationId.length > 200
  ) {
    return reject("AUTHORIZATION_ID_NOT_ISSUED");
  }

  const loaded = load(registryPath);
  if (!loaded.ok) {
    return reject(loaded.reason_codes[0]);
  }

  const entry = loaded.registry.entries.find(
    (e) => e.authorization_id === authorizationId,
  );
  if (!entry) {
    return reject("AUTHORIZATION_ID_NOT_ISSUED");
  }
  // Defensive: v1 registry schema const-pins route_id; mismatch is unreachable
  // on a valid registry file but kept for forward compatibility.
  if (entry.route_id !== routeId) {
    return reject("AUTHORIZATION_ROUTE_MISMATCH");
  }
  if (entry.state === "SPENT") {
    return reject("AUTHORIZATION_ALREADY_SPENT");
  }
  const expires = parseInstant(entry.expires_at);
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  if (expires === null) {
    return reject("AUTHORIZATION_REGISTRY_INVALID");
  }
  if (nowMs >= expires) {
    return reject("AUTHORIZATION_EXPIRED");
  }

  return { ok: true, authorization_id: authorizationId, registry: loaded.registry };
}

/**
 * Admit one authorization_id: verify provenance, then atomically transition
 * ACTIVE -> SPENT and persist BEFORE any adapter/occupancy/runner action.
 * Returns { ok } on success (entry spent durably) or fail-closed rejection.
 */
export function admitAuthorization(registryPath, authorizationId, options = {}) {
  const persist = options.persistRegistry || persistRegistry;
  const now = options.now || new Date();

  const inspected = inspectAuthorization(registryPath, authorizationId, options);
  if (!inspected.ok) {
    return inspected;
  }

  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const next = {
    schema_version: REGISTRY_SCHEMA_VERSION,
    entries: inspected.registry.entries.map((e) =>
      e.authorization_id === authorizationId
        ? {
            ...e,
            state: "SPENT",
            spent_at: now instanceof Date ? now.toISOString() : new Date(nowMs).toISOString(),
          }
        : e,
    ),
  };

  try {
    persist(registryPath, next);
  } catch {
    return reject("AUTHORIZATION_REGISTRY_UNAVAILABLE");
  }

  return { ok: true, spent: true, authorization_id: authorizationId };
}

/**
 * Sole ACTIVE-entry writer for the issuance owner (bounded extension).
 * Appends exactly one ACTIVE entry for a pre-bound authorization id.
 * Never spends, never touches the spend ledger, never invokes execution.
 * Collision / invalid / unavailable registry → fail closed, registry untouched.
 */
export function issueActiveEntry(registryPath, entry, options = {}) {
  const load = options.loadRegistry || loadRegistry;
  const persist = options.persistRegistry || persistRegistry;
  const now = options.now || new Date();

  if (
    !registryPath ||
    typeof registryPath !== "string" ||
    !isAbsolute(registryPath)
  ) {
    return reject("AUTHORIZATION_REGISTRY_UNAVAILABLE");
  }
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return reject("AUTHORIZATION_REGISTRY_INVALID");
  }
  const id = entry.authorization_id;
  if (typeof id !== "string" || id.length === 0 || id.length > 200) {
    return reject("AUTHORIZATION_REGISTRY_INVALID");
  }
  if (entry.route_id !== "opencode+qwen_local") {
    return reject("AUTHORIZATION_REGISTRY_INVALID");
  }

  const loaded = load(registryPath);
  if (!loaded.ok) {
    return reject(loaded.reason_codes[0]);
  }

  if (loaded.registry.entries.some((e) => e.authorization_id === id)) {
    return reject("AUTHORIZATION_REGISTRY_INVALID", {
      reason_codes: ["AUTHORIZATION_REGISTRY_INVALID"],
      collision: true,
    });
  }

  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const issuedAt =
    entry.issued_at ||
    (now instanceof Date ? now.toISOString() : new Date(nowMs).toISOString());
  const expiresAt = entry.expires_at;
  if (
    !validDate(expiresAt) ||
    parseInstant(expiresAt) === null ||
    parseInstant(expiresAt) <= nowMs
  ) {
    return reject("AUTHORIZATION_REGISTRY_INVALID");
  }

  const next = {
    schema_version: REGISTRY_SCHEMA_VERSION,
    entries: [
      ...loaded.registry.entries.map((e) => ({ ...e })),
      {
        authorization_id: id,
        state: "ACTIVE",
        route_id: "opencode+qwen_local",
        issued_at: issuedAt,
        expires_at: expiresAt,
        spent_at: null,
      },
    ],
  };

  // Self-check: the appended object must still validate before persisting.
  const selfCheck = validateRegistryObject(next);
  if (!selfCheck.ok) {
    return reject(selfCheck.reason);
  }

  try {
    persist(registryPath, next, options);
  } catch {
    return reject("AUTHORIZATION_REGISTRY_UNAVAILABLE");
  }

  return {
    ok: true,
    issued: true,
    authorization_id: id,
    entry: next.entries[next.entries.length - 1],
  };
}

const isMain =
  process.argv[1] &&
  process.argv[1]
    .replace(/\\/g, "/")
    .endsWith("v4-runtime-authorization-provenance-registry-v1.mjs");

if (isMain) {
  // CLI: structural validation only. Never issues, never admits.
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const registryPath = args.get("--registry");
  const result = registryPath ? loadRegistry(registryPath) : reject("AUTHORIZATION_REGISTRY_UNAVAILABLE");
  process.stdout.write(
    `${JSON.stringify({
      schema_version: "v4-runtime-authorization-provenance-registry-check-v1",
      ok: result.ok === true,
      ...(result.registryPath ? { registry_path: result.registryPath } : {}),
      ...(result.registry ? { entry_count: result.registry.entries.length } : {}),
      ...(result.reason_codes ? { reason_codes: result.reason_codes } : {}),
    })}\n`,
  );
  process.exit(result.ok === true ? 0 : 1);
}
