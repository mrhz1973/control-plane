# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — n8n fullResponse `data` unwrap applied offline to WF61/template |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_DATA_UNWRAP_APPLIED_OFFLINE / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — offline unwrap applied; do not reopen until a future bounded live-resume block |
| **NEXT** | One bounded live resume of `D-0025-W-GLM-LIVE-001` using the corrected inner-body path (do **not** execute in the unwrap-apply pass) |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · fullResponse unwrap on 6107 · body_shape + sse_census present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **6** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **6/10** · Codex **1/10 used** |

## Boundaries

- Do not redesign WF61 beyond the applied GPT-Web unwrap artifact.
- Do not reopen the runtime gate except under an explicit future live-resume block.
- Do not change `tools/normalize-litellm-responses-body.mjs` unless a future block authorizes it.
- Do not activate WF60 / mutate OpenClaw.
- V4 Qwen work remains untouched.

## Puntatori

- Unwrap report: `reports/architecture/d0025_wf61_fullresponse_data_unwrap.md`
- Unwrap artifact: `workflows/patches/d0025-w-wf61-fullresponse-data-unwrap.gpt-web.json`
- Capture report: `reports/architecture/d0025_wf61_body_shape_capture.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
