# Wg runbook — inbound Decision Packet state correlation (TEST ONLY)

**Repository:** `mrhz1973/control-plane`
**Document:** `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`
**Status:** Wg fixture manual validation **PASS ATTESTATO UTENTE**. **External receipt mode** added for live 47→48 handoff (implementation ready; runtime gate pending reimport). Not operational automation. No schedule.

---

## 1. Scope

Wg maps a **sanitized inbound** Decision Packet response (as produced by Wf47 or equivalent) to a **test-only** decision state store — manual/inactive/off, no schedule.

Answers:

| Question | Design |
|----------|--------|
| How does `dp:D-9998-T:1` map to an open record? | Match `decision_id` in `wg_decision_state_test`; if `status=open`, close with `selected_option`. |
| How is open → closed? | Upsert row: `status=closed`, `selected_option`, `closed_at`, `update_id`. |
| Duplicate same decision/update? | `duplicate_or_already_closed` |
| Unknown `decision_id`? | `unknown_decision_id` |
| Stale / already closed? | `already_closed_or_stale` |
| Note-only? | `note_recorded` — `note_preview` only; does not change `selected_option` |
| Malformed? | `malformed_response` |

**Not** PM-34. **Not** `control_plane_state`. **Not** operational inbound automation. **Not** a webhook or Schedule.

---

## 2. What Wf47 already proved

- Manual `getUpdates` path with **wf47_polling_state_test** persists offset; poll 1 accept + poll 2 no re-accept (**PASS**).
- Sanitized receipt contract (`inspect_status`, `decision_id`, `selected_option`, `update_id`, `block_reason`, …).

Wg does **not** poll Telegram. It correlates **already-sanitized** inbound input to decision lifecycle state.

---

## 3. What this package adds

- Test-only table **`wg_decision_state_test`** (separate from wf47 polling state).
- Importable workflow **48** — scenario-based sanitized inbound fixture + correlation + optional upsert.
- Runbook for manual validation (three scenarios minimum).

---

## 4. Test-only state model — `wg_decision_state_test`

Create in n8n UI (not in Git). Suggested columns:

| Column | Purpose |
|--------|---------|
| `decision_id` | Primary key, e.g. `D-9998-T` |
| `status` | `open` \| `closed` \| `stale` \| `blocked` |
| `selected_option` | `1` \| `2` \| `3` \| `4` \| `5` when closed (D-0059-W repository canonization) |
| `created_at` | ISO timestamp |
| `closed_at` | ISO when closed |
| `update_id` | Last Telegram `update_id` applied (number as string ok) |
| `note_preview` | Bounded sanitized note text (optional) |
| `source` | Always `TEST ONLY` |

**Seed row (manual, before validation):**

| decision_id | status | selected_option | source |
|-------------|--------|-----------------|--------|
| D-9998-T | open | (empty) | TEST ONLY |

No `chat_id`, `user_id`, token, or message body in table or Git.

---

## 5. Template — workflow 48

**File:** `workflows/wg-telegram-inbound-decision-state-correlation.template.json`
**Name:** `48 - Wg Telegram Inbound Decision State Correlation TEST ONLY - TEMPLATE`
**active:** `false` — Manual Trigger only.

**Human configures in n8n UI only:**

1. Create/seed **`wg_decision_state_test`**.
2. Import template once; keep inactive.
3. **Set Wg test scenario** — choose scenario for each manual run (see §6). For live 47→48 handoff use `external_receipt` + `manual_receipt_json` (see §5bis).
4. Run Manual Trigger; read **Inspect correlation result**.

No Code-node edits required for fixture validation (scenario in Set node). Live 47→48 uses `external_receipt` only.

---

## 5bis. Wg external receipt mode (live 47→48 handoff)

**Purpose:** consume a **sanitized receipt copied from workflow 47** (Wf), not an internal fixture.

| Setting | Value |
|---------|--------|
| **scenario** | `external_receipt` |
| **manual_receipt_json** | JSON object (or string) pasted from 47 - Wf output — e.g. Inspect sanitized receipt |

**Constraints:** `active: false` · no Telegram API · no schedule · no production Data Table · no `control_plane_state` · no PM-34 · no workflow 40/41/42 mutation.

**Example `manual_receipt_json`** (from 47 - Wf after `dp:D-9998-T:1`):

```json
{
  "inspect_status": "accepted",
  "decision_id": "D-9998-T",
  "selected_option": "1",
  "update_id": 986228560,
  "duplicate_or_stale": false,
  "note_present": false,
  "block_reason": null,
  "allowed_chat_configured": true,
  "offset_after_placeholder": 986228561,
  "last_handled_update_id": 0,
  "test_only": true
}
```

**Operator flow (manual live gate):**

1. Run **47 - Wf** manually after sending `dp:D-9998-T:1` on Telegram.
2. Copy the **sanitized receipt** from 47 (accepted output).
3. In **48 - Wg**, set `scenario` = `external_receipt` and paste receipt into `manual_receipt_json`.
4. Run **48 - Wg** manually (keep **inactive/off**).
5. **Expected:** `D-9998-T` closes if `wg_decision_state_test` has `D-9998-T` **open**.

If `manual_receipt_json` is missing or invalid, workflow returns deterministic `block_reason: missing_or_invalid_external_receipt`.

**Live PASS (2026-06-01):** `external_receipt` validated manually with real **47 - Wf** receipt — `update_id` **986228561**, **D-9998-T** closed from `prior_status: open`, `state_persisted: true`, `test_only: true`. Evidenza: [session log](sessions/2026-06-01-control-plane-wf47-wg-live-manual-handoff-pass.md).

---

## 5ter. Callable path from 47 - Wf (controlled handoff template)

**Purpose:** allow **47 - Wf** to invoke **48 - Wg** via **Execute Workflow** with the same sanitized receipt contract as `external_receipt`, without manual paste.

| Entry | Path |
|-------|------|
| **Manual / fixtures** | Manual Trigger → **Set Wg test scenario** → Build sanitized inbound test input → … |
| **Callable from 47** | **When Executed by Another Workflow** → **Normalize Wf47 callable receipt** → Data Table load → **Correlate inbound to decision state** |

### Parser options 1–5 — three repository points (D-0059-W)

Official/template wf48 allows `selected_option` **`"1"`…`"5"`** (number or string coerced via `String(...)`). Canonization is **repository-only**; live official option 4/5 runtime PASS remains **false**.

| # | Node | Role | Predicate |
|---|------|------|-----------|
| 1 | **Normalize Wf47 callable receipt** | Callable receipt normalization | `['1', '2', '3', '4', '5'].includes(String(receipt.selected_option))` |
| 2 | **Build sanitized inbound test input** (`scenario=external_receipt`) | External receipt normalization | `['1', '2', '3', '4', '5'].includes(String(receipt.selected_option))` |
| 3 | **Correlate inbound to decision state** | State correlation / open-row close | `['1', '2', '3', '4', '5'].includes(String(selected_option))` |

- Callable path does **not** use **Set Wg test scenario** (that node runs only on the Manual Trigger branch).
- **Normalize Wf47 callable receipt** maps incoming receipt to the same item shape as **Build sanitized inbound test input** (proven `external_receipt` contract).
- **Correlate inbound to decision state** reads from callable adapter **or** manual build node — both entry points reach correlation.
- Manual `external_receipt` + `manual_receipt_json` remains available and independent.
- **active: false** · no Telegram · no schedule · shared store `control_plane_decisions_test` · **`enable_wg48_handoff=false`**.

Phase 2: operator wires `CONFIGURE_48_WORKFLOW_REFERENCE_IN_N8N_UI` on 47 and sets `enable_wg48_handoff=true` only for the test window.

### Controlled callable runtime — PASS ATTESTATO UTENTE (2026-06-01)

- **Gate:** **47 - Wf** invoked **48 - Wg** as **callable subworkflow** (published for Execute Workflow only — **not scheduled**, not operational automation).
- **48 / Inspect correlation result:** `inspect_status: closed`, `decision_id` **D-9998-T**, `selected_option` **1**, `update_id` **986228567**, `prior_status: open`, `state_persisted: true`, `test_only: true`.
- Manual `external_receipt` path remains available and independent.
- Session: `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-runtime-pass.md`.

---

## 6. Manual validation — fixture scenarios (PASS)

**Recorded:** 2026-05-31. Workflow **48** manual/inactive/off. Table **`wg_decision_state_test`** only.

| Scenario | Result |
|----------|--------|
| **valid_close** | `inspect_status: closed`, `D-9998-T`, option `1`, `prior_status: open`, `state_persisted: true` |
| **duplicate** | `inspect_status: blocked`, `block_reason: duplicate_or_already_closed`, `prior_status: closed`, `state_persisted: false` |
| **unknown** | `inspect_status: blocked`, `block_reason: unknown_decision_id`, `D-9999-X`, `prior_status: missing`, `state_persisted: false` |

Sanitized receipts (no secrets):

**valid_close**
```json
{"inspect_status":"closed","decision_id":"D-9998-T","selected_option":"1","update_id":986228900,"prior_status":"open","state_persisted":true,"test_only":true}
```

**duplicate**
```json
{"inspect_status":"blocked","decision_id":"D-9998-T","block_reason":"duplicate_or_already_closed","prior_status":"closed","state_persisted":false,"test_only":true}
```

**unknown**
```json
{"inspect_status":"blocked","decision_id":"D-9999-X","block_reason":"unknown_decision_id","prior_status":"missing","state_persisted":false,"test_only":true}
```

---

## 7. Next gate

Live 47→48 handoff **PASS ATTESTATO UTENTE** (2026-06-01). Next operational gate: limited **schedule test for 47 - Wf only** (separate, explicit) or BLOCKED with concrete blocker.

---

## 8. BLOCKED criteria

- Real identifiers or token in Git.
- Schedule / Telegram Trigger / webhook activated.
- Production `control_plane_state` used.
- PM-34, wf40/41 touched.

---

## 9. Boundaries

| Item | State |
|------|--------|
| Wf47 Data Table manual validation | **PASS** (unchanged) |
| Wg fixture manual validation | **PASS ATTESTATO UTENTE** |
| Wg external receipt mode | **PASS ATTESTATO UTENTE** (live 47 receipt, `update_id` 986228561) + **D-0045-E** (`D-0044-T`, `update_id` 986228602) |
| 47→48 live manual handoff | **PASS ATTESTATO UTENTE** |
| Telegram inbound operational | **NOT ACTIVE** |
| PM-34 | **BLOCCATO** |
| Operational automation | **NOT RUN** |

---

## 10. Related files

- Wf runbook: `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- Format: `docs/foundation/DECISION_PACKET_FORMAT.md`
- Template: `workflows/wg-telegram-inbound-decision-state-correlation.template.json`

---

## 11. Shared decision store — CLOSE ON REPLY (Gate 2 template no-runtime)

**Status:** **IMPLEMENTATION READY / PASS** (template + docs only, 2026-06-01). **No runtime.** Design: [decision-store-shared-open-close-design.md](decision-store-shared-open-close-design.md).

Wg now reads and writes the **shared store `control_plane_decisions_test`** (Data Table by name) instead of `wg_decision_state_test`, closing rows opened by Wd (OPEN ON SEND). Correlation semantics are unchanged.

| Old node | New node | Table |
|----------|----------|-------|
| Data Table - Load wg decision state | **Data Table - Load shared decision state** | `control_plane_decisions_test` |
| Data Table - Upsert wg decision row | **Data Table - Upsert shared decision row** | `control_plane_decisions_test` |

**Correlate inbound to decision state** reads the renamed load node (both the manual fixture path and the callable Wf47 path converge here) and now carries the shared-store extension columns through `persist_row`: `updated_at`, `created_by` (preserves existing `wd`), `source_workflow`, `packet_kind`. The upsert maps all extended columns alongside the base columns.

**Outcomes (unchanged):** option+open → `closed`; note+open → `note_recorded` (status stays open); `unknown_decision_id` (Wg only acts on rows Wd opened); `duplicate_or_already_closed`; `already_closed_or_stale`; `malformed_response`.

**Boundaries:** `active: false` · no Telegram · no schedule · no `control_plane_state` · no `data-tables/**` · no CSV seed · no table creation in repo · no PM-34 · no wf40/41/42. Redazione credenziali a cura operatore (PROJECT_VISION §10 v2.18); rotazione a fine progetto come controllo compensativo.

---

## 12. Gate 3 runtime PASS — Wg close-on-reply (2026-06-02)

**Status:** **PASS ATTESTATO UTENTE**. Session: [2026-06-02-control-plane-decision-store-gate3-runtime-pass.md](sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md).

**48 - Wg / Inspect correlation result:**

| Field | Value |
|-------|-------|
| inspect_status | closed |
| decision_id | D-9998-T |
| selected_option | 1 |
| update_id | 986228569 |
| note_present | false |
| block_reason | null |
| prior_status | open |
| state_persisted | true |
| test_only | true |

Final `control_plane_decisions_test` row: `status: closed`, `closed_at: 2026-06-02T22:06:45.132Z`, `update_id: 986228569`. Row was opened by **45 - Wd** (`open_action: insert`); closed via callable **48 - Wg** after **47 - Wf** accept — no manual table row edits.

**48 - Wg** remains **published/callable**, **not** scheduled independently. **Not** permanent operational automation.

---

## 12bis. D-0045-E wf48 external receipt close — PASS ATTESTATO UTENTE SCOPE LIMITED (2026-07-12)

**Status:** **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (user-attested; Cursor did not run runtime). Session: [2026-07-12-control-plane-d-0045-e-wf48-external-receipt-close-pass.md](sessions/2026-07-12-control-plane-d-0045-e-wf48-external-receipt-close-pass.md).

**Decision:** D-0045-E Opzione 1 — **48/Wg** manual `external_receipt`; `enable_wg48_handoff=false`.

| Aspect | Value |
|--------|--------|
| Receipt reused | `D-0044-T` / option `1` / `update_id` **986228602** (from prior wf47 official run) |
| wf47 rerun | **false** — update already consumed/persisted |
| new Telegram reply | **false** |
| callable 47→48 | **false** |
| Output | `inspect_status: closed`, `prior_status: open`, `state_persisted: true` |
| Store row | `D-0044-T` **closed**; `closed_at: 2026-07-11T23:02:56.427Z` |
| Workflow state | **48 inactive** post-run (operator-attested) |

**Proves:** manual receipt→close contract on `control_plane_decisions_test`. **Does not prove:** callable automatic 47→48 in same run; Gate E full PASS; inbound operational automation.

---

## 12ter. D-0052-W wf48 external receipt close (option 5) — PASS ATTESTATO UTENTE SCOPE LIMITED L4 (2026-07-17)

**Status:** **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L4_CALLBACK** companion close (user-attested; Cursor did not run runtime). Session: [2026-07-17-control-plane-d-0052-w-l4-callback-pass-d0053g-option2.md](sessions/2026-07-17-control-plane-d-0052-w-l4-callback-pass-d0053g-option2.md).

**Decision:** D-0052-W Opzione 1 — after harness wf47 accepted `D-0052-T` option **5**; **48/Wg** manual `external_receipt`; `enable_wg48_handoff=false`.

| Aspect | Value |
|--------|--------|
| Receipt | `D-0052-T` / option `5` / `update_id` **986228604** |
| Output | `inspect_status: closed`, `prior_status: open`, `state_persisted: true`, `test_only: true` |
| Second click / second wf47 business run | **false** |
| callable 47→48 | **false** |

**Parser claim boundary:** repository supports options 1–5; this arc runtime-validated option **5** only; option **4** **NOT_TESTED**. **Do not** claim all options 1–5 individually runtime-tested.

**Proves:** manual receipt→close for option 5 after L4 callback harness. **Does not prove:** Gate E; L5; callable automatic handoff; operational automation.

---

## 12quater. D-0058-W temporary wf48 close (option 4) — PASS ATTESTATO UTENTE SCOPE LIMITED (2026-07-18)

**Status:** **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_WF48_MANUAL_EXTERNAL_RECEIPT_OPTION_4** (user-attested; Cursor did not run runtime). Session: [2026-07-18-control-plane-d-0055-w-d-0058-w-wf47-option4-pass-and-wf48-manual-close.md](sessions/2026-07-18-control-plane-d-0055-w-d-0058-w-wf47-option4-pass-and-wf48-manual-close.md).

**Decision:** D-0058-W Opzione 1 — after D-0057-W official wf47 accepted `D-0055-T` option **4**; close via **temporary** wf48 external_receipt **1–5** copy (not official 48); `enable_wg48_handoff=false`.

| Aspect | Value |
|--------|--------|
| Receipt | `D-0055-T` / option `4` / `update_id` **986228607** |
| Output | `inspect_status: closed`, `prior_status: open`, `state_persisted: true`, `test_only: true` |
| Store final | `status=closed`; `closed_at=2026-07-17T23:43:24.362Z` |
| Path | temporary copy only · **`official_wf48_option_4_pass=false`** |
| Official/template wf48 parser (at D-0058) | remained canonical **1–3** until D-0059-W |
| Temp copy JSON in Git | **false** (outside repository; deleted in teardown) |

**Historical pending at D-0058:** separate repository arc to canonize official/template wf48 parser options **1–5** — **resolved** by D-0059-W (template only; live official 4/5 still not run).

**Proves:** manual external_receipt close for option 4 on shared store via temporary 1–5 copy. **Does not prove:** official wf48 option 4; Gate E; L5; callable automatic handoff.

---

## 12quinquies. D-0059-W wf48 parser 1–5 repository canonization (2026-07-18)

**Status:** **PASS_REPOSITORY_ONLY_IMPLEMENTATION** / **`result_runtime=NOT_RUN_REPOSITORY_ONLY_CANONIZATION`**. Session: [2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md](sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md).

**Decision:** D-0059-W Opzione 1 — `direct_operator_message`; `task_kind=repository_only_wf48_parser_canonization`.

| Aspect | Value |
|--------|--------|
| Template | `workflows/wg-telegram-inbound-decision-state-correlation.template.json` |
| Parser locations updated | **3** (callable + external_receipt + correlation) |
| Repository contract 1–5 | **Complete** |
| Fixture static 4/5 accept · 6/0 reject | **PASS** |
| Export created | **false** |
| Official live option 4/5 runtime | **false** / **false** (not run) |
| Callable 47→48 validated | **false** |
| `enable_wg48_handoff` | **false** |
| Cursor runtime actions | **0** |

**Proves:** repository template accepts options 1–5 at all three parser points. **Does not prove:** live official wf48 option 4 or 5; Gate E; L5; callable automatic handoff; operational automation.

---
