# LAST CURSOR REPORT - control-plane (rolling)

## LATEST

```yaml
task_ref: V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION_RETRY
run_nonce: N8N_PG_SEQUENCE_RESYNC_CUTOVER_RETRY_20260901_01
result_cursor: PASS
classification: PRODUCTION_POSTGRES_MIGRATION_SEQUENCE_RESYNC_PASS
query_preflight: PASS
export: PASS
import: PASS
sequences: PASS
equivalence: PASS
execution_max_id_post_import: 295449
wf40_ticks: 10/10
wf40_stuck_new_over_30s: 0
execution_ids_monotonic: YES
new_execution_ids: [295450, 295451, 295452, 295453, 295454, 295455, 295456, 295457, 295458, 295459]
prod_db_after_pass: POSTGRESQL
prod_health_after_pass: PASS
postgres_volume: root_n8n_postgres_data_seqresync_retry_prod
fresh_backup: /root/n8n-postgres-migration-backups/20260901T143040Z_sequence_resync_retry_pre_postgres
next: V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF_POST_POSTGRES

evidence:
  - reports/architecture/v4_n8n_postgres_execution_entity_sequence_resync_and_cutover_tick_validation_retry.md
  - reports/runtime/cursor-passes/2026-09-01T144305Z__V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION_RETRY.pass.json
```
