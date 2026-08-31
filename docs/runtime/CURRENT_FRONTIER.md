# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (71 nodes)** · Windows execution endpoint **PERSISTED + VPS UNAUTHORIZED PROOF PASS** · provenance registry **PASS** · durable spend ledger **IMPLEMENTED + ACTIVE (empty)** · issuance path **PRODUCTION SERVICE PERSISTED** (race-protected single-writer pending store) |
| **BLOCCO ATTIVO** | `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRODUCTION_SERVICE_WIRING_AND_PERSISTENCE` — **COMPLETE** (with `_BUGBOT_CORRECTION`) |
| **STATO BLOCCO** | ISSUANCE_PRODUCTION_SERVICE_PERSISTED / PENDING_STORE_SINGLE_WRITER_PROTECTED / DIRECT_TELEGRAM_POLLER_ACTIVE / ISSUANCE_PRIVATE_ROUTE_ACTIVE / PENDING_STORE_EMPTY / PRODUCTION_REGISTRY_EMPTY / PRODUCTION_LEDGER_EMPTY / READY_FOR_FIRST_LIVE_APPROVAL / LIVE_EXECUTION_CLOSED / HTTP_ISSUE_ENDPOINT_ABSENT / N8N_APPROVAL_ATTESTATION_FORBIDDEN / DURABLE_SPEND_LEDGER_ACTIVE / WF40_71 / EXECUTION_TRANSPORT_WIRED / EXECUTION_ENDPOINT_PERSISTED / LISTENER_18791_ACTIVE / LISTENER_18792_ACTIVE / ENDPOINT_HTTP_REQUESTS=0 / WF40_EXECUTIONS=0 / OPENCODE=0 / QWEN_GENERATIONS=0 / PROVIDER_CALLS=0 / TELEGRAM_DECISION_MESSAGES=0 / WF61_INACTIVE / D0025_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · issuance service **PERSISTED + READY** · pending store empty · no ACTIVE authorization · no live approval yet · Telegram decision messages = 0 |
| **NEXT** | `V4_RUNTIME_AUTHORIZATION_FIRST_LIVE_APPROVAL_AND_EXECUTION_PROOF` |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **71 nodes** · versionId `e2d600d6-48d9-45fe-9527-3f3e0b47d358` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → `127.0.0.1:18791` with registry + spend-ledger paths · tailnet-private `/v4/execution/opencode-local` · live execution NOT authorized |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · production registry **empty** · `issueActiveEntry()` ACTIVE writer available to issuance owner; CLI remains validation-only |
| **AUTHORIZATION DURABLE SPEND LEDGER** | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` · production ledger **empty** · ledger-first admission before registry spend |
| **AUTHORIZATION ISSUANCE OWNER** | `tools/v4-runtime-authorization-issuance-v1.mjs` · pending store + direct Telegram decision handler + reconciliation · **per-process single-writer mutation lane** shared by register / callback / reconcile |
| **AUTHORIZATION ISSUANCE SERVICE** | `tools/serve-v4-runtime-authorization-issuance-v1.mjs` · Scheduled Task `ControlPlane-V4-RuntimeAuthorizationIssuance` → `127.0.0.1:18792` · register-pending + status ONLY · direct Telegram poller active · no `/issue` HTTP |
| **AUTHORIZATION ISSUANCE PRIVATE ROUTES** | `/v4/authorization/register-pending` + `/v4/authorization/status` → `127.0.0.1:18792` · tailnet only · no Funnel |
| **AUTHORIZATION ISSUANCE TESTS** | `tests/v4-runtime-authorization-issuance/run.mjs` · **60/60 PASS** (includes race regressions 58–60) |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · exact route `opencode+qwen_local` |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · bounded adapter; production execution only through Windows endpoint callbacks |
| **WF40 EXECUTION TRANSPORT PATCH** | `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json` · **APPLIED VERBATIM** · 66→71 |

## Installed execution path

```text
WF40 structural routing
  -> Windows execution transport
  -> Tailscale-private /v4/execution/opencode-local
  -> 127.0.0.1:18791
  -> durable spend ledger
  -> provenance ACTIVE->SPENT
  -> adapter / occupancy / guard / OpenCode / Qwen
```

Live execution remains CLOSED; production registry + spend ledger are empty.

## Ratified human-gated issuance path — production service ready

```text
n8n / operator proposal
  -> Tailscale-private POST /v4/authorization/register-pending
  -> 127.0.0.1:18792 (single-writer pending store lane)
  -> Windows-local pending store: PENDING
  -> Windows-owned dedicated Telegram bot sends decision message
  -> Windows issuance owner directly consumes Telegram callback (same lane)
  -> verify server-side configured chat_id + from.id + one-shot pending binding
       APPROVE -> APPROVED -> provenance registry ACTIVE -> ISSUED
       REJECT  -> REJECTED -> no registry write
  -> n8n may poll bounded status
  -> later normal execution/spend path
```

No live approval yet. Telegram decision messages = 0. Pending store empty.

## Safety boundary

- dedicated issuance bot configured server-side only (token not on cmdline / not exposed);
- no Telegram decision messages sent in this pass;
- no Qwen generation/HTTP inference authorized;
- no OpenCode execution authorized;
- no provider calls;
- production registry empty; production spend ledger empty; pending store empty;
- next block is first live approval + execution proof;
- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED.

## Puntatori

- Issuance production wiring/persistence: `reports/architecture/v4_runtime_authorization_issuance_production_service_wiring_and_persistence.md`
- Issuance owner tool: `tools/v4-runtime-authorization-issuance-v1.mjs`
- Issuance service tool: `tools/serve-v4-runtime-authorization-issuance-v1.mjs`
- Issuance tests: `tests/v4-runtime-authorization-issuance/run.mjs`
- Issuance contract ratification/hardening: `reports/architecture/v4_runtime_authorization_issuance_path_contract.md`
- Issuance implementation offline: `reports/architecture/v4_runtime_authorization_issuance_path_implementation_offline.md`
- Prior STOP (race): `reports/runtime/cursor-stops/2026-08-31T193000Z__V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRODUCTION_SERVICE_WIRING_AND_PERSISTENCE.stop.json`
