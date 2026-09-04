# V4 Qwen live short-turn comparison — retained profiles

**BLOCK-ID:** `V4_QWEN_SHORT_TURN_LIVE_COMPARISON_RETAINED_PROFILES`  
**Classification:** `SHORT_TURN_LIVE_COMPARISON_COMPLETE_OPERATOR_DECISION_REQUIRED`  
**Date:** 2026-09-04  
**Order:** Original AR 16K → OPUS Daily 16K → OPUS Agent 24K

## Safety and lifecycle

The canonical router at `http://127.0.0.1:8080` was OFF before this pass. It
was started with the existing workstation router configuration, used for the
six bounded requests below, and stopped afterward. The backend was also
stopped after rediscovering the listening PIDs.

- Services started: router + its backend only; both restored OFF
- `:18791`: not started
- `:18792`: not started
- OpenCode/WF40/provider/Telegram: **0**
- Blender/Blender MCP: **0**
- New benchmark suite or warmup: **0**
- Real Qwen generations: **6** (exactly two per profile)
- Role qualification overlay changed: **NO**
- `FAST_AGENT`: remains **UNQUALIFIED**
- next-WF40 executor: remains **STALE**
- scope-v2 and digest: unchanged
- D-0025: **CLOSED**

The six requests used the canonical endpoint and exact `profile_id` in the
request body. Each profile received one new-conversation short-response
request and one separate tool-decision request. The fake read-only tool was
never executed.

## Measurements

Times are client-observed milliseconds from request start. `cold/first TTFT`
is the first request for that profile and includes any profile load/startup
visible through the router. The second request is the tool case; no additional
warmup was performed.

| profile | cold/first TTFT | first wall | tool TTFT | tool wall | tool correctness | verdict |
|---|---:|---:|---:|---:|---|---|
| `qwen38-original-ar-16k` | 24,300 ms | 36,187 ms | 3,541 ms | 15,419 ms | **FAIL** — 0 detected tool calls | **Reject** |
| `qwen38-opus-q3-daily-16k` | 20,370 ms | 25,899 ms | 5,632 ms | 10,198 ms | **PASS** — exactly 1 `read_only_probe` call | **Viable** |
| `qwen38-opus-q3-agent-24k` | 13,273 ms | 19,978 ms | 2,273 ms | 7,543 ms | **PASS** — exactly 1 `read_only_probe` call | **Recommended candidate** |

All six responses returned HTTP 200 and streamed. No duplicate tool call was
detected for either passing OPUS profile.

## Short-response correctness

The strict short-response prompt requested exactly the single digit `7`.

- Original AR: **FAIL** — no final content matching the required exact output
  was observed; the stream exposed reasoning content.
- OPUS Daily 16K: **FAIL under the strict exact-output criterion** — the
  streamed content exposed a `<think>` block rather than only `7`.
- OPUS Agent 24K: **FAIL under the same strict exact-output criterion** — the
  streamed content exposed a `<think>` block rather than only `7`.

This is a meaningful output-contract finding. It does not invalidate the
tool-decision result, but it prevents claiming perfect short-response
correctness for any of the three profiles in this run.

## Measured facts versus inference

### MEASURED

- Agent 24K was faster than Daily 16K in both measured cases:
  13,273 ms versus 20,370 ms first TTFT, and 2,273 ms versus 5,632 ms
  tool TTFT.
- Agent 24K was faster in total wall time in both cases:
  19,978 ms versus 25,899 ms first wall, and 7,543 ms versus 10,198 ms
  tool wall.
- Daily 16K and Agent 24K each produced exactly one correctly named tool call
  with no duplicate detected.
- Original AR produced zero detected tool calls in the required tool case.
- All three strict exact-output short-response checks failed.
- The router catalog and profile IDs remained unchanged.

### INFERRED

- Among the tested profiles, `qwen38-opus-q3-agent-24k` is the best measured
  latency/correctness compromise for a subsequent operator decision.
- The measured result is contrary to a rule that would automatically prefer
  Daily 16K merely because it has a smaller context preset: the 24K Agent
  profile was materially faster in this run.
- This does **not** authorize automatic requalification or a Control Plane
  mapping change. The agent profile still requires an operator decision, and
  the strict output-contract failure should be considered before selection.

## Operator decision

Evidence is sufficient to present a candidate and trade-off to the operator:

```text
candidate = qwen38-opus-q3-agent-24k
```

It passes the required tool case and is materially faster than OPUS Daily 16K
on both bounded measurements. The trade-off is that both OPUS profiles emitted
visible reasoning content under the strict short-response test, so neither has
perfect exact-output compliance in this run. Original AR is rejected because it
failed the required tool-decision case.

No role is requalified by this report. The operator must explicitly decide
whether to requalify a retained profile and, separately, whether the visible
reasoning-output behavior is acceptable for the intended Control Plane
short-turn contract.

## NEXT

`V4_QWEN_SHORT_TURN_PROFILE_SELECTION_OPERATOR_DECISION`

