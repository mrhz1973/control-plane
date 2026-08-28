# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — GPT-Web exact WF40→WF61 parent lane authored; adapter helper implementation next |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / WF40_PARENT_PATCH_AUTHORED / REMOTE_RUNTIME_GATE_DISABLED` |
| **GATE CORRENTE** | `D-0025-W_BACKLOG_PRIMARY_REMOTE_ADAPTER_IMPLEMENTATION` — implement/test repo helper required by the GPT-Web-authored parent patch; repo-only, zero workflow/provider mutation |
| **NEXT** | Cursor implements `tools/build-primary-remote-cycle-input-from-backlog.mjs` exactly against `docs/contracts/backlog-primary-remote-adapter-v1.md`, adds deterministic offline tests, validates the authored patch artifact offline, and persists evidence. Only after helper PASS may the separate WF40 parent wiring apply gate run. |
| **LITELLM LIVE** | provider wired · readiness **200 healthy** |
| **WF61 LIVE** | imported inactive · `d0025-6100-4001-8001-000000000061` · not executed |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · not wired to WF61 yet |
| **WF60 LIVE** | inactive · preserved |
| **PARENT WIRING PREFLIGHT** | PASS · `CANONICAL_INPUTS_BUILDABLE=false` from legacy PM17/PM19 seam · GPT-Web authoring required |
| **GPT-WEB ADAPTER CONTRACT** | `docs/contracts/backlog-primary-remote-adapter-v1.md` — authored |
| **GPT-WEB PARENT PATCH** | `workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json` — authored, not applied |
| **REMOTE RUNTIME GATE** | `configs/planner/primary-remote-runtime-gate.json` · `enabled=false` · `provider_calls_authorized_per_event=0` · provider state unknown/fail-closed |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |

## Parent lane design now authored

The permanent D-0025 parent lane is additive and parallel to the legacy PM21 plan/mock-worker branch. It watches canonical GPT-Web `backlog-item-v1` artifacts under `docs/runtime/BACKLOG_*.md`, maps them deterministically to `consumer_input` + `routing_input`, and can invoke WF61 only when the separate non-secret runtime gate is explicitly armed.

Initial runtime gate is deliberately closed, so parent wiring apply itself must produce **WF61 executions 0 / provider calls 0 / inference 0**.

## Boundaries

- GPT-Web remains sole author of the WF40 workflow delta; Cursor may implement the repo helper and later persist/apply only the exact authored workflow artifact.
- Do not apply the WF40 patch until the adapter helper + offline tests PASS.
- Do not change `primary-remote-runtime-gate.json` during helper implementation or parent wiring apply.
- Enabling the remote runtime gate or authorizing a provider call/inference is a later genuine operator gate.
- WF61 execution/provider inference remain forbidden now.
- Existing WF40 PM21/Telegram lane, WF60/OpenClaw, LiteLLM wiring, Qwen deferment and TeamViewer continuity remain preserved.

## Puntatori

- Parent wiring preflight: `reports/architecture/d0025_wf40_parent_wiring_exact_readonly_preflight.md`
- Adapter contract: `docs/contracts/backlog-primary-remote-adapter-v1.md`
- Runtime gate: `configs/planner/primary-remote-runtime-gate.json`
- GPT-Web parent patch: `workflows/patches/d0025-w-wf40-wf61-parent-wiring.gpt-web.json`
- WF61 import: `reports/architecture/d0025_wf61_structural_verify_and_inactive_import.md`
- Issue **#31** — OPEN
