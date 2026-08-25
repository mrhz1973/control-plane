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
- AUTO-VIA non amplia lo scope e non trasforma un gate umano in decisione tecnica.

STOP soltanto per gate reale, ad esempio:

- scelta strategica con più opzioni non equivalenti;
- credenziali/OAuth/billing mutation;
- distruttivo o irreversibile;
- deploy/runtime/produzione non già autorizzato;
- scope expansion;
- fallback non equivalente;
- conflitto tra fonti vive;
- policy violation;
- loop non convergente.

### `agg` — refresh dopo un pass Cursor

`agg` significa **aggiornamento minimo evidence-aware**, non reboot completo.

Eseguire:

1. refresh `origin/main`;
2. rileggere `CURRENT_FRONTIER.md`;
3. rileggere ACTIVE WORK pointer se presente;
4. leggere `docs/runtime/LAST_CURSOR_REPORT.md` **una sola volta** soltanto se il gate/NEXT dipende dal pass Cursor appena concluso;
5. leggere evidence aggiuntiva solo se esplicitamente puntata e necessaria;
6. applicare AUTO-VIA.

Se report/evidence e frontier confliggono: **CURRENT_FRONTIER prevale per LIVE STATE**; dichiarare l'evidence stale/conflicting, non ricostruire lo stato dalla narrativa.

`agg` non equivale a handoff e non precarica foundation/storico.

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
LAST_CURSOR_REPORT / verify = EVIDENCE
        >
handoff                    = STABLE SEED / checkpoint storico
        >
session/PM/history         = AUDIT/HISTORY
        >
memoria chat
```

Per architettura/invarianti, quando necessario: `docs/foundation/PROJECT_VISION.md` è canonico.
Per stato runtime: `docs/runtime/CURRENT_FRONTIER.md` è sempre canonico.

### ON DEMAND — aprire solo quando serve

| Bisogno | Fonte |
|---|---|
| Foundation / ruoli / hard policy | `docs/foundation/PROJECT_VISION.md` — sezione pertinente |
| Operating model multi-planner | `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` — sezione pertinente |
| Backlog / routing / packet / checkpoint | solo contratto o istanza pertinente |
| Esecuzione Cursor | `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` |
| GLM mode | `docs/advisors/GLM_ADVISOR_METHOD.md` — mode pertinente |
| Evidenza ultimo pass Cursor | `docs/runtime/LAST_CURSOR_REPORT.md` una volta |
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
- AUTO-VIA;
- `agg`;
- context guard / navigazione on-demand.

HEAD, gate, runtime, task e NEXT vivono nel frontier/active work, non qui.
<!-- AI-BOOT: END -->

## Per gli umani — START HERE

| Doc | Ruolo |
|---|---|
| [docs/runtime/CURRENT_FRONTIER.md](docs/runtime/CURRENT_FRONTIER.md) | **LIVE STATE** compatto — unica autorità sullo stato operativo corrente |
| [docs/foundation/PROJECT_VISION.md](docs/foundation/PROJECT_VISION.md) | Foundation **v3.1** e invarianti |
| [docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md](docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md) | Operating model multi-planner → Cursor, on demand |
| [docs/contracts/backlog-item-v1.md](docs/contracts/backlog-item-v1.md) | GPT Web → planner |
| [docs/contracts/execution-packet-v1.md](docs/contracts/execution-packet-v1.md) | planner → Cursor |
| [docs/contracts/execution-checkpoint-v1.md](docs/contracts/execution-checkpoint-v1.md) | resume Cursor |
| [docs/foundation/CURSOR_PROMPT_TEMPLATE.md](docs/foundation/CURSOR_PROMPT_TEMPLATE.md) | execution contract Cursor |

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
- Runtime/credential/PM-34/L5/permanent schedule/loop richiedono i gate correnti indicati nel frontier.

## Runtime / rebuild / export — solo on demand

Lo stato corrente **non** si ricava dai vecchi runbook/status document.

- stato e gate correnti → `docs/runtime/CURRENT_FRONTIER.md`;
- hard policy → `docs/foundation/PROJECT_VISION.md`;
- workflow/export asset → `workflows/**` e relativo file specifico solo quando il task lo richiede;
- `docs/N8N_REBUILD.md`, `docs/RUNTIME_GATES.md`, `docs/WORKFLOW_EXPORT_STATUS.md`, `docs/N8N_WORKFLOW_NAMING.md` e `docs/TELEGRAM_SETUP.md` contengono ancora materiale operativo utile **mescolato a snapshot storici** e sono sotto consolidamento in issue **#10**; non usarli come LIVE STATE.

## Storico

Il materiale PM/session/runtime-packet resta evidence/history e **non fa parte del bootstrap**. `docs/PM_INDEX_ARCHIVE.md` è un indice storico, non una fonte corrente. La riduzione fisica dello storico è tracciata da issue **#10** e richiede recovery anchor + reference/evidence census prima di cancellazioni.
