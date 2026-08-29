# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — hang-proof transport + 6110 CASE B live; operator authorized new GLM tranche; 6109 finalize-observability resync required before spending it |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6110_CASE_B_RESYNCED / NEW_GLM_TRANCHE_02_AUTHORIZED / LIVE_6109_FINALIZE_OBSERVABILITY_RESYNC_PENDING` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for offline 6109 resync only** — new provider budget exists but remains unconsumed; runtime gate CLOSED |
| **NEXT** | Apply `D0025_W_WF61_6109_FINALIZE_OBSERVABILITY_RESYNC_AFTER_HANGPROOF` offline, changing only live node 6109 command to canonical template semantics. Provider calls = 0. If PASS, next is one bounded D-0025-W GLM live event using at most 1/10 of the new tranche. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6110 CASE B present · 6109 resync pending |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls from prior tranche |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Boundaries

- Operator authorization for tranche 02 is persisted at `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`.
- Each live pass may consume at most one GLM call and one LiteLLM call; stop after its first terminal result. Remaining tranche budget is not permission for an internal retry loop.
- Do not spend tranche 02 before live 6109 finalize-observability is re-synced.
- Hang-proof bridge on 6104/6106/6107 remains canonical.
- Live 6110 must remain template-equivalent for CASE B census/completion.
- 6109 resync may change only `parameters.command` to the GPT-Web-authored canonical command ending `2>&1 || true`.
- Keep CASE B / schema / normalizer / LiteLLM config unchanged.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- 6109 resync artifact: `workflows/patches/d0025-w-wf61-6109-finalize-observability-resync-after-hangproof.gpt-web.json`
- 6110 resync evidence: `reports/architecture/d0025_wf61_6110_case_b_resync_after_hangproof.md`
- Hang-proof apply: `reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md`
- Helper: `tools/post-litellm-primary-one-shot.mjs`
- Issue **#31** — OPEN
