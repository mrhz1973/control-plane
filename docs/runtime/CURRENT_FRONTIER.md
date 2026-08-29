# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF61 SSE structural-capture applied; Attempt 10 STOP on `LITELLM_HTTP_FAILURE` http_status=0 (`sse_census` not reached) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SSE_STRUCTURAL_CAPTURE_APPLIED / CAPTURE_RESUME_HTTP_STATUS_0 / SSE_CENSUS_NOT_OBTAINED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — capture code retained on inactive WF61; no second provider call; await healthy transport for one census resume |
| **NEXT** | One bounded capture resume of `D-0025-W-GLM-LIVE-001` only after status-0/transport is healthy enough to reach LiteLLM HTTP 2xx body → `sse_census`. No normalizer change without census. No smoke. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285395 attempt 10) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · capture jsCode present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **4** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **4/10** · Codex **1/10 used** |

## Boundaries

- Do not invent normalizer semantics without a captured `sse_census`.
- Do not reopen the gate except for one authorized capture resume.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- Capture apply report: `reports/architecture/d0025_wf61_sse_structural_capture.md`
- Capture artifact: `workflows/patches/d0025-w-wf61-sse-structural-capture.gpt-web.json`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
