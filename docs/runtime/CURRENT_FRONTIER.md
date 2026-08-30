# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Adapter registry boundary complete. The new n8n-facing V4 execution-routing bridge exists only in the local dirty Cursor workspace after a one-pass STOP at target 20/23. One minimal production result-propagation defect and one isolated test-fixture defect are deterministically identified. |
| **BLOCCO ATTIVO** | `V4_N8N_EXECUTION_ROUTING_BRIDGE_CORRECTION_ONE_PASS` |
| **STATO BLOCCO** | `N8N_ROUTING_BRIDGE_UNCOMMITTED / TARGET_20_OF_23_PASS / OK_PROPAGATION_DEFECT_CONFIRMED / FIXTURE_CORRECTION_DETERMINED / GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · no live OpenCode/Qwen/provider/n8n execution authorized. Corrective block is offline and one-pass. |
| **NEXT** | `V4_N8N_EXECUTION_ROUTING_BRIDGE_CORRECTION_ONE_PASS` — preserve current dirty bridge work, minimally propagate top-level `ok`, isolate the unsupported-route test fixture from the free local route, run target once + required regressions once, STOP on any remaining failure, commit/push full bridge deliverable only on PASS. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **PROVEN LIVE** · upstream max-one boundary preserved |
| **EXECUTION ADAPTER v1** | **IMPLEMENTED (offline-proven)** · auth mandatory · occupancy fail-closed · guard mandatory |
| **ADAPTER ROUTING BRIDGE v1** | **IMPLEMENTED** · truthful `execution_performed` · dispatch gate preserved |
| **ADAPTER REGISTRY v1** | **IMPLEMENTED** · validated exact-route registry · no fallback |

## Latest operator-relayed STOP

Report:
`reports/architecture/v4_n8n_execution_routing_bridge_integration_offline_stop_operator_relay.md`

Evidence class: `operator-relayed` / not independently verified from a pushed Cursor commit because Cursor stopped before commit/push.

Reported state:

- local HEAD/origin at STOP: `42202d9ece9bfd2ed7d86bac317e8c2e38d342eb`
- workspace dirty only with new bridge block files
- target: 20/23 PASS
- regressions not run by one-pass STOP
- all live/runtime counters zero

## Confirmed corrective scope

1. In new uncommitted `tools/n8n-v4-execution-routing-bridge-v1.mjs`, `base()` drops a successful partial `ok` by hardcoding false. Required semantics: top-level `ok` true iff `p.ok === true`.
2. The unsupported-route test fixture accidentally exposes both `cursor+composer` and free `opencode+qwen_local`; canonical EXECUTION_ROUTER correctly prefers the local free route. Correct only that fixture so the intended cursor route is isolated.
3. No planner/routing/registry/adapter redesign.
4. Target suite exactly once; regressions exactly once only after target PASS. Any failure => STOP, no second edit/test loop.
5. PASS => commit/push full bridge deliverable and advance to GPT-Web-owned `V4_WF40_EXECUTION_ROUTING_PATCH_AUTHORING`.

## Boundaries

- No live OpenCode/Qwen/provider/n8n execution.
- No workflow mutation in corrective pass.
- No WF40/WF61/WF60/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.
- No BugBot.
- Grok Bot remains routing_arbiter only.

## Puntatori

- Latest STOP: `reports/architecture/v4_n8n_execution_routing_bridge_integration_offline_stop_operator_relay.md`
- Registry report: `reports/architecture/v4_execution_adapter_registry_boundary.md`
- Adapter registry: `tools/v4-execution-adapter-registry-v1.mjs`
- Existing execution router: `tools/evaluate-execution-route.mjs`
- Routing bridge: `tools/v4-execution-adapter-router-v1.mjs`
