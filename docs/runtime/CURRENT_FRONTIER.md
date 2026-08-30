# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source lanes **APPLIED LIVE (56 nodes)** · RESOURCE_STATUS composer **OFFLINE COMPLETE** · local read-only contribution adapter local/uncommitted; target and regressions pass, live proof stopped on double diagnostic process count |
| **BLOCCO ATTIVO** | `V4_LOCAL_RUNTIME_READONLY_SINGLE_DIAGNOSTIC_BIND_CORRECTION_ONE_PASS` |
| **STATO BLOCCO** | LOCAL_ADAPTER_UNCOMMITTED / TARGET_29_OF_29_PASS / REGRESSIONS_PASS / LIVE_PROOF_SINGLE_RUN_STRUCTURALLY_VALID / DIAGNOSTIC_PS_2_REQUIRED_1 / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · corrective pass may change only the CLI diagnostic bind so `gatherQwenDiagnostics` is invoked exactly once per producer run |
| **NEXT** | `V4_LOCAL_RUNTIME_READONLY_SINGLE_DIAGNOSTIC_BIND_CORRECTION_ONE_PASS` — preserve current local adapter, sync canonical docs, restore block artifacts, replace the two independent `gatherQwenDiagnostics(runtimeConfig)` evaluations with one local binding and reuse `.sampleA/.sampleB`. Then target once, required regressions once, and one read-only live producer proof once. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · route-source + routing lanes installed · no downstream executor |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · target 34/34 PASS |
| **LOCAL READONLY LIVE STOP EVIDENCE** | `reports/architecture/v4_local_runtime_readonly_live_double_diagnostic_stop_operator_relay.md` · operator-relayed / not independently verified |

## Reported STOP

- Comment-guard corrective target: **29/29 PASS**.
- Regressions: composer **34**, registry **7**, status **6**, execution-router **12** — all PASS.
- Live producer proof executed exactly once.
- Contribution reported schema-valid with exactly `qwen_local` + `opencode`.
- Reported Qwen result: `QWEN_OCCUPANCY_UNCERTAIN`, unavailable.
- Reported OpenCode static result: `OPENCODE_STATIC_DISPATCH_READY`, available.
- `launch_performed=false`, `generation_calls=0`.
- Hard counter STOP: producer started **2** diagnostic PowerShell processes; contract requires exactly **1**.
- Reported cause: CLI evaluates `gatherQwenDiagnostics(runtimeConfig)` separately for `.sampleA` and `.sampleB`.
- No commit/push; local adapter deliverable and prior preservation stash remain in place.

## Corrective boundary

Authorize exactly one production-logic correction: call `gatherQwenDiagnostics(runtimeConfig)` once, store the result, and consume `sampleA`/`sampleB` from that one object.

Do not change diagnostic PowerShell contents, occupancy classifier, OpenCode static inspection, contribution mapping, schemas, test expectations, runtime config, workflows, composer, routing, or authorization semantics.

After correction:

1. target exactly once;
2. if PASS, required regressions exactly once;
3. if PASS, producer CLI exactly once for a new read-only live proof;
4. do not rerun to improve classification.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI invocation/execution;
- no provider calls;
- no workflow execution/mutation;
- exactly one diagnostic PowerShell process during live proof;
- raw process/socket/PID evidence ephemeral and unpersisted.

## Puntatori

- STOP relay report: `reports/architecture/v4_local_runtime_readonly_live_double_diagnostic_stop_operator_relay.md`
- Source contract: `docs/contracts/v4-resource-status-control-plane-source-v1.md`
- Contribution schema: `docs/contracts/v4-resource-status-contribution-v1.schema.json`
- Qwen standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Qwen runtime config: `configs/resources/qwen-local-runtime.json`
- Composer: `tools/compose-v4-resource-status-control-plane-v1.mjs`
