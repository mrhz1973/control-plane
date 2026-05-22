# PM-67 — OpenClaw next phase options packet

**Status:** **PASS / OPTIONS PACKET** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-67-openclaw-next-phase-options-packet-gate.md) · [PM-66 risks](PM66_OPENCLAW_RESIDUAL_RISK_REGISTER.md)

---

## Scopo

Opzioni prossima fase **senza** autorizzare runtime n8n, OpenClaw gateway, o PM-34 unblock.

---

## Option A — Governance cleanup continuation

| | Detail |
|---|--------|
| **Scope** | Docs-only · link hygiene · backlog pointers |
| **Risk** | **Low** |
| **Touches** | README, MVP_STATUS, cross-links |
| **n8n / PM-34** | **No** |

**Consigliata** se l’obiettivo è **consolidare** prima di qualsiasi estensione tecnica.

---

## Option B — Lifecycle metadata schema extension

| | Detail |
|---|--------|
| **Scope** | Dry-run locale · estende PM-60 (es. retention rules, state transitions metadata) |
| **Risk** | **Medium-low** |
| **Touches** | `tools/validate-openclaw-lifecycle-metadata.mjs` + fixtures (future task) |
| **n8n / PM-34** | **No** |

**Consigliata** se serve **evolvere validator** senza avvicinarsi a integrazione.

---

## Option C — Integration readiness design

| | Detail |
|---|--------|
| **Scope** | Docs-only · espande PM-62 checklist |
| **Risk** | **Medium** (ambiguità “ready”) |
| **Touches** | Design docs only |
| **n8n / PM-34** | **No** · **not** `n8n_ready: true` |

**Non** raccomandata se si vuole **massima prudenza** — rischio di leggere “ready” come “go n8n”.

---

## Raccomandazione

| Priority | Option |
|----------|--------|
| **1** | **A** — governance cleanup continuation |
| **2** | **B** — lifecycle metadata extension (dry-run) |
| **Avoid now** | **C** unless operator explicitly wants expanded readiness docs |

**PM-34 runtime** non è opzione immediata. Nessun workflow edit · nessun worker · nessun n8n consumption.

---

## Next

**PM-68** — compact handoff for new chats.
