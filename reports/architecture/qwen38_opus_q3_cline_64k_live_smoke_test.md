# Qwen 3.8 OPUS Q3 Cline 64K — live smoke test

**BLOCK-ID:** `CLINE64K_ROUTER_RESTART_SINGLE_SMOKE_TEST`
**Classification:** `CLINE64K_LIVE_SMOKE_TEST_PASS`
**Date:** 2026-09-04

## Operator evidence

- Router `:8080` exposes `qwen38-opus-q3-cline-64k`.
- Runtime parameters: context 65536, 50 GPU layers, KV cache `q4_0/q4_0`,
  reasoning off.
- Cline Model ID: `qwen38-opus-q3-cline-64k`.
- Cline Context Window Size: 65536.
- Smoke chat exact output: `CLINE64K_OK`.
- Read-only agent smoke read `docs/runtime/CURRENT_FRONTIER.md` and ran
  `git status --short --branch`.
- Agent smoke made no file changes, Git writes, web calls, or MCP calls.

## Classification

```text
CLINE64K_LIVE_SMOKE_TEST = PASS
PROFILE = qwen38-opus-q3-cline-64k
CONTEXT = 65536
CHAT = PASS
AGENT_READ = PASS
AGENT_COMMAND = PASS
FILE_MODIFICATIONS = 0
CONTROL_PLANE_ELIGIBLE = NO
AUTO_ROUTING = NO
WF40_CHANGED = NO
SCOPE_V3_CHANGED = NO
```

The six-profile Control Plane eligibility set, all role mappings, WF40,
D-0025, scope-v3, and the OPUS Agent 24K short-turn selection are unchanged.
This pass records existing operator evidence only; it performs no Qwen
generation and does not repeat the smoke test.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_GENERAL_PURPOSE_DESIGN`

Bounded design of a general-purpose path:

```text
TASK DELTA
→ local dev executor
→ OpenCode
→ Qwen locale
→ test
→ Git PASS/STOP
```

This path remains separate from WF40 live authorization and the Cline UI. The
local dev executor is not implemented in this pass.
