#!/usr/bin/env node
/**
 * D-9406-A — Hermes shadow-proof preflight validator (v1).
 *
 * Validates one candidate shadow-proof packet JSON file against the
 * deterministic preflight boundary for the later real #73 Phase C
 * QWEN_LOCAL -> HERMES -> CHATGPT_WEB shadow proof. No provider calls.
 *
 * Usage:
 *   node tools/validate-hermes-shadow-proof-v1.mjs <packet.json> [--expected-head <40hex>]
 *
 * Exit: 0 PASS, 2 validation STOP, 1 usage/internal error.
 * Stdout: one compact JSON object only.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCHEMA_VERSION = "hermes-shadow-proof-packet-v1";
const OUTPUT_SCHEMA = "hermes-shadow-proof-validation-v1";
const MAX_REASON_CODES = 16;

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function finish(reasons) {
  const ok = reasons.length === 0;
  emit(
    {
      schema_version: OUTPUT_SCHEMA,
      ok,
      classification: ok ? "PASS" : "STOP",
      reason_codes: reasons.slice(0, MAX_REASON_CODES),
    },
    ok ? 0 : 2,
  );
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isString(v) {
  return typeof v === "string";
}

function isNonEmptyStringArray(v) {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((x) => isString(x) && x.trim().length > 0)
  );
}

function is40LowerHex(s) {
  return isString(s) && /^[0-9a-f]{40}$/.test(s);
}

function isBoundedRepoRelative(p) {
  if (!isString(p) || p.length === 0) return false;
  if (p.startsWith("/") || p.startsWith("\\")) return false;
  if (/[a-zA-Z]:[\\/]/.test(p)) return false;
  if (p.includes("\\")) return false;
  const segs = p.split("/");
  for (const s of segs) {
    if (s === "..") return false;
  }
  const wild = p.indexOf("*");
  if (wild >= 0) {
    const before = p.slice(0, wild);
    const idx = before.lastIndexOf("/");
    if (idx >= 0) {
      const seg = before.slice(idx + 1);
      if (seg.includes("*")) return false;
    }
  }
  return true;
}

const CREDENTIAL_KEY_RE = new Set([
  "cookie",
  "cookies",
  "set_cookie",
  "session_cookie",
  "session_token",
  "access_token",
  "refresh_token",
  "id_token",
  "bearer",
  "authorization",
  "password",
  "passwd",
  "secret",
  "secrets",
  "api_key",
  "apikey",
  "auth_header",
  "session_secret",
]);

const CREDENTIAL_VALUE_PATTERNS = [
  /\bbearer\s+[a-zA-Z0-9_\-.=+]+/i,
  /\bBearer\s+[a-zA-Z0-9_\-.=+]+/,
  /\bghp_[a-zA-Z0-9]{20,}/,
  /\bgithub_pat_[a-zA-Z0-9_]{20,}/,
  /\bsk-[a-zA-Z0-9]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

function scanCredentialKeys(obj) {
  const hits = [];
  (function walk(node) {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const c of node) walk(c);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (CREDENTIAL_KEY_RE.has(k.toLowerCase())) {
        hits.push(k);
      }
      walk(v);
    }
  })(obj);
  return hits;
}

function scanCredentialValues(obj) {
  const hits = [];
  (function walk(node) {
    if (typeof node === "string") {
      for (const re of CREDENTIAL_VALUE_PATTERNS) {
        if (re.test(node)) hits.push(re.source.slice(0, 60));
      }
    } else if (node !== null && typeof node === "object") {
      if (Array.isArray(node)) {
        for (const c of node) walk(c);
      } else {
        for (const v of Object.values(node)) walk(v);
      }
    }
  })(obj);
  return hits;
}

function scanStaticModelAllowlist(obj) {
  const hits = [];
  (function walk(node, key) {
    if (node === null || typeof node !== "object") return;
    const lk = key ? key.toLowerCase() : "";
    const looksLikeAllowlist =
      /(model_?(allow|list|set|pin)|frozen_models|static_models|pinned_models|model_freeze|model_allowlist|model_pinned|frozen_model|frozen_chatgpt|frozen_chatgpt_web)/.test(lk);
    if (looksLikeAllowlist && Array.isArray(node) && node.length > 0) {
      hits.push(key || "unknown");
      for (const c of node) walk(c, key);
      return;
    }
    if (looksLikeAllowlist && typeof node === "object" && !Array.isArray(node)) {
      const keys = Object.keys(node);
      if (keys.length > 0 && keys.every((k) => /gpt-/i.test(k))) {
        hits.push(key || "unknown");
      }
    }
    for (const [k, v] of Object.entries(node)) walk(v, k);
  })(obj, null);
  return hits;
}

function containsSemantic(strs, phrases) {
  return phrases.some((p) => strs.some((s) => s.toLowerCase().includes(p)));
}

const HARD_WALL_PHRASES = [
  "no production dispatch",
  "production dispatch",
  "no mutation",
  "no old",
  "d-0025",
  "no public",
  "cdp",
  "novnc",
  "funnel",
  "credentials",
  "cookies",
  "secrets",
  "unlimited",
  "infinite",
];

const ACCEPTANCE_PHRASES = [
  "route",
  "observed",
  "timestamp",
  "fallback",
  "mutation",
  "pass",
  "stop",
];

const STOP_CONDITION_PHRASES = [
  "stale",
  "head",
  "hermes",
  "unavailable",
  "unhealthy",
  "auth",
  "mismatch",
  "scope",
  "fallback",
  "production",
];

function validate(packet, expectedHead) {
  const reasons = [];
  if (!isPlainObject(packet)) {
    reasons.push("INVALID_PACKET_OBJECT");
    return reasons;
  }

  if (packet.schema_version !== SCHEMA_VERSION)
    reasons.push("BAD_SCHEMA_VERSION");
  if (packet.issue !== 73) reasons.push("BAD_ISSUE");
  if (packet.repository !== "mrhz1973/control-plane")
    reasons.push("BAD_REPOSITORY");
  if (packet.branch !== "main") reasons.push("BAD_BRANCH");

  const route = packet.route;
  if (!isPlainObject(route) ||
      route.controller !== "qwen_local" ||
      route.bridge !== "hermes" ||
      route.target !== "chatgpt_web")
    reasons.push("BAD_ROUTE_IDENTITY");

  if (packet.shadow_only !== true) reasons.push("BAD_SHADOW_ONLY");
  if (packet.production_dispatch !== false)
    reasons.push("BAD_PRODUCTION_DISPATCH");
  if (packet.self_authorizing !== false)
    reasons.push("BAD_SELF_AUTHORIZING");
  if (packet.credential_material_in_packet !== false)
    reasons.push("BAD_CREDENTIAL_MATERIAL_FLAG");

  if (!is40LowerHex(packet.base_head)) reasons.push("BAD_BASE_HEAD");
  else if (expectedHead && packet.base_head !== expectedHead)
    reasons.push("STALE_BASE_HEAD");

  if (!isNonEmptyStringArray(packet.allowed_scope))
    reasons.push("BAD_ALLOWED_SCOPE");
  else if (!packet.allowed_scope.every(isBoundedRepoRelative))
    reasons.push("BAD_ALLOWED_SCOPE_ENTRY");

  if (!isNonEmptyStringArray(packet.hard_walls))
    reasons.push("BAD_HARD_WALLS");
  else if (!containsSemantic(packet.hard_walls, HARD_WALL_PHRASES))
    reasons.push("HARD_WALLS_COVERAGE");

  if (!isNonEmptyStringArray(packet.acceptance))
    reasons.push("BAD_ACCEPTANCE");
  else if (!containsSemantic(packet.acceptance, ACCEPTANCE_PHRASES))
    reasons.push("ACCEPTANCE_COVERAGE");

  if (!isNonEmptyStringArray(packet.stop_conditions))
    reasons.push("BAD_STOP_CONDITIONS");
  else if (!containsSemantic(packet.stop_conditions, STOP_CONDITION_PHRASES))
    reasons.push("STOP_CONDITIONS_COVERAGE");

  const ck = scanCredentialKeys(packet);
  if (ck.length > 0) reasons.push("PACKET_CONTAINS_CREDENTIAL_KEYS");
  const cv = scanCredentialValues(packet);
  if (cv.length > 0) reasons.push("PACKET_CONTAINS_CREDENTIAL_VALUES");

  const frozen = scanStaticModelAllowlist(packet);
  if (frozen.length > 0)
    reasons.push("PACKET_FREEZES_CHATGPT_WEB_MODEL_ALLOWLIST");

  return reasons;
}

function main() {
  const args = process.argv.slice(2);
  let packetArg = null;
  let expectedHead = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--expected-head") {
      i++;
      if (i >= args.length) {
        emit(
          {
            schema_version: OUTPUT_SCHEMA,
            ok: false,
            classification: "STOP",
            reason_codes: ["USAGE_ERROR"],
          },
          1,
        );
      }
      expectedHead = args[i];
    } else if (!packetArg) {
      packetArg = a;
    } else {
      emit(
        {
          schema_version: OUTPUT_SCHEMA,
          ok: false,
          classification: "STOP",
          reason_codes: ["USAGE_ERROR"],
        },
        1,
      );
    }
  }

  if (!packetArg) {
    emit(
      {
        schema_version: OUTPUT_SCHEMA,
        ok: false,
        classification: "STOP",
        reason_codes: ["USAGE_ERROR"],
      },
      1,
    );
  }

  let expectedHeadOk = true;
  if (expectedHead !== null && !is40LowerHex(expectedHead)) {
    expectedHeadOk = false;
  }

  const absPath = resolve(process.cwd(), packetArg);
  let text;
  try {
    text = readFileSync(absPath, "utf8").replace(/^\uFEFF/, "");
  } catch {
    emit(
      {
        schema_version: OUTPUT_SCHEMA,
        ok: false,
        classification: "STOP",
        reason_codes: ["PACKET_NOT_FOUND"],
      },
      2,
    );
  }

  let packet;
  try {
    packet = JSON.parse(text);
  } catch {
    emit(
      {
        schema_version: OUTPUT_SCHEMA,
        ok: false,
        classification: "STOP",
        reason_codes: ["MALFORMED_JSON"],
      },
      2,
    );
  }

  const reasons = [];
  if (!expectedHeadOk) reasons.push("USAGE_BAD_EXPECTED_HEAD");
  const validationReasons = validate(packet, expectedHead);
  reasons.push(...validationReasons);
  finish(reasons);
}

import { fileURLToPath } from "node:url";
const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    main();
  } catch (err) {
    emit(
      {
        schema_version: OUTPUT_SCHEMA,
        ok: false,
        classification: "STOP",
        reason_codes: ["VALIDATOR_INTERNAL_ERROR"],
      },
      1,
    );
  }
}
