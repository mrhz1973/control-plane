#!/usr/bin/env node
/**
 * V4 — focused tests: GLM Coding Plan shared quota-pool translator
 * (campaign #39 phase 2). Reuses the phase-1 quota-pool-status-v1 law and the
 * deterministic translator bound to registry-v2 pool "glm_coding_plan".
 * Offline/deterministic only. No network, no provider calls, no hardcoded live values.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  translateQuotaPoolSnapshot,
  composeQuotaPoolStatusDoc,
  POOL_IDS,
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
const FRESH_OBS = "2026-09-05T15:59:00.000Z";
function glmSnapshot(overrides = {}) {
  return {
    source: "dashboard_snapshot",
    observed_at: FRESH_OBS,
    windows: [
      { window_type: "monthly", remaining: { value: 41, unit: "percent" }, reset_at: "2026-10-01T00:00:00.000Z" },
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

// --------------------------- A. both GLM model identities -> ONE glm_coding_plan
check("pool-id-is-glm-coding-plan", POOL_IDS.glm === "glm_coding_plan");
const surfacesToPool = new Set(
  ["glm_coding_plan_client", "cursor_byok_route"].map((s) => REGISTRY.access_surfaces[s]?.quota_pool_id),
);
check(
  "both-glm-model-identities-exist-and-are-distinct",
  REGISTRY.models["glm-5.3"] && REGISTRY.models["glm-5.3-flash"] &&
    REGISTRY.models["glm-5.3"] !== REGISTRY.models["glm-5.3-flash"],
);
check(
  "both-glm-models-share-one-pool",
  JSON.stringify([...(REGISTRY.quota_pools.glm_coding_plan.shared_by_models || [])].sort()) ===
    JSON.stringify(["glm-5.3", "glm-5.3-flash"]) &&
    surfacesToPool.size === 1 && surfacesToPool.has("glm_coding_plan"),
);

// --------------------------- B. one pool observation drives both (single entry)
const t = translateQuotaPoolSnapshot(glmSnapshot(), { kind: "glm", nowMs: NOW });
check("valid-glm-snapshot-pass", t.ok === true && t.classification === "PASS_QUOTA_POOL_STATUS_TRANSLATED");
check(
  "single-entry-bound-to-shared-pool",
  t.quota_pool_status?.quota_pool_id === "glm_coding_plan" && t.quota_pool_status?.source === "dashboard_snapshot",
);
{
  const doc = composeQuotaPoolStatusDoc(t.quota_pool_status, NOW);
  check(
    "doc-has-exactly-one-pool-entry-no-double-counting",
    Object.keys(doc.quota_pools).length === 1 && doc.quota_pools.glm_coding_plan === t.quota_pool_status,
  );
  const v = await validateAgainstV1Schema(doc);
  check("glm-doc-validates-quota-pool-status-v1", v.ok === true, JSON.stringify(v.errors?.slice(0, 3)));
  // one observation drives both models: per-model counters do not exist in the shape
  check(
    "no-per-model-quota-counters-in-shape",
    !/"glm-5\.3"/.test(JSON.stringify(doc)) && !/"glm-5\.3-flash"/.test(JSON.stringify(doc)),
  );
}

// --------------------------- C. monthly window + reset evidence passthrough
check(
  "monthly-window-and-reset-passthrough",
  t.quota_pool_status.windows[0].window_type === "monthly" &&
    t.quota_pool_status.windows[0].reset_at === "2026-10-01T00:00:00.000Z" &&
    t.quota_pool_status.windows[0].remaining.value === 41,
);

// --------------------------- D. manual provider evidence accepted (already-collected)
const manual = translateQuotaPoolSnapshot(glmSnapshot({ source: "manual" }), { kind: "glm", nowMs: NOW });
check("manual-evidence-accepted", manual.ok === true && manual.quota_pool_status.source === "manual");

// --------------------------- E. stale fails closed
const stale = translateQuotaPoolSnapshot(
  glmSnapshot({ observed_at: "2026-09-05T09:00:00.000Z" }),
  { kind: "glm", nowMs: NOW },
);
check(
  "stale-glm-status-fails-closed",
  stale.ok === false && stale.classification === "SNAPSHOT_STALE" &&
    stale.quota_pool_status?.freshness === "stale" && stale.quota_pool_status?.state === "unknown",
);

// --------------------------- F. missing data fails closed
const noWindows = translateQuotaPoolSnapshot(
  { source: "dashboard_snapshot", observed_at: FRESH_OBS, windows: [] },
  { kind: "glm", nowMs: NOW },
);
check("glm-missing-windows-fail-closed", noWindows.ok === false && noWindows.reason_codes.includes("SNAPSHOT_MISSING_DATA"));
const missingStatus = translateQuotaPoolSnapshot(null, { kind: "glm", nowMs: NOW });
check("glm-missing-snapshot-fail-closed", missingStatus.ok === false && missingStatus.reason_codes.includes("SNAPSHOT_INVALID"));

// --------------------------- G. invalid data rejected
const invalidPercent = translateQuotaPoolSnapshot(
  glmSnapshot({ windows: [{ window_type: "monthly", remaining: { value: 137, unit: "percent" } }] }),
  { kind: "glm", nowMs: NOW },
);
check("glm-invalid-percent-rejected", invalidPercent.ok === false && invalidPercent.reason_codes.includes("SNAPSHOT_INVALID_PERCENT"));
const invalidReset = translateQuotaPoolSnapshot(
  glmSnapshot({ windows: [{ window_type: "monthly", remaining: { value: 10, unit: "percent" }, reset_at: "someday" }] }),
  { kind: "glm", nowMs: NOW },
);
check("glm-invalid-reset-rejected", invalidReset.ok === false && invalidReset.reason_codes.includes("SNAPSHOT_INVALID_RESET_AT"));

// --------------------------- H. unknown economics remain unknown (no 3x invention)
const toolSrc = readFileSync(resolve(ROOT, "tools/translate-quota-pool-snapshot-v1.mjs"), "utf8");
const unverifiedEcon = translateQuotaPoolSnapshot(
  glmSnapshot({ economics: { verified: false, payload: { morning_multiplier: 3 } } }),
  { kind: "glm", nowMs: NOW },
);
check(
  "unverified-economics-null-not-invented",
  unverifiedEcon.ok === true && unverifiedEcon.quota_pool_status.economics === null,
);
const noEcon = translateQuotaPoolSnapshot(glmSnapshot(), { kind: "glm", nowMs: NOW });
check("absent-economics-null", noEcon.quota_pool_status.economics === null);
const verifiedEcon = translateQuotaPoolSnapshot(
  glmSnapshot({ economics: { verified: true, payload: { cost_window: "synthetic-verified" } } }),
  { kind: "glm", nowMs: NOW },
);
check("verified-economics-passthrough-only", verifiedEcon.quota_pool_status.economics?.verified === true);
check(
  "no-hardcoded-3x-or-multiplier-in-tool",
  !/3x|multiplier\s*[:=]\s*\d|morning/i.test(toolSrc),
);
check(
  "no-hardcoded-live-percent-or-reset-in-tool",
  !/"remaining"\s*:\s*\{?\s*"?\d|reset_at"\s*:\s*"20\d\d/.test(toolSrc),
);

// --------------------------- I. reserved/no OpenAI semantics; exhausted law
check(
  "no-openai-api-byok-glm-path",
  !/openai[-_]api[-_]key|byok|api[-_]billing/i.test(JSON.stringify(t.quota_pool_status)),
);
const exhausted = translateQuotaPoolSnapshot(
  glmSnapshot({ windows: [{ window_type: "monthly", remaining: { value: 0, unit: "percent" } }] }),
  { kind: "glm", nowMs: NOW },
);
check("glm-zero-remaining-exhausted", exhausted.quota_pool_status.state === "exhausted");
const future = translateQuotaPoolSnapshot(
  glmSnapshot({ observed_at: "2026-09-05T16:30:00.000Z" }),
  { kind: "glm", nowMs: NOW },
);
check("glm-future-dated-rejected", future.ok === false && future.reason_codes.includes("SNAPSHOT_FUTURE_DATED"));

// --------------------------- J. registry untouched
const regCheck = await validateResourceRegistryObject(REGISTRY);
check("registry-still-valid-and-untouched", regCheck.ok === true);

// --------------------------- K. CLI glm kind contract
{
  const { execFileSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(resolve(tmpdir(), "qpool-p2-"));
  const snapFile = resolve(dir, "glm-snap.json");
  writeFileSync(snapFile, JSON.stringify(glmSnapshot()));
  const out = execFileSync(
    process.execPath,
    [
      resolve(ROOT, "tools/translate-quota-pool-snapshot-v1.mjs"),
      "glm",
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
    cliOk = parsed.ok === true && parsed.quota_pool_status.quota_pool_id === "glm_coding_plan";
  } catch {}
  check("cli-glm-single-json-result", lines.length === 1 && cliOk, lines[0]?.slice(0, 80));
  rmSync(dir, { recursive: true, force: true });
}

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
