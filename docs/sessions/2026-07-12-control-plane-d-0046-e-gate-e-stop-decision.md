# Session — D-0046-E Gate E stop decision (VOIDED — superseded)

> **CORREZIONE GOVERNANCE (D-0047-G, 2026-07-12):** Questo record è **superseded** da `docs/sessions/2026-07-12-control-plane-d-0047-g-governance-correction.md`. L'attribuzione originale «operatore ha selezionato Opzione 3» era **errata**: **nessuna** scelta diretta Opzione 3 dell'operatore esisteva; il numero 3 proveniva da raccomandazione consultiva GLM, poi erroneamente registrata da GPT-B come decisione operatore. **Stato corrente:** `VOIDED_MISATTRIBUTED_OPERATOR_CHOICE`. **Gate E:** `OPERATOR_DECISION_PENDING`. I commit Git `4273bde` / `375f495` restano evidenza audit — **non** revertiti. I fatti runtime sotto restano veri: **nulla** fu eseguito. Le condizioni di riapertura §5 restano **solo riferimento consultivo**.

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-12
**Decision (record storico errato):** ~~D-0046-E Opzione 3~~ — **VOIDED** — STOP Gate E full bounded manual chain
**Outcome (record originale):** ~~NOT_RUN_OPERATOR_DECISION_STOP~~ — superseded; vedi D-0047-G
**Type:** Docs-only decision record (invalid attribution); **no runtime**.

| Field | Value (corrente post D-0047-G) |
|-------|--------|
| **record_status** | `VOIDED_MISATTRIBUTED_OPERATOR_CHOICE` |
| **superseded_by** | D-0047-G |
| **gate_e_status** | `OPERATOR_DECISION_PENDING` |

---

## 1. Decision (record storico — attribuzione errata)

~~After consultative review, the operator selected **Option 3**~~ **ERRORE STORICO:** GPT-B registrò come scelta operatore la raccomandazione consultiva GLM «3». L'operatore **non** aveva risposto direttamente `3`.

- **decision_id:** D-0046-E
- **kind:** runtime
- ~~**selected_option:** 3~~ **VOIDED**
- **decision_date:** 2026-07-12

---

## 2. What was NOT attempted

- No runtime n8n execution
- No fixture **D-0046-T** created
- No Telegram message sent
- No workflow execution (wf45/wf47/wf48)
- No store mutation
- **`enable_wg48_handoff`** remained **false**

---

## 3. State preserved

| Item | Status |
|------|--------|
| wf45→wf47 official receipt | **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (unchanged) |
| D-0045-E wf48 manual external_receipt close | **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (latest scope-limited runtime PASS) |
| D-0044-T | **closed** (unchanged) |
| Gate E full | **not attested** |
| PM-34 | **BLOCKED** |
| n8n_ready | **false** |

---

## 4. What this is NOT

- **NOT** a runtime failure
- **NOT** a Gate E NO-GO produced by execution
- **NOT** a new technical blocker
- **NOT** invalidation of historical callable evidence
- **NOT** permanent abandonment of Gate E

Any future reopening requires a **new Decision Packet**.

---

## 5. Future reopening conditions (consultative advisory only — not operator choice)

> **Nota D-0047-G:** le condizioni sotto erano raccomandazioni consultive GLM incorporate nel record errato. Restano **riferimento consultivo** per un eventuale futuro Decision Packet — **non** autorizzazione né piano approvato.

A future Decision Packet must address before authorizing runtime:

1. **Telegram response format:** plain option `1` (exactly one open decision) vs correlated callback `dp:<decision_id>:<option>`.
2. **Plain option preflight:** prove exactly one open row matching the fresh Gate E decision.
3. **Temporary handoff sequence:** verify `enable_wg48_handoff=false` → set true → execute wf47 once → restore false immediately after success or failure → verify false before further action.
4. **No retry** in the same authorization after failed or ambiguous run.
5. **wf47 fan-out:** one item expected for a single fresh decision; additional items = fail-closed unless explicitly explained and authorized.

---

## 6. Canonical references

- `docs/sessions/2026-07-12-control-plane-d-0045-e-wf48-external-receipt-close-pass.md`
- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md` § Gate E
