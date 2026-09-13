#!/usr/bin/env node
/**
 * agent-activity-registry-v1 — READ-ONLY observability lane for external
 * Hermes/Qwen/browser operations (LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1, issue #79).
 *
 * A small local JSON registry the Hermes/Qwen runner WRITES (bounded record,
 * sanitized fields) and the dispatcher dashboard READS. It is NOT a second
 * execution authority: it never creates/claims tasks, never mutates receipts,
 * never authorizes execution, never invokes providers, never controls
 * browsers, never touches routes. It only makes external activity VISIBLE.
 *
 * SURFACE
 *   publishActivity(record)      — writer-side upsert (bounded, sanitized)
 *   readActivities()             — reader-side (dispatcher/dashboard)
 *   applyFreshness(records, nowMs) — freshness law (STALE/UNKNOWN semantics)
 *
 * STORAGE: ephemeral JSON at %LOCALAPPDATA%\control-plane\agent-activity-registry-v1.json
 * (override with AGENT_ACTIVITY_REGISTRY_PATH for tests). Single atomic
 * write per publish; readers tolerate missing/corrupt files (fail-closed
 * UNKNOWN, never an invented state).
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const AGENT_ACTIVITY_SCHEMA = "local-dev-agent-activity-v1";
export const ACTIVITY_STATES = Object.freeze(["ACTIVE", "WAITING", "PASS", "STOP", "UNKNOWN", "STALE"]);
export const ACTIVITY_STAGES = Object.freeze([
  "PREFLIGHT", "QWEN_READY", "HERMES_ATTACHED", "BROWSER_READY", "REQUEST_SENDING",
  "WAITING_WEB_RESPONSE", "WEB_RESPONSE_OBSERVED", "RESULT_CAPTURE", "VALIDATION",
  "HUMAN_GATE", "PASS", "STOP",
  "VISUAL_INSPECTION", // QWEN_BROWSER_VISUAL_SIDECAR_V1 (issue #78): read-only visual observation stage
]);
export const MAX_ACTIVITIES = 20; // bounded: most recent operations only
export const DEFAULT_FRESHNESS_MS = 90_000; // ACTIVE/WAITING older than this => STALE
/** Terminal or audit-only fields. Everything else is dropped at publish. */
const ALLOWED_FIELDS = Object.freeze([
  "activity_id", "task_ref", "activity_type", "controller", "bridge",
  "browser_surface", "answer_surface", "model_profile", "started_at",
  "last_progress_at", "elapsed_seconds", "stage", "state",
  "timeout_total_seconds", "timeout_remaining_seconds", "generation_state",
  "capture_state", "cdp_state", "auth_state", "qwen_occupancy", "stop_reason",
]);

/** Bounded sanitized string: strips control chars, caps length. Never logs content. */
function sane(value, max = 80) {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[\x00-\x1f\x7f]/g, " ").trim();
  return s ? s.slice(0, max) : null;
}

function saneBoolish(value) {
  if (value === true || value === false) return value;
  const s = sane(value, 24);
  return s && /^(ok|ready|attached|valid|authorized|logged[_ -]?in|authenticated)$/i.test(s) ? true
    : s && /^(no|none|failed|invalid|unauthorized|logged[_ -]?out|missing)$/i.test(s) ? false
    : s ? "UNKNOWN" : null;
}

export function registryPath() {
  return process.env.AGENT_ACTIVITY_REGISTRY_PATH
    || join(process.env.LOCALAPPDATA || ".", "control-plane", "agent-activity-registry-v1.json");
}

/**
 * Writer-side upsert. Accepts a partial record; enforces the bounded schema,
 * sanitizes every field, stamps server-side received_at, caps the registry to
 * MAX_ACTIVITIES most recent. Returns the stored record. Never throws for
 * malformed input — returns { ok:false, reason } (writer decides; publish
 * failures must never break the runner).
 */
export function publishActivity(input, { path: regPath = registryPath(), nowMs = Date.now(), maxActivities = MAX_ACTIVITIES } = {}) {
  try {
    if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, reason: "ACTIVITY_INPUT_INVALID" };
    const rec = {};
    for (const f of ALLOWED_FIELDS) {
      if (input[f] === undefined) continue;
      if (["timeout_total_seconds", "timeout_remaining_seconds", "elapsed_seconds"].includes(f)) {
        const n = Number(input[f]);
        rec[f] = Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
      } else if (f === "auth_state" || f === "qwen_occupancy" || f === "cdp_state" || f === "capture_state" || f === "generation_state") {
        rec[f] = f === "auth_state" ? saneBoolish(input[f]) : sane(input[f], 40);
      } else {
        rec[f] = sane(input[f], f === "activity_id" || f === "task_ref" ? 120 : 80);
      }
    }
    if (!rec.activity_id) return { ok: false, reason: "ACTIVITY_ID_REQUIRED" };
    if (!rec.state || !ACTIVITY_STATES.includes(rec.state)) return { ok: false, reason: "ACTIVITY_STATE_INVALID" };
    if (rec.stage && !ACTIVITY_STAGES.includes(rec.stage)) return { ok: false, reason: "ACTIVITY_STAGE_INVALID" }; // fail-closed: unknown stage rejected, never invented
    rec.received_at = new Date(nowMs).toISOString();

    const all = readActivities({ path: regPath }).activities || [];
    const prior = all.find((a) => a && a.activity_id === rec.activity_id);
    // Merge-on-upsert: writers publish field patches; previously published
    // fields of the same activity persist unless explicitly overridden.
    const merged = prior ? { ...prior, ...rec } : rec;
    const list = all
      .filter((a) => a && a.activity_id !== rec.activity_id)
      .concat([merged]);
    list.sort((a, b) => String(b.received_at || "").localeCompare(String(a.received_at || "")));
    const trimmed = list.slice(0, maxActivities);

    fsWriteAtomic(regPath, { schema_version: AGENT_ACTIVITY_SCHEMA, updated_at: rec.received_at, activities: trimmed });
    return { ok: true, record: merged };
  } catch (e) {
    return { ok: false, reason: "ACTIVITY_PUBLISH_FAILED", detail: String(e?.message ?? e).slice(0, 80) };
  }
}

/** Reader-side. Missing/corrupt file => empty list (fail-closed UNKNOWN semantics downstream). */
export function readActivities({ path: regPath = registryPath() } = {}) {
  try {
    if (!existsSync(regPath)) return { schema_version: AGENT_ACTIVITY_SCHEMA, updated_at: null, activities: [] };
    const parsed = JSON.parse(readFileSync(regPath, "utf8"));
    if (parsed?.schema_version !== AGENT_ACTIVITY_SCHEMA || !Array.isArray(parsed.activities)) {
      return { schema_version: AGENT_ACTIVITY_SCHEMA, updated_at: null, activities: [] };
    }
    return parsed;
  } catch {
    return { schema_version: AGENT_ACTIVITY_SCHEMA, updated_at: null, activities: [] };
  }
}

/**
 * FRESHNESS LAW: telemetry older than the threshold cannot stay falsely
 * ACTIVE/WAITING -> STALE. Missing last_progress/started_at => UNKNOWN.
 * Terminal PASS/STOP are never reinterpreted. Pure function (no side effects,
 * no heartbeat writes back — freshness is computed at READ time).
 */
export function applyFreshness(records, { nowMs = Date.now(), freshMs = DEFAULT_FRESHNESS_MS } = {}) {
  return (Array.isArray(records) ? records : []).map((rec) => {
    if (!rec || typeof rec !== "object") return { state: "UNKNOWN", reason: "RECORD_INVALID" };
    if (rec.state === "PASS" || rec.state === "STOP") return rec; // terminal never reinterpreted
    const last = Date.parse(rec.last_progress_at || rec.started_at || "");
    if (!Number.isFinite(last)) return { ...rec, state: "UNKNOWN", state_reason: "NO_PROGRESS_TIMESTAMP" };
    if (nowMs - last > freshMs) return { ...rec, state: "STALE", state_reason: "PROGRESS_TOO_OLD" };
    return rec;
  });
}

/** Atomic single-file write (tmp + rename). */
function fsWriteAtomic(regPath, payload) {
  mkdirSync(dirname(regPath), { recursive: true });
  const tmp = `${regPath}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(payload, null, 2));
  renameSync(tmp, regPath);
}
