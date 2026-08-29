# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 11 census captured; offline body-shape remediate STOP CASE B (WF61 `285415` body/`response_b64` unavailable) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SSE_CENSUS_CAPTURED_EMPTY_DATA_EVENTS / ATTEMPT11_BODY_UNAVAILABLE / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — no normalizer change without body key/shape evidence; strengthen capture before next live resume |
| **NEXT** | Extend sanitized capture to include HTTP body framing + top-level/nested key shapes (still no model text), then one bounded resume; offline CASE A only after that evidence. No smoke. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · capture jsCode present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **5** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **5/10** · Codex **1/10 used** |

## Boundaries

- Do not invent JSON→Responses mapping from empty `sse_census` alone.
- Do not reopen the gate until body-shape capture is sufficient for CASE A.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- Body-shape STOP report: `reports/architecture/d0025_http200_body_shape_offline_remediation.md`
- Census report: `reports/architecture/d0025_status0_preflight_and_sse_capture_resume.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
