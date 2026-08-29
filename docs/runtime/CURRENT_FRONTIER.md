# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — final GLM slot consumed; WF61 hung after LiteLLM HTTP 200 |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / FINAL_LIVE_WF61_HUNG_AFTER_HTTP_200 / GLM_BUDGET_EXHAUSTED` |
| **GATE CORRENTE** | **CLOSED** — final one-event window restored; no further GLM under current budget |
| **NEXT** | Diagnose/fix WF61 hang after LiteLLM HTTP 200 under a **new** authorized budget (current GLM **10/10** exhausted). Do not re-arm without explicit authorization. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · parent `286309` |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · child `286310` hung/zombie `running` row |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **10** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **10/10** · Codex **1/10 used** |

## Boundaries

- Do not authorize or execute any additional GLM call under the current 10-call budget.
- Keep CASE B helper / unwrap / schema / normalizer / LiteLLM config unchanged unless separately authorized.
- No retry/fallback/Codex/Qwen/Cursor auto-dispatch.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Final live report: `reports/architecture/d0025_glm_final_live_resume_after_case_b.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- CASE B report: `reports/architecture/d0025_packet_source_completion_case_b.md`
- Issue **#31** — OPEN
