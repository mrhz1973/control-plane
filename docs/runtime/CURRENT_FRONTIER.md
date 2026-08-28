# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — request-shape recovery offline PASS; original pilot budget spent 2/2; new bounded runtime re-pilot explicitly authorized; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_REQUEST_SHAPE_RECOVERY_OFFLINE_PASS / ORIGINAL_PILOT_2_OF_2_SPENT / GLM+CODEX_TRANSFORM_VALIDATED_OFFLINE / RUNTIME_REPILOT_AUTHORIZED_0_OF_2` |
| **GATE CORRENTE** | `D0024_W_RUNTIME_REPILOT_READY` — operator explicitly authorized a new bounded re-pilot: max 1 GLM + 1 Codex inference, max 2 total, retry/fallback 0, stream=false, Qwen 0, only through LiteLLM loopback `127.0.0.1:4000` using the corrected request-shape adapter |
| **NEXT** | WORK-PC executes the bounded D-0024 runtime re-pilot against the already-running/healthy loopback LiteLLM proxy using the corrected adapter; persist sanitized response/gate/policy evidence; stop after at most 1 GLM + 1 Codex provider attempt. Issue #30 stays OPEN pending GPT Web review. |
| **D-0024-W PILOT RESULT (ORIGINAL)** | GLM `HTTP 400` messages illegal · Codex `HTTP 400` input must be list · attempts **2/2 spent** · no packet |
| **D-0024-W REPILOT AUTHORIZATION** | NEW budget: GLM **0/1** · Codex **0/1** · total **0/2** · retry `0` · planner fallback `0` · gateway fallback `0` · `stream=false` · Qwen `0` · loopback only |
| **D-0024 REQUEST SHAPE** | `build-llm-gateway-request.mjs` fixed · old `input=object` → new list user item with `input_text` JSON of consumer_input · regression tests PASS |
| **D-0024 AUTH STATUS** | custom ChatGPT auth store unchanged · Z.AI credential remains local/process-bound as previously supplied · tokens/secrets not exposed |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` + coding endpoint · offline transform validation PASS |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · offline transform validation PASS |
| **PROXY STATUS** | expected operator-owned loopback `127.0.0.1:4000`; Cursor must verify readiness before any re-pilot request and must not restart it unless a later contract explicitly authorizes that |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | adapter fix offline PASS · provider transforms validated offline · bounded runtime re-pilot authorized |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- Original D-0024 pilot inference budget remains historical/spent **2/2**; do not reinterpret or reset it.
- A separate new re-pilot budget is explicitly authorized: max **1 GLM + 1 Codex**, max **2 total**, retry/fallback **0**, `stream=false`, Qwen **0**.
- Re-pilot may use only LiteLLM loopback `127.0.0.1:4000` with the corrected request-shape adapter already validated offline.
- Any provider/API failure consumes that backend's single re-pilot attempt; no retry or fallback.
- Before inference, Cursor must verify proxy readiness and canonical aliases/config without reading secret values. If proxy is not ready, STOP with re-pilot budget still unused.
- No n8n/OpenClaw/VPS mutation, no public bind, no permanent service/autostart, no secret persistence, no architecture promotion, no PM-34/L5/endurance/permanent schedule.
- Issue #30 remains OPEN pending GPT Web review of re-pilot evidence.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Adapter: `tools/build-llm-gateway-request.mjs`
- Shape tests: `tests/llm-gateway-request-shape/run.mjs`
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
