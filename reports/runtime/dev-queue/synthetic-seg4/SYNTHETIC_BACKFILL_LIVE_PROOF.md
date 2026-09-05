# V4 LOCAL DEV EXECUTOR — SYNTHETIC IDLE-BACKFILL LIVE PROOF (SEGMENT 4)

- **Task**: `V4_LOCAL_DEV_EXECUTOR_IDLE_BACKFILL_SYNTHETIC_ITEM_INJECTION`
- **Verdict**: **PASS** (both sequences; terminal CLEAN IDLE at seq3 evaluation)
- **Date**: 2026-09-05
- **Base dispatch head**: `6b34ec6` (= segment-3 close)

## Implementation pass (43da4f2)

`tools/local-dev-idle-backfill-v1.mjs` — runtime-capable synthetic idle-backfill
injector. Composition primitive only; NO second executor, NO bypass of
selector/claim/bridge/executor. Single source of truth for the pinned LAW
(`local-dev-idle-backfill-policy-v1`): the 10/10 policy suite now imports
`decideBackfill`/`DEFAULT_POLICY` from the tool itself (semantics pinned by
`PINNED_DEFAULTS` deep-equal assertion, P8).

New suite `tests/local-dev-idle-backfill-injection-v1/run.mjs`: **21/21 PASS**
covering all 20 mandated scenarios (injection, preemption, disable, scope,
traversal, never_touch, idempotency, deterministic sequence, cap-3,
backlog-item-v1 equivalence, normal selector/bridge/claim, MODIFY/create
class progression, production wall, malformed evidence, conflict-by-construction,
persist-window preemption, provenance, no production imports).

Dispatcher hardening: `tools/dispatch-local-dev-queue-loop-v1.mjs` now derives
`source_ref` from the real queue path (`backlog_path`) instead of assuming the
test fixture directory.

All 11 LOCAL_DEV suites green at pass-1 commit (162 tests).

## LIVE proof seq1 — CREATE route (73d124c)

```
CLEAN_DRAINED (reports/runtime/dev-queue/synthetic-seg4)
→ backfill decision  = BACKFILL_SYNTHETIC (seq=1, segment=seg4)
→ synthetic item     = SYNTHETIC_D-9101-341BD424.md (backlog-item-v1, schema-identical)
→ normal selector    = ADMISSIBLE_VIA_NORMAL_SELECTOR (isAdmissible, same gates)
→ normal claim       = dispatch loop LOCAL_DEV_B_D-9101-341BD424 → receipts.json
→ normal bridge      = local-dev-task-envelope-v1 (task_kind=CREATE)
→ normal executor    = local-dev-executor-v1 + OpenCode + qwen38-opus-q3-cline-24k
→ created            = docs/runtime/AUTOVIA_SYNTHETIC_HEARTBEAT.md (exact marker line)
→ test               = git diff --check (clean)
→ executor commit    = 73d124c executor-pass: LOCAL_DEV_B_D-9101-341BD424
→ push + remote verify = 73d124c == origin/main
```

Markers: `SYNTHETIC_ITEM_CREATED=YES` · `REAL_READY_PREEMPTED=NO` ·
`NORMAL_SELECTOR_USED=YES` · `NORMAL_CLAIM_USED=YES` · `NORMAL_BRIDGE_USED=YES` ·
`NORMAL_EXECUTOR_USED=YES` · `PRODUCTION_CHANGED=NO`.
Executor: 5 turns / 106s / 40 preexisting untracked protected / router already
running (no launch). Two mechanical bookkeeping STOPs preceded the PASS
(tracked-dirty receipts → bookkeeping commit + untracked `.run.json` envelope
rebase; same delegated-repair class as dispatch1/dispatch2).

## AUTO-VIA continuation seq2 — MODIFY route (4b7cff0)

Queue again CLEAN_DRAINED (seq1 claimed). Injector derived the deterministic
NEXT sequence: `append_marker_line` (heartbeat now exists on disk → distinct
objective class, distinct collision-safe ID `D-9102-3FCE48B0`).

```
→ BACKFILL_SYNTHETIC seq=2 → SYNTHETIC_D-9102-3FCE48B0.md → normal selector/claim/bridge
→ executor MODIFY: appended exactly one line; pre-existing seq=1 line UNCHANGED
→ 5 turns / 136s / 38 protected → 4b7cff0 == origin/main (REMOTE_VERIFIED)
```

Both V1 authoring classes (`create_marker_file`, `append_marker_line`) are now
live-proven end-to-end through the normal pipeline.

## Terminal evaluation (no seq3)

At seq3 the only mechanically-derivable candidate would be a third marker
append: same class as seq2, no new canonical-evidence need, executed minutes
after seq2. That is manufactured work — forbidden by the authoring law
("terminate CLEAN IDLE even if cap remains"). Segment synthetics = 2/3; cap
NOT reached; termination is on the no-valid-candidate branch.

## Idempotency evidence

- Same canonical state → same deterministic ID (`shortSha(segment|seq|head)`) →
  file-collision AND receipt-collision guards (proven by T7 + T8).
- Completed synthetic → deterministic distinct next sequence (T14, live seq2).
- Real READY appearing in the persist window → REAL_WORK_PREEMPTED, inert
  artifact, normal work dispatched (T18).

## Production wall

`never_touch` preserved (tools/configs/scripts/.github); scope prefix
`docs/runtime/` unchanged; D-0025=false; n8n untouched; no production-domain
import in the injector (T20). Policy widening remains a GPT-WEB/operator gate
(NOT delegated to auto-repair).
