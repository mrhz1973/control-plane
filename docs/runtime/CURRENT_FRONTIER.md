# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — primary cycle runner PASS accepted by GPT Web; WF61 structurally validated; first runtime prerequisite is private LiteLLM container deployment; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PRIMARY_CYCLE_RUNNER_REVIEWED_PASS / WF61_STRUCTURE_PASS / FIRST_RUNTIME_GATE_PENDING / LIVE_APPLY_NOT_STARTED` |
| **GATE CORRENTE** | `D0025_W_LITELLM_PRIVATE_CONTAINER_DEPLOY_AUTH_REQUIRED` — explicit operator authorization required before creating/starting new LiteLLM runtime state on VPS |
| **NEXT** | After explicit authorization, execute one bounded runtime gate only: deploy private `litellm-primary` sibling on existing `root_default`, pinned LiteLLM 1.98.0, no public port, no provider call/inference, no credential/OAuth mutation, no n8n workflow mutation. Mount/schema/credential/WF61 import remain later separate gates. |
| **PRIMARY CYCLE RUNNER** | **PASS / GPT-WEB REVIEWED** · `tools/run-litellm-primary-cycle.mjs` · `tests/litellm-primary-cycle/run.mjs` **16/16** · zero network/inference |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** against n8n **2.19.5** node shapes · inactive · not imported |
| **PRIMARY CYCLE CONTRACT** | `docs/contracts/litellm-primary-cycle-runner-v1.md` |
| **PRIMARY GATEWAY PROFILE** | `configs/litellm/control-plane-primary-remote.gateway-profile.json` |
| **PHASE B PREFLIGHT** | **PASS** · WF40/WF60 LIVE MATCH |
| **WF40 LIVE** | **MATCH** · `9ZMj2ACTKyDVhCue` · versionId `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` |
| **WF60 LIVE** | **MATCH** · `d0015600-4001-8001-0001-0653506aabcd` |
| **PLANNER INGRESS** | GAP upstream of WF61 — canonical `consumer_input` + `routing_input` producer still required before parent wiring |
| **N8N SURFACE** | Docker `root-n8n-1` · n8n **2.19.5** · `root_default` |
| **CONTROL-PLANE TOOLS** | **NOT_AVAILABLE LIVE** on n8n container (later mount gate) |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface (later isolated install gate) |
| **LITELLM PLACEMENT** | preferred **B** · sibling Docker container `litellm-primary` on existing `root_default` · private URL class `http://litellm-primary:4000/v1/responses` · not deployed |
| **LITELLM PIN** | target **1.98.0**; deploy gate must pin exact release/image and must not use floating `latest`/`main` tags |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Primary cycle runner PASS is accepted by GPT Web; canonical tool semantics are composed, not duplicated.
- WF61 remains GPT-Web-authored and unmodified by Cursor beyond structural validation.
- New VPS runtime creation is a real operator gate. No LiteLLM container may be created/started before explicit authorization.
- First runtime gate is LiteLLM-only: private sibling container on the existing Docker network, no public port, provider call, inference, credential/OAuth mutation, or n8n workflow mutation.
- Subsequent runtime prerequisites remain separate: control-plane read-only mount, schema engine, Header Auth credential, WF61 inactive import, then parent ingress/wiring.
- OpenClaw/WF60 intact. Qwen deferred.
- TeamViewer continuity on WORK-PC remains hard constraint; no WORK-PC NIC/DHCP/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutation.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- GPT-Web runner review: issue #31 comment `5451674301`
- Runner: `tools/run-litellm-primary-cycle.mjs`
- Runner tests: `tests/litellm-primary-cycle/run.mjs`
- Runner contract: `docs/contracts/litellm-primary-cycle-runner-v1.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Phase B preflight: `reports/architecture/d0025_phase_b_live_readonly_preflight.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
