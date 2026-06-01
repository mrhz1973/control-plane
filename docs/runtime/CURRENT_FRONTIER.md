# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-01 — 47→48 controlled handoff runtime PASS.

---

## Stato operativo attuale

- Foundation: completa. Workflow 40/42: **ATTIVO** (produzione, non si tocca).
- Classifier local: **PASS**; non cablato n8n. Catena wf42→Codex→Cursor: **PASS** manuale/supervisionata.

## Latest verified PASS

- **47→48 controlled handoff runtime**: **PASS ATTESTATO UTENTE** (`update_id` **986228567**; 47 accepted → 48 closed **D-9998-T**).
- Evidenza: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-runtime-pass.md`.

## Stato Wf47 / Wg / Wh

- **47 - Wf live getUpdates manual poll**: **PASS ATTESTATO UTENTE**.
- **47 - Wf first limited schedule runtime test**: **PASS ATTESTATO UTENTE**.
- **47→48 live manual handoff**: **PASS ATTESTATO UTENTE**.
- **47→48 controlled handoff runtime**: **PASS ATTESTATO UTENTE** (`update_id` **986228567**).
- **48 - Wg external_receipt / callable correlation**: **PASS ATTESTATO UTENTE**.
- **49 - Wh final rehearsal**: **PASS ATTESTATO UTENTE** (not used for this gate).
- **47→48 controlled handoff template**: **IMPLEMENTATION READY**.
- **Wg48 correlate safe branch input**: **PASS** (template).
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

Controlled **47→48** test-only runtime **PASS ATTESTATO UTENTE** recorded. **Telegram inbound operational automation** remains **NOT ACTIVE / NOT RUN**; **PM-34** **BLOCKED**. No new PREP/PRE-PREP unless a **named blocker** appears. Boundaries unchanged: NO Telegram Trigger · NO public webhook · NO production Data Table · NO `control_plane_state` · NO **48** scheduled independently · NO **49** active · NO wf40/41/42 mutation · NO secrets.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state`.
- NO 48 scheduled / 49 active / PM-34 / wf40/41/42 mutation / secrets in Git.

## Audit

- Controlled handoff runtime PASS: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-runtime-pass.md`.
- Phase 1c safe branch: `docs/sessions/2026-06-01-control-plane-wg48-correlate-safe-branch-input.md`.
- Handoff template: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-template.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
