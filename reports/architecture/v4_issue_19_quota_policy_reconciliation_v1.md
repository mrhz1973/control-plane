# V4 Issue 19 quota policy reconciliation V1

**TASK_REF:** `V4_ISSUE_19_QUOTA_POLICY_RECONCILIATION_V1`
**BASE_HEAD:** `99689ad84a8589849e08de86062581a7b9683a13` (== origin/main == HEAD at start, verified PASS)
**Date (Europe/Rome):** 2026-09-14
**MODE:** DOCUMENTATION / ISSUE RECONCILIATION ONLY
**MODEL_INFERENCE=0 · PRODUCTION_CHANGED=NO · RUNTIME_CHANGED=NO**

---

## 1. Historical #19 intent

"Future policy — quota-aware GLM model switching (5.3 / 5.2 / 5.1 / 5)": keep the option of cheaper/lighter GLM models when Z.AI token-window consumption is too high, without silent degradation. Proposed a potential ladder GLM 5.3 → 5.2 / 5.1 / 5, recorded an operator observation that morning usage appeared higher, and explicitly required measured evidence before any automatic time-of-day switching (`RUNTIME AUTHORIZATION=NO`; "questa issue NON autorizza alcuno switch automatico ora"). The issue itself demanded: measurement per model/workload/time-window, quality/latency equivalence verification, healthy/conserve/exhausted thresholds, risk-class-aware degradation decisions, mandatory `fallback_used`/`fallback_reason`/model/window logging, `equivalent_or_gate`/`gate_only` for medium/high risk, and no silent substitution.

## 2. Completed generic #32 capabilities

Parent #32 (`ISSUE_32=CLOSED_COMPLETED`; `v4_parent_32_closure_evaluation_v1.md` acceptance matrix A–J; `v4_parent_32_issue_32_closure_persistence_v1.md`; `v4_expiring_allowance_use_policy_v1.md`) proved: role/capability-aware selection; quality-aware selection (T13 `QUALITY_REQUIREMENT_BLOCKED`); MODEL/ACCESS_SURFACE/QUOTA_POOL separation; shared quota-pool identity (`glm-5.3` + `glm-5.3-flash` → ONE `glm_coding_plan` pool, `dynamic_values=forbidden_in_registry`); verified quota state with reset windows (`reset_at` ISO); reserve floors; stale/unknown fail-closed (`CONSERVE_UNKNOWN_*`, `POOL_EXHAUSTED`); time-aware economics (`rt25-economics-metadata-v1` pricing windows, T14 deferral); urgent vs deferrable work; auditable routing reasons (decision envelope, reason codes, provenance); expiring-allowance preference (§10a, GENERIC_PROVIDER_NEUTRAL, 49/49); `NO_SILENT_FALLBACK=PASS`.

## 3. Legacy GLM ladder comparison

The proposed fixed 5.3→5.2→5.1→5 chain is a provider-specific special case of what the generic architecture already expresses as policy-governed, equivalence-gated, auditable candidate selection. GLM canonical evidence today distinguishes exactly `glm-5.3` and `glm-5.3-flash` (distinct model identities, distinct speed/quality roles, shared `glm_coding_plan` pool, `model_selection_policy.selection=dynamic`, `frozen_list=false` — `configs/resources/registry.json`). A hardcoded ladder would (a) duplicate the generic routing law with a second provider-specific truth, violating `RESOURCE_REGISTRY_V2=SOLE_CANONICAL_STATIC_ROUTING_POLICY_SOURCE` / Phase-4 `DUPLICATE_POLICY_SOURCES=0`; (b) freeze unobserved future model availability into static policy; (c) risk institutionalizing automatic quality degradation the generic law forbids without explicit gates. `PROVIDER_SPECIFIC_GLM_LADDER_IMPLEMENTED=NO`.

## 4. Time-of-day observation classification

`HISTORICAL_MORNING_USAGE_OBSERVATION=UNPROVEN_NONCANONICAL` — the operator's morning-consumption report is preserved (issue body untouched, cited here), never deleted, never converted into routing policy. #19 itself required measured evidence to distinguish a true time-of-day effect from workload/context-size variation; that evidence was never collected and is NOT manufactured by this task (no morning/evening comparison, no quota experiment). If future verified telemetry demonstrates an effect, it is expressible through the existing generic economics/deferral architecture (T07 pricing windows, T14 `DEFER_UNTIL_CHEAPER_WINDOW`, §10a) or a new bounded issue. `MORNING_TIME_OF_DAY_POLICY_IMPLEMENTED=NO`.

## 5. Dynamic model discovery implications

Concrete model availability remains evidence-driven: future GLM versions enter only through current qualified resource/model discovery + registry qualification + policy admission (as proven for Codex by `FUTURE_MODEL_AUTO_DISCOVERY` PASS and for Astra by the fail-closed QUALIFIED_NEGATIVE handling). No availability is asserted here for GLM 5.2/5.1/5 — none has been observed.

## 6. Reconciliation questions — exact answers

1. **Core need covered generically?** YES — quota conservation without silent quality degradation is exactly the #32 acceptance (reserve floors, quality guard, fail-closed conserve states, no-silent-fallback).
2. **New GLM models enter via dynamic discovery / registry qualification?** YES — `model_selection_policy.selection=dynamic`, `frozen_list=false`, `FUTURE_MODEL_AUTO_DISCOVERY` PASS; no provider-specific ladder exists or is needed.
3. **Would a fixed ladder now duplicate/weaken the provider-neutral law?** YES — it would create a second, provider-specific routing truth and institutionalize automatic degradation outside the generic gates.
4. **Morning observation proven enough for live policy?** NO — unproven, noncanonical; the issue itself required measurement first; no evidence manufactured.
5. **Unique REQUIRED capability still missing?** NO — every item of the issue's own key-rules list maps onto existing generic capability (§2); nothing required is absent.
6. **Would keeping #19 open mislead?** YES — it would imply provider-specific automatic degradation remains required architecture.

## 7. Final issue disposition

```text
ISSUE_19_DISPOSITION=SUPERSEDED_BY_GENERIC_POLICY
ISSUE_19_STATE=CLOSED
ISSUE_19_STATE_REASON=NOT_PLANNED
```

One concise reconciliation comment persisted (issuecomment-5667090762); title/body/labels untouched; state re-read post-close: `CLOSED/NOT_PLANNED`. Superseded means the requirement was fulfilled by a better generic architecture — not that the original observation was false.

## 8. Preserved canon

`ISSUE_32=CLOSED_COMPLETED` · `RESOURCE_REGISTRY_V2=SOLE_CANONICAL_STATIC_ROUTING_POLICY_SOURCE` · MODEL≠ACCESS_SURFACE≠QUOTA_POOL · `EXPIRING_ALLOWANCE_USE_IMPLEMENTED=YES/_PROVEN=YES` (GENERIC_PROVIDER_NEUTRAL) · `NO_SILENT_FALLBACK=PASS` · dynamic model/catalog discovery and dynamic quota/reset observations remain dynamic. OpenClaw law untouched: `OPENCLAW_FINAL_DISPOSITION=SCOPED_RETENTION`, broker/fallback/agent runtime RETIRED, `OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED`, `OPENCLAW_QUOTA_SCOPE=glm_coding_plan`, `GLM_QUOTA_AUTHORITY=OPENCLAW`. No runtime touched.

## 9. Runtime unchanged proof

No GLM inference, no benchmark (quality/latency), no quota-consumption experiment, no time-of-day comparison, no provider probe, no routing smoke, no regression campaign. No OpenClaw/Hermes/Codex/Qwen/ChatGPT-Web invocation; no n8n/PostgreSQL/VPS/Tailscale/routing mutation. #68 remains independently `OPEN_PENDING_PROVIDER_TERMINATION` (OLD OS already powered off; IONOS contractual action operator-side; not blocking this reconciliation; #68 untouched). Pre-existing tracked telemetry churn (`reports/runtime/cursor-acp/mcp-gate-*.json`) excluded from this task's commit.

## 10. NEXT selection

OPEN issues after #19 closure: #69, #68, #67, #65, #60, #35, #18. Priority law applied: #35 excluded (no new Astra exposure evidence); #68 excluded (operator-side parallel IONOS action); #18 OCR research deprioritized (more important closure work exists). #60 (migrate Control Plane to new VPS + qualify Hermes 24/7) and #67 (replacement 8GB VPS bootstrap + replica qualification) are mechanically closure-ready from existing evidence: production cutover PASS (#68 chain), Hermes web/auth/persistence/recall PASS + RESOURCE_BASELINE=GREEN (#67), rollback retention closed by operator authorization (`v4_vps_68_authorized_old_decommission_execution_v1.md`); #68's provider-commercial tail does not belong to #60/#67 acceptance.

```text
CURRENT_NEXT=V4_VPS_PARENT_60_67_CLOSURE_RECONCILIATION_V1
NEXT=V4_VPS_PARENT_60_67_CLOSURE_RECONCILIATION_V1
```

This task did NOT execute that task.

## 11. Pass markers

```text
RESULT=PASS
ISSUE_19_RECONCILED=YES
ISSUE_19_DISPOSITION=SUPERSEDED_BY_GENERIC_POLICY
ISSUE_19_STATE=CLOSED
ISSUE_19_STATE_REASON=NOT_PLANNED
GENERIC_QUOTA_POLICY_PRESERVED=YES
PROVIDER_SPECIFIC_GLM_LADDER_IMPLEMENTED=NO
MORNING_TIME_OF_DAY_POLICY_IMPLEMENTED=NO
HISTORICAL_MORNING_USAGE_OBSERVATION=UNPROVEN_NONCANONICAL
NO_SILENT_FALLBACK=PASS
MODEL_INFERENCE=0
PRODUCTION_CHANGED=NO
RUNTIME_CHANGED=NO
```
