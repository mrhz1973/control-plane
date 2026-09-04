# V4 Qwen short-turn profile selection — OPUS24K scope-v3

**BLOCK-ID:** `V4_QWEN_SHORT_TURN_PROFILE_SELECTION_OPUS24K_SCOPE_V3`  
**Classification:** `OPUS24K_FAST_AGENT_SELECTED_SCOPE_V3_PASS`  
**Date:** 2026-09-04  
**Decision source:** `reports/architecture/v4_qwen_short_turn_live_comparison_retained_profiles.md`

## Operator decision

The operator selected:

```text
profile_id = qwen38-opus-q3-agent-24k
role       = FAST_AGENT
endpoint   = http://127.0.0.1:8080
scope      = qwen-execution-scope-v3
```

The measured `<think>` output caveat is accepted. This pass does not claim
exact-output compliance and does not add a parser for that behavior.

## Scope-v3

The new active next-WF40 scope contains exactly 11 keys, in canonical order:

```json
{"scope_version":"qwen-execution-scope-v3","execution_harness":"opencode","model":"qwen_local","profile_id":"qwen38-opus-q3-agent-24k","role":"FAST_AGENT","canonical_endpoint":"http://127.0.0.1:8080","single_generation_guard_required":true,"max_opencode_executions":1,"max_qwen_generation_calls":1,"retry":0,"fallback":0}
```

Canonical compact SHA-256:

```text
934123f0fe8c39b4783632aa014b9952a28396d8e7d6e8c6ca246cfe1f2548f7
```

`docs/contracts/qwen-execution-scope-v2.md` and
`tools/qwen-execution-scope-v2.mjs` remain historical. The active next-WF40
producer/consumer path now validates and emits scope-v3.

## Qualification state

- OPUS Agent 24K: `FAST_AGENT`, `FAST_INTERACTIVE`,
  `FAST_AGENT_SHORT_TURN` = **QUALIFIED**
- DCFR Agent 24K: those short-turn roles remain **UNQUALIFIED**
- DCFR: `FAST_THROUGHPUT_LONG_TASK` remains **QUALIFIED**
- Original AR remains `REFERENCE`
- Uncensored remains manual-only
- Six Control Plane-eligible profiles remain preserved
- Router-visible 96K Blender profiles remain out of Control Plane scope
- No profile was deleted, retired, hidden, or silently substituted

## Active-path migration

Migrated only the next-WF40 active path:

- runtime/model policy next executor and scope version;
- role qualification overlay;
- `tools/qwen-execution-scope-v3.mjs`;
- WF40 sidecar scope producer and authorization minting;
- WF40 seam source;
- OpenCode adapter scope validator;
- dispatch default profile;
- endpoint contract and request schema;
- directly affected tests and rolling evidence.

Register-pending remains exactly eight keys and `route_id` remains
`opencode+qwen_local`. Limits remain unchanged:

```text
max_opencode_executions = 1
max_qwen_generation_calls = 1
retry = 0
fallback = 0
```

## Safety

This pass performed no inference and started no services:

- Real Qwen generations: **0**
- Services started: **0**
- OpenCode/WF40/provider/Telegram: **0**
- D-0025: **CLOSED**
- Scope-v2 digest: unchanged
- Historical reports: unchanged
- Blender/96K profiles: untouched

## NEXT

`V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF_POST_POSTGRES_RETRY`

