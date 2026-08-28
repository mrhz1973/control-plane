# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — first GLM `/v1/responses` reached; finalize failed (`FINALIZE_FAILED`) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_RETURN_SHAPE_FIXED / ADAPTER_READY_LIVE_PROVEN / WF40_BACKLOG_LANE_REACHABLE / LITELLM_GLM_HTTP_200_PROVEN / FINALIZE_FAILED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — diagnose/fix WF61 canonical finalize after GLM HTTP 200; then one bounded resume of same live cycle |
| **NEXT** | Diagnose `FINALIZE_FAILED` on WF61 after LiteLLM `POST /v1/responses` 200 for task `D-0025-W-GLM-LIVE-001`; no smoke/proof detour |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · lane live-proven (incl. 284816 retry 4) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · item-access + return-shape fixed · hist retained execs **2** (284723, 284784); retry-4 exec `284817` pruned after parent returned `FINALIZE_FAILED` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **1** `/v1/responses` call to date (retry 4 · HTTP 200) |
| **EXPANDED PLANNER BUDGET** | GLM **1/10** · Codex **1/10 used** |

## Boundaries

- Do not re-open the runtime gate without a finalize diagnosis/fix.
- Do not activate WF60 / mutate OpenClaw.
- Standing authorization applies for the bounded finalize repair + single resume.

## Puntatori

- Live report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Return-shape fix apply: `reports/architecture/d0025_wf61_item_return_shape_fix_apply.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
