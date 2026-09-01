# V4 n8n controlled production PostgreSQL migration retry 006 — equivalence harness fix

**Task ref:** `V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_006_EQUIVALENCE_HARNESS_FIX`  
**Run nonce:** `N8N_PROD_PG_MIGRATION_RETRY006_20260901_01`  
**Base:** `97917cf38919807cf5d15c72a0b3436e7b094adb`  
**Result:** `STOP`  
**Classification:** migration path complete through equivalence; cutover stopped at WF40 natural schedule observation

Retry006 fixed the retry005 equivalence harness false failure and repeated the proven production cutover path. Export, normalization, PostgreSQL schema init, native import, corrected equivalence, identity sequences, and PostgreSQL production startup all passed. Cutover stopped because zero natural WF40 schedule executions occurred during the 900-second observation window despite structural regression reporting `triggerCount=1`.

## Retry005 root cause addressed

| Item | Retry005 | Retry006 fix |
|---|---|---|
| `published_workflows` query | Invalid `\"activeVersionId\"` escaping | Literal SQL via `psql -X -A -t -v ON_ERROR_STOP=1` heredoc |
| `user` query | Invalid `\"user\"` escaping | Literal `SELECT COUNT(*) FROM "user";` |
| False empty counts | Treated as mismatch | Hard contract: exit=0 and numeric stdout required |
| Pre-downtime proof | None | Isolated PostgreSQL tables with deterministic rows (2/2) |

## Query preflight (pre-downtime)

| Field | Value |
|---|---|
| Result | PASS |
| `published_workflows` | 2 (expected) |
| `user` | 2 (expected) |
| Mechanism | Same wrapper used for production equivalence |

## Fresh source inventory

| Metric | Count |
|---|---|
| `execution_entity` | 10442 |
| `execution_data` | 10442 |
| `workflows_tags` | 228 |
| `published_workflows` | 3 |
| `user` | 1 |
| `quick_check` | ok |

## Export / normalization / import

| Phase | Result |
|---|---|
| Export | PASS — 35951 entities, SHA `65b6ee0c…b64` |
| Normalization | PASS — removed only `workflows_tags.jsonl`, SHA `8e85341f…9cf4` |
| Collision scan | PASS — only `workflows_tags` duplicate |
| Schema init | PASS — 233 migrations |
| Native import | PASS — `IMPORT_EXIT=0`, `workflowtagmapping=228` |

## Corrected equivalence (all queries exit=0, numeric=true)

Sample per-query evidence:

| query_name | exit_code | numeric | source | target |
|---|---:|---|---:|---:|
| published_workflows | 0 | true | 3 | 3 |
| user | 0 | true | 1 | 1 |
| workflows_tags | 0 | true | 228 | 228 |
| execution_entity | 0 | true | 10442 | 10442 |

Full log: `.../evidence/equivalence-query-log.txt`

## PostgreSQL target

| Field | Value |
|---|---|
| Version | 16.15 |
| Production volume | `root_n8n_postgres_data_retry006` (fresh empty) |
| Retry005 evidence volume | `root_n8n_postgres_data` (preserved untouched) |
| Effective DB before rollback | PostgreSQL (mechanically proven via `pg_stat_activity`) |

## WF40 regression failure

| Field | Value |
|---|---|
| Structural regression | PASS — active, published, 83 nodes, `triggerCount=1` |
| Observation window | 900 seconds |
| Natural ticks observed | 0 |
| Finding | `WF40_TEN_TICK_WINDOW_INCOMPLETE` |

## Rollback

| Field | Value |
|---|---|
| Rollback | PASS |
| Production DB after stop | SQLite |
| Health after stop | 200 |
| WF40 after rollback | active/published, 83 nodes, exact `activeVersionId` |

## Side-effect counters

provider=0 · register=0 · execution endpoint=0 · OpenCode=0 · Qwen=0

## Outcome

The equivalence harness fix is proven. The proven import path completes on production downtime. The remaining blocker is WF40 natural schedule execution on PostgreSQL, not data migration mechanics.
