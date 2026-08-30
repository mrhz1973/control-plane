# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 execution-routing lane **APPLIED LIVE** · sidecar source contract **GPT-WEB AUTHORED** · sidecar source adapter **OFFLINE COMPLETE** |
| **BLOCCO ATTIVO** | `V4_WF40_SIDECAR_SOURCE_PATCH_AUTHORING` |
| **STATO BLOCCO** | WF40_PATCH_APPLIED / SIDECAR_SOURCE_CONTRACT_COMPLETE / SIDECAR_SOURCE_ADAPTER_COMPLETE / WF40_SOURCE_PATCH_PENDING / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no live OpenCode/Qwen/provider generation authorized · next block is GPT-Web patch authoring only |
| **NEXT** | `V4_WF40_SIDECAR_SOURCE_PATCH_AUTHORING` — GPT-Web-owned additive WF40 delta: fetch same-commit `docs/runtime/EXECUTION_ROUTE_<task_id>.json`, invoke `build-v4-execution-routing-sidecars-v1`, place `execution_route_request` + `resource_status` onto the item before the installed V4 sidecar capture node. Do not mutate WF40 in Cursor until that artifact exists. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **50 nodes** · versionId `067a6b82-70a0-44dd-88fc-c8e9973f13bc` · V4 routing lane installed · no downstream executor |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **N8N ROUTING BRIDGE v1** | **COMMITTED** · explicit sidecars required · `dispatch_prepared=false` · `execution_performed=false` |
| **SIDECAR SOURCE CONTRACT** | `docs/contracts/v4-execution-route-sidecar-source-v1.md` · route source persistent/GPT-Web-authored · RESOURCE_STATUS transient/separate · 300s freshness · fail-closed baseline fallback |
| **SIDECAR SOURCE ADAPTER** | `tools/build-v4-execution-routing-sidecars-v1.mjs` · bundle schema `v4-execution-routing-sidecar-bundle-v1` · bindings enforced · status consume-only · offline tests **PASS 24/24** |

## Canonical sidecar source

- Route source path: `docs/runtime/EXECUTION_ROUTE_<TASK_ID>.json`.
- Route source and backlog MUST be fetched from the same Git commit.
- `task_id` must equal backlog id; `source_backlog_path` exact; `created_by=gpt-web`.
- `technical_requirements` are explicit GPT-Web values; never synthesized from packet/goal/paths/planner/classifier/chat.
- `risk_level` must equal backlog `risk_hint`.
- Deterministic route request mapping: `request_id = task_id`; requirements/risk copied verbatim.
- RESOURCE_STATUS explicit transient snapshot must validate and be <=300 seconds old; otherwise use committed `configs/resources/status.fail-closed.json`.
- The sidecar source adapter consumes status only; it does not call status collectors.

## Authorization / D-0025

- D-0025: **CLOSED**.
- No live OpenCode/Qwen/provider call authorized.
- Existing `collect-qwen-local-resource-status-v1.mjs` is not automatically invoked by the source adapter.
- Qwen shared-runtime occupancy rules remain mandatory for any later live collector.

## Boundaries

- No WF40/WF61 execution or mutation until GPT-Web authors the sidecar-source patch artifact.
- No provider/dashboard/network status collection in the source-adapter block (complete).
- No synthesis of missing route semantics.
- No separate V4 n8n workflow.
- No LiteLLM/OpenClaw/network/secret mutation.

## Puntatori

- Sidecar source contract: `docs/contracts/v4-execution-route-sidecar-source-v1.md` (+ `.schema.json`)
- Bundle schema: `docs/contracts/v4-execution-routing-sidecar-bundle-v1.schema.json`
- Adapter tool: `tools/build-v4-execution-routing-sidecars-v1.mjs`
- Adapter tests: `tests/v4-execution-route-sidecar-source/run.mjs`
- Adapter report: `reports/architecture/v4_execution_route_sidecar_source_adapter_offline.md`
- Source contract report: `reports/architecture/v4_execution_route_sidecar_source_contract.md`
- WF40 apply report: `reports/architecture/v4_wf40_execution_routing_patch_apply_offline.md`
- Bridge tool: `tools/n8n-v4-execution-routing-bridge-v1.mjs`
- RESOURCE_STATUS schema: `docs/contracts/resource-status-v1.schema.json`
- Fail-closed status baseline: `configs/resources/status.fail-closed.json`
