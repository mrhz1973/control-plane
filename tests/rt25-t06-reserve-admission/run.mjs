#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T06 reserve admission at selection boundary. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { admitRouteWithReserve } from "../../tools/rt25-reserve-admission-v1.mjs";

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

// 1. healthy + within reserve (floor policy active) → ADMITTED with provenance
{
  const joined = await joinedFor([codexContribution(62)], {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  const a = admitRouteWithReserve(joined, "codex");
  check(
    "admit-within-reserve",
    a.admitted === true && a.admission === "ADMIT_FRESH_WITHIN_RESERVE" && a.provenance.reserve_policy_ref === "codex-reserve-v1",
    JSON.stringify(a),
  );
}

// 2. remaining <= floor → DENY RESERVE_FLOOR_BLOCK
{
  const joined = await joinedFor([codexContribution(12)], {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  const a = admitRouteWithReserve(joined, "codex");
  check("deny-floor-block", a.admitted === false && a.admission === "DENY_RESERVE_FLOOR_BLOCK", JSON.stringify(a));
}

// 3. floor policy present but remaining not comparable (unknown unit) → DENY fail closed
{
  const joined = await joinedFor([]);
  // force floor onto a pool whose remaining is null: patch via reservePolicy on glm (no observation)
  const patched = JSON.parse(JSON.stringify(joined));
  patched.pools.glm_coding_plan.evaluation = "POOL_HEALTHY"; // simulate evaluator upstream; floor set below
  patched.pools.glm_coding_plan.reserve_floor_percent = 20; // floor policy present, remaining stays null
  const a = admitRouteWithReserve(patched, "glm", {});
  check("deny-incomparable", a.admitted === false && a.admission === "DENY_RESERVE_INCOMPARABLE", JSON.stringify(a));
}

// 4. estimated cost eats into reserve → DENY headroom insufficient
{
  const joined = await joinedFor([codexContribution(62)], {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  const a = admitRouteWithReserve(joined, "codex", { estimated_cost_percent: 45 });
  check("deny-headroom", a.admitted === false && a.admission === "DENY_RESERVE_HEADROOM_INSUFFICIENT", JSON.stringify(a));
}

// 5. estimated cost within headroom → ADMITTED
{
  const joined = await joinedFor([codexContribution(62)], {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  const a = admitRouteWithReserve(joined, "codex", { estimated_cost_percent: 30 });
  check("admit-headroom-ok", a.admitted === true, JSON.stringify(a));
}

// 6. no floor policy → no reserve denial (healthy passes)
{
  const joined = await joinedFor([codexContribution(62)]);
  const a = admitRouteWithReserve(joined, "codex");
  check("no-floor-policy-admits", a.admitted === true && a.provenance.reserve_floor_percent === null, JSON.stringify(a));
}

// 7. freshness gate wins over everything (stale → deny regardless of reserve)
{
  const stale = codexContribution(62);
  stale.produced_at = "2026-09-05T14:00:00.000Z";
  stale.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const joined = await joinedFor([stale]);
  const a = admitRouteWithReserve(joined, "codex");
  check("stale-denies-even-without-floor", a.admitted === false && a.admission === "DENY_CONSERVE_UNKNOWN_STALE", JSON.stringify(a));
}

// 8. no-pool route admits through the same boundary
{
  const joined = await joinedFor([codexContribution(62)]);
  const a = admitRouteWithReserve(joined, "qwen_local");
  check("no-pool-admits", a.admitted === true && a.admission === "ADMIT_NO_POOL");
}

// 9. invalid join → deny
{
  const a = admitRouteWithReserve({ bogus: true }, "codex");
  check("invalid-join-denies", a.admitted === false && a.admission === "DENY_JOIN_STATE_INVALID");
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
