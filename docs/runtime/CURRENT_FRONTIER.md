# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source lanes **APPLIED LIVE (56 nodes)** · RESOURCE_STATUS control-plane composer **OFFLINE COMPLETE** |
| **BLOCCO ATTIVO** | `V4_RESOURCE_STATUS_LOCAL_RUNTIME_READONLY_CONTRIBUTION_ADAPTER` |
| **STATO BLOCCO** | WF40_56_NODES / STATUS_SOURCE_CONTRACT_COMPLETE / COMPOSER_COMPLETE / LOCAL_READONLY_CONTRIBUTION_ADAPTER_PENDING / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no live OpenCode/Qwen/provider generation authorized · next block is read-only contribution producer only |
| **NEXT** | `V4_RESOURCE_STATUS_LOCAL_RUNTIME_READONLY_CONTRIBUTION_ADAPTER` — first real contribution producer for `qwen_local` + `opencode` using READ-ONLY evidence only. Mandatory shared-runtime occupancy classification; never start/restart/stop/kill Qwen; never generate; never run OpenCode for proof; emit `v4-resource-status-contribution-v1`; remain separately gated from the pure composer. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · route-source + routing lanes installed · no downstream executor |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **N8N ROUTING BRIDGE v1** | **COMMITTED** · explicit sidecars required · `dispatch_prepared=false` · `execution_performed=false` |
| **SIDECAR SOURCE ADAPTER** | **COMMITTED** · consumes explicit RESOURCE_STATUS or fail-closed baseline |
| **RESOURCE_STATUS SOURCE CONTRACT** | `docs/contracts/v4-resource-status-control-plane-source-v1.md` · contribution schema authored |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · registry-closed · 300s freshness · Qwen READY_IDLE hard gate · offline tests **PASS 34/34** |

## Installed execution-routing seam

```text
same-commit GPT-Web route source
  -> deterministic sidecar-source adapter
  -> explicit execution_route_request + resource_status
  -> WF61 planner
  -> V4 execution-routing bridge
  -> route/adapter metadata only
```

No executor dispatch is wired downstream yet.

## RESOURCE_STATUS composition

- Output key set follows canonical `RESOURCE_REGISTRY` (including synthetic unavailable shell for registry-only resources such as `composer`).
- Composition seed is fail-closed; missing observations never imply availability.
- Contributions are explicit `v4-resource-status-contribution-v1` objects.
- `reserve_floor` remains control-plane policy (baseline / safe default).
- Max contribution/resource observation age: **300 seconds**.
- Deterministic precedence: `local_probe > provider_api > dashboard_snapshot > internal_ledger > manual`.
- Same-rank/same-time conflicting observations fail closed.
- Composer invokes zero collectors.

## Qwen shared-runtime boundary

`qwen_local.available=true` requires explicit fresh evidence:

- `source=local_probe`;
- evidence `kind=qwen_occupancy`;
- classification exactly `QWEN_READY_IDLE`;
- `launch_performed=false`;
- `generation_calls=0`.

`QWEN_BUSY_SHARED_RUNTIME`, `QWEN_OCCUPANCY_UNCERTAIN` and `QWEN_NOT_RUNNING_SAFE_TO_START` remain unavailable.

The composer does not invoke `ensureQwenLocalReady` or `collect-qwen-local-resource-status-v1.mjs`.

## Authorization / D-0025

- D-0025: **CLOSED**.
- No live OpenCode/Qwen/provider call authorized.
- Next contribution adapter remains separately gated and read-only.

## Boundaries

- No WF40/WF61 mutation or execution in the composer block (complete).
- Do not implement the local read-only contribution producer in this frontier advance beyond naming NEXT.
- No separate V4 n8n workflow.
- No LiteLLM/OpenClaw/network/secret mutation.

## Puntatori

- Composer: `tools/compose-v4-resource-status-control-plane-v1.mjs`
- Result schema: `docs/contracts/v4-resource-status-control-plane-source-result-v1.schema.json`
- Composer report: `reports/architecture/v4_resource_status_control_plane_composer_offline.md`
- Source contract: `docs/contracts/v4-resource-status-control-plane-source-v1.md`
- Contribution schema: `docs/contracts/v4-resource-status-contribution-v1.schema.json`
- RESOURCE_STATUS schema: `docs/contracts/resource-status-v1.schema.json`
- Fail-closed baseline: `configs/resources/status.fail-closed.json`
- RESOURCE_REGISTRY: `configs/resources/registry.json`
- Qwen standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- WF40 id: `9ZMj2ACTKyDVhCue`
