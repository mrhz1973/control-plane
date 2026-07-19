# HANDOFF — control-plane — D-0080-W D-0079-E L5 endurance scope

**Titolo:** D-0080-W persist D-0079-E permanent L5 deferred + endurance scope plan
**Ruolo produttore:** GPT-B (handoff via Cursor docs-only persistence)
**Path canonico:** `docs/handoffs/2026-07-19-d0080w-d0079e-l5-endurance-scope-handoff-gptb.md`

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

**Routing Cursor:** repository `mrhz1973/control-plane` / path locale / branch `main` / task D-0080-W — **not** by UI colors.

**Scope Document:** `docs/runtime/L5_PERMANENT_SCOPE_AND_ENDURANCE_PLAN.md`

**Evidenza (non duplicare):**
`docs/sessions/2026-07-19-control-plane-d-0079-e-d-0080-w-l5-permanent-deferred.md`

---

## Contatore turni

**Contatore sessione corrente:** `1/20`
**Nuova chat:** riparte da `0`.

---

## HEAD osservato

**HEAD verificato:** `PENDING_SELF_REFERENCE` (single-commit docs-only; authoritative = `git ls-remote origin main` after push)
**Branch:** `main`

**Expected initial HEAD (pre-task):** `218cb99b4a4a97429b44c2e5a9232497a0948450`
**authoritative_final_head:** `git ls-remote` after push

### Provenienza (obbligatoria)

**provenienza:** `report Cursor verbatim §8.1`

Verifica primaria successiva: shell/`git ls-remote` o connector indipendente — non trattare questo handoff come auto-certificazione.

### Ultimo commit su main

`PENDING_SELF_REFERENCE` (= HEAD after push) — `docs: defer permanent L5 pending endurance evidence`

### Eventuale divergenza raw (nota secondaria)

nessuna al push docs-only. `LAST_HANDOFF_VERIFY.verified_through_commit` = `218cb99b4a4a97429b44c2e5a9232497a0948450` (D-0077 certified by D-0078-V; contextual backfill in D-0080-W). Il nuovo HEAD docs-only D-0080 **non** è auto-certificato.

---

## D-0079-E decisione diretta

- **decision_id:** D-0079-E
- **selected_option:** `"3"`
- **decision_provenance:** `direct_operator_message`
- **operator_decision_date_utc:** `2026-07-19`
- **operator_decision_timestamp_utc:** `NOT_CAPTURED_EXACTLY`
- **l5_permanent_assessment:** `DEFERRED_PENDING_ENDURANCE_EVIDENCE`
- **L5_PASS:** `NOT_CLAIMED`
- **endurance_runtime_authorized:** `false`
- **permanent_schedule_authorized:** `false`

---

## Stato reale workflow/runtime

- wf40/42 attivi; wf41 off; invariati.
- **wf47:** inactive, unpublished; Schedule disabled; `enable_wg48_handoff=false`; permanent Schedule **not** authorized.
- **wf48:** inactive; published only as triggerless callable; no autonomous trigger.
- **wf49:** published false; excluded unless separately authorized.
- **Gate E:** PASS / CLOSED.
- **L5:** deferred pending endurance evidence; activation/runtime/endurance authorization false.
- `n8n_ready=false`; PM-34 BLOCKED; `pm34_unblocked=false`.
- `permanent_schedule_count=0`; `public_webhook_count=0`; `telegram_trigger_count=0`.

---

## Ultimo risultato utile

**D-0079-E** Opzione `"3"` + **D-0080-W** docs: permanent L5 deferred; Scope Document created; endurance package defined but not authorized; D-0078-V backfill to `218cb99`; D-0078-V-F1 wording closed; bounded pilot PASS retained.

---

## Decisioni non consolidate

- Endurance evidence package not yet authorized.
- Permanent L5 claim deferred.
- Permanent Schedule not authorized.
- PM-34 remains BLOCKED.

---

## Gate aperti reali

1. **Verify-only** of the new D-0080-W HEAD (immediate repository task).
2. **Scope Document review / endurance package authorization** — next runtime Decision Packet; not auto-started.
3. Permanent L5 claim — later separate gate after evidence.
4. Permanent Schedule — later separate gate.
5. PM-34 BLOCKED; `n8n_ready=false`.

Gate E is **CLOSED** (not an active blocker).

---

## Prossimo passo tattico

1. Repository verify-only of the new D-0080-W HEAD (same-actor Cursor → `intra_actor_self_verify`).
2. Next runtime Decision Packet: approval/authorization of the bounded endurance evidence package — **not** auto-started.

Do **not** execute endurance tests, activate Schedule, unlock PM-34, or set `n8n_ready=true`.

---

## Riferimenti artefatti runtime

| Artefatto | Campo | Valore |
|-----------|-------|--------|
| `LAST_CURSOR_REPORT.md` | `LATEST.real_task_commit` | `PENDING_SELF_REFERENCE` |
| `LAST_HANDOFF_VERIFY.md` | `verified_through_commit` | `218cb99b4a4a97429b44c2e5a9232497a0948450` |
| Scope Document | path | `docs/runtime/L5_PERMANENT_SCOPE_AND_ENDURANCE_PLAN.md` |

**Nota stale:** intenzionale — `verified_through_commit` punta al commit D-0077 certificato da D-0078-V; il commit D-0080 corrente **non** è auto-promosso.

---

## Invariante §8.1 (richiamo obbligatorio)

- Mai usare report chat come verifica primaria del PASS.
- Se il report Cursor include output post-push verbatim completi (§8.1), l'orchestratore non chiede shell manuale all'utente.
- In assenza di output: prompt Cursor verify-only prima del fallback shell utente.

---

## Entry point canonico

La nuova chat tratta `docs/foundation/PROJECT_VISION.md` come entry point canonico, poi segue il read-set operativo sopra. Policy: PROJECT_VISION v2.19 (workflow-authoring §2.1–§2.2; routing §2.3). Foundation files **not** modified by D-0080-W.

---

## Invarianti progetto (checklist)

- PM-34 BLOCKED
- `n8n_ready=false`
- `pm34_unblocked=false`
- `enable_wg48_handoff=false`
- `l5_activation_authorized=false`
- `l5_runtime_authorized=false`
- `endurance_runtime_authorized=false`
- `permanent_schedule_authorized=false`
- `L5_PASS: NOT_CLAIMED`
- `l5_permanent_assessment: DEFERRED_PENDING_ENDURANCE_EVIDENCE`
- Gate E full PASS / status CLOSED
- permanent wf47 Schedule = NOT_AUTHORIZED
- wf40/41/42 untouched
- No schedule permanenti autorizzati · no webhook pubblici · no Telegram Trigger
- GPT-B owns n8n workflow authoring and UI instructions
- Cursor does not independently create or modify workflows
- Cursor may only persist a complete GPT-B-supplied artifact verbatim under explicit authorization
- Human operator executes supervised n8n UI actions
- Claude verifies; GLM remains read-only
- Cursor workspaces identified by repository/path/branch/task, not by colors
- D-0080 does not self-certify; verify-only of new HEAD required; same-actor verify = `intra_actor_self_verify`

---

**Fine handoff.**
