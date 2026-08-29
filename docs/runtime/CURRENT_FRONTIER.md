# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — child-row 287888 accounting diagnosis → **EXECUTION_ENGINE_CHILD_FINALIZATION_BUG** |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `EVENT03_PASS_VALID_EXECUTION_PACKET / PACKET_IPV6_OBSERVER_COVERAGE_PASS / CHILD_ROW_287888_ACCOUNTING_DIAG_E` |
| **GATE CORRENTE** | Runtime gate **CLOSED** — no provider calls authorized |
| **NEXT** | Smallest bounded **n8n child-finalization remediation/design** for integrated WF61 executions: prefer additive/forward fix (observability, post-success entity reconciliation policy) over automatic historical-row mutation. Do **not** mutate DB or restart n8n in design-only pass unless separately authorized. Issue **#31** remains OPEN. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof preserved · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **11** `/v1/responses` calls |
| **BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **1/10 used** · LiteLLM **1/10 used** · retry **0** · fallback **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Child-row 287888 diagnosis anchors

- Child **287888** logically completed: internal event log **`n8n.workflow.success`**, all nodes through **Return canonical cycle result**; parent **287887** Execute Workflow **`success`** with `PASS` cycle result + packet delivered.
- **`execution_entity` desync:** contemporaneously `running` / `stoppedAt=null`; `execution_data` purged; row now **absent** (`wf61` max surviving id **287009**).
- **Not** the Attempt 16 6106-hang root cause — Event03 child completed; shared pattern is accounting desync + later purge only.
- **No** live process/runner/helper leak; operational impact = accounting/history only.

## Boundaries

- Do not auto-mutate historical execution rows.
- Do not arm gate / trigger WF40/WF61 without fresh authorization.
- Node 6112 remains out of scope.
- Keep helper / CASE B / schema / LiteLLM config / network unchanged unless next authorized pass says otherwise.

## Puntatori

- Diagnosis: `reports/architecture/d0025_child_row_287888_accounting_diagnosis.md`
- Event 03: `reports/architecture/d0025_glm_tranche02_live_event03_with_network_observer.md`
- Prior hang diagnosis (286310): `reports/architecture/d0025_wf61_post_http200_hang_offline_diagnosis.md`
- Packet: `docs/packets/EP-D-0025-W-GLM-LIVE-001.json`
- Issue **#31** — OPEN
