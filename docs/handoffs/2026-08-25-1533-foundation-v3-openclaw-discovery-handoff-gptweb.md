# Handoff — Foundation v3 → OpenClaw / planner / Cursor evidence track

**Repository:** `mrhz1973/control-plane`  
**Ruolo produttore:** GPT Web  
**Data:** 2026-08-25 15:33 Europe/Rome  
**Path canonico:** `docs/handoffs/2026-08-25-1533-foundation-v3-openclaw-discovery-handoff-gptweb.md`  
**Issue/backlog correlato:** GitHub issue **#8 — Architecture migration — multi-planner → Cursor bounded loop**  
**artifact_commit:** `PENDING_SELF_REFERENCE`

---

## 1. Motivo handoff

`handoff ora` / rollover anticipato per context window molto lunga dopo il completamento di un arco naturale.

La chat corrente ha concluso la migrazione foundation v3 e il gate storico D-0081-V; il prossimo arco è distinto e deve partire in una nuova chat con margine pieno.

**Contatore sessione corrente:** `UNKNOWN` — non inventare un numero.  
**Nuova chat:** contatore `0`; 20 prompt utente restano hard ceiling, non target.

---

## 2. Read-set obbligatorio nuova chat

Leggere dal **repo vivo**, in questo ordine:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `docs/foundation/PROJECT_VISION.md`
3. `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`
4. `docs/contracts/planner-routing-policy-v1.md`
5. `docs/contracts/backlog-item-v1.md`
6. `docs/contracts/execution-packet-v1.md`
7. `docs/contracts/execution-checkpoint-v1.md`
8. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
9. `docs/advisors/GLM_ADVISOR_METHOD.md`
10. `docs/runtime/LAST_CURSOR_REPORT.md`
11. `docs/runtime/LAST_HANDOFF_VERIFY.md`
12. questo handoff
13. GitHub issue #8 e i suoi commenti recenti

Documenti storici solo se un finding concreto li rende necessari.

`CURRENT_FRONTIER.md` è autorevole per lo stato runtime.  
`PROJECT_VISION.md` v3 è autorevole per architettura/invarianti.

---

## 3. Git state al rollover

```yaml
repository: mrhz1973/control-plane
branch_target: main
remote_head_before_handoff_commit: 30cc8520a056376d1a2ecb81290ee68e1ceacd01
remote_head_observation_source: GitHub connector/API navigation state
remote_head_observation_is_pass_evidence: false
last_documentally_verified_through_commit: 91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699
verification_task: D-0081-V
verification_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
verification_actor_relation: intra_actor_self_verify
independent_third_party_verification: false
```

D-0081-V ha verificato `91847807...` con output terminale Cursor verbatim, workspace clean, tripletta HEAD/origin/ls-remote coerente, exact six-doc delta e `git diff --check` PASS.

Dopo D-0081-V sono stati aggiunti su `main` soltanto cambi docs/foundation dell'arco v3, inclusi merge PR #9, frontier v3 e aggiornamento `HANDOFF_TEMPLATE.md`. Questi commit successivi **non sono dichiarati documentally verified-through da D-0081-V**.

### Clone locale al lavoro

Ultimo stato locale **verificato dall'operatore/Cursor in questa chat**:

```yaml
branch: main
head: 91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699
workspace: clean
```

Da allora `main` remoto è avanzato. Era stato preparato un prompt di sync alla foundation v3, ma il sync successivo **non è stato ancora riportato come eseguito** prima di questo handoff.

Quindi la nuova chat deve trattare il clone al lavoro come **STALE_UNTIL_SYNC_VERIFIED**.

---

## 4. Ultimo arco chiuso

### D-0081-V

**PASS.** Repository verify-only read-only di D-0080-W:

```yaml
certified_commit: 91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699
previous_verified_through_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
files_modified_by_verification: 0
commits_created_by_verification: 0
pushes_by_verification: 0
runtime_actions_by_cursor: 0
```

Evidence:

`docs/sessions/2026-08-25-control-plane-d-0081-v-d0080w-repository-verify-pass.md`

### Foundation v3

PR #9 è stata mergiata su `main` e la foundation v3 è **CANONICAL**.

Architettura accettata:

```text
GPT Web
  ↓ Backlog Item / GitHub
n8n
  ↓ policy/gates
OpenClaw
  ↓ provider/auth/quota broker
Qwen 3.8 37B | GLM 5.3 | Codex OAuth
  ↓ planner-generated Execution Packet
n8n deterministic gate
  ↓
Cursor bounded execution loop
  ↓
Bugbot review
  ↓
GitHub
```

Il vecchio `HANDOFF_TEMPLATE.md` v1.1 è stato aggiornato a v3 prima di questo handoff perché conteneva invarianti obsolete.

---

## 5. Decisioni architetturali consolidate

- **GPT Web** resta strategic orchestrator e backlog owner.
- **GitHub** è source of truth e memoria persistente.
- **n8n** resta workflow/policy/gate; non è planner LLM.
- **OpenClaw** è target provider/auth/quota broker; non strategic orchestrator.
- **Planner/prompt generators:** Qwen 3.8 37B locale, GLM 5.3, Codex OAuth.
- GPT Web scrive il **Backlog Item**; il planner scelto produce l'**Execution Packet** per Cursor.
- Non serve un Qwen piccolo/router always-on nel primary path.
- Qwen 3.8 37B può essere caricato per job e, se già residente, riusato come planner/advisor/reviewer locale.
- **Cursor** è execution harness e owner del loop task-bounded; sceglie i propri agent/subagent interni entro l'Execution Packet.
- **GLM 5.3 BYOK dentro Cursor** è target prioritario per scaricare consumo dai modelli Cursor, ma richiede evidence reale.
- **Codex OAuth** non è assunto come modello nativo Cursor; advisor path via OpenClaw/CLI/MCP è track separato da verificare.
- **Bugbot** è reviewer, non router; cloud Autofix non default; design target `max_review_rounds=3`.
- **Telegram** è human gate.
- Context rollover è canonico: Backlog Item / Execution Packet / Execution Checkpoint + live Git devono rendere sostituibile ogni sessione.

---

## 6. Stato runtime autorevole al rollover

Snapshot da `CURRENT_FRONTIER.md` al momento dell'handoff:

```yaml
foundation_v3: CANONICAL
openclaw_v3_runtime_wiring: NOT_VERIFIED_NOT_ACTIVATED
PM_34: BLOCKED
n8n_ready: false
l5_activation_authorized: false
l5_runtime_authorized: false
l5_bounded_pilot_runtime_authorized_current: false
l5_permanent_assessment: DEFERRED_PENDING_ENDURANCE_EVIDENCE
L5_PASS: NOT_CLAIMED
permanent_schedule_authorized: false
endurance_runtime_authorized: false
Gate_E_full: PASS
Gate_E_status: CLOSED
wf40: active_unchanged
wf42: active_unchanged
wf41: off
enable_wg48_handoff: false
permanent_operational_loop_declared: false
```

Se il repo vivo differisce, `CURRENT_FRONTIER.md` corrente vince su questo snapshot.

---

## 7. Cosa NON è ancora verificato

Issue #8 conserva il runtime/evidence backlog. Capacità ancora da provare nel reale ambiente installato:

1. OpenClaw presente/versione/config corrente sulla macchina rilevante.
2. Provider **Codex OAuth** effettivamente disponibile nel runtime OpenClaw corrente.
3. Provider **GLM/Z.AI** effettivamente disponibile/configurabile.
4. Lettura affidabile usage/rate-limit/quota state dei provider.
5. Qwen 3.8 37B → Backlog Item → Execution Packet smoke.
6. GLM 5.3 → Execution Packet smoke.
7. Codex OAuth → Execution Packet smoke.
8. GLM 5.3 BYOK come main Cursor Agent model.
9. GLM come custom Cursor subagent, se realmente supportato.
10. `/goal` + `/loop` o equivalente corrente Cursor con task bounded innocuo.
11. Bugbot review senza cloud Autofix automatico.
12. Codex OAuth come advisor Cursor via OpenClaw/CLI/MCP senza API billing OpenAI.
13. Riutilizzo Qwen 3.8 37B come advisor/reviewer nello stesso job quando già caricato.
14. Execution Checkpoint + nuova sessione Cursor che riprende correttamente da `next_action`.
15. Solo dopo evidence: eventuale wiring n8n/OpenClaw runtime tramite Decision Packet separato.

Nessuna di queste capacità va promossa da `target` a `PASS` senza smoke/evidence.

---

## 8. Gate reali aperti

- **Clone Cursor al lavoro stale:** sync/verify a `main` corrente prima di qualsiasi nuovo smoke.
- **Provider/runtime discovery:** deve partire read-only; nessuna credential/auth/billing mutation implicita.
- Qualunque modifica OAuth/credential/billing, runtime n8n, provider wiring, permanent loop/schedule o produzione richiede gate esplicito.
- PM-34 e L5 restano separati e bloccati secondo `CURRENT_FRONTIER.md`.

---

## 9. Prossimo passo tattico — esatto

### STEP 1 — sync locale, nessun altro lavoro

Nel Cursor al lavoro:

1. verificare workspace clean e branch `main`;
2. `git fetch --prune origin`;
3. `git pull --ff-only origin main`;
4. verificare `HEAD == origin/main == git ls-remote origin refs/heads/main`;
5. confermare presenza dei documenti foundation/contracts v3;
6. leggere `CURRENT_FRONTIER.md` vivo;
7. riportare output verbatim;
8. **non iniziare OpenClaw nello stesso task**.

### STEP 2 — solo dopo PASS STEP 1

Discovery **read-only** dell'ambiente OpenClaw corrente:

- presenza/install path;
- versione;
- stato gateway/processo;
- configurazione/provider visibili senza stampare segreti;
- Codex OAuth capability presente sì/no;
- GLM/Z.AI capability presente sì/no;
- comandi disponibili per usage/rate-limit;
- nessuna modifica configurazione, login, credential o runtime permanente.

Il risultato dello STEP 2 diventa evidence per issue #8 e decide il prossimo Backlog Item.

---

## 10. Riferimenti principali

| Need | Path / ref |
|---|---|
| Stato runtime | `docs/runtime/CURRENT_FRONTIER.md` |
| Foundation | `docs/foundation/PROJECT_VISION.md` |
| Operating model v3 | `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` |
| Handoff template v3 | `docs/foundation/HANDOFF_TEMPLATE.md` |
| Cursor contract | `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` |
| Routing | `docs/contracts/planner-routing-policy-v1.md` |
| Backlog contract | `docs/contracts/backlog-item-v1.md` |
| Execution Packet | `docs/contracts/execution-packet-v1.md` |
| Checkpoint | `docs/contracts/execution-checkpoint-v1.md` |
| GLM modes | `docs/advisors/GLM_ADVISOR_METHOD.md` |
| D-0081 evidence | `docs/sessions/2026-08-25-control-plane-d-0081-v-d0080w-repository-verify-pass.md` |
| Rolling Cursor evidence | `docs/runtime/LAST_CURSOR_REPORT.md` |
| Handoff verification history | `docs/runtime/LAST_HANDOFF_VERIFY.md` |
| Migration/evidence backlog | GitHub issue #8 |

**Nota:** `LAST_CURSOR_REPORT.md` / `LAST_HANDOFF_VERIFY.md` conservano rolling evidence storica e possono essere stale rispetto al live HEAD. Non usarli per sovrascrivere `CURRENT_FRONTIER.md` o live Git.

---

## 11. Invarianti da non perdere nella nuova chat

- GitHub, non la vecchia chat, è la memoria.
- GPT Web resta autore autorevole dei workflow n8n.
- Cursor non ridisegna autonomamente workflow n8n.
- Loop Cursor sempre bounded.
- Qwen 3.8 37B non è daemon router obbligatorio.
- GLM mode deve essere esplicito: Advisor / Planner / Cursor Executor.
- Nessuna degradazione silenziosa del planner per task high-risk.
- Nessun PM-34 unlock, `n8n_ready=true`, L5 PASS, endurance runtime, permanent Schedule/loop senza Decision Packet dedicato.
- Gate E PASS/CLOSED non equivale a L5 PASS.
- Handoff/checkpoint non auto-certificano il proprio commit.

---

## 12. Starter per la nuova chat

```text
CONTROL-PLANE — RIPRESA DA HANDOFF FOUNDATION v3

Lavora in italiano come orchestratore GPT Web del repository mrhz1973/control-plane.
Non ricostruire lo stato dalla memoria della chat precedente.

Leggi dal repo vivo, nell'ordine definito in:
docs/handoffs/2026-08-25-1533-foundation-v3-openclaw-discovery-handoff-gptweb.md

In particolare parti da:
1. docs/runtime/CURRENT_FRONTIER.md
2. docs/foundation/PROJECT_VISION.md
3. docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md
4. contratti v3 indicati nell'handoff
5. issue #8

Riferisci sinteticamente HEAD/stato/gate correnti e poi esegui direttamente il prossimo step dell'handoff, salvo che il repo vivo mostri un gate più nuovo.

Il prossimo step atteso è SOLO il sync/verify del clone Cursor al lavoro; non iniziare ancora la discovery OpenClaw nello stesso task.
```

---

**Fine handoff.**
