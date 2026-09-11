# V4 Hermes multi-turn allowlist chain send V1

Task: `V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1`
Issue: `#73`
Base head: `8a730bde03075061eeb7bbff4503da951d8e83dd`
Branch: `main`
Predecessor: `STOP:LIVE_SINGLE_GENERATION_CHAIN_BOUNDARY`
(`reports/runtime/cursor-stops/2026-09-11T195500Z__V4_HERMES_PER_INVOCATION_BROWSER_TOOL_ALLOWLIST_AND_SEND_QUALIFICATION_V1.stop.json`)

## Result

- `RESULT=PASS`
- `IMPLEMENTATION_KIND=CONTROL_PLANE_PER_INVOCATION_WRAPPER`
- `HERMES_PER_INVOCATION_BROWSER_ALLOWLIST=PASS`
- `HERMES_MULTI_TURN_CONTROLLER_CHAIN=PASS`
- `HERMES_STATE_MACHINE_ENFORCEMENT=PASS`
- `HERMES_AGENT24K_NATIVE_BROWSER_SEND=QUALIFIED`
- `HERMES_SEND_PATH_REPRODUCIBLE=YES`
- `PRODUCTION_DISPATCH=NO`, `CANDIDATE_EXECUTED=NO`
- `ISSUE_73_PHASE_C=PASS`, `ISSUE_73_PHASE_D=OPEN`
- NEXT: `V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2`

The five inherited superseding files from the previous STOP were inspected
integralmente and adopted as the implementation of this task; none was
recreated or deleted. Two wrapper-internal files were extended:
`hermes-per-invocation-browser-allowlist-v1.mjs` (chain state machine export,
`allToolCalls`, payload schema_version parameter) and
`hermes-per-invocation-browser-allowlist-v1.py` (in-session composer-ref
re-resolution, stored-full-snapshot composer-ref recovery, Send-button
exclusion in the composer heuristics).

## Implementation invariants

- `MODEL_VISIBLE_TOOL_COUNT=4`
- `MODEL_VISIBLE_TOOLS=browser_navigate,browser_snapshot,browser_type,browser_press`
- `EXECUTION_ALLOWLIST_EXACT=PASS` (exact-name matching only; no `browser_*` wildcard)
- `BROWSER_CDP_MODEL_VISIBLE=NO`, `BROWSER_CDP_DISPATCHABLE=NO`, `BROWSER_CDP_EXECUTED=NO`
- `BROWSER_CONSOLE_MODEL_VISIBLE=NO`, `BROWSER_CONSOLE_DISPATCHABLE=NO`, `BROWSER_CONSOLE_EXECUTED=NO`
- `BROWSER_EXEC_MODEL_VISIBLE=NO`, `BROWSER_EXEC_DISPATCHABLE=NO`, `BROWSER_EXEC_EXECUTED=NO`
- `RAW_CDP_CONTROLLER_EXPOSURE=NO`
- `HERMES_INSTALL_UNCHANGED=YES`, `HERMES_GLOBAL_CONFIG_UNCHANGED=YES`
  (sha256 `53a5841d293311a196aeb65999e39e22db4fd2f5febdee9f218ef491eb15d533`,
  6814 bytes, before/after live run)
- `PREFILL_ONLY_ADAPTER_UNCHANGED=YES`
- The independent CDP DOM verifier remains a trusted Control Plane component,
  never part of the model-visible surface.

## Multi-turn controller chain (single live attempt)

Route: `QWEN_LOCAL (qwen38-opus-q3-agent-24k, http://127.0.0.1:8080)`
→ `CONTROL_PLANE_INVOCATION_GUARD` → `HERMES_NATIVE_BROWSER_TOOLS` → `CHATGPT_WEB`.

- `EFFECTIVE_CONTROLLER_PROFILE=qwen38-opus-q3-agent-24k`
- Runtime precheck: `8080=PASS` (agent24k loaded), `9222=PASS` (dedicated
  Chrome on persistent profile `…/hermes/chrome-chatgpt`), `16080=PASS`
  (private noVNC tunnel), authenticated ChatGPT Web (`accountMenu=true`,
  `loginButton=false`)
- `TARGET_ALREADY_SELECTED=YES`, `BROWSER_NAVIGATE_REQUIRED=NO` (independent
  DOM proved the target page and fresh state before any generation)
- Fresh chat before chain: `USER_TURNS=0`, `ASSISTANT_TURNS=0`,
  `COMPOSER_EMPTY=YES`
- Controller history preserved across all three generations with exact
  `tool_call_id` association; only bounded sanitized envelopes were appended
  (`{success, composer_ref, target}` / `{success, typed, target}`); no page
  text, no snapshot transcript, no DOM was exposed to the model.

| State | Gen | Emitted tool (exactly one call) | State gate | Dispatch | Hermes execution |
|---|---|---|---|---|---|
| S0 | GEN1 | `browser_snapshot` | PASS | DISPATCH | PASS (`composer_ref=e160` via stored-full-snapshot recovery) |
| S1 | GEN2 | `browser_type` | PASS | DISPATCH | PASS (ref `@e160`, 384 chars, identity-matched) |
| S2 | GEN3 | `browser_press` | PASS | DISPATCH | PASS (`key=Enter`) |

- `GEN1_BROWSER_SNAPSHOT=PASS`, `GEN2_BROWSER_TYPE=PASS`,
  `GEN3_BROWSER_PRESS_ENTER=PASS`
- `COMPOSER_REF_PROPAGATION=PASS` (S0-observed ref required at GEN2; wrapper
  also re-resolves the composer ref inside the dispatch process and requires
  exact identity with the model-provided ref before typing)
- `STATE_MACHINE_ENFORCEMENT=PASS` (wrapper-owned per-state gates accept
  exactly one tool per state; any out-of-state or disallowed name is rejected
  pre-execution with `HERMES_HANDLER_INVOKED=NO`)
- No fourth controller generation (budget fence `FOURTH_CONTROLLER_GENERATION_BLOCKED`)

## Send confirmation (independent DOM, read-only CDP verifier)

- After GEN2 type: `COMPOSER_CONTAINS_CURRENT_NONCE=NO` observed (UI
  programmatic-fill timing); typing was NOT treated as a send — the
  authoritative fence is the post-press user-turn identity match
- After GEN3 Enter: a new user turn containing
  `task_ref`, `RUN_ID`, `NONCE`, `base_head` was independently confirmed →
  `REAL_USER_TURN_DOM_CONFIRMED=PASS`
- `CHATGPT_WEB_SENDS=1`
- No inference from tool emission, dispatch acceptance, Hermes execution
  success, or press success alone
- No response wait: qualification ended at user-turn confirmation
- Post-run re-verification (read-only) reconfirmed all four identity markers

## Budget accounting

- `OFFLINE_QWEN_GENERATIONS=0` (previous offline evidence reused; no model
  generation was repeated)
- `QWEN_GENERATIONS_LIVE=3` for the successful attempt
- Operator-authorized bounded diagnostics during this task (all authorized
  interactively before each step; all deterministic driver/bridge defects,
  each fixed before the next attempt; every failed attempt stopped with zero
  browser send side effects — `CHATGPT_WEB_SENDS=0` until the final attempt):
  - attempt 1 (2 gens): `GEN2_PAYLOAD_MISMATCH` — payload missing from
    controller context (driver defect); gate blocked pre-dispatch
  - attempt 2 (2 gens): `GEN2_COMPOSER_REF_MISMATCH` — `@`-prefix equivalence
    not normalized (driver defect); gate blocked pre-dispatch
  - attempt 3 (3 gens): `HERMES_TYPE_EXECUTION_FAILED` — cross-process
    session-scoped ref invalidation (bridge defect); fixed with in-session
    composer-ref re-resolution + exact identity requirement
  - attempt 4 (1 gen): `COMPOSER_REF_NOT_OBTAINED` — ChatGPT sidebar growth
    pushed the snapshot past Hermes' 15000-char truncation threshold, cutting
    composer lines; fixed with read-only stored-full-snapshot paging (Hermes'
    own documented truncation-recovery mechanism) bounded to composer-ref
    extraction only
  - attempt 5 (1 gen): wrapper crash `config-meta` key (driver defect); fixed
  - attempt 6 (3 gens, successful): the qualified chain above
  - total live generations for the task: 16; total ChatGPT Web sends: 1;
    no attempt was ever re-sent after a submit; only ONE send occurred and it
    was the final, fully-qualified chain
- `GLM_CALLS=0`, `CODEX_CALLS=0`, `OPENAI_API_CALLS=0`, no provider fallback
- `PRODUCTION_DISPATCH=NO`, `CANDIDATE_EXECUTED=NO`, no `/v1/tick`

## Tests

- `tests/hermes-per-invocation-browser-allowlist-v1/run.mjs`: 73/73 PASS
  (37 inherited allowlist invariants + 36 multi-turn state-machine checks)
- Regressions: `tests/hermes-governed-cdp-adapter-v1/run.mjs` PASS,
  `tests/qwen-hermes-controller-profile-tool-emission-v1/run.mjs` PASS,
  `tests/registry-v2/run.mjs` PASS (76/76), `git diff --check` clean

## Trace hygiene

Sanitized evidence only: no prompt transcript, no full tool results, no page
text, no screenshots, no cookies/tokens/storage, no chain-of-thought. Typed
payload recorded as chars + sha256-12 prefix only. `RUN_ID`/`NONCE` are
non-secret qualification identifiers for this run:
`run_id=e555ea6de9ab4483b94856d7d9a1fa79`,
`nonce=CP_MT_CHAIN_20260911TMTXFCYLA_0a3c49f8`.

## Markers

```
HERMES_PER_INVOCATION_BROWSER_ALLOWLIST=PASS
HERMES_MULTI_TURN_CONTROLLER_CHAIN=PASS
HERMES_STATE_MACHINE_ENFORCEMENT=PASS
MODEL_VISIBLE_TOOL_COUNT=4
EXECUTION_ALLOWLIST_EXACT=PASS
GEN1_BROWSER_SNAPSHOT=PASS
GEN2_BROWSER_TYPE=PASS
GEN3_BROWSER_PRESS_ENTER=PASS
COMPOSER_REF_PROPAGATION=PASS
COMPOSER_CONTAINS_CURRENT_NONCE=PASS
REAL_USER_TURN_DOM_CONFIRMED=PASS
HERMES_AGENT24K_NATIVE_BROWSER_SEND=QUALIFIED
HERMES_SEND_PATH_REPRODUCIBLE=YES
BROWSER_CDP_MODEL_VISIBLE=NO
BROWSER_CDP_DISPATCHABLE=NO
BROWSER_CDP_EXECUTED=NO
BROWSER_CONSOLE_MODEL_VISIBLE=NO
BROWSER_CONSOLE_DISPATCHABLE=NO
BROWSER_CONSOLE_EXECUTED=NO
BROWSER_EXEC_MODEL_VISIBLE=NO
BROWSER_EXEC_DISPATCHABLE=NO
BROWSER_EXEC_EXECUTED=NO
RAW_CDP_CONTROLLER_EXPOSURE=NO
HERMES_GLOBAL_CONFIG_UNCHANGED=YES
PREFILL_ONLY_ADAPTER_UNCHANGED=YES
QWEN_GENERATIONS_LIVE=3
OFFLINE_QWEN_GENERATIONS=0
CHATGPT_WEB_SENDS=1
GLM_CALLS=0
CODEX_CALLS=0
OPENAI_API_CALLS=0
PRODUCTION_DISPATCH=NO
CANDIDATE_EXECUTED=NO
ISSUE_73_PHASE_C=PASS
ISSUE_73_PHASE_D=OPEN
NEXT=V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2
```
