# control-plane

Repository del control-plane AI-assisted. **GitHub è la memoria persistente; la chat non è lo stato del progetto.**

<!-- AI-BOOT: START -->
## AI BOOT — control-plane

**Ruolo:** bootloader minimale per GPT Web / nuove sessioni.
**Metodo:** wiki-LLM lean + AUTO-VIA.
**Questo blocco governa il bootstrap.** Foundation, evidence e storico si leggono solo on demand.

### Autorità remota

Autorità finale sulla HEAD quando tecnicamente disponibile:

```bash
git ls-remote origin refs/heads/main
```

Se `ls-remote` non è disponibile nel runtime dell'agente, usare GitHub/API come fallback dichiarato. Non inventare la HEAD e non dichiarare il fallback equivalente a una verifica terminale quando un PASS remoto la richiede.

### CORE BOOT — obbligatorio e piccolo

Eseguire **solo**:

1. verificare `origin/main` con `git ls-remote origin refs/heads/main` oppure fallback GitHub dichiarato;
2. leggere **solo** questo blocco `<!-- AI-BOOT: START --> … <!-- AI-BOOT: END -->` del `README.md`;
3. leggere `docs/runtime/CURRENT_FRONTIER.md` completo — deve restare piccolo;
4. leggere il solo **ACTIVE WORK pointer** indicato dal frontier:
   - issue GitHub → issue corrente;
   - Backlog Item / Execution Packet / Checkpoint → solo il path esplicitamente indicato;
   - `NONE/N/A` → step 4 = N/A.

Poi il CORE BOOT è completo. Riportare soltanto:

- `origin/main` osservato + provenienza;
- workstream/blocco corrente;
- gate corrente;
- `NEXT`;
- eventuale conflitto reale tra fonti.

### Payload vietati nel CORE BOOT

Non precaricare:

- `PROJECT_VISION.md` completo;
- `MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`;
- contratti non puntati dal frontier;
- `CURSOR_PROMPT_TEMPLATE.md`;
- `HANDOFF_TEMPLATE.md` o vecchi handoff;
- `LAST_CURSOR_REPORT.md` / `LAST_HANDOFF_VERIFY.md`;
- `OPERATING_MEMORY.md`;
- session log;
- PM storici / runtime-packets storici;
- workflow export;
- directory listing o ricerche esplorative dell'intero repo;
- documenti storici salvo dipendenza concreta.

Principio: **prima stato minimo → poi una sola lettura necessaria al gate reale.**

### AUTO-VIA

Dopo CORE BOOT:

- se `NEXT` è tecnicamente determinato, nello scope corrente e non richiede una decisione umana reale → **procedere direttamente**;
- caricare on demand soltanto metodo/contratto/evidence necessari a quel passo;
- non chiedere un nuovo `vai` per passaggi meccanici già determinati;
- AUTO-VIA non amplia lo scope e non trasforma un gate umano in decisione tecnica;
- la persistenza docs-only dell'evidence di un task già eseguito è bookkeeping recuperabile e non apre da sola un nuovo gate runtime;
- **sequencing Cursor:** AUTO-VIA non consente di emettere un nuovo TASK DELTA mentre il precedente prompt Cursor attende ancora il relativo `agg` + riepilogo. Fonte canonica: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

**STANDING OPERATOR AUTHORIZATION — CANONICAL:** l'operatore ha autorizzato in modo permanente i passaggi bounded già determinati dall'architettura, dal `CURRENT_FRONTIER`, dall'ACTIVE WORK, dai contratti o da artifact GPT-Web. **Non chiedere più autorizzazioni/re-autorizzazioni conversazionali** quando l'unico motivo di pausa sarebbe il consenso dell'operatore. Procedere via AUTO-VIA. Persistenza dedicata: `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`.

Dopo questa direttiva, `WAIT` è ammesso solo per un **blocco reale** che l'agente non può completare autonomamente, per esempio:

- azione manuale inevitabile dell'operatore in una UI o servizio esterno;
- scelta strategica con più opzioni non equivalenti e nessuna autorità canonica che la risolva;
- distruttivo o irreversibile non già determinato dal task/architettura;
- scope expansion o nuova architettura non definita;
- fallback non equivalente;
- conflitto tra fonti vive;
- limite di piattaforma/tool/policy;
- loop non convergente.

Credenziali/OAuth/runtime/deploy/inference **non sono più un WAIT solo perché richiedevano consenso**: se l'azione è bounded, tecnicamente determinata e nello scope corrente, è pre-autorizzata. Restano WAIT soltanto se serve un intervento manuale inevitabile o manca una risoluzione canonica sicura.

### OPERATOR ACTION HANDOFF — obbligatorio in tutte le chat

Quando un gate reale richiede un'azione manuale dell'operatore:

- guidare l'operatore concretamente, non limitarsi a nominare il gate;
- ogni **URL, comando, path, hostname, nome credenziale, nome campo/header, workflow/node/ID o testo esatto da inserire** deve essere fornito in un **blocco one-click copiabile**, quando tecnicamente possibile;
- usare **un valore/azione per blocco** quando più valori simili potrebbero essere confusi; l'operatore non deve trascrivere stringhe tecniche a mano;
- per una sequenza UI indicare il percorso esatto con le etichette visibili (`A → B → C`) e rendere copiabili i valori da inserire;
- i secret non vanno mai messi nel blocco/chat/GitHub: fornire solo il metodo secret-safe per trasferirli direttamente nel campo/store di destinazione;
- se AUTO-VIA può eseguire l'azione senza un gate umano, non scaricarla sull'operatore.

Dettaglio canonico user-facing: `docs/foundation/OPERATOR_ACTION_HANDOFF_STANDARD.md`.
Per i prompt Cursor resta inoltre obbligatorio `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` (modalità `AGENT|PLAN`, TASK DELTA, blocco unico, `agg` separato). Il sequencing tra prompt consecutivi è governato da `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

### `agg` — refresh dopo un pass Cursor

`agg` significa **aggiornamento minimo evidence-aware**, non reboot completo.

Eseguire:

1. refresh `origin/main`;
2. rileggere `CURRENT_FRONTIER.md`;
3. rileggere ACTIVE WORK pointer se presente;
4. ispezionare **solo il delta Git** dal precedente HEAD osservato;
5. se il delta contiene un nuovo `reports/runtime/cursor-stops/*.stop.json` riferito al task atteso, leggere **solo quel singolo STOP artifact**;
6. altrimenti leggere `docs/runtime/LAST_CURSOR_REPORT.md` **una sola volta** soltanto se il gate/NEXT dipende dal PASS Cursor appena concluso;
7. leggere evidence aggiuntiva solo se esplicitamente puntata e necessaria;
8. **riepilogare all'operatore l'esito del pass Cursor appena concluso**;
9. solo dopo il riepilogo applicare AUTO-VIA + STANDING OPERATOR AUTHORIZATION per derivare/emettere l'eventuale TASK DELTA successivo.

**Cursor completion persistence invariant:**

- **PASS** → il task non è evidence-complete finché il PASS è persistito nel normale bounded evidence path, incluso `docs/runtime/LAST_CURSOR_REPORT.md` compatto/rolling e `CURRENT_FRONTIER.md` quando il LIVE STATE cambia;
- **STOP** → il task deve creare un solo piccolo artifact immutabile `reports/runtime/cursor-stops/<UTC_TIMESTAMP>__<TASK_REF>.stop.json`, fare commit/push solo di quello, lasciare `CURRENT_FRONTIER.md` e `LAST_CURSOR_REPORT.md` invariati e preservare production/test incompleti dirty/uncommitted.

Gli STOP non vengono accumulati nel rolling PASS report. `agg` non lista né precarica la directory STOP: legge soltanto l'artifact nuovo selezionato dal delta Git del task appena terminato. Regola canonica e minimum shape: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

Se non esiste né PASS evidence corrispondente né un nuovo STOP artifact corrispondente, `agg` classifica **`EVIDENCE_NOT_PERSISTED`**. Non deve dedurre che il task non sia stato eseguito.

Se report/evidence e frontier confliggono: **CURRENT_FRONTIER prevale per LIVE STATE**; dichiarare l'evidence stale/conflicting, non ricostruire lo stato dalla narrativa.

`agg` non equivale a handoff e non precarica foundation/storico.

**Hard sequencing gate:** dopo aver consegnato prompt Cursor N, GPT Web non emette prompt N+1 finché l'operatore non ha inviato l'`agg` di N e GPT Web non ne ha riepilogato l'esito. `vai`, `procedi`, `next`, disponibilità provider o reset quota non bypassano il gate. Solo un override esplicito dell'operatore che nomini chiaramente questa eccezione può farlo. Dettaglio: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

### Precedenza delle fonti

```text
remote Git / repo vivo
        >
CURRENT_FRONTIER           = LIVE STATE
        >
ACTIVE WORK                = task/backlog corrente
        >
contratto specifico        = scope/metodo del job
        >
Execution Checkpoint       = resume task incompleto
        >
new matching cursor STOP artifact / LAST_CURSOR_REPORT / verify = EVIDENCE
        >
handoff                    = STABLE SEED / checkpoint storico
        >
session/PM/history         = AUDIT/HISTORY
        >
memoria chat
```

Per architettura/invarianti, quando necessario: `docs/foundation/PROJECT_VISION.md` è canonico.
Per stato runtime: `docs/runtime/CURRENT_FRONTIER.md` è sempre canonico.
La standing authorization non modifica la precedenza delle fonti: modifica soltanto la necessità di chiedere consenso ripetuto.

### ON DEMAND — aprire solo quando serve

| Bisogno | Fonte |
|---|---|
| Foundation / ruoli / hard policy | `docs/foundation/PROJECT_VISION.md` — sezione pertinente |
| Standing operator authorization | `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md` — solo se serve il dettaglio oltre alla regola già incorporata nel boot |
| Operating model multi-planner | `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` — sezione pertinente |
| Backlog / routing / packet / checkpoint | solo contratto o istanza pertinente |
| Esecuzione Cursor | `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` |
| Presentazione/sequence prompt Cursor | `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` + `docs/foundation/PROMPT_SEQUENCING_GATE.md` |
| GLM mode | `docs/advisors/GLM_ADVISOR_METHOD.md` — mode pertinente |
| Azioni manuali operatore | `docs/foundation/OPERATOR_ACTION_HANDOFF_STANDARD.md` |
| Evidenza PASS ultimo Cursor | `docs/runtime/LAST_CURSOR_REPORT.md` una volta |
| Evidenza STOP ultimo Cursor | solo il nuovo `reports/runtime/cursor-stops/*.stop.json` selezionato dal delta Git |
| Handoff | solo per seed/resume quando il frontier/task non basta |
| Storia/audit | session log / PM / runtime-packets solo su necessità concreta |
| Workflow/runtime asset | solo file, diff, range o export necessari al task |

### Context guard

- non riversare grandi documenti o diff nel dialogo;
- non duplicare nel contesto ciò che resta leggibile nel repo;
- usare range/simboli/path mirati quando possibile;
- 20 prompt utente restano hard ceiling storico per GPT Web, ma il bootstrap lean deve rendere il rollover molto più economico;
- `handoff ora` resta kill switch manuale.

### Handoff v4

L'handoff ordinario è **seed/pointer**, non copia rolling del LIVE STATE.
Una nuova chat normalmente deve poter partire con:

```text
BOOTSTRAP control-plane. Esegui esclusivamente CORE BOOT e segui AUTO-VIA.
```

Un handoff esteso si usa solo quando esiste stato non ancora persistito nel frontier/active work/evidence.

### Manutenzione

Aggiornare questo blocco solo se cambiano:

- CORE BOOT;
- precedenza fonti;
- AUTO-VIA / standing operator authorization;
- `agg` / prompt sequencing gate;
- operator action handoff;
- context guard / navigazione on-demand.

HEAD, gate, runtime, task e NEXT vivono nel frontier/active work, non qui.
<!-- AI-BOOT: END -->

## Per gli umani — START HERE

| Doc | Ruolo |
|---|---|
| [docs/runtime/CURRENT_FRONTIER.md](docs/runtime/CURRENT_FRONTIER.md) | **LIVE STATE** compatto — unica autorità sullo stato operativo corrente |
| [docs/foundation/PROJECT_VISION.md](docs/foundation/PROJECT_VISION.md) | Foundation **v3.1** e invarianti |
| [docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md](docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md) | autorizzazione persistente dell'operatore per AUTO-VIA senza round-trip ripetuti |
| [docs/foundation/PROMPT_SEQUENCING_GATE.md](docs/foundation/PROMPT_SEQUENCING_GATE.md) | gate canonico `prompt N → agg → riepilogo → prompt N+1` |
| [docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md](docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md) | Operating model multi-planner → Cursor, on demand |
| [docs/contracts/backlog-item-v1.md](docs/contracts/backlog-item-v1.md) | GPT Web → planner |
| [docs/contracts/execution-packet-v1.md](docs/contracts/execution-packet-v1.md) | planner → Cursor |
| [docs/contracts/execution-checkpoint-v1.md](docs/contracts/execution-checkpoint-v1.md) | resume Cursor |
| [docs/foundation/CURSOR_PROMPT_TEMPLATE.md](docs/foundation/CURSOR_PROMPT_TEMPLATE.md) | execution contract Cursor |
| [docs/foundation/OPERATOR_ACTION_HANDOFF_STANDARD.md](docs/foundation/OPERATOR_ACTION_HANDOFF_STANDARD.md) | istruzioni manuali user-facing one-click / secret-safe |

## Architettura target v3

`GPT Web → GitHub backlog → n8n policy/gates → OpenClaw broker → Qwen/GLM/Codex planner → Execution Packet → Cursor bounded loop → Bugbot → GitHub`

Dettaglio e capability runtime effettivamente verificate: leggere il frontier e l'ACTIVE WORK corrente.

## Invarianti stabili

- GitHub = source of truth.
- GPT Web = orchestratore strategico / backlog owner.
- n8n = workflow/policy/gate; non planner LLM.
- OpenClaw = provider/auth/quota broker target.
- Cursor = execution harness; loop task-bounded.
- Workflow produzione mai mutati in silenzio.
- Runtime/credential/PM-34/L5/permanent schedule/loop seguono il frontier, l'AUTO-VIA e la standing operator authorization; si ferma solo davanti a un blocco manuale/tecnico reale o a scope non definito.

## Runtime / rebuild / export — solo on demand

Lo stato corrente **non** si ricostruisce da compatibility pointer o da cronologie MVP/PM.

| Need | Current owner |
|---|---|
| LIVE STATE / gate / authorization flags | `docs/runtime/CURRENT_FRONTIER.md` |
| Hard runtime / gate policy | `docs/foundation/PROJECT_VISION.md` (§7) |
| Recovery / rebuild method | `docs/N8N_REBUILD.md` |
| Workflow asset / export / import policy | `workflows/README.md` (+ asset sotto `workflows/**`) |
| n8n workflow naming method | `docs/N8N_WORKFLOW_NAMING.md` (not LIVE STATE / not inventory) |
| Telegram setup / secrets method | `docs/TELEGRAM_SETUP.md` |

Compatibility / history (non current owners):

- `docs/RUNTIME_GATES.md` — superseded policy pointer → PROJECT_VISION §7 + frontier
- `docs/WORKFLOW_EXPORT_STATUS.md` — superseded inventory pointer → `workflows/README` + `workflows/**` + frontier
- `docs/HANDOFF_N8N_GATE.md` — historical evidence pointer → `HANDOFF_TEMPLATE` + `workflows/README` + `N8N_REBUILD`
- `docs/PUBLIC_WEBHOOK_GATE.md` — historical decision pointer → PROJECT_VISION §7 + frontier

MVP-era archive candidates (`MVP_STATUS`, `MVP_CRITERIA`, `POST_MVP_BACKLOG`, `PLAN_OUTPUT_INGESTION`, `V4_POLLING_LATENCY`) are **not** LIVE STATE. Full pre-cleanup snapshots: Git recovery baseline [`777504f7c46e5e724b6ad5f8586a98d43bab7ce8`](https://github.com/mrhz1973/control-plane/tree/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs).

`docs/OBSERVABILITY.md` resta sotto consolidamento issue **#10** (NEEDS_REVIEW); non è LIVE STATE.

## Storico

Il materiale PM/session/runtime-packet resta evidence/history e **non fa parte del bootstrap**. `docs/PM_INDEX_ARCHIVE.md` è un indice storico, non una fonte corrente. La riduzione fisica dello storico è tracciata da issue **#10** e richiede recovery anchor + reference/evidence census prima di cancellazioni.
