# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> I session log sono evidenza/audit. Questo file è la verità d'ingresso.
> Se questo file e un session log divergono, SEGNALA la discrepanza — non indovinare.
> PRINCIPIO MEMORIA: il sistema ricorda per l'umano. Non chiedere mai all'utente di
> ricordare o reincollare stato/output: leggilo da qui o da GitHub. I token costano
> meno della memoria dell'utente.

Ultimo aggiornamento: 2026-05-31 — Wf47 Wg operationalization plan PREP PASS (no-runtime)

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
- Wc Decision Packet Telegram automatic/cablato manual single execution: PASS ATTESTATO UTENTE — evidence: one Telegram message sent (message_id 669); workflow inactive after run; message matched DECISION_PACKET_FORMAT.md content requirements; TEST ONLY marked; ID D-9999-T; 3 numbered options; "Scrivi: 1 / 2 / 3"; no secrets/token/chat_id/credential/webhook/API key/CoT; no workflow 40/41 mutation or execution; no Data Table mutation; no GitHub write; no PM-34 unlock/touch. Minor formatting issue: Telegram/Markdown removed underscores in event_id/human_gate/requires_human rendering; fix before operational use.
- Wc Decision Packet Telegram formatting fix: PASS (offline) — Telegram node parse_mode set to plain text (""); banner de-Markdownized (=== TEST ONLY ===); underscores now literal (event_id/human_gate/requires_human); verified by tests/wc-decision-packet/run-offline-tests.mjs (T1-T9 PASS); no n8n run, no Telegram send; template stays active:false; no secrets.
- Wc Decision Packet Telegram HTML formatting fix: PASS (offline) — after live rerun showed plain-text/remove-parse-mode still rendered event_id/human_gate/requires_human without underscores, template switched to HTML parse mode with escaped dynamic fields; offline tests T1-T11 PASS; workflow remains active:false; no n8n run, no Telegram send, no secrets.
- Wc HTML formatting fix LIVE: PASS ATTESTATO UTENTE — workflow 44 manual single execution sent one TEST ONLY Telegram message (message_id 674); event_id, human_gate, and requires_human rendered literally with underscores; message retained ID D-9999-T, 3 numbered options, and "Scrivi: 1 / 2 / 3"; workflow remained inactive/off; no workflow 40/41 mutation or execution; no Data Table mutation; no GitHub write by workflow; no PM-34 unlock/touch; no token/chat_id/credential/webhook/API key/CoT visible.
- Wd operational-style Decision Packet integration package: PREP PASS — inactive workflow template, sanitized test event, concise runbook, and registration prompt prepared for next B live gate; no runtime executed; no Telegram sent; PM-34 remains blocked.
- Wd operational-style Decision Packet integration manual single execution: PASS ATTESTATO UTENTE — evidence: classifier-server HTTP success (http_status 200); schema-valid classifier output included in Telegram packet (risk=low, route=human_gate, confidence=medium, requires_human=true); Telegram send ok (message_id 678); TEST ONLY operational-style message; ID D-9998-T; event_id/human_gate/requires_human rendered literally; workflow 45 remained inactive/off; no workflow 40/41 mutation or execution; no Data Table mutation; no GitHub write by workflow; no PM-34 unlock/touch; no secrets/token/chat_id/credential/webhook/API key/CoT visible; Telegram replies 1/2/3 are currently non-operative because no inbound Telegram listener is active.
- We Telegram interactive decision buttons / inbound response handling package: PREP PASS — inactive workflow template, concise runbook, and registration prompt prepared for future live gate; covers inline buttons 1/2/3, decision_id correlation, duplicate/stale guard, and optional follow-up note design; no runtime executed; no Telegram inbound activated; no Telegram sent; PM-34 remains blocked.
- Wf Telegram inbound polling/getUpdates package: PREP PASS — inactive workflow template, concise runbook, and registration prompt prepared for future live gate; avoids public HTTPS webhook requirement by preparing polling/getUpdates path; covers update_id offset, decision_id correlation, option 1/2/3 parsing, duplicate/stale guard, and optional follow-up note design; no runtime executed; no Telegram inbound activated; no Telegram sent; no PM-34.
- Wf Telegram inbound polling/getUpdates live: PASS ATTESTATO UTENTE — evidence: getUpdates HTTP 200 with body.ok=true; Telegram update contained TEST ONLY response "dp:D-9998-T:1"; sanitized final receipt accepted decision_id D-9998-T, selected_option 1, update_id 986228555, duplicate_or_stale=false, note_present=false, test_only=true; workflow 47 remained inactive/off; no public HTTPS webhook; no Telegram Trigger activation; no schedule activation; no PM-34; no workflow 40/41 mutation; no operational automation; no GitHub write by workflow; n8n tunnel closed after test; no token/chat_id/raw Telegram identifiers recorded.
- Wf polling hardening prep: PREP PASS — hardened inactive workflow 47 template and runbook for safe repeated manual polling; offset/lastHandledUpdateId placeholders, allowed-chat closed-by-default guard, stale_old_update_id and duplicate_or_double_click guards, sanitized receipt contract; no runtime executed; no schedule; no inbound automation; no PM-34.
- Wf47 ready-import Data Table template prep: PREP PASS — importable inactive workflow 47 with Data Table load/upsert on test-only table wf47_polling_state_test, Set node for allowed chat (no Code edits), Manual Trigger only; Data Table node schema from repo examples (wf42 get, v4 multirepo returnAll+upsert); no runtime executed; no schedule; no PM-34.
- Wf47 Data Table manual validation: PASS ATTESTATO UTENTE — first manual poll accepted TEST ONLY decision D-9998-T option 1 with update_id 986228559; test-only Data Table wf47_polling_state_test persisted offset/last handled state; second manual poll without new Telegram message returned blocked no_parseable_decision_response with last_handled_update_id 986228559 and offset_after 986228560, so the same update was not accepted twice (duplicate_or_double_click not triggered because persisted offset prevented Telegram from returning the old update). Initial schema fix required adding test-only note column; no secrets; no schedule; no Telegram Trigger; no public webhook; no workflow 40/41 mutation; no production Data Table; no PM-34.
- Wg inbound Decision Packet state correlation package: PREP PASS — importable inactive workflow 48 template + runbook for mapping sanitized inbound DP response to test-only decision state table wg_decision_state_test; scenario fixtures for valid close, duplicate, unknown, stale, note, malformed; no runtime; no schedule; no production Data Table; no PM-34.
- Wg inbound Decision Packet state correlation manual validation: PASS ATTESTATO UTENTE — workflow 48 manual/inactive/off; test-only table wg_decision_state_test; valid_close closed D-9998-T option 1 and persisted state; duplicate blocked already-closed D-9998-T with duplicate_or_already_closed and no second persist; unknown D-9999-X blocked with unknown_decision_id; no secrets; no schedule; no Telegram Trigger; no public webhook; no workflow 40/41 mutation; no production Data Table; no PM-34.
- Wh Wf47->Wg combined inbound decision flow package: PREP PASS — importable inactive workflow 49 template + runbook for feeding sanitized Wf47 inbound receipt into Wg test-only decision state correlation; uses wf47_polling_state_test and wg_decision_state_test; fixture handoff (live getUpdates remains wf47 workflow 47); no runtime; no schedule; no production Data Table; no PM-34.
- chat_id policy gate + CSV convention + wf49 ready: PASS — PROJECT_VISION §10 emendato (gate esplicito 2026-05-31) per ammettere chat_id negli asset config; CSV seeds in data-tables/; wf49 con chat_id reale 472599368, active:false; token resta vietato; nessun runtime; PM-34 BLOCCATO.
- Wh Wf47->Wg combined inbound decision flow manual validation: PASS ATTESTATO UTENTE — workflow 49 manual/inactive/off; CSV seeds imported/reset from data-tables/; valid_close accepted at Wf47 and closed D-9998-T option 1 at Wg with both states persisted; duplicate used wf47 reset only while D-9998-T remained closed and produced Wg duplicate_or_already_closed; unknown D-9999-X produced Wg unknown_decision_id; no schedule; no Telegram Trigger; no public webhook; no workflow 40/41/42 mutation; no production Data Table; no PM-34.
- Wf47->Wg operationalization plan: PREP PASS — no-runtime plan in docs/workflow-wf47-wg-operationalization-plan.md; handoff boundary Wf47 receipt -> Wg correlation; strict increment order; blockers and rollback documented; workflow 49 remains manual/inactive/off; no runtime; PM-34 BLOCCATO.

## Frontiera attuale / prossimo gate
- Prossimo gate reale: Wf47->Wg operationalization increment 2–3 — no-runtime config checklist review, then manual inactive/off import rehearsal of wf47/wf48/wf49 (user-attested PASS registration). Optional prior increment 1: Wh scenarios note_only/malformed/stale_closed if needed. No schedule. No production Data Table. No PM-34 without explicit separate gate. Wf47, Wg, and Wh manual validations remain PASS. Telegram inbound operational automation remains NOT RUN / NOT ACTIVE.
- Wf hardened path manual validation (staticData template): PARTIAL/BLOCKED (historical) — first poll accepted D-9998-T option 1; second poll re-accepted same update_id on staticData path. Superseded for repeated polling by Wf47 Data Table PASS.
- We Telegram interactive decision buttons live: BLOCKED/PENDING — blocker: Telegram Trigger manual test returned "Bad Request: bad webhook: An HTTPS URL must be provided for webhook"; current n8n access is via local tunnel/http://localhost:5678 and does not provide the public HTTPS webhook URL required by Telegram. No callback received; no sanitized inbound receipt produced; workflow 46 remained inactive/off; no PM-34; no workflow 40/41 mutation; no Data Table production mutation; no GitHub write by workflow. NON marcato PASS. Path (B) polling/getUpdates package is prepared as Wf; path (A) public HTTPS webhook remains a separate architectural option.
- Telegram inbound replies / decision buttons: NOT RUN / NOT ACTIVE (We live blocked on HTTPS webhook requirement; plain-text replies 1/2/3 remain non-operative).
- Wc formatting fix LIVE plain-text rerun: BLOCKED/PENDING (historical) — updated banner (=== TEST ONLY ===) appeared, but Telegram still rendered event_id/human_gate/requires_human without underscores (workflow 43 reimport). Not recorded as live PASS.
- Telegram Decision Packet operational automation: NOT RUN.
- n8n runtime/wiring to classifier wrapper/server (automatic/cablato): NOT RUN.
- Telegram Decision Packet automatico/cablato (operational, non-TEST): NOT RUN.
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
* Data Table CSV seeds: data-tables/ (see docs/foundation/DATA_TABLE_CSV_CONVENTION.md)

## NON ripetere / bloccato
- NON marcare Codex CLI o Cursor CLI "ATTIVO" in PROJECT_VISION 1.1: la catena e' manuale/supervisionata, non automatica.
- NON marcare Ollama classifier fully ATTIVO nel loop: C1a+C1b local runtime PASS; not wired to n8n.
- NON ri-sondare codex --version / --help: noto codex-cli 0.133.0, supporta --ephemeral, --sandbox read-only, --cd, --add-dir, prompt via stdin.
- PM-34 real worker gate: BLOCCATO.
- Path B OpenClaw agent main: BLOCCATO (manca provider API key). Backlog Option B con vendor proof.
- Ollama classifier in automatic loop: NON ATTIVO (C1a+C1b local runtime PASS; not wired).

## Manutenzione di questo file
- Aggiornare come EPILOGO di ogni task che cambia lo stato (stesso meccanismo di LAST_CURSOR_REPORT.md): la riga va aggiunta/spostata nello stesso commit che produce il cambiamento.
