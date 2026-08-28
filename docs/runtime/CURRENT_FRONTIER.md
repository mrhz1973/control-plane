# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GLM live 001 retry 2 STOPPED inside WF61; parent backlog lane live-proven; exact WF61 Code-node item-access fix authored by GPT-Web |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED / ADAPTER_READY_LIVE_PROVEN / WF40_BACKLOG_LANE_REACHABLE / WF60_GIS_TAIL_NONBLOCKING_COMPLETE / WF61_CODE_NODE_ITEM_ACCESS_FIX_AUTHORED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED** — bounded WF61 template/live correction is technically determined under standing authorization; no conversational authorization gate |
| **NEXT** | Apply GPT-Web artifact `workflows/patches/d0025-w-wf61-code-node-item-access-fix.gpt-web.json`: preserve `runOnceForEachItem`, replace invalid `$input.first()`/cross-node `.first()` item access on the five named Code nodes with `$json` / linked `.item.json`, persist corrected template, re-import/apply WF61 inactive, minimum structural validation only, provider/inference 0. Then fresh trigger + one GLM live window; no smoke/proof intermediate. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · all 4 GIS/WF60 `continueOnFail=true` · backlog lane **live-proven** (exec `284722`) |
| **WF61 LIVE** | inactive · `d0025-6100-4001-8001-000000000061` · executions **1** (284723, error before LiteLLM) |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **ADAPTER HELPER** | accepts GPT-Web `>-` YAML · offline + **live** REMOTE_DISPATCH_READY |
| **LITELLM LIVE** | preserved · unchanged · **0** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** (no inference attempted) · Codex **1/10 used** |

## Boundaries

- During the WF61 Code-node correction pass: runtime gate stays CLOSED; no provider inference; WF61 ends inactive.
- Do not activate WF60 / mutate OpenClaw without separate authorization.
- No mode/topology/connection redesign: only the five GPT-Web-authored `jsCode` replacements in the released artifact.

## Puntatori

- GPT-Web WF61 fix: `workflows/patches/d0025-w-wf61-code-node-item-access-fix.gpt-web.json`
- Retry 2 STOP report: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Live backlog: `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- Standing authorization: `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`
- Issue **#31** — OPEN
