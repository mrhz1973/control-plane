# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — private LiteLLM container deploy PASS; next runtime gates: control-plane mount, VPS schema engine, Header Auth credential, WF61 import; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `LITELLM_PRIVATE_CONTAINER_DEPLOY_PASS / PRIVATE_PROXY_READY_CREDENTIALLESS / RUNTIME_PREREQUISITE_GATES_PARTIAL` |
| **GATE CORRENTE** | `D0025_W_RUNTIME_PREREQUISITE_GATES` — control-plane read-only mount, VPS schema engine, Header Auth credential, WF61 inactive import remain separate authorized gates |
| **NEXT** | Execute next bounded runtime gate in order: mount control-plane tools read-only into `root-n8n-1`, resolve isolated Ajv on n8n surface, bind Header Auth credential, import WF61 inactive. Parent WF40 wiring remains later gate. |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · **running** · `root_default` · private DNS **172.18.0.3** · host published ports **0** |
| **LITELLM PIN** | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` · package **1.98.0** · amd64 verified |
| **LITELLM CLASSIFICATION** | **PRIVATE_PROXY_READY_CREDENTIALLESS** — Uvicorn on internal `:4000`; no credential/config binding yet |
| **PRIMARY CYCLE RUNNER** | **PASS / GPT-WEB REVIEWED** · `tools/run-litellm-primary-cycle.mjs` · `tests/litellm-primary-cycle/run.mjs` **16/16** |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · inactive · not imported |
| **PRIMARY CYCLE CONTRACT** | `docs/contracts/litellm-primary-cycle-runner-v1.md` |
| **PRIMARY GATEWAY PROFILE** | `configs/litellm/control-plane-primary-remote.gateway-profile.json` |
| **PHASE B PREFLIGHT** | **PASS** · WF40/WF60 LIVE MATCH |
| **WF40 LIVE** | **MATCH** · `9ZMj2ACTKyDVhCue` · versionId `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` |
| **WF60 LIVE** | **MATCH** · `d0015600-4001-8001-0001-0653506aabcd` |
| **PLANNER INGRESS** | GAP upstream of WF61 — canonical `consumer_input` + `routing_input` producer still required before parent wiring |
| **N8N SURFACE** | Docker `root-n8n-1` · n8n **2.19.5** · `root_default` · unrestarted |
| **CONTROL-PLANE TOOLS** | **NOT_AVAILABLE LIVE** on n8n container (mount gate pending) |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface (isolated install gate pending) |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- `litellm-primary` is deployed privately on existing `root_default`; no host public ports; no credential/OAuth binding yet.
- Provider/model calls and inference remain forbidden until separately authorized credential/config gates close.
- Canonical control-plane tools are not yet mounted on the n8n surface.
- WF61 remains unimported; WF40/WF60/OpenClaw live unchanged.
- Qwen deferred. TeamViewer continuity on WORK-PC remains hard constraint.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Deploy evidence: `reports/architecture/d0025_litellm_private_container_deploy.md`
- Deploy authorization: issue #31 comment `5451709148`
- Runner: `tools/run-litellm-primary-cycle.mjs`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Phase B preflight: `reports/architecture/d0025_phase_b_live_readonly_preflight.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
