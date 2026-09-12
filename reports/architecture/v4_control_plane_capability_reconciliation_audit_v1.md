# V4 Control Plane capability reconciliation audit V1

**TASK_REF:** `V4_CONTROL_PLANE_CAPABILITY_RECONCILIATION_AUDIT_V1`
**TASK_KIND:** `ARCHITECTURE_RECONCILIATION_AUDIT`
**Classification:** `PASS`
**Audit date:** 2026-09-12 (Europe/Rome)
**Repository:** `mrhz1973/control-plane`
**Branch:** `main`
**BASE_HEAD:** `9017d2ba2ca648c64eb42991a8f574ab28a286d7`

## 1. Executive reconciliation

This is a read-only architecture and capability reconciliation. No provider
inference, browser interaction, production dispatch, VPS operation, service
mutation, route activation, or issue mutation was performed. The only
authorized repository output of this audit is this report.

The current system is not one undifferentiated “AI stack”. It is a governed
composition of strategic input, source-of-truth state, deterministic admission,
planner and implementer surfaces, execution packets, review/retry gates,
quota observability, and human gates. The principal live path is the bounded
LOCAL_DEV lane; several adjacent capabilities are structurally implemented but
not promoted or not wired to a live machine-readable source.

The strongest current state is:

- GitHub is the issue/source-of-record surface and `CURRENT_FRONTIER.md` is the
  live repository frontier.
- ChatGPT Web plus the operator is the human-facing strategic/backlog surface.
- The local-dev selector, admission gate, execution packet, Qwen/OpenCode
  implementer path, deterministic checks, and receipt concepts are live or
  qualified within their stated gates.
- Hermes Phase C and Phase D are proven in the repository evidence; Phase E is
  not started and remains the next capability gap.
- RT25 quota/review/retry machinery is reusable and wired behind authorization;
  it is not a production-active autonomous route.
- OpenClaw is preserved as `KEEP_STAGED_PENDING`; OpenCode is the canonical
  qualified local Qwen execution harness. They are not interchangeable.
- Cursor and Codex surfaces have vendor-supported primitives, but the project
  has not proven every session, question, steering, or quota-source behavior.

### Canonical conflict requiring future apply work

The live GitHub issue #73 is still OPEN, while a newer frontier `CURRENT NEXT`
block says `ISSUE_73_PHASE_D=PASS (#73 CLOSED)`. The evidence proves the Phase D
substage PASS; it does not prove that the umbrella issue #73 is closed. This
audit records the conflict as `CF-73-UMBRELLA` and does not mutate the frontier.
The safe future apply task is:

`V4_CONTROL_PLANE_CANONICAL_RECONCILIATION_APPLY_V1`

The audit therefore does not silently reinterpret or overwrite canonical state.

## 2. Authority and source method

The source order used was the repository AI-BOOT order: remote repository state,
`docs/runtime/CURRENT_FRONTIER.md`, active work, specific contracts, checkpoints,
matching evidence, handoffs, and history/chat. Live GitHub issue status was read
without mutation. Safe local Cursor discovery was limited to command existence,
version, help, ACP help, and model-list discovery. No credentials, tokens,
session data, browser state, or provider response was collected.

The authority model reconciles these distinct authorities:

| Authority | Real role | Cannot do |
|---|---|---|
| Operator | Human decision, promotion, login, quota interpretation, human gate | Be replaced by planner text or an inferred provider answer |
| ChatGPT Web | Strategic conversation, backlog intent, decision-packet input | Authorize execution by itself |
| Codex App/subscription | Human-facing coding surface and possible executor surface | Be treated as a proven live quota collector without evidence |
| GitHub | Issue and repository source of record | Execute a packet |
| Control Plane | Deterministic state, selection, admission, packet and receipt policy | Delegate final authority to a model |
| n8n | Workflow, policy, bridge and gate composition | Become a credential owner or silent fallback |
| Deterministic core | Eligibility, fences, validation, state transitions | Infer model quality or operator intent |
| CURRENT_FRONTIER | Live repository state and canonical NEXT | Be casually edited during an audit |
| Packet/checkpoint/gate | Bounded, resumable, auditable execution state | Expand scope or self-authorize |
| Telegram | Human-gate notification/response pattern | Become an autonomous router |

The central invariant is: a planner proposes; deterministic policy and an
operator gate decide. Provider availability, model eligibility, quota state,
loaded state, active state, qualified state, and authorized state are separate
facts.

## 3. As-is architecture

```text
Operator + ChatGPT Web
        |
        v
GitHub issue/backlog/queue  --->  deterministic selector
                                      |
                              admission + hygiene + quota observation
                                      |
                 planner preference / selected qualified planner
                                      |
                   execution packet + optional checkpoint
                                      |
             n8n bridge / governed router / authorization gate
                         |                         |
                  OpenCode + Qwen              Cursor harness
                         |                         |
                    local implementation     bounded execution
                         |
                 deterministic tests + review + receipts
                                      |
                           Telegram human gate
```

Remote provider transport and quota are separate lanes:

```text
GLM/Codex target -> LiteLLM primary remote gateway -> governed policy/gate
OpenClaw staged broker ----------------------------------------------^
Qwen local -> OpenCode canonical local adapter -> qualified scope/profile
Hermes -> authenticated ChatGPT Web cognitive/browser bridge (shadow/gated)
```

The diagram describes composition, not an assertion that every arrow is live,
authorized, or production-promoted.

## 4. Required capability matrix

`PROVEN_PROJECT` means repository evidence or deterministic tests prove the
stated behavior. `VENDOR_SUPPORTED_NOT_PROJECT_PROVEN` means the tool/provider
documents or exposes the primitive but this project has not qualified the full
behavior. `IMPLEMENTED_NOT_WIRED` means a repository component exists but its
live source, caller, or promotion is still absent. `PLANNED_NOT_PROVEN` means a
documented target without sufficient execution evidence.

| CAPABILITY | REAL COMPONENT | ORIGINAL PLAN | BEST PROJECT EVIDENCE | CURRENT STATE | PROVENANCE CLASS | ACTIVE ROUTE | QUOTA DOMAIN | CONFLICT | GAP | ACTION | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Strategic orchestration | ChatGPT Web + operator | GPT Web strategic/backlog owner | PROJECT_VISION; operating model | LIVE | PROVEN_PROJECT | Human-facing | ChatGPT Web availability | None | No automatic authority | REUSE | P0 |
| Source of truth | GitHub + repo | GitHub issue/repo SoT | AI-BOOT; issue evidence | LIVE | PROVEN_PROJECT | GitHub | N/A | None | Keep precedence explicit | REUSE | P0 |
| Live frontier | CURRENT_FRONTIER.md | One live frontier | CURRENT_FRONTIER | LIVE | PROVEN_PROJECT | Repository | N/A | CF-73-UMBRELLA | Phase/umbrella wording | FINISH | P0 |
| Queue selector | select-local-dev-queue-item-v1 | Deterministic next-item selection | operating model; tool | LIVE / QUALIFIED | PROVEN_PROJECT | LOCAL_DEV | Observed resources | None | Freshness depends on probes | REUSE | P0 |
| Admission gate | admit-micro-task-delta-v1 + hygiene | Fail-closed eligibility | operating model; contracts | LIVE / QUALIFIED | PROVEN_PROJECT | LOCAL_DEV | Resource/quota observation | None | Promotion remains gated | REUSE | P0 |
| Planner preference | planner-routing-policy-v1 | Semantic preference plus provider state | routing policy; evaluator | IMPLEMENTED_NOT_WIRED | PROVEN_PROJECT | Governed selection | Provider-specific | Policy target vs live collectors | Live source/qualification | FINISH | P1 |
| Planner evaluator | planner-selection-evaluator-v1 | Select class, never invoke provider | evaluator contract | LIVE / QUALIFIED | PROVEN_PROJECT | Control Plane | N/A | None | None | REUSE | P0 |
| Execution packet | execution-packet-v1 | Bounded handoff envelope | schema, policy gate, reports | LIVE | PROVEN_PROJECT | n8n/OpenCode/Cursor gates | N/A | None | End-to-end auto gate partial | REUSE | P0 |
| Execution checkpoint | execution-checkpoint-v1 | Safe resume across interruption | checkpoint contract | QUALIFIED / NOT AUTHORIZING | PROVEN_PROJECT | Cursor/local task | N/A | None | More harness proofs | QUALIFY | P1 |
| Execution router | n8n V4 bridge + seams | Governed packet routing | n8n bridge contracts | LIVE STRUCTURAL / GATED | PROVEN_PROJECT | n8n bridge | Provider route | Production promotion gated | Finish promotion evidence | FINISH | P1 |
| OpenCode implementer | opencode adapter + Qwen :8080 | Canonical local implementer | Qwen qualification; frontier | LIVE / QUALIFIED | PROVEN_PROJECT | Qwen -> OpenCode | Local compute | None | Role-specific limits | REUSE | P0 |
| Cursor Agent CLI | agent/cursor-agent | Bounded alternate executor | local safe probe; handoff standard | PARTIALLY_PROVEN | MIXED_PROJECT_VENDOR | Cursor | Cursor allowance | No stable quota source | Full project qualification | QUALIFY | P1 |
| Cursor ACP | agent acp | ACP execution integration | `agent acp --help` only | VENDOR_SUPPORTED_NOT_PROJECT_PROVEN | VENDOR_CURRENT_CAPABILITY | Cursor | Cursor allowance | None | E2E ACP evidence | QUALIFY | P2 |
| Cursor headless | `--print`/headless help surface | Noninteractive bounded run | help surface; no E2E proof | VENDOR_SUPPORTED_NOT_PROJECT_PROVEN | VENDOR_CURRENT_CAPABILITY | Cursor | Cursor allowance | None | Project qualification | QUALIFY | P2 |
| Cursor ask question | vendor question/interaction primitive | Human gate inside session | No normalized project evidence | VENDOR_SUPPORTED_NOT_PROJECT_PROVEN | VENDOR_CURRENT_CAPABILITY | Cursor | Cursor allowance | Telegram gate is separate | Shared gate contract | QUALIFY | P1 |
| Cursor live steering | resume/continue/session controls | Bounded operator steering | `--resume`/`--continue` help | VENDOR_SUPPORTED_NOT_PROJECT_PROVEN | VENDOR_CURRENT_CAPABILITY | Cursor | Cursor allowance | None | Prove identity/fence behavior | QUALIFY | P2 |
| Cursor same-session gate | checkpoint + operator handoff concepts | Resume after gate/provider pause | checkpoint contract, not Cursor E2E | PARTIALLY_PROVEN | MIXED_PROJECT_VENDOR | Cursor | Cursor allowance | None | Harness-specific proof | QUALIFY | P1 |
| Cursor quota source | native quota/bucket observatory | Machine-readable Cursor Models/Other Models | quota source probe report | NOT_PROVEN | PROVEN_PROJECT_NEGATIVE | None | Cursor allowance | Manual observations not stable | Collector/source | FINISH | P1 |
| Codex App | Desktop/app coding surface | Subscription alternate surface | app/IDE reports and foundation | QUALIFIED_NOT_ACTIVE | PROVEN_PROJECT | Codex App | chatgpt_codex_subscription | Qualification scope limited | Active route decision | DEFER | P1 |
| Codex app-server | `account/rateLimits/read` protocol | Secondary quota diagnostic | secondary collector report | IMPLEMENTED_NOT_WIRED | MIXED_PROJECT_VENDOR | Diagnostic only | chatgpt_codex_subscription | RPC not live-invoked | Safe live source | QUALIFY | P1 |
| Codex quota | OpenClaw usage JSON / app-server | Unified Codex pool observation | collector report | PARTIALLY_PROVEN | PROVEN_PROJECT | Diagnostic | One Codex pool | Surface comparability | Fresh collector | FINISH | P1 |
| Hermes bridge | qualified browser-tool wrapper | Qwen cognitive/browser bridge | Phase C/D reports | QUALIFIED_NOT_ACTIVE | PROVEN_PROJECT | Shadow/gated | ChatGPT Web availability | No production dispatch | Phase E route | REUSE | P0 |
| Phase C | Qwen -> Hermes -> ChatGPT Web proof | Shadow continuity | Phase C evidence/frontier | LIVE / PASS | PROVEN_PROJECT | Shadow only | ChatGPT Web | None | No promotion | REUSE | P0 |
| Phase D | rollover + stale-generation fence | Fresh-chat continuity | Phase D V2 report, 43/43 | LIVE / PASS | PROVEN_PROJECT | ChatGPT Web | Older Phase D report stale | Keep umbrella wording coherent | REUSE | P0 |
| ChatGPT Web send | authenticated Web surface | Bounded human-approved send | Phase D DOM confirmation | QUALIFIED_SHADOW_ONLY | PROVEN_PROJECT | Hermes gated | Web availability | No production route | No automatic send | DEFER | P0 |
| RT25 quota runtime | canonical quota/review/retry runtime | Reuse for quota-aware execution | 19/19, 104/104, 15/15, 10/10, 14/14 | QUALIFIED_BEHIND_GATE | PROVEN_PROJECT | No production route | Registry pools | D0025 false | Authorized caller/promotion | REUSE | P0 |
| GLM pool translator | glm_coding_plan mapping | Shared 5.3/Flash pool | translator report | QUALIFIED_SCHEMA_ONLY | PROVEN_PROJECT | LiteLLM target | `glm_coding_plan` | No live values | Live collector | FINISH | P1 |
| GLM 08–12 policy | operator local-time rule | Codex preference in window | operator-confirmed policy in task/foundation target | OPERATOR_POLICY | OPERATOR_CONFIRMED | Future governed route | GLM shared pool | Foundation labels target | Persist policy through apply task | FINISH | P1 |
| Qwen local | Ollama/Qwen endpoint :8080 | Local planner/implementer | six-profile policy and qualifications | LIVE / QUALIFIED | PROVEN_PROJECT | OpenCode | Local compute | Older deferred wording | Keep role boundaries | REUSE | P0 |
| OpenClaw broker | staged VPS/broker artifacts | Fallback/auth/quota broker | frontier `KEEP_STAGED_PENDING`; issue #8 history | DEFERRED | PROVEN_PROJECT | None | None active | CF-OPENCLAW-PRIMARY | No activation evidence | DEFER | P1 |
| LiteLLM gateway | primary remote gateway contracts | GLM/Codex transport | foundation v3.5; runner contract | STRUCTURAL / PARTIAL | PROVEN_PROJECT | Remote target/gated | GLM/Codex | runner implementation pending | Complete qualification | FINISH | P1 |
| Telegram gate | notification/gate pattern | Human approval/escalation | operating model/foundation | LIVE PATTERN | PROVEN_PROJECT | Human gate | N/A | None | Normalize cross-harness state | REUSE | P1 |
| Bugbot | reviewer/check gate | Review quality signal | operating model; issue history | QUALIFIED_SELECTIVE | PROVEN_PROJECT | Review lane | N/A | Not router | Broader policy optional | REUSE | P2 |
| Dashboard | local-dev dashboard | Queue/resource observability | dashboard tools; issue #79 | LIVE LOCAL_DEV ONLY | PROVEN_PROJECT | Dispatcher dashboard | Resource observations | CF-DASHBOARD-DISPATCHER | External Hermes/Qwen telemetry | FINISH | P2 |
| RT25 observability | resource/quota observatory | Time/quota-aware admission | observatory and RT25 reports | LIVE UI / OBSERVATION-DEPENDENT | PROVEN_PROJECT | LOCAL_DEV | Registry pools | Static registry | Fresh ingestion | FINISH | P1 |
| noVNC/CDP | private browser qualification surface | Private operator proof | Hermes/noVNC reports | QUALIFIED_PRIVATE_ONLY | PROVEN_PROJECT | Hermes qualification | Web availability | No public exposure | No production coupling | DEFER | P2 |
| VPS/n8n | isolated runtime + workflow | Governed remote execution | foundation/frontier/runtime evidence | LIVE STRUCTURAL / GATED | PROVEN_PROJECT | n8n bridge | Provider-specific | No production promotion | Preserve gate | REUSE | P1 |
| Grok | proposed planner/executor surface | Alternate route | operating model target/gated | PLANNED_NOT_PROVEN | PROVEN_PROJECT | None | Unknown | No live proof | Qualification | DEFER | P2 |
| Ollama Desktop multi-model | Desktop lane audit | Multi-model alternate lane | preserved audit; human-gate decision | DEFERRED | OPERATOR_CONFIRMED | None | None | Explicitly not implemented | Revisit only by new task | DEFER | P2 |
| Phase E | quota-degraded shadow route | Next Hermes phase | backlog and frontier NEXT | PLANNED_NOT_PROVEN | PROVEN_PROJECT | None | Live quota domains | Phase D is not Phase E | Implement/qualify separately | FINISH | P0 |

## 5. Loaded, active, qualified, authorized

These labels are intentionally non-equivalent:

- **Loaded/installed:** a binary, adapter, package, or service exists locally.
- **Available:** a command or endpoint responds, without proving account or
  project policy qualification.
- **Active:** the route is used by the current live policy for an allowed job.
- **Qualified:** bounded tests/evidence prove the declared behavior and walls.
- **Authorized:** a specific operator-issued or policy-issued authorization allows
  the action now. Qualification does not grant authorization.
- **Promoted:** a human-approved route is allowed to affect production. None of
  the audit’s new observations promote a route.

The Cursor installation and ACP help output prove availability only. The empty
model-list discovery is evidence that a model/account path was not available to
that probe; it is not a credential diagnosis and no status/auth command was
used. The Codex app-server RPC is protocol-supported and represented by an
offline adapter, not a live collector result. OpenClaw is present in historical
architecture but is not active.

## 6. Task-flow reconciliation

The task flow is:

1. Operator/ChatGPT Web expresses intent and scope.
2. GitHub issue/backlog supplies the item and repository state.
3. The selector chooses a bounded item.
4. Deterministic admission checks hygiene, eligibility, gates, and observations.
5. A planner may build or recommend an execution packet; it cannot authorize.
6. The packet is validated and may have a checkpoint for bounded continuation.
7. n8n/bridge policy selects the qualified implementer and route.
8. OpenCode/Qwen or a separately qualified Cursor surface performs bounded work.
9. Deterministic checks, review, result gate, receipts, and optional retry apply.
10. Telegram/operator handles ambiguity, promotion, or credential/human action.

The planner/executor distinction is preserved: planner output is data; the
executor operates only after deterministic gates. A failed provider or missing
quota source must fail closed, not silently change provider or model.

## 7. Reuse required and existing partial capability

The principal reusable implementation is RT25. Its quota state, review, retry,
execution checkpoint, authorization ledger, receipt, and policy-gate concepts
must be composed by later work. The audit explicitly records:

`RT25_REUSE_REQUIRED=YES`

`ARE_WE_REBUILDING_RT25_ALREADY_IMPLEMENTED=NO`

Other reusable pieces are the resource registry v2, Qwen scope-v3 policy,
OpenCode adapter, Hermes allowlist/fence wrapper, execution packet schema,
planner evaluator, n8n bridge seams, Telegram human-gate pattern, and the
existing dashboard/resource observatory. Reuse does not mean all components
are currently wired to a live route.

## 8. Planned but not proven and truly missing

The bounded census in this report counts a capability row once, by its primary
gap. It does not count historical documents, duplicate adapters, or every
subtest. The census is:

```text
PROJECT_VISION_CONFLICTS_FOUND=3
CURRENT_FRONTIER_CONFLICTS_FOUND=2
STALE_CURRENT_FACING_DOCS=5
FORGOTTEN_CAPABILITIES=7
IMPLEMENTED_NOT_WIRED_COUNT=5
PLANNED_NOT_PROVEN_COUNT=8
TRULY_MISSING_COUNT=0
```

The zero truly-missing result is bounded: all identified needs have an existing
component, contract, evidence track, or explicitly documented future track.
This does not claim the desired system is complete. The principal unfinished
items are live quota collectors, Phase E, Cursor/Codex cross-surface session
qualification, external dashboard telemetry, and canonical wording cleanup.

The forgotten-capability set is: Cursor ACP qualification, Cursor question
semantics, Cursor live steering, Codex same-session gate, Codex live quota
collector, dashboard external activity telemetry, and the GLM live quota
monitor. These are not activated by this audit.

## 9. Conflict register

| ID | Conflict | Higher-confidence interpretation | Required action |
|---|---|---|---|
| CF-73-UMBRELLA | GitHub #73 OPEN vs frontier literal “#73 CLOSED” | Phase D substage PASS; #73 umbrella remains OPEN for Phase E/quota work | Canonical wording apply |
| CF-PHASE-D-HISTORY | Older Hermes chain report says Phase D OPEN; V2 report/frontier say PASS | V2 supersedes predecessor state | Mark old report historical/superseded |
| CF-OPENCLAW-PRIMARY | Older vision/issue #8 presents OpenClaw as primary/future broker; frontier says staged | Current active route is not OpenClaw; LiteLLM is primary structural remote gateway | Keep staged, update current-facing wording |
| CF-QWEN-LEGACY | Older material defers Qwen; newer frontier qualifies six profiles | Current qualified role is bounded local OpenCode/Qwen | Remove stale broad claim |
| CF-DASHBOARD-DISPATCHER | Dashboard sees dispatcher/queue but not idle Hermes/Qwen browser activity | Current scope is local-dev observability; issue #79 is additive future | Add telemetry without auth coupling |
| CF-GLM-WINDOW | Foundation calls 08–12 a target; operator confirms it as policy | Treat as operator policy, not provider fact | Persist policy in governed apply task |
| CF-LITELLM-STATUS | Foundation/frontier call LiteLLM primary while runner contract is pending | Architecture route is primary; complete live qualification separately | Finish bounded qualification |

No conflict authorizes a route change. No old issue or architecture sentence
overrides the repository live frontier without an explicit reconciliation task.

## 10. Bounded repair continuation policy

`BOUNDED_REPAIR_CONTINUATION_POLICY_V1` is a policy contract, not a general
permission to keep operating. A continuation is eligible only when every field
below is true:

```text
SAME_TASK_REF=YES
SAME_OBJECTIVE=YES
SCOPE_EXPANSION=NO
AUTHORITY_EXPANSION=NO
HARD_WALL_CHANGE=NO
PRODUCTION_AUTHORITY_CHANGE=NO
REPAIR_DERIVED_FROM_OBSERVED_FAILURE=YES
```

Classification: `QUALIFIED_POLICY_NOT_AUTONOMOUS_AUTHORITY`.

The state machine is:

```text
START
  -> OBSERVED_FAILURE
  -> REPAIR_DERIVED_AND_BOUNDED
  -> PREFLIGHT_RECHECK
  -> CONTINUE_SAME_TASK
  -> VERIFY_OUTCOME
       -> PASS / STOP / HUMAN_GATE
```

Any changed task identity, objective, scope, authority, hard wall, or
production permission exits the state machine to a fresh task or Human Gate.
The continuation policy cannot create a new provider request, retry outside the
declared budget, or convert a STOP into a PASS.

## 11. Long-running agent session

`LONG_RUNNING_AGENT_SESSION=PARTIALLY_PROVEN`.

Long-running bounded work is not equivalent to a short-duration command. Its
boundaries are task identity, packet/checkpoint identity, generation/nonce
fences, timeboxed phases, explicit provider budgets, and fail-closed loss
handling. The correct policy is not an arbitrary universal 20- or 30-minute
stop. A long-running session may continue across bounded checkpoints while its
scope and authority remain identical; it must stop on ambiguity, stale base,
missing verifier, budget exhaustion, or a human-only gate.

## 12. Cursor reconciliation

Safe local discovery found:

```text
agent       2026.05.24-dda726e
cursor-agent 2026.05.24-dda726e
cursor      3.19.19 (x64)
```

The help surfaces expose plan/ask, resume/continue, model discovery, worker
and ACP server commands. `agent models` and `agent --list-models` returned no
models for the observed account. No login, logout, auth refresh, token read,
config mutation, or UI scraping was performed.

Therefore:

```text
CURSOR_AGENT_CLI=PARTIALLY_PROVEN
CURSOR_ACP=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_HEADLESS=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_ASK_QUESTION=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_LIVE_STEERING=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_SAME_SESSION_HUMAN_GATE=PARTIALLY_PROVEN
CURSOR_QUOTA_MACHINE_SOURCE=NOT_PROVEN
```

The project has a bounded Cursor handoff/checkpoint standard, but that is not
evidence that the vendor’s ACP or question protocol is fully normalized into
the Control Plane. Cursor remains a separate available harness, not an
automatic fallback selected by this audit.

## 13. Codex reconciliation

```text
CODEX_APP=QUALIFIED_NOT_ACTIVE
CODEX_APP_SERVER=VENDOR_SUPPORTED_SECONDARY_COLLECTOR_NOT_LIVE
CODEX_SAME_SESSION_HUMAN_GATE=PLANNED_NOT_PROVEN
CODEX_QUOTA_DIRECT_SOURCE=NOT_PROVEN
```

The app-server protocol method `account/rateLimits/read` is represented by an
offline adapter with fields such as used percentage, reset time, duration, and
reset credits. The evidence class is secondary/diagnostic. The current primary
live usage artifact in the project’s architecture is OpenClaw usage JSON, but
OpenClaw itself is staged and this audit did not invoke a live collector. Both
surfaces map to one `chatgpt_codex_subscription` pool concept where proven;
there is no evidence to double-count them.

Codex App/subscription remains a human-operable alternate surface in the
operator practice. That does not activate automatic routing or establish a
same-session Human Gate contract.

## 14. Quota and GLM policy

Quota domains are independent: GLM Coding Plan, Codex subscription, Cursor
allowance, Qwen local compute/occupancy, and ChatGPT Web availability are not a
single pool. Static registry metadata is not a live quota value. A quota pool
status is not itself an authorization.

The GLM 5.3 and Flash mapping is one shared `glm_coding_plan` pool, avoiding
double-counting. The live value/collector is not proven by this audit.

The operator-confirmed local-time rule is recorded exactly as policy:

```text
GLM_CODING_PLAN_SOURCE=OPERATOR_CONFIRMED_SHARED_POOL_POLICY
GLM_53_AND_FLASH_SHARED_POOL=YES
GLM_08_12_CLASSIFICATION=OPERATOR_POLICY
GLM_08_12_EMPIRICAL_EVIDENCE=CONFIRMED_BY_OPERATOR
GLM_08_12_APPLIES_WEEKEND=YES
GLM_08_12_BYDAY=MO,TU,WE,TH,FR,SA,SU
GLM_08_12_WINDOW=[08:00,12:00)
GLM_08_12_TIMEZONE=Europe/Rome
```

Inside the window, the intended preference is Codex subscription when GLM is
ineligible or exhausted, but that is operator practice/context here, not
automatic routing implemented by this audit. Missing Codex qualification or
quota must fail closed; it must not silently fall back to GLM.

## 15. OpenClaw, OpenCode, LiteLLM and Hermes

```text
OPENCLAW_CURRENT_STATUS=KEEP_STAGED_PENDING
OPENCLAW_ACTIVE_AUTHORITY=NO
OPENCLAW_ACTIVE_BROKER=NO
OPENCLAW_ACTIVE_QUOTA_SOURCE=NO
OPENCLAW_RUNTIME_REQUIRED=NO
OPENCODE_CURRENT_STATUS=LIVE_QUALIFIED_CANONICAL_QWEN_EXECUTION_ADAPTER
```

OpenClaw is retained as historical/future broker, auth, quota, and fallback
architecture. It is not the current active authority, broker, quota source, or
required runtime. OpenCode is the current qualified local Qwen execution
adapter and must not be renamed into OpenClaw semantics.

LiteLLM is the primary remote gateway architecture for GLM/Codex transport, but
the primary-cycle runner contract remains bounded/offline preparation and
finalization with authenticated HTTP owned by n8n. This is a structural route,
not a claim that every remote route is active.

Hermes is a cognitive/browser bridge and continuation mechanism. Phase C and
Phase D evidence proves bounded shadow behavior, exact tool allowlisting,
stale-generation/context-delta fences, independent DOM send confirmation, and
fail-closed controller/browser/verifier loss. Hermes is not scheduler, state
owner, planner authority, quota authority, or production dispatcher.

## 16. Phase and roadmap reconciliation

```text
ISSUE_73_PHASE_C=PASS
PHASE_D=PASS
PHASE_E=NOT_STARTED
CURRENT_NEXT=V4_CONTROL_PLANE_CANONICAL_RECONCILIATION_APPLY_V1
```

The audit’s reconciliation NEXT is the canonical cleanup/apply task required to
resolve the documented frontier/issue conflict and stale current-facing state.
The underlying product roadmap still contains:

`V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1`

That Phase E track is not declared PASS and was not executed. The apply task
must preserve Phase C/D evidence, reconcile the #73 umbrella wording, and then
return to the Phase E roadmap without activating production routing.

## 17. Telegram, dashboard and observability

Telegram is a human-gate pattern: it can notify and receive a bounded operator
decision. It is not a model selector or silent fallback. The dashboard is live
for dispatcher, queue, resource and local-dev activity. Issue #79 identifies an
additive gap: idle dispatcher views do not show external Hermes/Qwen browser
work. Any future telemetry should be additive and auth-independent; this audit
does not implement it.

RT25 resource/quota observability is reusable but freshness is observation-
dependent. The registry describes pools and policy metadata; live collectors
must provide current values and provenance before an automatic quota-degraded
route can be promoted.

## 18. Hardening policy

Future apply/qualification work must retain:

- explicit task/base/run/nonce/generation identity;
- stale-generation and stale-base fences before and at dispatch;
- planner cannot self-authorize;
- no implicit provider/model/browser fallback;
- one declared budget and no hidden retry;
- independent receipt/DOM verification where browser send is in scope;
- no raw CDP or browser-console exposure to model-visible tools;
- checkpoint resume only for the same task/objective and bounded scope;
- provider/quota evidence with timestamp and source class;
- operator gate for ambiguity, production promotion, credentials, and policy
  changes;
- immutable STOP semantics and no retroactive PASS conversion;
- explicit staging and preservation of unrelated untracked work.

## 19. Canonical cleanup and roadmap recovery (future, not performed)

The next apply task should be a minimal documentation reconciliation only:

1. Resolve the literal #73 closure wording against live GitHub issue status.
2. Preserve `ISSUE_73_PHASE_C=PASS` and `PHASE_D=PASS` as substates.
3. Mark older Phase D and OpenClaw-primary statements as historical or
   superseded where appropriate.
4. Keep OpenClaw staged, OpenCode/Qwen qualified, and LiteLLM structural.
5. Preserve Phase E as NOT_STARTED until its own gates pass.
6. Keep dashboard telemetry, Cursor/Codex quota collectors, and cross-harness
   gates as bounded future work.

No cleanup was performed here because the task expressly prohibited modifying
frontier, last report, foundation, contracts, backlog, runtime, or any file
outside this report.

## 20. Mandatory audit markers

```text
CAPABILITY_RECONCILIATION=PASS
OPENCLAW_CURRENT_STATUS=KEEP_STAGED_PENDING
OPENCLAW_ACTIVE_AUTHORITY=NO
OPENCLAW_ACTIVE_BROKER=NO
OPENCLAW_ACTIVE_QUOTA_SOURCE=NO
OPENCLAW_RUNTIME_REQUIRED=NO
OPENCODE_CURRENT_STATUS=LIVE_QUALIFIED_CANONICAL_QWEN_EXECUTION_ADAPTER
CURSOR_AGENT_CLI=PARTIALLY_PROVEN
CURSOR_ACP=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_HEADLESS=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_ASK_QUESTION=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_LIVE_STEERING=VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
CURSOR_SAME_SESSION_HUMAN_GATE=PARTIALLY_PROVEN
CURSOR_QUOTA_MACHINE_SOURCE=NOT_PROVEN
CODEX_APP=QUALIFIED_NOT_ACTIVE
CODEX_APP_SERVER=VENDOR_SUPPORTED_SECONDARY_COLLECTOR_NOT_LIVE
CODEX_SAME_SESSION_HUMAN_GATE=PLANNED_NOT_PROVEN
CODEX_QUOTA_DIRECT_SOURCE=NOT_PROVEN
GLM_CODING_PLAN_SOURCE=OPERATOR_CONFIRMED_SHARED_POOL_POLICY
GLM_53_AND_FLASH_SHARED_POOL=YES
GLM_08_12_CLASSIFICATION=OPERATOR_POLICY
GLM_08_12_EMPIRICAL_EVIDENCE=CONFIRMED_BY_OPERATOR
GLM_08_12_APPLIES_WEEKEND=YES
GLM_08_12_BYDAY=MO,TU,WE,TH,FR,SA,SU
GLM_08_12_WINDOW=[08:00,12:00)
GLM_08_12_TIMEZONE=Europe/Rome
BOUNDED_REPAIR_CONTINUATION_POLICY=QUALIFIED_POLICY_NOT_AUTONOMOUS_AUTHORITY
LONG_RUNNING_AGENT_SESSION=PARTIALLY_PROVEN
EXECUTION_CHECKPOINT=QUALIFIED_NOT_AUTHORIZING
RT25_REUSE_REQUIRED=YES
ARE_WE_REBUILDING_RT25_ALREADY_IMPLEMENTED=NO
PROJECT_VISION_CONFLICTS_FOUND=3
CURRENT_FRONTIER_CONFLICTS_FOUND=2
STALE_CURRENT_FACING_DOCS=5
FORGOTTEN_CAPABILITIES=7
IMPLEMENTED_NOT_WIRED_COUNT=5
PLANNED_NOT_PROVEN_COUNT=8
TRULY_MISSING_COUNT=0
ISSUE_73_PHASE_C=PASS
PHASE_D=PASS
PHASE_E=NOT_STARTED
CURRENT_NEXT=V4_CONTROL_PLANE_CANONICAL_RECONCILIATION_APPLY_V1
NO_NEW_ARCHITECTURE_INVENTED=YES
IMPLEMENTATION_PERFORMED=NO
PROVIDER_CALLS=0
MODEL_INFERENCE=0
BROWSER_AUTOMATION=0
CHATGPT_WEB_SENDS=0
QWEN_GENERATIONS=0
GLM_CALLS=0
CODEX_CALLS=0
PRODUCTION_DISPATCH=0
V1_TICK_CALLS=0
VPS_MUTATIONS=0
N8N_MUTATIONS=0
OPENCLAW_ACTIVATION=0
ISSUE_STATE_MUTATIONS=0
CONFIG_MUTATIONS=0
RUNTIME_MUTATIONS=0
```

## 21. PASS closure

```text
RESULT=PASS
TASK_REF=V4_CONTROL_PLANE_CAPABILITY_RECONCILIATION_AUDIT_V1
BASE_HEAD=9017d2ba2ca648c64eb42991a8f574ab28a286d7
REPORT_SCOPE=REPORT_ONLY
NEXT=V4_CONTROL_PLANE_CANONICAL_RECONCILIATION_APPLY_V1
COMMIT_SUBJECT=codex-audit: V4_CONTROL_PLANE_CAPABILITY_RECONCILIATION_AUDIT_V1
```

This report is an evidence-backed reconciliation, not an implementation or a
promotion decision.
