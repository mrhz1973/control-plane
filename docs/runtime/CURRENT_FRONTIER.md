# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GLM smoke retry STOPPED; WF60 inactive-execute blocks backlog lane under WF40 `executionOrder: v1` |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / GITHUB_CRED_REPAIRED / WF40_44_NODE_IN_PROCESS / REMOTE_RUNTIME_GATE_DISABLED / GLM_SMOKE_RETRY_STOPPED_WF60_BLOCKS_LANE` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — WF40 must let backlog→WF61 proceed without activating WF60 before any GLM smoke |
| **NEXT** | Author/authorize a bounded fix so inactive WF60 execute does not abort siblings (non-blocking / continueOnFail / GPT-Web-authored graph change). Do **not** enable the runtime gate and do **not** activate WF60 until that is resolved. Then re-authorize single GLM smoke. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `48c30f4a-…` · **44 nodes in-process** · GitHub poll OK · on new commit, WF60 execute errors first (`Workflow is not active`) and backlog lane nodes do not run |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **WF60 LIVE** | inactive · preserved · **not activated** |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | live · offline tests **18/18 PASS** |
| **LITELLM LIVE** | preserved · readiness OK · no inference this pass |
| **GITHUB CRED** | repaired · unchanged this pass |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Boundaries

- GLM smoke authorization `5454884137` was **not** consumed (0 WF61, 0 provider calls, gate never enabled).
- Do not activate WF60 / mutate OpenClaw without a separate authorization.
- Do not enable primary-remote runtime gate until backlog lane is reachable.

## Puntatori

- STOP report: `reports/architecture/d0025_primary_remote_glm_single_smoke_retry.md`
- Cred repair: `reports/architecture/d0025_github_credential_repair_and_n8n_reload.md`
- Historical backlog 001: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_SMOKE_001.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
