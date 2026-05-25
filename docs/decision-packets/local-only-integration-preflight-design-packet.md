# Local-only integration preflight design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/local-only-integration-preflight-design-packet.md`  
**Date:** 2026-05-26

## Status

- **DESIGN PACKET ONLY**
- no runtime executed by this task
- no Codex execution by this task
- no n8n invocation
- no workflow 40/41 mutation
- no PM-34 unlock
- no wrapper code changes
- no fixture changes
- explicit gate required before any local-only integration runtime step

**Related:** [Local wrapper runtime readiness review](local-wrapper-runtime-readiness-review.md) · [Wrapper design v1](../contracts/codex-bridge-wrapper-design-v1.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

The [local wrapper runtime readiness review](local-wrapper-runtime-readiness-review.md) concludes the local wrapper boundary has **strong evidence for design-first next steps** (pre-gates, post-gates, repeatability, limited live Codex happy path).

**Integration is still not authorized.** No n8n client, no workflow routing, no PM-34 unlock, and no unattended loops may be implied by prior PASS sessions.

This packet defines the **boundary** of a future **local-only integration** step: what may be composed on one operator workstation, what is forbidden, what preflight must pass before a gated dry-run, and what evidence a future session must produce.

This document does **not** open a runtime gate.

---

## Local-only integration means

Future local-only integration (when explicitly gated) is limited to:

| Included | Definition |
|----------|------------|
| Local wrapper process | `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` invoked by operator on approved workstation |
| Local static/synthetic fixtures | Allowlisted JSON under `tools/codex-bridge-wrapper/fixtures/` only unless a **separate** gate documents additional paths |
| Local session evidence | Sanitized commands, versions, PASS/FAIL table, `git status` before/after — committed to `docs/sessions/` |
| Operator-in-the-loop | Human starts run, verifies abort conditions, clears env gates after run |
| Optional live Codex | **Only** if a separate human gate explicitly allows §7 read-only profile (not default for first integration dry-run) |

**Composition model (design target):**

```text
allowlisted fixture
  → local wrapper (stdin/argv per existing contract)
  → pre-gates / optional §7 / post-gates
  → bridge JSON out
  → operator verifies trace + workspace
  → session record (no secrets)
```

| Constraint | Rule |
|------------|------|
| Host | Single local machine (e.g. Ryzen); operator present |
| Network | No n8n API/UI; no Tailscale worker loop as part of integration |
| Persistence | No repo writes from Codex; no wf export/import |
| Automation | No cron, no CI loop, no Cursor worker driving the run |

---

## Explicitly excluded

The following are **out of scope** for local-only integration and must not appear in a gated run plan:

| Excluded | Reason |
|----------|--------|
| n8n runtime / API / UI | No wrapper → n8n path; VPS loopback unchanged |
| Workflow 40 / 41 mutation | Production wf untouched |
| PM-34 unlock | Real worker remains gated |
| Provider API key | ChatGPT OAuth via Codex CLI only when Codex gated; no OpenAI API key config |
| OpenClaw `agent main` | Forbidden action class |
| `codex resume` | Forbidden; trace must show `codex_resume_used: false` |
| Codex repo mutation | `repo_mutation_attempted` must remain false; workspace clean |
| Cursor worker automation | No agent-driven wrapper loops |
| Deploy / tag / rollback | Infra change forbidden |
| Unattended automation | No scheduler firing wrapper |
| Cross-machine execution | Dell/VPS/Tailscale paths not in first integration scope |
| Tailscale worker loop | PM-34 / worker routing not composed |

---

## Future preflight requirements

Before any local-only integration **runtime** step, operator must verify:

| # | Check |
|---|--------|
| 1 | **Repo path** — `git rev-parse --show-toplevel` ends in `control-plane` |
| 2 | **Branch** — `main` (or explicitly documented exception with human approval) |
| 3 | **Workspace clean** — `git status --short` empty before run |
| 4 | **Node available** — version recorded in session |
| 5 | **Codex** — only if separately gated; version recorded; OAuth assumed, no provider API key |
| 6 | **Wrapper path** — `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` exists and matches expected commit |
| 7 | **Fixture allowlist** — path under `fixtures/` documented in run plan; no ad-hoc secret-bearing JSON |
| 8 | **Env gates** — only documented vars set (`CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT`, `CONTROL_PLANE_ALLOW_CODEX_READONLY` as applicable); **unset after run** |
| 9 | **Output evidence** — sanitized (no tokens, PATs, webhook IDs, chat IDs) |
| 10 | **Abort conditions** — operator has read § Abort conditions below before starting |

**Pull policy:** `git fetch` + `git pull --ff-only origin main` before run; record base commit in session.

---

## Abort conditions

Stop immediately (mark FAIL, do not commit unsafe artifacts) if:

| Condition | Action |
|-----------|--------|
| Dirty workspace before or after | STOP — investigate unexpected changes |
| Wrong repo or branch | STOP |
| Unexpected file changes outside allowlisted outputs | STOP |
| Wrapper trace shows n8n / workflow / PM-34 invocation | STOP |
| Provider API key requested or configured for run | STOP |
| `codex_resume_used: true` | STOP |
| `repo_mutation_attempted: true` or non-clean `git status` after | STOP |
| Unsafe `recommended_next_step` or non-null `proposed_prompt_for_cursor` on `pass` | STOP |
| Malformed bridge JSON / missing required trace fields | STOP |
| Operator cannot verify evidence chain | STOP — no PASS claim |

---

## Evidence requirements

A future local-only integration runtime session must include:

| Section | Content |
|---------|---------|
| Commands | Exact invocation (fixture path, env vars, flags) |
| Versions | Node, Codex (if used), wrapper git commit |
| Fixtures | Allowlisted paths and purpose |
| Env gates | Which were set; confirmation cleared after |
| Output summaries | Status class per case; key trace booleans (no raw secrets) |
| Git status | Before and after (`--short`) |
| PASS/FAIL table | One row per case with stable status class |
| Remaining gates | Explicit list of what this run did **not** open |

---

## Recommended next step

**Explicit human gate for local-only integration dry-run** — no n8n, no workflow 40/41, no PM-34.

Operator must approve a written run plan (fixtures, env gates, case count, Codex yes/no) before any execution. First integration dry-run should prefer **no live Codex** unless a separate gate already exists for §7 on that plan.

---

## Remaining gates

| Gate | Status |
|------|--------|
| Local-only integration runtime | **Gated** — requires explicit human gate above |
| Live Codex negative tests | **Gated** |
| Timeout / outage / rate-limit runtime tests | **Gated** |
| n8n integration | **Gated** |
| Workflow 40 / 41 | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Forbidden** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |

This design packet does **NOT** open any gate above.

---

## Acceptance criteria (this packet)

- [x] Defines local-only integration scope and exclusions
- [x] Lists future preflight and abort conditions
- [x] Specifies evidence requirements for a future session
- [x] Does not authorize runtime, n8n, PM-34, or automation
- [x] Names next step as explicit human gate for integration dry-run
