# Post-repeatability hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/post-repeatability-hardening.md`  
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
- explicit gate required before any next runtime or live Codex iteration

**Related:** [Repeatability PASS](../sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-no-codex-mock-only.md) · [Repeatability design](local-wrapper-repeatability-idempotency-design-packet.md) · [Mock-only PASS](../sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-mock-only.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Proven

| Item | Evidence |
|------|----------|
| v0 blocked repeatability | [PASS session](../sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-no-codex-mock-only.md) — 3× `needs_human` |
| Static no-Codex negative repeatability | 6 fixtures × 3 runs — stable blocked / needs_human / stderr reject |
| Mock-output negative repeatability | 8 mock files × 3 runs — stable `failed` or `needs_human`; never `pass` |
| Matrix size | **15 cases × 3 runs** (45 total) |
| Stable status class | Same class per fixture across all 3 runs |
| Workspace clean | `git status` empty before and after matrix |
| No unexpected repo files | No hidden wrapper state under repo |
| v1 happy path (single run) | [dry-run v1 PASS](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) — separate from repeatability |
| No live Codex in repeatability run | `codex_invoked: false` on all JSON outputs |
| No n8n | `n8n_invoked: false` |
| No workflow 40/41 mutation | untouched |
| No PM-34 unlock | gated |
| No provider API key | policy **NO** |
| No OpenClaw | `openclaw_invoked: false` |
| No `codex resume` | `codex_resume_used: false` |

**Distinction:** Repeatability proves **deterministic local behavior** for no-Codex and mock-only paths. It does not prove live Codex stability under quota, auth, or network variance.

---

## Not proven

| Gap | Notes |
|-----|-------|
| Live Codex repeatability | Group 4 in design packet — not executed |
| Live Codex negative tests | Mock-only adversarial path used instead |
| n8n integration | No wrapper → n8n path |
| Workflow 40/41 routing | No wf touch |
| PM-34 unlock | Gated |
| Unattended automation | Manual operator + env gates only |
| Cursor worker automation | Forbidden; not tested |
| Long-run scheduler behavior | No cron/CI wrapper loop |
| Cross-machine repeatability | Ryzen-only evidence so far |
| Timeout / non-zero Codex exit under repeat | Not in repeatability matrix |

---

## Interpretation

| Statement | Implication |
|-----------|-------------|
| Local paths have pre-gate, post-gate, and repeatability evidence | Input rejection, mock sanitization, and 3× stability verified |
| Repeatability PASS does not authorize n8n | No n8n client; forbidden actions remain pre-gate blocked |
| Repeatability PASS does not authorize unattended automation | Operator and env gates still required |
| Repeatability PASS does not authorize live Codex repeat | Transport not exercised in 45-run matrix |
| Next work should remain gated and local-first | Docs design before any live Codex repeat run |

---

## Recommended next step

**Live Codex repeatability design packet (docs-only)**

**Rationale:** Before n8n or automation, design how a **limited** live Codex repeatability check would be safely scoped (fixture subset, env gates, quota/auth failure handling, expected drift policy) — without executing it in the design task.

---

## Remaining gates

| Action | Status |
|--------|--------|
| Live Codex repeatability | **Gated** — separate explicit gate |
| Live Codex negative tests | **Gated** — separate explicit gate |
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

Repeatability PASS does **NOT** remove any gate above.

---

## Acceptance criteria (this packet)

- [x] Records repeatability PASS accurately
- [x] Distinguishes proven local repeatability from live Codex gaps
- [x] Prevents premature n8n / PM-34 / unattended escalation
- [x] Names conservative next docs-only packet (live Codex repeatability design)
- [x] No runtime in this task
