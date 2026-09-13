# V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1 — bounded repair & READY state

TASK_REF: `V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1`
STATE: `READY_FOR_FINAL_REAL_E2E` — REAL Telegram E2E **intentionally pending operator return** (operator unavailable overnight; instructed NO further real gates, NO PASS claims from synthetic evidence).
BASE_HEAD: `3144b0cf0b7f3f5fb223871000e4bfab314797f6`
DATE: 2026-09-13 (Europe/Rome)

## What was proven BEFORE this repair (live, real)

- `MCP_TOOL_INVOCATION` — the model invoked `human_gate` inside a live ACP session (tool_call observed; spool `acp-mcp-gate-e2e-7a8aafd3996546aa`).
- `TELEGRAM_NOTIFICATION` — real sends delivered with live A/B/C inline keyboards (multiple runs, e.g. gate `ACP-GATE-259e59d71287`, msg_id present, REGISTERED→NOTIFIED in gate history).
- `NO_DEFAULT_ANSWER` — every incomplete window terminated `NO_ANSWER` + STOP, never an invented answer.
- Isolated transport diagnostic: a REAL operator tap reached the transport in 8s and was admitted through all binding filters (sanitized: `ACP-GATE-DIAG`, option B, update 607749313).

## Why the full E2E kept failing — root causes (all closed)

1. **Callback regex case law bug (critical, latent)** — `CALLBACK_RE` accepted only `[A-Z0-9-]` decision ids while real ids contain lowercase hex (`sha12`); EVERY real tap would have been discarded as `FOREIGN_CALLBACK_DATA`. The isolated diagnostic passed only because its id was uppercase. Fixed: `[A-Za-z0-9-]`; pure `processUpdate` now unit-fenced.
2. **Competing getUpdates consumers** — the canonical local issuance service long-polls the same bot token (Telegram allows ONE consumer). Runs at 22:31/22:47 raced it; the 409 Conflict was silently swallowed by `catch { continue }`. Fixed: 409/AUTH are now FATAL to the wait (`ABORTED`), never polled through.
3. **Hidden orphan MCP servers** — killing the ACP child does NOT kill its detached MCP stdio children; 9 orphans accumulated across runs and kept polling getUpdates (observed live at 00:11). Fixed: argv spool-marker + startup reap + exit reap in driver and wiring probe; suite reaps to 0 (verified).
4. **Quiesce/restore asymmetry** — restore was fire-and-forget (PowerShell start died silently at 23:21 leaving the service down with `pid:null` recorded); STOP path skipped restore (`process.exit` before `finally`). Fixed: CIM-discovered PID, kill + polling VERIFICATION both directions, restore on PASS/STOP/exception paths, fail-closed STOP if quiesce cannot be verified.
5. **Observability void** — update processing was unlogged/unreachable (MCP stderr does not reach the driver). Fixed: sanitized observe sink appended to `<spool>/tg-observe.log` (update_id, decision match, binding match, option, reject reason); `no_answer` now carries explicit sanitized reason (`TRANSPORT_TIMEOUT` / `TRANSPORT_ABORTED_CONFLICT` / `TRANSPORT_WAIT_EXCEPTION`).
6. **Stale-button ambiguity** — several dead-button messages accumulated; operator taps landed on stale gates. Fixed: `send()` deactivates previous keyboards (`editMessageReplyMarkup`) so exactly ONE message shows live buttons (🟢 ACTIVE GATE).
7. **Silent miss in transport v1** — `path.join` used without import inside best-effort block (stale-button deactivation never ran). Superseded by v2 rewrite.

## Hardened wait contract

`waitAnswer` returns `{status: ANSWERED|TIMEOUT|ABORTED, option?, update_id?, class?, updates_seen}`. Offset advances only for fully processed updates; post-deadline polls are never admitted; transient network errors back off bounded (exhaustion aborts); ack failures never lose a callback.

## Deterministic proofs (this repair)

- Implementation suite: **32/32 PASS** (includes `ACP_MCP_WIRING` on a real `agent acp` session; SAME-SESSION guard intact).
- Soak/race campaign (`tests/v4-cursor-acp-mcp-gate/soak-callback-law.mjs`): **319 iterations** —
  `VALID_CALLBACK_ACCEPTED=309`, `VALID_CALLBACK_LOST=0`, `STALE_REJECTED=403`, `DUPLICATE_REJECTED=201`, `WRONG_BINDING_REJECTED=802`, `PROCESS_LEAKS=0`, `UNEXPECTED_EXCEPTIONS=0` → `READY_FOR_FINAL_REAL_E2E=true`.
  Coverage: pre-poll/during-poll/between-polls arrivals, stale-then-real ordering, duplicate delivery, offset+1 boundaries, post-deadline admission block, 409-fatal, transient-recovery, randomized timing fuzz, 200 randomized gate-core fence combinations, process-kill lifecycle probe.
- BugBot (single independent static review): **no findings**.
- Session law unchanged: no `session/new` after gate start; `session/load` remains LOGICAL_RECOVERY only; MCP adapter and transport cannot self-authorize (option only from gate-core VERIFIED state).

## NOT claimed

`TELEGRAM_E2E`, `REAL_OPERATOR_CALLBACK`, `SAME_SESSION_LIVE` — intentionally deferred to the ONE final real proof when the operator returns.

## Runtime evidence

- `reports/runtime/cursor-acp/mcp-gate-telegram-soak-results.json` (aggregate soak)
- `reports/runtime/cursor-acp/mcp-gate-telegram-e2e-result.json` (last live run STOP state, sanitized)
- per-run spools under `%TEMP%\acp-mcp-gate-e2e-*` (traces, gate stores, tg-observe logs — no secrets)

## NEXT

`ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_OPERATOR_RETURNS` — run `tools/v4-cursor-acp-mcp-gate-telegram-e2e-v1.mjs`; press A/B/C on the single 🟢 ACTIVE GATE message; PASS requires identical ACP sessionId across the gate, zero `session/new` after gate start, and the operator option consumed in-session.
