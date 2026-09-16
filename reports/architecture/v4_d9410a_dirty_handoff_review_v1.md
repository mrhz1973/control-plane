# V4_D9410A_DIRTY_HANDOFF_REVIEW_V1 — Report

**RESULT=PASS**
**TASK_REF=V4_D9410A_DIRTY_HANDOFF_REVIEW_V1**

**BASE_HEAD=98de43d09782cdade673e67cfefd8b82946b26d0**
**FINAL_HEAD=** (commit di questo report, vedi sotto)

**Date (Europe/Rome):** 2026-09-16
**Executor:** Cursor / Codex — READ-ONLY review del dirty handoff D-9410-A.

---

## Dirty scope (byte-for-byte invariato durante tutta la review)

```
DIRTY_FILE_COUNT=2
DIRTY_FILES=tools/local-dev-resource-observatory-v1.mjs
           tests/local-dev-resource-observability-integrity-v1/run.mjs
```

Nessun altro file tracked-dirty presente → scope corrisponde esattamente al
lascito D-9410-A (nessun DIRTY_SCOPE_CHANGED). Verificato pre- e post-run del
test focalizzato: il diff resta identico (`29 insertions(+), 0 deletions(-)`).

## ORIGINAL_OBJECTIVE

D-9410-A (`reports/runtime/dev-queue/always-on/READY_D9410A.md`): aggiungere
`cpu_percent` VPS live (0..100) all'osservatorio risorse/dashboard tramite
superficie OS read-only già disponibile, misurando **utilizzazione CPU reale**
(non load average), con preferenza per **/proc/stat delta sampling**, law
fail-closed (evidenza malformata → `cpu_percent: null` senza degradare lo stato
VPS), allowlist comandi invariata, nessuna installazione/mutazione del VPS.

## IMPLEMENTATION_SUMMARY (cosa è cambiato nei 2 file)

1. `tools/local-dev-resource-observatory-v1.mjs` (+27 righe):
   - aggiunge `"cat /proc/stat"` a `VPS_SAFE_REMOTE_COMMANDS` (una riga);
   - nuova funzione `parseCpuPercentFromStat(statText)`: parsa la riga
     aggregata `cpu ` di /proc/stat, richiede ≥8 campi tutti numerici ≥0,
     calcola `busy = user+nice+system+irq+softirq+steal`,
     `total = busy+idle+iowait`, `pct = busy/total*100`, arrotondato a 0.1,
     restituisce `null` se malformato/incompleto/fuori 0..100 (fail-closed);
   - popola il nuovo campo `cpu_percent` nell'oggetto osservazione VPS
     esistente, accanto a `load_average`/`uptime_seconds` (un'unica riga).
2. `tests/local-dev-resource-observability-integrity-v1/run.mjs` (+2 righe):
   - fixture `/proc/stat` nel test del runner SSH canonico;
   - assertion `observation.cpu_percent === 27.4`.

## CPU_SOURCE

`cat /proc/stat`, riga aggregata `cpu ` (contatori cumulativi in jiffies
dall'avvio), attraverso il trasporto SSH canonico già esistente
(`ionos-n8n-new`, BatchMode, allowlist, per-command timeout ≤2.5s,
single-flight probe, cache 30s). Non è load average e non è un valore inventato.

## READ_ONLY_SOURCE=YES

`cat` è lettura pura; il comando è stato aggiunto all'allowlist frozen e passa
sia il `MUTATION_RE` esistente sia l'assert read-only del test preesistente
("VPS success, timeout and all commands remain read-only" PASSA immutato).
Nessun install, restart, write, config mutation. Nessun altro comando aggiunto.

## PROC_STAT_DELTA_LOGIC=NO (questo è il difetto materiale)

Il backlog richiede "Prefer Linux /proc/stat **delta sampling**"; l'obiettivo è
CPU **live**. L'implementazione esegue una **singola lettura** di /proc/stat e
calcola il rapporto **cumulativo dall'avvio** (busy/(busy+idle+iowait) su tutta
la vita del VPS):

- matematicamente corretto come "quota media di CPU usata da boot";
- **non** utilizzazione live: il valore è fortemente smorzato dall'uptime.
  Esempio reale: un VPS con ~40 giorni di uptime medio ~6% che passa a 100%
  sostenuto vede il valore salire solo di ~0.2 punti nel minuto successivo;
- il dispatcher osserva con cache 30s: la card dashboard mostrerebbe una
  percentuale quasi fissa, non reattiva.

Verifica del fixture del test: busy = 1000+0+500+0+50+0 = 1550;
total = 1550+4000+100 = 5650; 1550/5650 = 27.43% → 27.4. L'assertion è
coerente con la formula implementata (singola lettura cumulativa).

Delta sampling corretto richiederebbe due letture a Δ noto (es. 1–2s) e la
differenza per-campo — non presente nel lascito.

## Fail-closed / semantica esistente

- `parseCpuPercentFromStat` restituisce `null` per: riga mancante, <8 campi,
  campi non numerici o negativi, total ≤ 0, pct fuori 0..100. ✓ (accettabile
  per la acceptance "malformed/incomplete → cpu_percent=null")
- L'osservazione VPS rimane `reachable` con gli altri campi invariati quando il
  parse CPU fallisce — coerente con la health-separation esistente. ✓
- Tutti i campi preesistenti (RAM/swap/disk/services/tailscale/Hermes/noVNC/
  docker/n8n/postgres) sono intatti; solo `cpu_percent` è aggiunto. ✓

## UNRELATED_CHANGES_FOUND=NO

Il diff tocca esclusivamente le due aree sopra; nessuna modifica a dashboard
HTML (la card VPS consumava già `v.cpu_percent` e mostrava "—" in sua assenza),
routing, WF90, Telegram, dispatcher service, altre card.

## FOCUSED_TEST

```
FOCUSED_TEST_COMMAND=node tests/local-dev-resource-observability-integrity-v1/run.mjs
FOCUSED_TEST_RESULT=6/7 PASS
  - Tutti i 4 check correlati VPS/CPU PASSANO, incluso il nuovo
    "canonical SSH runner parses bounded read-only observations"
    (assert cpu_percent=27.4) e il check read-only preesistente.
  - 1 FAIL: "quota, Codex capability and Cursor accounting are separate"
    (NOT_OBSERVED vs STALE) — failure PRE-ESISTENTE al baseline, già
    documentato nel task V4_WF90_2MIN_… (verificato allora con stash clean a
    HEAD 77f147c). Il lascito D-9410-A non tocca codice quota/Codex/Cursor e
    non può regredirlo. NON è un difetto del handoff.
```

Il test è in-memory (nessuna scrittura file) e ha letto il modulo dirty così
com'è, senza mutare nulla.

## MATERIAL_DEFECTS_FOUND=YES (1)

```
DEFECTS=
  D1 (materiale, non bloccante la safety): manca il delta sampling richiesto
     dal backlog ("Prefer /proc/stat delta sampling") e dall'obiettivo "live".
     La percentuale cumulativa-da-boot è reale ma quasi statica su VPS con
     uptime lungo: la card mostrerebbe un valore non reattivo, in CONTRASTO
     con l'intento dichiarato del task. Fix convenzionale: due letture a Δ~1s
     (o cache del campione precedente nel probe runner) e differenza per
     campo; fail-closed già presente può essere riutilizzato.
```

Nessun difetto di sicurezza, nessuna mutazione, nessun leak, nessun campo
fabbricato: in caso di dubbio il codice restituisce null.

## REVIEW_OUTCOME=NEEDS_FIX_BEFORE_COMMIT

Motivo: l'implementazione è sicura, read-only, coerente e ben delimitata, ma
non implementa il comportamento richiesto (utilizzazione live via delta
sampling); committarla così com'è consoliderebbe una metrica fuorviante
(etichettata CPU live ma di fatto media-da-boot). Con il solo D1 riparato (e
il fixture/assert del test aggiornati di conseguenza) il lascito sarebbe
ACCEPTABLE_FOR_COMMIT.

## OPERATOR_ACTION_SUMMARY (in italiano, per l'operatore)

**Cosa ha fatto D-9410-A.** L'executore autonomo ha aggiunto la CPU VPS alla
telemetria esistente: ha inserito il comando di sola lettura `cat /proc/stat`
nell'allowlist SSH del VPS e una funzione che calcola una percentuale CPU dal
contatore cumulativo del kernel, esponendola come `cpu_percent` nell'osservatorio
già consumato dalla dashboard (la card VPS mostrava "—" proprio perché il campo
mancava). Ha anche esteso il test focalizzato con un fixture e un assertion.

**I 2 file modificati.**
`tools/local-dev-resource-observatory-v1.mjs` (+27 righe) e
`tests/local-dev-resource-observability-integrity-v1/run.mjs` (+2 righe).

**Perché il Control Plane si è fermato.** Durante l'esecuzione l'executore ha
lasciato questi 2 file non committati; il guardia repo-hygiene del dispatcher
(`TRACKED_DIRTY_CONFLICT`) ha correttamente bloccato i tick successivi e aperto
il human gate. Da lì in poi il lascito è stato protetto attraverso i task WF90
successivi (2min cadence, countdown dashboard, affidabilità Telegram, dedupe).

**Risultato del test.** `node tests/local-dev-resource-observability-integrity-v1/run.mjs`
= 6/7 PASS. Tutti i controlli CPU/VPS passano (incluso il nuovo assertion
cpu_percent=27.4). L'unico fallimento è il check quota/Codex/Cursor
(NOT_OBSERVED vs STALE), già presente al baseline e già documentato: non è
causato da questo lascito.

**Problemi trovati.** Uno solo, tecnico e non di sicurezza: la percentuale è
calcolata su una singola lettura di /proc/stat, quindi è la media dall'avvio
del VPS, NON l'utilizzazione live richiesta dal backlog (che chiedeva delta
sampling: due letture a distanza di ~1–2 secondi e la differenza). Su un VPS
acceso da settimane il numero appare quasi fisso e poco reattivo. Tutto il
resto è corretto: read-only puro, fail-closed, nessun file estraneo toccato.

**Decisione richiesta all'operatore.** Il lascito NON è pronto per il commit
così com'è. Scelta consigliata: **FIX** — autorizzare un piccolo task di
riparazione che aggiunga il delta sampling (e aggiorni fixture/assert del
test), poi committare. In alternativa è possibile **DISCARD** (ripristinare i
2 file allo stato committed e perdere il lavoro), oppure — sconsigliato —
committare comunque sapendo che la metrica sarà una media-da-boot e non live.

## Guardrail rispettati

```
D9410A_FILES_MODIFIED_BY_REVIEW=NO
D9410A_FILES_DISCARDED=NO
D9410A_FILES_COMMITTED=NO
D9410A_REPLAYED=NO
WF90_CHANGED=NO
VPS_CHANGED=NO
SECRETS_EXPOSED=0
```

Nessuna mutazione VPS/n8n/WF90/Telegram; nessuna produzione dispatch; nessuna
invocazione Qwen; nessun D0025; nessun cleanup estraneo; nessuna riparazione
codice. Report scritto solo nel worktree temporaneo pulito da origin/main.
