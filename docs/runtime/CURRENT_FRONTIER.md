# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS + execution-adapter-router lanes **APPLIED LIVE (66 nodes)** · n8n adapter-router bridge **OFFLINE / LIVE-INCAPABLE** · Windows-local execution endpoint **PERSISTED + VPS UNAUTHORIZED REACHABILITY PROOF PASS** · authorization provenance hardening **PASS** |
| **BLOCCO ATTIVO** | `V4_WF40_EXECUTION_TRANSPORT_PATCH_AUTHORING` |
| **STATO BLOCCO** | PROVENANCE_HARDENING_PASS / SERVER_SIDE_REGISTRY_ACTIVE / EMPTY_REGISTRY_VALID / UNKNOWN_ID_FAIL_CLOSED / EXECUTION_ENDPOINT_PERSISTED / LISTENER_18791_ACTIVE / EXECUTION_ROUTE_ACTIVE / VPS_UNAUTHORIZED_PROOF_PASS / CUMULATIVE_PROOF_HTTP=2 / EXECUTION_PERFORMED=0 / OPENCODE=0 / QWEN_GENERATIONS=0 / PROVIDER_CALLS=0 / WF40_66_UNCHANGED / WF61_INACTIVE / D0025_CLOSED / LIVE_EXECUTION_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · D-0025 closed · VPS unauthorized reachability proven: Tailscale private HTTPS → Windows loopback endpoint → server-side empty registry → HTTP 200 `AUTHORIZATION_REJECTED` + `AUTHORIZATION_ID_NOT_ISSUED` before adapter/occupancy/guard/OpenCode/Qwen · production registry remains empty · next: GPT-Web authoring-only WF40 execution transport patch artifact |
| **NEXT** | `V4_WF40_EXECUTION_TRANSPORT_PATCH_AUTHORING` — GPT-Web authoring of the WF40 patch artifact to connect the terminal structural adapter-router result to the private Windows execution transport; authoring-only, no apply in the same block |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **66 nodes** · versionId `60f9b75e-39b8-410a-bcd1-364073992df0` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | offline tool `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · **PERSISTED**: Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → loopback `127.0.0.1:18791` with `--authorization-registry` (user-local empty registry) · tailnet-private `https://asusdesktop.tailc01234.ts.net/v4/execution/opencode-local` · VPS unauthorized proof PASS (2 cumulative HTTP attempts; attempt 2 authoritative) · live execution NOT authorized |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · production file `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json` · empty after proof · fail-closed on unknown/spent/expired/invalid |
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

No live executor is wired downstream yet. VPS unauthorized reachability to the private Windows execution transport is proven; WF40 execution transport patch authoring is next.

## Offline Windows-local execution endpoint (implemented + persisted + provenance hardened + VPS proof)

```text
VPS / n8n
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
- execution endpoint persisted with private tailnet route; server-side provenance registry active (empty); VPS unauthorized proof PASS; live execution still CLOSED;
- next block is GPT-Web authoring-only WF40 execution transport patch;
- WF61 remains inactive; D-0025 remains CLOSED;
- no Grok Bot executor registration.

## Puntatori

- VPS unauthorized reachability proof: `reports/architecture/v4_windows_local_execution_endpoint_vps_unauthorized_reachability_proof.md`
- Attempt 1 STOP evidence: `reports/runtime/cursor-stops/20260831T114157Z__V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF.stop.json`
- Provenance hardening report: `reports/architecture/v4_runtime_authorization_provenance_hardening.md`
- Provenance gap discovery: `reports/architecture/v4_runtime_authorization_provenance_gap_discovery.md`
- Registry contract: `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`
- Private service persistence report: `reports/architecture/v4_windows_local_execution_endpoint_private_service_persistence.md`
- Offline implementation report: `reports/architecture/v4_windows_local_execution_endpoint_offline_implementation.md`
- Endpoint tool: `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`
- Registry tool: `tools/v4-runtime-authorization-provenance-registry-v1.mjs`
- Target tests: `tests/v4-windows-local-execution-endpoint/run.mjs`
- Runner transport discovery: `reports/architecture/v4_windows_local_runtime_runner_transport_discovery.md`
- Windows execution endpoint contract: `docs/contracts/v4-windows-local-execution-endpoint-v1.md`
- Request schema: `docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json`
- Response schema: `docs/contracts/v4-windows-local-execution-endpoint-v1.response.schema.json`
- Apply report: `reports/architecture/v4_wf40_execution_adapter_router_patch_apply_offline.md`
- Bridge report: `reports/architecture/v4_n8n_execution_adapter_router_bridge_offline.md`
- Patch artifact: `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json`
- Bridge contract: `docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.md`
- Bridge tool: `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs`
- Canonical adapter router: `tools/v4-execution-adapter-router-v1.mjs`
- Adapter registry: `tools/v4-execution-adapter-registry-v1.mjs`
- OpenCode adapter: `tools/opencode-execution-adapter-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
