# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (71 nodes)** · Windows execution endpoint **PERSISTED + VPS UNAUTHORIZED PROOF PASS** · provenance registry **PASS** · durable spend ledger **IMPLEMENTED + ACTIVE (empty)** · issuance path **DISCOVERY PASS + CONTRACT RATIFIED** |
| **BLOCCO ATTIVO** | `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE` |
| **STATO BLOCCO** | ISSUANCE_PATH_DISCOVERY_PASS / ISSUANCE_PATH_CONTRACT_RATIFIED / PENDING_STORE_CONTRACT_RATIFIED / DURABLE_SPEND_LEDGER_ACTIVE / PRODUCTION_LEDGER_EMPTY / PRODUCTION_REGISTRY_EMPTY / WF40_71 / EXECUTION_TRANSPORT_WIRED / EXECUTION_ENDPOINT_PERSISTED / LISTENER_18791_ACTIVE / EXECUTION_ROUTE_ACTIVE / ENDPOINT_HTTP_REQUESTS=0 / WF40_EXECUTIONS=0 / OPENCODE=0 / QWEN_GENERATIONS=0 / PROVIDER_CALLS=0 / WF61_INACTIVE / D0025_CLOSED / LIVE_EXECUTION_CLOSED / LIVE_ISSUANCE_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · **CLOSED TO LIVE ISSUANCE** · issuance/pending-store contracts ratified · no issuance owner/service/store/config implemented yet · production registry + spend ledger remain empty |
| **NEXT** | `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE` — implement Windows-local pending store + issuance owner + separate loopback service against ratified contracts; offline tests/review first; no live ACTIVE issuance/execution in the implementation block |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **71 nodes** · versionId `e2d600d6-48d9-45fe-9527-3f3e0b47d358` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → `127.0.0.1:18791` with `--authorization-registry` + `--authorization-spend-ledger` · tailnet-private `/v4/execution/opencode-local` · live execution NOT authorized |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json` · **empty** · issuance contract now ratified; ACTIVE writer not yet implemented |
| **AUTHORIZATION DURABLE SPEND LEDGER** | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` · `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-spend-ledger-v1.json` · **empty** · ledger-first admission before registry spend |
| **AUTHORIZATION ISSUANCE CONTRACT** | `docs/contracts/v4-runtime-authorization-issuance-v1.md` + schema · **RATIFIED / NOT IMPLEMENTED** |
| **AUTHORIZATION PENDING STORE CONTRACT** | `docs/contracts/v4-runtime-authorization-pending-store-v1.md` + schema · **RATIFIED / NOT IMPLEMENTED** |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · default registry exact route `opencode+qwen_local` only |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · bounded adapter; production execution only through Windows endpoint callbacks |
| **WF40 EXECUTION TRANSPORT PATCH** | `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json` · **APPLIED VERBATIM** · 66→71 |

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

Live execution remains CLOSED. Production registry and durable spend ledger are empty. Issuance contracts are ratified but no ACTIVE issuance owner exists yet.

## Windows execution consumption path

```text
VPS / n8n WF40
  -> Tailscale-private HTTPS POST /v4/execution/opencode-local
  -> Windows loopback 127.0.0.1:18791
  -> durable spend ledger inspect/append (ledger-first)
  -> provenance registry inspect + ACTIVE->SPENT
  -> canonical adapter / occupancy / guard / runner
  -> bounded structural result
```

## Ratified issuance path — not implemented

```text
proposal (n8n / operator)
  -> Windows-local issuance owner: register-pending
  -> pending store A: PENDING
  -> Telegram explicit APPROVE / REJECT with configured operator-chat guard
  -> Windows-local issuance owner verifies identity + immutable bindings
       APPROVE -> APPROVED -> provenance registry ACTIVE -> ISSUED
       REJECT  -> REJECTED -> no registry write
  -> later normal execution endpoint spend path
```

Planned issuance production surface remains non-live: separate loopback service (recommended `127.0.0.1:18792`), separate Scheduled Task, Tailscale-private `/v4/authorization/*`, user-local pending store + issuance config. None is implemented/applied yet.

## Safety boundary

- no Qwen generation/HTTP inference authorized yet;
- no OpenCode CLI/execution authorized yet;
- no provider calls;
- no ACTIVE authorization issuance implementation yet;
- production registry empty; production spend ledger empty;
- issuance/pending-store contracts ratified only;
- next block is offline issuance implementation;
- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED;
- live issuance CLOSED.

## Puntatori

- Issuance contract ratification: `reports/architecture/v4_runtime_authorization_issuance_path_contract.md`
- Issuance owner contract: `docs/contracts/v4-runtime-authorization-issuance-v1.md`
- Issuance schema: `docs/contracts/v4-runtime-authorization-issuance-v1.schema.json`
- Pending store contract: `docs/contracts/v4-runtime-authorization-pending-store-v1.md`
- Pending store schema: `docs/contracts/v4-runtime-authorization-pending-store-v1.schema.json`
- Issuance path discovery: `reports/architecture/v4_runtime_authorization_issuance_path_discovery.md`
- Durable spend ledger implementation: `reports/architecture/v4_runtime_authorization_durable_spend_ledger_implementation.md`
- Durable spend ledger contract: `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`
- Ledger tool: `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs`
- Provenance registry: `tools/v4-runtime-authorization-provenance-registry-v1.mjs`
- Endpoint: `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`
- Transport patch apply: `reports/architecture/v4_wf40_execution_transport_patch_apply_offline.md`
- WF40 id: `9ZMj2ACTKyDVhCue`
