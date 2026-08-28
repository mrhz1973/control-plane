# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF61 credential-free repo patch applied; provider-auth read-only preflight STOP (human gate); issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `SCHEMA_ENGINE_LIVE_READY / CREDENTIALLESS_PROXY_LIVE / WF61_ARTIFACT_CREDENTIALLESS / PROVIDER_AUTH_HUMAN_GATE` |
| **GATE CORRENTE** | **REAL HUMAN GATE** — provider auth material absent on VPS LiteLLM host; no secret/OAuth mutation authorized in AUTO-VIA |
| **NEXT** | Operator supplies `ZAI_CODING_API_KEY` to LiteLLM host (create/transfer + env wiring, names only in evidence) and ChatGPT OAuth store via `CHATGPT_TOKEN_DIR`/`CHATGPT_AUTH_FILE` (transfer from WORK-PC spike path or device OAuth). Then separate bounded gate: LiteLLM config mount/apply of `control-plane-primary-remote.template.yaml`. WF61 import remains after provider readiness. |
| **LITELLM PROXY AUTH** | **UNNECESSARY / ACCEPTED / LIVE** · no `LITELLM_MASTER_KEY` · credentialless · private Docker-only `root_default` · host ports **0** |
| **PROVIDER AUTH** | **REQUIRED · ABSENT ON VPS** · `ZAI_CODING_API_KEY` env name **absent** · `CHATGPT_TOKEN_DIR`/`CHATGPT_AUTH_FILE` **absent** · no `auth.json`/`chatgpt-auth` on VPS · template present on checkout but **not wireable** without human gates |
| **WF61 ARTIFACT** | **credentialless (repo patched)** · structural validation **PASS** · **not imported** · `active=false` in artifact |
| **SCHEMA ENGINE LIVE** | **READY** · Ajv **8.20.0** · ajv-formats **3.0.1** |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED RO** on n8n surface |
| **LITELLM LIVE** | `litellm-primary` · credentialless · no config mount · `root_default` · host ports **0** |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **STANDING AUTO-VIA** | issue #31 comment `5452941338` · stops at real human credential/OAuth gate (now reached) |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- WF61 repo artifact is credential-free per GPT-Web issue #31 comment `5453176557`. Do not re-add Header Auth or `LITELLM_MASTER_KEY` for current private topology.
- Provider auth preflight (read-only) determined existing VPS material is **insufficient**. STOP until operator completes human gates; do not read/print secret values in control-plane passes.
- LiteLLM config apply, container recreate/restart, WF61 import, and parent WF40 wiring remain **separate later gates** after provider material exists.
- No provider/model call or inference. GLM/Codex expanded budget untouched this pass.
- OpenClaw/WF40/WF60 unchanged. WF61 unimported. Qwen deferred. TeamViewer continuity preserved.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- GPT-Web WF61 patch authoring: issue #31 comment `5453176557`
- Provider preflight report: `reports/architecture/d0025_wf61_credentialless_patch_and_provider_auth_readonly_preflight.md`
- Auth design preflight: `reports/architecture/d0025_litellm_auth_design_readonly_preflight.md`
- WF61 artifact: `workflows/61-litellm-primary-remote-planner.template.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
