# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W COMPLETE/CLOSED** — LiteLLM GLM+Codex remote-planner comparison PASS; architecture promotion requires separate operator decision; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `LITELLM_REMOTE_PRIMARY_ARCHITECTURE_DECISION` |
| **STATO BLOCCO** | `D0024_COMPLETE / LITELLM_REMOTE_PATH_TECHNICALLY_QUALIFIED / OPENCLAW_PRESERVED / ARCHITECTURE_NOT_YET_PROMOTED` |
| **GATE CORRENTE** | `OPERATOR_ARCHITECTURE_DECISION_REQUIRED` — separate explicit decision required by `llm-gateway-comparison-spike-v1` before changing the primary gateway/routing architecture |
| **NEXT** | Operator chooses whether to promote LiteLLM to primary gateway for GLM+Codex remote planners while preserving OpenClaw as fallback/existing path. No n8n/runtime routing mutation before that decision. |
| **D-0024 RESULT** | **COMPLETE / PASS** · issue #30 closed completed · GPT-Web final review comment `5451249319` |
| **D-0024 OFFLINE PORTABILITY** | PASS · explicit LiteLLM planner aliases/binding proven; OpenClaw legacy binding remains `PLANNER_BINDING_UNVERIFIED` |
| **D-0024 GLM** | `planner-glm-pilot` → `zai/glm-5.3` with explicit Coding Plan endpoint · runtime structural PASS accepted |
| **D-0024 CODEX** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · HTTP 200 · SSE normalizer PASS · 1×`emit_execution_packet` · hard_constraints exact 2/2 · canonical schema PASS · response gate PASS · policy PROCEED |
| **D-0024 SCHEMA ENGINE** | isolated user-local Ajv **8.20.0** + ajv-formats **3.0.1** · validator regression **5/5 PASS** · resolver env `CONTROL_PLANE_AJV_NODE_MODULES` |
| **D-0024 EXPANDED BUDGET** | GLM cap **10**; Codex **1/10 used, 9/10 remaining**; retry 0; planner fallback 0; gateway fallback 0; Qwen 0 |
| **LITELLM STATUS** | **TECHNICALLY_QUALIFIED_PRIMARY_CANDIDATE_REMOTE_PATH** · not permanent service · no architecture promotion yet |
| **OPENCLAW STATUS** | preserved intact as existing/fallback candidate path; D-0016-W Phase B remains separate/parallel |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **WORK-PC REMOTE ACCESS SAFETY** | `TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT` — do not change/restart/disable network adapters, NIC power management, IP/DHCP/DNS, routes, proxy, Windows Firewall, VPN/Tailscale/TeamViewer networking or TeamViewer service/config; no reboot/logoff/network-stack reset; any such action is STOP/gate |
| **PARALLEL ZAI SUPPORT** | issue **#8** · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **PM-34 / n8n_ready** | BLOCKED / `false` pending architecture decision and subsequent controlled integration stage |

## Boundaries operative correnti

- D-0024 is closed: current GLM+Codex remote-planner evidence satisfies the comparison contract decision rule technically.
- LiteLLM may now be **recommended** as primary gateway for the remote-planner path, but actual promotion is forbidden until the operator makes the separate architecture decision required by the contract.
- OpenClaw remains intact; no uninstall/removal/mutation is implied by the recommendation.
- Qwen remains deferred and does not block the GLM+Codex remote-path decision.
- Expanded planner budget remains available only for technically useful bounded validation: GLM max 10, Codex 9/10 remaining; retry/fallback remain zero unless separately changed.
- TeamViewer continuity on WORK-PC remains a hard operational constraint. No network/NIC/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutations.
- No n8n production routing, permanent LiteLLM service, OpenClaw/VPS mutation, or architecture switch before the operator architecture gate.

## Puntatori

- Completed runtime pilot: issue **#30** (`D-0024-W`) — CLOSED/COMPLETED
- GPT-Web final D-0024 review: issue #30 comment `5451249319`
- Comparison contract: `docs/contracts/llm-gateway-comparison-spike-v1.md`
- Offline comparison matrix: `reports/architecture/openclaw_vs_litellm_spike_matrix.md`
- LiteLLM config template: `configs/litellm/control-plane-spike.template.yaml`
- SSE normalizer: `tools/normalize-litellm-responses-body.mjs`
- Validator: `tools/validate-execution-packet-v1.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
