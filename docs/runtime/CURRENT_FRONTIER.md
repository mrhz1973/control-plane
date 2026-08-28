# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GLM live 001 retry STOPPED; WF40 GIS tail `Telegram - Send handoff file` hard-fail blocks backlog lane |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / WF60_GIS_HANDOFF_READWRITE_NONBLOCKING / GIS_TELEGRAM_FILE_NODE_STILL_BLOCKING / GLM_LIVE_001_RETRY_STOPPED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — WF40 GIS tail must be non-blocking to its end before next GLM live cycle |
| **NEXT** | GPT-Web bounded delta for `Telegram - Send handoff file` (`18078c6b-1181-42da-9f05-32138f45f0ab`, [240,144]) or entire GIS tail non-blocking; then one GLM live cycle window. Backlog retry trigger already on main @ `5ccb8c9` (may need a fresh trigger if dedupe consumed it). |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `b198b317-f004-465d-82ed-3fbb3d79f9f6` · 44 nodes · WF60 + GIS handoff + GIS Read/Write `continueOnFail=true` · GIS Telegram file node still blocking |
| **WF61 LIVE** | inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | accepts GPT-Web `>-` YAML · offline REMOTE_DISPATCH_READY |
| **LITELLM LIVE** | preserved · unchanged |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used** |

## Boundaries

- Do not enable runtime gate / run GLM inference until backlog lane is reachable on natural polls.
- Do not activate WF60 / mutate OpenClaw without separate authorization.

## Puntatori

- Retry STOP report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- GIS Read/Write apply: `reports/architecture/d0025_wf40_gis_readwrite_nonblocking_apply.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
