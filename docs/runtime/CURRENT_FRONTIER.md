# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — packet `final_report_contract` planner-instruction hardening applied offline |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / PACKET_FINAL_REPORT_CONTRACT_HARDENING_APPLIED_OFFLINE / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — offline hardening applied; do not reopen until a future bounded live-resume block |
| **NEXT** | One bounded live resume of `D-0025-W-GLM-LIVE-001`; max one LiteLLM/GLM attempt; retry=0; fallback=0 (do **not** execute in this hardening pass) |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · last cycle `285530` |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · unwrap retained on 6107 |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **7** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **7/10** · Codex **1/10 used** |

## Boundaries

- Do not undo the n8n fullResponse `data` unwrap.
- Keep `execution-packet-v1` schema unchanged; `final_report_contract` stays required and const-constrained.
- Do not post-fill or silently repair planner packet fields after model output.
- Do not add provider `strict=true` without separate compatibility evidence.
- Do not modify `tools/normalize-litellm-responses-body.mjs`.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Hardening artifact: `docs/runtime/PATCH_D0025_W_PACKET_FINAL_REPORT_CONTRACT_HARDENING.gpt-web.json`
- Attempt report: `reports/architecture/d0025_glm_live_resume_after_fullresponse_unwrap.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
