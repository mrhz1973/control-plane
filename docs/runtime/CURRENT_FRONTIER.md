# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 12 captured sanitized `body_shape` (`JSON_OBJECT` keys `data|headers|statusCode|statusMessage` = n8n fullResponse wrapper) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / BODY_SHAPE_CAPTURED_N8N_FULLRESPONSE_WRAPPER / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — body_shape evidence available for offline remediation; no live resume until CASE A unwrap/adapter is authored |
| **NEXT** | Offline remediation: capture/normalize must unwrap n8n HTTP `data` (fullResponse) before Responses/SSE gates. No smoke. No invented provider semantics. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285449 attempt 12) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · body_shape + sse_census capture present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **6** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **6/10** · Codex **1/10 used** |

## Boundaries

- Do not reopen the gate until offline CASE A from Attempt 12 `body_shape` is authorized.
- Do not invent provider SSE/JSON mappings beyond the captured wrapper finding.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- Capture report: `reports/architecture/d0025_wf61_body_shape_capture.md`
- Artifact: `workflows/patches/d0025-w-wf61-body-shape-capture.gpt-web.json`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
