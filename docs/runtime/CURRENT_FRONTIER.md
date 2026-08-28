# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — runtime re-pilot complete (new 2/2); request-shape fix verified live for GLM; Codex emits packet but gateway returns SSE + hard_constraint mismatch; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_RUNTIME_REPILOT_COMPLETE / REQUEST_SHAPE_FIX_LIVE_VERIFIED / GLM_PACKET_PASS_STRUCTURAL / CODEX_SSE_GATEWAY_BODY_ISSUE / NEW_REPILOT_2_OF_2_SPENT` |
| **GATE CORRENTE** | `D0024_W_REPILOT_REVIEW_AND_FOLLOWON_GATES` — GPT Web review of re-pilot evidence; optional follow-on for Codex SSE aggregation + strict hard_constraint enforcement without new inference unless explicitly authorized |
| **NEXT** | GPT Web reviews issue #30 with separated budgets (historical original 2/2 + new re-pilot 2/2). No further provider calls without explicit new authorization. Issue #30 stays OPEN pending review. |
| **D-0024 ORIGINAL PILOT** | GLM/Codex HTTP 400 request-shape errors · attempts **2/2 spent** · historical only |
| **D-0024 REPILOT (NEW)** | GLM HTTP 200 completed + `emit_execution_packet` PASS_STRUCTURAL · Codex HTTP 200 completed + `emit_execution_packet` but gateway SSE body + HARD_CONSTRAINT_MISMATCH · new attempts **2/2 spent** |
| **D-0024 REQUEST SHAPE** | offline fix verified live — no ZAI messages-illegal / no ChatGPT input-must-be-list on re-pilot |
| **D-0024 AUTH STATUS** | unchanged · tokens not exposed |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` · re-pilot provider HTTP 200 · structural gate PASS |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · re-pilot provider HTTP 200 · SSE gateway body · packet hard_constraints mismatch |
| **PROXY STATUS** | loopback `127.0.0.1:4000` used · not restarted by Cursor this pass |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | request-shape recovery live-verified · re-pilot budget spent |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- Historical original pilot (2/2) and new re-pilot (2/2) are separate budgets; both spent.
- No additional GLM/Codex/Qwen inference without explicit new authorization.
- Re-pilot confirms request-shape fix; does not declare architecture promotion or runtime PASS-closed for full D-0024 comparison.
- Codex path still needs gateway SSE→JSON aggregation review for `stream=false` clients.
- Host Ajv unavailable; structural gates applied; full schema/policy tooling blocked on host.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Adapter: `tools/build-llm-gateway-request.mjs`
- Shape tests: `tests/llm-gateway-request-shape/run.mjs`
- Re-pilot runner: `tests/llm-gateway-request-shape/runtime-repilot-once.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
