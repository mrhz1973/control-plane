#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1 — route-specific
 * disable / rollback control for the future promoted Hermes route.
 *
 * GAP R4/R14 closure (readiness packet `docs/decision-packets/v4-hermes-phase-f-promotion-gate-v1.md`):
 * the packet proved D-0025 enabled=false and no active authorization, but no
 * ROUTE-SPECIFIC production disable/rollback switch existed for the future
 * `qwen_local -> hermes -> chatgpt_web` promoted route. This module defines the
 * minimum closed control:
 *
 * Law (hard, deterministic):
 *   - state space is EXACTLY: DISABLED | SHADOW_ONLY | CANDIDATE_ENABLED.
 *     A production-enabled state is intentionally ABSENT: this control cannot
 *     express production activation at all. Promotion remains a separate
 *     human gate and, even then, stays behind the existing authorization law.
 *   - DEFAULT = DISABLED (fail-closed default).
 *   - MISSING state/doc            -> FAIL_CLOSED (never enabled).
 *   - UNKNOWN/malformed state      -> FAIL_CLOSED (never enabled).
 *   - INVALID restoration target   -> FAIL_CLOSED (never enabled).
 *   - CANDIDATE_ENABLED is an explicit candidate flag WITHOUT production
 *     authorization: production_dispatch_permitted stays false in EVERY
 *     evaluation this control generation can emit.
 *   - disable is IDEMPOTENT: disabling an already-DISABLED doc returns the
 *     SAME document (byte-equal), no history growth, no state drift.
 *   - RESTORATION_STATE is explicit and non-production: SHADOW_ONLY.
 *   - disable history is BOUNDED (max 8 entries, oldest dropped).
 *   - no dependency on legacy/staged components (no OpenClaw, no D-0025 key,
 *     no WF61): state identity is the route id only.
 *
 * Pure core (no I/O) + bounded CLI for explicit single-file mutation of the
 * tracked state document under configs/runtime/route-control/.
 */

export const ROUTE_CONTROL_SCHEMA = "v4-phase-f-route-control-state-v1";
export const ROUTE_CONTROL_EVALUATION_SCHEMA = "v4-phase-f-route-control-evaluation-v1";
export const CONTROLLED_ROUTE_ID = "qwen_local+hermes+chatgpt_web";
export const ROUTE_STATES = Object.freeze(["DISABLED", "SHADOW_ONLY", "CANDIDATE_ENABLED"]);
export const DEFAULT_STATE = "DISABLED";
export const RESTORATION_STATE = "SHADOW_ONLY";
export const DISABLE_HISTORY_MAX = 8;

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

function iso(ms) {
  return new Date(
    typeof ms === "number" && Number.isFinite(ms) ? ms : Date.now(),
  ).toISOString();
}

function boundedStr(v, max = 80) {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

/** Canonical safe state document (DEFAULT=DISABLED). */
export function emptyRouteControlState(options = {}) {
  return {
    schema_version: ROUTE_CONTROL_SCHEMA,
    route_id: CONTROLLED_ROUTE_ID,
    state: DEFAULT_STATE,
    restoration_state: RESTORATION_STATE,
    disable_history: [],
    updated_at: iso(options.nowMs),
    updated_by: boundedStr(options.updatedBy) || "unrecorded",
    note: "DEFAULT=DISABLED. Production-enabled state intentionally absent; activation requires a separate human promotion gate.",
  };
}

function baseEvaluation(nowMs) {
  return {
    schema_version: ROUTE_CONTROL_EVALUATION_SCHEMA,
    route_id: CONTROLLED_ROUTE_ID,
    evaluated_at: iso(nowMs),
    effective_state: null,
    state_class: "FAIL_CLOSED",
    fail_closed: true,
    candidate_flag: false,
    shadow_only_canonical: false,
    production_dispatch_permitted: false, // invariant of this control generation
    production_state_present: false, // state space contains no production state
    restoration_state: null,
    reason_codes: [],
  };
}

/**
 * Evaluate a route-control state document. Fail-closed in every direction:
 * missing, malformed, foreign-route, or invalid documents never enable
 * anything. Pure and deterministic.
 */
export function evaluateRouteControl(doc, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const ev = baseEvaluation(nowMs);
  if (doc === null || doc === undefined || typeof doc !== "object" || Array.isArray(doc)) {
    return { ...ev, reason_codes: ["ROUTE_STATE_MISSING"] };
  }
  if (doc.schema_version !== ROUTE_CONTROL_SCHEMA) {
    return { ...ev, reason_codes: ["ROUTE_STATE_SCHEMA_INVALID"] };
  }
  if (doc.route_id !== CONTROLLED_ROUTE_ID) {
    return { ...ev, reason_codes: ["ROUTE_ID_MISMATCH"] };
  }
  const state = doc.state;
  if (state === undefined || state === null) {
    return { ...ev, reason_codes: ["ROUTE_STATE_MISSING"] };
  }
  if (!ROUTE_STATES.includes(state)) {
    return { ...ev, reason_codes: ["ROUTE_STATE_INVALID", `ROUTE_STATE_UNRECOGNIZED_${String(state).slice(0, 40)}`] };
  }
  if (doc.restoration_state !== RESTORATION_STATE) {
    return { ...ev, reason_codes: ["RESTORATION_STATE_INVALID"] };
  }
  if (!Array.isArray(doc.disable_history)) {
    return { ...ev, reason_codes: ["DISABLE_HISTORY_INVALID"] };
  }
  if (doc.disable_history.length > DISABLE_HISTORY_MAX * 2) {
    return { ...ev, reason_codes: ["DISABLE_HISTORY_OVERFLOW"] };
  }
  const safe = {
    ...ev,
    effective_state: state,
    fail_closed: false,
    restoration_state: RESTORATION_STATE,
    reason_codes: [],
  };
  if (state === "DISABLED") {
    safe.state_class = "SAFE";
    safe.reason_codes = ["ROUTE_DISABLED_FAIL_CLOSED_DEFAULT"];
    return safe;
  }
  if (state === "SHADOW_ONLY") {
    safe.state_class = "SAFE";
    safe.shadow_only_canonical = true;
    safe.reason_codes = ["ROUTE_SHADOW_ONLY_NON_PRODUCTION"];
    return safe;
  }
  // CANDIDATE_ENABLED: explicit candidate flag, still no production.
  safe.state_class = "CANDIDATE";
  safe.candidate_flag = true;
  safe.reason_codes = ["ROUTE_CANDIDATE_FLAG_NO_PRODUCTION_AUTHORIZATION"];
  return safe;
}

function historyEntry(fromState, nowMs, updatedBy) {
  return {
    at: iso(nowMs),
    from_state: fromState,
    to_state: DEFAULT_STATE,
    restored_to: RESTORATION_STATE,
    by: boundedStr(updatedBy) || "unrecorded",
  };
}

/**
 * IDEMPOTENT disable. Invalid/missing input fails closed TOWARD the safe
 * default: a canonical DISABLED document is produced (never an error that
 * leaves a stale candidate in place). Disabling an already-DISABLED valid
 * document returns the SAME document unchanged (true idempotency).
 */
export function applyRouteDisable(doc, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const by = options.updatedBy;
  const evaluation = evaluateRouteControl(doc, { nowMs });
  if (evaluation.fail_closed) {
    const next = emptyRouteControlState({ nowMs, updatedBy: by });
    return {
      ok: true,
      fail_closed_input: true,
      reason_codes: [...evaluation.reason_codes, "DISABLE_FAIL_CLOSED_TO_DEFAULT"],
      previous: doc ?? null,
      doc: next,
      evaluation: evaluateRouteControl(next, { nowMs }),
    };
  }
  if (doc.state === DEFAULT_STATE) {
    return { ok: true, fail_closed_input: false, idempotent_no_op: true, reason_codes: ["ALREADY_DISABLED"], previous: doc, doc, evaluation };
  }
  const history = [...(doc.disable_history || []), historyEntry(doc.state, nowMs, by)].slice(-DISABLE_HISTORY_MAX);
  const next = {
    ...doc,
    state: DEFAULT_STATE,
    restoration_state: RESTORATION_STATE,
    disable_history: history,
    updated_at: iso(nowMs),
    updated_by: boundedStr(by) || "unrecorded",
  };
  return {
    ok: true,
    fail_closed_input: false,
    idempotent_no_op: false,
    reason_codes: ["ROUTE_DISABLED", `RESTORED_TO_${RESTORATION_STATE}`],
    previous: doc,
    doc: next,
    evaluation: evaluateRouteControl(next, { nowMs }),
  };
}

/**
 * Explicit candidate enable WITHOUT production authorization. Refuses to
 * enable from a fail-closed input (repair the document explicitly first).
 */
export function applyRouteCandidateEnable(doc, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const by = options.updatedBy;
  const evaluation = evaluateRouteControl(doc, { nowMs });
  if (evaluation.fail_closed) {
    return { ok: false, reason_codes: [...evaluation.reason_codes, "CANDIDATE_ENABLE_REFUSED_FAIL_CLOSED_INPUT"], previous: doc ?? null, doc: null, evaluation };
  }
  if (doc.state === "CANDIDATE_ENABLED") {
    return { ok: true, idempotent_no_op: true, reason_codes: ["ALREADY_CANDIDATE"], previous: doc, doc, evaluation };
  }
  const next = {
    ...doc,
    state: "CANDIDATE_ENABLED",
    restoration_state: RESTORATION_STATE,
    updated_at: iso(nowMs),
    updated_by: boundedStr(by) || "unrecorded",
  };
  return {
    ok: true,
    idempotent_no_op: false,
    reason_codes: ["ROUTE_CANDIDATE_ENABLED_NO_PRODUCTION", `RESTORATION_TARGET_${RESTORATION_STATE}`],
    previous: doc,
    doc: next,
    evaluation: evaluateRouteControl(next, { nowMs }),
  };
}

/** Read-only rollback observation over the bounded disable history. */
export function rollbackObservation(doc, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const evaluation = evaluateRouteControl(doc, { nowMs });
  if (evaluation.fail_closed) {
    return {
      schema_version: ROUTE_CONTROL_EVALUATION_SCHEMA,
      rollback_ready: false,
      effective_state: "FAIL_CLOSED",
      fail_closed: true,
      restoration_state: RESTORATION_STATE,
      disable_count: null,
      last_disable: null,
      reason_codes: evaluation.reason_codes,
    };
  }
  const history = doc.disable_history || [];
  return {
    schema_version: ROUTE_CONTROL_EVALUATION_SCHEMA,
    rollback_ready: true,
    effective_state: evaluation.effective_state,
    fail_closed: false,
    restoration_state: RESTORATION_STATE,
    disable_count: history.length,
    last_disable: history.length ? history[history.length - 1] : null,
    reason_codes: [],
  };
}

// ---------------- bounded CLI (explicit single-file mutation) ----------------

function cli() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 ? argv[i + 1] : null;
  };
  const statePath = get("--state-path");
  const action = get("--action") || "show";
  const by = get("--updated-by") || "unrecorded";
  if (!statePath) {
    process.stdout.write(`${JSON.stringify({ ok: false, classification: "USAGE_ERROR_STATE_PATH_REQUIRED" })}\n`);
    process.exit(1);
  }

  if (action === "init") {
    if (existsSync(statePath)) {
      process.stdout.write(`${JSON.stringify({ ok: false, classification: "STATE_FILE_ALREADY_PRESENT" })}\n`);
      process.exit(1);
    }
    const doc = emptyRouteControlState({ updatedBy: by });
    mkdirSync(dirname(resolve(statePath)), { recursive: true });
    writeFileSync(statePath, `${JSON.stringify(doc, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({ ok: true, classification: "STATE_INITIALIZED_DISABLED", doc })}\n`);
    return;
  }

  let doc = null;
  if (existsSync(statePath)) {
    try {
      doc = JSON.parse(readFileSync(statePath, "utf8"));
    } catch {
      doc = null; // malformed file -> MISSING for the evaluator (fail closed)
    }
  }

  if (action === "show") {
    process.stdout.write(`${JSON.stringify({ ok: true, evaluation: evaluateRouteControl(doc), rollback: rollbackObservation(doc) })}\n`);
    return;
  }
  if (action === "disable") {
    const out = applyRouteDisable(doc, { updatedBy: by });
    if (out.ok && out.doc && out.doc !== doc) {
      mkdirSync(dirname(resolve(statePath)), { recursive: true });
      writeFileSync(statePath, `${JSON.stringify(out.doc, null, 2)}\n`);
    }
    process.stdout.write(`${JSON.stringify({ ok: out.ok, reason_codes: out.reason_codes, evaluation: out.evaluation, rollback: rollbackObservation(out.doc) })}\n`);
    return;
  }
  if (action === "enable-candidate") {
    const out = applyRouteCandidateEnable(doc, { updatedBy: by });
    if (out.ok && out.doc && out.doc !== doc) {
      mkdirSync(dirname(resolve(statePath)), { recursive: true });
      writeFileSync(statePath, `${JSON.stringify(out.doc, null, 2)}\n`);
    }
    process.stdout.write(`${JSON.stringify({ ok: out.ok, reason_codes: out.reason_codes, evaluation: out.evaluation })}\n`);
    process.exit(out.ok ? 0 : 1);
    return;
  }
  process.stdout.write(`${JSON.stringify({ ok: false, classification: "USAGE_ERROR_UNKNOWN_ACTION" })}\n`);
  process.exit(1);
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href;
if (isDirectRun) cli();
