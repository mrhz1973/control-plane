# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza e cronologia completa: `docs/runtime/LAST_CURSOR_REPORT.md`, i session log in
> `docs/sessions/`, e la Git history. Se questo file e una di quelle fonti divergono,
> SEGNALA la discrepanza — non indovinare.
> PRINCIPIO MEMORIA: il sistema ricorda per l'umano. Non chiedere mai di reincollare
> stato/output: leggilo da qui o da GitHub. I token costano meno della memoria dell'utente.

Ultimo aggiornamento: 2026-06-01 — 47→48 live manual handoff PASS ATTESTATO UTENTE.

---

## Stato operativo attuale

- Foundation: completa (Tailscale attivo, 3 AI installate/collaudate, abbonamenti fissi, nessuna API a consumo).
- Workflow 40 polling commit → Telegram: **ATTIVO** (produzione, non si tocca).
- Workflow 42 diff-summary Telegram MVP: **ATTIVO**.
- Classifier wrapper/server v1 (local runtime): **PASS** local; **NON** cablato al loop n8n.
- Catena wf42 → Codex → Cursor: **PASS** in modalità MANUALE/SUPERVISIONATA (non automatica).

## Latest verified PASS

- **47→48 live manual handoff**: **PASS ATTESTATO UTENTE**.
- Evidenza: `docs/sessions/2026-06-01-control-plane-wf47-wg-live-manual-handoff-pass.md`.
- Hash: `docs/runtime/LAST_CURSOR_REPORT.md` (LATEST + HISTORY).

## Stato Wf47 / Wg / Wh

- **47 - Wf live getUpdates manual poll**: **PASS ATTESTATO UTENTE**.
- **48 - Wg external_receipt manual correlation**: **PASS ATTESTATO UTENTE**.
- **47→48 live manual handoff**: **PASS ATTESTATO UTENTE**.
- **49 - Wh final rehearsal**: **PASS ATTESTATO UTENTE** — **not used** for this live gate.
- Wf47/Wg fixture validations: **PASS ATTESTATO UTENTE** (preserved).
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN** — gated da PM-34.
- **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34** real worker: **BLOCKED**.
- **We** Telegram interactive buttons (live): **BLOCKED/PENDING** (HTTPS webhook).
- Path B OpenClaw agent `main`: **BLOCKED** (no provider API key).

## Next gate

**Next gate: define the first limited schedule test for 47 - Wf only, test-only and reversible, or mark BLOCKED with a concrete blocker. No Telegram Trigger, no public webhook, no production Data Table, no control_plane_state, no PM-34, no workflow 40/41/42 mutation, no secrets.**

Canonico: `docs/workflow-wf47-wg-operationalization-plan.md` · runbook Wf/Wg.

## Do-not-do (vincoli espliciti)

- NO Telegram Trigger / public webhook.
- NO production Data Table / `control_plane_state` (until explicit gate).
- NO PM-34 unlock; NO mutazione workflow 40 / 41 / 42.
- NO segreti in Git.
- NO nuovi PREP/PRE-PREP per questa catena senza rischio nominato.

## Asset n8n (riferimento)

- Wf47/Wg/Wh templates: `workflows/` (47/48 live handoff proven; inactive/off).
- Test tables: `wf47_polling_state_test`, `wg_decision_state_test` only.
- Telegram credential: "CONTROL PLANE - Telegram Bot" (token solo in n8n).

## Audit / cronologia

- Session log live handoff: `docs/sessions/2026-06-01-control-plane-wf47-wg-live-manual-handoff-pass.md`.
- Wg48 external receipt mode: `docs/sessions/2026-06-01-control-plane-wg48-external-receipt-mode.md`.
- Hash task: `docs/runtime/LAST_CURSOR_REPORT.md`.

## Manutenzione

- Aggiornare come epilogo di ogni task che cambia lo stato. Preferibilmente < 120 righe.
