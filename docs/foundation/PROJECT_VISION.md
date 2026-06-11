# PROJECT VISION — Foundation

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/PROJECT_VISION.md`  
**Versione:** 2.12 — 2026-06-07  
**Versione precedente:** 2.11 — 2026-06-07 (sostituita)  
**Lingua:** Italiano  
**Ruolo del documento:** entry point canonico del progetto control-plane. Da leggere all'inizio di ogni sessione umana o AI prima di interpretare PM, handoff, session log o decisioni locali.

---

## 0. Cos'è questo progetto in una frase

`control-plane` è il sistema personale che deve trasformare il lavoro AI-assisted da una sequenza manuale di chat, prompt, copia/incolla e controlli a un loop semi-autonomo: GitHub resta la fonte di verità, n8n osserva e governa, Codex ragiona sul prossimo passo, Ollama classifica il rischio, Cursor implementa, Telegram chiede intervento umano solo quando serve davvero.

La destinazione non è una singola notifica Telegram e non è un singolo PM: la destinazione è un **team AI locale e confinato** che lavora su repository selezionati con costi prevedibili, senza provider API key a consumo, e con gate umani sulle operazioni realmente rischiose.

---

## 1. Principio di valore

Il progetto esiste per eliminare micro-interazioni meccaniche ripetute:

- ricostruire il contesto a ogni nuova chat;
- chiedere continuamente `aggio` per verificare GitHub;
- copiare e incollare prompt tra orchestratore e implementatore;
- aprire GitHub solo per capire cosa è cambiato;
- decidere manualmente ogni volta quale agente deve fare il prossimo passo;
- subire conferme inutili per azioni già autorizzate e recuperabili.

La domanda guida ereditata dal low-touch loop è:

> **Quante micro-interazioni umane elimina questo componente?**

Un componente che non riduce tempo, ambiguità, errori ripetuti, token o lavoro manuale non appartiene alla strada critica del progetto.

### 1.1 Esempi concreti di micro-interazioni eliminate per fase

La tabella seguente è un riferimento operativo del principio: per ogni componente, quale azione manuale viene tolta.

| Componente | Micro-interazione eliminata | Stato |
|---|---|---|
| Workflow 40 polling | Apertura manuale GitHub per vedere nuovi commit | ATTIVO |
| Telegram base | Verifica manuale "è arrivato il commit?" | ATTIVO |
| Diff summary Telegram (workflow 42) | Apertura GitHub per leggere cosa è cambiato | ATTIVO |
| Codex CLI (OAuth ChatGPT Plus) | Pensare manualmente il prossimo prompt | NON ATTIVO |
| Ollama classifier | Decidere manualmente se un task è sicuro | NON ATTIVO |
| Cursor CLI | Copiare/incollare il prompt nell'IDE | NON ATTIVO |
| Auto-aggio (futuro) | Scrivere `aggio` per ogni completamento | NON ATTIVO |
| Decision Packet su Telegram | Decidere a prosa libera, in modo ambiguo | NON ATTIVO |
| Handoff via N turni | Capire manualmente quando una chat satura | NON ATTIVO |
| Uploader esito verifier via sftp | copia-incolla manuale output verifica post-task | ATTIVO (manuale one-shot) |

Ogni nuovo componente che si propone deve aggiungere una riga a questa tabella.

---

## 2. Architettura target completa

Componenti con ruoli rigidi. Nessun componente deve assorbire silenziosamente il ruolo di un altro.

| Componente | Ruolo target | Dove gira / vive |
|---|---|---|
| **GitHub** | Source of truth: codice, piani, documenti, stato verificabile | Cloud |
| **n8n** | Control-plane operativo: scheduler, polling/webhook, gate, Telegram I/O, stato, routing esterno | VPS IONOS |
| **Codex CLI (OAuth ChatGPT Plus, ephemeral)** | Orchestratore operativo: legge contesto e genera il prossimo prompt strutturato | PC Ryzen casa, ephemeral single-shot |
| **Ollama** | Classifier / risk scorer / prompt compressor locale. Non implementa codice | PC Ryzen primario; Dell fallback futuro |
| **Cursor CLI** | Implementatore: esegue task, modifica file, valida, committa e pusha | PC Ryzen fase 1; Dell futuro per job headless |
| **Telegram** | Canale umano: notifica, gate, escalation e Decision Packet | Bot dedicato gestito da n8n |
| **Tailscale** | Trasporto privato VPS ↔ nodo locale | Rete cifrata e autenticata |

### Confine importante

Il **model path target ufficiale** è **Codex CLI diretto via OAuth ChatGPT Plus** (ephemeral single-shot sul Ryzen): orchestratore tattico, non implementatore, non worker n8n-ready. La scelta deriva da discovery v1 e dal **Codex bridge V2 PASS** (wrapper locale, fail-closed, senza provider API key a consumo).

**OpenClaw gateway** resta **backlog / transport confinato opzionale** (loopback, browser bridge storico) — **non** è il model path target.

Questa foundation v2.2 prevale come destinazione architetturale: Codex CLI orchestratore, Cursor implementatore, Ollama classificatore. Documenti precedenti che citano «Codex via OpenClaw» come path default restano utili come storico e sicurezza.

---

## 3. Stato operativo reale al momento della foundation

Questa sezione distingue la visione da ciò che è già vero.

| Area | Stato reale |
|---|---|
| **Workflow n8n produzione** | `40 - CP v4 multirepo + classifier bridge - ACTIVE`, polling 1 minuto |
| **Workflow backup** | `41` backup off, da conservare finché non c'è decisione esplicita |
| **C1 latency** | PARTIAL con eccezione operativa accettata: SLA 1–5 minuti, non strict `<30s` |
| **C2–C5 MVP** | PASS secondo snapshot MVP |
| **Webhook v5 pubblico** | Non configurato / non attivo |
| **PM-34 real worker** | Bloccato: nessun Codex real worker n8n-ready |
| **OpenClaw gateway (Ryzen)** | **PASS** (2026-05-25) loopback manual — [session](../sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md) |
| **OpenClaw agent `main` Step A** | **BLOCKED** (2026-05-25) — liveness via gateway blocked by **no OpenAI provider API key** policy; gateway PASS unchanged. [session](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md) |
| **Codex OAuth/CLI** | Login/setup verificati in track PM-30/33; worker non abilitato |
| **Ollama classifier (Ryzen)** | **PASS** (2026-05-25) API smoke; **contract** [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md) (design only, no runtime). `ollama run` non idoneo; non n8n / non PM-34 unlock |
| **Cursor Agent CLI (Ryzen)** | **PASS** (2026-05-25) — install + auth + models; plan smoke read-only su `PROJECT_VISION.md`; worker/`--force`/`--yolo`/`--print` non usati. [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) · headless/n8n loop ancora **non** provato |
| **Tailscale VPS ↔ Ryzen** | **PASS** — mesh privata operativa (`ubuntu` ↔ `asusdesktop`); ping privato bidirezionale; n8n invariato su loopback; nessun Funnel né porta pubblica. [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) · [FOUNDATION_STATUS](FOUNDATION_STATUS.md) |

Regola: non confondere documento di visione con runtime già attivo. La visione può descrivere la destinazione, ma ogni attivazione reale resta verificabile da GitHub, n8n e output Telegram.

---

## 4. Le macchine (visione, non specifiche complete)

Il dettaglio hardware completo vivrà in `docs/foundation/ARCHITECTURE.md` (futuro). Qui solo i ruoli.

### 4.1 VPS IONOS

Ruolo:

- ospita n8n in modalità 24/7;
- osserva GitHub tramite polling o futuro webhook;
- gestisce Telegram e deduplica;
- decide quando chiamare nodi locali via Tailscale;
- conserva il control-plane operativo.

Non deve:

- ospitare modelli LLM pesanti;
- diventare implementatore;
- contenere provider API key se non autorizzate esplicitamente;
- eseguire codice di repository target come worker AI.

### 4.2 PC Ryzen casa — nodo AI primario fase 1

Ruolo target fase 1:

- Ollama primario con modello classifier più ricco (`qwen3:14b` o equivalente sostenibile);
- Codex CLI via OAuth ChatGPT Plus, ephemeral single-shot, senza provider API key a consumo;
- OpenClaw confinato su loopback locale solo come transport/backlog opzionale;
- Cursor CLI per esecuzione task;
- Tailscale per raggiungibilità privata da n8n.

Se il Ryzen è offline, n8n non deve inventare esecuzione: deve applicare il principio di **fallback graceful** (vedi sezione 7.6) e degradare a Telegram gate o modalità manuale.

### 4.3 Dell Latitude 5430 — nodo always-on/fallback futuro

Ruolo futuro: nodo always-on a basso consumo, fallback Ollama leggero, OpenClaw come transport/browser bridge opzionale confinato (non model path), Cursor CLI job worker. Non attivato in fase 1.

### 4.4 PC lavoro

Il PC lavoro è macchina operativa umana, non nodo produzione del loop. Può servire per docs-only, controllo GitHub e lavoro supervisionato. Non deve diventare nodo runtime automatico, né ospitare OpenClaw/Ollama in produzione, né ricevere prompt destinati a `GIS`, `DEV` o altri repo quando il flusso è `CONTROL PLANE`.

---

## 5. Loop target fase 1

```text
[1] Commit su repo osservato
    ↓
[2] n8n workflow 40 rileva commit / piano / evento
    ↓
[3] n8n deduplica, raccoglie metadata e prepara payload
    ↓
[4] n8n chiama via Tailscale il nodo Ryzen
    ↓
[5] Codex CLI legge il contesto e genera il prossimo prompt operativo
    ↓
[6] Ollama classifica rischio, routing e necessità di approvazione
    ↓
[7A] Se low-risk e dentro policy: Cursor CLI riceve il prompt ed esegue
[7B] Se medium/high/ambiguo: Decision Packet su Telegram (sezione 7.7)
    ↓
[8] Cursor CLI modifica, valida, committa e pusha
    ↓
[9] n8n rileva il nuovo commit e il loop ricomincia
```

### Ruoli nel loop

- **n8n** non ragiona come AI: applica regole, polling, routing, deduplica e gate.
- **Codex** ragiona e produce il prossimo prompt operativo.
- **Ollama** non decide strategia: classifica rischio, ambiguità, route e approvazione richiesta.
- **Cursor CLI** non decide la rotta: implementa quanto autorizzato.
- **Telegram** non è archivio: è interfaccia decisionale umana strutturata via Decision Packet.
- **GitHub** è il registro verificabile di stato e risultati.

---

## 6. I tre sistemi di livelli

Questi livelli sono distinti. Non vanno sovrapposti.

### 6.1 Livelli memoria / contesto AI — 0/1/2/3

Derivati dalla metodologia LLM Wiki / token efficiency.

| Livello | Fonte | Scopo |
|---|---|---|
| **Livello 0** | Regole permanenti (`ORCHESTRATOR_RULES`, `AI_RULES`, `WORKFLOW`, `COMMANDS`) | Policy canoniche |
| **Livello 1** | Stato autorevole (`PROJECT_STATE`, `CHECKPOINT`, `MVP_STATUS` dove presente) | Stato progetto e audit |
| **Livello 2** | `LLMS.md`, `docs/wiki/` | Memoria derivata AI-friendly e token-efficient |
| **Livello 3 futuro** | Indice locale / embeddings / Ollama | Ricerca semantica locale, runtime-gated |

Regola: Livello 2 non sostituisce Livello 0/1. Se divergono, vince il canonico.

### 6.2 Livelli automazione operativa — A/B/C

Derivati dal low-touch loop.

| Livello | Nome | Descrizione |
|---|---|---|
| **A** | Manuale-supervisionata | Utente/orchestratore guida quasi ogni step; baseline sicura |
| **B** | MVP Low-Touch | Il sistema elimina copia/incolla, aggio manuale e triage meccanico; utente interviene sui gate |
| **C** | Futuro semi-autonomo | Task low-risk avanzano entro perimetri definiti; Telegram per decisioni reali |

Target del progetto: arrivare prima a un **B utile**, non saltare direttamente a C.

### 6.3 Livelli rischio classifier — low/medium/high

Derivati dallo schema PM-17/Ollama classifier.

| Rischio | Significato operativo | Azione target |
|---|---|---|
| **low** | Docs-only, metadata, riepiloghi, task confinati e reversibili | Può procedere automaticamente se policy consente |
| **medium** | Modifiche codice/config/workflow non distruttive ma significative | Telegram gate via Decision Packet |
| **high** | Deploy, rollback, secrets, OAuth, billing, destructive ops, force push, dati sensibili | Sempre gate umano esplicito via Decision Packet |

---

## 7. Regole operative ereditate dai documenti reali

### 7.1 GitHub source of truth

L'orchestratore non deve fidarsi della memoria della chat quando GitHub può essere letto. Lo stato reale è ciò che risulta da repository, commit, documenti e output runtime osservabile.

**Verifica implementatore (Composer 2.5 Fast / modello implementatore):** un SUCCESS dichiarato in chat **non** equivale a PASS. Un task è PASS solo con output verificabile: hash commit, diff reale, `git status` pulito, `git log`, verifica su GitHub. Il SUCCESS testuale da solo è insufficiente; GitHub resta fonte di verità.

**Guardia retry/accesso (operativa, non componente):** un singolo fallimento di fetch/accesso **non** prova che una risorsa sia irraggiungibile (es. GitHub raw, `web_fetch`, API, pagine remote, file o endpoint remoti leggibili). Prima di concludere «non riesco a leggere X» o «X non è raggiungibile», **riprovare almeno una volta**. Non trascinare per tutta la sessione un assunto negativo non riverificato. Riverificare quando: lo stato può essere cambiato; l'utente afferma il contrario; una fonte alternativa suggerisce che la risorsa esiste; la prima richiesta può essere fallita per rete/cache/auth temporanea.

**Guardia hash remoto vince sul raw (operativa):** il PASS post-Cursor richiede l'**hash remoto su `main`**. Fonte primaria: `git ls-remote origin main` oppure `git rev-parse origin/main`. Il **GitHub raw è secondario**, best-effort, e può essere **stale** per cache/CDN. Se l'hash remoto conferma e il raw diverge, **non** declassare il PASS. Nessun PASS senza hash remoto. Solo se il remoto **non** mostra il commit, usare l'output locale per distinguere push mancato, branch sbagliato o commit mai fatto.

### 7.2 LLMS-first e token efficiency

Ogni agente deve leggere prima l'entry point compatto, poi i documenti specifici:

1. `docs/foundation/PROJECT_VISION.md` per la visione del control-plane;
2. eventuale `docs/LLMS.md` / `docs/wiki/current-state.md` quando verranno creati nel repo;
3. documento specifico del task o del componente;
4. file storici solo quando servono davvero.

Non leggere file storici enormi per default se la risposta sta nei documenti di livello superiore.

### 7.3 Aggressive autonomy controllata

Per azioni recuperabili e già autorizzate dal prompt, l'implementatore non deve bloccare il progetto con conferme ripetitive. Deve eseguire, validare, committare, pushare e riportare.

Deve invece fermarsi per:

- `git reset`, `git clean`, `git push --force`;
- segreti, credenziali, OAuth material, token, API key;
- billing o nuovi servizi a pagamento;
- deploy/tag/rollback non autorizzati;
- modifiche runtime n8n/VPS non autorizzate;
- cancellazioni o scope drift;
- conflitti non risolvibili;
- operazioni che toccano dati personali o sistemi esterni.

### 7.4 n8n template-first

Quando si progetta un workflow n8n:

- preferire template JSON importabile + doc companion;
- template inattivo by default (`active: false`);
- nessun segreto o chat_id reale in Git;
- import, execute e schedule activation sono gate separati;
- workflow export devono essere redatti prima di commit.

### 7.5 n8n no provider APIs by default

Regola architetturale, non solo economica:

n8n è workflow orchestration, queue, polling, GitHub, notification e file coordination. n8n **non deve** chiamare provider AI API a pagamento (OpenAI, Anthropic, OpenRouter, ecc.) come comportamento di default.

Quando il loop ha bisogno di "intelligenza AI", il flusso è: n8n → (via Tailscale) → nodo locale (Ollama / Codex CLI diretto) → ritorno

Mai:
n8n → API OpenAI pagata → ritorno

L'uso di API pagate richiede un gate manuale esplicito e una decisione di costo registrata. Per default tutto passa per modelli locali (Ollama) o per OAuth ChatGPT Plus (Codex CLI diretto).

### 7.6 Fallback graceful

Invariante architetturale derivato dal low-touch loop.

**Principio:** se un componente automatico fallisce, il loop torna sempre alla modalità manuale-supervisionata (livello A) senza perdita di stato. GitHub è la safety net — tutto è recuperabile dai commit.

Esempi pratici:

- Se Ollama classifier non risponde → il task non viene auto-promosso a low-risk; default safe = Telegram gate manuale.
- Se Tailscale è down → n8n non può raggiungere il nodo locale; default safe = Telegram all'utente "loop runtime offline, gestisci manualmente".
- Se Codex CLI esaurisce quota o errori OAuth → default safe = ChatGPT in modalità manuale dall'utente.
- Se Cursor CLI fallisce un task → il prompt resta su GitHub come plan; default safe = utente apre Cursor IDE manualmente.
- Se n8n crash sul VPS → polling si ferma; default safe = utente nota dal silenzio Telegram e ripristina.

In tutti i casi: **niente è perso**, perché lo stato vero è su GitHub.

### 7.6.1 Conseguenza progettuale

Ogni nuovo componente automatico che si propone deve rispondere a tre domande:

1. Cosa succede se questo componente fallisce?
2. Il sistema torna manuale in modo pulito o resta in stato indeterminato?
3. Lo stato è recuperabile da GitHub o ho introdotto stato fuori da GitHub?

Se risposte non chiare, il componente non è pronto per produzione.

### 7.7 Decision Packet — formato canonico dei gate umani

Quando il loop genera un gate umano (rischio medium/high, ambiguità, decisione strategica), l'interfaccia con l'utente è il **Decision Packet**, non una domanda in prosa libera.

**Regole del Decision Packet:**

- struttura strutturata, non libera;
- max 2-5 opzioni numerate;
- raccomandazione esplicita dell'orchestratore;
- l'utente risponde con **numero o parola corta**, mai prosa;
- canale: Telegram (notifica e risposta).

**Campi canonici minimi** (versione ridotta del format completo):

| Campo | Contenuto |
|---|---|
| **ID** | Identificatore univoco (es. `D-NNNN-X`) |
| **Kind** | `automation` / `meta` / `runtime` |
| **Contesto** | 1-2 frasi: cosa è successo |
| **Perché serve decisione** | Perché il sistema non può procedere da solo |
| **Opzioni** | 2-5 alternative numerate |
| **Raccomandazione** | Quale opzione è suggerita e perché |
| **Rischio principale** | Cosa può andare male con l'opzione raccomandata |
| **Micro-interazioni eliminate** | Cosa risparmia all'utente |
| **Scelta richiesta** | "Scrivi: 1 / 2 / 3" |
| **Cosa NON viene fatto** | Senza decisione, cosa resta fermo |

Il format completo esteso (13 campi) sarà documentato in un file separato `docs/foundation/DECISION_PACKET_FORMAT.md` quando il primo Decision Packet operativo arriverà a Telegram.

**Conseguenza:** il "Telegram gate" della sezione 5 non è una domanda generica. È sempre un Decision Packet strutturato.

### 7.8 Docs ROI Gate

Ogni nuovo documento deve ridurre almeno una di queste cose: token, tempo utente, ambiguità, errori ripetuti, lavoro manuale futuro. Altrimenti è burocrazia.

`PROJECT_VISION.md` supera il gate perché evita di ricostruire la destinazione del progetto da decine di session log e PM.

### 7.9 Anti-burocrazia / momentum

La sicurezza esiste per **abilitare il progresso**, non per creare preparazione indefinita. Regole operative:

- **PREP PASS è ammesso solo quando rimuove un blocco reale.** Un PREP che non toglie un blocco concreto è burocrazia (vedi §7.8).
- Per **una singola catena di feature confinata**, non creare documenti ripetuti di pre-pass / pre-pre-pass a meno che **non compaia un nuovo rischio concreto e nominato**.
- Dopo che una feature ha avuto:
  - **1 prova di import/reimport (rehearsal)**, e
  - **massimo 2 run manuali ripetuti**,
  il progetto deve fare **una** di queste due cose:
  - **avanzare al prossimo gate reale**, oppure
  - marcare **BLOCKED con un blocker concreto**.
- I **test opzionali non sono default**: richiedono un **rischio nominato** per essere eseguiti.
- I **test non deterministici sono vietati come evidenza di PASS**.
- Il **PASS** deve basarsi su **output atteso deterministico**, **evidenza di hash/commit**, oppure **output runtime esplicitamente attestato dall'utente**.

Questa regola non sostituisce i gate di sicurezza (runtime, segreti, PM-34, workflow di produzione): li mantiene, ma vieta di moltiplicare documenti e pre-pass quando non c'è un blocco reale da rimuovere.

---

## 8. Comandi e convenzioni

### 8.1 Comandi Git minimi sempre validi

Da qualunque clone operativo:

```bash
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status --short
git log --oneline -5
```

Prima di modificare:

```bash
git fetch origin main
git pull --ff-only origin main
```

Solo se workspace pulito.

Prima di chiudere:

```bash
git diff --check
git status --short
git log --oneline -5
```

Commit sempre selettivo. Mai `git add .`.

**Post-push verification (obbligatoria dopo `git push origin main`):**

```bash
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
git ls-remote origin main
```

Il report finale Cursor deve contenere l'**output testuale verbatim** di questi comandi, non una tabella e non un riassunto. Un SUCCESS senza questi output **non** vale PASS.

**Handoff / post-push verification invariant (anti-regressione):**

- Dopo ogni task Cursor che fa commit/push, il **report finale Cursor** deve includere sempre l'output verbatim dei comandi post-push elencati sopra, **incluso** `git ls-remote origin main`.
- Il **PASS remoto** si chiude quando: `git rev-parse HEAD` = `git rev-parse origin/main` = hash da `git ls-remote origin main`; `git branch --show-current` = `main`; `git status --short` = workspace pulito.
- **Orchestratore (GPT):** se il report Cursor contiene già questi output completi e coerenti, **non** chiedere all'utente di rieseguire PowerShell o shell locale per verifica hash. Chiudere il PASS remoto **direttamente** dal report Cursor, da `docs/runtime/LAST_HANDOFF_VERIFY.md` (durante `aggio control`), e/o da `docs/runtime/LAST_CURSOR_REPORT.md` su GitHub.
- Se gli output post-push **mancano** o sono **incompleti/ambigui**, l'orchestratore **non** deve chiedere subito shell manuale all'utente: preparare prima un **prompt Cursor verify-only** (solo i comandi post-push, nessuna modifica file).
- **Shell manuale utente** = **fallback finale** soltanto: Cursor non disponibile; repo locale non accessibile da Cursor; output Cursor ancora ambiguo dopo retry verify-only.
- Ogni **handoff**, **prompt Cursor** e **report post-task** deve ricordare questa invariante. L'obiettivo low-touch: eliminare micro-interazioni meccaniche ripetute (es. chiedere `git ls-remote` all'utente dopo ogni `aggio control` quando Cursor ha già stampato l'output).

**Artefatto handoff verification (`docs/runtime/LAST_HANDOFF_VERIFY.md`):** snapshot persistente dell'ultimo stato remoto verificato, leggibile dall'orchestratore durante `aggio control` **prima** di escalare shell utente. Usa **`verified_through_commit`** (non auto-certifica il proprio commit; `artifact_commit: PENDING_SELF_REFERENCE` fino a backfill). `LAST_CURSOR_REPORT.md` resta il rolling report per task Cursor.

**Report rolling Cursor (obbligatorio dopo ogni push di task reale):** dopo il push del commit reale, Cursor deve catturare verbatim `git ls-remote origin main`, `git log --oneline -5` e `git status --short`, e scriverli in `docs/runtime/LAST_CURSOR_REPORT.md`. Il report registra il commit reale (commit 1). Il commit leggero che aggiorna solo il report (commit 2) **non** si ri-registra: `LATEST.real_task_commit` resta lo SHA del commit 1. I campi `rolling_report_commit` e `remote_hash_verbatim` del blocco LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente, e vengono backfillati con lo SHA del rispettivo commit-report quando il LATEST viene archiviato in HISTORY al task successivo. Non esiste un commit finalize-hash dedicato. Il report **non** sostituisce `git ls-remote`, ma rende persistente su GitHub l'evidenza dell'hash per handoff e verificatore.

### 8.2 Script npm

I comandi `npm run aggio`, `npm run checkpoint`, `npm run finito`, `npm run deploy` appartengono alla metodologia di altri repo solo se quel repo contiene effettivamente `package.json` e script corrispondenti. Nel `control-plane` non vanno assunti per default: verificare sempre il repository prima di usarli.

### 8.3 Convenzione chat del progetto

Ogni risposta operativa deve terminare con una riga finale:

- `NEXT: <prossimo step concreto>`
- `WAIT: <gate reale o input atteso>`
- `DONE: <chiuso, nessun next>`

`WAIT` generico è vietato. `NEXT` non deve proporre nuovi PM se non richiesti.

`docs/foundation/CURSOR_PROMPT_TEMPLATE.md` definisce il formato dei prompt Cursor: metadati di routing (mode/model/repo/branch) restano **fuori** dal corpo copiabile del prompt; comandi di ritorno umano (`aggio control`, `format`, ecc.) restano **fuori** del prompt copiabile.

I prompt Cursor/implementatore includono l'**aggiornamento locale sicuro del repo** nel corpo eseguibile (fetch, status, pull `--ff-only`, verifica hash remoto): l'umano **non** esegue fetch/pull/status di routine prima di ogni task, salvo gate diagnostici reali (workspace dirty, repo/branch errato, pull rifiutato, auth, conflitto, clone mancante).

---

## 9. Repository e ruoli

| Repo | Ruolo |
|---|---|
| `mrhz1973/control-plane` | Repo principale di orchestrazione, runtime docs, foundation, n8n state e direzione progetto |
| `mrhz1973/dev-method` | Repo metodo / AI-assisted development; repo osservato per flussi futuri |
| `mrhz1973/cursor-coordinate-converter` | Repo GIS / benchmark operativo; repo osservato per test e cicli reali |
| `mrhz1973/alina-lavoro` | Repo sorgente di molte regole architetturali e operative; fuori scope runtime del control-plane salvo richiesta esplicita |

Regola: non confondere finestre/repo. Prompt destinati a `CONTROL PLANE` non vanno mandati in `GIS`, `DEV` o `ALINA`.

---

## 10. Invarianti permanenti

- GitHub è fonte di verità.
- Nessun segreto in Git: token, OAuth material, PAT, webhook secret, URL con token.
- Eccezione chat_id (gate esplicito 2026-05-31): il chat_id Telegram è AMMESSO negli asset di configurazione del repo (workflow JSON e CSV seed in data-tables/). Il token Telegram e tutti gli altri segreti restano vietati. La redazione del chat_id nel corpo dei messaggi Telegram (DECISION_PACKET_FORMAT §6) resta invariata.
- Workflow `40` è produzione e non si modifica in silenzio.
- Workflow `41` è backup off e non si cancella in silenzio.
- PM-34 real worker resta bloccato finché non esiste una prova reale e un gate esplicito.
- `pm34_unblocked=false` e `n8n_ready=false` restano default sicuri finché non vengono cambiati da gate reale.
- **n8n non chiama provider API a pagamento per default** (sezione 7.5).
- Nessun deploy/tag/rollback senza decisione esplicita.
- Runtime, VPS, n8n UI/import/export, credenziali, OAuth e runner automatico sono gate reali.
- **Ogni componente automatico deve avere fallback graceful al manuale** (sezione 7.6).
- **Gate umani sono Decision Packet, non prose libere** (sezione 7.7).
- **Anti-burocrazia / momentum** (sezione 7.9): la sicurezza abilita il progresso; PREP PASS solo se rimuove un blocco reale; per una catena confinata, dopo 1 rehearsal di import/reimport + massimo 2 run manuali ripetuti si avanza al prossimo gate reale o si marca BLOCKED con blocker concreto; test opzionali solo con rischio nominato; test non deterministici vietati come PASS.
- `alina-lavoro` non viene toccato come app/runtime dal control-plane.

---

## 11. Handoff e saturazione contesto

Il progetto deve sopravvivere alla saturazione delle chat.

### 11.1 Politica attuale (priorità 1)

**Kill switch manuale.** Quando vedi che la chat degenera (proposte fuori contesto, ripetizioni, perdita di regole), scrivi `handoff ora`. L'orchestratore deve immediatamente scrivere il documento di handoff e chiudere il contesto senza avviare nuovi PM.

### 11.2 Politica attuale (priorità 2)

**Handoff automatico ogni N turni.** Default: ogni **20 prompt utente**, l'orchestratore produce un handoff e chiude la chat. Il prossimo prompt deve essere fatto in una nuova chat che parte da questo `PROJECT_VISION.md` + l'ultimo handoff.

### 11.3 Documento di handoff — contenuto minimo

Path canonico: `docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff.md`

Contenuto minimo:

- HEAD / hash remoto osservato tramite `git ls-remote origin main` (o equivalente);
- ultimo commit verificato su `main`;
- eventuale divergenza raw/hash come nota secondaria, **non** un FAIL se l'hash remoto conferma;
- stato reale del workflow/runtime;
- ultimo risultato utile;
- decisioni recenti non ancora consolidate;
- gate aperti reali;
- prossimo passo tattico, se già deciso;
- contatore turni (per la regola dei 20);
- riferimento a `PROJECT_VISION.md` come entry point della nuova chat;
- `docs/runtime/LAST_CURSOR_REPORT.md` se esiste, in particolare `LATEST.real_task_commit`;
- `docs/runtime/LAST_HANDOFF_VERIFY.md` se esiste, in particolare `verified_through_commit`;
- hash remoto da `git ls-remote origin main` diretto quando possibile;
- **mai** usare report incollati in chat come verifica primaria del PASS;
- **regola orchestratore:** se l'ultimo report Cursor include già l'output post-push verbatim completo (`§8.1`), **non** chiedere all'utente shell manuale; in assenza di output, prompt Cursor verify-only prima del fallback utente (`§8.1` Handoff / post-push verification invariant).

### 11.4 Backlog futuro — handoff via Ollama stimatore

Quando il loop sarà stabile, Ollama potrà essere usato per stimare i token consumati nella chat orchestratore e triggerare handoff automatico al **50%** del context window. Non implementato adesso. Sarà un componente runtime-gated dedicato.

---

## 12. Prossimi passi tattici verso la visione

Questa sezione contiene tattiche, non la visione. Possono cambiare senza cambiare l'architettura target.

**Completati (foundation):**

1. **Foundation v2.0** — entry point canonico (`PROJECT_VISION.md` + `FOUNDATION_STATUS.md`).
2. **Tailscale VPS ↔ PC Ryzen** — **COMPLETATO (PASS 2026-05-23)** — mesh privata operativa (`ubuntu` ↔ `asusdesktop`); ping privato bidirezionale; n8n resta su `127.0.0.1:5678`; nessuna porta pubblica / Funnel. Evidenza: [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md).
3. **Cursor Agent CLI preflight (Ryzen)** — **COMPLETATO (PASS 2026-05-25)** — install (`agent` / `cursor-agent`), login, models discovery, smoke `agent --mode plan` (Composer 2.5 Fast) lettura read-only di questo documento; workspace pulito; worker/`--force`/`--yolo` non usati. Evidenza: [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md). Gate write/agent-mode commit resta separato.
4. **Ollama classifier API smoke (Ryzen)** — **COMPLETATO (PASS 2026-05-25)** — `qwen3:14b`; API-only; multi-case low/medium/high. [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md).
5. **Classifier wrapper contract** — **COMPLETATO (design 2026-05-25)** — [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md). [session](../sessions/2026-05-25-control-plane-classifier-wrapper-contract-design.md).
6. **Local path preflight** — **COMPLETATO (read-only 2026-05-25)** — [session](../sessions/2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md).
7. **OpenClaw gateway loopback (manual)** — **COMPLETATO (PASS 2026-05-25)** — [session](../sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md).
8. **OpenClaw agent Step A liveness** — **BLOCKED (2026-05-25)** — read-only ping via gateway; agent `main` did not complete; pending scope + embedded fallback + OpenAI provider API key missing; **policy: no provider API key**. [session](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md).
9. **Diff-summary Telegram MVP workflow 42** — **COMPLETATO/ATTIVO (PASS 2026-05-27)** — target `cursor-coordinate-converter`, nuovo commit automatico `727db3e`, 1 Telegram, 0 duplicati. [session](../sessions/2026-05-27-control-plane-workflow-42-final-new-commit-automatic-pass.md).

**Prossimo passo tattico:**

**Codex CLI direct path** — real worker discovery/preflight docs+runtime-gated; no provider API key, no PM-34 unlock without proof and explicit gate.

**Backlog tattico:**

10. **Loop end-to-end manuale**: simulare il ciclo completo senza auto-esecuzione permanente.
11. **Loop automatico minimo**: solo dopo prove reali e confini chiari, collegare i pezzi per task low-risk.
12. **Dell fallback fase 2**: attivare il Dell come nodo always-on/fallback solo dopo che il loop sul Ryzen produce valore reale.

Nessun passo tattico crea automaticamente un nuovo PM o sblocca PM-34. Le attivazioni runtime restano gate espliciti.

---

## 13. Parte semplice — spiegazione non tecnica

Sto costruendo un piccolo **team automatico** di intelligenze artificiali per i miei progetti di programmazione.

Oggi, quando lavoro con AI, devo fare troppe cose a mano: spiegare il contesto da capo a ogni nuova chat, copiare prompt da uno strumento all'altro, controllare GitHub per capire cosa è cambiato, decidere ogni volta chi deve fare il prossimo passo, incollare istruzioni, verificare il risultato e ricominciare.

Il sistema che voglio costruire toglie via questa fatica meccanica:

1. **GitHub** (un servizio online gratuito dove tengo tutto il mio codice, come un Google Drive per programmatori) registra cosa è cambiato. Salvare un pezzo nuovo si chiama **commit**.

2. **n8n** (un servizio che gira 24/7 sul mio server online, automatizza flussi di lavoro) si accorge del cambiamento e avvia il flusso.

3. **Codex** (è ChatGPT 5.5 di OpenAI, ci accedo con il mio abbonamento ChatGPT Plus che pago già) ragiona sul prossimo passo da fare.

4. **Ollama** (un'AI gratuita che gira tutta sul mio computer di casa, illimitata) controlla se quel passo è sicuro o rischioso.

5. **Cursor** (un'AI specializzata nello scrivere codice, abbonamento mensile fisso) esegue il lavoro tecnico.

6. **Telegram** mi chiama solo se serve una decisione vera, con una scelta strutturata di 2-3 opzioni numerate: rispondo con un numero, non con prosa.

7. Il risultato torna su GitHub e il ciclo riparte.

### Perché tre AI invece di una sola?

Tecnicamente potrei usare una sola AI grande, ma costerebbe di più e funzionerebbe peggio. Ognuna è specializzata:

* **Codex/GPT** ragiona benissimo ma è lenta e ha un limite di messaggi al giorno. La uso solo dove serve vero cervello: decidere il prossimo passo.

* **Ollama** gira sul mio computer di casa, gratis e illimitata. Non è furba come GPT, ma è perfetta per il controllo rapido "questa cosa è rischiosa o no?".

* **Cursor** è specializzata nel programmare, abbonamento fisso, può lavorare quanto vuole senza farmi pagare di più.

Mettere tutto su una sola AI sarebbe come avere un meccanico che fa anche da contabile e da architetto: lo può fare, ma fa peggio tutti e tre i lavori e mi costa di più.

### Cosa NON sto facendo

* **Non pago AI "a uso"**: tutto passa per abbonamenti fissi che ho già (ChatGPT Plus, Cursor Pro Plus). Evito le "API a consumo" dove paghi ogni richiesta e i costi esplodono.

* **Non espongo il mio computer a internet**: tutto passa per una rete privata cifrata (Tailscale, un tunnel sicuro tra il mio server e casa). Il mio computer non è raggiungibile da estranei.

* **Non sostituisco il mio cervello**: io decido la rotta e le cose critiche. Le AI fanno il lavoro ripetitivo e tecnico.

* **Non rischio di perdere lavoro**: se qualcosa si rompe, il sistema torna automaticamente al lavoro manuale e tutto resta su GitHub. Niente va perso.

### A che punto sono adesso

Ho passato molti mesi a costruire le fondamenta. Tutti i pezzi singoli funzionano: la rete privata è attiva, le tre AI sono installate e collaudate, gli abbonamenti girano senza pagare API a consumo, e il primo "ponte" tra le AI è stato testato su un compito reale.

La prima cosa utile è già arrivata: quando faccio un cambiamento, mi arriva su Telegram un riassunto in italiano di cosa è cambiato. Sembra poco, ma è la prima azione manuale che il sistema mi ha tolto: non devo più aprire GitHub solo per capire cos'è successo.

Ho anche eseguito per la prima volta il giro completo su un caso reale, con me a fare da filo tra i passaggi: è arrivata una richiesta vera (migliorare la documentazione di un mio progetto), Codex ha ragionato sul da farsi e ha deciso che stavolta serviva intervenire, e Cursor ha scritto la modifica. È andato a buon fine. Era un giro manuale-supervisionato: ogni passaggio l'ho innescato io. Il giro che si avvia da solo, senza che io faccia da filo, è la tappa successiva. (In un altro caso, Codex ha invece deciso correttamente che non serviva toccare nulla: anche saper dire "non serve fare niente" è parte del valore.)

### Dove voglio arrivare, in quattro tappe

1. **Oggi**: i pezzi funzionano, ma li collego a mano io. Il sistema mi avvisa e mi assiste, ma il filo conduttore sono io.

2. **Prossima tappa**: il giro completo (cambiamento → Codex ragiona → Ollama controlla → Cursor esegue) gira con me come supervisore, ma con molte meno azioni manuali ripetute.

3. **Più avanti**: per i compiti semplici e sicuri, il sistema procede da solo dentro confini chiari; mi chiama su Telegram solo per le decisioni vere.

4. **In futuro**: un secondo computer sempre acceso fa da riserva, e il sistema continua a lavorare anche quando io non ci sono.

Vado una tappa alla volta, senza saltare passaggi: ogni automazione nuova entra solo dopo che ho la prova che funziona e che è sicura.

### Perché vale la pena

Senza questo sistema, ogni ora di lavoro reale costa mezz'ora di amministrazione meccanica: ricaricare il contesto, copiare prompt, controllare a mano. Con questo sistema, scrivo bene le regole una volta sola e poi non le rifaccio più: le AI sanno già chi sono, cosa voglio e come lavoro.

E c'è di più: questa stessa fondazione, una volta funzionante, posso copiarla su un progetto nuovo cambiando solo i dettagli.

In una frase: **sto costruendo una fabbrica, non un singolo prodotto.** La fabbrica produce piccoli sistemi di assistenza AI riutilizzabili per progetti software. Il primo che esce dalla fabbrica sono io, su questo progetto. I prossimi potranno essere altri.

---

## 14. Backlog futuro non vincolante

- Dell Latitude come nodo always-on completo.
- Routing inter-macchina n8n: Ryzen primario, Dell fallback, Telegram se offline.
- Livello 3 di memoria: embeddings/indice locale via Ollama.
- Handoff automatico quando il contesto chat è saturo (Ollama come stimatore al 50%).
- Decision Packet Format esteso (13 campi) in documento separato dedicato.
- ARCHITECTURE.md separato con specifiche hardware complete.
- Report qualità post-task e metriche su tempo risparmiato.
- Miglioramento della sintesi commit/diff Telegram con classifier locale o Codex quando utile.
- OpenClaw come transport/browser bridge opzionale confinato, non model path target.
- Triangolo ruoli AI operativo (chiarimento non vincolante): **Claude** = consigliere strategico / reviewer esterno (non implementatore, non worker n8n); **ChatGPT** = orchestratore-B / interfaccia principale con l'utente; **Codex CLI** = orchestratore-A target nel loop locale (ephemeral, ragionamento read-only; non worker automatico finché non gated esplicitamente).

---

## 15. Changelog

| Versione | Data | Modifiche |
|---|---|---|
| 1.0 | 2026-05-25 | Prima foundation. Architettura target Codex+Ollama+Cursor+Tailscale, livelli 0/1/2/3 e A/B/C, decisioni 23 maggio. |
| 2.0 | 2026-05-25 | Integrato Decision Packet (sezione 7.7), fallback graceful (sezione 7.6), n8n no provider APIs (sezione 7.5), tabella micro-interazioni eliminate (sezione 1.1). Spostati dettagli hardware Dell/Ryzen completi a futuro `ARCHITECTURE.md`. Parte semplice arricchita con menzione Decision Packet e fallback. |
| 2.1 | 2026-05-27 | Marcato Diff-summary Telegram MVP come ATTIVO dopo workflow 42 PASS su nuovo commit automatico senza duplicati. |
| 2.2 | 2026-05-27 | Riallineata architettura target a Codex CLI diretto via OAuth ChatGPT Plus; OpenClaw resta transport/backlog opzionale. Corretto header versione dopo v2.1 e spostato Diff-summary Telegram MVP nei completati tattici. |
| 2.3 | 2026-05-29 | Aggiunta in §7.1 guardia retry/accesso accanto a SUCCESS testuale != PASS (operativa, non componente). |
| 2.4 | 2026-05-29 | Aggiunta regola verifica hash remoto: PASS post-Cursor sull'hash remoto di `main`, raw GitHub secondario (può essere stale); §8.1 blocco post-push verification; §11.3 handoff con hash remoto; report post-push verbatim. |
| 2.5 | 2026-05-29 | Introdotto `docs/runtime/LAST_CURSOR_REPORT.md` come report rolling post-push. §8.1: cattura verbatim ls-remote, log, status nel report. §11.3: handoff/verificatore leggono hash dal report remoto o da git ls-remote, non dalla chat. |
| 2.6 | 2026-05-29 | Aggiunto `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`: contratto formato prompt Cursor; metadati routing fuori dal corpo copiabile. §8.3 puntatore. |
| 2.7 | 2026-05-29 | §8.3: preflight implementatore con aggiornamento locale sicuro nel prompt Cursor; comandi ritorno umano fuori dal prompt copiabile. Allineato `CURSOR_PROMPT_TEMPLATE.md`. |
| 2.8 | 2026-05-30 | Riscritta §13 (parte semplice) per riflettere lo stato reale: foundation completata, workflow 42 attivo, prima catena wf42 → Codex → Cursor eseguita in modalità manuale/supervisionata (PASS, commit d040896 su repo GIS); catena automatizzata senza filo umano resta tappa successiva. Roadmap a 4 tappe, framing "fabbrica non prodotto". Nessun cambiamento di visione o invariante. |
| 2.9 | 2026-05-31 | Aggiunta §7.9 anti-burocrazia / momentum e relativo invariante in §10: PREP PASS solo se rimuove un blocco reale; per catena confinata, dopo 1 rehearsal import/reimport + max 2 run manuali ripetuti avanzare al prossimo gate reale o marcare BLOCKED con blocker concreto; test opzionali solo con rischio nominato; test non deterministici vietati come PASS; PASS su output deterministico / hash-commit / runtime attestato dall'utente. Eccezione chat_id invariata. |

| 2.10 | 2026-06-02 | §8.1: chiarito che rolling_report_commit/remote_hash_verbatim del LATEST restano PENDING_SELF_REFERENCE e si backfillano all'archiviazione in HISTORY; nessun commit finalize-hash dedicato. Allinea PROJECT_VISION alla pratica già in uso. |
| 2.11 | 2026-06-07 | §8.1: invariante handoff/post-push verification anti-regressione — Cursor stampa output git verbatim; orchestratore non chiede shell utente se output presente; verify-only Cursor prima del fallback manuale. §11.3: puntatore orchestratore. |
| 2.12 | 2026-06-07 | §8.1 / §11.3: introdotto `docs/runtime/LAST_HANDOFF_VERIFY.md` — artefatto handoff/`aggio control` con `verified_through_commit`; `LAST_CURSOR_REPORT.md` resta rolling task report. |
| 2.13 | 2026-06-12 | §1.1: D-0032-W manual one-shot verifier result uploader field-validated; invocazione canonica con bypass PowerShell solo di processo documentata; PM-34 resta BLOCKED; `n8n_ready=false`; nessuno schedule/loop. |

---

**Fine documento.**

_Convenzione: aggiornare questo documento solo quando cambia la visione o un invariante fondativo. Non usarlo come session log. Aggiungere riga al changelog (sezione 15) a ogni revisione significativa._
