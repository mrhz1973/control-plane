# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> I session log sono evidenza/audit. Questo file è la verità d'ingresso.
> Se questo file e un session log divergono, SEGNALA la discrepanza — non indovinare.
> PRINCIPIO MEMORIA: il sistema ricorda per l'umano. Non chiedere mai all'utente di
> ricordare o reincollare stato/output: leggilo da qui o da GitHub. I token costano
> meno della memoria dell'utente.

Ultimo aggiornamento: 2026-05-30 — verificato su GitHub (commit GIS d040896 confermato)

## PASS confermati (con prova)
- Foundation completa: Tailscale attivo, 3 AI installate e collaudate, abbonamenti fissi, nessuna API a consumo.
- Workflow 40 polling: ATTIVO.
- Telegram base: ATTIVO.
- Workflow 42 diff-summary Telegram MVP: ATTIVO (PASS automatico su nuovo commit, dedupe funzionante).
- Catena wf42 -> Codex CLI (solo): PASS — trigger 727db3e, Codex decide correttamente che Cursor NON serve (caso "non fare niente").
- Catena completa wf42 -> Codex -> Cursor MANUALE/SUPERVISIONATA: PASS — trigger reale c64b800 -> commit GIS d04089610958dbb601969c9092665c4d0ad5091b ("docs: clarify README usage and supported formats", co-author cursoragent, docs-only). VERIFICATO su GitHub.

## Frontiera attuale / prossimo gate
- Catena completa AUTOMATIZZATA (nessun filo umano, output Codex auto-instradato a Cursor): NOT RUN. E' Fase 3, gated da PM-34.
- Milestone C: classifier wrapper Ollama da design a runtime; primo Decision Packet Telegram.

## NON ripetere / bloccato
- NON marcare Codex CLI o Cursor CLI "ATTIVO" in PROJECT_VISION 1.1: la catena e' manuale/supervisionata, non automatica.
- NON ri-sondare codex --version / --help: noto codex-cli 0.133.0, supporta --ephemeral, --sandbox read-only, --cd, --add-dir, prompt via stdin.
- PM-34 real worker gate: BLOCCATO.
- Path B OpenClaw agent main: BLOCCATO (manca provider API key). Backlog Option B con vendor proof.
- Ollama classifier: solo design, NON ATTIVO.

## Manutenzione di questo file
- Aggiornare come EPILOGO di ogni task che cambia lo stato (stesso meccanismo di LAST_CURSOR_REPORT.md): la riga va aggiunta/spostata nello stesso commit che produce il cambiamento.
