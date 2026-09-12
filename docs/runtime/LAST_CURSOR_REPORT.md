# LAST CURSOR REPORT

## Hermes Phase D context rollover + stale-generation fence V2 — latest

**TASK_REF:** `V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2`
**Classification:** `PASS — ISSUE_73_PHASE_D=PASS · SAME_CANONICAL_NEXT=YES · CHATGPT_WEB_SENDS=2 · NEXT=PHASE_E`
**Date (UTC):** 2026-09-12
**BASE_HEAD (predecessor PASS artifact):** `0090e29a7a43a4f4491fb0f69b7a1f0959cc1d8e`
**Report:** `reports/architecture/v4_hermes_phase_d_context_rollover_stale_generation_fence_v2.md`

- Full Phase D rollover proven live: fresh Chat N (`chat_n_7a0c14befaaa`) sent one bounded
  harmless Phase D request through the qualified multi-turn wrapper; identity-stamped
  continuation envelope returned; bounded integrity-hashed context delta extracted; fresh
  Chat N+1 (`chat_np1_1c521d35d156`, DISTINCT) received CORE BOOT (canonical static
  requirements + bounded delta ONLY) and reproduced the SAME canonical NEXT
  (`V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1`) exactly.
- `STALE_GENERATION_FENCE=PASS` (deterministic rejection of wrong base/run/chat/nonce, old
  and superseded generations, all pre-dispatch with `HERMES_HANDLER_INVOKED=NO`);
  `CONTEXT_DELTA_FENCE=PASS` (stale/wrong-base/wrong-run/tampered/oversize/unexpected-field
  deltas rejected); send classification exclusively via independent structural DOM verifier
  (`PRESS_SUCCESS is not SEND_SUCCESS`); controller/browser/verifier loss all fail-closed;
  `IMPLICIT_FALLBACK=NO`.
- User-authorized inline repairs (root causes fixed inside the qualified wrapper/driver):
  (1) connection-scoped `agent-browser` refs → bounded `chain-send` single-connection batch;
  (2) backgrounded-window Enter drop → CDP focus-emulation delivery guard (fail-closed
  `FOCUS_GUARD_UNAVAILABLE`); (3) press-only refocus via deterministic click inside the
  press batch; (4) driver poller double-stringify bug fixed; (5) generation truncation on
  large payloads → bounded maxTokens raise + `EMPTY_TYPE_ARGUMENTS` fail-closed guard;
  (6) backgrounded-tab SSE stall → verifier `focus-tab` delivery mode + bounded reload
  fallback (read-only re-fetch of the same conversation, never a send, never a route
  switch).
- `CHATGPT_WEB_SENDS=2` (budget exactly 2); `QWEN_GENERATIONS_LIVE=6` (≤6);
  `OFFLINE_QWEN_GENERATIONS=0`; `GLM_CALLS=0`, `CODEX_CALLS=0`, `OPENAI_API_CALLS=0`;
  no `/v1/tick`; `PRODUCTION_DISPATCH=NO`; `CANDIDATE_EXECUTED=NO`.
- `RAW_CDP_CONTROLLER_EXPOSURE=NO`; model-visible tools remain exactly
  `browser_navigate/browser_snapshot/browser_type/browser_press`;
  `HERMES_GLOBAL_CONFIG_UNCHANGED=YES`; `PREFILL_ONLY_ADAPTER_UNCHANGED=YES`.
- Focused Phase D suite 43/43 PASS; regressions PASS (predecessor wrapper 73/73, governed
  CDP adapter PASS, controller profile tool emission 30/30, registry-v2 76/76);
  `git diff --check` clean. `ISSUE_73_PHASE_C=PASS` preserved; #73 CLOSED with PHASE_D=PASS.
- Report: `reports/architecture/v4_hermes_phase_d_context_rollover_stale_generation_fence_v2.md`.
- **NEXT = `V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1`** (separate task; no Phase F;
  no promotion; no production activation).

---

## Hermes multi-turn allowlist chain send V1 — previous

**TASK_REF:** `V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1`
**Classification:** `PASS — HERMES_AGENT24K_NATIVE_BROWSER_SEND=QUALIFIED · CHATGPT_WEB_SENDS=1 · PHASE_D=OPEN`
**Date (UTC):** 2026-09-11
**BASE_HEAD:** `8a730bde03075061eeb7bbff4503da951d8e83dd`
**Report:** `reports/architecture/v4_hermes_multi_turn_allowlist_chain_send_v1.md`

- Control Plane per-invocation wrapper (dual barrier) qualified: exactly 4 model-visible
  Hermes schemas (`browser_navigate`, `browser_snapshot`, `browser_type`, `browser_press`);
  exact-name execution allowlist; `browser_cdp`/`browser_console`/`browser_exec` never
  model-visible, never dispatchable, never executed; `RAW_CDP_CONTROLLER_EXPOSURE=NO`.
- Multi-turn controller chain PASS with wrapper-owned state machine: GEN1 `browser_snapshot`
  → GEN2 `browser_type` (exact composer ref + exact payload identity) → GEN3 `browser_press`
  Enter; no fourth generation; controller history preserved across generations with exact
  `tool_call_id` association and bounded sanitized tool results only.
- Independent read-only DOM verifier confirmed the new user turn containing
  `task_ref`/`RUN_ID`/`NONCE`/`base_head`: `REAL_USER_TURN_DOM_CONFIRMED=PASS`,
  `CHATGPT_WEB_SENDS=1` (single harmless shadow payload, `production_dispatch=false`). No
  response wait.
- `HERMES_GLOBAL_CONFIG_UNCHANGED=YES` (hash before/after), `HERMES_INSTALL_UNCHANGED=YES`,
  `PREFILL_ONLY_ADAPTER_UNCHANGED=YES`.
- Focused suite 73/73 (37 inherited + 36 multi-turn state-machine checks); regressions PASS
  (`hermes-governed-cdp-adapter-v1`, `qwen-hermes-controller-profile-tool-emission-v1`,
  `registry-v2` 76/76, `git diff --check` clean).
- `OFFLINE_QWEN_GENERATIONS=0`; `QWEN_GENERATIONS_LIVE=3` for the qualified attempt;
  earlier in-task diagnostic attempts were operator-authorized bounded determinism fixes
  with zero send side effects (fully disclosed in the report).
- `GLM_CALLS=0`, `CODEX_CALLS=0`, `OPENAI_API_CALLS=0`, `PRODUCTION_DISPATCH=NO`,
  `CANDIDATE_EXECUTED=NO`.
- `ISSUE_73_PHASE_C=PASS` and `PHASE_D=OPEN` remained unchanged at that time.
- `NEXT=V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2`.
