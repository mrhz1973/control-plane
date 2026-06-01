# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-01 — Wf47 first limited schedule runtime test PASS.

---

## Stato operativo attuale

- Foundation: completa. Workflow 40/42: **ATTIVO** (produzione, non si tocca).
- Classifier local: **PASS**; non cablato n8n. Catena wf42→Codex→Cursor: **PASS** manuale/supervisionata.

## Latest verified PASS

- **47 - Wf first limited schedule runtime test**: **PASS ATTESTATO UTENTE** (`update_id` 986228565 accepted once; next cycle no re-accept).
- Evidenza: `docs/sessions/2026-06-01-control-plane-wf47-limited-schedule-runtime-pass.md`.

## Stato Wf47 / Wg / Wh

- **47 - Wf live getUpdates manual poll**: **PASS ATTESTATO UTENTE**.
- **47 - Wf first limited schedule runtime test**: **PASS ATTESTATO UTENTE**.
- **47 - Wf accept-once / no re-accept next cycle**: **PASS ATTESTATO UTENTE**.
- **47→48 live manual handoff**: **PASS ATTESTATO UTENTE**.
- **48 - Wg external_receipt manual correlation**: **PASS ATTESTATO UTENTE**.
- **49 - Wh final rehearsal**: **PASS ATTESTATO UTENTE** (not used for this schedule gate).
- **47 - Wf Schedule Trigger node-id uniqueness**: **PASS** (template Phase 1b).
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

**Next gate: define the next real operational gate after 47 - Wf schedule PASS. Candidate direction: connect scheduled 47 output to 48 - Wg or introduce a controlled test-only handoff mechanism. No PREP/PRE-PREP documents unless a new named blocker appears. No Telegram Trigger, no public webhook, no production Data Table, no control_plane_state, no 48 scheduled without explicit gate, no 49 active, no PM-34, no workflow 40/41/42 mutation, no secrets.**

Runbooks: `docs/workflow-wf-telegram-inbound-polling-getupdates.md`, `docs/workflow-wf47-wg-operationalization-plan.md`.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state`.
- NO 48 scheduled / 49 active / PM-34 / wf40/41/42 mutation / secrets in Git.

## Audit

- Schedule runtime PASS: `docs/sessions/2026-06-01-control-plane-wf47-limited-schedule-runtime-pass.md`.
- Phase 1b id fix: `docs/sessions/2026-06-01-control-plane-wf47-schedule-trigger-id-fix.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
