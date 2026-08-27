# OPERATOR ACTION HANDOFF STANDARD — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/OPERATOR_ACTION_HANDOFF_STANDARD.md`  
**Versione:** 1.0 — 2026-08-27  
**Ruolo:** standard canonico user-facing per ogni istruzione operativa che richiede azioni manuali dell'operatore in UI, terminale, browser, n8n, GitHub, Cursor o altri tool.

---

## 0. Decisione operatore

L'operatore non deve trascrivere manualmente stringhe tecniche né ricostruire sequenze di click.

Quando GPT Web/orchestratore chiede un'azione manuale, ogni elemento esatto che l'operatore deve usare deve essere fornito in forma **one-click copy** quando tecnicamente possibile.

Questo vale in tutte le chat future del progetto.

---

## 1. Regola obbligatoria

Per ogni azione manuale dell'operatore:

1. indicare chiaramente **dove cliccare** e in quale ordine;
2. fornire in un blocco copiabile separato ogni valore esatto da inserire/incollare, ad esempio:
   - URL;
   - comando shell/PowerShell;
   - nome credenziale;
   - nome header;
   - hostname/domain;
   - path;
   - workflow/node/field name;
   - testo da incollare;
   - identificatore o selector;
3. usare **un valore/azione per blocco** quando più valori diversi potrebbero essere confusi;
4. evitare istruzioni tipo “scrivi X” lasciando X solo in prosa non copiabile;
5. per sequenze UI, indicare il percorso esatto con etichette visibili, per esempio:
   `Credentials → Create Credential → Header Auth`;
6. se un campo contiene un secret, **non** mettere il secret in chat/GitHub: fornire soltanto il nome del campo, il formato sicuro e il metodo per trasferirlo direttamente tra secret store/UI senza esposizione;
7. se un valore è già noto e non sensibile, non chiedere all'operatore di ridigitarlo da memoria;
8. se un link/URL diretto è noto e sicuro, fornire il link diretto invece di descrivere una lunga navigazione manuale;
9. se esiste AUTO-VIA e l'azione può essere eseguita dall'agente senza gate umano, non scaricarla sull'operatore.

---

## 2. Pattern canonico

Esempio:

**Clicca:** `Credentials → Create Credential → Header Auth`

Poi compilare:

**Name**
```text
Authorization
```

**Credential display name**
```text
CONTROL PLANE - OpenClaw Windows Gateway
```

**Allowed domain**
```text
asusdesktop.tailc01234.ts.net
```

Per un comando:

```powershell
ssh -N -L 5678:127.0.0.1:5678 ionos-n8n
```

Per un URL:

```text
http://127.0.0.1:5678/home/credentials
```

---

## 3. Secrets / credential boundary

- Mai stampare, copiare in GitHub, riportare in chat, hashare, misurare o mostrare token/password/API key quando il task richiede secret-safe handling.
- Se l'operatore deve trasferire un secret, guidarlo con un metodo che mantenga il valore fuori da chat/GitHub/log.
- I blocchi one-click devono contenere solo parti non sensibili (`Authorization`, `Bearer `, hostname, credential name, ecc.) oppure comandi che non stampano il secret.
- Se anche il comando potrebbe esporre il secret, STOP e scegliere un metodo più sicuro o richiedere il gate pertinente.

---

## 4. Relazione con Cursor

Per i prompt Cursor resta vigente `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`:

- modalità `AGENT` / `PLAN` prima del prompt;
- prompt = TASK DELTA;
- singolo blocco copiabile;
- `agg` separato.

Questo documento estende la stessa ergonomia **a tutte le altre istruzioni operative**, non solo a Cursor.

---

## 5. Anti-frizione

- Non chiedere all'operatore di trascrivere manualmente stringhe tecniche.
- Non presentare più valori simili nello stesso paragrafo quando possono essere confusi.
- Non inventare URL, path, SHA, ID o nomi di campi: usare solo valori verificati o dichiarare il valore sconosciuto.
- Non chiedere screenshot se l'agente può verificare direttamente via tool; usarli solo quando la UI umana è il gate reale o la UI non è osservabile dall'agente.
- Dopo ogni step manuale, indicare soltanto il prossimo step concreto; niente catene lunghe se l'esito del passo corrente condiziona quello successivo.

---

## 6. Precedenza

Questo standard governa la **presentazione delle azioni manuali all'operatore**.

Non amplia mai scope o autorizzazioni. In caso di conflitto:

1. `CURRENT_FRONTIER.md` per live state/gate;
2. foundation/contracts del task;
3. questo standard per l'ergonomia user-facing.

---

**Fine documento.**