# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — finalize observability applied; retry 5 stopped on `LITELLM_HTTP_FAILURE` (http_status=0, LiteLLM delta 0) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_RETURN_SHAPE_FIXED / FINALIZE_OBSERVABILITY_APPLIED / LITELLM_GLM_HTTP_200_HISTORICAL / RETRY5_LITELLM_HTTP_STATUS_0 / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — diagnose WF61 LiteLLM HTTP status-0 (no proxy hit), then one bounded resume of same live cycle |
| **NEXT** | Diagnose `HTTP Request - LiteLLM primary one-shot` → `http_status=0` with zero new `/v1/responses` logs; then resume `D-0025-W-GLM-LIVE-001` once |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · lane live-proven (incl. 284881 retry 5) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · finalize observability command applied · execs retained incl. `284882` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **1** `/v1/responses` call to date (retry 4 only) |
| **EXPANDED PLANNER BUDGET** | GLM **1/10** · Codex **1/10 used** |

## Boundaries

- Do not re-open the runtime gate without HTTP status-0 diagnosis/fix.
- Do not activate WF60 / mutate OpenClaw.
- Standing authorization applies for the bounded diagnosis + single resume.

## Puntatori

- Apply report: `reports/architecture/d0025_wf61_finalize_failure_observability_fix_apply.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- GPT-Web artifact: `workflows/patches/d0025-w-wf61-finalize-failure-observability-fix.gpt-web.json`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
