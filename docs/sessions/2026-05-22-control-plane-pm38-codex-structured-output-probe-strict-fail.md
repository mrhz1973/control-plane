# PM-38 — Codex structured output probe (strict fail)

**Date:** 2026-05-22  
**Status:** **STRICT FORMAT FAIL / FUNCTIONAL JSON PARTIAL**

**Related:** [PM38 doc](../PM38_CODEX_STRUCTURED_OUTPUT_PROBE.md) · [output sample](../examples/pm38-codex-structured-output-probe-output.sample.json) · [PM-37](../PM37_CODEX_EXACT_OUTPUT_HARNESS.md)

---

## Evidence

| Field | Value |
|-------|--------|
| **Command** | `codex.cmd exec` — read-only |
| **Target file** | `docs/PM35_CODEX_NOOP_PROBE.md` |
| **Read** | `Get-Content` observed |
| **PM35 status** | **PASS** in file |
| **Model** | gpt-5.5 |

---

## Contract failure

**Expected markers:** `CONTROL_PLANE_JSON_START` / `CONTROL_PLANE_JSON_END`  
**Actual markers:** `<<<JSON>>>` / `<<<END_JSON>>>`

**Schema:** PM-37 fields missing or renamed (`modified_files`, `git_commands`, `secrets_accessed`, `marker`: `CODEX_NOOP_OK`).

---

## Security / negatives

| Item | State |
|------|--------|
| Token / OAuth URL / usage metrics | **Not recorded** |
| Codex thread id in git | **No** |
| Secret access / file mod / git | **No** |
| n8n / workflow 40/41 | **Not touched** |
| Worker | **Not enabled** |

---

## State

| Item | State |
|------|--------|
| **PM-18** | OAUTH AVAILABLE / WORKER NOT ENABLED |
| **PM-34** | PREPARED — **blocked** from runtime |
| **C1** | PARTIAL |
| **`41` backup** | Retained |

---

## Next

**PM-39** strict harness hardening **OR** stabilize — **not** PM-34 runtime.
