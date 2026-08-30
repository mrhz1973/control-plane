# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | OpenCode execution adapter v1 complete. V4 routing-integration implementation remains only in the local dirty Cursor workspace. The first corrective pass proved the original test-only diagnosis incomplete and identified one minimal production accounting defect in the new routing bridge. |
| **BLOCCO ATTIVO** | `V4_OPENCODE_ROUTING_EXECUTION_PERFORMED_PROPAGATION_FIX_ONE_PASS` |
| **STATO BLOCCO** | `ROUTING_INTEGRATION_UNCOMMITTED / TARGET_14_OF_15_PASS / PRODUCTION_ACCOUNTING_DEFECT_CONFIRMED / MINIMAL_FIX_DETERMINED / GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · no live OpenCode/Qwen generation authorized. This remediation is offline, bounded, and one-pass. |
| **NEXT** | `V4_OPENCODE_ROUTING_EXECUTION_PERFORMED_PROPAGATION_FIX_ONE_PASS` — minimally fix top-level `execution_performed` propagation in `tools/v4-execution-adapter-router-v1.mjs`, run target suite once + three regressions once, then commit/push the full routing-integration deliverable if PASS. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **PROVEN LIVE** · `upstream_generation_requests=1` · OpenCode targeted guard only · no `steps` ceiling |
| **EXECUTION ADAPTER v1** | **IMPLEMENTED (offline-proven)** · auth mandatory · occupancy gate fail-closed · guard mandatory · direct `:8080` forbidden · DI runner · default no-execution |

## Operator-relayed STOP evidence

Latest report:
`reports/architecture/v4_opencode_control_plane_routing_integration_test_harness_correction_stop_operator_relay.md`

Evidence class: `operator-relayed` / not independently verified from a pushed Cursor commit because Cursor stopped before commit/push.

Reported state at STOP:

- HEAD/origin/main: `83c0502e40292fdb7bff1a493d717d60f4877217`
- workspace dirty with restored routing-integration block + corrected tests
- preservation stash still present
- target suite: 14/15 PASS
- only remaining failure: successful delegated execution is not reflected truthfully at the bridge top-level `execution_performed`
- regressions all PASS
- Qwen/OpenCode/provider/live counters all zero

## Confirmed defect

In the new uncommitted `tools/v4-execution-adapter-router-v1.mjs`, `baseResult()` hardcodes `execution_performed: false` and drops the delegated success value supplied through `partial.execution_performed`.

This is a production contract/accounting defect because a successful adapter execution may be represented as:

- nested adapter result: `execution_performed=true`
- bridge top-level result: `execution_performed=false`

Control-plane consumers require the top-level result to be truthful.

## One-pass minimal remediation

- Preserve the current dirty routing-integration workspace and preservation stash.
- Sync remote canonical docs mechanically without losing local block artifacts.
- Modify only the minimal production result propagation in `tools/v4-execution-adapter-router-v1.mjs`.
- Required semantics: top-level `execution_performed` is true iff delegated execution truth is true; blocked/no-route/unsupported paths remain false.
- Do not redesign routing, authorization, guard, dispatch, or execution adapter layers.
- Run target suite exactly once.
- If target PASS, run the three regressions exactly once each.
- Any failure => STOP, no second edit/test loop.
- PASS => persist evidence + commit/push full routing-integration deliverable and drop preservation stash only after verification.

## Boundaries

- No live OpenCode/Qwen/provider/n8n execution.
- No WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.
- No BugBot in this minimal corrective pass.
- No architecture expansion.

## Puntatori

- Latest operator-relayed STOP: `reports/architecture/v4_opencode_control_plane_routing_integration_test_harness_correction_stop_operator_relay.md`
- Prior STOP: `reports/architecture/v4_opencode_control_plane_routing_integration_offline_stop_operator_relay.md`
- Adapter report: `reports/architecture/v4_opencode_execution_adapter_v1.md`
- Adapter tool: `tools/opencode-execution-adapter-v1.mjs`
- Existing router: `tools/evaluate-execution-route.mjs`
