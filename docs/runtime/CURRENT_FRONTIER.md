# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Routing integration **COMPLETE** · bridge + dispatch gate + adapter delegation committed · target 15/15 · regressions PASS · top-level accounting truthful |
| **BLOCCO ATTIVO** | `V4_EXECUTION_ADAPTER_REGISTRY_BOUNDARY` |
| **STATO BLOCCO** | ROUTING_INTEGRATION_COMPLETE / TARGET_15_OF_15 / EXECUTION_PERFORMED_TRUTHFUL / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · all live-proof AUTH spent/non-reusable · no live OpenCode/Qwen generation authorized without a later fresh AUTH · D-0025 gate remains **CLOSED** |
| **NEXT** | `V4_EXECUTION_ADAPTER_REGISTRY_BOUNDARY` — harden the adapter-registry boundary (contract + validation for registering future executors such as Grok Bot) WITHOUT modifying EXECUTION_ROUTER and WITHOUT live execution. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **PROVEN LIVE** · `upstream_generation_requests=1` · OpenCode targeted guard only · no `steps` ceiling |
| **EXECUTION ADAPTER v1** | **IMPLEMENTED (offline-proven)** · auth mandatory · occupancy gate fail-closed · guard mandatory · direct `:8080` forbidden · DI runner · default no-execution |
| **ADAPTER ROUTING BRIDGE v1** | **IMPLEMENTED + COMMITTED** · dispatch gate (DISPATCH_READY required) · registry: `opencode+qwen_local` only · no fallback · truthful top-level `execution_performed` |

## Authorization state

- REAUTH_2 AUTH: **spent / historical / non-reusable**
- Prior REAUTH / original live-proof AUTH: remain spent
- No live call remains authorized; routing bridge default path = no execution

## Boundaries

- Do **not** retry live OpenCode without a new operator AUTH.
- External guard remains the hard max-one generation boundary.
- Do **not** use OpenCode `steps=1`/`steps=2` as the generation ceiling.
- Do **not** kill/stop Qwen/Ollama/proxy/Blender/Edge/Cursor merely to tidy state.
- No WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.

## Puntatori

- Routing integration report: `reports/architecture/v4_opencode_control_plane_routing_integration_offline.md`
- Routing contract: `docs/contracts/v4-execution-adapter-routing-v1.md` (+ `.schema.json`)
- Routing tool: `tools/v4-execution-adapter-router-v1.mjs` · tests: `tests/v4-execution-adapter-router/run.mjs`
- Adapter report: `reports/architecture/v4_opencode_execution_adapter_v1.md`
- Adapter tool: `tools/opencode-execution-adapter-v1.mjs`
- Existing router: `tools/evaluate-execution-route.mjs`
- Prior STOP relays: `reports/architecture/v4_opencode_control_plane_routing_integration_offline_stop_operator_relay.md` · `reports/architecture/v4_opencode_control_plane_routing_integration_test_harness_correction_stop_operator_relay.md`
