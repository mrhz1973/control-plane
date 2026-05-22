# PM-36 — Controlled Codex repo-read probe

**Status:** **PASS WITH OUTPUT-FORMAT DEVIATION** (2026-05-22)

**Related:** [PM-35](PM35_CODEX_NOOP_PROBE.md) · [output sample](examples/pm36-codex-repo-read-probe-output.sample.json) · [session](sessions/2026-05-22-control-plane-pm36-codex-repo-read-probe-pass.md)

---

## Purpose

Verify authenticated Codex can **read** a controlled repo file in **read-only** sandbox mode.

---

## Probe

| Field | Value |
|-------|--------|
| **Command family** | `codex.cmd exec` |
| **Sandbox** | read-only |
| **Approval** | never |
| **Model** | gpt-5.5 |
| **Target file** | `docs/PM35_CODEX_NOOP_PROBE.md` |

---

## Evidence (functional PASS)

| Check | Result |
|-------|--------|
| Target file read | **Yes** — `Get-Content` on PM35 doc |
| PM35 status in content | **PASS** (`**Status:** **PASS** (2026-05-22)`) |
| Git commands | **None** observed |
| File changes | **None** requested |
| Secret access | **None** requested |

---

## Format deviation

| Field | Value |
|-------|--------|
| **Expected final output** | `CODEX_REPO_READ_OK` + `PM35_STATUS=PASS` |
| **Actual final output** | `CODEX_NOOP_OK` |

**Conclusion:** Functional repo-read **PASS**; exact-output formatting needs a future harness (PM-37) before automation relies on final text.

**Do not** re-run this test for format alone unless explicitly decided.

---

## Explicit negatives

| Item | State |
|------|--------|
| n8n / workflow 40/41 | **Not touched** |
| Worker enabled | **No** |
| Codex thread id in git | **Not recorded** |

---

## Next options

- **PM-37** exact-output harness design
- **PM-34** candidate integration planning
- Stabilize
