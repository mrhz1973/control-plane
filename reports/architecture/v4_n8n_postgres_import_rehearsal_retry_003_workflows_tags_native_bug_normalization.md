# V4 n8n PostgreSQL import rehearsal retry 003 — workflows_tags native bug normalization

**Task ref:** `V4_N8N_POSTGRES_IMPORT_REHEARSAL_RETRY_003_WORKFLOWS_TAGS_NATIVE_BUG_NORMALIZATION`  
**Run nonce:** `N8N_PG_IMPORT_REHEARSAL_RETRY003_20260901_01`  
**Base:** `d30d5452772a575dcaf4b53f2c4ced9bfa7fb9a5`  
**Result:** `PASS`  
**Classification:** `POSTGRES_NATIVE_IMPORT_REHEARSAL_PASS_WITH_BOUNDED_WORKFLOWS_TAGS_NORMALIZATION`

Isolated rehearsal resumed from retry004 archive after retry002 proved a deterministic n8n 2.33.3 `import:entities` collision on `workflows_tags`. A bounded working-copy normalization removed only `workflows_tags.jsonl`, kept `workflowtagmapping.jsonl`, and completed one native import into fresh PostgreSQL 16.15 with full application equivalence. Production remained on SQLite throughout.

## Upstream defect

Stock n8n 2.33.3 export emits **two** entity files that resolve to the same physical table `workflows_tags`:

| Archive member | Entity metadata name | Class | Target table | Columns |
|---|---|---|---|---|
| `workflows_tags.jsonl` | `workflows_tags` | `workflows_tags` (ManyToMany join metadata) | `workflows_tags` | `workflowId`, `tagId` |
| `workflowtagmapping.jsonl` | `workflowtagmapping` | `WorkflowTagMapping` | `workflows_tags` | `workflowId`, `tagId` |

Native import processes both in one run. The first file imports 228 relationships; the second then hits `duplicate key value violates unique constraint "pk_workflows_tags"`. Retry002 captured this with `IMPORT_EXIT=1` while production stayed unchanged.

Collision scan against stock n8n 2.33.3 entity metadata found **no other duplicate physical-table group affecting non-empty application data** besides this pair (`source_row_count=228`).

## Archive handling

| Field | Value |
|---|---|
| Immutable source path | `/root/n8n-postgres-migration-backups/20260901T090247Z_retry004_pre_postgres/entities/entities.zip` |
| Original archive SHA-256 | `35d78a9a8493e62ff92d9c2e9a9d0b1a43c5deda89fa88554c0d6e44552cc83b` |
| Source SHA before task | `35d78a9a8493e62ff92d9c2e9a9d0b1a43c5deda89fa88554c0d6e44552cc83b` |
| Source SHA after task | `35d78a9a8493e62ff92d9c2e9a9d0b1a43c5deda89fa88554c0d6e44552cc83b` |
| Normalized working archive SHA-256 | `de8bfc359995ce2d929e344613a82d99b2ad56eeb2e8e70e08b74f57c9fdd47c` |
| Removed member | `workflows_tags.jsonl` only |
| Removed member count | 1 |
| Kept members | `workflowtagmapping.jsonl`, `migrations.jsonl`, all other archive members unchanged at byte level |
| ZIP integrity | PASS |

## Isolated target

| Field | Value |
|---|---|
| PostgreSQL | `16.15` digest `sha256:f1c3376c26f2609ab9f29f71f824103fe2fcd8ee0346485cb6122a4f93df6f94` |
| n8n | stock `2.33.3` |
| Topology isolation | PASS (no public ports; dedicated volume/network) |
| Schema init | PASS (`233` migrations) |
| Latest migration | `ChangeInstalledNodeVersionType1785162364000` |
| Evidence dir | `/root/n8n-postgres-rehearsal/N8N_PG_IMPORT_REHEARSAL_RETRY003_20260901_01/evidence/` |

## Native import

| Field | Value |
|---|---|
| Command | `import:entities --inputDir=/migration-export --truncateTables` |
| Attempts | 1 |
| Exit | 0 |
| Migration validation | PASS |
| Foreign-key handling | PASS |
| Decompression | PASS |
| Import completion | PASS |

## workflows_tags proof

| Check | Value |
|---|---:|
| `COUNT(*)` from `workflows_tags` | 228 |
| `COUNT(DISTINCT (workflowId, tagId))` | 228 |
| Duplicate relationship rows | 0 |

Keeping `workflowtagmapping.jsonl` alone preserved the complete source relationship set.

## Application equivalence (retry004 snapshot)

All listed counts matched exactly, including dynamic data tables `3/1/101/13/9`. WF40 semantics: 83 nodes, active/published, `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1`. WF61 inactive. Credentials count 3 (contents not inspected).

## Identity sequences

| Field | Value |
|---|---|
| IDENTITY_SEQUENCE_STATE | PASS |
| Identity columns inspected | 18 |
| Method | Read-only PostgreSQL `IDENTITY` columns only (aligned with n8n `advanceIdentitySequences`) |

## Production safety

| Field | Value |
|---|---|
| PROD_MUTATION | 0 |
| PROD_DB | SQLite |
| PROD_HEALTH | 200 |
| WF40 | 83 active/published |
| WF61 | inactive |
| D-0025 | CLOSED |
| ACTIVE auth | 0 |
| provider / register / execution_endpoint / OpenCode / Qwen | 0 |

## Next

`V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_005_PROVEN_IMPORT_PATH`

Apply the same bounded normalization on the production migration export working copy before native import. Do not mutate the immutable retry004 backup archive.
