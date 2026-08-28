# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — bounded runtime pilot executed (2/2 provider attempts); both authenticated routes reached providers but request shape was rejected before `emit_execution_packet`; zero-inference request-shape recovery authorized; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_RUNTIME_PILOT_COMPLETE / REQUEST_SHAPE_ROOT_CAUSE_IDENTIFIED / ZERO_INFERENCE_ADAPTER_RECOVERY_AUTHORIZED / PROVIDER_ATTEMPTS_2_OF_2_SPENT / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_ZERO_INFERENCE_REQUEST_SHAPE_RECOVERY` — inspect LiteLLM 1.98.0 provider transforms and fix the deterministic Responses envelope offline; no provider/model calls are authorized in this recovery |
| **NEXT** | Cursor WORK-PC repairs `tools/build-llm-gateway-request.mjs` so Responses `input` is a canonical input-item list preserving the exact consumer JSON payload, adds zero-network GLM+Codex transform/regression coverage, and persists PASS/STOP evidence. After recovery PASS, GPT Web reviews before any new inference authorization. |
| **D-0024-W PILOT RESULT** | GLM `HTTP 400` · Codex `HTTP 400` · attempts **2/2 SPENT** · retry/fallback **0** · Qwen **0** · `stream=false` · no Execution Packet · no Cursor packet execution |
| **D-0024 REQUEST-SHAPE FINDING** | current adapter serializes raw `consumer_input` object directly into Responses `body.input`; provider evidence: Z.AI `messages parameter is illegal`, ChatGPT Codex `Input must be a list`; recovery must validate canonical Responses input-list transformation offline before any new provider call |
| **D-0024 AUTH STATUS** | custom auth store still the Codex path · tokens not exposed |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` + `https://api.z.ai/api/coding/paas/v4` · 1 spent attempt · `PROVIDER_BAD_REQUEST_ZAI_MESSAGES_PARAMETER_ILLEGAL` |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · 1 spent attempt · `PROVIDER_BAD_REQUEST_CHATGPT_INPUT_MUST_BE_LIST` |
| **PROXY STATUS** | loopback `127.0.0.1:4000` was reachable during pilot; operator-started process may still be running, but zero-inference recovery must not depend on or call the live proxy |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME legacy Startup `.cmd` removed |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | isolated install PASS · aliases/auth routing proven · first pilot exposed deterministic Responses→provider request-shape incompatibility in current adapter |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- The original D-0024 inference budget is **spent 2/2**. No additional GLM/Codex/Qwen provider/model calls without a new explicit inference authorization.
- Zero-inference request-shape recovery is authorized: source inspection, local transform invocation that provably performs no HTTP/inference, adapter/test changes, deterministic offline regression, commit/push evidence.
- Current shared root-cause target is the provider-facing Responses input shape: raw consumer object must not be sent directly as `body.input`; preserve the full consumer payload inside canonical Responses input item(s).
- Do not read/display/persist credential or token values. Do not use auth refresh/device OAuth in the recovery.
- Host Ajv tooling absence must not be fixed by adding an unnecessary repo dependency; use existing canonical test infrastructure or isolated/local-source validation where possible.
- Do not start/restart/call the live LiteLLM proxy during zero-inference recovery.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no architecture promotion, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot/recovery: issue **#30** (`D-0024-W`)
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Gateway adapter: `tools/build-llm-gateway-request.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
