# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-02 — Shared decision store Gate 3 runtime PASS.

---

## Stato operativo attuale

- Foundation: completa. Workflow 40/42: **ATTIVO** (produzione, non si tocca).
- Classifier local: **PASS**; Gate 3 used temporary tunnel routing (evidence only, not permanent).

## Latest verified PASS

- **Shared decision store Gate 3 runtime end-to-end**: **PASS ATTESTATO UTENTE** — `update_id` **986228569**; path **45 Wd open** → Telegram reply → **47 Wf accept** → **48 Wg close** on `control_plane_decisions_test`.
- Evidenza: `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.

## Stato Wf47 / Wg / Wh / decision store

- **Shared decision store — Gate 1 design**: **PASS** (docs-only).
- **Shared decision store — Gate 2** (template no-runtime): **PASS / IMPLEMENTATION READY**.
- **Shared decision store — Gate 3** (runtime user-attested): **PASS ATTESTATO UTENTE**.
- **47→48 controlled handoff runtime**: **PASS ATTESTATO UTENTE** (unchanged; prior gate).
- **47 - Wf**: **off** after Gate 3 test window — not permanently operational.
- **48 - Wg**: **callable/published**, not scheduled independently.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

Registrazione/stabilizzazione operativa successiva — e.g. permanent classifier routing, We inbound, or explicit operational gate. **No** permanent automation declared. Boundaries: NO PM-34 · NO 49 · NO wf40/41/42 mutation · NO Telegram Trigger · NO public webhook · NO production table · NO secrets.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state` for decisions.
- NO 48 scheduled independently / 49 active / PM-34 unlock / wf40/41/42 mutation / secrets in Git.
- NO treating Gate 3 test loop as permanent operational automation.

## Audit

- Decision store Gate 3: `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`, `docs/decision-store-shared-open-close-design.md` §11.
- Decision store Gate 2: `docs/sessions/2026-06-01-control-plane-decision-store-gate2-template-no-runtime.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
