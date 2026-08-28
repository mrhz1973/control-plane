# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — LiteLLM provider config wiring LIVE; next WF61 import / structural verify; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `SCHEMA_ENGINE_LIVE_READY / PROVIDER_CONFIG_WIRED / WF61_ARTIFACT_CREDENTIALLESS / WF61_IMPORT_NEXT` |
| **GATE CORRENTE** | `D-0025-W_WF61_IMPORT` or structural `/v1/models` verify from n8n (no inference) |
| **NEXT** | Import inactive WF61 after optional models-list structural verify; then WF40 parent wiring (later). No provider inference until separately authorized. |
| **LITELLM LIVE** | `litellm-primary` `edbb03981626…` · config mounted · provider env wired · models `planner-glm-pilot`, `planner-codex-pilot` loaded · readiness **200 healthy** |
| **LITELLM PROXY AUTH** | **credentialless** · no `LITELLM_MASTER_KEY` · `root_default` · host ports **0** |
| **PROVIDER AUTH** | **WIRED** · Z.AI via env-file · ChatGPT OAuth `/secrets/chatgpt-auth/auth.json` · values not exposed in control-plane evidence |
| **WF61 ARTIFACT** | credentialless (repo) · structural PASS · **not imported** |
| **SCHEMA ENGINE LIVE** | **READY** |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED RO** on n8n |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Live wiring (applied 2026-08-28)

| Component | State |
|---|---|
| Config | `control-plane-primary-remote.template.yaml` → `/etc/litellm/config.yaml:ro` |
| Z.AI | `--env-file …/secrets/litellm-primary.env` |
| ChatGPT OAuth | `CHATGPT_TOKEN_DIR=/secrets/chatgpt-auth` · mount `…/chatgpt-auth:/secrets/chatgpt-auth:ro` |
| Cmd | `--config /etc/litellm/config.yaml --port 4000` |

Apply report: `reports/architecture/d0025_litellm_provider_config_wiring_apply.md`

## Boundaries

- Provider wiring is live; **no inference** performed in apply gate.
- WF61 import and WF40 wiring remain separate gates.
- OpenClaw/WF40/WF60 unchanged. Qwen deferred.

## Puntatori

- Active integration: issue **#31** — OPEN
- Wiring apply: `reports/architecture/d0025_litellm_provider_config_wiring_apply.md`
- WF61 artifact: `workflows/61-litellm-primary-remote-planner.template.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
