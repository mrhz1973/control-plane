# Local wrapper runtime readiness review

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/local-wrapper-runtime-readiness-review.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY REVIEW**
- no runtime executed by this task
- no Codex execution by this task
- no n8n invocation
- no wrapper code changes
- no fixture changes
- no workflow 40/41 mutation
- no PM-34 unlock
- explicit gate required before any integration/runtime step

**Related:** [Post-live-Codex hardening](post-live-codex-repeatability-hardening.md) · [Wrapper design v1](../contracts/codex-bridge-wrapper-design-v1.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Evidence reviewed

| Step | Artifact | Result |
|------|----------|--------|
| Wrapper design | [codex-bridge-wrapper-design-v1](../contracts/codex-bridge-wrapper-design-v1.md) | DESIGN COMPLETE |
| Dry-run preflight | [bridge-wrapper-runtime-dry-run-preflight](bridge-wrapper-runtime-dry-run-preflight.md) | DESIGN PACKET COMPLETE |
| v0 fail-closed | [dry-run v0](../sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md) | **PASS** |
| v1 Codex-read-only | [dry-run v1](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) | **PASS** |
| Post-dry-run hardening | [post-dry-run-wrapper-hardening](post-dry-run-wrapper-hardening.md) | DOCS COMPLETE |
| Static no-Codex negatives | [static no-Codex session](../sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md) | **PASS** |
| Mock-output negatives | [mock-only session](../sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-mock-only.md) | **PASS** |
| No-Codex + mock repeatability | [repeatability no-Codex mock](../sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-no-codex-mock-only.md) | **PASS** |
| Live Codex repeatability max3 | [live max3 session](../sessions/2026-05-26-control-plane-live-codex-repeatability-run-local-max3.md) | **PASS** |
| Post-live-Codex hardening | [post-live-codex-repeatability-hardening](post-live-codex-repeatability-hardening.md) | DOCS COMPLETE |

Implementation: `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` (reviewed read-only; not modified here).

---

## Readiness strengths

| Area | Assessment |
|------|------------|
| Pre-gates | Evidence from v0, static negatives, repeatability |
| Post-gates | Evidence from mock-output negatives, repeatability |
| Repeatability | 15×3 no-Codex/mock + 3× live Codex happy path |
| Live Codex happy path | Limited repeatability (`pass` ×3); §7 read-only profile |
| Env gates | `CONTROL_PLANE_ALLOW_CODEX_READONLY`, `CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT` |
| Codex workdir | Temp outside repo (`codex_workdir_is_temp: true`) |
| No `codex resume` | Trace evidence across runs |
| No repo mutation | `repo_mutation_attempted: false` across matrix |
| No n8n / wf / PM-34 | Trace and scope evidence; wf untouched in repo |
| Fail-closed posture | Documented in design + hardening packets |
| Operator model | Manual gate + explicit session evidence chain |

**Verdict on local wrapper boundary:** Ready for **further local-only design** steps. Not ready for n8n, PM-34, unattended automation, or Cursor worker integration.

---

## Readiness gaps

| Gap | Risk if ignored |
|-----|-----------------|
| Live Codex negative tests | Unsafe live transport paths uncharacterized |
| Timeout / outage / rate-limit | Fail-closed behavior under Codex unavailability unknown |
| Cross-machine repeatability | Ryzen-only; Dell/VPS paths unproven |
| n8n integration | No wrapper → n8n client; wf 40/41 routing unproven |
| Workflow 40/41 routing | Production wf untouched by wrapper tests |
| PM-34 unlock | Real worker gated |
| Unattended automation | No scheduler/loop evidence |
| Cursor worker automation | Forbidden; not tested |
| Durable logging / redaction under failure | stderr/session policy incomplete for failure storms |
| Operator rollback / abort procedure | Not formalized in runbook |

---

## Minimum criteria before next runtime gate

Before any future runtime gate opens, all must be true:

| # | Criterion |
|---|-----------|
| 1 | Local wrapper code frozen or change explicitly re-gated with full regression |
| 2 | Explicit allowed runtime scope documented (fixtures, env vars, run count) |
| 3 | **No** n8n invocation |
| 4 | **No** workflow 40/41 mutation |
| 5 | **No** PM-34 unlock |
| 6 | **No** provider API key configuration or use |
| 7 | **No** OpenClaw `agent main` |
| 8 | **No** `codex resume` |
| 9 | **No** Codex repo mutation |
| 10 | Workspace `git status --short` clean before and after |
| 11 | Sanitized session evidence committed |
| 12 | Abort conditions defined (Codex auth fail, quota, malformed output, dirty workspace) |

---

## Abort conditions (recommended)

Future runs must **STOP** (no commit, report FAIL) if:

- Codex requires provider API key
- Wrapper invokes n8n or touches wf 40/41
- `codex_resume_used: true`
- `repo_mutation_attempted: true` or unexpected `git status` changes
- Bridge `status: pass` with unsafe `recommended_next_step` or non-null `proposed_prompt_for_cursor`
- Operator cannot restore clean workspace without manual intervention

---

## Recommended next step

**Local-only integration preflight design packet (docs-only)**

**Rationale:** Before any further runtime, define exactly what “local-only integration” means, what it includes, and what it explicitly excludes (n8n, Tailscale worker loops, PM-34, unattended schedules).

---

## Remaining gates

| Action | Status |
|--------|--------|
| Live Codex negative tests | **Gated** |
| Timeout / outage / rate-limit runtime tests | **Gated** |
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

This review does **NOT** open any gate above.

---

## Acceptance criteria (this review)

- [x] Summarizes full evidence chain
- [x] Separates strengths from gaps
- [x] Defines minimum criteria before next runtime gate
- [x] Does not authorize n8n / PM-34 / automation
- [x] Names next docs-only step (local-only integration preflight)
- [x] No runtime in this task
