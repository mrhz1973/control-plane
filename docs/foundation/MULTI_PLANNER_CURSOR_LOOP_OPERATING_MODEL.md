# MULTI-PLANNER CURSOR LOOP — Operating Model

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`  
**Stato:** `ACCEPTED_TARGET_DESIGN — PLANNING/DOCS ONLY`  
**Decisione operatore:** 2026-08-25 — proposta accettata direttamente dall'operatore  
**Runtime autorizzato da questo documento:** **NO**  
**PM-34 / L5 / permanent schedule:** **INVARIATI E NON AUTORIZZATI**  

---

## 0. Scopo

Questo documento registra la nuova modalità di lavoro accettata per l'evoluzione del `control-plane`.

La modifica centrale rispetto alla foundation precedente è la separazione netta tra:

1. **orchestrazione strategica del progetto**;
2. **generazione del prompt operativo / Execution Packet**;
3. **broker dei provider e delle quote**;
4. **esecuzione agentica in loop**;
5. **review e gate umano**;
6. **memoria persistente e rollover delle finestre di contesto**.

Questo documento descrive la **direzione architetturale accettata**. Non abilita worker, schedule, endurance runtime, PM-34, L5, workflow n8n nuovi o modifiche runtime.

Lo stato runtime autorevole resta `docs/runtime/CURRENT_FRONTIER.md`.

---

## 1. Principio guida

Il sistema non deve concentrare tutto il lavoro in un solo abbonamento/modello.

Deve invece usare in modo coordinato i panieri già disponibili:

- ChatGPT Web Plus per orchestrazione strategica e backlog;
- Codex autenticato via ChatGPT/OAuth per planning/reasoning quando scelto;
- GLM 5.3 via API/piano già disponibile per planning e, dove supportato, implementazione dentro Cursor;
- Qwen 3.8 37B locale come planner/orchestratore gratuito quando il task lo giustifica;
- modelli Cursor per implementazione e subagent quando economicamente/concretamente opportuno;
- Bugbot per review, non per routing.

Obiettivo economico: **massimizzare il lavoro mensile usando più pool indipendenti, senza bruciare inutilmente il pool Cursor o il pool Codex**.

---

## 2. Architettura target accettata

```text
                        OPERATORE
                           │
                           ▼
                    GPT WEB PLUS
              STRATEGIC ORCHESTRATOR
                           │
               crea/aggiorna backlog
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
                   EXECUTION PACKET
                           │
                           ▼
                      n8n POLICY
                    /            \
             AUTO-ELIGIBLE       GATE
                  │               │
                  │            Telegram
                  ▼               │
             ╔══════════╗         │
             ║  CURSOR  ║◄────────┘ after approval
             ║ EXECUTION║
             ║   LOOP   ║
             ╚════╤═════╝
                  │
        ┌─────────┼─────────┐
        │         │         │
    Cursor      GLM       advisor tools
    models      BYOK      Codex / Qwen
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

---

## 3. Ruoli canonici

### 3.1 GPT Web — strategic orchestrator

GPT Web resta l'orchestratore human-facing e strategico del progetto.

Responsabilità:

- leggere il repository vivo prima di ricostruire lo stato dalla memoria chat;
- mantenere la direzione generale;
- creare e prioritizzare il backlog su GitHub;
- definire objective, scope, rischio, acceptance criteria e preferenza planner;
- preparare Decision Packet quando serve una vera decisione umana;
- governare la documentazione foundation e l'authoring n8n secondo le invarianti esistenti;
- non essere obbligato a produrre ogni dettaglio del prompt Cursor.

GPT Web produce principalmente un **Backlog Item**. Il prompt operativo dettagliato destinato a Cursor viene generato dal planner scelto.

### 3.2 GitHub — source of truth

GitHub conserva:

- backlog;
- decisioni;
- stato;
- Execution Packet;
- checkpoint di esecuzione;
- risultati;
- evidenza Git/test/review;
- handoff e context rollover.

Nessun agente deve dipendere esclusivamente dalla memoria della propria chat/sessione.

### 3.3 n8n — workflow engine e policy gate

n8n:

- osserva eventi;
- legge backlog/stato;
- applica regole deterministiche;
- invoca il provider broker;
- decide se un packet è auto-eligible o deve andare a Telegram;
- persiste stato operativo;
- non diventa LLM planner.

La decisione finale `CURSOR_LOOP` vs `TELEGRAM_GATE` deve essere deterministica/policy-driven. Il planner può raccomandare il rischio, ma non può auto-autorizzare operazioni che richiedono gate.

### 3.4 OpenClaw — provider/auth/quota broker

OpenClaw non è il strategic orchestrator e non è il coding executor.

Ruolo target:

- autenticazione/provider adapter;
- accesso Codex OAuth quando supportato;
- accesso GLM/Z.AI;
- accesso a modello locale quando configurato;
- osservazione disponibilità/rate-limit/quota quando esposta dal provider;
- failover tecnico autorizzato dalla policy;
- endpoint/tool comune verso i planner/advisor.

OpenClaw **non deve inventare silenziosamente la strategia del progetto**.

### 3.5 Planner pool — Codex / GLM / Qwen

I tre planner/orchestratori tattici trasformano un Backlog Item in un **Execution Packet**.

#### Codex

Uso preferito:

- task complessi;
- debugging difficile;
- architettura;
- reasoning di alto valore;
- secondo parere senior.

L'accesso target resta subscription/OAuth quando tecnicamente disponibile e verificato, non OpenAI API billing di default.

#### GLM 5.3

Uso preferito:

- planning ordinario/medio;
- overflow Codex;
- review/second opinion;
- implementazione dentro Cursor via BYOK/API già disponibile, quando compatibile con l'harness Cursor.

#### Qwen 3.8 37B locale

Uso preferito:

- planner gratuito locale;
- task semplici o medi quando la qualità è sufficiente;
- generazione Execution Packet;
- eventuale advisor/reviewer mentre il modello è già caricato;
- fallback quando gli altri pool devono essere preservati e il rischio consente l'uso locale.

Qwen 3.8 37B **non viene tenuto obbligatoriamente residente 24/7**. Può essere caricato per il job e scaricato al termine per liberare RAM/VRAM.

Non viene introdotto un secondo Qwen piccolo esclusivamente come router nella strada principale.

### 3.6 Cursor — execution harness e loop

Cursor diventa il **centro dell'esecuzione**, non il planner strategico.

Riceve un Execution Packet già strutturato e usa:

- Agent;
- `/goal` / `/loop` o meccanismo equivalente disponibile nella versione installata;
- subagent;
- terminale;
- filesystem;
- test;
- Git;
- tool/MCP autorizzati;
- GLM BYOK quando utile per scaricare consumo dai modelli Cursor.

Cursor può usare modelli propri o GLM come motore di implementazione in base alla configurazione verificata.

Codex OAuth non viene considerato selezionabile nativamente nel model picker Cursor finché questa capacità non viene verificata ufficialmente nel runtime reale. Codex può comunque essere esposto a Cursor come advisor/tool esterno tramite OpenClaw/CLI/MCP in una fase successiva.

### 3.7 Bugbot — reviewer, non router

Bugbot serve come quality gate:

```text
Cursor implementation
    ↓
tests
    ↓
Bugbot review
    ↓
PASS → GitHub
ISSUE → ritorno a Cursor
```

Default target:

- review sì;
- Autofix cloud **non** automatico;
- massimo numero di review/fix round configurabile;
- default proposto: `max_rounds = 3`;
- se non converge → Telegram gate / escalation.

Bugbot non seleziona Codex/GLM/Qwen.

### 3.8 Telegram — human gate

Telegram interviene solo per:

- operazioni irreversibili/distruttive;
- scope expansion;
- produzione/deploy/runtime sensibile;
- auth/credential/billing;
- rischio alto;
- planner non disponibile senza fallback equivalente;
- confidence insufficiente;
- review loop non convergente;
- violazione di una policy.

---

## 4. Dove nasce il task

### 4.1 Backlog Item — scritto dall'orchestratore GPT Web

Il Backlog Item è il contratto strategico. Non deve essere il prompt Cursor completo.

Schema minimo target:

```yaml
id: D-NNNN-X
title: <short title>
repository: owner/repo
objective: <desired outcome>
scope:
  allowed_areas: []
  forbidden_areas: []
risk_hint: low|medium|high
complexity_hint: low|medium|high
planner:
  preferred: qwen|glm|codex
  fallback: []
  fallback_policy: normal|equivalent_or_gate|gate_only
execution:
  target: cursor
  loop_allowed: true|false
acceptance: []
human_gate_required_if: []
context_refs: []
```

GPT Web può assegnare `planner.preferred` già in fase di backlog. In questo modo non serve un modello separato dedicato esclusivamente al routing semantico.

### 4.2 Planner selection

La selezione usa due sorgenti:

1. **semantic preference** dal backlog (`planner.preferred`);
2. **availability/quota policy** da OpenClaw/provider state.

Esempio deterministico:

```text
preferred = Codex
Codex available e quota sopra soglia? → Codex
no → fallback equivalente GLM se consentito
no → Qwen se rischio/policy consentono
no → Telegram gate
```

Per high-risk:

```text
preferred unavailable
→ NO silent degradation
→ equivalent planner oppure Telegram
```

### 4.3 Execution Packet — scritto dal planner

Il planner selezionato produce il vero task esecutivo per Cursor.

Schema minimo:

```yaml
task_id: D-NNNN-X
planner_used: codex|glm|qwen
executor: cursor
goal: <single bounded goal>
preflight: []
allowed_paths: []
forbidden_paths: []
steps: []
validation: []
acceptance: []
loop:
  enabled: true|false
  stop_when: []
  max_rounds: <bounded>
risk_assessment:
  level: low|medium|high
  reasons: []
gate_recommendation:
  required: true|false
  reason: <text>
context_checkpoint_policy: required
final_report_contract: <reference to canonical Cursor report rules>
```

L'Execution Packet viene persistito su GitHub o in un artefatto GitHub-referenziato prima dell'esecuzione automatica, così è recuperabile da una nuova sessione.

---

## 5. Gate dopo il planner

Il planner **non auto-autorizza** il proprio packet.

n8n applica policy deterministica.

Esempio:

```text
risk == high                         → TELEGRAM
scope_expansion == true              → TELEGRAM
destructive == true                  → TELEGRAM
production/runtime sensitive == true → TELEGRAM
credentials/billing == true          → TELEGRAM
confidence below threshold           → TELEGRAM
policy violation                     → TELEGRAM
otherwise                            → CURSOR
```

Le policy hard hanno precedenza sul giudizio del modello.

---

## 6. Cursor execution loop

Il loop Cursor è **task-bounded**, non un'autonomia generale sul progetto.

Pattern:

```text
Execution Packet
      ↓
Cursor preflight
      ↓
/goal = acceptance criteria
      ↓
implement
      ↓
test
   ┌──┴──┐
 FAIL   PASS
  │       │
 fix      ▼
  └──── Bugbot/review
          │
       ┌──┴──┐
      ISSUE  PASS
       │      │
       └────► loop
              │
             DONE
```

Il loop deve avere almeno:

- scope delimitato;
- stop condition esplicita;
- limite di round o altra protezione da loop infinito;
- escalation su scope drift;
- checkpoint persistente;
- nessuna operazione high-risk implicita.

---

## 7. Uso dei modelli dentro Cursor

### 7.1 GLM inside Cursor

Poiché GLM 5.3 è già disponibile tramite API/BYOK nell'ambiente Cursor dell'operatore, il target è verificare e sfruttare:

- GLM come main Agent model;
- GLM come custom subagent model, se supportato nella versione installata;
- loop Cursor mantenuto dall'harness Cursor ma inferenza pagata/consumata sul pool GLM.

Questo è uno dei principali strumenti per aumentare autonomia senza esaurire rapidamente il pool Cursor.

### 7.2 Cursor native models

Restano disponibili per:

- implementazione ordinaria;
- subagent specializzati;
- fallback;
- task in cui l'integrazione nativa produce un vantaggio concreto.

### 7.3 Codex come advisor di Cursor

Target successivo, da verificare separatamente:

```text
Cursor
   ↓ tool/MCP/CLI
OpenClaw
   ↓
Codex OAuth
   ↓
advice
   ↓
Cursor continua il loop
```

Questa capacità non viene considerata attiva finché non esiste un test runtime dedicato e documentato.

### 7.4 Qwen come advisor di Cursor

Se Qwen 3.8 37B è già caricato per il planning, può essere riutilizzato durante lo stesso job come advisor/reviewer locale, senza introdurre un secondo modello locale in memoria.

---

## 8. Gestione finestra di contesto e nuove sessioni

Questa sezione è parte essenziale dell'architettura, non un dettaglio UX.

### 8.1 Principio

**La memoria del progetto vive su GitHub, non nella finestra di contesto di un modello.**

Ogni attore deve poter essere sostituito da una nuova sessione senza perdere:

- task corrente;
- decisioni;
- HEAD;
- scope;
- acceptance criteria;
- test già eseguiti;
- findings;
- next action;
- gate aperti.

### 8.2 GPT Web context rollover

Restano valide le regole foundation esistenti:

- `handoff ora` = kill switch manuale;
- handoff periodico prima della degradazione del contesto;
- limite storico di 20 prompt utente come hard bound salvo futura modifica esplicita;
- nuova chat legge il repo vivo, non copie incollate.

Target migliorato:

- trattare 20 prompt come **limite massimo**, non come obiettivo da raggiungere;
- produrre handoff prima se compaiono ripetizioni, perdita di vincoli, confusione di HEAD/repo o crescita eccessiva del contesto;
- mantenere sempre margine sufficiente per scrivere un handoff completo.

### 8.3 Planner sessions

Codex / GLM / Qwen devono essere, per default, **ephemeral/task-oriented**.

Ogni nuova planner session legge:

1. Backlog Item;
2. CURRENT_FRONTIER del repo target quando applicabile;
3. documenti foundation/policy richiesti;
4. repository state/diff pertinenti;
5. ultimo Execution Packet/checkpoint se il task è già iniziato.

Il planner non deve richiedere la cronologia completa delle planner session precedenti.

### 8.4 Cursor context rollover

Il loop Cursor deve poter sopravvivere alla fine della propria context window.

Prima di chiudere/rollover una sessione Cursor ancora incompleta deve produrre un **Execution Checkpoint** persistente.

Schema minimo:

```yaml
task_id: D-NNNN-X
execution_packet_ref: <path/id>
repository: owner/repo
branch: <branch>
head_observed: <sha>
status: IN_PROGRESS|BLOCKED|READY_FOR_REVIEW
completed_steps: []
remaining_steps: []
files_changed: []
tests_run: []
test_results: []
open_findings: []
loop_round: <n>
next_action: <single concrete step>
gates_open: []
resume_read_set: []
```

Nuova sessione Cursor:

```text
read Execution Packet
+ read latest Execution Checkpoint
+ verify Git HEAD/workspace
+ continue from next_action
```

Non deve ricostruire il task dalla vecchia conversazione Cursor.

### 8.5 Review rollover

Bugbot/reviewer findings devono essere persistiti o riportati nel checkpoint prima di una nuova sessione.

Una nuova sessione non deve rilanciare alla cieca tutti i test/review già chiusi, salvo motivo concreto.

### 8.6 Handoff quality invariant

Un handoff/checkpoint è valido solo se permette a una nuova sessione di rispondere senza chiedere all'utente:

- "a che punto eravamo?";
- "qual era il commit?";
- "quale file dovevo modificare?";
- "quali test erano passati?";
- "qual era il prossimo passo?".

Se una di queste domande è necessaria, il checkpoint è incompleto.

---

## 9. Fallback e quote

### 9.1 Principio

Quota esaurita non deve equivalere a progetto bloccato, ma nemmeno a degradazione silenziosa di qualità.

### 9.2 Policy proposta

Low-risk:

```text
preferred → fallback 1 → fallback 2 → manual
```

Medium-risk:

```text
preferred → equivalent fallback → Telegram/manual
```

High-risk:

```text
preferred unavailable → equivalent planner oppure Telegram
```

### 9.3 Nessun fallback infinito

Ogni job deve registrare:

- planner richiesto;
- planner effettivo;
- motivo del fallback;
- quota/disponibilità osservata quando disponibile;
- numero di tentativi.

---

## 10. Invarianti che NON cambiano

Questa nuova modalità non modifica automaticamente:

- `PM-34 = BLOCKED`;
- `n8n_ready=false`;
- `L5_PASS: NOT_CLAIMED`;
- `l5_activation_authorized=false`;
- `l5_runtime_authorized=false`;
- `endurance_runtime_authorized=false`;
- `permanent_schedule_authorized=false`;
- nessun permanent loop attivo;
- nessun nuovo schedule permanente;
- nessun webhook pubblico;
- nessun Telegram Trigger pubblico;
- workflow n8n produzione non mutati in silenzio;
- GPT Web/GPT-B resta autore autorevole dei workflow n8n secondo la foundation esistente;
- Cursor non diventa autore autonomo dei workflow n8n;
- Decision Packet richiesto per gate reali;
- GitHub resta source of truth.

---

## 11. Delta rispetto a PROJECT_VISION v2.19

Il target precedente era sostanzialmente:

```text
Codex → Ollama classifier → Cursor CLI
```

Il nuovo target accettato diventa:

```text
GPT Web → GitHub backlog → n8n → OpenClaw broker
                                  ↓
                         Codex / GLM / Qwen
                                  ↓
                           Execution Packet
                                  ↓
                              n8n gate
                                  ↓
                           Cursor /loop
                                  ↓
                               Bugbot
                                  ↓
                               GitHub
```

Cambiamenti principali:

1. GPT Web resta strategic orchestrator e backlog owner.
2. OpenClaw rientra nella strada target come provider/auth/quota broker.
3. Non esiste più un Ollama/Qwen classifier separato obbligatorio nella strada principale.
4. Codex, GLM e Qwen sono **planner/prompt generators** intercambiabili.
5. Qwen locale può fare anche task semplici/advice quando il 37B è caricato.
6. Cursor diventa l'execution harness responsabile del loop task-bounded.
7. GLM può essere usato anche dentro Cursor per scaricare il pool Cursor.
8. Codex può diventare advisor esterno di Cursor tramite tool/MCP/CLI quando verificato.
9. Bugbot è reviewer/quality gate, non router.
10. Context rollover e checkpoint diventano parte esplicita del protocollo.

---

## 12. Migrazione — ordine consigliato

Tutti i punti seguenti sono **docs/design/test-gated** finché non autorizzati separatamente.

1. Persistenza di questo operating model.
2. Aggiornamento backlog/issue di migrazione.
3. Verifica OpenClaw attuale: Codex OAuth, GLM/Z.AI, usage/failover realmente disponibili nell'installazione.
4. Definizione machine-readable del Backlog Item.
5. Definizione machine-readable dell'Execution Packet.
6. Smoke test planner Qwen 3.8 37B → Execution Packet, read-only.
7. Smoke test planner GLM 5.3 → Execution Packet, read-only.
8. Smoke test planner Codex OAuth → Execution Packet, read-only.
9. Verifica GLM 5.3 come main Cursor Agent e/o custom subagent.
10. Bounded Cursor `/goal` + `/loop` smoke su task innocuo/test repository.
11. Verifica Bugbot review senza Autofix automatico.
12. Implementazione Execution Checkpoint + context rollover.
13. Solo dopo evidence: progettazione modifiche n8n/OpenClaw runtime.
14. Ogni attivazione permanente resta un Decision Packet separato.

---

## 13. Claim boundary

**Claimed da questo documento:**

- modalità architetturale accettata come target di migrazione;
- ruoli descritti sopra;
- Qwen router separato non necessario nella strada principale;
- planner pool = Qwen 3.8 37B / GLM 5.3 / Codex;
- Cursor = execution loop target;
- context rollover/checkpoint = requisito architetturale.

**Non claimed:**

- OpenClaw aggiornato/configurato con tutti i provider;
- Codex OAuth disponibile dentro Cursor nativamente;
- GLM custom subagent verificato;
- Cursor loop production-ready;
- Bugbot integrato nel loop runtime;
- n8n modificato;
- PM-34 unlock;
- L5 runtime/permanent pass;
- schedule permanente;
- automazione end-to-end attiva.

---

**Fine documento.**
