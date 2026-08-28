# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — primary cycle runner implemented + offline validation PASS; WF61 structurally validated; next runtime gates: LiteLLM deploy, tool mount, schema engine VPS, credential, WF61 import; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PRIMARY_CYCLE_RUNNER_PASS / WF61_STRUCTURE_PASS / RUNTIME_DEPLOY_GATES_PENDING / LIVE_APPLY_NOT_STARTED` |
| **GATE CORRENTE** | `D0025_W_RUNTIME_PREREQUISITE_GATES` — LiteLLM sibling container deploy, control-plane read-only mount, VPS schema engine, Header Auth credential, WF61 import remain separate authorized gates |
| **NEXT** | Execute runtime prerequisite gates in bounded order (no batching): deploy private `litellm-primary` on `root_default`, mount control-plane tools, resolve Ajv on n8n surface, bind Header Auth credential, import WF61 inactive. Parent WF40 wiring remains later gate. |
| **PRIMARY CYCLE RUNNER** | **PASS** · `tools/run-litellm-primary-cycle.mjs` · `tests/litellm-primary-cycle/run.mjs` **16/16** · zero network/inference |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** against n8n **2.19.5** node shapes · inactive · not imported |
| **PRIMARY CYCLE CONTRACT** | `docs/contracts/litellm-primary-cycle-runner-v1.md` |
| **PRIMARY GATEWAY PROFILE** | `configs/litellm/control-plane-primary-remote.gateway-profile.json` |
| **PHASE B PREFLIGHT** | **PASS** · WF40/WF60 LIVE MATCH |
| **WF40 LIVE** | **MATCH** · `9ZMj2ACTKyDVhCue` · versionId `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` |
| **WF60 LIVE** | **MATCH** · `d0015600-4001-8001-0001-0653506aabcd` |
| **PLANNER INGRESS** | GAP upstream of WF61 — canonical `consumer_input` + `routing_input` producer still required before parent wiring |
| **N8N SURFACE** | Docker `root-n8n-1` · n8n **2.19.5** · `root_default` |
| **CONTROL-PLANE TOOLS** | **NOT_AVAILABLE LIVE** on n8n container (mount gate pending) |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface (isolated install gate pending) |
| **LITELLM PLACEMENT** | preferred **B** · `http://litellm-primary:4000/v1/responses` · not deployed |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- Primary cycle runner is implemented and offline-validated; canonical tool semantics are composed, not duplicated.
- WF61 remains GPT-Web-authored and unmodified by Cursor beyond structural validation.
- Runtime apply remains blocked until separate gates close: LiteLLM container, tool mount, schema engine, credential, WF61 import.
- OpenClaw/WF60 intact. Qwen deferred. Zero inference in this pass.
- TeamViewer continuity on WORK-PC remains hard constraint.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Runner: `tools/run-litellm-primary-cycle.mjs`
- Runner tests: `tests/litellm-primary-cycle/run.mjs`
- Runner contract: `docs/contracts/litellm-primary-cycle-runner-v1.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Phase B preflight: `reports/architecture/d0025_phase_b_live_readonly_preflight.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
