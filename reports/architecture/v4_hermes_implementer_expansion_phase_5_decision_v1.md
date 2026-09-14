# V4 Hermes implementer expansion Phase 5 decision

**TASK_REF:** `V4_HERMES_IMPLEMENTER_EXPANSION_PHASE_5_DECISION_V1`
**BASE_HEAD:** `67a2ff9074f65228757dfb5c772084d2e67247ad`
**HUMAN_GATE_FOR_DECISION:** `AUTHORIZED_BY_OPERATOR=YES`
**RESULT:** `PASS — KEEP_CURRENT_SCOPE_NO_EXPANSION`

## Decision

The Phase 5 decision is **B — keep the current scope; no Hermes implementer
class is expanded on the VPS**. The evidence proves qualification of bounded
Hermes/browser bridge behavior and one bounded Phase F canary, but it does not
prove a material advantage for a new unattended VPS implementation class over
the already qualified LOCAL_DEV/OpenCode + Qwen path.

```text
PHASE_5_DECISION=KEEP_CURRENT_SCOPE_NO_EXPANSION
SELECTED_CLASS=NONE
EXPANSION_VALUE=NOT_MATERIAL_OR_NOT_PROVEN
CURRENT_SCOPE_SUFFICIENT=YES
LIVE_CANARY_REQUIRED=NO
PRODUCTION_AUTHORIZATION_CREATED=NO
PHASE_5_OPTIONAL=CLOSED_NO_EXPANSION
ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0
PRODUCTION_CHANGED=NO
RUNTIME_CHANGED=NO
MODEL_INFERENCE=0
CHATGPT_WEB_SENDS=0
```

No Phase 5 canary, provider call, browser action, route activation, Telegram
operation, or production dispatch was performed. The next bounded item is
`V4_HERMES_CONSOLIDATION_AUDIT_CLOSURE_EVALUATION_V1`.

## Current Hermes scope census

The census distinguishes qualification from authorization. Current production
authorization is zero even where historical bounded qualification or the single
Phase F canary exists.

| Surface / class | Current classification | Current meaning | Production state |
|---|---|---|---|
| Hermes agent runtime and governed browser bridge | `QUALIFIED` | Bounded authenticated browser/session path, native four-tool surface, and fail-closed fences are proven | `SHADOW_ONLY` / route control `DISABLED` |
| `qwen_local -> hermes -> chatgpt_web` Phase F route | `QUALIFIED` | One bounded canary was historically proven; the route was immediately restored to `DISABLED` with `SHADOW_ONLY` restoration | `PRODUCTION_AUTHORIZED=NO` |
| NEW VPS governed Hermes/Codex browser surface | `PREFILL_ONLY` | 08/12 VPS qualification proved text/prefill and clear invariants only; no send or implementation qualification | `PRODUCTION_AUTHORIZED=NO` |
| Hermes as a general VPS repository implementer | `NOT_QUALIFIED` | No concrete task-class implementation proof, adapter registration, or unattended cognitive-service proof exists | `NOT_AUTHORIZED` |
| LOCAL_DEV OpenCode + Qwen implementation path | `QUALIFIED` | Existing bounded local executor/implementer path with claim, repo, timebox, and fail-closed controls | Existing local-dev scope; no Phase 5 change |

The Phase F packet and current route state preserve `CURRENT_MODE=SHADOW_ONLY`,
`ROUTE_CONTROL_STATE=DISABLED`, `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`, and
the rule that qualification does not grant authorization. The resource registry
also keeps Codex in planner/reviewer roles, Qwen/OpenCode as the local
implementation surface, and ChatGPT Web as a separately observed browser
availability domain with no assumed quota.

## Concrete candidate classes

These are real project-use classes, not a generic proposal to run arbitrary
code remotely. Values are compared with the current governed alternative.

| Candidate class | Value | 24/7 need | Local GPU dependency | Browser need | Tool use / human gate | Deterministic boundary / rollback | Blast radius | Current alternative | Qualification gap |
|---|---|---|---|---|---|---|---|---|---|
| Bounded LOCAL_DEV repository repair or docs/code delta | Low incremental Hermes value | No; current dispatcher/Windows service already bounds the work | Yes, intentionally local | No | Yes / existing gates | Strong / existing Git revert and executor fences | Medium | Qualified OpenCode + Qwen | Hermes would duplicate the implementer harness and claim boundary |
| Bounded ChatGPT Web answer-surface canary | Already covered, not an expansion | No expansion need | Qwen controller is already qualified for the route | Yes | Tool use yes / human promotion gate required | Strong for the existing route / route disable proven | Medium | Phase F qualified route, currently disabled | Widening task classes is not proven materially better |
| Unattended 24/7 VPS repository maintenance task | Potentially useful, but unproven | Yes | Could avoid workstation GPU | Not inherently; browser becomes a dependency if the class uses Web | Yes / human gate for material choices | Not yet proven for implementation / class-level shrink not proven | High: VPS, browser/account, quota, repo writes | Local DEV dispatcher and OpenCode path | No Hermes implementer class, task-loop, success, quota, or rollback proof |
| Read-only operator/browser inspection | Useful observation only | Optional | No | Yes | Read-only tools / no decision authority | Strong as observation / no write rollback needed | Low | Existing dashboard, sidecar, and Hermes observation paths | Already within observation scope; not an implementer expansion |

## Value comparison and safety conclusion

- **Reliability:** the current LOCAL_DEV path has task-class and executor
  evidence. Hermes has bounded browser and route evidence, not comparative
  implementer reliability evidence.
- **24/7:** the NEW VPS host and Hermes service availability are qualified, but
  hosting is not proof of unattended repository implementation correctness,
  recovery, or task-loop semantics.
- **Workstation/GPU:** a VPS class could remove local-GPU dependence, but the
  candidate would add browser/session, network, quota, and repository-write
  dependencies that are not qualified for this purpose.
- **Authority and observability:** the dispatcher remains the claim/selection
  authority, n8n remains deterministic control/persistence, and the human gate
  remains sole decision authority. A new implementer class would need an
  additional route/adapter integration while preserving those boundaries.
- **Rollback and blast radius:** the Phase F route-control switch can disable
  the already-qualified route, but no class-specific rollback and no
  unattended implementation recovery proof exists for a new VPS class.
- **Quota/cost/failure domains:** ChatGPT Web has no verified static quota pool;
  unknown or stale resource state must fail closed. Expanding before a concrete
  advantage is measured would add a second failure domain without a proven
  benefit.

Therefore the expansion value is `NOT_MATERIAL_OR_NOT_PROVEN`, and the current
scope is sufficient. No synthetic A-branch policy proof was run because this
task selected B; `DRY_POLICY_PROOF=NOT_APPLICABLE`.

## Deterministic evidence

Only existing bounded, offline suites were run:

```text
tests/registry-v2/run.mjs                                      76/76 PASS
tests/phase-f-readiness-gap-closure-v1/run.mjs                 30/30 PASS
tests/phase-f-bounded-promotion-implementation-v1/run.mjs      24/24 PASS
tests/phase-f-bounded-production-activation-v1/run.mjs         13/13 PASS
tests/v4-execution-adapter-registry/run.mjs                    19/19 PASS
tests/v4-execution-adapter-router/run.mjs                      15/15 PASS
```

These checks preserve exact-route authorization, fail-closed route control,
no-silent-fallback, the canonical OpenCode adapter registry, and the existing
Phase F rollback/disable law. They do not create authorization and do not
execute a provider or adapter.

## Safety and next state

```text
NO_SILENT_FALLBACK=PASS
ROUTE_CONTROL_STATE_FINAL=DISABLED
CURRENT_MODE=SHADOW_ONLY
ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0
LIVE_CANARY_EXECUTED=NO
PRODUCTION_AUTHORIZATION_CREATED=NO
PRODUCTION_DISPATCH=NO
ISSUE_STATE_MUTATED=NO
NEXT=V4_HERMES_CONSOLIDATION_AUDIT_CLOSURE_EVALUATION_V1
NEXT_HUMAN_GATE_REQUIRED=NO
```

The existing Phase D, Phase E, Phase F, routing-policy, human-gate, and
OpenClaw-retirement decisions are preserved. This report changes no runtime,
route, registry, queue, receipt, browser, n8n, VPS, or production state.
