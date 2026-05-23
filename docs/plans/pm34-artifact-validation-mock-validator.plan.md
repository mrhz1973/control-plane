# PM-34 artifact-validation mock-validator

## Metadata

| Field | Value |
|-------|--------|
| **Project** | control-plane |
| **Repository** | mrhz1973/control-plane |
| **Branch** | main |
| **Mode** | runtime-artifact-validation |
| **Gate** | PM-34 artifact-validation mock/validator |
| **Task** | PM-34 artifact-validation mock/validator |
| **Route** | cursor-control-plane |
| **Risk** | controlled |
| **Approval required** | operator-approved |
| **Worker** | mock-worker / validator-only |
| **Worker type** | mock-worker |
| **Action** | artifact validation only |
| **Codex** | forbidden (no real Codex invocation) |
| **Real worker** | forbidden |
| **OpenClaw** | forbidden |
| **n8n import/export** | forbidden |
| **workflow_40_modified** | false |
| **workflow_41_modified** | false |
| **pm34_unblocked** | false |
| **n8n_ready** | false |
| **strict_pass_candidate** | false (before result; true only if validator output is explicit and contract-valid) |
| **human_gate_required** | true (before any real worker) |

## References

- [readiness audit](../sessions/2026-05-23-control-plane-pm34-artifact-validation-readiness-audit.md)
- [strict_pass contract](../sessions/2026-05-23-control-plane-strict-pass-artifact-contract-design.md)
- [dry-run package](../sessions/2026-05-23-control-plane-strict-pass-dry-run-package.md)
- [artifact fixture](../examples/strict-pass-artifact-v1.example.json)
- [prior dry-run result](../sessions/2026-05-23-control-plane-pm34-strict-pass-dry-run-result.md)

## Purpose

Trigger workflow **40** Gate D / PM21 to **observe** a PM-34 **artifact-validation** gate using **mock-worker** or **validator-only** behavior. Validate strict_pass artifact shape and contract boundaries — **not** real-worker activation.

## Scope

- Existing workflow **40** only (no edit).
- **Telegram preview expected.**
- **mock-worker** / validator-only — no real worker.
- No workflow **40** or **41** mutation.
- No n8n import/export.
- No real Codex invocation.
- No OpenClaw.
- No `docs/artifacts/openclaw/**`.
- No secrets or raw logs in git from this trigger.

## Expected workflow interpretation

| Signal | Expected |
|--------|----------|
| **plan_detected** | `CONTROL PLANE plan_detected` for this file |
| **Gate** | PM-34 artifact-validation |
| **Route** | cursor-control-plane |
| **Worker** | mock-worker |
| **Bridge result** | `dry_run_pass`, `dry_run_fail`, or `dry_run_blocked` |
| **Codex invoked** | false |
| **Real worker enabled** | false |
| **Action** | artifact validation only — contract shape and boundaries |

## Hard boundaries

- Do not modify workflow **40** or **41**.
- Do not import/export n8n workflows.
- Do not invoke real Codex.
- Do not enable real worker.
- Do not run OpenClaw.
- Do not create `docs/artifacts/openclaw/**`.
- Do not commit raw logs.
- Do not capture secrets, tokens, cookies, PATs, OAuth values, Telegram tokens, bearer values, browser tokens, or API keys.
- Do not set `pm34_unblocked=true` or `n8n_ready=true` in this plan file.
- `strict_pass_candidate` must remain **false** in this plan file unless a future separate gate documents contract-valid validator output.

## PASS criteria (operator / orchestrator)

- Scheduled poll commit notification for this push.
- `plan_detected` for `docs/plans/pm34-artifact-validation-mock-validator.plan.md`.
- Gate D plan file message.
- PM-21 bridge summary with mock-worker and dry-run / validation result.
- No workflow side effects.

## Next step after Telegram/n8n result

1. Operator sends **aggio control** after notification or reasonable polling timeout.
2. Orchestrator verifies Telegram result and GitHub state.
3. **Only then** record sanitized artifact-validation result — not in this commit.

**Operator note:** Artifact-validation trigger only. PM-34 real worker remains gated. Human gate required before any real worker.
