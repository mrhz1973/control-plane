# V4 LOCAL_DEV_EXECUTOR — OpenCode failure evidence V1

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_OPENCODE_FAILURE_EVIDENCE_V1`
**Classification:** `OPENCODE_FAILURE_EVIDENCE_PRESERVED`
**Dispatch base head:** `d072e8aecf93fcdb5b61c22f15b3389d08a2425c`
**Date:** 2026-09-04

## Implemented

`local-dev-execution-result-v1` STOP results for the unchanged top-level
classification `STOP:OPENCODE_RUN_FAILED` now carry bounded
`failure_diagnostics`:

```text
opencode_exit_code   clean non-zero child exit code
stdout_excerpt       sanitized, max 2000 chars
stderr_excerpt       sanitized, max 2000 chars
spawn_error          sanitized spawn error message (when present)
spawn_error_code     OS/process error code (when present)
spawn_failure        true only for child spawn failure
```

The runner captures exit code/stdout/stderr and structurally marks spawn
failures. The executor propagates diagnostics only on this STOP path.
Successful PASS results never contain failure diagnostics.

Safety:

- excerpts are capped at 2000 characters each;
- Bearer values, Authorization/API-key/token/secret/password assignments,
  `sk-*`, and GitHub token forms are redacted;
- evidence is CLI/tooling failure evidence only; task prompts and model
  output are not intentionally persisted as diagnostics;
- top-level classification is unchanged; no speculative classification was
  introduced;
- existing one-process/no-shell/guard/permission/timebox/production-domain
  invariants remain unchanged.

## Tests

Wiring suite: **32/32 PASS**. Added deterministic coverage for:

- non-zero exit stderr/stdout/exit code propagation;
- spawn failure versus clean non-zero exit distinction;
- cap and obvious-secret redaction;
- STOP propagation and absence of diagnostics on PASS.

Regressions: executor **20/20 PASS**, workstation bridge **14/14 PASS**.
No Qwen generation, OpenCode model execution, or service lifecycle action
was performed.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY3`
