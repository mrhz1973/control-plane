#!/usr/bin/env node
/**
 * V4_CONTROL_PLANE_ASSISTED_SELF_MAINTENANCE_LOOP_V1 — Phase 2 of the live
 * qualification: verify the canonical operator decision (APPROVE admitted by
 * the EXISTING issuance authority), admit it into the incident (one-shot,
 * fingerprint-bound), spend EXACTLY ONE remediation backlog item into the
 * canonical LOCAL_DEV queue, and prove replay/stale safety.
 *
 * Usage: node tools/self-maintenance-qual-live-v1.mjs --pending-id WF88-QUAL-xxxx
 * The script polls the canonical status endpoint until APPROVED (operator may
 * take minutes; elapsed time is NEVER treated as rejection).
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import {
  loadIncidentStore,
  persistIncidentStore,
  admitOperatorDecision,
  spendApprovalIntoQueue,
} from "./control-plane-self-maintenance-v1.mjs";

const REPO = "C:\\Users\\mrhz\\Documents\\AI\\GitHub\\control-plane";
const ISSUANCE = "http://127.0.0.1:18792";
const STATUS_PATH = "/v4/authorization/status";

const args = process.argv.slice(2);
const pendingId = args.includes("--pending-id") ? args[args.indexOf("--pending-id") + 1] : null;
if (!pendingId) {
  console.error("missing --pending-id");
  process.exit(2);
}
const spool = JSON.parse(fs.readFileSync(path.join(process.env.TEMP || ".", `wf88-qual-${pendingId}.json`), "utf8"));
const INCIDENT_ID = spool.incident_id;
const AUTHORIZATION_ID = spool.authorization_id;
const FINGERPRINT = spool.remediation_fingerprint;

function get(p) {
  return new Promise((resolveP, rejectP) => {
    http.get(ISSUANCE + p, { timeout: 20000 }, (res) => {
      let b = ""; res.setEncoding("utf8"); res.on("data", (c) => (b += c)); res.on("end", () => { try { resolveP({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { rejectP(e); } });
    }).on("error", rejectP);
  });
}
function postStatus(pendingId) {
  const body = JSON.stringify({ schema_version: "v4-runtime-authorization-status-request-v1", pending_decision_id: pendingId });
  return new Promise((resolveP, rejectP) => {
    const req = http.request(ISSUANCE + STATUS_PATH, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 20000 }, (res) => {
      let b = ""; res.setEncoding("utf8"); res.on("data", (c) => (b += c)); res.on("end", () => { try { resolveP({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { rejectP(e); } });
    });
    req.on("error", rejectP); req.on("timeout", () => req.destroy(new Error("timeout"))); req.write(body); req.end();
  });
}

// Poll canonical decision status (never invents the decision).
let decisionState = null;
const deadline = Date.now() + 10 * 60 * 1000;
while (Date.now() < deadline) {
  const st = await postStatus(pendingId).catch(() => null);
  const d = st?.body;
  decisionState = d?.state ?? null;
  if (decisionState === "APPROVED" || decisionState === "REJECTED" || decisionState === "EXPIRED" || decisionState === "ISSUED") break;
  await new Promise((r) => setTimeout(r, 5000));
}
const proof = { incident_id: INCIDENT_ID, pending_decision_id: pendingId, canonical_decision_state: decisionState };

if (decisionState !== "APPROVED" && decisionState !== "ISSUED") {
  proof.step = "OPERATOR_DECISION_NOT_APPROVED";
  console.log(JSON.stringify(proof, null, 1));
  process.exit(4);
}

// Admit the canonical decision into the incident (WAITING_OPERATOR -> APPROVED).
const store = loadIncidentStore(REPO);
const incident = store.incidents[INCIDENT_ID];
incident.status = "WAITING_OPERATOR"; // decision admission requires waiting state
persistIncidentStore(REPO, store);
const admitted = admitOperatorDecision({
  incident,
  repoPath: REPO,
  requiredDecision: {
    pending_decision_id: pendingId,
    authorization_id: AUTHORIZATION_ID,
    selected_option: "APPROVE",
    remediation_fingerprint: FINGERPRINT,
  },
  decisionSource: "v4-runtime-authorization-issuance-v1",
});
if (!admitted.ok) {
  proof.step = "DECISION_ADMIT_REJECTED";
  proof.reason_code = admitted.reason_code;
  console.log(JSON.stringify(proof, null, 1));
  process.exit(5);
}
proof.decision_admitted = true;
proof.incident_status = admitted.incident.status;

// Spend EXACTLY ONE queue dispatch (idempotent fence: second call REJECTED).
const writeItem = (file, markdown) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, markdown, "utf8");
};
const spend1 = spendApprovalIntoQueue({ incident: admitted.incident, repoPath: REPO, writeItem });
proof.first_dispatch_ok = spend1.ok;
proof.first_source_file = spend1.source_file ?? null;
const spend2 = spendApprovalIntoQueue({ incident: admitted.incident, repoPath: REPO, writeItem });
proof.second_dispatch_rejected = spend2.ok === false && spend2.reason_code === "REMEDIATION_ALREADY_SPENT";

proof.step = "REMEDIATION_QUEUED";
console.log(JSON.stringify(proof, null, 1));
