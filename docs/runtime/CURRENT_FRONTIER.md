# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Phase B live read-only preflight PASS; GPT Web to author import-ready n8n delta with grounded live preconditions; issue **#30** COMPLETE/CLOSED; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PHASE_B_LIVE_READONLY_PREFLIGHT_PASS / WF40_WF60_LIVE_MATCH / PLANNER_INGRESS_GAP_CONFIRMED / GPT_WEB_N8N_ARTIFACT_AUTHORING` |
| **GATE CORRENTE** | `D0025_W_GPT_WEB_IMPORT_READY_N8N_ARTIFACT` — GPT Web authors import-ready workflow delta using live preflight evidence; apply/deploy remain separate gates |
| **NEXT** | GPT Web authors n8n artifact accounting for: planner-selection ingress gap, LiteLLM sibling-container placement on `root_default`, missing control-plane tools mount on n8n surface, schema-engine gap on VPS. Then controlled apply/deploy gates. |
| **PHASE B PREFLIGHT** | **PASS** · report `reports/architecture/d0025_phase_b_live_readonly_preflight.md` |
| **WF40 LIVE** | **MATCH** · `9ZMj2ACTKyDVhCue` · active · versionId `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` · 35 nodes · WF60 lane present once |
| **WF60 LIVE** | **MATCH** · `d0015600-4001-8001-0001-0653506aabcd` · inactive · health/resolver only |
| **PLANNER INGRESS** | **GAP confirmed live** — no `planner-selection-v1` / no LiteLLM node; PM21 classifier present but not promoted |
| **N8N SURFACE** | Docker `root-n8n-1` · n8n **2.19.5** · network `root_default` · loopback `127.0.0.1:5678` |
| **CONTROL-PLANE TOOLS** | **NOT_AVAILABLE** on n8n container (no `/files/handoff-runtime/control-plane` mount) |
| **SCHEMA ENGINE** | **NOT_AVAILABLE** on VPS n8n surface without later install/mount gate |
| **LITELLM PLACEMENT** | preferred **B** — sibling Docker container on `root_default` · URL class `http://litellm-primary:4000/v1/responses` · not installed |
| **ARCHITECTURE DECISION** | LiteLLM PRIMARY REMOTE GATEWAY · `reports/architecture/litellm_primary_remote_gateway_decision.md` |
| **PRIMARY REMOTE CONFIG** | `configs/litellm/control-plane-primary-remote.template.yaml` — NOT ACTIVE |
| **OPENCLAW STATUS** | preserved · WF60 intact · D-0016-W parallel |
| **QWEN RUNTIME STATUS** | DEFERRED · inference `0` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Live preflight complete with zero workflow/runtime/network mutation on WORK-PC.
- WF40/WF60 live state matches repo export reference — safe baseline for GPT Web authoring.
- Import-ready artifact must add planner-selection ingress (not PM21 reuse) plus LiteLLM private dispatch; preserve WF60 lane.
- Deploy sequence remains gated separately: LiteLLM container, tool mount, credentials, workflow import, activation.
- No inference, credential mutation, or TeamViewer-impacting action at current gate.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Phase B preflight: `reports/architecture/d0025_phase_b_live_readonly_preflight.md`
- Phase A map: `reports/architecture/d0025_phase_a_integration_map.md`
- WF40 live-grounded export reference: `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
