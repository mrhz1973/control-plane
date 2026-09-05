#!/usr/bin/env node
/**
 * V4_RT25_T16/T17 — runtime decision AUDIT writer (REAL runtime path).
 *
 * Campaign #41 tasks 16 (planner boundary) + 17 (execution boundary).
 * Persists machine-readable audit records for quota-aware decision envelopes:
 *   chosen route + all rejected candidates + reason codes + pool/freshness
 *   evidence. Records append as JSONL into the RUNTIME lane (untracked
 *   directory, default reports/runtime/dev-queue/rt25-audit/); Git-tracked
 *   paths are never written by the writer (outDir must be provided by the
 *   caller and tests use temp dirs). One audit record per decision id.
 *
 * Audit record law:
 *   - schema_version + audit boundary ("planner"|"execution");
 *   - decision envelope embedded VERBATIM (selected, admitted, rejected,
 *     pool_evaluations, economics_attachments, reason_codes);
 *   - pool_freshness_evidence derived per pool (state/freshness/evaluation);
 *   - sha256 of the canonical JSON for tamper evidence;
 *   - no secrets: secret-like patterns abort the write (fail closed).
 */

import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const AUDIT_SCHEMA = "v4-rt25-decision-audit-v1";

const SECRET_RE =
  /Bearer\s+[A-Za-z0-9._\-+=\/]{8,}|sk-[A-Za-z0-9]{10,}|"authorization"\s*:\s*"|api[_-]?key|password\s*[:=]|cookie\s*[:=]|session[_-]?token/i;

function canonicalJson(value) {
  return JSON.stringify(value);
}

/**
 * Build (not write) an audit record from a decision envelope.
 * Pure: same inputs → byte-identical record (except recorded_at from nowMs).
 */
export function buildDecisionAuditRecord(decision, boundary, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const base = {
    schema_version: AUDIT_SCHEMA,
    audit_boundary: boundary === "execution" ? "execution" : boundary === "planner" ? "planner" : null,
    decision_id: decision?.decision_id ?? null,
    decision_schema: decision?.schema_version ?? null,
    recorded_at: new Date(nowMs).toISOString(),
    decision: null,
    pool_freshness_evidence: {},
    decision_canonical_sha256: null,
    write_classification: null,
  };
  if (!decision || typeof decision !== "object" || !decision.schema_version) {
    return { ...base, write_classification: "AUDIT_REJECTED_ENVELOPE_INVALID" };
  }
  if (SECRET_RE.test(canonicalJson(decision))) {
    return { ...base, write_classification: "AUDIT_REJECTED_SECRET_LIKE" };
  }
  if (base.audit_boundary === null) {
    return { ...base, write_classification: "AUDIT_REJECTED_BOUNDARY_UNKNOWN" };
  }

  const pools = decision.pool_evaluations || {};
  const pool_freshness_evidence = {};
  for (const [poolId, evaln] of Object.entries(pools)) {
    pool_freshness_evidence[poolId] = {
      state: evaln?.state ?? null,
      freshness: evaln?.freshness ?? null,
      evaluation: evaln?.evaluation ?? null,
      remaining_percent: evaln?.remaining_percent ?? null,
    };
  }

  const decisionCanonical = canonicalJson(decision);
  return {
    ...base,
    decision,
    pool_freshness_evidence,
    decision_canonical_sha256: createHash("sha256").update(decisionCanonical).digest("hex"),
    write_classification: "AUDIT_RECORD_BUILT",
  };
}

/**
 * Append an audit record as JSONL into outDir. Returns { written, path, record }.
 * Fails closed: invalid/secret-like envelopes are returned with written=false.
 */
export function writeDecisionAudit(decision, boundary, outDir, options = {}) {
  const record = buildDecisionAuditRecord(decision, boundary, options);
  if (record.write_classification !== "AUDIT_RECORD_BUILT") {
    return { written: false, path: null, record };
  }
  const dir = resolve(outDir);
  mkdirSync(dir, { recursive: true });
  const path = resolve(dir, `${boundary}-decisions-audit.jsonl`);
  appendFileSync(path, `${canonicalJson(record)}\n`);
  return { written: true, path, record };
}

/** Planner boundary helper (T16). */
export function auditPlannerDecision(decision, outDir, options = {}) {
  return writeDecisionAudit(decision, "planner", outDir, options);
}

/** Execution boundary helper (T17). */
export function auditExecutionDecision(decision, outDir, options = {}) {
  return writeDecisionAudit(decision, "execution", outDir, options);
}
