# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Adapter registry boundary **VALIDATED** · default=`opencode+qwen_local` only · fail-closed · no fallback · Grok Bot remains routing_arbiter |
| **BLOCCO ATTIVO** | `V4_N8N_EXECUTION_ROUTING_BRIDGE_INTEGRATION_OFFLINE` |
| **STATO BLOCCO** | REGISTRY_BOUNDARY_COMPLETE / DEFAULT_OPENCODE_QWEN_LOCAL / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · all live-proof AUTH spent/non-reusable · no live OpenCode/Qwen generation authorized without a later fresh AUTH · D-0025 gate remains **CLOSED** |
| **NEXT** | `V4_N8N_EXECUTION_ROUTING_BRIDGE_INTEGRATION_OFFLINE` — wire the completed V4 route → adapter boundary into the existing n8n control-plane path, offline first, without live executor calls. Do **not** mutate n8n/workflows for live execution here. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **PROVEN LIVE** · `upstream_generation_requests=1` · OpenCode targeted guard only · no `steps` ceiling |
| **EXECUTION ADAPTER v1** | **IMPLEMENTED (offline-proven)** · auth mandatory · occupancy gate fail-closed · guard mandatory · direct `:8080` forbidden |
| **ADAPTER ROUTING BRIDGE v1** | **IMPLEMENTED** · dispatch gate · truthful top-level `execution_performed` |
| **ADAPTER REGISTRY v1** | **IMPLEMENTED** · validated registration · exact route_id lookup · invalid registry => `ADAPTER_REGISTRY_INVALID` · default route unchanged |

## Authorization state

- REAUTH_2 AUTH: **spent / historical / non-reusable**
- Prior REAUTH / original live-proof AUTH: remain spent
- No live call remains authorized; default path = no execution

## Boundaries

- Do **not** retry live OpenCode without a new operator AUTH.
- External guard remains the hard max-one generation boundary.
- Do **not** use OpenCode `steps=1`/`steps=2` as the generation ceiling.
- Do **not** kill/stop Qwen/Ollama/proxy/Blender/Edge/Cursor merely to tidy state.
- No WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.
- Do **not** register Grok Bot as an executor until a separate authorized execution role/contract exists. RESOURCE_REGISTRY role remains `routing_arbiter`.

## Puntatori

- Registry report: `reports/architecture/v4_execution_adapter_registry_boundary.md`
- Registry contract: `docs/contracts/v4-execution-adapter-registry-v1.md` (+ `.schema.json`)
- Registry tool: `tools/v4-execution-adapter-registry-v1.mjs` · tests: `tests/v4-execution-adapter-registry/run.mjs`
- Routing report: `reports/architecture/v4_opencode_control_plane_routing_integration_offline.md`
- Routing tool: `tools/v4-execution-adapter-router-v1.mjs`
- Adapter tool: `tools/opencode-execution-adapter-v1.mjs`
- Existing router: `tools/evaluate-execution-route.mjs`
