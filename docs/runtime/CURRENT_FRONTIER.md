# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (71 nodes)** · Windows execution endpoint **PERSISTED + VPS UNAUTHORIZED PROOF PASS** · provenance registry **PASS** · durable spend ledger **IMPLEMENTED + ACTIVE (empty)** · issuance path **IMPLEMENTED OFFLINE (BugBot PASS)** |
| **BLOCCO ATTIVO** | `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE` — **COMPLETE** (with `_BUGBOT_CORRECTION`) |
| **STATO BLOCCO** | ISSUANCE_IMPLEMENTATION_OFFLINE_PASS / DIRECT_TELEGRAM_VERIFICATION_IMPLEMENTED / HTTP_ISSUE_ENDPOINT_ABSENT / N8N_APPROVAL_ATTESTATION_FORBIDDEN / CLI_VALIDATION_FIXED / EXPIRED_STATE_VALIDATED / PRODUCTION_ISSUANCE_NOT_PERSISTED / DURABLE_SPEND_LEDGER_ACTIVE / PRODUCTION_LEDGER_EMPTY / PRODUCTION_REGISTRY_EMPTY / WF40_71 / EXECUTION_TRANSPORT_WIRED / EXECUTION_ENDPOINT_PERSISTED / LISTENER_18791_ACTIVE / ENDPOINT_HTTP_REQUESTS=0 / WF40_EXECUTIONS=0 / OPENCODE=0 / QWEN_GENERATIONS=0 / PROVIDER_CALLS=0 / WF61_INACTIVE / D0025_CLOSED / LIVE_EXECUTION_CLOSED / LIVE_ISSUANCE_CLOSED |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · **CLOSED TO LIVE ISSUANCE** · issuance owner + service + pending store implemented offline (tests only, ephemeral port 0, fake Telegram client) · real Telegram Bot API calls = 0 · no production issuance service/config/store/bot persisted yet |
| **NEXT** | `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRIVATE_SERVICE_PERSISTENCE_PRECHECK` — prepare dedicated issuance bot credential, operator chat/user ids, production config, pending store, Scheduled Task, Tailscale private route; setup/persistence only, NOT the first live approval/execution |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **71 nodes** · versionId `e2d600d6-48d9-45fe-9527-3f3e0b47d358` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → `127.0.0.1:18791` with registry + spend-ledger paths · tailnet-private `/v4/execution/opencode-local` · live execution NOT authorized |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · production registry **empty** · `issueActiveEntry()` ACTIVE writer **implemented offline**; CLI remains validation-only/never issues |
| **AUTHORIZATION DURABLE SPEND LEDGER** | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` · production ledger **empty** · ledger-first admission before registry spend |
| **AUTHORIZATION ISSUANCE OWNER (offline)** | `tools/v4-runtime-authorization-issuance-v1.mjs` · pending store + direct Telegram decision handler + reconciliation · validation-only CLI · **not persisted as production** |
| **AUTHORIZATION ISSUANCE SERVICE (offline)** | `tools/serve-v4-runtime-authorization-issuance-v1.mjs` · register-pending + status ONLY · no `/issue` HTTP · planned `127.0.0.1:18792` · tests use ephemeral port 0 · **not persisted as production** |
| **AUTHORIZATION ISSUANCE TESTS** | `tests/v4-runtime-authorization-issuance/run.mjs` · **43/43 PASS** · includes BugBot-correction regressions A–G |
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

## Ratified human-gated issuance path — implemented offline, not persisted

```text
n8n / operator proposal
  -> register-pending (bounded Tailscale-private API)
  -> Windows-local pending store: PENDING
  -> Windows-owned dedicated Telegram bot sends decision message
  -> Windows issuance owner directly consumes Telegram callback
  -> verify server-side configured chat_id + from.id + one-shot pending binding
       APPROVE -> APPROVED -> provenance registry ACTIVE -> ISSUED
       REJECT  -> REJECTED -> no registry write
  -> n8n may poll bounded status
  -> later normal execution/spend path
```

Implementation is offline-complete (43/43 tests, BugBot PASS_NO_FINDINGS). The discovery suggestion that n8n could forward sanitized APPROVE evidence is superseded by the ratified contract because forwarded metadata alone cannot prove a human click against a compromised n8n transport.

## Safety boundary

- no real Telegram issuance bot configured; real Bot API calls remain 0;
- no Qwen generation/HTTP inference authorized;
- no OpenCode execution authorized;
- no provider calls;
- issuance implementation exists offline only — no production service, config, pending store, or bot persisted;
- production registry empty; production spend ledger empty;
- next block is persistence/setup precheck only — not the first live approval/execution;
- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED;
- live issuance CLOSED.

## Puntatori

- Issuance implementation offline: `reports/architecture/v4_runtime_authorization_issuance_path_implementation_offline.md`
- Issuance owner tool: `tools/v4-runtime-authorization-issuance-v1.mjs`
- Issuance service tool: `tools/serve-v4-runtime-authorization-issuance-v1.mjs`
- Issuance tests: `tests/v4-runtime-authorization-issuance/run.mjs`
- Issuance contract ratification/hardening: `reports/architecture/v4_runtime_authorization_issuance_path_contract.md`
- Issuance owner contract: `docs/contracts/v4-runtime-authorization-issuance-v1.md`
- Issuance schema: `docs/contracts/v4-runtime-authorization-issuance-v1.schema.json`
- Pending store contract: `docs/contracts/v4-runtime-authorization-pending-store-v1.md`
- Pending store schema: `docs/contracts/v4-runtime-authorization-pending-store-v1.schema.json`
- Issuance path discovery: `reports/architecture/v4_runtime_authorization_issuance_path_discovery.md`
- Durable spend ledger contract: `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`
- Provenance registry: `tools/v4-runtime-authorization-provenance-registry-v1.mjs`
- Execution endpoint: `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`
- WF40 id: `9ZMj2ACTKyDVhCue`
