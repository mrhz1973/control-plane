# PROJECT VISION — Foundation

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/PROJECT_VISION.md`  
**Versione:** **3.0 — 2026-08-25**  
**Versione precedente:** 2.19 — 2026-07-18  
**Stato:** foundation target accettata; runtime separatamente gated  
**Ruolo:** entry point canonico del progetto. Leggere prima di interpretare documenti storici, PM, session log o vecchi diagrammi.

> La v3 consolida il nuovo modello multi-planner + Cursor bounded loop accettato dall'operatore il 2026-08-25. La v2.19 resta recuperabile nella Git history; la v3 non autorizza implicitamente PM-34, L5, schedule permanenti, loop permanenti o modifiche runtime.

---

## 0. Il progetto in una frase

`control-plane` è un sistema personale di sviluppo AI-assisted in cui **GPT Web governa strategia e backlog, GitHub conserva la verità, n8n governa workflow e gate, OpenClaw fa da broker di provider/auth/quota, Codex/GLM/Qwen generano Execution Packet, Cursor implementa in loop task-bounded, Bugbot verifica e Telegram interviene solo sui gate reali**.

Obiettivo: eliminare micro-interazioni meccaniche senza concentrare tutto il consumo su un solo modello o abbonamento e senza perdere controllo sulle azioni rischiose.

---

## 1. Fonti canoniche e ordine di lettura

### 1.1 Source of truth

**GitHub è la source of truth.** Nessun agente deve ricostruire lo stato reale da memoria conversazionale quando il repository può essere letto.

### 1.2 Read-set operativo di una nuova sessione

Ordine minimo:

1. `docs/runtime/CURRENT_FRONTIER.md` — stato runtime autorevole;
2. `docs/foundation/PROJECT_VISION.md` — foundation corrente;
3. `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` — dettaglio del nuovo modello operativo;
4. contratto specifico del lavoro (`Backlog Item`, `Execution Packet`, `Execution Checkpoint`, routing);
5. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` quando l'esecutore è Cursor;
6. `docs/runtime/LAST_CURSOR_REPORT.md` e `docs/runtime/LAST_HANDOFF_VERIFY.md` quando pertinenti;
7. ultimo handoff/checkpoint del task;
8. documenti storici solo se realmente necessari.

Non leggere decine di session log per default.

### 1.3 Stato runtime

`PROJECT_VISION.md` descrive **architettura e invarianti**, non deve duplicare uno snapshot runtime destinato a diventare stale.

Lo stato reale — PM-34, L5, workflow attivi/inattivi, schedule, autorizzazioni, ultimo gate — vive in `docs/runtime/CURRENT_FRONTIER.md`.

Questa revisione v3 è **docs/design only** e non modifica da sola alcuno di quei valori.

---

## 2. Architettura target v3

```text
                        OPERATORE
                           │
                           ▼
                    GPT WEB PLUS
              STRATEGIC ORCHESTRATOR
                           │
                  Backlog Item
                           │
                           ▼
                        GitHub
                  SOURCE OF TRUTH
                           │
                           ▼
                          n8n
               WORKFLOW / POLICY / GATES
                           │
                           ▼
                       OpenClaw
              PROVIDER / AUTH / QUOTA BROKER
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
      Qwen 3.8 37B      GLM 5.3        Codex
         locale          API/piano       OAuth
             │             │             │
             └─────────────┼─────────────┘
                           │
                 PLANNER SELEZIONATO
                           │
                           ▼
                   Execution Packet
                           │
                           ▼
                  n8n deterministic gate
                    /             \
             AUTO-ELIGIBLE      TELEGRAM
                  │               GATE
                  ▼                │
             ╔══════════╗◄─────────┘ after approval
             ║  CURSOR  ║
             ║ EXECUTION║
             ║   LOOP   ║
             ╚════╤═════╝
                  │
        ┌─────────┼─────────┐
        │         │         │
   Cursor native  GLM      advisor tools
      models      BYOK     Codex / Qwen
        │         │         │
        └─────────┼─────────┘
                  │
               tests
                  │
                  ▼
               Bugbot
                  │
            ┌─────┴─────┐
            │           │
          PASS         ISSUE
            │           │
            ▼           └──► Cursor bounded loop
          GitHub
```

**Tailscale** resta il trasporto privato VPS ↔ nodo locale quando il runtime lo richiede.

---

## 3. Ruoli canonici

### 3.1 GPT Web — strategic orchestrator / backlog owner

GPT Web resta l'interfaccia principale con l'operatore e l'orchestratore strategico.

Responsabilità:

- leggere GitHub vivo prima di fidarsi della memoria chat;
- governare direzione, priorità e backlog;
- creare il **Backlog Item** con objective, scope, acceptance, rischio/complessità e planner preference;
- mantenere le invarianti foundation;
- preparare Decision Packet per i gate veri;
- essere autore autorevole dei workflow n8n e delle istruzioni UI/runtime n8n secondo §9;
- non essere obbligato a produrre ogni dettaglio del prompt operativo Cursor.

GPT Web decide **cosa** deve entrare nel processo. Il planner selezionato traduce quel contratto in un Execution Packet.

### 3.2 GitHub — memoria persistente e audit

GitHub conserva almeno:

- backlog;
- decisioni;
- foundation/policy;
- planner selection/fallback evidence;
- Execution Packet;
- Execution Checkpoint;
- risultati test/review;
- commit/diff;
- handoff;
- stato autorevole.

Una singola chat, una sessione planner o una context window Cursor devono essere sostituibili.

### 3.3 n8n — workflow engine / deterministic policy gate

n8n:

- osserva eventi;
- deduplica;
- legge stato/backlog;
- chiama il broker/provider path autorizzato;
- applica policy deterministiche;
- decide `CURSOR_LOOP` vs `TELEGRAM_GATE`;
- conserva/coordina stato operativo;
- non diventa il planner LLM.

Le hard policy hanno precedenza sul giudizio di qualsiasi modello.

### 3.4 OpenClaw — provider/auth/quota broker

OpenClaw entra nella strada target come **broker**, non come strategic orchestrator e non come implementatore.

Ruolo:

- adapter provider;
- autenticazione;
- Codex OAuth quando verificato nel runtime reale;
- GLM/Z.AI quando configurato;
- accesso al modello locale quando configurato;
- disponibilità/rate-limit/usage state quando esposti;
- failover tecnico **solo** entro la policy autorizzata;
- interfaccia comune per planner e futuri advisor Cursor.

OpenClaw non deve inventare silenziosamente la strategia del progetto.

### 3.5 Planner pool — Codex / GLM / Qwen

Il planner selezionato trasforma un `Backlog Item` in un `Execution Packet`.

#### Codex OAuth

Preferenza tipica:

- architettura;
- debugging difficile;
- reasoning ad alto valore;
- task complessi;
- advisor senior.

Target auth: subscription/OAuth dove supportato e verificato; nessuna assunzione che Codex OAuth sia un modello nativo del picker Cursor.

#### GLM 5.3

Preferenza tipica:

- planning medio/ordinario;
- overflow Codex;
- review/second opinion;
- implementazione dentro Cursor tramite BYOK/API quando la configurazione reale lo supporta.

GLM non è più fondativamente limitato al solo ruolo read-only della v2.19: nella v3 può essere **planner** e, dopo verifica, **motore di implementazione Cursor**. I gate di scrittura restano definiti dal ruolo executor/Execution Packet, non dal nome del modello.

#### Qwen 3.8 37B locale

Preferenza tipica:

- planner locale senza consumo provider;
- task semplici/medi quando adeguato;
- generazione Execution Packet;
- advisor/reviewer locale nello stesso job quando è già caricato.

Qwen 3.8 37B **non è un router daemon obbligatorio** e non deve restare residente 24/7 solo per scegliere Codex vs GLM. Può essere caricato per il job e scaricato quando serve restituire RAM/VRAM a Cursor e al sistema.

Non viene introdotto un secondo modello locale piccolo obbligatorio nella strada principale.

### 3.6 Cursor — execution harness

Cursor è il centro dell'esecuzione tecnica.

Riceve un **Execution Packet** già delimitato e può usare:

- Agent;
- `/goal` / `/loop` o equivalente verificato nella versione installata;
- subagent;
- terminale/filesystem;
- test;
- Git;
- tool/MCP autorizzati;
- modelli Cursor;
- GLM BYOK dove verificato;
- advisor Codex/Qwen tramite tool esterni dove verificato.

Il loop Cursor è **task-bounded**. Cursor non riceve autonomia generale sul progetto.

### 3.7 Bugbot — reviewer

Bugbot è reviewer/quality gate, non router e non strategic orchestrator.

Target:

```text
Cursor → tests → Bugbot
                 ├─ PASS → GitHub
                 └─ ISSUE → Cursor bounded fix loop
```

Autofix cloud non è default. Il numero di review/fix round deve essere limitato; default iniziale di design: `max_review_rounds = 3`, poi escalation.

### 3.8 Telegram — human gate

Telegram è interfaccia decisionale, non archivio.

Interviene per gate reali, inclusi:

- distruttivo/irreversibile;
- scope expansion;
- produzione/deploy/runtime sensibile;
- auth/credential/billing;
- rischio alto;
- fallback non equivalente;
- policy violation;
- loop/review non convergente;
- ambiguità/confidence insufficiente secondo policy.

### 3.9 Operatore umano

L'operatore è il decisore finale sui gate. Una decisione operatore è valida solo quando deriva da un suo messaggio diretto/azione esplicita, non da una raccomandazione incollata di un advisor.

---

## 4. Oggetti di lavoro persistenti

### 4.1 Backlog Item

Contratto strategico scritto da GPT Web.

Canonico: `docs/contracts/backlog-item-v1.md`.

Non è il prompt Cursor completo.

### 4.2 Planner Selection

La selezione combina:

1. preferenza semantica indicata da GPT Web nel Backlog Item;
2. disponibilità/quota/resource state osservabile;
3. fallback policy deterministica.

Canonico: `docs/contracts/planner-routing-policy-v1.md`.

Non serve un LLM separato solo per routing.

### 4.3 Execution Packet

Il planner effettivo produce il task operativo completo per Cursor.

Canonico: `docs/contracts/execution-packet-v1.md`.

Il planner non auto-autorizza il proprio packet: n8n/policy decide se può entrare nel Cursor loop o deve essere gated.

### 4.4 Execution Checkpoint

Stato persistente di un job Cursor incompleto.

Canonico: `docs/contracts/execution-checkpoint-v1.md`.

Permette il rollover di context window senza usare la vecchia chat come memoria.

---

## 5. Planner routing e utilizzo dei pool

Principio economico: **massimizzare il lavoro mensile distribuendo il carico sui pool già disponibili senza degradare silenziosamente la qualità**.

### 5.1 Preferenze indicative

```text
low/simple      → Qwen / GLM / Codex secondo backlog + risorse
medium          → GLM / Codex; Qwen quando considerato adeguato
high/complex    → Codex / equivalente GLM / gate
```

La preferenza reale viene scritta nel Backlog Item da GPT Web.

### 5.2 Quota state

Il runtime futuro può distinguere concettualmente:

```text
healthy
conserve
exhausted
unknown
```

Le soglie numeriche non sono canonizzate in foundation: vanno calibrate con evidenza reale prima dell'attivazione.

### 5.3 Fallback

- low risk: fallback ordinato consentito se il Backlog Item lo permette;
- medium: fallback equivalente o gate;
- high: nessuna degradazione silenziosa; equivalente verificato oppure gate.

Ogni fallback registra planner richiesto, planner usato e motivo.

---

## 6. Cursor execution loop e consumo

### 6.1 Principio

Cursor conserva il proprio harness anche quando il modello di inferenza non è un modello Cursor.

Target prioritario da verificare:

```text
Cursor harness
    + GLM 5.3 BYOK
    + bounded /goal /loop
```

Questo permette di usare terminale, edit, test, Git e subagent Cursor scaricando parte dell'inferenza sul pool GLM.

### 6.2 Modelli Cursor

Restano disponibili per task/subagent dove danno vantaggio concreto.

Non devono essere usati per forza per ogni micro-step se GLM BYOK è adeguato e verificato.

### 6.3 Codex/Qwen advisor

Track separato:

```text
Cursor → tool/MCP/CLI → OpenClaw → Codex OAuth
Cursor → tool/local API → Qwen 3.8 37B
```

Queste capacità sono target, non claimed attive finché non esiste smoke/evidence dedicata.

### 6.4 Loop bounds

Ogni Execution Packet deve definire:

- goal singolo;
- allowed/forbidden scope;
- stop conditions;
- validation/acceptance;
- max round;
- review limit;
- escalation;
- checkpoint policy.

Loop infinito vietato.

---

## 7. Context window, handoff e nuove sessioni

Questa è un'invariante architetturale.

### 7.1 Principio

**La memoria del progetto vive su GitHub, non nella context window.**

Ogni attore deve poter essere sostituito da una nuova sessione senza perdere task, HEAD, scope, acceptance, test, findings, gate e next action.

### 7.2 GPT Web rollover

- `handoff ora` = kill switch manuale;
- **20 prompt utente = hard ceiling storico**, non obiettivo da raggiungere;
- handoff anticipato se compaiono ripetizioni, perdita di vincoli, confusione di repo/HEAD o crescita eccessiva del contesto;
- mantenere sempre margine sufficiente per produrre un handoff completo;
- nuova chat legge il repo vivo.

Path handoff resta:

`docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff.md`

Usare `docs/foundation/HANDOFF_TEMPLATE.md`.

### 7.3 Planner rollover

Codex/GLM/Qwen sono per default sessioni task-oriented.

Una nuova planner session legge:

1. Backlog Item;
2. policy/foundation necessarie;
3. stato repo/diff pertinente;
4. packet/checkpoint precedente se il task è già iniziato.

Non richiede la cronologia completa del planner precedente.

### 7.4 Cursor rollover

Prima di chiudere una sessione Cursor incompleta deve essere scritto un Execution Checkpoint.

Nuova sessione:

```text
Execution Packet
+ latest Execution Checkpoint
+ live Git state
→ continue from next_action
```

Se Git live contraddice il checkpoint, Git live vince e la divergenza viene riportata.

### 7.5 Handoff quality

Un handoff/checkpoint è incompleto se una nuova sessione deve chiedere:

- a che punto eravamo?;
- quale commit?;
- quali file?;
- quali test sono passati/falliti?;
- quali findings restano?;
- qual è il prossimo passo concreto?.

---

## 8. Hard policy e gate

### 8.1 Aggressive autonomy controllata

Per azioni recuperabili già autorizzate dall'Execution Packet, l'implementatore deve eseguire senza conferme meccaniche ripetitive.

Fermarsi/escalare per almeno:

- `git reset`, `git clean`, `git push --force`;
- distruttivo/cancellazioni non autorizzate;
- segreti/credenziali/OAuth/billing mutation;
- deploy/tag/rollback non autorizzati;
- runtime n8n/VPS non autorizzato;
- scope drift;
- conflitto non risolvibile;
- dati personali/sistemi esterni fuori scope;
- permanent schedule/loop non autorizzato.

### 8.2 Runtime boundary

La foundation v3 **non modifica automaticamente**:

- PM-34;
- `n8n_ready`;
- L5 status;
- activation/runtime/endurance authorization;
- permanent Schedule;
- permanent loop;
- workflow produzione;
- webhook pubblico / Telegram Trigger;
- credenziali;
- provider runtime config.

Valori correnti: leggere `CURRENT_FRONTIER.md`.

### 8.3 Repository policy storica preservata

- repo `control-plane` dichiarato non-confidenziale secondo decisioni precedenti;
- controllo compensativo: rotazione credenziali a fine progetto secondo `docs/ROTATION_CHECKLIST.md`;
- redazione dei materiali prima di condivisione/commit resta responsabilità operatore secondo la policy consolidata precedente;
- tailnet identifiers e chat_id mantengono le tolleranze già deliberate;
- `alina-lavoro` non viene toccato come app/runtime dal control-plane salvo scope esplicito futuro.

### 8.4 Workflow storici

- workflow `40` è produzione e non viene mutato in silenzio;
- workflow `41` è backup/off secondo stato storico e non viene cancellato in silenzio;
- ogni stato corrente di altri workflow si legge dal frontier, non da questo file.

---

## 9. Authoring n8n — boundary permanente

GPT Web/GPT-B resta autore autorevole degli artefatti workflow n8n e delle istruzioni UI/runtime n8n.

Cursor **non** deve autonomamente:

- inventare/progettare workflow JSON;
- cambiare topologia/nodi/expression/Code node;
- scegliere schedule/trigger;
- cambiare Activate/Publish;
- inferire dettagli workflow mancanti;
- migliorare semanticamente un workflow fornito.

Cursor può toccare `workflows/**` solo con autorizzazione esplicita:

`PERSIST VERBATIM GPT-B-SUPPLIED WORKFLOW ARTIFACT`

e artefatto/patch/hash completo fornito da GPT Web.

In quel caso Cursor può persistere verbatim, validare sintassi/path, riportare diff e fare Git; non ridisegna la logica.

Inconsistenza → `BLOCKED_WORKFLOW_AUTHORING_RESERVED_TO_GPT_B`.

L'operatore esegue le azioni UI n8n supervisionate quando necessarie.

---

## 10. n8n / provider boundary

n8n è workflow/control plane, non endpoint AI a consumo diretto.

Target v3:

```text
n8n → Tailscale/local broker → OpenClaw → provider selezionato
```

Non:

```text
n8n → provider API arbitrario/in-line senza broker/policy → risultato
```

L'uso runtime di GLM/Codex/Qwen attraverso il broker deve essere coerente con il routing policy e con le autorizzazioni/costi già approvati. Questa foundation definisce il target ma non attiva nuove chiamate runtime.

---

## 11. Git verification e PASS

Un `SUCCESS` testuale non equivale a PASS.

### 11.1 Preflight minimo implementatore

```bash
git fetch --prune origin
git status --short
git branch --show-current
git remote -v
git pull --ff-only origin main
git ls-remote origin main
git rev-parse HEAD
git rev-parse origin/main
```

Workspace dirty inatteso, repo/branch errato, pull/auth/conflict = gate diagnostico reale.

### 11.2 Post-push evidence

```bash
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
git ls-remote origin main
```

PASS remoto richiede coerenza di HEAD/origin/remote, branch corretto, workspace pulito e test/acceptance richiesti.

Il report finale Cursor deve includere output verbatim secondo `CURSOR_PROMPT_TEMPLATE.md`.

Se l'output è completo, GPT Web non chiede all'operatore di ripetere shell manualmente.

Se manca, prima `verify-only` Cursor; shell manuale utente è fallback finale.

### 11.3 Checkpoint != PASS

Execution Checkpoint e handoff registrano stato osservato, ma non auto-certificano il proprio commit né sostituiscono l'evidenza finale.

---

## 12. Fallback graceful

Se un componente fallisce, il sistema deve degradare a modalità manuale-supervisionata senza perdere stato.

Esempi:

- planner preferred unavailable → fallback consentito dalla policy oppure Telegram;
- OpenClaw unavailable → manual/provider path gated, senza inventare esecuzione;
- Qwen non caricabile/resource pressure alto → altro planner se policy consente;
- Codex quota/auth unavailable → GLM/Qwen equivalente o gate;
- GLM unavailable → Codex/Qwen secondo policy;
- Cursor fallisce/non converge → checkpoint + gate/manual;
- Bugbot review non converge → Telegram;
- Tailscale down → nodo locale offline, ritorno manuale;
- n8n down → GitHub conserva stato e recovery.

Niente deve dipendere da stato che esiste solo in RAM/chat.

---

## 13. Decision Packet e provenienza decisioni

I gate umani sono Decision Packet strutturati, non domande vaghe.

Regole:

- 2–5 opzioni numerate;
- raccomandazione esplicita;
- rischio principale;
- cosa resta fermo senza decisione;
- risposta operatore corta;
- Telegram come canale target quando il runtime è attivo.

**Anti-proxy:** raccomandazioni di Codex/GLM/Qwen/Bugbot/Claude o testo incollato non sono una decisione dell'operatore. Una scelta operativa nasce solo da un messaggio/azione diretta dell'operatore.

---

## 14. Livelli operativi e rischio

### 14.1 Automazione

| Livello | Nome | Descrizione |
|---|---|---|
| A | Manuale-supervisionata | baseline sicura; operatore/orchestratore guida |
| B | Low-touch | sistema elimina copia/incolla/triage meccanico; gate reali all'utente |
| C | Semi-autonomo confinato | task low-risk avanzano entro packet/policy; Telegram sui gate |

Target: arrivare prima a un **B utile**, poi estendere in modo evidence-driven.

### 14.2 Rischio

| Rischio | Azione target |
|---|---|
| low | può essere auto-eligible se tutte le policy consentono |
| medium | packet/policy decide; fallback solo adeguato; gate quando richiesto |
| high | human gate / autorizzazione esplicita; no silent degradation |

---

## 15. Anti-burocrazia / token efficiency

Un componente/documento deve ridurre almeno uno tra:

- token;
- tempo utente;
- ambiguità;
- errori ripetuti;
- lavoro manuale futuro.

Regole:

- non creare nuovi documenti quando un contratto esistente può essere aggiornato;
- preferire entry point compatti + riferimenti;
- PREP solo se rimuove un blocker concreto;
- test opzionali solo con rischio nominato;
- test non deterministici non valgono come evidence di PASS;
- una catena confinata non deve moltiplicare pre-pass senza nuovo rischio reale.

La v3 riduce il vecchio `PROJECT_VISION` usando contratti separati e Git history anziché duplicare tutta la storia in ogni context window.

---

## 16. Routing workspace Cursor

Identificare Cursor con:

- repository full name;
- path locale quando necessario;
- branch;
- task ID.

Colori/etichette UI non sono canonici.

---

## 17. Migrazione v3

Backlog autorevole della migrazione: **GitHub issue #8 — `Architecture migration — multi-planner → Cursor bounded loop`**.

Documento dettagliato: `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`.

Ordine generale:

1. foundation/contratti docs-only;
2. verifiche provider/broker reali;
3. smoke planner read-only;
4. GLM inside Cursor verification;
5. bounded Cursor loop smoke;
6. Bugbot review smoke;
7. checkpoint/rollover smoke;
8. solo dopo evidence, eventuali modifiche n8n/OpenClaw runtime tramite gate separati.

Questa sezione **non** sblocca runtime.

---

## 18. Convenzione operativa chat

Ogni risposta operativa del progetto termina con una riga:

- `NEXT: <prossimo step concreto>`
- `WAIT: <gate reale>`
- `DONE: <chiuso>`

`WAIT` generico è vietato.

Comandi utente consolidati:

- `vai` / `procedi` / `next` → continuare fino al prossimo gate reale;
- `aggio X` → leggere/verificare X, riferire, indicare NEXT;
- `vai X` → leggere/verificare X e procedere nello scope senza pausa artificiale;
- `handoff ora` → scrivere/persistire handoff e chiudere il contesto corrente.

---

## 19. Claim boundary v3

### Claimed

- GPT Web = strategic orchestrator/backlog owner;
- GitHub = source of truth;
- OpenClaw = target provider/auth/quota broker;
- planner pool = Qwen 3.8 37B / GLM 5.3 / Codex OAuth;
- planner produce Execution Packet;
- n8n policy gate dopo il planner;
- Cursor = target execution harness con bounded loop;
- GLM BYOK dentro Cursor = track prioritario da verificare;
- Codex/Qwen advisor Cursor = track da verificare;
- Bugbot = reviewer, non router;
- context rollover + Execution Checkpoint = requisito fondativo;
- contratti v1 di backlog/routing/packet/checkpoint = foundation design.

### Non claimed

- provider OpenClaw runtime già configurati/verificati nella versione corrente;
- quota thresholds già calibrate;
- Qwen planner smoke PASS;
- GLM planner smoke PASS;
- Codex planner smoke PASS nel nuovo broker path;
- GLM custom subagent Cursor PASS;
- Codex OAuth selezionabile nativamente in Cursor;
- Cursor bounded loop production-ready;
- Bugbot runtime integrato;
- n8n modificato per v3;
- PM-34/L5/schedule/permanent loop autorizzati.

---

## 20. Changelog

| Versione | Data | Modifica |
|---|---|---|
| 2.19 | 2026-07-18 | Ultima foundation v2: GPT-B n8n authoring, Cursor implementer, Codex→Ollama→Cursor target. |
| **3.0** | **2026-08-25** | Nuovo target accettato: GPT Web backlog → n8n → OpenClaw broker → Qwen/GLM/Codex planner → Execution Packet → n8n gate → Cursor bounded loop → Bugbot → GitHub. GLM può diventare planner/executor via BYOK dopo verifica. Qwen 3.8 37B è planner locale, non router obbligatorio. Context rollover/checkpoint formalizzato; dettagli spostati in operating model e contratti v1. Runtime invariants/gate preservati. |

Per la storia completa v1–v2.19 usare Git history del file; non duplicarla nella context window corrente.

---

**Fine documento.**

_Convenzione: modificare PROJECT_VISION solo quando cambia la visione o un'invariante fondativa. Stato runtime e cronologia operativa restano fuori da questo file._
