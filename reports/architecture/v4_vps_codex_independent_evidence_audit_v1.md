# V4 VPS — Codex independent evidence audit

TASK_REF: `V4_VPS_CODEX_INDEPENDENT_EVIDENCE_AUDIT_V1`

TASK_KIND: `CHECKPOINT_DELTA` · CATEGORY: `DELICATO` · MODE: `REPO_ONLY_READ_AUDIT`

Repository: `mrhz1973/control-plane` · branch: `main` · date: `2026-09-07`

EXPECTED_BASE_HEAD / audited base: `722d42dfb998ea9a6bfc63cee63cba1b586e13e2`

Base verification: local HEAD and terminal `git ls-remote origin refs/heads/main` matched, including the refresh before documentation changes.

Issue: [#68 — full service parity migration before OLD decommission](https://github.com/mrhz1973/control-plane/issues/68), OPEN; body and all comments read through `updatedAt=2026-09-07T02:35:12Z`.

```text
CODEX_VPS_EVIDENCE_AUDIT=BLOCKED_EVIDENCE
RUNTIME_MUTATIONS=0
SSH_CALLS=0
SECRET_VALUES_EXPOSED=0
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
```

Si applica il fallback richiesto dal task: le evidenze repository non permettono di completare la prova obbligatoria dell'inclusione nginx e della transizione degli endpoint GIS. Non è dimostrato un guasto runtime o un `ACTIVE_NEW_BUG`. È sospeso il via libera generico alle remaining GOI slices finché questi due punti non sono risolti. Una qualificazione ORS esclusivamente loopback è tecnicamente indipendente dai due gap, ma non chiude questo audit e non costituisce autorizzazione nginx/GIS.

I PASS GraphHopper funzionale e TLS identity/issuance restano sostenuti nei rispettivi perimetri. Nessuna classificazione componente viene promossa o retrocessa. La copertura dei consumer documentati è sostenuta; completezza dell'acceptance e conteggi aggregati non ne discendono automaticamente.

## Fonti canoniche controllate

Tutti i riferimenti `Sxx:linea` indicano le linee alla base sopra, prima del delta di questo audit. Acquisizione iniziale limitata al CORE BOOT e alle fonti richieste; ampliamenti soltanto per contraddizioni, ownership o acceptance dei componenti.

| ID | Fonte | Motivo |
|---|---|---|
| S01 | `README.md`, solo blocco AI-BOOT | CORE BOOT, autorità remota e precedenza |
| S02 | `docs/runtime/CURRENT_FRONTIER.md`, completo | LIVE STATE e ACTIVE WORK #68 |
| S03 | `docs/vps/CURRENT_VPS_STATE.md` | claim correnti |
| S04 | `docs/vps/PROJECT_VPS_REGISTRY.md` | copertura e classificazioni |
| S05 | `docs/vps/SHARED_INFRASTRUCTURE_REGISTRY.md` | ownership, dipendenze e gate |
| S06 | `reports/architecture/v4_vps_cross_project_consumer_mini_audit_v1.md` | censimento corrente e anomalie OLD |
| S07 | `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md` | qualification GraphHopper |
| S08 | `reports/architecture/v4_vps_new_tls_recovery_v1.md` | qualification TLS |
| S09 | `reports/architecture/vps_goi_post_render_preactivation_verify_2026-09-07.md` | contraddizione nginx e scope del render |
| S10 | `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md` | pointer registry/#68: copy, bind, boot, conteggi e staging nginx |
| S11 | `reports/architecture/vps_goi_project_handoff_2026-09-07.md` | acceptance GOI, GIS endpoints e rollback |
| S12 | `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md` | path nginx e OLD references prima del render |
| S13 | `reports/architecture/vps_goi_old_final_nonsecret_inspect_2026-09-07.md` | renewal helper e render/preflight OLD |
| S14 | `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md` | D-Flight credenziali/CSRF e fonti GraphHopper |
| S15 | `reports/architecture/vps_prejoin_cross_project_reconciliation_2026-09-07.md` | denominatore e acceptance cross-project |
| S16 | `reports/architecture/vps_schema_engine_handoff_2026-09-07.md` | resolver n8n/control-plane |
| S17 | `reports/architecture/vps_dev_method_handoff_2026-09-07.md` | natura reference-only |
| S18 | `reports/architecture/vps_openclaw_handoff_2026-09-07.md` | staged fallback e decisione separata |
| S19 | `docs/vps/DECOMMISSION_CHECKLIST.md` | acceptance puntata dal gate decommission |
| S20 | issue #68, body e commenti fino al checkpoint sopra | acceptance e successione dei PASS |
| S21 | `reports/architecture/v4_replacement_8gb_vps_isolated_core_replica_v1.md`, sezioni pertinenti | verifica mirata acceptance core, encryption continuity e limite boot |

La verifica è indipendente nell'analisi, non una nuova osservazione dei VPS. I report di Cursor e dell'operatore sono l'evidence disponibile; non sono stati ricreati i test live. Gli accessi Git/issue iniziali nel sandbox hanno fallito per credenziali; i successivi accessi terminale autorizzati sono riusciti. Nessun fallback GitHub ha sostituito la verifica terminale della HEAD.

## Registry coverage e dipendenze

`VPS_CONSUMER_REGISTRY_COVERAGE=PASS` è sostenuto per l'attribuzione dei consumer del mini-audit. Le registry sono proiezioni aggregate: non richiedono una riga duplicata in entrambi i file per ogni sottodipendenza, ma devono preservare ownership e legami. Non è emerso un workload necessario privo di attribuzione.

| Consumer / dependency | Riscontro nelle registry e nell'evidence | Acceptance effettiva |
|---|---|---|
| PostgreSQL | S04:7; Docker S05:32; S06:24 identifica il volume live `root_n8n_postgres_data_seqresync_retry_prod` | Replica sana; non confondere volume live e leftovers |
| n8n ↔ PostgreSQL | S04:7-8; S10:57,104-110; S21:74-90; #68 replica PostgreSQL/n8n ed env continuity | Health 200, capable/published `0/0`, encryption-key continuity e credential decrypt `3/3` sostengono replica isolata, non produzione NEW |
| n8n ↔ `/root/local-files` | S04:20, S05:27; S06:45 | Bind `/files` e root applicativa presenti; i componenti figli hanno acceptance separata |
| n8n ↔ `/srv/cp-verifier-inbox` | S04:19, S05:27; S10:56 | Stesso bind, owner `cpinbox`, inbox vuota; nessun daemon aggiuntivo |
| n8n ↔ control-plane checkout bind | S04:18; S06:45; S10:55 | Bind read-only presente, checkout verificato al commit prep-copy `adb3261`; non si assume aggiornato alla HEAD di questo audit |
| LiteLLM ↔ control-plane/config e auth | S04:9,18,20; S06:26,45; S10:58-59 | Runtime unpublished già provato; differenza nome env OLD/NEW registrata, non equivalenza letterale dei path |
| `n8n-compose.service` ↔ Docker/boot | S04:24, S05:32; S10:54; S21:118 | Installed/enabled/active, `ExecStop=stop`; abilitazione non equivale a prova di reboot dell'intero stack; core replica report dichiara reboot non eseguito |
| Hermes ↔ browser privato | S04:10, S05:31; S06:28,56 | OLD processi senza unit Hermes; NEW systemd. Auth/restart/recall qualificati, CDP/VNC/noVNC loopback |
| Tailscale / readiness | S04:26, S05:10-13,16-17; S07:30-35 | Identità unica provata; readiness e GraphHopper active/disabled; persistence e reachability dei componenti residui pending |
| nginx ↔ ORS/TLS/Tailscale | S04:17, S05:14-16,20,22-24 | Vhost staged/rendered, drop-in readiness caricato, upstream `127.0.0.1:8020`; include effettivo non provato (F01) |
| TLS identity ↔ renewal/nginx lifecycle | S04:16, S05:22-23; S08:32-54 | Cert NEW qualificato; helper inactive-nginx provato; rinnovo con nginx attivo e timer/boot ancora pending |
| GraphHopper | S04:11, S05:17; S07 | Funzionale PASS, `PRESENT_NOT_VALIDATED` corretto per boot persistence pending |
| ORS gateway ↔ credenziale | S04:12, S05:20; S09:8,15 | `LoadCredential` verso `/etc/systemd/ors-credentials/ORS_API_KEY` verificato; runtime loopback ancora pending |
| GIS/cursor-coordinate-converter ↔ GraphHopper/ORS | S04:13, S05:18; S11:54,95; S12:64-74 | Bind dinamico NEW non prova destinazione dei client GraphHopper/ORS (F02) |
| Nav/Planet-Clone ↔ local-files | S04:14,20; S05:19; S09:9; S13:5-11 | Working directory esplicita, bind dinamico, override parity caricato; funzionale pending |
| D-Flight ↔ credenziali/CSRF/LKG/state | S04:15, S05:21; S14:18-41; S09:10-12 | Credential parity riportata senza valori; successivo CSRF ownership `root:goi-dflight`/640 e LKG `goi-dflight:goi-dflight`; bind/origin NEW; runtime pending |
| schema-engine ↔ n8n/control-plane | S04:22, S05:28; S16:7-15,33,55-71 | `CONTROL_PLANE_AJV_NODE_MODULES=/files/handoff-runtime/schema-engine/node_modules`; Ajv 8.20.0/ajv-formats 3.0.1. Nessun listener; resolver/validator smoke NEW pending |
| dev-method | S04:21, S05:29; S17:7-9,48-64 | Reference tree copiata, nessun runtime da attivare; `MIGRATED_VALIDATED` coerente col ruolo |
| OpenClaw app/node | S04:23, S05:30; S18:7,53-75 | Copiato/staged, nessuna unit/listener; `KEEP_STAGED_PENDING`, fallback soltanto |
| Historical OLD Docker volumes / quarantine | S04:27; S06:42-43,60 | Extra non copiati, non volume PG live; decisione finale pending |
| Linux users / common Docker | S04:25, S05:32; S10:33, S12:33-36 | Owner centralizzato; account nologin presenti, UID per nome rimappati; nessuna nuova collisione documentata |

I legami n8n→PostgreSQL e GIS→GraphHopper/ORS sono espliciti nell'evidence anche quando abbreviati nelle colonne registry. Il primo ha replica qualificata; il secondo conserva un gap di acceptance. Non si scambia la presenza di tree/env/unit con la validazione funzionale o di boot.

## GraphHopper e TLS: challenge dei PASS

GraphHopper: S07:30-44 documenta start canonico con preflight/render eseguiti e socket app `[::ffff:100.99.54.93]:8989`, admin `[::ffff:127.0.0.1]:8990`. S07:48-61 documenta public-IP refused, nessun bind `0.0.0.0`, POST `/route` con request canonica e SHA-256, HTTP 200, distanza `3230.315`, `points_len=122`. Non è solo un healthcheck. S07:26 rende esplicita la correzione della directory log dopo `226/NAMESPACE`; S07:37 riporta `NRestarts=0`, `Result=success` dopo il successful start. S07:66-72 e le registry conservano boot pending e nessuna promozione a `MIGRATED_VALIDATED`.

TLS: S08:43-54 riporta helper exit 0 con nginx inattivo, SAN esatto `DNS:ionos-n8n-new.tailc01234.ts.net`, OLD SAN assente, cert/key public-key match PASS, fullchain `root:root 0644`, private key `root:root 0600`, validità 2026-09-07 → 2026-12-06. nginx, GOI e timer restano inattivi durante quel proof. Lo start GraphHopper successivo non contraddice lo snapshot TLS precedente. S08:32-39 descrive fail-closed per issuance/install/test/reload richiesto e skip del reload quando nginx è inattivo. Questa è evidence del pass; il sorgente integrale del helper e prove negative di ogni ramo non sono allegati. Non viene inferita una prova live del ramo active-nginx, correttamente ancora pending (S04:16/S05:23).

`nginx -t PASS` è un risultato riportato; non prova automaticamente che il vhost GOI o il suo certificato fossero nel grafo di configurazione testato. La verifica autonoma di SAN/key/mode resta valida anche se nginx non include ancora quel site (F01).

## Search identità OLD/NEW

Search alla base audit, prima di aggiungere questo report: 1.413 file tracked, 175 occorrenze delle sei stringhe in 29 file. Sono state cercate soltanto stringhe letterali, con output limitato al match e alla posizione; nessuna scansione di Git history, cache/binary o file untracked. I file storici con hit sono stati catalogati senza caricamento storico generalizzato. Il primo tentativo sequenziale incompleto è stato sostituito dalla scansione a batch completa, senza batch falliti.

```powershell
$auditScope = @(git ls-files | Where-Object {
  $_ -notmatch '(^|/)(\.git|node_modules|\.venv|venv|__pycache__|\.cache|cache|caches|dist|build|coverage|history)(/|$)'
})
for ($auditOffset=0; $auditOffset -lt $auditScope.Count; $auditOffset+=60) {
  $auditLast=[Math]::Min($auditOffset+59,$auditScope.Count-1)
  $auditBatch=@($auditScope[$auditOffset..$auditLast])
  rg --no-heading --with-filename --line-number --only-matching `
    --fixed-strings --no-messages --max-columns 250 `
    -e '217.160.71.145' -e '100.114.7.53' `
    -e 'ubuntu.tailc01234.ts.net' -e '31.70.139.73' `
    -e '100.99.54.93' -e 'ionos-n8n-new.tailc01234.ts.net' `
    -- $auditBatch
}
```

Binary detection predefinita di `rg`, nessun `--text`. Il limite è la lista dei file tracked e sei identità; non è un inventario dei VPS. Non sono coperti valori costruiti indirettamente, environment remoto, policy ACL esterna o repository GIS/Nav installati sul VPS ma non versionati qui.

| Classification del riferimento OLD rilevante | Evidence e conclusione |
|---|---|
| EXPECTED_OLD_ONLY | S03:8,10,12; S04:26; S05:9-10,15: OLD ancora LIVE. Conservare quelle identità. S06 e altri checkpoint distinguono esplicitamente OLD/NEW; i riferimenti OLD negativi in TLS indicano assenza del vecchio SAN, non uso attivo. |
| HISTORICAL | S12:50-61 e S14:60-64: D-Flight/readiness/nginx/GraphHopper NEW prima del render contenevano OLD. S09:10,13-15,18 e S07:33-36 attestano la successiva correzione; il vecchio cert S09:17 è superato da S08:44-45. Gli snapshot precedenti non sono bug correnti. |
| STAGING_ONLY | `workflows/60-openclaw-broker-fallback-resolver.template.json:30` contiene due URL OLD, `primaryBaseUrl` e `primaryHealthUrl`; `active=false` a :177. È l'unico hit fuori docs/reports. Template staged, non prova d'import/invocazione su NEW; `active=false` da solo non escluderebbe esecuzione manuale/subworkflow. NEW n8n 0/0 e runtime OpenClaw staged sono corroborazione, non autorizzazione a importarlo invariato. Rivalidare endpoint soltanto se selezionato per una futura attivazione. |
| EXPECTED_OLD_ONLY | `docs/workflow-wb-live-classifier-server.md:130,133` e sessione 2026-06-04:100 documentano grant GIS/Nav per OLD. Ownership del grant è nota; non provano né negano copertura NEW della policy esterna. Verificarla con i futuri smoke privati, non riscrivere automaticamente ACL. |
| HISTORICAL | Packet/gate/status D0014 e draft support ISSUE_8 descrivono precedenti prove/incidente di egress OLD, non intended config NEW. |
| AMBIGUOUS | GIS GraphHopper/ORS effective endpoints e inclusion nginx: F02/F01. Scope di `GOI_ACTIVE_OLD_IDENTITY_REFS=NONE` insufficiente a estendere il claim ai file/consumer non identificati. |
| ACTIVE_NEW_BUG | Nessuno dimostrato nella configurazione NEW attiva/intended dalle evidenze disponibili. Assenza di hit runtime locali non prova assenza sui VPS. |

Coerenza NEW sostenuta: public host `31.70.139.73`, Tailscale `100.99.54.93`, MagicDNS `ionos-n8n-new.tailc01234.ts.net` sono concordi in S03/S05/S06/S07/S08. Il trailing dot nel `Self.DNSName` del commento #68 è la stessa identità FQDN. OS hostname `ubuntu` su NEW non è una collisione con il node name Tailscale distinto; il helper TLS esplicito evita la vecchia derivazione. D-Flight bind/origin, readiness, GraphHopper e vhost staged sono documentati con NEW. I soli bind dinamici GIS/Nav non dimostrano i rispettivi endpoint downstream.

Catalogo completo dei file con hit (linee distinte alla base audit; una linea può contenere più identità). `CURRENT/CHECKPOINT` qui indica contesto del documento, non promozione runtime; le classificazioni OLD sono quelle sopra.

| File | Linee con hit | Contesto |
|---|---|---|
| `docs/runtime/CURRENT_FRONTIER.md` | 14 | CURRENT |
| `docs/runtime/LAST_CURSOR_REPORT.md` | 25,40,70,85,100,115 | CHECKPOINT; soli hit, nessuna ricostruzione rolling |
| `docs/vps/CURRENT_VPS_STATE.md` | 8,10,12,15,19,22,82,85,86,94,104,105 | CURRENT |
| `docs/vps/PROJECT_VPS_REGISTRY.md` | 11,15,17,26,33 | CURRENT |
| `docs/vps/SHARED_INFRASTRUCTURE_REGISTRY.md` | 9,10,15,17,22,41 | CURRENT |
| `reports/architecture/v4_vps_cross_project_consumer_mini_audit_v1.md` | 8,16,17 | CHECKPOINT |
| `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md` | 8,9,20,21,31,33,34,36,43,48,59 | CHECKPOINT |
| `reports/architecture/v4_vps_new_tls_recovery_v1.md` | 8,9,21,44 | CHECKPOINT / negativo OLD SAN |
| `workflows/60-openclaw-broker-fallback-resolver.template.json` | 30 | STAGING_ONLY |
| `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_EXECUTION_PACKET.yaml` | 119 | HISTORICAL |
| `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_GATE.md` | 9 | HISTORICAL |
| `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md` | 11 | HISTORICAL |
| `docs/runtime/ISSUE_8_ZAI_SUPPORT_ESCALATION_DRAFT.md` | 12,35,36,75,76,98,122,127,138 | HISTORICAL |
| `docs/sessions/2026-06-04-control-plane-classifier-tailscale-serve-auth-acl-pass.md` | 100 | EXPECTED_OLD_ONLY / grant storico |
| `docs/workflow-wb-live-classifier-server.md` | 130,133 | EXPECTED_OLD_ONLY / grant OLD |
| `reports/architecture/v4_new_vps_inventory_provision_baseline_v1.md` | 8,23,24,25,76,196,252 | HISTORICAL |
| `reports/architecture/v4_new_vps_n8n233_disable_before_start_and_localhost_replica_retry_v1.md` | 8 | HISTORICAL |
| `reports/architecture/v4_replacement_8gb_full_service_parity_census_v1.md` | 8,19,20,21,60,62,63,68,69,157,179 | HISTORICAL |
| `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md` | 8 | HISTORICAL / staging pointer |
| `reports/architecture/v4_replacement_8gb_vps_baseline_provisioning_v1.md` | 8,22,23,83 | HISTORICAL |
| `reports/architecture/v4_replacement_8gb_vps_hermes_browser_runtime_deployment_v1.md` | 8,20,21 | HISTORICAL |
| `reports/architecture/v4_replacement_8gb_vps_isolated_core_replica_v1.md` | 8,130 | HISTORICAL |
| `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md` | 3,60,64 | HISTORICAL / difetti poi corretti |
| `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md` | 3,8,9,10,52,54,56,60,61,90 | HISTORICAL / path e bind |
| `reports/architecture/vps_goi_old_final_nonsecret_inspect_2026-09-07.md` | 3,24,30,31,39,40 | EXPECTED_OLD_ONLY / target NEW |
| `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md` | 3,9,10,23,24,25,26,27,94,95,96,97,98,99,102,103 | EXPECTED_OLD_ONLY / target NEW |
| `reports/architecture/vps_goi_post_render_preactivation_verify_2026-09-07.md` | 5,7,10,13,14,15,17,18 | Render NEW / HISTORICAL cert OLD |
| `reports/architecture/vps_goi_project_handoff_2026-09-07.md` | 48,49,51 | HISTORICAL seed / acceptance GIS aperta |
| `reports/architecture/vps_prejoin_cross_project_reconciliation_2026-09-07.md` | 28 | HISTORICAL prejoin |

## Findings bounded

### F01 — inclusione nginx non dimostrata

- **ID:** F01
- **SEVERITY:** BLOCKER
- **CLAIM:** vhost NEW rendered/verified + `nginx -t PASS` dimostrano readiness della configurazione GOI nginx.
- **EVIDENCE:** S10:50-51 documenta `sites-enabled` vuota e vhost staged soltanto in `sites-available`. S12:58 identifica `/etc/nginx/sites-available/goi-ors-gateway`. S09:15-16 documenta listen/server_name/upstream renderizzati e `nginx -t`, senza path di inclusione. S04:17 conserva `sites-enabled` vuota anche nella registry corrente. Nei report GOI/TLS/mini-audit pertinenti non è documentato un include alternativo, symlink, configurazione effettiva o test esplicito `-c` del vhost.
- **IMPACT:** blocco della prova obbligatoria di questo audit e della clearance nginx; non prova di configurazione runtime errata. Il path staged è noto, il meccanismo effettivo di inclusione è **UNPROVEN**. Service inactive non implica automaticamente site disabilitato o viceversa. Non assumere layout nginx standard né inventare un include da `conf.d`.
- **REQUIRED_NEXT:** evidence read-only circoscritta NEW che identifichi entry config e comando effettivi nginx/systemd, include chain fino al vhost, stato dei link/site e quale configurazione abbia verificato `nginx -t`. Estratti selettivi non-secret equivalenti a `nginx -T` oppure test con target esplicito e wrapper documentato; bind NEW, server_name, upstream e soli path TLS. Se il vhost è intenzionalmente non incluso, registrarlo e distinguere validation del file staged da future integration. Nessuna attivazione o modifica nel pass di acquisizione.

### F02 — endpoint GIS NEW non qualificati dall'evidence del bind

- **ID:** F02
- **SEVERITY:** BLOCKER
- **CLAIM:** `GOI_ACTIVE_OLD_IDENTITY_REFS=NONE` e render NEW validato chiudono anche la dipendenza GIS→GraphHopper/ORS.
- **EVIDENCE:** S11:54 e 95 richiedono transizione degli endpoint GIS da OLD GraphHopper IP e OLD ORS MagicDNS. S12:64-74 prova solo bind dinamico GIS/Nav. S09:7-18 enumera drop-in, D-Flight, readiness, GraphHopper e vhost; non identifica configurazione/endpoint client GIS. S03:43 è un claim aggregato senza elenco del perimetro cercato; il commento #68 del render parla di checked active config senza dimostrare il tree/consumer GIS.
- **IMPACT:** classification **AMBIGUOUS**, nessun `ACTIVE_NEW_BUG` dimostrato. La prova di assenza OLD nel perimetro qualificato non si estende al consumer GIS. Una GIS apparentemente NEW potrebbe ancora interrogare OLD e produrre un falso PASS di parity; questo impedisce clearance GIS/generica GOI finché chiarito.
- **REQUIRED_NEXT:** acquisire read-only i path effettivamente consumati da GIS, provenienza dei valori GraphHopper/ORS e identità destinazione, incluse eventuali impostazioni client se il ruolo è client-side. Documentare dipendenze NEW e scope della ricerca OLD. Eventuali OLD endpoint attivi nell'intended config NEW diventano `ACTIVE_NEW_BUG` e richiedono successivo delta separato; non correggerli nell'audit.

### F03 — conteggi senza denominatore riconciliato

- **ID:** F03
- **SEVERITY:** IMPORTANT
- **CLAIM:** `MIGRATED_VALIDATED=15`, `PRESENT_NOT_VALIDATED=14`, `MISSING=0`, `PROJECT_DECISIONS_PENDING=1` descrivono le registry correnti.
- **EVIDENCE:** S03:29-32 contiene 15/14/0/1. Conteggio diretto delle 21 righe S04:7-27: **10 MIGRATED_VALIDATED, 10 PRESENT_NOT_VALIDATED, 0 MISSING, 1 OBSOLETE_NEEDS_HUMAN_DECISION**. S10:20-25 riporta 14/14/1/1, mentre la sua matrice delta S10:33-63 ha 7/21/1/1 più una riga `resolved on NEW`, con granularità differente. I successivi commenti #68 aggiornano numeri senza una matrice corrente che li mappi alle righe aggregate. S03:131 e S18:69 conservano inoltre una decisione finale OpenClaw distinta dagli obsolete volumes.
- **IMPACT:** il rollup 15/14 non è riproducibile; non è dimostrato falso se appartiene a un diverso censimento. `PROJECT_DECISIONS_PENDING=1` coincide con una riga obsolete, non necessariamente con tutte le decisioni pendenti. Nessun nuovo `MISSING` dedotto; nessuna promozione/revoca per aritmetica. Non blocca da solo ORS; impedisce usare i numeri come acceptance globale.
- **REQUIRED_NEXT:** definire denominatore e mapping census→componenti/registry, distinguere count delle righe obsolete dalle decisioni e rigenerare il rollup prima del sign-off di full parity. Non sostituire automaticamente 15/14 con 10/10.

### F04 — OLD public :80 attribuito, funzione/disposizione unresolved

- **ID:** F04
- **SEVERITY:** IMPORTANT
- **CLAIM:** il default nginx pubblico OLD `:80` è accounted.
- **EVIDENCE:** S06:34,49 e S05:24 attribuiscono il listener al default site nginx, owner Control Plane. Non documentano funzione effettiva, consumer o disposizione obsolete/non-required.
- **IMPACT:** ownership **ACCOUNTED**, requiredness **UNRESOLVED**. `default` non prova obsolescenza e non impone replica automatica su NEW. Nessun blocco della qualificazione ORS loopback; full parity/intended exposure e decommission non possono ignorarlo.
- **REQUIRED_NEXT:** evidence read-only limitata al default vhost/funzione e decisione `REQUIRED` oppure `NON_REQUIRED/OBSOLETE`. Se required, validare sostituzione/routing NEW prima cutover; se non required, registrare l'esclusione e chiudere la disposizione prima decommission. Nessun cleanup in questo task.

### F05 — OLD TLS failed oneshot non classificabile come transient

- **ID:** F05
- **SEVERITY:** IMPORTANT
- **CLAIM:** OLD ha timer TLS attivo e renewal oneshot failed, registrato come stato OLD-only.
- **EVIDENCE:** S06:35, S04:16 e S05:23 registrano timer attivo e oneshot failed. Mancano timestamp/esito/causa e successivo successo, scadenza del cert OLD e smoke HTTPS specifico. S13:15-24 espone la vecchia derivazione `hostname -f`, che richiedeva adattamento NEW ma non dimostra la causa del failure OLD. S08:58 dichiara OLD non contattato: il recovery NEW non chiude l'anomalia OLD.
- **IMPACT:** **UNRESOLVED**, non prova di una nuova dipendenza mancante: renewal è già registrato. Resta da dimostrare salute TLS OLD durante parallel validation e rollback; non è necessario imporre una riparazione per un failure storico senza diagnosi.
- **REQUIRED_NEXT:** acquisire metadata/esiti non-secret dell'ultimo run e timer, eventuale successo successivo, SAN/scadenza e smoke HTTPS OLD; classificare failure residuo o problema corrente e dimostrare copertura dell'orizzonte validazione/rollback. Gate da chiudere prima cutover e comunque prima decommission; non correggere OLD in questo audit.

## Gate ancora reali: prima di HUMAN_CUTOVER_GATE

1. Chiudere F01/F02 prima della rispettiva attivazione/qualificazione nginx/GIS e del via libera GOI complessivo. Qualificare ORS, GIS, Nav, D-Flight, nginx e dipendenze/credenziali/intended exposure; GraphHopper ha già functional PASS.
2. Completare schema-engine resolver/validator smoke nel container NEW attraverso i bind effettivi. Nessun nuovo server schema-engine è richiesto.
3. Provare restart/boot persistence per tutti i servizi required, inclusi GraphHopper/readiness e core compose; `enabled` da solo non chiude il test. Completare TLS renewal con nginx attivo e timer/persistence. Preservare loopback ORS/admin/browser e n8n isolato fino alla fase autorizzata.
4. Parallel validation OLD↔NEW e traffico E2E rappresentativo su NEW; chiudere F03 per sign-off verificabile, determinare requiredness :80 (F04), dimostrare OLD sano e rollback TLS praticabile (F05). Validare routing privato/pubblico applicabile senza cutover anticipato. Nessuna required row missing/unvalidated al sign-off.
5. Presentare evidence e perimetro del cutover al gate umano esplicito. L'attuale n8n NEW `0/0` è corretto: pubblicazione e produzione NEW appartengono alla fase cutover separatamente autorizzata, non sono una precondizione da eseguire prima del gate.

Già risolti e quindi non elencati come blocker: join/identità unica NEW, MagicDNS esatto, SAN/cert-key/mode NEW, copy dei tree noti, ownership dei consumer, functional GraphHopper, ruolo reference-only dev-method, distinzione orchestratore/runtime OpenClaw. Nessuna nuova issuance, nuovo join o recopy generalizzato richiesto dall'audit.

## Requisiti aggiuntivi solo prima di OLD_DECOMMISSION_ELIGIBLE=YES

- Eseguire il cutover autorizzato e l'eventuale pubblicazione n8n/routing prevista, ottenere post-cutover health PASS e confermare traffico di produzione su NEW.
- Mantenere OLD intatto nella breve rollback window concordata; documentare trigger e criteri d'uscita, completare la finestra senza trigger e soddisfare rollback exit. OLD identity/TLS, cache GraphHopper, LKG D-Flight e runtime restano disponibili nel frattempo (S11:104-111).
- Chiudere decisioni finali sui volumi storici/quarantine e OpenClaw app/runtime activate-or-archive; registrare disposizione finale del public :80 se escluso come non-required. `KEEP_STAGED_PENDING` basta per proseguire la qualificazione, ma non sostituisce la decisione finale richiesta da S19:24. Se una decisione rende required un runtime oggi opzionale, la sua acceptance torna obbligatoria prima di rimuovere OLD.
- Soddisfare backup/evidence finali applicabili e ottenere autorizzazione umana esplicita al decommission; registrare eligibility soltanto a condizioni soddisfatte. Shutdown/deletion restano un'azione successiva separatamente delimitata. Non si richiede uno shutdown già eseguito per dichiarare eligibility.

Questi requisiti si aggiungono ai prerequisiti di full parity già sopra; non si rinviano le prove di boot, routing previsto, TLS operativo ed E2E a dopo il cutover. Le modifiche effettive del routing restano nella finestra cutover autorizzata. Fonte: #68 body e S19:7-11,15-46,50-68. Il fatto che le caselle statiche S19 siano ancora vuote non riapre PASS già dimostrati dalle evidenze correnti.

## OpenClaw: distinzione confermata

S03:59-65,117-122 distingue OpenClaw 42 chat/orchestratore dal runtime VPS; #68 commento del `2026-09-07T02:04:53Z` corregge quello precedente delle `02:02:23Z`. Il modello attuale è OpenClaw 42 orchestratore, chat VPS temporanea, Cursor executor; nessuna inferenza di attivazione app. S18 e S04:23 mantengono runtime fallback staged/inactive, `KEEP_STAGED_PENDING`. Il secondo schema chat abbandonato non ha prodotto smoke/promozione.

## Raccomandazione NEXT esatta

```text
NEXT=CURSOR_BOUNDED_READONLY_NEW_NGINX_INCLUDE_CHAIN_AND_GIS_EFFECTIVE_ENDPOINT_EVIDENCE
THEN=REASSESS_F01_F02_AND_CLOSE_INDEPENDENT_EVIDENCE_AUDIT
GENERIC_REMAINING_GOI_ACTIVATION_CLEARANCE=WITHHELD_PENDING_EVIDENCE
OPENCLAW_RUNTIME=KEEP_STAGED_PENDING
```

Il prossimo pass deve acquisire e persistere soltanto le prove F01/F02: path di inclusione/test nginx e sorgenti/destinazioni effettive GIS. Niente start/stop/enable/reload, render/copy, issuance, pubblicazione, cutover o fix implicito. I finding F03-F05 restano tracciati ai rispettivi gate; possono essere acquisiti in successivi pass bounded senza trasformarli in un censimento storico generale. Questo audit **non implementa il NEXT**.

## Persistenza e verifiche di questo task

- Creato questo report. Aggiornato soltanto il frontier per rendere visibile il nuovo evidence gate e sostituire il NEXT generico; il runtime snapshot e i PASS precedenti sono preservati.
- Registry/classificazioni e runtime files invariati. I vecchi NEXT nei checkpoint sono precedenti a questo audit: il frontier ha precedenza per il prossimo passo.
- Conteggio diretto delle righe registry eseguito; nessun test runtime o source test richiesto per questo delta documentale.
- Closure richiesta: `git diff --check`, stage selettivo di report/frontier, commit `codex-stop: V4_VPS_CODEX_INDEPENDENT_EVIDENCE_AUDIT_V1`, push `origin/main`, verifica HEAD remota. L'esito della closure è riportato nella risposta finale; il report non inventa un proprio commit hash prima della creazione.
