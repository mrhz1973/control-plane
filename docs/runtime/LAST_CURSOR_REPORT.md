# LAST CURSOR REPORT

## ACP external human-gate architecture selection V1 — latest

**TASK_REF:** `V4_CURSOR_ACP_EXTERNAL_HUMAN_GATE_ARCHITECTURE_SELECTION_V1`
**Classification:** `PASS — ARCHITECTURE_SELECTED (A_PROJECT_OWNED_MCP_HUMAN_GATE_TOOL; selection only, no implementation)`
**Date (Europe/Rome):** 2026-09-12
**BASE_HEAD:** `a3fc8a5025e0c88c8ebc2e7c3c785f126e38d702`
**Report:** `reports/architecture/v4_cursor_acp_external_human_gate_architecture_selection_v1.md`

- Evaluated A (project-owned MCP human-gate tool), B (structured
  turn-boundary envelope), C (existing canonical mechanisms) against the full
  criteria set (dynamic gate, same-session semantics, callback binding,
  fences, fail-closed, hallucination surface, lifetime, crash recovery,
  session/load, Telegram reuse, authority, complexity, testability, vendor
  dependency, secret exposure).
- **Selected A**: session-scoped MCP is the vendor-supported tool-injection
  surface (verified live: `initialize` `mcpCapabilities` + `session/new`
  `mcpServers`); the MCP tool is an adapter only — the canonical Control Plane
  gate remains the sole decision authority; no self-authorization, no default
  answer, fail-closed `no_answer`.
- SAME-SESSION LAW defined: exact ACP `sessionId` across the gate over one
  uninterrupted stdio connection; `session/new` after gate = FAIL;
  `session/load` = `LOGICAL_RECOVERY` only (crash path, labeled, never silent
  substitution).
- MCP question resolved YES: one project-owned localhost `human_gate` tool can
  be exposed per-session without production-routing change or second
  authority.
- Rejected: B (trust anchor = model-authored envelope; documented emergency
  fallback shape only), C (We/wf46 inactive + second inbound surface; Telegram
  issuance service is production-route-scoped authority; checkpoint is
  persistence).
- Decision includes TRUST_BOUNDARIES, STATE_MACHINE, CALLBACK_BINDING,
  SESSION_IDENTITY_RULE, FAIL_CLOSED_RULE, CRASH_RECOVERY_RULE,
  MINIMAL_IMPLEMENTATION_SLICE, MINIMAL_E2E_PROOF.
- No implementation performed. No walls touched. `PRODUCTION_CHANGED=NO`.
- **NEXT = one bounded implementation task for the selected minimal slice
  (MCP `human_gate` adapter + driver wiring + V2-law fences), then the
  minimal E2E proof.**

---

## Cursor Agent CLI accessibility remediation V1 — latest

**TASK_REF:** `V4_CURSOR_AGENT_CLI_ACCESSIBILITY_REMEDIATION_V1`
**Classification:** `PASS — CURSOR_ACP_NOT_PROJECT_ACCESSIBLE=RESOLVED`
**Date (Europe/Rome):** 2026-09-12
**BASE_HEAD:** `d2bd6b4110531622d487aac742db7103aa1081fc`
**Report:** `reports/architecture/v4_cursor_agent_cli_accessibility_remediation_v1.md`

- Official native-Windows Cursor Agent CLI installation completed; `agent`
  command available, version `2026.09.10-fd3934a` observed.
- Authentication was directly confirmed by the operator through `agent status`;
  account identity, login URL, challenge, tokens, and credential material were
  not persisted.
- Local help plus official ACP documentation prove the project-accessible ACP
  command/stdin-stdout protocol, `session/new`, `session/load`, and blocking
  `cursor/ask_question` support.
- No Agent model/provider request, ACP session, Telegram integration,
  browser/runtime/VPS/n8n action, or production mutation was performed.
- **NEXT = `V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2`**: prove
  an actual bounded same-session Telegram gate and its callback fences.

---

## Hermes Phase F bounded production activation — latest

**TASK_REF:** `V4_HERMES_PHASE_F_BOUNDED_PRODUCTION_ACTIVATION_V1`
**Classification:** `PASS — BOUNDED_PRODUCTION_ACTIVATION_COMPLETE · LIVE_CANARY=PASS · LIVE_DISPATCH_COUNT=1 · ISSUE_73=CLOSED_COMPLETED`
**Date (UTC):** 2026-09-12
**BASE_HEAD:** `8323b2f91b91ba120a8fc142fe0313e7b8c31db8`
**Commit:** `68691b0` (pushed + remote-verified, origin/main = 68691b0)
**Report:** `reports/architecture/v4_hermes_phase_f_bounded_production_activation_v1.md`
**Evidence:** `reports/runtime/phase-f/phase-f-bounded-production-activation-evidence.json`
**Packet:** `docs/decision-packets/v4-hermes-phase-f-promotion-gate-v1.md` (final activation update appended)

- Decision **A — ACTIVATE the qualified route under bounded production authorization** recorded and executed for the exact route `qwen_local -> hermes -> chatgpt_web` ONLY.
- Exact-route authorization delta: 3 repo allow-list pins (provenance registry validator, appended-entry pin, issuance ALLOWED_ROUTES + pending-store validator) + user-local issuance config; allow-list = EXACTLY two canonical routes (`opencode+qwen_local`, `hermes+chatgpt_web`); I05 regression asserts the two-route law (anti-broadening intent preserved).
- Route control `DISABLED -> CANDIDATE_ENABLED` for the canary window (candidate ≠ authorization; adapter dual gate still required ACTIVE route-pinned authorization), then restored **DISABLED** post-canary (restoration `SHADOW_ONLY`, `disable_history` recorded; adapter re-check `BLOCKED / ROUTE_CONTROL_DISABLED`).
- Canonical Telegram issuance gate (operator APPROVE in-band): `AUTH-PROMO-ACT-4c15532ece9fcce4` route-pinned ACTIVE (1h TTL), scope-digest bound, ledger-first spend + ACTIVE→SPENT BEFORE transport.
- ONE bounded live canary PASS: RUN_ID `108690b6ad15430eb2f55c885b1eca9e` — RT25 admission via canonical producer (`QWEN_READY_IDLE`), Phase E shadow selection live, dual-gate eligibility `READY_FOR_AUTHORIZED_DISPATCH`, 2 Qwen controller generations, EXACTLY 1 ChatGPT Web send via the qualified chain-send transport (snapshot→fill→press Enter, ONE agent-browser connection) routed through `executePromotedRoute` (`EXECUTED_CONFIRMED`), independent DOM verifier `REAL_USER_TURN_DOM_CONFIRMED=PASS` (1 user turn with canary payload + 1 assistant reply, composer empty).
- Bounded repairs in-session (per `bounded-repair-continuation-policy-v1`, same task/objective/scope/authority): (1) S1 executes through the adapter-routed chain-send batch — agent-browser refs are connection-scoped, a standalone exec-tool type can never resolve them; (2) admission clock captured AFTER the producer (composer future-dated law); (3) producer recognizes the documented router-owned Qwen topology; (4) runtime doc FAST_AGENT mapping aligned to operator-selected `qwen38-opus-q3-agent-24k`; (5) expired-pending re-issuance through the same canonical gate.
- Regressions all green: activation 13/13, promotion-implementation 24/24, issuance 60/60, spend-ledger 13/13, Phase E 10/10, readiness 30/30, local-runtime producer 57/57, T04 8/8, T09 5/5.
- `SILENT_FALLBACK=NO`, `AUTHORIZATION_BYPASS=NO`, `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`, `LIVE_DISPATCH_COUNT_TOTAL=1`, D-0025 `enabled=false` untouched, no OLD/OpenClaw/public-surface mutation.
- **Issue #73 CLOSED (completed)** — umbrella acceptance A–F fully satisfied after activation.
- **NEXT = none outstanding for this track; any further production enablement requires a NEW human promotion gate.**

---

## Hermes Phase D context rollover + stale-generation fence V2 — previous

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
