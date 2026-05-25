# PROJECT VISION — Foundation

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/PROJECT_VISION.md`  
**Versione:** 2.0 — 2026-05-25  
**Versione precedente:** 1.0 — 2026-05-25 (sostituita)  
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
| Diff summary Telegram (futuro) | Apertura GitHub per leggere cosa è cambiato | NON ATTIVO |
| Codex via OpenClaw | Pensare manualmente il prossimo prompt | NON ATTIVO |
| Ollama classifier | Decidere manualmente se un task è sicuro | NON ATTIVO |
| Cursor CLI | Copiare/incollare il prompt nell'IDE | NON ATTIVO |
| Auto-aggio (futuro) | Scrivere `aggio` per ogni completamento | NON ATTIVO |
| Decision Packet su Telegram | Decidere a prosa libera, in modo ambiguo | NON ATTIVO |
| Handoff via N turni | Capire manualmente quando una chat satura | NON ATTIVO |

Ogni nuovo componente che si propone deve aggiungere una riga a questa tabella.

---

## 2. Architettura target completa

Componenti con ruoli rigidi. Nessun componente deve assorbire silenziosamente il ruolo di un altro.

| Componente | Ruolo target | Dove gira / vive |
|---|---|---|
| **GitHub** | Source of truth: codice, piani, documenti, stato verificabile | Cloud |
| **n8n** | Control-plane operativo: scheduler, polling/webhook, gate, Telegram I/O, stato, routing esterno | VPS IONOS |
| **Codex via OpenClaw** | Orchestratore operativo: legge contesto e genera il prossimo prompt strutturato | PC Ryzen casa, via OpenClaw confinato |
| **Ollama** | Classifier / risk scorer / prompt compressor locale. Non implementa codice | PC Ryzen primario; Dell fallback futuro |
| **Cursor CLI** | Implementatore: esegue task, modifica file, valida, committa e pusha | PC Ryzen fase 1; Dell futuro per job headless |
| **Telegram** | Canale umano: notifica, gate, escalation e Decision Packet | Bot dedicato gestito da n8n |
| **Tailscale** | Trasporto privato VPS ↔ nodo locale | Rete cifrata e autenticata |

### Confine importante

Questa foundation descrive la **visione target aggiornata** del progetto `control-plane`: Codex assume il ruolo di orchestratore tattico, Cursor quello di implementatore, Ollama quello di classificatore. Alcuni documenti precedenti descrivevano Codex come implementer futuro o OpenClaw come bridge strettamente passivo; tali documenti restano utili come storico e sicurezza, ma questa foundation prevale come destinazione architetturale.

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
| **OpenClaw** | Install/onboard e probe locali PASS; non integrato come worker reale |
| **Codex OAuth/CLI** | Login/setup verificati in track PM-30/33; worker non abilitato |
| **Ollama classifier (Ryzen)** | **PASS** (2026-05-25) — `qwen3:14b` classifier locale **solo** via API Ollama (`think=false`, `format=json`); multi-case low/medium/high OK; **`ollama run` non idoneo**; non produzione n8n / non loop Tailscale. [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
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
- OpenClaw confinato su loopback locale;
- Codex via OAuth ChatGPT Plus, senza provider API key a consumo;
- Cursor CLI per esecuzione task;
- Tailscale per raggiungibilità privata da n8n.

Se il Ryzen è offline, n8n non deve inventare esecuzione: deve applicare il principio di **fallback graceful** (vedi sezione 7.6) e degradare a Telegram gate o modalità manuale.

### 4.3 Dell Latitude 5430 — nodo always-on/fallback futuro

Ruolo futuro: nodo always-on a basso consumo, fallback Ollama leggero, OpenClaw bridge confinato, Cursor CLI job worker. Non attivato in fase 1.

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
[5] OpenClaw/Codex legge il contesto e genera il prossimo prompt operativo
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

Quando il loop ha bisogno di "intelligenza AI", il flusso è: n8n → (via Tailscale) → nodo locale (Ollama / OpenClaw+Codex) → ritorno

Mai:
n8n → API OpenAI pagata → ritorno

L'uso di API pagate richiede un gate manuale esplicito e una decisione di costo registrata. Per default tutto passa per modelli locali (Ollama) o per OAuth ChatGPT Plus (Codex via OpenClaw).

### 7.6 Fallback graceful

Invariante architetturale derivato dal low-touch loop.

**Principio:** se un componente automatico fallisce, il loop torna sempre alla modalità manuale-supervisionata (livello A) senza perdita di stato. GitHub è la safety net — tutto è recuperabile dai commit.

Esempi pratici:

- Se Ollama classifier non risponde → il task non viene auto-promosso a low-risk; default safe = Telegram gate manuale.
- Se Tailscale è down → n8n non può raggiungere il nodo locale; default safe = Telegram all'utente "loop runtime offline, gestisci manualmente".
- Se Codex via OpenClaw esaurisce quota o errori OAuth → default safe = ChatGPT in modalità manuale dall'utente.
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

### 8.2 Script npm

I comandi `npm run aggio`, `npm run checkpoint`, `npm run finito`, `npm run deploy` appartengono alla metodologia di altri repo solo se quel repo contiene effettivamente `package.json` e script corrispondenti. Nel `control-plane` non vanno assunti per default: verificare sempre il repository prima di usarli.

### 8.3 Convenzione chat del progetto

Ogni risposta operativa deve terminare con una riga finale:

- `NEXT: <prossimo step concreto>`
- `WAIT: <gate reale o input atteso>`
- `DONE: <chiuso, nessun next>`

`WAIT` generico è vietato. `NEXT` non deve proporre nuovi PM se non richiesti.

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
- Nessun segreto in Git: token, chat_id, OAuth material, PAT, webhook secret, URL con token.
- Workflow `40` è produzione e non si modifica in silenzio.
- Workflow `41` è backup off e non si cancella in silenzio.
- PM-34 real worker resta bloccato finché non esiste una prova reale e un gate esplicito.
- `pm34_unblocked=false` e `n8n_ready=false` restano default sicuri finché non vengono cambiati da gate reale.
- **n8n non chiama provider API a pagamento per default** (sezione 7.5).
- Nessun deploy/tag/rollback senza decisione esplicita.
- Runtime, VPS, n8n UI/import/export, credenziali, OAuth e runner automatico sono gate reali.
- **Ogni componente automatico deve avere fallback graceful al manuale** (sezione 7.6).
- **Gate umani sono Decision Packet, non prose libere** (sezione 7.7).
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

- HEAD GitHub osservato;
- stato reale del workflow/runtime;
- ultimo risultato utile;
- decisioni recenti non ancora consolidate;
- gate aperti reali;
- prossimo passo tattico, se già deciso;
- contatore turni (per la regola dei 20);
- riferimento a `PROJECT_VISION.md` come entry point della nuova chat.

### 11.4 Backlog futuro — handoff via Ollama stimatore

Quando il loop sarà stabile, Ollama potrà essere usato per stimare i token consumati nella chat orchestratore e triggerare handoff automatico al **50%** del context window. Non implementato adesso. Sarà un componente runtime-gated dedicato.

---

## 12. Prossimi passi tattici verso la visione

Questa sezione contiene tattiche, non la visione. Possono cambiare senza cambiare l'architettura target.

**Completati (foundation):**

1. **Foundation v2.0** — entry point canonico (`PROJECT_VISION.md` + `FOUNDATION_STATUS.md`).
2. **Tailscale VPS ↔ PC Ryzen** — **COMPLETATO (PASS 2026-05-23)** — mesh privata operativa (`ubuntu` ↔ `asusdesktop`); ping privato bidirezionale; n8n resta su `127.0.0.1:5678`; nessuna porta pubblica / Funnel. Evidenza: [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md).
3. **Cursor Agent CLI preflight (Ryzen)** — **COMPLETATO (PASS 2026-05-25)** — install (`agent` / `cursor-agent`), login, models discovery, smoke `agent --mode plan` (Composer 2.5 Fast) lettura read-only di questo documento; workspace pulito; worker/`--force`/`--yolo` non usati. Evidenza: [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md). Gate write/agent-mode commit resta separato.
4. **Ollama classifier API smoke (Ryzen)** — **COMPLETATO (PASS 2026-05-25)** — `qwen3:14b` (Ollama `0.24.0`); classifier affidabile **solo** via API locale con `think=false` + `format=json`; multi-case low/medium/high; **`ollama run` escluso**. Evidenza: [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md). Non implica n8n, Tailscale da n8n, né PM-34 sbloccato.

**Prossimo passo tattico:**

5. **Classifier wrapper — design/contract minimale (docs-only)** — contratto JSON input/output, validazione JSON, fallback safe-to-human-gate; **nessuna** chiamata n8n runtime né automazione loop ancora.

**Backlog tattico:**

6. **OpenClaw ↔ Codex ↔ Ollama ↔ Cursor locale** (dopo wrapper contract): verificare il passaggio controllato del prompt sul nodo Ryzen, prima manuale poi automatizzabile.
7. **Diff-summary Telegram MVP** (opzionale, prima tattica utile): quando arriva un commit su `dev-method` o `cursor-coordinate-converter`, n8n legge il diff e manda un riepilogo italiano 2–3 righe su Telegram. Primo prodotto utile, non la visione completa.
8. **Loop end-to-end manuale**: simulare il ciclo completo senza auto-esecuzione permanente.
9. **Loop automatico minimo**: solo dopo prove reali e confini chiari, collegare i pezzi per task low-risk.
10. **Dell fallback fase 2**: attivare il Dell come nodo always-on/fallback solo dopo che il loop sul Ryzen produce valore reale.

Nessun passo tattico crea automaticamente un nuovo PM o sblocca PM-34. Le attivazioni runtime restano gate espliciti.

---

## 13. Parte semplice — spiegazione non tecnica

Sto costruendo un piccolo **team automatico** per i miei progetti.

Oggi, quando lavoro con AI, devo fare troppe cose a mano: spiegare il contesto, copiare prompt, controllare GitHub, decidere chi deve fare il prossimo passo, incollare istruzioni in un altro strumento, verificare il risultato e ricominciare.

Il sistema che voglio costruire fa questo:

1. **GitHub** (un servizio online gratuito dove tengo tutto il mio codice, una specie di Google Drive ma fatto apposta per programmatori) registra cosa è cambiato. L'azione di "salvare un pezzo nuovo" si chiama **commit** (un'istantanea del lavoro con un piccolo messaggio che descrive cosa ho cambiato).

2. **n8n** (un servizio che gira 24/7 sul mio server di internet, automatizza flussi di lavoro) vede il cambiamento e avvia il flusso.

3. **Codex** (un'AI orchestratore, è GPT-5.5 di OpenAI che chiamo attraverso il mio abbonamento ChatGPT Plus che pago già) ragiona sul prossimo passo.

4. **Ollama** (un'AI gratuita che gira tutta sul mio computer di casa, gratuita e illimitata) controlla se quel passo è sicuro o rischioso.

5. **Cursor** (un'AI specializzata nello scrivere codice, abbonamento mensile fisso) esegue il lavoro tecnico.

6. **Telegram** mi chiama solo se serve una decisione vera. Quando mi chiama, mi manda una scelta strutturata (Decision Packet) con 2-3 opzioni numerate: io rispondo con un numero, non con prosa.

7. Il risultato torna su GitHub e il ciclo riparte.

### Perché tre AI invece di una sola?

Domanda giusta. Tecnicamente si potrebbe fare con una sola AI grande, ma costerebbe di più e funzionerebbe peggio. Ogni AI è brava in cose diverse:

- **Codex/GPT** costa tempo e quota di abbonamento ogni volta che la chiamo. È bravissima a ragionare, ma è lenta e ha un limite di messaggi al giorno. La uso solo per il pezzo dove serve "cervello vero": decidere il prossimo passo.

- **Ollama** è un'AI che gira sul mio computer di casa, gratis, illimitata, velocissima. Non è furba come GPT, ma è perfetta per il lavoro semplice di "guarda questa proposta e dimmi se è rischiosa". È come avere un controllo qualità che dice OK/non OK prima che il lavoro vero parta.

- **Cursor** è specializzato nello scrivere codice. Ha un abbonamento mensile fisso e può lavorare quanto vuole senza farmi pagare di più. Se gli chiedo di scrivere codice, lo fa molto meglio di GPT generale.

Mettere tutto su una sola AI sarebbe come avere un meccanico che fa anche da contabile e da architetto: lo può fare, ma fa peggio tutti e tre i lavori, e mi costa di più.

### Cosa non sto facendo

- **Non pago API a uso**: tutto passa attraverso abbonamenti che ho già (ChatGPT Plus, Cursor Pro Plus). API significa "il modo a pagamento di parlare con un'AI dai propri programmi, dove paghi ogni richiesta". Io lo evito usando solo i miei abbonamenti mensili a costo fisso.

- **Non espongo il mio computer a internet**: tutto passa per una rete privata cifrata (**Tailscale** — una specie di tunnel cifrato tra il mio server e il mio computer di casa, così possono parlarsi senza esporre niente su internet). Il mio computer di casa non è raggiungibile da estranei.

- **Non sostituisco il mio cervello**: io decido la rotta e le cose critiche. Le AI fanno solo il lavoro ripetitivo e tecnico.

- **Non rischio di perdere lavoro**: se qualcosa si rompe (Ollama non risponde, internet salta, Tailscale ha problemi), il sistema torna automaticamente al lavoro manuale, e tutto quello che ho fatto resta su GitHub. Niente va perso.

### Cosa serve per partire

- Un VPS (un server affittato online — ne ho già uno) per ospitare n8n.
- Un computer a casa (PC Ryzen, ne ho già uno), collegato al VPS via Tailscale.
- Abbonamento Cursor Pro Plus ($65/mese) e ChatGPT Plus ($20/mese), che ho già.
- Pazienza per scrivere bene le regole una volta, e poi non rifarle più ogni volta. Questo documento serve a questo.

### Perché vale la pena

Perché senza questo, ogni volta che apro una nuova chat con un'AI devo ri-spiegare tutto da capo. Con questo, le AI sanno già chi sono, cosa voglio, come lavoro. Diventa un team che continua il lavoro anche quando io non ci sono. E può essere riutilizzato per progetti nuovi copiando questa stessa foundation.

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

---

## 15. Changelog

| Versione | Data | Modifiche |
|---|---|---|
| 1.0 | 2026-05-25 | Prima foundation. Architettura target Codex+Ollama+Cursor+Tailscale, livelli 0/1/2/3 e A/B/C, decisioni 23 maggio. |
| 2.0 | 2026-05-25 | Integrato Decision Packet (sezione 7.7), fallback graceful (sezione 7.6), n8n no provider APIs (sezione 7.5), tabella micro-interazioni eliminate (sezione 1.1). Spostati dettagli hardware Dell/Ryzen completi a futuro `ARCHITECTURE.md`. Parte semplice arricchita con menzione Decision Packet e fallback. |

---

**Fine documento.**

_Convenzione: aggiornare questo documento solo quando cambia la visione o un invariante fondativo. Non usarlo come session log. Aggiungere riga al changelog (sezione 15) a ogni revisione significativa._
