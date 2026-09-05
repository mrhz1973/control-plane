#!/usr/bin/env node
/**
 * Focused runtime tests — V4_RT25_T02 Codex quota runtime ingest.
 * Proves: valid snapshot → runtime contribution/projection; stale → fail-closed
 * ingest outcome; invalid → rejected; single pool observation governs BOTH
 * projection resources; contribution shape matches composer contract fields;
 * secret-like never ingested; no OpenAI API semantics.
 */
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { ingestCodexQuotaSnapshot, runIngestPass, GOVERNED_RESOURCES } from "../../tools/rt25-quota-ingest-codex-v1.mjs";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 240) });
}
function snapshot(overrides = {}) {
  return {
    source: "dashboard_snapshot",
    observed_at: "2026-09-05T15:58:00.000Z",
    windows: [
      { window_type: "rolling", remaining: { value: 62, unit: "percent" }, window_ends_at: "2026-09-05T19:00:00.000Z" },
      { window_type: "weekly", remaining: { value: 88, unit: "percent" }, reset_at: "2026-09-08T00:00:00.000Z" },
    ],
    ...overrides,
  };
}

// 1. valid snapshot → ingest PASS with runtime contribution
const t = ingestCodexQuotaSnapshot(snapshot(), { nowMs: NOW });
check("ingest-pass-classification", t.ok === true && t.classification === "INGEST_PASS_QUOTA_PROJECTED", t.classification);
check(
  "contribution-id-deterministic-pool-bound",
  t.contribution.contribution_id ===
    "rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z" &&
    t.contribution.producer_id === "rt25-quota-ingest-codex-v1",
);

// 2. contribution carries required composer-contract fields for BOTH governed resources
let shapeOk = true;
for (const rid of GOVERNED_RESOURCES) {
  const o = t.contribution.resources[rid];
  if (!o) { shapeOk = false; break; }
  shapeOk =
    shapeOk &&
    typeof o.available === "boolean" &&
    o.quota_remaining?.unit === "percent" &&
    o.quota_remaining?.value === 88 && // best fresh window = weekly 88%
    ["reset_at", "cost_mode", "location", "updated_at", "evidence"].every((k) => k in o) &&
    o.evidence?.kind === "source_snapshot";
}
check("projection-covers-governed-resource-codex", shapeOk);

// 3. single pool observation drives the governed projection (pool id in evidence;
//    both v2 surfaces share the same pool upstream — no double counting representable)
check(
  "single-observation-no-double-counting",
  t.contribution.resources.codex.quota_remaining.value === 88 &&
    t.contribution.contribution_id.includes("chatgpt_codex_subscription"),
);

// 4. REAL composer accepts the contribution (end-to-end into resource-status)
const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));
const composed = await composeV4ResourceStatus(
  { registry, baseline, contributions: [t.contribution] },
  { nowMs: NOW },
);
check(
  "composer-accepts-rt25-contribution",
  composed.ok === true &&
    composed.resource_status.resources.codex.available === true &&
    composed.resource_status.resources.codex.quota_remaining.value === 88,
  JSON.stringify({ ok: composed.ok, cls: composed.classification }).slice(0, 200),
);
check(
  "composer-decision-records-observation",
  composed.resource_decisions.codex.selected_contribution_id ===
    "rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z",
);

// 5. stale snapshot → fail-closed ingest outcome (valid runtime outcome, exit-0 semantics)
const stale = ingestCodexQuotaSnapshot(snapshot({ observed_at: "2026-09-05T10:00:00.000Z" }), { nowMs: NOW });
check(
  "stale-ingest-fail-closed-outcome",
  stale.ok === true && stale.classification === "INGEST_FAIL_CLOSED_STALE" && stale.contribution === null,
);

// 6. invalid snapshot → rejected
const bad = ingestCodexQuotaSnapshot(snapshot({ windows: [{ window_type: "rolling", remaining: { value: 150, unit: "percent" } }] }), { nowMs: NOW });
check("invalid-ingest-rejected", bad.ok === false && bad.classification === "INGEST_REJECTED_SNAPSHOT_INVALID_PERCENT", bad.classification);

// 7. exhausted pool → projected unavailable
const exh = ingestCodexQuotaSnapshot(snapshot({ windows: [{ window_type: "rolling", remaining: { value: 0, unit: "percent" } }] }), { nowMs: NOW });
check(
  "exhausted-projects-unavailable",
  exh.ok === true && exh.classification === "INGEST_PASS_POOL_EXHAUSTED_PROJECTED_UNAVAILABLE" &&
    exh.contribution.resources.codex.available === false,
);

// 8. runtime pass writes decisions into untracked runtime dir (no tracked writes)
const tmp = mkdtempSync(resolve(tmpdir(), "rt25-t02-"));
const snapDir = resolve(tmp, "snapshots");
const outDir = resolve(tmp, "ingest");
mkdirSync(snapDir, { recursive: true });
writeFileSync(resolve(snapDir, "a.json"), JSON.stringify(snapshot()));
writeFileSync(resolve(snapDir, "b.json"), JSON.stringify(snapshot({ observed_at: "2026-09-05T09:00:00.000Z" })));
const pass = runIngestPass({ watchDir: snapDir, outDir, nowMs: NOW });
check(
  "runtime-pass-persists-decisions",
  pass.length === 2 && existsSync(resolve(outDir, "codex-quota-a.json")) && existsSync(resolve(outDir, "codex-quota-b.json")),
);
rmSync(tmp, { recursive: true, force: true });

// 9. secret-like input never becomes a contribution
const secret = ingestCodexQuotaSnapshot(snapshot({ token: "sk-ABCDEFGHIJKLMNOPQRSTUVWX" }), { nowMs: NOW });
check("secret-like-rejected", secret.ok === false && secret.contribution === null);

// 10. no OpenAI API semantics anywhere in the ingest output
check(
  "no-api-byok-semantics",
  !/openai[-_]api[-_]key|byok|api[-_]billing/i.test(JSON.stringify(t)),
);

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
