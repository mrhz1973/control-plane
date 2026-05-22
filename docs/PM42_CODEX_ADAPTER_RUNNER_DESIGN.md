# PM-42 — Codex adapter runner design

**Status:** **PASS / DESIGN ONLY** (2026-05-22)

**Related:** [pm-42 gate](runtime-packets/pm-42-codex-adapter-runner-design-gate.md) · [PM-43 implementation](PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md) · [PM-41 fail](PM41_CODEX_EXTERNAL_STRICT_RETRY_FAIL.md) · [PM-39 hardening](PM39_CODEX_STRICT_HARNESS_HARDENING.md)

---

## Problem

| PM | Issue |
|----|--------|
| **PM-38** | Format drift (`<<<JSON>>>`) |
| **PM-40** | Nested `codex.cmd` blocked by policy |
| **PM-41** | Strict output fail + scope drift |

---

## Solution

**External runner** owns validation — do **not** trust Codex final natural-language obedience.

```text
PowerShell/Node runner
  -> codex.cmd exec (future)
  -> raw stdout/stderr capture
  -> marker + JSON parser
  -> classification (PM-39 rules)
  -> safe artifact JSON
  -> n8n consumes ONLY strict_pass artifact
```

---

## Runner duties

| Duty | Detail |
|------|--------|
| Launch | `codex.cmd exec` with fixed prompt file |
| Capture | stdout/stderr — never commit secrets |
| Parse | Extract `CONTROL_PLANE_JSON_START` … `END` |
| Validate | PM-37 schema + safety booleans |
| Classify | `strict_pass` · `recoverable_partial` · `fail` · `blocked` |
| Block n8n | Never push raw Codex text to workflows |

---

## n8n rule

| Classification | n8n may consume? |
|----------------|------------------|
| **strict_pass** | Yes (future, explicit gate) |
| **recoverable_partial** | **No** — human evidence only |
| **fail** / **blocked** | **No** — stop |

---

## Next

**PM-43** parser dry-run **PASS** — [PM43](PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md). **PM-44** real local runner probe (prepared).
