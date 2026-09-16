#!/usr/bin/env node
/**
 * V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — canonical actionable gate contract v1.
 *
 * ONE canonical gate decision: the runtime/dispatcher that produces a
 * HUMAN_GATE_REQUIRED result may attach an actionable bounded choice set
 * (operator_action_choices) to the existing gate evidence. This module owns
 * the shared additive contract consumed by Telegram (#87), the dashboard
 * (#86) and WF90 normalization. It NEVER invents choices and NEVER decides.
 *
 * Two valid modes:
 *   MODE A (informational): no canonical choices -> notify only, no buttons.
 *   MODE B (actionable):    non-empty canonical choices -> bounded buttons.
 *
 * Field law: choice labels/buttons are derived 1:1 from canonical choices.
 * Callback values bind choice+gate identity (hmac) so arbitrary callback
 * text is never authorization. Freshness/TTL, one-shot consumption and
 * gate identity are enforced by canonical gate-core state (admitGateCallback),
 * here mirrored as pure validation helpers for adapters.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const ACTIONABLE_GATE_CONTRACT_SCHEMA = "v4-actionable-gate-contract-v1";

/** Canonical bounded choice vocabulary for actionable gates (proven A/B/C). */
export const CANONICAL_GATE_CHOICES = ["APPROVE_AND_CONTINUE", "STOP", "DEFER"];
/** Canonical choice -> ACP option letter (gate-core A/B/C fence reuse). */
export const CHOICE_TO_OPTION = { APPROVE_AND_CONTINUE: "A", STOP: "B", DEFER: "C" };
export const OPTION_TO_CHOICE = { A: "APPROVE_AND_CONTINUE", B: "STOP", C: "DEFER" };

export const ACTIONABLE_GATE_SOURCES = ["LOCAL_DEV_DISPATCHER", "WF90_TICK", "QUALIFICATION"];

function bounded(v, max) {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

/**
 * Normalize canonical gate evidence into the shared actionable-gate contract.
 * Returns null when the evidence cannot carry a bounded actionable contract
 * (MODE A informational gates keep using the existing notification path).
 * MODE B requires: gate_id, task_ref, choice set ⊆ canonical vocabulary,
 * and a bounded TTL when the runtime defines one.
 */
export function buildActionableGateContract(evidence = {}) {
  const classification = bounded(evidence.classification, 120);
  const reasonCode = Array.isArray(evidence.reason_codes) && evidence.reason_codes.length
    ? bounded(evidence.reason_codes[0], 120)
    : null;
  const rawChoices = Array.isArray(evidence.operator_action_choices) ? evidence.operator_action_choices : [];
  const choices = [...new Set(rawChoices.map((c) => String(c).trim()).filter(Boolean))];
  const canonicalChoices = choices.filter((c) => CANONICAL_GATE_CHOICES.includes(c));
  // Authority law: a partial/unknown choice set is NOT silently trimmed —
  // either every choice is canonical, or the gate stays informational.
  const actionable = choices.length > 0 && canonicalChoices.length === choices.length;

  const contract = {
    schema_version: ACTIONABLE_GATE_CONTRACT_SCHEMA,
    mode: actionable ? "ACTIONABLE" : "INFORMATIONAL",
    gate_id: bounded(evidence.gate_id, 120),
    task_ref: evidence.task_ref ?? null,
    classification,
    reason_code: reasonCode,
    gate_summary: bounded(evidence.gate_summary, 240),
    operator_action_summary: bounded(evidence.operator_action_summary, 240),
    operator_action_detail: bounded(evidence.operator_action_detail, 2000),
    operator_action_choices: actionable ? canonicalChoices : [],
    origin: ACTIONABLE_GATE_SOURCES.includes(evidence.origin) ? evidence.origin : null,
    created_at: bounded(evidence.created_at, 40),
    first_observed_at: bounded(evidence.first_observed_at, 40),
    expires_at: bounded(evidence.expires_at, 40),
    requires_confirmation: evidence.requires_confirmation === true,
    references: Array.isArray(evidence.references)
      ? evidence.references.slice(0, 5).map((r) => bounded(r, 200)).filter(Boolean)
      : [],
  };
  if (!contract.gate_id || !classification) return null;
  return contract;
}

/**
 * Stable actionable signature for WF90 dedupe (extends the #84 five-field
 * alert signature with the canonical choice set + confirmation flag so a
 * changed CHOICE SET is a new actionable episode).
 */
export function actionableGateSignature(contract) {
  if (!contract || contract.mode !== "ACTIONABLE") return null;
  return JSON.stringify({
    gate_id: contract.gate_id,
    task_ref: contract.task_ref,
    classification: contract.classification,
    reason_code: contract.reason_code,
    choices: contract.operator_action_choices,
    requires_confirmation: contract.requires_confirmation,
  });
}

/**
 * Callback value binding: <gate_id>:<CHOICE> authenticated with an hmac tag.
 * Telegram button callback_data stays within the 64-byte limit for bounded
 * gate ids; validation is constant-time.
 */
export function signCallbackValue({ gateId, choice, secret, nowMs }) {
  if (!gateId || !CANONICAL_GATE_CHOICES.includes(choice) || !secret) return null;
  const epoch = Math.floor(Number(nowMs ?? Date.now()) / 1000);
  const payload = `${gateId}|${choice}|${epoch}`;
  const tag = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return `ag:${gateId}:${choice}:${epoch}:${tag}`;
}

export function verifyCallbackValue({ value, secret, maxAgeSec = 24 * 3600, nowMs = Date.now() }) {
  const parts = String(value ?? "").split(":");
  if (parts.length !== 5 || parts[0] !== "ag") return { ok: false, reason: "CALLBACK_MALFORMED" };
  const [, gateId, choice, epochStr, tag] = parts;
  if (!CANONICAL_GATE_CHOICES.includes(choice)) return { ok: false, reason: "CHOICE_UNKNOWN" };
  const epoch = Number(epochStr);
  if (!Number.isInteger(epoch)) return { ok: false, reason: "CALLBACK_MALFORMED" };
  const expected = createHmac("sha256", secret).update(`${gateId}|${choice}|${epoch}`).digest("hex").slice(0, 16);
  const a = Buffer.from(tag);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "CALLBACK_TAG_INVALID" };
  if (maxAgeSec > 0 && Math.floor(nowMs / 1000) - epoch > maxAgeSec) return { ok: false, reason: "CALLBACK_EXPIRED" };
  return { ok: true, gate_id: gateId, choice };
}
