# PM-77 — OpenClaw lifecycle validator regression review

**Status:** **PASS / REGRESSION REVIEW** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-77-openclaw-lifecycle-validator-regression-review-gate.md) · [PM-75](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md) · [PM-76](PM76_OPENCLAW_LIFECYCLE_TRANSITION_FIXTURES.md)

---

## Scopo

Conferma che PM-75 hardening **non** ha rotto PM-59 e che PM-76 fixtures passano.

---

## PM-59 regression

| Sample | Result |
|--------|--------|
| valid | **PASS** (0) |
| invalid-n8n-ready | **PASS** (1) |
| invalid-pm34-unblock | **PASS** (1) |
| invalid-secret-scan | **PASS** (1) |
| invalid-state | **PASS** (1) |

---

## PM-76 transition fixtures

| Sample | Result |
|--------|--------|
| valid-captured-redacted | **PASS** (0) |
| invalid-schema-with-adapter | **PASS** (1) |
| invalid-adapter-null | **PASS** (1) |
| invalid-captured-redaction-fail | **PASS** (1) |
| invalid-rejected-next-gate | **PASS** (1) |
| invalid-expired-no-expires | **PASS** (1) |

**Total:** 11/11 expected exits match.

---

## Decisione

**PASS** — regression OK · PM-34 **blocked** · `n8n_ready` **false**

---

## Next

**PM-78** — hardening checkpoint.
