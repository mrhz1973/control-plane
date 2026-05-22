# Runtime packet — PM-40: real Codex strict structured retry gate

**Packet ID:** `pm-40-real-codex-strict-structured-retry-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-39 hardening](../PM39_CODEX_STRICT_HARNESS_HARDENING.md) · [PM-38](../PM38_CODEX_STRUCTURED_OUTPUT_PROBE.md) · [PM-37](../PM37_CODEX_EXACT_OUTPUT_HARNESS.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

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

**PM-34** runtime remains **blocked** until **PM-40 strict PASS** (or documented successor).

---

## Not executed

This packet does **not** run `codex exec` in the prep task.
