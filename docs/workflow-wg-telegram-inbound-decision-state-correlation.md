# Wg runbook — inbound Decision Packet state correlation (TEST ONLY)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`  
**Status:** Package **PREP PASS** only. No runtime. No operational automation.

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
| `selected_option` | `1` \| `2` \| `3` when closed |
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
3. **Set Wg test scenario** — choose scenario for each manual run (see §6).
4. Run Manual Trigger; read **Inspect correlation result**.

No Code-node edits required for normal validation (scenario in Set node).

---

## 6. Manual validation gate (next)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Seed open `D-9998-T` in `wg_decision_state_test` | `status=open` |
| 2 | Import wf **48**; scenario **`valid_close`**; Manual Trigger | `correlation_status: closed`, `decision_id: D-9998-T`, `selected_option: 1`; row closed in table |
| 3 | Scenario **`duplicate`** (same update) | `blocked`, `block_reason: duplicate_or_already_closed` |
| 4 | Scenario **`unknown`** | `blocked`, `block_reason: unknown_decision_id` |
| 5 | Optional: **`stale_closed`**, **`note_only`**, **`malformed`** | Matching `block_reason` / `note_recorded` per template |

Record sanitized **Inspect correlation result** JSON only. No secrets.

---

## 7. PASS criteria (future Wg manual validation)

- Valid close: open → closed with correct `selected_option`.
- Duplicate: blocked, not double-close.
- Unknown: blocked.
- Sanitized inspect output only; workflow inactive/off.
- No production Data Table; no PM-34; no wf40/41.

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
| Wg package | **PREP PASS** (this task) |
| Telegram inbound operational | **NOT ACTIVE** |
| PM-34 | **BLOCCATO** |
| Operational automation | **NOT RUN** |

---

## 10. Related files

- Wf runbook: `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- Format: `docs/foundation/DECISION_PACKET_FORMAT.md`
- Template: `workflows/wg-telegram-inbound-decision-state-correlation.template.json`
