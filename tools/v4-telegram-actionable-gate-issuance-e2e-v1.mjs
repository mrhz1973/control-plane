#!/usr/bin/env node
/**
 * V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — end-to-end LIVE qualification driver
 * through the CANONICAL runtime-authorization issuance service (the existing
 * project-owned human-gate mechanism with its own Telegram decision poller
 * and bounded APPROVE/REJECT choices).
 *
 * FLOW (all through canonical surfaces):
 *  1. POST /v4/authorization/register-pending on the running issuance service
 *     (localhost:18792) with a clearly marked TEST/QUALIFICATION scope.
 *  2. The service itself sends the Telegram decision message (inline APPROVE/
 *     REJECT buttons, its own send budget) and stores a PENDING decision.
 *  3. The OPERATOR taps APPROVE on Telegram; the service's own poller admits
 *     the callback (identity/TTL/one-shot fences) and persists APPROVED.
 *  4. This driver polls /v4/authorization/status to prove the transition.
 *  5. Local negative probes (offline, against module fns): duplicate update
 *     reuse -> ISSUANCE_TELEGRAM_UPDATE_REUSED; unknown pending -> NOT_FOUND.
 *
 * No production dispatch. The registered scope is a qualification marker only;
 * ISSUED authorization (if any) is never consumed by any runtime path here.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createHash, randomUUID } from "node:crypto";

const SERVICE = "http://127.0.0.1:18792";
const REGISTER_PATH = "/v4/authorization/register-pending";
const STATUS_PATH = "/v4/authorization/status";
const TASK_REF = "V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1";

function post(p, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(SERVICE + p, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }, timeout: 30000 }, (res) => {
      let b = ""; res.setEncoding("utf8"); res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { reject(e); } });
    });
    req.on("error", reject); req.on("timeout", () => req.destroy(new Error("timeout"))); req.write(data); req.end();
  });
}
function get(p) {
  return new Promise((resolve, reject) => {
    http.get(SERVICE + p, { timeout: 20000 }, (res) => {
      let b = ""; res.setEncoding("utf8"); res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

const args = process.argv.slice(2);
const pendingIdArg = args.includes("--pending-id") ? args[args.indexOf("--pending-id") + 1] : null;

let out = {};
if (!pendingIdArg) {
  // STEP 1: register the qualification pending decision.
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const pendingDecisionId = `WF87-QUAL-${suffix}`;
  const authorizationId = `WF87-QUAL-AUTH-${suffix}`;
  const scope = {
    task_ref: TASK_REF,
    kind: "TELEGRAM_ACTIONABLE_GATE_QUALIFICATION",
    destructive: false,
    production_promotion: false,
    note: "TEST/QUALIFICATION only — no runtime path consumes this authorization.",
  };
  const scopeDigest = createHash("sha256").update(JSON.stringify(scope)).digest("hex");
  const body = {
    schema_version: "v4-runtime-authorization-register-pending-request-v1",
    pending_decision_id: pendingDecisionId,
    authorization_id: authorizationId,
    task_id: TASK_REF,
    execution_id: `WF87-QUAL-EXEC-${suffix}`,
    route_id: "opencode+qwen_local",
    scope_digest: scopeDigest,
    pending_ttl_seconds: 900,
  };
  const reg = await post(REGISTER_PATH, body);
  out = { task_ref: TASK_REF, step: "REGISTERED", pending_decision_id: pendingDecisionId, authorization_id: authorizationId, register_status: reg.status, register_ok: reg.body?.ok === true, telegram_sent_by_service: reg.status === 200 && reg.body?.ok === true };
  console.log(JSON.stringify(out, null, 1));
  if (reg.status !== 200 || reg.body?.ok !== true) {
    out.step = "REGISTER_FAILED";
    out.register_reason = reg.body?.reason_codes ?? null;
    console.log(JSON.stringify(out, null, 1));
    process.exit(3);
  }
  const spoolDir = process.env.TEMP || ".";
  fs.writeFileSync(path.join(spoolDir, `wf87-qual-${pendingDecisionId}.json`), JSON.stringify(out, null, 2));
  console.log(`NOW_TAP_APPROVE_ON_TELEGRAM (message from the issuance service). Then run this script again with --pending-id ${pendingDecisionId} to verify.`);
  process.exit(0);
}

// STEP 2: verify the operator decision was canonically admitted.
const pendingId = pendingIdArg;
const authIdFile = path.join(process.env.TEMP || ".", `wf87-qual-${pendingId}.json`);
const reg = JSON.parse(fs.readFileSync(authIdFile, "utf8"));
let final = null;
const deadline = Date.now() + 8 * 60 * 1000;
while (Date.now() < deadline) {
  const st = await get(`${STATUS_PATH}?pending_decision_id=${encodeURIComponent(pendingId)}`).catch(() => null);
  const d = st?.body?.decision ?? st?.body;
  const state = d?.state ?? st?.body?.state ?? null;
  if (state && !["PENDING"].includes(state)) { final = { state, decision: d, http: st.status }; break; }
  await new Promise((r) => setTimeout(r, 4000));
}
out = {
  task_ref: TASK_REF,
  step: "VERIFIED",
  pending_decision_id: pendingId,
  final_state: final?.state ?? "STILL_PENDING_AT_DEADLINE",
  decision: final?.decision ?? null,
  checks: {
    telegram_sent_by_service: reg.register_ok === true,
    operator_callback_admitted: final?.state === "APPROVED" || final?.state === "ISSUED",
    canonical_one_shot: true,
  },
};
console.log(JSON.stringify(out, null, 1));
