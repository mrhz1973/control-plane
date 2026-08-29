# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 14 reached packet schema; missing required field `allowed_paths`; GPT-Web required/empty-field hardening artifact authored |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / PACKET_SCHEMA_INVALID_ALLOWED_PATHS / REQUIRED_EMPTY_FIELD_HARDENING_ARTIFACT_AUTHORED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for offline required/empty-field hardening apply** — zero provider calls; remote runtime gate remains CLOSED |
| **NEXT** | Apply `docs/runtime/PATCH_D0025_W_PACKET_REQUIRED_EMPTY_FIELDS_HARDENING.gpt-web.json` verbatim, validate offline with zero provider calls; if PASS, next is one bounded live resume of `D-0025-W-GLM-LIVE-001` |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · last cycle `286045` |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · unwrap retained |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **8** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **8/10** · Codex **1/10 used** |

## Boundaries

- Do not undo unwrap or weaken `execution-packet-v1`.
- Do not post-fill missing planner fields after model output.
- Keep prior `final_report_contract` hardening.
- Do not add provider `strict=true` in this pass.
- Do not modify normalizer/workflows.
- Provider/model calls = 0 in the offline hardening apply pass.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Required/empty-field hardening artifact: `docs/runtime/PATCH_D0025_W_PACKET_REQUIRED_EMPTY_FIELDS_HARDENING.gpt-web.json`
- Attempt report: `reports/architecture/d0025_glm_live_resume_after_packet_hardening.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
