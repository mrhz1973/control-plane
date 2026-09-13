#!/usr/bin/env node
/**
 * Deterministic SYNTHETIC transport for bounded tests ONLY.
 * No Telegram, no network, no credentials. The "callback" is a local queued
 * fixture admitted through the same gate-law fences as a real callback.
 * Returns the hardened wait contract: { status: "ANSWERED", option, update_id }.
 * Option via env TEST_SYNTHETIC_OPTION (A default).
 */
export const name = "synthetic-test-v2";

export async function send({ decision }) {
  return { messageId: `synthetic-${decision.decision_id}` };
}

export async function waitAnswer({ decision }) {
  const option = process.env.TEST_SYNTHETIC_OPTION || "A";
  if (!["A", "B", "C"].includes(option)) {
    return { status: "ABORTED", class: "OPTION_INVALID", updates_seen: 0 };
  }
  const updateId = Number(decision.created_at_ms ?? 0) || 4242000;
  return { status: "ANSWERED", option, update_id: updateId, updates_seen: 1 };
}
