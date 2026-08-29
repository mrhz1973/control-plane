# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — hang-proof HTTP bridge applied offline; GPT-Web live 6110 CASE B resync artifact authored |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6110_CASE_B_DRIFT / 6110_RESYNC_ARTIFACT_AUTHORED / GLM_BUDGET_EXHAUSTED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for offline live-6110 resync only** — provider calls 0; runtime gate remains CLOSED; GLM budget remains exhausted |
| **NEXT** | Apply `D0025_W_WF61_6110_CASE_B_RESYNC_AFTER_HANGPROOF` offline using `workflows/patches/d0025-w-wf61-6110-case-b-resync-after-hangproof.gpt-web.json`: only live node 6110 may change; restore exact canonical CASE B census/completion propagation; keep hang-proof 6104/6106/6107 and 6109 unchanged; WF61 inactive; runtime gate CLOSED. After PASS, a separate human authorization of a new bounded GLM budget is required before any live retry. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof transport on 6104/6106/6107 · live 6110 CASE B missing |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **10** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **10/10** · Codex **1/10 used** |

## Boundaries

- Do not authorize or execute any additional GLM call under the current 10-call budget.
- Do not arm the runtime gate or trigger WF40/WF61 planning without a new human budget gate.
- Hang-proof bridge on 6104/6106/6107 is canonical for the current live path and must not be changed by the 6110 resync.
- Only live 6110 may be restored from the canonical template in this pass; template remains unchanged.
- Keep 6109 unchanged in this pass.
- Keep CASE B / schema / normalizer / unwrap / LiteLLM config unchanged.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- 6110 resync artifact: `workflows/patches/d0025-w-wf61-6110-case-b-resync-after-hangproof.gpt-web.json`
- Hang-proof apply: `reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md`
- Helper: `tools/post-litellm-primary-one-shot.mjs`
- Hang diagnosis: `reports/architecture/d0025_wf61_post_http200_hang_offline_diagnosis.md`
- Issue **#31** — OPEN
