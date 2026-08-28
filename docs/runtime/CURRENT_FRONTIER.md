# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF60 + GIS handoff non-blocking on WF40; runtime gate CLOSED |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / GITHUB_CRED_REPAIRED / WF40_44_NODE_IN_PROCESS / WF60_EXECUTE_NONBLOCKING / GIS_HANDOFF_NONBLOCKING / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — re-authorize single GLM smoke; do not enable runtime gate without that authorization |
| **NEXT** | Re-authorize temporary GLM gate enable + single smoke (`D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE_RETRY`). Use fresh GPT-Web backlog trigger. Restore gate CLOSED immediately after terminal result. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `29184a4e-cea0-4483-8c8e-47688fb6e3d0` · **44 nodes** · WF60 `continueOnFail=true` · GIS handoff `continueOnFail=true` |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **WF60 LIVE** | inactive · preserved · execute-from-WF40 non-blocking |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | live · offline tests PASS |
| **LITELLM LIVE** | preserved · unchanged this pass |
| **GITHUB CRED** | repaired · unchanged this pass |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Boundaries

- Do not activate WF60 / mutate OpenClaw without separate authorization.
- Do not enable primary-remote runtime gate / run GLM smoke without separate authorization.
- No provider inference or WF61 execution outside an explicit smoke gate.

## Puntatori

- GIS apply report: `reports/architecture/d0025_wf40_gis_handoff_nonblocking_apply.md`
- WF60 apply report: `reports/architecture/d0025_wf40_wf60_parallel_nonblocking_apply.md`
- Patch: `workflows/patches/d0025-w-wf40-gis-handoff-nonblocking.gpt-web.json`
- Standing auth: `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
