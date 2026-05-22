# PM-76 — OpenClaw lifecycle transition fixtures

**Status:** **PASS** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-76-openclaw-lifecycle-transition-fixtures-gate.md) · [PM-74](PM74_OPENCLAW_LIFECYCLE_TRANSITION_RULES_DESIGN.md) · [PM-75](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md)

---

## Fixtures (`examples/pm74-*`)

| Sample | Expected | Tests |
|--------|----------|-------|
| `pm74-openclaw-lifecycle-transition-valid-schema-to-adapter.sample.json` | exit **0** | `adapter_validated` + adapter schema |
| `pm74-openclaw-lifecycle-transition-invalid-skip-redaction.sample.json` | exit **1** | `redaction_status: fail` on promoted state |
| `pm74-openclaw-lifecycle-transition-invalid-n8n-ready.sample.json` | exit **1** | `n8n_ready: true` |
| `pm74-openclaw-lifecycle-transition-invalid-pm34-unblock.sample.json` | exit **1** | `pm34_unblock: true` |
| `pm74-openclaw-lifecycle-transition-invalid-expired-promoted.sample.json` | exit **1** | `expired` + `retention.policy: keep` |

All fixtures are fake — **no** real secrets.

---

## Commands

```bash
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm74-openclaw-lifecycle-transition-valid-schema-to-adapter.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm74-openclaw-lifecycle-transition-invalid-skip-redaction.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm74-openclaw-lifecycle-transition-invalid-n8n-ready.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm74-openclaw-lifecycle-transition-invalid-pm34-unblock.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm74-openclaw-lifecycle-transition-invalid-expired-promoted.sample.json
```

---

## Next

**PM-77** — regression review.
