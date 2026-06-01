# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-01 — Shared decision store Gate 1 design.

---

## Stato operativo attuale

- Foundation: completa. Workflow 40/42: **ATTIVO** (produzione, non si tocca).
- Classifier local: **PASS**; non cablato n8n. Catena wf42→Codex→Cursor: **PASS** manuale/supervisionata.

## Latest verified PASS

- **47→48 controlled handoff runtime**: **PASS ATTESTATO UTENTE** (`update_id` **986228567**).
- Evidenza: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-runtime-pass.md`.

## Stato Wf47 / Wg / Wh / decision store

- **47→48 controlled handoff runtime**: **PASS ATTESTATO UTENTE** (unchanged).
- **Shared decision store open/close contract — Gate 1 design**: **PASS** (docs-only).
- **Shared decision store — Gate 2** (template no-runtime): **NOT STARTED**.
- **Shared decision store — Gate 3** (runtime user-attested): **NOT STARTED**.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

**Gate 2:** template no-runtime — Wd writes **open** to `control_plane_decisions_test`; Wg reads same store for close-on-reply. **No runtime.** Design: `docs/decision-store-shared-open-close-design.md`. Boundaries: NO `control_plane_state` · NO production table · NO PM-34 · NO Telegram Trigger · NO public webhook · NO wf40/41/42 · NO secrets.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state` for decisions.
- NO 48 scheduled / 49 active / PM-34 / wf40/41/42 mutation / secrets in Git.

## Audit

- Decision store Gate 1: `docs/decision-store-shared-open-close-design.md`, `docs/sessions/2026-06-01-control-plane-decision-store-shared-design.md`.
- Controlled handoff runtime: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-runtime-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
