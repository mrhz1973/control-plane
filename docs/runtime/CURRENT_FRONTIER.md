# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — post-HTTP200 hang root-caused offline (`WF61_HANG_HTTP_NODE_NOT_RETURNED`) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / WF61_HANG_HTTP_NODE_NOT_RETURNED / GLM_BUDGET_EXHAUSTED` |
| **GATE CORRENTE** | **CLOSED** — no re-arm; GLM budget exhausted |
| **NEXT** | GPT-Web author bounded WF61 node **6106** hang-proof HTTP timeout/completion artifact; then separate budget decision before any new GLM live call |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · execution `286310` purged |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **10** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **10/10** · Codex **1/10 used** |

## Boundaries

- Do not authorize or execute any additional GLM call under the current 10-call budget.
- Do not re-arm the runtime gate in diagnosis-only passes.
- Workflow hang fix must be GPT-Web authored (node 6106); Cursor must not invent WF topology/HTTP semantics.
- Keep CASE B / schema / normalizer / unwrap / LiteLLM config unchanged unless separately authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Hang diagnosis: `reports/architecture/d0025_wf61_post_http200_hang_offline_diagnosis.md`
- Final live report: `reports/architecture/d0025_glm_final_live_resume_after_case_b.md`
- CASE B report: `reports/architecture/d0025_packet_source_completion_case_b.md`
- Issue **#31** — OPEN
