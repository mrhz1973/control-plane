#!/usr/bin/env node
/**
 * Offline tests for build-v4-wf40-live-execution-sidecars-v1.
 * Zero network / model / Qwen / OpenCode / Telegram / store writes.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import {
  FIXED_AUTHORIZATION_SCOPE,
  CANONICAL_SCOPE_DIGEST,
  canonicalScopeDigest,
  buildRegisterPendingRequest,
  buildStatusRequest,
  buildDispatchReadySidecar,
  buildRuntimeAuthorizationFromStatus,
  buildLiveExecutionProposal,
  deriveAuthorizationIds,
  buildExecutionId,
  parseAuthorizationStatusPoll,
  STATUS_POLL_MAX,
  PENDING_TTL_SECONDS,
} from "../../tools/build-v4-wf40-live-execution-sidecars-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function loadValidPacket() {
  return JSON.parse(
    readFileSync(
      resolve(ROOT, "tests/opencode-execution-dispatch/fixtures/valid-packet.json"),
      "utf8",
    ).replace(/^\uFEFF/, ""),
  );
}

function routedResult() {
  return {
    schema_version: "execution-route-result-v1",
    request_id: "req-test",
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
}

function wrongRoute() {
  const r = routedResult();
  r.execution_route.route_id = "cursor+cloud";
  r.execution_route.implementer = "cursor";
  r.execution_route.model = "codex";
  return r;
}

function resourceStatus({ opencode = true, qwen = true } = {}) {
  const base = JSON.parse(
    readFileSync(
      resolve(ROOT, "configs/resources/status.fail-closed.json"),
      "utf8",
    ).replace(/^\uFEFF/, ""),
  );
  base.generated_at = new Date().toISOString();
  base.resources.opencode.available = opencode;
  base.resources.opencode.updated_at = base.generated_at;
  base.resources.qwen_local.available = qwen;
  base.resources.qwen_local.updated_at = base.generated_at;
  return base;
}

function futureIso(ms = 3_600_000) {
  return new Date(Date.now() + ms).toISOString();
}

function pastIso(ms = 3_600_000) {
  return new Date(Date.now() - ms).toISOString();
}

function waitedFromRegister(reg) {
  return {
    poll_count: 0,
    pending_decision_id: reg.pending_decision_id,
    authorization_id: reg.authorization_id,
    execution_id: reg.execution_id,
    pending_expires_at: futureIso(PENDING_TTL_SECONDS * 1000),
    status_request: buildStatusRequest(reg.pending_decision_id).request,
    dispatch_result: { classification: "DISPATCH_READY" },
  };
}

function simulatePollSequence(waited, responses, options = {}) {
  let state = { ...waited };
  let registerCalls = 0;
  const steps = [];
  for (const http_raw of responses) {
    const step = parseAuthorizationStatusPoll({
      waited: state,
      http_raw,
      poll_max: options.poll_max ?? STATUS_POLL_MAX,
      now_ms: options.now_ms ?? Date.now(),
    });
    if (step.register_request) registerCalls += 1;
    steps.push(step);
    state = {
      ...state,
      poll_count: step.poll_count,
      pending_decision_id: step.pending_decision_id,
      authorization_id: step.authorization_id,
      execution_id: step.execution_id,
      status_request: step.status_request,
      dispatch_result: step.dispatch_result,
    };
    if (step.terminal || step.issued) break;
  }
  return { steps, registerCalls, final: steps[steps.length - 1] ?? null };
}

async function main() {
  // Network/runtime call traps for case 18.
  const traps = [];
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    traps.push(["fetch", args[0]]);
    throw new Error("NETWORK_FORBIDDEN");
  };
  const origHttpRequest = http.request;
  const origHttpsRequest = https.request;
  const origNetConnect = net.connect;
  http.request = (...args) => {
    traps.push(["http.request"]);
    throw new Error("NETWORK_FORBIDDEN");
  };
  https.request = (...args) => {
    traps.push(["https.request"]);
    throw new Error("NETWORK_FORBIDDEN");
  };
  net.connect = (...args) => {
    traps.push(["net.connect"]);
    throw new Error("NETWORK_FORBIDDEN");
  };

  try {
    check(
      "canonical-scope-digest",
      canonicalScopeDigest() === CANONICAL_SCOPE_DIGEST &&
        Object.keys(FIXED_AUTHORIZATION_SCOPE).length === 11,
      `digest=${canonicalScopeDigest()}`,
    );

    const packet = loadValidPacket();
    const route = routedResult();
    const status = resourceStatus();

    const dispatchOk = await buildDispatchReadySidecar({
      execution_packet: packet,
      execution_route_result: route,
      resource_status: status,
      task_id: packet.task_id,
    });
    check(
      "1-valid-dispatch-ready",
      dispatchOk.ok === true &&
        dispatchOk.dispatch_result?.classification === "DISPATCH_READY" &&
        dispatchOk.dispatch_result?.dispatch_ready === true &&
        dispatchOk.dispatch_result?.execution_performed === false,
      JSON.stringify(dispatchOk.classification),
    );

    const missingPacket = await buildDispatchReadySidecar({
      execution_packet: null,
      execution_route_result: route,
      resource_status: status,
    });
    check(
      "2-missing-packet-fail-closed",
      missingPacket.ok === false && missingPacket.dispatch_result === null,
      missingPacket.classification,
    );

    const badRoute = await buildDispatchReadySidecar({
      execution_packet: packet,
      execution_route_result: wrongRoute(),
      resource_status: status,
    });
    check(
      "3-wrong-route-fail-closed",
      badRoute.ok === false && badRoute.dispatch_result === null,
      badRoute.classification,
    );

    const qwenDown = await buildDispatchReadySidecar({
      execution_packet: packet,
      execution_route_result: route,
      resource_status: resourceStatus({ opencode: true, qwen: false }),
    });
    check(
      "4-qwen-unavailable-fail-closed",
      qwenDown.ok === false && qwenDown.classification === "QWEN_LOCAL_UNAVAILABLE",
      qwenDown.classification,
    );

    const ocDown = await buildDispatchReadySidecar({
      execution_packet: packet,
      execution_route_result: route,
      resource_status: resourceStatus({ opencode: false, qwen: true }),
    });
    check(
      "5-opencode-unavailable-fail-closed",
      ocDown.ok === false && ocDown.classification === "OPENCODE_UNAVAILABLE",
      ocDown.classification,
    );

    const reg = buildRegisterPendingRequest({
      task_id: packet.task_id,
      packet_id: packet.packet_id,
    });
    const regKeys = Object.keys(reg.request || {}).sort();
    check(
      "6-register-exactly-8-keys",
      reg.ok === true &&
        regKeys.length === 8 &&
        JSON.stringify(regKeys) ===
          JSON.stringify([
            "authorization_id",
            "execution_id",
            "pending_decision_id",
            "pending_ttl_seconds",
            "route_id",
            "schema_version",
            "scope_digest",
            "task_id",
          ]),
      JSON.stringify(regKeys),
    );

    check(
      "7-register-pending-ttl-900",
      reg.request?.pending_ttl_seconds === 900,
      String(reg.request?.pending_ttl_seconds),
    );

    check(
      "8-register-no-authorization-scope",
      !Object.prototype.hasOwnProperty.call(reg.request || {}, "authorization_scope") &&
        !Object.prototype.hasOwnProperty.call(reg.request || {}, "scope"),
      "extra scope fields present",
    );

    const stReq = buildStatusRequest(reg.pending_decision_id);
    const stKeys = Object.keys(stReq.request || {}).sort();
    check(
      "9-status-exactly-2-keys",
      stReq.ok === true &&
        stKeys.length === 2 &&
        stKeys[0] === "pending_decision_id" &&
        stKeys[1] === "schema_version",
      JSON.stringify(stKeys),
    );

    const pendingAuth = buildRuntimeAuthorizationFromStatus({
      status_result: {
        ok: true,
        pending_decision_id: reg.pending_decision_id,
        authorization_id: reg.authorization_id,
        state: "PENDING",
        authorization_expires_at: futureIso(),
      },
      expected_pending_decision_id: reg.pending_decision_id,
      expected_authorization_id: reg.authorization_id,
    });
    check(
      "10-pending-no-runtime-auth",
      pendingAuth.ok === false && pendingAuth.runtime_authorization === null,
      pendingAuth.classification,
    );

    const rejectedAuth = buildRuntimeAuthorizationFromStatus({
      status_result: {
        ok: true,
        pending_decision_id: reg.pending_decision_id,
        authorization_id: reg.authorization_id,
        state: "REJECTED",
        authorization_expires_at: futureIso(),
      },
      expected_pending_decision_id: reg.pending_decision_id,
      expected_authorization_id: reg.authorization_id,
    });
    check(
      "11-rejected-no-runtime-auth",
      rejectedAuth.ok === false && rejectedAuth.runtime_authorization === null,
      rejectedAuth.classification,
    );

    const expiredState = buildRuntimeAuthorizationFromStatus({
      status_result: {
        ok: true,
        pending_decision_id: reg.pending_decision_id,
        authorization_id: reg.authorization_id,
        state: "EXPIRED",
        authorization_expires_at: pastIso(),
      },
      expected_pending_decision_id: reg.pending_decision_id,
      expected_authorization_id: reg.authorization_id,
    });
    check(
      "12-expired-state-no-runtime-auth",
      expiredState.ok === false && expiredState.runtime_authorization === null,
      expiredState.classification,
    );

    const mismatch = buildRuntimeAuthorizationFromStatus({
      status_result: {
        ok: true,
        pending_decision_id: reg.pending_decision_id,
        authorization_id: "AUTH-WF40-OTHER",
        state: "ISSUED",
        authorization_expires_at: futureIso(),
      },
      expected_pending_decision_id: reg.pending_decision_id,
      expected_authorization_id: reg.authorization_id,
    });
    check(
      "13-mismatched-authorization-id",
      mismatch.ok === false && mismatch.classification === "AUTHORIZATION_ID_MISMATCH",
      mismatch.classification,
    );

    const issued = buildRuntimeAuthorizationFromStatus({
      status_result: {
        ok: true,
        pending_decision_id: reg.pending_decision_id,
        authorization_id: reg.authorization_id,
        state: "ISSUED",
        authorization_expires_at: futureIso(),
      },
      expected_pending_decision_id: reg.pending_decision_id,
      expected_authorization_id: reg.authorization_id,
    });
    const authKeys = Object.keys(issued.runtime_authorization || {}).sort();
    check(
      "14-issued-active-envelope",
      issued.ok === true &&
        issued.runtime_authorization?.authorization_state === "ACTIVE" &&
        issued.runtime_authorization?.authorization_id === reg.authorization_id &&
        JSON.stringify(issued.runtime_authorization.scope) ===
          JSON.stringify(FIXED_AUTHORIZATION_SCOPE) &&
        JSON.stringify(authKeys) ===
          JSON.stringify([
            "authorization_id",
            "authorization_state",
            "route_id",
            "schema_version",
            "scope",
          ]),
      JSON.stringify(issued.classification),
    );

    const expiredAt = buildRuntimeAuthorizationFromStatus({
      status_result: {
        ok: true,
        pending_decision_id: reg.pending_decision_id,
        authorization_id: reg.authorization_id,
        state: "ISSUED",
        authorization_expires_at: pastIso(),
      },
      expected_pending_decision_id: reg.pending_decision_id,
      expected_authorization_id: reg.authorization_id,
    });
    check(
      "15-expired-authorization-expires-at",
      expiredAt.ok === false && expiredAt.classification === "AUTHORIZATION_EXPIRES_PAST",
      expiredAt.classification,
    );

    const a1 = buildRegisterPendingRequest({
      task_id: packet.task_id,
      packet_id: packet.packet_id,
    });
    const a2 = buildRegisterPendingRequest({
      task_id: packet.task_id,
      packet_id: packet.packet_id,
    });
    check(
      "16-deterministic-ids-stable",
      a1.pending_decision_id === a2.pending_decision_id &&
        a1.authorization_id === a2.authorization_id &&
        a1.execution_id === a2.execution_id,
      "unstable ids",
    );

    const other = buildRegisterPendingRequest({
      task_id: packet.task_id,
      packet_id: `${packet.packet_id}-OTHER`,
    });
    check(
      "17-different-packet-different-ids",
      other.ok === true &&
        other.pending_decision_id !== a1.pending_decision_id &&
        other.authorization_id !== a1.authorization_id &&
        other.execution_id !== a1.execution_id,
      "ids collided",
    );

    const proposal = await buildLiveExecutionProposal({
      task_id: packet.task_id,
      execution_packet: packet,
      execution_route_result: route,
      resource_status: status,
    });
    check(
      "18-helper-zero-network-runtime-calls",
      traps.length === 0 && proposal.ok === true && proposal.proposal_ready === true,
      traps.length ? JSON.stringify(traps) : "ok",
    );

    // Extra structural sanity on derived IDs.
    const exec = buildExecutionId(packet.task_id, packet.packet_id);
    const ids = deriveAuthorizationIds(exec.execution_id);
    check(
      "derived-id-prefixes",
      ids.pending_decision_id.startsWith("PEND-WF40-") &&
        ids.authorization_id.startsWith("AUTH-WF40-") &&
        exec.execution_id.startsWith("wf40:"),
      JSON.stringify(ids),
    );

    const regPoll = buildRegisterPendingRequest({
      task_id: packet.task_id,
      packet_id: packet.packet_id,
    });
    const waited = waitedFromRegister(regPoll);

    const transportErr = parseAuthorizationStatusPoll({
      waited,
      http_raw: { error: "ECONNRESET", statusCode: 503 },
    });
    check(
      "poll-1-http-transport-within-ttl-still-pending",
      transportErr.still_pending === true &&
        transportErr.terminal === false &&
        transportErr.issued === false,
      JSON.stringify(transportErr.classification),
    );

    const malformed = parseAuthorizationStatusPoll({
      waited,
      http_raw: "not-json",
    });
    check(
      "poll-2-malformed-within-ttl-still-pending",
      malformed.still_pending === true &&
        malformed.terminal === false &&
        malformed.issued === false,
      JSON.stringify(malformed.classification),
    );

    const seqIssued = simulatePollSequence(waited, [
      { error: "timeout" },
      {
        ok: true,
        pending_decision_id: regPoll.pending_decision_id,
        authorization_id: regPoll.authorization_id,
        state: "ISSUED",
        authorization_expires_at: futureIso(),
      },
    ]);
    check(
      "poll-3-transient-then-issued",
      seqIssued.final?.issued === true &&
        seqIssued.final?.authorization_id === regPoll.authorization_id &&
        seqIssued.steps.length === 2,
      JSON.stringify(seqIssued.final?.classification),
    );

    const seqRejected = simulatePollSequence(waited, [
      { error: "timeout" },
      {
        ok: true,
        pending_decision_id: regPoll.pending_decision_id,
        authorization_id: regPoll.authorization_id,
        state: "REJECTED",
      },
    ]);
    check(
      "poll-4-transient-then-rejected-terminal",
      seqRejected.final?.terminal === true &&
        seqRejected.final?.classification === "AUTHORIZATION_REJECTED",
      JSON.stringify(seqRejected.final?.classification),
    );

    const exhausted = simulatePollSequence(
      waited,
      Array.from({ length: 3 }, () => ({ error: "timeout" })),
      { poll_max: 3 },
    );
    check(
      "poll-5-transient-until-exhausted-fail-closed",
      exhausted.final?.terminal === true &&
        exhausted.final?.classification === "AUTHORIZATION_POLL_EXHAUSTED",
      JSON.stringify(exhausted.final?.classification),
    );

    check(
      "poll-6-no-second-register-in-poll-loop",
      seqIssued.registerCalls === 0 && exhausted.registerCalls === 0,
      `registerCalls=${seqIssued.registerCalls}`,
    );

    check(
      "poll-7-single-register-at-proposal-only",
      regPoll.ok === true &&
        buildRegisterPendingRequest({
          task_id: packet.task_id,
          packet_id: packet.packet_id,
        }).pending_decision_id === regPoll.pending_decision_id,
      "proposal register not stable",
    );
  } finally {
    globalThis.fetch = origFetch;
    http.request = origHttpRequest;
    https.request = origHttpsRequest;
    net.connect = origNetConnect;
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    JSON.stringify(
      {
        suite: "v4-wf40-live-execution-sidecars",
        total: results.length,
        passed: results.filter((r) => r.pass).length,
        failed: failed.length,
        results,
      },
      null,
      2,
    ),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(2);
});
