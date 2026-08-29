# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — tranche 02 event 02 STOP on hang-proof `HTTP_WALL_TIMEOUT` (LiteLLM Δ0; bridge observability restored) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / LIVE_CANONICAL_RESYNC_PASS / LIVE_6106_EXIT_NORMALIZATION_PROVEN / TRANCHE02_EVENT02_STOP_HTTP_WALL_TIMEOUT` |
| **GATE CORRENTE** | **CLOSED** — provider calls unauthorized until next authorized offline diagnosis + live pass |
| **NEXT** | Offline AUTO-VIA: diagnose why hang-proof one-shot reaches **HTTP_WALL_TIMEOUT** (~115s) with LiteLLM `/v1/responses` Δ**0** (connect/upstream path). Do not spend tranche 02 until that diagnosis PASSes. Node 6112 json-shape finding remains separately out of scope. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6106 `2>&1 \|\| true` · 6109/6110 canonical · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Boundaries

- Tranche 02 remains unconsumed (event 02 terminated at transport wall without LiteLLM/GLM).
- Do not arm the runtime gate or trigger another live planning cycle until HTTP_WALL_TIMEOUT-with-Δ0 is diagnosed offline.
- 6106 exit normalization is proven live (canonical `HTTP_*` surfaced); do not regress it.
- Node 6112 secondary json-shape finding remains out of scope unless separately authorized.
- Keep helper / CASE B / schema / normalizer / LiteLLM config unchanged unless authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Event 02 evidence: `reports/architecture/d0025_glm_tranche02_live_event02.md`
- Canonical resync: `reports/architecture/d0025_wf61_live_canonical_resync_after_6106_type_drift.md`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Issue **#31** — OPEN
