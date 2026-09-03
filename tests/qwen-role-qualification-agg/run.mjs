#!/usr/bin/env node
/**
 * AGG 2026-09-03 — runtime role correction: targeted offline tests.
 * DCFR is FAST_THROUGHPUT/LONG_TASK; short-turn interactive roles UNQUALIFIED.
 * Zero Qwen generation. Zero OpenCode. Zero register/Telegram/provider calls.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  QUALIFIED,
  UNQUALIFIED,
  loadQwenRoleQualification,
  loadQwenLocalRuntime,
  roleQualification,
  roleQualifiedForLiveExecution,
  validateRuntimeDocument,
} from "../../tools/qwen-local-runtime-v1.mjs";
import {
  FIXED_AUTHORIZATION_SCOPE_V2,
  scopeRoleQualifiedForLiveExecution,
  validateScopeV2,
  canonicalScopeDigestV2,
  CANONICAL_SCOPE_DIGEST_V2,
} from "../../tools/qwen-execution-scope-v2.mjs";
import { buildLiveExecutionProposal, buildRuntimeAuthorizationFromStatus } from "../../tools/build-v4-wf40-live-execution-sidecars-v1.mjs";
import { executeOpenCodeBounded, validateRuntimeAuthorization } from "../../tools/opencode-execution-adapter-v1.mjs";
import { dispatchOpenCodeExecution } from "../../tools/dispatch-opencode-execution-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];
function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

// --- qualification overlay ---

const overlay = loadQwenRoleQualification();
check(
  "overlay-loads-and-preserves-six",
  overlay.six_profiles_preserved === true &&
    Object.keys(overlay.profiles).length === 6,
  "overlay shape",
);

check(
  "dcfr-not-deleted-retired",
  overlay.policy.delete_or_retire_dcfr === false &&
    overlay.policy.silently_replace_dcfr === false &&
    overlay.policy.delete_any_of_six_profiles === false,
  "policy flags",
);

check(
  "fast-agent-unqualified",
  roleQualification("FAST_AGENT", overlay).value === UNQUALIFIED &&
    roleQualification("FAST_INTERACTIVE", overlay).value === UNQUALIFIED &&
    roleQualification("FAST_AGENT_SHORT_TURN", overlay).value === UNQUALIFIED,
  "short-turn roles",
);

check(
  "fast-throughput-long-task-qualified",
  roleQualification("FAST_THROUGHPUT_LONG_TASK", overlay).value === QUALIFIED,
  "long-task role",
);

check(
  "legacy-roles-still-qualified",
  roleQualification("DAILY", overlay).value === QUALIFIED &&
    roleQualification("QUALITY", overlay).value === QUALIFIED &&
    roleQualification("REFERENCE", overlay).value === QUALIFIED &&
    roleQualification("MANUAL_UNCENSORED", overlay).value === QUALIFIED,
  "legacy roles",
);

check(
  "live-gate-blocks-fast-agent",
  roleQualifiedForLiveExecution("FAST_AGENT", overlay).qualified === false,
  "gate",
);

check(
  "live-gate-allows-daily",
  roleQualifiedForLiveExecution("DAILY", overlay).qualified === true,
  "gate",
);

check(
  "gate-fails-closed-unreadable-overlay",
  roleQualifiedForLiveExecution(
    "FAST_AGENT",
    {},
  ).qualified === false,
  "unreadable overlay must fail closed for AGG roles",
);

// --- runtime document still valid; DCFR annotated stale ---

const runtime = loadQwenLocalRuntime();
const runtimeOk = validateRuntimeDocument(runtime);
check(
  "runtime-doc-still-valid-six-profiles",
  runtimeOk.ok === true &&
    runtime.next_wf40_executor_profile_id === "qwen38-dcfr-iq3-agent-24k" &&
    runtime.next_wf40_executor_status === "STALE_UNQUALIFIED_PENDING_REQUALIFICATION",
  runtimeOk.reason || "runtime",
);

check(
  "dcfr-profiles-annotated",
  runtime.profiles["qwen38-dcfr-iq3-agent-24k"].agg_2026_09_03 &&
    runtime.profiles["qwen38-dcfr-iq3-fast-16k"].agg_2026_09_03 &&
    runtime.profiles["qwen38-dcfr-iq3-agent-24k"].agg_2026_09_03.unqualified_roles.includes("FAST_AGENT"),
  "annotations",
);

// --- scope v2 unchanged cryptographically; role gate layers on top ---

const scopeCheck = validateScopeV2(FIXED_AUTHORIZATION_SCOPE_V2);
check(
  "scope-v2-digest-unchanged",
  scopeCheck.ok === true &&
    canonicalScopeDigestV2() === CANONICAL_SCOPE_DIGEST_V2,
  JSON.stringify(scopeCheck),
);

check(
  "scope-role-gate-blocks-v2-scope",
  scopeRoleQualifiedForLiveExecution(FIXED_AUTHORIZATION_SCOPE_V2).qualified === false,
  "scope gate",
);

// --- WF40 proposal: must NOT propose while FAST_AGENT unqualified ---

const packet = JSON.parse(
  readFileSync(
    resolve(ROOT, "tests/opencode-execution-dispatch/fixtures/valid-packet.json"),
    "utf8",
  ).replace(/^\uFEFF/, ""),
);
const routedResult = {
  schema_version: "execution-route-result-v1",
  request_id: "req-agg",
  status: "ROUTED",
  execution_route: {
    route_id: "opencode+qwen_local",
    implementer: "opencode",
    model: "qwen_local",
    confidence: "high",
    reason_codes: ["TECHNICAL_REQUIREMENTS_MATCH"],
  },
  arbitration: { required: false, used: false, arbiter: null },
  reason_codes: ["TECHNICAL_REQUIREMENTS_MATCH"],
  arbiter_call_count: 0,
};
const resourceStatus = JSON.parse(
  readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8").replace(/^\uFEFF/, ""),
);
resourceStatus.generated_at = new Date().toISOString();
resourceStatus.resources.opencode.available = true;
resourceStatus.resources.opencode.updated_at = resourceStatus.generated_at;
resourceStatus.resources.qwen_local.available = true;
resourceStatus.resources.qwen_local.updated_at = resourceStatus.generated_at;

const proposal = await buildLiveExecutionProposal({
  task_id: packet.task_id,
  execution_packet: packet,
  execution_route_result: routedResult,
  resource_status: resourceStatus,
});
check(
  "wf40-proposal-fails-closed",
  proposal.ok === false &&
    proposal.proposal_ready === false &&
    proposal.classification === "PROFILE_ROLE_UNQUALIFIED" &&
    proposal.register_request === null,
  JSON.stringify({ c: proposal.classification, codes: proposal.reason_codes }),
);

check(
  "wf40-proposal-qualified-role-can-proceed",
  (await buildLiveExecutionProposal({
    task_id: packet.task_id,
    execution_packet: packet,
    execution_route_result: routedResult,
    resource_status: resourceStatus,
    role: "DAILY",
  })).ok === true,
  "injectable role gate for tests only",
);

// --- authorization minting: no ACTIVE envelope under unqualified role ---

const minted = buildRuntimeAuthorizationFromStatus({
  status_result: {
    ok: true,
    pending_decision_id: "PEND-AGG-1",
    authorization_id: "AUTH-AGG-1",
    state: "ISSUED",
    authorization_expires_at: new Date(Date.now() + 60000).toISOString(),
  },
  expected_pending_decision_id: "PEND-AGG-1",
  expected_authorization_id: "AUTH-AGG-1",
});
check(
  "no-active-envelope-while-unqualified",
  minted.ok === false &&
    minted.runtime_authorization === null &&
    minted.classification === "PROFILE_ROLE_UNQUALIFIED",
  minted.classification,
);

// --- adapter: cryptographically valid auth still blocked ---

const adapterBlocked = await executeOpenCodeBounded(
  {
    execution_id: "agg-adapter-1",
    runtime_authorization: {
      schema_version: "operator-runtime-authorization-v1",
      authorization_id: "AUTH-AGG-ADAPTER-1",
      authorization_state: "ACTIVE",
      spent: false,
      used: false,
      route_id: "opencode+qwen_local",
      scope: { ...FIXED_AUTHORIZATION_SCOPE_V2 },
    },
    message: "m",
  },
  {
    getOccupancy: async () => "QWEN_READY_IDLE",
    guardStart: async () => {
      throw new Error("GUARD_MUST_NOT_START");
    },
    runOpenCode: async () => {
      throw new Error("RUNNER_MUST_NOT_RUN");
    },
  },
);
check(
  "adapter-blocks-valid-auth-unqualified-role",
  adapterBlocked.classification === "AUTHORIZATION_REJECTED" &&
    adapterBlocked.execution_performed === false &&
    adapterBlocked.reason_codes.includes("ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION") &&
    adapterBlocked.guard_started === false,
  JSON.stringify(adapterBlocked.reason_codes),
);

// validator alone still passes (scope integrity is separate from qualification)
check(
  "validator-still-validates-scope",
  validateRuntimeAuthorization({
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: "AUTH-AGG-VAL-1",
    authorization_state: "ACTIVE",
    route_id: "opencode+qwen_local",
    scope: { ...FIXED_AUTHORIZATION_SCOPE_V2 },
  }).ok === true,
  "validator boundary unchanged",
);

// --- dispatch boundary: PROFILE_ROLE_UNQUALIFIED, no DISPATCH_READY ---

const dispatchBlocked = await dispatchOpenCodeExecution(
  {
    schema_version: "opencode-execution-dispatch-v1",
    dispatch_id: "disp-agg-1",
    execution_route_result: routedResult,
    execution_packet: packet,
    repository: ROOT.replace(/\\/g, "/"),
    branch: "main",
  },
  {
    opencodeProbe: {
      available: true,
      version: "test",
      executable: "opencode",
      dispatch_interface_resolved: true,
      capabilities: { subcommand: "run", directory_flag: "--dir", model_flag: "-m", format_flag: "--format", format_json_value: "json", auto_flag: "--auto" },
    },
    ensureQwenReady: async () => ({
      schema_version: "qwen-local-session-manager-result-v1",
      status: "READY",
      ready: true,
      profile: "qwen38-dcfr-iq3-agent-24k",
      model_id: "qwen38-dcfr-iq3-agent-24k",
      base_url: "http://127.0.0.1:8080",
      launch_performed: false,
      wait_elapsed_ms: 0,
      reason_code: "READY",
      launch_count: 0,
    }),
  },
);
check(
  "dispatch-fails-closed-fast-agent",
  dispatchBlocked.classification === "PROFILE_ROLE_UNQUALIFIED" &&
    dispatchBlocked.dispatch_ready === false &&
    dispatchBlocked.execution_performed === false &&
    dispatchBlocked.reason_codes.includes("ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION"),
  JSON.stringify({ c: dispatchBlocked.classification, codes: dispatchBlocked.reason_codes }),
);

// --- seam applicator embeds the gate ---

const seamSrc = readFileSync(
  resolve(ROOT, "tools/apply-v4-wf40-live-seam-v1.py"),
  "utf8",
);
check(
  "seam-embeds-role-gate",
  seamSrc.includes("ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION") &&
    seamSrc.includes("roleQualified=scope.role!=='FAST_AGENT'"),
  "seam gate",
);

for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
}
const failed = results.filter((r) => !r.pass);
console.log(
  JSON.stringify({
    ok: failed.length === 0,
    classification: failed.length === 0 ? "PASS" : "FAIL",
    passed: results.filter((r) => r.pass).length,
    failed: failed.length,
    total: results.length,
  }),
);
process.exit(failed.length === 0 ? 0 : 1);
