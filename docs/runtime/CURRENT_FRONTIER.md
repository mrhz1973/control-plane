# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF40 primary-remote parent lane WIRED; runtime gate remains CLOSED |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — enable `configs/planner/primary-remote-runtime-gate.json` only under separate provider/inference authorization |
| **NEXT** | Do not dispatch yet. When authorized, set gate `enabled=true`, `provider_calls_authorized_per_event=1`, and deterministic healthy `provider_state` for GLM/Codex. Then a separate bounded smoke/dispatch gate may allow exactly one WF61 provider call. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `48c30f4a-124c-48a4-b240-c2f6eca4743e` · **44 nodes** · additive backlog→adapter→gated WF61 lane present · legacy PM21 lane preserved |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · **not executed** |
| **WF60 LIVE** | inactive · preserved |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **unchanged** |
| **ADAPTER HELPER** | live on VPS mount · offline tests PASS |
| **LITELLM LIVE** | provider wired · readiness healthy · unchanged this pass |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Boundaries

- Parent lane is wired but dispatch is fail-closed while the runtime gate stays disabled.
- Enabling the gate / authorizing provider calls is a genuine later operator gate — not AUTO-VIA by default.
- Do not execute WF61 or change LiteLLM/auth/credentials without that later authorization.
- Legacy PM21/Telegram, WF60/OpenClaw, Qwen deferment, TeamViewer continuity preserved.

## Puntatori

- Apply report: `reports/architecture/d0025_wf40_parent_wiring_apply.md`
- Patch artifact: `workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Helper: `tools/build-primary-remote-cycle-input-from-backlog.mjs`
- Issue **#31** — OPEN
