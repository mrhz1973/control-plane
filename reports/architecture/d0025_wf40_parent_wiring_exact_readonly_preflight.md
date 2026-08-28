# D-0025-W — WF40 parent wiring exact read-only preflight

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_WF40_PARENT_WIRING_EXACT_READONLY_PREFLIGHT`  
**Date:** 2026-08-28  
**GPT-Web review:** issue #31 comment `5453568468`  
**Status:** **PASS** — WF40 parent wiring exact authoring input ready  
**Workflow mutations:** **0** · **Provider calls:** **0** · **Inference:** **0** · **WF61 executions:** **0**

---

## Precheck

| Check | Result |
|---|---|
| `origin/main` | `d9eb71b924bfa9b5ebdd873c93269a2bc7ab6f4d` |
| Workspace | clean |
| `litellm-primary` readiness | **200 healthy** (no provider inference) |
| WF40 | `9ZMj2ACTKyDVhCue` · **active=true** |
| WF60 | `d0015600-4001-8001-0001-0653506aabcd` · **active=false** |
| WF61 | `d0025-6100-4001-8001-000000000061` · **active=false** |
| Secret values exposed | **false** |

Method: `n8n export:workflow --id=9ZMj2ACTKyDVhCue` inside `root-n8n-1` (read-only). No workflow save/import/execute.

---

## 1 — WF40 live metadata

| Field | Value |
|---|---|
| ID | `9ZMj2ACTKyDVhCue` |
| Name | `40 - CP v4 multirepo + classifier bridge - ACTIVE` |
| `active` | **true** |
| `versionId` | `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` |
| `updatedAt` | `2026-08-27T07:49:35.000Z` |
| Node count | **35** |

Matches Phase B repo export baseline (no material drift).

---

## 2 — Parent seam: nodes, IDs, connections

### Upstream entry (plan branch)

```
IF - New commit? [TRUE]
  └─► Code - Plan watcher repo gate stub          id=429cde10-b360-4396-9f57-ffeac563d2fe
        └─► GitHub - Fetch commit details         id=52e94e9c-986f-4f93-bac3-2c20ec4a60a1
              └─► Code - Detect real docs/plans     id=cf34f974-d471-4983-814c-a942ce2f27bb
                    └─► IF - plan_detected?         id=528577ea-6424-4779-8d07-51f8502dc084
```

### `IF - plan_detected?` outputs

| Branch | Target |
|---|---|
| TRUE (0) | `Format Gate D Telegram plan_detected message` (parallel) |
| TRUE (0) | `Code - PM21 classifier decision` |
| FALSE (1) | `Code - no_plan_detected output` |

### PM21 chain (seam core)

```
Code - PM21 classifier decision    id=666f9ed5-5236-42d1-b4ef-afe59e9d2a8a
  └─► Code - PM21 bridge result      id=5ee80b07-4260-40df-9c25-251a7e212de6
        └─► Code - PM21 format Telegram bridge summary   id=6a649d25-cb7b-4032-8f6a-d8e46f0d6e92
              └─► Telegram - Send PM21 bridge summary
```

### Other Execute Workflow in WF40

| Node | Target workflow | Notes |
|---|---|---|
| `Execute Workflow - Resolve OpenClaw broker (WF60)` · `d0015f40-0060-4001-8001-000000000060` | `d0015600-4001-8001-0001-0653506aabcd` | From `IF - New commit?` TRUE · **not** on PM21 seam |

**No** existing Execute Workflow to WF61. **No** `planner-selection-v1` node. **No** LiteLLM node.

---

## 3 — Code node field inventory (live outputs)

### `Code - Plan watcher repo gate stub`

| Direction | Fields |
|---|---|
| **Inputs used** | `ownerRepo`, `sourceRepo`, `stateKey`, `currentSha`, `shortSha`, `url`, `message`, `previousSha` |
| **Outputs** | `event`, `repo`, `stateKey`, `currentSha`, `shortSha`, `latestCommitUrl`, `latestCommitMessage`, `previousSha`, `gate` |

### `Code - Detect real docs/plans plan files`

| Direction | Fields |
|---|---|
| **Inputs** | GitHub commit object (`$input`); stub via `$('Code - Plan watcher repo gate stub')` |
| **Outputs (plan_detected)** | `event`, `repo`, `commitSha`, `shortSha`, `latestCommitUrl`, `latestCommitMessage`, `planPath`, `fileStatus`, `additions`, `deletions`, `changes`, `gate` |
| **Outputs (no_plan)** | `event`, `repo`, `commitSha`, `shortSha`, `changedFileCount`, `changedFiles`, `gate` |

### `Code - PM21 classifier decision` (PM17 deterministic — **not** planner-selection-v1)

| Direction | Fields |
|---|---|
| **Outputs** | `schema_version` (`pm17-classifier-v1`), `source`, `task_type`, `risk`, `route`, `approval_required`, `allowed_next_step`, `blocked_reason`, `notes`, `input` |
| **`input` nested** | `repo`, `plan_path`, `commit`, `short_sha` |
| **Hardcoded today** | `task_type:'docs-only'`, `risk:'low'`, `route:'cursor-control-plane'`, `approval_required:false` |

### `Code - PM21 bridge result` (PM19 mock bridge — **not** remote planner dispatch)

| Direction | Fields |
|---|---|
| **Outputs** | `schema_version` (`pm19-implementer-bridge-result-v1`), `source`, `status`, `worker`, `would_send_to_worker`, `would_require_telegram_gate`, `blocked_reason`, `classifier_route`, `classifier_risk`, `classifier`, `mock_worker_action`, `notes` |
| **Branches** | `dry_run_pass` (low risk + cursor route) → mock worker preview; else `gate_required` → Telegram |

---

## 4 — `openclaw-consumer-input-v1` field matrix

| Field | Classification | Live evidence |
|---|---|---|
| `task_id` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Not produced anywhere in seam |
| `source_backlog_ref` | **DIRECT_EXISTING** | `planPath` (detect) · `input.plan_path` (PM21 nested) |
| `source_backlog_commit` | **DIRECT_EXISTING** | `commitSha` (detect) · `input.commit` (PM21) |
| `repository` | **DIRECT_EXISTING** | `repo` (detect/stub/PM21) |
| `branch_target` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | No branch name in seam (commit SHA only) |
| `goal` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | `latestCommitMessage` exists but is not a `goal` field |
| `risk_hint` | **DIRECT_EXISTING** | PM21 `risk` (`low`/`medium`/`high` compatible) |
| `complexity_hint` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Absent |
| `planner_requested` | **MUST_NOT_INFER** | PM21 emits `route`/`task_type`, not planner enum; mapping to `glm`/`codex` requires GPT-Web policy |
| `allowed_paths` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Absent |
| `forbidden_paths` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Absent |
| `acceptance_seed` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Absent |
| `validation_seed` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Absent |
| `hard_constraints` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Absent |

---

## 5 — `planner-routing-input-v1` field matrix

| Field | Classification | Live evidence |
|---|---|---|
| `schema` | **DETERMINISTIC_DERIVABLE** | Literal `planner-routing-input-v1` |
| `task_id` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Same gap as consumer |
| `risk_hint` | **DIRECT_EXISTING** | PM21 `risk` |
| `complexity_hint` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Absent |
| `preferred` | **MUST_NOT_INFER** | No planner-selection ingress; cannot derive from `route:'cursor-control-plane'` |
| `fallback` | **DETERMINISTIC_DERIVABLE** | Architecture mandates `[]` for D-0025/WF61 |
| `fallback_policy` | **DETERMINISTIC_DERIVABLE** | Architecture mandates `gate_only` |
| `provider_state` | **MISSING_REQUIRES_GPT_WEB_AUTHORING** | Not present in WF40; evaluator requires explicit qwen/glm/codex state objects |

---

## 6 — Canonical inputs buildability

| Flag | Value | Rationale |
|---|---|---|
| **`CANONICAL_INPUTS_BUILDABLE`** | **false** | 9+ consumer fields and 4 routing fields require GPT-Web authoring or explicit policy; `planner_requested` / `preferred` must not be inferred from PM17 route |
| **`GPT_WEB_AUTHORING_REQUIRED`** | **true** | Adapter node(s) must author missing fields, planner selection policy, and `provider_state` sourcing |

---

## 7 — Exact insertion edge (for GPT-Web patch)

**Primary seam anchor:** `Code - PM21 bridge result` · id `5ee80b07-4260-40df-9c25-251a7e212de6`

**Current sole outgoing:** → `Code - PM21 format Telegram bridge summary` (Telegram/mock-worker path)

**Recommended insertion class (GPT-Web to author exact nodes):**

1. **Adapter Code node(s)** after `Code - PM21 classifier decision` or after `Code - PM21 bridge result` to assemble `{ consumer_input, routing_input }` from seam fields + GPT-Web-authored defaults.
2. **IF node** gating remote planner path (`preferred ∈ {glm,codex}` per planner-selection policy; Qwen deferred).
3. **Execute Workflow** → WF61 id `d0025-6100-4001-8001-000000000061` with passthrough `{ consumer_input, routing_input }`.
4. **Preserve** existing Telegram branch (`Code - PM21 format Telegram bridge summary`) for mock-worker / gate-required paths.

Alternative fork point: parallel branch from `IF - plan_detected?` TRUE alongside PM21 classifier — GPT-Web must choose; Cursor does **not** author.

---

## 8 — WF61 Execute Workflow feasibility

| Check | Result |
|---|---|
| WF61 live id | `d0025-6100-4001-8001-000000000061` |
| WF61 trigger | `When Executed by Another Workflow` · passthrough |
| Required payload | `{ consumer_input: openclaw-consumer-input-v1, routing_input: planner-routing-input-v1 }` |
| Passthrough compatible | **yes** (WF61 validates both on ingress) |
| WF61 active | **false** (import gate satisfied; execution still forbidden) |

---

## 9 — Preservation

| Entity | Unchanged |
|---|---|
| WF40 saved/active state | **yes** (export only) |
| WF60 | **yes** |
| WF61 | **yes** · not executed |
| `litellm-primary` | **yes** |
| Telegram sent | **no** |
| Data Table writes | **none** |

---

## 10 — Next gate

**GPT-Web exact WF40→WF61 parent patch authoring** using this evidence, then bounded Cursor apply gate (no execution/inference until separately authorized).

Issue **#31** remains **OPEN**.
