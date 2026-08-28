# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — runtime re-pilot reviewed; request-shape fix LIVE-verified; GLM structural path PASS; Codex HTTP 200/function-call path needs zero-inference SSE aggregation + hard-constraint determinism recovery; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_RUNTIME_REPILOT_REVIEWED / REQUEST_SHAPE_FIX_LIVE_VERIFIED / GLM_PACKET_PASS_STRUCTURAL / CODEX_SSE_AND_HARD_CONSTRAINT_RECOVERY_ZERO_INFERENCE / BOTH_RUNTIME_BUDGETS_SPENT` |
| **GATE CORRENTE** | `D0024_W_CODEX_ZERO_INFERENCE_COMPAT_RECOVERY` — no human gate: inspect captured Codex SSE + LiteLLM 1.98.0 source, implement deterministic SSE→Responses JSON normalization where required, strengthen exact hard_constraints preservation/fail-closed enforcement, all offline; no provider call |
| **NEXT** | WORK-PC executes bounded zero-inference Codex compatibility recovery and regression tests. No additional provider/model calls until a later explicit authorization. Issue #30 stays OPEN pending recovery evidence review. |
| **D-0024 ORIGINAL PILOT** | GLM/Codex HTTP 400 request-shape errors · attempts **2/2 spent** · historical only |
| **D-0024 REPILOT (NEW)** | GLM HTTP 200 completed + `emit_execution_packet` PASS_STRUCTURAL · Codex HTTP 200 completed + `emit_execution_packet`, but gateway body SSE + `HARD_CONSTRAINT_MISMATCH` · attempts **2/2 spent** |
| **D-0024 REQUEST SHAPE** | offline fix LIVE-verified — no ZAI messages-illegal / no ChatGPT input-must-be-list on re-pilot |
| **D-0024 AUTH STATUS** | unchanged · tokens not exposed |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` · re-pilot provider HTTP 200 · structural gate PASS · policy GATE (`PLANNER_RECOMMENDED_GATE`) |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · re-pilot provider HTTP 200 · one `emit_execution_packet` · SSE gateway body · packet hard_constraints mismatch |
| **PROXY STATUS** | loopback `127.0.0.1:4000` used in re-pilot · zero-inference recovery must not contact/restart proxy unless explicitly required for local metadata only and cannot trigger provider HTTP |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | transport/auth/model routing proven for GLM+Codex; full Codex non-streaming compatibility not yet PASS-closed |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- Historical original pilot **2/2** and runtime re-pilot **2/2** are separate budgets; both are spent.
- No additional GLM/Codex/Qwen inference without explicit new authorization.
- Re-pilot proves provider reachability/auth/model routing and the request-shape correction, but does not promote LiteLLM or close full D-0024 runtime compatibility.
- Codex recovery is offline only: deterministic SSE→JSON normalization plus strict hard_constraints preservation/fail-closed behavior; do not silently accept or rewrite model-expanded constraints as if model-compliant.
- Captured sanitized runtime artifacts may be used locally; no secret/token values may be read or persisted.
- Host Ajv unavailable remains a tooling limitation; do not add repo dependencies solely to repair this host.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Adapter: `tools/build-llm-gateway-request.mjs`
- Planner instructions: `tools/build-openclaw-responses-request.mjs`
- Shape tests: `tests/llm-gateway-request-shape/run.mjs`
- Re-pilot runner: `tests/llm-gateway-request-shape/runtime-repilot-once.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
