# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.5 — LiteLLM primary remote gateway — CANONICAL |
| **MICRO_TASK_DELTA LAW** | `docs/foundation/MICRO_TASK_DELTA_OPERATING_LAW.md` — **CANONICAL** (#42) · **ADMISSION+SAFE-FF LIVE** (#48/#50) · **#54/#56/#58 PASS** · **AUTOMATED_MICRO_TASK_CHAIN=LIVE_PROVEN** · LOCAL_DEV_ONLY=YES · PRODUCTION_MODEL_EXECUTION_AUTHORIZED=NO · D0025_ENABLED=false · proven: D-9301-H (`1fc0189`) + D-9302-C (`7621894` S16) + D-9302-D (`963a40e` S17, base=C self-FF) · historical A/B STOP+S15 residue preserved · Bugbot CLEAN |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 lanes **APPLIED LIVE (83 nodes)** · Windows execution endpoint **PERSISTED** · production PostgreSQL 16.15 **LIVE** · six-profile Qwen **Control Plane eligibility set PASS on 9-profile router superset** · AGG runtime role correction **PASS** (FAST_AGENT unqualified) · workstation-only OpenCode 64K profile **LIVE-VERIFIED / PASS** · workstation-only OpenCode 24K DEV profile **LIVE-VERIFIED / PASS (placement remediation)** · **LOCAL_DEV_EXECUTOR FIRST COMPLETE REAL QWEN EXECUTION = PASS** · no ACTIVE authorization · **#60/#67/#68 VPS migration · prep-copy PASS · Hermes web/auth/persistence/recall PASS + RESOURCE_BASELINE=GREEN (#67) · OLD_DECOMMISSION_ELIGIBLE=NO** |
| **BLOCCO ATTIVO** | `V4_LOCAL_DEV_N8N_ALWAYS_ON_LIVE_FAST_TRACK_V1` — **LIVE / PASS (2026-09-05)** · GPT_WEB authoring override esercitato · see **N8N LOCAL DEV ALWAYS-ON** row |
| **N8N LOCAL DEV ALWAYS-ON** | **N8N_LOCAL_DEV_ALWAYS_ON = LIVE / PASS** · n8n workflow 90 `90ldaa5a-4000-8000-000000000090` "90 - CP V4 LOCAL DEV ALWAYS-ON DISPATCHER - ACTIVE" **ACTIVE**, schedule 5 min (natural fire 306318 → WORK_EXECUTED_PASS LOCAL_DEV_B_D-9201-A → executor commit `dc12351` pushed+remote-verified) · Windows service `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` Scheduled Task `ControlPlane-V4-LocalDevDispatcher` → `127.0.0.1:18793/v1/tick` (single-flight BUSY, fail-closed repo hygiene, bounded result schema `local-dev-dispatch-tick-result-v1`) · Tailscale private route `/v4/local-dev/dispatch-tick` (no Funnel) · **POST-CUTOVER STORM REMEDIATED (#72):** root cause `NEW_N8N_TO_TAILSCALE_ROUTE_FAILURE`, exact missing private grant NEW `100.99.54.93/32` → asusdesktop `100.110.35.23/32` TCP/443 added; live WF90 normalizer remained byte-equal canonical (`9f4184e9802ea4a0`), dispatcher/Serve healthy; natural ticks `313916` and `313927` both `IDLE_CLEAN`, `response_valid=true`, `notify_required=false`, Telegram runs `0`; no public/Funnel/OLD mutation · Telegram gate-notify path WIRED (notify only for human_gate/STOP/SERVICE_ERROR, credentials cloned in-memory from WF40 node, never persisted) · artifact `workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json` (**WF90_NORMALIZER_FIX=LIVE_APPLIED** — `V4_WF90_HTTP409_NORMALIZATION_FIX_V1` repo fix (focused tests 11/11) + `V4_WF90_HTTP409_NORMALIZATION_LIVE_APPLY_V1` live apply (2026-09-05T22:16Z): normalizer node recovers a schema-valid `local-dev-dispatch-tick-result-v1` embedded in an n8n/Axios `error.message` envelope and normalizes it like 2xx — HTTP status alone never infers HUMAN_GATE_REQUIRED; live jsCode byte-equal canonical `579fa67` (sha256 prefix `9f4184e9802ea4a0`), published+active version `febca537-…`, post-apply verification 17/17 PASS, natural tick 308056 IDLE_CLEAN success on the new normalizer, Telegram credential binding preserved, topological/config delta = zero outside the one jsCode field) · WF40/WF61/D-0025/production UNCHANGED |
| **STATO BLOCCO** | OPUS Agent 24K qualified for FAST_AGENT/FAST_INTERACTIVE/FAST_AGENT_SHORT_TURN · scope-v3 digest `934123f0…f2548f7` · DCFR short-turn remains **UNQUALIFIED** and FAST_THROUGHPUT/LONG_TASK QUALIFIED · `<think>` caveat documented; exact-output compliance not claimed · scope-v2 historical |
| **LOCAL DEV DISPATCHER RUNTIME** | `LOCAL_DEV_DISPATCHER_RUNTIME_RESTORE=PASS` · `LOCAL_DEV_DISPATCHER_SCHEDULED_TASK=LIVE` · `LOCAL_DEV_DISPATCHER_BIND=127.0.0.1:18793` · `DISPATCHER_RUNTIME_REVISION=ALIGNED` · `LOCAL_DEV_HERMES_OPERATOR_VISIBILITY=PASS` · `LOCAL_DEV_OPENCODE_OPERATOR_VISIBILITY=PASS` · `HERMES_LIVE_ACTIVITY=PARTIAL_NOT_OBSERVED` · `CHAIN_OF_THOUGHT_DISPLAY=NO` · `TAILSCALE_DASHBOARD_SURFACE=LIVE` · `LOCAL_DEV_DASHBOARD_VISIBLE_LANGUAGE=ITALIAN` · `INTERNAL_STATE_CODES_UNCHANGED=YES` · `CANONICAL_COMPONENT_NAMES_PRESERVED=YES` · `LOCAL_DEV_QUOTA_EFFECTIVE_VISIBLE=NO` · `CODEX_PER_WINDOW_RESET_VISIBLE=PASS` · `GLM_PER_WINDOW_RESET_VISIBLE=PASS` · `CURSOR_PLAN_RESET_VISIBLE=PASS` · `CODEX_5H_RESET_LIVE=NOT_PROVIDED_BY_SOURCE` · `CODEX_WEEKLY_RESET_LIVE=NOT_PROVIDED_BY_SOURCE` · `GLM_5H_RESET_LIVE=NOT_PROVIDED_BY_SOURCE` · `GLM_WEEKLY_RESET_LIVE=NOT_PROVIDED_BY_SOURCE` · `CURSOR_PLAN_RESET_SOURCE=MANUAL_REQUIRED` · `QUOTA_RESET_VALUES_INVENTED=NO` · `MODEL_INFERENCE_CALLS=0` · `QUOTA_RESET_TIMEZONE=Europe/Rome` · `INTERNAL_EFFECTIVE_QUOTA_PRESERVED=YES` |
| **GATE CORRENTE** | **CUTOVER PASS / ROLLBACK RETENTION OPEN** · D-0025 `enabled=false` · NEW LIVE (`31.70.139.73`, `100.99.54.93`, `ionos-n8n-new.tailc01234.ts.net`) · OLD frozen rollback standby · decommission unauthorized |
| **VPS MIGRATION** | #68 production cutover PASS · NEW n8n live with exact 4-workflow publication map · GOI/TLS/private topology PASS · OLD PostgreSQL/GOI retained intact |
| **VPS INDEPENDENT EVIDENCE AUDIT** | `CODEX_A01_F03_REVIEW_CLOSURE=PASS` · previous Codex blocker closed for A01/F03 by superseding evidence; bounded independent review, not a new full audit · exact soak `37 = 29 + 2 + 6`, boundary WF90 `313135`, unexplained `0` · pruning `PLAUSIBLE_NOT_PROVEN` nonblocking · F03 `32/2`, separate registry `20/1` · retention OPEN/no auto-expiry; decommission ineligible/unauthorized · report `reports/architecture/v4_vps_codex_a01_f03_review_closure_v1.md` |
| **NEXT** | **V4_LOCAL_DEV_RESOURCE_OBSERVABILITY_INTEGRITY=PASS** · `DASHBOARD_RED_STATE_REQUIRES_REAL_FAILURE=YES` · `VPS_PRIVATE_OBSERVATION=LIVE` · `LOCAL_DEV_DASHBOARD_VPS_CARD=PASS` · `RESOURCE_CARD_REORDER=PASS` · `CHATGPT_WEB_RESOURCE_CARD=REMOVED` · `VPS_UI_NAME=VPS` · `QWEN_CANONICAL_ENDPOINT_502_RECOVERY=PASS` · `QWEN_CANONICAL_ENDPOINT=http://127.0.0.1:8080` · `QWEN_RESOURCE_HEALTH=AVAILABLE` · `LOCAL_DEV_DISPATCHER_RUNTIME_RESTORE=PASS` · `LOCAL_DEV_DISPATCHER_SCHEDULED_TASK=LIVE` · `LOCAL_DEV_DISPATCHER_BIND=127.0.0.1:18793` · `DISPATCHER_RUNTIME_REVISION=ALIGNED` · `LOCAL_DEV_HERMES_OPERATOR_VISIBILITY=PASS` · `LOCAL_DEV_OPENCODE_OPERATOR_VISIBILITY=PASS` · `HERMES_LIVE_ACTIVITY=PARTIAL_NOT_OBSERVED` · `CHAIN_OF_THOUGHT_DISPLAY=NO` · `TAILSCALE_DASHBOARD_SURFACE=LIVE` · operator-priority **NEXT = HUMAN_GATE_CURSOR_PLAN_RESET_DATE** · **#77 CLOSED / COMPLETED — fail-closed receipt-ledger prerequisite satisfied** · **#73 remains OPEN · ISSUE_73_PHASE_C=PASS · PHASE_D=OPEN** (cumulative V5 real request + V6 deterministic late-result reconciliation; V5/V7 STOP classifications preserved; checkpoint `reports/architecture/v4_hermes_phase_c_closure_checkpoint_v8.md`) · controller A/B diagnostic: raw Qwen refusal versus raw GLM 5.3 Flash PASS, wrapper inspection found no injected policy, `ROOT_CAUSE=QWEN_MODEL_BEHAVIOR` · governed Codex CDP and isolated NEW VPS 08/12 shadow qualification V7 = **PASS / PREFILL_ONLY**; `GLM_ELIGIBLE_08_12=NO`; `PRODUCTION_ROUTING_ENABLED=NO` · previous gate = **VPS_CODEX_08_12_PROMOTION_GATE_AND_PHASE_D_CHAT_N**; GLM remains diagnostic-only and is not promoted · Phase D remains separately gated; Phase E/F and production promotion remain separately gated · **D-9401-B MATERIAL_COMPLETION=PASS** (implementation `e0cbed0` `registry: register ChatGPT Web Hermes access surface`; legacy receipt reconciled terminal PASS without Qwen/OpenCode rerun; selector blocked) · **QWEN_INDEPENDENT_QUALIFIED=YES** (D-9405-A/B/C campaign PASS @ `11d5341`) · dispatcher dashboard live `http://127.0.0.1:18793/dashboard` + `/v1/diagnostics` (base `574760d`, Astra upgrade `1a06196`) · keep rollback retention OPEN; OpenClaw `KEEP_STAGED_PENDING` · historical: D-9403-E `8048d5e`; Qwen autorecovery; D-9404-A `c2ca76e` · quota live-source qualification report `reports/architecture/v4_local_dev_quota_reset_live_source_qualification_v1.md` |
| **CAMPAIGN** | `V4_LOCAL_DEV_EXECUTOR_OVERNIGHT_AUTOVIA_CAMPAIGN_V1` — **SEGMENT 5 LIVE (always-on)** · cumulativo: PASSES=15 · REAL_LOCAL_DEV_EXECUTIONS=9 (8 storici + `dc12351` scheduled always-on CREATE — prima esecuzione DEV triggerata da scheduler n8n via transport privato) · PRODUCTION_CHANGED=NO · D-0025=false · WF40 intatto (83 nodes) |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **83 nodes** · `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **QWEN MODEL POLICY** | `configs/resources/qwen-local-model-policy.json` + `configs/resources/qwen-router-catalog-scope-overlay.json` + `configs/resources/qwen-local-runtime.json` · **6 Control Plane-eligible / 9 router-visible** · startup `qwen38-opus-q3-daily-16k` unchanged · 2 workstation-local 96K profiles OUT OF SCOPE · OpenCode 64K + OpenCode 24K under `workstation_manual_profiles` (nomenclature migration V1 `#33` from Cline IDs, runtime parity verified), non-eligible/non-routed; OpenCode 64K **LIVE-VERIFIED / PASS**; OpenCode 24K **LIVE-VERIFIED (placement remediation smoke)** · next WF40 executor `qwen38-opus-q3-agent-24k` unchanged |
| **QWEN ROLE POLICY** | `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md` · exact eligible profile_id through `:8080` · OPUS Agent 24K qualified for short-turn roles · DCFR short-turn remains **UNQUALIFIED** · Blender workloads out of Control Plane scope · Uncensored manual override preserved |
| **QWEN ROLE QUALIFICATION** | `configs/resources/qwen-role-qualification.json` · overlay `qwen38-rtx3060-2026-09-03-agg` · DCFR = FAST_THROUGHPUT/LONG_TASK · live gate `roleQualifiedForLiveExecution` fail-closed for AGG roles |
| **QWEN SCOPE** | Active `qwen-execution-scope-v3` · digest `934123f0fe8c39b4783632aa014b9952a28396d8e7d6e8c6ca246cfe1f2548f7` · scope-v2 historical · no `dflash_required` |
| **LLAMA-UI COPY FIX** | workstation agentic/MCP Copy fix source + isolated `build-cuda-copyfix` validation **PASS** · production `build-cuda\bin` not switched during that work · no Control Plane runtime identity change |
| **RESOURCE_REGISTRY** | `configs/resources/registry.json` **v2** (`resource-registry-v2`, issue #37) · separates MODEL/ROLE → ACCESS_SURFACE → QUOTA_POOL · shared pools: `chatgpt_codex_subscription` (codex_ide_cursor_extension + codex_external_planner, subscription-only, NO OpenAI API/BYOK), `glm_coding_plan` (glm-5.3 + glm-5.3-flash) · Cursor = harness (allowance unverified, no invented pool) · OpenCode/Qwen local = unmetered, no commercial pool · no dynamic quota values (static registry) · Codex model selection dynamic/not frozen · v1 `resources` projection preserved verbatim (validator shim + router/bridge accept v1|v2) · focused suite 56/56 + consumer suites 135/135 PASS · live quota collectors NOT yet implemented (next #32 slice) |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · wired in WF40 TRUE lane · collector reports router_assessment for `:8080` catalog/profile/readiness |
| **QUOTA_AWARE_RUNTIME** | **CANONICAL_RUNTIME_WIRED_BEHIND_CLOSED_GATE** (`V4_CANONICAL_QUOTA_RUNTIME_FINAL_CLOSURE_CHECKPOINT_V1`, issue #46 / parent #41, base `12d4e2e`) — ALL FOUR roles proven through REAL canonical runtime boundaries (not mere composability): (1) PLANNER `prepareCycle`/`evaluate-planner-selection` consume canonical quota state, stale/missing commercial fail-closed; (2) EXECUTION `evaluateExecutionRoute` emits RT25 envelope → n8n bridge auto-consumes → Windows endpoint validates provenance; (3) REVIEWER `attachReviewStage` (local-dev main post-implementation caller) → `runReviewStage` → fresh quota → REAL T18 → `execution_performed=false`; (4) RETRY `runGovernedRetryExecution` (repairable STOP + explicit `retry_policy` only) → REAL `runRetryStage` → fresh quota every attempt → `RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION` / fail-closed, `execution_performed=false`. Checkpoint E2E `tests/rt25-canonical-closed-gate-e2e` **19/19** (S1–S19). Focused: entrypoint **104/104**, review-stage **15/15**, governed-retry **10/10**, retry-stage **14/14**. Preserves: `REVIEWER_EXECUTION_AUTHORIZED=NO`, `RETRY_EXECUTION_AUTHORIZED=NO`, `D0025_ENABLED=false`, GLM live UNKNOWN/BLOCKED_EVIDENCE. NO production LIVE; no OpenAI API/BYOK; Codex subscription-only. Report: `reports/architecture/v4_canonical_quota_runtime_final_closure_checkpoint_v1.md` |
| **REVIEW_STAGE_BOUNDARY** | `tools/run-review-stage-v1.mjs` — **WIRED_BEHIND_CLOSED_GATE** (`V4_CANONICAL_REVIEW_STAGE_ARCHITECTURE_AND_BOUNDARY_V1`, base `0788717`): ONE real canonical review-stage boundary — implementation result → `runReviewStage` → fresh canonical quota state (`buildReviewerBoundaryState`: real registry-v2 + fail-closed baseline + real ingest lane → real composer → real join, recomputed at review time) → registry-derived reviewer candidates ONLY (codex chatgpt-subscription surfaces + qwen_local; `openai_api_route` structurally forbidden; glm has NO reviewer role) → REAL `selectQuotaAwareReviewerRoute` (T18 independence law) → `guardQualityDowngrade` (T13) → bounded `v4-review-stage-result-v1`, `execution_performed=false` (selection only; no reviewer inference). REAL caller wired: local-dev live runner main() attaches `review_stage` APPEND-ONLY (PASS/STOP + exit semantics unchanged; DEV isolation law 42/42). Focused `tests/review-stage-boundary` **15/15** + T18 **5/5**. Remaining dependency (by design): authorized reviewer EXECUTION surface absent; downstream policy consumption of `review_stage` = future governed work. WF61/WF40/n8n untouched; D-0025 CLOSED |
| **RETRY_REPAIR_BOUNDARY** | `tools/run-retry-stage-v1.mjs` — **WIRED_BEHIND_CLOSED_GATE** (`V4_CANONICAL_RETRY_REPAIR_RUNTIME_BOUNDARY_V1`, issue #44, base `6749f06`): ONE real canonical retry/repair-SELECTION boundary — failed implementation result → `runRetryStage` → FRESH canonical quota state recomputed at EVERY invocation (`buildRetryBoundaryState`: real registry-v2 + fail-closed baseline + real ingest lane → real composer → real join; initial-attempt state never reused) → registry-derived retry candidates (implementation_model/reviewer roles; `openai_api_route` forbidden; model-class→resource binding glm-5.3/glm-5.3-flash→glm, codex_subscription_models→codex, composer→composer, qwen_local→qwen_local) → REAL `selectQuotaAwareRetryRoute` (T19 scarce-pool exclusion + no-silent-reuse) → `guardQualityDowngrade` (T13, status-normalized) + `guardUrgencyDeferral` (T14, opt-in) → bounded `v4-retry-stage-result-v1`, `execution_performed=false` (selection only). Canonical CLI proven (exit 0 selected / 1 blocked); runtime caller now present as GOVERNED_RETRY_EXECUTION_CALLER (`runGovernedRetryExecution`); evidence-change adaptation proven (glm exhausted → codex redirect). Focused `tests/retry-stage-boundary` **14/14** + T19 **5/5**. WF61/WF40/n8n/local-dev runner untouched; D-0025 CLOSED |
| **GOVERNED_RETRY_EXECUTION_CALLER** | `tools/run-governed-retry-execution-v1.mjs` — **WIRED_BEHIND_CLOSED_GATE** (`V4_GOVERNED_RETRY_EXECUTION_CALLER_INTEGRATION_V1`, issue #45, base `5c8f2e6`): SMALLEST real caller/stage between repairable STOP and retry-execution authorization — `classifyRepairability` (PASS / non-repairable STOP never enter; closed allowlist `STOP:TEST_FAILED|OPENCODE_RUN_FAILED|OPENCODE_TASK_ERROR`; explicit `retry_policy.max_attempts` required, hard cap 3) → REAL `runRetryStage` (fresh quota every attempt) → if selected and unauthorized: `RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION` with `execution_performed=false` (never infer/execute; D-0025 closed + execution adapter absent). Ordinary test-command re-runs NOT converted. NOT auto-wired into local-dev executor/dispatcher (activation dependency: post-STOP hook ONLY when explicit retry_policy present). Focused `tests/governed-retry-execution-caller` **10/10** + retry-stage-boundary **14/14**. Not LIVE |
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

## Latest bounded capability qualification

`V4_HERMES_CODEX_DYNAMIC_GPT_MODEL_ROUTER_V1` = **PASS** ·
`HERMES_CODEX_DYNAMIC_GPT_MODEL_ROUTER=QUALIFIED` ·
`CODEX_MODEL_CATALOG=DYNAMIC_LIVE` · `EXACT_MODEL_SELECTION=QUALIFIED` ·
`NO_SILENT_MODEL_FALLBACK=YES` · `VPS_DYNAMIC_MODEL_ROUTER=QUALIFIED` ·
`PRODUCTION_ROUTING_ENABLED=NO` · `PHASE_D=OPEN` · report:
`reports/architecture/v4_hermes_codex_dynamic_gpt_model_router_v1.md`.
The Codex subscription catalog is live and refreshable; account-level runtime
rejections remain fail-closed as `ADVERTISED_NOT_SELECTABLE`. V7 governed CDP
and prefill-only invariants are unchanged. `NEXT` remains
`VPS_CODEX_08_12_PROMOTION_GATE_AND_PHASE_D_CHAT_N`.

`V4_HERMES_CODEX_GOVERNED_CDP_AND_VPS_08_12_QUALIFICATION_V7` = **PASS** ·
`CODEX_HERMES_GOVERNED_CDP=QUALIFIED` ·
`VPS_CODEX_HERMES_GOVERNED_CDP=QUALIFIED_PREFILL_ONLY` ·
`VPS_CODEX_08_12_POLICY=SHADOW_PASS` · `GLM_ELIGIBLE_08_12=NO` ·
`PRODUCTION_ROUTING_ENABLED=NO` · `PHASE_D=OPEN` · report:
`reports/architecture/v4_hermes_codex_governed_cdp_and_vps_08_12_qualification_v7.md`.
No browser message was sent and the isolated VPS proof left the fresh chat at
zero user/assistant turns with an empty composer. Phase D is not PASS.
`NEXT=VPS_CODEX_08_12_PROMOTION_GATE_AND_PHASE_D_CHAT_N`.

---

## Historical bounded capability qualification — V6

`V4_HERMES_NATIVE_CODEX_BROWSER_CDP_EPHEMERAL_EXPOSURE_V6` = **PASS** ·
`CODEX_HERMES_BROWSER_CDP_CAPABILITY=QUALIFIED_WITH_EPHEMERAL_NATIVE_EXPOSURE` ·
`PHASE_D=OPEN` · report:
`reports/architecture/v4_hermes_native_codex_browser_cdp_ephemeral_exposure_v6.md`.
Hermes was restored byte-for-byte; permanent exposure is not authorized.
`NEXT=CODEX_HERMES_GOVERNED_BROWSER_CDP_EXPOSURE_AND_VPS_08_12_QUALIFICATION`.
