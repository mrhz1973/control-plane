# Runtime packet — PM-44: real local Codex runner probe gate

**Packet ID:** `pm-44-real-local-codex-runner-probe-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-43 dry-run](../PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md) · [PM-42 design](../PM42_CODEX_ADAPTER_RUNNER_DESIGN.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Future **real local runner** executes `codex.cmd` from Node/PowerShell wrapper, captures stdout/stderr, validates with PM-43 parser logic, writes **safe artifact only**.

Must **not** update n8n. Must **not** enable worker.

---

## Architecture

```text
Node/PowerShell wrapper
  -> codex.cmd exec (read-only sandbox)
  -> raw stdout/stderr capture
  -> PM-43 parser (markers + schema + classification)
  -> safe artifact JSON (no secrets)
```

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Runner executes Codex locally |
| 2 | stdout captured and parsed |
| 3 | `CONTROL_PLANE_JSON_START` / `END` present |
| 4 | PM-37 schema validated |
| 5 | Classification **strict_pass** |
| 6 | Artifact `n8n_usable` true only if strict_pass |
| 7 | No n8n / workflow 40 / workflow 41 / worker changes |

---

## Future FAIL criteria

Any drift, block, scope violation, invalid JSON, or safety boolean **true** → stop; classify **fail** or **blocked**.

---

## PM-34 rule

PM-34 runtime remains **PREPARED / NOT EXECUTED** until:

1. **PM-44** produces validated **strict_pass** artifact, **and**
2. Separate PM-34 integration gate explicitly approved.

Raw Codex stdout must **never** be routed into n8n.

---

## Not executed

This packet does **not** run `codex` in the prep task.
