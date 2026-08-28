# D-0025-W Phase B — live read-only preflight

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W-PHASE-B-LIVE-READONLY-PREFLIGHT`  
**Date:** 2026-08-28  
**Status:** PASS — live grounded  
**Runtime mutations:** 0  
**Inference / provider calls:** 0  
**Secret values read/displayed/persisted:** 0  
**TeamViewer / WORK-PC network mutations:** 0

## Method

| Surface | Method | Notes |
|---|---|---|
| VPS SSH | `ssh ionos-n8n` (read-only) | Allowed; no network mutation |
| n8n workflows | `n8n export:workflow --id=...` inside container `root-n8n-1` | Local DB export; no API key required |
| Metadata extraction | Sanitized in-container parse (node names/types/connections only) | No credential values exported |
| n8n HTTP API | **Not used** | `N8N_API_KEY` absent from container env |
| WORK-PC | No n8n/docker/network changes | TeamViewer continuity preserved |

Repo Phase A baseline: `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`

---

## Scope 1 — WF40 live (read-only)

| Field | Live (2026-08-28) | Phase A repo export | Delta |
|---|---|---|---|
| ID | `9ZMj2ACTKyDVhCue` | `9ZMj2ACTKyDVhCue` | none |
| Name | `40 - CP v4 multirepo + classifier bridge - ACTIVE` | same | none |
| Active | `true` | `true` | none |
| versionId | `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` | `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` | none |
| updatedAt | `2026-08-27T07:49:35.000Z` | `2026-08-27T07:49:35.000Z` | none |
| nodeCount | 35 | 35 | none |

### Required nodes (live)

| Check | Live |
|---|---|
| `IF - New commit?` | **present** |
| `IF - plan_detected?` | **present** |
| `Execute Workflow - Resolve OpenClaw broker (WF60)` | **present exactly once** |
| WF60 target | `d0015600-4001-8001-0001-0653506aabcd` |
| WF60 node id | `d0015f40-0060-4001-8001-000000000060` |
| planner-selection node | **absent** (count 0) |
| LiteLLM node | **absent** (count 0) |
| `Code - PM21 classifier decision` | **present** (PM17 deterministic classifier — **not** `planner-selection-v1`) |

### `IF - New commit?` TRUE targets (live)

1. `IF - GIS repo for handoff?`
2. `Data Table - Upsert last seen commit`
3. `Code - Plan watcher repo gate stub`
4. `Execute Workflow - Resolve OpenClaw broker (WF60)`

**WF40 classification:** **MATCH** (live matches Phase A repo export on all grounded fields)

---

## Scope 2 — WF60 live (read-only)

| Field | Live (2026-08-28) | Template / Phase A expectation | Delta |
|---|---|---|---|
| Exists | **yes** | yes | none |
| ID | `d0015600-4001-8001-0001-0653506aabcd` | same | none |
| Name | `60 - OpenClaw broker fallback resolver - tailnet private - GPT-Web authored` | template name matches | none |
| Active | `false` | template `active: false` | none |
| versionId | `dacd0594-5e5a-41e8-a6cc-6088c5f7c14c` | not in Phase A export | informational only |
| nodeCount | 7 | 7 (template) | none |

### Node names (live)

- `When Executed by Another Workflow`
- `Manual Trigger`
- `Set canonical broker candidates`
- `Primary VPS OpenClaw health`
- `Windows fallback OpenClaw health`
- `Resolve primary or Windows fallback`
- `NOTE - private fallback contract`

### Function check

| Check | Live |
|---|---|
| Health/resolver only | **yes** — HTTP nodes are health probes only |
| Provider/model invocation added | **no** |
| LiteLLM node | **absent** |
| Output contract (code node `Resolve primary or Windows fallback`) | still emits `brokerSelected`, `selectedBaseUrl`, `reason`, `primaryStatus`, `fallbackStatus`, `failClosed`, `privateOnly` per GPT-Web template |

**WF60 classification:** **MATCH**

No workflow execute performed.

---

## Scope 3 — VPS / n8n execution surface

| Field | Value |
|---|---|
| Host OS | Ubuntu Linux 6.8.0-138-generic x86_64 |
| n8n execution class | **Docker container** |
| Container name | `root-n8n-1` |
| Image | `docker.n8n.io/n8nio/n8n` |
| n8n version | **2.19.5** |
| Container Node.js | **v24.14.1** |
| VPS host Node.js | **v18.19.1** |
| Network mode | `root_default` |
| Docker network | `root_default` (alias `n8n`, IP `172.18.0.2`, gateway `172.18.0.1`) |
| Published port | `127.0.0.1:5678 → 5678/tcp` (**loopback only**) |
| Other containers | **none** (only `root-n8n-1`) |

### Mounts (path classes — non secret)

| Type | Destination in container |
|---|---|
| bind | `/files` |
| bind | `/files/control-plane-verifier-inbox` |
| volume | `/home/node/.n8n` |

### `/files/handoff-runtime` contents (live)

- `dev-method/`
- `cursor-coordinate-converter/`
- `Planet-Clone/`
- `_quarantine/`

**No** `control-plane/` directory under `/files/handoff-runtime` at inspection time.

**N8N SURFACE CLASS:** `docker_container_root_n8n_1_on_root_default_loopback_5678`

---

## Scope 4 — control-plane tool availability (n8n surface)

Searched bounded paths inside `root-n8n-1`:

| Tool | `/files/handoff-runtime/control-plane/tools/...` |
|---|---|
| `build-llm-gateway-request.mjs` | **missing** |
| `normalize-litellm-responses-body.mjs` | **missing** |
| `validate-openclaw-planner-response-gate.mjs` | **missing** |
| `validate-execution-packet-v1.mjs` | **missing** |
| `evaluate-execution-packet-policy.mjs` | **missing** |

Node.js in container can run scripts, but the canonical control-plane repo/tools are **not mounted** on the n8n execution surface.

**CONTROL_PLANE_TOOLS_AVAILABLE:** **false** (on VPS n8n container without new mount/install)

---

## Scope 5 — schema engine availability

Probed without install (require.resolve only):

| Surface | ajv draft 2020-12 | ajv-formats | CONTROL_PLANE_AJV_NODE_MODULES |
|---|---|---|---|
| VPS host | **false** | **false** | unset |
| n8n container `root-n8n-1` | **false** | **false** | unset |
| WORK-PC (isolated install from D-0024) | via env hook in validator tool | via env hook | **set** (user-local path class) |

Schema validation on the n8n/VPS execution surface would require a later controlled mount/install gate (same class as D-0024 schema-engine closure on WORK-PC).

---

## Scope 6 — LiteLLM private placement class (no install/start)

Evaluated against live topology. **No LiteLLM process/container observed.**

| Option | Applicable | n8n reachability | Public exposure | Network mutation (later deploy) | Notes |
|---|---|---|---|---|---|
| **A — VPS host-local process** | partial | Poor default: container cannot reach host `127.0.0.1:4000` without extra host/bind config | NO if bound loopback | likely **true** (bind/bridge/extra_hosts) | Not preferred |
| **B — sibling Docker container on `root_default`** | **yes (preferred)** | `http://<service-name>:4000/v1/responses` via Docker DNS on private network | **NO** | **true** at deploy gate (new container join existing network) | Matches current single-network layout; isolates OAuth/API keys from n8n |
| **C — same container as n8n** | possible but discouraged | localhost inside container | NO | **true** (image/lifecycle coupling) | Poor credential isolation |
| **D — WORK-PC loopback** | proven in D-0024 only | n8n on VPS **cannot** reach WORK-PC reliably | N/A | N/A | Explicitly out of scope for production n8n path |

**LITELLM PRIVATE PLACEMENT CLASS:** **B — sibling Docker container on `root_default`**

Candidate URL class for GPT Web artifact (non-secret placeholder):

```text
http://litellm-primary:4000/v1/responses
```

(service name to be fixed at deploy gate; must remain off public interfaces)

Credential isolation: ZAI + Codex OAuth material stay on LiteLLM container/host env, not in n8n workflow JSON.

---

## Scope 7 — planner ingress gap (live confirmed)

Phase A finding **confirmed live**:

| Check | Live |
|---|---|
| `planner-selection-v1` producer node | **absent** |
| `openclaw-consumer-input-v1` producer node | **absent** |
| LiteLLM dispatch node | **absent** |
| Canonical gate tool execution in n8n | **absent** |

### What exists instead

- `Code - PM21 classifier decision` — deterministic PM17 classifier (`pm17-classifier-v1`), mock bridge path, **not** Architecture v3 planner router
- `Execute Workflow - Resolve OpenClaw broker (WF60)` — broker health resolver only; terminal lane

### Exact insertion seam classes (for GPT Web — not a patch)

1. **Parallel lane from `IF - New commit?` TRUE** — same pattern as WF60 wiring (additive, preserves four existing targets)
2. **Downstream subflow after future planner-selection producer** — requires new workflow or nodes that emit `planner-selection-v1` + consumer input before any LiteLLM HTTP call
3. **Separate invoke workflow (e.g. WF61+)** — parent WF40 calls planner dispatch subflow when authorized

**Do not** promote `Code - PM21 classifier decision` to `planner-selection-v1`.

---

## Repo vs live summary

| Artifact | Classification |
|---|---|
| WF40 | **MATCH** |
| WF60 | **MATCH** |
| Planner-selection ingress | **GAP confirmed live** |
| LiteLLM node | **absent live** |
| Control-plane tools on n8n surface | **NOT_AVAILABLE** |
| Schema engine on n8n surface | **NOT_AVAILABLE** |

---

## Phase B GPT Web authoring inputs (minimum)

GPT Web should author an import-ready artifact that accounts for:

1. WF40 live preconditions grounded above (versionId `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b`)
2. New planner-selection + consumer ingress (not PM21 reuse)
3. LiteLLM dispatch to private URL class on `root_default` (Option B)
4. Canonical gate behavior — either mount control-plane tools or embed equivalent fail-closed Code nodes
5. Preserved WF60 OpenClaw lane unchanged
6. Separate deploy gates for: LiteLLM container, tool mount/install, credential binding, workflow import, activation

---

## Rollback principle

Live state matches repo export reference; rollback reference remains `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`. Any Phase B import must be reversible without removing WF60/OpenClaw fallback path.

---

## Evidence pointers

- Phase A map: `reports/architecture/d0025_phase_a_integration_map.md`
- Primary config: `configs/litellm/control-plane-primary-remote.template.yaml`
- Architecture decision: `reports/architecture/litellm_primary_remote_gateway_decision.md`
- WF40 repo export: `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`
- WF60 template: `workflows/60-openclaw-broker-fallback-resolver.template.json`
