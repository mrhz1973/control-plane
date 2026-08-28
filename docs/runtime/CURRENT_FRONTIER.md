# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GIS Read/Write nonblocking applied; backlog lane reachability restored for natural polls |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / WF60_GIS_HANDOFF_READWRITE_NONBLOCKING / GLM_LIVE_001_READY_FOR_RETRY / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **OPERATOR GATE** — one bounded GLM live cycle retry authorized next |
| **NEXT** | `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001` retry: temporary GLM gate + WF61 callable window · backlog already on main @ `8765362` |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `b198b317-f004-465d-82ed-3fbb3d79f9f6` · 44 nodes · WF60 + GIS handoff + GIS Read/Write all `continueOnFail=true` |
| **WF61 LIVE** | inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | accepts GPT-Web `>-` YAML · offline tests PASS |
| **LITELLM LIVE** | preserved · unchanged |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used** |

## Boundaries

- Do not enable runtime gate / run GLM inference without explicit bounded live-cycle authorization.
- Do not activate WF60 / mutate OpenClaw without separate authorization.

## Puntatori

- GIS Read/Write apply: `reports/architecture/d0025_wf40_gis_readwrite_nonblocking_apply.md`
- Prior GLM live STOP: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
