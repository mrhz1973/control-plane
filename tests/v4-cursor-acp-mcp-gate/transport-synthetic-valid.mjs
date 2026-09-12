#!/usr/bin/env node
/**
 * Deterministic SYNTHETIC transport for bounded tests ONLY.
 * No Telegram, no network, no credentials. The "callback" is a local queued
 * fixture admitted through the same gate-law fences as a real callback.
 * Config via env:
 *   SYNTHetic via TEST_FIXTURE: option letter answered after NOTIFIED.
 */
export const name = "synthetic-test-v1";

export async function send({ decision }) {
  return { messageId: `synthetic-${decision.decision_id}` };
}

export async function waitAnswer({ decision }) {
  // Deterministic: operator answers option A (or env-forced letter) instantly.
  const option = process.env.TEST_SYNTHETIC_OPTION || "A";
  if (!["A", "B", "C"].includes(option)) return null;
  return { decision_id: decision.decision_id, option, update_id: Number(decision.created_at_ms ?? 0) || 4242000 };
}
