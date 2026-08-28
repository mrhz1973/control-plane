# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — LiteLLM auth design preflight PASS; credentialless private proxy recommended; next: provider config gate + GPT-Web WF61 credential-free patch; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `SCHEMA_ENGINE_LIVE_READY / AUTH_DESIGN_PREFLIGHT_PASS / PROVIDER_CONFIG_GATE_PENDING` |
| **GATE CORRENTE** | `D0025_W_LITELLM_PROVIDER_CONFIG` — separate gate: apply canonical provider config + provider credentials on LiteLLM host (not n8n Header Auth) |
| **NEXT** | Provider config/credential gate on LiteLLM; GPT-Web repo-only WF61 patch to remove unnecessary Header Auth placeholder; then WF61 inactive import. Parent WF40 wiring remains later gate. |
| **LITELLM PROXY AUTH** | **UNNECESSARY** live · no `LITELLM_MASTER_KEY` · private Docker-only · recommendation **CREDENTIALLESS_PRIVATE_PROXY** |
| **PROVIDER AUTH** | **REQUIRED** at future config gate · `ZAI_CODING_API_KEY` + ChatGPT OAuth on LiteLLM host · separate from proxy auth |
| **SCHEMA ENGINE LIVE** | **READY** · Ajv **8.20.0** · ajv-formats **3.0.1** |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED RO** on n8n surface |
| **LITELLM LIVE** | `litellm-primary` · credentialless · `root_default` · host ports **0** |
| **WF61 ARTIFACT** | structural validation **PASS** · **not imported** · contains **unnecessary** Header Auth placeholder for current topology |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- n8n→LiteLLM Header Auth is **not required** for current private credentialless proxy; do not create/bind proxy credentials unless operator later enables LiteLLM master key.
- Provider credentials remain a separate future gate on the LiteLLM container.
- WF61 Header Auth placeholder should be removed by GPT-Web in repo-only artifact patch before import.
- OpenClaw/WF60 unchanged. Qwen deferred. TeamViewer continuity preserved.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Auth design preflight: `reports/architecture/d0025_litellm_auth_design_readonly_preflight.md`
- Schema engine: `reports/architecture/d0025_vps_schema_engine.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
