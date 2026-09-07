# V4 LIVE_QUOTA_STATUS — existing contract reconciliation

Date: 2026-09-07
Issue: #73
Parent audit: #61

Status: `PASS_EXISTING_FOUNDATION / NO_NEW_SCHEMA_REQUIRED_FOR_CODEX_GLM`

## 1. Finding

The post-audit `LIVE_QUOTA_STATUS` requirement does **not** require a new quota-state schema for the already modeled Codex and GLM commercial pools.

Existing canonical pieces already provide the required foundation:

- `docs/contracts/quota-pool-status-v1.md`
- `docs/contracts/quota-pool-status-v1.schema.json`
- `docs/contracts/v4-resource-status-contribution-v1.schema.json`
- `tools/translate-quota-pool-snapshot-v1.mjs`
- `tools/rt25-quota-ingest-codex-v1.mjs`
- `tools/rt25-quota-ingest-glm-v1.mjs`
- `tools/rt25-canonical-quota-state-v1.mjs`

The current contract already models:

- one dynamic observation per shared `quota_pool_id`;
- multiple observed windows (`rolling`, `weekly`, `monthly`, `unknown`);
- remaining quota as observed percent/normalized/unknown;
- reset/window timestamps only when sourced from evidence;
- `fresh` / `stale` classification;
- fail-closed `unknown` behavior;
- source identity (`dashboard_snapshot`, `manual`, `provider_api`, `internal_ledger`);
- reserve-policy separation from observations;
- no dynamic quota values in the static registry;
- no invented quota values;
- five-minute freshness ceiling in the current translator.

Therefore issue #73 Phase A is reconciled as **reuse existing quota-pool-status-v1**, not introduce a parallel `LIVE_QUOTA_STATUS` state authority.

## 2. Current source matrix

| Domain | Existing state | Exact gap |
|---|---|---|
| Codex / `chatgpt_codex_subscription` | Real runtime ingest exists; source law `MANUAL_DASHBOARD_ONLY`; deterministic translator + canonical ingest lane already implemented | automatic collector absent; fresh manual observation required |
| GLM / `glm_coding_plan` | Real runtime ingest exists; manual path + read-only monitor endpoint adapter implemented | monitor credential not provisioned in current canonical evidence, so automatic path fails closed unless runtime credential is available |
| Cursor native allowance | static access surface exists, but `quota_pool_id=null` and `allowance_ownership.state=unverified` | account dashboard now demonstrates allowance buckets operationally, but stable pool identity/model-to-bucket mapping is not yet canonical; must not invent mapping |
| ChatGPT Web | qualified browser cognitive surface through Hermes | no quota-pool identity established; treat as a separate availability domain, not as `unlimited` and not silently equated with Codex pool |
| Qwen local | local resource-status/readiness/occupancy mechanisms already exist; no commercial pool | availability is local compute/readiness, not commercial quota; latency/GPU/uptime still matter |

## 3. Codex runtime law already present

`tools/rt25-quota-ingest-codex-v1.mjs` already:

1. reads an operator-provided dashboard snapshot from an untracked runtime ingest lane;
2. translates it deterministically;
3. emits `v4-resource-status-contribution-v1`;
4. projects the one shared Codex pool observation into the canonical resource-status path;
5. fails closed on stale/invalid evidence;
6. never reads credentials or touches Codex/ChatGPT/OpenAI APIs.

This is suitable for current manual quota snapshots; the missing work is collection convenience/automation, not quota semantics.

## 4. GLM runtime law already present

`tools/rt25-quota-ingest-glm-v1.mjs` already supports:

- `manual` snapshot mode;
- `monitor` mode using the read-only documented usage endpoint when an operator-provisioned runtime credential is present;
- 5-hour and weekly windows from documented monitor fields;
- fail-closed UNKNOWN when no credential/snapshot is available;
- one shared pool for GLM 5.3 + GLM 5.3 Flash.

No new GLM quota schema is needed.

## 5. Cursor is the structural gap

Current registry deliberately says:

`cursor_native_model_route.quota_pool_id = null`

and:

`allowance_ownership.state = unverified`

The operator has now supplied fresh account-dashboard evidence showing a Pro+ plan with distinct included usage buckets named `Cursor Models` and `Other Models`, but the dashboard screenshot alone does not establish a stable mapping of every concrete model to one bucket or whether all future Cursor model classes retain the same accounting law.

Therefore the safe next Cursor slice is **source/pool identity reconciliation**, not hardcoding the observed percentages or inventing a single pool.

Dynamic percentages must remain outside Git-tracked registry files.

## 6. ChatGPT Web availability domain

ChatGPT Web should initially be modeled for routing as an observed cognitive **availability surface**, not a commercial quota pool, until a trustworthy pool/accounting relationship is proven.

Required observations can include only what is actually measurable safely, for example:

- authenticated session healthy/unhealthy;
- UI reachable/unreachable;
- bounded sentinel/DOM round-trip healthy/unhealthy;
- context/session generation health;
- observed throttling or explicit limit state if surfaced reliably.

Do not label the surface `INFINITE`, `FREE`, or quota-independent from Codex without evidence.

## 7. Updated #73 sequencing

The bounded next order becomes:

1. **A = CLOSED / REUSE EXISTING CONTRACT** for Codex+GLM quota semantics.
2. **B1 = Cursor pool/source identity reconciliation** (static structure only; no live numbers in registry).
3. **B2 = safe collector convenience** for Codex/GLM where technically supported; preserve manual fallback.
4. **B3 = ChatGPT Web availability observation contract/adapter** as separate surface-domain health.
5. **C = Qwen local -> Hermes -> ChatGPT Web shadow TASK DELTA proof.**
6. **D/E = rollover fence + quota-degraded shadow routing.**
7. **F = human promotion gate.**

## 8. Runtime impact

`RUNTIME_CHANGED=NO`

`ROUTING_CHANGED=NO`

`AUTHORIZATION_CHANGED=NO`

`D0025_CHANGED=NO`

`OLD_CHANGED=NO`

This reconciliation only prevents duplicate schema work and narrows the actual implementation gaps.
