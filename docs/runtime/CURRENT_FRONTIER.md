# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — final GLM live resume in progress (slot 10/10) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / FINAL_LIVE_RESUME_ARMED` |
| **GATE CORRENTE** | **ARMED (temporary one-event window)** — restore CLOSED immediately after terminal result |
| **NEXT** | Await single WF61/GLM terminal result for `D-0025-W-GLM-LIVE-001`; no retry/fallback. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **temporarily active** for one event · `d0025-6100-4001-8001-000000000061` |
| **REMOTE RUNTIME GATE** | temporary `enabled=true` · `provider_calls_authorized_per_event=1` · GLM healthy |
| **LITELLM LIVE** | preserved · **9** `/v1/responses` before this event |
| **EXPANDED PLANNER BUDGET** | GLM **9/10** → consuming slot **10/10** |

## Boundaries

- Exactly one WF61 / one LiteLLM / one GLM attempt.
- retry=0 · fallback=0 · Codex=0 · Qwen=0 · cursor_dispatch=0.
- Restore gate CLOSED and WF61 inactive at first terminal result.
- Do not modify schema/normalizer/CASE B semantics/credentials/network/WF60/OpenClaw/V4.

## Puntatori

- CASE B report: `reports/architecture/d0025_packet_source_completion_case_b.md`
- Live task: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Issue **#31** — OPEN pending terminal result
