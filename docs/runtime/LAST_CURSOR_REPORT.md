# LAST CURSOR REPORT - control-plane (rolling)

## LATEST

```yaml
task_ref: V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION
run_nonce: N8N_PG_SEQUENCE_RESYNC_CUTOVER_20260901_01
result_cursor: STOP
classification: POSTGRES_SEQUENCE_RESYNC_PROOF_QUERY_INVALID_INCREMENT_BY
isolated_sequence_proof: PASS
isolated_wf40_ticks: 3
isolated_execution_ids: [295047, 295049, 295051]
execution_max_before_isolated: 295045
export: PASS
import: PASS
post_import_resync: PASS
post_import_proof_query: FAIL
equivalence: PASS
wf40_production_ticks: 0/10
prod_mutated: 1
rollback: PASS
prod_db_after_stop: SQLITE
prod_health_after_stop: PASS
source_gap: N8N_IMPORT_ENTITIES_SERIAL_SEQUENCE_DISCOVERY_GAP
fix_in_repo: sequence-resync-postimport-block.sh increment_by query removed
next: V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION_RETRY

evidence:
  - reports/architecture/v4_n8n_postgres_execution_entity_sequence_resync_and_cutover_tick_validation.md
  - reports/runtime/cursor-stops/2026-09-01T142350Z__V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION.stop.json
```
