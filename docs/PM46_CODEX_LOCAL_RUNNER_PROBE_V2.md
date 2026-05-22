# PM-46 — Codex local runner probe v2

**Status:** **FAIL** (2026-05-22)

**Related:** [pm-46 gate](runtime-packets/pm-46-real-local-codex-runner-probe-v2-gate.md) · [session](sessions/2026-05-22-control-plane-pm46-codex-local-runner-v2.md) · [artifact](examples/pm46-codex-local-runner-v2-result.sample.json) · [tool](../tools/codex-local-runner-probe-v2.mjs) · [PM-45 hardening](PM45_CODEX_RUNNER_HARDENING.md)

---

## Purpose

One-shot real local runner v2 after PM-45 — `spawnSync` argv array via `cmd.exe /c` on Windows, shared classifier, no raw stdout/stderr in git.

---

## Result

| Field | Value |
|-------|--------|
| **Codex invoked** | **yes** (once) |
| **Runtime executed** | **yes** |
| **Exit code** | **2** |
| **Classification** | **fail** |
| **failure_mode** | **cli_exit_nonzero** |
| **strict_pass** | **false** |
| **Strict markers** | **missing** |
| **Raw stdout/stderr** | **not committed** |
| **PM-34** | **blocked** |

Same failure family as PM-44: CLI exits before delivering strict marker block — **not** scope drift.

---

## Runner v2 changes vs PM-44

| Item | PM-44 | PM-46 v2 |
|------|-------|----------|
| **Spawn** | `shell: true` | `cmd.exe /c` + argv array |
| **Approval** | omitted | `--approval never` |
| **Classifier** | shared module | `classifyCodexRunnerOutput` |

---

## Constraints

| Item | Value |
|------|--------|
| **codex_invocation_count** | **1** |
| **retry_count** | **0** |
| **n8n / workflow 40 / 41** | **untouched** |
| **Worker** | **not enabled** |

---

## Next

**PM-47** runner/CLI diagnosis (prompt delivery, stdin/file, codex exec argv) **or** stabilize. PM-34 gate planning only after future **strict_pass** + separate approval.
