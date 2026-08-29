# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — hang-proof HTTP bridge applied offline; live 6110 CASE B drift remains |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6110_CASE_B_DRIFT / GLM_BUDGET_EXHAUSTED` |
| **GATE CORRENTE** | **CLOSED** — no re-arm; GLM budget exhausted; human budget gate required before any live retry |
| **NEXT** | (1) Re-sync live WF61 node **6110** CASE B census from template. (2) Separate human authorization of a **new** bounded GLM budget before any live retry. Do not create or consume that budget here. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof transport on 6104/6106/6107 · live 6110 CASE B missing |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **10** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **10/10** · Codex **1/10 used** |

## Boundaries

- Do not authorize or execute any additional GLM call under the current 10-call budget.
- Do not arm the runtime gate or trigger WF40/WF61 planning without a new human budget gate.
- Hang-proof bridge replaces only transport (6104/6106/6107); schema/normalizer/CASE B helper/LiteLLM config unchanged.
- Live 6110 must regain CASE B census/completion before the next live resume.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Hang-proof apply: `reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md`
- Helper: `tools/post-litellm-primary-one-shot.mjs`
- Hang diagnosis: `reports/architecture/d0025_wf61_post_http200_hang_offline_diagnosis.md`
- Issue **#31** — OPEN
