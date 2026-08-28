# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GitHub credential repaired; WF40 44-node live in-process; runtime gate CLOSED |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / GITHUB_CRED_REPAIRED / WF40_44_NODE_IN_PROCESS / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **REAL HUMAN / OPERATOR GATE** — re-authorize single GLM smoke only; do not enable runtime gate without that authorization |
| **NEXT** | When authorized: temporarily enable `configs/planner/primary-remote-runtime-gate.json` for GLM (`enabled=true`, `provider_calls_authorized_per_event=1`, GLM healthy), run exactly one backlog→WF61→LiteLLM GLM smoke, then restore gate CLOSED. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `48c30f4a-124c-48a4-b240-c2f6eca4743e` · **44 nodes in-process** · GitHub poll **401 cleared** · legacy WF60 execute may still error (`Workflow is not active`) on some commits |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **WF60 LIVE** | inactive · preserved (not activated this pass) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | live on VPS mount · offline tests PASS |
| **LITELLM LIVE** | provider wired · preserved unchanged this pass |
| **GITHUB CRED** | id `7u1QOkEiYcdKncmd` · name `GitHub account` · type `githubApi` · repaired · standalone REST validation HTTP 200 |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Boundaries

- Runtime gate must stay CLOSED until a separate GLM smoke authorization.
- No WF61 / provider inference without that gate.
- Do not activate WF60 / mutate OpenClaw unless separately authorized.
- Legacy PM21/Telegram, Qwen deferment, TeamViewer continuity preserved.

## Puntatori

- Credential repair report: `reports/architecture/d0025_github_credential_repair_and_n8n_reload.md`
- Prepared smoke backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_SMOKE_001.md`
- Prior STOP (401): `reports/architecture/d0025_remote_runtime_gate_enable_and_single_glm_smoke.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Issue **#31** — OPEN
