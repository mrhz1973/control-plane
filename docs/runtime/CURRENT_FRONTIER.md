# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 11 captured sanitized `sse_census` under HTTP 200 / `SSE_NO_COMPLETED_RESPONSE` (`data_event_count=0`) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SSE_STRUCTURAL_CAPTURE_APPLIED / SSE_CENSUS_CAPTURED_EMPTY_DATA_EVENTS / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — census available for offline remediation; no live resume until CASE A normalizer patch is justified |
| **NEXT** | Offline normalizer remediation from Attempt 11 census (HTTP 200 body with zero `data:` SSE lines). No smoke. No invented semantics beyond census. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285414 attempt 11) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · capture jsCode present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **5** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **5/10** · Codex **1/10 used** |

## Boundaries

- Do not reopen the gate until offline CASE A remediation is authored/authorized.
- Do not invent terminal normalization beyond the captured census.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- Capture resume report: `reports/architecture/d0025_status0_preflight_and_sse_capture_resume.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Capture artifact: `workflows/patches/d0025-w-wf61-sse-structural-capture.gpt-web.json`
- Issue **#31** — OPEN
