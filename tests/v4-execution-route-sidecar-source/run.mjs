#!/usr/bin/env node
/**
 * Offline tests for build-v4-execution-routing-sidecars-v1.
 * No Qwen, session manager, provider, network, or workflow mutation.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildV4ExecutionRoutingSidecars,
  validateSidecarBundle,
  STATUS_MAX_AGE_MS,
  FAIL_CLOSED_STATUS_PATH,
  BUNDLE_SCHEMA,
} from "../../tools/build-v4-execution-routing-sidecars-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const FIX = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function validRoute(overrides = {}) {
  return {
    schema_version: "v4-execution-route-source-v1",
    task_id: "D-9999-T",
    source_backlog_path: "docs/runtime/BACKLOG_D9999_test.md",
    created_by: "gpt-web",
    technical_requirements: ["filesystem", "code_edit"],
    risk_level: "low",
    ...overrides,
  };
}

function baseInputs(overrides = {}) {
  return {
    task_id: "D-9999-T",
    backlog_path: "docs/runtime/BACKLOG_D9999_test.md",
    backlog_commit: "abc123deadbeef",
    risk_hint: "low",
    route_source_path: "docs/runtime/EXECUTION_ROUTE_D-9999-T.json",
    route_source_commit: "abc123deadbeef",
    route_source: validRoute(),
    ...overrides,
  };
}

function freshStatus(nowMs, ageMs = 0) {
  const generated = new Date(nowMs - ageMs).toISOString();
  return {
    schema_version: "resource-status-v1",
    generated_at: generated,
    resources: {
      opencode: {
        available: true,
        quota_remaining: { value: 100, unit: "calls" },
        reserve_floor: { value: 0, unit: "none" },
        reset_at: null,
        cost_mode: "free",
        location: "local",
        source: "manual",
        updated_at: generated,
      },
      qwen_local: {
        available: true,
        quota_remaining: { value: 100, unit: "calls" },
        reserve_floor: { value: 0, unit: "none" },
        reset_at: null,
        cost_mode: "free",
        location: "local",
        source: "manual",
        updated_at: generated,
      },
    },
  };
}

const NOW = Date.parse("2026-08-30T15:00:00.000Z");
const BASELINE = JSON.parse(
  readFileSync(FAIL_CLOSED_STATUS_PATH, "utf8").replace(/^\uFEFF/, ""),
);

async function run() {
  // 1 valid + fresh status
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), status: freshStatus(NOW, 10_000) },
      { nowMs: NOW },
    );
    check(
      "valid-route-fresh-status-pass",
      r.ok === true &&
        r.classification === "PASS_SIDECARS_READY" &&
        r.status_source === "explicit_transient" &&
        r.status_classification === "RESOURCE_STATUS_EXPLICIT_FRESH",
      JSON.stringify({ c: r.classification, ss: r.status_source }),
    );
    // 2 request_id == task_id
    check(
      "request-id-equals-task-id",
      r.execution_route_request?.request_id === "D-9999-T",
      String(r.execution_route_request?.request_id),
    );
    // 3 technical_requirements verbatim
    check(
      "technical-requirements-verbatim",
      JSON.stringify(r.execution_route_request?.technical_requirements) ===
        JSON.stringify(["filesystem", "code_edit"]),
      JSON.stringify(r.execution_route_request?.technical_requirements),
    );
    // 4 risk verbatim
    check(
      "risk-verbatim",
      r.execution_route_request?.risk_level === "low",
      String(r.execution_route_request?.risk_level),
    );
    // 24 bundle schema
    const vs = await validateSidecarBundle(r);
    check("bundle-schema-valid", vs.ok === true, JSON.stringify(vs.reason_codes));
  }

  // 5 missing route source
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), route_source: null },
      { nowMs: NOW },
    );
    check(
      "missing-route-source-fail-closed",
      r.ok === false &&
        r.classification === "ROUTE_SOURCE_MISSING" &&
        r.execution_route_request === null &&
        r.resource_status === null,
      r.classification,
    );
  }

  // 6 malformed route source
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), route_source: { schema_version: "nope" } },
      { nowMs: NOW },
    );
    check(
      "malformed-route-source-fail-closed",
      r.ok === false && r.classification === "ROUTE_SOURCE_SCHEMA_INVALID",
      r.classification,
    );
  }

  // 7 task mismatch
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), task_id: "OTHER-TASK" },
      { nowMs: NOW },
    );
    check(
      "task-mismatch-fail-closed",
      r.ok === false && r.classification === "ROUTE_SOURCE_TASK_MISMATCH",
      r.classification,
    );
  }

  // 8 backlog path mismatch
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), backlog_path: "docs/runtime/BACKLOG_OTHER.md" },
      { nowMs: NOW },
    );
    check(
      "backlog-path-mismatch-fail-closed",
      r.ok === false && r.classification === "ROUTE_SOURCE_BACKLOG_MISMATCH",
      r.classification,
    );
  }

  // 9 risk mismatch
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), risk_hint: "high" },
      { nowMs: NOW },
    );
    check(
      "risk-mismatch-fail-closed",
      r.ok === false && r.classification === "ROUTE_SOURCE_RISK_MISMATCH",
      r.classification,
    );
  }

  // 10 commit mismatch
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), route_source_commit: "differentcommit" },
      { nowMs: NOW },
    );
    check(
      "commit-mismatch-fail-closed",
      r.ok === false && r.classification === "ROUTE_SOURCE_COMMIT_MISMATCH",
      r.classification,
    );
  }

  // 11 unsupported capability
  {
    const r = await buildV4ExecutionRoutingSidecars(
      {
        ...baseInputs(),
        route_source: validRoute({ technical_requirements: ["filesystem", "telepathy"] }),
      },
      { nowMs: NOW },
    );
    check(
      "unsupported-capability-fail-closed",
      r.ok === false &&
        r.classification === "ROUTE_SOURCE_SCHEMA_INVALID" &&
        r.reason_codes.includes("UNSUPPORTED_CAPABILITY"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 12 created_by != gpt-web
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), route_source: validRoute({ created_by: "human" }) },
      { nowMs: NOW },
    );
    check(
      "created-by-not-gpt-web-fail-closed",
      r.ok === false &&
        r.classification === "ROUTE_SOURCE_SCHEMA_INVALID" &&
        r.reason_codes.includes("CREATED_BY_NOT_GPT_WEB"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 13 missing explicit status -> baseline
  {
    const r = await buildV4ExecutionRoutingSidecars(baseInputs(), { nowMs: NOW });
    check(
      "missing-status-baseline-fallback",
      r.ok === true &&
        r.classification === "PASS_SIDECARS_READY" &&
        r.status_source === "fail_closed_baseline" &&
        r.status_classification === "RESOURCE_STATUS_FAIL_CLOSED_BASELINE" &&
        JSON.stringify(r.resource_status) === JSON.stringify(BASELINE),
      `${r.status_source}/${r.status_classification}`,
    );
  }

  // 14 malformed explicit status -> baseline
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), status: { schema_version: "nope" } },
      { nowMs: NOW },
    );
    check(
      "malformed-status-baseline-fallback",
      r.ok === true &&
        r.status_source === "fail_closed_baseline" &&
        r.reason_codes.includes("STATUS_SCHEMA_INVALID"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 15 stale >300s -> baseline
  {
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), status: freshStatus(NOW, STATUS_MAX_AGE_MS + 1) },
      { nowMs: NOW },
    );
    check(
      "stale-status-baseline-fallback",
      r.ok === true &&
        r.status_source === "fail_closed_baseline" &&
        r.reason_codes.includes("STATUS_STALE"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 16 exactly 300s old -> accepted
  {
    const st = freshStatus(NOW, STATUS_MAX_AGE_MS);
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), status: st },
      { nowMs: NOW },
    );
    check(
      "exactly-300s-accepted",
      r.ok === true &&
        r.status_source === "explicit_transient" &&
        r.status_classification === "RESOURCE_STATUS_EXPLICIT_FRESH",
      `${r.status_source}/${r.status_classification}`,
    );
  }

  // 17 future-dated -> baseline
  {
    const future = freshStatus(NOW + 60_000, 0);
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), status: future },
      { nowMs: NOW },
    );
    check(
      "future-dated-baseline-fallback",
      r.ok === true &&
        r.status_source === "fail_closed_baseline" &&
        r.reason_codes.includes("STATUS_FUTURE_DATED"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 18 secret-like explicit status -> baseline
  {
    const st = freshStatus(NOW, 1000);
    st.resources.opencode.source = "manual";
    st._note = "Bearer sk-abcdefghijklmnopqrstuvwxyz0123456789";
    // resource-status schema forbids additionalProperties at top level, so this
    // may already be schema-invalid; also inject secret into a string field that
    // would pass schema if we put it in a resource's source incorrectly.
    // Use a valid schema with secret embedded in a way that still validates:
    // put token-like text into an allowed string? source is enum. So secret check
    // must catch after schema OR we use a status that validates then has secret
    // in a nested string we add... schema additionalProperties false.
    // Approach: validate-passing status, then add secret via mutated generated_at? no.
    // Put secret in a resource field that is a free string - there is none.
    // Spec: secret-like explicit status -> baseline. Schema-invalid with secret
    // string as extra property fails schema first; still baseline. Also test
    // secret in JSON after forcing a string into known enum by using unknown
    // that fails schema. Better: call resolve with object that validates then
    // stringify includes Bearer by adding after schema would fail.
    // Simplest valid path: status that is schema-valid WITHOUT extra props, and
    // include Bearer in `resources.opencode.source` by temporarily relaxing —
    // can't. So use status that fails schema because of secret-bearing extra key
    // OR use hasSecretLike on a schema-valid object by putting sk- in unit? unit is enum.
    //
    // Practical approach matching contract: any secret-like material in serialized
    // form. Create schema-valid status, then the test injects a sibling field that
    // AJV rejects — that becomes STATUS_SCHEMA_INVALID baseline. Separately,
    // validate hasSecretLike with an object that passes schema if we put bearer
    // in a custom resource key name? resource keys are free (additionalProperties
    // of resources map to resourceStatus). Resource names can be anything.
    // Put secret in resource NAME? JSON.stringify would include it.
    const secretStatus = freshStatus(NOW, 1000);
    secretStatus.resources["Bearer sk-abcdefghijklmnopqrstuvwxyz012345"] = {
      available: false,
      quota_remaining: { value: null, unit: "unknown" },
      reserve_floor: { value: 0, unit: "none" },
      reset_at: null,
      cost_mode: "unknown",
      location: "unknown",
      source: "unknown",
      updated_at: secretStatus.generated_at,
    };
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), status: secretStatus },
      { nowMs: NOW },
    );
    check(
      "secret-like-status-baseline-fallback",
      r.ok === true &&
        r.status_source === "fail_closed_baseline" &&
        (r.reason_codes.includes("STATUS_SECRET_LIKE") ||
          r.reason_codes.includes("STATUS_SCHEMA_INVALID")),
      JSON.stringify(r.reason_codes),
    );
  }

  // 19 fail-closed baseline unchanged (timestamps not restamped)
  {
    const r = await buildV4ExecutionRoutingSidecars(baseInputs(), { nowMs: NOW });
    check(
      "fail-closed-baseline-unchanged",
      r.resource_status?.generated_at === BASELINE.generated_at &&
        r.resource_status?.resources?.opencode?.available === false &&
        r.resource_status?.resources?.qwen_local?.available === false,
      r.resource_status?.generated_at,
    );
  }

  // 20/21 no Qwen/session/provider/network imports in tool
  {
    const src = readFileSync(
      resolve(ROOT, "tools/build-v4-execution-routing-sidecars-v1.mjs"),
      "utf8",
    );
    check(
      "no-qwen-session-provider-network",
      !src.includes("qwen-local-session-manager") &&
        !src.includes("collect-qwen-local-resource-status") &&
        !src.includes("ensureQwenLocalReady") &&
        !src.includes("opencode-execution-adapter") &&
        !src.includes("fetch(") &&
        !src.includes("http://") &&
        !src.includes("https://"),
      "forbidden dependency found",
    );
  }

  // 22 no technical requirements synthesized (missing requirements fail)
  {
    const r = await buildV4ExecutionRoutingSidecars(
      {
        ...baseInputs(),
        route_source: {
          schema_version: "v4-execution-route-source-v1",
          task_id: "D-9999-T",
          source_backlog_path: "docs/runtime/BACKLOG_D9999_test.md",
          created_by: "gpt-web",
          risk_level: "low",
          // technical_requirements omitted — must not invent from goal/paths
        },
      },
      { nowMs: NOW },
    );
    check(
      "no-technical-requirements-synthesized",
      r.ok === false && r.execution_route_request === null,
      r.classification,
    );
  }

  // 23 CLI emits exactly one structural JSON
  {
    const b64 = (s) => Buffer.from(typeof s === "string" ? s : JSON.stringify(s)).toString("base64");
    const route = validRoute();
    const out = execFileSync(
      "node",
      [
        "tools/build-v4-execution-routing-sidecars-v1.mjs",
        "--task-id-b64", b64("D-9999-T"),
        "--backlog-path-b64", b64("docs/runtime/BACKLOG_D9999_test.md"),
        "--backlog-commit-b64", b64("abc123deadbeef"),
        "--risk-hint-b64", b64("low"),
        "--route-source-path-b64", b64("docs/runtime/EXECUTION_ROUTE_D-9999-T.json"),
        "--route-source-commit-b64", b64("abc123deadbeef"),
        "--route-source-b64", b64(route),
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    const lines = out.trim().split(/\r?\n/).filter(Boolean);
    const parsed = JSON.parse(lines[lines.length - 1]);
    check(
      "cli-one-json-result",
      lines.length === 1 &&
        parsed.schema_version === BUNDLE_SCHEMA &&
        parsed.ok === true &&
        parsed.classification === "PASS_SIDECARS_READY" &&
        parsed.status_source === "fail_closed_baseline",
      `${lines.length}/${parsed.classification}`,
    );
  }

  // fixture file load sanity
  {
    const fromDisk = JSON.parse(
      readFileSync(resolve(FIX, "route-source-valid.json"), "utf8"),
    );
    const r = await buildV4ExecutionRoutingSidecars(
      { ...baseInputs(), route_source: fromDisk },
      { nowMs: NOW },
    );
    check("fixture-route-source-pass", r.ok === true, r.classification);
  }

  const failed = results.filter((x) => !x.pass);
  const summary = {
    suite: "v4-execution-route-sidecar-source",
    root: ROOT,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
