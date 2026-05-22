# PM-40 — Codex strict structured retry (blocked)

**Status:** **BLOCKED_BY_TOOL_POLICY / NOT EXECUTED** (2026-05-22)

**Related:** [pm-40 gate](runtime-packets/pm-40-real-codex-strict-structured-retry-gate.md) · [session](sessions/2026-05-22-control-plane-pm40-codex-strict-retry-blocked.md) · [output sample](examples/pm40-codex-strict-retry-blocked-output.sample.json) · [PM-41 gate](runtime-packets/pm-41-external-terminal-codex-strict-retry-gate.md)

---

## Purpose

Record a **failed attempt** to run PM-40 strict structured retry — **not** a runtime PASS.

---

## Evidence

| Check | Result |
|-------|--------|
| `codex.cmd exec` attempt | **Rejected** before runtime (tool policy) |
| `codex.cmd --version` | **Rejected** by same policy |
| Strict output produced | **No** |
| Marker/schema validation | **Not possible** |

Codex read repo docs, then attempted nested `codex.cmd exec` from within the session — blocked.

---

## Conclusion

| Item | State |
|------|--------|
| **PM-40 strict_pass** | **false** |
| **PM-34** | **Still blocked** |
| **Worker** | **Not enabled** |
| **n8n** | **Not touched** |

---

## Repo sanity (observed)

| Check | Result |
|-------|--------|
| `docs/PM35_CODEX_NOOP_PROBE.md` | Status **PASS** unchanged |
| `git status` | **Clean** |

---

## Warnings

- **Do not** treat this as PM-40 PASS.
- **Do not** retry PM-40 from **inside** Codex self-invocation — use **PM-41** user PowerShell direct.

---

## Next

**PM-41** external terminal strict retry (user-run) **OR** stabilize.
