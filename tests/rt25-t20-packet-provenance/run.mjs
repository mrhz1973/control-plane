#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T20 Execution Packet route/quota provenance. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";
import { buildRouteQuotaProvenance, attachProvenanceToPacket, readProvenanceFromPacket } from "../../tools/rt25-route-quota-provenance-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

function codexContribution(value) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z",
    producer_id: "rt25-quota-ingest-codex-v1",
    source: "dashboard_snapshot",
    produced_at: "2026-09-05T15:58:00.000Z",
    resources: {
      codex: {
        available: true,
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

async function selectedDecision() {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [codexContribution(62)] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
  return selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-route", resource_id: "codex", model: "codex-ide", access_surface: "codex_ide_cursor_extension", select_rank: 1 },
  ], { nowMs: NOW, decision_id: "planner-test-1" });
}

// Minimal real packet shape (schema execution-packet-v1 required fields subset for attach law)
function packetFixture() {
  return JSON.parse(readFileSync(resolve(ROOT, "reports/runtime/dev-queue/dispatch1.run.json"), "utf8"))?.packet || null;
}

// 1. provenance built from real selected decision
{
  const d = await selectedDecision();
  const p = buildRouteQuotaProvenance(d, { nowMs: NOW });
  check(
    "provenance-present",
    p.present === true && p.selected_route === "codex-route" && p.model === "codex-ide" &&
      p.quota_pool_id === "chatgpt_codex_subscription" && p.pool_evidence.evaluation === "POOL_HEALTHY" &&
      p.decision_ref === "planner-test-1" &&
      typeof p.authorization_note === "string" && p.authorization_note.includes("D-0025"),
    JSON.stringify({ pres: p.present, pool: p.quota_pool_id }),
  );
}

// 2. attach to packet does not mutate input; authorization fields byte-equal
{
  const packet = {
    schema: "execution-packet-v1",
    packet_id: "PKT-T20",
    hard_constraints: ["D-0025 enabled=false", "no OpenAI API/BYOK"],
    status: "GATED",
  };
  const d = await selectedDecision();
  const p = buildRouteQuotaProvenance(d, { nowMs: NOW });
  const before = JSON.stringify(packet);
  const r = attachProvenanceToPacket(packet, p);
  check(
    "attach-non-mutating",
    r.attached === true && r.packet.route_quota_provenance.present === true &&
      JSON.stringify(packet) === before &&
      r.packet.hard_constraints[0] === "D-0025 enabled=false" && r.packet.status === "GATED",
    JSON.stringify({ att: r.attached }),
  );
}

// 3. blocked decision → provenance_absent with reason codes (never fake provenance)
{
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
  const d = selectQuotaAwarePlannerRoute(joined, [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide" }], { nowMs: NOW });
  const p = buildRouteQuotaProvenance(d, { nowMs: NOW });
  check(
    "blocked-absent-provenance",
    p.present === false && p.absence_reason === "NO_ROUTE_SELECTED" && Array.isArray(p.blocked_reason_codes),
    JSON.stringify(p.absence_reason),
  );
}

// 4. read back from packet (Windows endpoint view)
{
  const packet = { schema: "execution-packet-v1", packet_id: "PKT-T20B" };
  const d = await selectedDecision();
  const p = buildRouteQuotaProvenance(d, { nowMs: NOW });
  const r = attachProvenanceToPacket(packet, p);
  const back = readProvenanceFromPacket(r.packet);
  check(
    "roundtrip-read",
    back.valid === true && back.present === true && back.provenance.selected_route === "codex-route",
    JSON.stringify(back),
  );
  const absent = readProvenanceFromPacket({ schema: "execution-packet-v1", packet_id: "x" });
  check("absent-read", absent.valid === false && absent.present === false);
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
