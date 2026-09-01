# V4 n8n PostgreSQL schedule trigger registration diagnosis — retry 008

**Task ref:** `V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_008_POSTGRES_SCHEDULE_TRIGGER_REGISTRATION_DIAGNOSIS`  
**Run nonce:** `N8N_PROD_PG_MIGRATION_RETRY008_20260901_01`  
**Base:** `0f0982ea0dc17c220a3cded4dcedfd4c85f04c29`  
**Result:** `PASS`  
**Classification:** `POSTGRES_LEGACY_SCHEDULE_TRIGGER_RUNTIME_DEFECT_CRON_REGISTERED_NOT_FIRING_ON_POSTGRES`

Retry008 mechanically reproduced the retry006/retry007 PostgreSQL Schedule Trigger boundary without production mutation. Using the same retry006 migration boundary datasets (SQLite snapshot + PostgreSQL evidence volume), isolated A/B rehearsals on stock n8n 2.33.3 showed SQLite natural WF40 trigger ticks while PostgreSQL registered the same legacy cron but produced zero trigger-mode executions in 180 seconds. Production remained SQLite with health 200.

## Prior retry007 context (required)

| Field | Value |
|---|---|
| finding | `WF40_SCHEDULER_NOT_RECOVERED_BY_NATIVE_REPUBLISH` |
| isolated_scheduler | FAIL |
| passive_ticks_240s | 0 |
| republish_ticks_240s | 0 |
| sqlite_wf40_control_15m | 15 |
| prod_mutation | 0 |
| prod_db_after_stop | SQLITE |
| prod_health_after_stop | PASS |

## Production safety (read-only)

| Check | Result |
|---|---|
| n8n | 2.33.3 (`sha256:769d3a624534…`) |
| DB | SQLite (`DB_TYPE` unset) |
| health | 200 |
| WF40 | active/published, 83 nodes, `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| WF61 | inactive |
| D-0025 | CLOSED, auth=0 |
| `PROD_MUTATION` | 0 |

Side effects: provider=0 · register=0 · execution endpoint=0 · OpenCode=0 · Qwen=0

## Effective scheduler / publication config (production)

All listed keys absent in production container env → recorded as `UNSET`; effective values derived from n8n 2.33.3 stock defaults only (not guessed from absence beyond documented defaults):

| Variable | Production | Effective |
|---|---|---|
| `N8N_SCHEDULER_ENABLED` | UNSET | **false** |
| `N8N_USE_WORKFLOW_PUBLICATION_SERVICE` | UNSET | **false** |
| `N8N_SCHEDULER_TRIGGER_NODE_MODE` | UNSET | **legacy** |
| `N8N_SCHEDULER_POLL_TRIGGERS_ENABLED` | UNSET | false |
| `N8N_ENV_FEAT_SKIP_DURABLE_SCHEDULER` | UNSET | false (inactive path) |
| `N8N_WORKFLOW_ACTIVATION_BATCH_SIZE` | UNSET | stock default |
| `N8N_WORKFLOW_INDEX_BATCH_SIZE` | UNSET | stock default |
| `GENERIC_TIMEZONE` / `TZ` | Europe/Berlin | Europe/Berlin |
| `EXECUTIONS_MODE` | UNSET | stock default |
| `N8N_RUNNERS_ENABLED` | true | true |
| `NODES_EXCLUDE` | `[]` | `[]` |

Durable Schedule Trigger interception requires **both** `scheduler.enabled=true` and `useWorkflowPublicationService=true` (n8n 2.33 docs/source). Production uses **legacy in-memory** scheduling.

## A/B topology

| Rehearsal | Source | DB | n8n | Network |
|---|---|---|---|---|
| **A** | `/root/n8n-postgres-migration-backups/20260901T105729Z_retry006_pre_postgres/database.sqlite` + production encryption `config` | SQLite (snapshot) | 2.33.3 digest-pinned | internal only, no egress |
| **B** | clone of `root_n8n_postgres_data_retry006` | PostgreSQL 16.15 digest-pinned | 2.33.3 digest-pinned | internal only; n8n↔postgres only |

Both used production-equivalent env (`NODES_EXCLUDE=[]`, Europe/Berlin, runners enabled, DEBUG logging). No public ports. No Tailscale.

## Clock / timezone parity

Both isolated instances resolved `Europe/Berlin`. WF40 Schedule Trigger node `460ab8eb-e991-4642-80d0-55de9490d010` (typeVersion 1.2, 1-minute interval) computed legacy cron:

- expression: `2 */1 * * * *` (second 2 every minute)
- A and B registered **identical** cron at activation

## WF40 semantic DB comparison (pre-start)

| Check | SQLite snapshot | PostgreSQL clone |
|---|---|---|
| active / activeVersionId / triggerCount | match | match |
| nodes | 83 | 83 |
| Schedule Trigger id/type/typeVersion/parameters | match | match |
| settings / staticData semantic | equal | equal |
| `scheduled_job` rows for WF40 | n/a | **0** |
| `scheduled_task` rows for WF40 | n/a | **0** (durable path inactive) |

## Scheduler path classification

| Instance | Path | Evidence |
|---|---|---|
| A (SQLite) | **LEGACY_IN_MEMORY** | debug: `Durable scheduler is inactive`; `Registered cron` for WF40; natural trigger executions observed |
| B (PostgreSQL) | **LEGACY_IN_MEMORY** | same debug lines; `Registered cron` for WF40; **zero** trigger executions in 180s |

Failure boundary on PostgreSQL legacy path: **CRON_REGISTERED_NOT_FIRING** (not RULE_NOT_PROVISIONED, not durable JOB/TASK materialization).

## A/B natural ticks (180s, no manual execution)

| Metric | A SQLite | B PostgreSQL |
|---|---|---|
| baseline max execution id | 295037 | 295045 |
| WF40 trigger-mode ticks | **≥2** | **0** |
| Required | ≥2 | ≥2 |

Reproduces retry007 differential on the same migration boundary datasets.

## Bounded fallback tests

| Section | Applicable | Result |
|---|---|---|
| 11 durable scheduler disable (`N8N_SCHEDULER_ENABLED=false`) | **NO** — effective scheduler already false; not durable-backed | NOT_APPLICABLE |
| 12 publication service disable | **NO** — effective publication service false; already legacy | NOT_APPLICABLE |

`FALLBACK=NOT_APPLICABLE`

## Published dependency index interpretation

Startup on both A and B logs:

`Finished building workflow dependency index. Processed 0 draft workflows, 0 published workflows.`

This counter refers to the **workflow publication service index**, not absence of dependency rows. SQLite snapshot contains **196** `workflow_dependency` rows for WF40 (mix of `publishedVersionId=a609ad90-…` and `publishedVersionId=NULL` duplicate/stale index entries). PostgreSQL clone carries the imported dependency graph from retry006.

**PUBLISHED_INDEX_CLASSIFICATION:** `ZERO_PUBLISHED_SERVICE_INDEX_WITH_POPULATED_WORKFLOW_DEPENDENCY_TABLE` — the “0 published workflows” startup line is **not** evidence of missing WF40 dependency data and is **not** causal for cron registration failure (PostgreSQL **did** register cron).

## Outcome

| Field | Value |
|---|---|
| CLASSIFICATION | `POSTGRES_LEGACY_SCHEDULE_TRIGGER_RUNTIME_DEFECT_CRON_REGISTERED_NOT_FIRING_ON_POSTGRES` |
| A_SQLITE_TICKS | 2 |
| B_POSTGRES_TICKS | 0 |
| FALLBACK | NOT_APPLICABLE |
| PROD_MUTATION | 0 |
| NEXT | `V4_N8N_POSTGRES_LEGACY_SCHEDULE_TRIGGER_CRON_FIRE_GPT_WEB_BOUNDED_REMEDY` — bounded source-level investigation of legacy `scheduled-task-manager` / ActiveWorkflowManager cron firing on PostgreSQL |

## Preserved assets

- `root_n8n_data`, retry001–retry006 backups, `root_n8n_postgres_data`, `root_n8n_postgres_data_retry006` — untouched
- VPS evidence: `/root/n8n-postgres-migration-runs/N8N_PROD_PG_MIGRATION_RETRY008_20260901_01/` (sanitized logs; isolated clone volumes removed)
