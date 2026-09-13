#!/usr/bin/env node
/**
 * Deterministic SYNTHETIC DELAYED transport for V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1 tests ONLY.
 * No Telegram, no network, no credentials.
 *
 * Simulates a human operator deciding AFTER a delay LONGER than the observed
 * vendor MCP tool-call watchdog (~60s): TEST_DELAYED_ANSWER_MS (default 60000).
 * In real (fast) test runs the delay is scaled down; semantics are identical.
 * waitAnswer resolves only after the delay with the env-selected option.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const name = "synthetic-delayed-test-v1";

export async function send({ decision }) {
  return { messageId: `synthetic-delayed-${decision.decision_id}` };
}

export async function waitAnswer({ decision }) {
  const delayMs = Number(process.env.TEST_DELAYED_ANSWER_MS) || 60000;
  await sleep(delayMs);
  const option = process.env.TEST_DELAYED_OPTION || "B";
  if (!["A", "B", "C"].includes(option)) {
    return { status: "ABORTED", class: "OPTION_INVALID", updates_seen: 0 };
  }
  const updateId = Number(decision.created_at_ms ?? 0) || 4242442;
  return { status: "ANSWERED", option, update_id: updateId, updates_seen: 1 };
}
