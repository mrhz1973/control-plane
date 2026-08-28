# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GIS Telegram file nonblocking applied; GIS tail contained for natural polls |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / WF60_GIS_TAIL_NONBLOCKING_COMPLETE / GLM_LIVE_001_RETRY_RELEASED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — one bounded GLM live cycle retry under `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`; no conversational re-authorization gate |
| **NEXT** | `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001` retry: temporary GLM-only gate + WF61 callable window · same canonical backlog/task · create one fresh non-YAML retry-trigger commit because the prior trigger may already be deduped |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · WF60 + GIS handoff + GIS Read/Write + GIS Telegram file all `continueOnFail=true` |
| **WF61 LIVE** | inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | accepts GPT-Web `>-` YAML · offline REMOTE_DISPATCH_READY |
| **LITELLM LIVE** | preserved · unchanged |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used** |

## Boundaries

- The runtime gate may be enabled only inside the single bounded GLM live-cycle window and must return CLOSED at the first terminal result.
- Maximum one WF61 execution and one GLM provider attempt; retry 0; fallback 0; Qwen 0; Codex 0; Cursor auto-dispatch 0.
- WF61 may be made temporarily callable only if required by n8n Execute Workflow semantics and must end inactive.
- Do not activate WF60 or mutate OpenClaw, credentials, network, Tailscale, or TeamViewer.
- Do not insert another proof/smoke task: the cycle must produce useful project work or persist the first precise blocker.

## Puntatori

- GIS Telegram apply: `reports/architecture/d0025_wf40_gis_telegram_file_nonblocking_apply.md`
- Prior GLM live STOP: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Standing authorization: `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`
- Issue **#31** — OPEN
