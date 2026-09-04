# qwen-execution-scope-v3

Canonical authorization scope for the selected OPUS Agent 24K next-WF40
executor. `qwen-execution-scope-v2` remains historical and is not rewritten.

## Fixed scope

```json
{"scope_version":"qwen-execution-scope-v3","execution_harness":"opencode","model":"qwen_local","profile_id":"qwen38-opus-q3-agent-24k","role":"FAST_AGENT","canonical_endpoint":"http://127.0.0.1:8080","single_generation_guard_required":true,"max_opencode_executions":1,"max_qwen_generation_calls":1,"retry":0,"fallback":0}
```

Exactly 11 keys are required, in the order shown above.

Canonical SHA-256 digest:

```text
934123f0fe8c39b4783632aa014b9952a28396d8e7d6e8c6ca246cfe1f2548f7
```

## Policy

- `profile_id`: `qwen38-opus-q3-agent-24k`
- `role`: `FAST_AGENT`
- `FAST_AGENT`, `FAST_INTERACTIVE`, and `FAST_AGENT_SHORT_TURN` are qualified
  for this explicitly selected OPUS profile.
- DCFR remains preserved, remains qualified for
  `FAST_THROUGHPUT_LONG_TASK`, and remains unqualified for short-turn roles.
- The live comparison observed visible `<think>` content in the strict
  short-response case. This contract does not claim exact-output compliance and
  introduces no parser for that caveat.
- `max_opencode_executions` and `max_qwen_generation_calls` remain `1`;
  `retry` and `fallback` remain `0`.
- Scope-v2 consumers outside the active next-WF40 path remain historical.
- Register-pending remains the unchanged eight-key HTTP body with route
  `opencode+qwen_local`.

## Tool

`tools/qwen-execution-scope-v3.mjs`

