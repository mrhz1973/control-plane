# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.5 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (83 nodes)** · Windows execution endpoint **PERSISTED** · production PostgreSQL 16.15 **LIVE** · six-profile Qwen **Control Plane eligibility set PASS on 9-profile router superset** · AGG runtime role correction **PASS** (FAST_AGENT unqualified) · workstation-only OpenCode 64K profile **LIVE-VERIFIED / PASS** · workstation-only OpenCode 24K DEV profile **LIVE-VERIFIED / PASS (placement remediation)** · **LOCAL_DEV_EXECUTOR FIRST COMPLETE REAL QWEN EXECUTION = PASS** · no ACTIVE authorization |
| **BLOCCO ATTIVO** | `V4_LOCAL_DEV_N8N_ALWAYS_ON_LIVE_FAST_TRACK_V1` — **LIVE / PASS (2026-09-05)** · GPT_WEB authoring override esercitato · see **N8N LOCAL DEV ALWAYS-ON** row |
| **N8N LOCAL DEV ALWAYS-ON** | **N8N_LOCAL_DEV_ALWAYS_ON = LIVE / PASS** · n8n workflow 90 `90ldaa5a-4000-8000-000000000090` "90 - CP V4 LOCAL DEV ALWAYS-ON DISPATCHER - ACTIVE" **ACTIVE**, schedule 5 min (natural fire 306318 → WORK_EXECUTED_PASS LOCAL_DEV_B_D-9201-A → executor commit `dc12351` pushed+remote-verified) · Windows service `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` Scheduled Task `ControlPlane-V4-LocalDevDispatcher` → `127.0.0.1:18793/v1/tick` (single-flight BUSY, fail-closed repo hygiene, bounded result schema `local-dev-dispatch-tick-result-v1`) · Tailscale private route `/v4/local-dev/dispatch-tick` (no Funnel) · Telegram gate-notify path WIRED (notify only for human_gate/STOP/SERVICE_ERROR, credentials cloned in-memory from WF40 node, never persisted) · artifact `workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json` · WF40/WF61/D-0025/production UNCHANGED |
| **STATO BLOCCO** | OPUS Agent 24K qualified for FAST_AGENT/FAST_INTERACTIVE/FAST_AGENT_SHORT_TURN · scope-v3 digest `934123f0…f2548f7` · DCFR short-turn remains **UNQUALIFIED** and FAST_THROUGHPUT/LONG_TASK QUALIFIED · `<think>` caveat documented; exact-output compliance not claimed · scope-v2 historical |
| **GATE CORRENTE** | **CLOSED** · D-0025 `enabled=false` |
| **NEXT** | **N8N LOCAL DEV ALWAYS-ON = LIVE (segment 5)** · always-on infra LEFT ACTIVE (n8n wf90 + Windows dispatcher 18793 + Tailscale route) · idle ticks → `IDLE_CLEAN`, no synthetic heartbeat manufacturing · next real work: wait for genuinely useful READY items (or GPT-Web-authorized backlog) in the always-on domain `reports/runtime/dev-queue/always-on/` · `GPT_WEB_N8N_AUTHORING_REQUIRED` gate SUPERSEDED by exercised GPT_WEB override |
| **CAMPAIGN** | `V4_LOCAL_DEV_EXECUTOR_OVERNIGHT_AUTOVIA_CAMPAIGN_V1` — **SEGMENT 5 LIVE (always-on)** · cumulativo: PASSES=15 · REAL_LOCAL_DEV_EXECUTIONS=9 (8 storici + `dc12351` scheduled always-on CREATE — prima esecuzione DEV triggerata da scheduler n8n via transport privato) · PRODUCTION_CHANGED=NO · D-0025=false · WF40 intatto (83 nodes) |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **83 nodes** · `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **QWEN MODEL POLICY** | `configs/resources/qwen-local-model-policy.json` + `configs/resources/qwen-router-catalog-scope-overlay.json` + `configs/resources/qwen-local-runtime.json` · **6 Control Plane-eligible / 9 router-visible** · startup `qwen38-opus-q3-daily-16k` unchanged · 2 workstation-local 96K profiles OUT OF SCOPE · OpenCode 64K + OpenCode 24K under `workstation_manual_profiles` (nomenclature migration V1 `#33` from Cline IDs, runtime parity verified), non-eligible/non-routed; OpenCode 64K **LIVE-VERIFIED / PASS**; OpenCode 24K **LIVE-VERIFIED (placement remediation smoke)** · next WF40 executor `qwen38-opus-q3-agent-24k` unchanged |
| **QWEN ROLE POLICY** | `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md` · exact eligible profile_id through `:8080` · OPUS Agent 24K qualified for short-turn roles · DCFR short-turn remains **UNQUALIFIED** · Blender workloads out of Control Plane scope · Uncensored manual override preserved |
| **QWEN ROLE QUALIFICATION** | `configs/resources/qwen-role-qualification.json` · overlay `qwen38-rtx3060-2026-09-03-agg` · DCFR = FAST_THROUGHPUT/LONG_TASK · live gate `roleQualifiedForLiveExecution` fail-closed for AGG roles |
| **QWEN SCOPE** | Active `qwen-execution-scope-v3` · digest `934123f0fe8c39b4783632aa014b9952a28396d8e7d6e8c6ca246cfe1f2548f7` · scope-v2 historical · no `dflash_required` |
| **LLAMA-UI COPY FIX** | workstation agentic/MCP Copy fix source + isolated `build-cuda-copyfix` validation **PASS** · production `build-cuda\bin` not switched during that work · no Control Plane runtime identity change |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane · collector reports router_assessment for `:8080` catalog/profile/readiness |
| **PRIVATE STATUS ENDPOINT** | `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · Tailscale private · VPS proof PASS |
| **WINDOWS EXECUTION ENDPOINT** | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` · Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` → `127.0.0.1:18791` · active scope-v3 bound · currently no authorization |
| **AUTHORIZATION PROVENANCE REGISTRY** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` · AUTH 001/002/004 `SPENT`; AUTH 003 absent; **ACTIVE=0** |
| **AUTHORIZATION DURABLE SPEND LEDGER** | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` · one `ADMISSION_CONSUMED` record each for AUTH/EXEC 001, 002, and 004 · ledger-first admission preserved |
| **AUTHORIZATION ISSUANCE OWNER** | `tools/v4-runtime-authorization-issuance-v1.mjs` · pending store + direct Telegram decision handler + reconciliation · per-process single-writer mutation lane |
| **AUTHORIZATION ISSUANCE SERVICE** | `tools/serve-v4-runtime-authorization-issuance-v1.mjs` · Scheduled Task `ControlPlane-V4-RuntimeAuthorizationIssuance` → `127.0.0.1:18792` · register-pending + status ONLY · direct Telegram poller active · no `/issue` HTTP |
| **AUTHORIZATION ISSUANCE PRIVATE ROUTES** | `/v4/authorization/register-pending` + `/v4/authorization/status` → `127.0.0.1:18792` · tailnet only · no Funnel |
| **AUTHORIZATION ISSUANCE TESTS** | `tests/v4-runtime-authorization-issuance/run.mjs` · **60/60 PASS** (includes race regressions 58–60) |
| **N8N ADAPTER ROUTER BRIDGE** | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` · offline complete · wired in WF40 · deliberately live-incapable |
| **EXECUTION ADAPTER ROUTER** | `tools/v4-execution-adapter-router-v1.mjs` · exact route `opencode+qwen_local` |
| **OPENCODE EXECUTION ADAPTER** | `tools/opencode-execution-adapter-v1.mjs` · bound to active scope-v3 · `profile_id=qwen38-opus-q3-agent-24k` · `<think>` caveat documented |
| **PRODUCTION DATABASE** | n8n 2.33.3 on PostgreSQL 16.15 · health 200 · sequence resync PASS |
| **LOCAL DEV EXECUTOR** | `docs/contracts/local-dev-executor-v1.md` · **V1 IMPLEMENTED + WIRED + SAFETY-ENFORCED + DEV SESSION BRIDGE** · `tools/local-dev-executor-v1.mjs` + `tools/run-local-dev-executor-v1.mjs` + `tools/local-dev-generation-guard-v1.mjs` · hard timebox + path enforcement + V1 deny-first permission overlay · `ensureWorkstationDevQwenReady` DEV bridge (workstation_manual_profiles only, no production doc/role-map validation) · tests **20/20** + **42/42** + bridge **14/14 PASS** (suite ora 21/21 dopo regressione option-B) · `workstation_dev_executor_profile` DEFAULT `qwen38-opus-q3-opencode-24k` (nomenclature migration V1 `#33`: cline→opencode IDs, runtime parity verified, preset hash pre/post + semantic diff persisted; OpenCode64K selezionabile esplicitamente; smoke non-edit ×2 PASS via OpenCode exact selection; CLINE_UNINSTALL_ELIGIBLE=YES) · provider-neutral `executor-pass:`/`executor-stop:` evidence · **real dev executions: 1 complete + 1 STOP-classified** (RETRY6-12 historical diagnostics; FIRST COMPLETE LIVE PROOF 24K **PASS**: profile 24K, turns 5/10, timebox 280/600, REAL_QWEN_GENERATIONS=5, SUBAGENT_USED=NO, executor HEAD 439de02 pushed+verified; overnight campaign bridged run **STOP:GIT_PERSISTENCE_FAILED** — new-file objective vs tracked-only persistence, executor per contract, evidence persisted) |

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

The router exposes a 9-profile superset. The 2 workstation-local 96K profiles
and live-verified OpenCode 64K profile are explicitly out of Control Plane scope
and must be ignored by Control Plane automatic routing. See
`configs/resources/qwen-router-catalog-scope-overlay.json` and
`configs/resources/qwen-local-runtime.json`.

DFlash2 profiles remain retired. The `llama.cpp-dflash2` directory remains the
normal llama.cpp production runtime. Control Plane must not reconstruct backend
launch commands.

## Safety boundary

- WF61 inactive; D-0025 CLOSED;
- live execution CLOSED until next authorized WF40 proof;
- no ACTIVE runtime authorization;
- production PostgreSQL 16.15 healthy and preserved;
- six-profile Control Plane eligibility and AGG qualification state preserved despite 9-profile router superset;
- workstation llama-ui Copy fix is validated but not a Control Plane production-runtime switch;
- this reconciliation imports no Blender workload/scene/animation state.

## Puntatori

> Nota nomenclatura (2026-09-05, migrazione V1 `#33`): i profili DEV workstation sono oggi
> `qwen38-opus-q3-opencode-24k` / `qwen38-opus-q3-opencode-64k` (ex-Cline). I report storici
> elencati sotto mantengono i nomi file e gli ID Cline originali come HISTORICAL_PROVENANCE —
> vedi `reports/architecture/v4_qwen_dev_profiles_opencode_nomenclature_migration_v1.md`.

- Workstation Qwen reconciliation: `reports/architecture/v4_qwen_workstation_runtime_reconciliation_2026-09-04.md`
- Router catalog scope overlay: `configs/resources/qwen-router-catalog-scope-overlay.json`
- Retained-profile comparison: `reports/architecture/v4_qwen_short_turn_profile_comparison_retained_profiles.md`
- Live retained-profile comparison: `reports/architecture/v4_qwen_short_turn_live_comparison_retained_profiles.md`
- OPUS24K scope-v3 selection: `reports/architecture/v4_qwen_short_turn_profile_selection_opus24k_scope_v3.md`
- Cline 64K Control Plane registration: `reports/architecture/qwen38_opus_q3_cline_64k_profile_control_plane.md`
- Cline 64K live smoke PASS: `reports/architecture/qwen38_opus_q3_cline_64k_live_smoke_test.md`
- LOCAL_DEV_EXECUTOR design: `docs/contracts/local-dev-executor-v1.md` + `reports/architecture/v4_local_dev_executor_qwen_general_purpose_design.md`
- LOCAL_DEV_EXECUTOR implementation: `reports/architecture/v4_local_dev_executor_qwen_general_purpose_implementation_v1.md`
- LOCAL_DEV_EXECUTOR live runner wiring: `reports/architecture/v4_local_dev_executor_live_runner_wiring_v1.md`
- LOCAL_DEV_EXECUTOR live safety enforcement: `reports/architecture/v4_local_dev_executor_live_safety_enforcement_v1.md`
- LOCAL_DEV_EXECUTOR workstation session bridge: `reports/architecture/v4_local_dev_executor_workstation_session_bridge_v1.md`
- LOCAL_DEV_EXECUTOR Windows OpenCode shim spawn fix: `reports/architecture/v4_local_dev_executor_windows_opencode_shim_spawn_fix_v1.md`
- LOCAL_DEV_EXECUTOR OpenCode failure evidence: `reports/architecture/v4_local_dev_executor_opencode_failure_evidence_v1.md`
- LOCAL_DEV_EXECUTOR OpenCode V1 permission schema fix: `reports/architecture/v4_local_dev_executor_opencode_permission_schema_fix_v1.md`
- LOCAL_DEV_EXECUTOR hard timeout/process control: `reports/architecture/v4_local_dev_executor_hard_timeout_process_control_and_preflight_diagnostics_v1.md`
- LOCAL_DEV_EXECUTOR timeout arbitration + OpenCode pregen boundary diagnostic: `reports/architecture/v4_local_dev_executor_timeout_arbitration_and_opencode_pregeneration_boundary_diagnostic_v1.md`
- LOCAL_DEV_EXECUTOR test-harness handle-shape fix: `reports/architecture/v4_local_dev_executor_test_harness_handle_shape_fix_v1.md`
- Cline64K router latency determinism diagnostic (classification C): `reports/architecture/v4_cline64k_router_latency_determinism_diagnostic_v1.md`
- Cline64K backend runtime state inspection (classification B): `reports/architecture/v4_cline64k_backend_runtime_state_inspection_v1.md`
- Cline24K DEV profile placement remediation PASS (option B): `reports/architecture/v4_cline24k_dev_profile_placement_remediation_v1.md`
- LOCAL_DEV_EXECUTOR first complete live proof Cline24K PASS: `reports/architecture/v4_local_dev_executor_qwen_first_complete_live_proof_cline24k_v1.md`
- AGG role correction PASS report: `reports/architecture/v4_qwen_agg_runtime_role_correction_dcfr_short_turn.md`
- Role-qualification overlay: `configs/resources/qwen-role-qualification.json`
- Integration PASS report: `reports/architecture/v4_qwen_local_6_profile_router_control_plane_integration.md`
- Scope v2 contract: `docs/contracts/qwen-execution-scope-v2.md`
- Qwen machine-readable model policy: `configs/resources/qwen-local-model-policy.json`
- Qwen Control Plane role policy: `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md`
- WF40 post-PostgreSQL live proof STOP: `reports/architecture/v4_wf40_first_live_authorized_execution_proof_post_postgres.md`
- PostgreSQL cutover retry PASS: `reports/architecture/v4_n8n_postgres_execution_entity_sequence_resync_and_cutover_tick_validation_retry.md`
