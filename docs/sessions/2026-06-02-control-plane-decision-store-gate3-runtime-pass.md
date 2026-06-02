# Session — Shared decision store Gate 3 runtime end-to-end PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-02  
**Type:** Gate 3 runtime user-attested. **No runtime by Cursor.**

---

## 1. Context

- Gate 1 design **PASS**; Gate 2 template no-runtime **PASS / IMPLEMENTATION READY**.
- Gate 3 validates end-to-end on **`control_plane_decisions_test`**: **45 Wd open-on-send** → Telegram reply → **47 Wf accept** → **48 Wg close**.
- Runtime executed manually in n8n by operator; Cursor records evidence only.

## 2. Evidence — 45 Wd (open-on-send)

**Inspect send result (read-only):**

```json
{
  "telegram_send_ok": true,
  "message_id": 732,
  "http_status": 200,
  "decision_id": "D-9998-T",
  "open_action": "insert",
  "block_reason": null,
  "test_only": true
}
```

**Data Table after Wd** (`control_plane_decisions_test`):

| Field | Value |
|-------|-------|
| decision_id | D-9998-T |
| status | open |
| selected_option | (empty) |
| created_at | 2026-06-02T00:46:44.236Z |
| closed_at | (empty) |
| update_id | (empty) |
| source | TEST ONLY |

Wd wrote **open** before the Telegram reply was processed by inbound.

## 3. Evidence — 47 Wf (accept)

**Build sanitized polling receipt:**

```json
{
  "inspect_status": "accepted",
  "decision_id": "D-9998-T",
  "selected_option": "1",
  "update_id": 986228569,
  "duplicate_or_stale": false,
  "note_present": false,
  "block_reason": null,
  "allowed_chat_configured": true,
  "offset_after_placeholder": 986228570,
  "last_handled_update_id": 986228567,
  "test_only": true
}
```

## 4. Evidence — 48 Wg (close-on-reply)

**Inspect correlation result:**

```json
{
  "inspect_status": "closed",
  "decision_id": "D-9998-T",
  "selected_option": "1",
  "update_id": 986228569,
  "note_present": false,
  "block_reason": null,
  "prior_status": "open",
  "state_persisted": true,
  "test_only": true
}
```

## 5. Evidence — final Data Table

| Field | Value |
|-------|-------|
| table | control_plane_decisions_test |
| decision_id | D-9998-T |
| status | closed |
| selected_option | 1 |
| created_at | 2026-06-02T00:46:44.236Z |
| closed_at | 2026-06-02T22:06:45.132Z |
| update_id | 986228569 |
| note_preview | (empty) |
| source | TEST ONLY |

Path proved: **45 Wd open** → Telegram reply → **47 Wf accept** → **48 Wg close** → row **closed** on shared store. No manual table row edits for the close.

## 6. Temporary routing (Gate 3 evidence only)

- classifier-server-v1 local on Ryzen: `127.0.0.1:8765`
- reverse SSH tunnel Ryzen → VPS: `ssh -N -R 8765:127.0.0.1:8765 ionos-n8n`
- temporary Python bridge on VPS: `172.18.0.1:8765` → `127.0.0.1:8765`
- n8n container `root-n8n-1` reached classifier via `http://172.18.0.1:8765/classify`

Routing was **temporary for Gate 3 evidence only** — not permanent production wiring.

## 7. Runtime cleanup / final state

- **47** off/unpublished/inactive after test window.
- **48** published/callable, **not** scheduled independently.
- **40** and **42** published/active, **not modified**.
- **49** not used.
- **PM-34** not touched/unblocked.
- No Telegram Trigger; no public webhook; no production table; no `control_plane_state` decision writes.
- No deploy/tag/rollback; no secrets in Git.

## 8. Named risk — open_without_send

**Not observed** in this run: `open_action: insert` and `telegram_send_ok: true` — open row and Telegram send both succeeded.

## 9. Boundaries

- Test-only loop; **not** permanent operational automation.
- Telegram inbound operational automation: **NOT ACTIVE / NOT RUN**.
- Catena completa automatizzata: **NOT RUN**. **PM-34:** **BLOCKED**.

## 10. Conclusion

**Gate 3 runtime end-to-end = PASS ATTESTATO UTENTE.**
