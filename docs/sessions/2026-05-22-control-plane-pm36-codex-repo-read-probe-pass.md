# PM-36 — Controlled Codex repo-read probe

**Date:** 2026-05-22  
**Status:** **PASS WITH OUTPUT-FORMAT DEVIATION**

**Related:** [PM36 doc](../PM36_CODEX_REPO_READ_PROBE.md) · [output sample](../examples/pm36-codex-repo-read-probe-output.sample.json) · [PM-35](../PM35_CODEX_NOOP_PROBE.md)

---

## Evidence

| Field | Value |
|-------|--------|
| **Command** | `codex.cmd exec` — read-only sandbox |
| **Target file** | `docs/PM35_CODEX_NOOP_PROBE.md` |
| **Read observed** | `Get-Content` on target path |
| **PM35 status found** | **PASS** in file content |
| **Model** | gpt-5.5 · approval never |

---

## Format deviation

**Expected:**

```text
CODEX_REPO_READ_OK
PM35_STATUS=PASS
```

**Actual final output:** `CODEX_NOOP_OK`

Functional repo-read capability is **proven**; exact final text did not match. No re-test for format unless user decides.

---

## Security / negatives

| Item | State |
|------|--------|
| Token / OAuth URL | **Not recorded** |
| Codex thread id in git | **No** |
| Usage metrics | **Not recorded** |
| Secret access | **No** |
| File modification / git | **Not requested** |
| n8n / workflow 40/41 | **Not touched** |
| Worker enabled | **No** |

---

## State

| Item | State |
|------|--------|
| **PM-18** | OAUTH AVAILABLE / WORKER NOT ENABLED |
| **PM-34** | PREPARED / NOT EXECUTED |
| **C1** | PARTIAL |
| **`41` backup** | Retained |

---

## Next

**PM-37** exact-output harness design **OR** PM-34 candidate integration planning — **not** both automatically.
