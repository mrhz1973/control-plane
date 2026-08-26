# CURSOR PROMPT USER HANDOFF STANDARD — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`  
**Versione:** 2.0 — 2026-08-27  
**Stato:** CANONICAL  
**Ruolo:** standard permanente per come GPT Web/orchestratore costruisce e presenta i prompt destinati a Cursor.  
**Relazione:** complementare a `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`, `docs/contracts/execution-packet-v1.md`, `docs/contracts/planner-routing-policy-v1.md` e `docs/runtime/CURRENT_FRONTIER.md`.

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

## 1. Modalità Cursor — obbligatoria prima del blocco

Prima del blocco copiabile del prompt deve sempre comparire una delle due righe:

- **`MODALITÀ CURSOR: AGENT`** — Cursor deve eseguire modifiche, test, commit, evidence, push, deploy o altre azioni operative autorizzate.
- **`MODALITÀ CURSOR: PLAN`** — Cursor deve solo analizzare/progettare e non deve modificare file/runtime/stato.

La modalità è **fuori dal blocco** e non va confusa con il contenuto del task.

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

## 3. Template canonico

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
- nessun PASS/deploy/review/finito se il gate non lo consente;
- non improvvisare fuori scope per far passare il task.

OVERRIDE DEL PASS
<solo istruzioni non già coperte dal metodo canonico>
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

## 4. Regole per la modalità PLAN

Con **`MODALITÀ CURSOR: PLAN`** si usa lo stesso TASK DELTA, ma il contenuto deve rendere esplicito che:

- non sono autorizzate modifiche a file/runtime/stato;
- `SCOPE` riguarda analisi/discovery/progettazione;
- `ACCEPTANCE` riguarda evidenza o piano prodotto;
- `EVIDENCE / GIT` non autorizza commit/push salvo esplicita istruzione del pass;
- `OUTPUT` deve descrivere il piano/finding, non un’implementazione.

---

## 5. Regole anti-mega-prompt / anti-frizione

- Non trasformare il prompt in un secondo manuale operativo.
- Non ricopiare regole canoniche già nel repository.
- Non inventare SHA, blob, build LIVE, candidate o stato di partenza.
- Non aggiungere sezioni generiche che non cambiano il comportamento del pass.
- Non spezzare il prompt in più blocchi che l’operatore deve ricomporre.
- Non duplicare una versione breve e poi una versione lunga dello stesso prompt.
- Se il task è già in corso, descrivere solo il delta residuo/fix corrente.
- Se esiste un unico fix residuo, concentrarsi su quel fix e sulle acceptance correlate.
- Non fermarsi a docs-only quando il gate corrente autorizza già implementazione e non esiste un blocker reale.
- Se il gate corrente richiede review/deploy/QA/closure, richiamare la regola canonica pertinente invece di riscriverla tutta.

---

## 6. Presentazione user-facing obbligatoria

Quando GPT Web/orchestratore consegna il prompt all’operatore:

1. mostra prima la modalità:
   `MODALITÀ CURSOR: AGENT` oppure `MODALITÀ CURSOR: PLAN`;
2. mostra **un solo blocco cliccabile/copabile** con il TASK DELTA completo;
3. non mescola spiegazioni dell’orchestratore dentro il blocco;
4. dopo il prompt mostra un secondo blocco copiabile contenente soltanto:

```text
agg
```

5. quando Cursor conclude, non è necessario copiare il suo riepilogo nella chat se stato/evidence sono stati persistiti correttamente su GitHub: l’operatore usa `agg`.

---

## 7. Esempio canonico — D-0015-W

**MODALITÀ CURSOR: AGENT**

```text
=== INIZIO PROMPT CURSOR ===

BLOCK-ID: D-0015-W
CATEGORY: DELICATO
CLOSURE: NONE

OBIETTIVO
Rendere persistente/idempotente l'avvio del fallback Windows OpenClaw già operativo e verificare la raggiungibilità privata dal runtime n8n fino al punto precedente a un eventuale nuovo gate credenziale/workflow.

PRECHECK
- verifica origin/main secondo metodo canonico;
- working copy canonica e clean;
- usa CURRENT_FRONTIER come stato vivo;
- verifica che D-0014-W risulti PASS e che il gate D-0015-W sia autorizzato;
- mismatch → STOP.

SCOPE
- autostart non distruttivo dell'OpenClaw Windows esistente;
- mantenimento loopback + Tailscale Serve;
- verifica `/health` dal runtime/container n8n;
- discovery metadata-only di auth mode e di eventuale binding n8n già esistente;
- identificazione del workflow/insertion point necessario al fallback.

PRESERVARE
- Windows resta fallback, VPS resta canonical primary;
- OpenClaw resta loopback-only;
- Tailscale Serve resta tailnet-only;
- nessun Funnel/public exposure;
- stato Z.AI/VPS invariato.

OUT OF SCOPE
- creazione/copia/rotazione di credenziali;
- modifica di `gateway.auth.mode`;
- workflow n8n inventato autonomamente;
- nuovi probe modello/provider;
- PM-34, L5, endurance o schedule permanente.

ACCEPTANCE
1. OpenClaw Windows riparte tramite meccanismo user-level idempotente senza duplicare processi.
2. Gateway resta su `127.0.0.1:18789` e Tailscale Serve resta privato.
3. Il runtime/container n8n raggiunge `/health` del fallback con esito positivo.
4. È determinato, senza leggere valori segreti, se esiste già un binding n8n utilizzabile.
5. È identificato il punto esatto del workflow n8n dove andrà applicato il routing fallback.
6. Nessuna richiesta provider/modello viene eseguita per validare il trasporto.

STOP
- per completare il wiring serve creare/copiare/modificare una credenziale;
- serve modificare `gateway.auth.mode`;
- serve inventare autonomamente logica n8n non fornita da GPT Web;
- serve esposizione pubblica o ampliamento scope;
- acceptance tecnica fallisce dopo il bounded loop previsto dal metodo canonico.

OVERRIDE DEL PASS
Se manca un binding n8n sicuro, completa prima autostart, transport health e discovery del workflow target; poi STOP con:
`BLOCKED_N8N_OPENCLAW_CREDENTIAL_BINDING_REQUIRED`.

EVIDENCE / GIT
Segui la regola canonica pertinente al gate corrente.
Persisti solamente lo stato/evidence richiesto per D-0015-W; niente documenti PREP ridondanti.

OUTPUT
PASS — D-0015-W NON-CREDENTIAL STAGE COMPLETE
oppure:
STOP — <finding preciso>

=== FINE PROMPT CURSOR ===
```

---

## 8. Precedenza

Questo documento governa la **forma e la densità user-facing del prompt Cursor**.

In caso di conflitto:

1. `docs/runtime/CURRENT_FRONTIER.md` — live state/gate;
2. foundation/contracts del control-plane — metodo stabile;
3. Execution Packet/task contract — scope/acceptance specifici;
4. questo documento — presentazione e regola TASK DELTA.

Nessuna regola di formattazione può ampliare scope o autorizzazioni.

---

**Fine documento.**
