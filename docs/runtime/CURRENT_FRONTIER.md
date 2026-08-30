# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — child finalization reconciliation policy v1 **PASS** |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `EVENT03_PASS_VALID_EXECUTION_PACKET / PACKET_IPV6_OBSERVER_COVERAGE_PASS / CHILD_ROW_287888_ACCOUNTING_DIAG / CHILD_FINALIZATION_RECONCILIATION_V1_PASS` |
| **GATE CORRENTE** | Runtime gate **CLOSED** — no provider calls authorized |
| **NEXT** | `D0025_W_ACCEPTANCE_CLOSURE_REVIEW` — repo/read-only acceptance review of D-0025-W. Do **not** execute in this pass. Issue **#31** remains OPEN. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof preserved · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **11** `/v1/responses` calls |
| **BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **1/10 used** · LiteLLM **1/10 used** · retry **0** · fallback **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Child finalization reconciliation v1 anchors

- Contract: `docs/contracts/n8n-child-execution-reconciliation-v1.md`
- Tool: `tools/reconcile-n8n-child-execution-v1.mjs` — overlay/reporting only; **never** mutates `execution_entity` / `execution_data`.
- Canonical **287888** fixture: `logical_state=TERMINAL_SUCCESS` · `operational_block=false` · `historical_row_mutation_allowed=false`.
- Live process/task/helper leak always overrides accounting reconciliation (fail-closed).

## Boundaries

- Do not auto-mutate historical execution rows.
- Do not arm gate / trigger WF40/WF61 without fresh authorization.
- Node 6112 remains out of scope.
- Keep helper / CASE B / schema / LiteLLM config / network unchanged unless next authorized pass says otherwise.

## Puntatori

- Reconciliation policy: `reports/architecture/d0025_child_finalization_reconciliation_policy_v1.md`
- Child-row diagnosis: `reports/architecture/d0025_child_row_287888_accounting_diagnosis.md`
- Event 03: `reports/architecture/d0025_glm_tranche02_live_event03_with_network_observer.md`
- Packet: `docs/packets/EP-D-0025-W-GLM-LIVE-001.json`
- Issue **#31** — OPEN
