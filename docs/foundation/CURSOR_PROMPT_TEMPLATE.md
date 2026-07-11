# CURSOR PROMPT TEMPLATE — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`  
**Ruolo:** contratto di formattazione per prompt destinati a Cursor. Non è un cambiamento runtime.

---

## Header operativo (delta / routing)

### A. Disciplina prompt-size

- I prompt Cursor devono portare **SOLO il delta** del task.
- Il boilerplate si richiama per riferimento a questo template (`docs/foundation/CURSOR_PROMPT_TEMPLATE.md`).
- **Non** inlineare ogni volta tutto il boilerplate nel corpo copiabile.

### B. Comandi di ritorno umano e routing metadata fuori dal prompt

- Comandi umani di ritorno (es. `aggio control`, `format`, e simili) **non** vanno nel corpo copiabile del prompt Cursor e **non** vanno nei report Cursor.
- Metadati di routing (modalità, modello, finestra operativa) restano **fuori** dal corpo del prompt quando sono istruzioni per l'orchestratore e non per Cursor.
- Rimando: [PROJECT_VISION.md](PROJECT_VISION.md) §8.

---

## 1. Scopo

- Definisce come GPT-B / Codex / ChatGPT devono formattare i prompt destinati a Cursor in questo repository.
- Evita che le regole di formato si perdano quando parte un nuovo contesto ChatGPT.
- Contratto di formattazione soltanto: non autorizza runtime, deploy, segreti o sblocchi.

---

## 2. Regola rigida

Il prompt copiabile incollato in Cursor **non** deve iniziare con righe di metadati di routing, ad esempio:

```
CURSOR MODE:
MODEL:
REPO:
BRANCH:
```

Quei valori possono comparire **fuori** dal prompt copiabile, come istruzioni di routing per l'umano.

Il corpo del prompt deve iniziare direttamente con l'istruzione eseguibile del task, ad esempio:

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.
```

---

## 3. Struttura corretta della risposta GPT-B

Fuori dal prompt, GPT-B può scrivere ad esempio:

> Finestra corretta: Cursor CONTROL PLANE arancione. Usa Agent con Auto / Composer 2.5. NON mandare in GIS. NON mandare in DEV.

Poi GPT-B fornisce **un solo** prompt copiabile.

Niente prompt duplicati salvo un vero decision gate.

Quando GPT-B corregge o integra un prompt Cursor, restituisce sempre un
unico prompt completo e pronto da incollare. Sono vietati patch, frammenti
o istruzioni che costringano l'utente a ricomporre manualmente il prompt.

---

## 4. Pattern obbligatorio del corpo del prompt

Il corpo copiabile deve includere, in ordine logico:

1. **Preflight implementatore — aggiornamento locale sicuro del repository** (comandi eseguibili da Cursor):
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
   L'umano apre normalmente solo la finestra/repo Cursor corretta. **Non** chiedere all'umano fetch/pull/status di routine prima di ogni task.
2. Hash `origin/main` atteso, quando rilevante; fermarsi se repo/branch/pull non coincidono.
3. Goal del task.
4. Allowed paths e azioni vietate.
5. Comandi di validazione pre-commit.
6. Istruzioni di commit selettivo e push.
7. Contratto di report finale con output git **verbatim** e evidenza richiesta.

**Report finale Cursor (obbligatorio dopo commit/push):** termina con evidenza e output git verbatim, **non** con comandi di ritorno chat/orchestratore. Deve includere **sempre** l'output testuale verbatim di:

```bash
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
git ls-remote origin main
```

Il PASS remoto si chiude su `HEAD` = `origin/main` = `git ls-remote origin main`, branch `main`, workspace pulito. **Niente tabelle** al posto dell'output; **niente riassunti** al posto di `git ls-remote`.

**Orchestratore:** se il report Cursor contiene già questi output completi, **non** chiedere all'utente PowerShell per verifica hash. Se mancano, preparare un prompt **verify-only** per Cursor (solo comandi sopra, zero edit) prima di escalare shell manuale utente (`PROJECT_VISION.md` §8.1 Handoff / post-push verification invariant).

**Gate diagnostici umani** (solo se reali): chiedere output locale all'umano solo per workspace dirty inatteso, repo/branch sbagliato, pull rifiutato, auth failure, conflitto, clone mancante, workstation ambigua, sospetta corruzione repo — **non** come fallback di routine post-push quando Cursor è disponibile.

---

## 5. Vietato dentro il prompt copiabile

- `CURSOR MODE:`
- `MODEL:`
- `REPO:`
- `BRANCH:`
- Comandi di ritorno umano/orchestratore: `aggio control`, `aggio dev-method`, `format`, `next`, o simili.
- Tabelle markdown per output git finali.
- Riassunti al posto di output git verbatim.
- Prompt alternativi senza un vero decision gate.

---

## 5bis. Anti-PREP-churn (momentum)

Per evitare burocrazia e moltiplicazione di documenti (PROJECT_VISION §7.9), i prompt Cursor devono:

- **Non creare nuovi documenti o checklist** quando un file esistente può essere aggiornato.
- Preferire **edit sottrattivi** (accorciare/consolidare) invece di aggiungere nuovi layer di PREP.
- Per catene tipo **Wf47/Wg** e simili, **non** spezzare import rehearsal e run manuali ripetuti in molti gate docs-only separati, **a meno che non esista un blocker concreto**.
- I **gate runtime restano uno alla volta**, ma gli scenari di test manuali correlati **possono essere raggruppati in un'unica rehearsal finale confinata** se test-only / inactive / off.
- Il bound per una catena confinata è: **1 rehearsal import/reimport + massimo 2 run manuali ripetuti**, poi **avanzare al prossimo gate reale** oppure **marcare BLOCKED con blocker concreto**.

---

## 6. Relazione con PROJECT_VISION

- Questo file è **subordinato** a `docs/foundation/PROJECT_VISION.md`.
- In caso di conflitto, vince `PROJECT_VISION.md`.
- Questo file **non** autorizza: runtime n8n/VPS, modifiche workflow, deploy, tag, rollback, provider API key, segreti, sblocco PM-34, o mutazione di `pm34_unblocked` / `n8n_ready`.

---

**Fine documento.**
