# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-07 — D-0026-S Decision Packet / inbound state reconciliation (docs-only).

---

## Stato operativo attuale

- Foundation: completa. Workflow **40/42**: **ATTIVO** (unchanged). Workflow **41**: off.
- Classifier / mapping preview: **D-0021** transport/auth **PASS**; **D-0022-W** n8n wiring **PASS ATTESTATO UTENTE**; **D-0023-N** mapping contract **PASS** (docs-only); **D-0024-M** fixture-only mapping preview **PASS ATTESTATO UTENTE**; **D-0025-L** live classifier → mapping preview **PASS ATTESTATO UTENTE** — **closed**.
- **`n8n_ready=false`** unchanged. **No permanent automation declared**. Pezzi collegati ≠ loop avviato.

## Latest verified PASS

- **D-0025-L — Live classifier mapping preview**: **PASS ATTESTATO UTENTE** — workflow `56`. Evidenza: `docs/sessions/2026-06-07-control-plane-d0025l-live-mapping-preview-runtime-pass.md`.
- **D-0024-M — Decision Packet mapping preview (fixture-only)**: **PASS ATTESTATO UTENTE** — workflow `55`. Evidenza: `docs/sessions/2026-06-06-control-plane-d0024m-mapping-preview-runtime-pass.md`.
- **D-0023-N — Decision Packet mapping design**: **PASS** (docs-only). Evidenza: `docs/contracts/decision-packet-mapping-v1.md`, `docs/sessions/2026-06-05-control-plane-d0023n-decision-packet-mapping-design.md`.
- **D-0022-W / D-0021**: **PASS ATTESTATO UTENTE**.

## Decision Packet / Telegram / inbound / decision-store (known state)

Costruito e in gran parte **test-PASSato**; **NON attivo** come loop operativo.

| Asset | Stato | Note |
|-------|--------|------|
| **45 / Wd** | **PASS ATTESTATO UTENTE** (2026-05-31) | Manual → `/classify` → Telegram Send Decision Packet. Evidenza: `telegram_send_ok`, `message_id=678`, `decision_id=D-9998-T`. **Non va ricreato.** Session: `docs/sessions/2026-05-31-control-plane-wd-operational-decision-packet-b-live-pass.md`. Gate 3 re-run: `message_id=732` (2026-06-02). |
| **46 / We** | Package-prep **completato**; **live BLOCKED/PENDING** | HTTPS webhook required; **We live PASS NON registrato**. Session: `docs/sessions/2026-05-31-control-plane-we-telegram-interactive-buttons-live-blocked.md`. |
| **47 / Wf** | **PASS multipli ATTESTATO UTENTE**; **ora off** | Data Table accept-once, limited-schedule runtime, live getUpdates, handoff 47→48. Non ridurre a “off/exists”. Sessions: `docs/sessions/2026-06-01-control-plane-wf47-*`. |
| **48 / Wg** | **PASS**; **callable**; **non schedulato** | Manual validation + handoff 47→48 controllato/live. |
| **49 / Wh** | Rehearsal manuale finale **PASS ATTESTATO UTENTE**; **provato**; **ora inattivo** | Non “not used” — fixture chain 47→48 via 49 testato; non loop operativo. Session: `docs/sessions/2026-05-31-control-plane-wf47-wg-wh-final-manual-runtime-rehearsal-pass.md`. |
| **decision-store** | Gates **1–3 PASS** | Gate 1 design · Gate 2 template · Gate 3 runtime end-to-end **2026-06-02** (Wd open → Wf accept → Wg close). Session: `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`. |

- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- **We/46 live**: **BLOCKED/PENDING** (HTTPS webhook).
- **Attivazione operativa inbound/loop**: **gate separato** — non deciso; eventuale prossimo runtime = **riuso/riverifica asset esistenti**, non nuovo workflow.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

Separate operational step — **not yet decided**; **not** auto-started. Prossimo runtime atteso: riuso/riverifica **45/46/47/48/49** e decision-store, non nuovo workflow. Boundaries: NO PM-34 · NO wf40/41/42 mutation · NO 48 schedule · NO Telegram Trigger · NO Funnel · NO public webhook · NO provider API key · NO secrets in Git · NO `n8n_ready=true` · NO permanent automation · pezzi collegati ≠ loop avviato.

## Redaction hygiene

- Before commits touching docs/workflow artifacts: run `bash tools/redaction-check.sh`.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / PM-34 unlock / wf40/41/42 mutation / secrets in Git.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO declaring prior test-PASS assets as permanent operational loop automation.

## Audit

- Inbound/decision-store: sessions under `docs/sessions/2026-05-31-*`, `docs/sessions/2026-06-01-*`, `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.
- Mapping preview: `docs/sessions/2026-06-06-control-plane-d0024m-*`, `docs/sessions/2026-06-07-control-plane-d0025l-*`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
