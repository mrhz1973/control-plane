# PM-58 — OpenClaw bridge artifact lifecycle design

**Status:** **PREPARED / DESIGN ONLY** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-58-openclaw-bridge-artifact-lifecycle-design-gate.md) · [session](sessions/2026-05-22-control-plane-pm58-openclaw-bridge-artifact-lifecycle-design.md) · [PM-57 PASS](PM57_OPENCLAW_CONTRACT_FIXTURE_REVIEW.md) · [PM-53](PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md) · [PM-55](PM55_OPENCLAW_BRIDGE_ADAPTER_DRY_RUN.md) · [pm-34](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## 1. Scopo

PM-58 definisce il **ciclo di vita futuro** degli artifact OpenClaw bridge nel control-plane.

| Item | PM-58 |
|------|--------|
| **Implementazione** | **No** |
| **Runtime / OpenClaw** | **No** |
| **Gateway / n8n** | **No** |
| **Worker** | **Not** enabled |
| **Workflow 40 / 41** | **Not** touched |
| **PM-34** | **Not** unblocked |
| **Artifact storage** | **Not** created |

---

## 2. Perché serve

| Prior step | Contribution |
|------------|--------------|
| **PM-53** | Validates `pm52.openclaw.bridge.v1` artifacts (dry-run) |
| **PM-55** | Adapts PM-53-validated artifacts to `pm54.openclaw.adapter.v1` |
| **PM-57** | Closed LOW F-07 — `next_gate` allowlist in validator |

Before any **integration readiness** or PM-34 discussion, governance is needed for:

- Where artifacts **may** live in the future
- Which **states** they can have
- How validation, redaction, archive, and discard work
- How to prevent **raw OpenClaw output** or **secrets** from entering the repo
- Why **no PM-58 artifact is n8n-consumable**
- Why **PM-34 remains blocked**

**Rule (unchanged):** Raw OpenClaw output must **never** be persisted as a consumable artifact or routed directly to n8n.

---

## 3. Artifact lifecycle concettuale

Design-only states for bridge artifacts:

| State | Consumable by n8n? | Notes |
|-------|-------------------|--------|
| **proposed** | **No** | Intent captured; not yet redacted or validated |
| **captured_redacted** | **No** | Redacted summary only; not schema-validated |
| **schema_validated** | **No** | PM-53 PASS equivalent; still not adapter output |
| **adapter_validated** | **No** | PM-55 PASS equivalent; `n8n_ready` still **false** |
| **operator_reviewed** | **No** | Human review complete; does **not** imply `n8n_ready` |
| **rejected** | **No** | Failed validation, policy, or review |
| **archived** | **No** | Historical retention only; not pipeline input |
| **expired** | **No** | Past retention; must not be promoted or consumed |

**Invariant:** `n8n_ready` remains **false** for this entire track until a **future separate gate** (not PM-34 auto-unblock).

```text
proposed
  → captured_redacted (redaction pass)
  → schema_validated (PM-53)
  → adapter_validated (PM-55)
  → operator_reviewed (human)
  → [future gate only] n8n_ready — FORBIDDEN in PM-58

any state → rejected | archived | expired (policy-driven)
```

---

## 4. Path futuri proposti (design-only)

PM-58 **does not** create directories or real artifacts. Future layout (separate task):

| Path (design) | Purpose |
|---------------|---------|
| `docs/artifacts/openclaw/proposed/` | Pre-validation drafts (redacted only; never raw) |
| `docs/artifacts/openclaw/validated/` | PM-53 + PM-55 passed artifacts (samples/fixtures) |
| `docs/artifacts/openclaw/rejected/` | Policy rejects (minimal retention; test fixtures only) |
| `docs/artifacts/openclaw/archived/` | Expired or superseded validated copies |

**Clarifications:**

- Paths are **documentation targets** only in PM-58
- PM-58 creates **no** runtime artifact files
- PM-58 creates **no** sample runtime logs
- Creating paths or ingesting artifacts requires a **future explicit task**

Current repo continues to use `examples/pm53-*` and `examples/pm55-*` for dry-run fixtures only.

---

## 5. Metadata minimi futuri

Conceptual lifecycle envelope (design-only; not implemented in PM-58):

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
  "next_gate": "pm-57-allowlist-value-or-stop"
}
```

**Rules:**

| Field | Rule |
|-------|------|
| **n8n_ready** | **Always false** in this track (PM-58) |
| **pm34_unblock** | **Always false** |
| **secret_scan** | Must be **pass** for promotion beyond `captured_redacted` |
| **redaction_status** | Must be **pass** before `schema_validated` |
| **next_gate** | Must match PM-57 allowlist (or future equivalent) |
| **raw transcript** | **Never** stored in metadata or payload |

---

## 6. Regole di retention e archiviazione

| Artifact type | Policy |
|---------------|--------|
| **rejected** | Minimal retention; archive only if needed for validator/adapter tests; never pipeline input |
| **validated** (`schema_validated`, `adapter_validated`) | Retention with **explicit purpose** (fixture, audit, operator review); `expires_at` when purpose ends |
| **expired** | Not usable; no promotion; may move to `archived` or delete per future policy |
| **archived** | Read-only history; **not** input to validator, adapter, or n8n |
| **raw output** | **Do not archive** unless manually redacted and approved by **separate gate** |
| **secrets** | **Never** archive; reject immediately |

---

## 7. Regole di promozione tra stati

| From | To | Required gate / check | Allowed in PM-58? | Notes |
|------|-----|----------------------|-------------------|--------|
| **proposed** | **captured_redacted** | Redaction pass; no raw fields | **No** (design only) | Future capture task |
| **captured_redacted** | **schema_validated** | PM-53 validator PASS | **No** (design only) | Tool exists; not run in PM-58 |
| **schema_validated** | **adapter_validated** | PM-55 adapter PASS | **No** (design only) | Tool exists; not run in PM-58 |
| **adapter_validated** | **operator_reviewed** | Human operator review | **No** (design only) | Docs/review only |
| **operator_reviewed** | **n8n_ready** | Future separate integration gate | **Forbidden** | PM-58 does not define or enable |
| **any** | **rejected** | Validation/policy fail | Conceptual only | e.g. secret_scan fail |
| **validated** | **archived** | Retention decision | Conceptual only | After expiry or supersede |
| **any** | **expired** | `expires_at` reached | Conceptual only | Auto or manual policy |

Demotion (e.g. `operator_reviewed` → `rejected`) is allowed conceptually on policy violation discovery.

---

## 8. Cosa PM-58 NON autorizza

| Item | State |
|------|--------|
| PM-34 unblock | **Not** authorized |
| n8n consumption | **Not** authorized |
| Workflow 40 / 41 changes | **Not** authorized |
| Worker enablement | **Not** authorized |
| OpenClaw runtime / gateway | **Not** authorized |
| Artifact ingestion or storage creation | **Not** authorized |
| `n8n_ready: true` | **Not** authorized |
| Deploy / tag / rollback | **Not** authorized |

---

## 9. PASS criteria PM-58

PM-58 **PREPARED / DESIGN ONLY** when:

- Lifecycle states defined
- Future paths documented **without** creating them
- Minimal metadata schema defined
- Retention and archive rules defined
- State promotion table defined
- PM-34 **blocked** · `n8n_ready` **false** · workflow **40/41** untouched
- **No** runtime · **no** tools/examples changes

---

## 10. FAIL / invalid criteria

PM-58 is **invalid** if it:

- Creates real artifact directories or files (beyond this design doc)
- Modifies `tools/**` or `examples/**`
- Executes OpenClaw, gateway, or n8n
- Proposes `n8n_ready: true` or PM-34 unblock
- Proposes direct n8n consumption of bridge artifacts
- Touches workflow 40/41
- Commits real secrets or raw runtime logs

---

## 11. Next

| Step | Scope |
|------|--------|
| **PM-59** (candidate A) | OpenClaw lifecycle **metadata schema dry-run** (local/docs; not PM-34 runtime) |
| **PM-59** (candidate B) | OpenClaw **integration readiness checklist** design (docs-only) |
| **PM-34** | Remains **blocked** until validated strict_pass artifact + **separate** integration gate |

PM-59 must **not** be PM-34 runtime, n8n wiring, or workflow promotion.
