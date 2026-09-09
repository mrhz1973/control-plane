#!/usr/bin/env node
/**
 * Deterministic, offline, repo-only quota pacing simulator (issue #73 / D-9407).
 *
 * - No provider/network/model invocation
 * - No banked-reset consumption
 * - No routing mutation / persistent state
 * - Consumes canonical effective_remaining_percent (MIN-binding-window evidence) directly
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = "quota-pacing-simulation-v1";
export const MAX_REASONS = 16;

const SECRET_KEY_RE =
  /(?:^|_)(token|secret|password|passwd|cookie|authorization|credential|refresh|api[_-]?key|access[_-]?key|session)(?:$|_)/i;

const REQUIRED_TOP = Object.freeze([
  "now_local_iso",
  "qwen_local",
  "glm_coding_plan",
  "chatgpt_codex_subscription",
  "task",
  "policy",
  "empirical_burn",
]);

const QUALITY_RANK = Object.freeze({
  low: 1,
  standard: 2,
  strong: 3,
  high: 4,
});

/** Minimum quality a model class can satisfy. */
const MODEL_CLASS_QUALITY = Object.freeze({
  qwen_local: null,
  glm_flash: "standard",
  glm_full: "high",
  codex_low: "low",
  codex_medium: "standard",
  codex_strong: "high",
});

const COMMERCIAL_STATES_OK = new Set(["active", "available"]);

function failClosed(reason) {
  const err = new Error(reason);
  err.fail_closed = true;
  throw err;
}

function boundReasons(list) {
  const out = [];
  for (const r of list) {
    if (out.length >= MAX_REASONS) break;
    const s = String(r).slice(0, 160);
    if (s) out.push(s);
  }
  return out;
}

function assertNoSecretKeys(value) {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) assertNoSecretKeys(item);
    return;
  }
  if (typeof value !== "object") return;
  for (const [k, v] of Object.entries(value)) {
    if (SECRET_KEY_RE.test(k)) failClosed("secret_like_field_rejected");
    assertNoSecretKeys(v);
  }
}

function requireObject(value, label) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    failClosed(`missing_or_invalid_${label}`);
  }
  return value;
}

function requireNumber(obj, key, label) {
  const v = obj[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    failClosed(`missing_or_invalid_${label}_${key}`);
  }
  return v;
}

function requireString(obj, key, label) {
  const v = obj[key];
  if (typeof v !== "string" || !v) {
    failClosed(`missing_or_invalid_${label}_${key}`);
  }
  return v;
}

function requireBoolean(obj, key, label) {
  const v = obj[key];
  if (typeof v !== "boolean") {
    failClosed(`missing_or_invalid_${label}_${key}`);
  }
  return v;
}

function parseScenario(rawText) {
  let input;
  try {
    input = JSON.parse(rawText);
  } catch {
    failClosed("malformed_json");
  }
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    failClosed("scenario_must_be_object");
  }
  assertNoSecretKeys(input);
  for (const key of REQUIRED_TOP) {
    if (!(key in input)) failClosed(`missing_required_field_${key}`);
  }

  const now_local_iso = requireString(input, "now_local_iso", "root");
  const qwen_local = requireObject(input.qwen_local, "qwen_local");
  requireBoolean(qwen_local, "available", "qwen_local");
  requireBoolean(qwen_local, "adequate_for_task", "qwen_local");

  const glm = requireObject(input.glm_coding_plan, "glm_coding_plan");
  requireString(glm, "state", "glm");
  requireString(glm, "freshness", "glm");
  requireNumber(glm, "effective_remaining_percent", "glm");
  requireNumber(glm, "rolling_remaining_percent", "glm");
  requireNumber(glm, "weekly_remaining_percent", "glm");
  requireString(glm, "rolling_reset_at", "glm");
  requireString(glm, "weekly_reset_at", "glm");

  const codex = requireObject(input.chatgpt_codex_subscription, "chatgpt_codex_subscription");
  requireString(codex, "state", "codex");
  requireString(codex, "freshness", "codex");
  requireNumber(codex, "effective_remaining_percent", "codex");
  requireNumber(codex, "rolling_remaining_percent", "codex");
  requireNumber(codex, "weekly_remaining_percent", "codex");
  requireString(codex, "rolling_reset_at", "codex");
  requireString(codex, "weekly_reset_at", "codex");
  requireNumber(codex, "banked_reset_count", "codex");
  requireString(codex, "banked_reset_expiry", "codex");

  const task = requireObject(input.task, "task");
  requireString(task, "quality_class", "task");
  requireString(task, "urgency", "task");
  requireString(task, "estimated_burn_class", "task");
  if (!(task.quality_class in QUALITY_RANK)) {
    failClosed("invalid_task_quality_class");
  }

  const policy = requireObject(input.policy, "policy");
  requireString(policy, "glm_blackout_local_start", "policy");
  requireString(policy, "glm_blackout_local_end", "policy");
  requireNumber(policy, "reserve_floor_percent", "policy");
  requireNumber(policy, "horizon_hours", "policy");

  const burn = requireObject(input.empirical_burn, "empirical_burn");
  for (const k of [
    "qwen_local",
    "glm_flash",
    "glm_full",
    "codex_low",
    "codex_medium",
    "codex_strong",
  ]) {
    requireNumber(burn, k, "empirical_burn");
  }

  return {
    now_local_iso,
    qwen_local,
    glm_coding_plan: glm,
    chatgpt_codex_subscription: codex,
    task,
    policy,
    empirical_burn: burn,
  };
}

function localMinutesFromIso(iso) {
  const m = String(iso).match(
    /T(\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?([+-]\d{2}:?\d{2}|Z)?/
  );
  if (!m) failClosed("invalid_now_local_iso");
  return Number(m[1]) * 60 + Number(m[2]);
}

function hhmmToMinutes(hhmm) {
  const m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) failClosed("invalid_blackout_hhmm");
  return Number(m[1]) * 60 + Number(m[2]);
}

function inBlackoutWindow(nowIso, startHhmm, endHhmm) {
  const nowM = localMinutesFromIso(nowIso);
  const start = hhmmToMinutes(startHhmm);
  const end = hhmmToMinutes(endHhmm);
  if (start === end) return false;
  if (start < end) return nowM >= start && nowM < end;
  return nowM >= start || nowM < end;
}

function hoursUntil(isoNow, isoTarget) {
  const a = Date.parse(isoNow);
  const b = Date.parse(isoTarget);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, (b - a) / 3_600_000);
}

function qualityMeetsFloor(modelClass, taskQuality) {
  if (modelClass === "qwen_local") return true;
  const modelQ = MODEL_CLASS_QUALITY[modelClass];
  if (!modelQ) return false;
  return QUALITY_RANK[modelQ] >= QUALITY_RANK[taskQuality];
}

function burnForClass(empirical_burn, modelClass) {
  return empirical_burn[modelClass];
}

/**
 * Uses effective_remaining_percent directly for exhaustion math.
 * rolling/weekly inform reset horizon only — never recompute effective via Math.min.
 */
function pacingAssessment(pool, burnPerHour, nowIso, horizonHours) {
  const effective = pool.effective_remaining_percent;
  const hoursToWeekly = hoursUntil(nowIso, pool.weekly_reset_at);
  const hoursToRolling = hoursUntil(nowIso, pool.rolling_reset_at);
  let resetHorizonHours = null;
  if (hoursToWeekly != null && hoursToRolling != null) {
    resetHorizonHours = Math.min(hoursToWeekly, hoursToRolling);
  } else {
    resetHorizonHours = hoursToWeekly ?? hoursToRolling;
  }

  let exhaustBeforeReset = false;
  let exhaustWithinHorizon = false;
  if (burnPerHour > 0 && effective >= 0) {
    const hoursToExhaust = effective / burnPerHour;
    // Planning clip: compare exhaustion to the nearer of reset and policy horizon.
    // Using the full multi-day weekly window alone would mark every positive burn as
    // "exhaust before reset" and prevent legitimate admits.
    const relevantHorizon =
      resetHorizonHours == null
        ? horizonHours
        : Math.min(resetHorizonHours, horizonHours);
    if (hoursToExhaust <= relevantHorizon) {
      exhaustBeforeReset = resetHorizonHours != null && hoursToExhaust <= resetHorizonHours;
      exhaustWithinHorizon = hoursToExhaust <= horizonHours;
    }
  }
  return {
    resetHorizonHours,
    exhaustBeforeReset,
    exhaustWithinHorizon,
  };
}

function commercialAdmissible(pool) {
  const freshness = String(pool.freshness).toLowerCase();
  const state = String(pool.state).toLowerCase();
  if (freshness === "unknown" || state === "unknown") {
    return { ok: false, reason: "commercial_unknown_fail_closed" };
  }
  if (freshness !== "fresh") {
    return { ok: false, reason: `commercial_freshness_${freshness}_fail_closed` };
  }
  if (!COMMERCIAL_STATES_OK.has(state)) {
    return { ok: false, reason: `commercial_state_${state}_unavailable` };
  }
  return { ok: true };
}

function bankedResetValid(codex, nowIso) {
  const count = codex.banked_reset_count;
  if (!(count > 0)) return { valid: false, expiringSoon: false };
  const expiryMs = Date.parse(codex.banked_reset_expiry);
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(expiryMs) || !Number.isFinite(nowMs) || expiryMs <= nowMs) {
    return { valid: false, expiringSoon: false };
  }
  const hoursLeft = (expiryMs - nowMs) / 3_600_000;
  return { valid: true, expiringSoon: hoursLeft <= 72, hoursLeft };
}

/**
 * Policy order (ordinary tasks): Qwen -> GLM Flash -> Codex preferred -> GLM full -> other Codex.
 * Inside blackout: omit all glm_* classes (shared pool gate).
 */
function buildCandidates(task, blackoutActive) {
  const burnClass = task.estimated_burn_class;
  const codexPreferred =
    burnClass === "low"
      ? "codex_low"
      : burnClass === "strong" || burnClass === "high"
        ? "codex_strong"
        : "codex_medium";
  const codexAlt =
    codexPreferred === "codex_strong"
      ? ["codex_medium", "codex_low"]
      : codexPreferred === "codex_low"
        ? ["codex_medium", "codex_strong"]
        : ["codex_low", "codex_strong"];

  const list = [];
  list.push({ route: "qwen_local", model_class: "qwen_local", pool: null });
  if (!blackoutActive) {
    list.push({ route: "glm_coding_plan", model_class: "glm_flash", pool: "glm_coding_plan" });
  }
  list.push({
    route: "chatgpt_codex_subscription",
    model_class: codexPreferred,
    pool: "chatgpt_codex_subscription",
  });
  if (!blackoutActive) {
    list.push({ route: "glm_coding_plan", model_class: "glm_full", pool: "glm_coding_plan" });
  }
  for (const c of codexAlt) {
    list.push({
      route: "chatgpt_codex_subscription",
      model_class: c,
      pool: "chatgpt_codex_subscription",
    });
  }
  const seen = new Set();
  return list.filter((c) => {
    const k = `${c.route}:${c.model_class}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function evaluateCandidate(candidate, ctx) {
  const { task, qwen_local, glm, codex, policy, empirical_burn, now_local_iso, blackoutActive } =
    ctx;

  if (candidate.model_class === "qwen_local") {
    if (!qwen_local.available) {
      return { usable: false, decision: null, reasons: ["qwen_local_unavailable"] };
    }
    if (!qwen_local.adequate_for_task) {
      return { usable: false, decision: null, reasons: ["qwen_local_inadequate_for_task"] };
    }
    return {
      usable: true,
      decision: "USE",
      reasons: ["qwen_local_available_adequate_no_commercial_quota"],
      projected: null,
      reset_horizon_hours: null,
      commercial_pool_used: null,
    };
  }

  if (!qualityMeetsFloor(candidate.model_class, task.quality_class)) {
    return {
      usable: false,
      decision: null,
      reasons: [`quality_floor_blocks_${candidate.model_class}_for_${task.quality_class}`],
    };
  }

  if (candidate.pool === "glm_coding_plan" && blackoutActive) {
    return {
      usable: false,
      decision: null,
      reasons: ["glm_blackout_blocks_full_and_flash"],
    };
  }

  const pool = candidate.pool === "glm_coding_plan" ? glm : codex;
  const adm = commercialAdmissible(pool);
  if (!adm.ok) {
    return { usable: false, decision: null, reasons: [adm.reason] };
  }

  const effective = pool.effective_remaining_percent;
  const cost = burnForClass(empirical_burn, candidate.model_class);
  const projected = effective - cost;
  const pacing = pacingAssessment(pool, cost, now_local_iso, policy.horizon_hours);
  const reasons = [
    `effective_remaining=${effective};rolling=${pool.rolling_remaining_percent};weekly=${pool.weekly_remaining_percent}`,
  ];

  if (projected <= policy.reserve_floor_percent) {
    return {
      usable: false,
      decision: "CONSERVE",
      reasons: [
        ...reasons,
        `reserve_floor_breach_projected_${projected}_lte_${policy.reserve_floor_percent}`,
      ],
      projected,
      reset_horizon_hours: pacing.resetHorizonHours,
      commercial_pool_used: candidate.pool,
      pacing_block: false,
      reserve_block: true,
    };
  }

  if (pacing.exhaustBeforeReset || pacing.exhaustWithinHorizon) {
    return {
      usable: false,
      decision: "DEFER",
      reasons: [
        ...reasons,
        pacing.exhaustBeforeReset
          ? "projected_exhaustion_before_reset"
          : "projected_exhaustion_within_horizon",
      ],
      projected,
      reset_horizon_hours: pacing.resetHorizonHours,
      commercial_pool_used: candidate.pool,
      pacing_block: true,
      reserve_block: false,
    };
  }

  return {
    usable: true,
    decision: "USE",
    reasons: [...reasons, `admit_${candidate.model_class}`],
    projected,
    reset_horizon_hours: pacing.resetHorizonHours,
    commercial_pool_used: candidate.pool,
    pacing_block: false,
    reserve_block: false,
  };
}

function simulate(input) {
  const blackoutActive = inBlackoutWindow(
    input.now_local_iso,
    input.policy.glm_blackout_local_start,
    input.policy.glm_blackout_local_end
  );

  const ctx = {
    task: input.task,
    qwen_local: input.qwen_local,
    glm: input.glm_coding_plan,
    codex: input.chatgpt_codex_subscription,
    policy: input.policy,
    empirical_burn: input.empirical_burn,
    now_local_iso: input.now_local_iso,
    blackoutActive,
  };

  const candidates = buildCandidates(input.task, blackoutActive);
  const reasons = [];
  if (blackoutActive) reasons.push("glm_blackout_active_0800_1200_Europe_Rome");

  let conserveHit = null;
  let anyPacingBlock = false;

  for (const candidate of candidates) {
    const ev = evaluateCandidate(candidate, ctx);
    for (const r of ev.reasons || []) {
      if (reasons.length < MAX_REASONS) reasons.push(r);
    }

    if (ev.usable && ev.decision === "USE") {
      return {
        schema_version: SCHEMA_VERSION,
        classification: "ADMIT",
        selected_route: candidate.route,
        selected_model_class: candidate.model_class,
        decision: "USE",
        reasons: boundReasons(reasons),
        commercial_pool_used: ev.commercial_pool_used,
        projected_effective_remaining_percent: ev.projected,
        blackout_active: blackoutActive,
        reset_horizon_hours: ev.reset_horizon_hours,
      };
    }

    if (ev.pacing_block) anyPacingBlock = true;
    if (ev.decision === "CONSERVE" && !conserveHit) {
      conserveHit = { candidate, ev };
    }
  }

  const banked = bankedResetValid(input.chatgpt_codex_subscription, input.now_local_iso);
  const qwenOk =
    input.qwen_local.available && input.qwen_local.adequate_for_task;
  const capacityCritical = Boolean(conserveHit) || anyPacingBlock;

  // HUMAN_GATE_RESET only when a valid, soon-expiring banked reset is relevant.
  // banked_reset_count=0 alone must never produce HUMAN_GATE_RESET.
  // A non-expiring banked inventory stays advisory metadata only (CONSERVE/DEFER).
  if (banked.valid && banked.expiringSoon && capacityCritical && !qwenOk) {
    reasons.push("banked_reset_advisory_human_gate_only");
    reasons.push("banked_reset_does_not_increase_effective_remaining");
    return {
      schema_version: SCHEMA_VERSION,
      classification: "HUMAN_GATE_RESET",
      selected_route: null,
      selected_model_class: null,
      decision: "HUMAN_GATE_RESET",
      reasons: boundReasons(reasons),
      commercial_pool_used: "chatgpt_codex_subscription",
      projected_effective_remaining_percent:
        input.chatgpt_codex_subscription.effective_remaining_percent,
      blackout_active: blackoutActive,
      reset_horizon_hours: hoursUntil(
        input.now_local_iso,
        input.chatgpt_codex_subscription.banked_reset_expiry
      ),
    };
  }

  if (input.chatgpt_codex_subscription.banked_reset_count === 0) {
    reasons.push("no_banked_reset_no_human_gate");
  }

  // blackout + Qwen inadequate + commercial below reserve => DEFER (pending).
  if (blackoutActive && !qwenOk && Boolean(conserveHit)) {
    reasons.push("conserve_no_silent_spend_below_reserve");
    reasons.push("defer_pending_not_failure");
    return {
      schema_version: SCHEMA_VERSION,
      classification: "DEFER",
      selected_route: null,
      selected_model_class: null,
      decision: "DEFER",
      reasons: boundReasons(reasons),
      commercial_pool_used: null,
      projected_effective_remaining_percent: null,
      blackout_active: blackoutActive,
      reset_horizon_hours: null,
      defer_semantics: "pending",
    };
  }

  // Reserve breach with no alternate: CONSERVE (never silent spend).
  if (conserveHit && !anyPacingBlock) {
    reasons.push("conserve_no_silent_spend_below_reserve");
    return {
      schema_version: SCHEMA_VERSION,
      classification: "CONSERVE",
      selected_route: null,
      selected_model_class: null,
      decision: "CONSERVE",
      reasons: boundReasons(reasons),
      commercial_pool_used: conserveHit.candidate.pool,
      projected_effective_remaining_percent: conserveHit.ev.projected,
      blackout_active: blackoutActive,
      reset_horizon_hours: conserveHit.ev.reset_horizon_hours,
    };
  }

  if (conserveHit) {
    reasons.push("conserve_no_silent_spend_below_reserve");
  }
  reasons.push("defer_pending_not_failure");
  return {
    schema_version: SCHEMA_VERSION,
    classification: "DEFER",
    selected_route: null,
    selected_model_class: null,
    decision: "DEFER",
    reasons: boundReasons(reasons),
    commercial_pool_used: null,
    projected_effective_remaining_percent: null,
    blackout_active: blackoutActive,
    reset_horizon_hours: null,
    defer_semantics: "pending",
  };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length !== 1) failClosed("cli_requires_exactly_one_scenario_path");
  return args[0];
}

function main(argv = process.argv) {
  const scenarioPath = parseArgs(argv);
  let raw;
  try {
    raw = fs.readFileSync(scenarioPath, "utf8");
  } catch {
    failClosed("scenario_unreadable");
  }
  const input = parseScenario(raw);
  const output = simulate(input);
  process.stdout.write(JSON.stringify(output));
}

function ranAsCli() {
  try {
    const self = fileURLToPath(import.meta.url);
    return path.resolve(process.argv[1] || "") === path.resolve(self);
  } catch {
    return false;
  }
}

if (ranAsCli()) {
  try {
    main();
  } catch (e) {
    const msg = e && e.fail_closed ? e.message : "simulator_error";
    process.stderr.write(JSON.stringify({ error: String(msg).slice(0, 160) }));
    process.exit(1);
  }
}

export {
  parseScenario,
  simulate,
  main,
  qualityMeetsFloor,
  pacingAssessment,
  bankedResetValid,
  buildCandidates,
};
