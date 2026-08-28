# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — architecture sync to LiteLLM-primary decision pending in D-0025 Phase A |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — LiteLLM promoted by explicit operator decision to primary gateway for GLM+Codex remote planners; Phase A repo-only foundation/config sync + integration mapping active; issue **#30** COMPLETE/CLOSED; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `ARCHITECTURE_PROMOTION_APPROVED / DECISION_RECORDED / OPENCLAW_PRESERVED / QWEN_DEFERRED / PHASE_A_REPO_SYNC_READY` |
| **GATE CORRENTE** | `D0025_W_PHASE_A_AUTO_ELIGIBLE` — repo-only synchronization and read-only integration mapping are authorized; no live n8n/runtime routing mutation in Phase A |
| **NEXT** | WORK-PC Cursor executes D-0025 Phase A: synchronize foundation architecture, create canonical non-secret LiteLLM primary-remote config separate from spike template, inventory exact current n8n/OpenClaw integration points read-only, persist evidence. Then GPT Web authors the exact minimal n8n workflow delta for the next controlled pass. |
| **ARCHITECTURE DECISION** | **LiteLLM PRIMARY REMOTE GATEWAY** for GLM + Codex · operator approved 2026-08-28 · record `reports/architecture/litellm_primary_remote_gateway_decision.md` · issue #31 |
| **PRIMARY REMOTE PATH** | planner selection → LiteLLM → GLM 5.3 / Codex OAuth → `emit_execution_packet` → canonical response/schema/policy gates → Cursor |
| **OPENCLAW STATUS** | preserved intact as existing/fallback path; no uninstall/removal; D-0016-W remains separate/parallel |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **D-0024 RESULT** | **COMPLETE / PASS** · issue #30 CLOSED/COMPLETED · LiteLLM technically qualified on GLM+Codex remote path |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` with explicit Coding Plan endpoint · prior runtime structural PASS accepted |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · HTTP 200 · SSE normalizer PASS · exact hard_constraints · schema PASS · response gate PASS · policy PROCEED |
| **EXPANDED PLANNER BUDGET** | GLM max **10**; Codex max **10**, **1 used / 9 remaining**; retry 0; planner fallback 0; gateway fallback 0; Qwen 0 |
| **LITELLM RUNTIME STATUS** | architecture primary remote gateway; permanent service/deployment **not yet implemented**; Phase A remains repo/read-only integration preparation |
| **N8N STATUS** | existing WF40/WF60/OpenClaw routing preserved; no live mutation in D-0025 Phase A; GPT Web remains authoritative workflow author |
| **WORK-PC REMOTE ACCESS SAFETY** | `TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT` — do not change/restart/disable network adapters, NIC power management, IP/DHCP/DNS, routes, proxy, Windows Firewall, VPN/Tailscale/TeamViewer networking or TeamViewer service/config; no reboot/logoff/network-stack reset; any such action is STOP/gate |
| **PARALLEL ZAI SUPPORT** | issue **#8** · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **PM-34 / n8n_ready** | BLOCKED / `false` pending controlled D-0025 integration stages |

## Boundaries operative correnti

- The operator architecture gate is satisfied: LiteLLM is now the primary gateway **by architecture decision** for the GLM+Codex remote planner path.
- Architecture promotion does not itself deploy a permanent LiteLLM service or modify live n8n routing.
- D-0025 Phase A is AUTO-VIA eligible and repo/read-only only: foundation/config synchronization plus current integration mapping.
- OpenClaw remains intact as fallback/existing path; no removal or destructive mutation.
- Qwen remains deferred and nonblocking.
- Expanded planner budget remains available only for technically useful bounded validation: GLM max 10; Codex 9/10 remaining; retries/fallbacks remain zero unless separately changed.
- TeamViewer continuity on WORK-PC remains a hard operational constraint. No network/NIC/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutations.
- n8n live mutation requires a later controlled pass with exact live preconditions and a GPT-Web-authored workflow artifact/patch.
- No credential/OAuth/billing mutation, public exposure, PM-34/L5/endurance/permanent schedule expansion.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Architecture decision record: `reports/architecture/litellm_primary_remote_gateway_decision.md`
- Operator decision persistence: issue #31 comment `5451312636`
- Completed qualification: issue **#30** (`D-0024-W`) — CLOSED/COMPLETED
- Comparison contract: `docs/contracts/llm-gateway-comparison-spike-v1.md`
- Historical spike config: `configs/litellm/control-plane-spike.template.yaml`
- Existing n8n parent wiring artifact: `workflows/patches/d0015-w-wf40-wf60-parent-wiring.gpt-web.json`
- Foundation to synchronize: `docs/foundation/PROJECT_VISION.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
