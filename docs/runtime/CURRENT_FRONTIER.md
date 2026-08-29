# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — hang-proof + 6110 CASE B + 6109 finalize observability live; tranche 02 ready for one bounded live event |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6110_CASE_B_RESYNCED / LIVE_6109_FINALIZE_OBSERVABILITY_RESYNCED / NEW_GLM_TRANCHE_02_AUTHORIZED_UNCONSUMED` |
| **GATE CORRENTE** | **HUMAN / NEXT-PASS BOUND** — runtime gate CLOSED; tranche 02 still **0/10**; next pass may spend at most 1 GLM + 1 LiteLLM |
| **NEXT** | One bounded D-0025-W GLM live event using at most GLM tranche 02 Δ=1, LiteLLM tranche 02 Δ=1, retry=0, fallback=0, Codex=0, Qwen=0, Cursor auto-dispatch=0. Stop after first terminal result. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6110 CASE B · **6109 finalize observability ≡ template** · versionId `5c36be63-ec06-4d47-bf51-726a1b354f37` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls from prior tranche |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Boundaries

- Operator authorization for tranche 02 is persisted at `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`.
- Each live pass may consume at most one GLM call and one LiteLLM call; stop after its first terminal result.
- Offline 6109 finalize-observability resync is complete and must not be re-spent as provider budget.
- Hang-proof bridge on 6104/6106/6107 remains canonical.
- Live 6110 must remain template-equivalent for CASE B census/completion.
- Live 6109 must retain `2>&1 || true` finalize observability.
- Keep CASE B / schema / normalizer / LiteLLM config unchanged unless authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- 6109 resync evidence: `reports/architecture/d0025_wf61_6109_finalize_observability_resync_after_hangproof.md`
- 6109 resync artifact: `workflows/patches/d0025-w-wf61-6109-finalize-observability-resync-after-hangproof.gpt-web.json`
- 6110 resync evidence: `reports/architecture/d0025_wf61_6110_case_b_resync_after_hangproof.md`
- Hang-proof apply: `reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md`
- Issue **#31** — OPEN
