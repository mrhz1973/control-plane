# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 15 still `PACKET_SCHEMA_INVALID` missing `allowed_paths` after instruction hardening |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / PACKET_SCHEMA_INVALID_ALLOWED_PATHS_PERSISTENT / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — one live event used; do not reopen until offline CASE A beyond instruction-only is authorized |
| **NEXT** | Offline CASE A for persistent `PACKET_SCHEMA_INVALID` (`Missing required field: allowed_paths`) after required/empty-field instruction hardening; keep unwrap + prior hardenings; no live retry until authorized |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · last cycle `286080` |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · unwrap retained |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **9** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **9/10** · Codex **1/10 used** |

## Boundaries

- Do not undo unwrap or weaken `execution-packet-v1`.
- Do not post-fill missing planner fields after model output unless a future block explicitly authorizes a different strategy.
- Do not modify normalizer/workflows unless a future block authorizes it.
- Do not reopen the runtime gate until offline remediation is authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Attempt report: `reports/architecture/d0025_glm_live_resume_after_required_fields_hardening.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
