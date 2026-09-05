# LAST CURSOR REPORT

**BLOCK-ID:** `V4_DISPATCHER_SAFE_FAST_FORWARD_SYNC_V1` (micro-task delta, issue #49, base `0850b21`)
**Classification:** `PASS — verifyRepoState now safe-FF syncs clean behind main (`git merge --ff-only origin/main`) before queue claim; dirty/ahead/diverged/ff-fail remain HUMAN_GATE; untracked preserved; focused 9/9 + dispatcher 10/10 + admission 11/11; NO live restart this pass`
**Timestamp (local):** 2026-09-06 (~01:50, UTC+2)
**BASE_HEAD:** `0850b215fb1206067691efb0e728ae3b6bb0de61`
**CLOSURE HEAD:** final `cursor-pass: V4_DISPATCHER_SAFE_FAST_FORWARD_SYNC_V1` commit carrying this report
**CLOSURE:** CODE_WIRED_BEHIND_LIVE_PROCESS

## Delta

`tools/serve-local-dev-autonomous-dispatcher-v1.mjs` `verifyRepoState` only:

1. `git fetch origin main`
2. require branch `main`
3. TRACKED clean (`status --porcelain=v1 --untracked-files=no`) **before** any sync
4. HEAD==origin/main → continue (`sync_performed=false`)
5. HEAD strict ancestor of origin/main → exactly one `git merge --ff-only origin/main` → require equality
6. local ahead / diverged / merge-base fail / ff fail → `HUMAN_GATE_REQUIRED`
7. never reset/stash/clean/rebase/force-pull

Sync remains before scan/claim/admission/executor.

## Exact live-activation dependency (NOT performed)

> Restart/reload Scheduled Task `ControlPlane-V4-LocalDevDispatcher` so the live node process loads this `verifyRepoState`. Until restart, the live PID continues the pre-FF binary from #48. No n8n mutation required.

## Focused tests

- `tests/dispatcher-safe-ff-sync/run.mjs` — **9/9 PASS**
- `tests/local-dev-dispatcher-service-v1/run.mjs` — **10/10 PASS**
- `tests/micro-task-admission-parity/run.mjs` — **11/11 PASS** (admission unchanged)

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_AUTOMATED_MICRO_TASK_ADMISSION_LIVE_APPLY_V1` (micro-task delta, issue #48, base `562265b`)
**Classification:** `PASS — LIVE_APPLIED: ControlPlane-V4-LocalDevDispatcher restarted; admission-aware dispatcher loaded (PID 55972); 127.0.0.1:18793 listening; GET /v1/tick → 405 POST_ONLY; D-0025 enabled=false; no n8n/WF/Tailscale/Telegram mutation; no fabricated queue task`
**Timestamp (local):** 2026-09-06 (~01:42, UTC+2)
**BASE_HEAD:** `562265bf0155839cdb701050926f1e5b7b91bdf5`
**CLOSURE HEAD:** final `cursor-pass: V4_AUTOMATED_MICRO_TASK_ADMISSION_LIVE_APPLY_V1` commit carrying this report
**CLOSURE:** LIVE_APPLY (Scheduled Task restart only)

## Precheck

- branch `main`; HEAD == origin/main == `562265b`
- tracked worktree clean (pre-existing untracked preserved)
- Scheduled Task identity: `ControlPlane-V4-LocalDevDispatcher` →
  `node.exe …\tools\serve-local-dev-autonomous-dispatcher-v1.mjs`
- pre-restart listener PID `52292` (same identity)

## Live mutation performed

1. Stopped old listener PID `52292` (identity-checked cmdline)
2. `Start-ScheduledTask -TaskName ControlPlane-V4-LocalDevDispatcher`
3. New listener PID `55972` started `2026-09-06 01:41:39` (task LastRun `01:41:38`, LastTaskResult `0`)

## Post-apply proof

| # | Check | Result |
|---|---|---|
| 1 | Scheduled Task / process up | Ready; LastTaskResult=0; node PID 55972 |
| 2 | `127.0.0.1:18793` listening | YES |
| 3 | GET `/v1/tick` | HTTP 405 + `reason_codes:["POST_ONLY"]` |
| 4 | Admission-aware code loaded | cmdline → canonical mjs; on-disk source contains `admitMicroTaskDelta` (2 hits) + admission comment (2 hits); helper file present; process start after restart |
| 5 | No fabricated task | YES |
| 6 | Natural tick | receipts mtime unchanged since 2026-09-05 (no new claim this window); observe-only |
| 7 | D-0025 | `enabled=false` |
| 8 | No n8n workflow mutation | `workflows/` dirty=0 |

## Forbidden walls honored

No WF90/n8n edits, no Tailscale, no Telegram, no queue fabrication, no model calls, no WF40/WF61, no D-0025 change, no credentials, no destructive git.

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_AUTOMATED_MICRO_TASK_ADMISSION_PARITY_V1` (micro-task delta, issue #47, base `a179a40`)
**Classification:** `PASS — deterministic MICRO_TASK_DELTA admission helper wired into real local-dev dispatcher performTick BEFORE executor; rejected admission never executes (HUMAN_GATE_REQUIRED + execution_performed=false); legacy safe defaults; focused 11/11 + dispatcher service 10/10; NO live apply/restart; D-0025 unchanged`
**Timestamp (local):** 2026-09-06 (~01:40, UTC+2)
**BASE_HEAD:** `a179a40752d858be6f83df96780f107ff13b80e1`
**CLOSURE HEAD:** final `cursor-pass: V4_AUTOMATED_MICRO_TASK_ADMISSION_PARITY_V1` commit carrying this report
**CLOSURE:** CODE_WIRED_BEHIND_LIVE_PROCESS (no service restart / no n8n mutation)

## What was wired

- NEW `tools/admit-micro-task-delta-v1.mjs` — pure admission helper inheriting `MICRO_TASK_DELTA_OPERATING_LAW.md`
- `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` `performTick`: claim → **admit** → executor
- Rejected → `HUMAN_GATE_REQUIRED` (WF90 ALLOWED set preserved; no live schema expansion), `execution_performed=false`

## Exact live-activation dependency (NOT performed this pass)

> The Windows Scheduled Task `ControlPlane-V4-LocalDevDispatcher` (service on `127.0.0.1:18793`) must be **restarted** (or equivalently reloaded) to load the new `performTick` admission call-site from disk. Until restart, the live process continues the pre-admission binary. No n8n workflow mutation is required for this code path (admission is server-side in the dispatcher). Do **not** restart in this slice.

## Focused tests

- `tests/micro-task-admission-parity/run.mjs` — **11/11 PASS** (proofs 1–8)
- `tests/local-dev-dispatcher-service-v1/run.mjs` — **10/10 PASS**

## Hard walls

No n8n mutation, no service restart, no model calls, D-0025 unchanged, selective stage only, untracked preserved.

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_TOKEN_EFFICIENCY_MICRO_TASK_POLICY_PERSISTENCE_V1` (micro-task delta, issue #42, base `d5f2925`)
**Classification:** `PASS — MICRO_TASK_DELTA operating law persisted as canonical method; consumers inherit; focused policy lint 11/11; AUTOMATION_PARITY persisted (no live automation change); HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION remains possible; wrapper order unchanged; D-0025 untouched`
**Timestamp (local):** 2026-09-06 (~01:30, UTC+2)
**BASE_HEAD:** `d5f29250387836848609bf1070340f747995e467`
**CLOSURE HEAD:** final `cursor-pass: V4_TOKEN_EFFICIENCY_MICRO_TASK_POLICY_PERSISTENCE_V1` commit carrying this report
**CLOSURE:** POLICY_DOCS_ONLY

## Authoritative policy location

`docs/foundation/MICRO_TASK_DELTA_OPERATING_LAW.md` (v1.0) — single authoritative law for:

- DEFAULT TASK UNIT = `MICRO_TASK_DELTA`
- `max_corrective_loops = 2`
- focused tests only (no broad regression per micro-task)
- checkpoint-only broad regression / BugBot
- context minimization / no time-filling
- `HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION` for megaprompt campaigns
- model economics (no silent downgrade)
- git selective stage + push + remote verify
- `AUTOMATION_PARITY` (method law; no live n8n/dispatcher mutation in this pass)

## Consumer references updated

- `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` (v3.6) — inherits law; loop default `max_rounds: 2`
- `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` (v3.1) — `TASK_KIND: MICRO_TASK_DELTA`; section 4 bound=2; wrapper order preserved
- `docs/foundation/PROMPT_SEQUENCING_GATE.md` — inherits; context-minimization on frontier re-reads
- `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` — default unit pointer

## Focused test result

`tests/micro-task-delta-policy/run.mjs` — **11/11 PASS**

## Exception confirmation

Explicit human-authorized campaign remains possible via marker `HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION` in the authoritative law (and handoff anti-megaprompt section).

## Automation parity

`AUTOMATION_PARITY` persisted in the law document. **No live automation change performed.**

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_CANONICAL_QUOTA_RUNTIME_FINAL_CLOSURE_CHECKPOINT_V1` (checkpoint delta, issue #46 / parent #41, base `12d4e2e`)
**Classification:** `PASS — QUOTA_AWARE_RUNTIME=CANONICAL_RUNTIME_WIRED_BEHIND_CLOSED_GATE — all four roles (planner/execution/reviewer/retry) proven through REAL canonical runtime boundaries; closed-gate E2E extended to 19/19 traversing quota→planner→router→bridge→endpoint→attachReviewStage→runGovernedRetryExecution; REVIEWER_EXECUTION_AUTHORIZED=NO; RETRY_EXECUTION_AUTHORIZED=NO; D0025_ENABLED=false; GLM UNKNOWN/BLOCKED_EVIDENCE; NO production LIVE; BUGBOT_REVIEW=CLEAN`
**Timestamp (local):** 2026-09-06 (~01:20, UTC+2)
**BASE_HEAD:** `12d4e2ec9a79f10224241c4f7130f63b414a8544`
**CLOSURE HEAD:** final `cursor-pass: V4_CANONICAL_QUOTA_RUNTIME_FINAL_CLOSURE_CHECKPOINT_V1` commit carrying this report
**CLOSURE:** CHECKPOINT (E2E extend + frontier/report reconcile; no new architecture)

## Four-role canonical proof

| Role | Real boundary | Result |
|---|---|---|
| Planner | `prepareCycle` / planner CLI | quota composed/consumed; fail-closed on missing/stale commercial |
| Execution | `evaluateExecutionRoute` → bridge → Windows endpoint | router emits RT25 envelope; D-0025 CLOSED |
| Reviewer | `attachReviewStage` (local-dev main) → `runReviewStage` → T18 | fresh review-time quota; `execution_performed=false` |
| Retry | `runGovernedRetryExecution` → `runRetryStage` → T19 | repairable STOP + bound only; awaiting-auth; fresh every attempt |

## Checkpoint suites (once)

- entrypoint **104/104** · closed-gate E2E **19/19** · review-stage **15/15** · governed-retry **10/10** · retry-stage **14/14**
- `node --check` / `git diff --check` OK · D-0025 `enabled=false`

## Persistence

- `docs/runtime/CURRENT_FRONTIER.md` — `QUOTA_AWARE_RUNTIME=CANONICAL_RUNTIME_WIRED_BEHIND_CLOSED_GATE`
- `reports/architecture/v4_canonical_quota_runtime_final_closure_checkpoint_v1.md` — readiness matrix
- #41 may be closed for selection wiring behind the closed gate (not LIVE)

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_GOVERNED_RETRY_EXECUTION_CALLER_INTEGRATION_V1` (micro-task delta, issue #45, base `5c8f2e6`)
**Classification:** `PASS — SMALLEST GOVERNED RETRY-EXECUTION CALLER/STAGE CREATED: tools/run-governed-retry-execution-v1.mjs sits between a repairable implementation STOP and retry-execution authorization; invokes the REAL runRetryStage (fresh quota state every attempt); PASS / non-repairable STOP never enter; max_attempts enforced from explicit retry_policy bound (hard cap 3, never invent unbounded); when a route is selected and no authorized execution surface exists → caller_status=RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION with execution_performed=false (NEVER infer/execute); D-0025 CLOSED re-verified; ordinary test-command re-runs NOT converted into model-route retries; NO fake LIVE wiring into local-dev executor/dispatcher (exact final activation dependency persisted); FOCUSED TESTS 10/10 + retry-stage-boundary 14/14; WF40/WF61/n8n UNTOUCHED`
**Timestamp (local):** 2026-09-06 (01:0x, UTC+2)
**BASE_HEAD:** `5c8f2e6704339c3e33758188cc753aaca8e9aa66`
**CLOSURE HEAD:** final `cursor-pass: V4_GOVERNED_RETRY_EXECUTION_CALLER_INTEGRATION_V1` commit carrying this report
**CLOSURE:** MINIMAL_RUNTIME_BUNDLE (1 new tool + 1 focused suite)

## Chosen caller architecture (issue #45 path-b)

No safe existing post-failure *route-selection* call site exists: the only real retry loop in local-dev (`makeRunTests`) re-runs a test COMMAND and must NOT become an LLM/model-route retry. Therefore the smallest real caller is a dedicated governed retry-execution stage/runner:

```text
implementation STOP (local-dev-execution-result-v1)
  + retry_policy { max_attempts }   // governed bound metadata ONLY
  -> classifyRepairability
       PASS                      -> PASS_NO_RETRY
       non-repairable STOP       -> NOT_REPAIRABLE
       missing/invalid bound     -> NOT_REPAIRABLE
       attempt > max_attempts    -> MAX_ATTEMPTS_EXCEEDED
  -> runRetryStage (REAL; fresh canonical quota state EVERY attempt)
  -> if RETRY_ROUTE_SELECTED && !authorized:
       RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION
       execution_performed=false
  -> if blocked/vetoed:
       RETRY_SELECTION_BLOCKED (fail-closed, no execution)
```

Repairable classifications (closed allowlist): `STOP:TEST_FAILED`, `STOP:OPENCODE_RUN_FAILED`, `STOP:OPENCODE_TASK_ERROR`. Everything else (preflight/bounds/git/path/envelope) is non-repairable.

## Exact canonical call path

`tools/run-governed-retry-execution-v1.mjs` → `runGovernedRetryExecution(stopResult, { attempt, retryPolicy, … })` → `runRetryStage` → `buildRetryBoundaryState` → `selectQuotaAwareRetryRoute` → T13/T14 guards → bounded `v4-governed-retry-execution-result-v1`.

CLI: `node tools/run-governed-retry-execution-v1.mjs --input-file <stop.json> [--attempt N] [--max-attempts N] [--previous-route-id id] [--previous-pool-id id] [--previous-model id] [--output-file path]`

## Real caller wired: YES (this stage IS the caller)

The stage is the runtime caller between repairable STOP and execution authorization. It is NOT auto-attached to the local-dev executor `main()` or the always-on dispatcher — that would convert ordinary STOPs / test re-runs into model-route retries without an explicit `retry_policy`. Exact final activation dependency (persisted, not faked):

> A future governed activation may call `runGovernedRetryExecution` from a post-STOP hook ONLY when the envelope/result carries an explicit `retry_policy.max_attempts` (or equivalent governed bound). Until then, the stage is invoked via its canonical library/CLI. No authorized retry-execution adapter exists; selected routes remain `AWAITING_EXECUTION_AUTHORIZATION`.

## Focused test results

- NEW `tests/governed-retry-execution-caller/run.mjs`: **10/10 PASS**
  - A PASS never retries
  - B non-repairable STOP never retries (+ missing policy bound)
  - C repairable STOP invokes REAL `runRetryStage`
  - D attempt N and N+1 each recompute fresh quota state (`joined_at` differs)
  - E blocked/stale commercial route → `RETRY_SELECTION_BLOCKED`
  - F selected + unauthorized → `RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION`, `execution_performed=false` (incl. probe claiming authorized still fail-closed)
  - G max attempts enforced (+ hard-cap rejects unbounded policy)
  - H D-0025 `enabled=false` + authorization probe closed
- EXISTING `tests/retry-stage-boundary/run.mjs`: **14/14 PASS**
- `node --check` / `git diff --check`: OK. Corrective loops used: 0 of 2.

## Hard walls honored

D-0025 `enabled=false` re-verified. No n8n live apply, no workflow activation, no service restart, no Telegram, no Tailscale, no provider/model calls, no OpenAI API/BYOK, no credentials. Pre-existing untracked files preserved; selective stage only.

## Persistence record

- `GOVERNED_RETRY_EXECUTION_CALLER = WIRED_BEHIND_CLOSED_GATE` (stage/caller live; execution disabled awaiting authorization; not LIVE)
- Files: `tools/run-governed-retry-execution-v1.mjs` (NEW), `tests/governed-retry-execution-caller/run.mjs` (NEW)

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_CANONICAL_RETRY_REPAIR_RUNTIME_BOUNDARY_V1` (micro-task delta, issue #44, base `6749f06`)
**Classification:** `PASS — ONE REAL CANONICAL RETRY/REPAIR-SELECTION BOUNDARY CREATED: tools/run-retry-stage-v1.mjs (runRetryStage / buildRetryCandidates / canonical CLI) recomputes FRESH canonical quota state at EVERY retry invocation via buildRetryBoundaryState (real registry-v2 + fail-closed baseline + real ingest lane → real composer → real join — never the state captured at initial implementation time), invokes the REAL selectQuotaAwareRetryRoute (T19: fresh internal join + scarce-pool exclusion + RETRY_BLOCKED no-silent-reuse), applies guardQualityDowngrade (T13, status-normalized for the retry envelope) and guardUrgencyDeferral (T14, only with caller-supplied urgency context), emits bounded v4-retry-stage-result-v1 with execution_performed=false (SELECTION ONLY); DEDICATED CANONICAL CLI PROVEN (task path 5-b: no runtime retry-route loop exists today — the only real retry loop, bounded test cycles, selects no route — so NO caller was faked; exact caller dependency persisted); FOCUSED TESTS 14/14 + T19 selector suite 5/5; D-0025 CLOSED UNCHANGED; WF40/WF61/n8n/local-dev runner UNTOUCHED`
**Timestamp (local):** 2026-09-06 (00:5x, UTC+2)
**BASE_HEAD:** `6749f06a5ecb7cff88b74ed37041ab9cd54f2c03`
**CLOSURE HEAD:** final `cursor-pass: V4_CANONICAL_RETRY_REPAIR_RUNTIME_BOUNDARY_V1` commit carrying this report
**CLOSURE:** MINIMAL_RUNTIME_BUNDLE (1 new tool + 1 focused suite)

## Chosen retry boundary + exact canonical call path

```text
failed/STOP implementation result (local-dev-execution-result-v1)
  -> runRetryStage (tools/run-retry-stage-v1.mjs — THE boundary)
  -> buildRetryBoundaryState (rt25-canonical-quota-state-v1 — FRESH canonical
     quota state recomputed at EVERY invocation; real ingest lane re-read)
  -> buildRetryCandidates (registry-v2 metadata ONLY: models carrying
     implementation_model or reviewer roles; OpenAI API/BYOK structurally
     forbidden; registry MODEL CLASS -> RESOURCE binding: glm-5.3/glm-5.3-flash
     -> glm, codex_subscription_models -> codex, composer -> composer,
     qwen_local -> qwen_local)
  -> selectQuotaAwareRetryRoute (REAL T19 selector: its own fresh internal
     join + scarce-pool protection + RETRY_ROUTE_SELECTED / RETRY_BLOCKED)
  -> guardQualityDowngrade (REAL T13; retry status normalized to
     ROUTE_SELECTED for the guard call only — audit envelope verbatim)
  -> guardUrgencyDeferral (REAL T14; only when caller supplies urgency)
  -> bounded v4-retry-stage-result-v1
```

Result fields: `retry_required`, `retry_selection_status` (`RETRY_ROUTE_SELECTED` | `RETRY_BLOCKED` | `VETOED_QUALITY_DOWNGRADE` | `NO_CANDIDATES` | `QUOTA_STATE_COMPOSITION_FAILED` | `SELECTOR_INVOCATION_FAILED` | `SELECTOR_ENVELOPE_INVALID` | `REGISTRY_UNREADABLE` | `INPUT_INVALID`), `retry_attempt_index`, `selected_retry_route` (`{route_id, resource_id, model, access_surface, quota_pool_id, admission, select_rank}` when admitted), `reason_codes`, `quota_provenance` (fresh `joined_at` + pools + source paths), `previous_route_reference`, `previous_model_reference`, `execution_performed=false` (LAWFUL CONSTANT), full `decision`/`quality_guard`/`urgency_guard` audit envelopes.

## Fresh-state proof (test A/A2 + C)

Two successive invocations with different `nowMs` produced `quota_provenance.joined_at` equal to each invocation's own decision time (composition recomputed both times, `CANONICAL_QUOTA_STATE_COMPOSED`). Test C proves adapted selection: with fresh glm+codex evidence attempt N selects `glm-5.3`; with glm EXHAUSTED at N+1 the same boundary redirects to `codex-ide`, recording `POOL_EXHAUSTED` for glm with `previous_pool_id` audit-visible.

## Real caller: NO runtime caller wired — dedicated canonical CLI proven (exact dependency persisted)

Per REQUIRED BEHAVIOR 5 path (b): the only real retry loop in the runtime is the bounded test-cycle re-runner (`makeRunTests`, local-dev executor) — it re-runs a test COMMAND and performs NO route selection, so attaching route-selection there would be a fake integration; no other post-failure route-selection caller exists. The boundary therefore ships with its canonical CLI, proven directly (test I/I2):

```text
node tools/run-retry-stage-v1.mjs --input-file <implementation-result.json>
  [--attempt N] [--previous-route-id id] [--previous-pool-id id]
  [--previous-model id] [--output-file path]
exit 0 = RETRY_ROUTE_SELECTED; exit 1 = blocked/vetoed (selection semantics only)
```

EXACT REMAINING CALLER DEPENDENCY: a governed retry EXECUTION stage that (1) detects a repairable STOP, (2) invokes `runRetryStage` for route selection, and (3) holds an authorized retry execution path. None exists today; none was invented.

## Focused test results

- NEW `tests/retry-stage-boundary/run.mjs`: **14/14 PASS** — A fresh recompute per invocation, B real T19 selector + parity, C evidence-change adapts selection, D/D2 stale/missing commercial fail-closed, E local survives commercial blocked (composer Qwen gate), F high-risk veto (no silent downgrade), G/G2 malformed/composition-failure fail-closed (incl. PASS result → `RETRY_NOT_REQUIRED_ON_PASS`), H `execution_performed=false`, I/I2 canonical CLI proof.
- EXISTING `tests/rt25-t19-retry-selector/run.mjs`: **5/5 PASS** (unchanged).
- `node --check` on changed .mjs: OK. `git diff --check`: OK.
- Corrective loops used: 1 of 2 (registry model-class→resource binding + T13 status normalization).

## Hard walls honored

D-0025 `enabled=false` re-verified from repo gate file. No n8n live apply, no workflow activation/deactivation, no service restart, no Telegram, no Tailscale change, no provider/model calls, no OpenAI API/BYOK, no credentials. All pre-existing untracked files preserved; no clean/stash/reset/rebase/force-push; selective stage only.

## Persistence record

- `RETRY_REPAIR_BOUNDARY = WIRED_BEHIND_CLOSED_GATE` (boundary + canonical CLI live in code, proven by direct invocation; no runtime caller yet — exact dependency above; D-0025 closed, not LIVE)
- Files: `tools/run-retry-stage-v1.mjs` (NEW), `tests/retry-stage-boundary/run.mjs` (NEW)

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_CANONICAL_REVIEW_STAGE_ARCHITECTURE_AND_BOUNDARY_V1` (micro-task delta, base `0788717`)
**Classification:** `PASS — ONE REAL CANONICAL REVIEW-STAGE BOUNDARY CREATED AND WIRED BEHIND CLOSED GATE: tools/run-review-stage-v1.mjs (runReviewStage / attachReviewStage / buildReviewerCandidates) composes FRESH canonical quota state at review time via buildReviewerBoundaryState (real registry-v2 + fail-closed baseline + real ingest lane → real composer → real join), derives reviewer candidates ONLY from registry reviewer-role metadata (codex chatgpt-subscription surfaces + qwen_local; openai_api_route structurally forbidden; glm has NO reviewer role in the registry), invokes the REAL selectQuotaAwareReviewerRoute (T18 independence law preserved), applies guardQualityDowngrade (T13 no-silent-downgrade), emits bounded v4-review-stage-result-v1 with execution_performed=false (SELECTION ONLY, no reviewer inference/execution); REAL EXISTING CALLER WIRED: local-dev live runner main() (tools/run-local-dev-executor-v1.mjs) attaches review_stage APPEND-ONLY post-implementation — PASS/STOP semantics and exit code unchanged, DEV-runner isolation law intact (42/42); FOCUSED TESTS 15/15 + T18 reviewer selector 5/5; D-0025 CLOSED UNCHANGED; WF40/WF61/n8n UNTOUCHED`
**Timestamp (local):** 2026-09-06 (early hours, UTC+2)
**BASE_HEAD:** `078871786648f19708f57fc6c433a62d1dd597e4`
**CLOSURE HEAD:** final `cursor-pass: V4_CANONICAL_REVIEW_STAGE_ARCHITECTURE_AND_BOUNDARY_V1` commit carrying this report
**CLOSURE:** MINIMAL_RUNTIME_BUNDLE (1 new tool + 1 caller wiring + 1 focused suite)

## Chosen review-stage architecture

Dedicated canonical review-stage runner/tool (preferred shape honored):

```text
implementation result (local-dev-execution-result-v1)
  -> runReviewStage (tools/run-review-stage-v1.mjs — THE boundary)
  -> buildReviewerBoundaryState (rt25-canonical-quota-state-v1: real registry-v2
     + fail-closed baseline + real ingest-lane contributions -> real composer
     -> real join — recomputed AT REVIEW TIME, never cached)
  -> buildReviewerCandidates (registry-v2 reviewer-role metadata ONLY)
  -> selectQuotaAwareReviewerRoute (REAL T18 selector + independence law)
  -> guardQualityDowngrade (REAL T13 guard on the reviewer decision envelope)
  -> bounded v4-review-stage-result-v1
```

WF61/WF40 were NOT touched (planner-cycle and routing/orchestration stay clean of review semantics, per the critical distinction).

## Exact canonical call path

`tools/run-local-dev-executor-v1.mjs` main() → `attachReviewStage(result)` → `runReviewStage()` → `buildReviewerBoundaryState()` → `composeCanonicalQuotaState()` → `selectQuotaAwareReviewerRoute()` → `guardQualityDowngrade()` → `result.review_stage` (append-only). CLI surface: `node tools/run-review-stage-v1.mjs --input-file <result.json> [--implementer-model <id>] [--output-file <path>]`.

## Real caller wired: YES

The local-dev execution completion path is the canonical post-implementation boundary: the live runner main() now attaches the review stage after `executeLocalDevTask` + router release. The wiring is APPEND-ONLY: `status`, `classification`, `reason_codes`, exit code and every pre-existing field are byte-identical; the DEV-runner isolation law (no production-authorization vocabulary in the runner source) is preserved by keeping all review-stage vocabulary inside `run-review-stage-v1.mjs` (helper `attachReviewStage`). The always-on dispatcher service path is UNTOUCHED (its bounded tick schema must not change); the runner is the single canonical caller.

## Result shape (bounded, machine-readable)

`v4-review-stage-result-v1`: `review_required`, `reviewer_selection_status` (`REVIEWER_SELECTED` | `NO_ROUTE_SELECTED` | `VETOED_QUALITY_DOWNGRADE` | `NO_CANDIDATES` | `QUOTA_STATE_COMPOSITION_FAILED` | `INPUT_INVALID` | …), `selected_reviewer` (`{route_id, resource_id, model, access_surface, quota_pool_id, admission, select_rank}` when admitted), `reason_codes`, `quota_provenance` (`{schema_version, joined_at, pools, source_paths, composition_reason_codes}`), `implementer_model`, `implementer_reference`, `execution_performed=false` (LAWFUL CONSTANT — no authorized reviewer execution surface exists), full `decision` + `quality_guard` audit envelopes.

## Key laws proved (focused suite `tests/review-stage-boundary` 15/15)

- **A** fresh canonical state composed at review time (joined_at == review now; real source paths; composer reason codes) + implementer known (`implementer_model`/`implementer_reference`).
- **B** REAL selector invoked (decision envelope `v4-rt25-reviewer-quota-aware-decision-v1`, decision_role=reviewer) + parity with raw selector + candidates derived ONLY from registry reviewer roles (glm absent — registry truth), forbidden surfaces excluded.
- **C** independence preference preserved (implementer `qwen-local` + both admitted → codex selected, same-model demoted with explicit code) and same-model-only explicit (C2).
- **D** commercial stale/missing quota → NO_ROUTE_SELECTED fail-closed with pool denial evidence (`CONSERVE_UNKNOWN_STALE`).
- **E** adequate local reviewer (composer Qwen gate passed) survives when commercial evidence is blocked; unobserved local lane is rejected `LOCAL_RESOURCE_UNOBSERVED_UNAVAILABLE` (T12 availability law applied to no-pool candidates — never ADMIT_NO_POOL through an unobserved resource).
- **F** NO inference/execution: `execution_performed=false` always.
- **G** malformed input (`null`/array/unknown schema/invalid status) → `INPUT_INVALID` fail-closed; composition failure → `QUOTA_STATE_COMPOSITION_FAILED` fail-closed.
- **H** exact caller proof: runner CLI attaches `review_stage` to the implementation result; STOP exit semantics unchanged (exit 1).

Runtime model-identity convention: registry class ids mapped to the canonical runtime ids already used by the guards (`codex_subscription_models`→`codex-ide`, `qwen_local`→`qwen-local` — same convention as `ROUTE_QUALITY_INVENTORY`/`QWEN_INVENTORY`).

## Test results

- NEW `tests/review-stage-boundary/run.mjs`: **15/15 PASS** (2 corrective loops used: no-pool availability law + registry-truth expectations).
- EXISTING `tests/rt25-t18-reviewer-selector/run.mjs`: **5/5 PASS** (unchanged).
- Touched-caller regressions (not required, run for safety): `tests/local-dev-executor-live-runner-v1` **42/42 PASS** (incl. production-isolation law), `tests/local-dev-executor-v1` **21/21 PASS**.
- `node --check` on all changed .mjs: OK. `git diff --check`: OK.

## Hard walls honored

D-0025 `enabled=false` re-verified from repo gate file. No n8n live apply, no workflow activation/deactivation, no service restart, no Telegram, no Tailscale change, no provider/model calls, no credentials. All pre-existing untracked files preserved; no clean/stash/reset/rebase/force-push; selective stage only.

## Remaining dependency (classified, NOT blocking the boundary)

Reviewer EXECUTION surface (a separately authorized reviewer inference surface) does not exist by design — this task wires selection only (`execution_performed=false` lawful constant). Consumption of `review_stage` by downstream policy (e.g. packet review fields) remains future governed work.

## Persistence record

- `REVIEW_STAGE_BOUNDARY = WIRED_BEHIND_CLOSED_GATE` (boundary live in code + real caller wired; no production authorization, D-0025 closed)
- Files: `tools/run-review-stage-v1.mjs` (NEW), `tools/run-local-dev-executor-v1.mjs` (caller wiring, append-only), `tests/review-stage-boundary/run.mjs` (NEW)

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_WF90_HTTP409_NORMALIZATION_LIVE_APPLY_V1` (micro-task delta, base `579fa67`)
**Classification:** `PASS — WF90 NORMALIZER FIX LIVE-APPLIED TO WORKFLOW 90 (90ldaa5a-4000-8000-000000000090 "90 - CP V4 LOCAL DEV ALWAYS-ON DISPATCHER - ACTIVE"); LIVE_MUTATION = ONLY the "Code - Normalize LOCAL_DEV tick result" jsCode replaced with the canonical value from 579fa67212b37449a7761ff47ec9f652bdb8f381 (payload proven single-field diff vs live export; jsCode sha256 prefix 9f4184e9802ea4a0, 2029 chars, byte-equal canonical); WORKFLOW REMAINS ACTIVE (activeVersionId=versionId=febca537-9218-4fb4-8280-847b5e961f6b, published 2026-09-05T22:16:39Z, triggerCount=1, schedule 5-min unchanged); POST-APPLY VERIFICATION 17/17 PASS (id/name/settings/7 node IDs/topology/HTTP node/Tailscale URL/Telegram credential binding all unchanged); NATURAL TICK EVIDENCE: scheduled exec 308056 at 2026-09-05T22:20:41Z ran end-to-end with the new normalizer -> IDLE_CLEAN, response_valid=true, success, no Telegram send; D-0025 enabled=false UNCHANGED; WF40/WF61 UNTOUCHED; NO synthetic work, NO manual enqueue, NO service restart, NO Telegram test message`
**Timestamp (local):** 2026-09-06 (00:0x, UTC+2)
**BASE_HEAD:** `579fa67212b37449a7761ff47ec9f652bdb8f381` (fetch + verify: local HEAD == origin/main == canonical)
**CLOSURE HEAD:** final `cursor-pass: V4_WF90_HTTP409_NORMALIZATION_LIVE_APPLY_V1` commit carrying this report
**CLOSURE:** MINIMAL_EVIDENCE_BUNDLE (live-apply pass — runtime code unchanged)

## Precheck (before mutation)

- `git fetch origin main`; `HEAD == origin/main == 579fa67212b37449a7761ff47ec9f652bdb8f381`; tracked worktree clean; all pre-existing untracked files preserved; no clean/stash/reset/rebase/force-push.
- Live WF90 read via `n8n export:workflow --id=90ldaa5a-4000-8000-000000000090` (read-only): id/name/ACTIVE=true confirmed; 7 nodes; all node IDs/types and `connections` byte-identical to the canonical artifact; every non-normalizer node's parameters identical.
- Expected-and-only drift: the normalizer `jsCode` was still the PRE-FIX value (1313 chars, no `error.message` bounded extraction). The canonical artifact's Telegram node parameters differ from live because the repo artifact intentionally carries a placeholder (its own `notes` mandate cloning live credential metadata in memory only) — documented placeholder, NOT drift; live Telegram node treated as authoritative and untouched.
- Pre-mutation export backed up on VPS: `/root/n8n-backups/wf90-live-apply-20260906/wf90-pre-mutation.json` (sha256 `d101945e…`).

## Live mutation (single-field, in place, same workflow ID)

- Mutation payload built IN MEMORY from the live export with ONLY `nodes[name="Code - Normalize LOCAL_DEV tick result"].parameters.jsCode` set to the canonical value; a structural diff of payload vs live export proved `mutation_field_diffs: []` outside that field (id, name, active, settings, node count, all node objects, connections, Telegram credentials untouched).
- Applied with the repo's proven in-place path: `n8n import:workflow` (same ID, no recreate) → `n8n update:workflow --active=true` → `n8n publish:workflow` (publish history row 130: deactivated `snap-manual-fixurl-001` at 2026-09-05T22:16:39Z, then re-activated + published new version `febca537-9218-4fb4-8280-847b5e961f6b`).

## Post-apply verification (17/17 PASS)

1. Re-export: normalizer `jsCode` byte-equal to canonical artifact (sha256 prefix `9f4184e9802ea4a0`, len 2029) — PASS
2. Workflow ACTIVE before and after; `activeVersionId == versionId == febca537-…`; `triggerCount=1` — PASS
3. Schedule node unchanged, 5-minute interval intact — PASS
4. Telegram credential binding present (key names only; no secret/id values printed) and node byte-identical to pre-state — PASS
5. Node count 7; all node IDs; connections/topology; workflow id/name; settings; HTTP Request node incl. Tailscale URL — all unchanged — PASS
6. New jsCode contains the bounded `error.message` extraction + guarded `JSON.parse` — PASS

## Natural scheduled tick evidence (read-only observation only)

- Baseline max WF90 exec id before new version: 308045 (22:15:41Z, old version).
- First natural tick AFTER the new version went live: exec **308056** at **2026-09-05T22:20:41Z**, status `success`.
- Decoded execution data (read-only): normalized output = `response_valid=true, classification=IDLE_CLEAN, execution_performed=false, task_ref=null, human_gate_required=false, gate_summary=null, reason_codes=["NO_ELIGIBLE_READY"], notify_required=false`; terminal node `tick_completed_at=2026-09-05T22:20:42Z`; IF routed false → no Telegram send. The 2xx path is unaltered and the new jsCode runs cleanly in production.
- No manual enqueue, no synthetic backlog work, no repo dirtying to force a 409.

## Hard walls honored

D-0025 gate file re-read post-apply: `"enabled": false` (CLOSED, unchanged). WF40 (83 nodes) and WF61 untouched. No service restart (the CLI "restart n8n" notice for CLI-issued updates was NOT acted on; schedule re-registration proven live by natural tick 308056 firing on time). No Tailscale/Windows dispatcher changes. No Telegram test message. No credentials/secrets printed or persisted. No model/provider execution.

## Persistence record

- `WF90_NORMALIZER_FIX = LIVE_APPLIED`
- Live workflow id: `90ldaa5a-4000-8000-000000000090` ("90 - CP V4 LOCAL DEV ALWAYS-ON DISPATCHER - ACTIVE"), `active=true`
- Canonical source commit: `579fa67212b37449a7761ff47ec9f652bdb8f381`
- Verification result: post-apply 17/17 PASS; live jsCode == canonical (sha256 prefix `9f4184e9802ea4a0`); published+active version `febca537-9218-4fb4-8280-847b5e961f6b`
- Natural tick evidence: exec 308056 IDLE_CLEAN / success with new normalizer
- `D-0025 unchanged (enabled=false)`

---

## HISTORICAL REPORT (superseded block, preserved verbatim)

**BLOCK-ID:** `V4_WF90_HTTP409_NORMALIZATION_FIX_V1` (micro-task delta, base `616ce9f`)
**Classification:** `PASS — WF90 NORMALIZER RECOVERS A SCHEMA-VALID local-dev-dispatch-tick-result-v1 EMBEDDED IN AN n8n/Axios ERROR ENVELOPE (error.message "<status> - <json>") AND NORMALIZES IT LIKE A 2xx RESPONSE; MALFORMED PAYLOADS STAY FAIL-CLOSED SERVICE_ERROR; HTTP STATUS ALONE NEVER INFERS HUMAN_GATE_REQUIRED; FOCUSED TESTS 11/11; LIVE_APPLY_PERFORMED=NO; LIVE_APPLY_GATE_REQUIRED=YES; END STATE REPO_FIX_READY_FOR_LIVE_APPLY`
**Timestamp (local):** 2026-09-05 (late evening)
**BASE_HEAD:** `616ce9f015c2c7a3da1ef6419879427ebce667e2` (synchronized ff-only from `b80e02c`)
**CLOSURE HEAD:** final `cursor-pass: V4_WF90_HTTP409_NORMALIZATION_FIX_V1` commit carrying this report
**CLOSURE:** STANDARD_RUNTIME_BUNDLE

## Proven original failure shape (live WF90, workflow 90 "CP V4 LOCAL DEV ALWAYS-ON DISPATCHER - ACTIVE")

The dispatcher (Windows service `tools/serve-local-dev-autonomous-dispatcher-v1.mjs`)
answers a fail-closed repo-hygiene rejection with HTTP 409 + a valid
`local-dev-dispatch-tick-result-v1` body:

```
HTTP 409
{"schema_version":"local-dev-dispatch-tick-result-v1","ok":false,
 "classification":"HUMAN_GATE_REQUIRED","execution_performed":false,
 "task_ref":null,"human_gate_required":true,
 "gate_summary":"tracked dirty: 7 file(s)",
 "reason_codes":["TRACKED_DIRTY_CONFLICT"]}
```

The WF90 HTTP Request node uses `onError: continueRegularOutput`, so n8n emits
an AxiosError envelope to the normalizer node instead of the body:

```
{"error":{"name":"AxiosError","code":"ERR_BAD_REQUEST","status":409,
 "message":"409 - \"{...dispatcher JSON...}\""}}
```

The previous normalizer only looked at `raw.body ?? raw`, missed the payload
embedded in `error.message`, and produced the incorrect
`classification=SERVICE_ERROR, reason_codes=[], gate_summary=null` (Telegram
then reported task NONE / gate none).

## Exact fix (one coherent edit, canonical deploy artifact)

`workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json` — node
"Code - Normalize LOCAL_DEV tick result" (`jsCode`) only:

- extracted the existing validity test into `isTickResult(v)` (same
  schema/classification/`execution_performed` law as before — no policy
  change);
- NEW bounded recovery: only when `body` is not already a valid tick result
  AND `raw.error.message` is a string, split on the first `" - "`,
  `JSON.parse` once (a second parse ONLY if the decoded value is still a
  string), and accept it ONLY if the decoded object satisfies `isTickResult`
  (the dispatcher body remains the authority; HTTP status 409 alone NEVER
  infers HUMAN_GATE_REQUIRED);
- all legacy paths preserved (direct JSON / `raw.body` object / `raw.body`
  JSON string); any extraction/parsing failure keeps the existing fail-closed
  `SERVICE_ERROR` behavior.

## Focused tests

`tests/wf90-axios-409-normalizer` — **11/11 PASS** (offline; evaluates the
deployed `jsCode` verbatim with a mock `$input`; no n8n, no network, no
workflow apply, no Telegram):

- legacy: direct JSON / `raw.body` object / `raw.body` string still normalize;
- regression fixture: AxiosError status=409 embedding the exact dispatcher
  `HUMAN_GATE_REQUIRED` result → `response_valid=true`,
  `classification=HUMAN_GATE_REQUIRED`, `human_gate_required=true`,
  `gate_summary="tracked dirty: 7 file(s)"`,
  `reason_codes=["TRACKED_DIRTY_CONFLICT"]`, notify required;
- double-encoded JSON-string payload also recovered;
- 409 envelope carrying a healthy IDLE_CLEAN body → IDLE_CLEAN (status never
  infers the gate); schema-invalid embedded object → SERVICE_ERROR;
- malformed JSON / bare string / missing separator / missing `error.message`
  all stay fail-closed SERVICE_ERROR;
- artifact invariants asserted: tick HTTP node keeps
  `onError: continueRegularOutput` + `alwaysOutputData: true`.

## Boundary / apply status

- LIVE_APPLY_PERFORMED=NO; LIVE_APPLY_GATE_REQUIRED=YES (apply is a separate
  operator pass: live n8n workflow update/deploy of the patched artifact).
- Hard wall respected: no active workflow edit, no activate/deactivate, no n8n
  restart, no WF90 trigger, no Telegram send, no Tailscale/service changes,
  D-0025 CLOSED, no model/provider execution, no credentials/secrets.
- `node --check` clean on the changed test suite; workflow artifact
  JSON-validates; `git diff --check` clean.

## Files (this slice)

| File | Change |
|---|---|
| `workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json` | normalizer node `jsCode` — bounded Axios error-envelope recovery |
| `tests/wf90-axios-409-normalizer/run.mjs` | new — focused 11-check suite (legacy + 409 regression + fail-closed) |
| `docs/runtime/LAST_CURSOR_REPORT.md` | this section (previous reports preserved below) |
| `docs/runtime/CURRENT_FRONTIER.md` | N8N LOCAL DEV ALWAYS-ON row: WF90_NORMALIZER_FIX=READY_FOR_LIVE_APPLY |

---

# HISTORICAL — V4_CANONICAL_REVIEWER_RUNTIME_BOUNDARY_V1 (preserved verbatim)

**BLOCK-ID:** `V4_CANONICAL_REVIEWER_RUNTIME_BOUNDARY_V1` (issue #43, parent #41/#32; micro-task delta, base `8789b23`)
**Classification:** `STOP — NO REAL CANONICAL REVIEWER INSERTION POINT EXISTS IN THE RUNTIME; WIRING WOULD REQUIRE INVENTING NEW ORCHESTRATION (FORBIDDEN BY THE TASK'S CRITICAL RULE); EXACT MISSING DEPENDENCY PERSISTED BELOW`
**Timestamp (local):** 2026-09-05 (late evening, immediately after the CLI/mixed-route fix)
**BASE_HEAD:** `8789b23ba772dae6f2502fd7bab8f4a3b04c1c75`
**CLOSURE HEAD:** final `cursor-stop: V4_CANONICAL_REVIEWER_RUNTIME_BOUNDARY_V1` commit carrying this report
**CLOSURE:** STANDARD_RUNTIME_BUNDLE (stop-evidence only; no runtime code changed)

## Verified absence (code-reference proof, base `8789b23`)

The reusable pieces exist and are quota-aware: `rt25-reviewer-quota-aware-selector-v1.mjs`
(T18: admission law + independence preference, proven by
`tests/rt25-t18-reviewer-selector` 5/5) and the canonical producer binding
`rt25-canonical-quota-state-v1.buildReviewerBoundaryState`. What does NOT
exist is the runtime stage that would invoke them. Verified by exhaustive
code-reference search (`git grep` on tracked files):

1. `selectQuotaAwareReviewerRoute` — ZERO runtime callers (definition + its
   own test suite only).
2. `buildReviewerBoundaryState` — defined, never invoked.
3. Execution Packet `review` section (`bugbot`/`max_review_rounds`/
   `autofix_cloud`) — validated STRUCTURALLY by the schema, but
   `evaluate-execution-packet-policy.mjs` never reads it: no policy decision,
   no behavioral trigger, no review round orchestration anywhere.
4. `qwen-local-adapter-v1.mjs` exposes the `reviewer` ROLE (prompt template
   only); the only role-driven runtime wiring is `routing_arbiter` inside
   `evaluate-execution-route.mjs` (`isArbiterReady`). No runtime caller uses
   role `reviewer`.
5. WF61 primary cycle (`prepare`/`finalize`), WF40 routing bridge, adapter
   router bridge, local-dev executor, Windows endpoint: NO pre- or
   post-execution review stage exists.
6. Registry v2 declares `reviewer` role metadata for
   `codex_subscription_models` and `qwen_local` — static metadata with no
   runtime consumer boundary.

## Exact missing dependency (required before this micro-task can GO)

A REAL review stage in the canonical runtime chain — any ONE of, created by a
separately governed architecture pass (not by this micro-task):

- (a) a review step in the WF40 execution path (n8n workflow + bridge
  contract change) invoked after implementation and before/around packet
  completion; or
- (b) a post-finalize review stage in the WF61 primary cycle (packet contract
  `review` section made behavioral: policy gate consumes
  `bugbot`/`max_review_rounds` and triggers reviewer selection); or
- (c) a dedicated reviewer runner tool with its own governed contract.

Until one exists, `selectQuotaAwareReviewerRoute` +
`buildReviewerBoundaryState` remain ready-but-unwired (same status as
documented in the RT25 correction report §reviewer/retry). Wiring them into
any current boundary would INVENT orchestration, violating the critical rule
and the no-fake-production-path law.

## Proofs (no runtime change; absence evidence only)

- focused searches persisted above (`git grep`, 6 absence classes);
- `tests/rt25-t18-reviewer-selector` — **5/5** (selector law itself still
  green on the unwired boundary);
- D-0025 `enabled=false` (static, untouched); no n8n/production activation;
  no model calls of any kind (micro-task law: no synthetic generation).

## Files (this stop)

| File | Change |
|---|---|
| `docs/runtime/LAST_CURSOR_REPORT.md` | new stop section on top (previous report preserved below) |
| `docs/runtime/CURRENT_FRONTIER.md` | QUOTA_AWARE_RUNTIME row: #43 absence verification note |

## Hard boundaries

D-0025 CLOSED (untouched) · no production/n8n activation · no OpenAI
API/BYOK · no invented orchestration · no synthetic model calls · no secret
persistence.

---

# HISTORICAL — V4_RT25_CANONICAL_CLI_AND_MIXED_ROUTE_FIX_V1 (preserved verbatim)

**BLOCK-ID:** `V4_RT25_CANONICAL_CLI_AND_MIXED_ROUTE_FIX_V1` (issue #41, parent #32; continuation of the canonical-entrypoint correction, base `5322b31`)
**Classification:** `PASS — EXISTING CLI INVOCATION SHAPES AUTOMATICALLY COMPOSE THE CANONICAL QUOTA STATE (WF61 PREPARE WITHOUT QUOTA FLAG; WF40 BRIDGE WITH CYCLE/ROUTE/STATUS ONLY); MIXED-ROUTE QUOTA NARROWING WITHOUT TEMPORAL-DEAD-ZONE (COMMERCIAL REJECTED, VALID QWEN LOCAL SURVIVES, QUOTA_POOL_NARROWED RECORDED); EXACT CLI PROOFS 31/31; LAWS A..N 104/104; CANONICAL E2E 12/12; FULL REGRESSION 38 SUITES GREEN; D-0025 UNCHANGED (CLOSED); BUGBOT_REVIEW=FINDINGS_FIXED`
**Timestamp (local):** 2026-09-05 (late evening session)
**BASE_HEAD:** `5322b31bcc8e98c7c39d23deb072cb0fcfd6b683` (canonical correction closure; inherited worktree from GPT-6 Astra, implementation preserved and completed — never redone/discarded)
**CLOSURE HEAD:** final `cursor-pass: V4_RT25_CANONICAL_CLI_AND_MIXED_ROUTE_FIX_V1` commit carrying this report
**CLOSURE:** STANDARD_RUNTIME_BUNDLE
**HISTORICAL EVIDENCE (preserved, not rewritten):** the canonical-entrypoint correction
report below stands as the wiring evidence; this slice closes the two residual
blockers (existing CLI shapes not quota-aware; mixed-route narrowing dead zone)
and hardens the denial laws found during independent review of the inherited
diff.

## Corrected truth (this slice)

Two blockers closed on the REAL canonical CLIs (no new flag, no new command):

1. **WF61 `prepare` (no quota flag)** — `main()` defaults `quotaStateOptions = {}`:
   the canonical quota state composes from the standard runtime ingest lane
   (registry-v2 + fail-closed baseline + real ingest contributions) and reaches
   `evaluatePlannerSelection` automatically. Absent/empty/stale lanes fail
   closed (planner `UNAVAILABLE`, `PLANNER_SELECTION_NOT_PROCEED`, exit 1);
   fresh controlled evidence admits the preferred planner. Imported
   `prepareCycle` callers keep the explicit opt-in boundary (absent =
   legacy); `--quota-state-options-b64` explicit override preserved; explicit
   INVALID options (null/false/string/array) fail closed
   `QUOTA_STATE_COMPOSITION_FAILED` + `QUOTA_STATE_OPTIONS_INVALID` — no
   silent legacy bypass.
2. **WF40 bridge (cycle/route/status only)** — CLI `main()` passes
   `{ quotaStateOptions: {} }`: the bridge composes the canonical state, the
   canonical router runs quota-aware stage 5.5, and the ROUTER-PRODUCED
   envelope is consumed automatically. No-evidence lanes → `NO_ROUTE` +
   `QUOTA_POOL_BLOCKED` with the exact `CONSERVE_UNKNOWN_*` pool evaluation in
   `quota_decision_provenance` (consumed=true); mixed lanes → commercial
   candidate rejected, valid local candidate routed, `QUOTA_POOL_NARROWED`
   recorded, zero exceptions.

Independent review findings on the inherited diff (all fixed):

- **Temporal dead zone (blocker B)** — `reasonAccum` was declared after
  stage 5.5 pushed `QUOTA_POOL_NARROWED`: mixed-route narrowing crashed with
  ReferenceError. Fixed by hoisting the declaration (Astra had partially
  moved it; verified complete).
- **Planner denial leak** — `applyQuotaPoolAdmission` mapped
  CONSERVE_UNKNOWN_*/RESERVE_INCOMPARABLE denials to legacy `CONSERVE`, which
  `gate_only`/`normal` policy could still PROCEED on (a denied commercial
  pool remained selectable). Fixed: ANY admission denial → `UNAVAILABLE`,
  original pool reason preserved in `quota_pool_refinements`.
- **Selector evidence loss** — all-rejected decisions emitted empty
  `pool_evaluations`, so the bridge provenance could not audit the
  fail-closed evaluation. Fixed: pools touched by REJECTED-for-admission
  candidates carry their denial evaluation in `pool_evaluations`.
- **Provenance dropped on adapter failure** — `ADAPTER_REGISTRY_INVALID` /
  `ADAPTER_NOT_REGISTERED` outcomes discarded the router-produced quota
  provenance. Fixed: metadata survives (authorization-neutral; those
  outcomes still fail closed, `dispatch_prepared=false`).

## Proofs

- `tests/rt25-canonical-cli-wiring` — **31/31** (NEW; exact WF61/WF40 CLI
  commands in a git-tracked sandbox: absent/empty/stale/fresh ingest-lane
  legs, fail-closed no-evidence, mixed-route narrowing to local without
  exception, router envelope propagation through the real bridge CLI, real
  Windows endpoint validator accept/mismatch, invalid-options bypass
  prevention CLI+library, imported-caller legacy compatibility)
- `tests/rt25-canonical-entrypoint-wiring` — **104/104** (laws A..N; new M
  mixed-route narrowing across missing/stale/reserve denials; new N
  no-legacy-fallback-can-select-a-denied-pool)
- `tests/rt25-canonical-closed-gate-e2e` — **12/12**
- full regression battery **38 suites green**: planner 17/17, execution-router
  12/12, bridge 23/23, adapter-router-bridge 18/18, adapter-router 15/15,
  adapter-registry 19/19, litellm-primary-cycle 18/18 (CLI leg now carries
  controlled fresh GLM evidence via the real `ingestGlmQuota`), one-shot 7/7,
  T02..T24 RT25 suites, registry-v2 64/64, qwen overlay 14/14, backlog
  adapter 18/18, endpoint 65/65
- `node --check` all 8 modified `.mjs`; `git diff --check` clean; D-0025
  `enabled=false` (static); no pre-existing untracked file staged
- **BUGBOT_REVIEW=FINDINGS_FIXED** — 2 findings, both on PRE-EXISTING
  untracked files (debug dumps `all_files.txt`/`search_results.txt`/
  `.cursor/debug-*.log`; live-arm scripts `tools/arm-*.sh`, `tools/n8n-*.sh`).
  Task law forbids deleting/moving/modifying those files: they are EXCLUDED
  from the commit (never staged), and none was executed. No finding touched
  the committed diff.

## Files (this slice)

| File | Change |
|---|---|
| `tools/run-litellm-primary-cycle.mjs` | modified — CLI default `quotaStateOptions={}` (WF61 auto-composition); fail-closed `QUOTA_STATE_OPTIONS_INVALID` |
| `tools/n8n-v4-execution-routing-bridge-v1.mjs` | modified — CLI `{quotaStateOptions:{}}` (WF40 auto-composition); provenance survives adapter-resolution failures |
| `tools/evaluate-planner-selection.mjs` | modified — ANY pool-admission denial → `UNAVAILABLE` (reason kept in refinements) |
| `tools/evaluate-execution-route.mjs` | modified — `reasonAccum` hoisted above stage 5.5 (dead-zone fix) |
| `tools/rt25-planner-quota-aware-selector-v1.mjs` | modified — `pool_evaluations` includes denied pools' evaluation |
| `tests/rt25-canonical-cli-wiring/` | new — exact CLI proofs (31 checks) |
| `tests/rt25-canonical-entrypoint-wiring/` | modified — C-leg stricter law + M/N legs (104 checks) |
| `tests/litellm-primary-cycle/run.mjs` | modified — CLI leg injects controlled fresh GLM evidence (real ingest) |
| `docs/runtime/CURRENT_FRONTIER.md` | updated — QUOTA_AWARE_RUNTIME row (CLI wiring + fixes proven) |
| `docs/runtime/LAST_CURSOR_REPORT.md` | updated (this section; previous report preserved as historical evidence below) |

## Hard boundaries

D-0025 CLOSED throughout (static proof) · no production route activation · no
OpenAI API/BYOK/API billing · Codex subscription surfaces only · no secret
persistence · no billing/reset/top-up · no invented quota values (controlled
test observations only; empty/stale lanes fail closed) · no inference for
quota discovery · no n8n live deployment/activation (live-arm scripts among
pre-existing untracked files never executed nor staged) · no unauthorized
model execution (endpoint legs: adapter counters 0).

## Deferred / missing

- GLM live quota credential absent → GLM pool CONSERVE_UNKNOWN_MISSING (fail-closed).
- Reviewer/retry canonical boundary missing (unchanged dependency, reported in
  the correction report below).

---

# HISTORICAL — V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION_CORRECTION_V1 (preserved verbatim)

**BLOCK-ID:** `V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION_CORRECTION_V1` (issue #41 reopened post-AGG, parent #32)
**Classification:** `PASS — CANONICAL PLANNER + CANONICAL EXECUTION ROUTER CONSUME THE QUOTA-POOL STATE THROUGH THE REAL CANONICAL CALL PATH; ROUTER-PRODUCED DECISION PROPAGATES TO THE n8n BRIDGE AUTOMATICALLY; CANONICAL CLOSED-GATE E2E 12/12; LAWS A..L 34/34; CONSUMER REGRESSIONS 158/158; D-0025 UNCHANGED (CLOSED)`
**Timestamp (local):** 2026-09-05 (evening session, post-AGG correction)
**BASE_HEAD:** `0ec7826c8f4e6134e00afe29d9cd71d96da1de73` (canonical corrective base; commits 04f0e493 + 0ec7826 historical hygiene, untouched)
**CLOSURE HEAD:** final `cursor-pass: V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION_CORRECTION_V1` commit carrying this report
**CLOSURE:** STANDARD_RUNTIME_BUNDLE
**HISTORICAL EVIDENCE (preserved, not rewritten):** the previous campaign report
`V4_RUNTIME_25_TASK_QUOTA_AWARE_CAMPAIGN_V1` 25/25 PASS stands as module-level
evidence; its RUNTIME_WIRED claim was corrected by this slice — the canonical
entrypoints were the missing consumer link, now wired (see
`reports/architecture/v4_rt25_canonical_entrypoint_integration_correction_v1.md`).

## Corrected truth

The post-AGG verification was right: RT25 modules existed but the CANONICAL
entrypoints (`tools/evaluate-planner-selection.mjs`,
`tools/evaluate-execution-route.mjs`) did not consume them, and the bridge had
no canonical upstream producer for `quota_decision`. This correction wires the
real canonical call path:

```
canonical producer rt25-canonical-quota-state-v1
  (real registry-v2 + real fail-closed baseline + real ingest-lane contributions
   → real composer → real join: freshness/reserve/economics)
  ├─→ evaluatePlannerSelection(options.quotaState)          [canonical planner entrypoint]
  │     reached via prepareCycle(quotaStateOptions)          [single canonical upstream point]
  │     fail-closed: QUOTA_STATE_COMPOSITION_FAILED
  ├─→ evaluateExecutionRoute(options.quotaState)             [canonical execution-router entrypoint]
  │     stage-5.5 commercial-pool admission (same T08/T09 law)
  │     router EMITS the RT25 envelope mirroring its final route
  └─→ n8n bridge options.quotaStateOptions → router-produced envelope consumed
        AUTOMATICALLY (QUOTA_DECISION_PRODUCED_BY_CANONICAL_ROUTER)
        → Windows endpoint validates provenance (scope-checked, fail-closed)
```

Reviewer/retry: canonical runtime boundaries DO NOT EXIST — dependency reported
exactly (no fake production path); producer exposes ready bindings for a future
governed boundary.

## Proofs

- `tests/rt25-canonical-entrypoint-wiring` — **34/34** (laws A..L from the
  canonical entrypoints; legacy paths preserved envelope-free)
- `tests/rt25-canonical-closed-gate-e2e` — **12/12** (real ingest lane →
  canonical prepare → planner CLI → canonical router → bridge auto-consumption
  → real endpoint handler; authorized offline leg EXECUTED_OK; unauthorized leg
  AUTHORIZATION_REJECTED with 0 generation attempts; ledger single spend;
  D-0025 `enabled=false`)
- consumer regressions all green: planner 17/17, execution-router 12/12,
  bridge 23/23, T21 4/4, T22 11/11, T24 23/23 (historical E2E still green),
  litellm-primary-cycle 18/18, t02/t04/t08/t09 12+8+10+5, adapter-router 15/15

## Files (this correction)

| File | Change |
|---|---|
| `tools/rt25-canonical-quota-state-v1.mjs` | new — canonical quota-state producer (+ reviewer/retry bindings) |
| `tools/evaluate-planner-selection.mjs` | modified — quota-pool-aware state refinement (legacy preserved; CLI arg 2) |
| `tools/run-litellm-primary-cycle.mjs` | modified — canonical upstream composition `quotaStateOptions` (fail-closed) |
| `tools/evaluate-execution-route.mjs` | modified — stage-5.5 pool admission + RT25 envelope emission |
| `tools/n8n-v4-execution-routing-bridge-v1.mjs` | modified — canonical composition + automatic router-envelope consumption |
| `tests/rt25-canonical-entrypoint-wiring/` | new — laws A..L (34 checks) |
| `tests/rt25-canonical-closed-gate-e2e/` | new — canonical closed-gate E2E (12 checks) |
| `reports/architecture/v4_rt25_canonical_entrypoint_integration_correction_v1.md` | new — correction report |
| `docs/runtime/CURRENT_FRONTIER.md` | corrected — QUOTA_AWARE_RUNTIME row (canonical wiring proven) |
| `docs/runtime/LAST_CURSOR_REPORT.md` | updated (this file; previous report preserved as historical evidence above) |

## Hard boundaries

D-0025 CLOSED throughout (static proof) · no production route activation · no
OpenAI API/BYOK/API billing · Codex subscription surfaces only · no secret
persistence · no billing/reset/top-up · no invented quota values (empty/stale
ingest lanes fail closed) · no inference for quota discovery · no n8n live
deployment · no unauthorized model execution.

## Deferred / missing

- GLM live quota credential absent → GLM pool CONSERVE_UNKNOWN_MISSING (fail-closed).
- Reviewer/retry canonical boundary missing (exact dependency reported in §3.5 of the correction report).

---

# HISTORICAL — V4_RUNTIME_25_TASK_QUOTA_AWARE_CAMPAIGN_V1 (preserved verbatim)

**BLOCK-ID:** `V4_RUNTIME_25_TASK_QUOTA_AWARE_CAMPAIGN_V1` (issue #41, parent #32)
**Classification:** `PASS — 25/25 RUNTIME TASKS COMPLETED (T01 inherited PASS + T02..T25 executed); QUOTA-AWARE CHAIN WIRED END-TO-END BEHIND CLOSED GATE; 1 DEFERRED (GLM live credential); D-0025 UNCHANGED (CLOSED)`
**Timestamp (local):** 2026-09-05 (afternoon/evening session)
**Base HEAD:** `4c8fdc21de44d6c38b2b09a67483ad40a8a942d6` (canonical campaign start; Task 01 already PASS, issue #40 already CLOSED)
**CLOSURE HEAD:** final `cursor-pass: V4_RUNTIME_25_TASK_QUOTA_AWARE_CAMPAIGN_V1` commit carrying this report
**CLOSURE:** STANDARD_RUNTIME_BUNDLE

## What was wired (REAL runtime chain, no parallel offline lab)

```
RESOURCE_STATUS
  → rt25-quota-ingest-codex / rt25-quota-ingest-glm (real composer contributions, fail-closed)
  → runtime composer (compose-v4-resource-status-control-plane-v1, untouched consumer)
  → rt25-quota-state-join (MODEL/ROLE → ACCESS SURFACE → QUOTA_POOL → STATUS)
  → rt25-quota-freshness-enforcement + rt25-reserve-admission + rt25-economics-metadata
  → planner selector (T08) / execution TASK-DELTA selector (T09)
  → codex subscription eligibility (T10) / GLM 5.3-vs-Flash shared pool (T11)
  → qwen adequacy fallback (T12) / quality guard (T13) / urgency-defer guard (T14)
  → reasoning-speed metadata (T15) / decision audit planner+execution (T16/T17, JSONL SHA256)
  → reviewer selector with independence preference (T18) / retry selector with fresh recompute
    + scarce-pool protection (T19)
  → Execution Packet route/quota provenance (T20, authorization-neutral)
  → n8n runtime bridge consumption (T21, quota_decision → result provenance, invalid = fail-closed)
  → Windows execution endpoint validation (T22, provenance scope-checked BEFORE authorization)
  → runtime status/observability visibility (T23, read-only, degraded components explicit)
  → CLOSED-GATE E2E PROOF (T24, 23/23) with D-0025 still CLOSED
```

## Proof highlights (T24, all on real modules, zero real generation)

- quota metadata propagates end-to-end (composer → join → selector → provenance → bridge → endpoint result)
- stale AND missing quota fail closed at the selector; provenance explicitly absent (`NO_ROUTE_SELECTED`)
- reserve floor blocks pool and route at the boundary
- shared pool (`glm_coding_plan` via 5.3 + Flash) single-admission, never double-counted
- quality guard passes adequate high-risk selection and vetoes tier-downgraded selection
- production admission remains BLOCKED without ACTIVE authorization: endpoint → `AUTHORIZATION_REJECTED`, adapter/occupancy calls = 0
- authorized offline leg (mocked runner): real ledger → real registry ACTIVE→SPENT → occupancy → single bounded execution; provenance rides the result
- D-0025 gate state unchanged (`enabled=false`)

## Method compliance

Zero OpenAI API/BYOK (subscription-only structural eligibility) · zero inference for quota
discovery (all values from operator snapshots/monitor contracts; visibility module read-only) ·
zero secret persistence (audit writer secret-scan fail-closed) · zero billing/reset/top-up ·
no reset/rebase/force-push/stash/clean · per-task: tracked-clean → fetch → HEAD==origin/main →
implement → focused tests → `git diff --check` → selective stage → `cursor-pass:` commit → push →
remote verify · every commit remote-verified (HEAD == origin/main at each task close).

## Deferred evidence (1)

- **GLM live quota credential absent** — monitor endpoint machine-confirmed (#40) but key not
  provisioned. GLM ingest emits explicit UNKNOWN/fail-closed; join/selector/visibility degrade
  explicitly. No invented values; no secret requested/persisted. Continue-where-structural law applied.

## CURRENT_FRONTIER update (T25)

New row `QUOTA_AWARE_RUNTIME` — states proven only: quota-aware selection chain
**RUNTIME_WIRED_BEHIND_CLOSED_GATE**; closed-gate E2E **PROVEN (T24 23/23)**;
GLM live collector **BLOCKED_EVIDENCE** (credential); no LIVE claim (no production
route activation; D-0025 CLOSED; no ACTIVE authorization).

## Files

| File | Change |
|---|---|
| `tools/rt25-*.mjs` (22 runtime modules T02..T23) | new — quota-aware chain segments |
| `tools/n8n-v4-execution-routing-bridge-v1.mjs` | modified — optional `quota_decision` consumption, fail-closed |
| `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` | modified — provenance validation/propagation |
| `docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json` | modified — optional `route_quota_provenance` request block |
| `tests/rt25-t02..t24` (23 focused suites) | new — per-task runtime proofs |
| `reports/architecture/v4_rt25_quota_aware_runtime_wiring_closure_v1.md` | new — T25 readiness closure ledger |
| `docs/runtime/CURRENT_FRONTIER.md` | updated — `QUOTA_AWARE_RUNTIME` row (proven states only) |
| `docs/runtime/LAST_CURSOR_REPORT.md` | updated (this file) |

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
