# Codex-read-only wrapper dry-run v1 — PASS

**Date:** 2026-05-26  
**Status:** **PASS** — regression + Codex-read-only success-path  
**Human gate:** Authorized by operator for Codex-read-only wrapper dry-run only (narrow scope)  
**Packet:** [local-wrapper-success-path-design-packet](../decision-packets/local-wrapper-success-path-design-packet.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/local-wrapper-success-path-design-packet.md`
- `docs/decision-packets/bridge-wrapper-runtime-dry-run-preflight.md`
- `docs/contracts/codex-bridge-wrapper-design-v1.md`
- `docs/contracts/codex-bridge-contract-v1.md`
- `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs`
- `tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json`
- `docs/sessions/2026-05-26-control-plane-local-wrapper-success-path-design-packet-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md`
- `docs/sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md`
- `docs/sessions/2026-05-25-control-plane-bridge-invocation-profile-docs-only.md`

---

## Files changed

| File | Change |
|------|--------|
| `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` | Extended to v1 with Codex read-only path |
| `tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json` | Synthetic success fixture |
| `docs/sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md` | This session |
| `docs/foundation/FOUNDATION_STATUS.md` | Dry-run v1 row, next gate |

---

## Runtime versions

| Tool | Version |
|------|---------|
| Node.js | v22.22.0 |
| Codex CLI | 0.133.0 |

---

## Regression command

```text
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json
```

Exit code: **0**

### Regression output (summary)

- `status`: `needs_human`
- `no_runtime_confirmation`: `true`
- `wrapper_trace.codex_invoked`: `false`
- `wrapper_trace.n8n_invoked`: `false`
- `wrapper_trace.repo_mutation_attempted`: `false`

---

## Codex-read-only command

```powershell
$env:CONTROL_PLANE_ALLOW_CODEX_READONLY = "1"
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json
Remove-Item Env:\CONTROL_PLANE_ALLOW_CODEX_READONLY
```

Exit code: **0**

Codex invoked via `codex exec --skip-git-repo-check --ephemeral --ignore-rules -s read-only --output-schema --output-last-message -C <tempdir>` with inlined context from three docs files. Temp workdir outside repo. No `codex resume`.

### Codex-read-only output (summary)

- `status`: `pass`
- `no_runtime_confirmation`: `true`
- `proposed_prompt_for_cursor`: `null`
- `wrapper_trace.codex_invoked`: `true`
- `wrapper_trace.codex_transport_used`: `true`
- `wrapper_trace.codex_workdir_is_temp`: `true`
- `wrapper_trace.codex_resume_used`: `false`
- `wrapper_trace.n8n_invoked`: `false`
- `wrapper_trace.openclaw_invoked`: `false`
- `wrapper_trace.repo_mutation_attempted`: `false`
- `codex_result.verdict`: `pass`

Full stdout JSON captured at dry-run time; sanitized summary above.

---

## PASS criteria verification

| Criterion | Regression | Codex v1 |
|-----------|------------|----------|
| Exit 0 | PASS | PASS |
| Valid JSON | PASS | PASS |
| Safe status | PASS (`needs_human`) | PASS (`pass`) |
| `no_runtime_confirmation: true` | PASS | PASS |
| `proposed_prompt_for_cursor: null` | PASS | PASS |
| Codex not invoked (regression) | PASS | — |
| Codex invoked (v1) | — | PASS |
| No n8n / wf / PM-34 / API key | PASS | PASS |
| No secrets | PASS | PASS |

**Overall: PASS**

---

## Why no forbidden actions

| System | Reason |
|--------|--------|
| n8n | Wrapper has no n8n client; trace `n8n_invoked: false` |
| Workflows 40/41 | Not referenced for mutation; listed in blocked_actions only |
| PM-34 | Not unlocked; listed in blocked_actions |
| Provider API key | ChatGPT OAuth via Codex CLI only; no API key in fixture or wrapper |
| OpenClaw | Not invoked; trace `openclaw_invoked: false` |
| `codex resume` | Not used; `--ephemeral`; trace `codex_resume_used: false` |
| Repo mutation | Context inlined by wrapper; Codex temp workdir; trace `repo_mutation_attempted: false` |
| Cursor worker | Not invoked; blocked in post-gates |

---

## What remains gated

- n8n runtime integration
- workflow 40 / 41 mutation
- PM-34 unlock
- Codex repo mutation
- Cursor worker automation
- deploy / tag / rollback
- `codex resume` (V1 interrupted session)
- Unattended wrapper automation

---

## Next gate

**Post-dry-run wrapper hardening docs-only** or explicit gate for next local wrapper iteration.

---

## Verification commands run

```text
git rev-parse --show-toplevel
git branch --show-current
git status --short
node --version
codex --version
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json
$env:CONTROL_PLANE_ALLOW_CODEX_READONLY = "1"; node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json
git diff --check
git log -1 --oneline -- <changed-file>   (local + origin/main per file)
```

Commit hash recorded after push in final report.

---

## Security / runtime confirmation

No secrets, tokens, OAuth URLs, or auth material committed. Prompt properties: read-only, anti-tool-use, inlined docs only. No full prompt persisted in Git.
