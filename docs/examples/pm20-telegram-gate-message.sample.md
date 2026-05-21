# PM-20 — Telegram bridge message samples (templates only)

**Not sent by n8n in PM-20.** Future runtime copies/adapts these patterns. **No secrets.**

---

## Example A — low risk / no gate

```text
CONTROL PLANE bridge decision

Repo: mrhz1973/control-plane
Plan: docs/plans/2026-05-21_2330_pm15-new-40-smoke.plan.md
Commit: c0ea042

Risk: low
Route: cursor-control-plane
Approval required: no

Bridge result: dry_run_pass
Worker: mock-worker
Action: handoff preview prepared — no automatic Codex execution in PM-20.

Classifier + bridge JSON attached for audit.
```

---

## Example B — high risk / gate required

```text
CONTROL PLANE HUMAN GATE REQUIRED

Repo: mrhz1973/control-plane
Plan: docs/plans/<plan-file>.plan.md
Commit: <short-sha>

Risk: high
Reason: approval_required or non-control-plane route or medium/high risk

Approve? reply yes/no in Telegram thread.

No worker invoked until explicit approval and PM-18 Codex gate PASS.
```
