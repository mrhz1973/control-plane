#!/usr/bin/env node
/**
 * V4 — execution-adapter registry boundary.
 * Exact route_id registration + lookup only. No selection, auth, or execution.
 */
import { executeOpenCodeBounded } from "./opencode-execution-adapter-v1.mjs";

export const SNAPSHOT_SCHEMA = "v4-execution-adapter-registry-snapshot-v1";
export const OPENCODE_QWEN_LOCAL_ROUTE = "opencode+qwen_local";
export const OPENCODE_ADAPTER_ID = "opencode-execution-adapter-v1";
export const OPENCODE_IMPLEMENTER = "opencode";
export const OPENCODE_MODEL = "qwen_local";

const WILDCARD_RE = /[*?\s]|^\*$|^[*?]|[*?]$/;

function nonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0 && v === v.trim();
}

/**
 * Validate one adapter registration entry (runtime shape including run).
 * @returns {{ ok: boolean, reason_codes: string[] }}
 */
export function validateAdapterRegistration(entry) {
  const codes = [];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return { ok: false, reason_codes: ["ENTRY_MISSING"] };
  }
  if (!nonEmptyString(entry.route_id)) codes.push("ROUTE_ID_INVALID");
  if (!nonEmptyString(entry.adapter_id)) codes.push("ADAPTER_ID_INVALID");
  if (!nonEmptyString(entry.implementer)) codes.push("IMPLEMENTER_INVALID");
  if (!nonEmptyString(entry.model)) codes.push("MODEL_INVALID");
  if (typeof entry.dispatch_required !== "boolean") codes.push("DISPATCH_REQUIRED_INVALID");
  if (typeof entry.run !== "function") codes.push("RUN_MISSING");

  if (nonEmptyString(entry.route_id)) {
    if (WILDCARD_RE.test(entry.route_id) || entry.route_id === "*" || entry.route_id === "*+*") {
      codes.push("WILDCARD_ROUTE_REJECTED");
    }
    if (
      nonEmptyString(entry.implementer) &&
      nonEmptyString(entry.model) &&
      entry.route_id !== `${entry.implementer}+${entry.model}`
    ) {
      codes.push("ROUTE_IMPLEMENTER_MODEL_MISMATCH");
    }
  }

  if (codes.length) {
    return { ok: false, reason_codes: ["ADAPTER_REGISTRATION_INVALID", ...codes] };
  }
  return { ok: true, reason_codes: [] };
}

function wrapRegistry(map) {
  return {
    __kind: "v4-execution-adapter-registry-v1",
    get(routeId) {
      return map.get(routeId);
    },
    has(routeId) {
      return map.has(routeId);
    },
    get size() {
      return map.size;
    },
    keys() {
      return map.keys();
    },
    values() {
      return map.values();
    },
    entries() {
      return map.entries();
    },
    /** @internal */ _map: map,
  };
}

function asMap(registry) {
  if (!registry) return null;
  if (registry.__kind === "v4-execution-adapter-registry-v1" && registry._map instanceof Map) {
    return registry._map;
  }
  if (registry instanceof Map) return registry;
  return null;
}

/**
 * Create a registry from zero or more validated entries.
 * Fail-closed: any invalid/duplicate entry rejects the whole create.
 */
export function createExecutionAdapterRegistry(entries = []) {
  const map = new Map();
  const adapterIds = new Set();
  if (!Array.isArray(entries)) {
    return {
      ok: false,
      registry: null,
      reason_codes: ["ADAPTER_REGISTRY_INVALID", "ENTRIES_NOT_ARRAY"],
    };
  }
  for (const entry of entries) {
    const v = validateAdapterRegistration(entry);
    if (!v.ok) {
      return { ok: false, registry: null, reason_codes: ["ADAPTER_REGISTRY_INVALID", ...v.reason_codes] };
    }
    if (map.has(entry.route_id)) {
      return {
        ok: false,
        registry: null,
        reason_codes: ["ADAPTER_REGISTRY_INVALID", "DUPLICATE_ROUTE_ID", entry.route_id],
      };
    }
    if (adapterIds.has(entry.adapter_id)) {
      return {
        ok: false,
        registry: null,
        reason_codes: ["ADAPTER_REGISTRY_INVALID", "AMBIGUOUS_DUPLICATE_ADAPTER", entry.adapter_id],
      };
    }
    map.set(entry.route_id, { ...entry });
    adapterIds.add(entry.adapter_id);
  }
  return { ok: true, registry: wrapRegistry(map), reason_codes: [] };
}

/**
 * Register one additional adapter into an existing registry (mutates).
 */
export function registerExecutionAdapter(registry, entry) {
  const map = asMap(registry);
  if (!map) {
    return { ok: false, reason_codes: ["ADAPTER_REGISTRY_INVALID", "REGISTRY_SHAPE_INVALID"] };
  }
  const v = validateAdapterRegistration(entry);
  if (!v.ok) return { ok: false, reason_codes: v.reason_codes };

  if (map.has(entry.route_id)) {
    return { ok: false, reason_codes: ["ADAPTER_REGISTRATION_INVALID", "DUPLICATE_ROUTE_ID", entry.route_id] };
  }
  for (const existing of map.values()) {
    if (existing.adapter_id === entry.adapter_id) {
      return {
        ok: false,
        reason_codes: ["ADAPTER_REGISTRATION_INVALID", "AMBIGUOUS_DUPLICATE_ADAPTER", entry.adapter_id],
      };
    }
  }
  map.set(entry.route_id, { ...entry });
  return { ok: true, reason_codes: [] };
}

/**
 * Validate an existing registry (Map or wrapped registry).
 */
export function validateExecutionAdapterRegistry(registry) {
  const map = asMap(registry);
  if (!map) {
    return { ok: false, reason_codes: ["ADAPTER_REGISTRY_INVALID", "REGISTRY_SHAPE_INVALID"] };
  }
  const adapterIds = new Set();
  for (const [key, entry] of map.entries()) {
    const v = validateAdapterRegistration(entry);
    if (!v.ok) {
      return { ok: false, reason_codes: ["ADAPTER_REGISTRY_INVALID", ...v.reason_codes] };
    }
    if (key !== entry.route_id) {
      return {
        ok: false,
        reason_codes: ["ADAPTER_REGISTRY_INVALID", "MAP_KEY_ROUTE_MISMATCH", String(key)],
      };
    }
    if (adapterIds.has(entry.adapter_id)) {
      return {
        ok: false,
        reason_codes: ["ADAPTER_REGISTRY_INVALID", "AMBIGUOUS_DUPLICATE_ADAPTER", entry.adapter_id],
      };
    }
    adapterIds.add(entry.adapter_id);
  }
  return { ok: true, reason_codes: [] };
}

/**
 * Serializable snapshot — metadata only, never includes run.
 */
export function registrySnapshot(registry) {
  const map = asMap(registry);
  if (!map) {
    return {
      schema_version: SNAPSHOT_SCHEMA,
      entries: [],
      valid: false,
      reason_codes: ["ADAPTER_REGISTRY_INVALID", "REGISTRY_SHAPE_INVALID"],
    };
  }
  const entries = [];
  for (const entry of map.values()) {
    entries.push({
      route_id: entry.route_id,
      adapter_id: entry.adapter_id,
      implementer: entry.implementer,
      model: entry.model,
      dispatch_required: entry.dispatch_required,
    });
  }
  entries.sort((a, b) => a.route_id.localeCompare(b.route_id));
  return {
    schema_version: SNAPSHOT_SCHEMA,
    entries,
    valid: true,
    reason_codes: [],
  };
}

/**
 * Canonical OpenCode + qwen_local registration entry (identity unchanged).
 */
export function openCodeQwenLocalRegistration() {
  return {
    route_id: OPENCODE_QWEN_LOCAL_ROUTE,
    adapter_id: OPENCODE_ADAPTER_ID,
    implementer: OPENCODE_IMPLEMENTER,
    model: OPENCODE_MODEL,
    dispatch_required: true,
    async run(request) {
      return executeOpenCodeBounded(
        {
          execution_id: request.execution_id,
          runtime_authorization: request.runtime_authorization ?? null,
          message: request.execution_packet?.goal ?? null,
        },
        {
          getOccupancy: request.getOccupancy,
          guardStart: request.guardStart,
          runOpenCode: request.runOpenCode,
          upstreamOrigin: request.upstreamOrigin,
          // AGG 2026-09-03: role-qualification gate passthrough (offline test
          // injection only; production requests never supply roleGate).
          roleGate: request.roleGate,
        },
      );
    },
  };
}

/**
 * Default registry: exactly opencode+qwen_local.
 */
export function createDefaultExecutionAdapterRegistry() {
  const created = createExecutionAdapterRegistry([openCodeQwenLocalRegistration()]);
  if (!created.ok) {
    throw new Error(`DEFAULT_REGISTRY_INVALID: ${created.reason_codes.join(",")}`);
  }
  return created.registry;
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("v4-execution-adapter-registry-v1.mjs");

if (isMain) {
  // Default CLI: emit snapshot of default registry; zero live execution.
  const registry = createDefaultExecutionAdapterRegistry();
  const snap = registrySnapshot(registry);
  process.stdout.write(`${JSON.stringify(snap, null, 2)}\n`);
}
