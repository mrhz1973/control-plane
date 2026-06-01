# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-01 — Wf47 Schedule Trigger node-id uniqueness fix (Phase 1b).

---

## Stato operativo attuale

- Foundation: completa. Workflow 40/42: **ATTIVO** (produzione, non si tocca).
- Classifier local: **PASS**; non cablato n8n. Catena wf42→Codex→Cursor: **PASS** manuale/supervisionata.

## Latest verified PASS

- **47→48 live manual handoff**: **PASS ATTESTATO UTENTE** (`real_task_commit` `580e2b5…`).
- Evidenza: `docs/sessions/2026-06-01-control-plane-wf47-wg-live-manual-handoff-pass.md`.

## Stato Wf47 / Wg / Wh

- **47 - Wf live getUpdates manual poll**: **PASS ATTESTATO UTENTE**.
- **48 - Wg external_receipt**: **PASS ATTESTATO UTENTE**.
- **47→48 live manual handoff**: **PASS ATTESTATO UTENTE**.
- **49 - Wh final rehearsal**: **PASS ATTESTATO UTENTE** (not used for live 47→48).
- **47 - Wf disabled Schedule Trigger support**: **IMPLEMENTATION READY** (Phase 1; Phase 1b fixed duplicate node id before import).
- **47 - Wf Schedule Trigger node-id uniqueness**: **PASS** (after Phase 1b commit).
- **First limited 47 - Wf schedule runtime test**: **BLOCKED** until updated 47 reimported + user runtime gate.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **47 schedule runtime test**: **BLOCKED** until Phase 2 user gate (reimport + exclusivity checks).
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

**Reimport only 47 - Wf Telegram Inbound Polling getUpdates TEST ONLY - TEMPLATE from updated template, reset wf47_polling_state_test, verify no Telegram webhook and no other getUpdates consumer, then run a 5–10 minute schedule test on 47 - Wf only. Verify accept-once and no re-accept on next cycle. Turn 47 off immediately. No Telegram Trigger, no public webhook, no production Data Table, no control_plane_state, no 48 scheduled, no 49 active, no PM-34, no workflow 40/41/42 mutation, no secrets.**

Runbook: `docs/workflow-wf-telegram-inbound-polling-getupdates.md` §10.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state`.
- NO 48 scheduled / 49 active / PM-34 / wf40/41/42 mutation / secrets in Git.

## Audit

- Phase 1 session: `docs/sessions/2026-06-01-control-plane-wf47-schedule-trigger-template-ready.md`.
- Phase 1b id fix: `docs/sessions/2026-06-01-control-plane-wf47-schedule-trigger-id-fix.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
