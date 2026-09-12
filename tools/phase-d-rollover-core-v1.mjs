#!/usr/bin/env node
/**
 * Phase D bounded core: generation fence + context delta (v2).
 *
 * BLOCK-ID: V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2
 *
 * Generation fence: a generation is CURRENT only when EVERY identity field
 * matches the active state exactly. Any stale/superseded identity is rejected
 * pre-dispatch (DISPATCH_ALLOWED=NO, HERMES_HANDLER_INVOKED=NO).
 *
 * Context delta: bounded machine-readable continuation state with strict
 * schema, strict size bound, and an integrity hash bound to the generation
 * identity. Stale/wrong-base/wrong-run/tampered deltas are rejected.
 */

import { createHash } from "node:crypto";

export const PHASE_D_DELTA_SCHEMA = "hermes-phase-d-context-delta-v2";
export const PHASE_D_DELTA_MAX_BYTES = 4096;
export const PHASE_D_IDENTITY_FIELDS = Object.freeze([
  "task_ref",
  "base_head",
  "phase_d_run_id",
  "chat_id",
  "nonce",
  "generation_id",
]);

/** Canonical identity record builder (all six fields required, non-empty). */
export function buildIdentity(fields) {
  const out = {};
  for (const f of PHASE_D_IDENTITY_FIELDS) {
    const v = fields?.[f];
    if (typeof v !== "string" || v.length === 0) {
      throw new Error(`IDENTITY_FIELD_MISSING:${f}`);
    }
    out[f] = v;
  }
  return Object.freeze(out);
}

/**
 * STALE GENERATION FENCE.
 * Returns true only when every identity field matches the active state.
 * No prefix matching, no partial matching, no generation ordering heuristics.
 */
export function isGenerationCurrent(activeIdentity, candidateIdentity) {
  if (!activeIdentity || !candidateIdentity) return false;
  for (const f of PHASE_D_IDENTITY_FIELDS) {
    if (activeIdentity[f] !== candidateIdentity[f]) return false;
  }
  return true;
}

/** Fence decision envelope (bounded, sanitized). */
export function fenceDecision(activeIdentity, candidateIdentity) {
  const current = isGenerationCurrent(activeIdentity, candidateIdentity);
  const mismatched = current ? [] : PHASE_D_IDENTITY_FIELDS.filter(
    (f) => activeIdentity?.[f] !== candidateIdentity?.[f],
  );
  return Object.freeze({
    generation_current: current,
    dispatch_allowed: current,
    hermes_handler_invoked: false, // fence never invokes anything
    mismatched_fields: mismatched,
  });
}

/** Deterministic JSON (sorted keys) for integrity hashing. */
function canonicalJson(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalJson).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

export function sha256Hex(s) {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * BOUNDED CONTEXT DELTA builder.
 * Contains ONLY the canonical continuation state required for Chat N+1.
 */
export function buildContextDelta({ taskRef, baseHead, phaseDRunId, sourceIdentity, canonicalNext, createdAt }) {
  const fields = {
    schema_version: PHASE_D_DELTA_SCHEMA,
    task_ref: taskRef,
    base_head: baseHead,
    phase_d_run_id: phaseDRunId,
    source_chat_id: sourceIdentity.chat_id,
    source_nonce: sourceIdentity.nonce,
    source_generation_id: sourceIdentity.generation_id,
    canonical_next: canonicalNext,
    created_at: createdAt ?? new Date().toISOString(),
  };
  const integrity = sha256Hex(canonicalJson({ ...fields, salt: phaseDRunId }));
  const delta = { ...fields, integrity };
  const bytes = Buffer.byteLength(JSON.stringify(delta), "utf8");
  if (bytes > PHASE_D_DELTA_MAX_BYTES) {
    throw new Error(`DELTA_OVERSIZE:${bytes}`);
  }
  return Object.freeze({ delta: Object.freeze(delta), bytes });
}

const DELTA_ALLOWED_FIELDS = new Set([
  "schema_version", "task_ref", "base_head", "phase_d_run_id",
  "source_chat_id", "source_nonce", "source_generation_id",
  "canonical_next", "created_at", "integrity",
]);

/**
 * CONTEXT DELTA FENCE.
 * Rejects: unexpected/missing fields, oversize, schema mismatch, tampered
 * integrity, and any delta whose identity fields do not match the active
 * state (stale/superseded generation delta can never bootstrap Chat N+1).
 */
export function validateContextDelta(delta, { activeIdentity, taskRef, baseHead, phaseDRunId }) {
  const fail = (reason) => ({ valid: false, reason });
  if (!delta || typeof delta !== "object") return fail("DELTA_NOT_OBJECT");
  const keys = Object.keys(delta);
  for (const k of keys) {
    if (!DELTA_ALLOWED_FIELDS.has(k)) return fail(`UNEXPECTED_FIELD:${k}`);
  }
  for (const k of DELTA_ALLOWED_FIELDS) {
    if (!(k in delta)) return fail(`MISSING_FIELD:${k}`);
  }
  const bytes = Buffer.byteLength(JSON.stringify(delta), "utf8");
  if (bytes > PHASE_D_DELTA_MAX_BYTES) return fail(`DELTA_OVERSIZE:${bytes}`);
  if (delta.schema_version !== PHASE_D_DELTA_SCHEMA) return fail("SCHEMA_MISMATCH");
  if (delta.task_ref !== taskRef) return fail("TASK_REF_MISMATCH");
  if (delta.base_head !== baseHead) return fail("WRONG_BASE_DELTA");
  if (delta.phase_d_run_id !== phaseDRunId) return fail("WRONG_RUN_DELTA");
  const expected = sha256Hex(canonicalJson({
    schema_version: delta.schema_version,
    task_ref: delta.task_ref,
    base_head: delta.base_head,
    phase_d_run_id: delta.phase_d_run_id,
    source_chat_id: delta.source_chat_id,
    source_nonce: delta.source_nonce,
    source_generation_id: delta.source_generation_id,
    canonical_next: delta.canonical_next,
    created_at: delta.created_at,
    salt: delta.phase_d_run_id,
  }));
  if (expected !== delta.integrity) return fail("TAMPERED_INTEGRITY");
  if (activeIdentity) {
    if (delta.source_chat_id !== activeIdentity.chat_id) return fail("STALE_CHAT_DELTA");
    if (delta.source_nonce !== activeIdentity.nonce) return fail("STALE_NONCE_DELTA");
    if (delta.source_generation_id !== activeIdentity.generation_id) return fail("STALE_GENERATION_DELTA");
  }
  return { valid: true, reason: null, bytes };
}
