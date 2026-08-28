# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Phase A PASS accepted; Phase B live read-only preflight required before GPT-Web can materialize an import-ready n8n delta; issue **#30** COMPLETE/CLOSED; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PHASE_A_ACCEPTED / FOUNDATION_V3_2 / PRIMARY_REMOTE_CONFIG_PASS / N8N_REPO_MAP_PASS / LIVE_PRECONDITION_REVERIFY_REQUIRED` |
| **GATE CORRENTE** | `D0025_W_PHASE_B_LIVE_READONLY_PREFLIGHT` — read-only reverify WF40/WF60 and VPS/n8n execution surface; no workflow/runtime/network mutation |
| **NEXT** | Cursor performs live read-only n8n/VPS preflight: verify WF40/WF60 current id/name/version/active/topology, n8n container/host topology, safe private LiteLLM reachability class, and whether canonical control-plane gate tools can execute on the n8n/VPS surface without new mounts/installs. Persist evidence only. GPT Web then authors the exact import-ready n8n artifact. |
| **ARCHITECTURE DECISION** | **LiteLLM PRIMARY REMOTE GATEWAY** for GLM + Codex · operator approved 2026-08-28 · `reports/architecture/litellm_primary_remote_gateway_decision.md` |
| **PHASE A RESULT** | **PASS / ACCEPTED** · foundation v3.2 synced · primary config artifact PASS · integration map `REPO_GROUNDED_REVERIFY_REQUIRED` |
| **PRIMARY REMOTE CONFIG** | `configs/litellm/control-plane-primary-remote.template.yaml` — NOT ACTIVE · structural validation PASS |
| **N8N INTEGRATION MAP** | `reports/architecture/d0025_phase_a_integration_map.md` · repo-grounded · current WF40 export has no planner-selection evaluator and no LiteLLM node; live reverify required |
| **PRIMARY REMOTE PATH** | planner selection → LiteLLM → GLM 5.3 / Codex OAuth → `emit_execution_packet` → canonical gates → Cursor |
| **OPENCLAW STATUS** | preserved intact as existing/fallback path; WF60 resolver lane remains preserved; D-0016-W separate/parallel |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **EXPANDED PLANNER BUDGET** | GLM max **10** (**0 used** in new budget); Codex max **10**, **1 used / 9 remaining**; retry 0; planner fallback 0; gateway fallback 0 |
| **LITELLM RUNTIME STATUS** | architecture primary remote gateway; permanent deployment **not implemented**; current verified runtime was temporary WORK-PC loopback only |
| **N8N STATUS** | repo evidence: WF40 `9ZMj2ACTKyDVhCue`, WF60 `d0015600-4001-8001-0001-0653506aabcd`; live current version/topology not yet reverified for Phase B |
| **PHASE B AUTHORING BLOCKER** | Import-ready workflow cannot safely hardcode transport yet: LiteLLM runtime placement/private URL and canonical gate-tool execution surface must be grounded live first; no planner-selection ingress exists in current WF40 export |
| **WORK-PC REMOTE ACCESS SAFETY** | `TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT` — no NIC/DHCP/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutations |
| **PARALLEL ZAI SUPPORT** | issue **#8** · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **PM-34 / n8n_ready** | BLOCKED / `false` pending controlled D-0025 Phase B+ stages |

## Boundaries operative correnti

- D-0025 Phase A is accepted from Cursor evidence at remote main `76abd19653270d286eb168430754384a27df0ea0`.
- Phase A found a real integration gap: WF40 currently has no Architecture-v3 `planner-selection-v1` ingress and no LiteLLM dispatch/gate lane; therefore do not fake a simple gateway-node swap.
- Before GPT Web authors an import-ready n8n workflow artifact, Phase B must ground the live workflow version and the actual private execution/transport surface on the VPS/n8n host.
- Read-only inspection is authorized; no workflow save/import/activate/execute, package install, LiteLLM start, credential mutation, provider call, mount/network change, or TeamViewer-impacting action.
- OpenClaw/WF60 stays intact. Qwen remains deferred.
- Expanded GLM/Codex budget remains available but this preflight consumes **0 inference**.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Phase A integration map: `reports/architecture/d0025_phase_a_integration_map.md`
- Architecture decision: `reports/architecture/litellm_primary_remote_gateway_decision.md`
- Foundation: `docs/foundation/PROJECT_VISION.md` (v3.2)
- Primary-remote config: `configs/litellm/control-plane-primary-remote.template.yaml`
- WF40 export evidence: `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`
- WF60 template: `workflows/60-openclaw-broker-fallback-resolver.template.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
