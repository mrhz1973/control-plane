# HANDOFF TEMPLATE — control-plane

**Versione:** **4.0 — wiki-LLM lean**
**Ruolo:** seed/pointer di rollover, **non LIVE STATE**.
**Runtime autorizzato:** **NO**.

## Principio

La nuova chat deve ricostruire lo stato dal repo vivo con il CORE BOOT del `README.md`.

L'handoff **non deve duplicare**:

- CURRENT_FRONTIER;
- PROJECT_VISION;
- issue/backlog body;
- LAST_CURSOR_REPORT;
- cronologia PM/session;
- runtime state già persistito.

Se GitHub è avanzato dopo l'handoff, GitHub prevale.

## Seed ordinario — formato preferito

Nella maggior parte dei rollover basta questo blocco:

```text
BOOTSTRAP control-plane.
Repo: mrhz1973/control-plane
Esegui esclusivamente CORE BOOT dal README AI-BOOT e segui AUTO-VIA.
```

Non serve creare un nuovo file handoff se **tutto** lo stato necessario è già nel frontier + ACTIVE WORK + evidence puntata.

## Quando creare un handoff file

Creare `docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff-<ruolo>.md` solo se esiste almeno uno di questi casi:

1. informazione necessaria non ancora persistita altrove;
2. transizione tra fasi che richiede un checkpoint narrativo una tantum;
3. decisione recente ancora in attesa di normalizzazione nel frontier/backlog;
4. stato locale importante che non appartiene al LIVE STATE globale;
5. rischio concreto che la nuova chat non possa determinare il prossimo passo dal CORE BOOT.

## Template handoff esteso — solo se necessario

```markdown
# Handoff — <topic>

Repository: mrhz1973/control-plane
Producer: <GPT Web | altro>
Reason: <context rollover | phase transition | other>
Active work: <issue/path/ref>

## Delta non ancora ricavabile dal repo vivo
- <solo fatti realmente mancanti>

## Stato locale non globale
- macchina/workspace: <...>
- branch/head noto: <...>
- clean/stale/unknown: <...>

## Gate reale
- <gate oppure NONE>

## next_action
<un solo passo concreto>

## Bootstrap nuova chat
BOOTSTRAP control-plane. Esegui esclusivamente CORE BOOT dal README AI-BOOT e segui AUTO-VIA.
```

## Regole

- usare `UNKNOWN` invece di inventare;
- non auto-certificare l'HEAD/commit che contiene l'handoff;
- un handoff non è PASS;
- non copiare interi documenti canonici dentro l'handoff;
- non usare il numero di prompt come ragione per gonfiare l'handoff: i 20 prompt restano hard ceiling, ma il seed deve restare piccolo;
- handoff vecchi = history/checkpoint, non stato corrente.

## Relazione con Execution Checkpoint

Per task Cursor incompleti, il vero resume operativo è:

```text
Execution Packet
+ latest Execution Checkpoint
+ live Git
```

Non creare un secondo handoff narrativo che duplichi il checkpoint.

## Relazione con `agg`

`agg` è refresh dopo un pass Cursor e normalmente **non crea handoff**:

```text
remote HEAD → CURRENT_FRONTIER → ACTIVE WORK → LAST_CURSOR_REPORT se necessario → AUTO-VIA
```

## Manutenzione

Aggiornare questo template solo se cambia il protocollo di rollover. Stato/gate/NEXT non devono mai essere persistiti qui.
