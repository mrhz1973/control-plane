# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza e cronologia completa: `docs/runtime/LAST_CURSOR_REPORT.md`, i session log in
> `docs/sessions/`, e la Git history. Se questo file e una di quelle fonti divergono,
> SEGNALA la discrepanza — non indovinare.
> PRINCIPIO MEMORIA: il sistema ricorda per l'umano. Non chiedere mai di reincollare
> stato/output: leggilo da qui o da GitHub. I token costano meno della memoria dell'utente.

Ultimo aggiornamento: 2026-05-31 — anti-burocrazia / momentum correction (docs-only, no-runtime).

---

## Stato operativo attuale

- Foundation: completa (Tailscale attivo, 3 AI installate/collaudate, abbonamenti fissi, nessuna API a consumo).
- Workflow 40 polling commit → Telegram: **ATTIVO** (produzione, non si tocca).
- Workflow 42 diff-summary Telegram MVP: **ATTIVO**.
- Classifier wrapper/server v1 (local runtime): **PASS** local; **NON** cablato al loop n8n.
- Catena wf42 → Codex → Cursor: **PASS** in modalità MANUALE/SUPERVISIONATA (non automatica).

## Latest verified PASS

- **Wf47 → Wg operationalization checklist**: **PREP PASS / no-runtime**.
- (precedente) Wf47 → Wg operationalization plan: **PREP PASS / no-runtime**.
- Dettaglio commit/hash: vedi `docs/runtime/LAST_CURSOR_REPORT.md` (LATEST + HISTORY).

## Stato Wf47 / Wg / Wh

- **Wf47** (polling/getUpdates, Data Table test-only) manual validation: **PASS ATTESTATO UTENTE**.
- **Wg** (inbound Decision Packet state correlation, test-only) manual validation: **PASS ATTESTATO UTENTE**.
- **Wh** (Wf47 → Wg combined inbound decision flow, workflow 49, test-only) manual validation: **PASS ATTESTATO UTENTE**.
- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- Catena completa AUTOMATIZZATA (nessun filo umano): **NOT RUN** — Fase 3, gated da PM-34.

## Active blockers

- **PM-34** real worker: **BLOCKED** (nessuna prova reale + gate esplicito).
- **We** Telegram interactive buttons (live): **BLOCKED/PENDING** — Telegram Trigger richiede public HTTPS webhook; n8n attuale è tunnel/loopback. Path B polling = Wf47 (PASS).
- Path B OpenClaw agent `main`: **BLOCKED** (manca provider API key — policy no provider API key).

## Next gate

**Next gate: one bounded Wf47/Wg/Wh final manual runtime rehearsal, test-only and inactive/off. It may include import/reimport rehearsal plus up to 2 repeat manual runs. After that, advance to the next real operational gate or mark BLOCKED with a concrete blocker. No optional scenario testing unless a named risk appears.**

Canonico: `docs/workflow-wf47-wg-operationalization-plan.md`. Riferimento anti-burocrazia: PROJECT_VISION §7.9.

## Do-not-do (vincoli espliciti)

- NO schedule / Schedule Trigger sul path inbound.
- NO Telegram Trigger.
- NO public webhook / `setWebhook`.
- NO production Data Table.
- NO `control_plane_state` per il path Wf47/Wg/Wh.
- NO PM-34 unlock senza gate esplicito separato.
- NO mutazione workflow 40 / 41 / 42.
- NO segreti in Git (token, credential id/content, webhook/auth URL, API key, OAuth, PAT, CoT, URL tokenizzati).
- NO test opzionali (`note_only` / `malformed` / `stale_closed`) senza un rischio nominato.
- NO test non deterministici come evidenza di PASS.
- NO nuovi documenti di pre-pass/pre-pre-pass per la stessa catena senza un nuovo rischio concreto.

## Asset n8n esistenti (NON riconfigurare da zero)

- Inventario canonico: `docs/WORKFLOW_EXPORT_STATUS.md`.
- wf40 polling commit → Telegram: `workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json`.
- wf42 diff-summary: `workflows/42-diff-summary-mvp.template.json` (+ `docs/workflow-42-diff-summary-mvp.md`).
- wf41 candidato backup: `workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json`.
- Telegram credential n8n: "CONTROL PLANE - Telegram Bot" (token solo in n8n). Data Table produzione: `control_plane_state`.
- Wf47/Wg/Wh templates + CSV seeds test-only: `workflows/` e `data-tables/` (vedi `docs/foundation/DATA_TABLE_CSV_CONVENTION.md`).
- Regole redazione export: `workflows/README.md`.

## NON ripetere / note

- NON marcare Codex CLI o Cursor CLI "ATTIVO" in PROJECT_VISION §1.1: la catena è manuale/supervisionata, non automatica.
- NON marcare Ollama classifier "ATTIVO nel loop": local runtime PASS, non cablato a n8n.
- NON ri-sondare `codex --version` / `--help`: noto codex-cli 0.133.0 (`--ephemeral`, `--sandbox read-only`, `--cd`, `--add-dir`, prompt via stdin).

## Audit / cronologia (dove guardare)

- Hash dei commit reali e ultimi 5 task: `docs/runtime/LAST_CURSOR_REPORT.md`.
- Evidenza dettagliata per ogni PASS storico: session log in `docs/sessions/`.
- Cronologia completa e auditabilità: Git history (`git log`, `git show`).

## Manutenzione di questo file

- Aggiornare come EPILOGO di ogni task che cambia lo stato, nello stesso commit che produce il cambiamento.
- Tenerlo compatto (preferibilmente < 120 righe): è un file di stato, non un session log. La cronologia vive in LAST_CURSOR_REPORT.md, session log e Git history.
