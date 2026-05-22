# PM-74 — OpenClaw lifecycle transition rules design

**Status:** **PREPARED / DESIGN ONLY** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-74-openclaw-lifecycle-transition-rules-design-gate.md) · [PM-58 lifecycle](PM58_OPENCLAW_BRIDGE_ARTIFACT_LIFECYCLE_DESIGN.md) · [PM-75 hardening](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md)

---

## Scopo

Regole di **coerenza per stato** (non runtime) per metadata lifecycle — implementate in PM-75 validator. **No** n8n · **no** PM-34 unblock.

---

## Regole per `lifecycle_state`

| State | `adapter_schema` | `redaction_status` | `secret_scan` | `retention.policy` | `next_gate` |
|-------|------------------|--------------------|---------------|-------------------|-------------|
| **proposed** | `null` | pass or fail | pass or fail | any valid | allowlist |
| **captured_redacted** | `null` | **pass** | **pass** | any valid | allowlist |
| **schema_validated** | `null` | **pass** | **pass** | any valid | allowlist |
| **adapter_validated** | **pm54…** | **pass** | **pass** | any valid | allowlist |
| **operator_reviewed** | **pm54…** | **pass** | **pass** | any valid | allowlist |
| **rejected** | any | any | any | any valid | **`stop`** |
| **archived** | any | **pass** | **pass** | **`archive`** | allowlist / stop |
| **expired** | any | **pass** | **pass** | **expire** or **archive** | allowlist / stop |

**Global:** `n8n_ready` **false** · `pm34_unblock` **false** · `expires_at` **required** (non-null) for **expired**.

---

## `next_gate` allowlist (PM-74→78)

Includes PM-59…63 gates plus `pm-74`…`pm-78` and **`stop`**.

---

## Invarianti

PM-34 **blocked** · workflow **40/41** untouched · no OpenClaw runtime in PM-74.

---

## Next

**PM-75** — validator transition hardening.
