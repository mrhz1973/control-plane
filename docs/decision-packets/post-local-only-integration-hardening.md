# Post-local-only integration hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/post-local-only-integration-hardening.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY HARDENING**
- no runtime executed by this task
- no Codex execution by this task
- no n8n invocation
- no wrapper code changes
- no fixture changes
- no workflow 40/41 mutation
- no PM-34 unlock
- explicit gate required before any next runtime or integration step

**Related:** [Local-only integration dry-run PASS](../sessions/2026-05-26-control-plane-local-only-integration-dry-run.md) · [Integration preflight](local-only-integration-preflight-design-packet.md) · [Readiness review](local-wrapper-runtime-readiness-review.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Proven

| Item | Evidence |
|------|----------|
| Local-only integration dry-run | **PASS** — [session](../sessions/2026-05-26-control-plane-local-only-integration-dry-run.md) |
| Compact 4-run suite | All four cases PASS (exit 0, expected status classes) |
| v0 blocked regression (Run A) | `needs_human`; `codex_invoked: false`; pre-gate fail-closed |
| Static no-Codex negative (Run B) | `blocked`; forbidden `n8n_invocation` rejected at pre-gate |
| Mock-output negative (Run C) | `needs_human`; post-gate rejected unsafe mock; `mock_codex_output_used: true`; never `pass` |
| Live §7 read-only success (Run D) | `pass`; §7 via wrapper with env gate |
| `no_runtime_confirmation` | `true` on all four bridge JSON outputs |
| `proposed_prompt_for_cursor` | `null` on all four runs |
| Codex live path temp workdir | `codex_workdir_is_temp: true` (Run D) |
| `codex resume` not used | `codex_resume_used: false` (Run D) |
| n8n not invoked | `n8n_invoked: false` all runs |
| Workflow 40/41 untouched | No export/import/mutation in repo |
| PM-34 gated | Not unlocked |
| Provider API key not used | OAuth via Codex CLI only on Run D |
| OpenClaw not invoked | `openclaw_invoked: false` all runs |
| Codex repo mutation not attempted | `repo_mutation_attempted: false` all runs |
| Workspace clean | Before and after suite (`git status --short` empty) |

**Local-only integration composition (proven once):**

```text
allowlisted fixture → local wrapper → pre-gates / optional §7 or mock → post-gates → bridge JSON
  (no n8n, no wf mutation, no PM-34, operator present, env gates cleared after)
```

**Cumulative local phase evidence (includes prior wrapper matrix + this suite):**

| Layer | Status |
|-------|--------|
| v0 fail-closed | PASS |
| v1 Codex-read-only | PASS |
| Static / mock negatives | PASS |
| Repeatability (no-Codex + mock + live 3×) | PASS |
| Local-only integration 4-run suite | PASS |

---

## Not proven

| Gap | Notes |
|-----|-------|
| n8n integration | No wrapper → n8n client; Run B only proves pre-gate rejection of n8n in fixture |
| Workflow 40/41 routing | Production wf untouched |
| PM-34 unlock | Real worker gated |
| Live Codex negative tests | Adversarial live transport not run in integration suite |
| Timeout / outage / rate-limit handling | Not exercised |
| Cross-machine execution | Ryzen-only operator evidence |
| Unattended scheduler behavior | Manual gate + env vars only |
| Cursor worker automation | Forbidden; not tested |
| Tailscale worker loop | Not composed |
| Durable redaction / logging under failure | Session policy not stress-tested under failure storms |

---

## Interpretation

| Statement | Implication |
|-----------|-------------|
| Local-only integration boundary now has compact end-to-end evidence | Fail-closed, static negative, mock post-gate, and live §7 happy path compose on one workstation |
| Integration dry-run PASS does **not** authorize n8n | No n8n runtime/API; pre-gate block is not integration |
| Integration dry-run PASS does **not** authorize PM-34 | Worker remains gated |
| Local PASS does **not** imply automation readiness | Operator, env gates, and explicit human gates still required |
| Next step must remain design-first and gated | Close local phase on paper before any n8n-facing preflight packet |

**Why this still does not authorize forbidden actions:**

| Forbidden | Reason |
|-----------|--------|
| n8n | No invocation; no routing design executed |
| workflow 40/41 | No mutation; routing unproven |
| PM-34 | Gated by policy; no unlock evidence |
| provider API key | Not configured or used |
| OpenClaw `agent main` | Not invoked |
| `codex resume` | Trace shows false |
| Codex repo mutation | Not attempted; workspace clean |
| Cursor worker automation | Not part of suite |
| deploy / tag / rollback | Not performed |
| unattended automation | Manual operator only |

---

## Recommended next step

**n8n-free local integration readiness closeout (docs-only)**

**Rationale:** Before any n8n-facing packet, close the local-only phase by summarizing cumulative evidence, remaining gates, and exact conditions under which a future **n8n preflight design** (still not runtime) could be considered—without implying n8n authorization.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n integration | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Forbidden** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |
| Live Codex negative tests | **Gated** |
| Timeout / outage / rate-limit runtime tests | **Gated** |
| Cross-machine execution | **Gated** |

This hardening packet does **NOT** open any gate above.

---

## Acceptance criteria (this packet)

- [x] Records proven items from integration dry-run PASS
- [x] Lists not-proven integration/automation gaps
- [x] States interpretation and forbidden escalations
- [x] Recommends n8n-free local closeout as next docs step
- [x] No runtime in this task
