# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GLM live 001 retry STOPPED; exact terminal GIS Telegram nonblocking delta authored |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED / ADAPTER_HELPER_READY / WF40_PARENT_LANE_WIRED / WF60_GIS_HANDOFF_READWRITE_NONBLOCKING / GIS_TELEGRAM_FILE_PATCH_AUTHORED / GLM_LIVE_001_RETRY_STOPPED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA BOUNDED APPLY** — standing authorization releases exact GPT-Web GIS Telegram file nonblocking delta; no conversational re-authorization |
| **NEXT** | Apply `workflows/patches/d0025-w-wf40-gis-telegram-file-nonblocking.gpt-web.json` only; then resume the existing real GLM live 001 cycle with one fresh dedupe trigger only if required. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `b198b317-f004-465d-82ed-3fbb3d79f9f6` · 44 nodes · WF60 + GIS handoff + GIS Read/Write `continueOnFail=true` · GIS Telegram file node still blocking until apply |
| **WF61 LIVE** | inactive · `d0025-6100-4001-8001-000000000061` · **not executed** (0) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | accepts GPT-Web `>-` YAML · offline REMOTE_DISPATCH_READY |
| **LITELLM LIVE** | preserved · unchanged |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used** |

## Boundaries

- Apply only the exact GPT-Web one-property patch to `Telegram - Send handoff file`.
- Do not enable runtime gate or run GLM inference in the patch pass.
- Do not activate WF60 / mutate OpenClaw.
- No separate smoke/proof cycle; only minimum deterministic validation bundled with apply.

## Puntatori

- GPT-Web patch: `workflows/patches/d0025-w-wf40-gis-telegram-file-nonblocking.gpt-web.json`
- Issue #31 release comment: `5457505393`
- Retry STOP report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- GIS Read/Write apply: `reports/architecture/d0025_wf40_gis_readwrite_nonblocking_apply.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Standing authorization: `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`
- Issue **#31** — OPEN
