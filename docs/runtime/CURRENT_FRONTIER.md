# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 9 `SSE_NO_COMPLETED_RESPONSE`; offline remediation STOP CASE B (WF61 `285347` raw SSE evidence unavailable) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SSE_OUTPUT_ITEM_DONE_NORMALIZATION_APPLIED / ZAI_QUOTA_RELEASED / SSE_NO_COMPLETED_RESPONSE / ATTEMPT9_SSE_BODY_UNAVAILABLE / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **CLOSED** — no normalizer change without structural event census; capture plan required before next live resume |
| **NEXT** | Author a bounded sanitized SSE structural capture (event types/keys only) for the next one-shot live resume of `D-0025-W-GLM-LIVE-001`, then remediate offline from that census. No invented normalizer semantics. No smoke. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285346 attempt 9) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **4** `/v1/responses` calls to date (3×200 incl. attempt 9, 1×429) |
| **EXPANDED PLANNER BUDGET** | GLM **4/10** · Codex **1/10 used** |

## Boundaries

- Do not reopen the runtime gate until a capture/remediation plan exists for the unknown SSE terminal shape.
- Do not invent alternate terminal normalization without Attempt-grade structural evidence.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- Remediation STOP report: `reports/architecture/d0025_glm_sse_terminal_event_remediation.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- SSE apply report: `reports/architecture/d0025_sse_output_item_done_normalization_fix.md`
- Normalizer: `tools/normalize-litellm-responses-body.mjs`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Issue **#31** — OPEN
