You are working in repository mrhz1973/control-plane on branch main.

Modify ONLY this file:

docs/foundation/PROJECT_VISION.md

Do not edit any other file.

Goal: update PROJECT_VISION.md to version 2.3 and add a concise operational retry/access guard in section 7.1.

Required edits:

1. Header version bump

Update the document header so it says:

Versione: 2.3 ? 2026-05-29
Versione precedente: 2.2 ? 2026-05-27 (sostituita)

2. Section 7.1 GitHub source of truth

In section 7.1, keep the existing guard:

SUCCESS testuale != PASS

This existing guard is about Composer 2.5 Fast / implementer verification and must remain intact.

Immediately after that existing guard, add a concise Italian operational guard for retry/access verification.

The new guard must cover these points briefly and without redundancy:

- Un singolo errore di fetch/accesso non prova che una risorsa sia irraggiungibile.
- Esempi: GitHub raw, web_fetch, API, pagine remote, file o endpoint remoti leggibili.
- Prima di concludere "non posso leggere X" o "X e irraggiungibile", ritentare almeno una volta.
- Non trascinare per tutta la sessione un'assunzione negativa non verificata.
- Riverificare quando:
  - lo stato puo essere cambiato;
  - l'utente afferma il contrario;
  - una fonte alternativa suggerisce che la risorsa esiste;
  - la prima richiesta puo essere fallita per rete/cache/auth transitori.

Make clear this is an operational guard, not a new component.

Keep the added text brief.

3. Section 15 changelog

Add a changelog row for v2.3 documenting that section 7.1 now includes the retry/access guard.

Constraints:

- Do NOT add rows to section 1.1.
- Do NOT modify workflow 40 or workflow 41.
- Do NOT unlock PM-34.
- Do NOT change pm34_unblocked defaults.
- Do NOT change n8n_ready defaults.
- Do NOT add runtime, deploy, provider API key, or secrets.
- Keep the text brief.
- Preserve the existing document style as much as possible.

After editing, verify:

- Only docs/foundation/PROJECT_VISION.md changed.
- The header says version 2.3 dated 2026-05-29.
- Section 7.1 still contains SUCCESS testuale != PASS.
- The new retry/access guard appears immediately after that guard.
- Section 15 includes the v2.3 changelog row.
- Section 1.1 has no new row.
- Workflow 40/41, PM-34, pm34_unblocked, and n8n_ready were not changed.

Commit message to use:

docs: add retry access guard to project vision

aggio control

