# V4 Hermes consolidation audit closure evaluation V1

**TASK_REF:** `V4_HERMES_CONSOLIDATION_AUDIT_CLOSURE_EVALUATION_V1`
**BASE_HEAD:** `cc35d1a0efff636efa5e66a78aaa158474238c75` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14
**MODE:** BOUNDED CLOSURE READINESS EVALUATION — issue mutation forbidden
**ISSUE:** #61 (state at evaluation: OPEN, title intact, body untouched)

---

## 3. Issue #61 original acceptance matrix

| # | Original required output | Evidence artifact | Verdict |
|---|---|---|---|
| 1 | AS-IS architecture and responsibility map | `v4_hermes_consolidation_component_retirement_audit_v1.md` §2 (27 components, owners, authority, persistence, 24/7, evidence) | **COMPLETE** |
| 2 | Capability/overlap matrix | same report §3 (per-component role, Hermes overlap, what Hermes cannot replace, failure domain, maintenance) | **COMPLETE** |
| 3 | Explicit disposition per component (KEEP/MERGE/REPLACE_WITH_HERMES/RETIRE) | same report §4: KEEP=21, MERGE=3, REPLACE_WITH_HERMES=1, RETIRE=1, with rationale/preconditions/risk/rollback/human-gate each | **COMPLETE** |
| 4 | TO-BE minimal architecture | same report §5 (control/execution/model/browser planes, human gate, observability, persistence, networking) | **COMPLETE** |
| 5 | Route policy (quality/latency/quota-cost/reliability/vision-tool/offline/24-7) | same report §6 (per-role primary + explicit non-silent fallbacks) | **COMPLETE** |
| 6 | Security/trust-boundary analysis (browser credentials, CDP exposure) | same report §7 (authenticated profile, CDP, Telegram gate trust, model authority, secrets, VPS boundaries, GitHub write authority, n8n credentials, human-decision integrity) | **COMPLETE** |
| 7 | Migration plan: bounded phases, tests, rollback, human gates | same report §9 (PHASE 1–5 with SCOPE/CHANGE/TEST/ROLLBACK/HUMAN_GATE/DEPENDENCY) — execution followed through Phases 0.5/1–5 (below) | **COMPLETE** |
| 8 | Quantified maintenance/cost reduction where evidence permits | same report §8: COMPONENTS_BEFORE=27 → AFTER=25 active; SERVICES_RETIRED=1; WRAPPERS_RETIRED=2; ROUTES_SIMPLIFIED=1; FAILURE_DOMAINS_REDUCED=2 hard + 1 soft — each tied to evidence, no invented percentages | **COMPLETE** |

**AUDIT_REQUIRED_OUTPUTS_COMPLETE=YES** (8/8 COMPLETE, none PARTIAL/BLOCKED).

Issue-gate compliance: the audit itself implemented nothing; implementation ran
as separately authorized gated tasks (f5e4122 → cc35d1a lineage), exactly as
the issue's gate requires.

## 4. Original component disposition summary (historical, preserved)

KEEP=21 · MERGE=3 (scheduler dedup; routing policy single-source; OpenCode
harness glue convergence) · REPLACE_WITH_HERMES=1 (governed-CDP composer glue)
· RETIRE=1 (OpenClaw, then believed fully dormant). Historical finding kept
verbatim in the audit report; not rewritten.

## 5. Final reconciled component disposition summary

- OpenClaw: **SCOPED_RETENTION** (superseding full RETIRE — valid reconciliation:
  the audit's "dormant" premise was disproven at Phase-1 execution time by the
  live quota-collector caller evidence; the quota lane was evaluated on value
  (GLM=UNIQUE, CODEX=INFERIOR) and retired for Codex only).
- Governed-CDP composer glue: REPLACE_WITH_HERMES executed (Phase 2).
- Scheduler MERGE: resolved as role separation (Phase 3).
- Routing policy MERGE: executed as minimal shared registry adapter (Phase 4).
- OpenCode harness glue MERGE: intentionally closed as NO_EXPANSION via Phase 5
  decision (the audit listed it as NOT-scheduled-now; the optional-expansion
  gate closed the broader Hermes-implementer widening instead).

## 6–10. Migration phases status

| Phase | Required markers (task law) | Found in persisted evidence | Verdict |
|---|---|---|---|
| 1 — OpenClaw | `OPENCLAW_FINAL_DISPOSITION=SCOPED_RETENTION`, broker/fallback/agent runtime RETIRED, `OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED`, `OPENCLAW_QUOTA_SCOPE=glm_coding_plan`, `GLM_QUOTA_AUTHORITY=OPENCLAW`, `CODEX_QUOTA_AUTHORITY=CODEX_APP_SERVER`, `CODEX_OPENCLAW_AUTHORITY=NO`, `CODEX_OPENCLAW_FALLBACK=NO`, codex dependency RETIRED, glm dependency KEPT | `v4_openclaw_retirement_scope_reconciliation_v1.md` (all markers present; `CANONICAL_AMBIGUITY_RESOLVED=YES`; T1–T10 PASS) + `v4_openclaw_quota_lane_value_comparison_v1.md` + `v4_openclaw_quota_lane_retirement_phase_0_5_v1.md` (fail-closed no-fallback proven) | **PASS (superseded-with-valid-reconciliation vs original full-RETIRE assumption)** |
| 2 — CDP governance | `PHASE_2_CDP_GOVERNANCE_UNIFICATION=PASS` implied by report PASS; `HERMES_NATIVE_GOVERNED_CDP=CANONICAL`; `LEGACY_GOVERNED_CDP_GLUE_ACTIVE_CALLERS=0`; `LEGACY_GLUE_FILES_PRESERVED_FOR_ROLLBACK=YES` | `v4_hermes_cdp_governance_unification_phase_2_v1.md` (all four present; HERMES_NATIVE_PARITY=PASS; composer files kept as LEGACY_TOOLING_ROLLBACK) | **PASS** |
| 3 — Scheduler dedup | `PHASE_3_SCHEDULER_DEDUP=PASS`, `PHASE_3_DECISION=NO_DEDUP_REQUIRED_ROLE_SEPARATION`, `CANONICAL_TICK_OWNER=WF90`, `SERVICE_LIFECYCLE_OWNER=ControlPlane-V4-LocalDevDispatcher`, `ACTIVE_TICK_GENERATORS=1`, `WINDOWS_TASK_ROLE=SERVICE_SUPERVISOR`, `WF90_ROLE=TICK_SCHEDULER`, `DUPLICATE_SCHEDULER_ASSUMPTION=DISPROVEN` | `v4_local_dev_scheduler_dedup_phase_3_v1.md` (all eight present; service-recovery restart proof persisted; WF90 normalizer 18/18) | **PASS** |
| 4 — Routing policy single source | `PHASE_4_ROUTING_POLICY_SINGLE_SOURCE=PASS`, registry-v2 sole source, `HERMES_ROUTER_POLICY=REGISTRY_DERIVED`, `LITELLM_POLICY=REGISTRY_DERIVED_OR_TRANSPORT_ONLY`, `DUPLICATE_POLICY_SOURCES=0`, `UNKNOWN_POLICY_SOURCES=0`, `ROUTER_BEHAVIOR_EQUIVALENCE=PASS`, `NO_SILENT_FALLBACK=PASS` | `v4_routing_policy_single_source_phase_4_v1.md` (all eight present; `MINIMAL_SHARED_REGISTRY_ADAPTER` decision; fail-closed loader) | **PASS** |
| 5 — Optional Hermes implementer expansion | `PHASE_5_DECISION=KEEP_CURRENT_SCOPE_NO_EXPANSION`, `EXPANSION_VALUE=NOT_MATERIAL_OR_NOT_PROVEN`, `CURRENT_SCOPE_SUFFICIENT=YES`, `SELECTED_CLASS=NONE`, `PHASE_5_OPTIONAL=CLOSED_NO_EXPANSION`, `LIVE_CANARY_REQUIRED=NO`, `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`, `ROUTE_CONTROL_STATE_FINAL=DISABLED`, `CURRENT_MODE=SHADOW_ONLY` | `v4_hermes_implementer_expansion_phase_5_decision_v1.md` (all nine present; explicitly a valid decision-closure, no expansion) | **PASS (intentional decision closure)** |

**MIGRATION_PHASES_RECONCILED=YES** — every phase is PASS or closed by an
explicit, evidence-backed decision.

## 11. Historical supersessions / reconciliations

1. Audit `RETIRE` (OpenClaw, full) → superseded by
   `V4_OPENCLAW_RETIREMENT_SCOPE_RECONCILIATION_V1` → `SCOPED_RETENTION`.
   The STOP `V4_OPENCLAW_PAPER_RETIREMENT_PHASE_1_V1`
   (`OPENCLAW_PAPER_RETIREMENT_BLOCKED_BY_LIVE_REFERENCE`) remains preserved
   as the disproof evidence; the comparison report justifies the scope cut.
2. Audit Phase-1 description "remove from resource registry as active
   component; zero wired references" → executed as scoped reconciliation
   instead; registry verified OpenClaw-free for selectable runtime entries.
3. Reconciliation report's stale `PHASE_D=OPEN` marker → explicitly superseded
   by the Phase-D-V2/Phase-F closure evidence (`ISSUE_73=CLOSED_COMPLETED`),
   recorded in its own repair-note section.
4. Frontier legacy rows (`KEEP_STAGED_PENDING`, old `OPENCLAW_BROKER_RUNTIME`
   wording) → covered by the standing CURRENT-OPENCLAW-RECONCILIATION banner
   declaring historical wording superseded, not removed.

## 12. Current architecture invariant verification

| Invariant | Coherence check | Status |
|---|---|---|
| GitHub = canonical truth | audit + phases persisted as reports/commits; issue #61 untouched | COHERENT |
| n8n = deterministic orchestration/gates/ledger/idempotency | Phase 3 confirms WF90 tick-owner role; no n8n mutation in phases | COHERENT |
| LOCAL_DEV dispatcher = selection/claim/safety authority | dispatcher untouched except additive codex-authority read injection; S1–S69 green | COHERENT |
| Qwen local = LOCAL_CONTROLLER/local model | no route change; Phase 5 keeps current scope | COHERENT |
| OpenCode = qualified LOCAL_DEV implementer harness | Phase 5 no-expansion preserves it | COHERENT |
| Hermes = bounded agent/browser/runtime bridge | Phase 2 makes native governed CDP canonical; Phase 4 router policy registry-derived; Phase 5 no expansion — Hermes bounded, NOT global authority | COHERENT |
| Telegram + MCP human gate = sole human authority | no new decision authority anywhere in Phases 0.5–5; human gates honored (Phase 3 gate required/obtained per its report) | COHERENT |
| LiteLLM = remote gateway/transport | Phase 4: REGISTRY_DERIVED_OR_TRANSPORT_ONLY | COHERENT |
| resource-registry-v2 = sole static routing-policy source | Phase 4 `DUPLICATE_POLICY_SOURCES=0` | COHERENT |
| ChatGPT Web = answer surface, not controller | unchanged across all phases | COHERENT |
| OpenClaw = GLM quota observation lane only | Phase 1 reconciliation + Phase 0.5 law | COHERENT |
| OLD VPS = rollback retention only | untouched; no decommission | COHERENT |
| NEW VPS = current production/24×7 host | untouched by this workstream | COHERENT |
| Persistent Chromium/CDP = governed authenticated surface | Phase 2 unification strengthens this | COHERENT |
| Visual sidecar #78 = read-only assist; #79 = read-only observability | untouched; both issues CLOSED_COMPLETED earlier | COHERENT |

**docs/runtime/CURRENT_FRONTIER.md coherence:** the frontier header carries the
full reconciled OpenClaw law; Phase 2/3/4/5 and Phase-0.5 PASS blocks with all
required markers are present; `CURRENT_NEXT` pointed at this evaluation task.
Coherent with the final architecture — no documentation correction needed.

## 13. Security / trust-boundary verification

```text
NO_PUBLIC_CDP=YES
NO_PUBLIC_NOVNC=YES
NO_FUNNEL=YES
NO_CREDENTIAL_PERSISTENCE_OUTSIDE_QUALIFIED_STORES=YES
NO_TOKEN_COOKIE_LEAKAGE=YES
NO_AUTOMATIC_PROVIDER_FALLBACK=YES (Phase 4 NO_SILENT_FALLBACK=PASS)
NO_MODEL_SELF_AUTHORIZATION=YES
NO_SECOND_HUMAN_DECISION_AUTHORITY=YES
D_0025_REMAINS_DISABLED=YES
ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0
ROUTE_CONTROL_STATE_FINAL=DISABLED
QUALIFICATION_IS_NOT_PRODUCTION_AUTHORIZATION=YES (Phase 5 explicit)
```

## 14. Unresolved REQUIRED blockers

**REQUIRED_BLOCKERS_REMAINING=0.**

## 15. Nonblocking future work (explicitly excluded from closure)

- future Hermes IMPLEMENTER expansion (Phase 5 closed no-expansion; may reopen
  as a new gated task if evidence changes);
- OLD VPS decommission (separate human gate, different workstream);
- deferred GLM quota mapper `usedToRemainingPercent(null) → 100` defect
  (recorded in the comparison + reconciliation reports as GLM-scope follow-up);
- OpenClaw `usage.updatedAt` future-dating anomaly (same deferred set);
- future OCR/VLM work (#78 closed as evidence-gated escalation);
- unrelated backlog items and optional refactors.

None of these is REQUIRED for issue #61 acceptance; each lives in its own
report/workstream with persisted pointers.

## 16. Final closure decision

```text
ISSUE_61_CLOSURE_EVALUATION=PASS
ISSUE_61_CLOSURE_READY=YES
AUDIT_REQUIRED_OUTPUTS_COMPLETE=YES
MIGRATION_PHASES_RECONCILED=YES
REQUIRED_BLOCKERS_REMAINING=0
OPTIONAL_FUTURE_WORK_BLOCKS_CLOSURE=NO
PRODUCTION_CHANGED=NO
RUNTIME_CHANGED=NO
NEXT=V4_HERMES_CONSOLIDATION_AUDIT_ISSUE_61_CLOSURE_PERSISTENCE_V1
NEXT_HUMAN_GATE_REQUIRED=NO
```

Closure criteria A–G: A ✔ (8/8 COMPLETE), B ✔ (Phases 1–5 PASS or explicit
decision-closure), C ✔ (no unresolved required blocker), D ✔ (four explicit
supersession/reconciliation notes), E ✔ (frontier coherent), F ✔ (no required
implementation remains), G ✔ (remaining work optional/other workstream).

## 17. Production/runtime unchanged proof (this evaluation task)

- Read-only evaluation: no Qwen/GLM-via-Control-Plane/Codex/Hermes/OpenClaw
  runtime invocation, no browser, no ChatGPT Web, no dispatcher tick, no n8n/
  PostgreSQL/VPS/LiteLLM/route mutation, no Telegram consumption, no runtime
  authorization created, no issue mutation (state OPEN, body/comment/labels
  untouched).
- Only documentation artifacts created/updated: this report + minimal frontier
  and last-cursor-report entries.
- Cursor using GLM 5.3 as the interactive executor model is the sanctioned
  execution surface for this task and is not a Control Plane runtime call.

## Rollback

`git revert` of this task's commit removes only the evaluation report and the
two frontier/report doc entries. Nothing runtime to restore.
