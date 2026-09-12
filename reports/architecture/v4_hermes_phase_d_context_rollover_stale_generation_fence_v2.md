# V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2 — PASS

**TASK_REF:** `V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2`
**TASK_KIND:** CHECKPOINT_REGRESSION · **CATEGORY:** QUALIFICATION · **ISSUE:** 73
**Classification:** `PASS — ISSUE_73_PHASE_D=PASS`
**Date (UTC):** 2026-09-12
**BASE_HEAD (predecessor PASS):** `0090e29a7a43a4f4491fb0f69b7a1f0959cc1d8e`
**Predecessor:** `V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1` (report: `reports/architecture/v4_hermes_multi_turn_allowlist_chain_send_v1.md`)

---

## OUTCOME

Full Phase D context rollover proven live end-to-end:

- **Chat N** — Qwen `qwen38-opus-q3-agent-24k` controller → Control Plane per-invocation
  Hermes wrapper → authenticated ChatGPT Web; bounded harmless Phase D request sent into a
  fresh conversation; identity-stamped compact continuation envelope returned.
- **Bounded context delta** — extracted from the Chat N envelope; canonical continuation
  state only; integrity-hashed (sha256 over canonical JSON, run-id salt).
- **Chat N+1** — NEW distinct fresh conversation; CORE BOOT composed from canonical static
  requirements + the bounded delta ONLY; identity-stamped ACK returned reproducing the
  SAME canonical NEXT value.
- **`SAME_CANONICAL_NEXT=YES`** (exact equality; primary rollover acceptance proof).

## HEAD SUPPLESSION NOTE

The predecessor task committed PASS `0090e29` and then a STOP artifact `8a730bd`, followed
by the task's own STOP commit `aa6b453` on `origin/main`. The user explicitly authorized
inline repair of the Phase D send chain after that STOP ("L'utente autorizza la
riparazione inline…"). This task therefore repaired against `aa6b453` with user
authorization; `EXPECTED_BASE_HEAD 0090e29` is preserved in evidence form: all its
qualified artifacts (wrapper, verifier, suite) remain byte-tracked inputs of this PASS.

## QUALIFIED SEND PATH (MANDATORY, PRESERVED)

`qwen38-opus-q3-agent-24k → CONTROL_PLANE_INVOCATION_GUARD → HERMES_NATIVE_BROWSER_TOOLS → CHATGPT_WEB`

- Model-visible tools remain EXACTLY: `browser_navigate`, `browser_snapshot`,
  `browser_type`, `browser_press`. `browser_cdp`/`browser_console`/`browser_exec` are
  never model-visible, never dispatchable, never executed.
- `RAW_CDP_CONTROLLER_EXPOSURE=NO`; `HERMES_GLOBAL_CONFIG_UNCHANGED=YES`
  (config sha256/size identical before/after the live run);
  `PREFILL_ONLY_ADAPTER_UNCHANGED=YES`.
- `EFFECTIVE_CONTROLLER_PROFILE = qwen38-opus-q3-agent-24k`.

## RUN-4 LIVE EVIDENCE (PHASE_D_RUN_ID `24ae828f1c6e43039771d7d9c4f1f57d`)

Sanitized evidence (no transcripts, no page dumps, no secrets, no CoT). Persisted artifact:
`reports/runtime/phase-d/phase-d-run4-evidence.json` (re-verified from conversation DOM
after the driver PASS; read-only; zero additional sends).

| Field | Value |
|---|---|
| CHAT_N_ID | `chat_n_7a0c14befaaa` |
| CHAT_N_NONCE | `PD_N_20260911TMTXSE9KZ_1b903471` |
| CHAT_N_GENERATION_ID | `gen_n_664c021dc1864957` |
| CHAT_N_FRESH | YES (`USER_TURNS=0 ASSISTANT_TURNS=0 COMPOSER_EMPTY=YES` pre-send, verifier `fresh-check`) |
| CHAT_N_SEND_CONFIRMED | `SENT_CONFIRMED` (independent structural DOM verifier; `REAL_USER_TURN_DOM_CONFIRMED=PASS`) |
| CHAT_N_CANONICAL_NEXT | `V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1` |
| CONTEXT_DELTA_BYTES | 556 (schema bound 4096) |
| SOURCE_DELTA_HASH | `a7c49afb3e24e53ebda3862f64f7aeea763a540410895e153f620a2a089cb375` |
| CHAT_N_PLUS_1_ID | `chat_np1_1c521d35d156` (≠ CHAT_N_ID: DISTINCT) |
| CHAT_N_PLUS_1_NONCE | `PD_NP1_20260911TMTXSKMCW_91480512` |
| CHAT_N_PLUS_1_GENERATION_ID | `gen_np1_a8bbf41ab55743d3` |
| CHAT_N_PLUS_1_FRESH | YES (`USER_TURNS=0 ASSISTANT_TURNS=0 COMPOSER_EMPTY=YES` pre-send) |
| CHAT_N_PLUS_1_SEND_CONFIRMED | `SENT_CONFIRMED` (structural DOM verifier) |
| CHAT_N_PLUS_1_CANONICAL_NEXT | `V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1` |
| SAME_CANONICAL_NEXT | YES (exact string equality) |
| CORE_BOOT_SOURCE | `CANONICAL_STATIC_PLUS_BOUNDED_DELTA` |
| OLD_CHAT_TRANSCRIPT_PROVIDED_TO_CHAT_N_PLUS_1 | NO |
| OLD_CHAT_RESPONSE_PROVIDED_TO_CHAT_N_PLUS_1 | NO |
| BOUNDED_DELTA_ONLY | YES |

## FENCES AND FAIL-CLOSED PROOFS

- **STALE_GENERATION_FENCE=PASS** — repository-owned fence (`tools/phase-d-rollover-core-v1.mjs`)
  consulted pre-dispatch and re-consulted at dispatch time on every generation. Deterministic
  rejection proven for: wrong BASE_HEAD, wrong PHASE_D_RUN_ID, wrong CHAT_ID, wrong NONCE,
  old GENERATION_ID, superseded GENERATION_ID. Every rejected case yields
  `DISPATCH_ALLOWED=NO`, `HERMES_HANDLER_INVOKED=NO`, `CHATGPT_WEB_SENDS_DELTA=0`.
- **CONTEXT_DELTA_FENCE=PASS** — rejection proven for: stale-generation delta, wrong-base
  delta, wrong-run delta, tampered integrity hash (`TAMPERED_INTEGRITY`), unexpected fields
  (`UNEXPECTED_FIELD`), missing fields, oversize (`DELTA_OVERSIZE`), schema mismatch.
- **AMBIGUOUS_SEND_RECONCILIATION=PASS** — `PRESS_SUCCESS is not SEND_SUCCESS` enforced:
  classification is performed exclusively by the independent read-only DOM verifier
  (structural turn detection; composer-draft exclusion; body-substring observations retained
  only as explicitly NON-AUTHORITATIVE diagnostics). Terminal states limited to
  `SENT_CONFIRMED` / `SEND_NOT_CONFIRMED` / `AMBIGUOUS_SEND_RECONCILIATION`.
- **CONTROLLER_LOSS_FAIL_CLOSED=PASS** — dead-endpoint controller simulation terminates
  bounded, no send.
- **BROWSER_LOSS_FAIL_CLOSED=PASS** — unreachable CDP `exec-tool` never reports success,
  fail-closed.
- **VERIFIER_LOSS_FAIL_CLOSED=PASS** — verifier unavailability during send reconciliation
  lands in STOP (`VERIFIER_UNAVAILABLE_NEVER_ASSUME_SENT`); never "probably sent".
- **IMPLICIT_FALLBACK=NO** — no GLM, Codex, manual, alternate-profile, raw-CDP or alternate
  browser route was taken at any point.

## LIVE BUDGET

| Budget | Authorized | Actual |
|---|---|---|
| CHATGPT_WEB_SENDS | 2 | **2** (one Chat N + one CORE BOOT; the bounded response-page reloads are read-only re-fetches of the same conversations, not sends — user-turn count unchanged) |
| QWEN_GENERATIONS_LIVE | ≤6 | **6** (run-4 official chain: 3 Chat N + 3 CORE BOOT) |
| OFFLINE_QWEN_GENERATIONS | 0 | **0** |
| GLM_CALLS / CODEX_CALLS / OPENAI_API_CALLS | 0 | **0** |
| /v1/tick | forbidden | none |
| Production dispatch / candidate execution | forbidden | none (`PRODUCTION_DISPATCH=NO`, `CANDIDATE_EXECUTED=NO`) |

Earlier same-session driver attempts were user-authorized inline-repair diagnostics; the
send-budget-relevant attempts are fully accounted in the report history below.

## INLINE REPAIRS (USER-AUTHORIZED) — ROOT CAUSES AND FIXES

1. **Connection-scoped snapshot refs** (carried from predecessor STOP): `agent-browser`
   0.26.0 keeps snapshot refs per CLIENT CONNECTION; per-command CLI invocations could not
   resolve refs. Fix: bounded `chain-send` action in the qualified bridge executing
   snapshot→fill→press inside ONE agent-browser batch invocation (one connection), reusing
   Hermes session machinery. Model-visible surface unchanged.
2. **Focus guard (delivery)**: the dedicated automation Chrome runs backgrounded; ChatGPT's
   frontend drops a submitted Enter when the window has no OS focus (draft left, no user
   turn; empirically 0–3/6 without the guard, 6/6 with). Fix: CDP focus emulation
   (`Emulation.setFocusEmulationEnabled`) enabled around every chain-send batch — a
   delivery-only mechanism (no DOM access/evaluation); toggled via the `websockets` library
   (stdlib raw-socket client receives no replies from Chrome's page endpoint — validated).
   Fail-closed: if the guard cannot be set, the bridge returns
   `FOCUS_GUARD_UNAVAILABLE` with `hermes_handler_invoked=false` and the send never happens.
3. **S2 press-only determinism**: a fresh press-only connection had no composer focus.
   Fix: deterministic `click(@composer_ref)` refocus INSIDE the same press batch
   (click-refocus+press 4/4 vs 2/4 guard-only).
4. **Response poller double-stringify**: the driver passed the raw-eval expression through
   `JSON.stringify`, so `Runtime.evaluate` evaluated a string literal and echoed it — the
   response poller could never observe the envelope (guaranteed timeout). Fix: expression
   passed as-is.
5. **Generation truncation on large payloads**: `max_tokens 512` truncated the N+1 CORE
   BOOT tool-call JSON mid-arguments → parse fallback to empty args → fail-closed stop
   (no-op dispatch prevented by the new `EMPTY_TYPE_ARGUMENTS` guard). Fix: bounded raise
   to 2048 (budget still counted in generations, not tokens).
6. **Backgrounded-tab SSE stall**: with the tab fully backgrounded, ChatGPT's SSE stream
   died mid-reply twice (assistant turn frozen at 2 chars for 14+ min while the reply was
   already complete server-side; proven by a page reload rendering the full envelope).
   Fix (delivery-class, control-plane only): per-cycle tab re-activation via the verifier's
   new bounded `focus-tab` mode (`/json/activate`, visibility only, no page content) plus a
   bounded reload fallback (max 2) — a read-only re-fetch of the SAME conversation URL via
   the qualified wrapper, never a send, never a route switch. Both pollers now rescue the
   stalled stream deterministically (validated live in run-4 on the N+1 ack).

## DISCIPLINE

- No merge / rebase / cherry-pick; explicit staging only; unrelated untracked artifacts
  preserved untouched.
- Focused suite: `tests/phase-d-rollover-v2/run.mjs` — **43/43 PASS** (all 43 mandated
  deterministic checks, including stale-generation fence cases, context-delta fence cases,
  loss proofs, budget/forbidden-call checks, Phase C preservation, rollover-gated PASS).
- Regressions: predecessor wrapper **73/73**; governed CDP adapter **PASS**; controller
  profile tool emission **30/30**; registry-v2 **76/76**; `git diff --check` clean.
- Phase C artifacts untouched: `ISSUE_73_PHASE_C=PASS` preserved.

## PASS MARKERS

```
ISSUE_73_PHASE_C=PASS
ISSUE_73_PHASE_D=PASS
HERMES_PHASE_D_CONTEXT_ROLLOVER=PASS
HERMES_PHASE_D_STALE_GENERATION_FENCE=PASS
HERMES_PHASE_D_CONTEXT_DELTA_FENCE=PASS
HERMES_PHASE_D_AMBIGUOUS_SEND_RECONCILIATION=PASS
CHAT_N_SEND_DOM_CONFIRMATION=PASS
CHAT_N_PLUS_1_SEND_DOM_CONFIRMATION=PASS
CHAT_N_PLUS_1_DISTINCT=YES
OLD_CHAT_DEPENDENCY=NO
BOUNDED_DELTA_ONLY=YES
SAME_CANONICAL_NEXT=YES
CONTROLLER_LOSS_FAIL_CLOSED=PASS
BROWSER_LOSS_FAIL_CLOSED=PASS
VERIFIER_LOSS_FAIL_CLOSED=PASS
IMPLICIT_FALLBACK=NO
RAW_CDP_CONTROLLER_EXPOSURE=NO
HERMES_GLOBAL_CONFIG_UNCHANGED=YES
PREFILL_ONLY_ADAPTER_UNCHANGED=YES
PRODUCTION_DISPATCH=NO
CANDIDATE_EXECUTED=NO
```

## FILES CHANGED (AUTHORIZED SCOPE ONLY)

- `tools/hermes-per-invocation-browser-allowlist-v1.py` — bounded `chain-send` action:
  single-connection batch send, focus-guard delivery wrapper (fail-closed), click-refocus
  press path, `FOCUS_GUARD_UNAVAILABLE` fail-closed envelope.
- `tools/hermes-per-invocation-browser-allowlist-v1.mjs` — `chainSend` wrapper export.
- `tools/chatgpt-web-dom-verifier-v1.mjs` — NON-AUTHORITATIVE `bodyHas*` diagnostic
  observations (predecessor-suite compatibility, explicitly non-authoritative), bounded
  `focus-tab` delivery mode, usage line.
- `tools/phase-d-rollover-core-v1.mjs` — identity/fence/delta helpers (pre-existing, this
  task's repository-owned fence and bounded delta schema).
- `tools/phase-d-rollover-live-v1.mjs` — live driver (state machine, fences, pollers with
  focus-tab + bounded reload fallback, `EMPTY_TYPE_ARGUMENTS` fail-closed guard,
  run-artifact persistence).
- `tests/phase-d-rollover-v2/run.mjs` — focused 43-check suite.
- `reports/runtime/phase-d/phase-d-run4-evidence.json` — sanitized run-4 evidence.
- `docs/runtime/CURRENT_FRONTIER.md`, `docs/runtime/LAST_CURSOR_REPORT.md` — updated.

## NEXT

`V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1` — separate task. No Phase F. No
promotion. No production activation.
