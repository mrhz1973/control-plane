# CURSOR PROMPT TEMPLATE — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`  
**Versione:** 3.2 — 2026-08-31  
**Ruolo:** contratto di formattazione per gli **Execution Packet** destinati a Cursor nel modello multi-planner. Non è un cambiamento runtime.

**Target operating model:** `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`.  
**User-facing handoff canonico:** `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` — TASK DELTA + header obbligatori + one-pass default.

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
Cursor execution pass
```

Questo documento definisce il contratto dell'ultimo passaggio.

---

## 1. Disciplina prompt-size e contesto

- Il prompt/Execution Packet Cursor porta **solo il delta necessario al task**.
- Il boilerplate permanente si richiama per riferimento a questo file e alla foundation; non va reinserito integralmente a ogni giro.
- Il prompt user-facing consegnato all'operatore deve seguire `CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`: **TASK DELTA**, non secondo manuale operativo.
- Prima del blocco user-facing devono apparire sempre, nell'ordine, `MODELLO CURSOR`, `BUGBOT`, `MODALITÀ CURSOR` con valori concreti secondo lo standard canonico.
- Repository state, checkpoint e artefatti canonici si leggono dal **repo vivo**, non dalla cronologia della chat planner.
- Ogni Execution Packet deve poter essere riusato da una nuova sessione Cursor insieme all'ultimo **Execution Checkpoint**.
- È vietato dipendere da frasi come "come abbiamo detto sopra" o da contenuto disponibile soltanto nella sessione del planner.
- SHA/build/blob/candidate possono comparire nel TASK DELTA solo se realmente noti e verificabili; **mai inventarli**.
- Disponibilità modello/quota non si inventano: quando materialmente rilevanti devono provenire da fonte verificata.

---

## 2. Routing metadata fuori dal corpo esecutivo

Metadati che servono al control-plane e non all'implementatore restano fuori dal corpo operativo quando possibile:

- planner richiesto / planner effettivo;
- provider/quota/fallback reason;
- modello Cursor raccomandato;
- BugBot `NO|SÌ`;
- modalità Cursor `AGENT|PLAN`;
- repository/path/branch/task usati per instradare la finestra;
- comandi umani (`aggio`, `format`, `next`, ecc.).

L'header user-facing obbligatorio è:

```text
MODELLO CURSOR: <modello esatto raccomandato>
BUGBOT: <NO | SÌ>
MODALITÀ CURSOR: <AGENT | PLAN>
```

La policy canonica di scelta modello, incluse le soglie stabili di conservazione quota GLM, vive in `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` e non viene duplicata qui.

Identificazione workspace Cursor canonica:

- repository full name;
- path locale quando necessario;
- branch;
- task/progetto.

**Mai** routing tramite colori UI.

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
  enabled: false
  stop_when: []
  max_rounds: 1
risk_assessment:
  level: low|medium|high
  reasons: []
gate_recommendation:
  required: true|false
  reason: <text>
context_checkpoint_policy: required
final_report_contract: cursor-standard-v3
```

Il packet può contenere campi aggiuntivi, ma non può omettere scope, validation, acceptance, stop policy e checkpoint policy.

### 3.1 One-pass default nei packet

Il default canonico è:

```yaml
loop:
  enabled: false
  max_rounds: 1
```

Un bounded corrective loop è ammesso solo quando il task lo autorizza **esplicitamente**. In tal caso il packet deve indicare:

- `loop.enabled: true`;
- bound numerico o equivalente;
- condizioni di stop;
- scope esatto del loop;
- motivo per cui il loop è necessario nello stesso pass.

La semplice possibilità che un test fallisca non abilita un corrective loop.

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

Nel **TASK DELTA user-facing** non è necessario ricopiare tutti questi comandi: è sufficiente richiamare il metodo canonico e specificare solo baseline/override realmente pertinenti al pass.

---

## 5. Corpo operativo del task

Il corpo destinato a Cursor deve iniziare direttamente con l'istruzione eseguibile, non con una lunga spiegazione del progetto.

Il seguente pattern descrive la semantica del task/Execution Packet, ma **non obbliga GPT Web a ricopiarne tutto il boilerplate nel prompt user-facing**. La presentazione all'operatore segue il TASK DELTA definito da `CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`.

Pattern semantico:

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

Validate once:
<target tests/checks + required regressions>

Acceptance criteria:
<deterministic criteria>

Pass policy:
Default is one-pass. At the first blocker or failed required validation, STOP with the precise cause.
Do not enter a fix/test loop unless this task explicitly authorizes a bounded corrective loop.
Do not expand scope to make the task pass.

Context rollover:
If the current Cursor context must end before completion, write/update the required Execution Checkpoint and stop cleanly. A new session must resume from repository state + Execution Packet + latest checkpoint.
```

---

## 6. One-pass policy Cursor — DEFAULT

Salvo autorizzazione esplicita diversa nel TASK DELTA corrente, ogni pass bounded segue una sola sequenza:

```text
implement
→ target test una volta
→ regressioni richieste una volta
→ review una volta soltanto se BUGBOT:SÌ
→ evidence
→ commit/push
```

Al primo blocker/failure:

```text
STOP — <causa precisa>
```

Non eseguire nello stesso pass, per default:

```text
fix → test → fix → test
```

Un failure già diagnosticato genera un nuovo piccolo corrective pass dopo `agg` + riepilogo secondo `PROMPT_SEQUENCING_GATE.md`.

Un corrective loop interno è ammesso soltanto se il TASK DELTA corrente lo autorizza esplicitamente con bound e stop conditions. Questa regola prevale sul vecchio esempio generico `implement → test → fix → test`.

Cursor deve comunque fermarsi per:

- scope expansion;
- operazione irreversibile/distruttiva;
- credenziali/auth/billing;
- produzione/deploy/runtime non autorizzato;
- conflitto con policy;
- impossibilità di soddisfare acceptance senza cambiare lo scope;
- primo test/review failure nel default one-pass;
- bound esplicito raggiunto quando un corrective loop è autorizzato;
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

La raccomandazione concreta del modello deve seguire `CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`, che è il canonical owner della policy user-facing e della conservazione quota GLM.

Invarianti:

- usare soltanto nomi modello concretamente verificati/utilizzabili;
- mai `MODELLO CURSOR: AUTO`;
- il cambio del motore non autorizza cambio di scope, gate o acceptance;
- Fast non è il default solo per ragioni di velocità;
- GLM non va speso in loop di test/proof meramente ripetitivi.

Target capability già descritta dalla foundation:

- **GLM 5.3 BYOK** come main Agent/subagent quando verificato e conveniente;
- **Cursor native models** per task/subagent in cui danno vantaggio;
- **Codex OAuth** come advisor/tool esterno via OpenClaw/CLI/MCP solo dopo verifica dedicata; non assumerlo come model-picker nativo;
- **Qwen 3.8 37B** come advisor locale nello stesso job quando è già caricato e la policy lo consente.

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

## 10. Review / BugBot contract

Il valore user-facing `BUGBOT` è obbligatorio per ogni prompt Cursor e viene applicato secondo `CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`.

### `BUGBOT: NO`

- nessuna invocazione BugBot nel pass;
- nessuna review BugBot implicita.

### `BUGBOT: SÌ`

Dopo i test richiesti e prima della closure:

```text
/review-bugbot
```

una sola volta.

Regole:

- niente Autofix;
- nessun finding blocking/actionable → `PASS_NO_FINDINGS` e continuazione verso evidence/closure;
- finding actionable/blocking → **STOP immediato** con finding preciso;
- nessun edit, fix o rerun BugBot nello stesso pass;
- BugBot non disponibile → `STOP BUGBOT_NOT_AVAILABLE`.

Un finding BugBot genera, se ancora necessario e autorizzato, un nuovo corrective pass dopo il normale ciclo `agg` + riepilogo. Non esiste più un default `ISSUE → Cursor fix loop` nello stesso pass.

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

Se il report contiene già questi output coerenti, l'orchestratore non chiede shell manuale all'utente. Se mancano, usare il più piccolo pass verify-only coerente con il sequencing gate; shell utente solo come fallback finale.

`docs/runtime/LAST_CURSOR_REPORT.md` e `docs/runtime/LAST_HANDOFF_VERIFY.md` restano gli artefatti rolling secondo la foundation esistente finché non vengono migrati con una decisione separata.

---

## 12. Vietato nel prompt/packet

- routing tramite colori UI;
- `MODELLO CURSOR: AUTO` o modello non verificato;
- omissione di `MODELLO CURSOR`, `BUGBOT` o `MODALITÀ CURSOR` nell'handoff user-facing;
- review BugBot implicita con `BUGBOT: NO`;
- più di una review BugBot nello stesso pass con `BUGBOT: SÌ`;
- Autofix BugBot implicito;
- comandi umani (`aggio`, `format`, `next`) nel corpo Cursor;
- dipendenze implicite dalla chat del planner;
- task senza acceptance criteria;
- corrective loop implicito;
- scope expansion automatica;
- n8n workflow authoring autonomo da Cursor o planner;
- destructive Git non autorizzato;
- dichiarare PASS senza evidenza richiesta;
- mega-prompt user-facing che ricopiano il metodo stabile già persistito;
- inventare baseline/SHA/blob/candidate non verificati.

---

## 13. Anti-PREP-churn / momentum

- Non creare un nuovo documento se un artefatto esistente può essere aggiornato.
- Non spezzare un singolo task confinato in catene di PREP senza blocker concreto.
- Dopo evidenza sufficiente, avanzare al prossimo gate reale oppure marcare BLOCKED con blocker nominato.
- Test opzionali richiedono un rischio concreto.
- Un test/finding fallito nel default one-pass non apre un loop interno: STOP e nuovo piccolo corrective pass se necessario.
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
- `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` = forma user-facing canonica: **MODELLO CURSOR + BUGBOT + MODALITÀ CURSOR + TASK DELTA + agg separato**, inclusa policy modello/quota GLM.
- `docs/foundation/PROMPT_SEQUENCING_GATE.md` = gate tra pass consecutivi.
- Questo file = contratto operativo dell'Execution Packet destinato a Cursor.

Nessuno di questi documenti, da solo, autorizza PM-34, L5, schedule permanente o runtime non già autorizzato.

---

**Fine documento.**
