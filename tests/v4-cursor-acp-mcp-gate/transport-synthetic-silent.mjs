#!/usr/bin/env node
/**
 * Deterministic SYNTHETIC transport that never answers (TTL path / NO_ANSWER
 * and fail-closed proofs). No Telegram, no network, no credentials.
 * Returns the hardened wait contract: { status: "TIMEOUT", ... }.
 */
export const name = "synthetic-silent-test-v2";

export async function send({ decision }) {
  return { messageId: `synthetic-silent-${decision.decision_id}` };
}

export async function waitAnswer() {
  return { status: "TIMEOUT", class: "DEADLINE", updates_seen: 0 }; // operator never answers
}
