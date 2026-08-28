# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — first GLM live cycle STOPPED; WF40 GIS Read/Write hard-fail blocks backlog lane |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / WF60_GIS_NONBLOCKING_PARTIAL / GLM_LIVE_001_STOPPED_BEFORE_BACKLOG_LANE / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — WF40 GIS tail must be non-blocking before next GLM live cycle |
| **NEXT** | GPT-Web bounded delta for GIS `Read/Write Files from Disk` (or GIS branch tail) non-blocking under v1 order; then one GLM live cycle retry with gate+WF61 window. Backlog `BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md` already on main @ `8765362`. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `29184a4e-…` · 44 nodes · WF60+GIS handoff `continueOnFail=true` · GIS Read/Write still blocking |
| **WF61 LIVE** | inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | accepts GPT-Web `>-` YAML · offline tests PASS |
| **LITELLM LIVE** | preserved · unchanged |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used** |

## Boundaries

- Do not enable runtime gate / run GLM inference until backlog lane is reachable on natural polls.
- Do not activate WF60 / mutate OpenClaw without separate authorization.

## Puntatori

- STOP report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- GIS apply: `reports/architecture/d0025_wf40_gis_handoff_nonblocking_apply.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
