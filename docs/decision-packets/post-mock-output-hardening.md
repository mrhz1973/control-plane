# Post-mock-output hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/post-mock-output-hardening.md`  
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
- explicit gate required before next local wrapper iteration

**Related:** [Mock-only PASS](../sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-mock-only.md) · [Mock design packet](mock-codex-output-negative-tests-design-packet.md) · [Negative-test hardening](local-wrapper-negative-test-hardening.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Proven

| Item | Evidence |
|------|----------|
| v0 fail-closed regression | [dry-run v0](../sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md); reconfirmed in mock-only session |
| Static no-Codex negative tests | [PASS](../sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md) — six pre-gate fixtures |
| Mock Codex-output negative tests | [PASS](../sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-mock-only.md) — eight mock outputs |
| Malformed mock output rejected | `malformed-non-json.txt` → `failed`, no `pass` |
| Missing `no_runtime_confirmation` | `missing-no-runtime-confirmation.json` → `needs_human` |
| Unsafe next step n8n | `unsafe-next-step-n8n.json` → `needs_human` |
| Unsafe next step PM-34 | `unsafe-next-step-pm34.json` → `needs_human` |
| Non-null `proposed_prompt_for_cursor` | `proposed-prompt-non-null.json` → `needs_human`; bridge output null |
| Contradiction pass + blocked action | `contradiction-pass-with-blocked-action.json` → `needs_human` |
| Secret-shaped mock output | `secret-shaped-output.json` → `needs_human` |
| Unknown verdict enum | `unknown-verdict-enum.json` → `needs_human` |
| v1 Codex-read-only happy path | [dry-run v1 PASS](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) — separate proof |
| No live Codex in mock run | `codex_invoked: false`, `codex_transport_used: false` |
| No n8n | `n8n_invoked: false` |
| No workflow 40/41 mutation | untouched |
| No PM-34 unlock | gated |
| No provider API key | policy **NO** |
| No OpenClaw | `openclaw_invoked: false` |
| No `codex resume` | `codex_resume_used: false` |

**Distinction:** Pre-gates proven by static no-Codex matrix. Post-gates proven by mock-output injection (`--mock-codex-output` + `CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT=1`), not by live Codex adversarial runs.

---

## Not proven

| Gap | Notes |
|-----|-------|
| Live Codex negative tests | Explicitly not authorized; mock-only path used |
| Timeout / non-zero Codex process handling | Not designed or tested |
| Repeated-run idempotency under larger matrix | Same fixture twice not formally tested |
| stderr / empty stdout failure policy | Not exercised |
| Schema drift negotiation | Fixed schema only |
| Redaction under live Codex failure | Mock runs only |
| n8n integration | No wrapper → n8n path |
| Workflow 40/41 routing | No wf touch |
| PM-34 unlock | Gated |
| Unattended automation | Manual operator + env gates only |
| Cursor worker automation | Forbidden; not tested |

---

## Interpretation

| Statement | Implication |
|-----------|-------------|
| Pre-gates and post-gates have local evidence | Input rejection + mock-output sanitization both exercised |
| Mock PASS does not authorize live Codex negatives | Transport still gated separately |
| Mock PASS does not authorize n8n | No n8n client; forbidden actions remain blocked at pre-gate |
| Mock PASS does not authorize PM-34 or unattended automation | Human/env gates only |
| Next work should remain local and gated | Docs-first or explicit small local runs |

---

## Recommended next step

**Local wrapper repeatability/idempotency design packet (docs-only)**

**Rationale:** Before n8n or automation, prove repeated local runs (v0 regression, static negatives, mock negatives) do not create state drift, duplicate side effects, or hidden repo changes. Define expected same-status-class behavior and workspace-clean requirements.

---

## Remaining gates

| Action | Status |
|--------|--------|
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

Mock-output PASS does **NOT** remove any gate above.

---

## Acceptance criteria (this packet)

- [x] Records mock-only PASS accurately
- [x] Distinguishes proven pre/post-gate local evidence from live Codex gaps
- [x] Prevents premature n8n / PM-34 / unattended escalation
- [x] Names conservative next docs-only packet (repeatability/idempotency)
- [x] No runtime in this task
