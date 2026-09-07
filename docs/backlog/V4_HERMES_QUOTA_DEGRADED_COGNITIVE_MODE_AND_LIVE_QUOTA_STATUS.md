# V4 Hermes quota-degraded cognitive mode + live quota status

Status: `BACKLOG / NEXT BOUNDED IMPLEMENTATION TRACK`

Parent audit: issue #61
Audit addendum: `reports/architecture/v4_architecture_audit_hermes_cross_model_quota_degraded_continuity_addendum_v1.md`

## Objective

Qualify and then, only after explicit promotion gates, enable a continuity path that keeps the Control Plane cognitively useful when direct commercial coding/planner routes are exhausted or unavailable:

`QWEN_LOCAL -> HERMES -> CHATGPT_WEB`

with bounded local implementation available through:

`QWEN_LOCAL -> OPENCODE`

and with GitHub/deterministic policy/n8n/authorization remaining the authority and enforcement surfaces.

In parallel, remove current routing blindness by adding fresh `LIVE_QUOTA_STATUS` evidence for commercial surfaces where technically obtainable.

## Why this matters

The current registry correctly separates model, access surface and quota pool, but static registry metadata is not live capacity. A routing system that cannot observe remaining capacity cannot preserve scarce routes before exhaustion or deliberately enter a safe degraded mode.

Hermes provides a strategically distinct composition capability: a local or remote controller can operate one governed browser/tool surface which can access authenticated ChatGPT Web. This can preserve cognitive work even when direct Codex/GLM/Cursor capacities are unavailable, provided ChatGPT Web remains observed healthy and all deterministic gates remain intact.

## Phase A — LIVE_QUOTA_STATUS contract

Define one fresh, typed observation contract containing at minimum:

- surface_id
- quota_pool_id when known
- observed_at
- valid_until / ttl
- source_kind
- used/remaining representation exactly as source supports
- reset horizon when observable
- confidence
- availability classification
- admission classification
- reason_codes

Required semantics:

- `FRESH`
- `STALE`
- `UNKNOWN`
- `UNAVAILABLE`
- `AVAILABLE`
- `RESERVE`
- `EXHAUSTED`

No invented percentages.

## Phase B — bounded collectors/adapters

Evaluate technically obtainable observations for:

1. Codex 5-hour and weekly usage windows.
2. GLM Coding Plan short-window and weekly usage.
3. Cursor included-model and other-model allowances.
4. ChatGPT Web observed availability as a separate domain; never infer `INFINITE` and never silently equate it to the Codex quota pool.
5. Qwen local readiness/occupancy/GPU headroom as non-commercial capacity.

If a source cannot be collected automatically without unsafe scraping, secrets, unsupported private interfaces or brittle automation, return `UNKNOWN` and preserve a bounded manual-observation path rather than inventing state.

## Phase C — Qwen -> Hermes -> ChatGPT Web shadow proof

Use one real low-risk canonical task demand.

Acceptance:

- lean GitHub canonical inputs only;
- Qwen local acts as Hermes controller;
- Hermes reaches authenticated ChatGPT Web;
- candidate TASK DELTA has exact base HEAD, target, scope, hard walls, acceptance and STOP;
- candidate cannot self-authorize;
- deterministic validator rejects stale/wrong candidates;
- no production dispatch from the proof;
- controller identity and answer-surface identity are persisted separately.

## Phase D — context rollover / stale-generation fence

Prove:

`Chat N -> persist bounded delta -> Chat N+1 -> CORE BOOT -> same canonical NEXT`

Acceptance:

- no dependence on old-chat memory;
- stale generation cannot be dispatched;
- ambiguous browser send has a reconciliation path;
- controller/browser loss returns bounded unavailable/STOP;
- fallback route is explicit and admitted, never implicit.

## Phase E — quota-degraded shadow route

Simulate or use a naturally occurring state where direct commercial routes are below admission threshold/unavailable while Qwen local + ChatGPT Web are available.

Expected route:

`QWEN_LOCAL -> HERMES -> CHATGPT_WEB -> deterministic validation`

and, when implementation is task-adequate and separately authorized:

`QWEN_LOCAL -> OPENCODE`

Acceptance:

- normal commercial route remains preferred when policy says so;
- reserve thresholds can preserve scarce commercial capacity before hard exhaustion;
- no hidden route/fallback inside Hermes overrides the Control Plane route decision;
- if ChatGPT Web is unavailable, persist/defer/STOP or use another admitted adequate route;
- no authorization bypass.

## Phase F — promotion gate

Automatic preferred/fallback routing is not authorized by this backlog file.

Promotion requires separate human decision after A–E evidence, including:

- route safety;
- source freshness;
- quota pool attribution;
- rollback/disable switch;
- observability;
- context recovery;
- preserved authorization/provenance boundaries.

## Hard walls

- no OLD mutation/decommission;
- no OpenClaw activation;
- no D-0025 reopening by implication;
- no public CDP/noVNC/Funnel;
- no credential or cookie persistence in GitHub;
- no scraping of private account pages unless separately reviewed and authorized as a supported/safe collector method;
- no claim that ChatGPT Web is infinite or quota-independent without evidence;
- no component retirement implied.
