#!/usr/bin/env node
/**
 * PM-55 — OpenClaw bridge artifact adapter (dry-run; local JSON only).
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ADAPTER_SCHEMA = "pm54.openclaw.adapter.v1";
const SOURCE_ARTIFACT_SCHEMA = "pm52.openclaw.bridge.v1";
const NEXT_GATE = "pm-56-adapter-contract-review";

const VALIDATOR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "validate-openclaw-bridge-artifact.mjs"
);

function readJson(path) {
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(text);
}

function validateViaValidatorCli(inputPath) {
  const result = spawnSync(process.execPath, [VALIDATOR, inputPath], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.error) {
    return {
      valid: false,
      errors: [result.error.message],
      warnings: [],
    };
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return {
      valid: false,
      errors: ["validator produced non-JSON output"],
      warnings: [],
    };
  }
}

function mapDecisionRelevance(classification) {
  switch (classification) {
    case "pass":
      return "operator_review";
    case "partial":
      return "future_gate_candidate";
    default:
      return "none";
  }
}

function buildEvidenceRefs(artifact) {
  const runId = artifact.run_id ?? "unknown";
  if (!Array.isArray(artifact.evidence)) return [];
  return artifact.evidence.map((_, i) => `${runId}:evidence:${i}`);
}

export function adaptArtifact(obj, validation) {
  if (!validation.valid) {
    return {
      adapted: false,
      adapter_schema: null,
      source_artifact_schema: null,
      adapter_run_id: null,
      created_at: null,
      classification: null,
      normalized_summary: null,
      decision_relevance: null,
      evidence_refs: [],
      safety: {
        secret_scan: "fail",
        forbidden_touched: true,
        raw_output_included: false,
        n8n_ready: false,
      },
      next_gate: "stop",
      errors: validation.errors ?? [],
      warnings: validation.warnings ?? [],
    };
  }

  const classification = obj.classification;

  return {
    adapted: true,
    adapter_schema: ADAPTER_SCHEMA,
    source_artifact_schema: SOURCE_ARTIFACT_SCHEMA,
    adapter_run_id: `adapter-${obj.run_id}`,
    created_at: obj.created_at,
    classification,
    normalized_summary: obj.summary,
    decision_relevance: mapDecisionRelevance(classification),
    evidence_refs: buildEvidenceRefs(obj),
    safety: {
      secret_scan: "pass",
      forbidden_touched: false,
      raw_output_included: false,
      n8n_ready: false,
    },
    next_gate: NEXT_GATE,
    errors: [],
    warnings: validation.warnings ?? [],
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.log(
      JSON.stringify(
        { adapted: false, errors: ["missing file path argument"], warnings: [] },
        null,
        2
      )
    );
    process.exit(1);
  }

  const resolved = resolve(process.cwd(), inputPath);
  let obj;
  try {
    obj = readJson(resolved);
  } catch (err) {
    console.log(
      JSON.stringify(
        {
          adapted: false,
          errors: [`failed to read or parse JSON: ${err.message}`],
          warnings: [],
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const validation = validateViaValidatorCli(inputPath);
  const result = adaptArtifact(obj, validation);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.adapted ? 0 : 1);
}

main();
