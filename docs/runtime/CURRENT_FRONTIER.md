# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — provider material staged on VPS; wiring candidate ready; next runtime apply gate; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `SCHEMA_ENGINE_LIVE_READY / CREDENTIALLESS_PROXY_LIVE / WF61_ARTIFACT_CREDENTIALLESS / PROVIDER_MATERIAL_STAGED / WIRING_CANDIDATE_READY` |
| **GATE CORRENTE** | `D-0025-W_LITELLM_PROVIDER_CONFIG_WIRING_APPLY` — execute bounded `litellm-primary` recreate with staged provider material + config mount (operator-authorized runtime mutation) |
| **NEXT** | Apply candidate recreate (see wiring report), then read-only structural verify. WF61 import remains after provider wiring verify. No inference in wiring apply gate unless separately authorized. |
| **PROVIDER MATERIAL (STAGED)** | Z.AI env `/root/local-files/handoff-runtime/secrets/litellm-primary.env` (600, 69 B, key `ZAI_CODING_API_KEY`) · ChatGPT auth `/root/local-files/handoff-runtime/secrets/chatgpt-auth/auth.json` (600, 3721 B) · values **not** read in control-plane pass |
| **LITELLM PROXY AUTH** | **UNNECESSARY / ACCEPTED / LIVE** · no `LITELLM_MASTER_KEY` · credentialless · `root_default` · host ports **0** |
| **LITELLM LIVE (current)** | `litellm-primary` · credentialless · **no** provider wiring yet · mounts **0** · `cmd=["--port","4000"]` |
| **WF61 ARTIFACT** | credentialless (repo) · structural PASS · **not imported** |
| **SCHEMA ENGINE LIVE** | **READY** · Ajv **8.20.0** · ajv-formats **3.0.1** |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED RO** on n8n surface |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Wiring candidate summary (not applied)

| Component | Wiring |
|---|---|
| Z.AI | `--env-file /root/local-files/handoff-runtime/secrets/litellm-primary.env` |
| ChatGPT OAuth | `-e CHATGPT_TOKEN_DIR=/secrets/chatgpt-auth` · `-e CHATGPT_AUTH_FILE=auth.json` · mount `…/secrets/chatgpt-auth:/secrets/chatgpt-auth:ro` |
| Config | mount `…/control-plane-primary-remote.template.yaml:/etc/litellm/config.yaml:ro` · `--config /etc/litellm/config.yaml` |
| Rollback | restore original credentialless `docker run` (no env-file, no mounts, `--port 4000` only) |

Full commands: `reports/architecture/d0025_provider_wiring_exact_readonly_preflight.md`

## Boundaries operative correnti

- Provider material is staged; wiring candidate is deterministic. **Do not apply** until explicit wiring-apply gate authorization.
- Proxy stays credentialless — candidate adds **no** `LITELLM_MASTER_KEY`.
- No provider/model HTTP or inference in this preflight pass.
- OpenClaw/WF40/WF60 unchanged. WF61 unimported. Qwen deferred.

## Puntatori

- Active integration: issue **#31** — OPEN
- Wiring preflight: `reports/architecture/d0025_provider_wiring_exact_readonly_preflight.md`
- WF61 artifact: `workflows/61-litellm-primary-remote-planner.template.json`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
