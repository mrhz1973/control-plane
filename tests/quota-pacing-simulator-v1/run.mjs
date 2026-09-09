#!/usr/bin/env node
// Focused test runner for quota pacing simulator v1.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIMULATOR = path.resolve(__dirname, '../../tools/simulate-quota-pacing-v1.mjs');

const scenario = {
  now_local_iso: '2026-09-09T10:00:00+02:00',
  qwen_local: { available: true, adequate_for_task: true },
  glm_coding_plan: { state: 'active', freshness: 'fresh', effective_remaining_percent: 45.0, rolling_remaining_percent: 50.0, weekly_remaining_percent: 60.0, rolling_reset_at: '2026-09-09T15:00:00+02:00', weekly_reset_at: '2026-09-14T10:00:00+02:00' },
  chatgpt_codex_subscription: { state: 'active', freshness: 'fresh', effective_remaining_percent: 30.0, rolling_remaining_percent: 40.0, weekly_remaining_percent: 55.0, rolling_reset_at: '2026-09-09T18:00:00+02:00', weekly_reset_at: '2026-09-16T10:00:00+02:00', banked_reset_count: 1, banked_reset_expiry: '2026-09-20T00:00:00+02:00' },
  task: { quality_class: 'standard', urgency: 'normal', estimated_burn_class: 'medium' },
  policy: { glm_blackout_local_start: '08:00', glm_blackout_local_end: '12:00', reserve_floor_percent: 10.0, horizon_hours: 8 },
  empirical_burn: { qwen_local: 0, glm_flash: 2.0, glm_full: 5.0, codex_low: 1.0, codex_medium: 3.0, codex_strong: 8.0 }
};

function runSimulator(scenarioObj) {
  const tmpFile = path.join(os.tmpdir(), `quota_pacing_scenario_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(scenarioObj), 'utf-8');
  try {
    const out = execFileSync(process.execPath, [SIMULATOR, tmpFile], { encoding: 'utf-8' });
    return JSON.parse(out);
  } finally { try { fs.unlinkSync(tmpFile); } catch {} }
}

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error(`FAIL: ${msg}`); failures++; }
  else { console.log(`PASS: ${msg}`); }
}

// T1: Blackout active at 10:00 Rome, qwen available+adequate
const out1 = runSimulator(scenario);
assert(out1.glm_blackout_active === true, 'GLM blackout active at 10:00 Rome');
assert(out1.qwen_local.admitted === true, 'qwen_local admitted (available+adequate)');
assert(out1.qwen_local.classification === 'ADMIT', 'qwen_local classification ADMIT');
assert(out1.glm_coding_plan.classification === 'BLACKOUT', 'glm_coding_plan blocked by blackout');
assert(out1.glm_coding_plan.admitted === false, 'glm_coding_plan not admitted during blackout');
assert(out1.recommendation === 'qwen_local', 'recommendation is qwen_local');

// T2: Stale glm must fail closed
const scenarioStale = JSON.parse(JSON.stringify(scenario));
scenarioStale.glm_coding_plan.freshness = 'stale';
scenarioStale.qwen_local.available = false;
const out2 = runSimulator(scenarioStale);
assert(out2.glm_coding_plan.classification === 'STALE_FAIL_CLOSED', 'stale GLM freshness fails closed');
assert(out2.glm_coding_plan.admitted === false, 'stale GLM not admitted');

// T3: No qwen, low remaining + burn would breach reserve => CONSERVE
const scenarioReserve = JSON.parse(JSON.stringify(scenario));
scenarioReserve.now_local_iso = '2026-09-09T13:00:00+02:00';
scenarioReserve.qwen_local.available = false;
scenarioReserve.glm_coding_plan.effective_remaining_percent = 12.0;
scenarioReserve.glm_coding_plan.rolling_remaining_percent = 12.0;
scenarioReserve.glm_coding_plan.weekly_remaining_percent = 12.0;
scenarioReserve.empirical_burn.glm_full = 5.0;
const out3 = runSimulator(scenarioReserve);
assert(out3.glm_coding_plan.classification === 'CONSERVE', 'reserve floor breach => CONSERVE');
assert(out3.glm_coding_plan.admitted === false, 'CONSERVE route not admitted');

// T4: Codex would need reset => HUMAN_GATE_RESET
const scenarioReset = JSON.parse(JSON.stringify(scenario));
scenarioReset.now_local_iso = '2026-09-09T13:00:00+02:00';
scenarioReset.qwen_local.available = false;
scenarioReset.glm_coding_plan.state = 'unavailable';
scenarioReset.chatgpt_codex_subscription.effective_remaining_percent = 12.0;
scenarioReset.chatgpt_codex_subscription.rolling_remaining_percent = 12.0;
scenarioReset.chatgpt_codex_subscription.weekly_remaining_percent = 12.0;
scenarioReset.empirical_burn.codex_medium = 5.0;
const out4 = runSimulator(scenarioReset);
assert(out4.codex_subscription.classification === 'HUMAN_GATE_RESET', 'codex reserve breach with banked => HUMAN_GATE_RESET');
assert(out4.codex_subscription.admitted === false, 'HUMAN_GATE_RESET not auto-admitted');
assert(out4.codex_subscription.reasons.some(r => r.includes('human_gate')), 'HUMAN_GATE_RESET reason present');

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
