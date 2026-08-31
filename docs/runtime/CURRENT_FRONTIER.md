# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS contribution lanes **APPLIED LIVE (61 nodes)** · n8n execution-adapter-router bridge **OFFLINE COMPLETE / LIVE-INCAPABLE** · downstream execution-adapter-router patch **GPT-WEB AUTHORED / NOT APPLIED** |
| **BLOCCO ATTIVO** | `V4_WF40_EXECUTION_ADAPTER_ROUTER_PATCH_APPLY_OFFLINE` |
| **STATO BLOCCO** | N8N_ADAPTER_ROUTER_BRIDGE_PASS / TARGET_17_OF_17 / REGRESSIONS_PASS / EXECUTION_PERFORMED_0 / LIVE_RUNNER_ABSENT / WF40_61_NODES_UNCHANGED / PATCH_61_TO_66_PENDING |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · offline bridge PASS; next block applies the already-authored WF40 61→66 patch structurally with zero workflow/model/runtime execution |
| **NEXT** | `V4_WF40_EXECUTION_ADAPTER_ROUTER_PATCH_APPLY_OFFLINE` — apply verbatim GPT-Web artifact `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json` (expected 61→66). Structural proof only; no workflow execution; no endpoint/Qwen/OpenCode/provider calls. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **61 nodes** · versionId `1257ed3f-12ad-4fa1-b6ce-ae3e62149b7c` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · target 17/17 · deliberately live-incapable (no occupancy/runner callbacks) |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · offline-tested · default registry exact route `opencode+qwen_local` only |
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

## Authored downstream adapter-router extension (ready to apply)

```text
existing parsed V4 routing result
  -> exact execution_route_result + unchanged WF61 packet
  -> optional explicit dispatch_result + runtime_authorization only
  -> n8n-v4-execution-adapter-router-bridge-v1 (OFFLINE COMPLETE)
  -> v4-execution-adapter-router-v1
  -> exact adapter registry
  -> fail-closed adapter result (execution_performed=false)
```

The n8n adapter-router bridge is deliberately offline/no-live-runner:

- never synthesizes `DISPATCH_READY`;
- never synthesizes runtime authorization;
- injects no `getOccupancy`;
- injects no `guardStart` or `runOpenCode`;
- performs no subprocess/network/model call;
- top-level `execution_performed` must remain `false`.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI/execution;
- no provider calls;
- no authorization or dispatch synthesis;
- WF61 remains inactive; D-0025 remains CLOSED;
- no Grok Bot executor registration;
- WF40 adapter-router patch apply is the next structural-only block.

## Puntatori

- Bridge report: `reports/architecture/v4_n8n_execution_adapter_router_bridge_offline.md`
- Bridge contract: `docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.md`
- Bridge tool: `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs`
- Adapter-router authoring report: `reports/architecture/v4_wf40_execution_adapter_router_patch_authoring.md`
- GPT-Web adapter-router patch: `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json`
- Canonical adapter router: `tools/v4-execution-adapter-router-v1.mjs`
- Adapter registry: `tools/v4-execution-adapter-registry-v1.mjs`
- OpenCode adapter: `tools/opencode-execution-adapter-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
