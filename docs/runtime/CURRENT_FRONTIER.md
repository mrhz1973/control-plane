# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 execution-routing lane **APPLIED LIVE** · sidecar source contract + adapter complete · GPT-Web sidecar-source WF40 patch **AUTHORED / NOT APPLIED** |
| **BLOCCO ATTIVO** | `V4_WF40_SIDECAR_SOURCE_PATCH_APPLY_OFFLINE` |
| **STATO BLOCCO** | WF40_50_NODES / SIDECAR_SOURCE_ADAPTER_COMPLETE / PATCH_AUTHORED_GPT_WEB / TARGET_56_NODES / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no live OpenCode/Qwen/provider generation authorized · patch validation must use zero workflow executions/status collection |
| **NEXT** | `V4_WF40_SIDECAR_SOURCE_PATCH_APPLY_OFFLINE` — apply `workflows/patches/v4-wf40-sidecar-source.gpt-web.json` **verbatim** after secret-safe structural precheck. Preserve all existing 50 nodes, add exactly six sidecar-source nodes, keep WF61 inactive and D-0025 gate closed, perform no workflow execution/provider/model/Qwen/status-collector call. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **50 nodes** · versionId `067a6b82-70a0-44dd-88fc-c8e9973f13bc` · routing lane installed · sidecar-source patch pending |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **N8N ROUTING BRIDGE v1** | **COMMITTED** · explicit sidecars required · `dispatch_prepared=false` · `execution_performed=false` |
| **SIDECAR SOURCE ADAPTER** | **COMMITTED** · `tools/build-v4-execution-routing-sidecars-v1.mjs` · target 24/24 PASS · consume-only RESOURCE_STATUS |
| **WF40 SIDECAR SOURCE PATCH** | `workflows/patches/v4-wf40-sidecar-source.gpt-web.json` · GPT-Web-authored · **not applied** · expected 50→56 |

## Patch semantics

- Existing remote-planner TRUE branch is extended before the already-installed V4 sidecar capture node.
- Same-commit route source is fetched from `docs/runtime/EXECUTION_ROUTE_<TASK_ID>.json` using the exact backlog commit SHA.
- The deterministic source adapter constructs `execution_route_request`; `technical_requirements` are never synthesized.
- Optional explicit upstream `resource_status` is consumed only when already present; otherwise the adapter uses committed fail-closed baseline.
- Route-source failure terminates before WF61.
- No status collector is invoked by the patch.
- No executor dispatch is added downstream.

## Authorization / D-0025

- D-0025: **CLOSED**.
- No live OpenCode/Qwen/provider call authorized.
- Existing `collect-qwen-local-resource-status-v1.mjs` remains outside this patch.
- No Qwen/Ollama/llama-server/OpenCode process manipulation is authorized.

## Boundaries

- Workflow authority remains GPT Web; Cursor may only apply the exact authored artifact.
- Do not execute WF40/WF61/source-adapter/bridge for apply validation.
- Do not collect live RESOURCE_STATUS during apply validation.
- Do not create a separate V4 n8n workflow.
- Do not mutate WF60/OpenClaw/LiteLLM/network/credentials/secrets.
- Existing external single-generation guard remains the future hard max-one generation boundary.

## Puntatori

- GPT-Web patch: `workflows/patches/v4-wf40-sidecar-source.gpt-web.json`
- Authoring report: `reports/architecture/v4_wf40_sidecar_source_patch_authoring.md`
- Source contract: `docs/contracts/v4-execution-route-sidecar-source-v1.md`
- Source adapter: `tools/build-v4-execution-routing-sidecars-v1.mjs`
- Source adapter report: `reports/architecture/v4_execution_route_sidecar_source_adapter_offline.md`
- Existing WF40 routing patch: `workflows/patches/v4-wf40-execution-routing-bridge.gpt-web.json`
- WF40 id: `9ZMj2ACTKyDVhCue`
- WF61 id: `d0025-6100-4001-8001-000000000061`
