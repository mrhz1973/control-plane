# Local-only integration dry-run

**Date:** 2026-05-26  
**Status:** **PASS** — compact local-only integration suite  
**Gate:** Operator explicitly authorized local-only integration dry-run (existing wrapper + fixtures only; no n8n / wf 40/41 / PM-34)  
**Packet:** [local-only-integration-preflight-design-packet](../decision-packets/local-only-integration-preflight-design-packet.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/local-only-integration-preflight-design-packet.md`
- `docs/sessions/2026-05-26-control-plane-local-only-integration-preflight-design-packet-docs-only.md`
- `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` (unchanged)

---

## Files changed

| File | Change |
|------|--------|
| `docs/sessions/2026-05-26-control-plane-local-only-integration-dry-run.md` | This session |
| `docs/foundation/FOUNDATION_STATUS.md` | Dry-run PASS row, next step |

Wrapper and fixtures **not** modified.

---

## Environment

| Tool | Version |
|------|---------|
| Node | v22.22.0 |
| Codex CLI | 0.133.0 |

**Git before/after:** `git status --short` empty (clean).

**Base commit:** `1f68c14`

---

## Commands run

```powershell
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json

node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/negative/forbidden-action-n8n.json

$env:CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT = "1"
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json --mock-codex-output tools/codex-bridge-wrapper/fixtures/mock-codex-output-negative/unsafe-next-step-n8n.json
Remove-Item Env:\CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT

$env:CONTROL_PLANE_ALLOW_CODEX_READONLY = "1"
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json
Remove-Item Env:\CONTROL_PLANE_ALLOW_CODEX_READONLY
```

---

## PASS/FAIL table

| Run | Fixture / mock | Exit | Status | Key trace | Result |
|-----|----------------|------|--------|-----------|--------|
| A | `fixtures/blocked-no-runtime-permission.json` | 0 | `needs_human` | `codex_invoked: false`, `no_runtime_confirmation: true` | **PASS** |
| B | `fixtures/negative/forbidden-action-n8n.json` | 0 | `blocked` | `codex_invoked: false`, pregate `n8n_invocation` | **PASS** |
| C | `success-readonly-codex.json` + mock `unsafe-next-step-n8n.json` | 0 | `needs_human` | `mock_codex_output_used: true`, `codex_invoked: false` | **PASS** |
| D | `fixtures/success-readonly-codex.json` (live §7) | 0 | `pass` | `codex_invoked: true`, `codex_transport_used: true`, `codex_workdir_is_temp: true`, `codex_resume_used: false`, `n8n_invoked: false`, `repo_mutation_attempted: false` | **PASS** |

All runs: `proposed_prompt_for_cursor: null`, `no_runtime_confirmation: true` on bridge JSON.

**Overall:** **PASS**

---

## Safety confirmation

| Check | Result |
|-------|--------|
| n8n | not invoked (`n8n_invoked: false` all runs) |
| workflow 40/41 | not touched |
| PM-34 | not unlocked |
| provider API key | not used |
| OpenClaw | not invoked |
| `codex resume` | not used |
| Codex repo mutation | not attempted |
| Cursor worker automation | not used |
| deploy/tag/rollback | not performed |
| unattended automation | not used |
| unexpected repo files | none (`git status` clean after) |

---

## What remains gated

- post-local-only integration hardening (docs-only)
- live Codex negative tests
- timeout/outage/rate-limit runtime tests
- n8n integration, wf 40/41, PM-34, unattended automation

---

## Next gate

**Post-local-only integration hardening (docs-only)**

---

## Verification commands

```text
git status --short
node --version
codex --version
git diff --check
git log -1 --oneline -- docs/sessions/2026-05-26-control-plane-local-only-integration-dry-run.md
git log -1 --oneline origin/main -- docs/sessions/2026-05-26-control-plane-local-only-integration-dry-run.md
```

**Commit:** recorded in final report after push.
