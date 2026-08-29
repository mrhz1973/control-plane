# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — required/empty-field planner hardening applied offline |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / PACKET_REQUIRED_EMPTY_FIELDS_HARDENING_APPLIED_OFFLINE / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — offline hardening applied; do not reopen until a future bounded live-resume block |
| **NEXT** | One bounded live resume of `D-0025-W-GLM-LIVE-001`; max one LiteLLM/GLM attempt; retry=0; fallback=0 (do **not** execute in this hardening pass) |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · last cycle `286045` |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · unwrap retained |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **8** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **8/10** · Codex **1/10 used** |

## Boundaries

- Do not undo unwrap or weaken `execution-packet-v1`.
- Do not post-fill missing planner fields after model output.
- Keep prior `final_report_contract` and required/empty-field hardenings.
- Do not add provider `strict=true` without separate evidence.
- Do not modify normalizer/workflows unless a future block authorizes it.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Hardening artifact: `docs/runtime/PATCH_D0025_W_PACKET_REQUIRED_EMPTY_FIELDS_HARDENING.gpt-web.json`
- Attempt report: `reports/architecture/d0025_glm_live_resume_after_packet_hardening.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
