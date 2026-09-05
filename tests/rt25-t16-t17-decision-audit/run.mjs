#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T16/T17 decision audit (planner + execution). */
import { readFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";
import { selectQuotaAwareExecutionRoute } from "../../tools/rt25-execution-quota-aware-selector-v1.mjs";
import { auditPlannerDecision, auditExecutionDecision, buildDecisionAuditRecord } from "../../tools/rt25-decision-audit-v1.mjs";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

function codexContribution(value, available = true) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z",
    producer_id: "rt25-quota-ingest-codex-v1",
    source: "dashboard_snapshot",
    produced_at: "2026-09-05T15:58:00.000Z",
    resources: {
      codex: {
        available,
        quota_remaining: { value, unit: "percent" },
        reset_at: "2026-09-05T19:00:00.000Z",
        cost_mode: "included",
        location: "cloud",
        updated_at: "2026-09-05T15:58:00.000Z",
        evidence: { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
      },
    },
  };
}

async function joinedFor(contributions, opts = {}) {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions }, { nowMs: NOW });
  return joinQuotaPoolState(composed, registry, { nowMs: NOW, ...opts });
}

// 1. planner audit record: chosen + rejected + pool evidence + sha256
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-route", resource_id: "codex", model: "codex-ide", select_rank: 1 },
    { route_id: "qwen-route", resource_id: "qwen_local", model: "qwen-local", select_rank: 30 },
    { route_id: "openai-api-route", resource_id: "codex", model: "gpt-x", select_rank: 0, forbidden: true },
  ], { nowMs: NOW });
  const tmp = mkdtempSync(resolve(tmpdir(), "rt25-t16-"));
  const { written, path, record } = auditPlannerDecision(d, resolve(tmp, "audit"), { nowMs: NOW });
  const line = JSON.parse(readFileSync(path, "utf8").trim());
  const sha = createHash("sha256").update(JSON.stringify(d)).digest("hex");
  check(
    "planner-audit-complete",
    written === true && record.write_classification === "AUDIT_RECORD_BUILT" &&
      line.audit_boundary === "planner" && line.decision.selected.route_id === "codex-route" &&
      line.decision.rejected_candidates.length === 1 &&
      line.decision.rejected_candidates[0].reason_codes.includes("FORBIDDEN_ROUTE") &&
      line.pool_freshness_evidence.chatgpt_codex_subscription.evaluation === "POOL_HEALTHY" &&
      line.pool_freshness_evidence.chatgpt_codex_subscription.freshness === "fresh" &&
      line.decision_canonical_sha256 === sha,
    JSON.stringify({ w: written, sel: line.decision?.selected?.route_id, rej: line.decision?.rejected_candidates?.length }),
  );
  rmSync(tmp, { recursive: true, force: true });
}

// 2. execution audit record boundary
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwareExecutionRoute(joined, [
    { route_id: "codex-exec", resource_id: "codex", model: "codex-ide", select_rank: 1 },
  ], { nowMs: NOW, execution_kind: "implementation", task_delta_id: "TD-AUDIT-1" });
  const tmp = mkdtempSync(resolve(tmpdir(), "rt25-t17-"));
  const { written, path, record } = auditExecutionDecision(d, resolve(tmp, "audit"), { nowMs: NOW });
  const line = JSON.parse(readFileSync(path, "utf8").trim());
  check(
    "execution-audit-complete",
    written === true && line.audit_boundary === "execution" &&
      line.decision.task_delta_id === "TD-AUDIT-1" &&
      line.decision.selected.route_id === "codex-exec" &&
      line.pool_freshness_evidence.chatgpt_codex_subscription.freshness === "fresh",
    JSON.stringify({ w: written }),
  );
  rmSync(tmp, { recursive: true, force: true });
}

// 3. determinism: same decision → identical sha; envelope invalid → not written
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwarePlannerRoute(joined, [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide" }], { nowMs: NOW });
  const r1 = buildDecisionAuditRecord(d, "planner", { nowMs: NOW });
  const r2 = buildDecisionAuditRecord(d, "planner", { nowMs: NOW });
  const bad = buildDecisionAuditRecord({ bogus: 1 }, "planner", { nowMs: NOW });
  const secret = buildDecisionAuditRecord({ schema_version: "x", decision_id: "s", api_key: "sk-ABCDEFGHIJKLMNOPQRSTUVW" }, "planner", { nowMs: NOW });
  check(
    "determinism+fail-closed",
    r1.decision_canonical_sha256 === r2.decision_canonical_sha256 &&
      bad.write_classification === "AUDIT_REJECTED_ENVELOPE_INVALID" &&
      secret.write_classification === "AUDIT_REJECTED_SECRET_LIKE",
    JSON.stringify({ bad: bad.write_classification, sec: secret.write_classification }),
  );
}

// 4. append-only JSONL: two audits → two lines
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwarePlannerRoute(joined, [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide" }], { nowMs: NOW });
  const tmp = mkdtempSync(resolve(tmpdir(), "rt25-t16b-"));
  const outDir = resolve(tmp, "audit");
  auditPlannerDecision(d, outDir, { nowMs: NOW });
  auditPlannerDecision(d, outDir, { nowMs: NOW });
  const lines = readFileSync(resolve(outDir, "planner-decisions-audit.jsonl"), "utf8").trim().split("\n");
  check("jsonl-append-two-lines", lines.length === 2 && existsSync(resolve(outDir, "planner-decisions-audit.jsonl")));
  rmSync(tmp, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
