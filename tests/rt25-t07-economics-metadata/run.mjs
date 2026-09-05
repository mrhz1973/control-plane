#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T07 economics metadata propagation. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { attachEconomicsMetadata, normalizeEconomics } from "../../tools/rt25-economics-metadata-v1.mjs";
import { admitRouteWithReserve } from "../../tools/rt25-reserve-admission-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 200) });
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

async function joinedFor(economics = {}) {
  const composed = await composeV4ResourceStatus(
    { registry, baseline, contributions: [codexContribution(62)] },
    { nowMs: NOW },
  );
  return joinQuotaPoolState(composed, registry, {
    nowMs: NOW,
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
    economics,
  });
}

// 1. verified economics propagate into runtime envelope
{
  const joined = await joinedFor({
    chatgpt_codex_subscription: { verified: true, payload: { pricing_window: "2026-09", effective_multiplier: 1.5 } },
  });
  const m = attachEconomicsMetadata(joined, "codex", { base_cost_percent: 10 });
  check(
    "verified-propagates",
    m.quota_pool_id === "chatgpt_codex_subscription" && m.economics.verified === true &&
      m.economics.payload.effective_multiplier === 1.5 && m.estimated_cost_percent === 15,
    JSON.stringify(m),
  );
}

// 2. unverified economics stay explicit unknown; no estimate derivable
{
  const joined = await joinedFor({
    chatgpt_codex_subscription: { verified: false, payload: { effective_multiplier: 999 } },
  });
  const m = attachEconomicsMetadata(joined, "codex", { base_cost_percent: 10 });
  check(
    "unverified-stays-unknown",
    m.economics.verified === false && m.economics.payload === null && m.estimated_cost_percent === null &&
      m.reason_codes.includes("ECONOMICS_UNKNOWN"),
    JSON.stringify(m),
  );
}

// 3. no economics input at all → unknown envelope
{
  const joined = await joinedFor();
  const m = attachEconomicsMetadata(joined, "codex", { base_cost_percent: 10 });
  check("absent-economics-unknown", m.economics.verified === false && m.estimated_cost_percent === null);
}

// 4. no-pool resource → unknown envelope with NO_POOL code (never fake economics)
{
  const joined = await joinedFor({
    chatgpt_codex_subscription: { verified: true, payload: { effective_multiplier: 1 } },
  });
  const m = attachEconomicsMetadata(joined, "qwen_local", { base_cost_percent: 0 });
  check("no-pool-no-economics", m.quota_pool_id === null && m.economics.verified === false && m.reason_codes[0] === "NO_POOL_LOCAL_UNMETERED");
}

// 5. estimate only arithmetic: base × verified multiplier (rounded)
{
  const joined = await joinedFor({
    glm_coding_plan: { verified: true, payload: { effective_multiplier: 3 } },
  });
  const m = attachEconomicsMetadata(joined, "glm", { base_cost_percent: 7.5 });
  check("arithmetic-exact", m.estimated_cost_percent === 22.5, JSON.stringify(m));
}

// 6. integration: verified estimate feeds reserve admission; unknown → null estimate → floor-only law
{
  const joinedVerified = await joinedFor({
    chatgpt_codex_subscription: { verified: true, payload: { effective_multiplier: 1.5 } },
  });
  const meta = attachEconomicsMetadata(joinedVerified, "codex", { base_cost_percent: 30 });
  const a = admitRouteWithReserve(joinedVerified, "codex", { estimated_cost_percent: meta.estimated_cost_percent });
  // headroom = 62-20 = 42 >= 45? no → denied
  check(
    "verified-estimate-feeds-admission",
    meta.estimated_cost_percent === 45 && a.admitted === false && a.admission === "DENY_RESERVE_HEADROOM_INSUFFICIENT",
    JSON.stringify({ meta: meta.estimated_cost_percent, a: a.admission }),
  );
  const joinedUnknown = await joinedFor({});
  const metaU = attachEconomicsMetadata(joinedUnknown, "codex", { base_cost_percent: 30 });
  const aU = admitRouteWithReserve(joinedUnknown, "codex", { estimated_cost_percent: metaU.estimated_cost_percent });
  check(
    "unknown-estimate-falls-back-to-floor-law",
    metaU.estimated_cost_percent === null && aU.admitted === true,
    JSON.stringify({ meta: metaU.estimated_cost_percent, a: aU.admission }),
  );
}

// 7. normalizeEconomics law
{
  check(
    "normalize-law",
    normalizeEconomics("p", { verified: true, payload: { a: 1 } }).verified === true &&
      normalizeEconomics("p", { verified: true }).verified === false &&
      normalizeEconomics("p", null).verified === false,
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
