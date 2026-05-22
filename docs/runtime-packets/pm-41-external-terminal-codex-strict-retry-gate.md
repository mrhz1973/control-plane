# Runtime packet — PM-41: external terminal Codex strict retry gate

**Packet ID:** `pm-41-external-terminal-codex-strict-retry-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-40 blocked](../PM40_CODEX_STRICT_RETRY_BLOCKED.md) · [PM-39 hardening](../PM39_CODEX_STRICT_HARNESS_HARDENING.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

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

**PM-34** remains **blocked** until **PM-41 strict PASS** or documented successor.

---

## Not executed

This packet does **not** run commands in the prep task.
