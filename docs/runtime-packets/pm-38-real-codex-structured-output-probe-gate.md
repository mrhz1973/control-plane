# Runtime packet — PM-38: real Codex structured-output probe gate

**Packet ID:** `pm-38-real-codex-structured-output-probe-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-37 harness](../PM37_CODEX_EXACT_OUTPUT_HARNESS.md) · [PM-36](../PM36_CODEX_REPO_READ_PROBE.md) · [pm-34 integration](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Future **real** Codex probe using the **PM-37** marker + JSON harness.

---

## Future command family

```text
codex.cmd exec --sandbox read-only --cd <control-plane-repo> "<structured prompt per PM-37>"
```

Prompt must require **only** marker block + single JSON object — no prose.

---

## Required output

```text
CONTROL_PLANE_JSON_START
{ "schema_version": "pm37-codex-structured-output-v1", ... }
CONTROL_PLANE_JSON_END
```

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Codex reads `docs/PM35_CODEX_NOOP_PROBE.md` |
| 2 | JSON parse succeeds between markers |
| 3 | `pm35_status` = `PASS` |
| 4 | All safety booleans **false** |
| 5 | No file changes · no git · no n8n · no worker |
| 6 | Parser extracts valid marker block (tolerate outer prose only if parser still succeeds) |

---

## STOP conditions

| Condition | Action |
|-----------|--------|
| No marker block | Fail |
| Invalid JSON | Fail |
| Any safety boolean **true** | Fail |
| Secret/token visible | Fail |
| Codex attempts git/write/n8n | Fail |

---

## Not executed

This packet does **not** run `codex exec` in the prep task.
