# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS + execution-adapter-router lanes **APPLIED LIVE (66 nodes)** · Windows execution transport patch **GPT-WEB AUTHORED / NOT APPLIED** · Windows-local execution endpoint **PERSISTED + VPS UNAUTHORIZED REACHABILITY PROOF PASS** · authorization provenance hardening **PASS** |
| **BLOCCO ATTIVO** | `V4_WF40_EXECUTION_TRANSPORT_PATCH_APPLY_OFFLINE` |
| **STATO BLOCCO** | VPS_UNAUTHORIZED_PROOF_PASS / EXECUTION_TRANSPORT_PATCH_AUTHORED / PATCH_NOT_APPLIED / SERVER_SIDE_REGISTRY_ACTIVE / EMPTY_REGISTRY_VALID / EXECUTION_ENDPOINT_PERSISTED / LISTENER_18791_ACTIVE / EXECUTION_ROUTE_ACTIVE / CUMULATIVE_PROOF_HTTP=2 / EXECUTION_PERFORMED=0 / OPENCODE=0 / QWEN_GENERATIONS=0 / PROVIDER_CALLS=0 / WF40_66_UNCHANGED / WF61_INACTIVE / D0025_CLOSED / LIVE_EXECUTION_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · execution transport patch may be applied **structurally only** with zero WF40/WF61 executions, zero endpoint HTTP requests and empty production authorization registry · no live authorization issuance in this block |
| **NEXT** | `V4_WF40_EXECUTION_TRANSPORT_PATCH_APPLY_OFFLINE` — apply `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json` verbatim after secret-safe structural precheck; prove 66→71 with zero execution/HTTP/OpenCode/Qwen/provider calls |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **66 nodes** · versionId `60f9b75e-39b8-410a-bcd1-364073992df0` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · persisted Scheduled Task → `127.0.0.1:18791` with user-local authorization registry · tailnet-private `https://asusdesktop.tailc01234.ts.net/v4/execution/opencode-local` · VPS unauthorized proof PASS · live execution NOT authorized |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json` · **empty** after proof · fail-closed unknown/spent/expired/invalid |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · default registry exact route `opencode+qwen_local` only |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · bounded adapter; production execution only through Windows endpoint callbacks |
| **WF40 EXECUTION TRANSPORT PATCH** | `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json` · GPT-Web authored · **NOT APPLIED** · intended 66→71 |

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

The authored-but-not-applied transport patch will extend only the successful terminal adapter-router path:

```text
terminal structural adapter-router result
  -> strict Windows transport request builder
  -> fail-closed readiness gate
       TRUE  -> fixed Tailscale-private POST -> bounded endpoint result parser
       FALSE -> terminal transport gate closed
```

No live executor is wired in WF40 yet because the transport patch is not applied.

## Windows-local execution endpoint

```text
VPS / n8n
  -> Tailscale-private HTTPS POST /v4/execution/opencode-local
  -> Windows loopback service 127.0.0.1:18791
  -> server-side authorization provenance registry
  -> canonical adapter authorization validation
  -> canonical occupancy classification
  -> existing single-generation guard
  -> fixed no-shell OpenCode runner
  -> bounded structural result
```

Unauthorized reachability is proven: attempt 2 returned HTTP 200 `AUTHORIZATION_REJECTED` + `AUTHORIZATION_ID_NOT_ISSUED`, registry remained empty, execution/OpenCode/Qwen/provider all zero.

## Safety boundary

- no live execution authorization yet;
- production authorization registry remains empty;
- no Qwen generation/inference authorized yet;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI/execution authorized yet;
- no provider calls;
- no authorization or dispatch synthesis;
- transport patch apply must not execute WF40/WF61 or call the execution endpoint;
- WF61 remains inactive; D-0025 remains CLOSED;
- no Grok Bot executor registration.

## Puntatori

- Transport patch artifact: `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json`
- Transport patch authoring report: `reports/architecture/v4_wf40_execution_transport_patch_authoring.md`
- VPS unauthorized reachability proof: `reports/architecture/v4_windows_local_execution_endpoint_vps_unauthorized_reachability_proof.md`
- Attempt 1 STOP evidence: `reports/runtime/cursor-stops/20260831T114157Z__V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF.stop.json`
- Provenance hardening report: `reports/architecture/v4_runtime_authorization_provenance_hardening.md`
- Registry contract: `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`
- Windows execution endpoint contract: `docs/contracts/v4-windows-local-execution-endpoint-v1.md`
- Request schema: `docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json`
- Response schema: `docs/contracts/v4-windows-local-execution-endpoint-v1.response.schema.json`
- Existing adapter-router patch: `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json`
- Existing adapter-router apply report: `reports/architecture/v4_wf40_execution_adapter_router_patch_apply_offline.md`
- Endpoint tool: `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`
- Registry tool: `tools/v4-runtime-authorization-provenance-registry-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
