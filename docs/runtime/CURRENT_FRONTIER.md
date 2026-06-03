# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-04 — a.1 classifier persistent at-logon PASS.

---

## Stato operativo attuale

- Foundation: completa. Workflow 40/42: **ATTIVO** (produzione, non si tocca).
- Classifier Ryzen: **persistent at-logon** (a.1 **PASS ATTESTATO UTENTE**); loopback `127.0.0.1:8765` only — **not** wired to n8n/VPS permanently.

## Latest verified PASS

- **a.1 — classifier persistent at-logon (Ryzen)**: **PASS ATTESTATO UTENTE** — L1: port 8765 LISTEN after logout/login, `healthz` ok; L2: POST `/classify` case A valid JSON. Evidenza: `docs/sessions/2026-06-04-control-plane-classifier-persistent-at-logon-a1-pass.md`.
- **Shared decision store Gate 3 end-to-end**: **PASS ATTESTATO UTENTE** (`update_id` **986228569**). Evidenza: `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.

## Stato Wf47 / Wg / decision store

- Decision store Gates 1–3: **PASS** (Gate 3 runtime user-attested).
- **47 - Wf**: off after test windows — not permanently operational.
- **48 - Wg**: callable/published, not scheduled independently.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

Stable classifier routing for n8n (e.g. replace Gate 3 temporary tunnel) or explicit operational gate — **persistence achieved; no permanent automation declared**. Boundaries: NO PM-34 · NO 49 · NO wf40/41/42 mutation · NO Telegram Trigger · NO public webhook · NO production table · NO secrets.

## Do-not-do

- NO Telegram Trigger / public webhook / production Data Table / `control_plane_state` for decisions.
- NO 48 scheduled independently / 49 active / PM-34 unlock / wf40/41/42 mutation / secrets in Git.
- NO declaring a.1 or Gate 3 as permanent operational loop automation.

## Audit

- a.1 classifier: `docs/sessions/2026-06-04-control-plane-classifier-persistent-at-logon-a1-pass.md`, `docs/runtime/control-plane-classifier.task.xml`.
- Decision store Gate 3: `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
