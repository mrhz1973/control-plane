# D-0025-W — WF40 WF60 parallel nonblocking apply

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_WF40_WF60_PARALLEL_NONBLOCKING_FOR_BACKLOG_LANE`  
**Date:** 2026-08-28  
**Release evidence:** issue #31 comment `5455016687`  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**GPT-Web patch:** `workflows/patches/d0025-w-wf40-wf60-nonblocking.gpt-web.json`  
**Status:** **PASS** — WF60 execute node non-blocking · WF40 siblings preserved · gate CLOSED

| Metric | Value |
|---|---|
| Mutation | **only** `continueOnFail=true` on target node |
| `provider_calls` | **0** |
| `inference` | **0** |
| `credential_mutations` | **0** |
| `network_mutations` | **0** |
| `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |
| `rollback_performed` | **false** |

---

## Precheck

| Check | Result |
|---|---|
| `origin/main` | `9fba3618067f57b82128c08811adedb31042852c` |
| Workspace | clean |
| WF40 pre | id `9ZMj2ACTKyDVhCue` · active **true** · versionId `48c30f4a-124c-48a4-b240-c2f6eca4743e` · nodes **44** |
| Target node | id `d0015f40-0060-4001-8001-000000000060` · name `Execute Workflow - Resolve OpenClaw broker (WF60)` · type `n8n-nodes-base.executeWorkflow` · workflowId `d0015600-4001-8001-0001-0653506aabcd` |
| `continueOnFail` before | **absent / not true** |
| WF60 | inactive |
| WF61 | inactive · executions **0** |
| Runtime gate | `enabled=false` · `provider_calls_authorized_per_event=0` |
| Rollback export | secret-safe pre-patch capture taken |

---

## Apply

1. Exact GPT-Web op `set_node_top_level_property` → `continueOnFail=true` on node `d0015f40-0060-4001-8001-000000000060`.
2. Graph equivalence verified excluding that single property (nodes/connections/settings).
3. `n8n import:workflow` then `n8n publish:workflow --id=9ZMj2ACTKyDVhCue`.
4. Bounded `docker restart root-n8n-1` so in-process loads published version (CLI warned restart required). LiteLLM container id unchanged.

### Pre / post WF40

| Field | Pre | Post |
|---|---|---|
| versionId | `48c30f4a-124c-48a4-b240-c2f6eca4743e` | `b05501c1-8df7-4853-9674-2e35ca393a07` |
| node_count | 44 | **44** |
| active | true | **true** |
| target `continueOnFail` | not true | **true** |

---

## Natural-poll validation

Observed post-reload scheduled executions (e.g. `284201`, `284203`, `284205`):

| Observation | Result |
|---|---|
| In-process versionId | `b05501c1-8df7-4853-9674-2e35ca393a07` |
| In-process node_count | 44 |
| WF60 `continueOnFail` in execution workflowData | **true** |
| WF60 inactive error still occurs | yes (`Workflow is not active…`) |
| That WF60 error terminates siblings? | **no** — execution continues |
| Sibling after `IF - New commit?` observed | **yes** — `IF - GIS repo for handoff?` (+ handoff command) runs after WF60 |
| WF61 executions | still **0** |
| Provider / inference | **0** |
| Gate | remains CLOSED |

### Note (out of scope; not a fail of this delta)

Under `executionOrder: v1`, after WF60 becomes non-blocking, the next hard-failing sibling currently observed is GIS `Execute Command - handoff dry-run` (`y=80`), which can still abort before `Data Table - Upsert` (`y=320`) and `Code - Plan watcher repo gate stub` (`y=752`). That is **not** suppression solely by the WF60 inactive error, and was **not** authorized to change in this pass.

---

## Preservation

| Asset | State |
|---|---|
| 44 node ids / names / types / positions / parameters | preserved |
| Connections / `executionOrder` | preserved |
| WF60 inactive + content | preserved |
| WF61 inactive + content · exec=0 | preserved |
| Runtime gate CLOSED | preserved |
| LiteLLM / OpenClaw | unchanged |
| Credentials / network / Tailscale / TeamViewer | unchanged |

---

## NEXT_GATE

`D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE_RETRY` **or** a GPT-Web-authored follow-up if GIS handoff hard-fail must be made non-blocking before the backlog lane is reachable on multi-repo new-commit polls.

Recommended operator check: confirm a natural poll where GIS handoff does not hard-stop the run (or author a separate nonblocking delta for that node) so plan-watcher/backlog siblings are observed end-to-end before enabling the GLM gate.
