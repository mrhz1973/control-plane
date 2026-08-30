# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | D-0025-W / issue **#31** — **CLOSED / COMPLETE**; V4 OpenCode dispatch boundary **PASS** |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` |
| **STATO BLOCCO** | `D0025_COMPLETE / V4_ROUTER_PASS / QWEN_LOCAL_READY / OPENCODE_DISPATCH_READY / LIVE_PROOF_AUTHORIZED` |
| **GATE CORRENTE** | **AUTHORIZED ONE-SHOT** by `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`: exactly 1 OpenCode execution + max 1 qwen_local generation, `fast_8k`, DFlash2 required, retry 0, fallback 0; gate must close immediately after first terminal result. |
| **NEXT** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` — execute the authorized one-shot live proof only. No GLM/Codex/LiteLLM/n8n/WF40/WF61/OpenClaw/network/credential/secret/Qwen-runtime mutation. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` npm · v **1.18.25** · dispatch interface resolved |

## V4 OpenCode dispatch anchors

- Contract/tool: `docs/contracts/opencode-execution-dispatch-v1.md` · `tools/dispatch-opencode-execution-v1.mjs`
- Probe/overlay: `tools/probe-opencode-local-v1.mjs` · composed in `collect-qwen-local-resource-status-v1.mjs`
- Report: `reports/architecture/v4_opencode_dispatch.md` — **DISPATCH_READY** · `execution_performed=false`
- Route: `opencode + qwen_local` only · packet unchanged · qwen profile `fast_8k` DFlash2
- Runtime authorization: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`

## Live-proof safety shape

- Maximum **1** OpenCode execution and maximum **1** qwen_local generation call.
- Because the operator capped qwen generation at one, the live proof must be **single-turn / no-tools** at the OpenCode model boundary: disable tool availability for the proof session and request one deterministic structured implementation artifact as model output. Do not allow an agent tool loop that could trigger a second model generation.
- Retry 0 · fallback 0 · stop on first terminal result.
- Close the V4 live-proof gate immediately after the terminal result, whether PASS or STOP.
- Any inability to prove the one-generation bound before execution is a pre-run STOP, not permission to risk a second generation.

## Boundaries

- Do not reopen or mutate D-0025 runtime.
- EXECUTION_ROUTER policy unchanged.
- v3.2 foundation preserved.
- No destructive action or scope expansion.
- No secret access/persistence and no credential mutation.

## Puntatori

- Runtime authorization: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`
- Dispatch report: `reports/architecture/v4_opencode_dispatch.md`
- Execution router: `reports/architecture/v4_execution_router.md`
- Qwen overlay: `reports/architecture/v4_qwen_local_resource_status_overlay.md`
