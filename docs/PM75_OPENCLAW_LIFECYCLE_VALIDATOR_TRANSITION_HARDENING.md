# PM-75 — OpenClaw lifecycle validator transition hardening

**Status:** **PASS** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-75-openclaw-lifecycle-validator-transition-hardening-gate.md) · [PM-74 design](PM74_OPENCLAW_LIFECYCLE_TRANSITION_RULES_DESIGN.md) · [tool](../tools/validate-openclaw-lifecycle-metadata.mjs)

---

## Scopo

Hardening **PM-60** validator con regole PM-74 — local dry-run only · **no** runtime · **no** n8n · **no** workflow · **PM-34 blocked** · **`n8n_ready` false**.

---

## Validazioni aggiunte / rafforzate

| Rule | Detail |
|------|--------|
| **lifecycle_state** | Allowlist invariata (8 stati) |
| **redaction_status pass** | `captured_redacted`, `schema_validated`, `adapter_validated`, `operator_reviewed`, `archived` |
| **secret_scan pass** | Stessi stati |
| **adapter_schema** | `null` per `proposed`, `captured_redacted`, `schema_validated` |
| **adapter_schema** | **pm54.openclaw.adapter.v1** per `adapter_validated`, `operator_reviewed` |
| **expired** | `retention.policy` **expire** or **archive** |
| **archived** | `retention.policy` **archive** |
| **n8n_ready / pm34_unblock** | Sempre **false** (global) |
| **next_gate** | Allowlist PM-59→PM-63 + **`stop`** only — **no** PM-34 |

---

## Explicit negatives

No OpenClaw · no gateway · no n8n · no worker · workflow **40/41** untouched

---

## Next

**PM-76** — transition fixtures (`examples/pm74-*`).
