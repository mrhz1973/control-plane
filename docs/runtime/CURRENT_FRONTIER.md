# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | D-0025-W / issue **#31** — **CLOSED / COMPLETE**; V4 OpenCode dispatch boundary **PASS** |
| **BLOCCO ATTIVO** | `V4_OPENCODE_DISPATCH` |
| **STATO BLOCCO** | `D0025_COMPLETE / V4_ROUTER_PASS / QWEN_LOCAL_READY / OPENCODE_DISPATCH_READY` |
| **GATE CORRENTE** | D-0025 runtime gate **CLOSED** · V4 live OpenCode execution requires explicit bounded runtime gate |
| **NEXT** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` — perform one bounded real OpenCode + qwen_local implementation action under explicit runtime gate. **Do not execute in this pass.** |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` npm · v **1.18.25** · dispatch interface resolved |

## V4 OpenCode dispatch anchors

- Contract/tool: `docs/contracts/opencode-execution-dispatch-v1.md` · `tools/dispatch-opencode-execution-v1.mjs`
- Probe/overlay: `tools/probe-opencode-local-v1.mjs` · composed in `collect-qwen-local-resource-status-v1.mjs`
- Report: `reports/architecture/v4_opencode_dispatch.md` — **DISPATCH_READY** · `execution_performed=false`
- Route: `opencode + qwen_local` only · packet unchanged · qwen profile `fast_8k` DFlash2

## Boundaries

- Do not reopen or mutate D-0025 runtime.
- No OpenCode/Qwen generation without explicit live-proof gate.
- EXECUTION_ROUTER policy unchanged.
- v3.2 foundation preserved.

## Puntatori

- Dispatch report: `reports/architecture/v4_opencode_dispatch.md`
- Execution router: `reports/architecture/v4_execution_router.md`
- Qwen overlay: `reports/architecture/v4_qwen_local_resource_status_overlay.md`
