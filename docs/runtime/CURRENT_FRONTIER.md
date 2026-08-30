# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | OpenCode execution adapter v1 complete; routing-integration implementation exists only in the local dirty Cursor workspace after a one-pass STOP. Three target failures were operator-relayed and diagnosed as test-harness/expectation issues; no production misbehavior evidenced. |
| **BLOCCO ATTIVO** | `V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_TEST_HARNESS_CORRECTION_ONE_PASS` |
| **STATO BLOCCO** | `ROUTING_INTEGRATION_UNCOMMITTED / TARGET_12_OF_15_PASS / TEST_HARNESS_CORRECTION_DETERMINED / GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · no live OpenCode/Qwen generation authorized. This corrective block is offline and deterministic. |
| **NEXT** | `V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_TEST_HARNESS_CORRECTION_ONE_PASS` — modify only the newly written test harness/expectations needed to expose mock counters and align the default fail-closed classification; run target suite once + three regressions once; STOP on any remaining failure; no additional loop. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **PROVEN LIVE** · `upstream_generation_requests=1` · OpenCode targeted guard only · no `steps` ceiling |
| **EXECUTION ADAPTER v1** | **IMPLEMENTED (offline-proven)** · auth mandatory · occupancy gate fail-closed · guard mandatory · direct `:8080` forbidden · DI runner · default no-execution |

## Operator-relayed STOP evidence

- Report: `reports/architecture/v4_opencode_control_plane_routing_integration_offline_stop_operator_relay.md`
- Evidence class: `operator-relayed` / not independently verified from a pushed Cursor commit because Cursor stopped before commit/push.
- Reported local HEAD at STOP: `7f0eeba57f19924f522cbc67fa504369b4059ef2`.
- Reported workspace: dirty only with this block's new files.
- Target suite: 12/15 PASS; 3 failures attributed to test capture visibility + one expected classification mismatch.
- Regressions: all PASS.
- Live counters: Qwen 0 · OpenCode 0 · provider 0 · kills/stops/restarts 0 · secret exposure false.

## One-pass corrective rule

- Correct only `tests/v4-execution-adapter-router/**` unless the exact reported test-harness diagnosis proves a tiny adjacent fixture change is required.
- Do not redesign production routing code in this pass.
- Expose mock capture counters (`runCalls`, `guardStarts`, `guardBaseUrl`) so assertions can observe already-executed mock behavior.
- Align default no-deps expectation to the intended fail-closed ordering: `OCCUPANCY_BLOCKED` + `OCCUPANCY_SOURCE_MISSING`, `execution_performed=false`.
- Run the target suite once.
- Run the three specified regressions once.
- If any fail, STOP immediately with exact blocker; no second correction/test cycle in this pass.
- If all pass, persist report/frontier and commit/push the full routing-integration block.

## Boundaries

- No live OpenCode/Qwen/provider/n8n execution.
- No WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.
- No BugBot in this corrective pass.

## Puntatori

- Operator-relayed STOP: `reports/architecture/v4_opencode_control_plane_routing_integration_offline_stop_operator_relay.md`
- Adapter report: `reports/architecture/v4_opencode_execution_adapter_v1.md`
- Adapter tool: `tools/opencode-execution-adapter-v1.mjs`
- Existing router: `tools/evaluate-execution-route.mjs`
