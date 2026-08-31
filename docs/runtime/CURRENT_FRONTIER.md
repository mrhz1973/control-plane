# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (71 nodes)** · Windows execution endpoint **PERSISTED** · first human-authorized local OpenCode/Qwen execution **PASS** · AUTH 004 durably spent · no ACTIVE authorization |
| **BLOCCO ATTIVO** | `V4_WF40_STATUS_POLL_TRANSIENT_ERROR_FIX_AND_LIVE_PROOF_RESUME` — **STOP (Phase E preflight)** |
| **STATO BLOCCO** | STATUS_POLL_FIX_PASS · WF40_SEAM_83_LIVE · BUGBOT_PASS · live proof **NOT STARTED** · QWEN_BUSY_SHARED_RUNTIME (`llama-server` on `:58074`) · WF40=0 · WF61=0 · planner=0 · Telegram=0 · AUTH preserved SPENT · no ACTIVE authorization |
| **GATE CORRENTE** | **CLOSED TO LIVE EXECUTION** · D-0025 gate CLOSED |
| **NEXT** | Restore stable `QWEN_READY_IDLE`, then resume `V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF` |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **83 nodes** · versionId `a609ad90-7eb4-4495-9ec5-c4413165cea1` · post-WF61 authorization lane with transient status-poll fix |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → `127.0.0.1:18791` · native bounded OpenCode runner · first live execution PASS · currently no authorization |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · AUTH 001/002/004 `SPENT`; AUTH 003 absent; no ACTIVE entries |
| **AUTHORIZATION DURABLE SPEND LEDGER** | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` · one `ADMISSION_CONSUMED` record each for AUTH/EXEC 001, 002, and 004 · ledger-first admission preserved |
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

Live execution is CLOSED after the successful one-shot proof. AUTH 004 is durably SPENT and no ACTIVE authorization remains.

## Ratified human-gated issuance path — first live proof complete

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

Live cycle 004 completed with one Telegram decision message, one human APPROVE, one execution POST, one OpenCode execution, and one Qwen generation. Pending 004 is ISSUED; AUTH 004 is SPENT; AUTH 003 remains absent.

## Safety boundary

- dedicated issuance bot configured server-side only (token not on cmdline / not exposed);
- exactly one Telegram decision message and one human APPROVE in cycle 004;
- exactly one guarded Qwen generation and one OpenCode execution;
- retry 0, fallback 0, WF40 executions 0, WF61 executions 0, cloud provider calls 0;
- AUTH 001/002 preserved SPENT, AUTH 003 absent, AUTH 004 SPENT, no ACTIVE authorization;
- next block is the WF40 first live authorized execution proof;
- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED.

## Puntatori

- First live authorized execution retry 004: `reports/architecture/v4_first_live_authorized_execution_retry_004.md`
- Issuance production wiring/persistence: `reports/architecture/v4_runtime_authorization_issuance_production_service_wiring_and_persistence.md`
- Issuance owner tool: `tools/v4-runtime-authorization-issuance-v1.mjs`
- Issuance service tool: `tools/serve-v4-runtime-authorization-issuance-v1.mjs`
- Issuance tests: `tests/v4-runtime-authorization-issuance/run.mjs`
- Issuance contract ratification/hardening: `reports/architecture/v4_runtime_authorization_issuance_path_contract.md`
- Issuance implementation offline: `reports/architecture/v4_runtime_authorization_issuance_path_implementation_offline.md`
- Prior STOP (race): `reports/runtime/cursor-stops/2026-08-31T193000Z__V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRODUCTION_SERVICE_WIRING_AND_PERSISTENCE.stop.json`
