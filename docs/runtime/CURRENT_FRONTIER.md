# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — Codex offline compat recovery PASS (SSE normalizer + strict hard_constraints contract); both runtime budgets spent; GPT Web review pending; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_OFFLINE_COMPAT_RECOVERY_PASS / SSE_NORMALIZER_INTEGRATED / STRICT_HARD_CONSTRAINTS_CONTRACT / BOTH_RUNTIME_BUDGETS_SPENT` |
| **GATE CORRENTE** | `D0024_W_GPT_WEB_REPILOT_REVIEW` — offline Codex SSE normalization and hard-constraint fail-closed enforcement complete; no new inference until explicit authorization |
| **NEXT** | GPT Web reviews issue #30 with updated offline recovery evidence. Optional future bounded re-pilot may test normalized Codex path end-to-end only with explicit new budget. Issue #30 stays OPEN. |
| **D-0024 ORIGINAL PILOT** | GLM/Codex HTTP 400 request-shape · **2/2 spent** · historical |
| **D-0024 REPILOT** | GLM PASS_STRUCTURAL · Codex HTTP 200 + SSE body + hard_constraint mismatch · **2/2 spent** |
| **D-0024 CODEX OFFLINE RECOVERY** | SSE root cause classified (LiteLLM ChatGPT forces stream=true; proxy forwards SSE) · normalizer PASS · strict planner contract updated · hard_constraint gate PASS |
| **D-0024 REQUEST SHAPE** | live-verified on re-pilot |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` · re-pilot structural PASS |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · offline SSE normalizer ready · captured mismatch still fail-closed until model complies |
| **PROXY STATUS** | not contacted this pass |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **LITELLM STATUS** | transport/auth/model routing proven; Codex non-streaming client path requires SSE normalization at consumer boundary |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Historical original pilot **2/2** and runtime re-pilot **2/2** remain spent; offline recovery added **0** provider calls.
- SSE normalization is consumer-side; does not claim LiteLLM is JSON-native for ChatGPT/Codex.
- hard_constraints exact-equality gate remains fail-closed; model-expanded constraints are not silently accepted or rewritten.
- Host Ajv unavailable remains a tooling limitation; structural/offline tests PASS without repo dependency additions.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no architecture promotion.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- SSE normalizer: `tools/normalize-litellm-responses-body.mjs`
- Codex compat tests: `tests/llm-gateway-request-shape/codex-compat-run.mjs`
- Captured SSE fixture: `tests/llm-gateway-request-shape/fixtures/response-codex-repilot-sse.sse`
- Planner instructions: `tools/build-openclaw-responses-request.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
