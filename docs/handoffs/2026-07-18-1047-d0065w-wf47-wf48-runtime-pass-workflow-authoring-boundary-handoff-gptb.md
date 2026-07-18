# HANDOFF — control-plane — D-0065-W wf47-wf48 passes + workflow-authoring boundary

**Titolo:** D-0065-W record D-0062/D-0063/D-0064 + n8n authoring boundary + repository Cursor routing
**Ruolo produttore:** GPT-B (handoff authored via Cursor docs-only persistence)
**Path canonico:** `docs/handoffs/2026-07-18-1047-d0065w-wf47-wf48-runtime-pass-workflow-authoring-boundary-handoff-gptb.md`

---

## Entry point / read-set (nuova chat)

Ordine operativo obbligatorio:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `docs/foundation/PROJECT_VISION.md`
3. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
4. `docs/runtime/LAST_CURSOR_REPORT.md`
5. `docs/runtime/LAST_HANDOFF_VERIFY.md`
6. questo handoff

**Nota:** `PROJECT_VISION.md` resta entry point canonico §11.2; read-set operativo FRONTIER → PROJECT_VISION → CURSOR_PROMPT_TEMPLATE → LAST_CURSOR_REPORT → LAST_HANDOFF_VERIFY → handoff.

Tutti i file dal repo vivo a HEAD dichiarato — mai da copie in chat.

**Evidenza (non duplicare):**
`docs/sessions/2026-07-18-control-plane-d-0062-e-d-0065-w-wf47-wf48-runtime-pass-and-workflow-authoring-boundary.md`

---

## Contatore turni

**Contatore sessione corrente:** `1/20`
**Nuova chat:** riparte da `0`.

---

## HEAD osservato

**HEAD verificato:** `PENDING_SELF_REFERENCE` (single-commit docs-only; authoritative = `git ls-remote origin main` after push)
**Branch:** `main`

### Provenienza (obbligatoria)

**provenienza:** `report Cursor verbatim §8.1`

Verifica primaria successiva: shell/`git ls-remote` o connector indipendente — non trattare questo handoff come auto-certificazione.

### Ultimo commit su main

`PENDING_SELF_REFERENCE` (= HEAD after push) — `docs: record wf47-wf48 passes and workflow authoring boundary`

### Eventuale divergenza raw (nota secondaria)

nessuna al push docs-only. `LAST_HANDOFF_VERIFY.verified_through_commit` resta `4c67225` (ultimo commit indipendentemente verificato); il nuovo HEAD docs-only è pending independent verification.

---

## Stato reale workflow/runtime

- wf40/42 attivi; wf41 off; invariati.
- **D-0062-T4** closed (option `"4"`); **D-0063-T4** closed (option `"4"`); observed `open_count=0`.
- D-0062: fresh callable wf47→official wf48 scope-limited PASS (operator-attested).
- D-0063: bounded scheduled wf47→official wf48 PASS (operator-attested); initial `allowed_chat_not_configured` fail-closed then corrected.
- D-0064: official wf48 published as **triggerless callable** dependency for Execute Workflow (not autonomous automation).
- Teardown: instruction issued; final state **NOT_VERIFIED_IN_SUPPLIED_EVIDENCE**.
- Safe default remains `enable_wg48_handoff=false`; permanent Schedule **not** authorized.
- `l5_activation_authorized=false`; Gate E full **NOT_CLAIMED**; `n8n_ready=false`; PM-34 BLOCKED.

---

## Ultimo risultato utile

**D-0065-W** docs-only: recorded D-0062/D-0063/D-0064 evidence; canonized GPT-B n8n authoring boundary (`BLOCKED_WORKFLOW_AUTHORING_RESERVED_TO_GPT_B`); removed color-based Cursor routing from canonical files; PROJECT_VISION **v2.19**.

---

## Decisioni non consolidate

- Independently verify final teardown state.
- Gate E / L5 not authorized automatically.
- Permanent Schedule authorization not granted.

---

## Gate aperti reali

1. Gate E: `OPERATOR_DECISION_PENDING` / full **NOT_CLAIMED**.
2. L5: `l5_activation_authorized=false`.
3. Teardown final state: `NOT_VERIFIED_IN_SUPPLIED_EVIDENCE`.
4. Permanent Schedule: not authorized.
5. PM-34 BLOCKED; `n8n_ready=false`.

---

## Prossimo passo tattico

Non auto-avviare Gate E o L5. Prossimo gate reale: Decision Packet dedicato (es. verifica indipendente teardown, oppure Gate E Phase 1) con scelta diretta operatore.

---

## Riferimenti artefatti runtime

| Artefatto | Campo | Valore |
|-----------|-------|--------|
| `LAST_CURSOR_REPORT.md` | `LATEST.real_task_commit` | `PENDING_SELF_REFERENCE` |
| `LAST_HANDOFF_VERIFY.md` | `verified_through_commit` | `4c67225d1996c07616a5a2089add976d65b9b4a4` |

**Nota stale:** intenzionale — `verified_through_commit` non auto-promuove il commit docs-only corrente.

---

## Invariante §8.1 (richiamo obbligatorio)

- Mai usare report chat come verifica primaria del PASS.
- Se il report Cursor include output post-push verbatim completi (§8.1), l'orchestratore non chiede shell manuale all'utente.
- In assenza di output: prompt Cursor verify-only prima del fallback shell utente.

---

## Entry point canonico

La nuova chat tratta `docs/foundation/PROJECT_VISION.md` come entry point canonico, poi segue il read-set operativo sopra. Policy: PROJECT_VISION v2.19 (workflow-authoring §2.1–§2.2; routing §2.3).

---

## Invarianti progetto (checklist)

- PM-34 BLOCKED
- `n8n_ready=false`
- `pm34_unblocked=false`
- `enable_wg48_handoff=false`
- `l5_activation_authorized=false`
- Gate E full PASS = NO / NOT_CLAIMED
- wf40/41/42 untouched
- No schedule permanenti autorizzati · no webhook pubblici · no Telegram Trigger
- GPT-B owns n8n workflow authoring and UI instructions
- Cursor does not independently create or modify workflows
- Cursor may only persist a complete GPT-B-supplied artifact verbatim under explicit authorization
- Human operator executes supervised n8n UI actions
- Claude verifies; GLM remains read-only
- Cursor workspaces identified by repository/path/branch/task, not by colors
- Teardown final state not independently verified in supplied evidence

---

**Fine handoff.**
