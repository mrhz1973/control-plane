/** Driver-side adapter around the canonical transport cleanup primitive. */
export async function deactivateFinalGateKeyboard({ decision, deactivate, observe = () => {} }) {
  if (!decision) {
    observe({ stage: "KEYBOARD_DEACTIVATION", skipped: true, reason: "NO_CURRENT_GATE" });
    return { ok: true, skipped: true };
  }
  const result = await deactivate({ decision });
  observe({ stage: "KEYBOARD_DEACTIVATION", decision_id: decision.decision_id, ok: result?.ok === true, deactivated: result?.deactivated === true, reason: result?.reason ?? null });
  if (!result?.ok) throw new Error(result?.reason || "ACTIVE_KEYBOARD_DEACTIVATION_FAILED");
  return result;
}
