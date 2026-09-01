# V4 n8n PostgreSQL canary bootstrap activation diagnosis

**Task ref:** `V4_N8N_POSTGRES_CANARY_BOOTSTRAP_ACTIVATION_DIAGNOSIS`  
**Run nonce:** `N8N_POSTGRES_BOOTSTRAP_DIAG_20260901_01`  
**Base:** `e40ea5f5d21ae35eca4ae678ade9b949ab1c2d74`  
**Result:** `PASS` — root cause / boundary proven  
**Classification:** `OTHER_PROVEN_ROOT_CAUSE`  
**Sub-classification:** `PRIOR_TRIGGERCOUNT_ZERO_NOT_BOOTSTRAP_OR_NODE_TYPE_STARTUP_ACTIVATION_DID_NOT_COMPLETE`

This diagnostic pass does not repair production or rerun webhook stress. It explains why prior publish-only canary attempts observed `triggerCount=0` despite a valid published Schedule Trigger version.

## Prior failure context

Previous STOP evidence (`V4_N8N_POSTGRES_CANARY_PUBLISH_ONLY_SCHEDULE_PROOF`, commit `e40ea5f`) reported:

- import OK; `publish:workflow` only (no deprecated `update:workflow`)
- `ACTIVE_VERSION_CONTAINS_SCHEDULE_TRIGGER=true` from `workflow_history`
- after single restart: `activeVersionId` present, **`triggerCount=0`**
- no `Activated workflow` line for the canary workflow in startup logs

## Canary topology (this run)

| Field | Value |
|---|---|
| Project | `n8n-pg-bootstrap-diag-01` |
| Bind | `127.0.0.1:5684` |
| n8n | stock `2.33.3` digest `sha256:769d3a…1cc9` |
| PostgreSQL | `16.15` digest `sha256:f1c3376…df6f94` |
| Workflow ID | `CanaryBootstrapDiag001` |
| Evidence dir | `/root/n8n-postgres-canary/N8N_POSTGRES_BOOTSTRAP_DIAG_20260901_01/evidence/` |

Debug logging enabled on canary only: `N8N_LOG_LEVEL=debug`.

## Section 4 — Pre-restart bootstrap query proof

Pre-restart `workflow_entity` row:

| Field | Value |
|---|---|
| id | `CanaryBootstrapDiag001` |
| active | `true` |
| activeVersionId | `89d366a4-50c2-48ff-81a6-3acd4e417b33` |
| isArchived | `false` |
| triggerCount | `0` (expected pre-startup) |
| versionId | `89d366a4-50c2-48ff-81a6-3acd4e417b33` |

Semantic bootstrap predicate  
`activeVersionId IS NOT NULL AND isArchived = false`:

- **BOOTSTRAP_QUERY_INCLUDES_WORKFLOW = true**
- bootstrap_predicate_match_count = **1**

**Ruled out:** `IS_ARCHIVED_TRUE`, `IS_ARCHIVED_NULL_OR_NONFALSE`, bootstrap exclusion.

## Section 5 — Active version runtime shape

From `workflow_history` for `activeVersionId`:

- nodes count = **2**
- Schedule Trigger: `n8n-nodes-base.scheduleTrigger`, typeVersion **1.2**, disabled=false, 1-minute interval
- No Operation present; connection Schedule Trigger → No Operation

Installed runtime:

- node file: `n8n-nodes-base/dist/nodes/Schedule/ScheduleTrigger.node.js`
- **NODE_TYPE_RUNTIME_RESOLVABLE = true**

**Ruled out:** `NODE_TYPE_VERSION_NOT_RESOLVABLE`.

## Section 6–7 — One startup with debug logging

After single canary n8n restart, startup log sequence (sanitized):

```text
Start Active Workflows
Registered cron … groupId=CanaryBootstrapDiag001 … cron=37 */1 * * * *
Activated trigger node "Schedule Trigger" … workflowId=CanaryBootstrapDiag001
Activated workflow "Bootstrap Diag Schedule Canary" (ID: CanaryBootstrapDiag001)
Finished activating all workflows
```

Post-startup DB:

| Field | Pre-restart | Post-startup |
|---|---:|---:|
| activeVersionId | set | set (unchanged) |
| isArchived | false | false |
| triggerCount | 0 | **1** |

**Bootstrap boundary this run:** `SELECTED_AND_ACTIVATED_SUCCESSFULLY`  
No activation error lines for the workflow.

## Section 8 — Publication / scheduler flags

Canary effective behavior:

- **Durable scheduler:** inactive (`Durable scheduler is inactive on this instance; task handler not registered`)
- Scheduler tables present but empty at observation: `scheduled_job=0`, `scheduled_task=0`, `workflow_publication_outbox=0`
- Schedule registration used **legacy** path: `scheduled-task-manager.js` + `active-workflow-triggers.js` under `ActiveWorkflowManager`
- **triggerCount is authoritative** on this canary instance (not a durable-scheduler-only registration path)

## Root-cause conclusion

| Hypothesis | Verdict |
|---|---|
| Bootstrap query excludes workflow | **Disproven** — `isArchived=false`, predicate match count 1 |
| Node type/version not resolvable | **Disproven** — ScheduleTrigger 1.2 resolves in 2.33.3 |
| Published active version missing Schedule Trigger | **Disproven** — workflow_history contains trigger |
| Durable scheduler hides trigger in triggerCount | **Disproven** — durable scheduler inactive; cron registered; triggerCount 0→1 |
| Prior triggerCount=0 with valid publish | **Explained** — prior attempts lacked completed startup activation (`Activated workflow` absent); when publish-only + single restart completes `ActiveWorkflowManager.addActiveWorkflows`, registration succeeds |

**Classification:** `OTHER_PROVEN_ROOT_CAUSE`  
**Prior failure boundary:** startup activation did not complete/register triggers despite valid published version — not bootstrap predicate, not node type.

## Production safety

- prod_mutation = **0**
- production verified after cleanup: n8n **2.33.3**, health **200**, WF40 active, WF61 inactive, D-0025 CLOSED
- canary containers/network/volumes removed; sanitized evidence preserved off-repo

## Evidence SHA-256 (off-repo)

| File | SHA-256 |
|---|---|
| pre_restart_db.json | `90dec9adf767c8ed852aa8baf7e051051fdfcabfccf34d53a518cbafaf4a44a1` |
| diagnosis_result.json | `cdf4597eb74f5c5bad2c7ae20e50e12cf93f683f23cfe1cc141716c82ee6a6ec` |
| startup_grep_hits.txt | `6c61aaeef34bae2dab10802bf91e606e4608f5524e2618cd538f09ed28e06226` |

## NEXT

`V4_N8N_POSTGRES_CANARY_SCHEDULE_SIX_TICK_PROOF`

Publish-only + single restart is proven sufficient for trigger registration on this stack; the next bounded block should capture six natural schedule ticks with raw-row evidence (no webhook rerun), combining with prior validated webhook evidence from commit `58ba29c`.
