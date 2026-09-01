# V4 n8n SQLite WAL admission repair — STOP (WAL already active, not root cause)

**Task ref:** `V4_N8N_SQLITE_WAL_ADMISSION_REPAIR_AND_WF40_LIVE_RESUME`  
**Run nonce:** `N8N_SQLITE_WAL_ADMISSION_20260901_01`  
**Dispatch base:** `975c8379e83e88c1e01dd2b34515e72f3a4d043b`  
**Result:** STOP — `SQLITE_WAL_ALREADY_ACTIVE_NOT_ROOT_CAUSE`

## Section 1 — precheck (PASS)

- `HEAD == origin/main == 975c837`
- n8n **2.33.3** healthy (`root-n8n-1` up)
- D-0025 CLOSED (`enabled=false`, calls=0) · WF61 inactive · ACTIVE auth=0
- Nonterminal executions at diagnosis time: **0** (293900 self-cleared; scheduler ticking through 293918)

## Section 2 — effective concurrency (PASS)

**Classification: `PRODUCTION_CONCURRENCY_DISABLED`**

| Evidence | Value |
|---|---|
| `EXECUTIONS_MODE` / `N8N_CONCURRENCY_PRODUCTION_LIMIT` env | not set |
| `@n8n/config` `ConcurrencyConfig.productionLimit` default | **-1** |
| `concurrency-control.service.js` | limit -1 → unlimited → no queue created → `isEnabled = queues.size > 0` = **false** |

## Section 3 — task runner position (PASS)

**Classification: `TASK_RUNNER_NOT_CAUSAL_FOR_PRE_ADMISSION_STALL`**

- `dist/workflow-runner.js:265` → `await this.executionRepository.setRunning(executionId)` sets `startedAt` + running in a DB transaction (`@n8n/db` `execution.repository.js:222`)
- **Zero** taskRunner/broker references in `workflow-runner.js` before that point; task runner participates only during node execution (Code nodes) after `setRunning`
- Therefore `new → running+startedAt` precedes any task-runner request. `N8N_RUNNERS_ENABLED`, broker, port 5679 untouched.

## Section 4 — SQLite live config (read-only, PASS)

| Item | Value |
|---|---|
| `DB_TYPE` | unset → default sqlite |
| `DB_SQLITE_POOL_SIZE` env | unset |
| **Effective `poolSize` (2.33.3 default)** | **3** (`SqliteConfig.poolSize = 3`; env schema requires ≥1) |
| DB path | volume `root_n8n_data` → `/home/node/.n8n/database.sqlite` (1.48 GB) |
| **PRAGMA journal_mode** | **`wal`** |
| WAL/SHM files | **present and actively written** (`database.sqlite-wal` 4.6 MB, `database.sqlite-shm` 32 KB) |
| PRAGMA quick_check | **ok** (0.1 s) |
| Filesystem | 23% used (90 GB free), inodes 5% |

## Section 5 — root-cause branch → STOP

Required STOP condition met: **SQLite is already pooled/WAL** on 2.33.3.

- `journal_mode=wal` with live WAL/SHM files
- effective pool size 3 (> 0) by 2.33.3 default — `DB_SQLITE_POOL_SIZE=2` would change nothing material
- decisive: stuck execution **293900** (`new`, `startedAt=null`, >80 s) occurred at 01:13Z **while WAL was already active** — the legacy rollback-journal hypothesis cannot explain the admission stall

Per block rules: no backup, no Compose change, no recreation performed. Gate stayed CLOSED; zero provider/register/Telegram/OpenCode/Qwen side effects.

## Counters

`second_repair=0` · `second_provider=0` · `second_execution=0` · WF40 pipeline=0 · WF61=0

## NEXT

`V4_N8N_ADMISSION_INTERNAL_TRACE_OR_POSTGRES_CANARY`
