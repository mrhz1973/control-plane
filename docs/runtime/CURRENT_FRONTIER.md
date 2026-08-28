# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF61 per-item return shape fixed; resume GLM live cycle retry 4 |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_RETURN_SHAPE_FIXED / ADAPTER_READY_LIVE_PROVEN / WF40_BACKLOG_LANE_REACHABLE / WF61_PREPARE_STAGE_PROVEN / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — resume same `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001` with fresh trigger + one bounded GLM window |
| **NEXT** | `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001` retry 4: append fresh trigger outside YAML, temp GLM gate, max 1 new WF61 execution, max 1 GLM provider attempt, retry=0, fallback=0 |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · all 4 GIS/WF60 `continueOnFail=true` · lane live-proven (284722, 284783) |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes · per-item access + return shape fixed · versionId `ab504cd5-1f14-4097-9e78-6aa6cf10cd1a` · executions **2** (284723, 284784 — both before LiteLLM) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · unchanged · **0** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** (attempt never consumed) · Codex **1/10 used** |

## Boundaries

- Next pass may open a temporary bounded GLM gate only for one WF61 execution; must restore CLOSED before evidence commit.
- Do not activate WF60 / mutate OpenClaw.
- Standing authorization applies for the bounded GLM live retry.

## Puntatori

- Return-shape fix apply: `reports/architecture/d0025_wf61_item_return_shape_fix_apply.md`
- GPT-Web artifact: `workflows/patches/d0025-w-wf61-item-return-shape-fix.gpt-web.json`
- Live report (attempts 1–4): `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Prior item-access fix apply: `reports/architecture/d0025_wf61_code_node_item_access_fix_apply.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
