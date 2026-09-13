# V4_HERMES_CONSOLIDATION_ARCHITECTURE_AUDIT_V1

**Issue:** #61 (parent #32) — V4 architecture audit: Hermes consolidation and component retirement
**Mode:** ARCHITECTURE AUDIT ONLY — no implementation performed in this task
**Classification:** `PASS — ALL_COMPONENTS_DISPOSITIONED=YES; ISSUE_61_MUTATED=NO; PRODUCTION_CHANGED=NO`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `3bd1d3b6943eeefcf7ae4de4420d452abc14229c`
**Canonical state source:** `docs/runtime/CURRENT_FRONTIER.md` (issue #61 body contains historical 16 GB-era infra references — superseded; canonical topology used throughout).

---

## 1. EXECUTIVE DECISION

The Control Plane has already consolidated, with qualification evidence, the four capabilities Hermes was candidate for: **agent runtime** (Phase F bounded production activation `PASS`, decision A recorded, live canary), **browser automation** (governed CDP qualification V7 `PASS`; native tools behind the 4-tool allowlist; visual sidecar #78 wired), **model routing for Codex** (`HERMES_CODEX_DYNAMIC_GPT_MODEL_ROUTER=QUALIFIED`), and **24/7 VPS operation** (#68 cutover `PASS`, noVNC private operator link `PASS`).

Therefore the audit does **not** propose adding Hermes on top: it proposes a **role-precise convergence** — Hermes absorbs the remaining duplicated browser-governance glue and becomes the default agent runtime for eligible bounded tasks, while deterministic orchestration (n8n), selection/claim authority (LOCAL_DEV dispatcher), canonical truth (GitHub), quota/failover policy (LiteLLM + resource registry) and the human gate (Telegram/MCP) **stay out of Hermes by design**.

Headline dispositions: **KEEP 21 · MERGE 3 · REPLACE_WITH_HERMES 1 · RETIRE 1** (of 27 scope components; several KEEP items contain bounded MERGE sub-items). Nothing is retired merely for similarity: the only RETIRE (OpenClaw) is a dormant broker with no live qualified role; the only REPLACE_WITH_HERMES is CDP-governance glue superseded by a qualified native path.

**Required decisions:** `OPENCLAW_DISPOSITION=RETIRE` · `LITELLM_DISPOSITION=KEEP`.

---

## 2. AS-IS ARCHITECTURE

Planes: **DETERMINISTIC_CONTROL** (n8n, dispatcher, gates-as-workflow) · **AGENTIC_EXECUTION** (Hermes runtime, LOCAL_DEV/Autovia executor, OpenCode harness, Cursor/Codex surfaces) · **MODEL_ROUTING** (LiteLLM gateway, resource registry, Hermes Codex router) · **BROWSER_BRIDGE** (Hermes native browser tools, persistent Chrome/CDP, visual sidecar, DOM verifier) · **HUMAN_AUTHORITY** (Telegram/MCP human gate) · **OBSERVABILITY** (#79 lane, resource observatory, private status endpoint) · **PERSISTENCE** (GitHub, PostgreSQL 16.15, local ephemeral JSON) · **NETWORKING** (Tailscale, TLS/GOI, private endpoints).

| COMPONENT | CURRENT_ROLE | OWNER | EXEC_AUTHORITY | OBS_ONLY | PERSISTENCE | 24/7 | LOCAL | VPS | EXT_DEPS | EVIDENCE (CURRENT_FRONTIER / reports) |
|---|---|---|---|---|---|---|---|---|---|---|
| GitHub | canon source, backlog, evidence | Control Plane | none (storage) | no | yes | yes | no | no | github.com | FOUNDATION; every task's PRECHECK |
| n8n | deterministic orchestration, gates, ledger, idempotency | n8n/PostgreSQL | workflow gates | no | yes | yes | no | YES (NEW) | PostgreSQL 16.15 | WF40 live 83 nodes; N8N_LOCAL_DEV_ALWAYS_ON=LIVE |
| LOCAL_DEV dispatcher | selection/claim authority, safety enforcement, scheduled tick | project | CLAIM authority | no | claim/receipt state | yes (Scheduled Task LIVE) | yes | no | backlog files, Qwen runtime | LOCAL_DEV_DISPATCHER_RUNTIME_RESTORE=PASS |
| Autovia / autonomous path | bounded overnight autonomous execution | project | bounded exec via dispatcher | no | run evidence | yes (SEGMENT 5 LIVE, PASSES=15, EXEC=9) | yes | no | executor chain | OVERNIGHT_AUTOVIA_CAMPAIGN_V1 |
| Qwen local runtime | LOCAL_CONTROLLER + offline implementer/model | project | model calls | no | no | yes (resident) | yes | no | RTX 3060 12 GB | QWEN_MODEL_POLICY configs; :8080 MultiModel |
| OpenCode | implementer harness for local executor | project/harness | exec inside executor | no | no | no | yes | no | Qwen profiles | opencode-execution-adapter; shim/permission fixes |
| Hermes runtime | qualified agent runtime (local + VPS), browser tools, Codex routing | project + vendor runtime | agent exec (bounded canary LIVE) | no | session-scoped only | YES (VPS) | yes | YES | agent-browser, model routes | PHASE_F=PASS/A_RECORDED; router QUALIFIED |
| Browser automation/bridges | DOM/a11y tools, governed CDP exposure | project/Hermes | browser actions via allowlist | no | no | yes | yes | YES | Chrome/CDP | governed CDP V7 QUALIFIED |
| Persistent Chromium/CDP | authenticated browsing surface | project | via bridge only | no | profile on disk | yes | yes | YES (noVNC) | Chrome | sidecar/broker evidence; loopback binds |
| Visual sidecar #78 | read-only annotated screenshot fallback | project | NONE (observation) | YES | ephemeral temp only | no | yes | no | agent-browser pinned exe | suite 28/28; wiring 23/23; #78 CLOSED |
| Activity registry/dashboard #79 | read-only external-activity lane | project | NONE (observation) | YES | ephemeral JSON (20 cap) | yes (dashboard poll) | yes | read via private endpoint | dispatcher HTTP | 23/23; #79 CLOSED |
| ACP/Cursor MCP human gate | sole human decision authority for agent flows | project | GATE authority (human) | no | pending store | no | yes | no | Telegram transport | MCP slice PASS; persistent operator wait V1; RETRY4 real E2E PASS |
| Telegram gate path | human transport (callback) | project/Telegram | transport only | no | chat-side | yes (bot) | no | no | Telegram API | issuance owner/service LIVE |
| LiteLLM | primary remote model gateway (FOUNDATION v3.5 CANONICAL) | project | routing only | no | quota translation | yes | yes | yes | providers | FOUNDATION row; quota translators |
| OpenClaw | historical broker/fallback | project | none (dormant) | — | — | no | — | — | — | no live rows in CURRENT_FRONTIER; dormant |
| GLM routes | remote model route (quota-aware) | project | model calls | no | quota state | yes | no | yes | GLM provider | registry v2; GLM_ELIGIBLE_08_12=NO (window) |
| Qwen routes | local controller/implementer routes | project | model calls | no | no | yes | yes | no | local GPU | model policy configs |
| Codex routes | subscription Codex routes + dynamic GPT selection | project/Hermes router | model calls | no | quota state | yes | yes | YES | Codex subscription | router QUALIFIED; catalog live |
| ChatGPT Web route | ANSWER_SURFACE only | — | none (surface) | — | — | yes | yes | YES | authenticated profile | WEB_PROOF_PASS lineage |
| Cursor implementation surface | interactive dev + ACP MCP gate host | human/project | interactive | no | no | no | yes | no | Cursor app | ACP MCP gate slices PASS |
| Codex implementation surface | interactive/audit executor | human/project | interactive | no | no | no | yes | YES (prefill-only QUALIFIED) | Codex app | VPS_CODEX_08_12=SHADOW_PASS |
| n8n/PostgreSQL persistence | production persistence (ledger, idempotency, execution entities) | project | none (storage) | no | yes | yes | no | YES | PostgreSQL 16.15 | cutover retry PASS |
| Tailscale/private networking | private transport plane | project | none | — | — | yes | yes | YES | Tailscale | PRIVATE STATUS ENDPOINT PASS |
| nginx/TLS | TLS termination on VPS n8n | project | none | — | — | yes | no | YES | certs | GOI/TLS topology PASS |
| NEW VPS runtime topology | 24/7 production + Hermes host | project | per-service | — | yes | yes | no | YES | IONOS | #68 cutover PASS; 31.70.139.73/100.99.54.93 |
| OLD VPS rollback role | rollback retention | project | none (frozen) | — | retained data | — | no | YES | — | ROLLBACK RETENTION OPEN; D-0025 off |
| Custom wrappers/adapters (runtime-carrying) | executor chain, quota translators, issuance owner/service, resource observatory, sidecar, registry, MCP gate server | project | various bounded | mixed | mixed | mixed | mostly | some | various | each wired behind gates |

Plane totals: DETERMINISTIC_CONTROL = 3 core (n8n, dispatcher, human-gate workflow) · AGENTIC_EXECUTION = 5 · MODEL_ROUTING = 3 · BROWSER_BRIDGE = 4 · OBSERVABILITY = 3 · PERSISTENCE = 3 · NETWORKING = 3.

---

## 3. CAPABILITY / OVERLAP MATRIX

Overlap legend: ⬤ full · ◐ partial · ○ none/irrelevant. Disposition in **bold**.

| COMPONENT | what it does today | Hermes overlap | what Hermes CANNOT replace | failure domain | maintenance | duplication | **DISPOSITION** |
|---|---|---|---|---|---|---|---|
| GitHub | canon, evidence, PRs | ○ | constitutional source-of-truth | vendor outage | low | none | **KEEP** |
| n8n | deterministic gates, ledger, idempotency, schedules | ◐ (Hermes executes; doesn't gate/ledger) | transactional gate/ledger semantics, idempotency keys | workflow/DB | medium (83 nodes) | scheduling overlap w/ dispatcher task | **KEEP** (+MERGE scheduling, §5) |
| LOCAL_DEV dispatcher | selection/claim/safety | ◐ (Hermes can execute; must not claim) | claim exclusivity, repo hygiene fences | executor | medium | none intrinsic | **KEEP** |
| Autovia | bounded overnight autonomous exec | ◐ (same role class on VPS) | its qualified local record; claim integration | executor | low-medium | role-adjacent to Hermes runtime | **KEEP** (converge later, gated) |
| Qwen local runtime | local controller model, offline | ○ (Hermes uses models, isn't one) | zero-marginal-cost offline inference on local GPU | GPU capacity | low | none | **KEEP** |
| OpenCode | implementer harness | ◐ (Hermes is an alternative runtime) | its qualified executor record + permission schema | harness | medium (shim fixes lineage) | overlaps Hermes as runtime | **KEEP** (glue MERGE candidate, §5-P4) |
| Hermes runtime | agent runtime, browser tools, Codex router | — | — | runtime | medium | consolidation hub | **KEEP** (hub) |
| Browser bridges (governed CDP composer + apply glue) | govern CDP exposure for proofs | ⬤ (V7 native governed CDP QUALIFIED) | nothing proven beyond Hermes' qualified path | glue scripts | medium (python glue) | FULL overlap | **REPLACE_WITH_HERMES** |
| Persistent Chromium/CDP | authenticated browsing | ○ (Hermes drives it) | the browser itself | browser | low | none | **KEEP** |
| Visual sidecar #78 | read-only visual fallback | ○ (complements Hermes) | independent bounded observation (deliberately outside vendor runtime) | CLI/daemon | low | none (by design) | **KEEP** |
| Activity registry #79 | read-only activity lane | ○ | cross-runtime observability independence | registry file | low | none | **KEEP** |
| ACP/Cursor MCP human gate | sole human decision gate | ○ (must NOT be absorbed) | human trust anchor | Telegram/MCP | low-medium | none | **KEEP** |
| Telegram gate path | human transport | ○ | transport neutrality | Telegram API | low | none | **KEEP** |
| LiteLLM | remote gateway + quota translation | ◐ (Hermes Codex router overlaps Codex selection only) | quota pools, multi-provider failover, canonical gateway role | gateway | medium | Codex-selection overlap | **KEEP** (policy MERGE, §5-P4) |
| OpenClaw | historical broker/fallback | ⬤ (Hermes covers runtime/fallback roles) | nothing (no live qualified role) | dormant | ~0 (dormant) | zombie component | **RETIRE** |
| GLM routes | remote model route | ○ | quota-differentiated model option | provider | low | none | **KEEP** |
| Qwen routes | local routes | ○ | offline/zero-cost tier | local GPU | low | none | **KEEP** |
| Codex routes | subscription routes | ◐ (router is Hermes') | subscription quota access | subscription | low | router already Hermes' | **KEEP** |
| ChatGPT Web route | answer surface | ○ (Hermes reaches it) | the authenticated surface itself | web/session | low | none | **KEEP** |
| Cursor surface | interactive dev | ○ | human interactive workflow | IDE | low | none | **KEEP** |
| Codex surface | interactive/audit executor | ○ | human interactive workflow | app | low | none | **KEEP** |
| n8n/PostgreSQL persistence | production persistence | ○ | transactional ledger | DB | low-medium | none | **KEEP** |
| Tailscale | private transport | ○ | network plane | network | low | none | **KEEP** |
| nginx/TLS | TLS on VPS | ○ | termination | certs | low | none | **KEEP** |
| NEW VPS topology | 24/7 host | ○ | hosting | host | medium | none | **KEEP** |
| OLD VPS | rollback retention | ○ | rollback insurance | frozen host | low | intentional redundancy | **KEEP** (until human decommission gate) |
| Runtime wrappers (14 wired) | executor/adapters/issuance/observatory/sidecar/registry/gate server | ◐ per-case | each holds a qualified bounded law | per-wrapper | per-wrapper | mostly none | **KEEP** (2 glue items MERGE/REPLACE below) |

---

## 4. COMPONENT DISPOSITIONS (deltas only — all others KEEP as mapped)

### RETIRE — OpenClaw
- **RATIONALE:** no live/qualified role anywhere in canonical state; its historical broker/fallback roles are now covered by Hermes runtime (qualified, Phase F live canary) and by the quota-aware routing plane. Keeping dormant brokers is an unobservable failure domain.
- **PRECONDITIONS:** explicit human gate authorizing removal from resource registry/diagrams; confirm zero inbound references in wired runtime (grep audit at execution time).
- **DEPENDENCIES:** none live.
- **MIGRATION_RISK:** LOW at execution (dormant); documentation-level.
- **ROLLBACK_PATH:** git revert of registry/diagram commit; component code remains in history.
- **HUMAN_GATE_REQUIRED=YES.**

### REPLACE_WITH_HERMES — governed-CDP composer glue (`hermes_governed_cdp_composer_v1.py` + apply script)
- **RATIONALE:** `V4_HERMES_CODEX_GOVERNED_CDP_AND_VPS_08_12_QUALIFICATION_V7=PASS` (`CODEX_HERMES_GOVERNED_CDP=QUALIFIED`, VPS `QUALIFIED_PREFILL_ONLY`) shows the native Hermes governed-CDP path covers the exposure the project-owned composer provided. Two python glue scripts duplicating a qualified native capability = avoidable failure domain.
- **PRECONDITIONS:** parity checklist (same scope: prefill-only, loopback/private endpoint, ephemeral exposure window, sanitized evidence) executed once and persisted; no live caller outside qualification flows.
- **DEPENDENCIES:** Hermes native governed CDP; visual sidecar unaffected (uses its own pinned CLI, observation-only).
- **MIGRATION_RISK:** MEDIUM (proof tooling depends on it) → mitigated by keeping composer in repo history and validating parity first.
- **ROLLBACK_PATH:** re-enable composer invocation in qualification scripts (single import swap).
- **HUMAN_GATE_REQUIRED=NO** (non-production proof tooling), recorded decision required.

### MERGE — three bounded consolidations
1. **Scheduler dedup (n8n WF90 always-on vs Windows Scheduled Task for LOCAL_DEV dispatcher).** Both are LIVE for the same runtime. One must become the canonical trigger, the other observer-only. RATIONALE: two schedulers for one runtime = ambiguity on restart/duplication. PRECONDITIONS: crash-restart equivalence test; single-flight guard verified. RISK: MEDIUM (missed ticks / double ticks). ROLLBACK: re-enable second trigger. **HUMAN_GATE_REQUIRED=YES** (production-adjacent).
2. **Routing policy single-source (LiteLLM gateway policy + Hermes Codex router policy → resource registry v2 as the only policy store).** RATIONALE: `HERMES_CODEX_DYNAMIC_GPT_MODEL_ROUTER=QUALIFIED` while LiteLLM stays canonical gateway — the *policy* must live in one place even if *transports* differ. PRECONDITIONS: registry schema already separates MODEL/ROLE/ACCESS_SURFACE/QUOTA. RISK: LOW (docs/config-level first). ROLLBACK: trivial. **HUMAN_GATE_REQUIRED=NO.**
3. **OpenCode harness glue (shim/permission-fix wrappers) converging toward Hermes-executor equivalence.** RATIONALE: Hermes Phase F live canary exists; where a task class is runnable by both, the wrapper set can shrink. PRECONDITIONS: per-task-class parity evidence. RISK: MEDIUM. ROLLBACK: OpenCode chain intact. **HUMAN_GATE_REQUIRED=YES** (execution-plane change). NOT scheduled now.

### Explicit non-retirements (similarity ≠ duplication)
- n8n (deterministic) vs Hermes (agentic): different failure semantics — **KEEP both**.
- GitHub (canon) vs runtime state stores: constitutional difference — **KEEP both**.
- Sidecar/registry (project-owned, bounded, observation-only) vs "Hermes could observe too": independence is the security property — **KEEP both**.

---

## 5. TO-BE MINIMAL ARCHITECTURE

| Plane | TO-BE | Change vs AS-IS |
|---|---|---|
| CONTROL PLANE | GitHub (canon) + n8n (deterministic gates/ledger) + LOCAL_DEV dispatcher (selection/claim) + human gate (Telegram/MCP issuance) | unchanged laws; single canonical scheduler trigger |
| EXECUTION PLANE | LOCAL_DEV/Autovia executor (local, qualified) + Hermes runtime (local + VPS 24/7) + Cursor/Codex (interactive only) | Hermes = default bounded agent runtime for eligible tasks; composer glue gone; OpenCode glue shrinks over time |
| MODEL PLANE | LiteLLM gateway (canonical remote) + Qwen local (offline tier) + resource registry v2 as SINGLE policy source (Hermes Codex router reads policy from it) | policy MERGE |
| BROWSER PLANE | persistent Chrome/CDP + Hermes native browser tools (4-tool allowlist) + visual sidecar #78 (fallback observation) + independent DOM verifier | one governed CDP path (Hermes native) |
| HUMAN GATE | Telegram + MCP human gate = SOLE authority; persistent operator-wait law; noVNC private operator link for visual confirmation | unchanged (trust anchor) |
| OBSERVABILITY | #79 lane + dashboard AGENT section + resource observatory + private status endpoint | unchanged |
| PERSISTENCE | PostgreSQL 16.15 (n8n production) + GitHub + local ephemeral JSON registries | unchanged |
| NETWORKING | Tailscale private + TLS on VPS; loopback-only CDP; no public exposure | unchanged |

Net: **one** governed browser path, **one** scheduler per runtime, **one** routing policy source, **zero** dormant brokers — same or stronger security (fewer unreviewed glue paths into authenticated surfaces).

---

## 6. MODEL / ROUTE POLICY

Policy dimensions: QUALITY, LATENCY, QUOTA, COST, RELIABILITY, VISION, TOOL_USE, OFFLINE, 24/7, RESOURCE_PRESSURE. **No silent fallback: every fallback is a named route activated by explicit gate/condition.**

| ROLE | PRIMARY | AMMITTED FALLBACK (named, gated) | Never |
|---|---|---|---|
| PLANNER | Qwen local (COST=0, OFFLINE, RESOURCE_PRESSURE known) | GLM quota-aware (QUOTA-gated); Codex via router (QUALITY-critical tasks) | silent remote default |
| IMPLEMENTER (local) | LOCAL_DEV Autovia executor (OpenCode+Qwen, qualified) | Hermes runtime bounded (Phase F canary class) | un-vendored interactive agents |
| IMPLEMENTER (VPS/24/7) | Hermes runtime | Codex prefill-only (QUALIFIED_PREFILL_ONLY) | any local-GPU dependency |
| REVIEWER | Codex via Hermes dynamic router (QUALITY/TOOL_USE) | GLM quota-aware; Qwen local offline | — |
| LOCAL_CONTROLLER | Qwen local | none (singularity is the law) | remote controller |
| BROWSER_CONTROLLER | Hermes native browser tools (governed CDP) | none for actions; sidecar #78 = observation-only assist | raw CDP to models |
| ANSWER_SURFACE | ChatGPT Web via authenticated persistent profile | none automatic | treating it as controller |
| HUMAN_GATE | Telegram + MCP human gate | none (a gate has no fallback by definition) | any model-generated answer |

Constraint notes: OFFLINE ⇒ Qwen-only tier · 24/7 ⇒ VPS-hosted roles only · RESOURCE_PRESSURE ⇒ no second resident GPU model (VLM stays evidence-gated, on-demand/CPU).

---

## 7. SECURITY / TRUST BOUNDARIES

- **Browser authenticated profile:** persistent profile holds ChatGPT session; accessible ONLY via Hermes allowlisted tools (4) + sidecar read-only path; no profile reset/delete; ephemeral temp profiles in tests.
- **CDP exposure:** loopback-only binds (proven T12 lineage); VPS variant behind governed prefill-only qualification; private noVNC operator link; **no public CDP/noVNC/Funnel** stays a wall.
- **Telegram callback/gate trust:** Telegram is transport; the issuance owner (pending store + decision handler + reconciliation) is the authority; callback binding checks task/run/session/generation/decision; PENDING is non-decision; persistent operator wait never auto-answers.
- **Model authority boundaries:** models never self-authorize: dispatcher claims, gates authorize, human decides. Answer surface is not a controller. Sidecar/registry are observation-only by construction (no action exports).
- **Secret persistence:** allow-list sanitization at every telemetry boundary (#79 proven against hostile payloads); no cookie/token/credential persistence anywhere in the audited paths.
- **VPS trust boundaries:** NEW VPS = production (PostgreSQL, n8n, Hermes host) behind Tailscale+TLS; LOCAL workstation = execution + GPU; OLD VPS = frozen rollback.
- **LOCAL vs VPS execution:** local = selection/claim + GPU-heavy; VPS = 24/7 n8n + Hermes; no cross-domain silent escalation.
- **GitHub write authority:** only explicit task persistence commits (cursor-pass/codex-pass conventions); no runtime component writes to GitHub.
- **n8n credential boundary:** credentials stay inside n8n credential store; project code receives behavior, not secrets.
- **Human decision integrity:** single decision authority (human via gate); no default answers; explicit CANCELLED/SUPERSEDED terminal states; HUMAN_WAIT ≠ TOOL_CALL_TIMEOUT.

---

## 8. MAINTENANCE REDUCTION (evidence-bounded, no invented percentages)

| Metric | Value | Basis |
|---|---|---|
| COMPONENTS_BEFORE (scope) | 27 | §2 map |
| COMPONENTS_AFTER | 25 active (OpenClaw removed; composer glue absorbed) | §4 dispositions |
| SERVICES_RETIRED | 1 (OpenClaw, dormant) | no live frontier rows |
| WRAPPERS_RETIRED | 2 glue scripts (composer + apply) after parity | §4 REPLACE_WITH_HERMES |
| ROUTES_SIMPLIFIED | 1 browser-governance path (two ⇒ one) | V7 qualification |
| SCHEDULERS_UNIFIED | 2 ⇒ 1 per runtime (bounded phase) | WF90 + Scheduled Task overlap |
| FAILURE_DOMAINS_REDUCED | 2 hard (dormant broker; duplicate CDP governance) + 1 soft (scheduler ambiguity) | §4 |
| QUANTIFIED COST DELTA | not claimed | no live cost telemetry for retired items |

---

## 9. MIGRATION PHASES (NOT executed in this task)

| PHASE | SCOPE | CHANGE | TEST | ROLLBACK | HUMAN_GATE | DEPENDENCY |
|---|---|---|---|---|---|---|
| 1 | OpenClaw paper retirement | remove from resource registry/diagrams as active component; mark RETIRED-AUDIT-V1 | grep audit: zero wired references; registry validation test | git revert | YES | none |
| 2 | CDP governance unification | parity checklist Hermes-native vs composer; then point qualification flows at native path | parity checklist persisted; one proof re-run per surface | re-import composer (1 import swap) | recorded decision | Phase-F/V7 evidence current |
| 3 | Scheduler dedup LOCAL_DEV | canonical trigger = Windows Scheduled Task OR WF90 (decide by crash-restart evidence); other → observer | double/missed-tick test; single-flight proof | re-enable second trigger | YES | single-flight guard |
| 4 | Routing policy single-source | Hermes Codex router + LiteLLM policy read from registry v2 | router behavior equivalence test | config revert | NO | registry v2 schema |
| 5 (optional) | Hermes IMPLEMENTER expansion on VPS | widen Phase-F canary task classes | per-class bounded proof | shrink class list | YES | Phase F evidence; quota policy |

---

## 10. FIRST RECOMMENDED IMPLEMENTATION SLICE

**PHASE_1 — OpenClaw paper retirement.** Smallest, lowest-risk, real reduction: it removes a dormant broker from the active topology map and resource registry with zero runtime behavior change (nothing live depends on it). Bounded diff: `configs/resources/registry.json` entry disposition + one architecture-map note + this audit pointer. Test = registry schema validation + zero-reference grep. Rollback = revert. Requires the operator gate on disposition acceptance.

---

## 11. ITEMS REQUIRING HUMAN DECISION

1. OpenClaw decommission acceptance (Phase 1 gate).
2. Canonical scheduler choice for LOCAL_DEV dispatcher (Phase 3).
3. OLD VPS decommission — explicitly OUT of this audit's authority; separate gate whenever the operator chooses.
4. Hermes IMPLEMENTER class expansion on VPS (Phase 5).
5. Any future LiteLLM role reduction beyond policy unification (none proposed now).
6. Composer glue deletion after parity (recorded decision suffices; gate recommended).

## 12. NON-GO / DO-NOT-CHANGE ITEMS

GitHub as canon · Qwen as LOCAL_CONTROLLER · Hermes as bridge (not controller) · ChatGPT Web as answer surface only · DOM/accessibility as default observation · sidecar #78 and lane #79 as read-only · Telegram/MCP human gate as sole human authority (no Hermes/Cursor/Autovia second authority; HUMAN_WAIT ≠ TOOL_CALL_TIMEOUT; no automatic/default human answers) · LOCAL_DEV/Autovia qualified path · LiteLLM canonical gateway (this audit) · production n8n/PostgreSQL semantics (gates, ledger, idempotency stay deterministic) · OLD VPS rollback retention · D-0025 stays `enabled=false` · no public CDP/noVNC/Funnel · no credential/cookie/token persistence · no automatic provider fallback · no route activation/production dispatch from this audit · issue #61 stays OPEN (this audit did not mutate it).
