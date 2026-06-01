# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-01 — Shared decision store Gate 2 template no-runtime.

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
- **Shared decision store — Gate 2** (template no-runtime): **PASS / IMPLEMENTATION READY** (docs-only) — Wd open-on-send + Wg close-on-reply point to `control_plane_decisions_test`; both `active:false`; no runtime.
- **Shared decision store — Gate 3** (runtime user-attested): **NEXT / NOT STARTED**.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

**Gate 3:** runtime user-attested (test-only) — end-to-end **Wd open on send** → Telegram reply → **Wf accept** → **Wg close** on `control_plane_decisions_test`; verify `open_without_send` risk. Boundaries: NO `control_plane_state` · NO production table · NO PM-34 · NO 49 · NO Telegram Trigger · NO public webhook · NO wf40/41/42 · NO secrets. Design: `docs/decision-store-shared-open-close-design.md`.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state` for decisions.
- NO 48 scheduled / 49 active / PM-34 / wf40/41/42 mutation / secrets in Git.

## Audit

- Decision store Gate 1: `docs/decision-store-shared-open-close-design.md`, `docs/sessions/2026-06-01-control-plane-decision-store-shared-design.md`.
- Decision store Gate 2: `docs/decision-store-shared-open-close-design.md` §8/§11, `docs/sessions/2026-06-01-control-plane-decision-store-gate2-template-no-runtime.md`.
- Controlled handoff runtime: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-runtime-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
