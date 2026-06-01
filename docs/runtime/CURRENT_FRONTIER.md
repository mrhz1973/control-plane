# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza e cronologia completa: `docs/runtime/LAST_CURSOR_REPORT.md`, i session log in
> `docs/sessions/`, e la Git history. Se questo file e una di quelle fonti divergono,
> SEGNALA la discrepanza — non indovinare.
> PRINCIPIO MEMORIA: il sistema ricorda per l'umano. Non chiedere mai di reincollare
> stato/output: leggilo da qui o da GitHub. I token costano meno della memoria dell'utente.

Ultimo aggiornamento: 2026-06-01 — Wg48 external receipt mode (implementation ready).

---

## Stato operativo attuale

- Foundation: completa (Tailscale attivo, 3 AI installate/collaudate, abbonamenti fissi, nessuna API a consumo).
- Workflow 40 polling commit → Telegram: **ATTIVO** (produzione, non si tocca).
- Workflow 42 diff-summary Telegram MVP: **ATTIVO**.
- Classifier wrapper/server v1 (local runtime): **PASS** local; **NON** cablato al loop n8n.
- Catena wf42 → Codex → Cursor: **PASS** in modalità MANUALE/SUPERVISIONATA (non automatica).

## Latest verified PASS

- **Wf47/Wg/Wh final manual runtime rehearsal** (workflow 49 fixtures): **PASS ATTESTATO UTENTE**.
- **47 - Wf live getUpdates manual poll**: **PASS ATTESTATO UTENTE** (live gate discovery).
- Dettaglio commit/hash: `docs/runtime/LAST_CURSOR_REPORT.md` (LATEST + HISTORY).

## Stato Wf47 / Wg / Wh

- **Wf47** manual validation + **live getUpdates poll**: **PASS ATTESTATO UTENTE**.
- **Wg** fixture manual validation: **PASS ATTESTATO UTENTE**.
- **Wg external receipt mode** (`external_receipt` + `manual_receipt_json`): **IMPLEMENTATION READY** (after this task commit).
- **47→48 live manual handoff**: **BLOCKED** until updated **48 - Wg** is reimported and run with `external_receipt`.
- **Wh** combined flow (workflow 49): **PASS ATTESTATO UTENTE** (fixture rehearsal; unchanged).
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA: **NOT RUN** — gated da PM-34.
- **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34** real worker: **BLOCKED**.
- **47→48 live handoff**: **BLOCKED** until 48 - Wg reimported from updated template.
- **We** Telegram interactive buttons (live): **BLOCKED/PENDING** (HTTPS webhook).
- Path B OpenClaw agent `main`: **BLOCKED** (no provider API key).

## Next gate

**Reimport only 48 - Wg Telegram Inbound Decision State Correlation TEST ONLY - TEMPLATE from updated template, keep active:false, set scenario external_receipt with the sanitized receipt produced by 47 - Wf, then run 48 - Wg manually. No schedule, no Telegram Trigger, no public webhook, no production Data Table, no control_plane_state, no PM-34, no workflow 40/41/42.**

Canonico: `docs/workflow-wf47-wg-operationalization-plan.md` §4bis · runbook: `docs/workflow-wg-telegram-inbound-decision-state-correlation.md` §5bis.

## Do-not-do (vincoli espliciti)

- NO schedule / Schedule Trigger sul path inbound.
- NO Telegram Trigger.
- NO public webhook / `setWebhook`.
- NO production Data Table.
- NO `control_plane_state` per il path Wf47/Wg/Wh.
- NO PM-34 unlock senza gate esplicito separato.
- NO mutazione workflow 40 / 41 / 42.
- NO segreti in Git.
- NO nuovi PREP/PRE-PREP per questa catena senza rischio nominato.

## Asset n8n esistenti (NON riconfigurare da zero)

- Inventario: `docs/WORKFLOW_EXPORT_STATUS.md`.
- Wf47/Wg/Wh templates: `workflows/` (48 - Wg updated for `external_receipt`; reimport 48 only for next gate).
- CSV seeds test-only: `data-tables/` (non mutare in questo gate).
- Telegram credential n8n: "CONTROL PLANE - Telegram Bot" (token solo in n8n).

## Audit / cronologia

- Hash task: `docs/runtime/LAST_CURSOR_REPORT.md`.
- Session log Wg48 mode: `docs/sessions/2026-06-01-control-plane-wg48-external-receipt-mode.md`.
- Git history per evidenza completa.

## Manutenzione

- Aggiornare come epilogo di ogni task che cambia lo stato. Preferibilmente < 120 righe.
