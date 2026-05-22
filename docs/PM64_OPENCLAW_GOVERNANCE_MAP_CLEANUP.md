# PM-64 — OpenClaw governance map cleanup

**Status:** **PASS / DOCS-ONLY MAP CLEANUP** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-64-openclaw-governance-map-cleanup-gate.md) · [PM-63 handoff](PM63_OPENCLAW_GOVERNANCE_CHECKPOINT_HANDOFF.md) · [PM-68 compact handoff](PM68_OPENCLAW_NEW_CHAT_COMPACT_HANDOFF.md)

---

## Scopo

Mappa leggibile della catena **PM-51→PM-63** — riduce confusione tra design, dry-run, review, checkpoint e runtime. **No** cambio stato operativo · **no** runtime.

---

## Tabella PM-51 → PM-63

| PM | Status | Tipo | Artifact principale | Consuma n8n? | Tocca workflow? | Sblocca PM-34? |
|----|--------|------|---------------------|--------------|-----------------|----------------|
| **PM-51** | PASS | Runtime manuale controllato | Gateway `/health` probe | **No** | **No** | **No** |
| **PM-52** | DESIGN ONLY | Design | `pm52.openclaw.bridge.v1` (concept) | **No** | **No** | **No** |
| **PM-53** | PASS | Dry-run locale | Bridge artifact JSON | **No** | **No** | **No** |
| **PM-54** | DESIGN ONLY | Design | `pm54.openclaw.adapter.v1` (concept) | **No** | **No** | **No** |
| **PM-55** | PASS | Dry-run locale | Adapter output JSON | **No** | **No** | **No** |
| **PM-56** | PASS | Review | Contract matrix (docs) | **No** | **No** | **No** |
| **PM-57** | PASS | Dry-run locale + review | `next_gate` allowlist | **No** | **No** | **No** |
| **PM-58** | DESIGN ONLY | Design | Lifecycle states/paths | **No** | **No** | **No** |
| **PM-59** | PASS | Schema dry-run | `pm59.openclaw.lifecycle.metadata.v1` | **No** | **No** | **No** |
| **PM-60** | PASS | Dry-run locale | Lifecycle metadata JSON | **No** | **No** | **No** |
| **PM-61** | PASS | Review | PM-59 fixtures | **No** | **No** | **No** |
| **PM-62** | DESIGN ONLY | Design | Readiness checklist | **No** | **No** | **No** |
| **PM-63** | CHECKPOINT | Handoff | PM-51→63 summary | **No** | **No** | **No** |

---

## Classificazione per tipo

| Tipo | PM |
|------|-----|
| **Runtime manuale controllato** | PM-51 |
| **Design only** | PM-52, PM-54, PM-58, PM-62 |
| **Dry-run locale** | PM-53, PM-55, PM-57, PM-59, PM-60 |
| **Review** | PM-56, PM-61 |
| **Checkpoint / handoff** | PM-63 |

---

## Regole invarianti (catena)

| Rule | State |
|------|--------|
| **PM-34** | **Blocked** |
| **n8n_ready** | **false** |
| **Workflow 40 / 41** | **Untouched** (40 ACTIVE · 41 BACKUP OFF) |
| **Raw OpenClaw → n8n** | **Never** direct |

---

## Raccomandazione

Per **nuove chat** usare **[PM-68](PM68_OPENCLAW_NEW_CHAT_COMPACT_HANDOFF.md)** come handoff compatto (include PM-64→68).

---

## Next

**PM-65** — decision boundary review.
