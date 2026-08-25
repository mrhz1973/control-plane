# HANDOFF TEMPLATE — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/HANDOFF_TEMPLATE.md`  
**Versione:** **3.0 — 2026-08-25**  
**Lingua:** Italiano  
**Ruolo:** scheletro canonico per rollover GPT Web / nuova chat conforme a `PROJECT_VISION.md` v3 §1 e §7.  
**Runtime autorizzato da questo documento:** **NO**

---

## 0. Principio

La memoria del progetto vive su **GitHub**, non nella context window.

Un handoff deve permettere alla nuova chat di continuare senza chiedere:

- a che punto eravamo;
- quale repo/branch/HEAD usare;
- quali gate sono aperti;
- quali invarianti sono ancora vere;
- qual è il prossimo passo concreto.

`handoff ora` è kill switch manuale. I **20 prompt utente** restano hard ceiling storico, non obiettivo da raggiungere; il rollover può e deve avvenire prima se il contesto degrada.

---

## 1. Come usare questo file

1. Creare `docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff-<ruolo>.md`.
2. Compilare tutte le sezioni applicabili; usare `N/A` o `UNKNOWN` invece di inventare dati.
3. Persistire l'handoff su GitHub prima di chiudere la chat quando possibile.
4. La nuova chat legge **repo vivo** e verifica lo stato corrente; non usa la narrativa della vecchia chat come source of truth.
5. Un handoff/checkpoint **non è un PASS** e non auto-certifica il proprio commit (`PROJECT_VISION.md` §11.3).

---

## 2. Titolo / identità

**Titolo:** `<TOPIC_BREVE>`  
**Ruolo produttore:** `<GPT Web | altro>`  
**Path canonico:** `docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff-<ruolo>.md`  
**Issue/Backlog correlato:** `<#issue | N/A>`

---

## 3. Entry point / read-set nuova chat

Ordine minimo canonico v3:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `docs/foundation/PROJECT_VISION.md`
3. `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`
4. contratto specifico del lavoro, se esiste:
   - `docs/contracts/backlog-item-v1.md`
   - `docs/contracts/planner-routing-policy-v1.md`
   - `docs/contracts/execution-packet-v1.md`
   - `docs/contracts/execution-checkpoint-v1.md`
5. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` quando l'esecutore è Cursor
6. `docs/runtime/LAST_CURSOR_REPORT.md` e `docs/runtime/LAST_HANDOFF_VERIFY.md` quando pertinenti
7. handoff corrente
8. issue/backlog corrente
9. documenti storici solo se necessari

`CURRENT_FRONTIER.md` vince sullo stato runtime; `PROJECT_VISION.md` vince sull'architettura/foundation.

---

## 4. Contesto / rollover

**Motivo handoff:** `<handoff ora | hard ceiling | context degradation | cambio fase | altro>`  
**Contatore sessione corrente:** `<N/20 | UNKNOWN>`  
**Nuova chat:** contatore `0`.

---

## 5. Git state

**Repository:** `mrhz1973/control-plane`  
**Branch target:** `main`  
**Remote HEAD osservato prima della persistenza handoff:** `<sha | UNKNOWN>`  
**Provenienza osservazione:** `<git ls-remote/report Cursor verbatim/GitHub connector — navigation only>`  
**Ultimo commit documentally verified-through:** `<sha | UNKNOWN>`  
**Verification evidence:** `<task/session ref | N/A>`  
**Local workspace known state:** `<clean/synced/stale/UNKNOWN>`

### Regola di provenienza

- `git ls-remote` / report Cursor verbatim conforme a `PROJECT_VISION.md` §11 può supportare un PASS remoto.
- GitHub connector/API può indicare lo stato corrente per navigazione/orchestrazione, ma **non sostituisce** il PASS terminale quando il task lo richiede.
- L'handoff stesso non auto-certifica il commit che lo contiene; usare `artifact_commit: PENDING_SELF_REFERENCE` se necessario.

---

## 6. Stato strategico / architettura corrente

`<riassunto breve della foundation e della fase attuale>`

---

## 7. Stato runtime autorevole

Riportare solo una sintesi coerente con `CURRENT_FRONTIER.md`, per esempio:

- workflow rilevanti;
- PM-34;
- `n8n_ready`;
- L5 / schedule / loop;
- autorizzazioni runtime;
- provider/runtime v3 verificati o ancora target.

Se lo stato cambia dopo la creazione dell'handoff, la nuova chat deve fidarsi di `CURRENT_FRONTIER.md`, non di questo snapshot.

---

## 8. Ultimo risultato utile

`<ultimo arco chiuso con evidenza e significato>`

---

## 9. Decisioni consolidate / non consolidate

### Consolidate

- `<decisione>`

### Non consolidate / ancora da verificare

- `<decisione/capacità>`

---

## 10. Gate aperti reali

- `<gate 1>`
- `<gate 2>`

Nessuna pausa senza gate reale.

---

## 11. Prossimo passo tattico

`<una azione concreta e bounded>`

Se è necessario un sync locale, metterlo prima di qualsiasi smoke/runtime test.

---

## 12. Artefatti / issue da leggere

| Need | Path / ref | Nota |
|---|---|---|
| Stato | `docs/runtime/CURRENT_FRONTIER.md` | autorevole runtime |
| Foundation | `docs/foundation/PROJECT_VISION.md` | entry point canonico |
| Operating model | `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` | architettura v3 |
| Cursor | `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` | execution contract |
| Git evidence | `docs/runtime/LAST_CURSOR_REPORT.md` / `LAST_HANDOFF_VERIFY.md` | storico/rolling; può essere stale |
| Backlog | `<issue/ref>` | lavoro aperto |
| Handoff | `<questo path>` | snapshot rollover |

Aggiungere contratti/packet/checkpoint pertinenti al task.

---

## 13. Invarianti v3 — checklist minima

- GPT Web = strategic orchestrator + backlog owner.
- GitHub = source of truth.
- n8n = workflow/policy/gate, non planner LLM.
- OpenClaw = provider/auth/quota broker target; capacità runtime solo quando verificate.
- Planner pool = Qwen 3.8 37B / GLM 5.3 / Codex OAuth secondo routing policy/evidence.
- GLM può essere Advisor / Planner / Cursor Executor **solo nel mode esplicito e verificato**.
- Cursor = execution harness; loop sempre task-bounded.
- Bugbot = reviewer, non router; cloud Autofix non default.
- Telegram = human gate.
- GPT Web resta autore autorevole dei workflow n8n; Cursor non li ridisegna autonomamente.
- Nessun permanent schedule/loop, PM-34 unlock, L5 activation o runtime sensibile senza gate esplicito.
- Stato concreto di PM-34/L5/workflow/`n8n_ready` si legge sempre da `CURRENT_FRONTIER.md`.
- Nuove sessioni ripartono da GitHub + handoff/packet/checkpoint, non dalla cronologia chat.

---

## 14. Starter nuova chat

Usare un blocco breve che dica alla nuova chat di:

1. leggere il read-set §3 dal repo vivo;
2. riferire HEAD/stato/gate correnti senza ricostruzione narrativa;
3. leggere l'issue/backlog indicata;
4. eseguire direttamente il `next_action` dell'handoff se non emerge un gate più nuovo dal repo.

---

**Fine template.**
