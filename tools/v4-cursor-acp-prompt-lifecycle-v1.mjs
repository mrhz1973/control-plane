/**
 * V4 Cursor ACP prompt lifecycle helpers v1.
 *
 * Bounded-repair scope: UNHANDLED_PROMPT_TIMEOUT_BYPASSES_TERMINAL_CLEANUP.
 *
 * Laws implemented here (pure, deterministic, unit-testable):
 *  1. PROMPT_TIMEOUT derivation — a session/prompt that legitimately blocks
 *     on a human gate must NOT use the generic short RPC timeout. Its bound
 *     is derived from the gate lifecycle constants it must survive:
 *     registration window + operator TTL + resolution margin + terminal
 *     margin. Bounded, never infinite, never an opaque magic number.
 *  2. IMMEDIATE REJECTION OWNERSHIP — the prompt Promise gets a rejection
 *     handler AT CREATION so a rejection during long bounded waits is
 *     captured, observable (PENDING/FULFILLED/REJECTED) and later awaited
 *     inside the controlled lifecycle instead of becoming an unhandled
 *     rejection that terminates the process outside main try/finally.
 *  3. SAFETY NET — a process-level unhandledRejection guard records the
 *     event sanitized and keeps the process alive so the canonical terminal
 *     lifecycle (ACP teardown → MCP reap → keyboard deactivation → issuance
 *     restore) still runs. Polling loops also observe the guard trigger.
 */

/**
 * Derive the human-wait-compatible session/prompt timeout from gate
 * lifecycle constants. All inputs must be positive finite numbers.
 */
export function derivePromptTimeoutMs({ registrationWindowMs, ttlMs, resolutionMarginMs, terminalMarginMs }) {
  const parts = { registrationWindowMs, ttlMs, resolutionMarginMs, terminalMarginMs };
  for (const [name, v] of Object.entries(parts)) {
    if (!Number.isFinite(v) || v <= 0) throw new Error(`PROMPT_TIMEOUT_INPUT_INVALID:${name}`);
  }
  return registrationWindowMs + ttlMs + resolutionMarginMs + terminalMarginMs;
}

/**
 * Attach immediate rejection ownership to a prompt promise and expose a
 * minimal observable state machine: PENDING → FULFILLED | REJECTED.
 * The original promise remains awaitable; the tracker only observes.
 */
export function createPromptTracker(promise) {
  if (!promise || typeof promise.then !== "function") throw new Error("PROMPT_TRACKER_INPUT_INVALID");
  const state = { state: "PENDING", value: undefined, error: null };
  promise.then(
    (value) => { state.state = "FULFILLED"; state.value = value; },
    (error) => { state.state = "REJECTED"; state.error = error; },
  );
  return {
    promise,
    getState: () => state.state,
    getValue: () => state.value,
    getError: () => state.error,
    failed: () => state.state === "REJECTED",
    settled: () => state.state !== "PENDING",
  };
}

/**
 * Install a process-level unhandledRejection safety net. Returns a guard
 * object whose `triggered` flag is observable from bounded polling loops;
 * the handler never rethrows, so no rejection can terminate the process
 * outside the controlled lifecycle. uninstall() restores prior behavior.
 */
export function installUnhandledRejectionGuard(onEvent = () => {}) {
  const guard = { triggered: false, reasons: [] };
  const handler = (reason) => {
    guard.triggered = true;
    guard.reasons.push(String(reason?.message ?? reason).slice(0, 160));
    try { onEvent(reason); } catch { /* observer must never break the net */ }
  };
  process.on("unhandledRejection", handler);
  guard.uninstall = () => { process.off("unhandledRejection", handler); };
  return guard;
}
