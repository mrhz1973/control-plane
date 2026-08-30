# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | n8n V4 execution-routing bridge **COMMITTED** · GPT-Web WF40 additive routing patch **AUTHORED / NOT APPLIED** · explicit sidecars required · no synthesized technical requirements |
| **BLOCCO ATTIVO** | `V4_WF40_EXECUTION_ROUTING_PATCH_APPLY_OFFLINE` |
| **STATO BLOCCO** | PATCH_AUTHORED_GPT_WEB / WF40_EXPECTED_44_NODES / TARGET_AFTER_50_NODES / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no live OpenCode/Qwen/provider generation authorized · patch validation must use zero workflow executions |
| **NEXT** | `V4_WF40_EXECUTION_ROUTING_PATCH_APPLY_OFFLINE` — apply `workflows/patches/v4-wf40-execution-routing-bridge.gpt-web.json` **verbatim** to live WF40 after secret-safe structural precheck. Preserve all existing 44 nodes/legacy lanes, add exactly six V4 nodes, keep WF61 inactive and D-0025 gate closed, perform no workflow execution/provider/model call. |
| **WF40 LIVE** | active · preserved v3.2 foundation · patch not yet applied |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **ADAPTER REGISTRY v1** | **IMPLEMENTED** · default `opencode+qwen_local` |
| **N8N ROUTING BRIDGE v1** | **COMMITTED** · route→adapter metadata only · no dispatch/execution |
| **WF40 V4 PATCH** | `workflows/patches/v4-wf40-execution-routing-bridge.gpt-web.json` · GPT-Web-authored · not applied |

## Patch semantics

- Existing primary-remote TRUE lane gains one transparent pre-WF61 sidecar-capture node.
- WF61 remains the same child planner workflow.
- After WF61, the patch adds bridge-input preparation, fail-closed input gate, bridge Execute Command, parsed terminal result, and closed-sidecar terminal result.
- Expected node count: **44 → 50**.
- `execution_route_request` is explicit input only.
- `resource_status` is explicit input only.
- Missing sidecars => `V4_ROUTE_SIDECAR_MISSING`; the V4 bridge command is not invoked.
- `technical_requirements` are never synthesized.
- No executor dispatch is connected downstream.

## Authorization / D-0025

- D-0025: **CLOSED**.
- All prior live-proof AUTH spent/non-reusable.
- No live OpenCode/Qwen/provider call authorized.
- This patch-apply block authorizes only the exact GPT-Web-authored workflow delta and structural verification.

## Boundaries

- Workflow authority remains GPT Web; Cursor may only persist/apply the exact authored artifact.
- Do not create another V4 n8n workflow.
- Do not execute WF40 or WF61 for validation.
- Do not call the new bridge during apply validation.
- Do not mutate WF60/OpenClaw/LiteLLM/network/credentials/secrets.
- Do not collect live Qwen status or manipulate Qwen/Ollama/llama-server/OpenCode.
- External single-generation guard remains the hard max-one generation ceiling for future OpenCode execution.

## Puntatori

- GPT-Web patch: `workflows/patches/v4-wf40-execution-routing-bridge.gpt-web.json`
- Authoring report: `reports/architecture/v4_wf40_execution_routing_patch_authoring.md`
- Bridge report: `reports/architecture/v4_n8n_execution_routing_bridge_integration_offline.md`
- Bridge contract: `docs/contracts/n8n-v4-execution-routing-bridge-v1.md`
- Bridge tool: `tools/n8n-v4-execution-routing-bridge-v1.mjs`
- Mount path: `/files/handoff-runtime/control-plane`
- WF40 id: `9ZMj2ACTKyDVhCue`
- WF61 id: `d0025-6100-4001-8001-000000000061`
