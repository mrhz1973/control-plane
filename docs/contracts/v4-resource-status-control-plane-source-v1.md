# V4 RESOURCE_STATUS control-plane source v1

**Repository:** `mrhz1973/control-plane`  
**Version:** `v4-resource-status-control-plane-source-v1`  
**Authority:** GPT Web  
**Runtime authorized by this document:** **NO**

## 0. Purpose

Define the governed control-plane source that composes one transient `resource-status-v1` snapshot for the already-installed WF40 V4 execution-routing seam.

This layer is deliberately separate from:

- `RESOURCE_REGISTRY` static capabilities;
- GPT-Web route-source semantics / `technical_requirements`;
- execution authorization;
- model/provider execution.

The control-plane source **composes observations**. It does not collect them and does not make model calls.

Canonical parents:

- `docs/contracts/resource-status-v1.schema.json`
- `configs/resources/status.fail-closed.json`
- `configs/resources/registry.json`
- `docs/contracts/v4-execution-route-sidecar-source-v1.md`
- `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`

Observation contribution schema:

`docs/contracts/v4-resource-status-contribution-v1.schema.json`

## 1. Output

The composer emits exactly one schema-valid `resource-status-v1` object plus non-secret composition evidence.

The `resource-status-v1.generated_at` value is the composition evaluation time.

Every resource currently present in canonical `resource-registry-v1` must have an output status entry.

Missing observations never imply availability.

## 2. Inputs

The future composer accepts only:

1. canonical `configs/resources/registry.json`;
2. canonical `configs/resources/status.fail-closed.json`;
3. zero or more explicit `v4-resource-status-contribution-v1` objects;
4. an explicit/injectable evaluation clock.

It MUST NOT fetch dashboards, call provider APIs, inspect browser sessions, probe Qwen, invoke OpenCode, execute n8n, or start subprocess collectors by itself.

A contribution is an already-collected transient observation. The mechanism that created it remains separately governed.

## 3. Contribution semantics

A contribution contains:

- `contribution_id` — unique non-empty identity;
- `producer_id` — explicit producer identity;
- `source` — `provider_api | internal_ledger | dashboard_snapshot | local_probe | manual`;
- `produced_at` — observation bundle timestamp;
- `resources` — one or more observed resource entries.

Observed entries contain operational fields only:

- `available`;
- `quota_remaining`;
- `reset_at`;
- `cost_mode`;
- `location`;
- `updated_at`;
- bounded evidence.

A contribution MUST NOT contain `reserve_floor`.

`reserve_floor` is control-plane policy, not an observed provider/dashboard/local-probe fact.

For v1 the composer preserves the fail-closed baseline `reserve_floor` for resources already present there. For a registry resource absent from the baseline, v1 uses the safe policy default `{ "value": 0, "unit": "none" }` until a separately governed reserve-policy contract exists.

## 4. Registry closure / fail-closed seed

Composition starts from the committed fail-closed baseline, but the output resource key set is driven by `RESOURCE_REGISTRY`.

For each registry resource:

- if the baseline has an entry, clone its fail-closed entry;
- if the baseline lacks the resource, synthesize only this safe unavailable shell:

```json
{
  "available": false,
  "quota_remaining": {"value": null, "unit": "unknown"},
  "reserve_floor": {"value": 0, "unit": "none"},
  "reset_at": null,
  "cost_mode": "unknown",
  "location": "<registry execution_location when representable, else unknown>",
  "source": "unknown",
  "updated_at": "<composition time>"
}
```

This shell is a fail-closed state only. It is not evidence that the resource was probed.

A contribution referencing a resource not present in `RESOURCE_REGISTRY` is invalid and cannot create a new resource.

## 5. Freshness

A positive or negative observation contribution is usable only when all are true:

- contribution validates structurally;
- `produced_at <= evaluation_time`;
- each selected resource `updated_at <= evaluation_time`;
- contribution age is at most **300 seconds**;
- selected resource observation age is at most **300 seconds**;
- contribution contains no secret-like material.

Stale, future-dated, malformed or secret-like observations are ignored for selection; the affected resource remains fail-closed unless another valid contribution exists.

The composer MUST NOT restamp an old observation to make it fresh.

## 6. Source compatibility

Source/location combinations are constrained:

- `local_probe` may positively assert availability only for registry resources whose execution location is `local`;
- `provider_api`, `dashboard_snapshot` and `internal_ledger` may positively assert availability only for non-local resources;
- `manual` may describe any resource, but cannot make `qwen_local` available without the Qwen-specific evidence in §8;
- `unknown` is not an accepted contribution source.

An incompatible contribution is ignored for that resource and cannot make it selectable.

## 7. Deterministic precedence

After structural/source/freshness filtering, the winning contribution for each resource is chosen deterministically by source priority:

1. `local_probe`
2. `provider_api`
3. `dashboard_snapshot`
4. `internal_ledger`
5. `manual`

Within the same source priority, the newest `updated_at` wins.

If two equally ranked observations have the same `updated_at` but materially different status values, the resource fails closed rather than choosing arbitrarily.

No semantic model arbitration is allowed in RESOURCE_STATUS composition.

The winning observation supplies:

- `available`;
- `quota_remaining`;
- `reset_at`;
- `cost_mode`;
- `location`;
- `source` (copied from contribution source);
- `updated_at`.

The composer preserves/injects `reserve_floor` separately per §3–4.

## 8. Mandatory Qwen shared-runtime rule

`qwen_local.available=true` is a special case.

A contribution may make `qwen_local` available only when all are true:

- contribution `source == local_probe`;
- evidence kind is `qwen_occupancy`;
- evidence classification is exactly `QWEN_READY_IDLE`;
- `launch_performed == false`;
- `generation_calls == 0`;
- observation is fresh under §5.

The following classifications MUST result in `qwen_local.available=false`:

- `QWEN_BUSY_SHARED_RUNTIME`;
- `QWEN_OCCUPANCY_UNCERTAIN`;
- `QWEN_NOT_RUNNING_SAFE_TO_START`.

`QWEN_NOT_RUNNING_SAFE_TO_START` means a later authorized task may start Qwen; it does **not** mean Qwen is currently selectable.

This composer MUST NOT call `ensureQwenLocalReady`.

It MUST NOT automatically invoke `tools/collect-qwen-local-resource-status-v1.mjs`, because that collector currently reaches the session manager and may perform readiness restoration/start under its own bounded context.

A future Qwen status producer must first implement the standing read-only occupancy check and emit a contribution without generation, restart, stop or kill.

No process may be terminated/restarted merely to make `qwen_local` available.

## 9. OpenCode and other local resources

A local probe may mark `opencode` available only from fresh read-only evidence that the dispatch interface is usable.

The composer does not run OpenCode to prove availability.

A failed/ambiguous local probe leaves the resource unavailable.

## 10. Cloud resources and quota

Cloud resource observations may come from separately governed:

- provider/API metadata collectors;
- internal consumption ledgers;
- dashboard snapshots;
- explicit manual snapshots.

The composer consumes already-normalized `quota_remaining` values only.

It MUST NOT interpret dashboard prose such as “29% used” or convert used→remaining percentages itself. A future source-specific translator must perform that deterministic mapping and emit a schema-valid contribution.

Provider/model inference calls are never allowed merely to discover quota or availability.

## 11. Secret boundary

Contributions and composed evidence must not contain:

- API keys;
- bearer tokens;
- passwords;
- cookies/session material;
- credential values;
- secret hashes/measurements.

Credential metadata is not required for composition.

Secret-like contribution content is rejected and does not become RESOURCE_STATUS.

## 12. Composition result evidence

The future composer should return a wrapper such as:

```json
{
  "schema_version": "v4-resource-status-control-plane-source-result-v1",
  "ok": true,
  "classification": "PASS_RESOURCE_STATUS_COMPOSED",
  "resource_status": {},
  "resource_decisions": {
    "qwen_local": {
      "selected_contribution_id": null,
      "selected_source": "unknown",
      "classification": "FAIL_CLOSED_NO_VALID_OBSERVATION"
    }
  },
  "reason_codes": []
}
```

Evidence remains non-secret and must not persist raw provider/dashboard payloads.

The installed WF40 seam consumes only `resource_status`.

## 13. Fail-closed classifications

At minimum implementation must distinguish:

- `PASS_RESOURCE_STATUS_COMPOSED`;
- `CONTRIBUTION_SCHEMA_INVALID`;
- `CONTRIBUTION_STALE`;
- `CONTRIBUTION_FUTURE_DATED`;
- `CONTRIBUTION_SECRET_LIKE`;
- `CONTRIBUTION_RESOURCE_UNKNOWN`;
- `CONTRIBUTION_SOURCE_INCOMPATIBLE`;
- `CONTRIBUTION_CONFLICT_FAIL_CLOSED`;
- `QWEN_READY_IDLE_ACCEPTED`;
- `QWEN_BUSY_FAIL_CLOSED`;
- `QWEN_OCCUPANCY_UNCERTAIN_FAIL_CLOSED`;
- `QWEN_NOT_RUNNING_FAIL_CLOSED`;
- `FAIL_CLOSED_NO_VALID_OBSERVATION`.

A bad contribution does not invalidate the entire composed snapshot when a safe fail-closed resource entry can be emitted.

Invalid registry or invalid baseline is a whole-composer failure.

## 14. No authorization amplification

RESOURCE_STATUS answers only: “what resources are presently selectable under observed state + reserve policy?”

It does not authorize:

- provider/model calls;
- Qwen start/generation;
- OpenCode execution;
- n8n workflow execution;
- dispatch;
- credential/network mutation;
- route semantics;
- `technical_requirements`;
- planner selection changes.

A resource may be `available=true` and still be blocked by a later authorization/policy gate.

## 15. Next implementation boundary

Next block:

`V4_RESOURCE_STATUS_CONTROL_PLANE_COMPOSER_OFFLINE`

It may implement only:

- contribution validation;
- deterministic composition/precedence;
- registry closure;
- Qwen evidence gating as pure data validation;
- non-secret result evidence;
- offline tests.

It MUST NOT implement collectors, dashboard access, provider calls, Qwen probes, workflow wiring or live execution.

After the offline composer is complete, individual contribution producers can be added as separately bounded source adapters.
