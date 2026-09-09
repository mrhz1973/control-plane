#!/usr/bin/env node
// Deterministic, offline, repo-only quota pacing simulator for issue #73.

import fs from 'node:fs';

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length !== 1) {
    throw new Error('CLI accepts exactly one UTF-8 JSON scenario path');
  }
  return args[0];
}

function toMinutes(t) {
  // Accepts 'HH:MM' or full ISO timestamp
  if (/^\d{1,2}:\d{2}/.test(t)) {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  const d = new Date(t);
  return d.getHours() * 60 + d.getMinutes();
}

function computeWindowRemaining(effective, rolling, weekly) {
  return Math.min(effective, rolling, weekly);
}

function classifyPacing(remainingPct, minutesToReset, burnPerHour, horizonHours) {
  if (burnPerHour <= 0) return 'OK';
  const projectedExhaustionHours = remainingPct / burnPerHour;
  const timeToResetHours = minutesToReset / 60;
  if (projectedExhaustionHours <= timeToResetHours) return 'PACING_EXHAUST_BEFORE_RESET';
  if (projectedExhaustionHours <= horizonHours) return 'PACING_EXHAUST_WITHIN_HORIZON';
  return 'OK';
}

function main() {
  const scenarioPath = parseArgs(process.argv);
  const raw = fs.readFileSync(scenarioPath, 'utf-8');
  let input;
  try { input = JSON.parse(raw); } catch (e) { throw new Error(`Invalid JSON scenario: ${e.message}`); }

  const { now_local_iso, qwen_local, glm_coding_plan, chatgpt_codex_subscription, task, policy, empirical_burn } = input;

  const now = new Date(now_local_iso);
  const nowMinutes = toMinutes(now_local_iso);

  const blackoutStart = toMinutes(policy.glm_blackout_local_start);
  const blackoutEnd = toMinutes(policy.glm_blackout_local_end);
  const inBlackout = nowMinutes >= blackoutStart && nowMinutes < blackoutEnd;

  // --- Qwen local ---
  const qwen = { route: 'qwen_local', available: false, admitted: false, classification: 'UNKNOWN', reasons: [] };
  if (!qwen_local.available) {
    qwen.classification = 'UNAVAILABLE'; qwen.reasons.push('qwen_local not available');
  } else if (!qwen_local.adequate_for_task) {
    qwen.classification = 'INADEQUATE'; qwen.reasons.push('qwen_local inadequate_for_task');
  } else {
    qwen.available = true; qwen.admitted = true; qwen.classification = 'ADMIT';
    qwen.reasons.push('qwen_local has no commercial quota; preferred when available+adequate');
  }

  // --- GLM ---
  const glmFreshOk = glm_coding_plan.freshness === 'fresh';
  const glmWindow = computeWindowRemaining(glm_coding_plan.effective_remaining_percent, glm_coding_plan.rolling_remaining_percent, glm_coding_plan.weekly_remaining_percent);
  let glmMinutesToReset = 0;
  try {
    const nextReset = Math.min(new Date(glm_coding_plan.rolling_reset_at).getTime(), new Date(glm_coding_plan.weekly_reset_at).getTime());
    glmMinutesToReset = Math.max(0, Math.round((nextReset - now.getTime()) / 60000));
  } catch {}
  const glmBurn = task.estimated_burn_class === 'low' ? empirical_burn.glm_flash : empirical_burn.glm_full;
  const glmStateOk = glm_coding_plan.state === 'active' || glm_coding_plan.state === 'available';

  let glmClass = 'ADMIT'; const glmReasons = []; let glmAdmitted = true;
  if (inBlackout) { glmClass = 'BLACKOUT'; glmReasons.push('glm_blackout_active_0800_1200_Rome'); }
  if (!glmFreshOk) { glmClass = 'STALE_FAIL_CLOSED'; glmReasons.push(`glm_freshness=${glm_coding_plan.freshness}_fail_closed`); }
  if (!glmStateOk) { glmClass = 'UNAVAILABLE'; glmReasons.push(`glm_state=${glm_coding_plan.state}`); }
  if (glmClass !== 'ADMIT') { glmAdmitted = false; }

  if (glmClass === 'ADMIT') {
    const projectedAfter = glmWindow - glmBurn;
    if (projectedAfter <= policy.reserve_floor_percent) {
      if (task.urgency === 'high') { glmClass = 'ESCALATE'; glmReasons.push('escalated_due_to_urgency'); }
      else { glmClass = 'CONSERVE'; glmAdmitted = false; glmReasons.push(`reserve_floor_breach: projected=${projectedAfter.toFixed(2)}<=${policy.reserve_floor_percent}`); }
    }
  }
  const glmResult = { route: 'glm_coding_plan', available: glmStateOk && !inBlackout && glmFreshOk, admitted: glmAdmitted, classification: glmClass, reasons: glmReasons };

  // --- Codex ---
  const codexFreshOk = chatgpt_codex_subscription.freshness === 'fresh';
  const codexWindow = computeWindowRemaining(chatgpt_codex_subscription.effective_remaining_percent, chatgpt_codex_subscription.rolling_remaining_percent, chatgpt_codex_subscription.weekly_remaining_percent);
  let codexMinutesToReset = 0;
  try {
    const nextReset = Math.min(new Date(chatgpt_codex_subscription.rolling_reset_at).getTime(), new Date(chatgpt_codex_subscription.weekly_reset_at).getTime());
    codexMinutesToReset = Math.max(0, Math.round((nextReset - now.getTime()) / 60000));
  } catch {}
  let codexBurn;
  if (task.estimated_burn_class === 'low') codexBurn = empirical_burn.codex_low;
  else if (task.estimated_burn_class === 'medium') codexBurn = empirical_burn.codex_medium;
  else codexBurn = empirical_burn.codex_strong;
  const codexStateOk = chatgpt_codex_subscription.state === 'active' || chatgpt_codex_subscription.state === 'available';
  const codexAvailable = codexStateOk && codexFreshOk;

  const bankedAvailable = chatgpt_codex_subscription.banked_reset_count > 0 &&
    new Date(chatgpt_codex_subscription.banked_reset_expiry).getTime() > now.getTime();

  let codexClass = 'ADMIT'; const codexReasons = []; let codexAdmitted = true;
  if (!codexStateOk) { codexClass = 'UNAVAILABLE'; codexReasons.push(`codex_state=${chatgpt_codex_subscription.state}`); }
  if (!codexFreshOk) { codexClass = 'STALE_FAIL_CLOSED'; codexReasons.push(`codex_freshness=${chatgpt_codex_subscription.freshness}_fail_closed`); }

  if (codexClass === 'ADMIT') {
    const projectedAfter = codexWindow - codexBurn;
    if (projectedAfter <= policy.reserve_floor_percent) {
      codexClass = 'HUMAN_GATE_RESET'; codexAdmitted = false;
      codexReasons.push(bankedAvailable ? 'would_require_banked_reset_human_gate_required' : 'reserve_floor_breach_no_banked_reset_human_gate_required');
    }
  }
  const codexResult = { route: 'codex_subscription', available: codexAvailable, admitted: codexAdmitted, classification: codexClass, reasons: codexReasons };

  // --- Recommendation ---
  const admittedRoutes = [qwen, glmResult, codexResult].filter(r => r.admitted);
  let recommendation = 'NO_ROUTE'; let gate = null;
  const hmr = [qwen, glmResult, codexResult].find(r => r.classification === 'HUMAN_GATE_RESET');
  if (hmr) gate = `${hmr.route}: HUMAN_GATE_RESET`;

  if (admittedRoutes.length > 0) {
    recommendation = qwen.admitted ? 'qwen_local' : (glmResult.admitted ? 'glm_coding_plan' : 'codex_subscription');
  } else if (gate) { recommendation = gate; }

  const output = {
    scenario_path: scenarioPath, now_local_iso: now_local_iso,
    glm_blackout_active: inBlackout,
    qwen_local: qwen, glm_coding_plan: glmResult, codex_subscription: codexResult,
    recommendation, gate,
    policy: { reserve_floor_percent: policy.reserve_floor_percent, horizon_hours: policy.horizon_hours, glm_blackout: { start: policy.glm_blackout_local_start, end: policy.glm_blackout_local_end } },
    task, empirical_burn
  };
  process.stdout.write(JSON.stringify(output));
}

try { main(); } catch (e) { process.stderr.write(JSON.stringify({ error: e.message })); process.exit(1); }
