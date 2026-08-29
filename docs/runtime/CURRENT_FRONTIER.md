# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 15 persistent `PACKET_SCHEMA_INVALID` missing `allowed_paths`; instruction-only remediation exhausted |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / PACKET_SCHEMA_INVALID_ALLOWED_PATHS_PERSISTENT / OFFLINE_SOURCE_FIELD_CASE_A_AUTHORIZED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — final GLM budget slot must not be spent before offline CASE A structural inspection + deterministic missing-only compatibility decision |
| **NEXT** | Apply `D0025_W_PACKET_SOURCE_FIELD_COMPLETION_CASE_A`: inspect existing WF61 execution `286081` only; if all omitted required fields are exact consumer_input/const-owned fields, implement missing-only deterministic completion before canonical gates; otherwise STOP. Provider calls = 0. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · last cycle `286080` |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · unwrap retained |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **9** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **9/10** · Codex **1/10 used** |

## Boundaries

- Do not spend GLM slot 10/10 before CASE A passes offline.
- Do not undo unwrap or weaken `execution-packet-v1`.
- Deterministic completion may add only absent fields whose exact values are owned by `consumer_input` or schema consts; never overwrite present fields and never invent planner-owned semantics.
- Do not modify normalizer/workflows or experiment with provider `strict=true` in CASE A.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- CASE A artifact: `docs/runtime/PATCH_D0025_W_PACKET_SOURCE_FIELD_COMPLETION_CASE_A.gpt-web.json`
- Attempt report: `reports/architecture/d0025_glm_live_resume_after_required_fields_hardening.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
