# Session — Gate B inbound one-shot PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-07  
**Gate:** D-0028-A **Gate B** — limited manual runtime re-verification / inbound one-shot  
**Type:** Runtime user-attested. **No runtime by Cursor.**

---

## 1. Context

- **Gate A** readiness audit **PASS ATTESTATO UTENTE** (2026-06-07).
- **D-0028-A Option 2** activation plan committed.
- User manually exercised controlled path: Telegram reply → **47/Wf** polling → decision-store close on `control_plane_decisions_test`.
- Existing assets only. No new workflow. No Data Table row deletion.

## 2. Outbound — 45/Wd (D-1000-T)

User re-sent test-only Decision Packet via **45/Wd**:

| Field | Value |
|-------|-------|
| `decision_id` | `D-1000-T` |
| `telegram_send_ok` | `true` |
| `message_id` | `753` and `754` (duplicate send — diagnostic, not loop) |
| `http_status` | `200` |
| `open_action` | `insert` |
| `block_reason` | `null` |
| `test_only` | `true` |

## 3. Decision store — before / during

| `decision_id` | State (user-attested) |
|---------------|------------------------|
| `D-9998-T` | **closed** / `selected_option=1` / `update_id=986228569` (historical idempotency) |
| `D-9999-T` | **open** — test residue/stale; **not deleted** |
| `D-1000-T` | **open** before valid inbound close |

## 4. 47/Wf — initial attempts (fail-safe, not PASS)

- **47/Wf** initially filtered/parsed **`D-9998-T`**:
  - `decision_id=D-9998-T`, `selected_option=1`, `block_reason=already_closed_or_stale`
- Intermediate run:
  - `block_reason=no_parseable_decision_response`
  - `allowed_chat_configured=true`
  - `offset_after_placeholder=986228572`
  - `last_handled_update_id=986228571`

Interpretation: correct fail-safe blocks; not Gate B PASS.

## 5. Manual runtime correction (n8n UI only)

- **47/Wf** / Build getUpdates request from state: `open_decision_ids_test_only` updated from `D-9998-T` to **`D-1000-T`** in n8n UI.
- No URL, token, chat_id, or header recorded in Git.

## 6. Final PASS — 47/Wf

| Field | Value |
|-------|-------|
| `inspect_status` | `closed` |
| `decision_id` | `D-1000-T` |
| `selected_option` | `1` |
| `update_id` | `986228573` |
| `duplicate_or_stale` | `false` |
| `note_present` | `false` |
| `block_reason` | `null` |
| `test_only` | `true` |

Note: output repeated 3× internally with same `update_id` / `decision_id` / `selected_option`.

## 7. Final `control_plane_decisions_test`

| `decision_id` | State |
|---------------|--------|
| `D-1000-T` | **closed**; `selected_option=1`; `update_id=986228573`; `closed_at=2026-06-07T18:09:04.210Z` |
| `D-9998-T` | **closed** (historical evidence retained) |
| `D-9999-T` | **open** (test residue — not deleted) |

## 8. Boundaries

- **Gate B PASS** limited to **D-1000-T** close via **47/Wf** manual polling one-shot.
- **48/Wg**, **49/Wh** not auto-promoted. **Option 4** not permanent loop. **PM-34 BLOCKED.** **`n8n_ready=false`.**
- No permanent inbound, schedule, webhook, Telegram Trigger, or Funnel.
- Pezzi collegati ≠ loop avviato.

## 9. Recommended next step

Separate micro-step (docs/design first or dedicated gate): hardening/cleanup for **`D-9999-T`** test residue and **47/Wf** test target configuration — **no runtime** until explicitly decided.

## 10. Conclusion

**Gate B inbound one-shot = PASS ATTESTATO UTENTE.**
