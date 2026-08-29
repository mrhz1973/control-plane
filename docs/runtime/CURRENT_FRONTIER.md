# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Attempt 9 `SSE_NO_COMPLETED_RESPONSE`; offline remediation STOP CASE B; GPT-Web bounded WF61 sanitized structural-capture artifact now authored |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / ZAI_QUOTA_RELEASED / SSE_NO_COMPLETED_RESPONSE / ATTEMPT9_SSE_BODY_UNAVAILABLE / SSE_STRUCTURAL_CAPTURE_ARTIFACT_AUTHORED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for bounded capture pass** — apply exact GPT-Web artifact with zero provider calls, then one one-shot GLM resume to persist sanitized event census; runtime gate CLOSED outside that event |
| **NEXT** | Apply `workflows/patches/d0025-w-wf61-sse-structural-capture.gpt-web.json` verbatim to WF61/template, validate equivalence, then one bounded resume of `D-0025-W-GLM-LIVE-001`. Capture structural census only. No smoke, no retry, no normalizer semantic change before census. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes · lane live-proven (incl. 285346 attempt 9) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **4** `/v1/responses` calls to date (3×200 incl. attempt 9, 1×429) |
| **EXPANDED PLANNER BUDGET** | GLM **4/10** · Codex **1/10 used** |

## Boundaries

- Apply only the exact GPT-Web-authored structural-capture artifact; Cursor must not redesign WF61.
- Provider calls must remain zero during artifact apply/validation.
- The bounded capture resume permits exactly one new LiteLLM/GLM attempt, no retry/fallback, and must finish with gate CLOSED + WF61 inactive.
- Persist/report only sanitized protocol structure; never raw SSE/model output/prompt/reasoning/credentials.
- Do not invent alternate terminal normalization before the captured census deterministically supports it.
- Do not activate WF60 / mutate OpenClaw.

## Puntatori

- **Capture artifact:** `workflows/patches/d0025-w-wf61-sse-structural-capture.gpt-web.json`
- Remediation STOP report: `reports/architecture/d0025_glm_sse_terminal_event_remediation.md`
- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Previous SSE apply report: `reports/architecture/d0025_sse_output_item_done_normalization_fix.md`
- Normalizer: `tools/normalize-litellm-responses-body.mjs`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- Issue **#31** — OPEN
