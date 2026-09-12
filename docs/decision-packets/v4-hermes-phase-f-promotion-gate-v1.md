# V4 Hermes Phase F promotion gate

**TASK_REF:** `V4_HERMES_PHASE_F_PROMOTION_GATE_PREPARATION_V1`
**CURRENT_HEAD:** `1a255c144d579f274afbfdcb06e447fa10431a9f`
**ISSUE_STATE:** `#73 OPEN` (read-only verified)
**Packet status:** `PREPARED — PROMOTION_DECISION=PENDING`

> **SUPERSEDED READINESS MATRIX — UPDATE 2026-09-12.** The original matrix
> below recorded `READINESS=NOT_READY` with three blocking unknowns
> (R2/R4+R14/R5). It is preserved verbatim as history. The task
> `V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1` (base
> `a1f74fd0c4d5d452b353d3b03c0dc795d6c6411b`) subsequently closed those gaps
> with bounded implementation + deterministic evidence; the superseding
> matrix is in [Update: readiness re-evaluation after gap closure](#update-readiness-re-evaluation-after-gap-closure).
> The historical UNKNOWN entries were true at their time and were not
> rewritten.

## Scope and current state

**PROMOTION_TARGET:** a future, separately bounded implementation that could make the qualified `QWEN_LOCAL -> HERMES -> CHATGPT_WEB` continuity route available for a later human promotion decision. No such implementation or decision exists in this packet.

```text
CURRENT_MODE=SHADOW_ONLY
PRODUCTION_CURRENTLY_ENABLED=NO
PRODUCTION_DISPATCH=NO
PROMOTION_EXECUTED=NO
ROUTING_RUNTIME_MUTATIONS=0
RUNTIME_MUTATIONS=0
```

| Phase | Status | Evidence |
|---|---|---|
| A | `PASS_EXISTING_FOUNDATION` | `reports/architecture/v4_live_quota_status_existing_contract_reconciliation_v1.md` — existing quota-pool contract reused; no parallel schema |
| B | `PARTIAL` | same report, “Current source matrix” — safe adapters/manual paths exist, but automatic/fresh sources are not universally proven |
| C | `PASS` | `reports/architecture/v4_hermes_phase_c_closure_checkpoint_v8.md` |
| D | `PASS` | `reports/architecture/v4_hermes_phase_d_context_rollover_stale_generation_fence_v2.md` |
| E | `PASS` | `reports/architecture/v4_hermes_phase_e_quota_degraded_shadow_route_v1.md` |

`PARTIAL` above is descriptive Phase-B evidence status, not a readiness-matrix result and not a production claim.

## Readiness matrix

Every status in this matrix is exactly `PASS`, `FAIL`, `UNKNOWN`, or `NOT_APPLICABLE`. “Critical” means it must be `PASS` before option A can be recommended.

| ID | Criterion | Critical | Status | Evidence and bounded finding |
|---|---|---:|---|---|
| R1 | Route safety | yes | `PASS` | `reports/architecture/v4_hermes_phase_e_quota_degraded_shadow_route_v1.md` — direct preference, reserve, exhausted, stale/unknown and unavailable cases pass deterministically. |
| R2 | Source freshness / fail-closed behavior | yes | `UNKNOWN` | `reports/architecture/v4_live_quota_status_existing_contract_reconciliation_v1.md` and `reports/architecture/v4_control_plane_capability_reconciliation_audit_v1.md` — freshness law is fail-closed, but automatic fresh commercial source coverage is not proven. |
| R3 | Quota / resource attribution | yes | `PASS` | `configs/resources/registry.json`; `reports/architecture/v4_live_quota_status_existing_contract_reconciliation_v1.md` — pool/surface separation, with Web retained as a separate availability domain. |
| R4 | Rollback / disable mechanism | yes | `UNKNOWN` | `docs/runtime/CURRENT_FRONTIER.md` proves `D-0025 enabled=false` and no active authorization now; it does not prove a route-specific production disable/rollback switch because that route is not implemented. |
| R5 | Observability | yes | `UNKNOWN` | `reports/architecture/v4_rt25_quota_aware_runtime_wiring_closure_v1.md` proves read-only RT25 status visibility; `reports/architecture/v4_control_plane_capability_reconciliation_audit_v1.md` preserves external Hermes/Qwen telemetry as future work. No end-to-end promoted-route telemetry is proven. |
| R6 | Context recovery | yes | `PASS` | `reports/architecture/v4_hermes_phase_d_context_rollover_stale_generation_fence_v2.md` — stale-generation, context-delta and ambiguous-send fences pass. |
| R7 | Authorization boundaries | yes | `PASS` | `reports/architecture/v4_hermes_phase_e_quota_degraded_shadow_route_v1.md`; `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` — no authorization bypass and bridge remains live-incapable. |
| R8 | Provenance / auditability | yes | `PASS` | `reports/architecture/v4_rt25_quota_aware_runtime_wiring_closure_v1.md` — RT25 provenance and decision audit; Phase C candidate/validator evidence is sanitized and base-bound. |
| R9 | No silent fallback | yes | `PASS` | `reports/architecture/v4_hermes_phase_e_quota_degraded_shadow_route_v1.md` — `HIDDEN_HERMES_FALLBACK=NO`, `SILENT_FALLBACK=NO`. |
| R10 | Local controller or Web failure behavior | yes | `PASS` | same Phase E report, E6/E7 — unavailable Web or unavailable/inadequate Qwen yields no degraded route. |
| R11 | Operator policy preservation | yes | `PASS` | Phase E consumes `INELIGIBLE_BY_OPERATOR_POLICY`; `reports/architecture/v4_control_plane_canonical_reconciliation_apply_v1.md` preserves the Europe/Rome policy without duplicating provider law. |
| R12 | Legacy/staged components inactive | yes | `PASS` | `docs/runtime/CURRENT_FRONTIER.md`; `reports/architecture/v4_control_plane_capability_reconciliation_audit_v1.md` — OpenClaw remains `KEEP_STAGED_PENDING`; Phase E activated none. |
| R13 | Closed runtime gates remain closed | yes | `PASS` | `docs/runtime/CURRENT_FRONTIER.md` and Phase E hard-wall result — `D-0025 enabled=false`, `CLOSED_RUNTIME_GATE_REOPENED=NO`. |
| R14 | Production promotion reversible and explicitly disableable | yes | `UNKNOWN` | No promotion implementation exists, so no evidence can establish its specific disable state, restoration target, rollback observation, or failure trigger. |

## Blocking unknowns

```text
BLOCKING_UNKNOWN_COUNT=3
ALL_CRITICAL_READINESS_ITEMS=PASS=NO
```

1. **Fresh-source coverage (R2):** automatic/fresh commercial source coverage is not proven. Existing ingestion correctly becomes `UNKNOWN`/fail-closed; it must not be treated as live capacity.
2. **Route-specific disable/rollback (R4/R14):** the present closed gate prevents activation, but no future promoted-route switch, restoration state, or verified rollback observation exists.
3. **Promoted-route observability (R5):** RT25 exposes reusable read-only visibility, but the required future end-to-end route telemetry is not proven.

There are no critical `FAIL` claims; these are blocking `UNKNOWN` items, not evidence that the existing shadow route is unsafe.

## Rollback / disable plan

**Current state, not a promotion design:** the route remains `SHADOW_ONLY`, `D-0025` is `enabled=false`, and the authorization registry has no active authorization, as recorded in `docs/runtime/CURRENT_FRONTIER.md`. The current safe restoration state is unchanged non-production behavior:

```text
SHADOW_ONLY
D-0025 enabled=false
ACTIVE_AUTHORIZATION=0
PRODUCTION_DISPATCH=NO
```

Registry, RT25 admission, Hermes configuration, browser qualification, n8n workflows, VPS and legacy/staged components remain unchanged by this packet. RT25 and the frontier can observe the current closed state, but no evidence defines a route-specific promoted-state disable switch or validates restoration after such a switch. Accordingly:

```text
ROLLBACK_DISABLE_READY=NO
```

A future bounded implementation task would need to define and prove the exact switch, restoration state, read-only observation, and fail-closed trigger. This packet does not define or activate them.

## Observability plan

A future proposal must make the following fields observable with existing telemetry/provenance where available, and identify any remaining gap before it can be approved: `TASK_REF`, `ROUTE_SELECTED`, `MODE`, resource/quota admission result, local-controller availability, Web-surface availability, authorization result, fallback/defer reason, failure class, and rollback/disable state.

Existing foundations are RT25 decision/provenance/status visibility (`reports/architecture/v4_rt25_quota_aware_runtime_wiring_closure_v1.md`), the resource observatory, Phase D structural evidence, and the current frontier. They do not constitute end-to-end promoted-route observation. Therefore:

```text
OBSERVABILITY_READY=NO
```

## Authorization boundary and risk summary

Hermes remains a cognitive/browser bridge, not a planner, quota authority, scheduler, fallback owner, or production dispatcher. Qualification does not grant authorization. The current packet does not alter routing, authorization, runtime gates, browser state, issue state, providers, n8n, VPS, or Tailscale.

The material risk is not the already qualified shadow selection. It is an unproven future change that could couple fresh-source gaps, route activation, and insufficient disable/observability behavior. The unknowns above must remain visible rather than be inferred away.

## Recommendation

```text
READINESS=NOT_READY
RECOMMENDED=B
```

Recommendation B follows the packet rule: `ALL_CRITICAL_READINESS_ITEMS=PASS` is false, `BLOCKING_UNKNOWN_COUNT` is non-zero, `ROLLBACK_DISABLE_READY=NO`, and `OBSERVABILITY_READY=NO`. This is not a human decision and does not authorize any future task.

## Human decision options

| Option | Meaning |
|---|---|
| **A — AUTHORIZE NEXT BOUNDED PROMOTION IMPLEMENTATION TASK** | The operator may authorize a separate, bounded implementation task governed by this packet. This is neither an open/permanent authorization nor activation by this task. |
| **B — DEFER PROMOTION** | Keep the route `SHADOW_ONLY`, preserve all qualification evidence, and make no rollback of evidence. |
| **C — REJECT / KEEP NON-PRODUCTION** | Do not promote this route in the current track; retain the qualification as valid historical evidence. |

Only the human operator can select A, B, or C. This packet records no selection.

---

## Update: operator decision B recorded + readiness re-evaluation after gap closure

**UPDATE_TASK_REF:** `V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1`
**UPDATE_BASE_HEAD:** `a1f74fd0c4d5d452b353d3b03c0dc795d6c6411b`
**UPDATE_DATE:** 2026-09-12

### Operator decision B (DEFER) — RECORDED

```text
PHASE_F_DECISION=B
PROMOTION_DECISION=DEFER
KEEP_MODE=SHADOW_ONLY
OPERATOR_PHASE_F_DECISION=B_DEFER_RECORDED
```

Decision B authorized a bounded readiness-gap closure task only. It did NOT
authorize promotion, production dispatch, or issue #73 closure, and none of
those occurred.

### Superseding readiness matrix (R1–R14, same criteria)

| ID | Criterion | Critical | Historical status | Superseding status | Superseding evidence |
|---|---|---:|---|---|---|
| R1 | Route safety | yes | `PASS` | `PASS` | unchanged — `reports/architecture/v4_hermes_phase_e_quota_degraded_shadow_route_v1.md` |
| R2 | Source freshness / fail-closed | yes | `UNKNOWN` | **`PASS`** | `tools/v4-phase-f-r2-source-freshness-v1.mjs` matrix; route dependencies (qwen_local, chatgpt_web) have proven machine-readable collectors + fail-closed admission (F23–F27); commercial pools fail-closed by construction (T02–T06); manual bounded paths preserved |
| R3 | Quota / resource attribution | yes | `PASS` | `PASS` | unchanged |
| R4 | Rollback / disable mechanism | yes | `UNKNOWN` | **`PASS`** | `tools/v4-phase-f-route-control-v1.mjs` + tracked state `configs/runtime/route-control/hermes-route-state.json`; DEFAULT=DISABLED, MISSING/UNKNOWN/INVALID fail-closed, idempotent disable, no legacy dependency (F01–F14) |
| R5 | Observability | yes | `UNKNOWN` | **`PASS`** | `tools/v4-phase-f-route-observability-v1.mjs` — all 13 required fields observable across normal/shadow/defer/resource-unknown/authorization-denied/disabled/rollback cases (F15–F22) |
| R6 | Context recovery | yes | `PASS` | `PASS` | unchanged — Phase D V2 |
| R7 | Authorization boundaries | yes | `PASS` | `PASS` | unchanged; R4 control emits no production authority (`production_dispatch_permitted=false` invariant) |
| R8 | Provenance / auditability | yes | `PASS` | `PASS` | unchanged; R5 envelope is additive, read-only, authorization-neutral |
| R9 | No silent fallback | yes | `PASS` | `PASS` | unchanged; defer reasons now explicitly observable |
| R10 | Local controller / Web failure | yes | `PASS` | `PASS` | unchanged — Phase E E6/E7 |
| R11 | Operator policy preservation | yes | `PASS` | `PASS` | unchanged |
| R12 | Legacy/staged components inactive | yes | `PASS` | `PASS` | unchanged; R4 control has zero legacy dependency |
| R13 | Closed runtime gates remain closed | yes | `PASS` | `PASS` | unchanged — D-0025 `enabled=false` untouched |
| R14 | Promotion reversible / explicitly disableable | yes | `UNKNOWN` | **`PASS`** | restoration to `SHADOW_ONLY` proven exact; rollback observation bounded; restart representation cannot enable (F08–F12, F14) |

```text
BLOCKING_UNKNOWN_COUNT=0
ALL_CRITICAL_READINESS_ITEMS=PASS=YES
ROLLBACK_DISABLE_READY=YES
OBSERVABILITY_READY=YES
READINESS=READY
```

`READINESS=READY` is a criteria-level result only. It is NOT a promotion and
NOT an authorization. `PROMOTION_EXECUTED=NO`, `PRODUCTION_DISPATCH=NO`,
`CURRENT_MODE=SHADOW_ONLY`, `ISSUE_73=OPEN`.

### Remaining blockers

```text
REMAINING_BLOCKING_READINESS_GAPS=NONE
```

No readiness criterion remains UNKNOWN or FAIL. The remaining blocker for
promotion is purely the HUMAN DECISION itself, which this update does not make.

### Updated recommendation

The packet's original recommendation (`B`) was evidence-driven at a time when
three critical unknowns existed. That evidence condition no longer holds:

```text
READINESS=READY
RECOMMENDED=<human decision, now evidence-complete>
```

The recommendation function is unchanged: because
`ALL_CRITICAL_READINESS_ITEMS=PASS` is now true, `BLOCKING_UNKNOWN_COUNT=0`,
`ROLLBACK_DISABLE_READY=YES`, and `OBSERVABILITY_READY=YES`, the mechanical
rule that forced option B no longer binds. The choice among A (authorize a
bounded promotion implementation task), B (continue deferral), and C (reject /
keep non-production) is now fully the human operator's, with complete evidence:

- Gap-closure report: `reports/architecture/v4_hermes_phase_f_readiness_gap_closure_r2_r4_r5_v1.md`
- Persisted evidence: `reports/runtime/phase-f/phase-f-gap-closure-evidence.json`
- Focused qualification: `tests/phase-f-readiness-gap-closure-v1/run.mjs` (30/30 PASS)

### Focused regression evidence (update)

```text
tests/phase-f-readiness-gap-closure-v1               30/30 PASS
tests/hermes-phase-e-quota-degraded-shadow-route-v1  10/10 PASS
tests/rt25-canonical-closed-gate-e2e                 19/19 PASS
tests/rt25-t02-codex-quota-ingest                    13/13 PASS
tests/rt25-t03-glm-quota-ingest                      13/13 PASS
tests/rt25-t04-quota-state-join                       8/8 PASS
tests/rt25-t05-freshness-enforcement                  8/8 PASS
tests/rt25-t09-execution-selector                     5/5 PASS
tests/registry-v2                                    76/76 PASS
```

---

## Update: operator decision A recorded + bounded promotion implementation result

**FINAL_UPDATE_TASK_REF:** `V4_HERMES_PHASE_F_BOUNDED_PROMOTION_IMPLEMENTATION_V1`
**FINAL_UPDATE_BASE_HEAD:** `51a652151aa845dc25715803f9dea9b0e2ad85e6`
**FINAL_UPDATE_DATE:** 2026-09-12

### Human decision A — RECORDED (chronology preserved)

```text
PHASE_F_FINAL_DECISION=A_AUTHORIZE_BOUNDED_PROMOTION_IMPLEMENTATION
FINAL_DECISION_EVIDENCE=HUMAN_OPERATOR
PROMOTION_IMPLEMENTATION_AUTHORIZED=YES
PRODUCTION_ACTIVATION_AUTHORIZED=NO
PRODUCTION_DISPATCH_AUTHORIZED=NO
```

Chronology (preserved, not rewritten): (1) earlier decision **B** = defer while readiness
gaps were open — still recorded above; (2) gap closure R2/R4/R5/R14 PASS,
`BLOCKING_UNKNOWN_COUNT=0`, `READINESS=READY`; (3) current decision **A** authorizes the
bounded promotion-implementation stage ONLY. A did not authorize live production
activation, production dispatch, or issue #73 closure, and none of those occurred.

### Implementation result

The minimum promotion-capable runtime path for the already-qualified
`qwen_local → hermes → chatgpt_web` route is implemented by
`tools/v4-phase-f-promotion-adapter-v1.mjs`, composed strictly from existing authorities:
RT25 selection + Phase E shadow decision (consumed, not reimplemented), quota-state join
with the central freshness TTL, the R4 route-control document (fail-closed law preserved),
the existing `operator-runtime-authorization-v1` authorization representation (route-pinned;
issuance/spend ownership and its `opencode+qwen_local` allow-list are NOT widened by this
task), and the R5 observability envelope. The qualified Hermes send primitive
(`chainSend`) is structurally bound but REFUSED at the execution edge until a future
explicit activation confirmation.

```text
PROMOTION_PATH_IMPLEMENTED=PASS
PROMOTION_PATH_DEFAULT_DISABLED=PASS
ROUTE_CONTROL_CONSUMED=PASS
RESOURCE_ADMISSION_CONSUMED=PASS
AUTHORIZATION_CONSUMED=PASS
QUALIFIED_HERMES_EXECUTION_REUSED=YES (structurally bound, never invoked)
RESULT_VERIFICATION_REUSED=YES (independent DOM verifier law)
OBSERVABILITY_ATTACHED=PASS
ROLLBACK_PATH_REUSED=PASS
CANONICAL_EXECUTION_BOUNDARY_REUSED=YES
EXISTING_AUTHORIZATION_BOUNDARY_REUSED=YES
```

### Proofs (deterministic, offline)

15 negative dual-gate proofs (P01–P14 + fallback rejection), the positive dry-run
(`PROMOTION_CAPABLE_DRY_RUN=PASS`, `execution_performed=false`,
`REAL_PRODUCTION_DISPATCH=NO`), and the rollback proof
(`ROLLBACK_AFTER_CANDIDATE=PASS`, `POST_ROLLBACK_DISPATCH_BLOCKED=PASS`,
`DISABLE_IDEMPOTENT=PASS`) are asserted by
`tests/phase-f-bounded-promotion-implementation-v1/run.mjs` (24/24 PASS).
Sanitized evidence: `reports/runtime/phase-f/phase-f-bounded-promotion-implementation-evidence.json`.
Architecture report: `reports/architecture/v4_hermes_phase_f_bounded_promotion_implementation_v1.md`.

```text
ROUTE_CONTROL_STATE_FINAL=DISABLED
CURRENT_MODE_FINAL=SHADOW_ONLY
ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0
PRODUCTION_DISPATCH=NO
PROMOTION_ACTIVATED=NO
ISSUE_73=OPEN
```

The TEST-ONLY synthetic authorization fixture used in proofs
(`TEST-ONLY-SYNTHETIC-FIXTURE-0001`) is never persisted as active runtime authorization.

### Production activation remains NOT authorized

This update records implementation capability only. The FINAL production activation
decision (A: activate under bounded production authorization / B: keep ready but disabled /
C: reject activation) remains an explicit future HUMAN GATE, distinguishable and
unexecuted.
