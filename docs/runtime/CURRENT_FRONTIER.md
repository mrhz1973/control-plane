# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-04 — D-0021 classifier transport/auth PASS.

---

## Stato operativo attuale

- Foundation: completa. Workflow 40/42: **ATTIVO** (produzione, non si tocca).
- Classifier Ryzen: **a.1** at-logon **PASS**; **D-0021** Tailscale Serve + token + ACL **PASS** — VPS reaches Ryzen via tailnet HTTPS; **no n8n workflow wired yet**.

## Latest verified PASS

- **D-0021 — classifier stable transport/auth**: **PASS ATTESTATO UTENTE** — Tailscale Serve tailnet-only (`D-0021-T:3`); token + ACL (`D-0021-A:A`); VPS `/healthz` 200, `/classify` 401 without token, 200 with token. Evidenza: `docs/sessions/2026-06-04-control-plane-classifier-tailscale-serve-auth-acl-pass.md`.
- **a.1 — classifier persistent at-logon**: **PASS ATTESTATO UTENTE**. Evidenza: `docs/sessions/2026-06-04-control-plane-classifier-persistent-at-logon-a1-pass.md`.
- **Shared decision store Gate 3**: **PASS ATTESTATO UTENTE** (`update_id` **986228569**).

## Stato Wf47 / Wg / decision store

- Decision store Gates 1–3: **PASS**.
- **47 - Wf**: off — not permanently operational.
- **48 - Wg**: callable/published, not scheduled independently.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

Explicit **n8n wiring/config** for classifier URL + `X-Classifier-Token` header, or another operational gate. Transport/auth achieved; **no permanent automation declared**. Boundaries: NO PM-34 · NO 49 · NO wf40/41/42 mutation · NO Telegram Trigger · NO Funnel · NO public webhook · NO secrets in Git.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / production Data Table / `control_plane_state` for decisions.
- NO 48 scheduled independently / 49 active / PM-34 unlock / wf40/41/42 mutation / secrets or tokens in Git.
- NO declaring transport or Gate 3 loop as permanent operational automation.

## Audit

- D-0021 transport/auth: `docs/sessions/2026-06-04-control-plane-classifier-tailscale-serve-auth-acl-pass.md`.
- a.1 classifier: `docs/sessions/2026-06-04-control-plane-classifier-persistent-at-logon-a1-pass.md`, `docs/runtime/control-plane-classifier.task.xml`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
