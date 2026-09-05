#!/usr/bin/env node
/**
 * V4 — focused tests: Codex subscription shared quota-pool snapshot translator
 * (campaign #39 phase 1). Offline/deterministic only. No network, no Codex,
 * no provider calls, no credentials, no live values hardcoded.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  translateQuotaPoolSnapshot,
  composeQuotaPoolStatusDoc,
  POOL_IDS,
  QUOTA_POOL_STATUS_MAX_AGE_MS,
} from "../../tools/translate-quota-pool-snapshot-v1.mjs";
import { validateResourceRegistryObject } from "../../tools/validate-resource-registry-v1.mjs";
import { resolveAjvModules } from "../../tools/validate-execution-packet-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const REGISTRY_PATH = resolve(ROOT, "configs/resources/registry.json");
const SCHEMA_PATH = resolve(ROOT, "docs/contracts/quota-pool-status-v1.schema.json");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 200) });
}

const REGISTRY = JSON.parse(readFileSync(REGISTRY_PATH, "utf8").replace(/^\uFEFF/, ""));

// Shared fixture builders (all values synthetic test values, not live observations)
const FRESH_OBS = "2026-09-05T15:58:00.000Z"; // 2 min before NOW
function codexSnapshot(overrides = {}) {
  return {
    source: "dashboard_snapshot",
    observed_at: FRESH_OBS,
    windows: [
      { window_type: "rolling", remaining: { value: 62, unit: "percent" }, window_ends_at: "2026-09-05T19:00:00.000Z" },
      { window_type: "weekly", remaining: { value: 88, unit: "percent" }, reset_at: "2026-09-08T00:00:00.000Z" },
    ],
    ...overrides,
  };
}

async function validateAgainstV1Schema(doc) {
  const { ajv2020Path, formatsPath } = resolveAjvModules();
  const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
    import(pathToFileURL(ajv2020Path).href),
    import(pathToFileURL(formatsPath).href),
  ]);
  const addFormats = formatsMod.default || formatsMod;
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""));
  const validate = ajv.compile(schema);
  const ok = validate(doc);
  return { ok, errors: validate.errors };
}

// ---------------------------------------------- 1. binding to registry-v2 pool
check(
  "pool-id-bound-to-registry-v2",
  POOL_IDS.codex === "chatgpt_codex_subscription" &&
    Object.prototype.hasOwnProperty.call(REGISTRY.quota_pools, POOL_IDS.codex),
);
check(
  "pool-shared-by-both-codex-surfaces",
  REGISTRY.access_surfaces.codex_ide_cursor_extension.quota_pool_id === POOL_IDS.codex &&
    REGISTRY.access_surfaces.codex_external_planner.quota_pool_id === POOL_IDS.codex,
);

// ---------------------------------------------- 2. valid snapshot normalization
const valid = translateQuotaPoolSnapshot(codexSnapshot(), { kind: "codex", nowMs: NOW });
check("valid-snapshot-pass", valid.ok === true && valid.classification === "PASS_QUOTA_POOL_STATUS_TRANSLATED", valid.reason_codes);
check(
  "valid-snapshot-single-pool-entry",
  valid.quota_pool_status?.quota_pool_id === "chatgpt_codex_subscription" &&
    valid.quota_pool_status?.source === "dashboard_snapshot" &&
    valid.quota_pool_status?.freshness === "fresh",
);
check(
  "valid-snapshot-rolling-and-weekly-windows",
  valid.quota_pool_status?.windows?.length === 2 &&
    valid.quota_pool_status.windows[0].window_type === "rolling" &&
    valid.quota_pool_status.windows[1].window_type === "weekly" &&
    valid.quota_pool_status.windows[0].remaining.value === 62 &&
    valid.quota_pool_status.windows[1].remaining.value === 88,
);
check(
  "valid-snapshot-state-available-and-values-passthrough-not-invented",
  valid.quota_pool_status?.state === "available" &&
    valid.quota_pool_status?.reserve_policy_ref === null &&
    valid.quota_pool_status?.economics === null,
);

// ---------------------------------------------- 3. schema validity of the doc
if (valid.ok) {
  const doc = composeQuotaPoolStatusDoc(valid.quota_pool_status, NOW);
  const v = await validateAgainstV1Schema(doc);
  check("composed-doc-validates-quota-pool-status-v1", v.ok === true, JSON.stringify(v.errors?.slice(0, 3)));
}

// ---------------------------------------------- 4. rolling + weekly window laws
const rollingOnly = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "rolling", remaining: { value: 5, unit: "percent" } }] }),
  { kind: "codex", nowMs: NOW },
);
check(
  "rolling-window-quota-translated",
  rollingOnly.ok === true && rollingOnly.quota_pool_status.windows.length === 1 &&
    rollingOnly.quota_pool_status.windows[0].window_type === "rolling" &&
    rollingOnly.quota_pool_status.windows[0].remaining.value === 5,
);
const weeklyOnly = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "weekly", remaining: { value: 0.75, unit: "normalized" } }] }),
  { kind: "codex", nowMs: NOW },
);
check(
  "weekly-window-normalized-translated",
  weeklyOnly.ok === true && weeklyOnly.quota_pool_status.windows[0].window_type === "weekly" &&
    weeklyOnly.quota_pool_status.windows[0].remaining.unit === "normalized" &&
    weeklyOnly.quota_pool_status.windows[0].remaining.value === 0.75,
);
const unknownWindow = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "unknown", remaining: { value: null, unit: "unknown" } }] }),
  { kind: "codex", nowMs: NOW },
);
check(
  "unknown-window-stays-unknown-state",
  unknownWindow.ok === true && unknownWindow.quota_pool_status.windows[0].remaining.unit === "unknown" &&
    unknownWindow.quota_pool_status.state === "unknown",
);

// ---------------------------------------------- 5. missing data fail closed
const noWindows = translateQuotaPoolSnapshot(
  { source: "dashboard_snapshot", observed_at: FRESH_OBS, windows: [] },
  { kind: "codex", nowMs: NOW },
);
check("missing-windows-fail-closed", noWindows.ok === false && noWindows.reason_codes.includes("SNAPSHOT_MISSING_DATA"));
const noObserved = translateQuotaPoolSnapshot(
  { source: "dashboard_snapshot", windows: [{ window_type: "rolling", remaining: { value: 50, unit: "percent" } }] },
  { kind: "codex", nowMs: NOW },
);
check("missing-observed-at-fail-closed", noObserved.ok === false && noObserved.reason_codes.includes("SNAPSHOT_MISSING_DATA"));
const noSource = translateQuotaPoolSnapshot(
  { observed_at: FRESH_OBS, windows: [{ window_type: "rolling", remaining: { value: 50, unit: "percent" } }] },
  { kind: "codex", nowMs: NOW },
);
check("missing-source-fail-closed", noSource.ok === false && noSource.reason_codes.includes("SNAPSHOT_MISSING_DATA"));

// ---------------------------------------------- 6. invalid percent/capacity
const invalidPercent = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "rolling", remaining: { value: 150, unit: "percent" } }] }),
  { kind: "codex", nowMs: NOW },
);
check("invalid-percent-over-100-rejected", invalidPercent.ok === false && invalidPercent.reason_codes.includes("SNAPSHOT_INVALID_PERCENT"));
const invalidNormalized = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "rolling", remaining: { value: 1.5, unit: "normalized" } }] }),
  { kind: "codex", nowMs: NOW },
);
check("invalid-normalized-over-1-rejected", invalidNormalized.ok === false && invalidNormalized.reason_codes.includes("SNAPSHOT_INVALID_PERCENT"));
const nonNumeric = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "rolling", remaining: { value: "lots", unit: "percent" } }] }),
  { kind: "codex", nowMs: NOW },
);
check("non-numeric-remaining-rejected", nonNumeric.ok === false && nonNumeric.reason_codes.includes("SNAPSHOT_INVALID_PERCENT"));

// ---------------------------------------------- 7. invalid reset timestamp
const invalidReset = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "weekly", remaining: { value: 40, unit: "percent" }, reset_at: "next-tuesday" }] }),
  { kind: "codex", nowMs: NOW },
);
check("invalid-reset-timestamp-rejected", invalidReset.ok === false && invalidReset.reason_codes.includes("SNAPSHOT_INVALID_RESET_AT"));

// ---------------------------------------------- 8. stale snapshot fail closed
const stale = translateQuotaPoolSnapshot(
  codexSnapshot({ observed_at: "2026-09-05T10:00:00.000Z" }), // 6h before NOW > max age
  { kind: "codex", nowMs: NOW },
);
check(
  "stale-snapshot-classified-stale",
  stale.ok === false && stale.classification === "SNAPSHOT_STALE" &&
    stale.quota_pool_status?.freshness === "stale" && stale.quota_pool_status?.state === "unknown",
);
const boundaryFresh = translateQuotaPoolSnapshot(
  codexSnapshot({ observed_at: new Date(NOW - QUOTA_POOL_STATUS_MAX_AGE_MS).toISOString() }),
  { kind: "codex", nowMs: NOW },
);
check("exact-max-age-boundary-fresh", boundaryFresh.ok === true && boundaryFresh.quota_pool_status.freshness === "fresh");
const future = translateQuotaPoolSnapshot(
  codexSnapshot({ observed_at: "2026-09-05T16:05:00.000Z" }),
  { kind: "codex", nowMs: NOW },
);
check("future-dated-snapshot-rejected", future.ok === false && future.reason_codes.includes("SNAPSHOT_FUTURE_DATED"));

// ---------------------------------------------- 9. shared identity: one pool serves both surfaces
// The produced status is ONE entry keyed by pool id; the registry binds both
// surfaces to that id, so a single observation drives both — proven by identity,
// not by duplication.
check(
  "single-translation-serves-both-surfaces",
  valid.quota_pool_status.quota_pool_id ===
    REGISTRY.access_surfaces.codex_ide_cursor_extension.quota_pool_id &&
    valid.quota_pool_status.quota_pool_id ===
      REGISTRY.access_surfaces.codex_external_planner.quota_pool_id,
);

// ---------------------------------------------- 10. no static hardcoding of live values
const differentValues = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "rolling", remaining: { value: 7, unit: "percent" } }] }),
  { kind: "codex", nowMs: NOW },
);
check(
  "values-are-input-driven-not-hardcoded",
  differentValues.quota_pool_status.windows[0].remaining.value === 7 &&
    valid.quota_pool_status.windows[0].remaining.value === 62,
);
const toolSrc = readFileSync(resolve(ROOT, "tools/translate-quota-pool-snapshot-v1.mjs"), "utf8");
check(
  "tool-source-has-no-live-percentage-hardcoded",
  !/(85|88)\s*%|"remaining"\s*:\s*\d{2}/.test(toolSrc),
);

// ---------------------------------------------- 11. no OpenAI API/BYOK semantics
check(
  "no-openai-api-byok-in-tool-or-output",
  !/openai[-_]api[-_]key|byok|api[-_]billing/i.test(toolSrc) &&
    !/openai[-_]api[-_]key|byok|api[-_]billing/i.test(JSON.stringify(valid.quota_pool_status)),
);
check(
  "forbidden-sources-not-accepted",
  translateQuotaPoolSnapshot(
    codexSnapshot({ source: "openai_api" }),
    { kind: "codex", nowMs: NOW },
  ).ok === false,
);

// ---------------------------------------------- 12. secret-like snapshot rejected
const secret = translateQuotaPoolSnapshot(
  codexSnapshot({ token: "sk-ABCDEFGHIJKLMNOPQRSTUVWX123456" }),
  { kind: "codex", nowMs: NOW },
);
check("secret-like-snapshot-rejected", secret.ok === false && secret.reason_codes.includes("SNAPSHOT_SECRET_LIKE"));

// ---------------------------------------------- 13. reserve ref + verified economics only
const withReserve = translateQuotaPoolSnapshot(
  codexSnapshot({ reserve_policy_ref: "reserve-policy-codex-v1" }),
  { kind: "codex", nowMs: NOW },
);
check("reserve-ref-passthrough", withReserve.quota_pool_status.reserve_policy_ref === "reserve-policy-codex-v1");
const unverifiedEcon = translateQuotaPoolSnapshot(
  codexSnapshot({ economics: { verified: false, payload: { multiplier: 3 } } }),
  { kind: "codex", nowMs: NOW },
);
check(
  "unverified-economics-remain-unknown",
  unverifiedEcon.ok === true && unverifiedEcon.quota_pool_status.economics === null,
);
const verifiedEcon = translateQuotaPoolSnapshot(
  codexSnapshot({ economics: { verified: true, payload: { note: "synthetic-verified" } } }),
  { kind: "codex", nowMs: NOW },
);
check(
  "verified-economics-passthrough",
  verifiedEcon.quota_pool_status.economics?.verified === true,
);

// ---------------------------------------------- 14. exhausted state law
const exhausted = translateQuotaPoolSnapshot(
  codexSnapshot({ windows: [{ window_type: "rolling", remaining: { value: 0, unit: "percent" } }] }),
  { kind: "codex", nowMs: NOW },
);
check("zero-remaining-state-exhausted", exhausted.quota_pool_status.state === "exhausted");

// ---------------------------------------------- 15. GLM pool binding (shared law, phase 2 reuses)
check(
  "glm-pool-id-bound-to-registry-v2",
  POOL_IDS.glm === "glm_coding_plan" &&
    Object.prototype.hasOwnProperty.call(REGISTRY.quota_pools, POOL_IDS.glm),
);

// ---------------------------------------------- 16. CLI one-JSON-line contract
{
  const { execFileSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(resolve(tmpdir(), "qpool-p1-"));
  const snapFile = resolve(dir, "snap.json");
  writeFileSync(snapFile, JSON.stringify(codexSnapshot()));
  const out = execFileSync(
    process.execPath,
    [
      resolve(ROOT, "tools/translate-quota-pool-snapshot-v1.mjs"),
      "codex",
      snapFile,
      "--now",
      "2026-09-05T16:00:00.000Z",
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  const lines = out.trim().split(/\r?\n/).filter(Boolean);
  let cliOk = false;
  try {
    const parsed = JSON.parse(lines[lines.length - 1]);
    cliOk = parsed.schema_version === "quota-pool-status-translate-result-v1" && parsed.ok === true;
  } catch {}
  check("cli-single-json-result", lines.length === 1 && cliOk, lines[0]?.slice(0, 80));
  rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------- 17. registry untouched by this phase
const regCheck = await validateResourceRegistryObject(REGISTRY);
check("registry-still-valid-and-untouched", regCheck.ok === true);

// ------------------------------------------------------------------- summary
const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
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
