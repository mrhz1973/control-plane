# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (83 nodes)** · Windows execution endpoint **PERSISTED** · first human-authorized direct local OpenCode/Qwen execution **PASS** · production PostgreSQL 16.15 **LIVE** · no ACTIVE authorization |
| **BLOCCO ATTIVO** | `V4_QWEN_LOCAL_ROLE_ROUTING_RUNTIME_INTEGRATION_AND_WF40_LIVE_PROOF_PREP` — **READY** |
| **STATO BLOCCO** | Benchmark policy persisted: `OPUS_Q3` planner/reviewer + `DCFR_IQ3` FAST_AGENT/executor · old universal `fast_8k`/DFlash runtime contract **SUPERSEDED** · runtime/profile integration not yet mechanically proven |
| **GATE CORRENTE** | **CLOSED** · D-0025 `enabled=false` |
| **NEXT** | `V4_QWEN_LOCAL_ROLE_ROUTING_RUNTIME_INTEGRATION_AND_WF40_LIVE_PROOF_PREP` — integrate selected profiles/runtimes and migrate active DFlash-hardcoded contracts before any new local-Qwen generation |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **83 nodes** · post-WF61 authorization lane + transient poll fix |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **QWEN MODEL POLICY** | `configs/resources/qwen-local-model-policy.json` · policy `qwen38-rtx3060-2026-09-02` · OPUS_Q3=DAILY_QUALITY · DCFR_IQ3=FAST_AGENT · runtime integration pending |
| **QWEN ROLE POLICY** | `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md` · Control Plane only · Blender-specific routing explicitly excluded |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane · active DFlash assumptions pending migration |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → `127.0.0.1:18791` · native bounded OpenCode runner · first direct live execution PASS · currently no authorization |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · AUTH 001/002/004 `SPENT`; AUTH 003 absent; no ACTIVE entries |
| **AUTHORIZATION DURABLE SPEND LEDGER** | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` · one `ADMISSION_CONSUMED` record each for AUTH/EXEC 001, 002, and 004 · ledger-first admission preserved |
| **AUTHORIZATION ISSUANCE OWNER** | `tools/v4-runtime-authorization-issuance-v1.mjs` · pending store + direct Telegram decision handler + reconciliation · per-process single-writer mutation lane |
| **AUTHORIZATION ISSUANCE SERVICE** | `tools/serve-v4-runtime-authorization-issuance-v1.mjs` · Scheduled Task `ControlPlane-V4-RuntimeAuthorizationIssuance` → `127.0.0.1:18792` · register-pending + status ONLY · direct Telegram poller active · no `/issue` HTTP |
| **AUTHORIZATION ISSUANCE PRIVATE ROUTES** | `/v4/authorization/register-pending` + `/v4/authorization/status` → `127.0.0.1:18792` · tailnet only · no Funnel |
| **AUTHORIZATION ISSUANCE TESTS** | `tests/v4-runtime-authorization-issuance/run.mjs` · **60/60 PASS** (includes race regressions 58–60) |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · exact route `opencode+qwen_local` |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · bounded adapter · active fast_8k/DFlash binding pending role-routing migration |
| **PRODUCTION DATABASE** | n8n 2.33.3 on PostgreSQL 16.15 · volume `root_n8n_postgres_data_seqresync_retry_prod` · health 200 · sequence resync PASS · 10/10 natural WF40 ticks PASS |

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

## Qwen role-routing decision

The benchmark-selected Control Plane policy is now:

```text
OPUS_Q3  -> DAILY_QUALITY planner / reasoning / reviewer
DCFR_IQ3 -> FAST_AGENT executor / OpenCode / generic MCP / deterministic loops
```

The former universal production assumptions `qwen38-original-dflash2-8k`, `fast_8k`, `dflash_required=true`, and categorical AR prohibition are superseded. They remain present in active runtime code/contracts until the current integration block removes/migrates them. No new real local-Qwen generation is authorized before that integration passes.

Blender-specific routing is outside this Control Plane policy.

## Safety boundary

- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED;
- no ACTIVE runtime authorization;
- production PostgreSQL 16.15 healthy and preserved;
- latest canonical SQLite rollback backup preserved at `/root/n8n-postgres-migration-backups/20260901T143040Z_sequence_resync_retry_pre_postgres`;
- prior WF40 post-PostgreSQL live attempt STOP was safe: provider/register/execution/OpenCode/Qwen all zero;
- WF40 live retry is deferred until Qwen role-routing/runtime integration PASS.

## Puntatori

- Qwen machine-readable model policy: `configs/resources/qwen-local-model-policy.json`
- Qwen Control Plane role policy: `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md`
- WF40 post-PostgreSQL live proof STOP: `reports/architecture/v4_wf40_first_live_authorized_execution_proof_post_postgres.md`
- PostgreSQL cutover retry PASS: `reports/architecture/v4_n8n_postgres_execution_entity_sequence_resync_and_cutover_tick_validation_retry.md`
- Qwen session-manager contract to migrate: `docs/contracts/qwen-local-session-manager-v1.md`
- Current runtime config to migrate: `configs/resources/qwen-local-runtime.json`
