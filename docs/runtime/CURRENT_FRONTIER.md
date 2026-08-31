# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS contribution lanes **APPLIED LIVE (61 nodes)** · RESOURCE_STATUS composer **OFFLINE COMPLETE** · local read-only contribution adapter **COMPLETE** · private local-readonly endpoint **LIVE / TAILSCALE PRIVATE** · downstream execution-adapter-router patch **GPT-WEB AUTHORED / NOT APPLIED** |
| **BLOCCO ATTIVO** | `V4_N8N_EXECUTION_ADAPTER_ROUTER_BRIDGE_OFFLINE` |
| **STATO BLOCCO** | WF40_LOCAL_STATUS_PATCH_PASS / 61_NODES_LIVE / EXECUTION_ADAPTER_ROUTER_PATCH_AUTHORED_61_TO_66 / N8N_ADAPTER_ROUTER_BRIDGE_PENDING / LIVE_RUNNER_ABSENT / EXECUTION_PERFORMED_0 / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · next block is pure offline implementation of the n8n-facing execution-adapter-router bridge; WF40 61→66 patch remains unapplied until bridge PASS |
| **NEXT** | `V4_N8N_EXECUTION_ADAPTER_ROUTER_BRIDGE_OFFLINE` — implement schema/tool/tests for `n8n-v4-execution-adapter-router-bridge-v1`, reusing the canonical execution-adapter router/registry/OpenCode adapter. No occupancy callback, no runner, no subprocess/network/model execution. After PASS AUTO-VIA to `V4_WF40_EXECUTION_ADAPTER_ROUTER_PATCH_APPLY_OFFLINE`. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **61 nodes** · versionId `1257ed3f-12ad-4fa1-b6ce-ae3e62149b7c` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · existing offline-tested router · default registry exact route `opencode+qwen_local` only |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · authorization/occupancy/guard boundaries implemented · no production live runner injected by default |
| **WF40 ADAPTER ROUTER PATCH** | `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json` · GPT-Web authored · **not applied** · expected 61→66 |

## Installed WF40 route/status path

```text
IF remote planner TRUE
  -> private local RESOURCE_STATUS contribution
  -> deterministic composer
  -> same-commit route source
  -> sidecar-source adapter
  -> WF61
  -> V4 execution-routing bridge
  -> ROUTING_READY_FOR_DISPATCH metadata
```

No live executor is wired downstream yet.

## Authored downstream adapter-router extension

```text
existing parsed V4 routing result
  -> exact execution_route_result + unchanged WF61 packet
  -> optional explicit dispatch_result + runtime_authorization only
  -> n8n-v4-execution-adapter-router-bridge-v1
  -> v4-execution-adapter-router-v1
  -> exact adapter registry
  -> fail-closed adapter result
```

The first n8n adapter-router bridge is deliberately offline/no-live-runner:

- never synthesizes `DISPATCH_READY`;
- never synthesizes runtime authorization;
- injects no `getOccupancy`;
- injects no `guardStart` or `runOpenCode`;
- performs no subprocess/network/model call;
- top-level `execution_performed` must remain `false`.

This lets WF40 reach the canonical adapter-router boundary safely before the later Windows-local execution runner/transport is introduced as a separate block.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI/execution;
- no provider calls;
- no authorization or dispatch synthesis;
- WF61 remains inactive; D-0025 remains CLOSED;
- no Grok Bot executor registration;
- WF40 adapter-router patch apply forbidden until offline bridge implementation PASS.

## Puntatori

- Latest apply report: `reports/architecture/v4_resource_status_wf40_local_contribution_patch_apply_offline.md`
- Adapter-router authoring report: `reports/architecture/v4_wf40_execution_adapter_router_patch_authoring.md`
- Adapter-router n8n contract: `docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.md`
- GPT-Web adapter-router patch: `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json`
- Canonical adapter router: `tools/v4-execution-adapter-router-v1.mjs`
- Adapter registry: `tools/v4-execution-adapter-registry-v1.mjs`
- OpenCode adapter: `tools/opencode-execution-adapter-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
