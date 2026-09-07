# V4 VPS — independent Codex final post-cutover evidence audit

TASK_REF: `V4_VPS_CODEX_FINAL_POST_CUTOVER_EVIDENCE_AUDIT_V1`

TASK_KIND: `CHECKPOINT_DELTA` · MODE: `REPO_ONLY_INDEPENDENT_EVIDENCE_AUDIT` · CATEGORY: `DELICATO`

Reviewer: Codex, independent second-level repository review; not a Cursor execution or a live VPS test.

Audit date: `2026-09-07`. Repository: `mrhz1973/control-plane`, branch `main`.

DISPATCH_BASE_HEAD / audited HEAD: `983e3d69361c97dd4805079ab12a6ece8c7bc0ca`.

Dispatch: [issue #68 comment 5571132047](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5571132047), `2026-09-07T13:10:34Z`.

## Result

```text
CODEX_FINAL_POST_CUTOVER_AUDIT=BLOCKED_EVIDENCE
CUTOVER_EVIDENCE=PASS_WITH_DOCUMENTARY_CAVEATS
FINAL_DB_SYNC_EVIDENCE=PASS_AT_RESTORE_CHECKPOINT
PUBLICATION_MAP_EVIDENCE=PASS_EXACT_4_ID_VERSION_PAIRS
NO_DUAL_WRITER_EVIDENCE=PASS_OBSERVED_INTERVAL
SOAK_EVIDENCE=BLOCKED_EXACT_COHORT_AND_COUNT_RECONCILIATION
DFLIGHT_816_RATIONALE=A_SUPPORTED_FRESH_CANONICAL_REFRESH
GOI_PRIVATE_STACK_EVIDENCE=PASS_WITH_EXPLICIT_TEST_LIMITS
TAILSCALE_OPERATOR_EVIDENCE=PASS_EXTERNAL_NOT_REPRODUCED
REGISTRY_CONSISTENCY=REGISTRY_20_1_PASS_CENSUS_TABLE_32_2_VS_CLAIM_31_3
DOCUMENT_STALENESS=FOUND_MINIMAL_POINTER_CORRECTIONS_AND_RESIDUAL_NOTES
OPENCLAW_DISPOSITION=KEEP_STAGED_PENDING
ROLLBACK_RETENTION=OPEN
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
RUNTIME_MUTATIONS=0
SSH_CALLS=0
SECRET_VALUES_EXPOSED=0
```

Il cutover e lo stato NEW LIVE / OLD n8n frozen sono sostenuti dalle evidenze riportate. Non è provato un fallimento runtime, un dual writer o una perdita dati. Non è invece riproducibile il claim completo del soak: il report dichiara 29 esecuzioni nella finestra, ma gli snapshot pubblicati aumentano di 37 e non delimitano le altre 8; inoltre il conteggio storico è diminuito prima del soak senza evidence della relativa retention/pruning. A01 richiede un raccordo dei dati esistenti, non un rollback o una ripetizione automatica dei test live.

La discrepanza F03 è documentale: la tabella C01–C34 produce 32 migrated / 2 obsolete, mentre il rollup dichiara 31/3. Non viene inventato un terzo componente obsolete e non si declassifica un componente funzionante per far tornare i numeri. Il risultato complessivo è `BLOCKED_EVIDENCE`, non `FAIL`: i diversi intervalli del soak e l'eventuale pruning possono spiegare i numeri, ma la prova manca nel repository consultato.

## Base, metodo e fonti

Phase 0 PASS: `git fetch origin main`, `git ls-remote origin refs/heads/main`, `git rev-parse HEAD origin/main` hanno confermato la base esatta, branch main e tracked tree pulito. Refresh remoto prima del delta documentale ancora uguale. README letto solo nel blocco AI-BOOT; frontier completo e #68 body/commenti letti fino al dispatch incluso. Nessun nuovo outcome oltre il dispatch era presente al checkpoint letto.

Riferimenti `Sxx:linea` alle linee della base audit. Acquisizione progressiva; nessun accesso OLD/NEW, nessuna consultazione di secret o workflow payload live. Gli hash riportati sono fingerprint già canonici, non valori di credenziali.

| ID | Fonte canonica |
|---|---|
| S01 | `README.md`, blocco AI-BOOT; `docs/runtime/CURRENT_FRONTIER.md` |
| S02 | `docs/vps/CURRENT_VPS_STATE.md` |
| S03 | `docs/vps/PROJECT_VPS_REGISTRY.md` |
| S04 | `docs/vps/SHARED_INFRASTRUCTURE_REGISTRY.md` |
| S05 | `docs/vps/DECOMMISSION_CHECKLIST.md` |
| S06 | `docs/vps/MIGRATION_OPERATING_LAW.md` |
| S07 | `reports/architecture/v4_vps_production_cutover_old_to_new_v1.md` |
| S08 | `reports/architecture/v4_vps_post_cutover_gis_client_path_diagnostic_v1.md` |
| S09 | `reports/architecture/v4_vps_post_cutover_soak_v1.md` |
| S10 | `reports/architecture/v4_vps_parallel_old_new_validation_f03_f04_f05_v1.md` |
| S11 | `reports/architecture/v4_vps_goi_cold_start_boot_persistence_v1.md` |
| S12 | `reports/architecture/v4_vps_active_nginx_tls_renewal_qualification_v1.md` |
| S13 | `reports/architecture/vps_openclaw_handoff_2026-09-07.md` |
| S14 | `reports/architecture/v4_vps_goi_gis_private_functional_qualification_v1.md` — endpoint/client acceptance |
| S15 | `reports/architecture/v4_vps_goi_nav_private_functional_qualification_v1.md` — limite del Nav smoke |
| S16 | `reports/architecture/v4_vps_goi_dflight_private_functional_qualification_retry1_v1.md` — dataset/status e checkpoint 841 |
| S17 | `reports/architecture/v4_replacement_8gb_full_service_parity_census_v1.md`, parti della matrice pertinenti — contraddizione F03 |
| S18 | `docs/runtime/LAST_CURSOR_REPORT.md`, checkpoint pertinenti — confronto del soak e aggiornamento pointer |
| S19 | issue #68 body e commenti fino a 5571132047; autorità/operatore e conferme dei pass |

La ricerca di riconciliazioni è rimasta circoscritta ai report VPS pertinenti, alle fonti sopra, ai nomi artifact post-cutover/soak tracked e ai parametri di retention in `configs`. Nessun artifact con coorte/ID/timestamp del soak è stato individuato; i commit cutover/soak aggiungono report e proiezioni documentali, non un ledger di esecuzioni. Nessun valore effettivo di pruning della NEW LIVE è provato dalle fonti cercate. L'assenza in questo perimetro non è una prova che pruning non esista.

## Cutover lineage, database e publication map

L'ancestry Git verificata è lineare, senza salto di base:

```text
032fc1f954da0bb87a07fea1390d1289e19b14b3
  -> 3d34b67bd5f7dd8b07ec9bba89931356754d44ca  parallel validation PASS
  -> 6f6a5d64ae331517ffd8ddae4d31713f55d61f42  production cutover PASS
  -> 884a4bc40e64c8a6dab25d7c8462277cfcb1fb98  GIS client-path diagnostic
  -> 983e3d69361c97dd4805079ab12a6ece8c7bc0ca  post-cutover soak
```

[Autorizzazione 5569237374](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5569237374) è ancorata a `3d34b67...`, antecedente al freeze, e autorizza esplicitamente stop writer OLD, snapshot/sync PostgreSQL, isolamento NEW, pubblicazione successiva e retention. Esclude decommission e attivazione OpenClaw. S07:7,38 coincide con questo anchor. La lineage e l'autorizzazione sono sostenute, non dedotte dal solo subject `cursor-pass`.

| Claim | Challenge e riscontro |
|---|---|
| OLD_WRITE_FREEZE | S07:80-93: stop solo `root-n8n-1` alle 10:35:06Z, n8n exited, :5678 assente, PostgreSQL/GOI/TLS/LiteLLM rimasti up; count quiescente `10176→10176`, max `312840`, map 4 conservata |
| Source/target e metodo | S07:97-106: entrambi PostgreSQL 16.15, dump nativo custom, TOC 1001, SHA-256 sorgente/target `84e40b565ff4abf01d271c779974b56ec7ad6ee2d9dcfeab65ce8e36c586d078`; S07:123-127 `pg_restore --clean --if-exists --no-owner --no-privileges` su NEW. Non è l'export entità SQLite storico |
| Backup NEW | S07:110-119: backup precedente al restore, hash `83f573f305616d7e37fbde31bd5dfd99159433c4c8fe4ca5ee7987fdc2ed3ec8`, TOC 1001; NEW n8n fermato prima del restore |
| FINAL_DB_SYNC / equivalence | S07:129-135: target ripristinato `50 workflows / 3 credentials / 10176 executions / max 312840`; coincidono col frozen source. Digest normalizzati workflow/config, payload credenziali e settings dichiarati uguali. Il dump trasferito uguale prova integrità del trasferimento; counts e digest completano la verifica di restore nel perimetro riportato, senza inventare un confronto byte-per-byte di ogni tabella |
| NEW post-restore isolation | S07:129-135: iniziali 4 publication dopo restore, CLI offline n8n 2.33.3 `unpublish:workflow --all`, poi published/active_col 0 e count/max invariati; primo start isolato via `n8n-compose.service` prima della publication finale |
| Serial safety | S07:139-150: 25 serial-backed columns, BEHIND_MAX pre/post 0; execution max=last_value=312840, is_called=true, next=312841. Nessun setval necessario; non confondere controllo sequence con obbligo di mutarla |
| Publication | S07:156-164: n8n fermo durante publish offline dei soli quattro ID/versionId frozen, WF61/D-0025 esclusi, nessuna esecuzione prima del restart. Le coppie riportate coincidono esattamente con quelle del soak (confronto locale, 4 vs 4, differenze 0) |
| Prima produzione NEW | S07:194-197: ID 312841/312843 WF42 e 312842/312844 WF40, tutti success alle 10:47/10:48. `10180−10176=4` e `312844−312840=4` concordano con le quattro righe; tutti gli ID superano il frozen max |
| No dual writer | S07:80-93,212 e S09:108-119: OLD n8n fermo e :5678 assente, OLD DB count/max ancora `10176/312840` durante i poll; NEW produce esecuzioni successive. Prova della finestra osservata, non garanzia indefinita contro futuri start OLD |
| Nessun routing action | S07:74-76,168-175: audit active workflow/config senza i tre OLD literal, trigger schedule/manual/internal, assenza di WEBHOOK_URL/N8N_HOST/N8N_EDITOR_BASE_URL dipendenti da OLD; command/file nodes su bind noti, Data Table/state nel DB. Sostiene NONE_REQUIRED per il cutover del writer n8n |

Mappa esatta congelata e ritrovata nel soak:

| Workflow ID | activeVersionId |
|---|---|
| `90ldaa5a-4000-8000-000000000090` | `febca537-9218-4fb4-8280-847b5e961f6b` |
| `9ZMj2ACTKyDVhCue` | `a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| `HVCzN3FoBdLGe9Hx` | `93d606ae-4883-4e6e-91e5-41ff00cbf741` |
| `Rx0Qp7pLj9GnyGh7` | `3e9d714f-3bdc-44f1-b3c5-b85385ddd811` |

Il report espone le coppie e il metodo offline: l'audit non si limita al count=4. Non sono però allegati export delle versioni attive o il comando/query del search OLD; l'assenza di dipendenze OLD resta l'ispezione riferita da S07:74-76, corroborata dai nuovi tick. Non viene estesa a tutti i workflow inattivi, template, URL indiretti o provider esterni. Il grant Tailscale successivo dell'operatore ha rimediato l'accesso client GOI: non contraddice NONE_REQUIRED per il routing del writer n8n, ma vieta di interpretare quel flag come assenza di qualsiasi successiva modifica ACL (A04).

## Soak: intervallo, natural drain e limite della prova

La finestra S09 è `12:48:37Z–13:01:35Z`: 778 secondi = 12m58s. Il natural drain finisce alle `13:02:57Z`, 82 secondi dopo il confine. WF90 è descritto come concluso con successo dopo circa 136 secondi; final nonterminal=0/recent non-success=0. È corretto non dichiarare stuck un'esecuzione ancora in corso al confine e non interromperla.

La prova non include l'ID di quel WF90, le righe della coorte, i timestamp esatti dei due snapshot count/max o il filtro SQL della finestra. Di conseguenza non si può ricostruire indipendentemente se lo stesso WF90 osservato running sia quello drenato, né riattribuire tutte le esecuzioni ai tre gruppi. La narrativa è plausibile, ma l'aritmetica richiede il raccordo A01.

| Grandezza | Valore riportato / controllo locale |
|---|---|
| Coorte dichiarata | 13 WF40 + 13 WF42 + 3 WF90 = 29 |
| NEW baseline count / max | 10136 / 313108 |
| NEW final after drain count / max | 10173 / 313145 |
| Delta count / max | +37 / +37 |
| Esecuzioni non raccordate alla coorte | 37 − 29 = 8; non si assume siano errori o duplicate |
| Frozen OLD count / max per tutta la finestra | 10176 / 312840 |
| NEW baseline count rispetto al restore | 10136 − 10176 = −40, mentre max cresce; può esserci pruning, non provato qui |
| Sequence finale | max=last_value=313145, is_called=true, next=313146: coerente e non behind-max |
| Map | quattro coppie esatte uguali a S07, dichiarate stabili a ogni poll di 30s |

La continuità OLD frozen e i segnali di salute NEW sono sostenuti anche senza chiudere il conteggio preciso del soak. Nessuna reinterpretazione dei 12m58s come stabilità produttiva di lungo periodo; neppure un eventuale PASS di questo intervallo chiuderebbe la rollback retention.

## D-Flight 816 vs 841

**Scelta A, nel perimetro applicativo documentato.** S16:41,63-66, S10:79 e S07:206 provano il precedente snapshot 841. S09:169-179 non presenta soltanto health=200: riporta un evento `refresh_ok result=READY_CHANGED`, fetched_at `2026-09-07T12:16:17Z`, feature_count=816, byte_count=7349449, canonical_sha256 `60de7f69f4f4433d0448998e02bed093cea4142d72843962529f036fc225c4d5` e last_error_category=null. L'OLD confrontato ha snapshot del 20 agosto, hash differente `0db8ee57…`.

Timestamp nuovo, evento di cambio accettato, hash/size/count concordi e stato READY/dataset_available sostengono un refresh canonico fresco invece di una replica immutata troncata senza spiegazione. Il decremento di 25 feature non viene approvato per il solo HTTP 200. Questo audit non certifica completezza geografica upstream né identifica le 25 feature rimosse: dataset/diff non sono allegati e non sono necessari per sostenere la sola spiegazione del cambio di snapshot. Il valore 841 rimasto nella colonna NEW della registry è invece stale rispetto al soak (A03).

## GOI, TLS e private topology

| Componente / claim | Prova e limite |
|---|---|
| GraphHopper | S11:53-89: enable 7 unit, cold-stop con listener assenti, cold-start ordinato, PID nuovo e NRestarts=0, app TS:8989/admin loopback:8990, POST hiking 200 con distanza 3230.315 e 122 punti. S09 conferma health/route. Non solo healthcheck |
| Persistence | S11 distingue `PASS_ENABLED_AND_COLD_START` da `HOST_REBOOT_EXECUTED=NO`; boot graph/symlink e restart controllato sostengono la specifica acceptance. S10:33-37 prova restart core postgres+n8n con stessi ID/image e StartedAt cambiati. Nessuna prova di reboot integrale o futura gara d'avvio viene inventata |
| ORS/nginx | S11:79,86 e S12:62-67: ORS loopback:8020, nginx TS:443, HTTPS /ors/status hostname-verified senza -k, ready/PRESENT, Server nginx, ACAO NEW origin. È prova reale della chain inclusa/servita. Non è un test completo di ogni directions API |
| GIS artifact | S14:50-65,88-96: hash file=HTTP `60a51d9620d2f71787357f6460da20ca5aee48c37550400f23061275f366a0f4`, costanti NEW GH/ORS/D-Flight, OLD literals 0, GraphHopper credentials omit compatibile con ACAO *. S09:163 conferma OLD hits0/NEW hits6. Le prove Origin HTTP lato server non sono da sole browser/workstation tests |
| D-Flight | Stato corrente 816/READY/evento/metadata sopra; status/LKG e CORS hanno provenance S16. Nessun refresh richiesto o eseguito da Codex |
| Nav | S15:58-62,79-86: /status 200 tokens_ok=true,last_error=null; root404 non scambiato per guasto, proxy/tile smoke concreto non disponibile canonicamente. Questo è application health, non qualificazione di ogni tile o un TCP :5000 workstation riprodotto |
| nginx/exposure | S11:79: exact TS:443 e nessun wildcard/public/IPv6 wildcard GOI; ORS/admin loopback; public negatives documentati. S09:166 no public :80. Il default pubblico OLD è F04 NON_REQUIRED_OBSOLETE_DEFAULT (S10:144-151), non da replicare |
| TLS SAN/renewal | S12:37-71: domain NEW esplicito, cert/key match e 0644/0600, OLD SAN assente, unit active-nginx exit0, journal install/test/reload e worker PID rotation con master invariato. Served leaf=installed leaf, HTTPS hostname-valid. Cert invariato dichiarato: esercizio della chain con certificato ancora valido, non nuova rotazione dimostrata |
| Timer | S12:33,71: weekly, Persistent=true, random1h, enabled/waiting e symlink, next14 settembre. Sostiene configurazione persistente e unit manualmente eseguita; non sostiene un trigger settimanale già osservato o un reboot del timer |
| Hermes/LiteLLM | S11:31,93; S12:79; S09:181: browser unit attive/private, listener qualificati loopback, LiteLLM running senza host publication. Non sono nuovi login/auth/provider-inference test |
| Tailscale | Identità NEW unica `31.70.139.73` / `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net`. S08:99-107, S11:31, S12:79 e S09:181 concordano su no advertised routes/Serve/Funnel/exit-node. L'assenza Funnel esplicita proviene dai checkpoint precedenti e dal no-mutation soak; non da una riproduzione Codex |

## Evidenza operatore e secondo device

S08 isola un listener GIS sano e local HTTP200, reverse Tailscale ping e nessuna regola host DROP pertinente; la conclusione ACL/policy era **remaining likely layer**, non una lettura indipendente dell'ACL. Il successivo [checkpoint operatore 5570555635](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5570555635) aggiunge il grant effettivo `autogroup:member → 100.99.54.93/32`, tcp 8000/443/5000/8010/8989 e test workstation asusdesktop riusciti dopo propagazione.

Sono accettati come evidence esterna: `GIS_NEW_REAL_CLIENT_TEST=PASS`, `TAILSCALE_GOI_NEW_MEMBER_GRANT=PASS`, `TAILSCALE_POLICY_ROOT_CAUSE_REMEDIATED=YES`. Codex non li ha riprodotti. TCP workstation provato per 8000/443/8010/8989; :5000 è granted senza output TCP separato. `SECOND_DEVICE_TEST=DEFERRED_NON_BLOCKING` resta tale: autogroup:member sostiene la parità di autorizzazione, non un test fisico riuscito da un altro device.

## Findings

### A01 — MATERIAL EVIDENCE GAP: coorte e count del soak non riconciliati

**Evidence:** S09:68-98 e 103-130, calcoli sopra. 29 nella finestra vs +37 baseline→after-drain; nessuna tabella ID/workflow/start/end/status, filtro temporale o snapshot timestamp. Count NEW pre-soak inferiore di 40 al restore e di 44 al post-cutover `10180`, senza parametro/evento pruning efficace riportato. S18 e commento 5571086607 ripetono gli aggregati, senza colmare il gap.

**Impact:** non si prova che 29 sia falso: baseline e after-drain possono includere esecuzioni esterne alla finestra, mentre pruning può spiegare il calo precedente. Non si prova perdita dati, run duplicata, stuck o dual writer. Manca il materiale necessario a sostenere indipendentemente l'esatto soak PASS richiesto dal dispatch.

**Required next:** persistere la coorte originale non-secret con ID, workflowId, startedAt/stoppedAt/status; timestamp e filtri degli snapshot; ID e risultato del WF90 al confine; attribuzione delle 8 righe extra a pre-window/drain/altro; evidence dell'effettiva retention/pruning per il calo storico, oppure correggere gli aggregati se trascritti male. Preferire output già acquisiti dall'executor. Non rifare o mutare il runtime in questo task.

### A02 — DOCUMENTARY ERROR: F03 31/3 non deriva dalle 34 righe

**Evidence:** S10:92-125 ha 32 righe MIGRATED_VALIDATED e solo C31/C32 obsolete; S10:129-135 dichiara 31/3. S17:80-82 aveva tre obsolete candidati, compreso OpenClaw; C30 è ora migrated nel ruolo staged. S03:7-27 produce invece correttamente 20 migrated + 1 obsolete su 21.

**Impact:** `F03_ACCOUNTING_RECONCILIATION=PASS` e il rollup31/3 sono smentiti dalla propria matrice documentale. Non è una failed acceptance runtime: nessuna required row missing/unvalidated viene dimostrata. Il distinto denominatore21 è coerente. Non contare il default80 come terza riga obsolete aggiuntiva senza una decisione esplicita sulla granularità di C11.

**Required next:** correzione docs-only del rollup alla matrice32/2 oppure evidence di una diversa disposition di riga. Nessuna modifica alle classification di componente da parte di questo audit. I conteggi pubblicati31/3 restano citati come claim contestato, non adottati come risultato indipendente.

### A03 — DOCUMENT STALENESS: snapshot e prose non tutti aggiornati

**Evidence:** S02:3 recita ancora Updated after parallel validation; :52 PARTIALLY_RENDERED_VALIDATED, :132 remaining GOI activation ready e :160 gate pre-cutover convivono con i successivi flag LIVE/cutover/soak. S03:15 conserva NEW841, :18 keep unpublished è ambiguo accanto a n8n LIVE, :117 NEXT ripete un cutover da eseguire. S01 etichettava la riga independent audit con il solo pass Cursor soak.

**Impact:** staleness documentale, non prova di rollback, OLD endpoint attivo o D-Flight failure. S02:174/S03:92/S04:87 `ENTERED` è compatibile con retention ancora OPEN, ma meno aggiornato del latest soak. S05 checkbox ancora vuote non negano i PASS riportati e non autorizzano decommission.

**Action:** aggiornati solo pointer correnti autorizzati, header CURRENT_VPS_STATE e annotazione esplicita del perimetro storico; retention proiettata OPEN. Registry, checklist e report storici preservati; le loro righe stale sono localizzate qui per successiva manutenzione bounded, senza refactor generale.

### A04 — DOCUMENTARY SCOPE: OLD_CHANGED e routing action

**Evidence:** S07:30 e commento 5569502005 dicono OLD_CHANGED=NO, ma S07:80 descrive esplicitamente l'arresto autorizzato di OLD n8n. Il successivo checkpoint 5570555635 documenta una modifica ACL manuale, pur essendo CUTOVER_ROUTING_ACTION=NONE_REQUIRED.

**Impact:** `OLD_CHANGED=NO` non può significare zero mutazioni OLD durante il cutover; va letto come nessun ulteriore cambiamento oltre writer-freeze. NONE_REQUIRED riguarda routing del cutover n8n, non la remediation di accesso client successiva. Sequenza e autorizzazione restano valide: nessuna mutazione nascosta o vietata viene provata.

**Action:** scopes chiariti in questo report e nella nota CURRENT_VPS_STATE. Non alterati i report storici né la legittima authorization del freeze.

### A05 — DOCUMENTARY TRANSCRIPTION: hash publication nel commento

**Evidence:** S07:61 riporta SHA-256 `ff836586d71772efa8b74b8ca3545b8fcf6798f5cf634be0febd5c11c8bdd1a2` (64 caratteri). Commento5569502005 riporta `ff8365d71772efa8b74b8ca3545b8fcf6798f5cf634be0febd5c11c8bdd1a2` (62 caratteri), quindi non un SHA-256 completo. Il pre-freeze artifact S07:52 ha hash diverso dal frozen artifact: serialization/schema non pubblicati, non si assume che i due file siano identici.

**Impact:** il fingerprint del commento non va usato per verifica. Le quattro coppie frozen sono esplicite e coincidono nel soak; l'errore di trascrizione non prova map drift. Hash della mappa non ricalcolabile senza byte/serialization dell'artifact, mentre il confronto delle coppie è riproducibile.

**Action:** il pointer #68 di questo audit richiama il report canonico e segnala la correzione di riferimento; nessuna modifica al vecchio commento.

## OpenClaw, rollback e decommission

S13 mantiene il runtime staged/inactive con `KEEP_STAGED_PENDING`; C30 e S03:23 qualificano **quel ruolo**, non un'app avviata. S11:93 riporta zero unit OpenClaw; S07/S09 escludono attivazione. Il vecchio handoff PRESENT_NOT_VALIDATED è storico rispetto all'acceptance del ruolo staged. Non è un migration blocker; la decisione activate-or-archive richiesta da S05:61 resta distinta prima del decommission. OpenClaw42 chat/orchestratore non è il listener/app VPS.

NEW_ROLE=LIVE e OLD_ROLE=ROLLBACK_STANDBY_FROZEN restano sostenuti: frozen si riferisce al writer n8n/DB, non a ogni processo o dato GOI immutabile. OLD PostgreSQL, GOI, LiteLLM e HTTPS restano disponibili; OLD n8n non deve essere riavviato da questo audit. Rollback retention OPEN, auto-expiry NONE deriva dall'autorizzazione umana, non da una durata inventata.

OLD TLS renewal è davvero degraded `203/EXEC`, helper assente, mentre HTTPS hostname-verified è sano e il certificato scade `2026-11-15T23:56:47Z` (S10:155-166). Questa è una condizione reale della retention: OPEN senza auto-expiry non garantisce TLS valido oltre quell'envelope e non autorizza repair, expiry automatica o decommission. Il gate umano deve risolvere l'uscita e la validità necessaria prima di oltrepassare quel limite.

La checklist conserva intenzionalmente caselle non completate. Nessuna casella è stata spuntata per inferenza. Restano separati: completamento/uscita della rollback retention, disposition OpenClaw e artifact/backup finali applicabili, esplicita autorizzazione decommission e sua azione successiva delimitata. Questo audit non chiude #68 e non rende OLD eligible o authorized.

## NEXT e persistenza

```text
NEXT=RECONCILE_EXISTING_SOAK_COHORT_SNAPSHOTS_AND_RETENTION_EVIDENCE_THEN_REVIEW_A01
DOCUMENTARY_NEXT=RECONCILE_F03_TABLE_32_2_WITH_PUBLISHED_ROLLUP_31_3
CUTOVER=PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
ROLLBACK_RETENTION=OPEN
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
```

Questo task persiste il report e il minimo pointer in LAST_CURSOR_REPORT (etichettato Codex indipendente), CURRENT_FRONTIER e CURRENT_VPS_STATE, più pointer #68. Non implementa il NEXT, non effettua monitoring live, non attiva automazioni. Le classification runtime componenti e i report storici restano invariati; il PASS Cursor del soak è conservato come outcome precedente con audit indipendente non chiuso.

Verifiche repository: base/ancestry, confronto esatto delle 4 coppie, riconteggio matrici e aritmetica/tempi eseguiti senza runtime. Closure: `git diff --check`, stage selettivo dei 4 file autorizzati, commit `codex-audit: V4_VPS_CODEX_FINAL_POST_CUTOVER_EVIDENCE_AUDIT_V1`, push main e verifica remote HEAD; esito della persistenza nella risposta finale e nel pointer #68.
