# CURSOR PROMPT USER HANDOFF STANDARD — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`  
**Versione:** 1.0 — 2026-08-27  
**Ruolo:** standard canonico di presentazione all'operatore dei prompt destinati a Cursor.  
**Relazione:** complementare a `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`; non modifica scope, gate o runtime.

---

## 0. Decisione operatore

L'operatore ha stabilito che ogni prompt operativo da consegnare a Cursor deve essere presentato in chat come **un unico blocco cliccabile/copabile**, chiaramente separato dalla spiegazione dell'orchestratore.

Questo standard riguarda la **presentazione user-facing** del prompt. Il contenuto tecnico resta governato da:

- `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`;
- `docs/contracts/execution-packet-v1.md`;
- `docs/contracts/planner-routing-policy-v1.md`;
- `docs/runtime/CURRENT_FRONTIER.md`.

---

## 1. Regola obbligatoria di presentazione

Quando GPT Web/orchestratore deve consegnare un prompt da incollare in Cursor:

1. dare prima, fuori dal prompt, solo il minimo contesto utile all'operatore;
2. presentare **un singolo blocco copiabile** con titolo esplicito:
   `INCOLLA IN CURSOR — <TASK-ID> — <scopo breve>`;
3. non spezzare il prompt operativo in più blocchi o frammenti;
4. non mescolare commenti dell'orchestratore dentro il blocco;
5. dopo il prompt, fornire separatamente un secondo blocco copiabile contenente soltanto:
   `agg`;
6. il messaggio dell'orchestratore deve comunque terminare con il protocollo di progetto `NEXT:`, `WAIT:` o `DONE:`.

---

## 2. Struttura raccomandata del blocco Cursor

Il blocco user-facing deve essere leggibile e operativo. Salvo task molto piccoli, usare questa struttura:

```text
<TITOLO / TASK / CONTINUE CONTEXT se necessario>

ROLE:
<ruolo Cursor / workstream>

TASK / PR / ISSUE:
<riferimento persistente>

CANONICAL CONTEXT:
<fonti GitHub da leggere>

OBJECTIVE:
<single bounded goal>

AUTHORIZED / ALLOWED:
- ...

FORBIDDEN:
- ...

PREFLIGHT:
- repository / branch / HEAD / workspace checks

EXECUTE:
1. ...
2. ...
3. ...

VALIDATE:
- ...

ACCEPTANCE:
- ...

LOOP POLICY:
- bounded implement -> test -> fix -> test
- max rounds

STOP ONLY IF:
- real gate / blocker nominato

FINALIZATION:
- selective staging
- commit/push
- exact-head verification
- LAST_CURSOR_REPORT / CURRENT_FRONTIER persistence when required

FINAL REPORT:
- verbatim Git outputs required by cursor-standard-v3
```

Il contenuto può essere più corto se il task lo consente, ma non deve perdere scope, acceptance, stop conditions o riferimenti canonici richiesti dal contratto Cursor.

---

## 3. Pattern visivo canonico per GPT Web

La risposta all'operatore deve avere questa forma concettuale:

```text
<breve stato / spiegazione, se necessaria>

[blocco copiabile]
INCOLLA IN CURSOR — D-NNNN-X — <titolo>

...prompt completo...
[/blocco]

[blocco copiabile]
agg
[/blocco]

NEXT: <prossimo step concreto>
```

Il pulsante/capacità di copia è parte dell'esperienza di presentazione: l'operatore non deve selezionare manualmente pezzi del prompt sparsi nella risposta.

---

## 4. Regole anti-frizione

- Non inviare prima una versione riassunta e poi una seconda versione completa dello stesso prompt.
- Non richiedere all'operatore di ricomporre sezioni separate.
- Non inserire comandi `agg`, `next`, `format`, ecc. dentro il prompt Cursor salvo che facciano realmente parte del task esecutivo; `agg` resta fuori e separato.
- Non fermarsi a una fase docs-only quando un gate già autorizza l'implementazione e non esiste un blocker reale.
- Quando il task precedente è già in corso, usare un header tipo `CONTINUE <TASK/PR> — <correzione/scopo>` invece di rispiegare il progetto da zero.
- Se esiste un unico fix residuo, il prompt deve concentrarsi su quel fix e sulle verifiche finali, non rigenerare un piano generale.

---

## 5. Esempio minimale

```text
INCOLLA IN CURSOR — D-0015-W — HARDEN FALLBACK + N8N PRIVATE ROUTING

ROLE:
HARNESS / CONTROL-PLANE EXECUTION

TASK:
D-0015-W

CANONICAL CONTEXT:
Read CURRENT_FRONTIER, task issue, Execution Packet and latest checkpoint/report.

OBJECTIVE:
Complete the already-authorized bounded implementation.

AUTHORIZED:
- ...

FORBIDDEN:
- ...

EXECUTE:
1. ...

VALIDATE:
- ...

STOP ONLY IF:
- real gate ...

FINALIZATION:
Persist evidence, commit/push, exact-head verification.
```

Poi, separatamente:

```text
agg
```

---

## 6. Precedenza

Questo documento governa **come GPT Web presenta all'operatore il prompt Cursor**.

In caso di conflitto sul contenuto tecnico o sull'autorizzazione:

1. `CURRENT_FRONTIER.md` per live state/gate;
2. foundation/contracts del control-plane;
3. Execution Packet/task contract;
4. questo documento per la sola presentazione user-facing.

Nessuna regola di formattazione può ampliare scope o autorizzazioni.

---

**Fine documento.**
