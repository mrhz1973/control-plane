# V4 VPS — independent Codex A01/F03 review closure

TASK_REF: `V4_VPS_CODEX_A01_F03_REVIEW_CLOSURE_V1`

TASK_KIND: `CHECKPOINT_DELTA` · MODE: `REPO_ONLY_INDEPENDENT_EVIDENCE_REVIEW` · CATEGORY: `DELICATO`

Reviewer: Codex, independent repository review, not a Cursor execution or a live VPS test. Date: `2026-09-07`.

Repository: `mrhz1973/control-plane`, branch `main`. DISPATCH_BASE_HEAD / reviewed HEAD: `dd6c2d4f53d416d2227ffdc940a9397d3b76c3b5`.

Dispatch: [#68 comment 5572048180](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5572048180).

## Result and scope

```text
CODEX_A01_F03_REVIEW_CLOSURE=PASS
A01_REVIEW=PASS
SOAK_29_PLUS_8_RECONCILIATION=PASS
BOUNDARY_WF90_REVIEW=PASS
PRUNING_RECONCILIATION=PLAUSIBLE_NOT_PROVEN
F03_REVIEW=PASS_32_2
CURRENT_STATE_CORRECTION=PASS
PREVIOUS_CODEX_BLOCKER_STATUS=CLOSED_A01_F03_BY_SUPERSEDING_EVIDENCE
CUTOVER=PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
ROLLBACK_RETENTION=OPEN
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
RUNTIME_MUTATIONS=0
SSH_CALLS=0
SECRET_VALUES_EXPOSED=0
```

The previous `CODEX_FINAL_POST_CUTOVER_AUDIT=BLOCKED_EVIDENCE` is closed with respect to A01 and A02/F03 by superseding evidence. This is a bounded review of those two findings, not a new full post-cutover audit. Other historical observations are not re-adjudicated. The original audit remains unchanged. No soak rerun was required or performed; rollback retention remains open and #68 remains open.

## Preflight and evidence

`git fetch origin main`, `git ls-remote origin refs/heads/main`, and `git rev-parse HEAD origin/main` confirmed the exact dispatch base on `main`, with a clean tracked tree and empty index. Existing untracked files were excluded from this change.

Read README AI-BOOT, CURRENT_FRONTIER, CURRENT_VPS_STATE, the previous independent audit and the reconciliation report. Bounded expansion covered the original F03 table, registry row dispositions to verify its separate denominator, and LAST_CURSOR_REPORT for the required pointer update.

Canonical sources at the reviewed HEAD:

- [Previous audit](v4_vps_codex_final_post_cutover_evidence_audit_v1.md), findings A01 and A02.
- [Reconciliation report](v4_vps_post_cutover_evidence_reconciliation_a01_f03_v1.md), complete execution cohort, pruning caveat and F03 recount.
- [Original F03 table](v4_vps_parallel_old_new_validation_f03_f04_f05_v1.md), C01–C34 and historical summary.
- [Current VPS state](../../docs/vps/CURRENT_VPS_STATE.md) and [registry projection](../../docs/vps/PROJECT_VPS_REGISTRY.md).
- [Remediation dispatch 5571597712](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5571597712), [reconciliation outcome 5571876505](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5571876505), and review dispatch above. The outcome points to the exact reviewed commit and agrees with the report.

The underlying PostgreSQL/config/log inspection is evidence reported by the executor. Codex independently checks its repository contents and arithmetic; it does not claim to have reproduced that inspection on either VPS.

## A01 — exact cohort and boundary

Mechanical parsing of the 37 individual rows found 37 unique IDs, no missing ID in `313109–313145`, and all statuses `success`. The report records mode `trigger` for every row. Buckets were recomputed from UTC clock times on the common date 2026-09-07, independently of the supplied bucket labels: zero mismatches.

Canonical start/end: `12:48:37Z–13:01:35Z`; natural drain endpoint: `13:02:57Z`.

| Recomputed bucket | IDs | WF40 | WF42 | WF90 | Total |
|---|---|---:|---:|---:|---:|
| IN_SOAK_WINDOW | 313109–313137 | 13 | 13 | 3 | 29 |
| POST_WINDOW_NATURAL_DRAIN | 313138–313139 | 1 | 1 | 0 | 2 |
| OTHER_EXPLAINED | 313140–313145 | 3 | 3 | 0 | 6 |
| UNEXPLAINED | none | 0 | 0 | 0 | 0 |

Thus `29 + 2 + 6 = 37`, also matching `313145 - 313108 = 37` and the previously published count delta `10173 - 10136 = 37`. The eight extra executions are exactly `313138–313145`.

Boundary WF90 `313135` started at `2026-09-07T13:00:41Z`, stopped at `2026-09-07T13:02:57Z`, status `success`, duration 136 seconds. It began within the canonical window, was still running at its end, and completed exactly at the drain endpoint. Inclusion among the three in-window WF90 executions is supported.

IDs 313138/313139 started at 13:02:00/13:02:02 during drain. IDs 313140–313145 are the WF42/WF40 minute pairs at 13:03, 13:04 and 13:05, all after the drain endpoint; the last row starts 13:05:02 and stops 13:05:03. Therefore a snapshot containing max ID 313145 necessarily follows the canonical drain endpoint. An exact original snapshot wall-clock timestamp is not recovered, but the surviving rows establish the temporal distinction needed to reconcile the count. No unexplained execution or contradiction remains in this cohort.

## Pruning — acceptable bounded caveat

```text
CUTOVER_COUNT=10180
CUTOVER_MAX_ID=312844
SOAK_BASELINE_COUNT=10136
SOAK_BASELINE_MAX_ID=313108
NEW_IDS=313108-312844=264
NO_DELETE_EXPECTED_COUNT=10180+264=10444
IMPLIED_REMOVED_ROWS=10444-10136=308
PRUNING_RECONCILIATION=PLAUSIBLE_NOT_PROVEN
```

The report records all 264 IDs in `312845–313108` surviving contiguously without deletedAt. This supports the new-row term and places the implied reduction in older rows. It records no override of the five inspected pruning keys and effective installed n8n 2.33.3 defaults: enabled, max age 336 hours, max count 10000, hard/soft delete intervals 15/60 minutes.

The reported current DB shape has 10171 rows over the contiguous span `303105–313275`, comprising 10039 non-soft-deleted plus 132 soft-deleted rows. The 132 oldest IDs `303105–303236` share deletedAt `2026-09-07T13:46:36.113Z`. These numbers reconcile and support currently operating pruning. The bounded historical log window 10:49Z–12:49Z has no pruning/deletion message, and surviving tombstones do not identify the earlier 308-row batch.

The 308-row reduction is arithmetically supported; its exact historical attribution to pruning is plausible, not proven. The reconciliation report explicitly preserves that distinction. Under this dispatch it is a nonblocking caveat once the exact soak cohort is reconciled.

## F03 — original dispositions and distinct registry

Mechanical parsing verified exactly one row for each C01–C34 and each required disposition:

```text
MIGRATED_VALIDATED=C01-C30,C33,C34
OBSOLETE_CONFIRMED_NOT_REQUIRED=C31,C32
F03_CENSUS_DENOMINATOR=34
F03_MIGRATED_VALIDATED=32
F03_OBSOLETE_CONFIRMED_NOT_REQUIRED=2
F03_PRESENT_NOT_VALIDATED=0
F03_MISSING=0
F03_OBSOLETE_NEEDS_HUMAN_DECISION=0
REGISTRY_ROW_DENOMINATOR=21
REGISTRY_ROW_MIGRATED_VALIDATED=20
REGISTRY_ROW_OBSOLETE_CONFIRMED_NOT_REQUIRED=1
```

The original F03 report has no Git diff between the previous Codex audit commit `33cc2ce44f30c5f19542f704dd5f35ae40188607` and the reviewed base. No component disposition was changed to force the arithmetic. Its historical 31/3 summary remains preserved as provenance and is superseded by the corrected current 32/2 projection. C30 remains validated in its inactive `KEEP_STAGED_PENDING` role. The separately parsed registry produces 20 migrated and one obsolete over 21 rows; these aggregate rows are not substituted for the census denominator.

## Current state and persistence

At the reviewed base CURRENT_VPS_STATE already carries all seven required corrected fields: `EVIDENCE_RECONCILIATION=PASS`, `SOAK_EVIDENCE=RECONCILED_EXACT_29_PLUS_8`, `MIGRATED_VALIDATED=32`, `OBSOLETE_CONFIRMED_NOT_REQUIRED=2`, `ROLLUP_COUNTS_STATUS=RECONCILED_AFTER_CODEX_RECOUNT_32_2`, `F03_RECOUNT=PASS_32_2`, and `F03_CURRENT_ROLLUP_CORRECTED=PASS`. Cutover PASS, NEW LIVE, OLD frozen rollback standby, retention OPEN/no automatic expiry and both decommission NO fields are preserved.

This review adds only its report and minimum current pointers in LAST_CURSOR_REPORT, CURRENT_FRONTIER and CURRENT_VPS_STATE. The active status is independent closure PASS; the earlier BLOCKED_EVIDENCE remains explicitly historical and closed only for A01/F03. The historical audit and original F03 report remain unchanged. No authorization to exit retention, decommission OLD, activate OpenClaw or close #68 is implied.

Repository closure: verify the four-file diff and whitespace, selectively stage, commit with exact subject `codex-audit: V4_VPS_CODEX_A01_F03_REVIEW_CLOSURE_V1`, push main, verify remote HEAD and post the authorized #68 evidence pointer. Concrete commit and comment references are supplied in the final response and issue pointer.
