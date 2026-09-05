#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T22 Windows endpoint provenance propagation/validation. */
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  handleExecutionRequest,
  createExecutionState,
  validateRouteQuotaProvenanceForEndpoint,
  wrapResult,
} from "../../tools/serve-v4-windows-local-execution-endpoint-v1.mjs";
import {
  admitAuthorization as realAdmit,
  inspectAuthorization as realInspect,
  REGISTRY_SCHEMA_VERSION,
} from "../../tools/v4-runtime-authorization-provenance-registry-v1.mjs";
import {
  inspectDurableSpend as realInspectLedger,
  recordDurableSpend as realRecordLedger,
  LEDGER_SCHEMA_VERSION,
} from "../../tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

// --- offline fixtures (real registry/ledger schemas, offline injections) ----
const tmp = mkdtempSync(join(tmpdir(), "rt25-t22-"));
const REGISTRY_PATH = join(tmp, "auth-registry.json");
const LEDGER_PATH = join(tmp, "spend-ledger.json");

function rfc3339(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}
function writeRegistry(path, entries) {
  writeFileSync(path, `${JSON.stringify({ schema_version: REGISTRY_SCHEMA_VERSION, entries }, null, 2)}\n`);
}
function writeLedger(path, spends = []) {
  writeFileSync(path, `${JSON.stringify({ schema_version: LEDGER_SCHEMA_VERSION, spends }, null, 2)}\n`);
}
function activeEntry(authorization_id) {
  return {
    authorization_id,
    state: "ACTIVE",
    route_id: "opencode+qwen_local",
    issued_at: rfc3339(-60_000),
    expires_at: rfc3339(3_600_000),
    spent_at: null,
  };
}

const baseAuth = {
  schema_version: "operator-runtime-authorization-v1",
  authorization_id: "AUTH-RT25-T22-1",
  authorization_state: "ACTIVE",
  route_id: "opencode+qwen_local",
  scope: {
    scope_version: "qwen-execution-scope-v3",
    execution_harness: "opencode",
    model: "qwen_local",
    profile_id: "qwen38-opus-q3-agent-24k",
    role: "FAST_AGENT",
    canonical_endpoint: "http://127.0.0.1:8080",
    single_generation_guard_required: true,
    max_opencode_executions: 1,
    max_qwen_generation_calls: 1,
    retry: 0,
    fallback: 0,
  },
};

function requestBody(overrides = {}) {
  return {
    schema_version: "v4-windows-local-execution-endpoint-request-v1",
    execution_id: "EX-RT25-T22-1",
    runtime_authorization: baseAuth,
    message: "read-only diagnostic turn",
    ...overrides,
  };
}

const VALID_PROVENANCE = {
  schema_version: "v4-rt25-route-quota-provenance-v1",
  present: true,
  decision_ref: "planner-q-1",
  selected_route: "qwen-local-route",
  model: "qwen_local",
  access_surface: "qwen_local_cli",
  quota_pool_id: null,
  pool_evidence: null,
  authorization_note: "routing metadata only; no authorization gate changed",
};

// 1. pure validation law: absent → ok
{
  const r = validateRouteQuotaProvenanceForEndpoint(undefined, baseAuth);
  check("absent-ok", r.ok === true && r.present === false);
}

// 2. pure validation law: valid qwen provenance → ok
{
  const r = validateRouteQuotaProvenanceForEndpoint(VALID_PROVENANCE, baseAuth);
  check("valid-qwen-provenance-ok", r.ok === true && r.present === true);
}

// 3. pure validation law: model mismatch → fail closed with explicit codes
{
  const r = validateRouteQuotaProvenanceForEndpoint({ ...VALID_PROVENANCE, model: "glm-5.3" }, baseAuth);
  check("model-mismatch-rejected", r.ok === false && r.reason_codes.includes("ROUTE_QUOTA_PROVENANCE_MODEL_MISMATCH"));
}

// 4. pure validation law: pool-bearing provenance on qwen scope → rejected
{
  const r = validateRouteQuotaProvenanceForEndpoint({ ...VALID_PROVENANCE, quota_pool_id: "glm_coding_plan" }, baseAuth);
  check("pool-forbidden-for-scope", r.ok === false && r.reason_codes[0] === "ROUTE_QUOTA_PROVENANCE_POOL_FORBIDDEN_FOR_SCOPE");
}

// 5. pure validation law: malformed block → rejected
{
  const r = validateRouteQuotaProvenanceForEndpoint({ schema_version: "bogus" }, baseAuth);
  check("malformed-rejected", r.ok === false && r.reason_codes[0] === "ROUTE_QUOTA_PROVENANCE_INVALID");
}

// 6. wrapResult propagates provenance metadata
{
  const w = wrapResult({ ok: true, classification: "X", route_quota_provenance: VALID_PROVENANCE });
  check("wrap-propagates", w.route_quota_provenance?.selected_route === "qwen-local-route");
  const w2 = wrapResult({ ok: false, classification: "Y" });
  check("wrap-null-when-absent", w2.route_quota_provenance === null);
}

// --- handler-level: real registry/ledger, adapter injected offline ----------
writeRegistry(REGISTRY_PATH, [activeEntry("AUTH-RT25-T22-1"), activeEntry("AUTH-RT25-T22-2")]);
writeLedger(LEDGER_PATH, []);

const handlerDeps = {
  state: createExecutionState(),
  authorizationRegistryPath: REGISTRY_PATH,
  authorizationSpendLedgerPath: LEDGER_PATH,
  inspectAuthorization: (path, id, opts) => realInspect(path, id, opts),
  admitAuthorization: (path, id, opts) => realAdmit(path, id, opts),
  inspectDurableSpend: (path, id, opts) => realInspectLedger(path, id, opts),
  recordDurableSpend: (path, rec, opts) => realRecordLedger(path, rec, opts),
  // Occupancy ready; adapter injected offline — NO real generation occurs.
  getOccupancy: async () => "QWEN_READY_IDLE",
  runOpenCode: async () => ({
    opencode_execution_count: 1,
    retry_calls: 0,
    fallback_calls: 0,
    response_validation: "NOT_VALIDATED",
  }),
  executeOpenCodeBounded: async (req) => ({
    classification: "EXECUTED",
    status: "OK",
    execution_performed: true,
    authorization_state_final: "SPENT",
    reason_codes: [],
    execution_id: req.execution_id,
  }),
};

// 7. mismatched provenance → rejected BEFORE any authorization consumption
{
  const r = await handleExecutionRequest(
    requestBody({ execution_id: "EX-T22-MISMATCH", route_quota_provenance: { ...VALID_PROVENANCE, model: "glm-5.3" } }),
    handlerDeps,
  );
  const reg = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
  check(
    "handler-mismatch-fails-closed",
    r.status === 200 && r.body.classification === "ROUTE_QUOTA_PROVENANCE_REJECTED" &&
      r.body.reason_codes.includes("ROUTE_QUOTA_PROVENANCE_MODEL_MISMATCH"),
    JSON.stringify({ c: r.body.classification }),
  );
  check(
    "authorization-not-consumed",
    reg.entries.find((e) => e.authorization_id === "AUTH-RT25-T22-1").state === "ACTIVE" &&
      ledger.spends.length === 0,
    "registry+ledger untouched",
  );
}

// 8. valid provenance flows through the FULL real chain (ledger → registry →
//    occupancy → adapter) and propagates onto the endpoint result.
{
  const r = await handleExecutionRequest(
    requestBody({ execution_id: "EX-T22-VALID", route_quota_provenance: VALID_PROVENANCE }),
    handlerDeps,
  );
  check(
    "valid-provenance-full-chain-propagates",
    r.status === 200 && r.body.ok === true && r.body.classification === "EXECUTED" &&
      r.body.route_quota_provenance?.selected_route === "qwen-local-route" &&
      r.body.execution_performed === true,
    JSON.stringify({ c: r.body.classification, p: r.body.route_quota_provenance?.selected_route }),
  );
}

// 9. replay carries the provenance block from the cached response
{
  const r = await handleExecutionRequest(
    requestBody({ execution_id: "EX-T22-VALID", route_quota_provenance: VALID_PROVENANCE }),
    handlerDeps,
  );
  check(
    "replay-carries-provenance",
    r.status === 200 && r.body.replayed === true && r.body.route_quota_provenance?.present === true,
    JSON.stringify({ rep: r.body.replayed }),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
