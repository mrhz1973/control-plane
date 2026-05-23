# PM-34 strict_pass dry-run mock-worker

## Metadata

| Field | Value |
|-------|--------|
| **Project** | control-plane |
| **Repository** | mrhz1973/control-plane |
| **Branch** | main |
| **Mode** | runtime-dry-run |
| **Gate** | PM-34 strict_pass dry-run |
| **Route** | cursor-control-plane |
| **Risk** | controlled |
| **Approval required** | operator-approved |
| **Worker** | mock-worker |
| **Action** | strict_pass dry-run only |
| **Codex** | forbidden |
| **Real worker** | forbidden |
| **OpenClaw** | forbidden |
| **n8n import/export** | forbidden |
| **workflow_40_modified** | false |
| **workflow_41_modified** | false |
| **pm34_unblocked** | false |
| **n8n_ready** | false |
| **strict_pass_candidate** | false (before result) |

## References

- [dry-run package](../sessions/2026-05-23-control-plane-strict-pass-dry-run-package.md)
- [readiness checklist](../sessions/2026-05-23-control-plane-strict-pass-dry-run-readiness-checklist.md)
- [artifact fixture](../examples/strict-pass-artifact-v1.example.json)
- [strict_pass contract](../sessions/2026-05-23-control-plane-strict-pass-artifact-contract-design.md)

## Purpose

Trigger workflow **40** Gate D / PM21 path for an **authorized** strict_pass dry-run using **mock-worker** only. Validate artifact shape and boundaries — not real-worker activation.

## Scope

- Existing workflow **40** only (no edit).
- Telegram preview expected.
- **mock-worker** / dry-run behavior only.
- No workflow **40** or **41** edit.
- No n8n import/export.
- No Codex.
- No real worker.
- No OpenClaw.
- No `docs/artifacts/openclaw/**`.
- No raw logs or secrets in git from this trigger.

## Expected workflow interpretation

| Signal | Expected |
|--------|----------|
| **plan_detected** | `CONTROL PLANE plan_detected` for this file |
| **Gate** | PM-34 strict_pass dry-run |
| **Route** | cursor-control-plane |
| **Worker** | mock-worker |
| **Bridge result** | `dry_run_pass`, `dry_run_fail`, or `dry_run_blocked` |
| **Codex invoked** | false |
| **Real worker enabled** | false |
| **Action** | validate strict_pass artifact shape and boundaries only |

## Hard boundaries

- Do not modify workflow **40** or **41**.
- Do not import/export n8n workflows.
- Do not invoke Codex.
- Do not enable real worker.
- Do not run OpenClaw.
- Do not create `docs/artifacts/openclaw/**`.
- Do not commit raw logs.
- Do not capture secrets, tokens, cookies, PATs, OAuth values, Telegram tokens, bearer values, browser tokens, or API keys.
- Do not set `pm34_unblocked=true`, `n8n_ready=true`, or `strict_pass_candidate=true` in this plan file.

## PASS criteria (operator / orchestrator)

- Scheduled poll commit notification for this push.
- `plan_detected` for `docs/plans/pm34-strict-pass-dry-run-mock-worker.plan.md`.
- Gate D plan file message.
- PM-21 bridge summary with mock-worker and dry-run result.
- No workflow side effects.

## Next step after Telegram/n8n result

1. Operator returns **aggio control**.
2. Orchestrator verifies Telegram result and GitHub state.
3. **Only then** create sanitized result evidence (session doc / artifact) — not in this commit.

**Operator note:** Authorized runtime trigger for mock-worker strict_pass dry-run only. PM-34 real worker remains gated until separate gate after validated artifact.
