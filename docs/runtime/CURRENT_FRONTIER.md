# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — Codex offline compat recovery PASS reviewed by GPT Web; SSE normalizer + strict hard_constraints contract accepted; operator expanded available runtime budget to GLM max 10 + Codex max 10; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_OFFLINE_COMPAT_RECOVERY_PASS_REVIEWED / SSE_NORMALIZER_ACCEPTED / STRICT_HARD_CONSTRAINTS_ACCEPTED / EXPANDED_RUNTIME_BUDGET_AUTHORIZED` |
| **GATE CORRENTE** | `D0024_W_CODEX_RUNTIME_VERIFICATION_READY` — operator authorization now permits up to 10 GLM + 10 Codex bounded inferences (max 20 total) under existing safety boundaries; current technical need is Codex-only end-to-end verification |
| **NEXT** | Execute one Codex-only runtime verification first through LiteLLM loopback using corrected request-shape + SSE normalizer + strict hard_constraints exact-copy. Do not re-spend GLM unless a later diagnostic/validation need justifies it. Persist sanitized evidence; issue #30 stays OPEN pending review. |
| **D-0024 ORIGINAL PILOT** | GLM/Codex HTTP 400 request-shape · **2/2 spent** · historical |
| **D-0024 REPILOT** | GLM PASS_STRUCTURAL · Codex HTTP 200 + SSE body + hard_constraint mismatch · **2/2 spent** · historical |
| **D-0024 EXPANDED RUNTIME BUDGET** | operator-authorized new bounded allowance: GLM **0/10** · Codex **0/10** · total **0/20** · retry `0` per request · planner fallback `0` · gateway fallback `0` · Qwen `0` |
| **D-0024 CODEX OFFLINE RECOVERY** | PASS reviewed · LiteLLM ChatGPT path forces provider streaming and proxy forwards SSE · consumer-side normalizer implemented fail-closed · strict planner hard_constraints exact-copy contract integrated · tests 13/13 + shape 4/4 PASS · provider calls 0 |
| **D-0024 REQUEST SHAPE** | live-verified on re-pilot |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` · runtime structural PASS already sufficient for current comparison; expanded budget does not imply mandatory re-test |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · auth/model/routing HTTP 200 proven · offline SSE normalization ready · runtime verification now authorized |
| **PROXY STATUS** | runtime calls remain loopback-only `127.0.0.1:4000`; proxy readiness must be verified before calls; do not mutate host networking to make it reachable |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **LITELLM STATUS** | transport/auth/model routing proven; GLM runtime structural PASS; Codex client compatibility recovery PASS offline; no architecture promotion |
| **WORK-PC REMOTE ACCESS SAFETY** | `TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT` — do not change/restart/disable network adapters, NIC power management, IP/DHCP/DNS, routes, proxy, Windows Firewall, VPN/Tailscale/TeamViewer networking or TeamViewer service/config; no reboot/logoff/network-stack reset; any such action is STOP/gate |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED; must not be executed from WORK-PC if it risks TeamViewer/network continuity |
| **PARALLEL ZAI SUPPORT** | issue **#8** · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Historical original pilot **2/2** and runtime re-pilot **2/2** remain historical/spent and are not reset.
- A new operator-authorized bounded allowance is active: up to **10 GLM + 10 Codex**, max **20 total**. This is a ceiling, not a target; spend calls only when technically useful.
- Automatic retry remains **0** per request; planner fallback **0**; gateway fallback **0**. A later deliberate diagnostic call may use remaining budget, but there is no silent retry loop.
- Current evidence requires only **Codex** verification first; GLM does not need to be re-spent merely because budget exists.
- Runtime work remains through LiteLLM loopback `127.0.0.1:4000` for this D-0024 path. No public bind or network mutation.
- SSE normalization is consumer-side; do not claim LiteLLM is JSON-native for ChatGPT/Codex.
- `hard_constraints` exact-equality gate remains fail-closed; model-expanded constraints are never silently accepted or rewritten.
- Host Ajv unavailable remains a tooling limitation; structural/offline tests PASS without repo dependency additions.
- TeamViewer continuity on WORK-PC is a hard operational constraint. No network/NIC/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutations without a separate explicit gate.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no architecture promotion.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Expanded runtime budget authorization: issue #30 comment `5450880649`
- GPT-Web offline recovery review: issue #30 comment `5450815612`
- Connectivity safety constraint: issue #30 comment `5450545365`
- SSE normalizer: `tools/normalize-litellm-responses-body.mjs`
- Codex compat tests: `tests/llm-gateway-request-shape/codex-compat-run.mjs`
- Captured SSE fixture: `tests/llm-gateway-request-shape/fixtures/response-codex-repilot-sse.sse`
- Planner instructions: `tools/build-openclaw-responses-request.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
