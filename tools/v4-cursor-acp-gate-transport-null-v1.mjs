#!/usr/bin/env node
/**
 * NULL transport — REAL_TELEGRAM_SENDS=0 surface for harmless ACP
 * qualification ONLY (V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1).
 *
 * send(): no network, returns a synthetic messageId (the canonical store gets
 * NOTIFIED exactly as in production; no Telegram message exists anywhere).
 * waitAnswer(): long-polls ONLY the canonical gate store for an externally
 * admitted callback (e.g. driver-injected synthetic callback through
 * admitGateCallback in gate-core). It NEVER authorizes, never invents
 * options: if nothing is admitted before the deadline → TIME OUT (fail
 * closed). update_id must exist on the stored decision (fence).
 */
import fs from "node:fs";

export const name = "null-qualification-v1";

const SLEEP_MS = 500;

export async function send({ decision }) {
  // No I/O. messageId marks the null transport in the canonical store.
  return { messageId: `null-transport-${decision.decision_id}` };
}

export async function waitAnswer({ decision, deadlineMs }) {
  while (Date.now() < deadlineMs) {
    await new Promise((r) => setTimeout(r, SLEEP_MS));
    let store = null;
    try { store = JSON.parse(fs.readFileSync(process.env.ACP_GATE_STORE_PATH, "utf8")); } catch { continue; }
    const d = (store.decisions ?? []).find((x) => x.decision_id === decision.decision_id);
    if (!d) continue;
    if (d.null_transport_admitted_option) {
      // Option taken EXCLUSIVELY from the canonical store field that the
      // driver wrote through gate-core admission law (never invented here).
      return { status: "ANSWERED", option: d.null_transport_admitted_option, update_id: d.null_transport_admitted_update_id, updates_seen: 1 };
    }
  }
  return { status: "TIMEOUT", updates_seen: 0 };
}
