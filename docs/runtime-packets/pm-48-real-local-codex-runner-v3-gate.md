# Runtime packet — PM-48: real local Codex runner probe v3 gate

**Packet ID:** `pm-48-real-local-codex-runner-v3-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-47 diagnosis](../PM47_CODEX_RUNNER_CLI_DIAGNOSIS.md) · [v3 config](../examples/pm47-codex-runner-v3-config.sample.json) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Future **one-shot** real local runner v3 using **known-good manual CLI** pattern from PM-35/36/38.

---

## Preconditions

| # | Requirement |
|---|-------------|
| 1 | PM-47 diagnosis **PASS** |
| 2 | v3 config: **no** `--approval` / `--ask-for-approval` |
| 3 | Production **40** active · backup **41** retained |

---

## Command pattern

```text
codex.cmd exec --sandbox read-only --cd <repo> <prompt>
```

**Forbidden flags:** `--approval` · `--ask-for-approval` · `--dangerously-bypass-approvals-and-sandbox` · `danger-full-access`

---

## Execution rules

| Rule | Detail |
|------|--------|
| **Invocations** | **One** only — no retry |
| **Raw stdout/stderr** | Memory only — never commit |
| **n8n / worker / workflows** | **No** changes |

---

## Future PASS / FAIL

Same as PM-46 gate: strict markers + PM-37 schema + safety **false** → `strict_pass`; else fail/blocked/scope drift. **PM-34 remains blocked** even on strict_pass.

---

## If PM-48 exit 2

Next: **PM-49** prompt-file/stdin diagnosis — **not** repeated Codex retry.

---

## Not executed

This packet does **not** run `codex` in the prep task.
