#!/usr/bin/env node
/** Focused suite — V4_CANONICAL_REVIEW_STAGE_ARCHITECTURE_AND_BOUNDARY_V1. */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { runReviewStage, buildReviewerCandidates, REVIEW_STAGE_RESULT_SCHEMA } from "../../tools/run-review-stage-v1.mjs";
import { buildReviewerBoundaryState } from "../../tools/rt25-canonical-quota-state-v1.mjs";
import { selectQuotaAwareReviewerRoute, REVIEWER_DECISION_SCHEMA } from "../../tools/rt25-reviewer-quota-aware-selector-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T23:30:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 260) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));

function contribution(resourceId, value, extra = {}) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `c-${resourceId}-${Math.random().toString(36).slice(2, 8)}`,
    producer_id: "review-stage-tests",
    source: extra.source || "dashboard_snapshot",
    produced_at: "2026-09-05T23:28:00.000Z",
    resources: {
      [resourceId]: {
        available: value !== 0,
        quota_remaining: { value, unit: extra.unit || "percent" },
        reset_at: "2026-09-06T04:00:00.000Z",
        cost_mode: extra.cost_mode || "included",
        location: extra.location || "cloud",
        updated_at: "2026-09-05T23:28:00.000Z",
        evidence: extra.source === "local_probe"
          ? { kind: "qwen_occupancy", classification: "QWEN_READY_IDLE", launch_performed: false, generation_calls: 0 }
          : { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
      },
    },
  };
}
const qwenReady = () => contribution("qwen_local", null, { source: "local_probe", unit: "unlimited", location: "local", cost_mode: "free" });
const implResult = (over = {}) => ({
  schema_version: "local-dev-execution-result-v1",
  task_ref: "LOCAL_DEV_B_D-TEST-1",
  status: "PASS",
  classification: "PASS",
  actor: "local-dev-executor-v1",
  profile_id: "qwen38-opus-q3-opencode-24k",
  reason_codes: ["PASS"],
  ...over,
});

// A. boundary composes FRESH canonical quota state at review time
{
  const r = await runReviewStage(implResult(), {
    implementerModel: "qwen38-opus-q3-opencode-24k",
    quotaStateOptions: { contributions: [contribution("codex", 62), contribution("glm", 55)], nowMs: NOW },
  });
  check(
    "A-boundary-composes-fresh-canonical-state",
    r.schema_version === REVIEW_STAGE_RESULT_SCHEMA &&
      r.quota_provenance?.schema_version === "v4-rt25-quota-state-join-v1" &&
      r.quota_provenance?.joined_at === new Date(NOW).toISOString() &&
      r.quota_provenance?.source_paths?.registry?.includes("registry.json") &&
      r.quota_provenance?.composition_reason_codes?.includes("CANONICAL_QUOTA_STATE_COMPOSED"),
    JSON.stringify({ p: r.quota_provenance?.composition_reason_codes, j: r.quota_provenance?.joined_at }),
  );
  check("A2-review-required-and-implementer-known",
    r.review_required === true && r.implementer_model === "qwen38-opus-q3-opencode-24k" && r.implementer_reference === "LOCAL_DEV_B_D-TEST-1",
    JSON.stringify({ req: r.review_required, im: r.implementer_model, ref: r.implementer_reference }));
}

// B. boundary invokes the REAL reviewer selector (decision envelope embedded)
{
  const r = await runReviewStage(implResult(), {
    quotaStateOptions: { contributions: [contribution("codex", 62)], nowMs: NOW },
  });
  check(
    "B-real-selector-invoked",
    r.decision?.schema_version === REVIEWER_DECISION_SCHEMA && r.decision?.decision_role === "reviewer" &&
      (r.reviewer_selection_status === "REVIEWER_SELECTED" || r.reviewer_selection_status === "NO_ROUTE_SELECTED"),
    JSON.stringify({ d: r.decision?.schema_version, s: r.reviewer_selection_status }),
  );
  // direct parity: same inputs through the raw selector produce the same decision
  const bs = await buildReviewerBoundaryState({ contributions: [contribution("codex", 62)], nowMs: NOW });
  const cand = buildReviewerCandidates(registry);
  const direct = selectQuotaAwareReviewerRoute(bs.canonical.joined, cand.candidates, { nowMs: NOW });
  check("B2-parity-with-raw-selector", JSON.stringify(direct.selected) === JSON.stringify(r.decision?.selected),
    JSON.stringify({ raw: direct.selected?.route_id, via: r.decision?.selected?.route_id }));
  check("B3-candidates-derived-from-registry-reviewer-roles",
    cand.ok === true && cand.candidates.every((c) => registry.models[c.model === "codex-ide" ? "codex_subscription_models" : c.model === "qwen-local" ? "qwen_local" : c.model]?.roles?.includes("reviewer")) &&
      cand.candidates.some((c) => c.model === "codex-ide" && c.resource_id === "codex") && cand.candidates.some((c) => c.model === "qwen-local" && c.resource_id === "qwen_local") &&
      !cand.candidates.some((c) => c.access_surface === "openai_api_route") &&
      !cand.candidates.some((c) => c.model === "glm-5.3"), // glm has NO reviewer role in the registry
    JSON.stringify(cand.candidates.map((c) => `${c.model}@${c.resource_id}`)));
}

// C. implementer/reviewer independence preference preserved. Registry truth:
// only codex (chatgpt-subscription surfaces) and qwen_local carry the reviewer
// role. With implementer = "qwen-local" and BOTH candidates admitted, the
// selector must prefer the INDEPENDENT codex reviewer; the same-model qwen
// candidate is demoted with the explicit code. (glm is not a reviewer in the
// registry, so the historical T18 glm fixture is not reproducible here.)
{
  const r = await runReviewStage(implResult(), {
    implementerModel: "qwen-local",
    quotaStateOptions: { contributions: [contribution("codex", 62), qwenReady()], nowMs: NOW },
  });
  check(
    "C-independence-preference-preserved",
    r.reviewer_selection_status === "REVIEWER_SELECTED" &&
      r.decision.reason_codes.includes("REVIEWER_INDEPENDENT_OF_IMPLEMENTER") &&
      r.selected_reviewer?.model === "codex-ide" && r.selected_reviewer?.access_surface === "codex_external_planner" &&
      r.decision.rejected_candidates.some((x) => x.reason_codes.includes("REVIEWER_INDEPENDENCE_PREFERENCE_SAME_MODEL_DEMOTED")),
    JSON.stringify({ s: r.selected_reviewer?.model, rc: r.decision?.reason_codes, rej: r.decision?.rejected_candidates?.flatMap((x) => x.reason_codes) }),
  );
  // C2: the inverse population — implementer codex-ide, only codex admitted →
  // same-model-only is EXPLICIT, never silently hidden (selector law).
  const r2 = await runReviewStage(implResult(), {
    implementerModel: "codex-ide",
    quotaStateOptions: { contributions: [contribution("codex", 62)], nowMs: NOW },
  });
  check("C2-same-model-only-explicit",
    r2.reviewer_selection_status === "REVIEWER_SELECTED" &&
      r2.decision.reason_codes.includes("REVIEWER_SAME_MODEL_AS_IMPLEMENTER_ONLY_ADMITTED") &&
      r2.selected_reviewer?.model === "codex-ide",
    JSON.stringify(r2.decision?.reason_codes));
}

// D. commercial reviewer with missing/stale quota -> fail-closed rejection
{
  const stale = contribution("codex", 62);
  stale.produced_at = "2026-09-05T21:00:00.000Z";
  stale.resources.codex.updated_at = "2026-09-05T21:00:00.000Z";
  const r = await runReviewStage(implResult(), {
    quotaStateOptions: { contributions: [stale], nowMs: NOW },
  });
  check(
    "D-commercial-stale-fail-closed",
    r.reviewer_selection_status === "NO_ROUTE_SELECTED" &&
      r.decision.rejected_candidates.some((x) => x.reason_codes.includes("CONSERVE_UNKNOWN_STALE")) &&
      r.selected_reviewer === null &&
      r.quota_provenance?.pools?.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_STALE",
    JSON.stringify({ s: r.reviewer_selection_status, pools: r.quota_provenance?.pools?.chatgpt_codex_subscription?.evaluation, rej: r.decision?.rejected_candidates?.flatMap((x) => x.reason_codes) }),
  );
  // missing quota entirely (empty ingest lane) also fails closed
  const r2 = await runReviewStage(implResult(), { quotaStateOptions: { contributions: [], nowMs: NOW } });
  check("D2-missing-quota-fail-closed",
    r2.reviewer_selection_status === "NO_ROUTE_SELECTED" && r2.selected_reviewer === null,
    JSON.stringify(r2.reviewer_selection_status));
}

// E. adequate local reviewer survives when commercial reviewer is blocked
{
  const staleGlm = contribution("glm", 55);
  staleGlm.produced_at = "2026-09-05T21:00:00.000Z";
  staleGlm.resources.glm.updated_at = "2026-09-05T21:00:00.000Z";
  const r = await runReviewStage(implResult(), {
    implementerModel: "codex-ide",
    quotaStateOptions: { contributions: [staleGlm, qwenReady()], nowMs: NOW },
  });
  check(
    "E-local-reviewer-survives-commercial-blocked",
    r.reviewer_selection_status === "REVIEWER_SELECTED" &&
      r.selected_reviewer?.model === "qwen-local" && r.selected_reviewer?.quota_pool_id === null &&
      r.selected_reviewer?.resource_id === "qwen_local" &&
      r.decision.reason_codes.includes("REVIEWER_INDEPENDENT_OF_IMPLEMENTER") &&
      r.quota_provenance?.pools?.glm_coding_plan?.evaluation === "CONSERVE_UNKNOWN_STALE",
    JSON.stringify({ s: r.selected_reviewer?.model, rc: r.decision?.reason_codes }),
  );
}

// F. no reviewer inference/execution occurs — execution_performed always false, no model calls
{
  const r = await runReviewStage(implResult(), {
    quotaStateOptions: { contributions: [contribution("codex", 62), contribution("glm", 55), qwenReady()], nowMs: NOW },
  });
  check(
    "F-no-inference-no-execution",
    r.execution_performed === false && r.selected_reviewer !== null &&
      Object.keys(r).includes("decision") && !JSON.stringify(r).includes("generation_calls_actual"),
    JSON.stringify({ ep: r.execution_performed, s: r.selected_reviewer?.model }),
  );
}

// G. malformed/invalid boundary input fails closed
{
  const r1 = await runReviewStage(null, {});
  const r2 = await runReviewStage([1, 2], {});
  const r3 = await runReviewStage({ schema_version: "something-else-v9", task_ref: "X" }, {});
  const r4 = await runReviewStage({ schema_version: "local-dev-execution-result-v1", status: 42 }, {});
  check(
    "G-malformed-input-fails-closed",
    r1.reviewer_selection_status === "INPUT_INVALID" && r2.reviewer_selection_status === "INPUT_INVALID" &&
      r3.reviewer_selection_status === "INPUT_INVALID" && r4.reviewer_selection_status === "INPUT_INVALID" &&
      [r1, r2, r3, r4].every((x) => x.selected_reviewer === null && x.execution_performed === false && x.review_required === false),
    JSON.stringify([r1, r2, r3, r4].map((x) => x.reviewer_selection_status)),
  );
  // composition failure also fails closed
  const r5 = await runReviewStage(implResult(), {
    buildState: async () => { throw new Error("boom"); },
  });
  check("G2-composition-failure-fails-closed",
    r5.reviewer_selection_status === "QUOTA_STATE_COMPOSITION_FAILED" && r5.selected_reviewer === null && r5.review_required === true,
    JSON.stringify(r5.reviewer_selection_status));
}

// H. exact caller proof: local-dev runner CLI attaches review_stage to the
// implementation result (implementation result -> review-stage boundary).
{
  const tmp = mkdtempSync(join(tmpdir(), "review-stage-caller-"));
  const inFile = join(tmp, "envelope.json");
  const outFile = join(tmp, "out.json");
  // Minimal envelope that reaches a deterministic offline executor result:
  // invalid profile_id => STOP:<classification> BEFORE any live phase, then the
  // runner still attaches the review-stage boundary (post-implementation path).
  writeFileSync(inFile, JSON.stringify({
    schema_version: "local-dev-execution-envelope-v1",
    task_ref: "LOCAL_DEV_B_D-REVIEW-CALLER-PROOF",
    repo: "mrhz1973/control-plane",
    target_repo_path: ROOT,
    profile_id: "nonexistent-profile-zzz",
    allowed_paths: ["tools/", "tests/", "docs/"],
    test_command: null,
    max_agent_turns: 1,
    max_test_cycles: 0,
    timebox_seconds: 10,
    git_persistence_required: false,
  }), "utf8");
  const proc = spawnSync(process.execPath, [resolve(ROOT, "tools/run-local-dev-executor-v1.mjs"), "--input-file", inFile, "--output-file", outFile], {
    cwd: ROOT, encoding: "utf8", timeout: 120_000,
  });
  let out = null;
  try { out = JSON.parse(proc.stdout); } catch { out = null; }
  check(
    "H-caller-proof-runner-attaches-review-stage",
    out !== null &&
      out.schema_version === "local-dev-execution-result-v1" &&
      String(out.classification || "").startsWith("STOP:") === true &&
      out.review_stage?.schema_version === REVIEW_STAGE_RESULT_SCHEMA &&
      out.review_stage?.implementer_reference === "LOCAL_DEV_B_D-REVIEW-CALLER-PROOF" &&
      (out.review_stage?.reviewer_selection_status === "REVIEWER_SELECTED" ||
        out.review_stage?.reviewer_selection_status === "NO_ROUTE_SELECTED" ||
        out.review_stage?.reviewer_selection_status === "QUOTA_STATE_COMPOSITION_FAILED") &&
      out.review_stage?.execution_performed === false,
    JSON.stringify({ cls: out?.classification, rs: out?.review_stage?.reviewer_selection_status, ep: out?.review_stage?.execution_performed, stdout: (proc.stdout || "").slice(0, 120) }),
  );
  // exit code semantics unchanged: STOP => exit 1
  check("H2-runner-exit-semantics-unchanged", proc.status === 1, JSON.stringify(proc.status));
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
