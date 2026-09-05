# RESOURCE_REGISTRY v2 — model / access-surface / quota-pool

**Repository:** `mrhz1973/control-plane`
**Document:** `docs/contracts/resource-registry-v2.md`
**Schema:** `docs/contracts/resource-registry-v2.schema.json`
**Canonical data:** `configs/resources/registry.json` (`schema_version: "resource-registry-v2"`)
**Version:** `resource-registry-v2`
**Date:** 2026-09-05
**Parent issues:** #32 (method), #37 (this slice)
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

First implementation slice of #32: the canonical static registry now separates

```text
MODEL / ROLE
   -> ACCESS SURFACE
      -> QUOTA_POOL
```

so that one shared commercial allowance is represented once and can never be
double-counted as multiple independent model quotas.

This registry remains **static**: capabilities, identities and relationships only.
It does not observe, collect, or decide. Dynamic quota/usage/reset state stays in
`resource-status-v1` observations exactly as before.

## 1. Structure

| Section | Content |
|---|---|
| `registry_metadata` | version, purpose, compatibility policy, dynamic-data policy |
| `models` | distinct model identities (incl. `provider_managed_selection` for refreshable provider-managed selections) |
| `access_surfaces` | concrete ways to reach models (IDE extension, external CLI worker, local harness, BYOK, hosted route, plan client) |
| `quota_pools` | commercial allowances; each pool exists exactly once |
| `resources` | **verbatim resource-registry-v1 projection** (compatibility, see §3) |

Key invariants (schema-enforced or test-enforced):

- every `quota_pool_id` on an access surface references an existing `quota_pools` key or is `null`;
- `chatgpt_codex_subscription` is referenced by **both** `codex_ide_cursor_extension`
  and `codex_external_planner` (shared, not duplicated per model);
- `glm-5.3` and `glm-5.3-flash` are **distinct models** and both draw from the single
  `glm_coding_plan` pool (`shared_by_models` + surface references);
- Codex surfaces allow **only** `chatgpt_subscription` auth and forbid
  `openai_api_key` / `byok_openai` / `api_billing`;
- `openai_api_route` exists **only** as a `representational_only`, `status: "forbidden"`
  entry with `quota_pool_id: null` so fail-closed checks can assert that no OpenAI
  API/BYOK route exists. It is not a usable surface;
- Cursor is a **harness/host** (`host_harness: "cursor"` on surfaces), never a quota pool.
  `cursor_native_model_route` has `quota_pool_id: null` and explicit
  `allowance_ownership.state: "unverified"` — no invented pool, no invented numbers;
- `opencode_local_harness` has `quota_pool_id: null` and
  `commercial_quota: "none_local_unmetered"` — local compute is not commercial quota;
- no pool contains any numeric quota/usage/reset/multiplier value; pools carry
  `dynamic_values: "forbidden_in_registry"` and an allowlist of permitted observation
  sources (`dashboard_snapshot`, future normalized collector);
- Codex model selection is `selection: "dynamic"`, `frozen_list: false`: the models
  observed on 2026-09-05 (Sol/Terra/Luna/Astra) are deliberately **not** frozen here;
  model/reasoning/speed choices are per-invocation route metadata;
- every `model_selection_policy.frozen_list` is `false` (schema `const`).

## 2. What changed vs v1

- v1 remains available as data (see §3); nothing is deleted.
- New sections `models`, `access_surfaces`, `quota_pools` express relationships v1
  could not (shared pools, forbidden auth, unverified allowance ownership).
- v1 `resources.glm` / `resources.codex` entries keep their v1 semantics (the coarse
  v1 model identities) until v1 consumers are migrated; the v2 model identities
  (`glm-5.3`, `glm-5.3-flash`, `codex_subscription_models`) are finer-grained and
  additive. Mapping guidance for the later consumer-migration pass:
  - v1 `glm` ↔ v2 `glm-5.3` (+ `glm-5.3-flash`) via `glm_coding_plan_client`;
  - v1 `codex` ↔ v2 `codex_subscription_models` via `codex_external_planner`;
  - v1 `composer` ↔ v2 `composer` via `cursor_native_model_route`;
  - v1 `qwen_local` ↔ v2 `qwen_local` via `opencode_local_harness`.
  This mapping is documentation for the future migration; no consumer applies it yet.

## 3. Compatibility strategy (v1 projection)

`resources` is the previous canonical `resource-registry-v1` object preserved
verbatim (same keys, same fields, same values). Consumer impact from the census:

| Consumer (direct) | Reads | Change needed |
|---|---|---|
| `tools/evaluate-execution-route.mjs` | `schema_version`, `resources.*` | accept `"resource-registry-v2"` in addition to `"resource-registry-v1"` (behaviour unchanged) |
| `tools/n8n-v4-execution-routing-bridge-v1.mjs` | `schema_version`, passes registry to router | same one-line acceptance |
| `tools/compose-v4-resource-status-control-plane-v1.mjs` | whole object via `validateResourceRegistryObject`, then `resources.*` | validator shim (below) makes it v2-compatible with zero behaviour change |
| `tools/validate-resource-registry-v1.mjs` | whole object | projects v2 → v1 (`{ schema_version: v1, resources }`) before validating; validates `resources` against v1 schema + semantics |
| `configs/resources/status.fail-closed.json` | — | untouched (keyed by resource id, unchanged) |
| tests (`execution-router`, `v4-resource-status-control-plane-source`, `qwen-local-resource-status-overlay`, `qwen-local-adapter`, `v4-execution-adapter-registry`, `resource-registry-validator`) | `resources.*` / validator / router | none (they read the projection or the shimmed validator); plus new focused registry-v2 suite |

Rules:

- v1 consumers MUST NOT read `models` / `access_surfaces` / `quota_pools`;
- the projection is removed only by a later, separately governed pass after every
  v1 consumer is migrated (`registry_metadata.compatibility.removal_policy`);
- no live workflow, n8n, dispatcher, Tailscale, router, credential or authorization
  behaviour changes in this slice.

## 4. Fail-closed / unknown handling

- Unknown or unverified allowance ownership is represented explicitly
  (`allowance_ownership.state: "unverified"`) — never fabricated;
- surfaces not yet runtime-qualified carry `qualification.runtime_qualified: false`
  and must not be auto-routed (future router slices must treat them as non-selectable
  until separately qualified);
- dynamic quota values in this registry are forbidden (`dynamic_values:
  "forbidden_in_registry"`); quota state can only come from governed
  `resource-status-v1` observations with source + freshness rules unchanged;
- any future access surface requiring OpenAI API/BYOK auth is invalid by schema
  intent and must fail review: only the `representational_only` forbidden entry may
  use `surface_type: "none"`.

## 5. Out of scope for this slice

Live quota collectors/translators, time-window economics, router policy changes,
Codex IDE-in-Cursor runtime qualification, consumer migration off the projection,
Astra qualification, n8n/workflow changes, provider calls of any kind.

**End of contract.**
