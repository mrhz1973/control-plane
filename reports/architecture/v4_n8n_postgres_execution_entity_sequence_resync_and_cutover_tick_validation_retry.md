# V4 n8n PostgreSQL execution_entity sequence resync and cutover tick validation — RETRY

**Task ref:** `V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION_RETRY`  
**Run nonce:** `N8N_PG_SEQUENCE_RESYNC_CUTOVER_RETRY_20260901_01`  
**Base:** `39f1e33d251abcf64433b1b45b9da405510e9dcb`  
**Result:** `PASS`  
**Classification:** `PRODUCTION_POSTGRES_MIGRATION_SEQUENCE_RESYNC_PASS`

Retry completed the controlled SQLite → PostgreSQL 16.15 production cutover using the proven native export/import path plus post-import `pg_get_serial_sequence` discovery and `setval` resync. Prior STOP (`POSTGRES_SEQUENCE_RESYNC_PROOF_QUERY_INVALID_INCREMENT_BY`) was corrected in `tools/sequence-resync-postimport-block.sh`; query precheck on preserved failed PG evidence volume passed before downtime.

## Prior STOP (resolved)

| Field | Value |
|---|---|
| prior_run | `N8N_PG_SEQUENCE_RESYNC_CUTOVER_20260901_01` |
| prior_finding | `POSTGRES_SEQUENCE_RESYNC_PROOF_QUERY_INVALID_INCREMENT_BY` |
| fix | `SELECT last_value,is_called FROM execution_entity_id_seq` + `SEQ_INC=1` |

## Query precheck — PASS

Clone of preserved evidence volume `root_n8n_postgres_data_seqresync_prod`:

| Field | Value |
|---|---|
| EXECUTION_MAX | 295417 |
| PROOF_NEXT | 295417\|t |
| NEXT_WOULD | 295418 |
| QUERY_PREFLIGHT | PASS |

## Fresh migration

| Step | Status |
|---|---|
| pre-downtime validation | PASS |
| fresh backup | PASS — `/root/n8n-postgres-migration-backups/20260901T143040Z_sequence_resync_retry_pre_postgres` |
| native export | PASS |
| normalization | PASS — removed `workflows_tags.jsonl` only |
| PostgreSQL 16.15 target | `root_n8n_postgres_data_seqresync_retry_prod` (new volume) |
| schema init | PASS — 233 migrations |
| native import | PASS — EXIT=0 |
| post-import equivalence | PASS |
| sequence audit before | 25 columns, 3 BEHIND_MAX |
| sequence resync | RESYNCED 3 |
| sequence audit after | 0 BEHIND_MAX |
| POSTGRES_SEQUENCE_STATE | PASS |
| production start | PASS — effective DB=PostgreSQL |

Fresh SQLite source at backup: `execution_entity=10146`, `workflows_tags=228`, WF40 83 nodes active, WF61 inactive.

## Sequence state post-resync

| Field | Value |
|---|---|
| EXECUTION_MAX_ID_POST_IMPORT | 295449 |
| execution_entity_id_seq | last_value=295459, is_called=t |
| NEXT_WOULD | 295460 (> 295449) |
| SERIAL_COLUMNS | 25 |
| BEHIND_MAX_AFTER | 0 |

## Ten natural WF40 ticks — PASS

Observation window: ≤900s from production PostgreSQL startup.

| Metric | Value |
|---|---|
| WF40_TICKS | 10 |
| WF40_STARTED | 10 |
| WF40_TERMINAL | 10 |
| WF40_STUCK_NEW_OVER_30S | 0 |
| WF40_NATURALITY | PROVEN |
| INTER_TICK_DELTAS | 59.993,60.001,60.002,59.999,59.997,60.003,59.998,60.0,60.002 |
| EXECUTION_IDS_MONOTONIC | YES |

New execution IDs (all > EXECUTION_MAX_ID_POST_IMPORT=295449):

```text
295450, 295451, 295452, 295453, 295454, 295455, 295456, 295457, 295458, 295459
```

Both counting methods (startedAt ≥ observation baseline and id > EXECUTION_MAX_ID_POST_IMPORT) identify the same 10 executions.

## Production state after PASS

| Field | Value |
|---|---|
| n8n | 2.33.3 |
| effective DB | PostgreSQL 16.15 |
| health | 200 |
| WF40 | active, 83 nodes, activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1 |
| WF61 | inactive |
| D-0025 | CLOSED |
| side effects | provider=0 register=0 execution_endpoint=0 OpenCode=0 Qwen=0 |

## Preserved assets

- SQLite backup: `20260901T143040Z_sequence_resync_retry_pre_postgres`
- Prior failed PG evidence: `root_n8n_postgres_data_seqresync_prod`
- Production PG volume: `root_n8n_postgres_data_seqresync_retry_prod`
- All historical retry005/006/007/008 volumes untouched

**NEXT:** `V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF_POST_POSTGRES`
