# V4 n8n admission internal trace

**Task ref:** `V4_N8N_ADMISSION_INTERNAL_TRACE`
**Run nonce:** `N8N_ADMISSION_TRACE_20260901_01`
**Base:** `dfd715eb9f52b2f6621faf277b241c1e3d7204c9`
**n8n version:** `2.33.3`
**Result:** `TRACE_WINDOW_NO_STALL_REPRODUCED`

This is a diagnostic PASS: the bounded trace completed correctly. It is not
evidence that the intermittent production defect is repaired.

## Safety precheck

- `HEAD == origin/main == dfd715e`
- WF40 `9ZMj2ACTKyDVhCue`: active, published/current
  `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1`, 83 nodes, one enabled
  Schedule Trigger
- WF61 inactive
- D-0025 gate CLOSED (`enabled=false`, authorized calls `0`)
- ACTIVE runtime authorizations `0`
- no provider, register, Telegram, OpenCode, or Qwen activity

## Exact installed admission path

The installed compiled JavaScript and source maps mechanically establish:

```text
ActiveExecutions.add
  -> ExecutionPersistence.create
  -> ConcurrencyCapacityReservation.reserve
       -> ConcurrencyControlService.throttle
  -> ExecutionRepository.setRunning
  -> ActiveExecutions.add return
```

| Runtime file | Stock SHA-256 | Upstream-equivalent source map |
|---|---|---|
| `dist/active-executions.js` | `8d7fbe4cf5add84f0b99053006c9756da20e7afee1ebffdc94f473e7a6e344e5` | `src/active-executions.ts` |
| `dist/executions/execution-persistence.js` | `b46cc7f284ec3437bc1dec136bb58f93bd0ff8d6da3a8b50d9a17b3ff62aa69d` | `src/executions/execution-persistence.ts` |
| `dist/concurrency/concurrency-capacity-reservation.js` | `ef3f1b31ce5496452b46d9aac9ca4a81d989e083d9581ef5f7a8a684f5a72c4b` | `src/concurrency/concurrency-capacity-reservation.ts` |
| `dist/concurrency/concurrency-control.service.js` | `c1c76fdcadd5d5106fefab61008c965a506440ee78cc8789a010b778103e5c42` | `src/concurrency/concurrency-control.service.ts` |
| `@n8n/db/dist/repositories/execution.repository.js` | `d1d2a423cccdf439782fc4459c9378b8e6381ac0e52e75b8a3024346f2df5ffd` | `src/repositories/execution.repository.ts` |

`ActiveExecutions.add` lines 63–70 perform `create`, `reserve`, then
`setRunning`. `ConcurrencyControlService.throttle` returns immediately when
concurrency is disabled/unlimited. `ExecutionRepository.setRunning` sets
`status=running` and `startedAt` in a database transaction.

## Temporary instrumentation

The temporary image was derived from the exact stock digest:

```text
docker.n8n.io/n8nio/n8n@sha256:769d3a624534ff8b5f3316ef71d4653f48794c47e4339436be7a308d6d6a1cc9
```

Instrumentation added compact JSON logging only around the existing awaits:

- `TRACE_ACTIVE_ADD_ENTER`
- `TRACE_CREATE_BEGIN` / `TRACE_CREATE_END`
- `TRACE_RESERVE_BEGIN` / `TRACE_RESERVE_END`
- `THROTTLE_ENTER` / `THROTTLE_RETURN_NO_QUEUE`
- `THROTTLE_ENQUEUE_BEGIN` / `THROTTLE_ENQUEUE_END`
- `TRACE_SET_RUNNING_BEGIN` / `TRACE_SET_RUNNING_END`
- `TRACE_ACTIVE_ADD_RETURN`
- sanitized error-class events

No branch condition, promise ordering, timeout, concurrency, SQLite setting, or
workflow behavior was changed. Only `root-n8n-1` was recreated; the
`litellm-primary` container ID remained unchanged.

Private trace material is outside the repository at:

```text
/root/n8n-admission-traces/N8N_ADMISSION_TRACE_20260901_01/evidence
```

It contains only sanitized structural traces, execution metadata, health
measurements, hashes, and stock container/image metadata.

## Bounded reproduction window

| Field | Value |
|---|---|
| Started | `2026-09-01T01:34:31.159187Z` |
| Ended | `2026-09-01T02:04:01.756124Z` |
| Duration | `1770.597 s` |
| Stop condition | 30 consecutive terminal WF40 executions |
| WF40 executions | 30 (`293943` through `294001`, odd IDs) |
| Stall execution | none |
| `new` + null `startedAt` ≥30 seconds | 0 |
| Health failures | 0 |
| Maximum health latency | `17.879 ms` |
| SQLite | WAL, effective pool size 3 |
| Production concurrency | disabled/unlimited |

All 30 observed WF40 executions left `new`, obtained a non-null `startedAt`,
and completed terminally. The scheduler advanced after every execution.

## Structural trace summary

The window captured 61 natural trigger executions (31 WF40 trace sequences,
including one before the observer baseline, and 30 WF42 sequences), producing
732 sanitized trace events.

| Stage | Count | Maximum duration |
|---|---:|---:|
| `TRACE_ACTIVE_ADD_ENTER` | 61 | — |
| `TRACE_CREATE_BEGIN` / `TRACE_CREATE_END` | 61 / 61 | `11.947 ms` |
| `TRACE_RESERVE_BEGIN` / `TRACE_RESERVE_END` | 61 / 61 | `0.164 ms` |
| `THROTTLE_ENTER` / `THROTTLE_RETURN_NO_QUEUE` | 61 / 61 | `0.067 ms` |
| `THROTTLE_ENQUEUE_BEGIN` / `END` | 0 / 0 | — |
| `TRACE_SET_RUNNING_BEGIN` / `END` | 122 / 122 | `3.710 ms` |
| `TRACE_ACTIVE_ADD_RETURN` | 61 | `14.225 ms` |
| traced errors | 0 | — |

`setRunning` appears twice per trigger: once inside `ActiveExecutions.add` and
once in the subsequent workflow-runner path. Both calls completed for every
observed execution.

## Primary boundary classification

**`TRACE_WINDOW_NO_STALL_REPRODUCED`**

No evidence-backed blocked boundary can be assigned because no ≥30-second
stall occurred. Instrumentation alone is not a repair and the known
intermittent failure remains unresolved.

## Stock restoration

After the trace window:

- restored exact stock `docker.n8n.io/n8nio/n8n:2.33.3`
- verified image digest `sha256:769d3a624534ff8b5f3316ef71d4653f48794c47e4339436be7a308d6d6a1cc9`
- verified all five runtime file hashes match the pre-trace stock hashes
- removed the temporary trace image and build overlay
- recreated only `root-n8n-1`
- verified WF40 active/current, 83 nodes, Schedule Trigger present
- verified WF61 inactive, gate CLOSED, ACTIVE authorization count 0

## Next

`V4_N8N_POSTGRES_CANARY_AND_ADMISSION_PROOF`
