# V4 Parent 32 closure evaluation V1

**TASK_REF:** `V4_PARENT_32_CLOSURE_EVALUATION_V1`
**BASE_HEAD:** `d165cb81f6e8ffafa38a3d023e929c47ec8afd99` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14
**MODE:** BOUNDED PARENT TRACK CLOSURE READINESS EVALUATION — #32 evaluated, NOT closed; #35 parked

## 3. Issue #32 current state

`OPEN`, title "V4 future track — quota-pool/time-aware multi-surface routing +
Codex subscription/Cursor", body intact, 19 comments (all operator/AGG
provenance, latest 2026-09-06 automation checkpoint). No closure mutation
performed by this task.

## 4. Acceptance matrix A–J

| Section | Requirement focus | Evidence | Verdict |
|---|---|---|---|
| **A** | Codex first-class peer: subscription identity, dynamic model/reasoning metadata, IDE extension qualified, API/BYOK separate, no duplicate pool | #34 CLOSED_COMPLETED (IDE+ChatGPT Plus live-qualified, model/reasoning inventory, repo-read, TASK DELTA, closed-gate execution); registry `codex_subscription_models` with `model_selection_policy.selection=dynamic, frozen_list=false`; dedicated `chatgpt_codex_subscription` pool; authority `account/rateLimits/read` (Phase 0.5, 8/8); API/BYOK structurally forbidden in evaluator + operator policy supersession (`ASTRA_OPENAI_API_SURFACE=OUT_OF_SCOPE`) | **COMPLETE** |
| **B** | GLM granularity: 5.3 vs 5.3-flash distinct, shared `glm_coding_plan`, capability/quota not conflated, source-driven reset/economics | registry: two distinct model entries (different speed/quality roles) → `glm_coding_plan_client` surface → ONE `glm_coding_plan` pool; collector emits rolling/weekly windows + ISO `reset_at` (L85–87); translator suite 25/25; OpenClaw lane KEEP_SCOPED feeding GLM only | **COMPLETE** |
| **C** | Cursor as harness, not one quota | registry `cursor` = harness resource (no quota pool binding); `composer` = Cursor-hosted model as its own model entry; external-provider pool ownership preserved (`third-party BYOK → provider pool`); unverified allowance semantics explicit fail-closed (`UNVERIFIED_ALLOWANCE_UNKNOWN`, `null pool ⇒ no commercial semantics`) — deeper Cursor bucket split remains evidence-gated with uncertainty correctly represented | **COMPLETE (by design; residual observability optional)** |
| **D** | Live collectors/translators with fail-closed uncertainty | codex: app-server authority live (rateLimits/read, sanitized); glm: rolling/weekly + reset timestamps; both translators green (33/33, 25/25); freshness laws (`fresh/stale` vs injectable clock); no inference for quota discovery (proven in campaigns + this track's tasks); internal/manual uncertainty paths = composer FAIL_CLOSED_NO_VALID_OBSERVATION → CONSERVE_UNKNOWN_*; Cursor where NOT machine-observable ⇒ uncertainty preserved (never invented) | **COMPLETE** |
| **E** | Time-aware economic routing | `rt25-economics-metadata-v1` (T07): verified pricing-window/effective-multiplier, unknown economics never cheap; `DEFER_UNTIL_CHEAPER_WINDOW` governed deferral (T14 7/7); reserve floors preserved; no quality degradation for cheaper routing (T13 quality guard 7/7); §10a reset-window preference | **COMPLETE** |
| **F** | Role/quality-aware selection across boundaries | single canonical core (T08) reused by execution/prompt-creator (T09), reviewer with INDEPENDENCE law (T18), retry with recompute law (T19); advisor/second-opinion = planner-class roles; capability/quality filters enforced; suites T08/T09/T13/T14/T15/T18/T19/T20 green | **COMPLETE** |
| **G** | Codex reasoning policy never hardcoded | live catalog carries per-model `supportedReasoningEfforts` (low→max, ultra where offered) with defaults; router parses dynamically (`reasoningEfforts`, `FUTURE_MODEL_AUTO_DISCOVERY` PASS); unsupported settings fail closed (`STALE_MODEL_FAIL_CLOSED`); #34 proved selectable levels live | **COMPLETE** |
| **H** | Cline→OpenCode naming/hygiene | #33 CLOSED_COMPLETED (2026-09-05 migration); registry contains zero `cline` entries (verified today); historical evidence preserved | **COMPLETE** |
| **I** | Architectural reconciliation, not duplication | `RESOURCE_REGISTRY_V2=SOLE_CANONICAL_STATIC_ROUTING_POLICY_SOURCE` (Phase 4: `DUPLICATE_POLICY_SOURCES=0`); MODEL≠ACCESS_SURFACE≠QUOTA_POOL canonical in registry + join + contracts; dynamic quota/catalog stay outside static truth; planner/execution/review/retry consume one normalized decision envelope; foundation docs reconciled — this task applied the only stale spot (PROJECT_VISION §3.3 "when runtime-qualified" → LIVE-QUALIFIED per #34; documentation-only) | **COMPLETE** |
| **J** | Implementation order/follow-through | dependency chain completed through canonical paths (campaign #39 → RT25 #41 25/25 → corrective closure commits → #48 live apply → #58/#52/#53 chain proven → expiring-allowance §10a); obsolete intermediate names not required per task law | **COMPLETE** |

**ISSUE_32_REQUIRED_ACCEPTANCE_COMPLETE=YES** — zero PARTIAL/BLOCKED.

## 5. Issue-comment scope extensions (19 comments reviewed)

- #34 declared canon for IDE qualification → DONE (closed completed).
- #35 child created for Astra/API/Cursor-BYOK extras → split out; Astra
  branch QUALIFIED_NEGATIVE + parked (below); API/BYOK excluded by operator
  policy → **SUPERSEDED_WITH_VALID_RECONCILIATION** (policy hardening
  comment 2026-09-05 + issue #35 body).
- #39/#41 runtime campaigns accepted PASS/closed with documented corrective
  closure commits → COMPLETE.
- #42/#47/#48/#52/#53/#58 micro-task/automation checkpoints → outside #32
  routing scope (dispatcher chain), closed in their own track → not #32
  blockers.
- Vendor-change guard comment (OpenAI wind-down plan) → informational;
  subscription-only operator policy already encodes the mitigation → no
  action required.

## 6–9. Architecture, collectors, economics, boundaries

See matrix rows C, D, E, F — all verified against live artifacts today
(registry inspection, selector/admission/join modules, translator suites).
The canonical selection envelope answers the core acceptance question
(role, quality/reasoning, harness compatibility, availability, shared-pool
remaining, reserve floor, reset window, effective multiplier economics,
urgency/deferral, deterministic fallback) with persisted auditable reasons
(`decision_id`, `admission_provenance`, `pool_evaluations`,
`economics_attachments`, `expiring_allowance`, reason_codes) at every
relevant boundary.

## 10. Expiring-allowance status (latest PASS re-verified)

```text
EXPIRING_ALLOWANCE_USE_IMPLEMENTED=YES (d165cb8, suite 49/49)
EXPIRING_ALLOWANCE_USE_PROVEN=YES (T1–T4 + N1–N15 + 19 regressions)
EXPIRING_ALLOWANCE_POLICY=GENERIC_PROVIDER_NEUTRAL
USEFUL_READY_WORK_REQUIRED=YES
WORK_MANUFACTURE_FOR_QUOTA_BURN=FORBIDDEN
ALLOWANCE_VERIFICATION_REQUIRED=YES
RESET_OR_EXPIRY_VERIFICATION_REQUIRED=YES
RESERVE_FLOOR_PRESERVED=YES
QUALITY_DEGRADATION_FOR_EXPIRING_ALLOWANCE=NO
EXPIRING_ALLOWANCE_IS_AUTHORIZATION=NO
NO_SILENT_FALLBACK=PASS
ASTRA_DEPENDENCY=NO
```

## 11. #33/#34 completed child status

#33 (Cline→OpenCode nomenclature) CLOSED COMPLETED 2026-09-05;
#34 (Codex IDE in Cursor via ChatGPT subscription) CLOSED COMPLETED
2026-09-05 with live evidence. Both remain closed; no re-litigation needed.

## 12. #35 parked-child analysis (nonblocking proof)

```text
ASTRA_CHILD_STATE=OPEN_PARKED_EXTERNAL_AVAILABILITY (issue re-verified OPEN)
ASTRA qualification=QUALIFIED_NEGATIVE; ASTRA_LIVE_CATALOG_EXPOSED=NO
ASTRA_CHILD_NEXT=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE
PARKED_CHILD_35_BLOCKS_PARENT_CLOSURE=NO
```

Five-condition proof: (1) #32 acceptance is generic — no Astra-specific
acceptance item exists (A–J above reference capability classes, not model
names); (2) the generic MODEL/ACCESS_SURFACE/QUOTA_POOL architecture is
complete and proven; (3) future Astra exposure enters through the existing
dynamic catalog discovery + fail-closed router (`FUTURE_MODEL_AUTO_DISCOVERY`
PASS) with zero redesign; (4) the only Astra-named acceptance text lives in
#35 itself (separated by operator-superseded policy) — parent body never
requires Astra availability; (5) #35 remains independently traceable (own
issue, own QUALIFIED_NEGATIVE report, own wait marker). #35 NOT closed.

## 13. Unresolved REQUIRED blockers

**ISSUE_32_REQUIRED_BLOCKERS_REMAINING=0.**

## 14. Nonblocking future work (not counted as blockers)

Astra exposure wait (#35, OPEN); future new models/providers via dynamic
discovery; Cursor deeper bucket observability if the provider ever exposes
machine-readable verified data (uncertainty already fail-closed); OLD VPS
decommission; unrelated Hermes expansion; OCR/VLM; optional refactors; API/
BYOK routes (operator-excluded).

## 15. Final closure-readiness decision

```text
PARENT_32_CLOSURE_EVALUATION=PASS
ISSUE_32_CLOSURE_READY=YES
ISSUE_32_REQUIRED_ACCEPTANCE_COMPLETE=YES
ISSUE_32_REQUIRED_BLOCKERS_REMAINING=0
PARKED_CHILD_35_BLOCKS_PARENT_CLOSURE=NO
NEXT=V4_PARENT_32_ISSUE_32_CLOSURE_PERSISTENCE_V1
NEXT_HUMAN_GATE_REQUIRED=NO
```

Closure law A–J: A ✔ (core acceptance satisfied), B ✔ (comment extensions
complete/superseded/optional), C ✔ (one canonical core at all boundaries),
D ✔ (separation canon), E ✔ (collectors qualified or uncertainty-preserving),
F ✔ (economics + expiring-allowance proven), G ✔ (no required blocker),
H ✔ (#35 nonblocking + parked), I ✔ (no production activation implied —
everything remains behind closed gates, LOCAL_DEV only,
`PRODUCTION_MODEL_EXECUTION_AUTHORIZED=NO`), J ✔ (frontier coherent —
updated by this task).

#32 NOT closed in this task (persistence is the next bounded task).

## 16. Production/runtime unchanged proof

Read-only evaluation: no Qwen/GLM-route/Codex/Hermes/OpenClaw/ChatGPT-Web
invocation, no browser, no dispatcher tick, no n8n/PostgreSQL/LiteLLM/VPS
mutation, no route-control change, no production authorization, no Telegram
consumption, no credential access. `MODEL_INFERENCE=0`,
`PRODUCTION_DISPATCH=0`, `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`,
`PRODUCTION_CHANGED=NO`, `RUNTIME_CHANGED=NO`. Only documentation artifacts
changed: this report, frontier, LAST_CURSOR_REPORT, and the single
foundation correction (PROJECT_VISION §3.3) — truth already proven by #34
persisted evidence; no historical text rewritten.

## 17. Exact NEXT

`V4_PARENT_32_ISSUE_32_CLOSURE_PERSISTENCE_V1` — bounded task to close #32
as COMPLETED with one concise comment, verify state, and persist the final
markers (same persistence law already proven on issue #61).

## Rollback

`git revert` this commit removes the evaluation report, the two frontier/LCR
entries, and reverts the PROJECT_VISION §3.3 documentation correction. No
runtime artifact touched.
