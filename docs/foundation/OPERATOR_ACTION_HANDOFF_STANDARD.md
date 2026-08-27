# OPERATOR ACTION HANDOFF STANDARD — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/OPERATOR_ACTION_HANDOFF_STANDARD.md`  
**Versione:** 1.1 — 2026-08-27  
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

## 2. Regola di compattezza — OBBLIGATORIA

Per evitare blocchi enormi nella UI ChatGPT:

- per **valori brevi** (nomi campo, header, hostname, ID, path corto, URL corto, singolo comando) usare un normale **code block compatto**, che mantiene il pulsante copia;
- **non usare writing block/document block** per valori brevi;
- usare writing block/document block solo per contenuti realmente lunghi o strutturati: prompt Cursor, script multi-linea, artefatti, payload complessi, testi lunghi da copiare integralmente;
- preferire sempre la superficie copiabile più piccola disponibile;
- un singolo valore breve deve occupare idealmente 1–3 righe visive.

Esempio corretto per un valore breve:

**Name**
```text
Authorization
```

Esempio da evitare per un valore breve:

`writing/document block` contenente soltanto `Authorization`.

---

## 3. Pattern canonico

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

Per un comando breve:

```powershell
ssh -N -L 5678:127.0.0.1:5678 ionos-n8n
```

Per un URL breve:

```text
http://127.0.0.1:5678/home/credentials
```

---

## 4. Secrets / credential boundary

- Mai stampare, copiare in GitHub, riportare in chat, hashare, misurare o mostrare token/password/API key quando il task richiede secret-safe handling.
- Se l'operatore deve trasferire un secret, guidarlo con un metodo che mantenga il valore fuori da chat/GitHub/log.
- I blocchi one-click devono contenere solo parti non sensibili (`Authorization`, `Bearer `, hostname, credential name, ecc.) oppure comandi che non stampano il secret.
- Se anche il comando potrebbe esporre il secret, STOP e scegliere un metodo più sicuro o richiedere il gate pertinente.

---

## 5. Relazione con Cursor

Per i prompt Cursor resta vigente `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`:

- modalità `AGENT` / `PLAN` prima del prompt;
- prompt = TASK DELTA;
- singolo blocco copiabile;
- `agg` separato.

**Eccezione intenzionale alla regola di compattezza:** i prompt Cursor sono contenuti lunghi/strutturati e possono usare il writing block/document block canonico.

Questo documento estende la stessa ergonomia **a tutte le altre istruzioni operative**, non solo a Cursor.

---

## 6. Anti-frizione

- Non chiedere all'operatore di trascrivere manualmente stringhe tecniche.
- Non presentare più valori simili nello stesso paragrafo quando possono essere confusi.
- Non usare superfici UI grandi quando un code block compatto con copy è sufficiente.
- Non inventare URL, path, SHA, ID o nomi di campi: usare solo valori verificati o dichiarare il valore sconosciuto.
- Non chiedere screenshot se l'agente può verificare direttamente via tool; usarli solo quando la UI umana è il gate reale o la UI non è osservabile dall'agente.
- Dopo ogni step manuale, indicare soltanto il prossimo step concreto; niente catene lunghe se l'esito del passo corrente condiziona quello successivo.

---

## 7. Precedenza

Questo standard governa la **presentazione delle azioni manuali all'operatore**.

Non amplia mai scope o autorizzazioni. In caso di conflitto:

1. `CURRENT_FRONTIER.md` per live state/gate;
2. foundation/contracts del task;
3. questo standard per l'ergonomia user-facing.

---

**Fine documento.**