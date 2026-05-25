# Post-live-Codex-repeatability hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/post-live-codex-repeatability-hardening.md`  
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
- explicit gate required before any next runtime or automation step

**Related:** [Live Codex repeatability PASS](../sessions/2026-05-26-control-plane-live-codex-repeatability-run-local-max3.md) · [Live Codex design](live-codex-repeatability-design-packet.md) · [Post-repeatability hardening](post-repeatability-hardening.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Proven

| Item | Evidence |
|------|----------|
| Live Codex repeatability local max3 | [PASS session](../sessions/2026-05-26-control-plane-live-codex-repeatability-run-local-max3.md) |
| 3 runs via wrapper | `success-readonly-codex.json` + `CONTROL_PLANE_ALLOW_CODEX_READONLY=1` |
| Status stable | `pass` on all 3 runs |
| `no_runtime_confirmation` | `true` on all 3 runs |
| Codex invoked through wrapper | `codex_invoked: true` |
| Codex transport used | `codex_transport_used: true` |
| Codex workdir temp / outside repo | `codex_workdir_is_temp: true` |
| `codex resume` not used | `codex_resume_used: false` |
| n8n not invoked | `n8n_invoked: false` |
| OpenClaw not invoked | `openclaw_invoked: false` |
| Workflow 40/41 untouched | No export/import/mutation |
| PM-34 gated | Not unlocked |
| Provider API key not used | ChatGPT OAuth via Codex CLI only |
| Codex repo mutation not attempted | `repo_mutation_attempted: false` |
| `proposed_prompt_for_cursor` | `null` all runs |
| Workspace clean | Before and after matrix |

**Cumulative wrapper evidence chain:**

| Layer | Status |
|-------|--------|
| v0 fail-closed | PASS |
| v1 Codex-read-only (single run) | PASS |
| Static no-Codex negatives | PASS |
| Mock-output negatives | PASS |
| No-Codex + mock repeatability | PASS |
| Live Codex repeatability (3 runs) | PASS |

---

## Not proven

| Gap | Notes |
|-----|-------|
| Live Codex negative tests | Adversarial live transport not run |
| n8n integration | No wrapper → n8n path |
| Workflow 40/41 routing | No wf touch |
| PM-34 unlock | Gated |
| Unattended automation | Manual operator + env gates only |
| Cursor worker automation | Forbidden; not tested |
| Long-running scheduler behavior | No cron/CI loop |
| Cross-machine repeatability | Ryzen-only evidence |
| Failure/timeout under live Codex outage | Not exercised |
| Quota / rate-limit handling | Not characterized |

---

## Interpretation

| Statement | Implication |
|-----------|-------------|
| Wrapper has no-Codex, mock-output, and limited live Codex repeatability evidence | Pre-gate, post-gate, and §7 transport stability on happy path |
| Live Codex PASS does not authorize n8n | No n8n client; forbidden actions remain blocked |
| Live Codex PASS does not authorize PM-34 | Real worker remains gated |
| Live Codex success does not imply safe automation | Operator and env gates still required |
| Next step should stay local / design-first | Readiness review before any integration gate |

---

## Recommended next step

**Local wrapper runtime readiness review (docs-only)**

**Rationale:** Before any n8n or automation gate, review all accumulated wrapper evidence and define minimal readiness criteria for a future local-only integration step (what must be true on paper before the next runtime gate opens).

---

## Remaining gates

| Action | Status |
|--------|--------|
| Live Codex negative tests | **Gated** |
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

Live Codex repeatability PASS does **NOT** remove any gate above.

---

## Acceptance criteria (this packet)

- [x] Records live Codex repeatability PASS accurately
- [x] Distinguishes proven local transport from integration gaps
- [x] Prevents premature n8n / PM-34 / unattended escalation
- [x] Names conservative next docs-only step (runtime readiness review)
- [x] No runtime in this task
