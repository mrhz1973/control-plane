# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 12 proved n8n `fullResponse` wrapper (`data|headers|statusCode|statusMessage`); GPT-Web exact unwrap artifact authored |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / BODY_SHAPE_CAPTURED_N8N_FULLRESPONSE_WRAPPER / FULLRESPONSE_DATA_UNWRAP_ARTIFACT_AUTHORED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for offline unwrap apply** — apply exact GPT-Web artifact with zero provider/model calls; runtime gate remains CLOSED |
| **NEXT** | Apply `workflows/patches/d0025-w-wf61-fullresponse-data-unwrap.gpt-web.json` verbatim to WF61/template and validate offline only. No live resume in the same pass. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285449 attempt 12) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · body_shape + sse_census capture present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **6** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **6/10** · Codex **1/10 used** |

## Boundaries

- Apply only the exact GPT-Web-authored fullResponse unwrap artifact; Cursor must not redesign WF61.
- Provider/model calls remain zero for this offline apply/validation pass.
- Do not reopen the runtime gate in this pass.
- Do not change `tools/normalize-litellm-responses-body.mjs` in this pass.
- Do not invent provider SSE/JSON mappings beyond the captured wrapper finding.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- **Unwrap artifact:** `workflows/patches/d0025-w-wf61-fullresponse-data-unwrap.gpt-web.json`
- Capture report: `reports/architecture/d0025_wf61_body_shape_capture.md`
- Body-shape capture artifact: `workflows/patches/d0025-w-wf61-body-shape-capture.gpt-web.json`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
