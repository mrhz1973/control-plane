# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — one bounded live resume of `D-0025-W-GLM-LIVE-001` after fullResponse unwrap |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_DATA_UNWRAP_APPLIED_OFFLINE / LIVE_RESUME_AUTHORIZED_ONE_EVENT` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for one bounded live resume** — temporarily arm gate for exactly one provider event, then CLOSE |
| **NEXT** | Execute exactly one `D-0025-W-GLM-LIVE-001` cycle on the corrected inner-body path; no retry/fallback |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** until temporary window · `d0025-6100-4001-8001-000000000061` · unwrap on 6107 |
| **REMOTE RUNTIME GATE** | baseline CLOSED; one-event window authorized for this block only |
| **LITELLM LIVE** | preserved · **6** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **6/10** · Codex **1/10 used** |

## Boundaries

- Hard maxima: WF61 executions ≤1 · LiteLLM `/v1/responses` ≤1 · GLM attempts ≤1.
- retry=0 · fallback=0 · qwen=0 · codex=0 · cursor auto-dispatch=0.
- Do not modify node 6107 or `tools/normalize-litellm-responses-body.mjs` in this live pass.
- At first terminal result: close gate and deactivate WF61.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Unwrap report: `reports/architecture/d0025_wf61_fullresponse_data_unwrap.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Issue **#31** — OPEN
