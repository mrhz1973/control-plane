# HANDOFF CLAUDE — control-plane — post arbitraggio dossier + 47→48 bounded PASS + archi paralleli D-0040/0041/0042-E + audit regole handoff

**Path canonico:** `docs/handoffs/2026-07-10-0113-d0041-d0042-gate-e-partial-handoff-claude.md`

---

HANDOFF CLAUDE — control-plane — post arbitraggio dossier + 47→48 bounded PASS +
archi paralleli D-0040/0041/0042-E + audit regole handoff
Contatore turni: 22/20 (soglia §11.2 superata — chiusura obbligata).
Verifica HEAD: shell ls-remote Claude (mai report Cursor, mai web).
Questo handoff è chat-only: NON conforme a §11.3 (path canonico
docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff.md). Da committare via micro-task
docs-only se l'utente conferma la via (a) — vedi PENDENZE.

Nuova chat: leggi docs/foundation/PROJECT_VISION.md DAL REPO (copia progetto
stale v2.0: mai usarla) + docs/runtime/CURRENT_FRONTIER.md + LAST_CURSOR_REPORT.md
a HEAD verificato. Italiano. Ogni risposta termina con NEXT:/WAIT:/DONE:.
Non proporre PM. ls-remote fresco A OGNI TURNO (HEAD si è mosso 3 volte in
questa sessione, sempre intercettato dalla regola).

HEAD verificato shell (fine sessione): a7b3bdba4761f03d1512d0cb225f4524407febb3

PRIMA COSA nella nuova chat: ricostruire gli archi corsi nel canale parallelo
GPT-B/Cursor: 85a91da (D-0040-E gate e preflight NO-GO) → 0411f3e → d4a1d17
(D-0041-E/D-0042-E bounded PARTIAL PASS, user-attested) → a7b3bdb.
Fonte primaria: CURRENT_FRONTIER (d4a1d17 l'ha aggiornato, +24 righe, evidence
verbatim — verificato shell). Sintesi verificata: wf45 open-on-send OK
(D-0041-T, insert, fan_out=1); 47 UFFICIALE non eseguito (aveva ancora lista
hardcoded D-1003-T); derivation da store provata solo su 47 IMPORTATO test-only,
con difetto fan-in (open_decision_ids_count=3 su 1 riga reale → serve dedupe);
wf48 mai chiamato; enable_wg48_handoff=false.
PROSSIMO GATE REALE (da GPT-B, condiviso da Claude): consolidare nel 47
ufficiale derivation da control_plane_decisions_test + dedupe; rerun bounded;
no Active/Publish/Schedule; wf48 fuori salvo nuova decisione.

CICLI CHIUSI IN QUESTA SESSIONE (tutti verificati shell):
- Arbitraggio dossier GPT deep-research: difetto di provenienza PROVATO (dump
  datato 18/05 ma repo creato su GitHub 19/05; "PR #7" impossibile, PR reali
  #1-#4 tutte di luglio; D-0151 mai esistito in 495 commit). Parte mercato
  complementare al dossier Claude. Da valutare: scorecard 4 stati
  (PASS/PASS-con-debito/PARZIALE/FAIL) — "PARTIAL" è già entrato di fatto con
  d4a1d17: CODIFICARE cosa implica per le precondizioni gate; Verification
  Layer con golden tasks.
- Sicurezza n8n: CVE-2025-68668 (Python Code Node sandbox bypass, CVSS 9.9,
  tutte le 1.x; fix vero = 2.0.0). AZIONE APERTA: leggere versione n8n al
  prossimo accesso UI; se <2.0.0 valutare mitigazione o upgrade.
- wf47→wf48 bounded automatic handoff = PASS_ATTESTATO_UTENTE (09/07),
  registrato (823d025/5884acd) + arco chiarimento (06332d4/49c228f):
  autorizzazione flip = decisione utente in chat (packet non emesso); wf48 NON
  modificato; nota fan-out = conflazione col fix wf45 (PR #1); fix template
  wg48 (177f973) già consolidato. Frontier riallineato.
- Review D-0039-E: packet valido §7.7 ma SUPERATO dagli archi 0040-0042;
  destino da registrare (mai consumato). Serie ID non monotona (0041/0042
  consumati, 0039 saltato): prossimi ID dal primo libero ≥ ultimo emesso.
  Precondizione tecnica verificata e ancora utile: il wf45 importato contiene
  nodo "Upsert shared decision open" → derivation testabile.
- Review handoff GPT-B: contenuto fedele al frontier (verificato), giudizio
  PARTIAL onesto; tre fix passati a GPT-B: (1) mai "verificato da Cursor
  report" come fonte — dichiarare provenienza e demandare a shell; (2) lezione
  modello (task con verifiche verbatim → alta affidabilità, es. Opus 4.7
  medium; Composer sconsigliato) da CODIFICARE in CURSOR_PROMPT_TEMPLATE §B —
  finché non scritta resta conoscenza di sessione valida; (3) pendenze
  operative nel FRONTIER, non negli handoff di chat.
- Audit regole handoff: prassi divergita da §11.3 da fine maggio (ultimi
  handoff committati 2026-05-25; da allora solo chat). DECISIONE UTENTE
  PENDENTE: (a) tornare a committare gli handoff al path canonico
  [raccomandata da Claude] o (b) emendare §11.3. Niente divergenza silenziosa.

PENDENZE OPERATIVE (candidate a righe FRONTIER al prossimo tocco docs):
- Backfill PENDING_SELF_REFERENCE di LAST_HANDOFF_VERIFY: ANCORA pendente
  (6 occorrenze, verificato a a7b3bdb) — includere il file nel commit 2 del
  prossimo arco (solo backfill, nessun nuovo snapshot).
- Destino D-0039-E da registrare (superato, mai consumato).
- Codifica stato PARTIAL (una riga).
- Codifica lezione modello Cursor (una riga in TEMPLATE §B).
- Decisione (a)/(b) su §11.3 + eventuale micro-task commit dei due handoff
  correnti (Claude e GPT-B).
- Check versione n8n vs CVE-2025-68668 al prossimo accesso UI.
- GLM: Test 2 (dissenso da method pack) pendente; onboarding GLM su Cursor da
  preparare alla CHIUSURA Gate E (read-set aggiornato + regola "remote PASS
  mai da letture MCP").
- Prompt operativo Gate E nel piano hardcoda HEAD vecchio: ri-pinnare a HEAD
  fresco con guardia ls-remote prima di ogni uso.

REGOLE OPERATIVE (invariate): verifica remota = SOLO shell Claude (git
ls-remote); two-commit convention; aggio control mai nei prompt/report Cursor;
Cursor non dichiara PASS; solo l'utente attesta runtime; un arco alla volta;
triangolo: Claude reviewer/verificatore, GPT-B orchestratore, Cursor
implementatore; prompt Cursor delta-style da CURSOR_PROMPT_TEMPLATE.md, in
italiano.

INVARIANTI: PM-34 BLOCKED · n8n_ready=false · pm34_unblocked=false ·
enable_wg48_handoff=false · wf40/41/42 untouched · no schedule permanenti ·
no webhook pubblici · Gate E full PASS = NO · repo non-confidenziale, rotazione
a fine progetto (ROTATION_CHECKLIST.md); Claude non stampa mai valori di
segreti.
