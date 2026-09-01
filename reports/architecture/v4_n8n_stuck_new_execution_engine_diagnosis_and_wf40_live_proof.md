# V4 n8n stuck-`new` execution engine diagnosis — STOP (upgrade path)

**Task ref:** `V4_N8N_STUCK_NEW_EXECUTION_ENGINE_DIAGNOSIS_AND_WF40_LIVE_RESUME`  
**Run nonce:** `N8N_STUCK_NEW_DIAG_20260901_01`  
**Dispatch base:** `4641c5f208708969258af7d76e983872e4c31311`  
**Result:** STOP — `N8N_2_19_5_EXECUTION_ENGINE_DEFECT_LIKELY`

## Executive summary

Read-only diagnosis on n8n **2.19.5** (`root-n8n-1`, regular mode, no Redis/queue) shows production trigger executions intermittently remain `status=new` with `startedAt=null`, blocking WF40 scheduler advancement. Execution **293850** (prior STOP artifact) was **not** permanently stuck — it admitted in **18 ms** and completed in **372 ms**. Execution **293872** (WF40) remained `new` for **5+ minutes** with zero `running`/`waiting` peers and no supported native bounded repair available without auth or forbidden DB/restart operations.

## Section 2 — execution config

| Item | Value |
|---|---|
| n8n version | **2.19.5** |
| Execution mode | **regular** (no `EXECUTIONS_MODE`; no queue/Redis containers) |
| Task runners | `N8N_RUNNERS_ENABLED=true` (deprecated warning in logs); internal JS task runner process present |
| Broker | `127.0.0.1:5679` listening |
| Worker role | none (single main process + task-runner child) |
| Production concurrency env | not set (default) |
| Settings DB | no execution-concurrency overrides found |

## Section 3 — execution 293850 (sanitized)

| Field | Value |
|---|---|
| workflowId | `9ZMj2ACTKyDVhCue` (**WF40**) |
| mode | `trigger` |
| status | `success` (terminal at diagnosis time) |
| createdAt | `2026-09-01 00:48:02.006Z` |
| startedAt | `2026-09-01 00:48:02.024Z` (admit **18 ms**) |
| stoppedAt | `2026-09-01 00:48:02.396Z` (run **372 ms**) |
| execution_data | present (len 16195) |
| trigger class | WF40 1-minute schedule trigger |

**Conclusion:** 293850 was a **transient** `new` observation during polling, not a permanent stall.

## Section 4 — compare 293807 vs 293850

| | 293807 | 293850 |
|---|---|---|
| workflowId | `HVCzN3FoBdLGe9Hx` (**WF42**) | `9ZMj2ACTKyDVhCue` (**WF40**) |
| mode | `trigger` | `trigger` |
| terminal status | `success` | `success` |
| admit latency | ~152 ms | ~18 ms |
| run duration | ~472 ms | ~372 ms |
| execution_data | present | present |
| prior STOP observation | reported `new`/null (transient or since resolved) | reported `new`/null (transient) |

**Same phenotype:** production schedule trigger row created, briefly or permanently stays `new` with `startedAt=null`, scheduler lane halts until row clears. **Different workflow IDs** but **equivalent engine admission failure class** — not `STUCK_EXECUTIONS_NOT_EQUIVALENT`.

## Section 5 — global nonterminal state (at 01:04 UTC)

| id | workflow | status | age | startedAt |
|---|---|---|---|---|
| **293872** | WF40 | `new` | **5+ min** | null |

- `running`=0 · `waiting`=0
- No concurrency slot occupied by active execution
- WF40 ticks halted after 293872 creation; WF42 last success 293871 at 00:59:00

## Section 6 — logs

Bounded window `00:58:30–01:03:30Z`: **no** structural log lines referencing 293872, admission, concurrency, broker, or runner pickup (silent failure).

## Section 7 — root cause classification

**Primary: D — `PRODUCTION_EXECUTION_CREATED_BUT_NEVER_ADMITTED`**

**Escalation: G — `N8N_2_19_5_EXECUTION_ENGINE_DEFECT_LIKELY`**

Evidence:
- Recurring `new`/null admissions on WF40 production triggers
- No legitimate running/waiting blocker
- Publish state valid; scheduler healthy between incidents (27+ consecutive WF40 successes 293820–293870)
- Native `POST /rest/executions/:id/stop` exists in 2.19.5 dist but returns **401**; `user_api_keys` table **empty** — no supported bounded repair without forbidden SQL or container restart
- No `n8n execution` CLI in 2.19.5

## Section 8 — repair

**Not performed.** No proven supported native operation available under task constraints.

## Sections 9–11

Not reached. Scheduler currently stalled at 293872. Live proof not armed.

## NEXT

`V4_N8N_CONTROLLED_UPGRADE_AND_WF40_REGRESSION_PROOF`
