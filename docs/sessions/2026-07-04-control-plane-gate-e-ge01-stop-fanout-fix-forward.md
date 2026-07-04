# Session — Gate E GE-01 STOP / fan-out fix-forward (repo-only)

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-04
**Gate:** Gate E Phase 1 — **GE-01**
**Status:** **STOP / REVIEW REQUIRED** — **NOT PASS** — **NOT Gate E PASS** — **NOT PASS runtime**

**Context:** Post handoff D-0036-E rev2. Runtime GE-01 executed manually once on live n8n workflow **45/Wd**. This document records the STOP outcome and the **repo-only** fix-forward patch. **No live n8n import.** **No retry authorized.**

---

## 1. GE-01 run summary (user-attested / GPT-B verdict)

| Field | Value |
|-------|--------|
| **Run** | GE-01 — one manual execution of **45 - Wd** |
| **Workflow executions** | 1 |
| **Telegram received (user)** | **0** |
| **Teardown (visual)** | **GO** |
| **SSH tunnel** | closed |
| **Retry** | **not executed** (forbidden) |
| **Gate E PASS** | **NO** |
| **PASS runtime** | **NO** |

---

## 2. Primary evidence — Inspect send result (read-only)

Six identical items observed at terminal Inspect (fan-out):

```json
{
  "telegram_send_ok": null,
  "message_id": null,
  "http_status": 200,
  "decision_id": "D-1003-T",
  "open_action": "blocked",
  "block_reason": "duplicate_open_attempt",
  "test_only": true,
  "note": "Wd gate B live result — sanitize before recording; no send claimed unless Telegram ran"
}
```

(repeated 6 times)

**Interpretation:**

- `duplicate_open_attempt` on **D-1003-T** (row already **closed** from Gate D Addendum A) → `open_allowed=false` → **IF false branch** → **no Telegram send** (consistent with 0 messages received).
- `http_status: 200` is **classifier HTTP only** — **not** a Telegram send PASS.
- `telegram_send_ok: null` / `message_id: null` → **no send claimed** — correct for blocked path.
- **6 items** at Inspect = **fan-out bug** — audit noise; must not be read as 6 sends or 6 PASS signals.

---

## 3. Root cause (repo diagnosis)

| Layer | Finding |
|-------|---------|
| **Source** | **Data Table - Load shared decisions** — `returnAll: true` emits **1 item per store row** (~6 rows after Gate D history) |
| **Amplifier** | **Prepare shared decision open row** — `runOnceForEachItem` re-ran the same logic once per loaded row, emitting **6 identical prep items** |
| **Downstream** | **IF shared decision open allowed** (false) → **Inspect send result** with `runOnceForEachItem` → **6 audit records** |
| **Telegram** | Blocked path skips Upsert/Telegram when `open_allowed=false`; 0 Telegram is **expected** for `duplicate_open_attempt` |
| **Not PASS because** | Fan-out violates Gate E operational limits (45 = max 1 message); blocked terminal must collapse to **1 audit item**; `http_status: 200` must not be misread as runtime PASS |

Known pre-Gate E finding (Gate D session §G.1): fan-out on D-1003-T → 5 Telegram in Gate D rehearsal; GE-01 confirms the store-load multiplication persists on blocked path without send.

---

## 4. Repo-only fix-forward (offline — live n8n NOT updated)

**Files patched (repo-only):**

- `workflows/wd-operational-decision-packet-integration-manual.template.json` — template con fix GE-01
- `workflows/exports/2026-07-04_wd-45-operational-decision-packet-integration-ge01-fixforward.proposed.redacted.json` — **candidato futuro** per import GE-02 gated (non esportato da n8n live)

**Snapshot storico preservato (non patchato):**

- `workflows/exports/2026-07-02_wd-45-operational-decision-packet-integration-post-gate-d.redacted.json` — re-export post-Gate D (D-0033); **identico a `b62a30b`**; **non** contiene il fix Collapse

**Changes (template + proposed export):**

1. **New node:** `Collapse load fan-out (1 item per run)` — after Load, before Prepare; collapses N store rows to **1 gate item** per run.
2. **Prepare shared decision open row:** `runOnceForAllItems`; returns **1 item**; logic unchanged (`duplicate_open_attempt` → `open_allowed=false`).
3. **Inspect send result (read-only):** `runOnceForAllItems`; emits **1 audit record** with `send_suppressed`, `fan_out_items_in`, `fan_out_collapsed`, `pass_claimed=false`; explicit note when blocked that `http_status` is classifier-only.

**Import live:** separate gated step — operator must import workflow 45 from the **2026-07-04 proposed export** (not the 2026-07-02 snapshot) **only** after Decision Packet authorizes GE-02.

---

## 5. GE-02 preconditions (not authorized by this doc)

Before any future **GE-02** run:

1. **New `test_id` / `decision_id`** OR store cleaned/deduplicated — **do not** re-open **D-1003-T** (closed Gate D).
2. **Patched workflow 45** imported to n8n UI (inactive) from **`workflows/exports/2026-07-04_wd-45-operational-decision-packet-integration-ge01-fixforward.proposed.redacted.json`** — verify Collapse node present. **Do not** import the 2026-07-02 post-Gate-D snapshot for GE-02.
3. **Fan-out collapse verifiable:** item count before Telegram **≤ 1**; Inspect output **= 1 item**.
4. **Blocked duplicate:** `duplicate_open_attempt` → `send_suppressed=true`, **0** Telegram sends, **1** audit record.
5. **Evidence required:** explicit item counts in session log; user-attested Telegram count; **no** autonomous Gate E PASS.
6. **Decision Packet** authorizing GE-02 scope — GE-01 STOP does **not** authorize retry.

---

## 6. Invariants unchanged

- **PM-34 BLOCKED** · **`n8n_ready=false`** · **`pm34_unblocked=false`** · **`enable_wg48_handoff=false`**
- wf40/41/42 untouched · no schedule · no public webhook · no live credential changes
- **No Gate E PASS** · **No PASS runtime** declared by this session or by Cursor

---

**Evidence recorded for STOP review. Cursor repo-only fix-forward — no runtime PASS declared.**
