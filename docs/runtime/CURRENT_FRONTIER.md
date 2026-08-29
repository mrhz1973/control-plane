# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — fullResponse unwrap live-proven; blocked on Execution Packet schema |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / PACKET_SCHEMA_INVALID / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — one live event used; do not reopen until offline packet-schema remediation is authorized |
| **NEXT** | Offline remediate `PACKET_SCHEMA_INVALID` (`Missing required field: final_report_contract`) on GLM primary-remote packet path; keep unwrap; no live retry until authorized |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · last cycle `285530` |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · unwrap retained on 6107 |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **7** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **7/10** · Codex **1/10 used** |

## Boundaries

- Do not undo the n8n fullResponse `data` unwrap.
- Do not modify `tools/normalize-litellm-responses-body.mjs` unless a future block authorizes it from new evidence.
- Do not reopen the runtime gate for another live attempt until offline remediation is authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Attempt report: `reports/architecture/d0025_glm_live_resume_after_fullresponse_unwrap.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Unwrap report: `reports/architecture/d0025_wf61_fullresponse_data_unwrap.md`
- Issue **#31** — OPEN
