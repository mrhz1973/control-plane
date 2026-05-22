# Runtime packet — PM-41: external terminal Codex strict retry gate

**Packet ID:** `pm-41-external-terminal-codex-strict-retry-gate`  
**Date:** 2026-05-22  
**Status:** **STRICT OUTPUT FAIL / SCOPE DRIFT** (2026-05-22)

**Evidence:** [PM-41 fail doc](../PM41_CODEX_EXTERNAL_STRICT_RETRY_FAIL.md) · [session](../sessions/2026-05-22-control-plane-pm41-fail-pm42-pm43-adapter-design.md) · [sample](../examples/pm41-codex-external-strict-retry-fail.sample.json)

**Related:** [PM-42/43 adapter](../PM42_CODEX_ADAPTER_RUNNER_DESIGN.md) · [PM-40 blocked](../PM40_CODEX_STRICT_RETRY_BLOCKED.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Future **strict** retry executed **directly by the user** in PowerShell — **not** by Codex invoking `codex.cmd` nested inside another Codex/tool session.

**Reason:** PM-40 blocked — `codex.cmd` self-invocation rejected by tool policy.

---

## Future execution rules

| Rule | Detail |
|------|--------|
| **Shell** | User PowerShell in `control-plane` repo root |
| **No nested Codex** | Codex must not spawn `codex.cmd` |
| **No n8n** | UI/API unchanged |
| **No worker** | Automatic worker stays off |

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | `CONTROL_PLANE_JSON_START` / `END` markers present |
| 2 | Valid JSON; exact PM-37 schema |
| 3 | `pm35_status` = `PASS` |
| 4 | All safety booleans **false** |
| 5 | No file/git/n8n/worker changes |
| 6 | PM-39 validator: **strict_pass** |

---

## Future FAIL criteria

Policy block · marker drift · schema drift · invalid JSON · nested Codex invocation · any safety **true**

---

## PM-34 blocker

**PM-34** remains **blocked** — PM-41 did not produce **strict_pass**.

**Successor:** **PM-42/43** external adapter runner — **PM-44** real runner probe (future).

---

## Runtime result (2026-05-22)

| Check | Result |
|-------|--------|
| **runtime_executed** | **true** (user PowerShell) |
| **strict_pass** | **false** |
| **Scope** | Drift — multi-file, `rg`, `git status` |
| **Markers/schema** | **Not returned** |

Do **not** retry with longer prompts only.
