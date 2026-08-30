# V4 — RESOURCE_STATUS control-plane source contract

**Block ID:** `V4_RESOURCE_STATUS_CONTROL_PLANE_SOURCE_CONTRACT`  
**Authority:** GPT Web  
**Starting origin/main:** `7df1802b1ab2d5cc4129f719516279b43eee2e1b`  
**Workflow mutation:** 0  
**Provider/model/Qwen/OpenCode calls:** 0

## Result

**PASS — governed transient RESOURCE_STATUS source contract authored.**

Canonical artifacts:

- `docs/contracts/v4-resource-status-control-plane-source-v1.md`
- `docs/contracts/v4-resource-status-contribution-v1.schema.json`

## Decision

The control-plane source is a pure composer, not a collector.

It composes a fresh `resource-status-v1` from:

1. canonical `RESOURCE_REGISTRY`;
2. committed fail-closed baseline;
3. zero or more explicit transient observation contributions;
4. an evaluation clock.

Missing/stale/ambiguous observations leave affected resources fail-closed.

The composer never infers availability and never calls dashboards, providers, Qwen, OpenCode or n8n.

## Contribution model

`v4-resource-status-contribution-v1` carries observed availability/quota/reset/cost/location/freshness plus bounded evidence. It deliberately excludes `reserve_floor`, which remains control-plane policy.

Maximum observation age: **300 seconds**.

Source precedence is deterministic:

`local_probe > provider_api > dashboard_snapshot > internal_ledger > manual`.

Same-rank/same-time conflicting observations fail closed.

## Registry closure

Output covers every canonical registry resource. A registry resource absent from the older committed baseline receives a safe synthetic unavailable shell only; this permits newer registry entries such as `composer` to remain explicitly unavailable rather than disappearing from the snapshot.

## Qwen boundary

`qwen_local.available=true` requires fresh read-only occupancy evidence with:

- `QWEN_READY_IDLE`;
- `launch_performed=false`;
- `generation_calls=0`.

BUSY, UNCERTAIN and NOT_RUNNING classifications remain unavailable.

The composer is explicitly forbidden from automatically invoking `collect-qwen-local-resource-status-v1.mjs` or `ensureQwenLocalReady`, because status composition itself must not start/restore/consume the shared runtime.

## Cloud quota boundary

Provider/dashboard/manual data must be normalized into `quota_remaining` by source-specific translators before composition. The composer does not interpret UI prose or perform used→remaining conversion.

## Counters

```yaml
workflow_mutations: 0
workflow_execution_calls: 0
provider_calls: 0
qwen_generation_calls: 0
qwen_runtime_mutations: 0
opencode_execution_count: 0
network_mutations: 0
secret_exposure: false
```

## NEXT

`V4_RESOURCE_STATUS_CONTROL_PLANE_COMPOSER_OFFLINE`

Implement pure offline composition + validation + tests only. No collectors and no workflow wiring.
