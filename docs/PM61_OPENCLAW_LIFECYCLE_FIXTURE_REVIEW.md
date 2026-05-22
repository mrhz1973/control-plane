# PM-61 — OpenClaw lifecycle fixture review

**Status:** **PASS / FIXTURE REVIEW** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-61-openclaw-lifecycle-fixture-review-gate.md) · [PM-60](PM60_OPENCLAW_LIFECYCLE_METADATA_VALIDATOR_DRY_RUN.md)

---

## Scopo

Review PM-59 lifecycle metadata fixtures against PM-60 validator — docs/fixtures only.

---

## Fixture review

| Fixture | Expected | PM-61 finding |
|---------|----------|---------------|
| **valid** | `valid: true`, exit 0 | **OK** — coherent `adapter_validated`, scans pass |
| **invalid-n8n-ready** | reject `n8n_ready: true` | **OK** — exit 1, `n8n_ready must be false` |
| **invalid-pm34-unblock** | reject `pm34_unblock: true` | **OK** — exit 1, `pm34_unblock must be false` |
| **invalid-secret-scan** | reject `secret_scan: fail` on promoted state | **OK** — exit 1 |
| **invalid-state** | reject unknown `lifecycle_state` | **OK** — exit 1 |

All samples are fake placeholders — **no** real secrets.

---

## Confirmations

| Item | State |
|------|--------|
| PM-34 | **Blocked** |
| `n8n_ready` | **false** (valid fixture) |
| OpenClaw / gateway / n8n | **Not** invoked |
| Workflow 40 / 41 | **Untouched** |
| Runtime | **None** |

---

## Decisione

**PASS** — fixtures align with PM-59 schema and PM-60 validator.

---

## Next

**PM-62** — integration readiness checklist design.
