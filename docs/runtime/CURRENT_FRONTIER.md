# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (71 nodes)** · Windows execution endpoint **PERSISTED** · first human-authorized local OpenCode/Qwen execution **PASS** · AUTH 004 durably spent · no ACTIVE authorization |
| **BLOCCO ATTIVO** | `V4_N8N_POSTGRES_LEGACY_SCHEDULE_TRIGGER_CRON_FIRE_RUNTIME_INSTRUMENTATION` — **PASS** |
| **STATO BLOCCO** | Cron runtime instrumentation: legacy path fires on PG (`HANDLE_TICK` + leader) · executions insert · **`execution_entity_id_seq` desync** masks `id>baseline` tick queries · **no production mutation** |
| **GATE CORRENTE** | **CLOSED** · D-0025 `enabled=false` |
| **NEXT** | `V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION` |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **83 nodes** · post-WF61 authorization lane + transient poll fix |
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

## Safety boundary

- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED;
- PostgreSQL migration blocked pending sequence resync validation;
- production SQLite unchanged.

## Puntatori

- Cron fire instrumentation: `reports/architecture/v4_n8n_postgres_legacy_schedule_trigger_cron_fire_runtime_instrumentation.md`
- Schedule trigger registration diagnosis retry008: `reports/architecture/v4_n8n_postgres_schedule_trigger_registration_diagnosis_retry008.md`
- Prior scheduler postgres proof retry007: `reports/architecture/v4_n8n_controlled_production_postgres_migration_retry_007_wf40_scheduler_postgres_proof.md`
