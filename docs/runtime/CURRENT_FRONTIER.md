# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — Codex runtime verify PASS reviewed by GPT Web; SSE normalized live, hard_constraints exact, emit_execution_packet; remaining closure blocker is host schema engine; expanded Codex budget 1/10 used; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_RUNTIME_VERIFY_PASS_REVIEWED / SSE_NORMALIZER_LIVE_VERIFIED / HARD_CONSTRAINTS_EXACT_MATCH / SCHEMA_ENGINE_CLOSURE_PENDING / CODEX_BUDGET_1_OF_10` |
| **GATE CORRENTE** | `D0024_W_ZERO_INFERENCE_SCHEMA_ENGINE_CLOSURE` — AUTO-VIA authorized: resolve Ajv draft 2020-12 + ajv-formats in isolated user-local environment and rerun canonical captured-packet schema/response/policy gates; provider calls 0 |
| **NEXT** | Cursor zero-inference schema-engine/tooling closure. If canonical packet schema + response gate + policy gate close cleanly, GPT Web reviews D-0024 for completion/architecture decision. Issue #30 stays OPEN. |
| **D-0024 CODEX RUNTIME VERIFY** | GPT-Web accepted · HTTP **200** · SSE→normalizer **PASS** · `completed` · 1×`emit_execution_packet` · hard_constraints **exact 2/2** · structural gate **PASS** · remaining canonical schema/policy blocker `HOST_TOOLING_AJV_UNAVAILABLE` |
| **D-0024 CODEX BUDGET** | used **1/10** · remaining **9/10** · no further call needed for schema-engine closure |
| **D-0024 GLM BUDGET** | expanded cap **10** · no additional GLM call needed at current gate |
| **D-0024 ORIGINAL PILOT** | **2/2 spent** · historical |
| **D-0024 REPILOT** | **2/2 spent** · historical |
| **GLM ROUTE** | prior runtime structural PASS remains accepted |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · end-to-end consumer path live-verified |
| **PROXY STATUS** | temporary Codex-only LiteLLM was stopped after verify; no proxy/provider call needed for next pass |
| **QWEN RUNTIME STATUS** | `DEFERRED` · inference `0` |
| **LITELLM STATUS** | GLM runtime structural PASS; Codex runtime PASS through consumer SSE normalization; architecture promotion not yet declared |
| **WORK-PC REMOTE ACCESS SAFETY** | `TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT` — do not change/restart/disable network adapters, NIC power management, IP/DHCP/DNS, routes, proxy, Windows Firewall, VPN/Tailscale/TeamViewer networking or TeamViewer service/config; no reboot/logoff/network-stack reset; any such action is STOP/gate |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Codex runtime verify evidence accepted by GPT Web; expanded Codex budget remains **1/10 used, 9/10 remaining**.
- Next pass is **zero inference** and **zero provider call**: close host schema-engine/tooling only.
- Prefer an isolated user-local Ajv/ajv-formats install outside the repo. Do not add repo dependencies merely to satisfy this WORK-PC host.
- If canonical tooling needs a resolver hook for that external module location, a minimal deterministic env-based resolver path is allowed; no provider/runtime behavior change.
- `hard_constraints` exact-equality gate remains fail-closed; model-expanded constraints are never silently accepted or rewritten.
- TeamViewer continuity on WORK-PC is a hard operational constraint. No network/NIC/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutations.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no architecture promotion during tooling closure.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- GPT-Web Codex runtime verify review: issue #30 comment `5451145370`
- Connectivity safety constraint: issue #30 comment `5450545365`
- Validator: `tools/validate-execution-packet-v1.mjs`
- Response gate: `tools/validate-openclaw-planner-response-gate.mjs`
- Policy gate: `tools/evaluate-execution-packet-policy.mjs`
- SSE normalizer: `tools/normalize-litellm-responses-body.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
