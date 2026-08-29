# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — live WF61 6110 CASE B resynced after hang-proof; awaiting human GLM budget gate |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / WF61_HANGPROOF_HTTP_BRIDGE_APPLIED / LIVE_6110_CASE_B_RESYNCED / GLM_BUDGET_EXHAUSTED` |
| **GATE CORRENTE** | **HUMAN GATE REQUIRED** — new bounded GLM budget authorization before any live retry; runtime gate CLOSED; provider calls 0 this pass |
| **NEXT** | REAL HUMAN GATE: explicit authorization of a **new** bounded GLM budget before any further D-0025-W live retry. Do not arm runtime gate or trigger WF40/WF61 planning until that budget exists. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · **6110 CASE B present** (≡ template) · versionId `142ef860-a124-40fe-a99c-b2d26182764c` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **10** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **10/10** · Codex **1/10 used** |

## Boundaries

- Do not authorize or execute any additional GLM call under the exhausted 10-call budget.
- Do not arm the runtime gate or trigger WF40/WF61 planning without a new human budget gate.
- Hang-proof bridge on 6104/6106/6107 remains canonical and must not be changed casually.
- Live 6110 now matches template CASE B census/completion; keep it aligned.
- Live 6109 drift vs template remains known and out of scope until separately authorized.
- Keep CASE B / schema / normalizer / unwrap / LiteLLM config unchanged unless authorized.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- 6110 resync evidence: `reports/architecture/d0025_wf61_6110_case_b_resync_after_hangproof.md`
- 6110 resync artifact: `workflows/patches/d0025-w-wf61-6110-case-b-resync-after-hangproof.gpt-web.json`
- Hang-proof apply: `reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md`
- Helper: `tools/post-litellm-primary-one-shot.mjs`
- Issue **#31** — OPEN
