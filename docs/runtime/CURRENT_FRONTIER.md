# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 execution-routing lane **APPLIED LIVE** · 44→50 · exact GPT-Web delta · metadata-only · zero executions |
| **BLOCCO ATTIVO** | `V4_EXECUTION_ROUTE_SIDECAR_SOURCE_CONTRACT` |
| **STATO BLOCCO** | WF40_PATCH_APPLIED / GATE_CLOSED / SIDECAR_SOURCE_NEEDED |
| **GATE CORRENTE** | **CLOSED** · D-0025 `enabled=false` · `provider_calls_authorized_per_event=0` · no live OpenCode/Qwen/provider generation authorized without a later fresh AUTH |
| **NEXT** | `V4_EXECUTION_ROUTE_SIDECAR_SOURCE_CONTRACT` — define the canonical explicit source for `execution-route-request-v1` + RESOURCE_STATUS snapshot so WF40 can feed the installed bridge lane without inventing technical_requirements. Do **not** implement that source in the apply pass (already satisfied). |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **50 nodes** · versionId `067a6b82-70a0-44dd-88fc-c8e9973f13bc` · V4 routing lane installed · no downstream executor |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **N8N ROUTING BRIDGE v1** | **COMMITTED** · invoked by WF40 Execute Command only when explicit sidecars present · `dispatch_prepared=false` · `execution_performed=false` |

## Authorization / D-0025

- D-0025: **CLOSED** (not reopened)
- V4 lane remains fail-closed without explicit `execution_route_request` + `resource_status` sidecars
- No live OpenCode/Qwen/provider call authorized by this apply

## Boundaries

- Do **not** synthesize technical_requirements from packet/goal/paths/planner/classifier/chat.
- External single-generation guard remains the hard max-one generation ceiling for OpenCode.
- No WF40/WF61 execution was used to validate this apply.
- No LiteLLM/OpenClaw/network/secret mutation.

## Puntatori

- Apply report: `reports/architecture/v4_wf40_execution_routing_patch_apply_offline.md`
- Patch artifact: `workflows/patches/v4-wf40-execution-routing-bridge.gpt-web.json`
- Bridge tool: `tools/n8n-v4-execution-routing-bridge-v1.mjs`
- Bridge contract: `docs/contracts/n8n-v4-execution-routing-bridge-v1.md`
- Mount: `/files/handoff-runtime/control-plane`
