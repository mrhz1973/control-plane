# LAST CURSOR REPORT - control-plane (rolling)

## LATEST

```yaml
task_ref: V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_005_PROVEN_IMPORT_PATH
run_nonce: N8N_PROD_PG_MIGRATION_RETRY005_20260901_01
result_cursor: STOP
classification: PRODUCTION_CUTOVER_STOPPED_AT_EQUIVALENCE_HARNESS_SQL_QUOTING
export: PASS
normalization: PASS
import: PASS
equivalence_harness: FAIL
rollback: PASS
prod_db_after_stop: SQLITE
prod_health_after_stop: PASS
workflows_tags_imported: 228/228
finding: BUSINESS_ENTITY_COUNT_MISMATCH
root_cause: HARNESS_PSQL_IDENTIFIER_ESCAPING
next: V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_006_EQUIVALENCE_HARNESS_FIX

evidence:
  - reports/architecture/v4_n8n_controlled_production_postgres_migration_retry_005_proven_import_path.md
  - reports/runtime/cursor-stops/2026-09-01T104840Z__V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_005_PROVEN_IMPORT_PATH.stop.json
```
