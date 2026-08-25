# CURSOR PROMPT TEMPLATE — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`  
**Versione:** 3.0 — 2026-08-25  
**Ruolo:** contratto di formattazione per gli **Execution Packet** destinati a Cursor nel modello multi-planner. Non è un cambiamento runtime.

**Target operating model:** `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`.

---

## 0. Ruolo nel nuovo flusso

GPT Web crea il **Backlog Item** strategico. Il planner selezionato — **Qwen 3.8 37B / GLM 5.3 / Codex** — genera il vero **Execution Packet** per Cursor.

Cursor non deve ricevere un obiettivo vago da reinterpretare a livello di progetto. Deve ricevere un task bounded con scope, acceptance criteria, gate e stop condition già definiti.

```text
GPT Web backlog
      ↓
planner Qwen / GLM / Codex
      ↓
Execution Packet
      ↓
n8n deterministic gate
      ↓
Cursor execution loop
```

Questo documento definisce il contratto dell'ultimo passaggio.

---

## 1. Disciplina prompt-size e contesto

- Il prompt/Execution Packet Cursor porta **solo il delta necessario al task**.
- Il boilerplate permanente si richiama per riferimento a questo file e alla foundation; non va reinserito integralmente a ogni giro.
- Repository state, checkpoint e artefatti canonici si leggono dal **repo vivo**, non dalla cronologia della chat planner.
- Ogni Execution Packet deve poter essere riusato da una nuova sessione Cursor insieme all'ultimo **Execution Checkpoint**.
- È vietato dipendere da frasi come "come abbiamo detto sopra" o da contenuto disponibile soltanto nella sessione del planner.

---

## 2. Routing metadata fuori dal corpo esecutivo

Metadati che servono al control-plane e non all'implementatore restano fuori dal corpo operativo quando possibile:

- planner richiesto / planner effettivo;
- provider/quota/fallback reason;
- modalità/modello Cursor scelto;
- repository/path/branch/task usati per instradare la finestra;
- comandi umani (`aggio`, `format`, `next`, ecc.).

Identificazione workspace Cursor canonica:

- repository full name;
- path locale quando necessario;
- branch;
- task/progetto.

**Mai** routing tramite colori UI.

Esempio fuori dal prompt:

> Workspace: `mrhz1973/control-plane`, branch previsto `main`, task `D-NNNN-X`. Planner: GLM 5.3. Cursor execution model: GLM BYOK / Cursor model secondo policy corrente.

---

## 3. Execution Packet — campi obbligatori

Il planner deve produrre almeno:

```yaml
task_id: D-NNNN-X
planner_used: qwen|glm|codex
executor: cursor
goal: <single bounded goal>
expected_repo: owner/repo
expected_branch: main
expected_base_head: <sha-or-explicitly-unknown>
allowed_paths: []
forbidden_paths: []
steps: []
validation: []
acceptance: []
loop:
  enabled: true|false
  stop_when: []
  max_rounds: <bounded integer>
risk_assessment:
  level: low|medium|high
  reasons: []
gate_recommendation:
  required: true|false
  reason: <text>
context_checkpoint_policy: required
final_report_contract: cursor-standard-v3
```

Il packet può contenere campi aggiuntivi, ma non può omettere scope, validation, acceptance, loop bound e checkpoint policy.

---

## 4. Preflight implementatore — obbligatorio

Prima di editare, Cursor esegue nel workspace corrente:

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

Regole:

1. verificare repository e branch;
2. se `expected_base_head` è valorizzato, verificare la corrispondenza;
3. se workspace è dirty inatteso, branch/repo errato, pull rifiutato, auth failure o conflitto → **STOP/BLOCKED**;
4. nessuna pulizia distruttiva autonoma (`reset --hard`, `clean`, force push, ecc.).

L'utente non deve eseguire fetch/pull/status di routine al posto di Cursor.

---

## 5. Corpo operativo del task

Il corpo destinato a Cursor deve iniziare direttamente con l'istruzione eseguibile, non con una lunga spiegazione del progetto.

Pattern:

```text
You are working in the current Cursor workspace.
Run the required repository/branch preflight first.

Goal:
<single bounded goal>

Allowed scope:
<paths/actions>

Forbidden scope:
<paths/actions>

Execute:
<steps>

Validate:
<tests/checks>

Acceptance criteria:
<deterministic criteria>

Loop policy:
Continue only within this task until the stop conditions are met or a real gate/blocker is reached.
Do not expand scope to make the task pass.

Context rollover:
If the current Cursor context must end before completion, write/update the required Execution Checkpoint and stop cleanly. A new session must resume from repository state + Execution Packet + latest checkpoint.
```

---

## 6. Loop policy Cursor

Il loop è **task-bounded**, non autonomia generale sul repository.

Ogni packet deve specificare:

- `loop.enabled`;
- `loop.stop_when`;
- `loop.max_rounds` o un bound equivalente;
- condizioni di escalation;
- acceptance criteria verificabili.

Cursor può iterare autonomamente su:

```text
implement → test → fix → test
```

finché resta nello scope autorizzato.

Cursor deve fermarsi per:

- scope expansion;
- operazione irreversibile/distruttiva;
- credenziali/auth/billing;
- produzione/deploy/runtime non autorizzato;
- conflitto con policy;
- impossibilità di soddisfare acceptance senza cambiare lo scope;
- max round raggiunto;
- contesto in esaurimento senza checkpoint persistito.

---

## 7. Workflow-authoring boundary — invariata

Regola permanente fino a modifica foundation esplicita:

- **GPT Web/GPT-B** è l'autore autorevole dei workflow n8n e delle istruzioni UI/runtime per l'operatore umano.
- **Cursor** non crea, progetta, genera o modifica autonomamente la logica dei workflow n8n.
- `workflows/**` è vietato di default.
- Cursor può toccare `workflows/**` solo se il packet dichiara esplicitamente:

`PERSIST VERBATIM GPT-B-SUPPLIED WORKFLOW ARTIFACT`

  e fornisce artefatto completo o patch/hash esatta.
- In quel caso Cursor può soltanto persistere verbatim, validare sintassi/path, riportare diff, committare e pushare.
- Nessun planner Qwen/GLM/Codex acquisisce automaticamente l'autorità di n8n workflow authoring.
- Dettaglio mancante/inconsistente → `BLOCKED_WORKFLOW_AUTHORING_RESERVED_TO_GPT_B`.

---

## 8. Modello di implementazione dentro Cursor

La scelta del motore Cursor è routing metadata, non parte semantica del task.

Target:

- **GLM 5.3 BYOK** come main Agent/subagent quando verificato e conveniente;
- **Cursor native models** per task/subagent in cui danno vantaggio;
- **Codex OAuth** come advisor/tool esterno via OpenClaw/CLI/MCP solo dopo verifica dedicata; non assumerlo come model-picker nativo;
- **Qwen 3.8 37B** come advisor locale nello stesso job quando è già caricato e la policy lo consente.

Il cambio del motore non autorizza cambio di scope.

---

## 9. Execution Checkpoint — obbligatorio per rollover

Se il task non è finito e la sessione Cursor deve terminare, Cursor deve produrre/persistire un checkpoint con almeno:

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

1. legge Execution Packet;
2. legge ultimo checkpoint;
3. verifica repo/branch/HEAD/workspace;
4. continua dal `next_action`;
5. non chiede all'utente di ricostruire la vecchia chat.

Un checkpoint è incompleto se la nuova sessione deve chiedere "a che punto eravamo?".

---

## 10. Review / Bugbot contract

Quando previsto dal packet:

```text
Cursor implementation
  ↓
test PASS
  ↓
Bugbot/reviewer
  ↓
PASS → final report
ISSUE → Cursor fix loop
```

Default target:

- Bugbot = reviewer, non router;
- niente Autofix cloud automatico salvo autorizzazione separata;
- review/fix rounds bounded;
- target iniziale `max_review_rounds = 3`;
- non convergenza → escalation/Telegram gate.

Findings ancora aperti devono entrare nel checkpoint prima di un context rollover.

---

## 11. Commit/push e report finale

Commit sempre selettivo. Mai assumere `git add .` come default.

Prima di chiudere:

```bash
git diff --check
git status --short
git log --oneline -5
```

Dopo un push autorizzato il report finale deve includere l'output testuale **verbatim** di:

```bash
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
git ls-remote origin main
```

PASS remoto:

```text
HEAD == origin/main == git ls-remote origin main
branch == main
workspace clean
```

Niente tabella o riassunto al posto dell'output verbatim.

Se il report contiene già questi output coerenti, l'orchestratore non chiede shell manuale all'utente. Se mancano, prima usare un task/prompt **verify-only Cursor**; shell utente solo come fallback finale.

`docs/runtime/LAST_CURSOR_REPORT.md` e `docs/runtime/LAST_HANDOFF_VERIFY.md` restano gli artefatti rolling secondo la foundation esistente finché non vengono migrati con una decisione separata.

---

## 12. Vietato nel prompt/packet

- routing tramite colori UI;
- comandi umani (`aggio`, `format`, `next`) nel corpo Cursor;
- dipendenze implicite dalla chat del planner;
- task senza acceptance criteria;
- loop senza bound;
- scope expansion automatica;
- n8n workflow authoring autonomo da Cursor o planner;
- destructive Git non autorizzato;
- Autofix cloud implicito;
- dichiarare PASS senza evidenza richiesta.

---

## 13. Anti-PREP-churn / momentum

- Non creare un nuovo documento se un artefatto esistente può essere aggiornato.
- Non spezzare un singolo task confinato in catene di PREP senza blocker concreto.
- Dopo evidenza sufficiente, avanzare al prossimo gate reale oppure marcare BLOCKED con blocker nominato.
- Test opzionali richiedono un rischio concreto.
- PASS basato su output deterministico/evidenza, non narrativa del modello.

---

## 14. Context-window invariant

La sessione è sostituibile; GitHub è persistente.

GPT Web, planner e Cursor devono poter aprire una nuova finestra senza perdita di stato. Il Cursor packet deve quindi puntare a fonti persistenti e produrre checkpoint prima del rollover.

La regola foundation `handoff ora` e il limite massimo storico di 20 prompt utente per GPT Web restano validi finché non vengono formalmente sostituiti.

---

## 15. Relazione con gli altri documenti

- `docs/runtime/CURRENT_FRONTIER.md` = stato runtime autorevole.
- `docs/foundation/PROJECT_VISION.md` = foundation/invarianti canoniche esistenti.
- `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` = target architetturale accettato 2026-08-25, planning/docs-only.
- Questo file = contratto operativo dell'Execution Packet destinato a Cursor.

Nessuno di questi documenti, da solo, autorizza PM-34, L5, schedule permanente o runtime non già autorizzato.

---

**Fine documento.**
