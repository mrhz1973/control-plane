# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — live WF61 canonical resync PASS after 6106 type drift; tranche 02 ready for one bounded live event |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6106_EXIT_NORMALIZATION_APPLIED / LIVE_6109_FINALIZE_OBSERVABILITY_RESYNCED / LIVE_6110_CASE_B_RESYNCED / LIVE_CANONICAL_RESYNC_AFTER_6106_TYPE_DRIFT_PASS / NEW_GLM_TRANCHE_02_AUTHORIZED_UNCONSUMED` |
| **GATE CORRENTE** | **HUMAN / NEXT-PASS BOUND** — runtime gate CLOSED; tranche 02 still **0/10**; next pass may spend at most 1 GLM + 1 LiteLLM |
| **NEXT** | One bounded D-0025-W tranche 02 live event using at most GLM Δ=1, LiteLLM Δ=1, retry=0, fallback=0, Codex=0, Qwen=0, Cursor auto-dispatch=0. Stop after first terminal result. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6106 `2>&1 \|\| true` · 6109 observability · 6110 CASE B · versionId `8690b057-bfc6-4ee9-a968-936046ff497f` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Boundaries

- Tranche 02 remains unconsumed until the next authorized bounded live pass.
- Each live pass may consume at most one GLM call and one LiteLLM call; stop after first terminal result.
- Live WF61 must remain template-equivalent for hang-proof 6104/6106/6107, 6106 exit normalization, 6109 observability, and 6110 CASE B.
- Node 6112 secondary finding remains out of scope unless separately authorized.
- Keep helper / CASE B helper / schema / normalizer / LiteLLM config unchanged unless authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Resync evidence: `reports/architecture/d0025_wf61_live_canonical_resync_after_6106_type_drift.md`
- Resync artifact: `workflows/patches/d0025-w-wf61-live-canonical-resync-after-6106-type-drift.gpt-web.json`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Issue **#31** — OPEN
