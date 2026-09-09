#!/usr/bin/env node
/**
 * Focused acceptance tests for quota pacing simulator v1 (D-9407 / #73).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SIMULATOR = path.join(ROOT, "tools", "simulate-quota-pacing-v1.mjs");

const REQUIRED_OUT = [
  "schema_version",
  "classification",
  "selected_route",
  "selected_model_class",
  "decision",
  "reasons",
  "commercial_pool_used",
  "projected_effective_remaining_percent",
  "blackout_active",
  "reset_horizon_hours",
];

function baseScenario(overrides = {}) {
  const base = {
    now_local_iso: "2026-09-09T13:00:00+02:00",
    qwen_local: { available: false, adequate_for_task: false },
    glm_coding_plan: {
      state: "active",
      freshness: "fresh",
      effective_remaining_percent: 50,
      rolling_remaining_percent: 50,
      weekly_remaining_percent: 50,
      rolling_reset_at: "2026-09-10T13:00:00+02:00",
      weekly_reset_at: "2026-09-16T13:00:00+02:00",
    },
    chatgpt_codex_subscription: {
      state: "active",
      freshness: "fresh",
      effective_remaining_percent: 50,
      rolling_remaining_percent: 50,
      weekly_remaining_percent: 50,
      rolling_reset_at: "2026-09-10T13:00:00+02:00",
      weekly_reset_at: "2026-09-16T13:00:00+02:00",
      banked_reset_count: 0,
      banked_reset_expiry: "2026-09-01T00:00:00+02:00",
    },
    task: {
      quality_class: "standard",
      urgency: "normal",
      estimated_burn_class: "medium",
    },
    policy: {
      glm_blackout_local_start: "08:00",
      glm_blackout_local_end: "12:00",
      reserve_floor_percent: 10,
      horizon_hours: 8,
    },
    empirical_burn: {
      qwen_local: 0,
      glm_flash: 2,
      glm_full: 5,
      codex_low: 1,
      codex_medium: 3,
      codex_strong: 8,
    },
  };
  return deepMerge(base, overrides);
}

function deepMerge(a, b) {
  if (b == null) return a;
  if (Array.isArray(b) || typeof b !== "object") return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object") {
      out[k] = deepMerge(a[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function runOk(scenarioObj) {
  const tmp = path.join(
    os.tmpdir(),
    `qp_scen_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
  );
  fs.writeFileSync(tmp, JSON.stringify(scenarioObj), "utf8");
  try {
    const out = execFileSync(process.execPath, [SIMULATOR, tmp], {
      encoding: "utf8",
      timeout: 15_000,
    });
    return JSON.parse(out);
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

function runFail(scenarioObjOrRaw, { raw = false } = {}) {
  const tmp = path.join(
    os.tmpdir(),
    `qp_scen_fail_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
  );
  fs.writeFileSync(tmp, raw ? scenarioObjOrRaw : JSON.stringify(scenarioObjOrRaw), "utf8");
  try {
    execFileSync(process.execPath, [SIMULATOR, tmp], {
      encoding: "utf8",
      timeout: 15_000,
    });
    return { ok: true, stderr: "", stdout: "" };
  } catch (e) {
    return {
      ok: false,
      status: e.status,
      stderr: String(e.stderr || ""),
      stdout: String(e.stdout || ""),
    };
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failures += 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

function assertSchema(out, label) {
  for (const k of REQUIRED_OUT) {
    assert(Object.prototype.hasOwnProperty.call(out, k), `${label}: has ${k}`);
  }
  assert(out.schema_version === "quota-pacing-simulation-v1", `${label}: schema_version`);
  assert(["USE", "CONSERVE", "DEFER", "HUMAN_GATE_RESET"].includes(out.decision), `${label}: decision enum`);
  assert(Array.isArray(out.reasons), `${label}: reasons array`);
  assert(out.reasons.length <= 16, `${label}: reasons <= 16`);
  assert(typeof out.blackout_active === "boolean", `${label}: blackout boolean`);
  assert(!("scenario_path" in out), `${label}: no scenario_path leak`);
}

// --- T1 Qwen preferred without commercial quota ---
{
  const out = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T10:00:00+02:00",
      qwen_local: { available: true, adequate_for_task: true },
    })
  );
  assertSchema(out, "T1");
  assert(out.decision === "USE", "T1: USE");
  assert(out.selected_route === "qwen_local", "T1: qwen selected");
  assert(out.selected_model_class === "qwen_local", "T1: qwen class");
  assert(out.commercial_pool_used === null, "T1: no commercial pool");
  assert(out.blackout_active === true, "T1: blackout noted");
}

// --- T2 GLM blackout blocks full+Flash even at 100% ---
{
  const out = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T10:00:00+02:00",
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 100,
        rolling_remaining_percent: 100,
        weekly_remaining_percent: 100,
      },
      chatgpt_codex_subscription: {
        state: "unavailable",
        effective_remaining_percent: 100,
        rolling_remaining_percent: 100,
        weekly_remaining_percent: 100,
      },
    })
  );
  assertSchema(out, "T2");
  assert(out.blackout_active === true, "T2: blackout active");
  assert(out.selected_route !== "glm_coding_plan", "T2: glm not selected");
  assert(out.reasons.some((r) => /blackout/i.test(r)), "T2: blackout reason");
  assert(out.decision === "DEFER", "T2: DEFER when only GLM would serve");
}

// --- T3 GLM Flash/full share one pool (no duplicated capacity) ---
{
  const scen = baseScenario({
    now_local_iso: "2026-09-09T13:00:00+02:00",
    qwen_local: { available: false, adequate_for_task: false },
    glm_coding_plan: {
      effective_remaining_percent: 40,
      rolling_remaining_percent: 40,
      weekly_remaining_percent: 40,
    },
    chatgpt_codex_subscription: { state: "unavailable" },
    task: { quality_class: "standard", estimated_burn_class: "low" },
  });
  const flash = runOk(scen);
  const full = runOk(
    deepMerge(scen, { task: { quality_class: "high", estimated_burn_class: "strong" } })
  );
  assert(flash.commercial_pool_used === "glm_coding_plan", "T3: flash uses glm pool");
  assert(
    full.selected_model_class === "glm_full" || full.decision !== "USE" || full.commercial_pool_used === "glm_coding_plan",
    "T3: full uses same glm pool when selected"
  );
  assert(flash.selected_model_class === "glm_flash", "T3: flash class selected for standard");
  // Same pool evidence numbers appear in reasons; no second pool id invented.
  assert(
    !flash.reasons.some((r) => /glm_flash_pool|duplicated/i.test(r)),
    "T3: no duplicated flash pool"
  );
}

// --- T4 Codex rolling100 weekly20 effective20 respected ---
{
  const out = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T13:00:00+02:00",
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: { state: "unavailable" },
      chatgpt_codex_subscription: {
        effective_remaining_percent: 20,
        rolling_remaining_percent: 100,
        weekly_remaining_percent: 20,
        rolling_reset_at: "2026-09-09T23:00:00+02:00",
        weekly_reset_at: "2026-09-16T13:00:00+02:00",
        banked_reset_count: 0,
        banked_reset_expiry: "2026-09-01T00:00:00+02:00",
      },
      policy: { horizon_hours: 8 },
      empirical_burn: { codex_medium: 1, codex_low: 1, codex_strong: 8 },
    })
  );
  assertSchema(out, "T4");
  assert(out.decision === "USE", "T4: USE codex on effective 20");
  assert(out.selected_route === "chatgpt_codex_subscription", "T4: codex route");
  assert(out.projected_effective_remaining_percent === 19, "T4: projected from effective 20 not 100");
  assert(out.reasons.some((r) => /effective_remaining=20/.test(r)), "T4: effective 20 in reasons");
  assert(!out.reasons.some((r) => /effective_remaining=100/.test(r)), "T4: not using rolling 100");
}

// --- T5 GLM rolling40 weekly13 effective13 respected; MCP cannot inflate ---
{
  const out = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T13:00:00+02:00",
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 13,
        rolling_remaining_percent: 40,
        weekly_remaining_percent: 13,
        mcp_remaining_percent: 100,
        auxiliary_remaining_percent: 100,
      },
      chatgpt_codex_subscription: { state: "unavailable" },
      empirical_burn: { glm_flash: 1 },
      policy: { horizon_hours: 6 },
    })
  );
  assertSchema(out, "T5");
  assert(out.decision === "USE", "T5: USE glm on effective 13");
  assert(out.commercial_pool_used === "glm_coding_plan", "T5: glm pool");
  assert(out.projected_effective_remaining_percent === 12, "T5: projected 13-1=12 not MCP-inflated");
  assert(out.reasons.some((r) => /effective_remaining=13/.test(r)), "T5: effective 13 recorded");
}

// --- T6 stale / UNKNOWN commercial rejected ---
{
  const stale = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: { freshness: "stale", effective_remaining_percent: 90 },
      chatgpt_codex_subscription: { state: "unavailable" },
    })
  );
  assert(stale.decision !== "USE" || stale.selected_route !== "glm_coding_plan", "T6a: stale glm not used");
  assert(stale.reasons.some((r) => /freshness_stale|fail_closed/i.test(r)), "T6a: stale reason");

  const unk = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: { state: "unknown", freshness: "fresh", effective_remaining_percent: 90 },
      chatgpt_codex_subscription: { freshness: "unknown", state: "active" },
    })
  );
  assert(unk.decision !== "USE", "T6b: UNKNOWN pools not admitted");
  assert(unk.reasons.some((r) => /unknown_fail_closed|state_unknown/i.test(r)), "T6b: unknown reason");
}

// --- T7 reserve-floor breach => alternate or CONSERVE/DEFER, never silent spend ---
{
  const alternate = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 12,
        rolling_remaining_percent: 12,
        weekly_remaining_percent: 12,
      },
      chatgpt_codex_subscription: {
        effective_remaining_percent: 40,
        rolling_remaining_percent: 40,
        weekly_remaining_percent: 40,
        banked_reset_count: 0,
        banked_reset_expiry: "2026-09-01T00:00:00+02:00",
      },
      empirical_burn: { glm_flash: 5, glm_full: 8, codex_medium: 3 },
      policy: { reserve_floor_percent: 10 },
    })
  );
  assert(alternate.decision === "USE", "T7a: alternate route used");
  assert(alternate.selected_route === "chatgpt_codex_subscription", "T7a: codex alternate");
  assert(alternate.projected_effective_remaining_percent > 10, "T7a: not below reserve");

  const conserve = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 12,
        rolling_remaining_percent: 12,
        weekly_remaining_percent: 12,
      },
      chatgpt_codex_subscription: {
        effective_remaining_percent: 12,
        rolling_remaining_percent: 12,
        weekly_remaining_percent: 12,
        banked_reset_count: 0,
        banked_reset_expiry: "2026-09-01T00:00:00+02:00",
      },
      empirical_burn: {
        glm_flash: 5,
        glm_full: 8,
        codex_low: 5,
        codex_medium: 5,
        codex_strong: 8,
      },
      policy: { reserve_floor_percent: 10, horizon_hours: 1 },
    })
  );
  assert(["CONSERVE", "DEFER"].includes(conserve.decision), "T7b: CONSERVE or DEFER");
  assert(conserve.selected_route === null, "T7b: no silent spend route");
}

// --- T8 projected exhaustion before reset => downgrade or DEFER ---
{
  const downgrade = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 30,
        rolling_remaining_percent: 30,
        weekly_remaining_percent: 30,
        rolling_reset_at: "2026-09-09T20:00:00+02:00",
        weekly_reset_at: "2026-09-09T20:00:00+02:00",
      },
      chatgpt_codex_subscription: { state: "unavailable" },
      task: { quality_class: "standard", estimated_burn_class: "medium" },
      policy: { horizon_hours: 8 },
      empirical_burn: { glm_flash: 2, glm_full: 10 },
    })
  );
  // glm_full: 30/10=3h <= reset horizon ~7h => blocked; glm_flash 30/2=15h > 7 => may USE
  assert(downgrade.decision === "USE", "T8a: downgrade to less demanding class");
  assert(downgrade.selected_model_class === "glm_flash", "T8a: glm_flash selected");

  const deferPace = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 40,
        rolling_remaining_percent: 40,
        weekly_remaining_percent: 40,
        rolling_reset_at: "2026-09-09T20:00:00+02:00",
        weekly_reset_at: "2026-09-09T20:00:00+02:00",
      },
      chatgpt_codex_subscription: { state: "unavailable" },
      task: { quality_class: "high", estimated_burn_class: "strong" },
      empirical_burn: { glm_flash: 2, glm_full: 10 },
      policy: { horizon_hours: 8, reserve_floor_percent: 5 },
    })
  );
  assert(deferPace.decision === "DEFER", "T8b: DEFER when no adequate lower class");
  assert(deferPace.defer_semantics === "pending", "T8b: pending semantics");
}

// --- T9 quality floor: strong never drops below floor ---
{
  const out = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 80,
        rolling_remaining_percent: 80,
        weekly_remaining_percent: 80,
      },
      chatgpt_codex_subscription: { state: "unavailable" },
      task: { quality_class: "strong", estimated_burn_class: "medium" },
      empirical_burn: { glm_flash: 2, glm_full: 5 },
    })
  );
  assert(out.decision === "USE", "T9: USE high-enough class");
  assert(out.selected_model_class === "glm_full", "T9: not glm_flash for strong");
  assert(out.reasons.some((r) => /quality_floor_blocks_glm_flash/.test(r)), "T9: flash blocked by floor");
}

// --- T10 banked reset does not change effective remaining ---
{
  const withBanked = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: { state: "unavailable" },
      chatgpt_codex_subscription: {
        effective_remaining_percent: 40,
        rolling_remaining_percent: 40,
        weekly_remaining_percent: 40,
        banked_reset_count: 2,
        banked_reset_expiry: "2026-10-05T00:43:00+02:00",
      },
      empirical_burn: { codex_medium: 3 },
    })
  );
  assert(withBanked.decision === "USE", "T10: USE without consuming reset");
  assert(withBanked.projected_effective_remaining_percent === 37, "T10: projected ignores banked inventory");
  assert(withBanked.decision !== "HUMAN_GATE_RESET", "T10: no gate when capacity OK");
}

// --- T11 expiring valid reset => HUMAN_GATE_RESET advisory only ---
{
  const out = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T13:00:00+02:00",
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: { state: "unavailable" },
      chatgpt_codex_subscription: {
        effective_remaining_percent: 12,
        rolling_remaining_percent: 12,
        weekly_remaining_percent: 12,
        banked_reset_count: 1,
        banked_reset_expiry: "2026-09-10T12:00:00+02:00",
      },
      empirical_burn: {
        codex_low: 5,
        codex_medium: 5,
        codex_strong: 8,
      },
      policy: { reserve_floor_percent: 10, horizon_hours: 1 },
    })
  );
  assert(out.decision === "HUMAN_GATE_RESET", "T11: HUMAN_GATE_RESET advisory");
  assert(out.selected_route === null, "T11: no auto route");
  assert(out.projected_effective_remaining_percent === 12, "T11: remaining unchanged by banked");
  assert(out.reasons.some((r) => /banked_reset_advisory/.test(r)), "T11: advisory reason");
}

// --- T12 no banked reset => no HUMAN_GATE_RESET ---
{
  const out = runOk(
    baseScenario({
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: { state: "unavailable" },
      chatgpt_codex_subscription: {
        effective_remaining_percent: 12,
        rolling_remaining_percent: 12,
        weekly_remaining_percent: 12,
        banked_reset_count: 0,
        banked_reset_expiry: "2026-09-01T00:00:00+02:00",
      },
      empirical_burn: { codex_low: 5, codex_medium: 5, codex_strong: 8 },
      policy: { reserve_floor_percent: 10, horizon_hours: 1 },
    })
  );
  assert(out.decision !== "HUMAN_GATE_RESET", "T12: no HUMAN_GATE without banked");
  assert(["CONSERVE", "DEFER"].includes(out.decision), "T12: CONSERVE/DEFER instead");
  assert(out.reasons.some((r) => /no_banked_reset_no_human_gate/.test(r)), "T12: explicit no-gate reason");
}

// --- T13 blackout + Qwen inadequate + Codex below reserve => DEFER ---
{
  const out = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T10:00:00+02:00",
      qwen_local: { available: true, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 100,
        rolling_remaining_percent: 100,
        weekly_remaining_percent: 100,
      },
      chatgpt_codex_subscription: {
        effective_remaining_percent: 12,
        rolling_remaining_percent: 12,
        weekly_remaining_percent: 12,
        banked_reset_count: 0,
        banked_reset_expiry: "2026-09-01T00:00:00+02:00",
      },
      empirical_burn: { codex_low: 5, codex_medium: 5, codex_strong: 8 },
      policy: { reserve_floor_percent: 10 },
    })
  );
  assert(out.blackout_active === true, "T13: blackout");
  assert(out.decision === "DEFER", "T13: DEFER");
  assert(out.defer_semantics === "pending", "T13: pending not failure");
  assert(out.selected_route === null, "T13: no route");
}

// --- T14 fail closed: malformed / non-object / missing / secret-like ---
{
  const malformed = runFail("{not-json", { raw: true });
  assert(malformed.ok === false, "T14a: malformed fails");
  assert(!/sk-|eyJ|Bearer/i.test(malformed.stderr), "T14a: no secret echo");

  const nonObj = runFail("[]", { raw: true });
  assert(nonObj.ok === false, "T14b: non-object fails");

  const missing = runFail({ now_local_iso: "2026-09-09T13:00:00+02:00" });
  assert(missing.ok === false, "T14c: missing fields fail");

  const secret = runFail(
    baseScenario({
      chatgpt_codex_subscription: {
        api_key: "sk-test-should-not-echo",
      },
    })
  );
  assert(secret.ok === false, "T14d: secret-like fails closed");
  assert(!/sk-test-should-not-echo/.test(secret.stderr + secret.stdout), "T14d: secret not echoed");
}

// --- T15 no provider/network/model invocation in simulator source ---
{
  const src = fs.readFileSync(SIMULATOR, "utf8");
  assert(!/\bfetch\s*\(/.test(src), "T15: no fetch");
  assert(!/\baxios\b/.test(src), "T15: no axios");
  assert(!/createConnection|net\.|http\.|https\.|WebSocket/.test(src), "T15: no network APIs");
  assert(!/openai|anthropic|spawn\(|execFile\(/.test(src), "T15: no provider/model spawn");
  assert(
    !/Qwen -> GLM|GLM Flash -> Codex|GLM-before-Codex|provider-brand/i.test(src) ||
      /not_provider_brand|not provider brand|evidence_not_provider/i.test(src),
    "T15b: no hardcoded provider commercial order"
  );
}

// --- T16 evidence-ranked commercial order (not provider-brand fixed) ---
{
  const equalPools = {
    now_local_iso: "2026-09-09T13:00:00+02:00",
    qwen_local: { available: false, adequate_for_task: false },
    glm_coding_plan: {
      state: "active",
      freshness: "fresh",
      effective_remaining_percent: 60,
      rolling_remaining_percent: 60,
      weekly_remaining_percent: 60,
      rolling_reset_at: "2026-09-10T13:00:00+02:00",
      weekly_reset_at: "2026-09-16T13:00:00+02:00",
    },
    chatgpt_codex_subscription: {
      state: "active",
      freshness: "fresh",
      effective_remaining_percent: 60,
      rolling_remaining_percent: 60,
      weekly_remaining_percent: 60,
      rolling_reset_at: "2026-09-10T13:00:00+02:00",
      weekly_reset_at: "2026-09-16T13:00:00+02:00",
      banked_reset_count: 0,
      banked_reset_expiry: "2026-09-01T00:00:00+02:00",
    },
    task: { quality_class: "standard", urgency: "normal", estimated_burn_class: "medium" },
    policy: {
      glm_blackout_local_start: "08:00",
      glm_blackout_local_end: "12:00",
      reserve_floor_percent: 10,
      horizon_hours: 8,
    },
  };

  const glmWins = runOk(
    baseScenario({
      ...equalPools,
      empirical_burn: {
        qwen_local: 0,
        glm_flash: 1,
        glm_full: 9,
        codex_low: 9,
        codex_medium: 6,
        codex_strong: 9,
      },
    })
  );
  assert(glmWins.decision === "USE", "T16a: USE");
  assert(glmWins.selected_model_class === "glm_flash", "T16a: lower burn makes GLM win");
  assert(glmWins.commercial_pool_used === "glm_coding_plan", "T16a: glm pool");

  const codexWins = runOk(
    baseScenario({
      ...equalPools,
      empirical_burn: {
        qwen_local: 0,
        glm_flash: 6,
        glm_full: 9,
        codex_low: 9,
        codex_medium: 1,
        codex_strong: 9,
      },
    })
  );
  assert(codexWins.decision === "USE", "T16b: USE");
  assert(codexWins.selected_model_class === "codex_medium", "T16b: reversed burn makes Codex win");
  assert(codexWins.commercial_pool_used === "chatgpt_codex_subscription", "T16b: codex pool");
  assert(
    glmWins.selected_route !== codexWins.selected_route,
    "T16c: result not fixed by provider ordering"
  );

  const tieA = runOk(
    baseScenario({
      ...equalPools,
      empirical_burn: {
        qwen_local: 0,
        glm_flash: 2,
        glm_full: 9,
        codex_low: 9,
        codex_medium: 2,
        codex_strong: 9,
      },
    })
  );
  const tieB = runOk(
    baseScenario({
      ...equalPools,
      empirical_burn: {
        qwen_local: 0,
        glm_flash: 2,
        glm_full: 9,
        codex_low: 9,
        codex_medium: 2,
        codex_strong: 9,
      },
    })
  );
  assert(tieA.decision === "USE" && tieB.decision === "USE", "T16d: tie USE");
  assert(
    tieA.selected_model_class === tieB.selected_model_class,
    "T16d: deterministic neutral tie-break stable"
  );
  assert(
    tieA.selected_model_class === "codex_medium" || tieA.selected_model_class === "glm_flash",
    "T16d: tie-break is a stable model_class id"
  );
}

// --- T17 long-window protection not masked by soon rolling reset ---
{
  const asymmetric = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T13:00:00+02:00",
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        // Canonical effective stays the binding admission capacity (here 55).
        effective_remaining_percent: 55,
        rolling_remaining_percent: 90,
        weekly_remaining_percent: 20,
        rolling_reset_at: "2026-09-09T15:00:00+02:00", // soon — looks safe alone
        weekly_reset_at: "2026-09-16T13:00:00+02:00", // much later
      },
      chatgpt_codex_subscription: { state: "unavailable" },
      task: { quality_class: "standard", estimated_burn_class: "medium" },
      policy: { horizon_hours: 8, reserve_floor_percent: 5 },
      empirical_burn: { glm_flash: 5, glm_full: 8 },
    })
  );
  // weekly 20 / burn 5 = 4h <= min(weeklyHours, 8)=8 → long-window block for flash;
  // glm_full worse. Must not USE unchanged.
  assert(asymmetric.decision !== "USE" || asymmetric.selected_model_class !== "glm_flash", "T17a: flash not silently used");
  assert(["DEFER", "CONSERVE"].includes(asymmetric.decision) || asymmetric.selected_model_class !== "glm_flash", "T17a2: no unsafe flash admit");
  assert(
    asymmetric.decision === "DEFER" ||
      (asymmetric.decision === "USE" && asymmetric.selected_model_class !== "glm_flash"),
    "T17b: downgrade or DEFER, never USE flash unchanged"
  );
  assert(
    asymmetric.reasons.some((r) => /long_window_exhaustion_before_weekly_reset/.test(r)) ||
      asymmetric.decision === "DEFER",
    "T17c: long-window reason or defer"
  );

  // Lower burn can clear long-window while effective remains canonical (not recomputed).
  const downgrade = runOk(
    baseScenario({
      now_local_iso: "2026-09-09T13:00:00+02:00",
      qwen_local: { available: false, adequate_for_task: false },
      glm_coding_plan: {
        effective_remaining_percent: 55,
        rolling_remaining_percent: 90,
        weekly_remaining_percent: 20,
        rolling_reset_at: "2026-09-09T15:00:00+02:00",
        weekly_reset_at: "2026-09-16T13:00:00+02:00",
      },
      chatgpt_codex_subscription: { state: "unavailable" },
      task: { quality_class: "standard", estimated_burn_class: "medium" },
      policy: { horizon_hours: 8, reserve_floor_percent: 5 },
      empirical_burn: { glm_flash: 1, glm_full: 8 },
    })
  );
  // weekly 20 / 1 = 20h > horizon 8 → admit flash; projected from effective 55.
  assert(downgrade.decision === "USE", "T17d: lower burn admits");
  assert(downgrade.selected_model_class === "glm_flash", "T17d: flash after lower burn");
  assert(downgrade.projected_effective_remaining_percent === 54, "T17e: effective 55 canonical (not MIN recompute)");
  assert(downgrade.reasons.some((r) => /effective_remaining=55/.test(r)), "T17e2: effective recorded");
  assert(!downgrade.reasons.some((r) => /effective_remaining=90/.test(r)), "T17e3: rolling does not become effective");
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
