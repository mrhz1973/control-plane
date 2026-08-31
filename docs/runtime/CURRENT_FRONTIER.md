# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS + execution-adapter-router + Windows execution transport lanes **APPLIED LIVE (71 nodes)** · Windows-local execution endpoint **PERSISTED + VPS UNAUTHORIZED REACHABILITY PROOF PASS** · authorization provenance hardening **PASS** |
| **BLOCCO ATTIVO** | `V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER` |
| **STATO BLOCCO** | WF40_EXECUTION_TRANSPORT_PATCH_APPLIED / WF40_71 / EXECUTION_TRANSPORT_WIRED / PRODUCTION_REGISTRY_EMPTY / SERVER_SIDE_REGISTRY_ACTIVE / EXECUTION_ENDPOINT_PERSISTED / LISTENER_18791_ACTIVE / EXECUTION_ROUTE_ACTIVE / VPS_UNAUTHORIZED_PROOF_PASS / WORKFLOW_EXECUTIONS=0 / ENDPOINT_HTTP_REQUESTS=0 / OPENCODE=0 / QWEN_GENERATIONS=0 / PROVIDER_CALLS=0 / WF61_INACTIVE / D0025_CLOSED / LIVE_EXECUTION_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · WF40 structurally wired through private Windows execution transport · production authorization registry remains empty · unknown id fail-closed · no live authorization issuance · durable multi-route spend ledger is the next contract block and is not implemented yet |
| **NEXT** | `V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER` — current provenance registry is the seed; implement multi-route durable spend ledger per contract without live execution in the same block |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **71 nodes** · versionId `e2d600d6-48d9-45fe-9527-3f3e0b47d358` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · persisted Scheduled Task → `127.0.0.1:18791` with user-local authorization registry · tailnet-private `https://asusdesktop.tailc01234.ts.net/v4/execution/opencode-local` · VPS unauthorized proof PASS · live execution NOT authorized |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json` · **empty** · fail-closed unknown/spent/expired/invalid · durable spend ledger NOT yet implemented |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · default registry exact route `opencode+qwen_local` only |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · bounded adapter; production execution only through Windows endpoint callbacks |
| **WF40 EXECUTION TRANSPORT PATCH** | `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json` · GPT-Web authored · **APPLIED VERBATIM** · 66→71 |

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
  -> prepare Windows execution transport request (fail-closed)
  -> IF transport ready?
       TRUE  -> Tailscale-private HTTP POST /v4/execution/opencode-local
             -> parse bounded structural endpoint result
       FALSE -> transport gate closed
```

Live execution remains CLOSED. Production registry is empty, so any READY path would still fail closed at server-side provenance until a separately authorized ACTIVE issuance exists.

## Offline Windows-local execution endpoint (implemented + persisted + provenance hardened + VPS proof + WF40 wired)

```text
VPS / n8n WF40
  -> Tailscale-private HTTPS POST /v4/execution/opencode-local
  -> Windows loopback service 127.0.0.1:18791 (Scheduled Task ControlPlane-V4-LocalExecutionEndpoint)
  -> tools/serve-v4-windows-local-execution-endpoint-v1.mjs
  -> server-side authorization provenance registry (inspect + ACTIVE->SPENT)
  -> canonical adapter authorization validation
  -> execution-time canonical occupancy classification
  -> existing single-generation guard
  -> fixed no-shell OpenCode runner (DI-tested; not live-executed)
  -> bounded structural result
```

The existing read-only endpoint on `127.0.0.1:18790` / `/v4/resource-status/local-readonly` remains separate and unchanged.

## Safety boundary

- no Qwen generation/HTTP inference authorized yet;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI/execution authorized yet;
- no provider calls;
- no authorization or dispatch synthesis;
- no getOccupancy / runOpenCode injection from WF40;
- WF40 structurally wired to private Windows execution transport; production registry empty; live execution still CLOSED;
- next block is durable spend ledger (registry seed already present);
- WF61 remains inactive; D-0025 remains CLOSED;
- no Grok Bot executor registration.

## Puntatori

- Transport patch apply: `reports/architecture/v4_wf40_execution_transport_patch_apply_offline.md`
- Transport patch authoring: `reports/architecture/v4_wf40_execution_transport_patch_authoring.md`
- Patch artifact: `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json`
- VPS unauthorized reachability proof: `reports/architecture/v4_windows_local_execution_endpoint_vps_unauthorized_reachability_proof.md`
- Provenance hardening report: `reports/architecture/v4_runtime_authorization_provenance_hardening.md`
- Registry contract: `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`
- Endpoint tool: `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`
- Registry tool: `tools/v4-runtime-authorization-provenance-registry-v1.mjs`
- Windows execution endpoint contract: `docs/contracts/v4-windows-local-execution-endpoint-v1.md`
- Adapter-router apply: `reports/architecture/v4_wf40_execution_adapter_router_patch_apply_offline.md`
- WF40 id: `9ZMj2ACTKyDVhCue`
