# PROJECT VISION — Foundation

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/PROJECT_VISION.md`  
**Versione:** 1.0 — 2026-05-25  
**Lingua:** Italiano  
**Ruolo del documento:** entry point canonico del progetto control-plane. Da leggere all'inizio di ogni sessione umana o AI prima di interpretare PM, handoff, session log o decisioni locali.

---

## 0. Cos'è questo progetto in una frase

`control-plane` è il sistema personale che deve trasformare il lavoro AI-assisted da una sequenza manuale di chat, prompt, copia/incolla e controlli a un loop semi-autonomo: GitHub resta la fonte di verità, n8n osserva e governa, Codex ragiona sul prossimo passo, Ollama classifica il rischio, Cursor implementa, Telegram chiede intervento umano solo quando serve.

La destinazione non è una singola notifica Telegram e non è un singolo PM: la destinazione è un **team AI locale e confinato** che lavora su repository selezionati con costi prevedibili, senza provider API key a consumo e con gate umani sulle operazioni realmente rischiose.

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

> Quante micro-interazioni umane elimina questo componente?

Un componente che non riduce tempo, ambiguità, errori ripetuti, token o lavoro manuale non appartiene alla strada critica del progetto.

---

## 2. Architettura target completa

Componenti con ruoli rigidi. Nessun componente deve assorbire silenziosamente il ruolo di un altro.

| Componente | Ruolo target | Dove gira / vive |
|---|---|---|
| **GitHub** | Source of truth: codice, piani, documenti, stato verificabile | Cloud |
| **n8n** | Control-plane operativo: scheduler, polling/webhook, gate, Telegram I/O, stato, routing esterno | VPS IONOS |
| **Codex via OpenClaw** | Orchestratore operativo/tattico: legge contesto e genera il prossimo prompt strutturato | PC Ryzen casa, via OpenClaw confinato |
| **Ollama** | Classifier / router / risk scorer / prompt compressor locale. Non implementa codice | PC Ryzen primario; Dell fallback futuro |
| **Cursor CLI** | Implementatore: esegue task, modifica file, valida, committa e pusha | PC Ryzen fase 1; Dell futuro per job headless |
| **Telegram** | Canale umano: notifica, gate, escalation e decisioni brevi | Bot dedicato gestito da n8n |
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
| **Ollama classifier** | Dry-run / design; non produzione n8n |
| **Cursor CLI headless** | Da verificare operativamente per il loop target |
| **Tailscale VPS ↔ casa** | Da installare/configurare per il loop target |

Regola: non confondere documento di visione con runtime già attivo. La visione può descrivere la destinazione, ma ogni attivazione reale resta verificabile da GitHub, n8n e output Telegram.

---

## 4. Le macchine

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

Hardware noto:

- AMD Ryzen 9 3900X;
- NVIDIA RTX 3060 12 GB;
- 32 GB RAM;
- Windows.

Ruolo target fase 1:

- Ollama primario con modello classifier più ricco (`qwen3:14b` o equivalente sostenibile);
- OpenClaw confinato su loopback locale;
- Codex via OAuth ChatGPT/subscription, senza provider API key a consumo;
- Cursor CLI per esecuzione task;
- Tailscale per raggiungibilità privata da n8n.

Se il Ryzen è offline, n8n non deve inventare esecuzione: deve degradare a Telegram gate o modalità manuale.

### 4.3 Dell Latitude 5430 — nodo always-on/fallback futuro

Hardware noto:

- Dell Latitude 5430;
- Intel Core i7-1185G7, 4 core / 8 thread;
- 16 GB RAM;
- 500 GB SSD;
- Intel Iris Xe;
- Windows 11 64 bit;
- batteria integrata utile come UPS naturale.

Ruolo futuro:

- nodo always-on a basso consumo;
- fallback Ollama leggero (`llama3.2:3b`, possibile escalation a `qwen3:7b` se sufficiente);
- OpenClaw bridge confinato;
- Cursor CLI job worker su workspace isolato;
- Tailscale e SSH controllato.

Il Dell non sostituisce n8n: resta nodo esecutivo/fallback, non control-plane.

### 4.4 PC lavoro

Il PC lavoro è macchina operativa umana, non nodo produzione del loop. È da trattare con cautela:

- può servire per docs-only, controllo GitHub e lavoro supervisionato;
- non deve diventare nodo runtime automatico;
- non deve ospitare OpenClaw/Ollama in produzione;
- non deve ricevere prompt destinati a `GIS`, `DEV` o altri repo quando il flusso è `CONTROL PLANE`.

---

## 5. Loop target fase 1

Il loop target è il seguente.

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
[7B] Se medium/high/ambiguo: Telegram gate all'utente
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
- **Telegram** non è archivio: è interfaccia decisionale umana.
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
| **medium** | Modifiche codice/config/workflow non distruttive ma significative | Telegram gate o human review secondo soglia |
| **high** | Deploy, rollback, secrets, OAuth, billing, destructive ops, force push, dati sensibili | Sempre gate umano esplicito |

---

## 7. Regole operative ereditate dai documenti reali

Queste regole derivano dalla metodologia consolidata e vanno portate nel control-plane.

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

### 7.5 Docs ROI Gate

Ogni nuovo documento deve ridurre almeno una di queste cose: token, tempo utente, ambiguità, errori ripetuti, lavoro manuale futuro. Altrimenti è burocrazia.

`PROJECT_VISION.md` supera il gate perché evita di ricostruire la destinazione del progetto da decine di session log e PM.

---

## 8. Comandi e convenzioni

Questa sezione non deve inventare script non presenti nel repo `control-plane`.

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
- Nessun provider API key a consumo per default.
- Nessun deploy/tag/rollback senza decisione esplicita.
- Runtime, VPS, n8n UI/import/export, credenziali, OAuth e runner automatico sono gate reali.
- `alina-lavoro` non viene toccato come app/runtime dal control-plane.

---

## 11. Handoff e saturazione contesto

Il progetto deve sopravvivere alla saturazione delle chat.

### 11.1 Regola manuale

Quando la chat degenera o perde il filo, l'utente può scrivere `handoff ora`. L'orchestratore deve produrre un handoff compatto e chiudere il contesto senza avviare nuovi PM.

### 11.2 Contenuto minimo handoff

Un handoff utile deve contenere:

- HEAD GitHub osservato;
- stato reale del workflow/runtime;
- ultimo risultato utile;
- decisioni recenti non ancora consolidate;
- gate aperti reali;
- prossimo passo tattico, se già deciso;
- riferimento a questo documento come entry point.

### 11.3 Futuro Livello 3

Quando il loop sarà stabile, Ollama/embeddings potranno aiutare a stimare saturazione contesto e generare handoff. Questo resta runtime-gated e non appartiene alla prima chiusura della vision.

---

## 12. Prossimi passi tattici verso la visione

Questa sezione contiene tattiche, non la visione. Possono cambiare senza cambiare l'architettura target.

1. **Consolidare questa foundation**: questo documento diventa entry point canonico.
2. **Tailscale VPS ↔ PC Ryzen**: installare/configurare e verificare ping privato. Nessuna esposizione pubblica del nodo locale.
3. **Cursor CLI preflight**: verificare se Cursor CLI può ricevere un prompt, eseguire un task confinato, validare, committare e pushare.
4. **Ollama classifier sul Ryzen**: installare/validare modello locale e schema decision JSON per rischio/route/approval.
5. **OpenClaw ↔ Codex ↔ Ollama ↔ Cursor locale**: verificare il passaggio controllato del prompt sul nodo Ryzen, prima manuale poi automatizzabile.
6. **Diff-summary Telegram MVP**: tattica utile e vicina al valore reale. Quando arriva un commit su `dev-method` o `cursor-coordinate-converter`, n8n legge il diff e manda un riepilogo italiano 2–3 righe su Telegram. Questo è un primo prodotto utile, non la visione completa.
7. **Loop end-to-end manuale**: simulare il ciclo completo senza auto-esecuzione permanente.
8. **Loop automatico minimo**: solo dopo prove reali e confini chiari, collegare i pezzi per task low-risk.
9. **Dell fallback fase 2**: attivare il Dell come nodo always-on/fallback solo dopo che il loop sul Ryzen produce valore reale.

Nessun passo tattico crea automaticamente un nuovo PM o sblocca PM-34. Le attivazioni runtime restano gate espliciti.

---

## 13. Parte semplice — spiegazione non tecnica

Sto costruendo un piccolo team automatico per i miei progetti.

Oggi, quando lavoro con AI, devo fare troppe cose a mano: spiegare il contesto, copiare prompt, controllare GitHub, decidere chi deve fare il prossimo passo, incollare istruzioni in un altro strumento, verificare il risultato e ricominciare.

Il sistema che voglio costruire fa questo:

1. GitHub registra cosa è cambiato.
2. n8n vede il cambiamento e avvia il flusso.
3. Codex ragiona sul prossimo passo.
4. Ollama controlla se quel passo è sicuro o rischioso.
5. Cursor esegue il lavoro tecnico.
6. Telegram mi chiama solo se serve una decisione vera.
7. Il risultato torna su GitHub e il ciclo riparte.

Perché più strumenti invece di uno solo?

- Codex/GPT è bravo a ragionare.
- Ollama è locale, gratis e utile per classificare rischio e contesto.
- Cursor è specializzato nel modificare codice.
- n8n è affidabile per schedulare, notificare e collegare sistemi.
- GitHub è la memoria permanente.

Non voglio pagare API a consumo. Non voglio esporre il PC di casa su Internet. Non voglio perdere il controllo sulle operazioni critiche. Voglio togliere di mezzo il lavoro ripetitivo.

---

## 14. Backlog futuro non vincolante

- Dell Latitude come nodo always-on completo.
- Routing inter-macchina n8n: Ryzen primario, Dell fallback, Telegram se offline.
- Livello 3: embeddings/indice locale via Ollama.
- Handoff automatico quando il contesto chat è saturo.
- Report qualità post-task e metriche su tempo risparmiato.
- Miglioramento della sintesi commit/diff Telegram con classifier locale o Codex quando utile.

---

**Fine documento.**

_Convenzione: aggiornare questo documento solo quando cambia la visione o un invariante fondativo. Non usarlo come session log._
