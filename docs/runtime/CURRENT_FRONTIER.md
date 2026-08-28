# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — transport diagnosed healthy; retry 6 terminal `SSE_NO_COMPLETED_RESPONSE` (HTTP 200) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_RETURN_SHAPE_FIXED / FINALIZE_OBSERVABILITY_APPLIED / TRANSPORT_DIAGNOSED_HEALTHY / LITELLM_GLM_HTTP_200_PROVEN_X2 / SSE_NORMALIZATION_BLOCKED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — GPT-Web authors bounded SSE normalization artifact; then one bounded resume of same live cycle |
| **NEXT** | Canonical runner/GLM SSE response normalization: handle streams closing without `response.completed` (`SSE_NO_COMPLETED_RESPONSE` — "No response.completed terminal event found"); then resume `D-0025-W-GLM-LIVE-001` once |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · lane live-proven (incl. 284952 retry 6) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · observability + return-shape applied · execs `284723/284784` retained (+ pruned `284882`, `284953` marked error post-terminal) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **2** `/v1/responses` calls to date (both HTTP 200) |
| **EXPANDED PLANNER BUDGET** | GLM **2/10** · Codex **1/10 used** |

## Boundaries

- Do not re-open the runtime gate without the GPT-Web SSE normalization artifact applied.
- Do not activate WF60 / mutate OpenClaw.
- Standing authorization applies for the bounded normalization apply + single resume.

## Puntatori

- Diagnosis report: `reports/architecture/d0025_wf61_http_status0_diagnosis.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Observability apply: `reports/architecture/d0025_wf61_finalize_failure_observability_fix_apply.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
