# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF60 execute node non-blocking on WF40; runtime gate CLOSED |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / GITHUB_CRED_REPAIRED / WF40_44_NODE_IN_PROCESS / WF60_EXECUTE_NONBLOCKING / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — re-authorize single GLM smoke when backlog lane is reachable on natural polls; do not enable runtime gate yet if GIS handoff hard-fail still aborts lower siblings |
| **NEXT** | Observe whether plan-watcher/backlog siblings run on natural polls; if GIS handoff still aborts first, author a separate GPT-Web nonblocking delta. Then re-authorize temporary GLM gate enable + single smoke. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `b05501c1-8df7-4853-9674-2e35ca393a07` · **44 nodes** · WF60 node `continueOnFail=true` · WF60 inactive error no longer aborts siblings |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **WF60 LIVE** | inactive · preserved · execute-from-WF40 non-blocking |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | live · offline tests PASS |
| **LITELLM LIVE** | preserved · unchanged this pass |
| **GITHUB CRED** | repaired · unchanged this pass |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Boundaries

- Do not activate WF60 / mutate OpenClaw without separate authorization.
- Do not enable primary-remote runtime gate / run GLM smoke without separate authorization.
- GIS handoff hard-fail under v1 order is out of scope for the WF60 nonblocking patch.

## Puntatori

- Apply report: `reports/architecture/d0025_wf40_wf60_parallel_nonblocking_apply.md`
- Patch: `workflows/patches/d0025-w-wf40-wf60-nonblocking.gpt-web.json`
- Standing auth: `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
