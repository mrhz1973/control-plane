# LAST CURSOR REPORT

## VPS #68 decommission technical readiness — READY (latest)

**TASK_REF:** `V4_VPS_68_ROLLBACK_EXIT_DECOMMISSION_READINESS_V1`
**Classification:** `PASS — OLD_DECOMMISSION_TECHNICALLY_READY=YES`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `70a9231d30355940de40cff721161aae0a041680` (verified PASS at start)
**Report:** `reports/architecture/v4_vps_68_rollback_exit_decommission_readiness_v1.md`

- 10/10 technical readiness conditions satisfied from persisted evidence
  (cutover/soak/persistence/parity/accounting/consumer-audit); 0
  technical blockers; zero live checks executed; OLD untouched frozen.
- OLD TLS renewal degradation (203/EXEC) classified
  NONBLOCKING_ACCEPTED (current rollback TLS valid to 2026-11-15);
  recorded as human-gate input, no repair performed.
- `OLD_DECOMMISSION_ELIGIBLE_PENDING_HUMAN_GATE=YES`;
  `OLD_DECOMMISSION_AUTHORIZED=NO`; EXECUTED=NO. One factual comment
  added to #68 (not closed).
- NEXT: `HUMAN_OLD_DECOMMISSION_AUTHORIZATION_GATE` (operator gate).

---
## Parent #32 closure persistence — CLOSED_COMPLETED (latest)

**TASK_REF:** `V4_PARENT_32_ISSUE_32_CLOSURE_PERSISTENCE_V1`
**Classification:** `PASS — PARENT_32_CLOSURE_PERSISTENCE=PASS`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `a9122736cf3a3c64eb111e90fef6a59f9f9601f3` (verified PASS at start)
**Report:** `reports/architecture/v4_parent_32_issue_32_closure_persistence_v1.md`

- GitHub issue #32 closed as COMPLETED after evidence re-verification
  (`a912273`); one concise closure comment added
  (issuecomment-5665014442); title/body/labels untouched; state re-read:
  CLOSED / COMPLETED. #35 re-read: OPEN (parked, child-local wait
  preserved).
- CURRENT pointer reconciliation: header banner + all stale global
  claims renamed to `*_then` historical forms; STALE_GLOBAL_NEXT_POINTERS=0.
- FINAL STATE: `ISSUE_32=CLOSED_COMPLETED` ·
  `PARENT_32_TRACK=COMPLETED` · 0 blockers ·
  `MODEL_ACCESS_SURFACE_QUOTA_POOL_SEPARATION=CANONICAL` ·
  expiring-allowance implemented+proven ·
  `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`.
- GLOBAL NEXT (selection law case C):
  `NO_READY_GLOBAL_TASK_PARKED_35_ONLY` — no READY task exists outside
  closed #32; #35 remains parked (never global, no polling); new work
  requires a new operator-authorized slice.

---
## Parent #32 closure evaluation — READY (latest)

**TASK_REF:** `V4_PARENT_32_CLOSURE_EVALUATION_V1`
**Classification:** `PASS — ISSUE_32_CLOSURE_READY=YES`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `d165cb81f6e8ffafa38a3d023e929c47ec8afd99` (verified PASS at start)
**Report:** `reports/architecture/v4_parent_32_closure_evaluation_v1.md`

- Acceptance matrix A–J evaluated against persisted evidence: all
  COMPLETE or COMPLETE-by-design; no REQUIRED blocker remains
  (`ISSUE_32_REQUIRED_BLOCKERS_REMAINING=0`).
- Core acceptance satisfied: the canonical selection core (join →
  reserve admission → economics → rank → §10a expiring-allowance
  preference) answers every dimension with an auditable reason at
  planner/prompt-creator/advisor/implementer/reviewer/retry boundaries.
- Parked child #35 proven NONBLOCKING (generic acceptance, dynamic
  discovery re-entry, independently traceable) —
  `PARKED_CHILD_35_BLOCKS_PARENT_CLOSURE=NO`; #35 stays OPEN.
- Foundation reconciliation applied: PROJECT_VISION §3.3 now records
  Codex-IDE-in-Cursor LIVE-QUALIFIED (#34 evidence) — documentation-only.
- NO issue mutation (#32/#35 both OPEN); MODEL_INFERENCE=0;
  PRODUCTION_DISPATCH=0.
- NEXT: `V4_PARENT_32_ISSUE_32_CLOSURE_PERSISTENCE_V1`
  (NEXT_HUMAN_GATE_REQUIRED=NO).

---
## Expiring-allowance preference policy — IMPLEMENTED+PROVEN (latest)

**TASK_REF:** `V4_EXPIRING_ALLOWANCE_USE_POLICY_V1`
**Classification:** `PASS — EXPIRING_ALLOWANCE_USE_IMPLEMENTED=YES/PROVEN=YES`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `fc43bf27adccde8381ebcd8a9c25eb564132647d` (verified PASS at start)
**Report:** `reports/architecture/v4_expiring_allowance_use_policy_v1.md`

- Generic provider-neutral preference module (strict future ISO-8601
  reset law, configurable neutral 1800s window, allowance
  unknown/stale fail-closed, reserve floor, quality, policy-block) +
  opt-in integration in the RT25 planner core; execution/reviewer/retry
  inherit unchanged. Preference-only: cannot authorize, cannot create
  work, cannot revive denied routes (structurally forbidden).
- Focused suite 49/49 (T1–T4 positive, N1–N15 negative/fail-closed,
  determinism, provider-neutral N15); 19 regression suites green incl.
  registry 76/76, T24 closed-gate E2E 23/23.
- Parent #32 remaining axes now all implemented/qualified →
  `NEXT=V4_PARENT_32_CLOSURE_EVALUATION_V1` (closure evaluated in a
  separate task per law; #32 NOT closed here; Astra child #35 stays
  parked).

---
## Astra-negative parent frontier reconciliation — #32 resumed (latest)

**TASK_REF:** `V4_ASTRA_NEGATIVE_PARENT_FRONTIER_RECONCILIATION_V1`
**Classification:** `PASS — PARENT_32_FRONTIER_RESUMED=YES`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `4f65001d35aa41f4586e8dd352efdc9032535eca` (verified PASS at start)
**Report:** `reports/architecture/v4_astra_negative_parent_frontier_reconciliation_v1.md`

- The global NEXT previously carried the #35 child wait; it is now
  CHILD-LOCAL (`ASTRA_CHILD_NEXT=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE`),
  leaving parent #32 free to continue (`ASTRA_BLOCKS_PARENT_32=NO`,
  `GLOBAL_WAIT_ON_ASTRA=NO`).
- #35 stays OPEN_PARKED (QUALIFIED_NEGATIVE preserved; not closed; no
  polling scheduled; re-armable on any new live-catalog evidence).
- Selection law 5/5 verified for the next independent slice:
  `CURRENT_NEXT=V4_EXPIRING_ALLOWANCE_USE_POLICY_V1`
  (`NEXT_HUMAN_GATE_REQUIRED=NO`) — generic near-reset allowance
  preference policy, part of #32 acceptance, not Astra-dependent.
- Documentation-only task: no runtime/production change; #32/#35 both
  re-verified OPEN and untouched.

---
## GPT-6 Astra subscription qualification — QUALIFIED_NEGATIVE (latest)

**TASK_REF:** `V4_GPT6_ASTRA_SUBSCRIPTION_SURFACE_QUALIFICATION_V1`
**Classification:** `PASS — QUALIFIED_NEGATIVE_NOT_CURRENTLY_EXPOSED`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `e8d874b771af53d14d01c108080dd2524ba21e7c` (verified PASS at start)
**Report:** `reports/architecture/v4_gpt6_astra_subscription_surface_qualification_v1.md`

- Live read-only model/list on both subscription surfaces (Cursor IDE
  extension binary + PATH CLI 0.133.0): gpt-6-astra exposed by NEITHER
  (IDE: gpt-5.6-sol/terra/luna, gpt-5.5; CLI: gpt-5.5/5.4/5.4-mini/
  5.3-codex/5.2). config.toml hint is preference only, not exposure.
- Zero model invocations; no API/BYOK surface; quota pools codex +
  base_model_inference only (canonical chatgpt_codex_subscription).
  Reasoning ladders recorded for exposed models (low→max, ultra on
  5.6-sol/terra); Astra-specific levels UNKNOWN (not exposed).
- Router/registry untouched: dynamic discovery canonical, no silent
  fallback (19/19), pool identity fail-closed (8/8), metadata parsing PASS.
- EXPIRING_ALLOWANCE_USE not implemented/proven → separate task;
  ISSUE_35_CLOSURE_READY=NO, issue #35 left OPEN/untouched.
- NEXT: `WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE`
  (re-arm on any new live-catalog Astra evidence).

---
## Issue #61 closure persistence — CLOSED_COMPLETED (latest)

**TASK_REF:** `V4_HERMES_CONSOLIDATION_AUDIT_ISSUE_61_CLOSURE_PERSISTENCE_V1`
**Classification:** `PASS — ISSUE_61_CLOSURE_PERSISTENCE=PASS`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `b50a7e568360a0d0eb4156bbee7b35477b49fd61` (verified PASS at start)
**Report:** `reports/architecture/v4_hermes_consolidation_audit_issue_61_closure_persistence_v1.md`

- GitHub issue #61 closed as COMPLETED after marker re-verification of the
  persisted closure evidence (`b50a7e5`); one concise closure comment
  added (issuecomment-5663692856); title/body/labels/milestone/assignees
  untouched; state re-read from GitHub: CLOSED / COMPLETED.
- `HERMES_CONSOLIDATION_AUDIT=COMPLETED`; final architecture markers
  persisted unchanged (OpenClaw SCOPED_RETENTION, Hermes native CDP
  canonical, WF90 tick owner, registry-v2 routing canon, Phase 5 closed
  no-expansion, 0 production authorizations, route control DISABLED,
  SHADOW_ONLY, production/runtime unchanged).
- NEXT: `RETURN_TO_PARENT_ISSUE_32_FRONTIER` (parent #32 OPEN; no #32
  work or mutation performed in this task).

---
## Hermes consolidation audit closure evaluation — READY (latest)

**TASK_REF:** `V4_HERMES_CONSOLIDATION_AUDIT_CLOSURE_EVALUATION_V1`
**Classification:** `PASS — ISSUE_61_CLOSURE_READY=YES`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `cc35d1a0efff636efa5e66a78aaa158474238c75` (verified PASS at start)
**Report:** `reports/architecture/v4_hermes_consolidation_audit_closure_evaluation_v1.md`

- Issue #61 original outputs 8/8 COMPLETE (AS-IS map, overlap matrix,
  dispositions, TO-BE, route policy, security, migration plan, quantified
  maintenance reduction).
- All five migration phases reconciled: Phase 1 OpenClaw SCOPED_RETENTION
  (valid supersession of full-RETIRE), Phase 2 CDP governance PASS,
  Phase 3 scheduler role-separation PASS, Phase 4 routing single-source
  PASS, Phase 5 CLOSED_NO_EXPANSION by explicit decision.
- REQUIRED_BLOCKERS_REMAINING=0; security invariants verified (no public
  CDP/noVNC/Funnel, no fallback, D-0025 disabled, 0 production
  authorizations, route control DISABLED, SHADOW_ONLY).
- NO issue mutation: #61 remains OPEN; closure persistence is the next
  bounded task.
- NEXT: `V4_HERMES_CONSOLIDATION_AUDIT_ISSUE_61_CLOSURE_PERSISTENCE_V1`
  (NEXT_HUMAN_GATE_REQUIRED=NO).

---
## Hermes implementer expansion Phase 5 decision — PASS (latest)

**TASK_REF:** `V4_HERMES_IMPLEMENTER_EXPANSION_PHASE_5_DECISION_V1`
**Classification:** `PASS`
**BASE_HEAD:** `67a2ff9074f65228757dfb5c772084d2e67247ad`
**Report:** `reports/architecture/v4_hermes_implementer_expansion_phase_5_decision_v1.md`

- Operator-authorized decision: `PHASE_5_DECISION=KEEP_CURRENT_SCOPE_NO_EXPANSION`;
  `EXPANSION_VALUE=NOT_MATERIAL_OR_NOT_PROVEN`;
  `CURRENT_SCOPE_SUFFICIENT=YES`; `SELECTED_CLASS=NONE`.
- Existing Hermes/browser and bounded Phase F evidence is preserved, while
  general unattended VPS implementer work remains `NOT_QUALIFIED` and
  `PRODUCTION_AUTHORIZED=NO`. `ROUTE_CONTROL_STATE_FINAL=DISABLED`;
  `CURRENT_MODE=SHADOW_ONLY`; `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`.
- `DRY_POLICY_PROOF=NOT_APPLICABLE` because the B decision does not authorize
  an A-branch class proof. `LIVE_CANARY_REQUIRED=NO`;
  `LIVE_CANARY_EXECUTED=NO`; `PRODUCTION_AUTHORIZATION_CREATED=NO`.
- Targeted deterministic regressions: registry `76/76`, Phase F readiness
  `30/30`, promotion `24/24`, activation guards `13/13`, execution adapter
  registry `19/19`, execution adapter router `15/15`.
- `MODEL_INFERENCE=0`; `CHATGPT_WEB_SENDS=0`; `PRODUCTION_CHANGED=NO`;
  `RUNTIME_CHANGED=NO`; `ISSUE_73_PHASE_C=PASS`;
  `ISSUE_73=CLOSED_COMPLETED`.
- `NEXT=V4_HERMES_CONSOLIDATION_AUDIT_CLOSURE_EVALUATION_V1`;
  `PHASE_5_OPTIONAL=CLOSED_NO_EXPANSION`.

---

## Routing policy single source Phase 4 — PASS (latest)

**TASK_REF:** `V4_ROUTING_POLICY_SINGLE_SOURCE_PHASE_4_V1`
**Classification:** `PASS`
**BASE_HEAD:** `32c3702c46313b75014c903b610d11a0ba2b6239`
**Report:** `reports/architecture/v4_routing_policy_single_source_phase_4_v1.md`

- `PHASE_4_ROUTING_POLICY_SINGLE_SOURCE=PASS`;
  `PHASE_4_DECISION=MINIMAL_SHARED_REGISTRY_ADAPTER`;
  `PHASE_4_HUMAN_GATE_REQUIRED=NO`;
  `RESOURCE_REGISTRY_V2=SOLE_CANONICAL_ROUTING_POLICY_SOURCE`;
  `DUPLICATE_POLICY_SOURCES=0`; `UNKNOWN_POLICY_SOURCES=0`.
- Hermes Codex, GLM/Codex eligibility, quota join, and review/retry bindings
  now derive static route relationships through the shared registry-v2
  adapter. LiteLLM remains transport-only/registry-derived; live quota and
  provider-managed model catalogs remain dynamic and external.
- `ROUTER_BEHAVIOR_EQUIVALENCE=PASS`; `V1_COMPATIBILITY_PRESERVED=YES`;
  `DYNAMIC_MODEL_DISCOVERY_PRESERVED=YES`;
  `DYNAMIC_QUOTA_STATE_NOT_FROZEN=YES`; `NO_SILENT_FALLBACK=PASS`.
- Deterministic targeted regressions: `30/30` suites PASS, including registry
  `76/76`, RT25 `136/136`, review `15/15`, retry `14/14`, LiteLLM `18/18` +
  `7/7`, isolated CLI wiring `31/31`; `git diff --check=PASS`.
- No Qwen/GLM/Codex/provider inference, ChatGPT Web/Hermes browser action,
  LiteLLM reload, dispatcher/n8n/VPS/production action, or credential access.
- `ISSUE_73_PHASE_C=PASS`; `ISSUE_73=CLOSED_COMPLETED`;
  `NEXT=PHASE_5_OPTIONAL_HERMES_IMPLEMENTER_EXPANSION_DECISION`;
  `PHASE_5_OPTIONAL=YES`; `PHASE_5_HUMAN_GATE_REQUIRED=YES`. Phase 5 was not
  executed.

---

## LOCAL_DEV scheduler Phase 3 role separation — PASS (latest)

**TASK_REF:** `V4_LOCAL_DEV_SCHEDULER_DEDUP_PHASE_3_V1`
**Classification:** `PASS`
**BASE_HEAD:** `5f4906446f35c5a4380c3810bfe3363b00b396bc`
**Report:** `reports/architecture/v4_local_dev_scheduler_dedup_phase_3_v1.md`

- `PHASE_3_SCHEDULER_DEDUP=PASS`;
  `PHASE_3_DECISION=NO_DEDUP_REQUIRED_ROLE_SEPARATION`.
- WF90 is the sole periodic 5-minute tick scheduler; the Windows task is the
  `ControlPlane-V4-LocalDevDispatcher` service supervisor.
- `ACTIVE_TICK_GENERATORS=1`, `SINGLE_FLIGHT_GUARD=PASS`,
  `DOUBLE_EXECUTION_OBSERVED=NO`, `SERVICE_RECOVERY=PASS`,
  `TICK_RECOVERY=PASS`, and topology is unambiguous.
- Deterministic regressions: dispatcher `69/69 PASS`; WF90 normalizer `18/18
  PASS`. No live scheduler mutation, model inference, production dispatch,
  or infrastructure change occurred.
- The current executor snapshot had no running local task/listener; this was
  observed read-only. Persisted sanitized restart and natural-tick evidence
  remains the recovery proof.
- `NEXT=V4_ROUTING_POLICY_SINGLE_SOURCE_PHASE_4_V1`;
  `PHASE_4_HUMAN_GATE_REQUIRED=NO`. Phase 4 was not executed.

---

## Hermes CDP governance unification Phase 2 — PASS (latest)

**TASK_REF:** `V4_HERMES_CDP_GOVERNANCE_UNIFICATION_PHASE_2_V1`
**Classification:** `PASS`
**BASE_HEAD:** `47fbd800238af9f91aa49c12135d6cf0dd8afe8b`
**Report:** `reports/architecture/v4_hermes_cdp_governance_unification_phase_2_v1.md`

- `PHASE_2_CDP_GOVERNANCE_UNIFICATION=PASS`;
  `HERMES_NATIVE_GOVERNED_CDP=CANONICAL`.
- Census result: `LEGACY_LIVE_CALLERS=0`,
  `LEGACY_GOVERNED_CDP_GLUE_ACTIVE_CALLERS=0`, `UNKNOWN=0`; legacy files are
  preserved for rollback and are not active runtime dependencies.
- Native parity and the prefill-only qualification evidence are PASS;
  `RAW_CDP_CONTROLLER_EXPOSURE=NO` and `PUBLIC_EXPOSURE=NO`.
- Focused deterministic regressions PASS: legacy adapter checks and native
  per-invocation allowlist `73/73`.
- Visual sidecar unchanged; no browser/provider/production action occurred;
  `RUNTIME_AUTHORITY_CHANGED=NO` and `PRODUCTION_CHANGED=NO`.
- `ISSUE_73_PHASE_C=PASS`. `NEXT=PHASE_3 scheduler dedup LOCAL_DEV` and
  `PHASE_3_HUMAN_GATE_REQUIRED=YES`; Phase 3 was not executed.

---

## Canonical next repair after OpenClaw reconciliation — PASS (latest)

**TASK_REF:** `V4_CANONICAL_NEXT_REPAIR_AFTER_OPENCLAW_RECONCILIATION_V1`
**Classification:** `PASS`
**BASE_HEAD:** `f5e4122b8479c5444f05e700bcdbdaac2c174297`
**Report:** `reports/architecture/v4_canonical_next_repair_after_openclaw_reconciliation_v1.md`

- The previous reconciliation's current `PHASE_D=OPEN` / Phase D V1 NEXT
  markers were stale; historical rows remain unchanged.
- `V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2=PASS` and
  `ISSUE_73_PHASE_D=PASS` are current evidence.
- `V4_HERMES_PHASE_F_BOUNDED_PRODUCTION_ACTIVATION_V1=PASS`,
  `ISSUE_73=CLOSED_COMPLETED`, and
  `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0` remain current.
- `STALE_PHASE_D_NEXT_REMOVED=YES`; `OPENCLAW_RECONCILIATION_UNCHANGED=YES`.
- `CURRENT_NEXT=V4_HERMES_CDP_GOVERNANCE_UNIFICATION_PHASE_2_V1`.
  Phase 2 is not executed here; runtime and production are unchanged.

---

## OpenClaw retirement scope reconciliation — PASS (historical snapshot; current markers superseded)

**TASK_REF:** `V4_OPENCLAW_RETIREMENT_SCOPE_RECONCILIATION_V1`
**Classification:** `PASS`
**BASE_HEAD:** `a07269694ac700f763b43c49fb62894b823e3d3a`
**Report:** `reports/architecture/v4_openclaw_retirement_scope_reconciliation_v1.md`

- Original OpenClaw retirement assumed zero live qualified callers; the Phase 1
  audit later proved the live GLM quota observation lane.
- Value comparison: `GLM_OPENCLAW_VALUE=UNIQUE` and
  `CODEX_OPENCLAW_VALUE=INFERIOR`; Phase 0.5 moved Codex authority to the
  app-server and retained OpenClaw only for `glm_coding_plan` observation.
- `OPENCLAW_FINAL_DISPOSITION=SCOPED_RETENTION`;
  broker/fallback/agent-runtime roles are `RETIRED`.
- `ISSUE_73_PHASE_C=PASS`; `PHASE_D=OPEN`; NEXT is
  `V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V1`.
- Runtime/production unchanged; no OpenClaw, GLM, Codex app-server, provider,
  browser, Telegram, n8n, VPS, or dispatcher execution occurred.

---

## OpenClaw quota lane retirement Phase 0.5 — PASS (latest)

**TASK_REF:** `V4_OPENCLAW_QUOTA_LANE_RETIREMENT_PHASE_0_5_V1`
**Classification:** `PASS — CODEX_QUOTA_AUTHORITY=CODEX_APP_SERVER`
**Date (Europe/Rome):** 2026-09-14 (implementation 06:51–07:16; persisted before 07:50 cutoff)
**BASE_HEAD:** `48092420d7c8b11e5cc4e2d21ef45483dd3c78f8` (verified PASS at start)
**Report:** `reports/architecture/v4_openclaw_quota_lane_retirement_phase_0_5_v1.md`

- Codex pool authority migrated to `CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ`:
  OpenClaw codex contributions suppressed at source, reconciliation flipped to
  `CODEX_APPSERVER_PRIMARY` with OpenClaw `DIAGNOSTIC_ONLY`, observatory card
  rebuilt from authority or vetoed fail-closed (UNKNOWN/STALE, never OpenClaw
  fallback). GLM scope untouched on the OpenClaw collector.
- New bounded read-only live reader (`codex app-server` stdio RPC, 20 s
  deadline, tree-kill, consume never called) wired into GET /v1/resources;
  live validation: codex AVAILABLE/fresh from authority; GLM unchanged.
- Mandatory fail-closed test PASS (fresh OpenClaw codex data present +
  app-server absent → codex UNKNOWN, OpenClaw values stripped).
- Regressions: focused 8/8; appserver PASS; collector 26/26; observatory PASS;
  dispatcher 69/69. MODEL_INFERENCE=0; production dispatch unchanged.
- Deferred GLM follow-ups: `usedToRemainingPercent(null)→100` wrinkle;
  OpenClaw `usage.updatedAt` future-dating.
- NEXT: bounded reconciliation of OpenClaw retirement scope (broker/fallback
  retired, GLM quota collector retained). No automatic further retirement.

---
## OpenClaw quota lane value comparison — KEEP_SCOPED (latest)

**TASK_REF:** `V4_OPENCLAW_QUOTA_LANE_VALUE_COMPARISON_V1`
**Classification:** `PASS — OPENCLAW_QUOTA_DECISION=KEEP_SCOPED (POOL=glm_coding_plan)`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `e55d6d7d1e2516b172b074d57cd765e83c5ed150` (verified PASS at start)
**Report:** `reports/architecture/v4_openclaw_quota_lane_value_comparison_v1.md`

- Live bounded probes (≤3/source, read-only): OpenClaw `status --usage --json`
  3/3 at 130–133 s/invocation (~150 s historical cost CONFIRMED); codex
  app-server `account/rateLimits/read` direct stdio 0.46–0.73 s with full
  authoritative snapshot (5h usedPercent=100 rate_limit_reached, week 31%,
  planType=plus, base_model_inference gpt-reserve weekly 3%, banked credits 0);
  GLM monitor NOT probed — ZAI/ZHIPUAI credential absent in all scopes
  (fail-closed, values never read).
- GLM_OPENCLAW_VALUE=UNIQUE (only live machine-readable GLM source today);
  CODEX_OPENCLAW_VALUE=INFERIOR (direct source ~200× faster, strictly richer,
  authoritative; live 5h divergence proven vs OpenClaw materialized remaining=100).
- New findings recorded unfixed: `usedToRemainingPercent(null)→100` marginal
  fail-open; OpenClaw `usage.updatedAt` future-dated ~+5 h anomaly.
- `OPENCLAW_BROKER_RUNTIME=RETIRE` unchanged; quota lane becomes KEEP_SCOPED.
- NEXT: `V4_OPENCLAW_QUOTA_LANE_RETIREMENT_PHASE_0_5_V1` scoped to
  `chatgpt_codex_subscription` only (promote codex app-server collector to pool
  authority); OPERATOR_PREAUTHORIZED=YES. GLM scope stays on OpenClaw until a
  credentialed direct source exists.

---
## OpenClaw Phase 1 paper retirement — STOP (latest)

**TASK_REF:** `V4_OPENCLAW_PAPER_RETIREMENT_PHASE_1_V1`
**Classification:** `STOP — OPENCLAW_PAPER_RETIREMENT_BLOCKED_BY_LIVE_REFERENCE`
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD:** `eca01ad147289b422cdec4f3bbd66fbff4d0e395` (verified PASS at start)
**Report:** `reports/runtime/openclaw-retirement/STOP_PAPER_RETIREMENT_PHASE_1_V1.md`

- Caller audit found ONE live runtime caller: the #73 OpenClaw quota observation
  lane wired into the LIVE LOCAL_DEV dispatcher
  (`serve-local-dev-autonomous-dispatcher-v1.mjs` → `buildResourceObservatory` →
  `collectQuotaObservatory` → `getOpenClawQuotaObservation` → CLI
  `openclaw status --usage --json`). Live proof during audit: dispatcher PID 27964
  with child PID 5088 executing the OpenClaw CLI; GET /v1/resources returned
  `quotas.openclaw.refresh_in_progress=true`.
- `tools/collect-codex-appserver-quota-v1.mjs` declares
  `routing_authority=OPENCLAW_PRIMARY` consuming the same lane → real data-plane
  dependency, not dormant code. No disable switch exists.
- Therefore PAPER retirement would be a REAL runtime behavior change (forbidden
  by task law). Registry v2 already OpenClaw-free; historical evidence untouched;
  zero files modified besides this STOP persistence.
- NEXT (pending operator decision): PHASE_0.5 gated task to retire the quota
  observation lane, OR amend audit disposition to broker-only retirement keeping
  the qualified #73 quota lane.

---
## Issue #79 closure persistence (latest)

**TASK_REF:** `LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1_ISSUE_79_CLOSURE_PERSISTENCE`
**Classification:** `PASS — issue #79 CLOSED_COMPLETED, capability complete`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `7d24f61b2cd019d33ae0f6c9178ee4fc70362663`
**Report:** `reports/architecture/local_dev_hermes_qwen_activity_observability_v1_issue_79_closure_persistence.md`

- Issue #79 closed via `gh` (state=CLOSED, stateReason=COMPLETED) after the
  closure-eligible verdict of the previous task. Closure comment posted
  (comment id 5656285693): MINIMUM_CAPABILITY_COMPLETE=YES,
  READ_ONLY_OBSERVABILITY=PASS, DISPATCHER_IDLE_WITH_EXTERNAL_ACTIVE=PASS,
  AUTHORITY_EXPANSION=NO, PRODUCTION_CHANGED=NO, realized architecture and
  confirmed semantics. Historical backlog body preserved (verified marker).
- Repo persistence: frontier + last-cursor updated, minimal report added.
- `NEXT_AFTER_CLOSURE`: NONE for #79; reopen only on future evidence of a
  real observability gap.


## Issue #79 closure evaluation (latest)

**TASK_REF:** `LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1_ISSUE_79_CLOSURE_EVALUATION`
**Classification:** `PASS — ISSUE_79_CLOSURE_ELIGIBLE=YES / MINIMUM_CAPABILITY_COMPLETE=YES`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `585e415a315dba979fdc74ef251e1da348e6839c`
**Report:** `reports/architecture/local_dev_hermes_qwen_activity_observability_v1_issue_79_closure_evaluation.md`

- All 18 acceptance points of issue #79 verified SATISFIED against real
  code (dispatcher `agent_activity` additive section + `/v1/agent-activity`,
  dashboard `agentops` distinct section) and persisted evidence. Lane suite
  re-run on this tree: 23/23 PASS. `VISUAL_INSPECTION` verified additive
  stage only (no authority law touched).
- `READ_ONLY_OBSERVABILITY=PASS`, `DISPATCHER_IDLE_WITH_EXTERNAL_ACTIVE=PASS`,
  `AUTHORITY_EXPANSION=NO`, `PRODUCTION_CHANGED=NO`.
- Issue #79 NOT mutated in this task. NEXT: bounded issue #79 closure
  persistence only.


## Issue #78 closure persistence (latest)

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_ISSUE_78_CLOSURE_PERSISTENCE`
**Classification:** `PASS — issue #78 CLOSED_COMPLETED, capability complete`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `ec0a02228b9c0bdd82ff38bcfc909f241a1c62b0`
**Report:** `reports/architecture/qwen_browser_visual_sidecar_v1_issue_78_closure_persistence.md`

- Issue #78 closed via `gh` (state=CLOSED, stateReason=COMPLETED) after the
  closure-eligible verdict of the previous task. Closure comment posted
  (comment id 5656169973): MINIMUM_CAPABILITY_COMPLETE=YES, completed chain,
  wiring PASS, Autovia PASS read-only, safety laws, OCR/VLM NOT REQUIRED
  NOW. Historical backlog body preserved (verified marker + length).
- Repo persistence: frontier + last-cursor updated, minimal report added.
  `OCR_ESCALATION_REQUIRED_NOW=NO`, `VLM_ESCALATION_REQUIRED_NOW=NO`.
- `NEXT_AFTER_CLOSURE`: NONE for #78; reopen only on future evidence of a
  real capability gap.


## Issue #78 closure evaluation (latest)

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_ISSUE_78_CLOSURE_EVALUATION`
**Classification:** `PASS — ISSUE_78_CLOSURE_ELIGIBLE=YES / MINIMUM_CAPABILITY_COMPLETE=YES`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `c4ad487bc5cc7bb0bea7f0ec2922a71e7ea3d3e2`
**Report:** `reports/architecture/qwen_browser_visual_sidecar_v1_issue_78_closure_evaluation.md`

- All 14 acceptance points of issue #78 verified SATISFIED against real
  evidence on this tree (benchmark 15/15 + repair suite 28/28 + runtime
  wiring 23/23). `screenshot --annotate` satisfies the MINIMUM UI-detection
  capability (element identity from the accessibility tree — the reliable
  source — not pixel OCR); canvas/pixel-only pages are covered by the
  deterministic fail-closed `EMPTY_ANNOTATIONS` law (zero invented targets).
- `OCR_ESCALATION_REQUIRED_NOW=NO`, `VLM_ESCALATION_REQUIRED_NOW=NO` — both
  stay future enhancements, evidence-gated (OCR only if pixel-only text
  becomes a proven blocker; VLM remains VRAM-gated by the issue's own
  resource law).
- Recommendation: close #78 as minimum capability complete, noting OCR/VLM
  as evidence-gated future enhancements. The issue itself was NOT mutated
  in this task (closure persistence is the explicit NEXT).


## Qwen browser visual sidecar V1 — runtime wiring (latest)

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_RUNTIME_WIRING`
**Classification:** `PASS — sidecar wired into the real Hermes browser path`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `a121c9c613dc8556b255a54df4eb1f992b630602`
**Report:** `reports/architecture/qwen_browser_visual_sidecar_v1_runtime_wiring.md`

- **New surface (one project-owned file):**
  `tools/hermes-visual-observation-adapter-v1.mjs` — real bridge
  `exec-tool browser_snapshot` under the bounded tree-kill runner,
  deterministic DOM gate (code-owned, never model-hallucinated), at most
  ONE `observeVisually()` per cycle, fail-closed envelopes, zero invented
  targets, no action authority. Bridge env per-process: `BROWSER_CDP_URL`
  pinned + ephemeral `HERMES_HOME` (loopback-only `allow_private_urls`;
  production config never touched).
- **Proof (23/23, single run):** rich page gate SUFFICIENT calls=0;
  policy-gated rich cycle → real `@e1,@e2,@e3` to the controller layer;
  canvas-only → EMPTY_ANNOTATIONS zero targets; bounded failure 10.5 s;
  ephemeral screenshots; #79 VISUAL_INSPECTION telemetry; 1 call/cycle;
  Qwen READY before/after; OCR=NO; VLM=NO; loopback-only CDP; temp profile;
  zero leaks; prior sidecar suite 28/28 re-run inside. AUTOVIA:
`AUTOVIA_CAN_USE_REAL_BROWSER_OBSERVATION_PATH=YES` demonstrated,
  no autonomous task activated.
- **NEXT:** evaluate issue #78 closure (minimum capability complete);
  OCR escalation only on real evidence of `--annotate` insufficiency.


## Qwen browser visual sidecar V1 — failure-path bounding repair (latest)

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_FAILURE_PATH_BOUNDING_REPAIR`
**Classification:** `PASS — T5 blocker repaired; MINIMAL_IMPLEMENTATION materially complete/superseded`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `7faf6f9372582a5fb0162bdef58988c2e8573240`
**Report:** `reports/architecture/qwen_browser_visual_sidecar_v1_failure_path_bounding_repair.md`

- **Root causes proven (bounded probes):** (1) per-call `--cdp` deadlocks a
  live daemon — the original 33 min / 1.7 h hangs; (2) `npx --yes` cold-start
  unbounded; (3) Node `close` never fires when the vendor CLI's grandchild
  daemon inherits stdout — success was misread as timeout (`✓ Done` captured);
  (4) `--annotate` returns no annotations without a prior `snapshot`;
  (5) daemon cold-start connect ~20 s.
- **Repair (project-owned):** pinned direct vendor exe from npx cache
  (v0.26.0, no npx/network/vendor mutation); `runBoundedTree` — absolute
  deadline ⇒ `taskkill /PID /T /F`, completion on process `exit`; three-step
  pinned flow `connect` → `snapshot` → `screenshot --annotate`.
- **Proof:** suite single-run **28/28 PASS** (~28 s): T5 bounded tree-kill →
  UNAVAILABLE in **960 ms**, zero invented targets, no probe orphans;
  `@e1,@e2,@e3` mapping restored; ephemeral screenshots; fail-closed
  ambiguity/malformed/Qwen-unhealthy; OCR=NO, VLM=NO; loopback-only CDP;
  temp profile; VISUAL_INSPECTION in #79 lane (no image data); Qwen READY
  (VRAM 9144/2972 MiB). Regressions: #79 23/23, MCP gate 37/37, dispatcher
  69/69. REAL_CHATGPT_WEB_SENDS=0, PRODUCTION_CHANGED=NO.
- **NEXT:** OCR escalation evaluation only if evidence shows `--annotate`
  insufficient — no automatic OCR install.


## Qwen browser visual sidecar V1 minimal implementation — latest

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_MINIMAL_IMPLEMENTATION`
**Classification:** `STOP — T5_FAILURE_PATH_PROBE_NOT_BOUNDED (operator interrupted; worktree preserved uncommitted)`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `57f6555c86affe5db3169925845ec04426899825`
**STOP report:** `reports/runtime/qwen-browser-visual-sidecar/STOP_MINIMAL_IMPLEMENTATION.md`
**STOP evidence:** `reports/runtime/qwen-browser-visual-sidecar/stop-evidence.json`

- **Blocker:** the vendor `agent-browser` daemon caches the first `--cdp`
  endpoint and ignores later ones; after a daemon kill a fresh `npx --yes`
  invocation can cold-hang without emitting any JSON envelope, outliving
  exec timeouts. Failure-path probes hung 22 min and ~4.7 h before being
  killed. T5 (`capture failure ⇒ UNAVAILABLE`) therefore cannot be proven
  bounded ⇒ STOP at the first real blocker, no live workaround.
- **Already proven before STOP (24/25 suite):** live annotated path works —
  `--annotate` returned `@e1,@e2,@e3` with boxes; screenshots ephemeral
  (own temp + CLI default dir cleaned); fail-closed envelopes for empty/
  malformed/ambiguous annotations; Qwen-unhealthy ⇒ blocked; Qwen primary
  READY (12–23 ms) throughout; no OCR, no VLM, no public CDP, no profile
  mutation; `VISUAL_INSPECTION` visible in the #79 lane with zero image
  data. Regressions inside the suite: #79 23/23, MCP gate 37/37,
  dispatcher 69/69.
- **Preserved uncommitted (operator order — do not discard):**
  `tools/qwen-browser-visual-sidecar-v1.mjs` (annotate-tier helper,
  `OCR_ENABLED=NO`, `VLM_ENABLED=NO`, observation-only), additive
  `VISUAL_INSPECTION` stage in `agent-activity-registry-v1.mjs`, and the
  `tests/qwen-browser-visual-sidecar-implementation/run.mjs` harness.
- **NEXT:** bounded failure-path remediation (project-owned process-tree
  timeout, pinned daemon endpoint, or daemon-caching off via env/config)
  BEFORE any retry. No OCR/VLM installation.


## Qwen browser visual sidecar V1 evaluation — latest

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_EVALUATION`
**Classification:** `PASS — SELECTED_ARCHITECTURE=B OCR_FIRST_WITH_VLM_ESCALATION_ON_DEMAND; VLM_LIVE_BENCHMARK=DEFERRED_RESOURCE_SAFETY; IMPLEMENTATION_AUTHORIZED=NO`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `be0a2daea2456ef17d0fdc8cdbfb40a5a12b3849`
**Report:** `reports/architecture/qwen_browser_visual_sidecar_v1_evaluation.md`
**Evidence:** `reports/runtime/qwen-browser-visual-sidecar/evaluation-evidence.json`
**Benchmark:** `tests/qwen-browser-visual-sidecar-evaluation/run.mjs` — 15/15 PASS (controlled local fixture, no ChatGPT Web)

- **Capture surface QUALIFIED:** installed Hermes already owns a native
  `screenshot` primitive (`browser_tool_session.py`, incl. Chrome fallback);
  agent-browser 0.26.0 `screenshot --annotate` maps numbered labels to
  snapshot refs (visual→actionable bridge without OCR); CDP
  `Page.captureScreenshot` verified (valid PNG, median 27 ms). No public
  CDP (loopback bind proof T10), no profile mutation (throwaway temp
  profile, real one never referenced — T11), no production route mutation
  (T12).
- **Measured:** DOM baseline median 13 ms / p95 14 ms (n=20, 4/4
  elements); capture median 27 ms; VRAM delta across benchmark 29 MiB;
  Qwen primary READY at every pressure checkpoint (10–41 ms) with
  byte-identical command line (T8); no orphan processes; temp artifacts
  removed (T9).
- **OCR stage:** no engine installed on workstation (no tesseract/OpenCV;
  Pillow only). Structured-result contract + confidence gating +
  fail-closed paths proven with a deterministic stand-in (T3/T3B/T6/T7).
  Implementation-task candidates: RapidOCR (ONNX CPU) or the annotate
  route (no OCR at all).
- **VLM tier:** DEFERRED_RESOURCE_SAFETY — live free VRAM ~0.4 GiB against
  the resident 27B Qwen primary; zero local vision models (no mmproj,
  empty clip_vision, no ollama vision tags); mtmd.dll present but
  co-residency impossible; on-demand load/unload (5–15 s cold start) or
  CPU-only are the only compatible modes.
- **Selection law:** DOM default → screenshot+OCR/UI on DOM insufficiency →
  small VLM on-demand only on measured ambiguity → fail-closed structured
  UNKNOWN (targets never invented). Sidecar observes only — no clicks/
  typing from the visual path, no second authority; future implementation
  maps to #79 observability as a read-only stage.
- **Hard walls:** evaluation only; no implementation/live activation; no
  new API/BYOK; no permanent VLM resident; screenshots ephemeral (T5).


## Local dev Hermes/Qwen activity observability V1 — latest

**TASK_REF:** `LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1`
**Classification:** `PASS — READ_ONLY_OBSERVABILITY_LIVE; DISPATCHER_IDLE_WITH_EXTERNAL_ACTIVE=PASS; PRODUCTION_CHANGED=NO`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `b325d72eff18d3c1058f2b3d7705b9593598d02c`
**Report:** `reports/architecture/local_dev_hermes_qwen_activity_observability_v1.md`
**Evidence:** `reports/runtime/local-dev/agent-activity-observability-evidence.json`

- **Pattern:** local JSON ephemeral registry (`agent-activity-registry-v1.mjs`,
  `%LOCALAPPDATA%\control-plane\agent-activity-registry-v1.json`, bounded 20,
  merge-on-upsert, atomic write) + GET-only `/v1/agent-activity` and additive
  `agent_activity` field in `/v1/diagnostics` served by the EXISTING dispatcher
  process. No new service.
- **Schema:** exactly the mission fields; states ACTIVE/WAITING/PASS/STOP/UNKNOWN/STALE;
  all 12 mission stages; freshness computed at read time (90 s threshold ⇒ STALE,
  missing ⇒ UNKNOWN, PASS/STOP never reinterpreted, zero heartbeat side effects).
- **Sanitization:** allow-list-only persistence (hostile payloads with cookies/
  tokens/credentials/session ids leave zero trace — T8/T9); `auth_state` boolean-
  sanitized; no raw session identity.
- **Dashboard:** distinct `AGENT` section (agentops, canonical order resources →
  ops → agentops → queue) labelled "Fuori dal ciclo di selezione/claim"; proves
  DISPATCHER=IDLE_CLEAN concurrently with an ACTIVE Hermes/Qwen browser operation
  (T2); WAITING+HUMAN_GATE visible (T3) without any Telegram polling.
- **Writer integration:** `hermes-allowlist-live-send-v1.mjs` publishes the full
  stage lifecycle + STOP reasons, best-effort (publish failure can never affect
  gates/budgets/send path). Synthetic lifecycle + STOP proven; NO real send.
- **Authority law:** module exports no tick/claim/authorize/execute surface;
  endpoint acquires no tick lock; task/receipt/queue untouched (T10–T12).
- **Tests:** observability fixture 23/23 PASS; dispatcher suite 69/69 PASS
  (S71 updated to the new 4-section canonical layout — additive); MCP gate suite
  37/37 PASS (operator-wait law untouched); runtime docs UTF-8 integrity
  re-verified (BOM=false, U+FFFD=0).


## Cursor ACP MCP human gate persistent operator wait V1 — latest

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_PERSISTENT_OPERATOR_WAIT_V1`
**Classification:** `PASS — OPERATOR_WAIT_LONG_LIVED=PASS; UTF8_INTEGRITY_RESTORED; REAL_TELEGRAM_SENDS=0`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `76920a352adbeffe2dba8da0f4b9ee73f513f40a`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_persistent_operator_wait_v1.md`

- **PART 1 (UTF-8):** `CURRENT_FRONTIER.md` restored from the pristine parent
  blob (`2dc213f`) + RETRY4 semantic delta re-applied via Node (native UTF-8,
  LF, no BOM). Verified: mojibake=0, replacement chars=0, exactly one row
  differs from parent (row 23, the RETRY4 append). First repair attempt
  (latin-1 roundtrip) degraded CP1252 bytes → discarded before commit.
- **PART 2 (lifetime law):** new `lifetime_mode` on every decision.
  `operator_wait` (new default): `expires_at=null`, `ttl_ms=null` — NO
  auto-expiry; a valid human callback is admittable at +15m/+1h/+2h/+8h and
  beyond. `bounded_ttl` (legacy, explicit): unchanged law, EXPIRED fence kept
  (old fixtures valid). `markNoAnswer` forbidden on operator_wait.
  Explicit persisted terminal events added: CANCELLED (with by/reason,
  auditable history) and SUPERSEDED (canonical supersession via new
  generation; callback on superseded rejected; new generation admits).
- Background waiter now re-arms bounded transport waits (default 10m, cap 1h;
  1s gap — no busy loop) and NEVER terminates on wall-clock time; terminal
  only on ANSWERED, explicit CANCELLED/SUPERSEDED, or fatal transport class
  (CONFLICT/AUTH — decision stays PENDING, fail-closed). Status poll slice
  unchanged (8s default, 20s cap ≪ 45s watchdog budget); elapsed time alone
  always reports PENDING.
- Crash/restart: PENDING survives in the persistent store; waiter resumes at
  first re-arm; no session/load on the live path; never falsely "actively
  polled" when no server is alive (documented limit, fail-closed).
- Tests: persistent-wait fixture **25/25 PASS** (injected clock: 15m/1h/2h/8h,
  A/B/C callbacks at +2h, explicit terminals, fences post-long-wait, no busy
  polling, persistence across reload, legacy compat); MCP suite **37/37**;
  watchdog fixture 13/13 (W7 updated to the new law); guards PASS;
  prompt-timeout 19/19; soak 0 failures; leaks 0.
- `REAL_TELEGRAM_SENDS=0`, `PRODUCTION_CHANGED=NO`. NEXT: deterministic
  evidence suffices for the ≥2h requirement (RETRY4 remains semantically
  valid for the rest of the chain); an optional live long-wait proof would be
  `ONE_LONG_WAIT_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION` (operator
  decision required, not executed).

---

## Cursor ACP MCP human gate Telegram E2E final real proof RETRY4 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1_FINAL_REAL_PROOF_RETRY4`
**Classification:** `PASS — REAL E2E PROVEN END-TO-END (watchdog-safe two-step contract)`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `2dc213ffa6876f0119706074664c7992c4d727fc`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_telegram_e2e_final_real_proof_retry4_v1.md`

- One real Telegram E2E executed with the qualified watchdog-safe Pattern B
  contract: `human_gate` → PENDING (~0.3s tool call) → model declared
  WAITING_FOR_OPERATOR and waited with NO pending tool call → real operator
  tap (option A, first attempt, admitted) → canonical VERIFIED→RETURNED →
  `human_gate_status` (1 call, <1s) recovered the canonical option → exact
  consumption `GATE_CONSUMPTION_JSON option=A APPROVE_AND_CONTINUE` in the
  SAME session (`session_sha e224dd9722a4`, 0 session/new, no session/load).
- Budgets held: REAL_TELEGRAM_SENDS=1 · ACTIVE_GATE_MESSAGES=1 ·
  HUMAN_GATE_CREATIONS=1 · MAX_TOOL_CALL_DURATION_MS≈300 (≪45s safe budget vs
  ~60s vendor watchdog) · human wait fully OUTSIDE tool calls.
- Live negative fences (post-callback, no extra sends): duplicate, unknown
  decision, wrong session, wrong generation, invalid option — all rejected.
- Terminal cleanup: keyboard deactivated (registry active=null), issuance
  quiesce→restore VERIFIED, process leaks 0, PRODUCTION_CHANGED=NO.
- Driver updated pre-run to the two-step prompt contract (PENDING is NOT a
  decision; bounded polling only via human_gate_status).
- E2E task `V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1=PASS` — the bounded
  human-gate chain is proven live end-to-end. NEXT: operator-driven; no
  further retry owed.

---

## Cursor ACP MCP human gate 60s watchdog remediation V1 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1`
**Classification:** `PASS — VENDOR_60S_WATCHDOG_CAUSE=CONFIRMED; LONG_BLOCKING_MCP_CALL_REMOVED=PASS; REAL_TELEGRAM_SENDS=0`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `1f4def31ac5bfab38ab7e045f3c74ad954a0f85d`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_60s_watchdog_remediation_v1.md`

- Root cause (RETRY3): vendor Cursor Agent ACP runtime errors a single blocking
  MCP tool call at ~60.1s; the model got a tool error and closed the turn with
  `GATE_FAILED` before the real operator callback was admitted.
- Primitive qualification: vendor async-MCP primitive NOT supported (A/C
  excluded without assumption); **Pattern B selected (project-owned PENDING +
  bounded status/poll contract, same ACP session)**; Pattern D not needed.
- `human_gate` now returns `status=PENDING` immediately (no operator wait
  inside any tool call); a background waiter INSIDE the MCP server (single
  getUpdates consumer) performs canonical admission VERIFIED→RETURNED;
  new `human_gate_status` performs read-only bounded poll slices (default 8s,
  cap 20s ≪ 45s safe budget vs 60s observed watchdog), never authorizes,
  never invents, never sends, never creates gates; PENDING is not a decision.
- REAL ACP harmless qualification (null transport, zero Telegram): gate tool
  call 3.0s ≪ 45s budget; real 70s human delay with NO pending tool call;
  canonical recovery RETURNED option B exact-consumed in the SAME session
  (`session_sha 2173bc362554`, 0 session/new, no session/load).
  Evidence: `reports/runtime/cursor-acp/watchdog-remediation-acp-qualification.json`.
- Deterministic tests: adapter suite **35/35 PASS** (updated to the watchdog-
  safe contract); new watchdog fixture **13/13 PASS** (fast PENDING, budget,
  >60s synthetic delay, post-delay canonical recovery, exact A/B/C, no
  default, fences, single gate/send); soak 0 failures; final-proof guards PASS;
  process leaks 0.
- Repaired pre-existing exit hang (project-owned):
  `v4-cursor-acp-session-wiring-probe-v1.mjs` now tree-kills the ACP wrapper
  (taskkill /T /F) and exits explicitly on win32.
- `READY_FOR_FINAL_REAL_E2E=true`; **NEXT =
  `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION`** (the E2E prompt
  must instruct the two-step PENDING→status consumption contract).

---

## Cursor ACP MCP final E2E prompt timeout cleanup repair V1 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_FINAL_E2E_PROMPT_TIMEOUT_CLEANUP_REPAIR_V1`
**Classification:** `PASS — UNHANDLED_PROMPT_TIMEOUT_BYPASS=ELIMINATED; REAL_E2E=NOT_RUN`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `0b04ecefb46a0b206631d9314edb6c67d4d00353`
**Report:** `reports/architecture/v4_cursor_acp_mcp_final_e2e_prompt_timeout_cleanup_repair_v1.md`

- Repaired the RETRY2 STOP finding: `session/prompt` now carries an explicit
  human-wait-compatible timeout DERIVED from the gate lifecycle
  (`registration 120s + TTL 900s + resolution 60s + terminal 60s`), not the
  generic 30s RPC default (other RPCs keep 30s).
- New pure helper `tools/v4-cursor-acp-prompt-lifecycle-v1.mjs`:
  `derivePromptTimeoutMs` (bounded, lifecycle-derived, input-validated),
  `createPromptTracker` (IMMEDIATE rejection ownership; observable
  PENDING/FULFILLED/REJECTED), `installUnhandledRejectionGuard` (safety net
  that records sanitized reasons and never kills the process outside the
  lifecycle).
- Both bounded polling loops (registration wait; operator wait) observe
  prompt failure and the guard → controlled STOP fail-closed without burning
  the TTL; the final prompt await wraps rejection into
  `stop("PROMPT_FAILED")` through main try/finally; terminal finally flips
  non-PASS to STOP when the guard fired.
- Focused qualification **19/19 PASS** (timeout derivation, ownership,
  early/during/timeout/ACP-exit rejections → controlled STOP with finally
  reached, keyboard deactivation attempted iff currentGate, no-gate cleanup
  idempotent, restore always attempted + verified fail-closed, no semantic
  regression).
- Regressions: MCP gate suite **32/32 PASS**; soak 319 iters
  (`VALID_CALLBACK_LOST=0`, `PROCESS_LEAKS=0`); final-proof guards PASS;
  0 orphan MCP servers; 1 canonical issuance instance.
- `REAL_TELEGRAM_SENDS=0`, `ACTIVE_GATE_MESSAGES=0`, `PRODUCTION_CHANGED=NO`.
- `READY_FOR_FINAL_REAL_E2E=true`; **NEXT =
  `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION`.**

---

## Cursor ACP MCP final E2E driver precondition repair V1 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_FINAL_E2E_DRIVER_PRECONDITION_REPAIR_V1`
**Classification:** `PASS — FINAL_DRIVER_PRECONDITIONS_QUALIFIED; TELEGRAM_E2E=NOT_CLAIMED`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `371d94be15f855a54701e9163542094b0b0e1c02`
**Report:** `reports/architecture/v4_cursor_acp_mcp_final_e2e_driver_precondition_repair_v1.md`

- Final E2E driver now shares the qualified official `agent.ps1` PowerShell
  launcher (`shell:false`) and its startup, premature-exit, and RPC failures
  fail closed.
- Every terminal path delegates the current keyboard only to canonical
  `deactivateCurrentKeyboard`; a cleanup failure stops the run but issuance
  restore remains verified.
- Focused final guards PASS; real ACP wiring PASS; MCP suite **32/32 PASS**.
  `PROCESS_LEAKS=0`, `REAL_TELEGRAM_SENDS=0`, `PRODUCTION_CHANGED=NO`.
- `READY_FOR_FINAL_REAL_E2E=true`; **NEXT =
  `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION`.**

---

## Cursor Agent runtime resource recovery and wiring requalification V1 — latest

**TASK_REF:** `V4_CURSOR_AGENT_RUNTIME_RESOURCE_RECOVERY_AND_WIRING_REQUALIFICATION_V1`
**Classification:** `PASS — ACP_MCP_WIRING_REQUALIFIED; TELEGRAM_E2E=NOT_CLAIMED`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `4b3f798a2b7bcd015c4034e25b7e50b26fbf3246`
**Report:** `reports/architecture/v4_cursor_agent_runtime_resource_recovery_and_wiring_requalification_v1.md`

- Operator resource relief reduced commit use to 40,625/67,498 MB; no
  project-owned stale ACP/MCP process was found or terminated.
- Official CLI startup, real ACP initialize, real `session/new` with the
  project MCP server, and three consecutive wiring probes all passed.
- Full MCP gate suite **32/32 PASS**; final-proof guard regressions PASS;
  `PROCESS_LEAKS=0`, `REAL_TELEGRAM_SENDS=0`, `PRODUCTION_CHANGED=NO`.
- `READY_FOR_FINAL_REAL_E2E=true`; no Telegram E2E, real callback, or live
  post-gate same-session claim was made.
- **NEXT = `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_OPERATOR_DECISION`.**

---

## ACP MCP human-gate minimal slice implementation V1 — latest

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_MINIMAL_SLICE_IMPLEMENTATION_V1`
**Classification:** `PASS — MINIMAL_SLICE_IMPLEMENTED_AND_PROVEN (synthetic transport only; TELEGRAM_E2E=NOT_CLAIMED)`
**Date (Europe/Rome):** 2026-09-12
**BASE_HEAD:** `b1c15165d4768f1d33e1f61d1941461e89ee1f86`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_minimal_slice_implementation_v1.md`

- Implemented the selected minimal slice: canonical gate-core extracted from
  the proven V2 law (`tools/v4-cursor-acp-gate-core-v1.mjs` — single decision
  authority, REGISTERED→NOTIFIED→VERIFIED→RETURNED→CONSUMED, EXPIRED/NO_ANSWER
  terminal, decision_id binding task/run/session-sha/generation, bounded TTL);
  adapter-only MCP stdio server with exactly one `human_gate` tool (schema
  A/B/C enforced, fail-closed, no default answer, no credentials in the
  adapter); ACP wiring probe (driver writes the trusted session binding;
  agent-side `session/new` guard = 0).
- Vendor MCP contract discovered read-only and applied: per-session stdio
  server shape `{name, command, args[], env:[{name,value}]}`; a real
  `agent acp` `session/new` accepted the project server
  (`ACP_MCP_WIRING=PASS`).
- Deterministic suite 32/32 PASS (`tests/v4-cursor-acp-mcp-gate/`, synthetic
  transports only): all negative fences (stale/duplicate/wrong
  task/session/generation/invalid option/unknown decision), fences never
  mutate a healthy decision, NO_DEFAULT_ANSWER, adapter-cannot-self-authorize
  (missing binding fails closed), synthetic valid callback returned the
  option through the MCP tool result, unknown tool rejected.
- Not claimed: `TELEGRAM_E2E`, `REAL_OPERATOR_CALLBACK`, live same-session
  continuation — next task.
- No walls touched. `PRODUCTION_CHANGED=NO`.
- **NEXT = `V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1`**: real Telegram
  transport (canonical credential path, unchanged) + real operator callback +
  live same-session ACP continuation with the full marker set.

---

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
