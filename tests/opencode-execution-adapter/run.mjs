#!/usr/bin/env node
/**
 * Offline tests for opencode-execution-adapter-v1.
 * Mock occupancy / guard / OpenCode runner. No opencode run. No Qwen. No providers.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  executeOpenCodeBounded,
  validateRuntimeAuthorization,
  RESULT_SCHEMA,
  REQUIRED_ROUTE_ID,
} from "../../tools/opencode-execution-adapter-v1.mjs";
import { FIXED_AUTHORIZATION_SCOPE_V2 } from "../../tools/qwen-execution-scope-v2.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function activeAuth(overrides = {}) {
  return {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: "AUTH-TEST-ACTIVE",
    authorization_state: "ACTIVE",
    spent: false,
    used: false,
    route_id: REQUIRED_ROUTE_ID,
    scope: { ...FIXED_AUTHORIZATION_SCOPE_V2 },
    ...overrides,
  };
}

function mockGuardFactory(accountingOverrides = {}) {
  const state = {
    closed: false,
    base_url: "http://127.0.0.1:59999",
    accounting: {
      upstream_generation_requests: 1,
      blocked_generation_requests: 0,
      ...accountingOverrides,
    },
  };
  const guard = {
    base_url: state.base_url,
    getAccounting: () => ({ ...state.accounting }),
    close: async () => {
      state.closed = true;
    },
    state,
  };
  return { guard, state };
}

function mockRunner(accountingOverrides = {}, captures = {}) {
  return async (ctx) => {
    captures.guardBaseUrl = ctx.guardBaseUrl;
    captures.modelId = ctx.modelId;
    captures.authorizationId = ctx.authorization?.authorization_id;
    return {
      opencode_execution_count: 1,
      qwen_generation_calls: 1,
      upstream_generation_requests: 1,
      retry_calls: 0,
      fallback_calls: 0,
      response_validation: true,
      ...accountingOverrides,
    };
  };
}

function resultHasSecretsOrBodies(result) {
  const text = JSON.stringify(result).toLowerCase();
  return (
    text.includes('"messages"') ||
    text.includes('"prompt"') ||
    text.includes("sk-") ||
    text.includes("secret") ||
    text.includes("bearer ")
  );
}

// AGG 2026-09-03: FAST_AGENT is UNQUALIFIED by default; mechanics tests inject
// a qualified-role gate to exercise guard/bounds paths that assume acceptance.
const qualifiedRoleGate = () => ({ ok: true, qualified: true, reason_codes: [] });

async function run() {
  // 0 AGG default: cryptographically valid auth with UNQUALIFIED role blocks
  {
    const { guard } = mockGuardFactory();
    const r = await executeOpenCodeBounded(
      { execution_id: "t0-agg", runtime_authorization: activeAuth(), message: "m" },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: mockRunner(),
      },
    );
    check(
      "agg-default-unqualified-role-blocks",
      r.classification === "AUTHORIZATION_REJECTED" &&
        r.reason_codes.includes("ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION") &&
        r.execution_performed === false &&
        r.guard_started === false &&
        r.opencode_execution_count === 0,
      JSON.stringify(r.reason_codes),
    );
  }

  // 1 missing authorization
  {
    const r = await executeOpenCodeBounded({ execution_id: "t1" }, {
      getOccupancy: async () => "QWEN_READY_IDLE",
      runOpenCode: mockRunner(),
    });
    check(
      "missing-auth-no-execution",
      r.classification === "AUTHORIZATION_REJECTED" &&
        r.execution_performed === false &&
        r.guard_started === false &&
        r.opencode_execution_count === 0,
      JSON.stringify(r.reason_codes),
    );
  }

  // 2 spent authorization
  {
    const r = await executeOpenCodeBounded(
      { execution_id: "t2", runtime_authorization: activeAuth({ spent: true }) },
      { getOccupancy: async () => "QWEN_READY_IDLE", runOpenCode: mockRunner() },
    );
    check(
      "spent-auth-no-execution",
      r.classification === "AUTHORIZATION_REJECTED" && r.execution_performed === false,
      JSON.stringify(r.reason_codes),
    );
  }

  // 3 malformed / over-broad
  {
    const overBroad = activeAuth({
      scope: { ...activeAuth().scope, max_opencode_executions: 5 },
    });
    const r = await executeOpenCodeBounded(
      { execution_id: "t3a", runtime_authorization: overBroad },
      { getOccupancy: async () => "QWEN_READY_IDLE", runOpenCode: mockRunner() },
    );
    const malformed = activeAuth({ schema_version: "wrong-schema" });
    const r2 = await executeOpenCodeBounded(
      { execution_id: "t3b", runtime_authorization: malformed },
      { getOccupancy: async () => "QWEN_READY_IDLE", runOpenCode: mockRunner() },
    );
    check(
      "overbroad-malformed-auth-no-execution",
      r.classification === "AUTHORIZATION_REJECTED" &&
        r2.classification === "AUTHORIZATION_REJECTED",
      JSON.stringify([r.reason_codes, r2.reason_codes]),
    );
  }

  // 4 wrong route
  {
    const wrongRoute = activeAuth({ route_id: "cursor+composer" });
    const r = await executeOpenCodeBounded(
      { execution_id: "t4", runtime_authorization: wrongRoute },
      { getOccupancy: async () => "QWEN_READY_IDLE", runOpenCode: mockRunner() },
    );
    check(
      "wrong-route-no-execution",
      r.classification === "AUTHORIZATION_REJECTED" && r.execution_performed === false,
      JSON.stringify(r.reason_codes),
    );
  }

  // 5/6 BUSY / UNCERTAIN
  {
    for (const occ of ["QWEN_BUSY_SHARED_RUNTIME", "QWEN_OCCUPANCY_UNCERTAIN"]) {
      const r = await executeOpenCodeBounded(
        { execution_id: "t56", runtime_authorization: activeAuth() },
        { getOccupancy: async () => occ, runOpenCode: mockRunner(), roleGate: qualifiedRoleGate },
      );
      check(
        `occupancy-${occ}-no-execution`,
        r.classification === "OCCUPANCY_BLOCKED" &&
          r.execution_performed === false &&
          r.guard_started === false,
        JSON.stringify(r.reason_codes),
      );
    }
  }

  // 7/8/9 valid path: guard constructed, target is guard, PASS
  {
    const { guard, state } = mockGuardFactory();
    const captures = {};
    const r = await executeOpenCodeBounded(
      { execution_id: "t9", runtime_authorization: activeAuth(), message: "m" },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: mockRunner({}, captures),
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "valid-execution-pass",
      r.status === "EXECUTED" &&
        r.execution_performed === true &&
        r.classification === "EXECUTED_OK" &&
        r.opencode_execution_count === 1 &&
        r.qwen_generation_calls === 1 &&
        r.guard_upstream_generation_requests === 1 &&
        r.response_validation === "VALID" &&
        r.authorization_state_final === "SPENT" &&
        r.schema_version === RESULT_SCHEMA,
      JSON.stringify(r),
    );
    check(
      "opencode-target-is-guard",
      captures.guardBaseUrl === guard.base_url &&
        captures.guardBaseUrl !== "http://127.0.0.1:8080" &&
        captures.guardBaseUrl.startsWith("http://127.0.0.1:"),
      String(captures.guardBaseUrl),
    );
    check("owned-guard-cleanup-on-pass", state.closed === true, String(state.closed));
    check("no-secret-body-persistence-pass", !resultHasSecretsOrBodies(r), JSON.stringify(r));
  }

  // 10 attempted second OpenCode execution
  {
    const { guard } = mockGuardFactory();
    const r = await executeOpenCodeBounded(
      { execution_id: "t10", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: mockRunner({ opencode_execution_count: 2 }),
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "second-opencode-fail-closed",
      r.classification === "EXECUTION_BOUNDS_VIOLATION" &&
        r.execution_performed === false &&
        r.reason_codes.includes("OPENCODE_EXECUTIONS_EXCEEDED"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 11 guard upstream > 1
  {
    const { guard } = mockGuardFactory({ upstream_generation_requests: 2 });
    const r = await executeOpenCodeBounded(
      { execution_id: "t11", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: mockRunner(),
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "guard-upstream-exceeded-fail-closed",
      r.classification === "EXECUTION_BOUNDS_VIOLATION" &&
        r.reason_codes.includes("GUARD_UPSTREAM_EXCEEDED") &&
        r.guard_upstream_generation_requests <= 1,
      JSON.stringify(r.reason_codes),
    );
  }

  // 12 qwen generations > 1
  {
    const { guard } = mockGuardFactory();
    const r = await executeOpenCodeBounded(
      { execution_id: "t12", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: mockRunner({ qwen_generation_calls: 2 }),
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "qwen-generations-exceeded-fail-closed",
      r.classification === "EXECUTION_BOUNDS_VIOLATION" &&
        r.reason_codes.includes("QWEN_GENERATIONS_EXCEEDED"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 13 retry/fallback > 0
  {
    const { guard } = mockGuardFactory();
    const rRetry = await executeOpenCodeBounded(
      { execution_id: "t13a", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: mockRunner({ retry_calls: 1 }),
        roleGate: qualifiedRoleGate,
      },
    );
    const { guard: g2 } = mockGuardFactory();
    const rFallback = await executeOpenCodeBounded(
      { execution_id: "t13b", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => g2,
        runOpenCode: mockRunner({ fallback_calls: 1 }),
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "retry-fallback-fail-closed",
      rRetry.reason_codes.includes("RETRY_NONZERO") &&
        rFallback.reason_codes.includes("FALLBACK_NONZERO") &&
        rRetry.classification === "EXECUTION_BOUNDS_VIOLATION",
      JSON.stringify([rRetry.reason_codes, rFallback.reason_codes]),
    );
  }

  // 15 owned guard cleanup on terminal failure
  {
    const { guard, state } = mockGuardFactory();
    const r = await executeOpenCodeBounded(
      { execution_id: "t15", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: mockRunner({ opencode_execution_count: 3 }),
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "owned-guard-cleanup-on-failure",
      r.classification === "EXECUTION_BOUNDS_VIOLATION" && state.closed === true,
      `${r.classification} closed=${state.closed}`,
    );
    check("no-secret-body-persistence-fail", !resultHasSecretsOrBodies(r), JSON.stringify(r));
  }

  // guard whose base_url equals direct :8080 must be rejected
  {
    const direct = {
      base_url: "http://127.0.0.1:8080",
      getAccounting: () => ({ upstream_generation_requests: 1, blocked_generation_requests: 0 }),
      close: async () => {},
    };
    const r = await executeOpenCodeBounded(
      { execution_id: "t-guard-direct", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => direct,
        runOpenCode: mockRunner(),
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "direct-qwen-endpoint-forbidden",
      r.classification === "EXECUTION_BOUNDS_VIOLATION" &&
        r.reason_codes.includes("GUARD_TARGET_IS_DIRECT_QWEN_ENDPOINT"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 17 default invocation: no runner => no execution
  {
    const r = await executeOpenCodeBounded(
      { execution_id: "t17", runtime_authorization: activeAuth() },
      { getOccupancy: async () => "QWEN_READY_IDLE", roleGate: qualifiedRoleGate },
    );
    check(
      "default-no-live-execution",
      r.classification === "RUNNER_NOT_PROVIDED" &&
        r.execution_performed === false &&
        r.guard_started === false,
      r.classification,
    );
  }

  // validator direct checks
  {
    check(
      "validator-accepts-active",
      validateRuntimeAuthorization(activeAuth()).ok === true,
    );
    check(
      "validator-rejects-boolean-true",
      validateRuntimeAuthorization(true).ok === false,
    );
    check(
      "validator-rejects-guard-not-required",
      validateRuntimeAuthorization(
        activeAuth({ scope: { ...activeAuth().scope, single_generation_guard_required: false } }),
      ).ok === false,
    );
  }

  // runner-throws-after-generation: guard accounting must remain authoritative
  {
    const { guard, state } = mockGuardFactory({ upstream_generation_requests: 1 });
    const r = await executeOpenCodeBounded(
      { execution_id: "t-runner-throw", runtime_authorization: activeAuth() },
      {
        getOccupancy: async () => "QWEN_READY_IDLE",
        guardStart: async () => guard,
        runOpenCode: async () => {
          throw new Error("runner crashed after generation");
        },
        roleGate: qualifiedRoleGate,
      },
    );
    check(
      "runner-throw-preserves-guard-accounting",
      r.classification === "EXECUTION_BOUNDS_VIOLATION" &&
        r.guard_upstream_generation_requests === 1 &&
        r.status === "ERROR" &&
        state.closed === true,
      JSON.stringify({
        c: r.classification,
        up: r.guard_upstream_generation_requests,
        closed: state.closed,
      }),
    );
  }

  // auth without schema_version must fail closed
  {
    const noSchema = { ...activeAuth() };
    delete noSchema.schema_version;
    const r = await executeOpenCodeBounded(
      { execution_id: "t-no-schema", runtime_authorization: noSchema },
      { getOccupancy: async () => "QWEN_READY_IDLE", runOpenCode: mockRunner() },
    );
    check(
      "missing-schema-version-fails-closed",
      r.classification === "AUTHORIZATION_REJECTED" &&
        r.reason_codes.includes("AUTH_SCHEMA_MISMATCH") &&
        r.execution_performed === false,
      JSON.stringify(r.reason_codes),
    );
  }

  const failed = results.filter((r) => !r.pass);
  const summary = {
    suite: "opencode-execution-adapter",
    root: ROOT,
    fixture: readFileSync(
      resolve(ROOT, "tests/opencode-execution-adapter/fixtures/note.txt"),
      "utf8",
    ).trim(),
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
