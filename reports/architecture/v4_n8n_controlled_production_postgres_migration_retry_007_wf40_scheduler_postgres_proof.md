# V4 n8n controlled production PostgreSQL migration retry 007 — WF40 scheduler PostgreSQL proof

**Task ref:** `V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_007_WF40_SCHEDULER_POSTGRES_PROOF`  
**Run nonce:** `N8N_PROD_PG_MIGRATION_RETRY007_20260901_01`  
**Base:** `2eef1f9f2f6ab6b6e9bad2cc84a2c76e108ef06a`  
**Result:** `STOP`  
**Classification:** isolated scheduler proof failed; production not mutated

Retry007 addressed the retry006 WF40 natural-schedule blocker by running a no-production-mutation isolated rehearsal against a filesystem clone of the preserved retry006 imported PostgreSQL volume. WF40 active-version integrity passed and WF40 activated on PostgreSQL after matching production `NODES_EXCLUDE=[]`, but zero Schedule Trigger executions were observed in both passive and native-republish branches. Concurrent SQLite production continued 1/min WF40 trigger ticks. Per contract, production cutover was not attempted.

## Prior retry006 context

| Item | retry006 |
|---|---|
| Migration path | export/normalization/import/equivalence/identity **PASS** |
| WF40 structural | active/published, 83 nodes, `triggerCount=1` |
| Natural ticks on PostgreSQL | **0/10** in 900s |
| Rollback | **PASS** → SQLite |

## Production safety precheck (no mutation)

| Check | Result |
|---|---|
| n8n version | 2.33.3 |
| Effective DB | SQLite |
| Health | 200 |
| WF40 | active/published, 83 nodes, exact `activeVersionId` |
| WF61 | inactive |
| D-0025 | CLOSED |
| `PROD_MUTATION` | 0 |

## Isolated rehearsal topology

| Item | Value |
|---|---|
| Source volume (immutable) | `root_n8n_postgres_data_retry006` |
| Clone volume | `root_n8n_postgres_data_retry007_scheduler_rehearsal` (removed after rehearsal) |
| Network | `retry007_scheduler_net` (internal, no egress) |
| PostgreSQL | 16.15 pinned digest |
| n8n | 2.33.3 with writable config-only home + production-equivalent env (`NODES_EXCLUDE=[]`) |
| Credentials | reused retry006 postgres env (clone-compatible) |

## WF40 active-version integrity (cloned PostgreSQL)

| Check | Result |
|---|---|
| `workflow_entity.active` | true |
| `activeVersionId` | `a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| `triggerCount` | 1 |
| nodes | 83 |
| Schedule Trigger node | `Schedule Trigger - controlled polling` |
| type / version | `n8n-nodes-base.scheduleTrigger` / 1.2 |
| interval | 1 minute (`rule.interval[].minutesInterval=1`) |

## Passive scheduler proof (240s)

| Field | Value |
|---|---|
| WF40 activation | PASS after `NODES_EXCLUDE=[]` (initial rehearsal without it failed on `executeCommand`) |
| Observation window | 240 seconds |
| Required | ≥2 natural WF40 `mode=trigger` executions |
| Observed | **0** |
| Baseline max execution id | 295045 (unchanged throughout) |

## Native republish experiment (exactly once, cloned DB)

| Step | Result |
|---|---|
| `unpublish:workflow` | exit 0 |
| `publish:workflow --versionId=a609ad90-…` | exit 0 |
| Post-state guard | nodes/connections hash unchanged, `activeVersionId` exact |
| Observation window | 240 seconds |
| Observed ticks | **0** |

## Concurrent SQLite control

During rehearsal window, production SQLite recorded **15 WF40 trigger executions in 15 minutes** (1/min cadence), confirming the schedule trigger itself is healthy on SQLite while PostgreSQL clone produced none.

## Outcome

| Field | Value |
|---|---|
| `ISOLATED_SCHEDULER` | FAIL |
| `SCHEDULER_BRANCH` | UNRESOLVED |
| `PROD_MUTATION` | 0 |
| Production DB after stop | SQLite |
| Production health after stop | 200 |
| Export/import/equivalence | NOT_RUN |

## Side-effect counters

provider=0 · register=0 · execution endpoint=0 · OpenCode=0 · Qwen=0

## Finding

PostgreSQL-imported WF40 can reach activated/published structural state but does not produce natural Schedule Trigger executions within 240s, and native unpublish/publish does not recover scheduler firing. This is a PostgreSQL-runtime scheduler registration or persistence issue distinct from migration/export/import mechanics.

## Preserved assets

- SQLite volume `root_n8n_data`
- Backups retry001–retry006
- retry005 evidence volume `root_n8n_postgres_data`
- retry006 evidence volume `root_n8n_postgres_data_retry006`
- Rehearsal evidence under VPS run dir (sanitized logs; rehearsal volume removed)

## Next

Investigate PostgreSQL schedule-trigger persistence/registration after entity import (e.g. published-workflow activation path, trigger registry tables, dependency index reporting `0 published workflows` at startup in retry006).
