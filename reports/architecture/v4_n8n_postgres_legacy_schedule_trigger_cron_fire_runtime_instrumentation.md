# V4 n8n PostgreSQL legacy Schedule Trigger cron fire runtime instrumentation

**Task ref:** `V4_N8N_POSTGRES_LEGACY_SCHEDULE_TRIGGER_CRON_FIRE_RUNTIME_INSTRUMENTATION`  
**Run nonce:** `N8N_PG_LEGACY_CRON_FIRE_RUNTIME_20260901_01`  
**Base:** `1f455a5fe1facb6f3fb9dbf494ee43c54e322063`  
**Result:** `PASS`  
**Classification:** `POSTGRES_EXECUTION_ENTITY_ID_SEQUENCE_DESYNC_MASKS_TRIGGER_TICK_BASELINE_QUERY`

Instrumentation with identical logging-only patches on stock n8n 2.33.3 proved the legacy cron timer path is **functional on PostgreSQL**. WF40 `HANDLE_TICK_ENTER` fires with `isLeader=true`, `onTick` runs, and trigger-mode executions are inserted. Retry008’s PostgreSQL `0 tick` observation using `id > MAX(id)` baseline is a **measurement artifact**: `execution_entity_id_seq` on the retry006 PostgreSQL clone is desynced (`last_value≈38` vs `MAX(id)=295045`), so new rows land at low ids and baseline queries miss them.

## Retry008 baseline (required)

| Field | Value |
|---|---|
| classification | `POSTGRES_LEGACY_SCHEDULE_TRIGGER_RUNTIME_DEFECT_CRON_REGISTERED_NOT_FIRING_ON_POSTGRES` |
| a_sqlite_ticks | ≥2 |
| b_postgres_ticks | 0 |
| scheduler_path | LEGACY_IN_MEMORY (both) |
| effective_scheduler_enabled | false |
| effective_publication_service | false |
| prod_mutation | 0 |

## Stock n8n 2.33.3 source contract (confirmed)

`ScheduledTaskManager.register()` (n8n-core `scheduled-task-manager.js`):

- builds `CronTime`, precomputes `scheduledTime`
- constructs `CronJob(..., start=true)`
- logs `Registered cron`

`handleTick()`:

- first gate: `instanceSettings.isLeader` (returns before `Executing cron` if false)
- on leader: advances `scheduledTime`, logs `Executing cron`, calls `onTick(firedFor)`
- no DB access in tick timing itself

`InstanceSettings.isLeader` ⇔ `instanceRole === 'leader'`.

## Diagnostic patch

| Field | Value |
|---|---|
| patch_hash (stm+is) | `ac2894e3e93499bd33545b449c0c80f3cc139b053f7409133b705b32c5848179` |
| delivery | disposable Docker image `n8n-diag-retry009` (patched bytes baked at build; not committed to repo) |
| semantics | logging-only; no scheduling behavior change |

Markers: `CRON_REGISTER_BEGIN`, `CRON_REGISTERED`, `HANDLE_TICK_ENTER`, `HANDLE_TICK_REJECTED_NOT_LEADER`, `HANDLE_TICK_LEADER_PASS`, `HANDLE_TICK_ON_TICK_CALL`, `HANDLE_TICK_ON_TICK_RETURN`, `WF40_CRON_STATE`, `WF40_CRON_STOP_TRACE`, `INSTANCE_ROLE_TO_*`, `DIAG_HEARTBEAT`.

## A/B identical runtime

| Rehearsal | Source | DB |
|---|---|---|
| A | retry006 pre-postgres SQLite snapshot | SQLite |
| B | clone of `root_n8n_postgres_data_retry006` | PostgreSQL 16.15 |

Same patched n8n 2.33.3 digest, `NODES_EXCLUDE=[]`, Europe/Berlin, runners, legacy scheduler/publication defaults, DEBUG logging, internal network, egress blocked equally.

## A / SQLite control (130s)

| Metric | Value |
|---|---|
| WF40 trigger ticks (`id > baseline`) | **3** |
| `HANDLE_TICK_ENTER` | **3** |
| `CRON_REGISTERED` | yes, `isActive=true` |
| heartbeat | PASS |
| cron stop traces | 0 |

## B / PostgreSQL (130s)

| Metric | Value |
|---|---|
| `HANDLE_TICK_ENTER` | **3** |
| `POSTGRES_CRON_ACTIVE` | **YES** (sampled `isActive=true` throughout) |
| `POSTGRES_LEADER_AT_DUE` | **YES** (`isLeader=true` at 13:49:02 / 13:50:02) |
| `HANDLE_TICK_ON_TICK_CALL` / `RETURN` | yes, synchronous |
| WF40 cron stop traces | **0** |
| heartbeat | PASS |
| ticks via `id > baseline` (baseline=295045) | **0** (misleading) |
| ticks via `startedAt >= activation` | **4** (ids 32, 34, 36, …) |

### Cron state timeline (B, WF40 node `460ab8eb-e991-4642-80d0-55de9490d010`)

- 13:48:50 `CRON_REGISTERED` — `isActive=true`, `nextDate=15:49:02+02:00`, `isLeader=true`
- 13:49:02 `HANDLE_TICK_ENTER` → `HANDLE_TICK_LEADER_PASS` → `Executing cron` → `Received trigger` → execution id 32 started
- 13:50:02 second tick → execution id 34
- `WF40_CRON_STATE` samples: `isActive=true`, `lastDate` advances after each fire

### Leader role

- single `INSTANCE_ROLE_TO_LEADER` at startup (`unset` → `leader`)
- no `INSTANCE_ROLE_TO_FOLLOWER` during observation

### Execution persistence vs sequence

PostgreSQL clone after observation:

```text
MAX(execution_entity.id) = 295045   -- historical rows from import
execution_entity_id_seq.last_value = 38
New WF40 rows during test: id 32, 34, 36 (mode=trigger, startedAt 13:49–13:51 UTC)
```

Baseline query `WHERE id > 295045` returns 0 while cron-fired executions exist at low ids. This explains retry007/008 passive `0 tick` counts without a cron-layer defect.

Isolated executions ended `status=error` (GitHub `EAI_AGAIN` — blocked egress). That is environmental for isolated rehearsal; cron callback and DB insert still occurred.

## Section 12 classification tree (mechanical)

| Candidate | Result | Evidence |
|---|---|---|
| A cron stopped after registration | **NO** | `isActive=true`, no `WF40_CRON_STOP_TRACE` |
| B leader guard drop | **NO** | `HANDLE_TICK_LEADER_PASS`, no reject markers |
| C timer callback not invoked | **NO** | 3× `HANDLE_TICK_ENTER` |
| D onTick without execution | **NO** | executions 32/34/36 inserted (timestamp query) |
| E event-loop stall | **NO** | heartbeat PASS, max drift normal |

**Resolved boundary:** cron/leader/onTick path is sound; **`execution_entity` id sequence desync invalidates `id > baseline` tick queries** on PostgreSQL clone.

Standalone cron control (section 13): **NOT RUN** — classification C not applicable.

## Production safety

| Check | Result |
|---|---|
| prod_mutation | 0 |
| n8n | 2.33.3 SQLite |
| health | 200 (final) |
| WF40 / WF61 / D-0025 | unchanged |

## Outcome

| Field | Value |
|---|---|
| CLASSIFICATION | `POSTGRES_EXECUTION_ENTITY_ID_SEQUENCE_DESYNC_MASKS_TRIGGER_TICK_BASELINE_QUERY` |
| A_SQLITE_TICKS | 3 |
| B_POSTGRES_HANDLE_TICK | 3 |
| POSTGRES_CRON_ACTIVE | YES |
| POSTGRES_LEADER_AT_DUE | YES |
| HEARTBEAT | PASS |
| NEXT | `V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION` |

## Preserved evidence

VPS (sanitized): `/root/n8n-postgres-migration-runs/N8N_PG_LEGACY_CRON_FIRE_RUNTIME_20260901_01/`  
Immutable volumes untouched: `root_n8n_postgres_data_retry006`, backups, production `root_n8n_data`.
