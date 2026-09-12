# V4 Cursor Agent ACP Telegram same-session human gate V2 — STOP evidence

**TASK_REF:** `V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2`
**Classification:** `STOP — STOP_REPAIRABLE_IN_SCOPE (blocker: AskQuestion tool not exposed in ACP default mode)`
**Date (Europe/Rome):** 2026-09-12
**Repository:** `mrhz1973/control-plane`
**Branch:** `main`
**BASE_HEAD:** `f6e96cfec89c28ee92bcaaca6248d8f85d27a29c`

## What was proven (partial)

| Check | Result | Evidence |
|---|---|---|
| `PRECHECK` | `PASS` | HEAD = origin/main = `f6e96cfe` |
| `STEP_0_ISSUE_73_RECONCILE` | `DONE` | `docs/runtime/CURRENT_FRONTIER.md` stale `#73 remains OPEN` / `ISSUE_73=OPEN` markers corrected to `CLOSED_COMPLETED`; historical decision-packet blocks annotated (not rewritten) |
| `CURSOR_AGENT_SESSION_IDENTITY` | `PASS` | `agent acp` v2026.09.10-fd3934a; per-run session id captured (36-char UUID) before any gate |
| `ACP_SESSION_NEW` | `PASS` | real `initialize` + `session/new` JSON-RPC over stdio in every attempt |
| `ACP_ROUNDTRIP` | `PASS` | trivial `session/prompt` → `stopReason=end_turn` probe |
| `ASK_QUESTION_EVENT` | `FAIL` | agent never emitted the `cursor/ask_question` server→client request (3 attempts) |
| `HUMAN_GATE_EMITTED` | `NOT_REACHED` | driver code is downstream of the ask event; never executed |
| `TELEGRAM_NOTIFICATION` | `NOT_REACHED` (send never attempted) | attempt-2/3 traces contain no Telegram stage |
| Telegram binding check | `PASS` (sanitized) | `getMe` OK, bot `Mar***` alive, chat/user ids present in canonical user-local config; token never printed/persisted |

## Attempts

1. **Attempt 1** — prompt asked agent to use `cursor/ask_question`; agent searched
   its tool list, found none, printed the question as chat text. Ask wait timed
   out (300 s). Trace preserved (overwritten by later attempts).
2. **Attempt 2** — same failure; trace `acp-telegram-same-session-trace.attempt2.json`:
   `TELEGRAM_NOTIFICATION` stage absent (send never attempted).
   Operator reported `TELEGRAM_NOTIFICATION_NOT_RECEIVED` — diagnosis per bounded
   repair policy: the canonical Telegram path was never exercised; the blocker is
   upstream (ask event never emitted).
3. **Bounded repair (in-scope, non-destructive, 1/1 retries used)** — driver
   nudge updated to explicitly state the `cursor/ask_question` extension method
   IS supported by this ACP client and to forbid printing the question as text.
   Verified via bundle inspection (`agent` CLI `src/acp/interaction-handlers/
   ask-question-handler.ts`, compiled `8412.index.js`): the ACP adapter emits a
   server→client JSON-RPC request with method constant `cursor/ask_question`
   (params `{toolCallId,title,questions:[{id,prompt,options,allowMultiple}]}`)
   and expects `{outcome:{outcome:"answered",answers:[{questionId,
   selectedOptionIds:[...]}]}}`; a permission fallback via `session/request_permission`
   exists. The client driver implements both.
4. **Attempt 3 (repaired)** — trace `acp-telegram-same-session-trace.attempt3.json`:
   agent explicitly reasoned "The AskQuestion tool is not among them … not
   available in this environment", attempted the call despite absence, failed,
   self-declared `Proof status: FAILED`. `TELEGRAM_NOTIFICATION` again never
   reached. Ask wait timed out (300 s).

## Exact blocker

The Cursor Agent ACP runtime (v2026.09.10-fd3934a) does not expose the
AskQuestion tool to the model in any mode reachable through the ACP stdio
surface by this driver:

- the server→client bridge for `cursor/ask_question` EXISTS in the CLI
  (handler + `session/request_permission` fallback implemented by this driver);
- the model-facing TOOL is not registered in the agent's visible tool list in
  the sessions spawned via `agent acp` (default mode; the canonical modes are
  `agent` / `plan` / `ask`, none of which made the tool available);
- no CLI flag, session option, or mode value discovered in the installed
  bundle exposes it; `agent acp --help` exposes no relevant options.

The Telegram canonical path itself was verified healthy (sanitized) and
requires no mutation, no credential rebinding, and no workflow activation.
`HUMAN_GATE_REQUIRED` is therefore NOT raised for Telegram: the gate was never
reached. No operator answer was requested or consumed. No local answer was
substituted.

## Negative controls actually enforced during the proof

- `PERMISSION_DENIED_FAIL_CLOSED`: any `session/request_permission` is denied
  (implemented; not triggered — the agent never fell back).
- No `session/new` after gate: structurally impossible in the driver (gate
  never reached; no second session was created inside any attempt).
- No answer substitution: the operator's instruction was honored — no local
  AskQuestion/answer shim was used at any point.

## Markers

```text
SAME_SESSION_HUMAN_GATE_E2E=FAIL
TELEGRAM_CALLBACK_VERIFIED=NOT_REACHED
STALE_DUPLICATE_FENCES=NOT_REACHED
NEW_SESSION_SUBSTITUTION=NO
PRODUCTION_CHANGED=NO
ISSUE_73=CLOSED_COMPLETED
TELEGRAM_NOTIFICATION=NOT_RECEIVED_SEND_NEVER_ATTEMPTED
BLOCKER=ASK_QUESTION_TOOL_NOT_EXPOSED_IN_ACP_RUNTIME
RETRY_BUDGET_USED=1_OF_1
HUMAN_GATE_REQUIRED=NO
```

## Stop classification

`STOP_REPAIRABLE_IN_SCOPE` would require a repair derived from the observed
failure that stays inside task scope. The only candidate repairs would need
either (a) a Cursor Agent CLI/runtime change or flag exposure for the
AskQuestion tool in ACP sessions — outside this repository and outside task
authority — or (b) an alternate gate path (local UI, manual chat reply), which
the task and the operator explicitly forbid as a substitute. Per contract:
STOP, evidence persisted, no PASS documents updated beyond this STOP record.

## Files

- `tools/v4-cursor-acp-telegram-same-session-gate-v1.mjs` — bounded ACP driver
  (implements the verified `cursor/ask_question` bridge + permission fallback
  + gate store fences; fails closed)
- `reports/runtime/cursor-acp/acp-telegram-same-session-trace.attempt2.json`
- `reports/runtime/cursor-acp/acp-telegram-same-session-trace.attempt3.json`
- `reports/runtime/cursor-acp/acp-telegram-same-session-result.json` (STOP record)

**End of STOP evidence.**
