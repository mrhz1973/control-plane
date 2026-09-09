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
 * Admission capacity remains pool.effective_remaining_percent (never recomputed).
 * Long-window pacing uses weekly_remaining_percent + weekly_reset_at explicitly.
 * Rolling is short-window context only and must not mask long-window exhaustion.
 */
function pacingAssessment(pool, burnPerHour, nowIso, horizonHours) {
  const effective = pool.effective_remaining_percent;
  const weekly = pool.weekly_remaining_percent;
  const rolling = pool.rolling_remaining_percent;
  const hoursToWeekly = hoursUntil(nowIso, pool.weekly_reset_at);
  const hoursToRolling = hoursUntil(nowIso, pool.rolling_reset_at);

  let longWindowExhaust = false;
  if (burnPerHour > 0 && hoursToWeekly != null && weekly >= 0) {
    const hoursToExhaustWeekly = weekly / burnPerHour;
    // Planning clip vs weekly reset only — rolling hours must not enter this min().
    const longHorizon = Math.min(hoursToWeekly, horizonHours);
    if (hoursToExhaustWeekly <= longHorizon) {
      longWindowExhaust = true;
    }
  }

  let shortWindowPressure = false;
  if (burnPerHour > 0 && hoursToRolling != null && rolling >= 0) {
    const hoursToExhaustRolling = rolling / burnPerHour;
    if (hoursToExhaustRolling <= Math.min(hoursToRolling, horizonHours)) {
      shortWindowPressure = true;
    }
  }

  let exhaustWithinHorizon = false;
  if (burnPerHour > 0 && effective >= 0 && effective / burnPerHour <= horizonHours) {
    exhaustWithinHorizon = true;
  }

  const pacingBlock = longWindowExhaust || exhaustWithinHorizon;
  return {
    resetHorizonHours: hoursToWeekly,
    hoursToWeekly,
    hoursToRolling,
    longWindowExhaust,
    shortWindowPressure,
    exhaustWithinHorizon,
    exhaustBeforeReset: longWindowExhaust,
    pacingBlock,
  };
}

function qualityAdequacyScore(modelClass, taskQuality) {
  if (modelClass === "qwen_local") return 0;
  const q = MODEL_CLASS_QUALITY[modelClass];
  if (!q) return Number.NEGATIVE_INFINITY;
  // Prefer closest adequate match (not provider brand; not automatic over-provisioning).
  return -Math.abs(QUALITY_RANK[q] - QUALITY_RANK[taskQuality]);
}

function pacingSafetySurplus(pool, burnPerHour, nowIso) {
  if (!(burnPerHour > 0)) return Number.POSITIVE_INFINITY;
  const hoursToWeekly = hoursUntil(nowIso, pool.weekly_reset_at);
  if (hoursToWeekly == null) return 0;
  return pool.weekly_remaining_percent / burnPerHour - hoursToWeekly;
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
 * Commercial candidates: all eligible model classes for both shared pools.
 * No provider-brand order (GLM-before-Codex / Codex-before-GLM). Ranking is
 * evidence-based after evaluation. Blackout omits glm_* (shared pool gate).
 */
function buildCommercialCandidates(blackoutActive) {
  const list = [];
  if (!blackoutActive) {
    list.push({
      route: "glm_coding_plan",
      model_class: "glm_flash",
      pool: "glm_coding_plan",
    });
    list.push({
      route: "glm_coding_plan",
      model_class: "glm_full",
      pool: "glm_coding_plan",
    });
  }
  list.push({
    route: "chatgpt_codex_subscription",
    model_class: "codex_low",
    pool: "chatgpt_codex_subscription",
  });
  list.push({
    route: "chatgpt_codex_subscription",
    model_class: "codex_medium",
    pool: "chatgpt_codex_subscription",
  });
  list.push({
    route: "chatgpt_codex_subscription",
    model_class: "codex_strong",
    pool: "chatgpt_codex_subscription",
  });
  // Neutral pre-order by stable id only (not used as provider advantage).
  return list.sort((a, b) => a.model_class.localeCompare(b.model_class));
}

/** @deprecated alias kept for tests exporting buildCandidates */
function buildCandidates(task, blackoutActive) {
  void task;
  return [
    { route: "qwen_local", model_class: "qwen_local", pool: null },
    ...buildCommercialCandidates(blackoutActive),
  ];
}

/**
 * Deterministic commercial ranking from scenario evidence only:
 * a) quality adequacy (desc)
 * b) lower empirical burn (asc)
 * c) better projected headroom / pacing safety (desc)
 * d) stable model_class identifier (asc)
 * Provider identity is never a ranking key.
 */
function rankCommercialUsable(usableRows) {
  return usableRows.slice().sort((a, b) => {
    const qDiff = b.qualityScore - a.qualityScore;
    if (qDiff !== 0) return qDiff;
    const burnDiff = a.burn - b.burn;
    if (burnDiff !== 0) return burnDiff;
    const headDiff = b.projected - a.projected;
    if (headDiff !== 0) return headDiff;
    const paceDiff = b.pacingSurplus - a.pacingSurplus;
    if (paceDiff !== 0) return paceDiff;
    return a.candidate.model_class.localeCompare(b.candidate.model_class);
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
      pacing,
      burn: cost,
    };
  }

  if (pacing.pacingBlock) {
    const why = pacing.longWindowExhaust
      ? "long_window_exhaustion_before_weekly_reset"
      : "projected_exhaustion_within_horizon";
    return {
      usable: false,
      decision: "DEFER",
      reasons: [...reasons, why],
      projected,
      reset_horizon_hours: pacing.resetHorizonHours,
      commercial_pool_used: candidate.pool,
      pacing_block: true,
      reserve_block: false,
      pacing,
      burn: cost,
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
    pacing,
    burn: cost,
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

  const reasons = [];
  if (blackoutActive) reasons.push("glm_blackout_active_0800_1200_Europe_Rome");

  // Canonical rule: qwen_local first when available + adequate (no commercial quota).
  const qwenCandidate = {
    route: "qwen_local",
    model_class: "qwen_local",
    pool: null,
  };
  const qwenEv = evaluateCandidate(qwenCandidate, ctx);
  if (qwenEv.usable && qwenEv.decision === "USE") {
    return {
      schema_version: SCHEMA_VERSION,
      classification: "ADMIT",
      selected_route: "qwen_local",
      selected_model_class: "qwen_local",
      decision: "USE",
      reasons: boundReasons([
        ...reasons,
        "qwen_local_available_adequate_no_commercial_quota",
      ]),
      commercial_pool_used: null,
      projected_effective_remaining_percent: null,
      blackout_active: blackoutActive,
      reset_horizon_hours: null,
    };
  }
  for (const r of qwenEv.reasons || []) {
    if (reasons.length < MAX_REASONS) reasons.push(r);
  }

  const commercial = buildCommercialCandidates(blackoutActive);
  let conserveHit = null;
  let anyPacingBlock = false;
  const usableRows = [];

  for (const candidate of commercial) {
    const ev = evaluateCandidate(candidate, ctx);
    if (ev.pacing_block) anyPacingBlock = true;
    if (ev.decision === "CONSERVE" && !conserveHit) {
      conserveHit = { candidate, ev };
    }
    if (ev.usable && ev.decision === "USE") {
      const pool =
        candidate.pool === "glm_coding_plan" ? ctx.glm : ctx.codex;
      usableRows.push({
        candidate,
        ev,
        qualityScore: qualityAdequacyScore(
          candidate.model_class,
          input.task.quality_class
        ),
        burn: ev.burn,
        projected: ev.projected,
        pacingSurplus: pacingSafetySurplus(pool, ev.burn, ctx.now_local_iso),
      });
    } else {
      // Keep a few rejection signals without flooding reasons beyond 16.
      for (const r of ev.reasons || []) {
        if (
          /quality_floor|blackout|fail_closed|unavailable|long_window|reserve_floor|exhaustion/i.test(
            r
          ) &&
          reasons.length < MAX_REASONS
        ) {
          reasons.push(r);
        }
      }
    }
  }

  if (usableRows.length > 0) {
    const ranked = rankCommercialUsable(usableRows);
    const best = ranked[0];
    for (const r of best.ev.reasons || []) {
      if (reasons.length < MAX_REASONS) reasons.push(r);
    }
    reasons.push("commercial_rank_evidence_not_provider_brand");
    return {
      schema_version: SCHEMA_VERSION,
      classification: "ADMIT",
      selected_route: best.candidate.route,
      selected_model_class: best.candidate.model_class,
      decision: "USE",
      reasons: boundReasons(reasons),
      commercial_pool_used: best.ev.commercial_pool_used,
      projected_effective_remaining_percent: best.ev.projected,
      blackout_active: blackoutActive,
      reset_horizon_hours: best.ev.reset_horizon_hours,
    };
  }

  const banked = bankedResetValid(input.chatgpt_codex_subscription, input.now_local_iso);
  const qwenOk =
    input.qwen_local.available && input.qwen_local.adequate_for_task;
  const capacityCritical = Boolean(conserveHit) || anyPacingBlock;

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
  buildCommercialCandidates,
  rankCommercialUsable,
};
