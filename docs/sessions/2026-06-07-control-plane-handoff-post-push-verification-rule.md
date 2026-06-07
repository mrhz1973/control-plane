# Session log — handoff post-push verification rule (anti-regressione)

**Date:** 2026-06-07  
**Task:** docs-only — regola persistente handoff / verifica hash remoto post-push  
**Stato:** **PASS** (Cursor docs)

---

## Problema osservato

Dopo Gate B, l'orchestratore ha richiesto manualmente all'utente la verifica shell (`git ls-remote origin main`, ecc.) anche se questa è responsabilità del report Cursor/handoff e dell'invariante già parzialmente documentata in `PROJECT_VISION.md` §8.1.

Questo contraddice l'obiettivo **low-touch**: eliminare micro-interazioni meccaniche ripetute dopo ogni `aggio control`.

---

## Correzione

Regola persistente su GitHub:

| Artefatto | Modifica |
|-----------|----------|
| `docs/foundation/PROJECT_VISION.md` | §8.1 — **Handoff / post-push verification invariant**; §11.3 puntatore orchestratore; v2.11 |
| `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` | Report finale: elenco comandi post-push obbligatori; regola orchestratore / verify-only |
| `docs/runtime/CURRENT_FRONTIER.md` | Nota breve handoff/post-push verification |

**Regola in sintesi:**

1. Cursor stampa sempre output git post-push verbatim (incluso `git ls-remote origin main`).
2. Handoff e prompt Cursor ricordano la regola.
3. Orchestratore **non** chiede PowerShell all'utente se l'output Cursor è già presente e coerente.
4. Output mancante → prompt Cursor **verify-only** prima del fallback utente.
5. Shell manuale utente = fallback **finale**, non percorso normale.

---

## Confini (invariati)

- Nessun runtime n8n eseguito da Cursor.
- Nessun nuovo workflow.
- Nessuna modifica `workflows/exports/**`.
- **PM-34:** **BLOCKED**.
- **`n8n_ready=false`**.
- Loop operativo permanente: **NOT ACTIVE**.

---

## Evidenza

- Session: questo file.
- Canon: `PROJECT_VISION.md` §8.1, §11.3; `CURSOR_PROMPT_TEMPLATE.md` §4.
