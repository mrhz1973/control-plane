# PM-47 — Codex runner/CLI diagnosis

**Status:** **PASS / DIAGNOSIS ONLY** (2026-05-22)

**Related:** [session](sessions/2026-05-22-control-plane-pm47-codex-runner-cli-diagnosis.md) · [diagnosis sample](examples/pm47-codex-runner-cli-diagnosis.sample.json) · [v3 config](examples/pm47-codex-runner-v3-config.sample.json) · [PM-46 fail](PM46_CODEX_LOCAL_RUNNER_PROBE_V2.md) · [pm-48 gate](runtime-packets/pm-48-real-local-codex-runner-v3-gate.md)

---

## Purpose

Diagnose repeated **exit code 2** in PM-44/PM-46 **without** invoking Codex.

---

## Evidence

| Source | Invocation pattern |
|--------|-------------------|
| **PM-35/36/38** (manual PASS) | `codex.cmd exec --sandbox read-only --cd <repo> <prompt>` — **no** `--approval` CLI flag |
| **PM-44** (runner FAIL) | Same argv base + `shell: true` — exit **2**, no strict markers |
| **PM-46 v2** (runner FAIL) | Added `--approval never` + `cmd.exe /c` — exit **2**, no strict markers |

---

## Primary hypothesis

**Runner CLI args / spawn wrapper differ from known-good manual invocation** — especially PM-46’s `--approval` flag (not used in successful manual probes). Exit **2** is consistent with **CLI usage/argument parse failure** before any strict artifact — **not** parser bug, **not** model-output failure, **not** n8n/worker.

---

## PM-47 result

| Item | Value |
|------|--------|
| **Diagnosis dry-run** | **PASS** |
| **v3 config prepared** | **yes** (no `--approval`) |
| **Codex invoked** | **no** |
| **PM-34** | **blocked** |

---

## Recommendation

**PM-48** one-shot runner v3 using known-good argv: `exec --sandbox read-only --cd <repo> <prompt>`. If PM-48 still exits **2**, stop real retries → **PM-49** prompt-file/stdin strategy.
