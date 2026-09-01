# V4 n8n PostgreSQL execution_entity sequence resync and cutover tick validation

**Task ref:** `V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION`  
**Run nonce:** `N8N_PG_SEQUENCE_RESYNC_CUTOVER_20260901_01`  
**Base:** `ec5e548bb8ef1fa2f0add0fb3a2e569ed744befb`  
**Result:** `STOP`  
**Classification:** `POSTGRES_SEQUENCE_RESYNC_PROOF_QUERY_INVALID_INCREMENT_BY`

Controlled production cutover halted after post-import sequence resync completed successfully. Isolated rehearsal proved the bounded `pg_get_serial_sequence` discovery + `setval` correction path; native export/import and application equivalence passed; automatic rollback restored healthy SQLite production. Stop trigger: post-import proof query selected nonexistent column `increment_by` from sequence relation `execution_entity_id_seq` (PostgreSQL sequences expose `last_value`, `log_cnt`, `is_called` only).

## Prior classification (required)

| Field | Value |
|---|---|
| prior_block | `V4_N8N_POSTGRES_LEGACY_SCHEDULE_TRIGGER_CRON_FIRE_RUNTIME_INSTRUMENTATION` |
| prior_classification | `POSTGRES_EXECUTION_ENTITY_ID_SEQUENCE_DESYNC_MASKS_TRIGGER_TICK_BASELINE_QUERY` |
| HANDLE_TICK_ENTER | ≥2 |
| cron_active | YES |
| leader_at_due | YES |
| heartbeat | PASS |
| prod_mutation_at_start | 0 |

## Source-level root cause (confirmed, not patched in production)

Stock n8n 2.33.3 `ImportService.advanceIdentitySequences()` discovers columns only when `identity_generation IS NOT NULL`, then calls `pg_get_serial_sequence` + `setval`.

```javascript
// import.service.js — identity_generation filter only
const identityColumns = await transactionManager.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema = current_schema()
     AND table_name = $1
     AND identity_generation IS NOT NULL`, [tableName]);
```

PostgreSQL schema: `execution_entity.id` default = `nextval('execution_entity_id_seq'::regclass)` — sequence-backed but **not** an identity column.

**Classification:** `N8N_IMPORT_ENTITIES_SERIAL_SEQUENCE_DISCOVERY_GAP`

## Isolated sequence resync proof — PASS

Clone: immutable `root_n8n_postgres_data_retry006` → disposable volume `root_n8n_postgres_data_seqresync_isolated_N8N_PG_SEQUENCE_RESYNC_CUTOVER_20260901_01`.

Discovery: `pg_get_serial_sequence(table,column) IS NOT NULL` across all public columns (25 serial-backed columns).

| Phase | SERIAL_COLUMNS | BEHIND_MAX |
|---|---|---|
| before resync | 25 | 3 |
| after resync | 25 | 0 |

`execution_entity` before resync: `max=295045`, `execution_entity_id_seq.last_value≈38`, class `BEHIND_MAX`.  
After resync: `max=295045`, `last_value=295045`, `next_value=295046`, class `SAFE`.

Other BEHIND_MAX columns resynced: `execution_metadata` (empty table, temp seq), `workflow_statistics_delta` (empty table with stale seq).

Isolated WF40 observation (190s, egress blocked):

| Metric | Value |
|---|---|
| EXECUTION_MAX_ID_BEFORE_START | 295045 |
| ticks by `startedAt >= obs_start` | 3 |
| ticks by `id > baseline` | 3 |
| match | YES |
| new ids | 295047, 295049, 295051 (strictly increasing, all > baseline) |
| ID_MONOTONIC | PASS |

External-node `EAI_AGAIN` on isolated ticks acceptable (egress blocked); scheduler + execution persistence proven.

## Fresh migration evidence (production cutover attempt)

| Step | Status |
|---|---|
| pre-downtime validation | PASS |
| fresh backup | PASS — `/root/n8n-postgres-migration-backups/20260901T142103Z_sequence_resync_pre_postgres` |
| native export | PASS — EXIT=0, ZIP integrity PASS |
| normalization | PASS — removed `workflows_tags.jsonl` only |
| PostgreSQL 16.15 target volume | `root_n8n_postgres_data_seqresync_prod` (new, not retry005/006) |
| schema init | PASS — 233 migrations |
| native import | PASS — EXIT=0, validation PASS |
| post-import equivalence | PASS |
| post-import sequence audit before | 25 columns, 3 BEHIND_MAX |
| post-import sequence resync | RESYNCED 3 (`setval` 295417 for execution_entity) |
| post-import sequence audit after | 25 columns, 0 BEHIND_MAX |
| post-import proof query | **FAIL** — `increment_by` column invalid |
| production WF40 tick validation | NOT_RUN (0/10) |

Fresh SQLite source at backup: `execution_entity=10132`, `workflows_tags=228`, WF40 83 nodes active, WF61 inactive.

## Stop finding

Post-import block executed:

```sql
SELECT last_value, is_called, increment_by FROM execution_entity_id_seq;
```

PostgreSQL error: `column "increment_by" does not exist`. Sequence relations do not expose `increment_by`; use `pg_sequences` or assume increment=1 (standard for n8n import sequences).

Resync and `--require-safe` audit had already passed; failure occurred in redundant proof step, triggering rollback trap.

## Rollback

| Field | Value |
|---|---|
| prod_mutated | 1 |
| rollback | PASS |
| prod_db_after_stop | SQLITE |
| prod_health_after_stop | PASS (200) |
| WF40 after rollback | active, 83 nodes, activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1 |
| WF61 after rollback | inactive |
| D-0025 | CLOSED |
| side effects | provider=0 register=0 execution_endpoint=0 OpenCode=0 Qwen=0 |

Preserved assets:

- SQLite backup: `20260901T142103Z_sequence_resync_pre_postgres`
- Failed PG evidence volume: `root_n8n_postgres_data_seqresync_prod`
- Run dir: `/root/n8n-postgres-migration-runs/N8N_PG_SEQUENCE_RESYNC_CUTOVER_20260901_01`
- Historical retry005/006 volumes untouched

## Fix applied in repo (not re-run per contract)

`tools/sequence-resync-postimport-block.sh`: proof query uses `SELECT last_value,is_called FROM execution_entity_id_seq` with `SEQ_INC=1`.

## Outcome summary

| Gate | Result |
|---|---|
| ISOLATED_SEQUENCE_PROOF | PASS |
| IMPORT | PASS |
| SEQUENCES (resync) | PASS until proof query |
| SEQUENCES (overall gate) | FAIL |
| EQUIVALENCE | PASS |
| WF40_TICKS | 0/10 |
| ROLLBACK | PASS |

**No second cutover attempt** per contract. Next block should re-run with corrected post-import proof query only; isolated proof and migration path otherwise validated.
