# LAST CURSOR REPORT

**BLOCK-ID:** `V4_QWEN_AGG_RUNTIME_ROLE_CORRECTION_DCFR_SHORT_TURN`  
**Classification:** `V4_QWEN_AGG_RUNTIME_ROLE_CORRECTION_PASS`  
**Timestamp (local):** 2026-09-03

## Summary

Applied the AGG empirical runtime role correction: DCFR IQ3 is NOT suitable
for short-turn interactive agent workloads (~19–20 s prefill for a 34-token
prompt; ~4.8–5.0 tok/s short decode; identical at ctx 16K/8K), while its
long-workload benchmark remains valid (~87–90 tok/s cold prefill at 2K–8K;
~12.56 tok/s long decode).

- New machine overlay `configs/resources/qwen-role-qualification.json`
  (`qwen38-rtx3060-2026-09-03-agg`): FAST_AGENT / FAST_INTERACTIVE /
  FAST_AGENT_SHORT_TURN = **UNQUALIFIED**; FAST_THROUGHPUT_LONG_TASK =
  **QUALIFIED**; pending comparison set = Original AR 16K / OPUS Daily 16K /
  OPUS Agent 24K.
- Fail-closed gates added at: dispatch (`PROFILE_ROLE_UNQUALIFIED`), WF40
  proposal (no register-pending), authorization minting (no ACTIVE envelope),
  OpenCode adapter (`ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION` before occupancy/
  guard/runner), WF40 live seam node source.
- Next-WF40-executor mapping marked **STALE** (`STALE_UNQUALIFIED_PENDING_
  REQUALIFICATION`) — it must not govern the next live execution proof.
- Scope v2 digest **unchanged** (`5261290c…e02261`); qualification is a
  separate layer, not a scope mutation.
- DCFR NOT deleted/retired; NO silent replacement; all six production profiles
  and router/runtime paths preserved; Blender NOT introduced.
- New suite `tests/qwen-role-qualification-agg` 19/19 PASS; all 34 suites
  re-run PASS (adapter 24/24, dispatch ALL, sidecars 29/29, endpoint 65/65,
  router 15/15, bridge 18/18, 6-profile-router 25/25, …).
- Real Qwen generations: **0** · OpenCode executions: **0** · register deltas:
  **0** · Telegram/provider calls: **0**.

## NEXT

`V4_QWEN_SHORT_TURN_PROFILE_COMPARISON_RETAINED_PROFILES`

Evidence report:
`reports/architecture/v4_qwen_agg_runtime_role_correction_dcfr_short_turn.md`
