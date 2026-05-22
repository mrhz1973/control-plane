# PM-70 — OpenClaw handoff link hygiene

**Status:** **PASS / DOCS-ONLY LINK HYGIENE** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-70-openclaw-handoff-link-hygiene-gate.md) · [PM-69 index](PM69_OPENCLAW_GOVERNANCE_INDEX_CLEANUP.md)

---

## Scopo

Documenta ruoli e presenza link dei documenti handoff/indice — **no** runtime · **no** duplicazione lunga negli indici.

---

## Tabella handoff / indice

| Documento | Ruolo | Quando usarlo | README? | MVP_STATUS? | Note |
|-----------|-------|---------------|---------|-------------|------|
| [PM-68](PM68_OPENCLAW_NEW_CHAT_COMPACT_HANDOFF.md) | **Handoff compatto principale** | Nuova chat Cursor CONTROL PLANE | **Sì** (PM-64–68 row) | **Sì** | **Start here** |
| [PM-63](PM63_OPENCLAW_GOVERNANCE_CHECKPOINT_HANDOFF.md) | Handoff lungo / storico PM-51→63 | Contesto batch artifact governance | **Sì** (PM-59–63 row) | **Sì** | Tools + pre-64 chain |
| [PM-69](PM69_OPENCLAW_GOVERNANCE_INDEX_CLEANUP.md) | Indice governance PM-51→68 | Navigazione doc per PM | **Sì** (post batch PM-69–73) | **Sì** | Link hub |
| [README.md](../README.md) | Tabella PM + entry repo | Primo contatto repo | — | — | Puntatori brevi only |
| [MVP_STATUS.md](MVP_STATUS.md) | Stato MVP / PM righe | Status operativo | — | — | Puntatori brevi only |
| [OPERATING_MEMORY.md](OPERATING_MEMORY.md) | Memoria operativa densa | Contesto persistente CP | — | — | Una riga PM-68/73 recente |

---

## Conferme

| Item | Rule |
|------|------|
| **PM-68** | Handoff compatto **principale** per nuova chat |
| **PM-63** | Handoff **lungo/storico**; non sostituisce PM-68 |
| **PM-69** | **Indice** governance; non handoff runtime |
| **README / MVP / OPERATING** | Solo **puntatori brevi** — no blocchi lunghi duplicati |

---

## Next

**PM-71** — compact handoff validation review.
