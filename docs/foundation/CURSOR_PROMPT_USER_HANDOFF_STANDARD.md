# CURSOR PROMPT USER HANDOFF STANDARD — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`  
**Versione:** 3.0 — 2026-08-31  
**Stato:** CANONICAL  
**Ruolo:** standard permanente per come GPT Web/orchestratore costruisce e presenta i prompt destinati a Cursor.  
**Relazione:** complementare a `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`, `docs/foundation/PROMPT_SEQUENCING_GATE.md`, `docs/contracts/execution-packet-v1.md`, `docs/contracts/planner-routing-policy-v1.md` e `docs/runtime/CURRENT_FRONTIER.md`.

---

## 0. Principio fondamentale — TASK DELTA, non secondo manuale

Ogni prompt operativo destinato a Cursor deve essere un **TASK DELTA**.

Il prompt deve contenere solo **cosa Cursor deve fare nel pass corrente**. Il metodo stabile del progetto resta nel repository e **non va ricopiato ogni volta**.

Quindi il prompt non deve riscrivere sistematicamente:

- preflight Git completo se già definito dal metodo canonico;
- regole generali di review/deploy/QA;
- OPSEC/secret policy già canonica;
- checkpoint/closure/reporting boilerplate già canonico;
- regole di `finito`, connector, bundle, evidence o gate già persistite;
- spiegazioni generali del progetto.

Quando una regola è già canonica, usare formule concise come:

> `Segui la regola canonica pertinente al gate corrente.`

Si aggiunge soltanto il **delta specifico del pass**.

---

## 1. Header user-facing obbligatorio — tre righe, sempre

Prima del singolo blocco copiabile TASK DELTA devono comparire **sempre**, fuori dal blocco e in questo ordine esatto:

```text
MODELLO CURSOR: <modello esatto raccomandato>
BUGBOT: <NO | SÌ>
MODALITÀ CURSOR: <AGENT | PLAN>
```

Tutte e tre le righe sono obbligatorie anche quando il valore non cambia rispetto al prompt precedente.

### 1.1 MODELLO CURSOR

- Il valore deve essere il nome concreto, verificato e utilizzabile dall'operatore.
- Vietato `MODELLO CURSOR: AUTO`.
- Vietati nomi vaghi, famiglie generiche o disponibilità inventate.
- Esempi validi quando realmente disponibili:
  - `MODELLO CURSOR: Composer 2.5 non-Fast`
  - `MODELLO CURSOR: GLM 5.3 BYOK`
- La scelta del modello è **routing metadata**: resta fuori dal corpo semantico del TASK DELTA e non modifica scope, gate, acceptance o autorizzazioni.
- Se il catalogo Cursor cambia, usare il modello verificato equivalente e mostrarne il nome esatto.

### 1.2 Policy canonica di raccomandazione modello Cursor

Default operativo:

- task deterministico, meccanico, docs-only, exact patch apply, offline adapter o correzione minima già diagnosticata → preferire **Composer 2.5 non-Fast**;
- architettura, debugging difficile, integrazione cross-system/runtime o blocker tecnico complesso → preferire **GLM 5.3 BYOK** quando disponibile e quando la quota lo consente;
- non scegliere Fast come default soltanto per velocità;
- il modello scelto non modifica scope, gate o acceptance.

Policy stabile di conservazione quota GLM, basata sulla percentuale di quota **consumata** nel periodo osservato:

| Consumo GLM | Stato | Policy |
|---|---|---|
| `0–60%` | GREEN | uso tecnico normale GLM |
| `>60–75%` | ATTENTION | evitare GLM per docs/trivial/meccanico |
| `>75–85%` | RESERVE | GLM solo per architettura, debugging difficile, integrazione e blocker |
| `>85%` | PROTECTION | GLM solo per blocker realmente critici |

GLM non va usato per loop di test/proof meramente ripetitivi.

Questa tabella è una **policy stabile**, non uno snapshot del consumo corrente. Il consumo corrente deve provenire da una fonte verificata quando serve al routing e non va inventato.

### 1.3 BUGBOT

Ogni prompt Cursor deve dichiarare esattamente una delle due forme:

```text
BUGBOT: NO
```

oppure:

```text
BUGBOT: SÌ
```

Semantica canonica:

**`BUGBOT: NO`**

- non invocare BugBot in quel pass;
- nessuna review BugBot implicita è autorizzata.

**`BUGBOT: SÌ`**

- dopo i test richiesti e prima della closure, invocare `/review-bugbot` **una sola volta**;
- niente Autofix;
- nessun finding blocking/actionable → `PASS_NO_FINDINGS`;
- finding actionable/blocking → **STOP immediato** con finding preciso, senza edit o rerun nello stesso pass;
- BugBot non disponibile → `STOP BUGBOT_NOT_AVAILABLE`.

BugBot è reviewer, non router e non implementatore.

### 1.4 MODALITÀ CURSOR

- **`MODALITÀ CURSOR: AGENT`** — Cursor deve eseguire modifiche, test, commit, evidence, push, deploy o altre azioni operative autorizzate.
- **`MODALITÀ CURSOR: PLAN`** — Cursor deve solo analizzare/progettare e non deve modificare file/runtime/stato.

La modalità resta routing/presentation metadata fuori dal TASK DELTA.

---

## 2. Forma canonica del TASK DELTA

Il blocco operativo deve essere unico, cliccabile/copabile e racchiuso concettualmente tra:

```text
=== INIZIO PROMPT CURSOR ===
...
=== FINE PROMPT CURSOR ===
```

I campi vanno presentati in questo ordine logico:

1. **BLOCK-ID / TASK** — identificatore canonico del lavoro.
2. **CATEGORY** — `ROUTINE` oppure `DELICATO`.
3. **CLOSURE** — per esempio `NONE`, `STANDARD_RUNTIME_BUNDLE` o altro closure canonico realmente applicabile.
4. **Stato di partenza verificabile** — build LIVE, SHA/blob/candidate solo quando realmente noti da GitHub. **Mai inventarli.**
5. **OBIETTIVO** — risultato concreto e bounded del pass.
6. **PRECHECK** — solo delta/precondizioni specifiche; il resto richiama il metodo canonico.
7. **SCOPE** — funzioni/UI/path/runtime che il pass può toccare.
8. **PRESERVARE** — comportamento esistente che non deve cambiare.
9. **OUT OF SCOPE** — ciò che non deve essere implementato incidentalmente.
10. **ACCEPTANCE** — test osservabili e numerati; descrivono il comportamento, non semplicemente “funziona”.
11. **STOP** — mismatch base, working tree incompatibile, gate fallito, candidate/blob differente, QA/test fallito o altro blocker reale → STOP, non improvvisare.
12. **OVERRIDE DEL PASS** — solo eccezioni/istruzioni aggiuntive non già nel metodo canonico; se non esistono, `NONE`.
13. **EVIDENCE / GIT** — soltanto ciò che il gate corrente richiede; richiamare il metodo canonico per il boilerplate.
14. **OUTPUT** — una riga finale precisa che consenta all'orchestratore di usare `agg`.

---

## 3. Template user-facing canonico completo

```text
MODELLO CURSOR: <modello esatto raccomandato>
BUGBOT: <NO | SÌ>
MODALITÀ CURSOR: <AGENT | PLAN>
```

Poi, separatamente, il singolo blocco copiabile:

```text
=== INIZIO PROMPT CURSOR ===

BLOCK-ID: <ID>
CATEGORY: <ROUTINE | DELICATO>
CLOSURE: <NONE | STANDARD_RUNTIME_BUNDLE | ...>

STATO DI PARTENZA
<solo build/SHA/blob/candidate realmente noti e verificabili; omettere ciò che non è noto>

OBIETTIVO
<risultato preciso del pass>

PRECHECK
- verificare origin/main secondo metodo canonico;
- working copy canonica e clean;
- verificare la baseline richiesta solo se realmente nota/persistita;
- mismatch → STOP.

SCOPE
<funzioni / UI / dati / workflow / runtime interessati>

PRESERVARE
<comportamenti esistenti che non devono cambiare>

OUT OF SCOPE
<cose esplicitamente escluse>

ACCEPTANCE
1. <test osservabile>
2. <test osservabile>
3. <regressione da verificare>
4. <console/network/storage/runtime check se pertinente>

STOP
- <condizione reale 1>
- <condizione reale 2>
- al primo blocker/failure del pass → STOP con causa precisa;
- nessun PASS/deploy/review/finito se il gate non lo consente;
- non improvvisare fuori scope per far passare il task.

OVERRIDE DEL PASS
<solo istruzioni non già coperte dal metodo canonico; qui deve essere esplicito anche un eventuale bounded corrective loop>
oppure:
NONE.

EVIDENCE / GIT
Segui la regola canonica pertinente al gate corrente.
<aggiungere solo candidate/review package/diff/deploy evidence specifici di questo pass>

OUTPUT
PASS — <status line precisa>
oppure:
STOP — <finding preciso>

=== FINE PROMPT CURSOR ===
```

---

## 4. One-pass default — regola canonica

Salvo override esplicito del TASK DELTA, un pass bounded segue questo flusso una sola volta:

```text
implement
→ target test una volta
→ regressioni richieste una volta
→ review una volta soltanto se BUGBOT:SÌ
→ evidence
→ commit/push
```

Al primo blocker o failure:

```text
STOP — <causa precisa>
```

Nello stesso pass **non** eseguire automaticamente:

```text
fix → test → fix → test
```

Un failure già diagnosticato genera un nuovo piccolo corrective pass dopo il normale `agg` + riepilogo, non un loop interno implicito.

Eccezione: il TASK DELTA corrente può autorizzare **esplicitamente** un bounded corrective loop, con scope, condizioni di stop e bound numerico o equivalente. In assenza di questa autorizzazione esplicita, il default resta one-pass.

Questa regola prevale sui vecchi esempi generici di loop quando il task corrente non autorizza esplicitamente il loop.

---

## 5. Regole per la modalità PLAN

Con **`MODALITÀ CURSOR: PLAN`** si usa lo stesso TASK DELTA, ma il contenuto deve rendere esplicito che:

- non sono autorizzate modifiche a file/runtime/stato;
- `SCOPE` riguarda analisi/discovery/progettazione;
- `ACCEPTANCE` riguarda evidenza o piano prodotto;
- `EVIDENCE / GIT` non autorizza commit/push salvo esplicita istruzione del pass;
- `OUTPUT` deve descrivere il piano/finding, non un’implementazione.

Gli header `MODELLO CURSOR`, `BUGBOT` e `MODALITÀ CURSOR` restano comunque tutti obbligatori.

---

## 6. Regole anti-mega-prompt / anti-frizione

- Non trasformare il prompt in un secondo manuale operativo.
- Non ricopiare regole canoniche già nel repository.
- Non inventare SHA, blob, build LIVE, candidate, disponibilità modello o stato di partenza.
- Non aggiungere sezioni generiche che non cambiano il comportamento del pass.
- Non spezzare il prompt in più blocchi che l’operatore deve ricomporre.
- Non duplicare una versione breve e poi una versione lunga dello stesso prompt.
- Se il task è già in corso, descrivere solo il delta residuo/fix corrente.
- Se esiste un unico fix residuo, concentrarsi su quel fix e sulle acceptance correlate.
- Non fermarsi a docs-only quando il gate corrente autorizza già implementazione e non esiste un blocker reale.
- Se il gate corrente richiede review/deploy/QA/closure, richiamare la regola canonica pertinente invece di riscriverla tutta.

---

## 7. Presentazione user-facing obbligatoria

Quando GPT Web/orchestratore consegna il prompt all’operatore:

1. mostra nell'ordine le tre righe obbligatorie:
   - `MODELLO CURSOR: <nome esatto>`;
   - `BUGBOT: <NO | SÌ>`;
   - `MODALITÀ CURSOR: <AGENT | PLAN>`;
2. mostra **un solo blocco cliccabile/copabile** con il TASK DELTA completo;
3. non mescola spiegazioni dell’orchestratore dentro il blocco;
4. dopo il prompt mostra un secondo blocco copiabile contenente soltanto:

```text
agg
```

5. quando Cursor conclude, non è necessario copiare il suo riepilogo nella chat se stato/evidence sono stati persistiti correttamente su GitHub: l’operatore usa `agg`.

### 7.1 Sequencing gate tra prompt consecutivi

Dopo che GPT Web ha consegnato un prompt Cursor, **non può consegnarne un altro** finché il pass precedente non ha completato questa sequenza:

```text
prompt N consegnato
→ Cursor esegue N
→ operatore invia `agg`
→ GPT Web refresh origin/main + CURRENT_FRONTIER + evidence pertinente
→ GPT Web riepiloga l'esito N all'operatore
→ solo dopo può essere emesso prompt N+1
```

Questo gate vale anche se nel frattempo:

- un provider/modello torna disponibile;
- scade/resetta una quota;
- il prossimo fix appare ovvio;
- l'operatore scrive genericamente `vai`, `procedi` o `next`.

Questi eventi possono essere registrati, ma **non autorizzano un nuovo TASK DELTA mentre il precedente è ancora privo del suo `agg` + riepilogo**.

Eccezione unica: override esplicito dell'operatore che chieda chiaramente di ignorare questo specifico sequencing gate.

Fonte canonica dedicata: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

---

## 8. Esempio minimo di presentazione

Per un task docs-only/meccanico, quando il catalogo verificato lo rende disponibile:

```text
MODELLO CURSOR: Composer 2.5 non-Fast
BUGBOT: NO
MODALITÀ CURSOR: AGENT
```

Segue un solo TASK DELTA copiabile e, dopo il blocco, il solo comando:

```text
agg
```

L'esempio mostra la forma; il modello concreto per un task reale deve sempre essere scelto dalla policy e dalla disponibilità verificata al momento del routing.

---

## 9. Precedenza

Questo documento governa la **forma user-facing, la raccomandazione del modello Cursor, la dichiarazione BugBot e il default one-pass**.

In caso di conflitto:

1. `docs/runtime/CURRENT_FRONTIER.md` — live state/gate;
2. foundation/contracts del control-plane — metodo stabile;
3. Execution Packet/task contract — scope/acceptance specifici ed eventuale bounded corrective loop esplicito;
4. questo documento — presentazione e regola TASK DELTA.

Nessuna regola di formattazione o routing modello può ampliare scope o autorizzazioni.

---

**Fine documento.**
