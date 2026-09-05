#!/usr/bin/env node
/**
 * Focused runtime tests — V4_RT25_T03 GLM quota runtime ingest.
 */
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ingestGlmQuota,
  runGlmIngestPass,
  normalizeMonitorPayload,
  credentialPresent,
} from "../../tools/rt25-quota-ingest-glm-v1.mjs";
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
    windows: [{ window_type: "monthly", remaining: { value: 41, unit: "percent" }, reset_at: "2026-10-01T00:00:00.000Z" }],
    ...overrides,
  };
}

// 1. no credential + no snapshot → fail-closed UNKNOWN ingest (valid runtime outcome)
const none = await ingestGlmQuota({ nowMs: NOW, mode: "auto" });
check(
  "no-evidence-fail-closed-unknown",
  none.ok === true && none.classification === "INGEST_FAIL_CLOSED_UNKNOWN_NO_EVIDENCE" && none.contribution === null,
  none.classification,
);

// 2. credential presence check is functional (and false in this environment)
check("credential-check-runs", typeof credentialPresent() === "boolean");

// 3. manual snapshot → PASS with contribution; composer accepts it E2E
const t = await ingestGlmQuota({ nowMs: NOW, snapshot: snapshot(), mode: "manual" });
check("manual-ingest-pass", t.ok === true && t.mode === "manual" && t.classification === "INGEST_PASS_QUOTA_PROJECTED", t.classification);
const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));
const composed = await composeV4ResourceStatus(
  { registry, baseline, contributions: [t.contribution] },
  { nowMs: NOW },
);
check(
  "composer-accepts-glm-contribution",
  composed.ok === true &&
    composed.resource_status.resources.glm.available === true &&
    composed.resource_status.resources.glm.quota_remaining.value === 41,
  JSON.stringify({ ok: composed.ok, cls: composed.classification, rej: composed.rejected_contributions }).slice(0, 220),
);

// 4. one shared pool: single contribution, no per-model counters representable
check(
  "shared-pool-single-observation",
  t.contribution.contribution_id === "rt25-glm-quota-glm_coding_plan-2026-09-05T15:58:00.000Z" &&
    !JSON.stringify(t.contribution).includes("glm-5.3"),
);

// 5. documented monitor payload normalizes (5h unit=3, weekly unit=6), economics never invented
const mon = normalizeMonitorPayload(
  {
    code: 200,
    data: {
      level: "pro",
      limits: [
        { type: "CREDIT_LIMIT", unit: 3, number: 5, usage: 12000, currentValue: 1438, remaining: 10561, percentage: 11, nextResetTime: 1787804173065 },
        { type: "CREDIT_LIMIT", unit: 6, number: 1, usage: 60000, currentValue: 2254, remaining: 57745, percentage: 3, nextResetTime: 1788223121997 },
      ],
    },
    success: true,
  },
  { nowMs: NOW },
);
check(
  "monitor-payload-normalizes-documented-fields",
  mon.ok === true &&
    mon.status.windows.length === 2 &&
    mon.status.windows[0].window_type === "rolling" &&
    Math.abs(mon.status.windows[0].remaining.value - ((12000 - 1438) / 12000) * 100) < 0.1 &&
    mon.status.windows[1].window_type === "weekly" &&
    mon.status.economics === null &&
    mon.status.plan_level === "pro",
  JSON.stringify(mon.status?.windows),
);

// 6. monitor payload with only unknown window units → no invention
const unknownUnits = normalizeMonitorPayload(
  { data: { limits: [{ type: "CREDIT_LIMIT", unit: 99, usage: 100, currentValue: 10 }] } },
  { nowMs: NOW },
);
check("unknown-window-units-not-invented", unknownUnits.ok === false && unknownUnits.classification === "MONITOR_PAYLOAD_NO_KNOWN_WINDOWS");

// 7. invalid monitor payload rejected
const badMon = normalizeMonitorPayload({ foo: 1 }, { nowMs: NOW });
check("invalid-monitor-payload-rejected", badMon.ok === false && badMon.classification === "MONITOR_PAYLOAD_INVALID");

// 8. stale manual snapshot → fail-closed outcome
const stale = await ingestGlmQuota({ nowMs: NOW, snapshot: snapshot({ observed_at: "2026-09-05T09:00:00.000Z" }), mode: "manual" });
check("stale-glm-ingest-fail-closed", stale.ok === true && stale.classification === "INGEST_FAIL_CLOSED_STALE" && stale.contribution === null);

// 9. invalid manual snapshot → rejected
const bad = await ingestGlmQuota({ nowMs: NOW, snapshot: snapshot({ windows: [{ window_type: "monthly", remaining: { value: 137, unit: "percent" } }] }), mode: "manual" });
check("invalid-glm-ingest-rejected", bad.ok === false && bad.classification === "INGEST_REJECTED_SNAPSHOT_INVALID_PERCENT", bad.classification);

// 10. runtime pass persists decision envelope to untracked lane
const tmp = mkdtempSync(resolve(tmpdir(), "rt25-t03-"));
const outDir = resolve(tmp, "ingest");
const d = await runGlmIngestPass({ outDir, nowMs: NOW, mode: "manual", snapshotPath: null });
check("runtime-pass-persists-decision", existsSync(resolve(outDir, "glm-quota-decision.json")) && d.classification === "INGEST_FAIL_CLOSED_UNKNOWN_NO_EVIDENCE");
rmSync(tmp, { recursive: true, force: true });

// 11. exhausted pool → projected unavailable
const exh = await ingestGlmQuota({ nowMs: NOW, snapshot: snapshot({ windows: [{ window_type: "monthly", remaining: { value: 0, unit: "percent" } }] }), mode: "manual" });
check("exhausted-glm-projects-unavailable", exh.ok === true && exh.contribution.resources.glm.available === false);

// 12. no OpenAI semantics in output
check("no-api-byok-semantics", !/openai[-_]api[-_]key|byok|api[-_]billing/i.test(JSON.stringify(t)));

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
