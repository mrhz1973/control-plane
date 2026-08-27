#!/usr/bin/env node
/**
 * D-0021-W — local fixture runner for Execution Packet policy gate.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const TOOL = join(ROOT, "tools/evaluate-execution-packet-policy.mjs");
const FIX = join(HERE, "fixtures");

const CASES = [
  {
    name: "proceed-clean",
    file: "proceed-clean.json",
    expectDecision: "PROCEED",
    expectCodes: [],
    expectExitZero: true,
    expectDispatch: true,
    expectHumanGate: false,
  },
  {
    name: "gate-risk-high",
    file: "gate-risk-high.json",
    expectDecision: "GATE",
    expectCodes: ["RISK_HIGH"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-scope-expansion",
    file: "gate-scope-expansion.json",
    expectDecision: "GATE",
    expectCodes: ["SCOPE_EXPANSION"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-destructive",
    file: "gate-destructive.json",
    expectDecision: "GATE",
    expectCodes: ["DESTRUCTIVE"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-production-sensitive",
    file: "gate-production-sensitive.json",
    expectDecision: "GATE",
    expectCodes: ["PRODUCTION_SENSITIVE"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-credentials-billing",
    file: "gate-credentials-billing.json",
    expectDecision: "GATE",
    expectCodes: ["CREDENTIALS_OR_BILLING"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-planner-recommended",
    file: "gate-planner-recommended.json",
    expectDecision: "GATE",
    expectCodes: ["PLANNER_RECOMMENDED_GATE"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-planner-fallback",
    file: "gate-planner-fallback.json",
    expectDecision: "GATE",
    expectCodes: ["PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-multi-reasons",
    file: "gate-multi-reasons.json",
    expectDecision: "GATE",
    expectCodes: [
      "PACKET_ALREADY_GATED",
      "RISK_HIGH",
      "SCOPE_EXPANSION",
      "DESTRUCTIVE",
      "PRODUCTION_SENSITIVE",
      "CREDENTIALS_OR_BILLING",
      "PLANNER_RECOMMENDED_GATE",
      "PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE",
    ],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "gate-already-gated",
    file: "gate-already-gated.json",
    expectDecision: "GATE",
    expectCodes: ["PACKET_ALREADY_GATED"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
  },
  {
    name: "blocked-superseded",
    file: "blocked-superseded.json",
    expectDecision: "BLOCKED",
    expectCodes: ["PACKET_SUPERSEDED"],
    expectExitZero: false,
    expectDispatch: false,
    expectHumanGate: false,
  },
  {
    name: "blocked-schema-invalid",
    file: "blocked-schema-invalid.json",
    expectDecision: "BLOCKED",
    expectCodes: ["PACKET_SCHEMA_INVALID"],
    expectExitZero: false,
    expectDispatch: false,
    expectHumanGate: false,
  },
  {
    name: "blocked-max-rounds-11",
    file: "blocked-max-rounds-11.json",
    expectDecision: "BLOCKED",
    expectCodes: ["PACKET_SCHEMA_INVALID"],
    expectExitZero: false,
    expectDispatch: false,
    expectHumanGate: false,
  },
  {
    name: "blocked-max-review-rounds-11",
    file: "blocked-max-review-rounds-11.json",
    expectDecision: "BLOCKED",
    expectCodes: ["PACKET_SCHEMA_INVALID"],
    expectExitZero: false,
    expectDispatch: false,
    expectHumanGate: false,
  },
  {
    name: "gate-ready-for-execution-destructive",
    file: "gate-ready-for-execution-destructive.json",
    expectDecision: "GATE",
    expectCodes: ["DESTRUCTIVE"],
    expectExitZero: true,
    expectDispatch: false,
    expectHumanGate: true,
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
  const packet = join(FIX, c.file);
  const proc = spawnSync(process.execPath, [TOOL, packet], {
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

  const exitOk = c.expectExitZero ? proc.status === 0 : proc.status !== 0;
  const decisionOk = result.decision === c.expectDecision;
  const codesOk = sameArray(result.reason_codes, c.expectCodes);
  const dispatchOk = result.cursor_dispatch_allowed === c.expectDispatch;
  const humanOk = result.human_gate_required === c.expectHumanGate;
  const schemaOk = result.schema === "execution-packet-policy-result-v1";
  const pass = exitOk && decisionOk && codesOk && dispatchOk && humanOk && schemaOk;

  return {
    name: c.name,
    pass,
    detail: pass
      ? "ok"
      : `expected decision=${c.expectDecision} codes=${JSON.stringify(c.expectCodes)} exitZero=${c.expectExitZero} dispatch=${c.expectDispatch} human=${c.expectHumanGate}; got decision=${result.decision} codes=${JSON.stringify(result.reason_codes)} exit=${proc.status} dispatch=${result.cursor_dispatch_allowed} human=${result.human_gate_required}`,
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
