# CURSOR PROMPT TEMPLATE — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`  
**Versione:** 3.5 — 2026-09-01
**Stato:** CANONICAL  
**Ruolo:** contratto operativo master per gli Execution Packet destinati a Cursor nel modello multi-planner. Non è un cambiamento runtime.

**Target operating model:** `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`  
**User-facing handoff:** `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`  
**Sequencing / PASS-STOP persistence:** `docs/foundation/PROMPT_SEQUENCING_GATE.md`  
**Wiki-LLM lean:** `docs/foundation/WIKI_LLM_LEAN_METHOD.md`

---

## 0. Ruolo nel flusso

GPT Web crea il Backlog Item strategico. Il planner selezionato — Qwen / GLM / Codex — genera un Execution Packet bounded. Cursor esegue il pass, valida una volta secondo il task, persiste evidence e torna al control-plane tramite GitHub.

```text
GPT Web backlog
      ↓
planner Qwen / GLM / Codex
      ↓
Execution Packet
      ↓
n8n deterministic gate
      ↓
Cursor bounded pass
      ↓
GitHub evidence
      ↓
agg umano / push-event automatico
      ↓
orchestratore
```

GitHub è la memoria persistente. La chat Cursor non è una fonte canonica di stato.

---

## 1. Prompt-size / TASK DELTA

- Il prompt Cursor porta solo il delta necessario al pass corrente.
- Il metodo stabile resta nel repository e non va ricopiato a ogni giro.
- Il prompt user-facing segue `CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`.
- Prima del blocco TASK DELTA compaiono sempre, nell'ordine:

```text
MODELLO CURSOR: <modello esatto raccomandato>
BUGBOT: <NO | SÌ>
MODALITÀ CURSOR: <AGENT | PLAN>
```

- Repository state, checkpoint ed evidence si leggono dal repo vivo, non dalla chat del planner.
- SHA/build/blob/candidate compaiono solo se verificati; mai inventarli.
- Disponibilità modello/quota si usa solo da fonte verificata.

---

## 2. Execution Packet — campi minimi

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

Scope, validation, acceptance, stop policy e checkpoint policy sono obbligatori.

### 2.1 Dispatch/result anchor

Quando il packet viene effettivamente consegnato a Cursor:

```text
dispatch_task_ref  = task_id / BLOCK-ID effettivamente consegnato
dispatch_base_head = expected_base_head effettivamente consegnato
```

Questi due valori costituiscono l'anchor immutabile per rilevare il risultato del pass fino a quando PASS/STOP non è stato ingerito e riepilogato dall'orchestratore.

- osservare una HEAD più recente non cambia l'anchor;
- un commit GPT-Web successivo non cambia l'anchor;
- `agg`/automation confronta `dispatch_base_head..origin/main` per `dispatch_task_ref`;
- l'anchor si chiude solo dopo outcome ingestion;
- dettaglio canonico: `PROMPT_SEQUENCING_GATE.md`.

### 2.2 One-pass default

Default:

```yaml
loop:
  enabled: false
  max_rounds: 1
```

Un bounded corrective loop interno è ammesso solo se il TASK DELTA lo autorizza esplicitamente con scope, bound e stop conditions. La semplice possibilità che un test fallisca non abilita un loop.

---

## 3. Preflight implementatore

Prima di editare, Cursor verifica repo, branch, working tree e remote state. Il metodo canonico può usare:

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

1. repo/branch devono essere quelli attesi;
2. `expected_base_head`, quando valorizzato, deve corrispondere;
3. dirty tree inatteso, auth failure, pull non fast-forward o conflitto → STOP;
4. vietata pulizia distruttiva autonoma (`reset --hard`, `clean`, force-push, ecc.).

Nel TASK DELTA user-facing si riporta solo la baseline/override specifica; il boilerplate non va duplicato.

---

## 4. Corpo semantico del task

Ogni pass deve definire almeno:

- OBIETTIVO bounded;
- SCOPE consentito;
- PRESERVARE;
- OUT OF SCOPE;
- PRECHECK specifici;
- ACCEPTANCE deterministiche;
- STOP conditions;
- eventuale OVERRIDE DEL PASS;
- EVIDENCE/GIT specifica;
- OUTPUT finale.

Cursor non amplia lo scope per far passare un task.

---

## 5. One-pass Cursor — DEFAULT

Salvo override esplicito:

```text
implement
→ target test una volta
→ regressioni richieste una volta
→ review una volta soltanto se BUGBOT:SÌ
→ evidence
→ closure Git coerente con PASS/STOP
```

Al primo blocker/failure/actionable finding:

```text
STOP — <causa precisa>
```

Non eseguire implicitamente:

```text
fix → test → fix → test
```

Un failure diagnosticato genera un nuovo piccolo corrective pass dopo il normale `agg` + riepilogo secondo `PROMPT_SEQUENCING_GATE.md`.

Cursor deve fermarsi anche per scope expansion, operazione distruttiva non autorizzata, runtime/deploy fuori gate, conflitto di policy, impossibilità di soddisfare acceptance senza cambiare scope, BugBot actionable finding o bound esplicito raggiunto.

---

## 6. PASS / STOP persistence — CANONICAL

Questa sezione recepisce la semantica wiki-LLM lean di `PROMPT_SEQUENCING_GATE.md`.

### PASS

Su PASS completo Cursor persiste normalmente:

- production/test/docs changes bounded;
- report architetturale/verifica quando pertinente;
- `docs/runtime/LAST_CURSOR_REPORT.md` come rolling evidence compatta dell'ultimo PASS completato;
- `docs/runtime/CURRENT_FRONTIER.md` se LIVE STATE/NEXT cambia;
- commit/push normale e selettivo.

`LAST_CURSOR_REPORT.md` NON è un event log e non deve accumulare STOP intermedi.

#### PASS remote closure — hard invariant

Per ogni bounded task Cursor normale, un PASS **non è completo** e Cursor **non deve** stampare PASS finale finché:

1. la PASS evidence del task è scritta;
2. `LAST_CURSOR_REPORT.md` è aggiornato;
3. `CURRENT_FRONTIER.md` è aggiornato quando LIVE STATE/NEXT cambia;
4. i file PASS bounded sono staged selettivamente;
5. il commit PASS è creato;
6. il commit PASS è pushato su `origin/main`;
7. la verifica remota conferma che il commit PASS è su `origin/main`.

Subject canonico del commit PASS — prima riga:

```text
cursor-pass: <TASK_REF>
```

Il subject canonico STOP resta:

```text
cursor-stop: <TASK_REF>
```

Un TASK DELTA può **aggiungere** requisiti di persistence più stretti ma **non può** indebolire, omettere o contraddurre silenziosamente questa closure PASS/STOP. Formulazioni come «commit only on STOP», «STOP artifact must be committed» o l'assenza di una sottosezione PASS commit **non** autorizzano a lasciare un PASS riuscito solo in locale. Il contratto foundation resta ereditato salvo revisione esplicita a livello repository.

Se il lavoro PASS riesce ma commit/push/verifica remota non possono completarsi: **non** dichiarare PASS; classificare `PASS_EVIDENCE_NOT_PERSISTED` e preservare il workspace per recovery.

### STOP

Su STOP Cursor deve rendere il failure osservabile da GitHub senza contaminare PASS evidence e senza committare codice incompleto.

Obblighi:

1. STOP al primo finding; nessun corrective loop implicito;
2. preservare production/test dirty tree uncommitted;
3. NON modificare `CURRENT_FRONTIER.md`;
4. NON modificare `LAST_CURSOR_REPORT.md`;
5. creare esattamente un piccolo artifact immutabile:

```text
reports/runtime/cursor-stops/<UTC_TIMESTAMP>__<TASK_REF>.stop.json
```

6. stage/commit/push SOLO quel nuovo `.stop.json`;
7. usare come prima riga del commit:

```text
cursor-stop: <TASK_REF>
```

8. verificare che il dirty tree produttivo/test resti uncommitted.

Shape minima:

```json
{
  "schema_version": "cursor-stop-evidence-v1",
  "task_ref": "<exact task ref>",
  "result_cursor": "STOP",
  "starting_head": "<dispatch_base_head>",
  "stop_evidence_commit": "<sha or PENDING_SELF_REFERENCE>",
  "failure_stage": "<PRECHECK|TARGET_TEST|REGRESSION|BUGBOT|RUNTIME_APPLY|OTHER>",
  "finding": "<precise bounded finding>",
  "target_result": "<result or NOT_RUN>",
  "regressions_status": "<result or NOT_RUN>",
  "bugbot_status": "<result or NOT_RUN>",
  "runtime_apply_status": "<result or NOT_RUN>",
  "execution_route_contained": true,
  "http_execution_endpoint_requests": 0,
  "opencode_calls": 0,
  "qwen_generations": 0,
  "provider_calls": 0,
  "dirty_paths_summary": ["<bounded paths/patterns>"],
  "next_owner": "GPT_WEB"
}
```

No secret, raw model output, grandi log o diff negli STOP artifact.

### Human / automation equivalence

```text
Human:      Cursor → GitHub → agg → orchestratore
Automation: Cursor → GitHub push event → orchestratore
```

Stessa semantica e stesso dispatch anchor. Nessun protocollo parallelo.

---

## 7. Orchestrator result-ingestion barrier

Questa è una regola del metodo master, non un compito dell'operatore.

Finché un pass Cursor ha un dispatch anchor aperto, GPT Web/orchestratore, **prima di qualsiasi propria scrittura GitHub**, deve:

1. refresh `origin/main`;
2. confrontare `dispatch_base_head..origin/main`;
3. cercare l'outcome matching `dispatch_task_ref`;
4. se presente, ingerirlo prima della propria scrittura;
5. non sostituire l'anchor con la HEAD prodotta dalla propria scrittura.

In questo modo un commit docs dell'orchestratore non può mai nascondere uno STOP/PASS Cursor già pushato.

Recovery dopo context loss segue `PROMPT_SEQUENCING_GATE.md`: packet `expected_base_head` quando disponibile; poi commit search esatto `cursor-pass: <dispatch_task_ref>` o `cursor-stop: <dispatch_task_ref>` dentro `<dispatch_base_head>..origin/main`; solo fallback bounded su `LAST_CURSOR_REPORT.md`.

---

## 8. Workflow-authoring boundary

- GPT Web/GPT-B resta autore autorevole dei workflow n8n e delle istruzioni UI/runtime per l'operatore.
- Cursor non crea/progetta/modifica autonomamente la logica n8n.
- `workflows/**` è vietato di default.
- Cursor può toccare `workflows/**` solo quando il task dichiara esplicitamente:

```text
PERSIST VERBATIM GPT-B-SUPPLIED WORKFLOW ARTIFACT
```

con artifact completo o patch/hash esatta.
- In quel caso può soltanto persistere verbatim, validare, riportare diff, commit/push.
- Dettaglio mancante/inconsistente → `BLOCKED_WORKFLOW_AUTHORING_RESERVED_TO_GPT_B`.

---

## 9. Modello Cursor / quota

Il modello Cursor è routing metadata e segue `CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`.

Invarianti:

- nomi modello concretamente verificati;
- mai `MODELLO CURSOR: AUTO`;
- modello non cambia scope/gate/acceptance;
- Fast non è default solo per velocità;
- GLM non va speso in proof/test loop meccanici.

Routing tipico:

- deterministico/meccanico/docs-only/exact patch/minimal diagnosed correction → Composer 2.5 non-Fast;
- architettura/debugging difficile/cross-system/runtime blocker → GLM 5.3 BYOK quando disponibile e quota lo consente.

---

## 10. Execution Checkpoint

Se la sessione Cursor deve terminare prima del completamento e il job non è in STOP terminale, persistere un checkpoint con almeno:

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

Una nuova sessione riparte da repo + packet + checkpoint, non dalla vecchia chat.

---

## 11. BugBot

### `BUGBOT: NO`

Nessuna invocazione.

### `BUGBOT: SÌ`

Dopo i test e prima della closure:

```text
/review-bugbot
```

esattamente una volta.

- niente Autofix;
- no finding actionable → `PASS_NO_FINDINGS`;
- finding actionable/blocking → STOP immediato;
- nessun fix/rerun BugBot nello stesso pass;
- unavailable → `STOP BUGBOT_NOT_AVAILABLE`.

Lo STOP BugBot segue la stessa persistence `cursor-stops/*.stop.json`.

---

## 12. Commit/push e report finale

Commit sempre selettivo. Mai assumere `git add .` come default.

Prima di una closure PASS:

```bash
git diff --check
git status --short
git log --oneline -5
```

Quando il task richiede PASS remoto, verificare coerentemente:

```text
HEAD == origin/main == git ls-remote origin main
branch == main
workspace clean
```

Lo STOP non richiede clean workspace: richiede invece che SOLO lo STOP artifact sia committato/pushato e che il dirty tree bounded resti preservato.

L'orchestratore non deve chiedere all'operatore shell manuale se GitHub/evidence persistita basta a determinare il gate.

---

## 13. Vietato

- routing tramite colori UI;
- `MODELLO CURSOR: AUTO` o modello non verificato;
- omissione di `MODELLO CURSOR`, `BUGBOT`, `MODALITÀ CURSOR`;
- BugBot implicito con `BUGBOT:NO`;
- più di una review BugBot nello stesso pass;
- Autofix BugBot implicito;
- dipendenze dalla chat planner;
- task senza acceptance;
- corrective loop implicito;
- scope expansion automatica;
- n8n workflow authoring autonomo;
- destructive Git non autorizzato;
- dichiarare PASS senza evidence;
- committare production/test incomplete changes su STOP;
- scrivere STOP intermedi dentro `LAST_CURSOR_REPORT.md`;
- usare `last_observed_head` al posto del dispatch anchor per classificare l'ultimo pass;
- fare una scrittura GPT-Web mentre esiste outcome Cursor non ingerito nel dispatch range;
- mega-prompt che ricopia il metodo stabile;
- inventare baseline/SHA/blob/candidate.

---

## 14. Wiki-LLM lean / context

- `CURRENT_FRONTIER.md` = LIVE STATE compatto.
- `LAST_CURSOR_REPORT.md` = rolling evidence dell'ultimo PASS completato, letto on-demand.
- `reports/runtime/cursor-stops/*.stop.json` = STOP evidence immutabile, letta solo se il dispatch range/current task la punta.
- niente broad scan della cartella STOP durante `agg`;
- niente chronology nel frontier;
- niente duplicazione del metodo nei TASK DELTA.

---

## 15. Relazione con gli altri documenti

- `docs/runtime/CURRENT_FRONTIER.md` = stato runtime autorevole.
- `docs/foundation/PROJECT_VISION.md` = foundation/invarianti.
- `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` = operating model multi-planner.
- `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` = forma user-facing, model routing, BugBot, TASK DELTA e `agg`.
- `docs/foundation/PROMPT_SEQUENCING_GATE.md` = sequencing + dispatch anchor + PASS/STOP persistence + human/automation equivalence.
- `docs/foundation/WIKI_LLM_LEAN_METHOD.md` = metodo lean di navigazione/evidence.
- Questo file = master operativo dell'Execution Packet destinato a Cursor.

Nessuno di questi documenti, da solo, autorizza runtime non già aperto dal frontier/contratto/task.

---

**Fine documento.**