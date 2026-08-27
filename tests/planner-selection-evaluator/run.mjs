#!/usr/bin/env node
/**
 * D-0022-W — local fixture runner for planner selection evaluator.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const TOOL = join(ROOT, "tools/evaluate-planner-selection.mjs");
const FIX = join(HERE, "fixtures");

const CASES = [
  {
    name: "01-qwen-healthy",
    file: "01-qwen-healthy.json",
    expect: {
      policy_result: "PROCEED",
      selected: "qwen",
      preferred: "qwen",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: [],
      exitZero: true,
    },
  },
  {
    name: "02-glm-healthy",
    file: "02-glm-healthy.json",
    expect: {
      policy_result: "PROCEED",
      selected: "glm",
      preferred: "glm",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: [],
      exitZero: true,
    },
  },
  {
    name: "03-codex-healthy",
    file: "03-codex-healthy.json",
    expect: {
      policy_result: "PROCEED",
      selected: "codex",
      preferred: "codex",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: [],
      exitZero: true,
    },
  },
  {
    name: "04-glm-conserve-codex-healthy",
    file: "04-glm-conserve-codex-healthy.json",
    expect: {
      policy_result: "PROCEED",
      selected: "codex",
      preferred: "glm",
      fallback_used: true,
      fallback_reason: "PREFERRED_QUOTA_CONSERVE",
      reason_codes: ["PREFERRED_QUOTA_CONSERVE"],
      exitZero: true,
    },
  },
  {
    name: "05-glm-conserve-no-healthy-fallback",
    file: "05-glm-conserve-no-healthy-fallback.json",
    expect: {
      policy_result: "PROCEED",
      selected: "glm",
      preferred: "glm",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["PREFERRED_CONSERVE_NO_HEALTHY_FALLBACK"],
      exitZero: true,
    },
  },
  {
    name: "06-codex-unavail-medium-glm-healthy",
    file: "06-codex-unavail-medium-glm-healthy.json",
    expect: {
      policy_result: "PROCEED",
      selected: "glm",
      preferred: "codex",
      fallback_used: true,
      fallback_reason: "PREFERRED_UNAVAILABLE",
      reason_codes: ["PREFERRED_UNAVAILABLE"],
      exitZero: true,
    },
  },
  {
    name: "07-codex-unavail-high",
    file: "07-codex-unavail-high.json",
    expect: {
      policy_result: "GATE",
      selected: null,
      preferred: "codex",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["HIGH_RISK_PREFERRED_UNAVAILABLE"],
      exitZero: true,
    },
  },
  {
    name: "08-glm-unavail-equivalent-or-gate",
    file: "08-glm-unavail-equivalent-or-gate.json",
    expect: {
      policy_result: "GATE",
      selected: null,
      preferred: "glm",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["EQUIVALENCE_ATTESTATION_UNAVAILABLE"],
      exitZero: true,
    },
  },
  {
    name: "09-glm-unavail-gate-only",
    file: "09-glm-unavail-gate-only.json",
    expect: {
      policy_result: "GATE",
      selected: null,
      preferred: "glm",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["PREFERRED_UNAVAILABLE_GATE_ONLY"],
      exitZero: true,
    },
  },
  {
    name: "10-qwen-high-pressure-glm-fallback",
    file: "10-qwen-high-pressure-glm-fallback.json",
    expect: {
      policy_result: "PROCEED",
      selected: "glm",
      preferred: "qwen",
      fallback_used: true,
      fallback_reason: "PREFERRED_UNAVAILABLE",
      reason_codes: ["PREFERRED_UNAVAILABLE"],
      exitZero: true,
    },
  },
  {
    name: "11-preferred-unknown-fallback",
    file: "11-preferred-unknown-fallback.json",
    expect: {
      policy_result: "PROCEED",
      selected: "codex",
      preferred: "glm",
      fallback_used: true,
      fallback_reason: "PREFERRED_UNKNOWN",
      reason_codes: ["PREFERRED_UNKNOWN"],
      exitZero: true,
    },
  },
  {
    name: "12-all-unusable",
    file: "12-all-unusable.json",
    expect: {
      policy_result: "GATE",
      selected: null,
      preferred: "glm",
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["NO_USABLE_PLANNER"],
      exitZero: true,
    },
  },
  {
    name: "13-second-fallback-healthy",
    file: "13-second-fallback-healthy.json",
    expect: {
      policy_result: "PROCEED",
      selected: "glm",
      preferred: "qwen",
      fallback_used: true,
      fallback_reason: "PREFERRED_UNAVAILABLE",
      reason_codes: ["PREFERRED_UNAVAILABLE"],
      exitZero: true,
    },
  },
  {
    name: "14-only-conserve-fallback",
    file: "14-only-conserve-fallback.json",
    expect: {
      policy_result: "PROCEED",
      selected: "glm",
      preferred: "qwen",
      fallback_used: true,
      fallback_reason: "PREFERRED_UNAVAILABLE",
      reason_codes: ["PREFERRED_UNAVAILABLE"],
      exitZero: true,
    },
  },
  {
    name: "15-invalid-input",
    file: "15-invalid-input.json",
    expect: {
      policy_result: "BLOCKED",
      selected: null,
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["ROUTING_INPUT_INVALID"],
      exitZero: false,
    },
  },
  {
    name: "16-preferred-in-fallback",
    file: "16-preferred-in-fallback.json",
    expect: {
      policy_result: "BLOCKED",
      selected: null,
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["ROUTING_INPUT_INVALID"],
      exitZero: false,
    },
  },
  {
    name: "17-duplicate-fallback",
    file: "17-duplicate-fallback.json",
    expect: {
      policy_result: "BLOCKED",
      selected: null,
      fallback_used: false,
      fallback_reason: null,
      reason_codes: ["ROUTING_INPUT_INVALID"],
      exitZero: false,
    },
  },
];

function sameArray(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((v, i) => v === b[i])
  );
}

function runCase(c) {
  const path = join(FIX, c.file);
  const proc = spawnSync(process.execPath, [TOOL, path], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const stdout = (proc.stdout || "").trim();
  let result;
  try {
    result = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).pop());
  } catch {
    return {
      name: c.name,
      pass: false,
      detail: `non-JSON stdout=${stdout.slice(0, 400)}`,
    };
  }
  const e = c.expect;
  const checks = [
    ["policy_result", result.policy_result === e.policy_result],
    ["selected", result.selected === e.selected],
    ["fallback_used", result.fallback_used === e.fallback_used],
    ["fallback_reason", result.fallback_reason === e.fallback_reason],
    ["reason_codes", sameArray(result.reason_codes, e.reason_codes)],
    ["schema", result.schema === "planner-selection-v1"],
    ["exit", e.exitZero ? proc.status === 0 : proc.status !== 0],
  ];
  if (e.preferred !== undefined) {
    checks.push(["preferred", result.preferred === e.preferred]);
  }
  // Invariants
  if (result.policy_result === "PROCEED") {
    checks.push(["proceed-selected", result.selected != null]);
  }
  if (result.policy_result === "GATE" || result.policy_result === "BLOCKED") {
    checks.push(["gate-blocked-selected-null", result.selected === null]);
  }
  if (result.fallback_used === true) {
    checks.push([
      "fallback-invariant",
      result.selected !== result.preferred && result.fallback_reason != null,
    ]);
  }
  if (result.fallback_used === false) {
    checks.push([
      "no-fake-fallback",
      (result.selected === result.preferred || result.selected === null) &&
        result.fallback_reason === null,
    ]);
  }

  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  return {
    name: c.name,
    pass: failed.length === 0,
    detail:
      failed.length === 0
        ? "ok"
        : `failed=${failed.join(",")} got=${JSON.stringify({
            policy_result: result.policy_result,
            selected: result.selected,
            preferred: result.preferred,
            fallback_used: result.fallback_used,
            fallback_reason: result.fallback_reason,
            reason_codes: result.reason_codes,
            exit: proc.status,
          })}`,
  };
}

const results = CASES.map(runCase);
const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
}
const summary = {
  ok: failed.length === 0,
  classification: failed.length === 0 ? "PASS" : "FAIL",
  passed: results.filter((r) => r.pass).length,
  failed: failed.length,
  total: results.length,
};
console.log(JSON.stringify(summary));
process.exit(failed.length === 0 ? 0 : 1);
