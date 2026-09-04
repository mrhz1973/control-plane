# V4 Qwen short-turn retained-profile comparison

**BLOCK-ID:** `V4_QWEN_SHORT_TURN_PROFILE_COMPARISON_RETAINED_PROFILES`  
**RUN_NONCE:** `QWEN_SHORT_TURN_OFFLINE_COMPARE_20260904_01`  
**Classification:** `SHORT_TURN_OFFLINE_EVIDENCE_INSUFFICIENT_LIVE_COMPARISON_REQUIRED`  
**Date:** 2026-09-04  
**Evidence source revision:** `mrhz1973/qwen38-blender-lab@1ba1a1f1497e588f9833cbd5bdcbb3f8602f33a0`

## Scope and safety

This was an offline evidence review only. No benchmark was rerun, no local
service was started, and no model inference was performed.

- Real Qwen generations: **0**
- Services started: **0**
- OpenCode/provider/Telegram calls: **0**
- Role qualification overlay changed: **NO**
- Next-WF40 executor changed: **NO**
- Scope-v2/digest/authorization semantics changed: **NO**
- D-0025: **CLOSED**
- `FAST_AGENT`, `FAST_INTERACTIVE`, and `FAST_AGENT_SHORT_TURN` remain
  **UNQUALIFIED**
- Blender and both 96K Blender profiles remain out of Control Plane scope

The router-visible catalog may contain eight profiles, but this comparison
uses exactly the three retained Control Plane profiles requested:

1. `qwen38-original-ar-16k`
2. `qwen38-opus-q3-daily-16k`
3. `qwen38-opus-q3-agent-24k`

## Evidence reviewed

Persisted evidence reviewed from the workstation reconciliation and remote
benchmark repository:

- `benchmarks/results/summary/Q3_QUALITY_COMPARISON.json`
- `benchmarks/results/summary/Q3_CORRECTED_COMPARISON.json`
- `benchmarks/results/summary/FULL_LOCAL_RERUN_20260903.json`
- `benchmarks/results/summary/DCFR_SHORT_TURN_RESOLUTION_20260903.json`
- `benchmarks/results/summary/DCFR_COLD_CONTROL.json`
- `environment/runtime-router/qwen-models.ini`
- `environment/runtime-router/qwen-runtime-router.json`

The DCFR artifacts are used only as context for the already-established
short-turn correction and to avoid treating DCFR evidence as evidence for one
of the three retained profiles. They do not qualify or disqualify any target
profile here.

## Evidence matrix

| profile | short-turn evidence | quality/tool evidence | verdict |
|---|---|---|---|
| `qwen38-original-ar-16k` | **MISSING:** no persisted directly comparable short-prompt prompt-eval latency, TTFT, short decode, or total short-turn wall-time measurement for this exact profile. Runtime catalog identifies it as Original AR at 16K, but configuration is not a performance measurement. | **MISSING for this exact profile:** the persisted Q3 quality suite compares STOCK_UD_Q3, FULL_HAUHAU_Q3, DCFR_IQ3, and OPUS_Q3; it does not contain Original AR. `REFERENCE` qualification is a policy fact, not short-turn agent/tool correctness evidence. | **UNRESOLVED** |
| `qwen38-opus-q3-daily-16k` | **PARTIAL / NOT PROFILE-DIRECT:** persisted full rerun reports the shared OPUS_Q3 candidate at `decode_tok_s=5.2754`, `prompt_tok_s=68.7161`, `ttft_ms=1586.7103`, `combined_wall_ms=86293.8232`, and `prefill_8k_tok_s=64.8087`; it does not identify this row as the exact router profile or use a short-turn prompt shape. Context-size penalty for 16K is not measured. | **MEASURED for OPUS_Q3 model/candidate, not exact profile split:** quality leader, core score `96.14` in the later rerun; earlier persisted quality comparison reports OPUS_Q3 core `93.64`, reasoning `85.71`, tool calling `100`, multi-turn `75`. The evidence is internally versioned but does not separate Daily 16K from Agent 24K. | **PROMISING, NOT DECISION-READY** |
| `qwen38-opus-q3-agent-24k` | **PARTIAL / NOT PROFILE-DIRECT:** uses the same OPUS model identity as the Daily profile in the persisted router preset, but no directly comparable 24K short-turn latency or repeated-turn startup/context-penalty measurement exists. The 24K preset configuration is not a measurement. | **MEASURED for OPUS_Q3 model/candidate, not exact profile split:** OPUS is the persisted quality/reasoning leader; tool calling is `100` in the quality artifact. There is no evidence isolating the 24K agent preset's tool/agent correctness from the Daily preset. | **PROMISING, NOT DECISION-READY** |

## Facts versus inference

### MEASURED

- The persisted Q3 quality screen used the same 43-item suite and reports
  OPUS_Q3 as quality/core-capability/reasoning leader; tool calling was 100.
- The persisted full rerun reports the OPUS_Q3 aggregate performance row:
  5.2754 decode tok/s, 68.7161 prompt tok/s, 1,586.7103 ms TTFT,
  86,293.8232 ms combined wall time, and 64.8087 tok/s 8K prefill.
- The router preset maps both `qwen38-opus-q3-daily-16k` and
  `qwen38-opus-q3-agent-24k` to the same OPUS GGUF, while using different
  context/runtime preset values (16K versus 24K).
- No requested Original AR row appears in the persisted Q3 quality/performance
  comparison artifacts reviewed.
- The persisted artifacts do not provide a directly comparable short-turn
  measurement for each of the three exact profile IDs.

### INFERRED

- OPUS is the strongest **model-family** candidate among evidence present for
  quality/tool correctness.
- The Daily and Agent profiles likely share much of the model behavior because
  they point to the same OPUS GGUF, but their operational profile behavior
  cannot be assumed identical.
- A 24K context preset may have a startup or ordinary-turn penalty relative to
  16K, but this cannot be inferred quantitatively from the available artifacts.
- The existing OPUS evidence is useful for prioritizing a future comparison,
  but it is not sufficient to select one exact profile for short-turn routing.

### MISSING / NOT COMPARABLE

The smallest fair comparison still required is one controlled, profile-by-profile
measurement set for exactly the three IDs:

1. cold startup/load time and first useful response;
2. identical short prompt prompt-eval latency / TTFT;
3. identical short completion decode rate and completion length;
4. total wall time to a bounded useful answer;
5. at least one identical tool-decision/agent-correctness case;
6. repeated short turns with cache disabled or explicitly controlled;
7. 16K versus 24K context-preset impact where applicable;
8. exact runtime/profile identity and one-server-at-a-time isolation.

The measurements must use the same prompt corpus, generation settings,
runtime build, GPU, and accounting rules. A router-path measurement is needed
if the Control Plane will select through the router, because the persisted
`DCFR_SHORT_TURN_RESOLUTION` artifact shows that direct and router-path latency
can differ materially; that artifact does not measure the three retained
profiles and therefore cannot resolve this comparison.

## Decision

Persisted evidence is **not sufficient** to support an operator selection for
the short-turn role. The exact blocker is not lack of quality evidence for
OPUS; it is the absence of a directly comparable three-profile short-turn
latency/TTFT/decode/wall-time set and the absence of an Original AR quality/tool
row. The OPUS Daily-versus-Agent profile split is also unmeasured.

This is a successful evidence-first pass, not a task failure:

```text
classification = SHORT_TURN_OFFLINE_EVIDENCE_INSUFFICIENT_LIVE_COMPARISON_REQUIRED
candidate       = UNRESOLVED
```

No automatic winner, role requalification, profile substitution, or
next-WF40-executor mutation is authorized by this report.

## NEXT

`V4_QWEN_SHORT_TURN_LIVE_COMPARISON_OPERATOR_AUTHORIZATION_GATE`

