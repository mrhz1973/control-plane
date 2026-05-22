# PM-59 — OpenClaw lifecycle metadata schema dry-run

**Status:** **PASS / SCHEMA DRY-RUN** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-59-openclaw-lifecycle-metadata-schema-dry-run-gate.md) · [PM-58 design](PM58_OPENCLAW_BRIDGE_ARTIFACT_LIFECYCLE_DESIGN.md) · [PM-60 validator](PM60_OPENCLAW_LIFECYCLE_METADATA_VALIDATOR_DRY_RUN.md)

---

## Scopo

Formalizza lo schema metadata lifecycle derivato da PM-58 — **no** artifact runtime · **no** storage · **no** n8n · **no** PM-34 unblock.

**Schema ID:** `pm59.openclaw.lifecycle.metadata.v1`

---

## Schema JSON (concettuale)

```json
{
  "artifact_id": "opaque-id-no-secrets",
  "schema_version": "pm52.openclaw.bridge.v1",
  "adapter_schema": "pm54.openclaw.adapter.v1|null",
  "lifecycle_state": "proposed|captured_redacted|schema_validated|adapter_validated|operator_reviewed|rejected|archived|expired",
  "created_at": "ISO-8601",
  "source": "openclaw",
  "machine_scope": "home-local-loopback",
  "classification": "pass|fail|partial|auth_required|invalid",
  "n8n_ready": false,
  "pm34_unblock": false,
  "redaction_status": "pass|fail",
  "secret_scan": "pass|fail",
  "retention": {
    "policy": "keep|expire|archive",
    "expires_at": "ISO-8601|null"
  },
  "next_gate": "pm-59-lifecycle-metadata-schema|pm-60-lifecycle-metadata-validator|pm-61-lifecycle-fixture-review|pm-62-integration-readiness-checklist|pm-63-governance-checkpoint|stop"
}
```

---

## Regole obbligatorie

| Rule | Detail |
|------|--------|
| **n8n_ready** | **Always false** |
| **pm34_unblock** | **Always false** |
| **source** | `openclaw` |
| **machine_scope** | `home-local-loopback` |
| **lifecycle_state** | Allowlist (8 states) |
| **classification** | PM-53 allowlist |
| **redaction / secret** | `pass` required beyond `proposed` for promoted states |
| **next_gate** | PM-59…63 allowlist |
| **Raw / tokens** | **Never** in payload |

Nessun artifact PM-59 è consumabile da n8n.

---

## Next

**PM-60** — lifecycle metadata validator dry-run.
