# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | n8n V4 execution-routing bridge **COMMITTED** · offline · route→adapter metadata ready · `ROUTING_READY_FOR_DISPATCH` · workflow mutations=0 |
| **BLOCCO ATTIVO** | `V4_WF40_EXECUTION_ROUTING_PATCH_AUTHORING` |
| **STATO BLOCCO** | BRIDGE_COMPLETE / TARGET_23_OF_23 / REGRESSIONS_PASS / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no live OpenCode/Qwen/provider generation authorized without a later fresh AUTH |
| **NEXT** | `V4_WF40_EXECUTION_ROUTING_PATCH_AUTHORING` — **GPT-Web-owned**. Author the exact additive WF40 workflow delta that invokes `tools/n8n-v4-execution-routing-bridge-v1.mjs` through `/files/handoff-runtime/control-plane`. Preserve all 44 WF40 nodes, planner/Telegram/GIS/Data Table lanes, WF60 fallback, WF61 planner lane. No separate V4 n8n workflow. Fail-closed execution authorization. Do **not** author that patch in Cursor. |
| **WF40 LIVE** | active · preserved v3.2 foundation · awaiting GPT-Web patch authoring |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved · structural baseline reconciled |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **ADAPTER REGISTRY v1** | **IMPLEMENTED** · default `opencode+qwen_local` |
| **N8N ROUTING BRIDGE v1** | **COMMITTED** · explicit route-request sidecar · no synthesized technical_requirements · EXECUTION_ROUTER reused · adapter metadata only · `dispatch_prepared=false` · `execution_performed=false` |

## Authorization / D-0025

- D-0025: **CLOSED**
- All live-proof AUTH spent/non-reusable
- Bridge default path = no dispatch / no execution

## Boundaries

- Do **not** mutate WF40/WF61/WF60 from Cursor in the next GPT-Web-owned patch-authoring block.
- External single-generation guard remains the hard max-one generation ceiling for OpenCode.
- Do **not** kill/stop Qwen/Ollama/proxy merely to tidy state.
- No LiteLLM/OpenClaw/network/secret mutation.

## Puntatori

- Bridge report: `reports/architecture/v4_n8n_execution_routing_bridge_integration_offline.md`
- Bridge contract: `docs/contracts/n8n-v4-execution-routing-bridge-v1.md` (+ `.schema.json`)
- Bridge tool: `tools/n8n-v4-execution-routing-bridge-v1.mjs`
- Bridge tests: `tests/n8n-v4-execution-routing-bridge/run.mjs`
- WF61 baseline reconciliation: `reports/architecture/wf61_structural_regression_baseline_reconciliation.md`
- Mount path (n8n): `/files/handoff-runtime/control-plane`
- WF40 id: `9ZMj2ACTKyDVhCue` · WF61 id: `d0025-6100-4001-8001-000000000061`
