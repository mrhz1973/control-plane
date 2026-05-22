# PM-60 — OpenClaw lifecycle metadata validator dry-run

**Status:** **PASS** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-60-openclaw-lifecycle-metadata-validator-dry-run-gate.md) · [PM-59 schema](PM59_OPENCLAW_LIFECYCLE_METADATA_SCHEMA_DRY_RUN.md) · [tool](../tools/validate-openclaw-lifecycle-metadata.mjs)

---

## Scopo

Local validator for **PM-59** lifecycle metadata — **no** OpenClaw · **no** network · **no** n8n.

---

## Dry-run commands

```bash
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm59-openclaw-lifecycle-metadata-valid.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm59-openclaw-lifecycle-metadata-invalid-n8n-ready.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm59-openclaw-lifecycle-metadata-invalid-pm34-unblock.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm59-openclaw-lifecycle-metadata-invalid-secret-scan.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm59-openclaw-lifecycle-metadata-invalid-state.sample.json
```

| Sample | Exit | `valid` |
|--------|------|---------|
| **valid** | **0** | **true** |
| **invalid-n8n-ready** | **1** | **false** |
| **invalid-pm34-unblock** | **1** | **false** |
| **invalid-secret-scan** | **1** | **false** |
| **invalid-state** | **1** | **false** |

---

## Explicit negatives

OpenClaw / gateway / n8n / workflow 40/41 / worker **not** used · `n8n_ready` **false** · PM-34 **blocked**

---

## PM-74→78 hardening

Transition rules per state — [PM74](PM74_OPENCLAW_LIFECYCLE_TRANSITION_RULES_DESIGN.md) · [PM75](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md) · fixtures [PM76](PM76_OPENCLAW_LIFECYCLE_TRANSITION_FIXTURES.md)

---

## Next

**PM-78** checkpoint — [PM78](PM78_OPENCLAW_LIFECYCLE_HARDENING_CHECKPOINT.md)
