# V4_CURSOR_ACP_MCP_FINAL_E2E_PROMPT_TIMEOUT_CLEANUP_REPAIR_V1

TASK_REF: `V4_CURSOR_ACP_MCP_FINAL_E2E_PROMPT_TIMEOUT_CLEANUP_REPAIR_V1`
RESULT: **PASS** — `READY_FOR_FINAL_REAL_E2E=true` (real proof intentionally NOT run)
DATE: 2026-09-13 (Europe/Rome)
STARTING_HEAD: `0b04ecefb46a0b206631d9314edb6c67d4d00353`
BASE verified: HEAD = origin/main = STARTING_HEAD at precheck.

## Failure repaired

`UNHANDLED_PROMPT_TIMEOUT_BYPASSES_TERMINAL_CLEANUP` (RETRY2 STOP finding):

- `session/prompt` inherited the generic `RPC_TIMEOUT_MS=30000`;
- `promptPromise` had no rejection handler until its late `await` (after gate registration 120s + resolution TTL 15m+60s);
- an early rejection → default unhandledRejection → process termination OUTSIDE main try/finally → terminal keyboard deactivation and issuance restore bypassed.

## Repair (minimal, driver + one new pure helper)

New `tools/v4-cursor-acp-prompt-lifecycle-v1.mjs` (pure, unit-testable):
- `derivePromptTimeoutMs({registrationWindowMs, ttlMs, resolutionMarginMs, terminalMarginMs})` — human-wait-compatible, derived from gate lifecycle constants (120s + 900s + 60s + 60s = 18.5m), bounded, never infinite, validates inputs;
- `createPromptTracker(promise)` — IMMEDIATE rejection ownership at creation; observable `PENDING|FULFILLED|REJECTED`;
- `installUnhandledRejectionGuard()` — process-level safety net that records sanitized reasons and never rethrows (no rejection can kill the process outside the lifecycle); observable `triggered` flag.

Driver `tools/v4-cursor-acp-mcp-gate-telegram-e2e-v1.mjs`:
- `PROMPT_TIMEOUT_MS` derived via the helper from the canonical lifecycle constants (now named: `GATE_REGISTRATION_WINDOW_MS`, `GATE_RESOLUTION_MARGIN_MS`, `TERMINAL_MARGIN_MS`); `session/prompt` passes it explicitly (all other RPCs keep 30s);
- prompt Promise wrapped by `createPromptTracker` at creation;
- BOTH bounded polling loops (gate registration wait; operator/callback wait) observe `tracker.failed()` and `unhandledGuard.triggered` → controlled `stop()` fail-closed WITHOUT burning the full TTL;
- final `await promptPromise` wrapped: rejection → controlled `stop("PROMPT_FAILED", "PROMPT_AWAIT_REJECTED_…")` through main try/finally;
- terminal `finally` additionally flips a non-PASS outcome to STOP when the guard fired, then uninstalls the guard.

No semantic changes: official `agent.ps1`/shell:false launcher, exact-session law, session/load prohibition, single-send budget (`ACP_GATE_FINAL_PROOF_SCOPE` + `reserveFinalProofSendBudget`), `verifyExactGateConsumption` exact-option guard, cross-run active-keyboard registry, `deactivateFinalGateKeyboard` terminal wiring, issuance quiesce/restore (verified both directions), no default answer — all preserved (proven by T11–T18 + guards suite).

## Qualification evidence

New focused suite `tests/v4-cursor-acp-mcp-gate/prompt-timeout-cleanup-repair.mjs` — **19/19 PASS**:
- T1 session/prompt NOT default 30s (static contract: explicit `PROMPT_TIMEOUT_MS`, no generic);
- T2 timeout derived from lifecycle (sum law, covers TTL, bounded, input validation);
- T3 immediate rejection ownership (state machine PENDING→REJECTED, late await safe);
- T4 early reject before registration → STOP `PROMPT_FAILED` + finally reached + restore attempted + no-gate keyboard skip;
- T5 reject during registration wait → controlled STOP + finally;
- T6/T6b reject during operator wait → controlled STOP + currentGate keyboard deactivation attempted (G1) + finally;
- T7 prompt timeout (never settles) → bounded timer → controlled STOP + finally;
- T8 ACP-exit-style rejection → controlled STOP with `ACP_PROCESS_EXIT_BEFORE_RESPONSE_*` reason surfaced;
- T9 unhandledRejection guard observes an orphan rejection and keeps the process alive;
- T10 exception during callback wait → finally reached, restore attempted;
- T11 keyboard deactivation attempted iff currentGate (static wiring);
- T12 no-gate cleanup idempotent (never calls deactivator);
- T13 issuance restore attempted across reject/timeout/exception scenarios;
- T14 restore verification fail-closed (`RESTORE_NOT_VERIFIED` → STOP, static);
- T15 cleanup failure fail-closed (`KEYBOARD_DEACTIVATION` stage STOP, static);
- T16 single-send budget guard unchanged;
- T17 exact-option consumption guard unchanged;
- T18 cross-run stale-keyboard guard unchanged.

Aggregate evidence: `reports/runtime/cursor-acp/mcp-gate-prompt-timeout-repair-qualification.json`.

## Regressions

- MCP gate deterministic suite: **32/32 PASS** (incl. real `agent acp` wiring probe, same-session guard);
- Soak campaign: **319 iterations** — `VALID_CALLBACK_LOST=0`, `PROCESS_LEAKS=0`, `UNEXPECTED_EXCEPTIONS=0`, `READY_FOR_FINAL_REAL_E2E=true`;
- Final-proof guards suite: **PASS** (send budget, exact consumption fences, cross-run keyboard registry, official wrapper/cleanup);
- Post-run process audit: **0 orphan MCP servers**, exactly **1** canonical issuance instance.

## Hard walls honored

`REAL_TELEGRAM_SENDS=0` · `ACTIVE_GATE_MESSAGES=0` · `REAL_OPERATOR_CALLBACK=NOT_RUN` · no getUpdates · no production dispatch · no promotion · no OpenClaw · no D-0025 reopening · no OLD VPS mutation · no public CDP/noVNC/Funnel · no credential persistence · no vendor patch · no new architecture · no same-pass real E2E · no default operator answer.

## ACCEPTANCE

PROMPT_TIMEOUT_HUMAN_WAIT_COMPATIBLE=PASS · PROMPT_TIMEOUT_BOUNDED=PASS · PROMPT_REJECTION_IMMEDIATELY_OWNED=PASS · EARLY_REJECTION_FAIL_CLOSED=PASS · POLLING_OBSERVES_PROMPT_FAILURE=PASS · UNHANDLED_REJECTION_BYPASS=ELIMINATED · PROMPT_TIMEOUT_CLEANUP=PASS · ACP_EXIT_CLEANUP=PASS · TERMINAL_KEYBOARD_DEACTIVATION=PASS · ISSUANCE_RESTORE_GUARD=PASS · OFFICIAL_ACP_WRAPPER_IN_FINAL_DRIVER=PASS · SAME_SESSION_GUARDS=PASS · SINGLE_SEND_BUDGET_GUARD=PASS · EXACT_OPTION_CONSUMPTION_GUARD=PASS · CROSS_RUN_ACTIVE_KEYBOARD_GUARD=PASS · MCP_GATE_SUITE=PASS · PROCESS_LEAKS=0 · REAL_TELEGRAM_SENDS=0 · PRODUCTION_CHANGED=NO

**READY_FOR_FINAL_REAL_E2E=true**

NEXT: `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION` (not executed in this task).
