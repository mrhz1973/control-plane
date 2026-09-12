#!/usr/bin/env node
/**
 * Deterministic SYNTHETIC transport that never answers (TTL path / NO_ANSWER
 * and fail-closed proofs). No Telegram, no network, no credentials.
 */
export const name = "synthetic-silent-test-v1";

export async function send({ decision }) {
  return { messageId: `synthetic-silent-${decision.decision_id}` };
}

export async function waitAnswer() {
  return null; // operator never answers within the bounded window
}
