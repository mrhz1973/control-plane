# V4 n8n controlled production PostgreSQL migration retry 005 — proven import path

**Task ref:** `V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_005_PROVEN_IMPORT_PATH`  
**Run nonce:** `N8N_PROD_PG_MIGRATION_RETRY005_20260901_01`  
**Base:** `97c6bb173bef8458fbf35d56a7393ecdabdd8f2c`  
**Result:** `STOP`  
**Classification:** production cutover halted at post-import equivalence harness defect after successful native import

Production cutover followed the retry003 proven path: fresh SQLite snapshot, native `export:entities`, bounded removal of only `workflows_tags.jsonl`, PostgreSQL 16.15 schema init, and one native `import:entities --truncateTables`. Export, normalization, collision scan, schema init, and import all passed. Automatic rollback restored healthy SQLite production when the equivalence harness falsely failed on SQL identifier quoting.

## Fresh source inventory (pre-downtime)

| Table / metric | Count |
|---|---|
| `workflow_entity` | 49 |
| `published_workflows` | 3 |
| `credentials_entity` | 3 |
| `project` | 1 |
| `user` | 1 |
| `tag_entity` | 70 |
| `workflow_history` | 52 |
| `shared_workflow` | 49 |
| `workflows_tags` | 228 |
| `execution_entity` | 10424 |
| `execution_data` | 10424 |
| `execution_metadata` | 0 |
| `execution_annotations` | 0 |
| `execution_annotation_tags` | 0 |
| `data_table` | 5 |
| `data_table_column` | 37 |
| SQLite bytes | 1483460608 |
| `PRAGMA quick_check` | ok |

Dynamic `data_table_user_*` tables: 5 tables, 127 total rows.

## Fresh backup

| Field | Value |
|---|---|
| Path | `/root/n8n-postgres-migration-backups/20260901T104604Z_retry005_pre_postgres` |
| SHA verification | PASS |
| Downtime start UTC | `2026-09-01T10:46:04Z` |

## Export

| Field | Value |
|---|---|
| Exit | 0 |
| Tables processed | 95 |
| Total entities exported | 35861 |
| Immutable archive SHA-256 | `f9bf62a63b1abdbf17c32fb896a3ff3179596f606e7577a9bd4231727d67c1bb` |
| Immutable archive path | `.../evidence/entities.source-immutable.zip` |
| ZIP integrity | PASS |
| JSONL members | 99 |
| `migrations.jsonl` | present |

## Normalization

| Field | Value |
|---|---|
| Removed member | `workflows_tags.jsonl` only |
| Removed member count | 1 |
| Kept | `workflowtagmapping.jsonl`, `migrations.jsonl`, all other members |
| Normalized archive SHA-256 | `ab8b98df60ad7aaad8d7539f4580e66df0da1d3fd766435277586fa0e8df945b` |
| Source immutable SHA unchanged | yes |

## Collision scan

| Field | Value |
|---|---|
| Result | PASS |
| Non-empty duplicate physical-table collision | `workflows_tags` only |
| Members | `workflows_tags.jsonl`, `workflowtagmapping.jsonl` |
| Source row count | 228 |

## PostgreSQL target

| Field | Value |
|---|---|
| Version | 16.15 |
| Digest | `postgres@sha256:f1c3376c26f2609ab9f29f71f824103fe2fcd8ee0346485cb6122a4f93df6f94` |
| Volume | `root_n8n_postgres_data` |
| Schema init | PASS |
| Migration count | 233 |
| Latest migration | `ChangeInstalledNodeVersionType1785162364000` |

## Native import

| Field | Value |
|---|---|
| Attempts | 1 |
| Exit | 0 |
| Migration validation | PASS |
| Foreign-key handling | PASS |
| Decompression | PASS |
| `workflowtagmapping` imported | 228 |
| `workflows_tags` target count before harness stop | 228 |

## Equivalence (failed — harness)

The harness compared business counts but used invalid psql SQL for quoted identifiers:

```sql
SELECT COUNT(*) FROM workflow_entity WHERE \"activeVersionId\" IS NOT NULL;
SELECT COUNT(*) FROM \"user\";
```

Both queries returned syntax errors; empty outputs produced a false diff on `published_workflows` and `user`. All other compared tables, including `workflows_tags=228`, already matched.

## Rollback

| Field | Value |
|---|---|
| Trigger | `BUSINESS_ENTITY_COUNT_MISMATCH` at `DATA_EQUIVALENCE` |
| Rollback | PASS (single automatic trap) |
| Production DB after stop | SQLite |
| Production health after stop | 200 |
| WF40 after rollback | active, 83 nodes, `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| WF61 after rollback | inactive |
| D-0025 | CLOSED |

## Cold rollback assets retained

- SQLite volume `root_n8n_data` (unchanged)
- retry001–retry005 backups preserved
- retry005 immutable export archive preserved
- failed PostgreSQL volume `root_n8n_postgres_data` preserved

## Side-effect counters

provider=0 · register=0 · execution endpoint=0 · OpenCode=0 · Qwen=0

## Outcome

The proven import path executed successfully through native import on production downtime. Cutover stopped only because the retry005 equivalence harness mis-quoted PostgreSQL identifiers. No second migration attempt was made per contract.
