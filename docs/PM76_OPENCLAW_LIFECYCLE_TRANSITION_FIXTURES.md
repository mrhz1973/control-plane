# PM-76 — OpenClaw lifecycle transition fixtures

**Status:** **PASS / FIXTURE REVIEW** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-76-openclaw-lifecycle-transition-fixtures-gate.md) · [PM-75](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md)

---

## Fixtures

| Sample | Expected |
|--------|----------|
| `pm76-…-valid-captured-redacted.sample.json` | exit **0** |
| `pm76-…-invalid-schema-with-adapter.sample.json` | exit **1** |
| `pm76-…-invalid-adapter-null.sample.json` | exit **1** |
| `pm76-…-invalid-captured-redaction-fail.sample.json` | exit **1** |
| `pm76-…-invalid-rejected-next-gate.sample.json` | exit **1** |
| `pm76-…-invalid-expired-no-expires.sample.json` | exit **1** |

All fixtures are fake — **no** real secrets.

---

## Commands

```bash
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm76-openclaw-lifecycle-metadata-valid-captured-redacted.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm76-openclaw-lifecycle-metadata-invalid-schema-with-adapter.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm76-openclaw-lifecycle-metadata-invalid-adapter-null.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm76-openclaw-lifecycle-metadata-invalid-captured-redaction-fail.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm76-openclaw-lifecycle-metadata-invalid-rejected-next-gate.sample.json
node tools/validate-openclaw-lifecycle-metadata.mjs examples/pm76-openclaw-lifecycle-metadata-invalid-expired-no-expires.sample.json
```

---

## Next

**PM-77** — regression review.
