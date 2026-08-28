# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GLM smoke STOPPED; parent lane wired; runtime gate CLOSED |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / REMOTE_RUNTIME_GATE_DISABLED / GLM_SMOKE_STOPPED_GITHUB_401` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — GitHub credential repair + n8n reload required before any gated GLM smoke |
| **NEXT** | Do not enable the runtime gate yet. First authorize repair of n8n GitHub credential `7u1QOkEiYcdKncmd` (401 Bad credentials on WF40 poll). Then reload n8n so in-process WF40 matches published 44-node version. Only then re-authorize single GLM smoke. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · DB/export versionId `48c30f4a-124c-48a4-b240-c2f6eca4743e` · **44 nodes** · **in-process executions still on 35-node `86ed5569-…`** · schedule poll failing **401 Bad credentials** |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **WF60 LIVE** | inactive · preserved |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** (never left open) |
| **ADAPTER HELPER** | live on VPS mount · offline tests **18/18 PASS** |
| **LITELLM LIVE** | provider wired · `/v1/models` OK · no inference this pass |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Boundaries

- Single GLM smoke authorization (`5454611166`) was **not** consumed: zero WF61, zero provider calls.
- Credential / OAuth / TeamViewer / LiteLLM / OpenClaw / WF60 mutation remains out of scope until separately authorized.
- Legacy PM21/Telegram, Qwen deferment, TeamViewer continuity preserved.

## Puntatori

- STOP report: `reports/architecture/d0025_remote_runtime_gate_enable_and_single_glm_smoke.md`
- Prepared smoke backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_SMOKE_001.md`
- Apply report: `reports/architecture/d0025_wf40_parent_wiring_apply.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Helper: `tools/build-primary-remote-cycle-input-from-backlog.mjs`
- Issue **#31** — OPEN
