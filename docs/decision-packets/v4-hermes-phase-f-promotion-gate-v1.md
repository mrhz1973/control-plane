# V4 Hermes Phase F promotion gate

**TASK_REF:** `V4_HERMES_PHASE_F_PROMOTION_GATE_PREPARATION_V1`
**CURRENT_HEAD:** `1a255c144d579f274afbfdcb06e447fa10431a9f`
**ISSUE_STATE:** `#73 OPEN` (read-only verified)
**Packet status:** `PREPARED — PROMOTION_DECISION=PENDING`

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
