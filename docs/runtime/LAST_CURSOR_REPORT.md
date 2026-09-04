# LAST CURSOR REPORT

**BLOCK-ID:** `V4_QWEN_SHORT_TURN_LIVE_COMPARISON_RETAINED_PROFILES`  
**RUN_NONCE:** `QWEN_SHORT_TURN_LIVE_COMPARE_20260904_01`  
**Classification:** `SHORT_TURN_LIVE_COMPARISON_COMPLETE_OPERATOR_DECISION_REQUIRED`  
**Timestamp (local):** 2026-09-04

## Summary

Ran exactly six bounded streamed requests through the canonical
`http://127.0.0.1:8080`: two per retained profile, fixed order, no warmup and
no retry. The router was OFF before the pass, started for the comparison, and
returned OFF afterward.

Results:

- `qwen38-original-ar-16k`: tool case **FAIL** (0 detected calls);
  first TTFT 24,300 ms / wall 36,187 ms.
- `qwen38-opus-q3-daily-16k`: tool case **PASS** (one call);
  first TTFT 20,370 ms / wall 25,899 ms; tool TTFT 5,632 ms / wall 10,198 ms.
- `qwen38-opus-q3-agent-24k`: tool case **PASS** (one call);
  first TTFT 13,273 ms / wall 19,978 ms; tool TTFT 2,273 ms / wall 7,543 ms.

Candidate for operator decision: `qwen38-opus-q3-agent-24k`. It is materially
faster than Daily 16K in both measured cases while passing the required tool
case. Both OPUS profiles exposed `<think>` content under the strict exact
single-digit short-response test, so no automatic requalification is made.
Original AR failed the tool case.

Real Qwen generations: **6**. Services started: router + backend only, then
both stopped. `:18791`/`:18792`, OpenCode, WF40, provider, Telegram, Blender:
**0**. Role overlay, FAST_AGENT mapping, scope-v2, and D-0025 state unchanged.

## NEXT

`V4_QWEN_SHORT_TURN_PROFILE_SELECTION_OPERATOR_DECISION`

Evidence report:
`reports/architecture/v4_qwen_short_turn_live_comparison_retained_profiles.md`
