# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — SSE `output_item.done` normalization applied offline; retry 7 STOP on HTTP 429 (ZAI 5-hour usage limit) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SSE_OUTPUT_ITEM_DONE_NORMALIZATION_APPLIED / TRANSPORT_DIAGNOSED_HEALTHY / ZAI_5H_USAGE_LIMIT_HIT / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — after ZAI 5-hour window reset (2026-08-29 09:12:41), one bounded resume of same live cycle |
| **NEXT** | Wait for ZAI usage-limit reset **2026-08-29 09:12:41**, then one bounded resume of `D-0025-W-GLM-LIVE-001` (normalizer already on main). No workflow mutation. No smoke. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285015 retry 7) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **3** `/v1/responses` calls to date (2×200, 1×429) |
| **EXPANDED PLANNER BUDGET** | GLM **3/10** · Codex **1/10 used** |

## Boundaries

- Do not re-open the runtime gate until the ZAI 5-hour window has reset.
- Do not activate WF60 / mutate OpenClaw.
- Standing authorization applies for the single post-reset resume.

## Puntatori

- SSE apply report: `reports/architecture/d0025_sse_output_item_done_normalization_fix.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Artifact: `docs/runtime/PATCH_D0025_W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION.gpt-web.json`
- Normalizer: `tools/normalize-litellm-responses-body.mjs`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Issue **#31** — OPEN
