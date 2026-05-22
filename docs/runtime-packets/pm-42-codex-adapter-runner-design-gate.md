# Runtime packet — PM-42: Codex adapter runner design gate

**Packet ID:** `pm-42-codex-adapter-runner-design-gate`  
**Date:** 2026-05-22  
**Status:** **PASS / DESIGN ONLY**

**Related:** [PM42 design doc](../PM42_CODEX_ADAPTER_RUNNER_DESIGN.md) · [PM-41 fail](../PM41_CODEX_EXTERNAL_STRICT_RETRY_FAIL.md) · [pm-43 dry-run](pm-43-codex-adapter-runner-dry-run-gate.md)

---

## Purpose

Design **external runner** that launches `codex.cmd`, captures stdout, validates output, and **blocks n8n** unless **strict_pass** artifact exists.

Must **not** depend on Codex obeying final prose.

---

## Architecture

```text
Runner (Node/PowerShell)
  -> codex.cmd exec
  -> raw stdout
  -> parser (PM-37 markers + schema)
  -> classification (PM-39)
  -> artifact JSON
```

---

## Classification outputs

| Level | n8n |
|-------|-----|
| **strict_pass** | May consume (future gate) |
| **recoverable_partial** | Evidence only |
| **fail** / **blocked** | Stop |

---

## Explicit non-goals (this gate)

- No n8n runtime now
- No worker enable now
- No Codex invocation in design-only task

---

## Successor

**PM-43** dry-run/mock parser · **PM-44** real runner (future)
