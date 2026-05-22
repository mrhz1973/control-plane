# PM-74 — OpenClaw lifecycle transition rules design

**Status:** **PASS / DOCS-ONLY TRANSITION RULES DESIGN** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-74-openclaw-lifecycle-transition-rules-design-gate.md) · [PM-58 lifecycle](PM58_OPENCLAW_BRIDGE_ARTIFACT_LIFECYCLE_DESIGN.md) · [PM-59 schema](PM59_OPENCLAW_LIFECYCLE_METADATA_SCHEMA_DRY_RUN.md) · [PM-75 hardening](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md)

---

## Scopo

Regole di **transizione** lifecycle metadata derivate da PM-58/PM-59 — **no** runtime · **no** n8n · **no** workflow · **PM-34 blocked** · **`n8n_ready` false**.

PM-74 **non** cambia stato operativo.

---

## Transizioni consentite

### 1. `proposed` → `captured_redacted`

| Requisito | Valore |
|-----------|--------|
| `redaction_status` | **pass** |
| `secret_scan` | **pass** |
| `n8n_ready` | **false** |
| `pm34_unblock` | **false** |

### 2. `captured_redacted` → `schema_validated`

| Requisito | Valore |
|-----------|--------|
| `redaction_status` | **pass** |
| `secret_scan` | **pass** |
| `schema_version` | **pm52.openclaw.bridge.v1** |
| `n8n_ready` | **false** |
| `pm34_unblock` | **false** |

### 3. `schema_validated` → `adapter_validated`

| Requisito | Valore |
|-----------|--------|
| `adapter_schema` | **pm54.openclaw.adapter.v1** |
| `redaction_status` | **pass** |
| `secret_scan` | **pass** |
| `n8n_ready` | **false** |
| `pm34_unblock` | **false** |

### 4. `adapter_validated` → `operator_reviewed`

| Requisito | Valore |
|-----------|--------|
| Review | Futura esterna — **non** implementata in PM-74 |
| `n8n_ready` | **false** |
| `pm34_unblock` | **false** |

### 5. `any` → `rejected`

Stato terminale sicuro — consentito su policy/validation fail.

### 6. `any` → `archived`

| Requisito | Valore |
|-----------|--------|
| `retention.policy` | **archive** |
| Consumo n8n | **No** |

### 7. `any` → `expired`

| Requisito | Valore |
|-----------|--------|
| `retention.policy` | **expire** or **archive** |
| Promozione | **Non** promuovibile |

---

## Transizioni vietate

| Vietato | Motivo |
|---------|--------|
| `proposed` → `schema_validated` (skip `captured_redacted`) | Salto redazione |
| `captured_redacted` → `adapter_validated` (skip `schema_validated`) | Salto schema gate |
| `any` → `n8n_ready: true` | Gate futuro separato |
| `any` → `pm34_unblock: true` | PM-34 blocked |
| `expired` → qualsiasi stato promoted | Terminal |
| `rejected` → qualsiasi stato promoted | Terminal |
| `archived` → qualsiasi stato promoted | Terminal |
| `operator_reviewed` → `n8n_ready: true` | Senza gate futuro |
| Qualsiasi transizione che tocchi n8n / workflow / worker / PM-34 | Out of scope |

---

## Coerenza per stato (PM-75)

Il validator PM-60+ applica coerenza **per stato corrente** (non storico `from→to`). Vedi [PM-75](PM75_OPENCLAW_LIFECYCLE_VALIDATOR_TRANSITION_HARDENING.md).

---

## Next

**PM-75** — validator transition hardening.
