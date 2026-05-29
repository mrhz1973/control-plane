# CURSOR PROMPT TEMPLATE — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`  
**Ruolo:** contratto di formattazione per prompt destinati a Cursor. Non è un cambiamento runtime.

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

**Report finale Cursor:** termina con evidenza e output git verbatim richiesti, **non** con comandi di ritorno chat/orchestratore.

**Gate diagnostici umani** (solo se reali): chiedere output locale all'umano solo per workspace dirty inatteso, repo/branch sbagliato, pull rifiutato, auth failure, conflitto, clone mancante, workstation ambigua, sospetta corruzione repo.

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

## 6. Relazione con PROJECT_VISION

- Questo file è **subordinato** a `docs/foundation/PROJECT_VISION.md`.
- In caso di conflitto, vince `PROJECT_VISION.md`.
- Questo file **non** autorizza: runtime n8n/VPS, modifiche workflow, deploy, tag, rollback, provider API key, segreti, sblocco PM-34, o mutazione di `pm34_unblocked` / `n8n_ready`.

---

**Fine documento.**
