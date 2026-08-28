# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — Phase B live read-only preflight PASS; GPT Web import-ready WF61 artifact + primary-cycle runner contract authored; Cursor runner implementation/offline validation next; issue **#30** COMPLETE/CLOSED; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PHASE_B_PREFLIGHT_PASS / WF61_GPT_WEB_AUTHORED / RUNNER_CONTRACT_AUTHORED / RUNNER_IMPLEMENTATION_PENDING / LIVE_APPLY_NOT_STARTED` |
| **GATE CORRENTE** | `D0025_W_PRIMARY_CYCLE_RUNNER_IMPLEMENTATION` — AUTO-VIA repo-only implementation + offline regression of the GPT-Web-authored runner contract/WF61; no n8n/VPS/LiteLLM runtime mutation |
| **NEXT** | Cursor implements `tools/run-litellm-primary-cycle.mjs` against the canonical contract, adds zero-network tests, validates `workflows/61-litellm-primary-remote-planner.template.json` structurally against n8n 2.19.5-compatible node shape, and persists evidence. After PASS, first real runtime gate is LiteLLM sibling-container deployment on `root_default`; tool mount/schema/credential/workflow-import remain separate gates. |
| **PHASE B PREFLIGHT** | **PASS** · WF40/WF60 LIVE MATCH · report `reports/architecture/d0025_phase_b_live_readonly_preflight.md` |
| **WF61 ARTIFACT** | `workflows/61-litellm-primary-remote-planner.template.json` · GPT-Web authored · inactive · no live import yet · one LiteLLM POST max · never dispatches Cursor |
| **PRIMARY CYCLE CONTRACT** | `docs/contracts/litellm-primary-cycle-runner-v1.md` · prepare/finalize wrapper around canonical selector/request/response/schema/policy tools · runner itself network-free |
| **PRIMARY GATEWAY PROFILE** | `configs/litellm/control-plane-primary-remote.gateway-profile.json` · explicit aliases; runner blocks Qwen before request build |
| **WF40 LIVE** | **MATCH** · `9ZMj2ACTKyDVhCue` · active · versionId `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` · 35 nodes · WF60 lane present once |
| **WF60 LIVE** | **MATCH** · `d0015600-4001-8001-0001-0653506aabcd` · inactive · health/resolver only |
| **PLANNER INGRESS** | GAP remains upstream of WF61 — WF61 requires canonical `consumer_input` + `routing_input`; PM21 classifier is not reused/promoted |
| **N8N SURFACE** | Docker `root-n8n-1` · n8n **2.19.5** · network `root_default` · loopback `127.0.0.1:5678` |
| **CONTROL-PLANE TOOLS** | **NOT_AVAILABLE LIVE** on n8n container; later read-only mount/container gate required |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface; later isolated Ajv/ajv-formats gate required |
| **LITELLM PLACEMENT** | preferred **B** — sibling Docker container service `litellm-primary` on `root_default` · private URL `http://litellm-primary:4000/v1/responses` · not deployed |
| **ARCHITECTURE DECISION** | LiteLLM PRIMARY REMOTE GATEWAY · OpenClaw preserved · Qwen deferred |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 · planner fallback 0 · gateway fallback 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |
| **PM-34 / n8n_ready** | BLOCKED / `false` |

## Boundaries operative correnti

- GPT Web authoring gate is complete: WF61 + runner contract + canonical gateway profile are persisted.
- Current pass is repo-only implementation/validation; provider calls and runtime mutations remain zero.
- WF61 is deliberately a reusable consumer subflow: it does not invent planner preference or reinterpret PM21; upstream canonical ingress remains a later authoring/wiring stage.
- WF61 delegates deterministic semantics to the canonical repo tools through `run-litellm-primary-cycle.mjs`; no semantic duplication in n8n Code nodes.
- Runtime prerequisites remain separate gates: LiteLLM sibling container, control-plane read-only mount, schema engine, Header Auth credential binding, WF61 import, later parent wiring/activation.
- OpenClaw/WF60 remain intact. Qwen remains deferred.
- TeamViewer continuity on WORK-PC remains hard constraint.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Runner contract: `docs/contracts/litellm-primary-cycle-runner-v1.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Primary gateway profile: `configs/litellm/control-plane-primary-remote.gateway-profile.json`
- Phase B preflight: `reports/architecture/d0025_phase_b_live_readonly_preflight.md`
- Primary LiteLLM config: `configs/litellm/control-plane-primary-remote.template.yaml`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
