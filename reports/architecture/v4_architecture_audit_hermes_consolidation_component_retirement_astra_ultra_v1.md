# V4 architecture audit #61 — Hermes consolidation and component retirement

Audit date: 2026-09-07. Repository: `mrhz1973/control-plane`. Canonical branch: `main`.

```text
AUDIT_BASE_HEAD=f2b314b1cb544514f3044d8c6238a9359ad9b1e2
EXPECTED_STARTING_HEAD=f2b314b1cb544514f3044d8c6238a9359ad9b1e2
FINAL_OBSERVED_HEAD=f2b314b1cb544514f3044d8c6238a9359ad9b1e2
AUDIT_MODE=ANALYSIS_ONLY
RECOMMENDED_TO_BE=DETERMINISTIC_CORE_WITH_BOUNDED_HERMES_COGNITION
IMPLEMENTATION_AUTHORIZED_BY_REPORT=NO
```

## 1. Decision and evidence rules

**ARCHITECTURAL RECOMMENDATION — RECOMMENDED:** retain GitHub authority and deterministic control, use the existing Hermes/browser installation as a governed cognitive worker, and qualify ChatGPT Web through Hermes as the preferred TASK DELTA author only at cognitive boundaries. Preserve direct specialist and local fallback surfaces. Keep human decisions, execution admission, spend provenance, review and retry outside the cognitive runtime. Consolidate the packaging of execution adapters without combining their authority domains. Do not add Hermes as a second unconditional scheduler, gateway, broker or state authority.

**ARCHITECTURAL INFERENCE — INFERRED:** this architecture minimizes total complexity better than putting all functions in Hermes. Moving credentials, scheduling, authorization, implementation, review and recovery into one agent would concentrate trust and make browser/session failures control-plane failures. Existing overlap demonstrates potential reuse, not replacement parity.

**CURRENT FACT — PROVEN:** no complete retirement or replacement parity case is established by the bounded evidence. This report proposes zero immediate component retirements and zero replacements with Hermes. That is a valid negative result of the consolidation hypothesis. The one MERGE disposition is a packaging recommendation, not a claim that an existing algorithm or live service is redundant.

The following labels apply throughout:

| Statement category | Exact evidence grade | Meaning |
|---|---|---|
| CURRENT FACT | PROVEN | Directly recorded by current canon, inspected code/config, or a bounded attributable proof. Does not imply a new live probe or broader production qualification. |
| ARCHITECTURAL INFERENCE | INFERRED | Reasoned consequence of the cited facts; scope and uncertainty remain explicit. |
| ARCHITECTURAL RECOMMENDATION | RECOMMENDED | Proposed future ownership, policy or migration; never implemented state. |
| CURRENT FACT or unresolved question | UNKNOWN | Evidence absent, insufficient or conflicting within this audit's bounded read set. |

Each disposition has exactly one grade, RECOMMENDED, because it is an architecture decision. Its cited current evidence has its own grade in the evidence index and capability matrix. No recommendation is promoted into CURRENT_FRONTIER.

Source precedence: current remote repository and CURRENT_FRONTIER for live state; current policy/config/code for structural behavior; later issue comments and bounded reports for superseding evidence; historical prose only for its historical scope. Code proves structure, not live activation. A PASS observed in an earlier bounded window is not a continuous availability guarantee.

## 2. Snapshot, bootstrap and compact evidence index

Initial `git fetch origin main` completed, and `git ls-remote origin refs/heads/main` returned the full AUDIT_BASE_HEAD above. Local HEAD and refreshed origin/main matched. Existing untracked workstation artifacts were outside this audit's write set and were not evidence of canonical state. Git CLI issue access was unauthenticated; current issue bodies/comments were obtained through the connected GitHub API. The report's final refresh record appears in section 16.

CORE BOOT read README AI-BOOT, full CURRENT_FRONTIER, and the current active VPS/Hermes qualification pointers needed for this audit. Issue #61 body and **all six current comments** were read before architecture expansion. A compact index then bounded three independent reviews: execution/governance, infrastructure/security, and model/quota routing. No inference campaign, benchmark, historical directory crawl, runtime modification or new proof workload was performed.

| ID | Canonical pointer / bounded read | Grade and scope |
|---|---|---|
| E01 | [README AI-BOOT](../../README.md), [CURRENT_FRONTIER](../../docs/runtime/CURRENT_FRONTIER.md) | PROVEN: bootstrap, precedence, sequencing, live projection, closed gates and active DEV path. |
| E02 | [Issue #61](https://github.com/mrhz1973/control-plane/issues/61), six comments indexed below | PROVEN as current issue evidence; proposals remain recommendations. |
| E03 | [CURRENT_VPS_STATE](../../docs/vps/CURRENT_VPS_STATE.md), [PROJECT_VPS_REGISTRY](../../docs/vps/PROJECT_VPS_REGISTRY.md) | PROVEN current infrastructure projection; obsolete embedded project-chat/next labels reconciled below. |
| E04 | [A01/F03 closure](v4_vps_codex_a01_f03_review_closure_v1.md) | PROVEN bounded supersession: soak 29+2+6; census 32/2; registry 20/1. |
| E05 | [Issue #72](https://github.com/mrhz1973/control-plane/issues/72), [closure comment](https://github.com/mrhz1973/control-plane/issues/72#issuecomment-5574696394), [WF90 remediation](v4_wf90_post_cutover_telegram_service_error_storm_remediation_v1.md) | PROVEN: current CLOSED/completed state, missing private grant fixed, two natural clean ticks. |
| E06 | [Hermes deployment](v4_replacement_8gb_vps_hermes_browser_runtime_deployment_v1.md), [#67 qualification comments](https://github.com/mrhz1973/control-plane/issues/67) | PROVEN: pinned Hermes 0.21.0 / `3ac671db`, user/profile/listeners; later sentinel/auth/recall/30-minute qualification. |
| E07 | [Qwen 96K endurance V2](v4_qwen_96k_endurance_stability_3cycle_v2_2026-09-07.md) | PROVEN: valid three-cycle workload, V1 oversize invalidation, bounded health and semantic result. |
| E08 | [Registry v2](../../configs/resources/registry.json) | PROVEN configured role/model/surface/pool separation and surface evidence labels; not a current quota collector. |
| E09 | [Qwen runtime](../../configs/resources/qwen-local-runtime.json), [model policy](../../configs/resources/qwen-local-model-policy.json), [catalog overlay](../../configs/resources/qwen-router-catalog-scope-overlay.json), [qualification](../../configs/resources/qwen-role-qualification.json) | PROVEN eligibility and profile constraints; E01 supersedes stale manual-profile status labels. |
| E10 | [Production gate](../../configs/planner/primary-remote-runtime-gate.json), [LiteLLM profile](../../configs/litellm/control-plane-primary-remote.gateway-profile.json) | PROVEN configured closed remote gate and gateway ownership. |
| E11 | [PROJECT_VISION](../../docs/foundation/PROJECT_VISION.md) §§4–7, 11; [Execution Packet](../../docs/contracts/execution-packet-v1.md); [prompt sequencing](../../docs/foundation/PROMPT_SEQUENCING_GATE.md) | PROVEN policy: planner cannot self-authorize; explicit bounds, risk, fallback, persistence and result-ingestion barrier. Old runtime claims subordinate to E01. |
| E12 | [Queue selection](../../tools/select-local-dev-queue-item-v1.mjs), [dispatcher service](../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs) | PROVEN structural NORMAL path: admissibility, risk/FIFO, hygiene, single flight and safe FF. Live qualification comes from E01. |
| E13 | [DEV runner](../../tools/run-local-dev-executor-v1.mjs), [executor](../../tools/local-dev-executor-v1.mjs), [generation guard](../../tools/local-dev-generation-guard-v1.mjs) | PROVEN bounded execution controls; not an OS sandbox or universal recovery proof. |
| E14 | [n8n adapter bridge](../../tools/n8n-v4-execution-adapter-router-bridge-v1.mjs), [adapter router](../../tools/v4-execution-adapter-router-v1.mjs), [OpenCode adapter](../../tools/opencode-execution-adapter-v1.mjs), [Windows endpoint](../../tools/serve-v4-windows-local-execution-endpoint-v1.mjs) | PROVEN separate transport, route and admission boundaries; bridge deliberately live-incapable, endpoint governs execution. |
| E15 | [Issuance](../../tools/v4-runtime-authorization-issuance-v1.mjs), [issuance service](../../tools/serve-v4-runtime-authorization-issuance-v1.mjs), [provenance registry](../../tools/v4-runtime-authorization-provenance-registry-v1.mjs) | PROVEN pending/decision/reconciliation ownership, Telegram identity checks, per-process writer and ACTIVE→SPENT rules. |
| E16 | [Durable spend ledger](../../tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs), E14 endpoint | PROVEN ledger-first admission; persistence is file replacement, not established cross-process transaction or power-loss guarantee. |
| E17 | [Review boundary](../../tools/run-review-stage-v1.mjs), [reviewer selector](../../tools/rt25-reviewer-quota-aware-selector-v1.mjs) | PROVEN fresh selection and `execution_performed=false`; same-model-only candidate can be selected. |
| E18 | [Retry boundary](../../tools/run-retry-stage-v1.mjs), [governed caller](../../tools/run-governed-retry-execution-v1.mjs) | PROVEN explicit bounded repair selection; no automatic live repair execution. |
| E19 | [Quota closure checkpoint](v4_canonical_quota_runtime_final_closure_checkpoint_v1.md), E08, E17, E18 | PROVEN canonical runtime selection wiring behind closed gates. E01 already supplies closure summary; historical chain not reread. |
| E20 | [Official Hermes browser documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/browser/), [tools reference](https://hermes-agent.nousresearch.com/docs/reference/tools-reference/) (accessed 2026-09-07) | PROVEN upstream advertised capability only; not proof of pinned deployed-version behavior or Control Plane parity. |

### Current issue evidence and supersession

All six #61 comments are accounted for:

| Comment | Input retained / supersession |
|---|---|
| [5562631721](https://github.com/mrhz1973/control-plane/issues/61#issuecomment-5562631721) | Proposed primary TASK DELTA author, rollover and initial 64K/96K probes. Proposals remain unimplemented; initial 500 diagnosis is not definitive. |
| [5563072055](https://github.com/mrhz1973/control-plane/issues/61#issuecomment-5563072055) | Direct-worker ORION 60,848 prompt tokens PASS; exact output unproven; does not prove a proxy defect. |
| [5563187841](https://github.com/mrhz1973/control-plane/issues/61#issuecomment-5563187841) | Model-manager ORION PASS, 60,844 cached tokens; weakens persistent proxy-defect hypothesis; latency not comparable with uncached direct run. |
| [5573209488](https://github.com/mrhz1973/control-plane/issues/61#issuecomment-5573209488) | Post-cutover eligibility and V2 96K supersession; approximate 72-hour retention is not automatic exit authorization. |
| [5573422938](https://github.com/mrhz1973/control-plane/issues/61#issuecomment-5573422938) | Coordination correction: VPS handoff did not dispatch audit; project orchestration chat named OpenClaw 43. This audit is authorized by the user's explicit current request, not that handoff. A chat name is not an activated OpenClaw service. |
| [5574704292](https://github.com/mrhz1973/control-plane/issues/61#issuecomment-5574704292) | Latest #72 remediation at AUDIT_BASE_HEAD; audit operationally unblocked, consolidation still excluded. |

E06 also read #67's body and all six current comments. Relevant superseding anchors: [sentinel](https://github.com/mrhz1973/control-plane/issues/67#issuecomment-5562958145), [auth restart](https://github.com/mrhz1973/control-plane/issues/67#issuecomment-5562991857), [resource baseline](https://github.com/mrhz1973/control-plane/issues/67#issuecomment-5563006658), [parity scope](https://github.com/mrhz1973/control-plane/issues/67#issuecomment-5563048074), [recall](https://github.com/mrhz1973/control-plane/issues/67#issuecomment-5563075741), [short soak](https://github.com/mrhz1973/control-plane/issues/67#issuecomment-5563391309).

**CURRENT FACT — PROVEN:** stale labels exist: #61's original 16GB preparation predates the replacement 8GB NEW; #67's pre-cutover body and deployment report predate current live/authenticated state; PROJECT_VPS_REGISTRY's trailing human-cutover NEXT is stale; CURRENT_VPS_STATE's OpenClaw42 chat label is superseded by later #61 coordination evidence. Foundation's deferred Qwen/runtime prose and DEV contract's design-only label are superseded by frontier/current code. None is rewritten in this audit. No source conflict reopens D-0025.

## 3. Verified current state

All rows are **CURRENT FACT — PROVEN**, with proof bounded to canonical recorded state unless a narrower label is shown.

| Required fact | Finding | Evidence |
|---|---|---|
| NEW | `31.70.139.73` / TS `100.99.54.93` = LIVE; replacement 8GB class, ~7.7GiB observed | E01, E03 |
| OLD | `217.160.71.145` / TS `100.114.7.53` = ROLLBACK_STANDBY_FROZEN; n8n stopped, PostgreSQL/GOI retained | E03 |
| Production cutover | PASS; NEW exact four-workflow publication map; no dual writer recorded | E01, E03–E04 |
| Post-cutover health / soak | PASS; exact cohort `37 = 29 + 2 + 6`; boundary WF90 `313135`; unexplained executions zero | E04 |
| Rollback retention | OPEN; auto-expiry NONE; exit and decommission require separate authorization | E01, E03 |
| OLD decommission | Ineligible and unauthorized | E03 |
| OpenClaw VPS runtime | KEEP_STAGED_PENDING / NOT ACTIVATED | E01, E02, E03 |
| WF90 #72 | CLOSED/completed, remediation PASS | E05 |
| NEW→Windows path | Exact private TCP/443 grant NEW `100.99.54.93/32`→workstation `100.110.35.23/32`; natural ticks `313916` and `313927`: IDLE_CLEAN, response_valid=true, notify_required=false, Telegram runs=0 | E05 |
| WF90 normalizer | Already byte-equal canonical, SHA256 prefix `9f4184e9802ea4a0`; incident was missing network grant, not need for another normalizer rewrite | E01, E05 |
| Qwen 96K V2 | Three distinct uncached cycles PASS; prompt tokens `67107 / 69417 / 70147`; HTTP/semantic/health PASS, stable PIDs | E07 |
| Prior V1 | INVALID_TEST_OVERSIZE: `109818 > 98304`; never a valid model/runtime failure test | E07 |
| D-0025 | CLOSED; `enabled=false`, authorized provider calls/event=0; WF61 inactive | E01, E10 |
| Production execution authorization | ACTIVE=0; AUTH001/002/004 SPENT, matching admission records; no automatic reopening from DEV success or Hermes proof | E01 |
| Reviewer and retry | Wired selection behind closed gates; inference/execution not authorized, `execution_performed=false` | E01, E17–E19 |
| Hermes | Browser/auth/restart/recall and 30-minute short soak PASS; neither substantive TASK DELTA nor 24h/24x7 autonomous cognitive proof | E06 |

**ARCHITECTURAL INFERENCE — INFERRED:** #72's private remediation remains the applicable path evidence because current frontier and issue closure agree and no newer contradiction was found. This is evidence validation, not a new network probe. It proves two normal ticks and preserved notification behavior, not eternal path availability.

## 4. AS-IS responsibility and data/control flow

This map separates live execution from installed-but-closed paths. GitHub is authority; model outputs and chat state are inputs to governed decisions.

```text
Human strategy / GPT Web project authoring
    -> GitHub backlog + frontier + contracts + packets + evidence
    -> deterministic policy/schema/route/gate evaluation
       |
       +-- LIVE DEV: NEW n8n WF90 (5-minute schedule)
       |     -> private Tailscale grant -> Windows :18793 dispatcher
       |     -> hygiene / safe FF / admissible queue / single flight
       |     -> DEV executor -> OpenCode -> manual DEV Qwen24K (:8080)
       |     -> bounded tests/results -> selective commit/push/remote verify
       |     -> GitHub evidence; gate/STOP/service error -> Telegram
       |
       +-- WF40 structural production path (83 nodes, workflow active)
       |     -> resource/quota composition -> route/transport adapter
       |     -> private Windows :18791 execution endpoint
       |     -> durable ledger -> provenance ACTIVE->SPENT
       |     -> guarded OpenCode/Qwen scope-v3 adapter
       |        [NEW production model execution CLOSED; ACTIVE auth=0]
       |
       +-- remote planning: LiteLLM primary route design/runtime assets
       |     -> permitted GLM/Codex subscription surfaces
       |        [D-0025 CLOSED; WF61 inactive; availability not assumed]
       |
       +-- review-stage / governed retry-stage selection
             -> fresh quota -> selected/blocked bounded result
                [reviewer/retry execution absent or unauthorized]

Hermes 0.21 CLI (NEW, hermes-test)
    -> qualified GLM Flash controller -> loopback CDP -> Chromium + Xvfb
    -> authenticated ChatGPT Web -> observed answer
       [qualified browser cognition; no canonical auto TASK DELTA dispatch]
    operator login/recovery -> SSH-private noVNC/x11vnc

Human decision -> Telegram authenticated user/chat check
    -> Windows :18792 issuance/pending/reconciliation service
    -> provenance registry; separate durable spend ledger at admission

Human-operated Cursor / qualified Codex IDE surfaces
    -> bounded implementation/review and GitHub persistence
Bugbot -> review evidence; not an orchestrator
OpenClaw -> preserved staged/fallback assets; VPS runtime inactive
```

**CURRENT FACT — PROVEN (E01, E03, E06, E12–E19):** n8n state is in NEW PostgreSQL; execution receipts and authorization files are workstation state; GitHub owns canonical project evidence and policy. Hermes session history and Chromium's authenticated profile reside under the NEW Hermes user and are distinct from project authority. The four enabled `hermes-*` units are browser/display/VNC services; the deployment installed a CLI and recorded no Hermes gateway daemon. A durable unattended cognitive job service is **UNKNOWN**, not established by those four units.

**ARCHITECTURAL INFERENCE — INFERRED:** 24/7 scheduling on NEW does not make a sleeping/offline workstation available, nor make ChatGPT's UI permanently authenticated. NEW also hosts unrelated GOI consumers, nginx/TLS and schema support; their resource and rollback dependencies constrain this audit but do not become Hermes functions.

## 5. Stable MATERIAL_COMPONENT inventory and capability/overlap matrix

The following **29 IDs define the inventory once**. It counts architectural ownership units, including logical access surfaces and host failure domains; it is not a process, container, model or VPS census. Submodules/profiles are assigned to one unit only. References to the same unit in other matrices do not add rows.

M02 excludes quota selectors (M25) and authorization/review/retry owners (M21–24). M08 owns DEV scheduling supervision and bounds, M09 the OpenCode harness, and M10 only its custom production/transport integrations. M04 includes Hermes's browser tool client; M17 is the actual Chromium/CDP/Xvfb backend; M18 is operator-assist VNC. M27 includes NEW host supervision, private nginx/TLS and shared non-agent consumers; PostgreSQL, n8n and other explicitly numbered services are excluded from that host unit. All Qwen profiles are M11, not separate retirements. GLM and Codex rows are access responsibilities, not additional VPS services.

All current-responsibility claims below are **CURRENT FACT — PROVEN** at their stated scope. Overlap/unique-function interpretation is **ARCHITECTURAL INFERENCE — INFERRED**. A capability labeled unproven is **UNKNOWN**.

| ID / COMPONENT | CURRENT RESPONSIBILITIES / AS-IS OWNER | CAPABILITIES | OVERLAP | UNIQUE FUNCTIONS | DEPENDENCIES | FAILURE DOMAIN | CURRENT EVIDENCE |
|---|---|---|---|---|---|---|---|
| M01 GitHub | Canonical source/backlog/live projection; GitHub + operator | Versioned evidence, issue decisions, remote verification | Agent memories store narrative | Canonical authority and reconstructable state | Git/auth/network | Remote access/write outage | E01–02 |
| M02 Deterministic policy/schema core | NEXT/admission/policy and packet validation; repo code | Mechanical selection, risk/gates, bounded schemas | Agent planning can choose tasks | Reproducible rules independent of model | Canon/policy; M25 | Bad/stale policy or ambiguous input | E11–12, E14 |
| M03 n8n | Scheduled workflows, orchestration and notifications; NEW n8n | WF90 timer, WF40 graph, error normalization | Hermes cron/tools/runtime | Existing publication, execution records and deterministic gates | M26, M19, M08 | Scheduler/process/credential/transport | E01, E05 |
| M04 Hermes | Qualified browser-agent worker; NEW hermes-test | Tool loop, CDP-driven DOM, upstream terminal/session tools | OpenClaw/OpenCode/browser bridges | Proven NEW ChatGPT browser driver | Controller route, M17, M05 | Agent/controller/session loss | E06; upstream-only E20 |
| M05 ChatGPT Web | Human/project cognition; qualified UI round-trip target | Synthesis potential; sentinel/recall proven | GLM/Qwen/Codex cognition | Existing cognitive authoring surface | Account/auth/UI/network, M04 when automated | UI/account/context/quota outage | E01–02, E06 |
| M06 OpenClaw | Preserved broker/fallback assets; operator, VPS staged | Historical broker/auth integration | Hermes and LiteLLM | No currently activated unique VPS duty established | Historic contracts/auth surfaces | Unqualified fallback activation | E01, E03 |
| M07 LiteLLM | Primary remote gateway; NEW private container | Provider/auth transport | Hermes model access routing | Existing canonical remote gateway boundary | Provider auth, M25 | Gateway/provider auth failure | E03, E10 |
| M08 DEV executor/dispatcher | DEV selection/single flight, bounded execution and persistence; Windows | Timebox, path/write guards, receipts, safe FF | Hermes agent execution | Qualified workstation DEV contract and evidence closure | M09, M11, Git/workstation | Hung job, dirty repo, persistence failure | E01, E12–13 |
| M09 OpenCode harness | Tool execution over selected local model; workstation OpenCode | Local implementation/tool loop | Hermes terminal/agent loop | Actual DEV/Qwen execution proof | M11, M08/M10 | Tool protocol/model/harness failure | E01, E13–14 |
| M10 Custom execution integration adapters | n8n bridge/router/OpenCode adapter/Windows endpoint transport | Typed route mapping, readiness, fail-closed admission handoff | Hermes generic adapters | Exact scope/provenance boundary integration | M02, M09, M21–22 | Schema/transport/version mismatch | E14 |
| M11 Qwen local router/backend/profiles | Local inference; workstation router/model-manager/llama | Eligible short-turn and manual long-context bands | Remote cognition/model routes | Local unmetered inference, offline model use | Workstation/GPU, readiness/occupancy | VRAM, latency, worker/router failure | E07, E09 |
| M12 GLM routes | Registered advisor/planner/implementation and Hermes controller | GLM 5.3/Flash shared plan; controller smoke | Other model surfaces | Separate non-Codex provider path | glm_coding_plan/auth/network | Shared pool/provider failure | E06, E08; core live UNKNOWN per E01 |
| M13 Codex external planner | Subscription planner/reasoner surface | Governed external planning route | ChatGPT Web/GLM/Qwen | UI-independent specialist surface, when admitted | Shared Codex pool/auth | Subscription/pool/transport outage | E08, E10 |
| M14 Codex IDE surface | Qualified repository read/TASK DELTA/bounded edit surface | Registry records stale-HEAD refusal and edit/push proof | Cursor/Hermes implementation | Existing qualified IDE access path | IDE/harness + shared Codex pool | IDE/session/quota failure | E08 (`ad3e5cb` evidence), E01 |
| M15 Cursor | Bounded implementation harness; human-dispatched executor | Edit/terminal/test/Git, checkpoint loop | Codex IDE/OpenCode/Hermes | Proven current implementation/persistence workflow | Packet, repo/tools, chosen model | Scope drift/nonconvergence/IDE failure | E01, E11 |
| M16 Bugbot | Code-review/quality surface | Review findings, current CLEAN evidence | LLM reviewer stage | Existing separate review surface | GitHub/PR/access | Review outage or unresolved findings | E01, E11 |
| M17 Chromium/CDP/Xvfb | Authenticated browser backend; NEW hermes-test services | Real UI, DOM/CDP, restart-persistent profile | Other browser backends | Required backend for deployed Hermes path | M27, profile, M04 | Browser crash/profile lock/UI drift | E06 |
| M18 noVNC/x11vnc | Operator login/assist; private NEW service | Human access to same display | Agent browser control | Manual auth/recovery when agent cannot proceed | SSH tunnel/M17 | Assist service/tunnel loss | E06 |
| M19 Tailscale | Private host identity and transport | Restricted NEW→Windows/GOI paths | Public routing would transport too | Tailnet access boundary and current working topology | ACLs/host keys/endpoints | Grant drift/identity loss | E03, E05 |
| M20 Telegram | Human gate and event notification surface | Bound chat/user decisions, STOP notifications | Hermes messaging | Current explicit human decision channel | Bot secret/network/M21 | Spoof/replay/noisy or missed events | E01, E05, E15 |
| M21 Authorization issuance/provenance | Pending decisions, reconcile, ACTIVE→SPENT; Windows service/registry | Direct Telegram validation; issuance state | Generic approval features | Canonical scoped authorization identity and provenance | M20, local state, M22 | Corrupt/missing state or competing writers | E01, E15 |
| M22 Durable spend ledger | Admission-consumed records; Windows endpoint | Ledger-first one-shot consumption | Agent history/usage logs | Fail-closed replay/spend boundary | Disk, M21, M10 | Partial persistence/state loss | E01, E16 |
| M23 Reviewer boundary | Fresh quota/reviewer selection; canonical stage | Candidate selection, quality guard; no inference | Hermes self/peer review | Review-time decision separate from implementation | M25, future execution adapter | Same-model selection or no admitted candidate | E17 |
| M24 Retry/repair boundary | Explicit repair classification and selection | Fresh quota each attempt, allowlist, cap≤3; no live inference | Agent automatic retries | Economic/policy retry admission distinct from tool retries | Explicit retry_policy, M25 | Silent pool reuse/loop if bypassed | E18 |
| M25 Resource registry/quota policy | Model/surface/pool identity and fresh route constraints | Static registry, canonical status composition, T13/T14/T18/T19 | Hermes/provider routing | Shared-pool accounting and deterministic route authority | Collectors/status evidence | Stale/missing quota; identity ambiguity | E01, E08, E17–19 |
| M26 PostgreSQL | Production n8n durable database; NEW container | Workflow/execution persistence | Agent session stores | n8n transactional state and restore chain | Disk/backups/n8n | DB loss/unavailable/sequence mismatch | E01, E03–04 |
| M27 NEW infrastructure | Live host/service supervision/TLS/shared consumers; operator | Private production and browser hosting | Agent runtime deployment | Always-on host plus non-agent workloads | Power/provider/storage/secrets | Shared-host outage/resource contention | E03, E06 |
| M28 OLD rollback host | Frozen retained recovery copy; operator | Preserved DB/config/service state | NEW replicas overlap data | Authorized rollback option until exit gate | Retained storage/TLS/credentials | Stale data/degraded renewal | E03–04 |
| M29 Workstation | GPU, local executors and authorization services; operator | Local/offline inference and implementation | VPS can host generic agents | Actual GPU/local files and qualified execution endpoints | Power/OS/tasks/disk/M19 | Sleep/reboot/disk/GPU outage | E01, E09, E12–16 |

## 6. Authoritative component disposition matrix

All rows are **ARCHITECTURAL RECOMMENDATION — RECOMMENDED**. KEEP_PENDING_PROOF retains the current role (or staged state) and withholds expanded/replacement ownership. MERGE means one maintainable integration package with separately typed interfaces; no execution owner or gate is merged into Hermes. AS-IS ownership/current responsibility is restated compactly so each row is independently reviewable.

| ID / COMPONENT | CURRENT RESPONSIBILITY / AS-IS OWNER | PROPOSED TO-BE OWNER | DISPOSITION | EVIDENCE POINTER | EVIDENCE GRADE | DEPENDENCIES AFFECTED | FAILURE / RECOVERY IMPACT | REASON | PROOF STILL REQUIRED |
|---|---|---|---|---|---|---|---|---|---|
| M01 GitHub | Canon/backlog; GitHub/operator | GitHub/operator | KEEP | E01–02 | RECOMMENDED | All work consumers | Outage stops authority writes; resume from verified remote state | Agent memory cannot own canonical truth | None to retain; remote-write recovery stays mandatory |
| M02 Deterministic policy/schema core | NEXT/gates; repo code | One deterministic core | KEEP | E11–12 | RECOMMENDED | M03/M10/M25 | Conflict/staleness fails closed; repair policy via reviewed commit | Mechanical decisions do not require cognition | Global NEXT automation beyond proven DEV subset requires explicit rules |
| M03 n8n | Schedule/gates; NEW n8n | Existing n8n calling deterministic core | KEEP_PENDING_PROOF | E01/E05 | RECOMMENDED | DB/private dispatch/notifications | Preserve execution history and known restart path | Hermes scheduling overlap lacks deterministic orchestration parity | Publication/dedupe, missed ticks, idempotency, durable recovery, gate/error/notification parity and 24/7 evidence before replacement |
| M04 Hermes | Browser agent; hermes-test | Bounded cognitive worker, restricted capabilities | KEEP_PENDING_PROOF | E06/E20 | RECOMMENDED | Controller/browser/task contract | Failure returns bounded unavailable result; alternate surface | Browser qualified, full cognitive service unqualified | B1/B2; supervised jobs, timeout/cancel/restart, secret isolation and non-browser fallback |
| M05 ChatGPT Web | Human cognition/UI target; account owner | Preferred cognitive author when qualified; no authority | KEEP_PENDING_PROOF | E02/E06 | RECOMMENDED | M04/M25/persisted task | UI/session loss cannot block already-admitted normal work | Task authorship potential exceeds sentinel evidence | B1/B2; real task correctness, rollover, availability and quota identity |
| M06 OpenClaw | Preserved broker; staged VPS | Staged preservation only pending bounded dependency decision | KEEP_PENDING_PROOF | E01/E03 | RECOMMENDED | Historic broker/auth consumers | Do not invoke unqualified fallback; preserve recoverable assets | No unique active duty established, but absence of duty is not retirement proof | Reachable caller/auth dependency inventory, approved alternative recovery, no orphan consumer; no activation here |
| M07 LiteLLM | Primary gateway; private container | Existing canonical remote transport | KEEP_PENDING_PROOF | E03/E10 | RECOMMENDED | GLM/Codex/auth/quota | Gateway outage uses admitted explicit alternative or STOP | Generic Hermes routing does not prove transport/auth parity | OAuth/refresh, pool provenance, error semantics, recovery, observability and consumer parity before removal |
| M08 DEV executor/dispatcher | DEV bounds/queue/persistence; Windows | Existing deterministic DEV supervisor | KEEP_PENDING_PROOF | E01/E12–13 | RECOMMENDED | OpenCode/Qwen/receipts/Git | Preserve timebox and commit recovery; unknown outcome reconciled before retry | Real DEV completion and safety functions exceed generic tool use | Hermes path/timebox/process cleanup, permission/receipt/restart and remote-persistence parity before replacement |
| M09 OpenCode harness | Local tool loop; OpenCode | Current local harness behind bounded executor | KEEP_PENDING_PROOF | E01/E13–14 | RECOMMENDED | Qwen/M08/M10 | Harness failure produces STOP; preserve result/checkpoint | Local execution proof exists; Hermes equivalence absent | Same bounded tasks, Windows process handling, tool protocol/permissions, exact profile selection and recovery parity |
| M10 Custom execution integration adapters | Route/transport glue; repo adapters + endpoint | One typed adapter package under deterministic core ownership | MERGE | E14 | RECOMMENDED | n8n/OpenCode/auth services | Preserve distinct live-incapable bridge and execution endpoint; rollback package revision | Reduce maintenance scattering without changing trust boundaries | Caller inventory, schema/error/side-effect/negative-gate parity; no removal counts until mapped |
| M11 Qwen stack | Local inference; workstation runtime | Local specialist/executor/fallback | KEEP | E07/E09 | RECOMMENDED | OpenCode/occupancy/routing | Workstation loss diverts only to authorized adequate surface | Offline/unmetered capability diversifies provider failures | None to retain; 96K automated admission and exact-output/recovery remain unproven |
| M12 GLM routes | Model/controller access; provider clients | Governed controller/fallback/specialist | KEEP | E06/E08 | RECOMMENDED | Shared GLM pool/Hermes | Controller failure can take down Hermes browser loop; use separate surface | Independent provider access has value | Live core GLM availability/role qualification still required per job |
| M13 Codex external | Subscription planning; external surface | Governed specialist/fallback | KEEP | E08/E10 | RECOMMENDED | Shared Codex pool | Pool exhaustion also affects IDE; no fake independent fallback | Preserve difficult-task planning surface | Fresh admitted status and exact selected-model evidence per job |
| M14 Codex IDE | Qualified repo/TASK DELTA/edit; IDE surface | Specialist implementation/review where qualified | KEEP | E08 | RECOMMENDED | Shared Codex pool/repo | Independent UI path, correlated quota; checkpoint to Git | Actual bounded surface proof | Broader unattended behavior and review independence not implied |
| M15 Cursor | Bounded implementation; Cursor harness | Existing implementation surface | KEEP | E01/E11 | RECOMMENDED | Packets/review/persistence | Nonconvergence checkpoints and gates | No evidence Hermes improves whole implementation/review closure | No retirement parity established |
| M16 Bugbot | Review gate; Bugbot | Existing independent review surface | KEEP | E01/E11 | RECOMMENDED | PR/evidence | Unavailable review remains pending; no silent self-review substitution | Retains external review boundary | Specific job/model independence when required; not universal live automation proof |
| M17 Chromium/CDP/Xvfb | Browser backend; hermes-test units | One dedicated authenticated backend for Hermes | KEEP | E06 | RECOMMENDED | M04/M05/M18 | Restart known profile; re-auth manually if needed | Hermes needs the backend; client/backend are not duplicate bridges | Session isolation and account-loss recovery proof for promotion |
| M18 noVNC/x11vnc | Manual auth/assist; private units | Retained operator recovery access | KEEP | E06 | RECOMMENDED | SSH/browser | Recover login challenges without granting agent more authority | Human assist is distinct from automated browsing | Removal needs proven alternative manual recovery; none established |
| M19 Tailscale | Private topology; tailnet policy | Existing least-privilege private transport | KEEP | E03/E05 | RECOMMENDED | NEW/workstation/shared consumers | Missing grant causes SERVICE_ERROR; diagnose identity/path before workflow edit | #72 demonstrates transport ownership matters | Continued path monitoring, not new public ingress |
| M20 Telegram | Human decisions/alerts; bot + human | Existing identity-bound human gate surface | KEEP | E05/E15 | RECOMMENDED | Auth issuer/n8n | Outage leaves pending gate; replay checked against canonical state | Model messaging cannot become human consent | No alternative approval transport qualified |
| M21 Auth issuance/provenance | Scoped issuance/state; Windows service | Separate deterministic authorization service | KEEP | E15 | RECOMMENDED | Telegram/endpoint/ledger | Ambiguous state denies; reconcile before reissue | Trust boundary must survive worker changes | Multi-process/restore durability gaps C3; no claim of HA |
| M22 Spend ledger | One-shot admission; endpoint/file store | Separate durable admission state owner | KEEP | E16 | RECOMMENDED | M21/M10/disk | Consumed admission never blindly replayed; reconcile unknown outcomes | Agent history is not a spend ledger | Crash/power-loss/backup-restore reconciliation proof C3 |
| M23 Reviewer boundary | Selection; canonical stage | Separate review controller; execution remains gated | KEEP | E17 | RECOMMENDED | M25/reviewer surface | No suitable independent reviewer => pending/gate | Implementation cannot authorize its own acceptance | B3 before required independent automated review |
| M24 Retry boundary | Bounded selection; governed caller | Separate deterministic retry controller | KEEP | E18 | RECOMMENDED | STOP policy/fresh quota | Exhausted/unknown outcome => STOP; no unbounded repairs | Retry cost and authorization differ from model deliberation | Explicit adapter + authorization + post-STOP hook before activation |
| M25 Registry/quota policy | Identity/status/selectors; repo runtime | One route-decision authority | KEEP | E08/E17–19 | RECOMMENDED | Every model/surface/controller | Stale commercial status fails closed; refresh before each stage | Preserve MODEL != SURFACE != POOL | C2 collectors and Web/controller pool attribution |
| M26 PostgreSQL | n8n state; NEW DB | Existing n8n durable store | KEEP | E03–04 | RECOMMENDED | n8n/backups | Restore with sequences/publication checks; single writer | Agent session store cannot replace workflow DB by assertion | Recovery objectives/full restore drill not established here |
| M27 NEW infrastructure | Live host/private TLS/shared consumers; operator | Existing live host with resource isolation | KEEP | E03/E06 | RECOMMENDED | All NEW services | Shared-host outage; bounded restore/authorized rollback | Hosts non-agent functions that Hermes cannot absorb | B2 service/host-recovery qualification for cognition; C5 resource limits |
| M28 OLD rollback host | Frozen retained state; operator | Frozen rollback standby until separate exit decision | KEEP | E03–04 | RECOMMENDED | Rollback/retention/TLS | OLD is stale standby; freeze NEW/reconcile before authorized rollback | Explicit retention and recovery requirement | Human rollback-exit/decommission; no timer grants it |
| M29 Workstation | GPU/execution/auth; operator | Retained local execution and authority-state host | KEEP | E01/E09/E12–16 | RECOMMENDED | Power/GPU/Tailscale/receipts | Offline blocks local jobs; fresh admitted remote fallback or defer | Local/offline work and actual authorization stores remain here | Unattended availability and restore gaps; no cloud substitution assumed |

### Count reconciliation

The disposition matrix above is the sole counting source. Host census, workflows, profiles, responsibilities and phases do not add material components.

```text
MATERIAL_COMPONENT_TOTAL=29
KEEP=21
MERGE=1
REPLACE_WITH_HERMES=0
RETIRE=0
KEEP_PENDING_PROOF=7
DISPOSITION_SUM=29
COUNT_CHECK=29 == 21 + 1 + 0 + 0 + 7
```

## 7. Preferred TO-BE minimal architecture and path ownership

This section is **ARCHITECTURAL RECOMMENDATION — RECOMMENDED** throughout. It is one architecture with explicit admission gates, not a menu of equivalent architectures.

```text
                          GitHub canonical work + policy + evidence
                                           |
                    deterministic core: NEXT / scope / route / gate
                       /                   |                    \
            NORMAL (already bounded)   COGNITIVE DEMAND        EXCEPTION
                       |                   |                    |
                n8n trigger          qualified Hermes      deterministic STOP
                       |              + ChatGPT Web             |
                typed dispatch      or admitted specialist  bounded diagnosis
                       |                   |                 + human if real gate
                       |              candidate TASK DELTA      |
                       |                   v                    |
                       +-------- schema/policy/base validation <-+
                                           |
                             governed executor admission
                         /                 |                  \
                 DEV/OpenCode/Qwen     Cursor/Codex       gated remote route
                         \                 |                  /
                             bounded implementation result
                                           |
                        separate review / separate retry selection
                                           |
                         evidence -> commit -> remote verification
```

Retain one scheduler/orchestration implementation (n8n) calling repository-owned deterministic logic. Use one routing policy authority (M25); LiteLLM translates approved remote requests, adapters translate approved execution requests, and the Qwen router owns backend readiness. These are distinct functions. Hermes consumes approved route decisions for its controller and returns bounded results. Its internal model selection, tools, sessions and retry features must not silently override policy or reissue an externally admitted action.

Use the already-installed Hermes/CDP path for browser cognition; do not deploy a parallel browser bridge or an OpenClaw→Hermes broker chain. Hermes owns browser interaction, Chromium owns the browser process/profile, and noVNC preserves manual recovery. Retain existing specialist access as alternate routes under the same policy, not as serial layers every request traverses.

### NORMAL path

**CURRENT FACT — PROVEN (E12):** `isAdmissible`/`selectNextQueueItem` can select already-authored READY_FOR_PLANNING items with empty human gates, low/medium risk, `cursor` target metadata and no claimed receipt, ordered by risk then FIFO. Dispatcher hygiene, single-flight and safe-FF controls are deterministic. The current DEV bridge translates the queue contract into its bounded local execution envelope; that legacy target field must not be interpreted as permission to invoke any arbitrary executor.

**ARCHITECTURAL INFERENCE — INFERRED:** no LLM is needed to select the next admitted item or transport its known envelope. This does not prove a universal algorithm that derives every strategic NEXT from prose. The current retention NEXT is a policy obligation and human exit boundary, not an instruction to invent an implementation task.

**ARCHITECTURAL RECOMMENDATION — RECOMMENDED:** NORMAL requires all of: authoritative base and active work resolved; exact next transition/target specified by policy; complete bounded envelope; satisfied authorization; fresh admitted resource state; no conflicting evidence or open result-ingestion anchor. If any condition fails, return NEEDS_COGNITION, DEFER, HUMAN_GATE or STOP with evidence. Do not ask an LLM to guess an absent rule and call it deterministic.

### COGNITIVE path

**ARCHITECTURAL RECOMMENDATION — RECOMMENDED:** invoke cognition for synthesis, plans, new acceptance criteria, TASK DELTA generation, architecture and interpretation. After B1/B2 qualification, ChatGPT Web through Hermes becomes the preferred author for demands it satisfies. Until then, current human/GPT-Web authoring and already-qualified specialist surfaces retain the work. This is a guarded route transition inside the same architecture, not a declaration that primary automation is live.

The controller used by Hermes and the model answering in ChatGPT Web are different inference actors. Persist both identities where observable, both access surfaces, both quota observations, elapsed time, retries and answer provenance. A cheap controller navigating an expensive cognitive model is not a one-model request.

### EXCEPTION path

**ARCHITECTURAL RECOMMENDATION — RECOMMENDED:** deterministic code owns STOP and dispatch suspension; cognition owns diagnosis; the operator owns unresolved strategy/scope choices and real authorization. Conflicting canon, uncertain outcomes, non-deterministic remediation and unresolved cognitive gates go to a bounded evidence packet. GPT Web/Hermes may propose a resolution but cannot turn that proposal into approval. Use a governed independent surface if the browser is stale or unavailable. Preserve the README `prompt N → agg → result summary → prompt N+1` barrier where a Cursor anchor is open.

**CURRENT FACT — PROVEN (E13, E17):** the CLI runner's `main()` attaches review metadata, whereas the scheduled dispatcher calls the executor path directly. Do not claim every scheduled DEV execution automatically runs the review stage. Even attached review metadata represents selection, not completed reviewer inference.

## 8. Route policy: demand first, model/surface/pool kept separate

This proposed policy is **ARCHITECTURAL RECOMMENDATION — RECOMMENDED**. Current restrictions in E01/E08–E10/E17–E19 remain controlling; this report does not enable an alternative fallback through the closed D-0025 gate.

Represent a demand as role, scope, risk, expected input/output context, minimum quality/reasoning class, vision/tools, deadline, offline need, local-data constraints, availability requirement, review independence and bounded retry budget. Apply hard eligibility before ranking:

1. Verify canonical scope, exact role authorization and permitted surface/authentication. Never infer authorization from a model name or a successful smoke.
2. Require task-adequate quality, reasoning, context, tool and vision evidence. UNKNOWN cannot satisfy a mandatory capability. Include completion headroom and controller/tool overhead in context admission.
3. Resolve model/profile → access surface → quota pool. Resolve controller and answer-model legs separately. Reject ambiguous pool identity for unattended spend-sensitive work.
4. Read fresh surface availability, resource readiness/occupancy and quota. Missing/stale commercial observations fail closed under current policy; a manual bounded observation may serve only within its explicit validity. Local unmetered inference still consumes time, energy, GPU capacity and operator availability.
5. Enforce task-required review independence using actual model/instance provenance. A different UI or process name alone proves neither independent review nor a separate quota pool. If required independence cannot be proved, gate.
6. Rank eligible adequate routes using observed quality/reasoning fitness, reliability, deadline-compatible latency, expected total tokens/quota usage, scarcity/reserve and retry economics. Persist why the selected route won. No invented universal quality ranking or weighted cost coefficients.
7. Recompute at planning, execution, review and every governed retry. Switching CLI→IDE inside an exhausted pool is not fallback capacity. No silent quality downgrade, hidden provider retry or unauthorized fallback.

| Surface / model family | CURRENT FACT — PROVEN | Recommended admission/use and limits |
|---|---|---|
| Hermes → ChatGPT Web | E06 proves browser round trips; E08 does not define ChatGPT Web's exact pool | Preferred cognitive author only after B1/B2. UI latency, context health and account availability are observed per job. Do not label Web free, unlimited or quota-independent of Codex. |
| Hermes controller → GLM 5.3 Flash | NEW controller auth/inference smoke PASS; not core GLM execution qualification | Admit controller capability/quota separately. A GLM outage can prevent Hermes driving an otherwise-healthy ChatGPT session. |
| GLM 5.3 / Flash, including Cursor GLM access | `glm_coding_plan` shared pool; current core GLM live state UNKNOWN/BLOCKED_EVIDENCE | Governed planner/implementation/controller roles when admitted; no GLM reviewer role currently registered. Model label alone does not prove Flash lower total cost or sufficient quality. |
| Codex external planner + Codex IDE | Shared `chatgpt_codex_subscription`; subscription only; no OpenAI API/BYOK; dynamic model selection | Keep planner/high-difficulty/implementation specialists. IDE repo-read, stale-HEAD rejection and bounded edit+push are qualified; TASK DELTA evidence is PASS_WITH_ORCHESTRATOR_LEANING, not universal autonomous orchestration. Observe actual model/effort and quota. |
| Cursor native | Harness; native allowance unverified | Keep qualified implementation. Do not invent an included quota pool or equate GLM BYOK with Cursor allowance. |
| Qwen eligible production profiles | Six eligible profiles; exact route `:8080`; OPUS agent24K selected scope-v3; production execution currently closed | Short-turn qualified roles only after authorization. DCFR short-turn UNQUALIFIED; throughput/long-task qualification is separate. Runtime router owns backend flags, loading and occupancy. |
| Qwen DEV OpenCode24K | Complete DEV execution PASS; workstation manual profile, separate from production agent24K | Default proven DEV profile under current bounds; no promotion to production automatic eligibility. |
| Qwen DEV OpenCode64K | Live/manual smoke and 50,906-token marker retrieval evidence; exact-output compliance unproven | Explicit high-context local work when readiness, timebox and output validation fit. It is not automatically a better short-turn choice. |
| Qwen Blender96K | E07 valid V2 three-cycle ~67–70K-token semantic/health PASS; workstation-only | Explicit manual long-context specialist potential; no automatic CP routing. 98,304 configured context is not evidence every full-window task is safe. Do not reuse a transient worker port as a production route. |

**CURRENT FACT — PROVEN (E02/E07):** the 96K V1 oversize attempt does not count as failure; valid V2 carries the endurance result. The earlier 898-second HTTP500 has no established persistent proxy/model root cause. The model-manager ORION pass was almost fully cached and cannot be used as an uncached speed comparison. Exact-output compliance, leak absence and restart/reload persistence remain unproven. These limits preserve the successful semantic evidence.

**CURRENT FACT — PROVEN (E01/E09):** frontier records nine router-visible profiles while the catalog overlay has an older eight-profile projection. The routing invariant is the explicit six-profile eligibility subset, not a guessed full catalog count. No eligibility is granted by that drift.

**ARCHITECTURAL RECOMMENDATION — RECOMMENDED:** total expected route cost includes Hermes controller tokens, ChatGPT answer quota, tool/DOM payloads, failed attempts and wall time. The #61 body records historical GLM→Hermes proof at 112,835 tokens/10 calls/~12 minutes and Qwen→Hermes proof at 323,771 tokens/12 calls/~37 minutes. These are observations of different runs, not a controlled quality/cost ranking. Use them only to reject the assumption that an unmetered local controller is operationally costless. Do not create a benchmark campaign to fill missing route scores in this audit.

## 9. ChatGPT Web / Hermes context and session lifecycle

**CURRENT FACT — PROVEN (E01/E06):** the repository already defines ephemeral chat, lean CORE BOOT, bounded handoff and a historical ceiling of 20 user prompts. Hermes created/drove one fresh ChatGPT conversation, recalled a marker after eight fillers, and retained authentication across Chromium restart. None of that proves autonomous rollover preserving canonical TASK DELTA/NEXT.

The lifecycle below is **ARCHITECTURAL RECOMMENDATION — RECOMMENDED**. Hermes agent session, browser process/profile and ChatGPT conversation are three different lifecycles. Restarting Hermes or Chromium does not necessarily create a fresh ChatGPT conversation. A Hermes memory search or provider-context compaction does not satisfy CORE BOOT.

### Admission and proactive triggers

- Persist a small non-secret session record: task/dispatch anchor, canonical SHA, conversation locator or opaque identifier, session generation, last accepted artifact, prompt count, last successful validation and in-flight action status. GitHub owns work checkpoints; an operational browser lease/cache may be local and reconstructable. Never persist cookies, bearer tokens or transcripts as handoff.
- Proposed initial rollover threshold: before prompt 16, leaving recovery room below the existing 20-prompt ceiling. This is an operational starting policy, not a measured ChatGPT context capacity. Permit a lower task-specific budget.
- Rollover earlier when one response contradicts canonical HEAD/gate, schema validation fails twice on the same bounded demand, the UI signals context trouble, answer provenance cannot be tied to the active generation, or canonical changes invalidate the supplied scope. Refresh/reject stale output immediately; rollover cannot excuse dispatching it.
- If observable context usage reaches 70% of a verified surface limit, propose early rollover; if usage/limit is unavailable, use prompt/payload budgets and correctness checks without inventing token telemetry. Deadlines and controller/model budgets are explicit per job, not inferred from nominal context size.

### Persistence-before-rollover sequence

```text
Chat N / generation g receives canonical SHA h + active work
    -> finish or cancel bounded cognitive work; mark any send/outcome ambiguity
    -> compare proposed new facts with GitHub
    -> if genuine missing fact exists: persist only bounded delta/checkpoint
    -> commit/push/verify that delta before claiming it durable
    -> close g for dispatch; retain old chat as non-authoritative history
    -> create fresh Chat N+1 / generation g+1 in the same dedicated profile
    -> verify fresh conversation identity and absence of old transcript seed
    -> CORE BOOT: remote HEAD + README AI-BOOT + frontier + ACTIVE WORK only
    -> derive same canonical state/NEXT (or explain an observed newer delta)
    -> deterministic validator compares base/task/target/gates before dispatch
```

A bounded UNPERSISTED DELTA is justified only for genuinely new facts missing from all canonical pointers: exact task, observed outcome, evidence pointer, unresolved question and required next decision. Persist it first where possible. If GitHub persistence is unavailable, save a bounded local recovery artifact and STOP dependent dispatch; a new chat may diagnose using an explicitly unpersisted delta but cannot treat it as canonical or remotely persisted. Ordinary rollover receives no transcript and no redundant delta.

Stale-chat isolation requires a single writer lease for the browser task and a generation fence on every returned artifact. Reject output from generation g after g+1 is admitted, even if syntactically valid. Never replay an uncertain UI send automatically: inspect the current conversation/job record and reconcile whether the send completed. Task ID/base SHA/artifact digest provide application-level dedupe; Hermes session history alone is insufficient.

### Required conceptual proof and bounded future acceptance

**ARCHITECTURAL INFERENCE — INFERRED:** if the prior chat contributes no authority and all genuine missing state is remotely persisted, a fresh chat with the same canonical inputs can derive the same policy-determined NEXT without old-chat memory. Semantic generation may vary; the accepted target/base/gate/scope must not.

**CURRENT FACT — UNKNOWN:** the end-to-end proof has not been demonstrated in canon. A future bounded qualification must use one real low-risk TASK DELTA and its persisted state, rotate a fresh conversation, run CORE BOOT, and compare canonical SHA/task/NEXT/target/gate. Include a stale-response rejection and context-loss resume using existing artifacts, not a large filler benchmark. If main advances during the exercise, record and ingest the delta before comparing; do not force an obsolete NEXT.

Hermes can plausibly perform the required UI interactions because a fresh conversation and authenticated browser control were demonstrated (E06); autonomous safe rotation remains an inference until generation fences, persistence and recovery are proved on the deployed version. Upstream browser/session features in E20 do not establish these Control Plane invariants.

### Minimum redundancy

Maintain one qualified cognitive surface independent of the NEW browser host/UI, such as admitted Codex external/IDE or direct GLM, plus local Qwen where adequate. These are candidate failover surfaces subject to current closed gates and per-job authorization. Preserve manual GPT Web and noVNC for operator recovery. Two surfaces sharing a quota pool are one capacity failure domain. A direct GLM route may bypass the browser but still share Hermes's controller-provider failure. When all adequate routes are unavailable, persist/defer or gate; do not downgrade silently. Deterministic admitted normal work can continue only if its own execution/auth/resource dependencies remain satisfied.

## 10. Security and trust boundaries

In this table, owner/exposure entries are **CURRENT FACT — PROVEN** where cited; unknown inspection scope is explicit. Failure/SPoF analysis is **ARCHITECTURAL INFERENCE — INFERRED**. Least privilege and recovery prescriptions are **ARCHITECTURAL RECOMMENDATION — RECOMMENDED**, except the bounded restart/reconciliation capabilities explicitly called proven. No credentials, cookies, environment secrets or private-key contents were read for this audit.

| BOUNDARY | CREDENTIAL / STATE OWNER | EXPOSURE / CURRENT EVIDENCE | LEAST PRIVILEGE | FAILURE IMPACT | RECOVERY METHOD | SINGLE-POINT RISK |
|---|---|---|---|---|---|---|
| GitHub | Operator/service Git identities; canonical repo/issues | Remote authenticated service; exact token scopes UNKNOWN (E01) | Purpose-scoped read/write identities; model text cannot authorize writes | Loss/corruption of canonical access | Restore access; fetch verified main and reconcile task evidence | Authority service/account dependency; local cache cannot authorize new state |
| NEW VPS | Host operator/root; service users and persistent disks | Live public host identity; private service listeners (E03) | Dedicated service users; restrict SSH/admin and resource budgets | Shared loss of n8n/DB/gateway/browser and GOI | Restore verified artifacts/state or separately authorize rollback | Major shared host/storage failure domain |
| OLD host | Operator; frozen DB/config/credentials | OLD n8n stopped; retained TLS/GOI/DB (E03) | No audit mutation; preserve retention and access restriction | Loss of rollback option or stale restoration | Separate human rollback procedure with NEW freeze/data reconciliation | Standby, not automatic HA; same operator/provider dependencies may correlate |
| Workstation | Operator Windows identity; local tasks/GPU/auth files | Loopback 18791/18792/18793 behind private routes (E01) | Service-local state paths, narrow ingress, qualified process permissions | Local execution and authorization unavailable | Restore service/task/state; reconcile claims/spend before resuming | Single local power/OS/storage domain |
| Hermes runtime | `hermes-test`; agent config/session cache/controller credentials | CLI + authenticated browser tool access (E06) | Limit toolsets and filesystem/egress per demand; no auth-ledger write or n8n admin custody | Tool misuse, prompt injection, controller failure | Cancel job; quarantine output; restart bounded worker; admitted alternate surface | Coupled to controller/provider/browser; not owner of control authority |
| Authenticated browser profile | `hermes-test`, account owner | Dedicated `/home/hermes-test/.hermes/chatgpt-chrome-profile`; no OLD-cookie transfer (E06) | One dedicated profile/account context, no unrelated privileged sessions; verify ACLs separately | Profile compromise grants account-session capability | Revoke session/re-auth manually; fresh profile if compromised | Profile and host user are concentrated credential custody |
| ChatGPT Web conversation | Account owner; service-held chat, ephemeral project cache | Authenticated UI accessed through profile (E06) | Bounded task/read set, no secrets or authorization authority | Stale state, UI failure, context/session loss | Persisted checkpoint + new conversation + CORE BOOT | UI/account/quota availability; keep alternate cognitive route |
| CDP | Chromium under hermes-test | `127.0.0.1:9222`; public probe refused; sandbox enabled (E06) | Loopback only, trusted local callers; never public | Browser/account control if local client compromised | Stop/restart browser, revoke affected sessions and inspect integrity | Loopback does not protect against privileged local process |
| noVNC / x11vnc | Operator + hermes-test; secret custody local | Loopback 6080/5900, IPv6 loopback VNC; operator SSH tunnel (E06) | Private temporary operator access; no public proxy | Screen/input exposure or lost recovery access | Re-establish private tunnel/service; manual login | Necessary operator-assist route, not independent browser backend |
| Tailscale | Tailnet admin/policy and node identities | NEW no routes/exit/Serve/Funnel; exact NEW→Windows443 grant (E03/E05) | Specific source/destination/port; no broad replacement ACL | #72-type false service failures despite healthy endpoints | Inspect effective source-container→endpoint path and grants under a separate bounded task | Tailnet policy/control plus host identity dependency |
| n8n | Workflow credential store + PostgreSQL; operator | `127.0.0.1:5678`; exact publication map (E03) | Preserve existing credentials and bounded workflow authority | Bad publication/gate/credential compromises automation | Restore DB/config/publication map; reconcile executions before resume | Shared NEW/DB; replacing with agent memory worsens recovery |
| PostgreSQL | n8n DB service/host operator | 16.15 container, host port unpublished (E03) | Dedicated DB access; backup credentials separate from agents | Workflow/execution state loss | Restore matching snapshot, sequences and publication state; verify single writer | Single DB/disk until independently proven recovery; RTO/RPO UNKNOWN |
| LiteLLM | Gateway/provider auth stores; operator | 1.98.0 unpublished container (E03/E10) | Only approved clients/aliases; keep secrets out of prompts | Credential, response normalization or route compromise | Restore approved config/auth; explicit admitted alternative or STOP | Gateway and provider auth domain; sibling-container access still matters |
| Telegram | Bot credential owner, configured human chat/user | Notification binding preserved; issuer checks chat AND user (E05/E15) | Validate direct decision identity/pending record/expiry; no pasted model approval | Missed/forged decisions or notification storm | Keep pending closed; reconcile update/decision; recover bot access | Human-gate transport dependency; downtime cannot grant approval |
| Model/provider credentials | Per-surface service/account owner | Registry constrains access; exact live ACL/rotation stores UNKNOWN (E08) | Subscription/API distinctions; no forbidden OpenAI API/BYOK; redacted telemetry | Pool/account theft, unauthorized calls | Revoke/rotate via approved custody, requalify affected route | Shared account/pool can correlate seemingly separate surfaces |
| Authorization/provenance | Windows issuer; fixed server-local files | Register-pending/status only; no HTTP issue/approve; ACTIVE=0 (E15) | One mutation owner; caller cannot choose store path; never put credentials in Git | Invalid/missing approvals or competing writers | Reconcile persisted pending/provenance; deny uncertain state | Per-process single writer, not proven distributed/HA authority |
| Durable spend state | Windows endpoint/server-owned ledger | Ledger before registry before adapter (E14/E16) | Monotonic consumed state, separate from model memory | Duplicate side effect if restored incorrectly; consumed-but-no-execution possible | Reconcile outcome; never unspend or blindly replay; authorize a new bounded attempt if appropriate | Local disk loss/cross-store crash window; monotonic restore proof absent |

**CURRENT FACT — PROVEN (E13):** DEV permission overlay restricts bash/edit and denies webfetch/websearch, but `network_policy` is metadata and read tools are not restricted by that overlay. Do not call it an OS-enforced read/egress sandbox. **ARCHITECTURAL RECOMMENDATION — RECOMMENDED:** preserve these controls and qualify stronger isolation before expanding untrusted-browser-driven terminal work.

**CURRENT FACT — PROVEN (E15–E16):** authorization stores use same-directory temporary writes and rename; coordination is per-process and no explicit fsync is shown. Ledger success followed by registry failure consumes admission without running the adapter. **CURRENT FACT — UNKNOWN:** cross-process locking, power-loss durability and monotonic backup restoration. Keep them as C3, not a fabricated present failure. Never reconstruct spent state from chat or GitHub's public evidence projection.

## 11. Ordered bounded migration / consolidation plan

Every phase below is **ARCHITECTURAL RECOMMENDATION — RECOMMENDED** and **AUDIT ONLY: DO NOT IMPLEMENT NOW**. Acceptance refers to a future separately governed task, not tests executed in this audit. Preserve historical evidence and the closed production gates throughout qualification.

| PHASE / OBJECTIVE | PRECONDITIONS | CHANGE | ACCEPTANCE | ROLLBACK | HUMAN GATE | DEPENDENCIES | DO_NOT_IMPLEMENT_YET |
|---|---|---|---|---|---|---|---|
| P0 — Freeze ownership contract | Audit remote-verified; current canon reread | Approve this responsibility map and bounded follow-on backlog; record acceptance without changing live claims | No responsibility has two authorities; owners recognize UNKNOWN/pending proofs; report counts remain distinct from service census | Revert only new design/backlog artifacts if rejected | Strategic acceptance for new architecture; no runtime authorization implied | M01/E01 | No frontier promotion, config or service edits |
| P1 — Qualify cognitive TASK DELTA | P0; closed gates preserved; one real low-risk task and current human baseline available | Shadow Hermes→Web authoring using lean canonical inputs; add deterministic candidate validation | Exact base/task/target/scope/hard walls/acceptance/STOP/persistence fields; no stale-history override or self-authorization; compare semantic correctness with current baseline; rejected output never dispatches | Discard candidate; retain original authoring surface; preserve diagnostic evidence | Separately scoped inference/UI task; existing standing authorization applies where explicitly sufficient | M02/M04/M05/M25; B1 | No primary-route switch or benchmark campaign |
| P2 — Prove lifecycle and unattended recovery | P1; non-secret session job contract; operator recovery path | One bounded fresh-chat rollover/context-loss exercise; supervised worker cancellation/restart/availability observation | Chat N→persist→Chat N+1→CORE BOOT derives same canonical NEXT; stale generation rejected; ambiguous send reconciled; loss of browser/controller returns bounded unavailable; agreed availability window and recovery objective measured | Stop cognitive worker, retain private browser/operator access and existing specialists | Separate bounded service/credential task where needed; manual login remains human | M17/M18/M27/M25; B2 | No claim of 24/7 from 30 minutes; no OLD-cookie transfer or public CDP |
| P3 — Promote bounded cognition | P1/P2 PASS; adequate independent fallback admitted; Web/controller pool attribution resolved for authorized use | Enable preferred Hermes/Web only for qualified cognitive demands, through existing deterministic dispatch | Normal no-LLM path unchanged; fresh quota and mandatory role/capability constraints; failed Web route degrades to admitted equivalent or STOP; authority never depends on chat | Disable only new cognitive selector entry; restore previous authoring surface | Explicit route-promotion decision; current D-0025 stays closed unless separately authorized | M02/M25; B1/B2/C2 | No unconditional Hermes orchestration or new parallel gateway |
| P4 — Consolidate adapter packaging | Caller map bounded and complete for M10; authority boundaries documented | Group typed transport adapters under one maintenance package, retaining separate interfaces and existing delegates | Schema/error/side-effect/negative-admission parity; no duplicated route selection; live-incapable bridge stays incapable; DEV and production stay separate | Restore prior package/import paths and compatibility entrypoints | Separately bounded code task; deployment remains separately governed | M08–10/M21–22 | No wrapper deletion count until callers migrated; no endpoint/auth semantic change |
| P5 — Decide deferred component retirement | P3/P4 where relevant; component-specific parity evidence across all nine required dimensions | For one pending component at a time, decide KEEP or a new justified replacement/retirement proposal | Capability, governance, reliability, recovery, security, persistence, observability, required availability and maintainability preserved; no unowned consumer; demonstrable total-complexity benefit | Keep/reinstate existing component/config/data until post-change acceptance | Explicit component retirement/activation decision; OpenClaw remains inactive meanwhile | M03/M06/M07/M08/M09; component proof fields | No presumption Hermes wins; no artificial proof campaign or destructive cleanup |
| P6 — Qualify independent review / repair execution only if needed | Explicit demand; existing selection boundary retained; concrete identity and authorization contract | Add required independent-review rejection and separately authorized reviewer/repair executor integration | Required independent model/instance proven; same-model-only produces gate; fresh quota each attempt; cap/allowlist honored; uncertain prior outcomes not replayed | Keep selection-only stages and remove new execution hook | Separate reviewer/retry execution authorization; B3 | M23–25/M21–22 | No automatic post-STOP activation or authorization minted by review |
| P7 — OLD retention exit (independent of consolidation) | Real NEW usage/parity/recovery evidence and explicit exit criteria reviewed | Separate decision on retention exit and possible decommission | Human authorizes exact scope; current recovery obligations addressed; expiry alone never enough | Retain OLD frozen until decision; any rollback follows separate single-writer/data reconciliation procedure | Mandatory rollback-exit and decommission authorization; currently absent | M27/M28/E03–04 | Do not mutate OLD, change DNS/nginx/Tailscale, or run decommission here |

The phase order does not require delaying useful deterministic work until Hermes qualifies. P6 and P7 are independent gated responsibilities, not automatic consequences of P3. If any qualification fails, preserve its bounded evidence and stop that promotion; the retained architecture remains usable.

## 12. Quantified reduction and maintenance economics

**CURRENT FACT — PROVEN:** audit implementation change count is zero. The M01–M29 disposition matrix is a logical inventory, not the F03 migration census or a daemon list. M10 has one MERGE recommendation; it does not prove any file, workflow, process or credential can yet be deleted. M06 is staged/inactive, so hypothetical OpenClaw removal cannot count as retiring an active service.

| Metric | Supported quantity | Grade / interpretation |
|---|---|---|
| Material components retired | 0 | RECOMMENDED disposition count; none implemented |
| Components replaced with Hermes | 0 | RECOMMENDED disposition count; none implemented |
| Material integration packages proposed for MERGE | 1 (M10) | RECOMMENDED; interface/owner consolidation, not service deletion |
| Live services retired / runtime service-count reduction | 0 now; future total UNKNOWN | PROVEN no mutation; no defensible future service census |
| Physical wrappers removed | 0 now; future number UNKNOWN | PROVEN no code removal; caller and parity mapping still required |
| Workflows simplified | 0 now; future number UNKNOWN | PROVEN no workflow changes; 4 published workflows and WF40's 83 nodes are not removable-overlap counts |
| Duplicate algorithmic routes eliminated | 0 proven | UNKNOWN whether inspected delegation glue contains independently duplicated algorithms; do not count routing layers as duplicates by name |
| Custom glue-code classes removed | 0 now; future number UNKNOWN | RECOMMENDED packaging retains schema/transport/admission classes until proven unnecessary |
| Credential/trust boundaries removed | 0 | RECOMMENDED retain separation; no consolidation savings invented |
| Maintenance surfaces reduced | No measured present reduction; one proposed package boundary | RECOMMENDED bounded packaging objective; less scattering must be demonstrated in P4 |
| Additional unconditional scheduler / policy router / canonical state store | 0 proposed | RECOMMENDED avoidance of adding overlapping authorities, not subtraction from AS-IS |

**ARCHITECTURAL INFERENCE — INFERRED:** avoiding a second scheduler/router/state owner is a total-complexity benefit even when no service is retired. It avoids bidirectional state reconciliation and policy divergence. An adapter package may reduce change coordination, but preserving multiple typed interfaces can remain necessary. No percentage, financial saving, token reduction or reliability uplift is claimed without workload/cost evidence.

The separate F03 inventory remains 34 entries (32 validated/2 obsolete); the VPS registry has 21 rows (20/1). Neither count is used in this audit's dispositions or service-reduction arithmetic. Four named browser units and three core containers are evidenced; they are not the complete host service census and are not added to the 29 material units.

## 13. Risks and open evidence

Blocker counts below concern the named **future activation or claim**, not completion of this audit, current DEV operation or rollback retention. The evidence gaps are deliberately bounded; an audit can pass while recommending that unqualified changes remain closed.

### BLOCKER — three

| ID | Grade | Blocked decision | Exact missing proof / bounded resolution |
|---|---|---|---|
| B1 | UNKNOWN | Promote Hermes/Web to autonomous primary TASK DELTA generation | One real canonical task → bounded candidate with correct base/target/scope/hard walls/acceptance/STOP and no self-authorization; deterministic rejection plus comparison against current authoring baseline. Sentinel/marker recall does not establish this. P1. |
| B2 | UNKNOWN | Depend on Hermes/Web as a recoverable unattended cognitive service | Persistent job identity, fresh-chat CORE BOOT equality, stale-generation fence, ambiguous-send recovery, restart/cancel path, admitted independent fallback and availability window matching the requirement. Existing 30-minute soak is insufficient for a 24/7 claim. P2. |
| B3 | UNKNOWN | Claim required independent automated review or activate governed reviewer/repair execution | Concrete reviewer model/instance provenance and fail-closed independence when required; execution adapter, downstream policy consumption and separate authorization; explicit retry hook only for allowed STOP/policy. Current stages select only and can admit same-model review. P6. |

### NONBLOCKING_CAVEAT — seven

| ID | Grade | Caveat / practical handling |
|---|---|---|
| C1 | PROVEN | Qwen semantic/endurance PASS has exact-output, long-run memory/reload and context-band limits. Validate structured output; retain 96K manual-only scope. No model-failure claim from invalid V1. |
| C2 | PROVEN | Registry is static; live commercial collectors absent and ChatGPT Web pool relation unrepresented. Fail closed or use explicitly valid bounded observations; per-job pool attribution is mandatory before unattended promotion. This does not invalidate existing deterministic selectors. |
| C3 | PROVEN | Auth writes use temp+rename and per-process serialization; cross-process/power-loss/monotonic restore parity is not established. Keep one owner and fail closed; expanding concurrency or custody requires separate proof. |
| C4 | PROVEN | DEV permission overlay is not complete filesystem-read/OS-egress confinement. Preserve bounds; do not grant the browser worker broad terminal/secret access on an assumed sandbox. |
| C5 | PROVEN | NEW and workstation are shared availability/resource domains. Headroom and short soak are bounded; workstation 24/7 uptime and a full-host recovery SLA are unproven. Defer local work when offline. |
| C6 | PROVEN | OLD TLS renewal helper remains degraded (`203/EXEC`); current certificate valid until `2026-11-15T23:56:47Z`. Retention has no expiry. Surface this in the separate retention decision; no repair/decommission authorized here. |
| C7 | PROVEN | Historical metadata drift and bounded VPS caveats persist: overlay catalog count vs frontier, old chat/NEXT labels, historical pruning attribution PLAUSIBLE_NOT_PROVEN, second-device GIS test deferred. Supersession is explicit; none reopens cutover or changes model eligibility. |

### UNKNOWN — four bounded questions

| ID | Grade | Question left bounded |
|---|---|---|
| U1 | UNKNOWN | Which current upstream Hermes terminal/session/routing features behave identically in pinned `3ac671db` and preserve every Control Plane boundary? Upstream docs are capability context, not parity proof. |
| U2 | UNKNOWN | Exact live credential ACLs, token scopes, rotation/revocation and secret-backup custody across all services. Secret inspection was unnecessary for this architecture decision. |
| U3 | UNKNOWN | Quantified RTO/RPO, full-host disaster recovery and authorization-store restoration under real loss. Do not claim automatic failover or exactly-once effects. |
| U4 | UNKNOWN | Complete bounded caller/dependency census and physical deletion opportunities for M10/OpenClaw/LiteLLM. No repository-wide proof campaign was justified; KEEP_PENDING_PROOF and gated packaging cover the uncertainty. |

### FUTURE_OPTIMIZATION — three

| ID | Grade | Optional future work |
|---|---|---|
| F1 | RECOMMENDED | Collect real-job end-to-end controller/answer/tool token, latency and retry measurements to improve route ranking. Do not create synthetic campaigns by default. |
| F2 | RECOMMENDED | Evaluate stronger service/resource separation, authorization durability and recovery objectives when actual availability requirements justify the maintenance cost. |
| F3 | RECOMMENDED | Consider on-demand operator-assist services or reduced wrapper compatibility entrypoints only after proven recovery/caller parity. No savings credited now. |

```text
OPEN_BLOCKERS=3
NONBLOCKING_CAVEATS=7
UNKNOWN_ITEMS=4
FUTURE_OPTIMIZATIONS=3
AUDIT_COMPLETION_BLOCKERS=0 (subject to remote persistence verification)
```

## 14. Responsibility ownership matrix

Every TO-BE mapping is **ARCHITECTURAL RECOMMENDATION — RECOMMENDED**. AS-IS ownership is supported by the evidence pointers in the final column; its narrower current qualification remains binding. Fallback entries are prescribed candidates, never permission to execute through a closed gate. Persistent state owners are deliberately separate from execution surfaces.

| RESPONSIBILITY | AS_IS_OWNER | TO_BE_OWNER | CONTROL_AUTHORITY | EXECUTION_SURFACE | FALLBACK | PERSISTENT_STATE_OWNER | FAILURE_MODE | RECOVERY_PATH | EVIDENCE_GRADE / POINTER |
|---|---|---|---|---|---|---|---|---|---|
| Live-state authority | GitHub/frontier | GitHub/frontier | Canonical remote + operator | Git/API read and selective verified writes | Cached read for diagnosis only | GitHub | Stale/unavailable canon | Refresh exact remote; ingest relevant delta | RECOMMENDED; E01–02 |
| NEXT derivation | Frontier author + bounded DEV selector | Deterministic core where rules complete; cognition for absent rules | Repo policy/active work | Selector and validators | Bounded interpretation/human gate | GitHub work/policy; local claims | Ambiguous or stale transition | STOP, reconcile source precedence and task anchor | RECOMMENDED; E01/E12 |
| Normal-path orchestration | n8n + dispatcher | Same deterministic owners | Repo policy and explicit authorization | n8n→typed endpoint | Deferred work; authorized manual bounded dispatch | PostgreSQL + local receipts + GitHub evidence | Missed tick/duplicate/dirty repo | Reconcile receipts/outcome and resume exact task | RECOMMENDED; E05/E12 |
| Cognitive orchestration | Human/GPT Web; specialist planners | Bounded Hermes/Web worker after qualification | Deterministic demand/route contract | Hermes + ChatGPT UI | Admitted direct Codex/GLM/Qwen specialist | GitHub task/checkpoint; session cache disposable | Browser/controller/model unavailable | Preserve demand, reroute only to adequate admitted surface | RECOMMENDED; E02/E06/E08 |
| Exception orchestration | GPT Web/operator and STOP code | STOP in deterministic core; diagnosis in cognitive worker; human decides unresolved authority | Repo/explicit operator decision | Bounded evidence packet and gate | Alternate cognitive surface/operator | GitHub + pending decision store | Conflict/scope drift/unknown outcome | Resolve canonical conflict, persist decision before dispatch | RECOMMENDED; E01/E11/E15 |
| TASK DELTA generation | Human/GPT Web; bounded Codex IDE proof | Preferred qualified Hermes/Web author | Schema/policy/base validator | Browser cognitive answer | Current authoring + admitted specialist | GitHub packet/checkpoint | Wrong target/stale base/self-authorization | Reject, bounded repair or gate; never auto-dispatch invalid output | RECOMMENDED; E02/E08/E11 |
| Deterministic dispatch | n8n/DEV dispatcher/bridges | Same control core + typed adapter package | Exact envelope and gate | n8n/private transport | STOP/defer, not guessed target | Claims/receipts and execution evidence | Race/schema drift/transport error | Reconcile single-flight/receipt before resend | RECOMMENDED; E12/E14 |
| Implementation | Cursor, DEV OpenCode/Qwen, qualified Codex IDE | Same specialists | Bounded packet/paths/budget | Selected existing harness | Equivalent admitted harness or checkpoint | Git branch/evidence, task result | Scope drift/nonconvergence | Timebox STOP/checkpoint; reviewed repair only | RECOMMENDED; E01/E08/E13 |
| Local execution | Windows DEV and production endpoints | Separate existing DEV/production owners | DEV envelope vs production provenance; not interchangeable | OpenCode/Qwen/workstation tools | Deferred local job or authorized equivalent | Local receipt/spend state + Git evidence | Sleep/process hang/GPU failure | Readiness check, cleanup, reconcile outcome before new admission | RECOMMENDED; E09/E12–16 |
| Remote execution | n8n remote assets behind gate; operator tools for authorized host work | Existing gated remote surfaces | D-0025/packet-specific authority | LiteLLM/provider or explicitly scoped terminal | Gate/manual authorized recovery | GitHub evidence; service state on host | Provider/auth/host failure | Fresh state and separate execution authorization | RECOMMENDED; E03/E10 |
| Review | Bugbot; selection-only canonical stage | Independent review controller + admitted reviewer | Risk/independence/acceptance policy | Bugbot or future authorized specialist | Independent admitted surface or pending gate | GitHub review/result + quota evidence | Same-model-only/unavailable reviewer | Reject insufficient independence; preserve implementation result | RECOMMENDED; E17 |
| Retry/repair | Executor bounded loop; separate retry-selection caller | Explicit deterministic retry owner; task-level tool retries bounded | Allowlist/max attempts/fresh quota/new execution authority | Existing executor or future authorized repair adapter | STOP/checkpoint | Attempt lineage/receipts/spend + Git evidence | Unknown prior effect/exhaustion/nonconvergence | Reconcile then reauthorize bounded attempt; never unspend | RECOMMENDED; E18/E16 |
| Browser automation | Hermes via Chromium/CDP | One Hermes browser client + one dedicated backend | Bounded UI task; no implicit external-action permission | NEW loopback CDP/Chromium | Private manual noVNC or admitted non-browser route | Profile owner; job/session lease | UI drift/stale tab/duplicate send | Inspect job/conversation; fence stale generation; fresh session if safe | RECOMMENDED; E06 |
| Model routing | Registry/selectors + provider/backend adapters | One deterministic route authority | Role/quality/risk policy | LiteLLM, local router, approved direct surfaces | Explicit adequate alternative or gate | Registry + per-job route evidence | Wrong identity/hidden fallback | Reject route; reselect from fresh approved state | RECOMMENDED; E08–10/E19 |
| Quota routing | Canonical composer/join/selectors; collectors incomplete | Same shared-pool authority | Fresh admitted observations/reserve policy | Per-surface status adapters | Defer/valid manual observation | Canonical status inputs + result lineage | Stale pool/double-counted surfaces | Refresh exact pool; exclude exhausted shared alternatives | RECOMMENDED; E08/E17–19 |
| Human authorization | Operator via direct Telegram/standing bounded authority | Same human + deterministic issuer | Operator decision, scope/expiry/provenance | Telegram decision handler; register/status API | Pending gate until direct valid decision | Pending/provenance store | Spoofed/replayed/missing approval | Identity/expiry/receipt validation and reconciliation | RECOMMENDED; E11/E15 |
| Durable authorization provenance | Windows issuer/provenance registry | Separate deterministic state owner | Server-owned scope/identity rules | Issuance + execution admission | Fail closed | User-local registry/pending store | Corruption/writer race | Reconcile records; no chat-based reconstruction | RECOMMENDED; E15 |
| Durable admission/spend | Windows spend ledger | Separate monotonic admission owner | Ledger-first consumption | Windows endpoint | Deny uncertain/replayed request | Server-local spend ledger | Consumed with unknown/no effect; state loss | Reconcile outcome; preserve consumed state and authorize new work separately | RECOMMENDED; E16 |
| Persistence | GitHub for project, PostgreSQL for n8n, local stores for auth/receipts | Same explicit split | Respective state owner; remote verification law | Selective Git writes/DB/file state | Bounded local checkpoint without PASS claim | GitHub + PostgreSQL + workstation stores | Push failure/partial state/corruption | Retry persistence safely; preserve dirty work; verify exact remote outcome | RECOMMENDED; E01/E03/E15–16 |
| Context rollover | Human GPT Web lean handoff; browser recall only proven | Governed Hermes session generation after P2 | Persistence-before-rollover + canonical CORE BOOT | Fresh ChatGPT conversation | Manual fresh chat or independent specialist | GitHub checkpoint; local non-authoritative session mapping | Memory loss/stale generation/unpersisted delta | Fence old chat, persist missing delta, reboot from GitHub | RECOMMENDED; E01/E02/E06 |
| Secret custody | Operator/service-specific stores | Same separated service custody | Least-privilege operator/security policy | Host credential stores, profile and approved provider auth | Manual revoke/reauth | Respective secret store; never Git/chat | Credential leak/expiry/account loss | Revoke/rotate, verify scopes and restore approved surface | RECOMMENDED; E03/E06/E15; exact ACLs UNKNOWN |
| Observability | n8n executions, service health, bounded result/receipt/Git evidence | Same owners with one correlated per-task evidence format | Canonical result schemas and redaction policy | Service logs/status/result composers | Manual bounded diagnosis | PostgreSQL/local logs + selected Git evidence | Missing correlation/noise/secrets in logs | Reconcile task/attempt/base/route/spend/remote SHA; preserve unknowns | RECOMMENDED; E01/E05/E12–19 |
| Rollback | Operator; OLD retained, per-task checkpoints | Same separate recovery authority | Explicit rollback/exit/decommission gate | Frozen OLD or bounded component revision restore | Remain safely stopped until authorized recovery | OLD retained state + NEW snapshots + Git | Stale restore/dual writer/data loss | Freeze active writer, reconcile post-cutover delta, authorize restore and verify | RECOMMENDED; E03–04 |

Observability additions proposed for future work are **RECOMMENDED**, not already collected telemetry: correlate `task_id`, `attempt_id`, base SHA, dispatch anchor, route/model/surface/pool, quota observation timestamp, authorization/consumption outcome, controller/browser generation, result class and verified remote commit. Keep secrets, raw profiles and unnecessary transcripts out. Monitor the effective n8n-container→Windows endpoint path, not merely host ping; distinguish BUSY, IDLE, STOP, HUMAN_GATE and SERVICE_ERROR. A failed persistence step is never a completed PASS.

## 15. Final recommendation and limits

**ARCHITECTURAL RECOMMENDATION — RECOMMENDED:** adopt **DETERMINISTIC_CORE_WITH_BOUNDED_HERMES_COGNITION** as the single preferred TO-BE. Keep n8n, GitHub, policy/quota selection, execution admission, authorization/spend, review and retry ownership explicit. Qualify Hermes/Web for bounded cognitive TASK DELTA generation and exception diagnosis; preserve direct Codex/GLM and local Qwen specialists plus current implementation harnesses. Merge only adapter maintenance packaging after parity. Keep OpenClaw staged until a bounded dependency/recovery decision proves whether it adds value. Retire no component from the present evidence.

**ARCHITECTURAL INFERENCE — INFERRED:** the principal new failure mode is the coupled Hermes controller → browser profile/CDP → ChatGPT UI chain returning no answer, a stale answer or an uncertain send. Keeping that chain outside normal dispatch and authorization limits its blast radius. Recovery is a persisted demand/checkpoint, generation fencing and CORE BOOT through a fresh or independently admitted cognitive surface. If no adequate route is available, work stays pending; safety gates do not disappear.

The principal retained infrastructure risk is shared NEW-host failure compounded by workstation-local execution/authorization dependence. OLD remains a frozen, separately gated recovery option, not an automatically current replica. Production recovery must reconcile post-cutover state and prevent dual writers. Neither minimizing service count nor placing all duties in Hermes resolves these data/recovery constraints.

**CURRENT FACT — PROVEN:** this audit leaves NEW live, OLD retained, OpenClaw inactive, D-0025 closed, authorization state unchanged and #72 closure intact. No recommendation is represented as implemented state. B1–B3 are future promotion/activation proof gates; they are not reasons to erase existing PASS evidence or reopen D-0025.

## 16. Final snapshot and persistence verification record

```text
FINAL_REFRESH_UTC=2026-09-07T19:34:30Z
FINAL_OBSERVED_HEAD=f2b314b1cb544514f3044d8c6238a9359ad9b1e2
MAIN_ADVANCED_DURING_AUDIT=NO
ARCHITECTURE_RELEVANT_DELTA_INGESTED=NONE_REQUIRED_HEAD_UNCHANGED
FINAL_ISSUE_EVIDENCE_REFRESH=#61_OPEN_6_COMMENTS_UNCHANGED;#67_6_COMMENTS_UNCHANGED;#72_CLOSED_1_CLOSURE_COMMENT
REPORT_STRUCTURAL_CHECK=PASS_29_DISPOSITIONS_RECONCILED_LOCAL_LINKS_VALID
BOUNDED_INDEPENDENT_REPORT_REVIEW=PASS_RUNTIME_AUTHORITY_AND_MODEL_ROUTE_CLAIMS
AUDIT_CLASSIFICATION=COMPLETE_WITH_GATED_RECOMMENDATIONS
```

Final `git fetch origin main` and terminal `git ls-remote origin refs/heads/main` both completed. Main remained at AUDIT_BASE_HEAD, so there was no commit delta to ingest. Refetched #61 retained its body/update timestamp and all six comment bodies; #67's six comment bodies were unchanged; #72 remained closed with its single matching remediation comment. Report checks reconciled all 29 IDs across the capability/disposition inventory, all disposition totals, required sections and local links. Two bounded independent reviews found no material runtime/authority or model/route claim corrections. No production tests were run for this documentation-only audit.

The report records the canonical parent observed immediately before its persistence. Its own containing commit cannot embed its own SHA. The exact remotely verified report commit and result are recorded in issue #61 only after push and `git ls-remote` verification. A push/verification failure requires AUDIT_CHECKPOINT_REQUIRED, never a success comment. The final user response must provide that exact remote SHA and reconciled disposition counts.
