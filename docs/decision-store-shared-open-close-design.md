# Shared decision store — open/close contract (Gate 1 design)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-store-shared-open-close-design.md`  
**Status:** Gate 1 **design PASS** + Gate 2 **template no-runtime IMPLEMENTATION READY / PASS** (docs + template only). **No runtime.** **No** Data Table mutation in Git (no `data-tables/**`, no CSV seed, no table creation in repo).  
**Date:** 2026-06-01

---

## 1. Problem statement (verified gap)

| Layer | Today | Gap |
|-------|--------|-----|
| **Outbound** (Wc/Wd) | Builds and sends Decision Packet on Telegram | Does **not** record decision as **open** |
| **Inbound** (Wf/Wg) | Polls getUpdates, correlates reply, closes decision | Closes against **manually seeded** `wg_decision_state_test` (e.g. D-9998-T open) |
| **We** | Validates `dp:D-XXXX-X:n` | Still points at placeholder `CONFIGURE_DECISION_STATE_STORE_IN_N8N_UI` — real store undefined |
| **control_plane_state** | Workflow 40 key/value SHA tracker | **Not** a decision store — must not be used for open/close |

**Loop not closed:** outbound sends without open; inbound closes a fixture; no shared store links **open on send** ↔ **close on reply**.

**Validated inbound close logic:** Wg **Correlate inbound to decision state** (duplicate, unknown, stale, note, malformed) — **PASS** including controlled 47→48 runtime (`update_id` **986228567**).

---

## 2. Store name and role

### 2.1 Dedicated table (test-only phase)

| Property | Value |
|----------|--------|
| **Name (recommended)** | `control_plane_decisions_test` |
| **Role** | Shared **test-only** decision lifecycle store: **open on outbound send**, **close on inbound reply** |
| **Scope** | Decision Packet human gate only — not commit SHA tracking, not wf47 polling offset |

### 2.2 Explicitly distinct from

| Table | Role | Use for decisions? |
|-------|------|-------------------|
| **`control_plane_state`** | Workflow 40 — last notified commit SHA (`key`/`value`/`updated_at`/`note`) | **NO** — never write decision rows here |
| **`wg_decision_state_test`** | Historical Wg fixture / manual validation table | **NO** for new loop — remains regression fixture |
| **`wf47_polling_state_test`** | Wf47 getUpdates offset / handled keys | **NO** — polling state only |

### 2.3 Relationship and migration

- **`wg_decision_state_test`** — keep as **historical fixture** for Wg manual scenarios and past PASS evidence; Gate 2+ **Wg reads `control_plane_decisions_test`** for the shared loop (fixtures may still seed either table during transition — documented in Gate 2).
- **`control_plane_decisions_test`** — **new shared store** for open-on-send + close-on-reply test loop.
- **Schema** — reuse proven Wg columns; minimal extensions only (see §3).

---

## 3. Schema

### 3.1 Base columns (required — from validated Wg model)

| Column | Type (logical) | Purpose |
|--------|----------------|---------|
| `decision_id` | string, PK | `D-\d{4}-[A-Z]` e.g. `D-9998-T` |
| `status` | enum | `open` \| `closed` \| `stale` \| `blocked` |
| `selected_option` | string | `1` \| `2` \| `3` when closed; empty when open |
| `created_at` | ISO timestamp | Row creation / open time |
| `closed_at` | ISO timestamp | When status became `closed`; empty when open |
| `update_id` | string/number as string | Last Telegram `update_id` applied on close |
| `note_preview` | string, bounded | Sanitized note text (max ~80 chars); optional |
| `source` | string | Always `TEST ONLY` in test phase |

### 3.2 Minimal extensions (justified)

| Column | Purpose |
|--------|---------|
| `updated_at` | Last row mutation (open upsert, close, note append) — disambiguates race ordering without complex locking |
| `created_by` | Literal workflow label e.g. `wd`, `wc` — no secrets, no token |
| `source_workflow` | n8n workflow **name** label e.g. `Wd operational Decision Packet` — not hardcoded runtime id in Git |
| `packet_kind` | `automation` \| `meta` \| `runtime` — aligns with DECISION_PACKET_FORMAT kind |

No chat_id, user_id, token, webhook URL, or message body in store or Git.

---

## 4. OPEN ON SEND contract (outbound — Wd primary)

**When:** Wd (or Wc send path) successfully dispatches a Decision Packet to Telegram.

**Action:** Upsert into `control_plane_decisions_test`:

```yaml
decision_id: <from packet>
status: open
selected_option: ""   # empty
closed_at: ""
update_id: ""
note_preview: ""
source: TEST ONLY
created_at: <now ISO>
updated_at: <now ISO>
created_by: wd | wc
source_workflow: <workflow name label>
packet_kind: <from packet>
```

### 4.1 Idempotency rules

| Condition | Behavior |
|-----------|----------|
| Row **missing** | Insert **open** |
| Row **open** (same `decision_id`) | **No-op** or touch `updated_at` only — **do not duplicate** |
| Row **closed** | **Do not reopen** — return deterministic **blocked** / `duplicate_open_attempt`; outbound receipt flags `decision_already_closed` |
| Concurrent double-send same id | Last writer wins on `updated_at`; status stays **open** if both see open/missing |

### 4.2 Outbound must NOT

- Write to `control_plane_state`, `wg_decision_state_test` (for new loop), or production tables.
- Store Telegram token or raw chat content.

---

## 5. CLOSE ON REPLY contract (inbound — Wf + Wg)

**When:** Wf accepts sanitized inbound; Wg **Correlate inbound to decision state** runs against **`control_plane_decisions_test`** (Gate 2 template change).

**Input:** Same sanitized receipt contract as validated:

- Callback/plain: `dp:D-9998-T:1` → `selected_option` `1`
- Note: `note:D-9998-X:text` → `note_preview` bounded; **does not** set `selected_option`

**Close success (option path):**

```yaml
status: closed
selected_option: "1" | "2" | "3"
closed_at: <now ISO>
update_id: <from receipt>
updated_at: <now ISO>
```

**Reuse:** Existing Wg correlation outcomes — no new semantics:

| Outcome | `block_reason` / status | Store effect |
|---------|-------------------------|--------------|
| Open + valid option | `correlation_status: closed` | Upsert closed row |
| Unknown id | `unknown_decision_id` | No row change |
| Duplicate same update | `duplicate_or_already_closed` | No row change |
| Closed + different update | `already_closed_or_stale` | No row change |
| Note only | `note_recorded` | Update `note_preview`; **status stays open**; **selected_option unchanged** |
| Malformed | `malformed_response` | No row change |

### 5.1 Note path decision

**Choice:** `note_recorded` → **open** with `note_preview` updated (same as current Wg validated behavior). Rationale: note is follow-up, not a final option selection; closing requires explicit `1`/`2`/`3`.

---

## 6. States and transitions

```
                    ┌─────────────┐
     Wd send        │    open     │◄── upsert (open on send)
  ─────────────────►│             │
                    └──────┬──────┘
                           │ Wg option close (1|2|3)
                           ▼
                    ┌─────────────┐
                    │   closed    │
                    └──────┬──────┘
                           │ reply again (same/different update)
                           ▼
              duplicate_or_already_closed / already_closed_or_stale

     missing row + inbound reply ──► unknown_decision_id (no transition)

     open + note only ──► open (note_preview updated)  [note_recorded]

     malformed inbound ──► malformed_response (no transition)

     blocked open attempt on closed ──► blocked (outbound side)
```

| From | Event | To | Side |
|------|-------|-----|------|
| — | Wd send (new id) | **open** | outbound |
| — | Wd send (id closed) | **blocked** (no reopen) | outbound |
| **open** | duplicate Wd send | **open** (idempotent) | outbound |
| **open** | Wg valid option | **closed** | inbound |
| **open** | Wg note | **open** (+ note_preview) | inbound |
| **closed** | Wg same update | duplicate_or_already_closed | inbound |
| **closed** | Wg new update | already_closed_or_stale | inbound |
| **missing** | Wg any | unknown_decision_id | inbound |

---

## 7. Test-only boundaries (Gate 1)

- Table suffix **`_test`** only — `control_plane_decisions_test`.
- **No** writes to `control_plane_state`.
- **No** PM-34 unlock.
- **No** public webhook, **no** Telegram Trigger — inbound remains **getUpdates polling** (Wf).
- **No** mutation of workflows 40/41/42.
- **No** secrets or tokenized URLs in Git.
- Telegram token **n8n UI only**.
- **No** hardcoded n8n workflow runtime ids in Git.
- **Telegram inbound operational automation:** **NOT ACTIVE / NOT RUN** until explicit future gate.
- **49 - Wh** not used for this loop.

---

## 8. Subsequent gates (design only — do not implement in Gate 1)

### Gate 2 — template no-runtime — IMPLEMENTATION READY / PASS (2026-06-01)

- **Wd** template (`workflows/wd-operational-decision-packet-integration-manual.template.json`): after **Build Operational Decision Packet** it now **loads** `control_plane_decisions_test`, **prepares** an open row, **gates** the Telegram send with **IF shared decision open allowed**, and **upserts open** via **Data Table - Upsert shared decision open** before send. Closed `decision_id` → `open_action: blocked` / `block_reason: duplicate_open_attempt`, **no reopen and no send** (Telegram is on the IF-true branch only). Both IF branches converge on **Inspect send result (read-only)**, which now reports `open_action` / `block_reason` and only claims a Telegram send when the node actually ran (Addendum 1). Sticky note documents shared store + `open_without_send` risk.
- **Wg** template (`workflows/wg-telegram-inbound-decision-state-correlation.template.json`): **Data Table - Load shared decision state** and **Data Table - Upsert shared decision row** target **`control_plane_decisions_test`** (renamed from the `wg_decision_state_test` nodes). **Correlate inbound to decision state** reads the renamed load node and carries `updated_at` / `created_by` / `source_workflow` / `packet_kind` through `persist_row`; the upsert maps the extended columns. Both manual fixtures and the callable Wf47 path share the same store.
- **We** placeholder: `CONFIGURE_DECISION_STATE_STORE_IN_N8N_UI` documented to resolve to `control_plane_decisions_test` (We template itself **not** modified; no runtime).
- **No** n8n import/activation/schedule by Cursor. **No** `data-tables/**`, **no** CSV seed, **no** table creation in repo — the operator creates `control_plane_decisions_test` in the n8n UI.
- Both templates keep `active: false` and `CONFIGURE_*` placeholders; no secrets, no hardcoded runtime workflow ids.

### Gate 3 — runtime user-attested — PASS ATTESTATO UTENTE (2026-06-02)

- **Path proved:** **45 Wd open-on-send** → Telegram reply `dp:D-9998-T:1` → **47 Wf accept** (`update_id` **986228569**) → **48 Wg close** → `control_plane_decisions_test` row **closed**.
- **Wd evidence:** `telegram_send_ok: true`, `message_id: 732`, `decision_id: D-9998-T`, `open_action: insert`; row `status: open` on shared store before inbound close.
- **Wg evidence:** `inspect_status: closed`, `prior_status: open`, `state_persisted: true`, `update_id: 986228569`; final row `status: closed`, `closed_at: 2026-06-02T22:06:45.132Z`.
- **Risk `open_without_send`:** **not observed** — `open_action: insert` and `telegram_send_ok: true` in same run.
- **Cleanup:** **47** off after test window; **48** callable/published, not scheduled independently; **40/42** unchanged; **49** not used; no manual table row edits for close.
- **Temporary routing:** classifier on Ryzen + reverse SSH tunnel + VPS Python bridge — Gate 3 evidence only, not permanent production wiring.
- **Not** permanent operational automation. Session: `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.

---

## 9. Named risks and mitigations

| Risk | Mitigation |
|------|------------|
| Double open (duplicate Wd send) | Upsert idempotent: open stays open; no second row |
| Reopen closed decision | Outbound rejects with **blocked**; inbound already has stale/duplicate guards |
| Outbound/inbound race | `updated_at` ordering; Wg duplicate/stale on `update_id`; accept-once on Wf offset |
| Reply for unknown `decision_id` | `unknown_decision_id` — no store write |
| Double-click / duplicate `update_id` | Wf handled_keys + Wg `duplicate_or_already_closed` |
| **control_plane_state** contamination | Explicit ban in contract; separate table name and docs |
| Token/secrets in Git | Store schema has no secret columns; token UI-only |
| Premature production table | `_test` suffix; explicit Gate 3 before any prod naming |
| Schema drift vs `wg_decision_state_test` | Gate 2 maps Wg node to new table; fixture table frozen for history |
| We placeholder undefined store | Gate 2 doc + template point to `control_plane_decisions_test` |

---

## 10. References

- [DECISION_PACKET_FORMAT.md](foundation/DECISION_PACKET_FORMAT.md) — `D-NNNN-X`, options, kind  
- [workflow-wf47-wg-operationalization-plan.md](workflow-wf47-wg-operationalization-plan.md) — inbound path  
- [workflow-wg-telegram-inbound-decision-state-correlation.md](workflow-wg-telegram-inbound-decision-state-correlation.md) — correlate semantics  
- Session: controlled 47→48 runtime PASS (`update_id` **986228567**)

---

## 11. Gate status

- **Gate 1 (design):** **PASS** — shared store contract defined.
- **Gate 2 (template no-runtime):** **PASS / IMPLEMENTATION READY** — Wd open-on-send and Wg close-on-reply templates point to `control_plane_decisions_test`; both `active: false`; no runtime; no `data-tables/**`; no CSV seed; no table created in repo.
- **Gate 3 (runtime user-attested):** **PASS ATTESTATO UTENTE** (2026-06-02) — end-to-end **45→47→48** on `control_plane_decisions_test`; `update_id` **986228569**; `open_without_send` risk not observed. Test-only; not permanent automation.
