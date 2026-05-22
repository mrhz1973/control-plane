# PM-45 — Codex runner hardening

**Status:** **PASS / DRY-RUN ONLY** (2026-05-22)

**Related:** [session](sessions/2026-05-22-control-plane-pm45-codex-runner-hardening.md) · [summary](examples/pm45-runner-hardening-summary.sample.json) · [tool](../tools/codex-local-runner-hardening-dry-run.mjs) · [classify module](../tools/codex-runner-classify.mjs) · [PM-44 fail](PM44_CODEX_LOCAL_RUNNER_PROBE.md)

---

## Purpose

Harden local runner **classification** after PM-44 **FAIL** — no Codex retry, no shell in PM-45.

---

## PM-44 recap

| Field | Value |
|-------|--------|
| **Codex invoked** | once |
| **Exit code** | **2** |
| **Strict markers** | **missing** |
| **strict_pass** | **false** |
| **failure_mode** | **cli_exit_nonzero** (generic: CLI exit without strict artifact) |
| **Raw stdout/stderr** | **not committed** |
| **PM-34** | **blocked** |

This is **not** scope drift — it is **CLI/nonzero exit** with no `CONTROL_PLANE_JSON_START/END` block.

---

## Failure mode separation

| Mode | Meaning |
|------|---------|
| **runner_spawn_fail** | `codex.cmd` did not start |
| **policy_block** | Tool policy blocked execution |
| **cli_exit_nonzero** | Process exited nonzero without strict artifact (PM-44) |
| **no_strict_markers** | No marker block |
| **malformed_json** | Markers present, JSON invalid |
| **scope_drift** | `rg` / `git status` / multi-file signals |
| **output_nonconformant** | Recoverable partial / schema drift |
| **strict_pass** | Full PM-37 contract |

---

## PM-45 dry-run fixtures

| Fixture | Classification |
|---------|----------------|
| **strict_success_raw** | **strict_pass** |
| **no_markers_exit_2** | **fail** |
| **policy_block** | **blocked** |
| **scope_drift** | **fail_scope_drift** |
| **malformed_json** | **fail** |

**Tool:** `tools/codex-local-runner-hardening-dry-run.mjs` · shared logic: `tools/codex-runner-classify.mjs`

---

## Constraints

| Item | Value |
|------|--------|
| **Codex invoked in PM-45** | **false** |
| **n8n / workflow 40 / 41** | **untouched** |
| **Worker** | **not enabled** |
| **PM-34** | **blocked** |

---

## Next

**PM-46** one-shot real local runner probe v2 — **must not** auto-unblock PM-34 even on strict_pass.
