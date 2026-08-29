# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 11 census captured; offline body-shape remediate STOP CASE B; GPT-Web bounded body-shape capture artifact authored |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SSE_CENSUS_CAPTURED_EMPTY_DATA_EVENTS / ATTEMPT11_BODY_UNAVAILABLE / BODY_SHAPE_CAPTURE_ARTIFACT_AUTHORED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for bounded body-shape capture pass** — apply exact GPT-Web artifact with zero provider calls, verify transport, then one one-shot GLM resume to persist sanitized body framing/key shapes; runtime gate CLOSED outside that event |
| **NEXT** | Apply `workflows/patches/d0025-w-wf61-body-shape-capture.gpt-web.json` verbatim to WF61/template, validate with zero provider calls, run bounded n8n→LiteLLM transport preflight, then one bounded resume of `D-0025-W-GLM-LIVE-001`. Capture only `sse_census` + `body_shape`. No normalizer semantic change in this pass. No smoke/retry. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · prior SSE capture jsCode present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **5** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **5/10** · Codex **1/10 used** |

## Boundaries

- Apply only the exact GPT-Web-authored body-shape capture artifact; Cursor must not redesign WF61.
- Provider calls remain zero during artifact apply/validation and transport preflight.
- The bounded capture resume permits exactly one new LiteLLM/GLM attempt, no retry/fallback, and must finish with gate CLOSED + WF61 inactive.
- Persist/report only framing, key names and value shapes; never raw body/SSE/model output/prompt/reasoning/credentials.
- Do not invent JSON→Responses mapping or modify the normalizer before `body_shape` evidence exists.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- **Body-shape capture artifact:** `workflows/patches/d0025-w-wf61-body-shape-capture.gpt-web.json`
- Body-shape STOP report: `reports/architecture/d0025_http200_body_shape_offline_remediation.md`
- Census report: `reports/architecture/d0025_status0_preflight_and_sse_capture_resume.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
