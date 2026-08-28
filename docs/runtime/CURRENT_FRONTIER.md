# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Phase A COMPLETE (repo-only); GPT Web to author minimal n8n Phase B delta; issue **#30** COMPLETE/CLOSED; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PHASE_A_PASS / FOUNDATION_V3_2_SYNCED / PRIMARY_REMOTE_CONFIG_ARTIFACT / N8N_MAP_REPO_GROUNDED / PHASE_B_GPT_WEB_AUTHORING_PENDING` |
| **GATE CORRENTE** | `D0025_W_PHASE_B_GPT_WEB_N8N_DELTA` — GPT Web authors exact minimal n8n workflow artifact/patch; live apply remains separate controlled pass |
| **NEXT** | GPT Web review Phase A evidence and author Phase B n8n delta. Phase B apply requires live WF40/WF60 re-verify + separate runtime gates. No inference unless explicitly authorized. |
| **ARCHITECTURE DECISION** | **LiteLLM PRIMARY REMOTE GATEWAY** for GLM + Codex · operator approved 2026-08-28 · `reports/architecture/litellm_primary_remote_gateway_decision.md` |
| **PRIMARY REMOTE CONFIG** | `configs/litellm/control-plane-primary-remote.template.yaml` — NOT ACTIVE · offline structural validation PASS |
| **N8N INTEGRATION MAP** | `reports/architecture/d0025_phase_a_integration_map.md` · **REPO_GROUNDED_REVERIFY_REQUIRED** · WF40/WF60 unchanged |
| **PRIMARY REMOTE PATH** | planner selection → LiteLLM → GLM 5.3 / Codex OAuth → `emit_execution_packet` → canonical gates → Cursor |
| **OPENCLAW STATUS** | preserved intact as existing/fallback path; WF60 resolver lane present in WF40 export; D-0016-W separate/parallel |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **D-0024 RESULT** | **COMPLETE / PASS** · issue #30 CLOSED/COMPLETED |
| **EXPANDED PLANNER BUDGET** | GLM max **10** (**0 used** in new budget); Codex max **10**, **1 used / 9 remaining**; retry 0; planner fallback 0; gateway fallback 0 |
| **LITELLM RUNTIME STATUS** | architecture primary remote gateway; permanent service/deployment **not implemented**; n8n routing **not yet switched** |
| **N8N STATUS** | WF40 `9ZMj2ACTKyDVhCue` + WF60 `d0015600-4001-8001-0001-0653506aabcd` preserved; no LiteLLM node in repo export; live re-verify required before Phase B apply |
| **WORK-PC REMOTE ACCESS SAFETY** | `TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT` — no NIC/DHCP/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutations |
| **PARALLEL ZAI SUPPORT** | issue **#8** · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **PM-34 / n8n_ready** | BLOCKED / `false` pending controlled D-0025 Phase B+ stages |

## Boundaries operative correnti

- Phase A complete: foundation v3.2, primary-remote config artifact, n8n integration map — all repo-only, zero runtime mutation.
- GPT Web is authoritative author for Phase B n8n workflow delta; Cursor must not invent topology.
- OpenClaw + WF60 remain preserved; LiteLLM integration must be additive/reversible where possible.
- Qwen remains deferred; not in primary-remote config.
- TeamViewer continuity on WORK-PC remains hard constraint.
- No credential/OAuth/billing mutation, public exposure, LiteLLM service start, or inference in Phase A.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Phase A integration map: `reports/architecture/d0025_phase_a_integration_map.md`
- Architecture decision: `reports/architecture/litellm_primary_remote_gateway_decision.md`
- Foundation: `docs/foundation/PROJECT_VISION.md` (v3.2)
- Primary-remote config: `configs/litellm/control-plane-primary-remote.template.yaml`
- Historical spike config: `configs/litellm/control-plane-spike.template.yaml`
- WF40 export evidence: `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
