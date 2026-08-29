#!/usr/bin/env node
/**
 * V4 — local fixture runner for resource-registry-v1 validator.
 * Offline only. No network. No Ollama. No package install.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const VALIDATOR = join(ROOT, "tools/validate-resource-registry-v1.mjs");
const FIX = join(HERE, "fixtures");
const CANONICAL = join(ROOT, "configs/resources/registry.json");

const CASES = [
  {
    name: "canonical-registry-validates",
    absFile: CANONICAL,
    expectOk: true,
    expectClassification: "PASS",
  },
  {
    name: "unknown-resource-type",
    file: "invalid-resource-type.json",
    expectOk: false,
    expectClassification: "INVALID_ENUM",
  },
  {
    name: "unknown-role",
    file: "invalid-role.json",
    expectOk: false,
    expectClassification: "INVALID_ENUM",
  },
  {
    name: "duplicate-capability",
    file: "invalid-duplicate-capability.json",
    expectOk: false,
    expectClassification: "DUPLICATE_ITEMS",
  },
  {
    name: "unknown-compatible-resource",
    file: "invalid-unknown-compatible.json",
    expectOk: false,
    expectClassification: "UNKNOWN_COMPATIBLE_RESOURCE",
  },
  {
    name: "self-compatible-reference",
    file: "invalid-self-compatible.json",
    expectOk: false,
    expectClassification: "SELF_COMPATIBLE_REFERENCE",
  },
];

function runCase(c) {
  const registry = c.absFile || join(FIX, c.file);
  const proc = spawnSync(process.execPath, [VALIDATOR, registry], {
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

function checkQwenLogicalNoHardcodedModel() {
  const text = readFileSync(CANONICAL, "utf8");
  const registry = JSON.parse(text);
  const qwen = registry.resources && registry.resources.qwen_local;
  const hasQwen = qwen && typeof qwen === "object";
  const forbidden = /qwen3\s*:|qwen3:14b|OLLAMA_MODEL/i.test(text);
  const hasConcreteModelField =
    hasQwen &&
    Object.prototype.hasOwnProperty.call(qwen, "ollama_model");
  const pass = hasQwen && !forbidden && !hasConcreteModelField;
  return {
    name: "qwen-local-logical-no-hardcoded-ollama-model",
    pass,
    detail: pass
      ? "ok"
      : `qwen_local present=${hasQwen} forbidden_token=${forbidden} ollama_model_field=${hasConcreteModelField}`,
  };
}

const results = [...CASES.map(runCase), checkQwenLogicalNoHardcodedModel()];
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
