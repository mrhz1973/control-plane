# Runtime packet — PM-46: real local Codex runner probe v2 gate

**Packet ID:** `pm-46-real-local-codex-runner-probe-v2-gate`  
**Date:** 2026-05-22  
**Status:** **FAIL** (2026-05-22)

**Evidence:** [PM-46 doc](../PM46_CODEX_LOCAL_RUNNER_PROBE_V2.md) · [session](../sessions/2026-05-22-control-plane-pm46-codex-local-runner-v2.md) · [artifact](../examples/pm46-codex-local-runner-v2-result.sample.json)

**Related:** [PM-45 hardening](../PM45_CODEX_RUNNER_HARDENING.md) · [PM-44 fail](../PM44_CODEX_LOCAL_RUNNER_PROBE.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md) · [classify module](../../tools/codex-runner-classify.mjs)

---

## Purpose

Future **one-shot** real local runner probe v2 after PM-45 hardening — uses `codex-runner-classify.mjs`, no raw stdout/stderr in git.

---

## Preconditions

| # | Requirement |
|---|-------------|
| 1 | PM-43 adapter dry-run **PASS** |
| 2 | PM-44 fail **recorded** |
| 3 | PM-45 hardening **PASS** |
| 4 | Production workflow **40** active |
| 5 | Backup workflow **41** retained |

---

## Execution rules

| Rule | Detail |
|------|--------|
| **Invocations** | **One** only — no retry |
| **n8n** | **No** UI/API/runtime changes |
| **Worker** | **Not** enabled |
| **workflows/exports** | **No** edits |
| **Raw capture** | In memory only — **never** commit stdout/stderr |

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Strict markers `CONTROL_PLANE_JSON_START` / `END` |
| 2 | JSON valid; PM-37 schema exact |
| 3 | `pm35_status` = **PASS**; all safety booleans **false** |
| 4 | Artifact `strict_pass` = **true** |
| 5 | **PM-34 still blocked** — separate gate required |

---

## Future FAIL criteria

Exit nonzero without strict artifact · markers missing · malformed JSON · policy block · scope drift · safety **true** · any n8n/worker/workflow touch.

---

## PM-34 rule

PM-34 remains **PREPARED / NOT EXECUTED** until PM-46 **strict_pass** artifact **and** explicit separate integration gate.

---

## Runtime result (2026-05-22)

| Check | Result |
|-------|--------|
| **codex_invoked** | **true** (count **1**) |
| **exit_code** | **2** |
| **strict_pass** | **false** |
| **failure_mode** | **cli_exit_nonzero** |
| **PM-34** | **Blocked** (separate gate still required) |

**Follow-up:** [PM-47 diagnosis](../PM47_CODEX_RUNNER_CLI_DIAGNOSIS.md) — PM-46 FAIL likely CLI args (`--approval`); [PM-48 v3 gate](pm-48-real-local-codex-runner-v3-gate.md) prepared without approval flag.

**Next:** PM-48 one-shot runner v3.
