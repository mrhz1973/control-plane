# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-01 — Wf47→Wg48 controlled handoff template (Phase 1).

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
- **47→48 live manual handoff**: **PASS ATTESTATO UTENTE**.
- **48 - Wg external_receipt manual correlation**: **PASS ATTESTATO UTENTE**.
- **49 - Wh final rehearsal**: **PASS ATTESTATO UTENTE** (not used for handoff gates).
- **47→48 controlled handoff template**: **IMPLEMENTATION READY** (after this task).
- **47→48 controlled handoff runtime**: **BLOCKED** until reimport + explicit user gate + manual 48 workflow reference wiring.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **47→48 handoff runtime**: **BLOCKED** until Phase 2 user gate.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

**Reimport only 47 - Wf and 48 - Wg from updated templates, keep active:false, reset test tables, manually wire/select the concrete 48 - Wg workflow reference in 47, enable the explicit test-only 47→48 handoff switch for the runtime window, run one controlled schedule cycle, verify 47 accepts one real Telegram update and 48 closes D-9998-T from the sanitized receipt, then turn 47 off immediately. No Telegram Trigger, no public webhook, no production Data Table, no control_plane_state, no 48 scheduled independently, no 49 active, no PM-34, no workflow 40/41/42 mutation, no secrets.**

Runbooks: `docs/workflow-wf-telegram-inbound-polling-getupdates.md` §10bis, `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state`.
- NO 48 scheduled / 49 active / PM-34 / wf40/41/42 mutation / secrets in Git.

## Audit

- Handoff template: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-template.md`.
- Schedule PASS: `docs/sessions/2026-06-01-control-plane-wf47-limited-schedule-runtime-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
