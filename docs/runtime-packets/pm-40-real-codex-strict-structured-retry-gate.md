# Runtime packet — PM-40: real Codex strict structured retry gate

**Packet ID:** `pm-40-real-codex-strict-structured-retry-gate`  
**Date:** 2026-05-22  
**Status:** **BLOCKED_BY_TOOL_POLICY / NOT EXECUTED** (2026-05-22)

**Evidence:** [PM-40 blocked session](../sessions/2026-05-22-control-plane-pm40-codex-strict-retry-blocked.md) · [PM40 doc](../PM40_CODEX_STRICT_RETRY_BLOCKED.md) · [output sample](../examples/pm40-codex-strict-retry-blocked-output.sample.json)

**Related:** [PM-41 external gate](pm-41-external-terminal-codex-strict-retry-gate.md) · [PM-39 hardening](../PM39_CODEX_STRICT_HARNESS_HARDENING.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Future **real** Codex retry with **stricter** prompt + **PM-39** validator before any n8n step.

---

## Preconditions

| Gate | State |
|------|--------|
| **PM-37** | PASS |
| **PM-38** | Strict fail recorded |
| **PM-39** | Hardening PASS |
| **Production `40`** | Stable |
| **`41` backup** | Retained |

---

## Future prompt rules

- Return **exactly** `CONTROL_PLANE_JSON_START` … `CONTROL_PLANE_JSON_END`
- **No** prose outside markers
- **No** alternative markers (`<<<JSON>>>` forbidden)
- Field names **exact** — no aliases
- `schema_version`: `pm37-codex-structured-output-v1`
- All safety booleans explicit **`false`**

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | PM-39 validator: **strict_pass** |
| 2 | `pm35_status` = `PASS` |
| 3 | No file/git/n8n/worker changes |
| 4 | Valid JSON between strict markers |

---

## Future FAIL criteria

Marker drift · schema drift · alias fields · prose without markers · safety **true** · invalid JSON

---

## PM-34 blocker

**PM-34** remains **blocked** — no strict pass from PM-40.

---

## Runtime result (2026-05-22)

| Check | Result |
|-------|--------|
| **strict_pass** | **false** |
| **runtime_executed** | **false** |
| **Blocker** | `codex.cmd` rejected before runtime (nested self-invocation / tool policy) |

**Do not** retry PM-40 from inside Codex self-invocation. Use **PM-41** user PowerShell direct gate.
