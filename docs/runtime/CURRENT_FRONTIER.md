# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | D-0025-W / issue **#31** — **CLOSED / COMPLETE**; V4 resumes at first missing execution-runtime boundary |
| **BLOCCO ATTIVO** | `V4_OPENCODE_DISPATCH` |
| **STATO BLOCCO** | `D0025_COMPLETE / V4_ROUTER_PASS / QWEN_LOCAL_READY / OPENCODE_DISPATCH_STOPPED_NOT_INSTALLED` |
| **GATE CORRENTE** | D-0025 runtime gate **CLOSED** · V4 dispatch work is repo/offline until OpenCode CLI is available on execution host |
| **NEXT** | `V4_OPENCODE_DISPATCH` — **blocked:** OpenCode CLI not on PATH in Cursor execution environment (`OPENCODE_NOT_INSTALLED`). Install/expose OpenCode CLI, then re-run dispatch boundary implementation. No provider/model live call in preflight pass. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes — preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **11** `/v1/responses` calls |
| **D0025 TRANCHE 02 FINAL** | GLM **1/10 used** · LiteLLM **1/10 used** · retry **0** · fallback **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## D-0025 closure anchors

- Acceptance review: `reports/architecture/d0025_acceptance_closure_review.md` → **READY_TO_CLOSE**.
- Closure record: `reports/architecture/d0025_issue31_closure.md`.
- Issue **#31**: **CLOSED / completed**.
- No further GLM/Codex/provider/live proof required for D-0025 closure.
- Remaining D-0025 findings are nonblocking follow-ups only: node 6112 failure path, child execution accounting engine behavior beyond reconciliation overlay, optional Codex symmetric integrated-path live proof.

## V4 resume anchors

- Execution router: `reports/architecture/v4_execution_router.md` — deterministic-first router PASS; natural route includes `opencode + qwen_local`.
- qwen_local RESOURCE_STATUS overlay: `reports/architecture/v4_qwen_local_resource_status_overlay.md` — session READY maps to `qwen_local.available=true`; router/session suites PASS.
- OpenCode dispatch: `reports/architecture/v4_opencode_dispatch.md` — **STOP** `OPENCODE_NOT_INSTALLED` (read-only preflight; no implementation).
- v3.2 foundation remains canonical/live; V4 remains additive and must not mutate D-0025/WF60/OpenClaw paths in the next repo-only pass.

## Boundaries

- Do not reopen or mutate D-0025 runtime merely for proof.
- Do not auto-mutate historical n8n execution rows.
- Node 6112 is outside the active V4 dispatch item.
- Do not duplicate the V4 n8n workflow/control plane.
- Keep deterministic routing authoritative; Qwen semantic arbitration only where the existing router explicitly requires it.
- No new provider/model generation call is authorized by this frontier entry.

## Puntatori

- D-0025 closure: `reports/architecture/d0025_issue31_closure.md`
- D-0025 acceptance: `reports/architecture/d0025_acceptance_closure_review.md`
- V4 execution router: `reports/architecture/v4_execution_router.md`
- V4 qwen overlay: `reports/architecture/v4_qwen_local_resource_status_overlay.md`
