# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-05 — D-0022-W n8n classifier manual wiring/config PASS.

---

## Stato operativo attuale

- Foundation: completa. Workflow **40/42**: **ATTIVO** (unchanged). Workflow **41**: off.
- Classifier: **D-0021** transport/auth **PASS**; **D-0022-W** n8n wiring/config **PASS ATTESTATO UTENTE** — dedicated manual inactive workflow **50 - D-0022-W** calls classifier via Tailscale Serve; **no permanent automation declared**.

## Latest verified PASS

- **D-0022-W — n8n classifier manual wiring/config**: **PASS ATTESTATO UTENTE** — dedicated inactive manual workflow; final full run HTTP 200 schema-valid (`risk=low`, `route=auto_allowed`, `confidence=high`, `requires_human=false`); auth-fail **401** verified; fail-closed **404** verified. Evidenza: `docs/sessions/2026-06-05-control-plane-d0022w-n8n-classifier-manual-wiring-pass.md`.
- **D-0021 — classifier stable transport/auth**: **PASS ATTESTATO UTENTE**.
- **a.1 — classifier persistent at-logon**: **PASS ATTESTATO UTENTE**.

## Stato Wf47 / Wg / decision store

- Decision store Gates 1–3: **PASS**.
- **47 - Wf**: off. **48 - Wg**: callable/published, not scheduled independently. **49**: not used.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

Separate explicit decision required before next runtime integration step (design/import/operation) — **do not auto-start**. No automatic loop marked active. Boundaries: NO PM-34 · NO 49 · NO wf40/41/42 mutation · NO Telegram Trigger · NO Funnel · NO public webhook · NO provider API key · NO secrets in Git.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / production Data Table / `control_plane_state` for decisions.
- NO 48 scheduled independently / PM-34 unlock / wf40/41/42 mutation / secrets or tokens in Git.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO declaring D-0022-W or transport gates as permanent operational loop automation.

## Audit

- D-0022-W wiring: `docs/sessions/2026-06-05-control-plane-d0022w-n8n-classifier-manual-wiring-pass.md`.
- D-0021 transport/auth: `docs/sessions/2026-06-04-control-plane-classifier-tailscale-serve-auth-acl-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
