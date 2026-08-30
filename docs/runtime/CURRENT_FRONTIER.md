# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source lanes **APPLIED LIVE (56 nodes)** · RESOURCE_STATUS composer **OFFLINE COMPLETE** · local read-only contribution adapter **COMPLETE** |
| **BLOCCO ATTIVO** | `V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_AUTHORING` |
| **STATO BLOCCO** | LOCAL_ADAPTER_COMMITTED / TARGET_29_OF_29 / REGRESSIONS_PASS / DIAGNOSTIC_PS_1 / LIVE_READONLY_PASS / WF40_PATCH_AUTHORING_PENDING / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · next block is GPT-Web WF40 patch authoring only |
| **NEXT** | `V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_AUTHORING` — GPT-Web-owned additive WF40 delta that obtains this local contribution through a separately bounded read-only producer call, feeds it into the existing RESOURCE_STATUS composer, then places the composed `resource_status` onto the already-installed sidecar-source seam. Do not mutate WF40 in Cursor until that artifact exists. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · route-source + routing lanes installed · no downstream executor |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · target 34/34 PASS |
| **LOCAL READONLY CONTRIBUTION ADAPTER** | `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs` · single diagnostic bind · target 29/29 · live `QWEN_OCCUPANCY_UNCERTAIN` / OpenCode `OPENCODE_STATIC_DISPATCH_READY` |

## Local read-only producer

```text
ONE PowerShell (Get-Process + Get-NetTCPConnection, two fixed samples)
  -> classifyQwenSharedRuntime
  -> static OpenCode filesystem evidence (no CLI spawn)
  -> v4-resource-status-contribution-v1 {qwen_local, opencode}
```

- `gatherQwenDiagnostics` invoked **once** per CLI run; sampleA/sampleB reused.
- Qwen `available=true` only via READY_IDLE path (composer gate remains authoritative).
- Live proof accepted any fail-closed occupancy classification; READY_IDLE not required.
- No collectors, session manager, launcher, inference, or OpenCode process launch.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI invocation/execution;
- no provider calls;
- no workflow execution/mutation;
- exactly one diagnostic PowerShell process during live proof;
- raw process/socket/PID evidence ephemeral and unpersisted.

## Puntatori

- Adapter report: `reports/architecture/v4_resource_status_local_runtime_readonly_contribution_adapter.md`
- Adapter contract: `docs/contracts/v4-local-runtime-readonly-contribution-adapter-v1.md`
- Producer: `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`
- Source contract: `docs/contracts/v4-resource-status-control-plane-source-v1.md`
- Contribution schema: `docs/contracts/v4-resource-status-contribution-v1.schema.json`
- Qwen standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Qwen runtime config: `configs/resources/qwen-local-runtime.json`
- Composer: `tools/compose-v4-resource-status-control-plane-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
