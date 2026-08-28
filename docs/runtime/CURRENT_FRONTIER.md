# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — primary cycle runner PASS accepted; private LiteLLM container deploy explicitly AUTHORIZED; next executor Cursor; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PRIMARY_CYCLE_RUNNER_REVIEWED_PASS / WF61_STRUCTURE_PASS / LITELLM_PRIVATE_CONTAINER_DEPLOY_AUTHORIZED / LIVE_APPLY_BOUNDED` |
| **GATE CORRENTE** | `D0025_W_LITELLM_PRIVATE_CONTAINER_DEPLOY_AUTHORIZED` — execute exactly one bounded VPS runtime gate: create/start private sibling `litellm-primary` on existing `root_default`; no provider/model call and no credential mutation |
| **NEXT** | Cursor deploys `litellm-primary` using official x86_64 LiteLLM **1.98.0** image pinned by immutable digest `sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4`, verifies no host port publication and private Docker membership only. Mount/schema/credential/WF61 import stay later separate gates. |
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
| **LITELLM PLACEMENT** | preferred **B** · sibling Docker container `litellm-primary` on existing `root_default` · private URL class `http://litellm-primary:4000/v1/responses` · deploy AUTHORIZED |
| **LITELLM PIN** | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` for VPS x86_64; Cursor must verify pulled digest/arch and STOP on mismatch |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Operator authorization for this runtime gate is persisted in issue #31 comment `5451709148`.
- Authorized mutation: create/start only `litellm-primary` and attach it at creation to the already-existing private Docker network `root_default`.
- No host public port mapping; no `--network host`; no Docker network creation; no firewall/Tailscale/WORK-PC network mutation.
- Image pull/verification traffic to GHCR is allowed. Provider/model endpoint calls are forbidden in this pass.
- No secret, dummy credential, credential/OAuth mutation, inference, n8n workflow mutation, OpenClaw mutation, mount/schema work, or WF61 import.
- If the LiteLLM proxy cannot become credential-free ready without crossing the credential gate, STOP with exact evidence rather than inventing credentials or broadening scope.
- Subsequent prerequisites remain separate: control-plane read-only mount, schema engine, Header Auth credential, WF61 inactive import, then parent ingress/wiring.
- OpenClaw/WF60 intact. Qwen deferred.
- TeamViewer continuity on WORK-PC remains hard constraint; no WORK-PC NIC/DHCP/DNS/routes/proxy/firewall/VPN/Tailscale/TeamViewer/reboot/logoff/network-stack mutation.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Deploy authorization: issue #31 comment `5451709148`
- GPT-Web runner review: issue #31 comment `5451674301`
- Runner: `tools/run-litellm-primary-cycle.mjs`
- Runner tests: `tests/litellm-primary-cycle/run.mjs`
- Runner contract: `docs/contracts/litellm-primary-cycle-runner-v1.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Phase B preflight: `reports/architecture/d0025_phase_b_live_readonly_preflight.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
