# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — transport healthy; retry 6 terminal `SSE_NO_COMPLETED_RESPONSE`; GPT-Web bounded normalization artifact authored/released |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_RETURN_SHAPE_FIXED / FINALIZE_OBSERVABILITY_APPLIED / TRANSPORT_DIAGNOSED_HEALTHY / LITELLM_GLM_HTTP_200_PROVEN_X2 / SSE_OUTPUT_ITEM_DONE_NORMALIZATION_RELEASED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — apply GPT-Web bounded SSE output-item.done normalization artifact offline; on PASS immediately resume same GLM live cycle once |
| **NEXT** | Apply `docs/runtime/PATCH_D0025_W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION.gpt-web.json` to normalizer + targeted offline tests; if PASS, fresh trigger + one bounded resume of `D-0025-W-GLM-LIVE-001` |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · lane live-proven (incl. 284952 retry 6) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · observability + return-shape applied · execs `284723/284784` retained (+ pruned `284882`, `284953` marked error post-terminal) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **2** `/v1/responses` calls to date (both HTTP 200) |
| **EXPANDED PLANNER BUDGET** | GLM **2/10** · Codex **1/10 used** |

## Boundaries

- Apply/test pass is offline only: zero LiteLLM/provider calls and no WF61/WF40 live execution for confidence.
- After deterministic apply PASS, standing authorization permits one bounded resume of the same live task with max one GLM provider attempt; restore runtime gate CLOSED and WF61 inactive at first terminal result.
- Do not activate WF60 / mutate OpenClaw.
- Do not persist raw provider response or secret material.

## Puntatori

- GPT-Web SSE normalization artifact: `docs/runtime/PATCH_D0025_W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION.gpt-web.json`
- Normalizer: `tools/normalize-litellm-responses-body.mjs`
- Offline cycle tests: `tests/litellm-primary-cycle/run.mjs`
- Diagnosis report: `reports/architecture/d0025_wf61_http_status0_diagnosis.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Observability apply: `reports/architecture/d0025_wf61_finalize_failure_observability_fix_apply.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
