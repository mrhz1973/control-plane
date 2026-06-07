# Session log — automatic post-push verifier design

**Date:** 2026-06-07  
**Task:** docs-only — design componente n8n/worker verifica post-push automatica  
**Stato:** **PASS** (Cursor docs)

---

## Problema

Oggi, dopo ogni task Cursor con push, l'utente deve spesso **incollare** output verify-only in chat (`git ls-remote`, ecc.) perché l'orchestratore chiuda il PASS remoto. Low-touch richiede automazione deterministica.

---

## Soluzione (design)

Creato **`docs/runtime/AUTOMATIC_POST_PUSH_VERIFIER.md`**:

- Flusso target: GitHub push → n8n trigger → worker locale → comandi git → validazione **senza LLM**
- GPT/Codex solo per FAIL/diagnosi/Decision Packet
- Output machine-readable minimo (task_ref, verified_through_commit, failure_reason, …)
- Integrazione `LAST_HANDOFF_VERIFY.md` + `LAST_CURSOR_REPORT.md`
- Self-reference: `verified_through_commit`; nessun finalize-hash dedicato
- Micro-step propedeutico in `AUTOMATION_ACTIVATION_PLAN.md` **prima** di loop permanente

---

## LAST_HANDOFF_VERIFY backfill

Snapshot aggiornato al PASS remoto utente-attestato:

- `task_ref`: last-handoff-verify-artifact
- `verified_through_commit`: `7fac1add9a7c515a5d55f21d87f61a63935815bd`
- `artifact_commit`: `PENDING_SELF_REFERENCE` — **non** auto-certifica il commit di questo design task

---

## Confini (invariati)

- Nessun runtime n8n eseguito da Cursor.
- Nessun nuovo workflow.
- Nessuna modifica `workflows/exports/**`.
- **PM-34:** **BLOCKED**.
- **`n8n_ready=false`**.

---

## Evidenza

- Design: `docs/runtime/AUTOMATIC_POST_PUSH_VERIFIER.md`
- Plan: `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md` (micro-step verifier)
- Stato: `docs/runtime/CURRENT_FRONTIER.md`
