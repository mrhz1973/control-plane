# PM-66 — OpenClaw residual risk register

**Status:** **PASS / DOCS-ONLY RISK REGISTER** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-66-openclaw-residual-risk-register-gate.md) · [PM-62 readiness](PM62_OPENCLAW_INTEGRATION_READINESS_CHECKLIST_DESIGN.md)

---

## Scopo

Registra rischi **residui** dopo PM-63 — nessun blocker immediato; PM-34 resta **blocked**; PM-64→68 sono governance docs-only.

---

## Risk register

| Risk ID | Rischio | Stato attuale | Impatto | Mitigazione presente | Mitigazione futura | PM-34 relevance |
|---------|---------|---------------|---------|----------------------|--------------------|-----------------|
| **R-01** | Confondere artifact validato con n8n-ready | Controllato | Alto se n8n consuma | PM-55/60 `n8n_ready: false`; PM-62 NOT READY | Gate separato prima di `n8n_ready: true` | **Blocked** fino a strict_pass |
| **R-02** | `n8n_ready: true` troppo presto | Basso (design) | Alto | Validator + docs; PM-59 invalid fixture | Explicit integration gate | Non auto-unblock PM-34 |
| **R-03** | PM-34 sbloccato implicitamente | Basso | Critico | Ogni doc dice blocked; `pm34_unblock: false` | PM-34 packet separato | **Blocked** |
| **R-04** | Raw OpenClaw output persistito | Medio (operatore) | Alto | PM-53 raw rejection; lifecycle rules | Capture procedure + redaction gate | Raw never → n8n |
| **R-05** | Segreti in artifact | Medio | Critico | Secret scan PM-53/60; gitignore `*secret*` | Pre-commit scan; no tokens in samples | Secrets block integration |
| **R-06** | Workflow 40 modificato per errore | Basso | Critico | Policy: never silent edit | Candidate workflow only | Prod path separate |
| **R-07** | Workflow 41 cancellato | Basso | Alto | Retain until PM-27 | Cleanup gate only | Backup policy |
| **R-08** | Handoff chat incompleto | Medio | Medio | PM-63, PM-68 handoffs | Use PM-68 per nuove chat | Context loss → wrong runtime |
| **R-09** | Tool locale = runtime n8n | Basso | Alto | Tools = dry-run only; no n8n import | Document in PM-65 boundaries | PM-34 not implied |
| **R-10** | Artifact storage senza policy | Basso | Medio | PM-58 design paths only; not created | PM-64+ path task with retention | Storage ≠ n8n ready |
| **R-11** | Validator non allineato a schema futuro | Basso | Medio | PM-56/57 contract review | Version bump + fixture batch | Drift before PM-34 |

---

## Decisione

**PASS** — nessun **blocker** immediato per continuare governance docs-only. **PM-34** resta **blocked**. Nessun rischio richiede runtime in PM-64→68.

---

## Next

**PM-67** — next phase options packet.
