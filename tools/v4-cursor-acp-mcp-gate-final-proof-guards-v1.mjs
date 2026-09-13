#!/usr/bin/env node
/** Pure, exact post-gate consumption law for the final live proof. */
export function verifyExactGateConsumption({ expectedOption, transcript }) {
  const lines = String(transcript ?? "").split(/\r?\n/)
    .filter((line) => line.startsWith("GATE_CONSUMPTION_JSON:"));
  if (lines.length !== 1) return { ok: false, reason: "CONSUMPTION_MARKER_COUNT_INVALID" };
  let marker;
  try { marker = JSON.parse(lines[0].slice("GATE_CONSUMPTION_JSON:".length)); }
  catch { return { ok: false, reason: "CONSUMPTION_MARKER_INVALID_JSON" }; }
  if (!marker || Object.keys(marker).length !== 2 || marker.continued_in_same_session !== true) {
    return { ok: false, reason: "CONSUMPTION_MARKER_SHAPE_INVALID" };
  }
  if (!['A', 'B', 'C'].includes(marker.operator_decision_consumed)) {
    return { ok: false, reason: "CONSUMPTION_OPTION_INVALID" };
  }
  if (marker.operator_decision_consumed !== expectedOption) {
    return { ok: false, reason: "CONSUMPTION_OPTION_MISMATCH", observed: marker.operator_decision_consumed };
  }
  return { ok: true, option: marker.operator_decision_consumed };
}
