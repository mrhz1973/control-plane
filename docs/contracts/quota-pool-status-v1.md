# QUOTA_POOL_STATUS v1 — shared commercial quota-pool dynamic state

**Repository:** `mrhz1973/control-plane`
**Document:** `docs/contracts/quota-pool-status-v1.md`
**Schema:** `docs/contracts/quota-pool-status-v1.schema.json`
**Version:** `quota-pool-status-v1`
**Date:** 2026-09-05
**Parents:** #32 (method), #39 phase 1 (this slice)
**Companion registry:** `resource-registry-v2` (`quota_pool_id` bindings)
**Runtime authorized by this document:** **NO**

---

## 0. Purpose and necessity

`resource-status-v1` is keyed by **resource id** (`qwen_local`, `glm`, `codex`, …) and
cannot represent one shared commercial allowance without duplicating the same quota
state across several models/access surfaces — which #32 forbids ("never double-count
one shared allowance as multiple independent model quotas").

This contract adds the **minimal** complementary representation: dynamic state keyed by
`quota_pool_id` as defined in `resource-registry-v2.quota_pools`. One observation per
POOL serves every model/surface referencing that pool.

## 1. Identity and sharing law

- Exactly one status entry per `quota_pool_id` (e.g. `chatgpt_codex_subscription`,
  `glm_coding_plan`);
- all surfaces/models referencing the pool (`registry-v2` `shared_by_surfaces` /
  `shared_by_models`) consume that single entry — no per-surface copies, no
  double-counting;
- a status for a pool id not present in the registry-v2 `quota_pools` section is
  invalid (`QUOTA_POOL_UNKNOWN`).

## 2. Static/dynamic boundary

- This document/schema carries **observations only**. The static registry remains
  capability/relationship data and must never embed numbers (unchanged law).
- No values are invented by translators: every number/timestamp in a produced status
  must originate from the input snapshot or be explicitly `null`/`unknown`.

## 3. Fields

| Field | Meaning |
|---|---|
| `quota_pool_id` | registry-v2 pool identity (binding) |
| `state` | observed state: `available` (all fresh binding windows remaining > 0), `exhausted` (any binding window remaining == 0), `unknown` (insufficient evidence). Missing input data NEVER becomes availability. Auxiliary / non-routing windows do not drive this state |
| `windows[]` | one entry per **binding** observed window: `window_type` (`rolling`/`weekly`/`monthly`/`unknown`), `remaining` (`percent` 0–100, `normalized` 0–1, or `unknown` with `value: null`), optional `window_ends_at`/`reset_at` (from evidence only, else null), per-window `freshness`. Auxiliary quotas belonging to another capability/domain MUST NOT appear here |
| `source` | `dashboard_snapshot` / `manual` / `provider_api` / `internal_ledger` |
| `observed_at` | provider-side observation timestamp (from snapshot) |
| `updated_at` | translator composition timestamp |
| `freshness` | deterministic `fresh`/`stale` classification vs the injectable evaluation clock and max age (§4) |
| `reserve_policy_ref` | reference/id of the separately governed reserve policy, or `null`. Reserve thresholds are POLICY, never observed data |
| `economics` | provider economics ONLY when explicitly supplied and marked verified by the evidence; otherwise `null` = unknown. Unknown economics are never treated as cheap |

Unknown fields remain unknown; nothing defaults to healthy.

## 4. Freshness / staleness (fail closed)

The translator takes an explicit injectable `nowMs` evaluation clock:

- `updated_at == evaluation time` (translator does not restamp observations);
- pool/entry `freshness = "fresh"` iff `observed_at <= now` AND
  `now - observed_at <= QUOTA_POOL_STATUS_MAX_AGE_MS` (default **300000 ms**, aligned
  with the resource-status-v1 freshness window);
- otherwise `freshness = "stale"`; per-window freshness follows the same rule on
  `observed_at`;
- a future `observed_at` (> now) is invalid, not merely stale
  (`SNAPSHOT_FUTURE_DATED`);
- consumers MUST treat `stale` as fail-closed/conservative: never as available quota.

## 5. Translator law (snapshot translators)

A translator for an **already-collected** normalized/manual snapshot:

- MUST NOT access ChatGPT/Codex UI, scrape/browser-automate, invoke Codex or any
  provider, call provider APIs, or read credentials/cookies;
- MUST NOT hardcode live observed values (percentages, reset times): they enter only
  via the input snapshot at runtime;
- MUST bind output to a registry-v2 `quota_pool_id` and pass through the observation
  `source`;
- MUST fail closed on invalid percentages/capacity, invalid reset timestamps, missing
  required data, future-dated or stale inputs (classification preserved, values not
  fabricated);
- MUST NOT interpret missing data as available quota (`state: "unknown"` only).

### 5.1 Multi-window binding law

Within one commercial model quota pool, multiple simultaneously observed provider
windows are **binding constraints** for that pool unless the source adapter
explicitly classifies a window as auxiliary / non-routing (e.g. Z.AI MCP quota
observed under a "Monthly" label for GLM):

- `effective_remaining_percent` for routing projection =
  **MIN**(remaining of all fresh binding windows) — never MAX;
- ANY fresh binding window with remaining == 0 ⇒ pool `exhausted`, regardless of
  healthier sibling windows;
- a required binding window that is missing, unknown, or stale ⇒ pool `unknown`
  (fail closed);
- auxiliary windows MUST NOT inflate model-quota remaining, MUST NOT make the
  pool `available`, and MUST NOT supply the headline reset for model capacity.

## 6. Result wrapper

Translators emit one machine-readable result:

```json
{
  "schema_version": "quota-pool-status-translate-result-v1",
  "ok": true,
  "classification": "PASS_QUOTA_POOL_STATUS_TRANSLATED",
  "quota_pool_status": {},
  "reason_codes": []
}
```

Classifications at minimum: `PASS_QUOTA_POOL_STATUS_TRANSLATED`,
`SNAPSHOT_INVALID`, `SNAPSHOT_MISSING_DATA`, `SNAPSHOT_INVALID_PERCENT`,
`SNAPSHOT_INVALID_RESET_AT`, `SNAPSHOT_FUTURE_DATED`, `SNAPSHOT_STALE`,
`QUOTA_POOL_UNKNOWN`, `SNAPSHOT_SECRET_LIKE`.

## 7. Boundaries

- Reserve policy, time-window economics and route selection are separately governed
  layers; this contract represents observed pool state and references only;
- nothing here authorizes execution, changes routing behavior, or activates any live
  route/collector;
- secret-like snapshot material is rejected, never persisted.

## 8. Codex app-server secondary observation

The Codex app-server `account/rateLimits/read` adapter is a secondary,
observation-only cross-check for the existing
`chatgpt_codex_subscription` pool. It is not a second pool and its values are
never added to the OpenClaw primary observation. The source semantics are
`usedPercent`, so the adapter derives `remaining_percent` as
`clamp(100 - usedPercent, 0, 100)` and applies the MIN law across fresh
required 5h and weekly binding windows.

OpenClaw remains routing authority. A secondary mismatch is diagnostic only;
stale or missing observations do not promote the secondary into routing
authority. Banked reset credits are advisory and do not change effective
capacity. No reset-credit consumption operation is part of this contract.

**End of contract.**
