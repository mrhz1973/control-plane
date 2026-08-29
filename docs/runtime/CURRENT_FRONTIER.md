# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — post-quota resume Attempt 9 STOP on `SSE_NO_COMPLETED_RESPONSE` (HTTP 200; no completed / no output_item.done) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SSE_OUTPUT_ITEM_DONE_NORMALIZATION_APPLIED / ZAI_QUOTA_RELEASED / SSE_NO_COMPLETED_RESPONSE / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — wait for GPT-Web / operator-authored bounded SSE terminal-event remediation before next live resume |
| **NEXT** | Author/apply next bounded SSE terminal-event fix for live GLM streams lacking both `response.completed` and `output_item.done`; then one resume of `D-0025-W-GLM-LIVE-001`. No smoke. No workflow mutation until artifact exists. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285346 attempt 9) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **4** `/v1/responses` calls to date (3×200 incl. attempt 9, 1×429) |
| **EXPANDED PLANNER BUDGET** | GLM **4/10** · Codex **1/10 used** |

## Boundaries

- Do not re-open the runtime gate until a bounded SSE remediation artifact is authorized.
- Do not activate WF60 / mutate OpenClaw.
- ZAI 5-hour quota gate is no longer the active blocker (HTTP 200 on attempt 9).

## Puntatori

- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- SSE apply report: `reports/architecture/d0025_sse_output_item_done_normalization_fix.md`
- Artifact: `docs/runtime/PATCH_D0025_W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION.gpt-web.json`
- Normalizer: `tools/normalize-litellm-responses-body.mjs`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Issue **#31** — OPEN (comment `5459670470`)
