# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-06 — D-0024-M mapping preview runtime PASS ATTESTATO UTENTE.

---

## Stato operativo attuale

- Foundation: completa. Workflow **40/42**: **ATTIVO** (unchanged). Workflow **41**: off.
- Classifier: **D-0021** transport/auth **PASS**; **D-0022-W** n8n wiring **PASS ATTESTATO UTENTE**; **D-0023-N** mapping contract **PASS** (docs-only); **D-0024-M** fixture-only mapping preview **PASS ATTESTATO UTENTE** — **no permanent automation declared**.

## Latest verified PASS

- **D-0024-M — Decision Packet mapping preview (fixture-only)**: **PASS ATTESTATO UTENTE** — manual n8n run of workflow `55`; four fixtures verified. Evidenza: `docs/sessions/2026-06-06-control-plane-d0024m-mapping-preview-runtime-pass.md`.
- **D-0023-N — Decision Packet mapping design (Option 1)**: **PASS** (docs-only) — deterministic classifier → Decision Packet contract. Evidenza: `docs/contracts/decision-packet-mapping-v1.md`, `docs/sessions/2026-06-05-control-plane-d0023n-decision-packet-mapping-design.md`.
- **D-0022-W — n8n classifier manual wiring/config**: **PASS ATTESTATO UTENTE**.
- **D-0021 / a.1**: transport/auth + at-logon **PASS ATTESTATO UTENTE**.

## Stato Wf47 / Wg / decision store

- Decision store Gates 1–3: **PASS**.
- **47 - Wf**: off. **48 - Wg**: callable/published, not scheduled independently. **49**: not used.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

Any next integration step (e.g. live classifier → mapping preview, or operational wiring) is a **separate explicit decision** — **not** auto-started. Boundaries: NO PM-34 · NO 49 · NO wf40/41/42 mutation · NO 48 schedule · NO Telegram Trigger · NO Funnel · NO public webhook · NO provider API key · NO secrets in Git · NO permanent automation declared.

## Redaction hygiene

- Before commits touching docs/workflow artifacts: run `bash tools/redaction-check.sh`.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / PM-34 unlock / wf40/41/42 mutation / secrets in Git.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO declaring mapping design or prior gates as permanent operational loop automation.

## Audit

- D-0024-M mapping preview runtime: `docs/sessions/2026-06-06-control-plane-d0024m-mapping-preview-runtime-pass.md`.
- D-0023-N mapping: `docs/contracts/decision-packet-mapping-v1.md`, `docs/sessions/2026-06-05-control-plane-d0023n-decision-packet-mapping-design.md`.
- D-0022-W wiring: `docs/sessions/2026-06-05-control-plane-d0022w-n8n-classifier-manual-wiring-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
