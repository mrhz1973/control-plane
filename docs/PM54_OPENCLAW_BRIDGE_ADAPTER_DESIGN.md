# PM-54 — OpenClaw bridge adapter design

**Status:** **PREPARED / DESIGN ONLY** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-54-openclaw-bridge-adapter-design-gate.md) · [session](sessions/2026-05-22-control-plane-pm54-openclaw-bridge-adapter-design.md) · [PM-53 validator](PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md) · [PM-52 bridge](PM52_OPENCLAW_CONFINED_BRIDGE_DESIGN.md) · [pm-34](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## 1. Scopo

PM-54 progetta l’**adapter concettuale** tra un **artefatto già validato** (PM-53) e **control-plane** — normalizzazione per review operatore, **non** consumo n8n.

| Item | PM-54 |
|------|--------|
| **Implementazione** | **No** |
| **Runtime / OpenClaw** | **No** |
| **n8n** | **No** |
| **Worker** | **Not** enabled |
| **PM-34** | **Not** unblocked |

---

## 2. Input ammesso

L’adapter futuro accetta **solo** artefatti che hanno già superato:

| Gate | Requirement |
|------|-------------|
| **PM-52** | Schema `pm52.openclaw.bridge.v1` |
| **PM-53** | Validator dry-run **PASS** |
| **secret_scan** | `status: pass` |
| **forbidden_touched** | All keys **false** |

### Input vietati

- Raw OpenClaw output · transcript · status dump · log completi
- OAuth URL · token · output non validato
- Output da worker · output prodotto tramite n8n

---

## 3. Output concettuale dell’adapter

Schema design-only (non implementato in PM-54):

```json
{
  "adapter_schema": "pm54.openclaw.adapter.v1",
  "source_artifact_schema": "pm52.openclaw.bridge.v1",
  "adapter_run_id": "opaque-id-no-secrets",
  "created_at": "ISO-8601",
  "classification": "pass|fail|partial|auth_required|invalid",
  "normalized_summary": "redacted operator-readable summary",
  "decision_relevance": "none|operator_review|future_gate_candidate",
  "evidence_refs": ["ref-to-pm52-artifact-id-only"],
  "safety": {
    "secret_scan": "pass",
    "forbidden_touched": false,
    "raw_output_included": false,
    "n8n_ready": false
  },
  "next_gate": "pm-55-adapter-dry-run|stop"
}
```

**Rules:**

- **`n8n_ready`** must remain **false** in PM-54 and this design phase.
- PM-54 does **not** produce an n8n-consumable artifact.
- Any future `n8n_ready: true` requires a **separate gate** much later (not PM-34 auto-unblock).

---

## 4. Architettura concettuale

```text
PM-51 gateway PASS (loopback liveness)
  → PM-52 bridge schema / design
  → PM-53 artifact validator dry-run PASS
  → PM-54 adapter design (this doc)
  → PM-55 adapter dry-run candidate (validated samples only)
  → further explicit gates only
  → PM-34 remains blocked until dedicated integration gate
```

---

## 5. Regole di sicurezza

| Rule | Detail |
|------|--------|
| **No raw input** | Adapter does not read raw OpenClaw output |
| **No OpenClaw call** | Adapter does not invoke gateway |
| **No n8n** | Adapter does not call n8n |
| **No workflows** | No workflow 40/41 writes |
| **No network** | Dry-run / future adapter: local only |
| **No shell mutation** | No repo/shell changes |
| **No tokens** | Adapter does not read or emit secrets |
| **No PM-34 decision** | Adapter does not unblock PM-34 |

---

## 6. Criteri PASS PM-54

PM-54 **PREPARED / DESIGN ONLY** when:

- Design doc + gate + session complete
- Input/output contracts defined
- Boundaries explicit · PM-55 separated
- PM-34 **blocked** · workflow **40/41** untouched · n8n untouched
- **No** runtime in PM-54 batch

---

## 7. Criteri FAIL / invalid

PM-54 is **invalid** if it:

- Implements runtime code (without separate task)
- Modifies tools/examples without request
- Proposes `n8n_ready: true` or direct n8n consumption
- Enables worker or unblocks PM-34
- Touches workflow 40/41
- Commits real secrets

---

## 8. Next

**PM-55** — OpenClaw bridge **adapter dry-run** on PM-53-validated samples only — **no** OpenClaw runtime · **no** n8n.
