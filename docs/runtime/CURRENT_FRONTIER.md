# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-07 — Gate A readiness audit PASS ATTESTATO UTENTE.

---

## Stato operativo attuale

- Foundation: completa. Workflow **40/42**: **ATTIVO** (unchanged). Workflow **41**: off.
- Classifier / mapping preview: **D-0021**–**D-0025-L** PASS; **D-0027-R** Wd45 reverification PASS.
- **D-0028-A Option 2:** activation plan committed. **Gate A** readiness audit **PASS ATTESTATO UTENTE** (2026-06-07). **Option 4 not started.**
- **`n8n_ready=false`** unchanged. **No permanent automation declared**. Pezzi collegati ≠ loop avviato.

## Latest verified PASS

- **Gate A — Readiness audit (D-0028-A)**: **PASS ATTESTATO UTENTE** — read-only inventory 45/46/47/48/49 + Data Tables test + classifier `/healthz` OK. **Not** loop activation. Evidenza: `docs/sessions/2026-06-07-control-plane-gate-a-readiness-audit-pass.md`.
- **D-0027-R — Wd45 runtime reverification**: **PASS ATTESTATO UTENTE** — existing workflow **45/Wd**; test-only `D-9999-T`; `telegram_send_ok`, `message_id=748`. Evidenza: `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`.
- **D-0025-L — Live classifier mapping preview**: **PASS ATTESTATO UTENTE** — workflow `56`. Evidenza: `docs/sessions/2026-06-07-control-plane-d0025l-live-mapping-preview-runtime-pass.md`.
- **D-0024-M — Decision Packet mapping preview (fixture-only)**: **PASS ATTESTATO UTENTE** — workflow `55`. Evidenza: `docs/sessions/2026-06-06-control-plane-d0024m-mapping-preview-runtime-pass.md`.
- **D-0023-N — Decision Packet mapping design**: **PASS** (docs-only). Evidenza: `docs/contracts/decision-packet-mapping-v1.md`, `docs/sessions/2026-06-05-control-plane-d0023n-decision-packet-mapping-design.md`.
- **D-0022-W / D-0021**: **PASS ATTESTATO UTENTE**.

## Decision Packet / Telegram / inbound / decision-store (known state)

Costruito e in gran parte **test-PASSato**; **NON attivo** come loop operativo.

| Asset | Stato | Note |
|-------|--------|------|
| **45 / Wd** | **PASS ATTESTATO UTENTE** (2026-05-31) + **riverifica PASS ATTESTATO UTENTE** (2026-06-07) | Manual → `/classify` → Telegram Send Decision Packet. Original: `D-9998-T`, `message_id=678`. Riverifica: `D-9999-T`, `message_id=748`, `open_action=insert`. **Non va ricreato.** Sessions: `docs/sessions/2026-05-31-control-plane-wd-operational-decision-packet-b-live-pass.md`, `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`. Gate 3 re-run 2026-06-02: `message_id=732`. Inbound **47/48/49 not activated**. |
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

**Not auto-started.** Next explicit choice: **Gate B** limited manual runtime re-verification (existing assets) **or** future **D-0028-A Option 4** controlled activation — **separate decision**; Option 4 **not** begun. Boundaries: NO PM-34 · NO `n8n_ready=true` · NO wf40/41/42 mutation · NO new workflow unless explicit · NO permanent schedule/webhook/Telegram Trigger/Funnel · pezzi collegati ≠ loop avviato.

## Redaction hygiene

- Before commits touching docs/workflow artifacts: run `bash tools/redaction-check.sh`.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / PM-34 unlock / wf40/41/42 mutation / secrets in Git.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO declaring prior test-PASS assets as permanent operational loop automation.

## Audit

- Inbound/decision-store: sessions under `docs/sessions/2026-05-31-*`, `docs/sessions/2026-06-01-*`, `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.
- Mapping preview / Wd reverification: `docs/sessions/2026-06-06-control-plane-d0024m-*`, `docs/sessions/2026-06-07-control-plane-d0025l-*`, `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`.
- D-0028-A / Gate A: `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`, `docs/sessions/2026-06-07-control-plane-d0028a-automation-activation-plan.md`, `docs/sessions/2026-06-07-control-plane-gate-a-readiness-audit-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
