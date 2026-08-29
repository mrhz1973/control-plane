# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — operator-relayed STOP: live WF61 drifted back to pre-hangproof fields; 6106 is `httpRequest`, with 6104/6107, 6109 and 6110 preserve checks also failing |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / TRANCHE02_UNCONSUMED / LIVE_WF61_CANONICAL_DRIFT_CONFIRMED_OPERATOR_RELAY / FULL_CANONICAL_RESYNC_ARTIFACT_AUTHORED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for offline canonical WF61 resync only** — provider calls 0; runtime gate remains CLOSED; tranche 02 remains unconsumed |
| **NEXT** | Apply `D0025_W_WF61_LIVE_CANONICAL_RESYNC_AFTER_6106_TYPE_DRIFT` offline from GPT-Web artifact. Restore 6104/6106/6107 hang-proof transport, then 6106 exit normalization, 6109 finalize observability and 6110 CASE B exactly from existing GPT-Web-authored source artifacts. No provider spend. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · operator-relayed drift: 6106 old `httpRequest`; canonical resync pending |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Boundaries

- Operator-relayed STOP is persisted as evidence but is not independently re-executed by GPT-Web.
- Do not arm runtime gate or trigger another live planning cycle until the full canonical WF61 resync PASSes.
- Workflow authority remains GPT-Web. Apply only `workflows/patches/d0025-w-wf61-live-canonical-resync-after-6106-type-drift.gpt-web.json` and its named GPT-Web source artifacts verbatim.
- Resync scope is limited to canonical fields on 6104/6106/6107/6109/6110 and the pending 6106 exit-normalization suffix.
- Keep 13 nodes and all connections; 6101/6102/6103/6105/6108/6111/6112 unchanged.
- Secondary node 6112 finding remains out of scope.
- Keep helper / CASE B helper / schema / normalizer / LiteLLM config unchanged.
- No retry/fallback inside a live event; tranche 02 remains 0/10 until a later bounded live pass.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Full resync artifact: `workflows/patches/d0025-w-wf61-live-canonical-resync-after-6106-type-drift.gpt-web.json`
- Operator-relayed STOP evidence: `reports/architecture/d0025_wf61_6106_bridge_exit_normalization_operator_relay.md`
- Hang-proof source: `workflows/patches/d0025-w-wf61-hangproof-http-bridge.gpt-web.json`
- 6106 normalization source: `workflows/patches/d0025-w-wf61-6106-bridge-exit-normalization.gpt-web.json`
- 6109 source: `workflows/patches/d0025-w-wf61-6109-finalize-observability-resync-after-hangproof.gpt-web.json`
- 6110 source: `workflows/patches/d0025-w-wf61-6110-case-b-resync-after-hangproof.gpt-web.json`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Canonical method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Issue **#31** — OPEN
