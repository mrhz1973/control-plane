# LAST CURSOR REPORT

**BLOCK-ID:** `CLINE64K_ROUTER_RESTART_SINGLE_SMOKE_TEST`
**Classification:** `CLINE64K_LIVE_SMOKE_TEST_PASS`
**Timestamp (local):** 2026-09-04

## Summary

Operator evidence closes the workstation-only
`qwen38-opus-q3-cline-64k` live smoke test:

- Context 65536; 50 GPU layers; KV `q4_0/q4_0`; reasoning off
- Cline Model ID and context configured correctly
- Exact chat output `CLINE64K_OK`: **PASS**
- Read-only agent file read and Git status command: **PASS**
- Agent file modifications and Git writes: **0**
- Control Plane eligible / auto-routing: **NO**
- Existing six-profile eligibility and all role mappings: unchanged
- WF40, D-0025, scope-v3, and OPUS Agent 24K: unchanged
- New Qwen generations in this persistence pass: **0**
- Smoke test repeated in this persistence pass: **NO**

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_GENERAL_PURPOSE_DESIGN`

Bounded design only:
TASK DELTA → local dev executor → OpenCode → local Qwen → test → Git
PASS/STOP. Separate from WF40 live authorization and Cline UI.

Evidence report:
`reports/architecture/qwen38_opus_q3_cline_64k_live_smoke_test.md`
