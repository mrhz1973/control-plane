# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GLM live retry 3 STOPPED before LiteLLM; exact WF61 per-item return-shape correction authored by GPT-Web |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_CODE_ITEM_ACCESS_FIXED_BUT_RETURN_SHAPE_INVALID / RETURN_SHAPE_FIX_AUTHORED / ADAPTER_READY_LIVE_PROVEN / WF40_BACKLOG_LANE_REACHABLE / WF61_PREPARE_STAGE_PROVEN / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — apply exact GPT-Web artifact `workflows/patches/d0025-w-wf61-item-return-shape-fix.gpt-web.json`; no conversational re-authorization required |
| **NEXT** | `D-0025-W_WF61_TEMPLATE_ITEM_RETURN_SHAPE_FIX`: five `runOnceForEachItem` nodes keep mode/access logic and change only `return [{json:{…}}]` → `return {json:{…}}`; apply template+live inactive, provider/inference 0; then resume same GLM live cycle with one bounded provider attempt. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · all 4 GIS/WF60 `continueOnFail=true` · lane live-proven (284722, 284783) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · item-access fixed but per-item return shape invalid · executions **2** (284723, 284784 — both before LiteLLM) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · unchanged · **0** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** (attempt never consumed) · Codex **1/10 used** |

## Boundaries

- This apply pass must not enable the runtime gate or perform provider inference.
- Do not activate WF60 / mutate OpenClaw.
- Standing authorization applies because the next action is an exact bounded repair inside current architecture/scope.

## Puntatori

- Authoritative fix artifact: `workflows/patches/d0025-w-wf61-item-return-shape-fix.gpt-web.json`
- Live report (attempts 1–4): `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Prior item-access fix apply: `reports/architecture/d0025_wf61_code_node_item_access_fix_apply.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
