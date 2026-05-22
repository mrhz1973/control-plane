# PM-77 — OpenClaw lifecycle validator regression review

**Status:** **PASS / REGRESSION REVIEW** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-77-openclaw-lifecycle-validator-regression-review-gate.md) · [PM-75](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md) · [PM-76](PM76_OPENCLAW_LIFECYCLE_TRANSITION_FIXTURES.md)

---

## PM-59 regression

| Sample | Exit | `valid` |
|--------|------|---------|
| `pm59-openclaw-lifecycle-metadata-valid.sample.json` | **0** | true |
| `pm59-openclaw-lifecycle-metadata-invalid-n8n-ready.sample.json` | **1** | false |
| `pm59-openclaw-lifecycle-metadata-invalid-pm34-unblock.sample.json` | **1** | false |
| `pm59-openclaw-lifecycle-metadata-invalid-secret-scan.sample.json` | **1** | false |
| `pm59-openclaw-lifecycle-metadata-invalid-state.sample.json` | **1** | false |

---

## PM-74 transition fixtures

| Sample | Exit | `valid` |
|--------|------|---------|
| `pm74-…-valid-schema-to-adapter.sample.json` | **0** | true |
| `pm74-…-invalid-skip-redaction.sample.json` | **1** | false |
| `pm74-…-invalid-n8n-ready.sample.json` | **1** | false |
| `pm74-…-invalid-pm34-unblock.sample.json` | **1** | false |
| `pm74-…-invalid-expired-promoted.sample.json` | **1** | false |

**Total:** **10/10** expected exits.

---

## Confirmations

| Item | State |
|------|--------|
| OpenClaw / gateway / n8n | **Not** invoked |
| Workflow 40 / 41 / worker | **Untouched** |
| PM-34 | **Blocked** |
| `n8n_ready` | **false** |

---

## Decisione

**PASS**

---

## Next

**PM-78** — hardening checkpoint.
