# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS + execution-adapter-router lanes **APPLIED LIVE (66 nodes)** · n8n adapter-router bridge **OFFLINE / LIVE-INCAPABLE** · Windows-local execution endpoint **OFFLINE IMPLEMENTATION COMPLETE** / live service **NOT PERSISTED** |
| **BLOCCO ATTIVO** | `V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_PRIVATE_SERVICE_PERSISTENCE` |
| **STATO BLOCCO** | EXECUTION_ENDPOINT_OFFLINE_PASS / CHILD_OUTPUT_DRAIN_BOUNDED / GUARD_ACCOUNTING_AUTHORITATIVE / NONZERO_EXIT_FAIL_CLOSED / WF40_66_UNCHANGED / LIVE_RUNNER_ABSENT / SERVICE_NOT_PERSISTED / WF61_INACTIVE / D0025_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · offline endpoint tool + DI tests complete; next block is private service persistence on loopback `127.0.0.1:18791` + additive Tailscale Serve path only (listener proof), still zero live OpenCode/Qwen execution |
| **NEXT** | `V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_PRIVATE_SERVICE_PERSISTENCE` — persist Windows loopback execution service on `127.0.0.1:18791` and additive private Tailscale Serve path `/v4/execution/opencode-local`; listener proof only; no live OpenCode/Qwen/provider execution; no WF40 mutation |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **66 nodes** · versionId `60f9b75e-39b8-410a-bcd1-364073992df0` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | offline tool `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · contract GPT-Web · POST `/v4/execution/opencode-local` → future loopback `127.0.0.1:18791` · **not persisted / not listening in production** |
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

## Offline Windows-local execution endpoint (implemented)

```text
VPS / n8n
  -> Tailscale-private HTTPS POST /v4/execution/opencode-local
  -> future Windows loopback service 127.0.0.1:18791  (NOT YET PERSISTED)
  -> tools/serve-v4-windows-local-execution-endpoint-v1.mjs
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
- execution endpoint offline/DI complete; persistence/listener is the next bounded block;
- WF61 remains inactive; D-0025 remains CLOSED;
- no Grok Bot executor registration.

## Puntatori

- Offline implementation report: `reports/architecture/v4_windows_local_execution_endpoint_offline_implementation.md`
- Endpoint tool: `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`
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
