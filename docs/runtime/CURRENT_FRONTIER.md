# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS + execution-adapter-router lanes **APPLIED LIVE (66 nodes)** · n8n adapter-router bridge **OFFLINE / LIVE-INCAPABLE** · no live runner wired |
| **BLOCCO ATTIVO** | none (adapter-router structural seam complete) |
| **STATO BLOCCO** | WF40_ADAPTER_ROUTER_PATCH_PASS / 61_TO_66 / EXACT_GPT_WEB_DELTA / WORKFLOW_EXECUTIONS_0 / EXECUTION_PERFORMED_0 / LIVE_RUNNER_ABSENT / WF61_INACTIVE / D0025_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · WF40 ends at offline adapter-router structural result; later Windows-local occupancy/runner transport requires a separate authorization-sensitive block |
| **NEXT** | separate Windows-local runtime runner / occupancy transport block (not authored here) — do not invent DISPATCH_READY, runtime authorization, getOccupancy, guardStart, or runOpenCode callbacks without explicit GPT-Web/operator authorization |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **66 nodes** · versionId `60f9b75e-39b8-410a-bcd1-364073992df0` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · default registry exact route `opencode+qwen_local` only |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · no production live runner injected by default |
| **WF40 ADAPTER ROUTER PATCH** | `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json` · GPT-Web authored · **applied verbatim** · 61→66 |

## Installed WF40 end-to-end structural path

```text
IF remote planner TRUE
  -> private local RESOURCE_STATUS contribution
  -> deterministic composer
  -> same-commit route source
  -> sidecar-source adapter
  -> WF61
  -> V4 execution-routing bridge
  -> ROUTING_READY_FOR_DISPATCH metadata
  -> prepare execution-adapter-router input
  -> offline n8n adapter-router bridge
  -> terminal structural adapter-router result (execution_performed=false)
```

No live executor is wired downstream yet.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI/execution;
- no provider calls;
- no authorization or dispatch synthesis;
- no getOccupancy / guardStart / runOpenCode injection from WF40;
- WF61 remains inactive; D-0025 remains CLOSED;
- no Grok Bot executor registration.

## Puntatori

- Apply report: `reports/architecture/v4_wf40_execution_adapter_router_patch_apply_offline.md`
- Bridge report: `reports/architecture/v4_n8n_execution_adapter_router_bridge_offline.md`
- Patch artifact: `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json`
- Bridge contract: `docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.md`
- Bridge tool: `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs`
- Canonical adapter router: `tools/v4-execution-adapter-router-v1.mjs`
- Adapter registry: `tools/v4-execution-adapter-registry-v1.mjs`
- OpenCode adapter: `tools/opencode-execution-adapter-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
