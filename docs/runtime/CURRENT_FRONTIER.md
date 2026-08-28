# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — schema-engine closure PASS offline on captured Codex packet; canonical schema + response + policy gates all PASS; GPT-Web review pending for D-0024 completion/architecture decision; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_SCHEMA_ENGINE_CLOSURE_PASS / CANONICAL_GATES_PASS / GPT_WEB_REVIEW_PENDING / CODEX_BUDGET_1_OF_10` |
| **GATE CORRENTE** | `D0024_W_GPT_WEB_REVIEW` — AUTO-VIA authorized: GPT Web reviews D-0024 evidence (runtime verify + schema-engine closure); issue #30 stays OPEN until review |
| **NEXT** | GPT Web review of D-0024 completion evidence. No further inference unless GPT Web authorizes next pilot step. |
| **D-0024 SCHEMA ENGINE** | isolated user-local Ajv **8.20.0** + ajv-formats **3.0.1** at `%LOCALAPPDATA%\ControlPlane\schema-engine`; resolver env `CONTROL_PLANE_AJV_NODE_MODULES`; validator regression **5/5 PASS** |
| **D-0024 CAPTURED CODEX GATES** | packet schema **PASS** · response gate **PASS** · policy **PROCEED** · artifacts in `tests/llm-gateway-request-shape/artifacts/` |
| **D-0024 CODEX RUNTIME VERIFY** | GPT-Web accepted · HTTP **200** · SSE→normalizer **PASS** · `completed` · 1×`emit_execution_packet` · hard_constraints **exact 2/2** |
| **D-0024 CODEX BUDGET** | used **1/10** · remaining **9/10** |
| **D-0024 GLM BUDGET** | expanded cap **10** · prior runtime structural PASS accepted |
| **D-0024 ORIGINAL PILOT** | **2/2 spent** · historical |
| **D-0024 REPILOT** | **2/2 spent** · historical |
| **GLM ROUTE** | prior runtime structural PASS remains accepted |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · end-to-end consumer path live-verified + offline canonical gates PASS |
| **PROXY STATUS** | no proxy/provider call needed at current gate |
| **QWEN RUNTIME STATUS** | `DEFERRED` · inference `0` |
| **LITELLM STATUS** | GLM runtime structural PASS; Codex runtime + canonical offline gates PASS; architecture promotion pending GPT Web review |
| **WORK-PC REMOTE ACCESS SAFETY** | `TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT` — do not change/restart/disable network adapters, NIC power management, IP/DHCP/DNS, routes, proxy, Windows Firewall, VPN/Tailscale/TeamViewer networking or TeamViewer service/config; no reboot/logoff/network-stack reset; any such action is STOP/gate |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Schema-engine closure complete offline; `HOST_TOOLING_AJV_UNAVAILABLE` resolved via isolated user-local install + env resolver hook.
- Captured Codex packet passes canonical schema, response gate, and policy (**PROCEED**) without packet mutation.
- Issue #30 remains OPEN pending GPT Web review; no architecture promotion until review closes D-0024.
- TeamViewer continuity on WORK-PC is a hard operational constraint. No network/NIC/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutations.
- No n8n/OpenClaw/VPS mutation, no secret persistence during review gate.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Schema resolver env: `CONTROL_PLANE_AJV_NODE_MODULES` → isolated `node_modules` path (user-local, not repo)
- Captured artifacts: `tests/llm-gateway-request-shape/artifacts/`
- Validator: `tools/validate-execution-packet-v1.mjs`
- Response gate: `tools/validate-openclaw-planner-response-gate.mjs`
- Policy gate: `tools/evaluate-execution-packet-policy.mjs`
- SSE normalizer: `tools/normalize-litellm-responses-body.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
