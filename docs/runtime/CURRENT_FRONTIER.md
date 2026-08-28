# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — Codex runtime verify PASS (SSE normalized, hard_constraints exact, emit_execution_packet); expanded Codex budget 1/10 used; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_RUNTIME_VERIFY_PASS / SSE_NORMALIZER_LIVE_VERIFIED / HARD_CONSTRAINTS_EXACT_MATCH / EMIT_EXECUTION_PACKET / CODEX_BUDGET_1_OF_10` |
| **GATE CORRENTE** | `D0024_W_GPT_WEB_CODEX_VERIFY_REVIEW` — Codex path end-to-end verified with normalizer; host Ajv still unavailable for full schema/policy closure |
| **NEXT** | GPT Web reviews issue #30 Codex verify evidence. Further Codex calls only with explicit budget (9/10 remaining). Issue #30 stays OPEN. |
| **D-0024 CODEX RUNTIME VERIFY** | HTTP **200** · SSE→normalizer **PASS** · `completed` · 1×`emit_execution_packet` · hard_constraints **exact 2/2** · structural gate **PASS** · schema gate **HOST_TOOLING_AJV_UNAVAILABLE** |
| **D-0024 CODEX BUDGET** | used **1/10** · remaining **9/10** · GLM **0** this pass · Qwen **0** |
| **D-0024 ORIGINAL PILOT** | **2/2 spent** · historical |
| **D-0024 REPILOT** | **2/2 spent** · historical |
| **GLM ROUTE** | not exercised this pass |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · temp loopback LiteLLM verify |
| **PROXY STATUS** | temporary Codex-only LiteLLM started and stopped by Cursor this pass · loopback only |
| **QWEN RUNTIME STATUS** | `DEFERRED` · inference `0` |
| **LITELLM STATUS** | Codex consumer path verified with SSE normalizer at boundary |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Expanded Codex budget: **1/10 used**, **9/10 remaining**. No GLM/Qwen this pass.
- Temporary LiteLLM process was loopback-only and terminated after verify; no service/autostart/network mutation.
- hard_constraints exact-copy contract verified live on Codex path.
- Host Ajv unavailable remains separate from Codex transport/normalizer/hard_constraint success.
- Issue #30 remains OPEN. No architecture promotion, no packet execution, no secret persistence.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Codex verify runner: `tests/llm-gateway-request-shape/codex-runtime-verify-once.mjs`
- SSE normalizer: `tools/normalize-litellm-responses-body.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
