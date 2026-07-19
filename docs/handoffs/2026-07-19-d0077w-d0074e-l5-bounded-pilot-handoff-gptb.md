# HANDOFF — control-plane — D-0077-W D-0074-E L5 bounded pilot

**Titolo:** D-0077-W persist D-0074-E bounded L5 operational pilot
**Ruolo produttore:** GPT-B (handoff via Cursor docs-only persistence)
**Path canonico:** `docs/handoffs/2026-07-19-d0077w-d0074e-l5-bounded-pilot-handoff-gptb.md`

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

**Routing Cursor:** repository `mrhz1973/control-plane` / path locale / branch `main` / task D-0077-W — **not** by UI colors.

**Evidenza (non duplicare):**
`docs/sessions/2026-07-19-control-plane-d-0074-e-d-0077-w-l5-bounded-pilot-pass.md`

---

## Contatore turni

**Contatore sessione corrente:** `1/20`
**Nuova chat:** riparte da `0`.

---

## HEAD osservato

**HEAD verificato:** `PENDING_SELF_REFERENCE` (single-commit docs-only; authoritative = `git ls-remote origin main` after push)
**Branch:** `main`

**Expected initial HEAD (pre-task):** `cafd3e5d435a2a24aa38e95becaab217ec3cc09d`
**authoritative_final_head:** `git ls-remote` after push

### Provenienza (obbligatoria)

**provenienza:** `report Cursor verbatim §8.1`

Verifica primaria successiva: shell/`git ls-remote` o connector indipendente — non trattare questo handoff come auto-certificazione.

### Ultimo commit su main

`PENDING_SELF_REFERENCE` (= HEAD after push) — `docs: record D-0074-E bounded L5 pilot`

### Eventuale divergenza raw (nota secondaria)

nessuna al push docs-only. `LAST_HANDOFF_VERIFY.verified_through_commit` = `cafd3e5d435a2a24aa38e95becaab217ec3cc09d` (D-0070 certified by D-0071-V; contextual backfill in D-0077-W). Il nuovo HEAD docs-only D-0077 **non** è auto-certificato e **non** è incluso in `verified_through_commit`.

---

## D-0071-V certification / backfill

- **result:** `PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED`
- **verification_type:** `documental_repository_verify_only`
- **actor_relation:** `intra_actor_self_verify`
- **independent_third_party_verification:** `false`
- **certified_commit:** `cafd3e5d435a2a24aa38e95becaab217ec3cc09d`
- **verified_through_commit roll-forward:** `38915b43…` → `cafd3e5…`
- **backfill_status:** `COMPLETED_CONTEXTUALLY_IN_D0077W`
- **backfill_basis:** `D-0071-V`

D-0071-V is Cursor-on-Cursor documental verification, not independent third-party.

---

## D-0074-E / bounded pilot

- **decision_id:** D-0074-E
- **selected_option:** `"1"`
- **decision_provenance:** `direct_operator_message`
- **operator_decision_date_utc:** `2026-07-18`
- **operator_decision_timestamp_utc:** `NOT_CAPTURED_EXACTLY`
- **result:** `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L5_BOUNDED_OPERATIONAL_PILOT`
- **D-9011-T:** closed option `"1"` · `update_id=986228611` · `open_count_final=0`
- **wf47 executions:** 5/5 within 5-minute window (elapsed first→last 4 minutes)
- **teardown:** wf47 inactive/unpublished/Schedule disabled/`enable_wg48_handoff=false`
- **diagnostic D-0074-E-F1:** `allowed_chat_configured=false` then `true` — `NON_BLOCKING_DIAGNOSTIC_INCONSISTENCY`; root cause not claimed; `follow_up_required=false`

---

## Stato reale workflow/runtime

- wf40/42 attivi; wf41 off; invariati.
- **wf47:** inactive, unpublished; Schedule disabled; `enable_wg48_handoff=false`; permanent Schedule **not** authorized; bounded pilot history retained (authorization consumed).
- **wf48:** inactive; published only as triggerless callable; no autonomous trigger.
- **wf49:** published false; excluded from pilot.
- Teardown evidence gap: **CLOSED** (prior).
- **Gate E:** PASS / CLOSED.
- **L5:** `L5_PASS: NOT_CLAIMED` · `l5_activation_authorized=false` · `l5_runtime_authorized=false` · `l5_bounded_pilot_runtime_authorized_current=false`.
- `n8n_ready=false`; PM-34 BLOCKED; `pm34_unblocked=false`.
- `permanent_schedule_count=0`; `public_webhook_count=0`; `telegram_trigger_count=0`.

---

## Ultimo risultato utile

**D-0074-E** Opzione `"1"` + **D-0077-W** docs persistence: one operator-attested scope-limited bounded L5 operational pilot PASS; D-0071-V contextual backfill to `cafd3e5`; Gate E remains PASS/CLOSED; L5_PASS not claimed.

---

## Decisioni non consolidate

- Permanent L5 activation not authorized.
- Permanent Schedule authorization not granted.
- PM-34 remains BLOCKED.
- Root cause of `allowed_chat_configured` inconsistency not determined.

---

## Gate aperti reali

1. **D-0078-V** — repository verify-only of the new D-0077-W HEAD (immediate).
2. **L5 permanent activation** — requires separate dedicated Decision Packet; not auto-started.
3. Permanent Schedule: not authorized.
4. PM-34 BLOCKED; `n8n_ready=false`.

Gate E is **CLOSED** (not an active blocker).

---

## Prossimo passo tattico

**D-0078-V** — independent repository verify-only of the new D-0077-W HEAD. If performed by the same Cursor actor on Cursor's own commit, label provenance `intra_actor_self_verify` — **not** independent third-party verification. Do **not** auto-avviare permanent L5.

---

## Riferimenti artefatti runtime

| Artefatto | Campo | Valore |
|-----------|-------|--------|
| `LAST_CURSOR_REPORT.md` | `LATEST.real_task_commit` | `PENDING_SELF_REFERENCE` |
| `LAST_HANDOFF_VERIFY.md` | `verified_through_commit` | `cafd3e5d435a2a24aa38e95becaab217ec3cc09d` |

**Nota stale:** intenzionale — `verified_through_commit` punta al commit D-0070 certificato da D-0071-V; il commit D-0077 corrente **non** è auto-promosso e **non** è ancora in `verified_through_commit`.

---

## Invariante §8.1 (richiamo obbligatorio)

- Mai usare report chat come verifica primaria del PASS.
- Se il report Cursor include output post-push verbatim completi (§8.1), l'orchestratore non chiede shell manuale all'utente.
- In assenza di output: prompt Cursor verify-only prima del fallback shell utente.

---

## Entry point canonico

La nuova chat tratta `docs/foundation/PROJECT_VISION.md` come entry point canonico, poi segue il read-set operativo sopra. Policy: PROJECT_VISION v2.19 (workflow-authoring §2.1–§2.2; routing §2.3). Foundation files **not** modified by D-0077-W.

---

## Invarianti progetto (checklist)

- PM-34 BLOCKED
- `n8n_ready=false`
- `pm34_unblocked=false`
- `enable_wg48_handoff=false`
- `l5_activation_authorized=false`
- `l5_runtime_authorized=false`
- `l5_bounded_pilot_runtime_authorized_current=false`
- `L5_PASS: NOT_CLAIMED`
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
- Bounded pilot PASS is operator-attested / scope-limited — not L5_PASS, not permanent automation
- D-0077 does not self-certify; D-0078-V required; same-actor verify = `intra_actor_self_verify`

---

**Fine handoff.**
