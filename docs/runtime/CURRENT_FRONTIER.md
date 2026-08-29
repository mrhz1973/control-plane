# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — tranche 02 event 01 STOP on hang-proof `HTTP_BRIDGE_OUTPUT_INVALID` (no LiteLLM/GLM consumption) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6110_CASE_B_RESYNCED / LIVE_6109_FINALIZE_OBSERVABILITY_RESYNCED / TRANCHE02_EVENT01_STOP_HTTP_BRIDGE_OUTPUT_INVALID` |
| **GATE CORRENTE** | **CLOSED** — provider calls unauthorized until next authorized offline repair + live pass |
| **NEXT** | Offline AUTO-VIA: diagnose/fix hang-proof bridge Execute Command stdout/exit vs 6107 parser so wall/timeout classifications surface as canonical `HTTP_*` instead of `HTTP_BRIDGE_OUTPUT_INVALID`. Do not spend tranche 02 until that repair PASSes. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof + 6110 CASE B + 6109 observability present |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Boundaries

- Tranche 02 remains unconsumed (event 01 reached WF61 but did not call LiteLLM/GLM).
- Do not arm the runtime gate or trigger another live planning cycle until hang-proof bridge output invalidation is repaired offline.
- No retry/fallback inside a live event; remaining tranche is not an internal retry loop.
- Keep CASE B / schema / normalizer / LiteLLM config unchanged unless separately authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Event 01 evidence: `reports/architecture/d0025_glm_tranche02_live_event01.md`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Hang-proof apply: `reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md`
- Issue **#31** — OPEN
