# D-0025-W Phase A — n8n integration map (read-only evidence)

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W-PHASE-A`  
**Date:** 2026-08-28  
**Status:** REPO-GROUNDED — `LIVE_PRECONDITION_REVERIFY_REQUIRED`  
**Runtime mutations this pass:** 0  
**Inference / provider calls:** 0

## Purpose

Map the current n8n/OpenClaw integration seam so GPT Web can author the minimal Phase B workflow delta to route GLM/Codex through LiteLLM as primary remote gateway while preserving OpenClaw intact as fallback/existing path.

This document contains **facts and evidence only**. It does **not** invent workflow JSON or patch operations.

---

## Live read status

| Check | Result |
|---|---|
| `N8N_API_KEY` in WORK-PC environment | **not set** |
| `N8N_BASE_URL` in WORK-PC environment | **not set** |
| n8n API live export this pass | **not performed** |
| Repo export evidence used | **yes** |

**Classification:** `REPO_GROUNDED_REVERIFY_REQUIRED` — Phase B apply must re-verify live WF40/WF60 id/name/version/active before import.

---

## Architecture target (operator decision 2026-08-28)

```text
planner selection (planner-selection-v1)
  -> LiteLLM primary remote gateway (loopback/private)
       -> planner-glm-pilot / planner-codex-pilot
  -> emit_execution_packet
  -> canonical response / schema / policy gates
  -> Cursor bounded execution

preserved fallback/existing:
  n8n -> OpenClaw broker (WF60 resolver) -> OpenClaw HTTP (explicit/authorized only)
```

Qwen remains **deferred** and is out of scope for the primary-remote config artifact.

---

## WF40 — plan watcher + classifier bridge (parent)

| Field | Repo-grounded value | Evidence |
|---|---|---|
| Live ID | `9ZMj2ACTKyDVhCue` | `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json` |
| Name | `40 - CP v4 multirepo + classifier bridge - ACTIVE` | same |
| Active (at export) | `true` | same |
| Version ID (at export) | `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` | same |
| Node count (at export) | 35 | same |
| Export date | 2026-08-27 | same |

### Ingress / triggers

- `Manual Trigger`
- `Schedule Trigger - controlled polling` (1-minute interval)

Both feed `Data Table - Load all state rows` → multirepo GitHub commit poll loop.

### Planner-selection ingress (current state)

**No live planner-selection evaluator node** and **no LiteLLM HTTP node** exist in the exported WF40 structure.

Planner routing is **not yet wired** in WF40. Downstream consumer/gate tooling exists in-repo (`tools/build-llm-gateway-request.mjs`, response/schema/policy gates) but is **offline** relative to n8n.

### `IF - New commit?` TRUE branch (four parallel lanes)

Source node: `IF - New commit?` (`b4bf4e90-f17e-4edc-b2d0-4bba669d985c` in D-0015 patch preconditions).

| # | Target node | Role |
|---|---|---|
| 1 | `IF - GIS repo for handoff?` | GIS handoff branch |
| 2 | `Data Table - Upsert last seen commit` | state persistence |
| 3 | `Code - Plan watcher repo gate stub` | plan-file detection chain entry |
| 4 | `Execute Workflow - Resolve OpenClaw broker (WF60)` | **OpenClaw broker resolver (D-0015-W)** — terminal for that pass |

FALSE branch: `Duplicate skip - no Telegram` (unchanged).

### Plan watcher → classifier bridge chain

From `Code - Plan watcher repo gate stub`:

```text
GitHub - Fetch commit details (plan files)
  -> Code - Detect real docs/plans plan files
  -> IF - plan_detected?
       TRUE -> Format Gate D Telegram + Code - PM21 classifier decision
               -> Code - PM21 implementer bridge
               -> Code - PM21 format Telegram bridge summary
               -> Telegram - Send PM21 bridge summary
       FALSE -> Code - no_plan_detected output
```

**Evidence note:** PM21 bridge is a **mock-worker / dry-run** path (`would_send_to_worker: true`, `No real worker invoked`). It does **not** call OpenClaw or LiteLLM today.

### WF60 call site (OpenClaw broker resolver)

| Field | Value |
|---|---|
| Node ID | `d0015f40-0060-4001-8001-000000000060` |
| Node name | `Execute Workflow - Resolve OpenClaw broker (WF60)` |
| Type | `n8n-nodes-base.executeWorkflow` |
| Target workflow ID | `d0015600-4001-8001-0001-0653506aabcd` |
| Input contract | passthrough |
| Downstream in WF40 | **none** (terminal lane at export) |

Authoring record: `workflows/patches/d0015-w-wf40-wf60-parent-wiring.gpt-web.json`.

---

## WF60 — OpenClaw broker fallback resolver

| Field | Repo-grounded value | Evidence |
|---|---|---|
| Live ID | `d0015600-4001-8001-0001-0653506aabcd` | D-0015 patch + WF40 export |
| Template | `workflows/60-openclaw-broker-fallback-resolver.template.json` | repo |
| Function | Private Tailscale health probe → select VPS primary or Windows fallback OpenClaw base URL | template |
| Provider/model call | **none** — health-only | template sticky note |
| Fail-closed | `brokerSelected=none` when both unhealthy | template |

Output fields of interest (from D-0015 patch contract):

- `brokerSelected`, `selectedBaseUrl`, `reason`, `primaryStatus`, `fallbackStatus`, `failClosed`, `privateOnly`

---

## Repo adapter boundary (offline, canonical)

| Artifact | Role |
|---|---|
| `docs/contracts/llm-gateway-portability-v1.md` | replaceable gateway adapter contract |
| `tools/build-llm-gateway-request.mjs` | builds `/v1/responses` envelope for LiteLLM explicit aliases |
| `tools/validate-openclaw-planner-response-gate.mjs` | deterministic response + consumer gate |
| `tools/validate-execution-packet-v1.mjs` | execution-packet schema |
| `tools/evaluate-execution-packet-policy.mjs` | PROCEED / GATE / BLOCKED |
| `configs/litellm/control-plane-primary-remote.template.yaml` | canonical primary-remote LiteLLM config (NOT ACTIVE) |

LiteLLM profile test fixture maps planners to aliases (`tests/llm-gateway-portability/fixtures/profile-litellm-test.json`); production n8n profile binding is **Phase B** work.

---

## Minimal integration seam (for GPT Web authoring — not a patch)

### Target workflow candidate

**WF40** (`9ZMj2ACTKyDVhCue`) remains the parent orchestrator. Phase B should treat WF40 as the workflow that receives planner-selection input and dispatches gateway requests.

WF60 remains a **separate preserved workflow**; do not merge broker health logic into LiteLLM primary path.

### LiteLLM primary seam (to be added in Phase B)

Expected insertion point class:

1. **After** deterministic planner-selection is available (`planner-selection-v1` + `openclaw-consumer-input-v1`), and
2. **Before** canonical gate evaluation / Cursor dispatch, and
3. **On the GLM/Codex remote path only** (Qwen deferred).

Concrete node class (authoritative detail = GPT Web):

- HTTP Request (or Execute Workflow subflow) to **private/loopback LiteLLM** `/v1/responses`
- Model alias from profile: `planner-glm-pilot` or `planner-codex-pilot`
- Request body built per `tools/build-llm-gateway-request.mjs` envelope semantics
- Response normalized if SSE (`tools/normalize-litellm-responses-body.mjs`)
- Fail-closed through existing response/schema/policy gate tools or equivalent n8n Code nodes mirroring them

**Not present in repo export today** — exact node names/IDs for LiteLLM dispatch do not exist yet.

### OpenClaw fallback seam (preserve)

| Seam | Preserve |
|---|---|
| WF60 Execute Workflow node on `IF - New commit?` TRUE | **yes** — do not remove in Phase B unless GPT Web explicitly supersedes with equivalent fail-closed fallback |
| WF60 workflow logic | **unchanged** |
| Future OpenClaw authenticated HTTP | downstream of WF60 resolver; fail-closed on `brokerSelected=none` / `failClosed=true` |
| D-0016-W Windows fallback pilot | **separate parallel track** — not cancelled by LiteLLM primary promotion |

D-0015 future extension rule (credential **class** only):

- OpenClaw Header Auth credential ID `Qy4tQ7a7ld5loSdV` — **name/ID metadata only**; value must not be read/exported.

### Graceful fallback principle

```text
LiteLLM unavailable -> OpenClaw/manual/gated path per policy
never silent non-equivalent fallback
```

Gateway fallback count remains **0** unless a later operator gate changes budget policy.

---

## Credential classes (no values)

| Class | Host | Purpose |
|---|---|---|
| `ZAI_CODING_API_KEY` | LiteLLM runtime host env | GLM 5.3 Coding Plan |
| `CHATGPT_TOKEN_DIR` / `CHATGPT_AUTH_FILE` | LiteLLM runtime host env | Codex OAuth token store |
| LiteLLM bearer (if configured) | n8n → LiteLLM HTTP | private gateway auth |
| OpenClaw Header Auth (`Qy4tQ7a7ld5loSdV`) | n8n → OpenClaw HTTP | existing/fallback broker path only |
| GitHub credential (redacted in export) | WF40 GitHub nodes | commit polling — unchanged |
| Telegram credential (redacted in export) | WF40 notify nodes | human gate notifications — unchanged |

---

## Preserved branches (Phase B must not break)

- `IF - New commit?` FALSE → `Duplicate skip - no Telegram`
- GIS handoff branch (`IF - GIS repo for handoff?` …)
- Data Table upsert lane
- Plan watcher + PM21 classifier mock bridge
- WF60 OpenClaw broker resolver parallel lane
- WF42 / WF41 — unchanged per D-0015 preserve list

---

## Phase B preconditions to re-verify LIVE

1. WF40 live id `9ZMj2ACTKyDVhCue` + name + active + versionId match export or GPT Web records delta base.
2. WF60 live id `d0015600-4001-8001-0001-0653506aabcd` exists and matches template contract.
3. WF60 Execute Workflow node present exactly once on `IF - New commit?` TRUE.
4. LiteLLM primary-remote config deployed on private/loopback host (separate runtime gate).
5. Credential gates for ZAI + Codex OAuth on LiteLLM host (no secret read in apply pass).
6. Expanded planner budget: GLM 0/10 used in new budget; Codex 1/10 used, 9 remaining; retry 0; planner fallback 0; gateway fallback 0.

---

## Rollback principle

- Phase B delta must be **additive/reversible** where technically possible.
- Preserve WF60 + OpenClaw paths until LiteLLM primary path is independently validated live.
- Fail closed rather than silently route to an unverified backend.
- Deactivate or revert GPT-Web-authored import restores prior WF40 export snapshot class (`workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json` as reference — not auto-imported).

---

## Evidence pointers

- Architecture decision: `reports/architecture/litellm_primary_remote_gateway_decision.md`
- D-0024 qualification: issue #30 CLOSED/COMPLETED
- D-0015 WF40↔WF60 wiring patch: `workflows/patches/d0015-w-wf40-wf60-parent-wiring.gpt-web.json`
- WF40 post-apply export: `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`
- WF60 template: `workflows/60-openclaw-broker-fallback-resolver.template.json`
- Primary-remote config: `configs/litellm/control-plane-primary-remote.template.yaml`
