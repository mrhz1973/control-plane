# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> I session log sono evidenza/audit. Questo file è la verità d'ingresso.
> Se questo file e un session log divergono, SEGNALA la discrepanza — non indovinare.
> PRINCIPIO MEMORIA: il sistema ricorda per l'umano. Non chiedere mai all'utente di
> ricordare o reincollare stato/output: leggilo da qui o da GitHub. I token costano
> meno della memoria dell'utente.

Ultimo aggiornamento: 2026-05-31 — Wc Decision Packet Telegram automatic/cablato package prepared

## PASS confermati (con prova)
- Foundation completa: Tailscale attivo, 3 AI installate e collaudate, abbonamenti fissi, nessuna API a consumo.
- Workflow 40 polling: ATTIVO.
- Telegram base: ATTIVO.
- Workflow 42 diff-summary Telegram MVP: ATTIVO (PASS automatico su nuovo commit, dedupe funzionante).
- Catena wf42 -> Codex CLI (solo): PASS — trigger 727db3e, Codex decide correttamente che Cursor NON serve (caso "non fare niente").
- Catena completa wf42 -> Codex -> Cursor MANUALE/SUPERVISIONATA: PASS — trigger reale c64b800 -> commit GIS d04089610958dbb601969c9092665c4d0ad5091b ("docs: clarify README usage and supported formats", co-author cursoragent, docs-only). VERIFICATO su GitHub.
- C1a classifier wrapper v1 Node local runtime: PASS — `tools/classifier-wrapper-v1.mjs`; 4 canonical offline mock cases PASS (`tests/classifier-wrapper/run-offline-tests.mjs`); `/api/generate` payload guard PASS (`stream:false`, `think:false`, `format:json`); no chain-of-thought requested or persisted.
- C1b classifier wrapper v1 live qwen3:14b smoke: PASS — docs-only input via wrapper; schema-valid output (`risk:low`, `route:auto_allowed`); no fallback; no chain-of-thought.
- D-0002-C guard keyword precision hardening: PASS — offline suite A-I (9 cases); negative-context false-positive protection; deploy-path regression (`scripts/deploy.sh` stays high); structured flags authoritative.
- Primo Decision Packet Telegram (D-0002-C): inviato MANUALMENTE — PASS ATTESTATO UTENTE. Esecuzione singola n8n UI, workflow INATTIVO, credential "CONTROL PLANE - Telegram Bot" esistente, nessun token in git. NON cablato, NON automatico. Evidenza: messaggio Telegram dell'utente (nessun artefatto repo).
- Step Wa classifier HTTP server v1 offline: PASS — tools/classifier-server-v1.mjs; tests/classifier-server/run-offline-tests.mjs T1-T5 PASS; bind default loopback 127.0.0.1; zero external dependencies; no chain-of-thought; wrapper not modified.
- Wb-docs: docs/foundation/DECISION_PACKET_FORMAT.md definito — estensione canonica di PROJECT_VISION §7.7; ponte classifier->gate umano; regole di redazione Telegram/no-secrets/no-CoT.
- Wb-live package: PREP PASS — importable inactive n8n template, sanitized classifier test event, manual runbook, and registration prompt prepared; no runtime executed.
- Wb-live n8n -> classifier-server manual single execution via Tailscale: PASS ATTESTATO UTENTE — evidence: HTTP 200; schema-valid classifier output (risk=low, route=auto_allowed, confidence=high, requires_human=false); no fallback; workflow inactive after run; no Telegram send; no workflow 40/41 mutation or execution; no PM-34 unlock/touch; no secrets/token/chat_id/credential/webhook/API key/chain-of-thought in output.
- Wc Decision Packet Telegram automatic/cablato package: PREP PASS — importable inactive n8n template, sanitized test event, manual runbook, and registration prompt prepared; no runtime executed.

## Frontiera attuale / prossimo gate
- Prossimo gate reale (Wc physical): user imports the inactive template in n8n, configures Telegram credential/chat_id in UI only, runs Manual Trigger once, verifies one TEST ONLY Decision Packet Telegram message, then returns sanitized evidence for registration.
- Telegram Decision Packet automatico/cablato runtime send: NOT RUN until physical execution is attested.
- n8n runtime/wiring to classifier wrapper/server (automatic/cablato): NOT RUN.
- Telegram Decision Packet automatico/cablato: NOT RUN.
- Catena completa AUTOMATIZZATA (nessun filo umano, output Codex auto-instradato a Cursor): NOT RUN. E' Fase 3, gated da PM-34.
- n8n runtime/wiring to classifier wrapper: NOT RUN.
- Telegram Decision Packet send AUTOMATICO/cablato: NOT RUN.

## Asset n8n esistenti (NON riconfigurare da zero)

* Inventario canonico: docs/WORKFLOW_EXPORT_STATUS.md
* wf40 polling commit->Telegram: workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json
* wf42 diff-summary: workflows/42-diff-summary-mvp.template.json (+ docs/workflow-42-diff-summary-mvp.md)
* wf41 candidato: workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json
* Telegram credential n8n: "CONTROL PLANE - Telegram Bot" (token solo in n8n). Data Table: control_plane_state
* Regole redazione export: workflows/README.md

## NON ripetere / bloccato
- NON marcare Codex CLI o Cursor CLI "ATTIVO" in PROJECT_VISION 1.1: la catena e' manuale/supervisionata, non automatica.
- NON marcare Ollama classifier fully ATTIVO nel loop: C1a+C1b local runtime PASS; not wired to n8n.
- NON ri-sondare codex --version / --help: noto codex-cli 0.133.0, supporta --ephemeral, --sandbox read-only, --cd, --add-dir, prompt via stdin.
- PM-34 real worker gate: BLOCCATO.
- Path B OpenClaw agent main: BLOCCATO (manca provider API key). Backlog Option B con vendor proof.
- Ollama classifier in automatic loop: NON ATTIVO (C1a+C1b local runtime PASS; not wired).

## Manutenzione di questo file
- Aggiornare come EPILOGO di ogni task che cambia lo stato (stesso meccanismo di LAST_CURSOR_REPORT.md): la riga va aggiunta/spostata nello stesso commit che produce il cambiamento.
