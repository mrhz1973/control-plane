#!/usr/bin/env node
/**
 * V4 — local fixture runner for resource-status-v1 validator.
 * Offline only. No network. No package install.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const VALIDATOR = join(ROOT, "tools/validate-resource-status-v1.mjs");
const FIX = join(HERE, "fixtures");
const FAIL_CLOSED = join(ROOT, "configs/resources/status.fail-closed.json");

const CASES = [
  {
    name: "fail-closed-validates",
    absFile: FAIL_CLOSED,
    expectOk: true,
    expectClassification: "PASS",
  },
  {
    name: "missing-required-field",
    file: "invalid-missing-required.json",
    expectOk: false,
    expectClassification: "MISSING_REQUIRED_FIELD",
  },
  {
    name: "invalid-quota-unit",
    file: "invalid-quota-unit.json",
    expectOk: false,
    expectClassification: "INVALID_ENUM",
  },
  {
    name: "invalid-reset-at",
    file: "invalid-reset-at.json",
    expectOk: false,
    expectClassification: "INVALID_FORMAT",
  },
  {
    name: "unlimited-quota-null-value",
    file: "valid-unlimited-quota.json",
    expectOk: true,
    expectClassification: "PASS",
  },
  {
    name: "unknown-quota-reset-representable",
    file: "valid-unknown-quota.json",
    expectOk: true,
    expectClassification: "PASS",
  },
];

function runCase(c) {
  const status = c.absFile || join(FIX, c.file);
  const proc = spawnSync(process.execPath, [VALIDATOR, status], {
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
      detail: `non-JSON stdout: ${stdout.slice(0, 400)} / stderr=${(proc.stderr || "").slice(0, 400)}`,
    };
  }
  const exitOk = c.expectOk ? proc.status === 0 : proc.status !== 0;
  const classOk = result.classification === c.expectClassification;
  const okFlag = result.ok === c.expectOk;
  const pass = exitOk && classOk && okFlag;
  return {
    name: c.name,
    pass,
    detail: pass
      ? "ok"
      : `expected ok=${c.expectOk} classification=${c.expectClassification} exit ${c.expectOk ? 0 : "non-zero"}; got ok=${result.ok} classification=${result.classification} exit=${proc.status} reason=${result.reason}`,
    result,
    exit: proc.status,
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
