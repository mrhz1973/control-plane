# V4 Hermes Phase C closure checkpoint v8

Task: `V4_HERMES_PHASE_C_CLOSURE_CHECKPOINT_V8`
Issue: `#73`
Checkpoint base: `a060ea40e570d18b1d2fa5eacdc7eddd10b2aa8f`
Route: `QWEN_LOCAL -> HERMES -> CHATGPT_WEB`

## Decision

- `ISSUE_73_PHASE_C=PASS`
- `NEXT_PHASE=ISSUE_73_PHASE_D_FRESH_CHAT_ROLLOVER_AND_STALE_GENERATION_FENCE`
- `CANDIDATE_EXECUTED=NO`
- `PRODUCTION_DISPATCH=NO`
- Issue `#73` remains open.

Phase C acceptance is cumulatively satisfied by the preserved V5 runtime
evidence and the V6 late-result reconciliation. This checkpoint does not
retroactively convert V5 from STOP to PASS and does not convert V7 from STOP
to PASS. It closes only the Phase C acceptance decision; it does not execute
the candidate, promote the route, or declare Phase D complete.

## Preserved evidence chain

### V5 — real request, bounded runtime STOP

Source:
`reports/runtime/cursor-stops/20260909T185922Z__V4_HERMES_WINDOWS_PERSISTENT_AUTH_RECOVERY_AND_PHASE_C_V5.stop.json`

- `V5_STATUS=STOP_TIMEOUT`
- The persistent authenticated ChatGPT Web surface, local CDP attachment,
  Qwen Local 64K readiness, Hermes attachment, and web smoke all passed.
- The real Phase C request was made through the intended route.
- The Hermes/Qwen/Web runner exceeded the bounded 600-second capture
  timebox, so `STOP:PHASE_C_CANDIDATE_GENERATION_TIMEOUT` remains correct.
- No fallback, candidate execution, production dispatch, or repository
  mutation occurred.

### V6 — exact late result recovered and fenced

Sources:

- `reports/architecture/v4_hermes_phase_c_v5_late_result_candidate.json`
- `reports/architecture/v4_hermes_phase_c_v5_late_result_reconciliation_v6.md`

- `V6_STATUS=PASS`
- Read-only inspection observed the assistant JSON immediately associated
  with the V5 prompt. The exact sanitized candidate was persisted without
  correction or regeneration.
- The candidate records issue `73`, repository `mrhz1973/control-plane`,
  branch `main`, controller `qwen_local`, bridge `hermes`, answer surface
  `chatgpt_web`, `shadow_only=true`, `production_dispatch=false`,
  `self_authorizing=false`, and `candidate_executed=false`.
- Validation against original V5 base
  `fe371ac3f5f9ad1ad28c580fd85dfa2ef1941bc2` passed.
- Validation of that identical JSON against later base
  `ae9f5b6b6c3fd5f41f6c2d8393586a6f81e38ee8` stopped with
  `STALE_BASE_HEAD`.
- Therefore the late content is valid for its original base and cannot
  authorize work from a later base. The stale-generation fence passed.
- Focused validator fixtures passed `17/17`.

### V7 — separate STOP, no contrary Phase C evidence

Source:
`reports/runtime/cursor-stops/20260909T200313Z__V4_HERMES_PHASE_C_EXTENDED_TIMEBOX_FINAL_PROOF_V7.stop.json`

- `V7_STATUS=STOP:PHASE_C_REQUEST_NOT_SENT`
- The invocation returned stale V5 content, while deterministic DOM evidence
  showed that no V7 request was sent and no V7 candidate was generated.
- V7 therefore contributes no new positive Phase C evidence, but it does not
  invalidate the already preserved V5 request plus V6 reconciliation.
- No retry, candidate execution, provider fallback, or production dispatch
  occurred.

## Phase C acceptance matrix

| ID | Acceptance condition | Result | Canonical evidence |
|---|---|---|---|
| A | Lean GitHub canonical inputs only | `PASS` | The persisted candidate limits `allowed_scope` to the canonical backlog, current frontier, and architecture reports; it declares no credential material, and the sanitized V5/V6 evidence persists no browser/session secrets. |
| B | Qwen Local acts as Hermes controller | `PASS` | V5 records Qwen Local ready and Hermes attached for the real request; the recovered candidate persists `route.controller=qwen_local` and `route.bridge=hermes`. |
| C | Hermes reaches authenticated ChatGPT Web | `PASS` | V5 records authenticated DOM state, CDP readiness, Hermes attachment, successful web smoke, and the real request; V6 observes its assistant response. |
| D | Candidate has exact original base, target, bounded scope, hard walls, acceptance, and STOP conditions | `PASS` | The exact candidate persists original base `fe371ac3...`, the Phase D target, a three-entry allowed scope, hard walls, acceptance criteria, and explicit stop conditions. Historical-base validation passed. |
| E | Candidate cannot self-authorize | `PASS` | Exact candidate has `shadow_only=true`, `self_authorizing=false`, `production_dispatch=false`, and `candidate_executed=false`; the validator enforces these fields. |
| F | Deterministic validator rejects a stale or wrong candidate | `PASS` | V6 applied the canonical validator to the identical candidate at a later head and received `STOP` with `STALE_BASE_HEAD`; focused fixtures pass `17/17`. |
| G | No production dispatch | `PASS` | V5, V6, V7, and the candidate all record no production dispatch; no `/v1/tick` or provider fallback was used for this checkpoint. |
| H | Controller and answer-surface identities are persisted separately | `PASS` | The candidate separately persists `route.controller=qwen_local`, `route.bridge=hermes`, and `route.target=chatgpt_web`; its acceptance list also requires separate controller/answer-surface identity. |

All eight conditions pass. No missing Phase C evidence remains, and rerunning
Phase C would not be an acceptance requirement.

## Phase D is the next real issue #73 gap

The V7 failure is retained as design evidence for Phase D. The next proof must:

- start a fresh chat with a unique nonce/task identity;
- confirm the intended user message in the DOM within a short send timeout
  and stop if it is absent;
- begin the longer response timeout only after send confirmation;
- accept only a response carrying the same nonce/task identity and reject
  stale content from an older chat or request;
- persist only a bounded, sanitized delta;
- prove that Chat N+1 and CORE BOOT expose the same canonical next action;
- return a bounded STOP on browser/controller loss; and
- keep fallback explicit and fail closed.

Phase D is not run or claimed by this checkpoint. Phase E/F and any
production promotion remain separately gated.

## Checkpoint verification

- Expected local/origin base before edits: `a060ea40e570d18b1d2fa5eacdc7eddd10b2aa8f`
- Canonical focused validator suite: `PASS`, `17/17`
- Validator and fixtures modified: `NO`
- Browser, CDP, Qwen, Hermes, provider, n8n, VPS, and production mutations:
  `NO`
