#!/usr/bin/env node
/**
 * D-0025-W — offline tests for backlog-primary-remote-adapter-v1 helper.
 * Zero network / provider / inference.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const TOOL = join(ROOT, "tools/build-primary-remote-cycle-input-from-backlog.mjs");
const FIX = join(HERE, "fixtures");
const CANONICAL_GATE = join(ROOT, "configs/planner/primary-remote-runtime-gate.json");
const PATCH = join(
  ROOT,
  "workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json",
);

const REPO = "mrhz1973/control-plane";
const COMMIT = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const PATH_GLM = "docs/runtime/BACKLOG_D0025_T_GLM.md";
const PATH_CODEX = "docs/runtime/BACKLOG_D0025_T_CODEX.md";

function b64(s) {
  return Buffer.from(String(s), "utf8").toString("base64");
}

function hasSecretLeak(blob) {
  return (
    /bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob) ||
    /"authorization"\s*:\s*"/i.test(blob) ||
    /sk-[A-Za-z0-9]{10,}/.test(blob) ||
    /"access_token"\s*:/i.test(blob) ||
    /"refresh_token"\s*:/i.test(blob)
  );
}

function runHelper({ markdownFile, gatePath, repo = REPO, path = PATH_GLM, commit = COMMIT }) {
  const md = readFileSync(join(FIX, markdownFile), "utf8");
  const args = [
    TOOL,
    "--repo-b64",
    b64(repo),
    "--commit-b64",
    b64(commit),
    "--path-b64",
    b64(path),
    "--markdown-b64",
    b64(md),
    "--gate",
    gatePath,
  ];
  const proc = spawnSync(process.execPath, args, {
    encoding: "utf8",
    cwd: ROOT,
    env: process.env,
  });
  const stdout = (proc.stdout || "").trim();
  let result = null;
  try {
    result = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).pop());
  } catch {
    result = null;
  }
  return { proc, result, stdout, stderr: proc.stderr || "" };
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ""}`);
}

// --- canonical gate unchanged ---
{
  const gate = JSON.parse(readFileSync(CANONICAL_GATE, "utf8"));
  check(
    "canonical-gate-unchanged",
    gate.schema === "primary-remote-runtime-gate-v1" &&
      gate.enabled === false &&
      gate.provider_calls_authorized_per_event === 0,
    JSON.stringify({
      enabled: gate.enabled,
      calls: gate.provider_calls_authorized_per_event,
    }),
  );
}

// --- patch offline validation ---
{
  let patchOk = false;
  let detail = "";
  try {
    const patch = JSON.parse(readFileSync(PATCH, "utf8"));
    patchOk =
      patch.schema === "control-plane-gpt-web-n8n-delta-v1" &&
      patch.helper_ref === "tools/build-primary-remote-cycle-input-from-backlog.mjs" &&
      patch.contract_ref === "docs/contracts/backlog-primary-remote-adapter-v1.md" &&
      patch.runtime_gate_ref === "configs/planner/primary-remote-runtime-gate.json" &&
      patch.preconditions?.runtime_gate_must_equal?.enabled === false &&
      patch.preconditions?.runtime_gate_must_equal?.provider_calls_authorized_per_event === 0 &&
      Array.isArray(patch.operations) &&
      patch.operations.length > 0;
    detail = `ops=${patch.operations.length}`;
  } catch (err) {
    detail = String(err.message || err);
  }
  check("gpt-web-patch-json-parse", patchOk, detail);
}

// 1. valid GLM + gate disabled
{
  const { proc, result, stdout } = runHelper({
    markdownFile: "valid-glm.md",
    gatePath: CANONICAL_GATE,
    path: PATH_GLM,
  });
  const ok =
    proc.status === 0 &&
    result?.ok === true &&
    result?.dispatch_allowed === false &&
    result?.classification === "REMOTE_PLANNER_GATE_CLOSED" &&
    result?.consumer_input?.planner_requested === "glm" &&
    result?.routing_input?.preferred === "glm" &&
    result?.routing_input?.fallback?.length === 0 &&
    result?.routing_input?.fallback_policy === "gate_only" &&
    result?.consumer_input?.task_id === "D-0025-T-GLM" &&
    result?.consumer_input?.source_backlog_commit === COMMIT &&
    result?.consumer_input?.validation_seed?.length === 0 &&
    !hasSecretLeak(stdout);
  check("01-valid-glm-gate-disabled", ok, result?.classification);
}

// 2. valid Codex + gate disabled
{
  const { proc, result } = runHelper({
    markdownFile: "valid-codex.md",
    gatePath: CANONICAL_GATE,
    path: PATH_CODEX,
  });
  const ok =
    proc.status === 0 &&
    result?.ok === true &&
    result?.dispatch_allowed === false &&
    result?.classification === "REMOTE_PLANNER_GATE_CLOSED" &&
    result?.consumer_input?.planner_requested === "codex" &&
    result?.routing_input?.preferred === "codex";
  check("02-valid-codex-gate-disabled", ok, result?.classification);
}

// 3. gate enabled + GLM healthy → REMOTE_DISPATCH_READY (no HTTP)
{
  const { proc, result } = runHelper({
    markdownFile: "valid-glm.md",
    gatePath: join(FIX, "gate-enabled-glm-healthy.json"),
    path: PATH_GLM,
  });
  const ok =
    proc.status === 0 &&
    result?.ok === true &&
    result?.dispatch_allowed === true &&
    result?.classification === "REMOTE_DISPATCH_READY" &&
    result?.consumer_input?.planner_requested === "glm" &&
    result?.routing_input?.preferred === "glm" &&
    result?.routing_input?.provider_state?.glm?.available === true &&
    result?.routing_input?.provider_state?.glm?.quota_state === "healthy" &&
    result?.consumer_input?.task_id === result?.routing_input?.task_id;
  check("03-gate-enabled-glm-dispatch-ready", ok, result?.classification);
}

// 4. gate enabled + Codex healthy
{
  const { proc, result } = runHelper({
    markdownFile: "valid-codex.md",
    gatePath: join(FIX, "gate-enabled-codex-healthy.json"),
    path: PATH_CODEX,
  });
  const ok =
    proc.status === 0 &&
    result?.dispatch_allowed === true &&
    result?.classification === "REMOTE_DISPATCH_READY" &&
    result?.routing_input?.preferred === "codex";
  check("04-gate-enabled-codex-dispatch-ready", ok, result?.classification);
}

// 5. preferred Qwen → reject
{
  const { proc, result } = runHelper({
    markdownFile: "qwen-preferred.md",
    gatePath: CANONICAL_GATE,
  });
  const ok =
    proc.status !== 0 &&
    result?.dispatch_allowed === false &&
    result?.classification === "QWEN_DEFERRED";
  check("05-qwen-preferred-reject", ok, result?.classification);
}

// 6. non-empty fallback → reject
{
  const { proc, result } = runHelper({
    markdownFile: "nonempty-fallback.md",
    gatePath: CANONICAL_GATE,
  });
  const ok =
    proc.status !== 0 &&
    result?.classification === "PLANNER_FALLBACK_FORBIDDEN";
  check("06-nonempty-fallback-reject", ok, result?.classification);
}

// 7. non-gate_only policy → reject
{
  const { proc, result } = runHelper({
    markdownFile: "bad-fallback-policy.md",
    gatePath: CANONICAL_GATE,
  });
  const ok =
    proc.status !== 0 &&
    result?.classification === "FALLBACK_POLICY_INVALID";
  check("07-bad-fallback-policy-reject", ok, result?.classification);
}

// 8. state not READY_FOR_PLANNING → no dispatch
{
  const { proc, result } = runHelper({
    markdownFile: "state-draft.md",
    gatePath: join(FIX, "gate-enabled-glm-healthy.json"),
  });
  const ok =
    proc.status !== 0 &&
    result?.dispatch_allowed === false &&
    result?.classification === "BACKLOG_STATE_NOT_READY";
  check("08-state-not-ready", ok, result?.classification);
}

// 9. repository mismatch → reject
{
  const { proc, result } = runHelper({
    markdownFile: "repo-mismatch.md",
    gatePath: CANONICAL_GATE,
  });
  const ok =
    proc.status !== 0 &&
    result?.classification === "BACKLOG_REPOSITORY_MISMATCH";
  check("09-repo-mismatch", ok, result?.classification);
}

// 10. malformed YAML → reject
{
  const { proc, result } = runHelper({
    markdownFile: "malformed-yaml.md",
    gatePath: CANONICAL_GATE,
  });
  const ok =
    proc.status !== 0 &&
    (result?.classification === "BACKLOG_YAML_MALFORMED" ||
      result?.classification === "BACKLOG_FIELD_MISSING");
  check("10-malformed-yaml", ok, result?.classification);
}

// 11. missing required field → reject
{
  const { proc, result } = runHelper({
    markdownFile: "missing-objective.md",
    gatePath: CANONICAL_GATE,
  });
  const ok =
    proc.status !== 0 &&
    result?.classification === "BACKLOG_FIELD_MISSING";
  check("11-missing-required-field", ok, result?.classification);
}

// 12. legacy without schema → unsupported
{
  const { proc, result } = runHelper({
    markdownFile: "legacy-no-schema.md",
    gatePath: CANONICAL_GATE,
  });
  const ok =
    proc.status !== 0 &&
    result?.classification === "BACKLOG_CONTRACT_UNSUPPORTED" &&
    result?.dispatch_allowed === false;
  check("12-legacy-no-schema", ok, result?.classification);
}

// 13. provider state unknown/unavailable → no dispatch (even if enabled)
{
  const { proc, result } = runHelper({
    markdownFile: "valid-codex.md",
    gatePath: join(FIX, "gate-enabled-provider-unknown.json"),
    path: PATH_CODEX,
  });
  const ok =
    proc.status === 0 &&
    result?.ok === true &&
    result?.dispatch_allowed === false &&
    result?.classification === "REMOTE_PLANNER_GATE_CLOSED";
  check("13-provider-unknown-no-dispatch", ok, result?.classification);
}

// 14. task/preferred mismatch cannot be emitted (invariant via mapping)
{
  const { result } = runHelper({
    markdownFile: "valid-glm.md",
    gatePath: join(FIX, "gate-enabled-glm-healthy.json"),
    path: PATH_GLM,
  });
  const ok =
    result?.consumer_input?.task_id === result?.routing_input?.task_id &&
    result?.consumer_input?.planner_requested === result?.routing_input?.preferred &&
    result?.consumer_input?.risk_hint === result?.routing_input?.risk_hint;
  check("14-task-preferred-consistent", ok);
}

// 15. no secret-like material in helper outputs / fixtures
{
  const blobs = [
    readFileSync(TOOL, "utf8"),
    readFileSync(CANONICAL_GATE, "utf8"),
    readFileSync(join(FIX, "valid-glm.md"), "utf8"),
    readFileSync(join(FIX, "gate-enabled-glm-healthy.json"), "utf8"),
  ];
  const ok = blobs.every((b) => !hasSecretLeak(b));
  check("15-no-secret-like-material", ok);
}

// helper file exists and is importable without install
{
  check(
    "helper-exists-no-package-json-dep",
    existsSync(TOOL) && !existsSync(join(ROOT, "package.json")),
  );
}

const failed = results.filter((r) => !r.ok);
console.log(
  JSON.stringify({
    ok: failed.length === 0,
    classification: failed.length === 0 ? "PASS" : "FAIL",
    passed: results.filter((r) => r.ok).length,
    failed: failed.length,
    total: results.length,
    network_access: false,
    provider_model_request_count: 0,
    credential_access: 0,
    failed_names: failed.map((f) => f.name),
  }),
);
process.exit(failed.length === 0 ? 0 : 1);
