# OPERATOR ACTION HANDOFF STANDARD — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/OPERATOR_ACTION_HANDOFF_STANDARD.md`  
**Versione:** 1.3 — 2026-09-12  
**Ruolo:** standard canonico user-facing per ogni istruzione operativa che richiede azioni manuali dell'operatore in UI, terminale, browser, n8n, GitHub o altri tool.

---

## 0. Decisione operatore

L'operatore non deve trascrivere manualmente stringhe tecniche né ricostruire sequenze di click.

Quando GPT Web/orchestratore chiede un'azione manuale, ogni elemento esatto che l'operatore deve usare deve essere fornito in forma **one-click copy** quando tecnicamente possibile.

Questo vale in tutte le chat future del progetto.

---

## 1. Regola obbligatoria

Per ogni azione manuale dell'operatore:

1. indicare chiaramente **dove cliccare** e in quale ordine;
2. fornire in un blocco copiabile separato ogni valore esatto da inserire/incollare, ad esempio URL, comando, path, hostname, workflow/node/field name, testo o identificatore;
3. usare **un valore/azione per blocco** quando più valori diversi potrebbero essere confusi;
4. evitare istruzioni che obbligano l'operatore a trascrivere stringhe dalla prosa;
5. per sequenze UI, indicare il percorso esatto con etichette visibili;
6. se un campo contiene un secret, non mettere il secret in chat/GitHub: fornire soltanto il metodo secret-safe;
7. se un valore è già noto e non sensibile, non chiedere all'operatore di ridigitarlo da memoria;
8. se un link diretto è noto e sicuro, fornire il link diretto;
9. se esiste AUTO-VIA e l'azione può essere eseguita dall'agente senza gate umano, non scaricarla sull'operatore.

---

## 2. Regola di compattezza

- valori brevi: normale code block compatto;
- contenuti lunghi/strutturati: un solo blocco copiabile;
- preferire sempre la superficie copiabile più piccola disponibile.

---

## 3. Prompt operativi — recipient-neutral default

Quando l'operatore non ha già fissato il destinatario del prompt, si applica:

`docs/foundation/EXECUTOR_PROMPT_USER_HANDOFF_STANDARD.md`

Il prompt copiabile deve essere neutro rispetto a modello/provider/harness e deve usare:

```text
=== INIZIO PROMPT ===
...
=== FINE PROMPT ===
```

Non inserire nel prompt un modello, provider, IDE, app, CLI o agent come destinatario presunto.

`docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` resta applicabile solo quando Cursor è stato esplicitamente scelto come destinazione.

La scelta della superficie di esecuzione è routing metadata e resta fuori dal semantic task prompt finché non è fissata.

---

## 4. Secrets / credential boundary

Mai stampare, copiare in GitHub, riportare in chat o mostrare token/password/API key quando il task richiede secret-safe handling.

---

## 5. Anti-frizione

- non chiedere trascrizioni manuali inutili;
- non inventare URL, path, SHA, ID o nomi di campi;
- non chiedere screenshot se lo stato è verificabile direttamente;
- dopo ogni gate manuale, indicare il prossimo step concreto;
- non chiedere un ulteriore `vai` quando AUTO-VIA determina già il passo successivo.

---

## 6. Precedenza

1. `CURRENT_FRONTIER.md` per live state/gate;
2. foundation/contracts del task;
3. `EXECUTOR_PROMPT_USER_HANDOFF_STANDARD.md` quando il destinatario non è fissato;
4. standard executor-specifico solo dopo selezione esplicita della superficie;
5. questo standard per ergonomia user-facing generale.

**Fine documento.**
