# PM-40 — Codex strict structured retry blocked

**Date:** 2026-05-22  
**Status:** **BLOCKED_BY_TOOL_POLICY / NOT EXECUTED**

**Related:** [PM40 doc](../PM40_CODEX_STRICT_RETRY_BLOCKED.md) · [output sample](../examples/pm40-codex-strict-retry-blocked-output.sample.json) · [PM-41 gate](../runtime-packets/pm-41-external-terminal-codex-strict-retry-gate.md)

---

## Evidence

| Field | Result |
|-------|--------|
| `codex.cmd exec` | Rejected **before** runtime |
| `codex.cmd --version` | Rejected by tool policy |
| Strict output | **None** produced |

Nested/self-invocation style attempt after reading repo docs.

---

## Negative checks

| Item | State |
|------|--------|
| Token / OAuth URL / usage metrics | **Not recorded** |
| Codex thread id in git | **No** |
| n8n / workflow 40/41 | **Not touched** |
| Worker | **Not enabled** |

---

## State

| Item | State |
|------|--------|
| **PM-18** | OAUTH AVAILABLE / WORKER NOT ENABLED |
| **PM-34** | **Blocked** |
| **C1** | PARTIAL |
| **`41` backup** | Retained |

---

## Next

**PM-41** external terminal strict retry (user PowerShell) **OR** stabilize.
