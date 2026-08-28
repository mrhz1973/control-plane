# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GLM live 001 retry 2 STOPPED inside WF61 (template Code-node defect); **parent lane proven end-to-end** |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED / ADAPTER_READY_LIVE_PROVEN / WF40_BACKLOG_LANE_REACHABLE / WF60_GIS_TAIL_NONBLOCKING_COMPLETE / WF61_CODE_NODE_ITEM_MODE_DEFECT / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — WF61 template must fix per-item Code nodes before next GLM live window |
| **NEXT** | GPT-Web bounded WF61 template correction (`$input.first()` invalid in `runOnceForEachItem` — use `$json`/`$input.item.json` or switch to `runOnceForAllItems`) on nodes: Parse prepare result fail-closed, Capture HTTP body + status, Return canonical cycle result, Return prepare failure without HTTP, Return HTTP failure no retry; re-import inactive; then fresh trigger + one GLM window. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · all 4 GIS/WF60 `continueOnFail=true` · backlog lane **live-proven** (exec `284722`) |
| **WF61 LIVE** | inactive · `d0025-6100-4001-8001-000000000061` · executions **1** (284723, error before LiteLLM) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | accepts GPT-Web `>-` YAML · offline + **live** REMOTE_DISPATCH_READY |
| **LITELLM LIVE** | preserved · unchanged · **0** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** (no inference attempted) · Codex **1/10 used** |

## Boundaries

- Do not enable runtime gate / run GLM inference until WF61 template defect is fixed via GPT-Web artifact.
- Do not activate WF60 / mutate OpenClaw without separate authorization.

## Puntatori

- Retry 2 STOP report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
