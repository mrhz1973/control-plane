#!/usr/bin/env node
/**
 * D-0017-W — local fixture runner for execution-packet-v1 validator.
 * No network. No package install.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const VALIDATOR = join(ROOT, "tools/validate-execution-packet-v1.mjs");
const FIX = join(HERE, "fixtures");

const CASES = [
  {
    name: "valid-packet",
    file: "valid-packet.json",
    expectOk: true,
    expectClassification: "PASS",
  },
  {
    name: "missing-required",
    file: "invalid-missing-required.json",
    expectOk: false,
    expectClassification: "MISSING_REQUIRED_FIELD",
  },
  {
    name: "invalid-enum",
    file: "invalid-enum.json",
    expectOk: false,
    expectClassification: "INVALID_ENUM",
  },
  {
    name: "invalid-schema-version",
    file: "invalid-schema-version.json",
    expectOk: false,
    expectClassification: "INVALID_SCHEMA_VERSION",
  },
  {
    name: "additional-property",
    file: "invalid-additional-property.json",
    expectOk: false,
    expectClassification: "ADDITIONAL_PROPERTY",
  },
];

function runCase(c) {
  const packet = join(FIX, c.file);
  const proc = spawnSync(process.execPath, [VALIDATOR, packet], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const stdout = (proc.stdout || "").trim();
  let result;
  try {
    result = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).pop());
  } catch (err) {
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
