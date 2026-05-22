# PM-75 — OpenClaw lifecycle validator transition hardening

**Status:** **PASS** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-75-openclaw-lifecycle-validator-transition-hardening-gate.md) · [PM-74 design](PM74_OPENCLAW_LIFECYCLE_TRANSITION_RULES_DESIGN.md) · [tool](../tools/validate-openclaw-lifecycle-metadata.mjs)

---

## Scopo

Hardening **PM-60** validator con regole PM-74 — local dry-run only.

---

## Hardening aggiunto

| Rule | Detail |
|------|--------|
| **Redaction** | `pass` required from `captured_redacted` onward (incl. expired/archived) |
| **Secret scan** | `pass` required from `captured_redacted` onward |
| **adapter_schema null** | Required for `proposed`, `captured_redacted`, `schema_validated` |
| **adapter_schema required** | Required for `adapter_validated`, `operator_reviewed` |
| **rejected** | `next_gate` must be **`stop`** |
| **archived** | `retention.policy` must be **`archive`** |
| **expired** | `retention.policy` expire/archive + **`expires_at` non-null** |
| **next_gate** | Allowlist extended PM-74→78 |

---

## Regression PM-59 (unchanged pass/fail)

| Sample | Exit |
|--------|------|
| valid | **0** |
| invalid-n8n-ready | **1** |
| invalid-pm34-unblock | **1** |
| invalid-secret-scan | **1** |
| invalid-state | **1** |

---

## Explicit negatives

No OpenClaw · no gateway · no n8n · PM-34 **blocked** · `n8n_ready` **false**

---

## Next

**PM-76** — transition fixtures.
