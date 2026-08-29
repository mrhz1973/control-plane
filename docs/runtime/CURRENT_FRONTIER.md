# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — tranche 02 event 01 STOP on hang-proof `HTTP_BRIDGE_OUTPUT_INVALID`; root repair narrowed to 6106 Execute Command exit/stdout observability |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6110_CASE_B_RESYNCED / LIVE_6109_FINALIZE_OBSERVABILITY_RESYNCED / TRANCHE02_EVENT01_STOP_HTTP_BRIDGE_OUTPUT_INVALID / 6106_EXIT_NORMALIZATION_ARTIFACT_AUTHORED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for offline 6106 bridge exit normalization only** — provider calls 0; runtime gate remains CLOSED; tranche 02 remains unconsumed |
| **NEXT** | Apply `D0025_W_WF61_6106_BRIDGE_EXIT_NORMALIZATION` offline from GPT-Web artifact. Change only node 6106 command by appending `2>&1 || true`; validate helper terminal JSON survives nonzero exits and 6107 surfaces canonical `HTTP_*` classifications. Do not spend tranche 02 in this pass. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6110 CASE B · 6109 finalize observability |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Boundaries

- Tranche 02 remains unconsumed; do not arm runtime gate or trigger another live planning cycle until offline 6106 repair PASSes.
- GPT-Web workflow artifact is authoritative: only live/template node 6106 `parameters.command` may change, by exact suffix `2>&1 || true`.
- Preserve the helper logic, 6107 parser, hang-proof transport bounds, 6109 finalize observability, 6110 CASE B, schema, normalizer and LiteLLM config.
- Secondary event-01 n8n finding at node 6112 remains recorded but is intentionally out of scope for this repair; do not widen scope without fresh evidence.
- No retry/fallback inside a live event; remaining tranche is not an internal retry loop.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- 6106 repair artifact: `workflows/patches/d0025-w-wf61-6106-bridge-exit-normalization.gpt-web.json`
- Event 01 evidence: `reports/architecture/d0025_glm_tranche02_live_event01.md`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Hang-proof apply: `reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md`
- Canonical method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor task contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Issue **#31** — OPEN
