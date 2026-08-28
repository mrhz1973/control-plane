# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF61 imported inactive; next WF40 parent wiring; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / WF61_IMPORTED_INACTIVE / WF40_PARENT_WIRING_NEXT` |
| **GATE CORRENTE** | `D-0025-W_WF40_PARENT_WIRING` — wire parent WF40 to invoke WF61 subflow (no execution/inference until separately authorized) |
| **NEXT** | GPT-Web/Cursor bounded pass for WF40→WF61 parent ingress wiring only; no WF61 activation/execution without separate gate |
| **LITELLM LIVE** | `litellm-primary` · provider wired · models `planner-glm-pilot`, `planner-codex-pilot` · readiness **200 healthy** |
| **LITELLM PROXY AUTH** | **credentialless** · no `LITELLM_MASTER_KEY` · `root_default` · host ports **0** |
| **WF61 LIVE** | **IMPORTED INACTIVE** · id `d0025-6100-4001-8001-000000000061` · credentialless HTTP · **not executed** |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` · **not wired to WF61 yet** |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **VPS CHECKOUT** | `/root/local-files/handoff-runtime/control-plane` @ `1a4fa636f7a7c98e77524dbd1931b78ebf5e879c` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries

- WF61 is imported **inactive**; structural `/v1/models` verify passed with **zero inference**.
- No WF61 execution, no parent WF40 wiring yet, no provider inference.
- LiteLLM wiring unchanged. OpenClaw/WF60 unchanged. Qwen deferred.

## Puntatori

- Active integration: issue **#31** — OPEN
- WF61 import report: `reports/architecture/d0025_wf61_structural_verify_and_inactive_import.md`
- WF61 artifact: `workflows/61-litellm-primary-remote-planner.template.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
