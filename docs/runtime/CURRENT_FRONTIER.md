# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — LiteLLM auth design preflight PASS accepted; credentialless private proxy selected; next AUTO-VIA: GPT-Web WF61 credential-free artifact patch + read-only provider credential/config presence preflight; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `SCHEMA_ENGINE_LIVE_READY / AUTH_DESIGN_ACCEPTED / CREDENTIALLESS_PROXY_SELECTED / PROVIDER_AUTH_PREFLIGHT_NEXT` |
| **GATE CORRENTE** | `D0025_W_PROVIDER_AUTH_PRESENCE_READONLY_PREFLIGHT` — no human gate yet; inspect only whether existing ZAI/ChatGPT auth material is already available to LiteLLM host without reading secret values |
| **NEXT** | In the next control-plane session: GPT Web authors exact repo-only WF61 patch removing unnecessary `httpHeaderAuth`; Cursor/runner performs read-only provider-auth/config presence preflight on VPS. If existing material is sufficient, continue AUTO-VIA. Human gate only if secret/OAuth creation, transfer, login, rotation or mutation is actually required. |
| **LITELLM PROXY AUTH** | **UNNECESSARY / ACCEPTED** · no `LITELLM_MASTER_KEY` · credentialless proxy · private Docker-only `root_default` · trusted members only `root-n8n-1`, `litellm-primary` · host ports **0** |
| **PROVIDER AUTH** | **REQUIRED FOR MODEL USE** but separate from proxy auth · required forms: `ZAI_CODING_API_KEY` + ChatGPT OAuth local store on LiteLLM host · current presence/readiness not yet grounded |
| **WF61 AUTH PATCH** | **GPT-WEB AUTHORING REQUIRED** · remove `authentication=genericCredentialType`, `genericAuthType=httpHeaderAuth`, and the `credentials.httpHeaderAuth` placeholder from node `HTTP Request - LiteLLM primary one-shot`; preserve Content-Type header, one-shot POST, retry 0 and all existing fail-closed semantics |
| **SCHEMA ENGINE LIVE** | **READY** · Ajv **8.20.0** · ajv-formats **3.0.1** · resolver `CONTROL_PLANE_AJV_NODE_MODULES` |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED RO** on n8n surface |
| **LITELLM LIVE** | `litellm-primary` · credentialless · `root_default` · host ports **0** |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation PASS · not imported · current committed version still contains unnecessary Header Auth placeholder pending exact GPT-Web patch |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **STANDING AUTO-VIA** | issue #31 comment `5452941338` · do not ask operator to authorize merely because a Cursor prompt is needed; stop only at a real human gate |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- D-0025 LiteLLM auth-design preflight is accepted from Cursor evidence at remote main `720b6549b04a32b281cc1e3e78582ba132253dfc`.
- GPT-Web review is persisted on issue #31 comment `5453122305`.
- n8n→LiteLLM Header Auth is not required for the current topology. Do not create an n8n proxy credential and do not introduce a LiteLLM master key unless a later explicit architecture/security decision changes this boundary.
- Provider credentials are distinct from proxy authentication. The next pass is read-only presence/readiness inspection only: env/auth-store names, file existence/metadata, config wiring capability; never secret/token contents.
- If existing provider auth material is absent or unusable and creation/transfer/login/rotation would be required, that is a REAL human credential/OAuth gate and must STOP with an exact operator handoff.
- Before WF61 import, GPT Web must remove the obsolete Header Auth placeholder from the repo artifact. Cursor may apply only the exact GPT-Web-authored delta and validate it; it must not redesign the workflow.
- No provider/model call or inference is required by the next preparatory pass. GLM/Codex expanded budget remains untouched.
- OpenClaw/WF40/WF60 unchanged. WF61 remains unimported. Qwen deferred. TeamViewer continuity preserved.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- GPT-Web auth-design acceptance: issue #31 comment `5453122305`
- Standing AUTO-VIA: issue #31 comment `5452941338`
- Auth design preflight: `reports/architecture/d0025_litellm_auth_design_readonly_preflight.md`
- Schema engine: `reports/architecture/d0025_vps_schema_engine.md`
- WF61 artifact: `workflows/61-litellm-primary-remote-planner.template.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
