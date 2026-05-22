# PM-41 — External terminal Codex strict retry (fail)

**Status:** **STRICT OUTPUT FAIL / SCOPE DRIFT** (2026-05-22)

**Related:** [pm-41 gate](runtime-packets/pm-41-external-terminal-codex-strict-retry-gate.md) · [session](sessions/2026-05-22-control-plane-pm41-fail-pm42-pm43-adapter-design.md) · [sample](examples/pm41-codex-external-strict-retry-fail.sample.json) · [PM-42 design](PM42_CODEX_ADAPTER_RUNNER_DESIGN.md)

---

## Purpose

Record **PM-41** strict retry from **user PowerShell** — runtime ran; **strict contract not met**.

Unlike **PM-40**, not blocked by tool policy.

---

## Evidence

| Check | Result |
|-------|--------|
| `codex.cmd exec` | **Executed** (read-only sandbox) |
| Required markers | **Missing** (`CONTROL_PLANE_JSON_START` / `END`) |
| PM-37 exact schema | **Missing** |
| Single-file scope | **Violated** — `rg`, `git status`, many files |
| Output | Instructions to re-run PM-41 — not structured JSON |

---

## Conclusion

| Item | State |
|------|--------|
| **strict_pass** | **false** |
| **PM-34** | **Blocked** |
| **Worker** | **Not enabled** |
| **n8n** | **Not touched** |

---

## Lesson

Direct prompt strictness is **insufficient**. Need **external runner/adapter** (PM-42/43) to capture stdout and validate **outside** Codex.

**Do not** solve by repeating longer prompts alone.

---

## Next

- **PM-42** adapter design (**PASS** design-only)
- **PM-43** runner dry-run/mock
- **PM-44** real local runner probe (future)
