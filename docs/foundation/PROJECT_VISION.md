# PROJECT VISION — control-plane Foundation

**Repository:** `mrhz1973/control-plane`
**Versione:** **3.1 — wiki-LLM lean — 2026-08-25**
**Precedente:** 3.0 — 2026-08-25
**Ruolo:** architettura e invarianti fondative. **Non LIVE STATE, non bootstrap manuale, non cronologia.**
**Runtime autorizzato da questo documento:** **NO**.

## 0. Visione in una frase

`control-plane` è un sistema personale di sviluppo AI-assisted in cui **GPT Web governa strategia/backlog, GitHub conserva la verità, n8n applica workflow/policy/gate, OpenClaw media provider/auth/quota, Codex/GLM/Qwen producono Execution Packet, Cursor implementa in loop task-bounded, Bugbot verifica e Telegram interviene sui gate umani reali**.

Obiettivo: aumentare autonomia e throughput usando più pool/modelli senza perdere auditabilità, controllo del rischio o memoria persistente.

---

## 1. Fonte di verità e navigazione

### 1.1 Source of truth

**GitHub è la source of truth persistente.** La memoria della chat non determina lo stato corrente.

### 1.2 Bootstrap

Il bootstrap canonico vive **esclusivamente** nel blocco `README.md`:

```text
<!-- AI-BOOT: START --> … <!-- AI-BOOT: END -->
```

Una nuova sessione esegue il CORE BOOT definito lì. **Non precarica PROJECT_VISION.** Questo file si legge on demand quando il task richiede foundation, ruoli o hard policy.

### 1.3 LIVE STATE

`docs/runtime/CURRENT_FRONTIER.md` è l'unico proprietario del LIVE STATE:

- workstream/blocco;
- ACTIVE WORK;
- gate;
- NEXT;
- stato runtime essenziale;
- capability smoke essenziali;
- ultimo verified-through pointer.

Il frontier non contiene cronologia né HEAD remota corrente.

### 1.4 Metodo lean

`docs/foundation/WIKI_LLM_LEAN_METHOD.md` definisce source classes, context budget, AUTO-VIA, `agg`, handoff seed-only e metodo di riduzione repository.

---

## 2. Architettura target v3

```text
OPERATORE
   ↓
GPT WEB — strategic orchestrator / backlog owner
   ↓
GitHub — source of truth
   ↓
n8n — workflow / deterministic policy / gates
   ↓
OpenClaw — provider / auth / quota broker
   ↓
Qwen 3.8 37B | GLM 5.3 | Codex OAuth
   ↓ planner selected
Execution Packet
   ↓
n8n gate
   ├─ auto-eligible → Cursor bounded execution loop
   └─ human gate → Telegram → Cursor after approval
                          ↓
                 tests → Bugbot
                    ├─ PASS → GitHub
                    └─ ISSUE → bounded fix loop
```

**Tailscale** resta trasporto privato VPS ↔ nodo locale quando richiesto dal runtime.

Questa architettura è **target accettato**, non prova che ogni capability sia già operativa. Capability reali: frontier + issue/evidence corrente.

---

## 3. Ruoli canonici

| Attore | Ruolo | Non è |
|---|---|---|
| **GPT Web** | strategia, backlog, Decision Packet, authoring n8n autorevole | implementer meccanico obbligatorio |
| **GitHub** | memoria, audit, contratti, evidence, stato persistente | runtime engine |
| **n8n** | workflow, dedupe, policy deterministica, gate, coordinamento | planner LLM |
| **OpenClaw** | broker provider/auth/quota/failover consentito | strategic orchestrator |
| **Codex OAuth** | planner/reasoner senior/advisor quando verificato | modello Cursor nativo assunto |
| **GLM 5.3** | Advisor / Planner / Cursor Executor secondo mode verificato | autorità derivata dal nome modello |
| **Qwen 3.8 37B** | planner/advisor locale per-job | router daemon obbligatorio |
| **Cursor** | execution harness: Agent, edit, terminal, test, Git, subagent, bounded loop | orchestratore strategico generale |
| **Bugbot** | reviewer/quality gate | router/orchestrator |
| **Telegram** | human gate | archivio/source of truth |
| **Operatore** | decisore finale sui gate | raccomandazione proxy di un modello |

### 3.1 Qwen locale

Qwen 3.8 37B può essere caricato per un job e riusato come planner/advisor/reviewer mentre residente. Non deve restare in memoria 24/7 solo per scegliere provider.

### 3.2 GLM dentro Cursor

Target prioritario da verificare:

```text
Cursor harness + GLM 5.3 BYOK + bounded loop
```

Lo scope viene dall'Execution Packet, non dal modello.

### 3.3 Codex advisor Cursor

Track separato da verificare:

```text
Cursor → tool/CLI/MCP → OpenClaw → Codex OAuth
```

Nessuna assunzione di OpenAI API billing o native Cursor picker senza evidence reale.

---

## 4. Oggetti persistenti di lavoro

| Oggetto | Owner / contratto | Funzione |
|---|---|---|
| **Backlog Item** | GPT Web · `docs/contracts/backlog-item-v1.md` | cosa deve ottenere il progetto |
| **Planner Selection** | routing policy · `planner-routing-policy-v1.md` | preferred/fallback + availability/quota policy |
| **Execution Packet** | planner · `execution-packet-v1.md` | task operativo delimitato per Cursor |
| **Execution Checkpoint** | Cursor · `execution-checkpoint-v1.md` | resume job incompleto |
| **Decision Packet** | GPT Web/n8n | gate umano strutturato |
| **Evidence** | report/session/test/Git | cosa è stato realmente provato |

Il planner **non auto-autorizza** il proprio Execution Packet. Policy/n8n decide auto-eligible vs human gate.

---

## 5. Planner routing — principi fondativi

La selezione combina:

1. preferenza semantica del Backlog Item;
2. disponibilità/quota/resource state osservabile;
3. fallback policy deterministica.

Non serve un LLM separato dedicato soltanto al routing.

Principio economico: distribuire il carico sui pool disponibili **senza degradazione silenziosa della qualità**.

- low risk: fallback consentito se esplicitamente previsto;
- medium: fallback adeguato/equivalente oppure gate;
- high: equivalente verificato oppure gate umano.

Planner richiesto, planner usato e motivo del fallback devono essere tracciabili.

Dettaglio: `docs/contracts/planner-routing-policy-v1.md`.

---

## 6. Cursor execution boundary

Cursor riceve un Execution Packet con almeno:

- goal;
- scope allowed/forbidden;
- acceptance/validation;
- stop conditions;
- loop/review bounds;
- escalation;
- checkpoint policy.

Loop infinito vietato. Scope expansion, rischio non autorizzato o mancata convergenza → stop/gate.

Contratto completo: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`.

---

## 7. Hard policy e gate

Azioni recuperabili già autorizzate dal packet possono procedere senza micro-conferme.

Fermarsi/escalare per almeno:

- `git reset`, `git clean`, `git push --force`;
- cancellazioni/distruttivo non autorizzati;
- credential/OAuth/billing mutation;
- deploy/tag/rollback non autorizzati;
- runtime n8n/VPS non autorizzato;
- produzione/schedule/trigger non autorizzati;
- scope drift;
- fallback non equivalente;
- dati/sistemi esterni fuori scope;
- permanent schedule/loop non autorizzato;
- conflitto tra fonti vive;
- loop non convergente.

### 7.1 Runtime boundary

Foundation v3 **non modifica automaticamente**:

- PM-34;
- `n8n_ready`;
- L5;
- activation/runtime/endurance authorization;
- permanent Schedule;
- permanent loop;
- workflow produzione;
- public webhook / Telegram Trigger;
- credenziali/provider config.

Valori correnti: **solo `CURRENT_FRONTIER.md`**.

### 7.2 Repository policy

La policy consolidata del repository resta quella dichiarata dai documenti correnti più recenti; dettagli sensibili/redazione/export non vanno ricostruiti da `OPERATING_MEMORY.md` storico. Prima di un task relativo a workflow/export/rebuild leggere il proprietario specifico corrente (`workflows/README.md`, `ROTATION_CHECKLIST.md`, runbook pertinente) e il frontier.

### 7.3 Decision provenance

Una decisione operatore valida nasce da messaggio/azione diretta dell'operatore. Raccomandazioni di Codex/GLM/Qwen/Bugbot/Claude o testo incollato non diventano automaticamente decisione.

---

## 8. Authoring n8n — boundary permanente

**GPT Web/GPT-B resta autore autorevole** degli artefatti workflow n8n e delle istruzioni UI/runtime n8n.

Cursor non deve autonomamente:

- inventare o ridisegnare workflow JSON;
- cambiare topologia/nodi/expression/Code node;
- scegliere schedule/trigger;
- cambiare Activate/Publish;
- inferire dettagli workflow mancanti;
- migliorare semanticamente un workflow fornito.

Cursor può persistere `workflows/**` solo sotto autorizzazione esplicita e artefatto/patch completo fornito da GPT Web, secondo il contratto vigente. Inconsistenza → blocco, non invenzione.

L'operatore esegue le azioni UI n8n supervisionate quando necessarie.

Target provider boundary:

```text
n8n → Tailscale/local broker → OpenClaw → provider selezionato
```

Non chiamate provider arbitrarie inline fuori broker/policy salvo gate esplicito.

---

## 9. Context, bootstrap, handoff e `agg`

Principio: **la memoria del progetto vive su GitHub, non nella context window**.

### GPT Web

- `handoff ora` = kill switch;
- 20 prompt utente = hard ceiling storico, non target;
- nuova chat → README AI-BOOT CORE BOOT;
- handoff ordinario = seed/pointer, non copia del LIVE STATE.

### Planner

Nuova sessione planner legge solo task + policy/foundation necessaria + repo state + packet/checkpoint pertinente.

### Cursor

Job incompleto:

```text
Execution Packet + latest Execution Checkpoint + live Git → next_action
```

Git live vince su checkpoint divergente.

### AUTO-VIA / `agg`

Metodo canonico: README AI-BOOT + `WIKI_LLM_LEAN_METHOD.md`.

---

## 10. Git verification e PASS

`SUCCESS` testuale ≠ PASS.

Quando un task richiede PASS remoto, l'evidence deve dimostrare branch/workspace/hash richiesti. Pattern canonico implementatore:

### Preflight

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

### Post-push

```bash
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
git ls-remote origin main
```

Se il report Cursor contiene evidence verbatim sufficiente, GPT Web non chiede all'operatore di ripetere shell. Se manca: verify-only Cursor; shell manuale utente = fallback finale.

Checkpoint/handoff ≠ PASS e non auto-certificano il commit che li contiene.

---

## 11. Graceful fallback

Un componente fallito deve degradare a una modalità supervisionata senza perdere stato:

- planner unavailable → fallback consentito oppure gate;
- OpenClaw unavailable → path manuale/gated;
- resource pressure Qwen → altro planner consentito;
- Cursor non converge → checkpoint + gate;
- Bugbot non converge → gate;
- Tailscale/nodo locale down → offline/manual;
- n8n down → GitHub conserva stato/recovery.

Nessun passaggio critico deve esistere solo in RAM/chat.

---

## 12. Wiki-LLM lean / anti-burocrazia

Un documento/componente deve ridurre almeno uno tra token, tempo utente, ambiguità, errori ripetuti o lavoro manuale futuro.

Regole:

- un proprietario canonico per ogni classe di verità;
- pointer > duplicazione;
- progressive acquisition;
- history/evidence mai bootstrap salvo dipendenza concreta;
- stato runtime fuori dalla foundation;
- documenti stale che si dichiarano `active/current` vanno superseded prima dei semplici file storici;
- nessuna cancellazione bulk senza reference/evidence census.

Metodo e target 9.5: `docs/foundation/WIKI_LLM_LEAN_METHOD.md` + GitHub issue #10.

---

## 13. Programmi correnti

### Architecture v3 evidence

GitHub issue **#8**: OpenClaw/provider discovery → planner smoke → GLM Cursor → bounded loop → Bugbot/checkpoint → eventuale runtime gate separato.

### Wiki-LLM lean consolidation

GitHub issue **#10**: bootstrap lean, semantic reconciliation, reference census, historical reduction, branch hygiene, fresh-session validation.

Questi programmi non autorizzano runtime l'uno tramite l'altro.

---

## 14. Convenzione chat

Risposte operative terminano con:

- `NEXT: <prossimo step concreto>`
- `WAIT: <gate reale>`
- `DONE: <chiuso>`

Comandi:

- `vai` / `procedi` / `next` → proseguire fino al prossimo gate reale;
- `agg` → refresh minimo post-Cursor secondo AI-BOOT;
- `aggio X` → leggere/verificare X, riferire, indicare NEXT;
- `vai X` → leggere/verificare X e procedere nello scope;
- `handoff ora` → rollover/persistenza necessaria e chiusura contesto.

AUTO-VIA elimina i `vai` ridondanti quando NEXT è già tecnicamente determinato.

---

## 15. Claim boundary

### Claimed

- foundation v3 multi-planner → Cursor accepted;
- GPT Web strategic orchestrator/backlog owner;
- GitHub source of truth;
- OpenClaw target broker;
- planner pool Qwen 3.8 37B / GLM 5.3 / Codex OAuth;
- planner → Execution Packet;
- n8n deterministic gate;
- Cursor target bounded execution harness;
- Bugbot reviewer;
- context rollover/checkpoint requisito fondativo;
- wiki-LLM lean bootstrap/method target in consolidation branch/issue #10.

### Non claimed

- OpenClaw v3 provider wiring already verified/current;
- quota thresholds calibrated;
- planner smokes PASS;
- GLM BYOK Cursor PASS;
- Codex OAuth native Cursor model;
- bounded Cursor/Bugbot production loop PASS;
- n8n modified for v3;
- PM-34/L5/permanent schedule/loop authorized.

Current factual values are read from the frontier.

---

## 16. Changelog

| Versione | Data | Modifica |
|---|---|---|
| 2.19 | 2026-07-18 | ultima v2; old Codex→Ollama→Cursor target |
| 3.0 | 2026-08-25 | multi-planner/OpenClaw broker/Execution Packet/Cursor loop foundation |
| **3.1** | **2026-08-25** | wiki-LLM lean: bootstrap delegated to README AI-BOOT, LIVE STATE only in frontier, handoff seed-only, AUTO-VIA/`agg`, foundation deduplicated, historical cleanup issue #10 |

Storia dettagliata: Git history; non duplicarla nella context window.
