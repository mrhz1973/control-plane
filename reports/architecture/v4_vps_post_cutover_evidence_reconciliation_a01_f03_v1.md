# V4 post-cutover evidence reconciliation — A01 / F03

**TASK_REF:** `V4_VPS_POST_CUTOVER_EVIDENCE_RECONCILIATION_A01_F03_V1`
**Issue:** #68
**Dispatch:** [comment 5571597712](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5571597712)
**BASE_HEAD:** `33cc2ce44f30c5f19542f704dd5f35ae40188607`
**Classification:** `PASS`

```text
EVIDENCE_RECONCILIATION=PASS
SOAK_DELTA_RECONCILIATION=PASS
SOAK_29_COHORT_RECONCILIATION=PASS
SOAK_EXTRA_8_RECONCILIATION=PASS
BOUNDARY_WF90_RECONCILIATION=PASS
PRUNING_RECONCILIATION=PLAUSIBLE_NOT_PROVEN
PRUNING_IMPLIED_REMOVED_ROWS=308
F03_RECOUNT=PASS_32_2
F03_CURRENT_ROLLUP_CORRECTED=PASS
CUTOVER=PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
DUAL_WRITER_RISK=NO
ROLLBACK_RETENTION=OPEN
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
RUNTIME_MUTATIONS=0
SECRET_VALUES_EXPOSED=0
```

This checkpoint used read-only PostgreSQL metadata, bounded n8n configuration/log inspection, and current-state documentation corrections. It did not rerun the soak or mutate either runtime.

## Preflight

```text
branch=main
HEAD=33cc2ce44f30c5f19542f704dd5f35ae40188607
origin/main=33cc2ce44f30c5f19542f704dd5f35ae40188607
tracked_tree=clean
```

## A01 — complete execution cohort

Canonical boundaries:

```text
SOAK_START=2026-09-07T12:48:37Z
SOAK_END=2026-09-07T13:01:35Z
NATURAL_DRAIN_END=2026-09-07T13:02:57Z
SOAK_ID_RANGE=313109-313145
SOAK_TOTAL_DELTA=37
```

All 37 rows still survived in `execution_entity`. Only `id`, `workflowId`, `status`, timestamps, and mode were read.

| ID | Workflow | Started UTC | Stopped UTC | Status | Bucket |
|---:|---|---|---|---|---|
| 313109 | WF42 | 12:49:00 | 12:49:00 | success | IN_SOAK_WINDOW |
| 313110 | WF40 | 12:49:02 | 12:49:02 | success | IN_SOAK_WINDOW |
| 313111 | WF42 | 12:50:00 | 12:50:00 | success | IN_SOAK_WINDOW |
| 313112 | WF40 | 12:50:02 | 12:50:03 | success | IN_SOAK_WINDOW |
| 313113 | WF90 | 12:50:41 | 12:52:55 | success | IN_SOAK_WINDOW |
| 313114 | WF42 | 12:51:00 | 12:51:00 | success | IN_SOAK_WINDOW |
| 313115 | WF40 | 12:51:02 | 12:51:03 | success | IN_SOAK_WINDOW |
| 313116 | WF42 | 12:52:00 | 12:52:00 | success | IN_SOAK_WINDOW |
| 313117 | WF40 | 12:52:02 | 12:52:03 | success | IN_SOAK_WINDOW |
| 313118 | WF42 | 12:53:00 | 12:53:00 | success | IN_SOAK_WINDOW |
| 313119 | WF40 | 12:53:02 | 12:53:03 | success | IN_SOAK_WINDOW |
| 313120 | WF42 | 12:54:00 | 12:54:00 | success | IN_SOAK_WINDOW |
| 313121 | WF40 | 12:54:02 | 12:54:03 | success | IN_SOAK_WINDOW |
| 313122 | WF42 | 12:55:00 | 12:55:00 | success | IN_SOAK_WINDOW |
| 313123 | WF40 | 12:55:02 | 12:55:02 | success | IN_SOAK_WINDOW |
| 313124 | WF90 | 12:55:41 | 12:57:54 | success | IN_SOAK_WINDOW |
| 313125 | WF42 | 12:56:00 | 12:56:00 | success | IN_SOAK_WINDOW |
| 313126 | WF40 | 12:56:02 | 12:56:03 | success | IN_SOAK_WINDOW |
| 313127 | WF42 | 12:57:00 | 12:57:00 | success | IN_SOAK_WINDOW |
| 313128 | WF40 | 12:57:02 | 12:57:02 | success | IN_SOAK_WINDOW |
| 313129 | WF42 | 12:58:00 | 12:58:00 | success | IN_SOAK_WINDOW |
| 313130 | WF40 | 12:58:02 | 12:58:03 | success | IN_SOAK_WINDOW |
| 313131 | WF42 | 12:59:00 | 12:59:00 | success | IN_SOAK_WINDOW |
| 313132 | WF40 | 12:59:02 | 12:59:02 | success | IN_SOAK_WINDOW |
| 313133 | WF42 | 13:00:00 | 13:00:00 | success | IN_SOAK_WINDOW |
| 313134 | WF40 | 13:00:02 | 13:00:03 | success | IN_SOAK_WINDOW |
| 313135 | WF90 | 13:00:41 | 13:02:57 | success | IN_SOAK_WINDOW |
| 313136 | WF42 | 13:01:00 | 13:01:00 | success | IN_SOAK_WINDOW |
| 313137 | WF40 | 13:01:02 | 13:01:03 | success | IN_SOAK_WINDOW |
| 313138 | WF42 | 13:02:00 | 13:02:00 | success | POST_WINDOW_NATURAL_DRAIN |
| 313139 | WF40 | 13:02:02 | 13:02:02 | success | POST_WINDOW_NATURAL_DRAIN |
| 313140 | WF42 | 13:03:00 | 13:03:00 | success | OTHER_EXPLAINED |
| 313141 | WF40 | 13:03:02 | 13:03:03 | success | OTHER_EXPLAINED |
| 313142 | WF42 | 13:04:00 | 13:04:00 | success | OTHER_EXPLAINED |
| 313143 | WF40 | 13:04:02 | 13:04:02 | success | OTHER_EXPLAINED |
| 313144 | WF42 | 13:05:00 | 13:05:01 | success | OTHER_EXPLAINED |
| 313145 | WF40 | 13:05:02 | 13:05:03 | success | OTHER_EXPLAINED |

All rows were mode `trigger`.

### Recomputed buckets

| Bucket | WF40 | WF42 | WF90 | Total | Status |
|---|---:|---:|---:|---:|---|
| IN_SOAK_WINDOW | 13 | 13 | 3 | 29 | all success |
| POST_WINDOW_NATURAL_DRAIN | 1 | 1 | 0 | 2 | all success |
| OTHER_EXPLAINED | 3 | 3 | 0 | 6 | all success |
| UNEXPLAINED | 0 | 0 | 0 | 0 | n/a |

The six `OTHER_EXPLAINED` rows are ordinary one-minute WF42/WF40 schedule pairs started at 13:03, 13:04, and 13:05. Their inclusion proves the final `max_id=313145` snapshot was taken after 13:05, not exactly at `NATURAL_DRAIN_END`.

The boundary run was:

```text
BOUNDARY_WF90_EXECUTION_ID=313135
startedAt=2026-09-07T13:00:41Z
stoppedAt=2026-09-07T13:02:57Z
status=success
```

It started within the soak window, was running at `SOAK_END`, and completed exactly at the documented drain endpoint. It therefore remains one of the three in-window WF90 executions.

```text
SOAK_IN_WINDOW_COUNT=29
SOAK_POST_WINDOW_DRAIN_COUNT=2
SOAK_OTHER_EXPLAINED_COUNT=6
SOAK_UNEXPLAINED_COUNT=0
```

The original statement “29 natural executions during the window” is correct. The later count/max snapshot includes eight additional natural schedule executions after the window: two during the WF90 drain and six after the defined drain endpoint.

## Execution count reduction and pruning

Published snapshots give:

```text
CUTOVER_COUNT=10180
CUTOVER_MAX_ID=312844
SOAK_BASELINE_COUNT=10136
SOAK_BASELINE_MAX_ID=313108
NEW_IDS_ALLOCATED=264
NO_DELETE_EXPECTED_COUNT=10180+264=10444
OBSERVED_COUNT=10136
PRUNING_IMPLIED_REMOVED_ROWS=10444-10136=308
```

Current read-only PostgreSQL inspection confirms every ID `312845–313108` survives: 264 rows over a contiguous span of 264, all without `deletedAt`. Thus the 308-row reduction is exact arithmetically and concerns older rows, not missing IDs in the new interval.

No explicit pruning environment override is present for the five inspected keys. The installed n8n 2.33.3 configuration source therefore supplies these effective defaults:

```text
pruneData=true
pruneDataMaxAge=336 hours
pruneDataMaxCount=10000
hardDeleteInterval=15 minutes
softDeleteInterval=60 minutes
```

The bounded historical n8n log window `10:49Z–12:49Z` contains no pruning/deletion message. Current DB shape corroborates an active count-based soft/hard pruning process:

```text
total rows=10171
non-soft-deleted rows=10039
soft-deleted rows=132
min_id=303105
max_id=313275
contiguous_span=10171
soft-deleted IDs=303105–303236
single deletedAt timestamp=2026-09-07T13:46:36.113Z
```

This proves pruning is enabled by the effective default and visibly operating now. It does not provide a historical log or surviving tombstones for the exact earlier 308 hard-deleted rows. Therefore:

```text
PRUNING_RECONCILIATION=PLAUSIBLE_NOT_PROVEN
```

The 308-row removal is arithmetically established; attribution of that exact historical batch to pruning is strongly config/DB-supported but not overclaimed as exact proof.

## F03 mechanical recount

The historical C01–C34 table itself was not rewritten. Its literal dispositions mechanically produce:

```text
MIGRATED_VALIDATED=C01-C30,C33,C34
OBSOLETE_CONFIRMED_NOT_REQUIRED=C31,C32
```

No other disposition appears.

```text
F03_CENSUS_DENOMINATOR=34
F03_MIGRATED_VALIDATED=32
F03_PRESENT_NOT_VALIDATED=0
F03_MISSING=0
F03_OBSOLETE_NEEDS_HUMAN_DECISION=0
F03_OBSOLETE_CONFIRMED_NOT_REQUIRED=2
F03_RESOLVED_SUPERSEDED=0
SUM=34
ROLLUP_COUNTS_STATUS=RECONCILED_AFTER_CODEX_RECOUNT_32_2
```

The registry projection remains separately valid:

```text
REGISTRY_ROW_DENOMINATOR=21
REGISTRY_ROW_MIGRATED_VALIDATED=20
REGISTRY_ROW_OBSOLETE_CONFIRMED_NOT_REQUIRED=1
```

No component disposition was changed to force arithmetic.

## Final live invariants

```text
NEW n8n health=200
NEW PostgreSQL=healthy
NEW publication map count=4
NEW publication ID/version pairs=exact frozen map
OLD n8n=exited
OLD 127.0.0.1:5678=absent
OLD PostgreSQL=healthy
OLD executions=10176
OLD max_execution_id=312840
DUAL_WRITER_RISK=NO
```

Semantics are now explicit:

```text
OLD_N8N_STOPPED_BY_AUTHORIZED_CUTOVER=YES
OLD_CHANGED_BY_POST_CUTOVER_DIAGNOSTIC_OR_SOAK=NO
```

The historical production cutover was an authorized OLD writer mutation. This reconciliation performed zero runtime mutations. Cutover PASS and post-cutover soak PASS remain supported; rollback retention stays open.
