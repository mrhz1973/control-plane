# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source + local RESOURCE_STATUS + execution-adapter-router + Windows execution transport lanes **APPLIED LIVE (71 nodes)** · Windows-local execution endpoint **PERSISTED + VPS UNAUTHORIZED REACHABILITY PROOF PASS** · provenance registry **PASS** · durable spend ledger **CONTRACT AUTHORED / NOT IMPLEMENTED** |
| **BLOCCO ATTIVO** | `V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER_IMPLEMENTATION` |
| **STATO BLOCCO** | WF40_71 / EXECUTION_TRANSPORT_WIRED / PRODUCTION_REGISTRY_EMPTY / DURABLE_LEDGER_CONTRACT_AUTHORED / DURABLE_LEDGER_NOT_IMPLEMENTED / EXECUTION_ENDPOINT_PERSISTED / LISTENER_18791_ACTIVE / EXECUTION_ROUTE_ACTIVE / WORKFLOW_EXECUTIONS=0 / ENDPOINT_HTTP_REQUESTS=0 / OPENCODE=0 / QWEN_GENERATIONS=0 / PROVIDER_CALLS=0 / WF61_INACTIVE / D0025_CLOSED / LIVE_EXECUTION_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · transport wired but production registry empty · no ACTIVE issuance path · durable global spend ledger contract ratified and must be implemented/persisted before issuance-path design |
| **NEXT** | `V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER_IMPLEMENTATION` — implement/test the ratified ledger contract, create empty user-local production ledger, wire fixed server-side path into execution service; zero endpoint requests/executions/generations in this block |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **71 nodes** · versionId `e2d600d6-48d9-45fe-9527-3f3e0b47d358` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` |
| **REMOTE RUNTIME GATE** | D-0025 `enabled=false` · **CLOSED** |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task → `127.0.0.1:18791` · tailnet-private `/v4/execution/opencode-local` · live execution NOT authorized |
| **AUTHORIZATION PROVENANCE REGISTRY** | `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json` · **empty** · fail-closed unknown/spent/expired/invalid |
| **DURABLE SPEND LEDGER** | contract `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md` + schema authored · production file/tool **NOT YET IMPLEMENTED** |
| **WF40 EXECUTION TRANSPORT PATCH** | `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json` · **APPLIED VERBATIM** · 66→71 |

## Installed structural path

```text
WF40 primary-remote TRUE
  -> RESOURCE_STATUS + route source + WF61 + execution routing
  -> offline adapter-router boundary
  -> Windows transport readiness gate
  -> Tailscale-private execution endpoint (wired, not executed)
  -> provenance registry
  -> [NEXT: durable global spend ledger]
  -> adapter / occupancy / guard / OpenCode runner
```

## Safety boundary

- production authorization registry empty;
- no ACTIVE authorization issuance path;
- no Qwen generation / OpenCode execution / provider calls authorized;
- WF40 transport is wired but no workflow execution is authorized for validation;
- WF61 inactive; D-0025 CLOSED;
- live execution remains CLOSED.

## Puntatori

- Durable spend ledger contract: `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`
- Durable spend ledger schema: `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.schema.json`
- Ledger authoring report: `reports/architecture/v4_runtime_authorization_durable_spend_ledger_authoring.md`
- Transport apply: `reports/architecture/v4_wf40_execution_transport_patch_apply_offline.md`
- Transport patch: `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json`
- Provenance registry contract: `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`
- Endpoint contract: `docs/contracts/v4-windows-local-execution-endpoint-v1.md`
- Endpoint tool: `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
