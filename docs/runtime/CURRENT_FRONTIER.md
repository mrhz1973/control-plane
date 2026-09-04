# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.5 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (83 nodes)** · Windows execution endpoint **PERSISTED** · production PostgreSQL 16.15 **LIVE** · six-profile Qwen **Control Plane eligibility set PASS on 8-profile router superset** · AGG runtime role correction **PASS** (FAST_AGENT unqualified) · no ACTIVE authorization |
| **BLOCCO ATTIVO** | `V4_QWEN_AGG_RUNTIME_ROLE_CORRECTION_DCFR_SHORT_TURN` — **PASS** |
| **STATO BLOCCO** | DCFR short-turn interactive roles **UNQUALIFIED** (overlay `qwen38-rtx3060-2026-09-03-agg`) · DCFR preserved as FAST_THROUGHPUT/LONG_TASK · next-WF40-executor mapping marked STALE · fail-closed gates at dispatch/proposal/mint/adapter/seam · six Control Plane profiles preserved · router may expose 2 additional local-only out-of-scope profiles · scope v2 digest unchanged |
| **GATE CORRENTE** | **CLOSED** · D-0025 `enabled=false` |
| **NEXT** | `V4_QWEN_SHORT_TURN_PROFILE_COMPARISON_RETAINED_PROFILES` — compare `qwen38-original-ar-16k` / `qwen38-opus-q3-daily-16k` / `qwen38-opus-q3-agent-24k` for short-turn interactive agent workloads; requalification requires overlay update + explicit operator authorization; live WF40 proof deferred until then |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **83 nodes** · `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **QWEN MODEL POLICY** | `configs/resources/qwen-local-model-policy.json` + `configs/resources/qwen-router-catalog-scope-overlay.json` · **6 Control Plane-eligible / 8 router-visible** · startup `qwen38-opus-q3-daily-16k` unchanged · 2 additional workstation-local 96K profiles explicitly OUT OF SCOPE · next WF40 executor `qwen38-dcfr-iq3-agent-24k` remains STALE |
| **QWEN ROLE POLICY** | `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md` · exact eligible profile_id through `:8080` · router catalog superset allowed but unlisted profiles ignored · **AGG: FAST_AGENT/FAST_INTERACTIVE/FAST_AGENT_SHORT_TURN UNQUALIFIED pending comparison** · Blender workloads out of Control Plane scope · Uncensored manual override preserved |
| **QWEN ROLE QUALIFICATION** | `configs/resources/qwen-role-qualification.json` · overlay `qwen38-rtx3060-2026-09-03-agg` · DCFR = FAST_THROUGHPUT/LONG_TASK · live gate `roleQualifiedForLiveExecution` fail-closed for AGG roles |
| **QWEN SCOPE** | `qwen-execution-scope-v2` · digest `5261290cbdda414de0a6bd5ffd79e939f805eefde3fe2e39a8f490c5a2e02261` · no `dflash_required` |
| **LLAMA-UI COPY FIX** | workstation agentic/MCP Copy fix source + isolated `build-cuda-copyfix` validation **PASS** · production `build-cuda\bin` not switched during that work · no Control Plane runtime identity change |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane · collector reports router_assessment for `:8080` catalog/profile/readiness |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → `127.0.0.1:18791` · scope v2 bound · currently no authorization |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · AUTH 001/002/004 `SPENT`; AUTH 003 absent; **ACTIVE=0** |
| **AUTHORIZATION DURABLE SPEND LEDGER** | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` · one `ADMISSION_CONSUMED` record each for AUTH/EXEC 001, 002, and 004 · ledger-first admission preserved |
| **AUTHORIZATION ISSUANCE OWNER** | `tools/v4-runtime-authorization-issuance-v1.mjs` · pending store + direct Telegram decision handler + reconciliation · per-process single-writer mutation lane |
| **AUTHORIZATION ISSUANCE SERVICE** | `tools/serve-v4-runtime-authorization-issuance-v1.mjs` · Scheduled Task `ControlPlane-V4-RuntimeAuthorizationIssuance` → `127.0.0.1:18792` · register-pending + status ONLY · direct Telegram poller active · no `/issue` HTTP |
| **AUTHORIZATION ISSUANCE PRIVATE ROUTES** | `/v4/authorization/register-pending` + `/v4/authorization/status` → `127.0.0.1:18792` · tailnet only · no Funnel |
| **AUTHORIZATION ISSUANCE TESTS** | `tests/v4-runtime-authorization-issuance/run.mjs` · **60/60 PASS** (includes race regressions 58–60) |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · exact route `opencode+qwen_local` |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · bound to scope v2 · `profile_id=qwen38-dcfr-iq3-agent-24k` · **AGG: role-qualification gate blocks FAST_AGENT live execution** |
| **PRODUCTION DATABASE** | n8n 2.33.3 on PostgreSQL 16.15 · health 200 · sequence resync PASS |

## Installed execution path

```text
WF40 structural routing
  -> Windows execution transport
  -> Tailscale-private /v4/execution/opencode-local
  -> 127.0.0.1:18791
  -> durable spend ledger
  -> provenance ACTIVE->SPENT
  -> adapter / occupancy / guard / OpenCode / Qwen MultiModel :8080
```

## Qwen Control Plane six-profile routing (authoritative eligibility subset)

```text
DAILY/QUALITY          -> qwen38-opus-q3-daily-16k
QUALITY_AGENT_24K      -> qwen38-opus-q3-agent-24k
FAST                   -> qwen38-dcfr-iq3-fast-16k
FAST_AGENT/MCP/BLENDER -> qwen38-dcfr-iq3-agent-24k   [AGG: STALE for live short-turn — UNQUALIFIED]
FAST_THROUGHPUT_LONG_TASK -> qwen38-dcfr-iq3-agent-24k [AGG: QUALIFIED]
REFERENCE              -> qwen38-original-ar-16k
MANUAL_UNCENSORED      -> qwen38-uncensored-ar-16k (explicit only)
```

The router may expose a superset. As observed on 2026-09-04 it exposes 8 profiles; the 2 additional workstation-local 96K profiles are explicitly out of Control Plane scope and must be ignored by Control Plane automatic routing. See `configs/resources/qwen-router-catalog-scope-overlay.json`.

DFlash2 profiles remain retired. The `llama.cpp-dflash2` directory remains the
normal llama.cpp production runtime. Control Plane must not reconstruct backend
launch commands.

## Safety boundary

- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED until next authorized WF40 proof;
- no ACTIVE runtime authorization;
- production PostgreSQL 16.15 healthy and preserved;
- six-profile Control Plane eligibility and AGG qualification state preserved despite 8-profile router superset;
- workstation llama-ui Copy fix is validated but not a Control Plane production-runtime switch;
- this reconciliation imports no Blender workload/scene/animation state.

## Puntatori

- Workstation Qwen reconciliation: `reports/architecture/v4_qwen_workstation_runtime_reconciliation_2026-09-04.md`
- Router catalog scope overlay: `configs/resources/qwen-router-catalog-scope-overlay.json`
- AGG role correction PASS report: `reports/architecture/v4_qwen_agg_runtime_role_correction_dcfr_short_turn.md`
- Role-qualification overlay: `configs/resources/qwen-role-qualification.json`
- Integration PASS report: `reports/architecture/v4_qwen_local_6_profile_router_control_plane_integration.md`
- Scope v2 contract: `docs/contracts/qwen-execution-scope-v2.md`
- Qwen machine-readable model policy: `configs/resources/qwen-local-model-policy.json`
- Qwen Control Plane role policy: `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md`
- WF40 post-PostgreSQL live proof STOP: `reports/architecture/v4_wf40_first_live_authorized_execution_proof_post_postgres.md`
- PostgreSQL cutover retry PASS: `reports/architecture/v4_n8n_postgres_execution_entity_sequence_resync_and_cutover_tick_validation_retry.md`
