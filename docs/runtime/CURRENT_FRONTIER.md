# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF61 item-access fix applied; ready to resume GLM live cycle |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_AND_CODE_FIXED / ADAPTER_READY_LIVE_PROVEN / WF40_BACKLOG_LANE_REACHABLE / WF60_GIS_TAIL_NONBLOCKING_COMPLETE / WF61_ITEM_ACCESS_FIXED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **OPERATOR GATE** — one bounded GLM live window authorized next |
| **NEXT** | Resume `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001`: fresh trigger + temp GLM gate + WF61 callable window · max 1 GLM provider attempt (not yet consumed) · retry=0 · fallback=0 |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · all 4 GIS/WF60 `continueOnFail=true` · backlog lane live-proven |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · versionId `e231817d-772c-4db0-80e6-3409fe259059` · 13 nodes · five per-item Code nodes fixed (`$json` / `.item.json`) · executions 1 (historical, pre-fix) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · unchanged · **0** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** (attempt not yet consumed) · Codex **1/10 used** |

## Boundaries

- Do not enable runtime gate / run GLM inference without bounded live-cycle authorization.
- Do not activate WF60 / mutate OpenClaw without separate authorization.

## Puntatori

- Fix apply report: `reports/architecture/d0025_wf61_code_node_item_access_fix_apply.md`
- GLM live report (attempts 1–3): `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template (fixed): `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
