# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — backlog primary-remote adapter helper READY; WF40 parent wiring apply next |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / ADAPTER_HELPER_READY / REMOTE_RUNTIME_GATE_DISABLED / WF40_PARENT_PATCH_AUTHORED_NOT_APPLIED` |
| **GATE CORRENTE** | `D-0025-W_WF40_PARENT_WIRING_APPLY` — persist/apply exact GPT-Web patch `workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json` only after operator/AUTO-VIA authorization for that apply gate |
| **NEXT** | Apply the authored additive WF40 backlog→WF61 parent lane. Canonical runtime gate must remain `enabled=false` / `provider_calls_authorized_per_event=0`, so apply itself yields WF61 executions 0 / provider calls 0 / inference 0. |
| **ADAPTER HELPER** | `tools/build-primary-remote-cycle-input-from-backlog.mjs` · offline tests **18/18 PASS** · bounded YAML parser · no new runtime deps |
| **REMOTE RUNTIME GATE** | `configs/planner/primary-remote-runtime-gate.json` · **unchanged** · `enabled=false` · `provider_calls_authorized_per_event=0` |
| **GPT-WEB PARENT PATCH** | authored · **not applied** · `workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json` |
| **LITELLM LIVE** | provider wired · readiness **200 healthy** |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · not executed |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · not wired to WF61 yet |
| **WF60 LIVE** | inactive · preserved |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Boundaries

- GPT-Web remains sole author of the WF40 workflow delta; Cursor may apply only the exact authored patch artifact.
- Do not change `primary-remote-runtime-gate.json` during parent wiring apply.
- Enabling the remote runtime gate or authorizing a provider call/inference is a later genuine operator gate.
- WF61 execution/provider inference remain forbidden until that later gate.
- Existing WF40 PM21/Telegram lane, WF60/OpenClaw, LiteLLM wiring, Qwen deferment and TeamViewer continuity remain preserved.

## Puntatori

- Adapter contract: `docs/contracts/backlog-primary-remote-adapter-v1.md`
- Helper: `tools/build-primary-remote-cycle-input-from-backlog.mjs`
- Offline tests: `tests/backlog-primary-remote-adapter/run.mjs`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- GPT-Web parent patch: `workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json`
- Issue **#31** — OPEN
