# Session — Gate D bounded rehearsal PASS (D-0033)

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-07-02  
**Gate:** D-0033 / **Gate D** — inbound 47→48→decision-store bounded rehearsal  
**Type:** Runtime user-attested / Claude-attested. **No runtime by Cursor.**

---

## A. Scope autorizzato

- **Decision:** D-0033 / Gate D
- **Phases covered:** pre-step hygiene + Fase 1 manual rehearsal + Fase 2 time-boxed scheduled pickup + Addendum A (handoff 47→48)
- **No PM-34 unlock**
- **No public webhook**
- **No permanent schedule**
- **No wf40/wf42 touch**
- Test-only path on existing assets **45 / 47 / 48 / 49**

---

## B. Pre-step igiene — D-9999-T

Hygiene closure on `control_plane_decisions_test` before Gate D:

| Field | Value |
|-------|-------|
| `decision_id` | `D-9999-T` |
| `status` | **closed** |
| `selected_option` | `2` |
| `update_id` | `986228574` |
| `note_preview` | residuo Gate B, chiusura igienica pre-Gate D |

---

## C. Fase 1 — D-1001-T manual rehearsal

### Bug 1 — 45 / Build Operational Decision Packet

**Before (hardcoded in n8n UI):**

```javascript
const decisionId = 'D-1000-T';
```

**Fix applied in n8n UI:**

```javascript
const decisionId = event.event_id;
```

**Re-run 45:**

| Field | Value |
|-------|-------|
| `decision_id` | `D-1001-T` |
| `http_status` | `200` |
| `telegram_send_ok` | `true` |
| `message_id` | `1150` / `1151` / `1152` |
| `open_action` | `insert` |
| `block_reason` | `null` |

**Telegram text verification:** messages `1150`, `1151`, `1152` contained `ID: D-1001-T` and `event_id: D-1001-T`.

### Bug 2 — 47 / Build getUpdates request from state

**Before (hardcoded in n8n UI):**

```javascript
open_decision_ids_test_only: ['D-1000-T']
```

**Effect:** first Telegram pickup `update_id=986228575` associated to `D-1000-T`; `inspect_status=blocked`; `block_reason=already_closed_or_stale`.

**Fix applied in n8n UI:**

```javascript
open_decision_ids_test_only: ['D-1001-T']
```

**Timing note:** `update_id=986228575` was already consumed in the wrong run; fresh Telegram response required.

**Manual re-run 47:**

| Field | Value |
|-------|-------|
| `inspect_status` | `closed` |
| `decision_id` | `D-1001-T` |
| `selected_option` | `1` |
| `update_id` | `986228576` |
| `duplicate_or_stale` | `false` |
| `block_reason` | `null` |
| `test_only` | `true` |

**Final store — D-1001-T:**

| Field | Value |
|-------|-------|
| `status` | **closed** |
| `selected_option` | `1` |
| `update_id` | `986228576` |
| `closed_at` | `2026-07-01T22:41:37.674Z` |
| `source` | `TEST ONLY` |

---

## D. Fase 2 — D-1002-T time-boxed scheduled pickup

### Pre-config

- **45** Set sanitized operational-style event: `event_id = D-1002-T`
- **47** Build getUpdates request from state: `open_decision_ids_test_only = ['D-1002-T']`

### Apertura via 45

| Field | Value |
|-------|-------|
| `decision_id` | `D-1002-T` |
| `telegram_send_ok` | `true` |
| `message_id` | `1155` / `1156` / `1157` / `1158` |
| `http_status` | `200` |
| `open_action` | `insert` |
| `block_reason` | `null` |

### Finestra dichiarata

| | |
|---|---|
| **START** | 2026-07-02 00:51 Europe/Rome |
| **END** | 2026-07-02 01:06 Europe/Rome |
| **Durata massima** | 15 minuti |

### Pickup schedulato 47

| Field | Value |
|-------|-------|
| Telegram reply | `1` |
| `inspect_status` | `closed` |
| `decision_id` | `D-1002-T` |
| `selected_option` | `1` |
| `update_id` | `986228577` |
| `duplicate_or_stale` | `false` |
| `block_reason` | `null` |
| `test_only` | `true` |

Output repeated on 5 items — all consistent.

**Final store — D-1002-T:**

| Field | Value |
|-------|-------|
| `status` | **closed** |
| `selected_option` | `1` |
| `created_at` | `2026-07-01T22:49:12.943Z` |
| `closed_at` | `2026-07-01T22:53:45.110Z` |
| `update_id` | `986228577` |
| `note` | Empty |
| **Apertura→chiusura** | ~4m32s |
| **Chiusura** | inside declared time-boxed window |

### Attestazione spegnimento utente

- Schedule on **47** deactivated ~00:55 Europe/Rome — after scheduled D-1002-T pickup at 00:53:45 and still within declared window end 01:06
- Final UI state: **47** not Published / inactive; Schedule Trigger **Deactivated**

---

## E. Addendum A — D-1003-T handoff 47→48

Option A executed within D-0033 to prove full chain **45 → Telegram → 47 → 48**.

### 45

| Field | Value |
|-------|-------|
| `decision_id` | `D-1003-T` |
| `telegram_send_ok` | `true` |
| `message_id` | `1160` / `1161` / `1162` / `1163` / `1164` |
| `http_status` | `200` |
| `open_action` | `insert` |
| `block_reason` | `null` |

### 47

| Field | Value |
|-------|-------|
| Telegram reply | `1` |
| `update_id` | `986228578` |
| `inspect_status` | `closed` |
| `decision_id` | `D-1003-T` |
| `selected_option` | `1` |
| `duplicate_or_stale` | `false` |
| `block_reason` | `null` |

### 48 handoff — node Execute Workflow - Wg48 TEST ONLY

| Field | Value |
|-------|-------|
| `inspect_status` | `closed` |
| `decision_id` | `D-1003-T` |
| `selected_option` | `1` |
| `update_id` | `986228578` |
| `note_present` | `false` |
| `block_reason` | `null` |
| `prior_status` | `open` |
| `state_persisted` | **`true`** |
| `test_only` | `true` |

**Final store — D-1003-T:**

| Field | Value |
|-------|-------|
| `status` | **closed** |
| `selected_option` | `1` |
| `created_at` | `2026-07-01T23:15:45.487Z` |
| `closed_at` | `2026-07-01T23:17:21.193Z` |
| `update_id` | `986228578` |
| `note` | Empty |

### Post-addendum final state

- Set Wf47 UI config active
- **`enable_wg48_handoff=false`**
- Schedule Trigger **47** disabled / deactivated
- **47** not scheduled

---

## F. Inventario finale workflow

| Workflow | UI state (user-attested) |
|----------|---------------------------|
| **45** — Wd Operational Decision Packet Integration TEST ONLY - TEMPLATE | **inactive** |
| **47** — Wf Telegram Inbound Polling getUpdates TEST ONLY - TEMPLATE | **inactive** / not Published |
| **47** Schedule Trigger - TEST ONLY DISABLED | **disabled** / deactivated |
| **48** — Wg Telegram Inbound Decision State Correlation TEST ONLY - TEMPLATE | **Published** / callable; no visible schedule |
| **49** — Wh Wf47 Wg Combined Inbound Decision Flow TEST ONLY - TEMPLATE | **inactive** |

**Naming note:** **49** appears as **Wh Combined** in UI; no reconciliation required.

---

## G. Findings pre-Gate E

1. **Fan-out multiplo:** D-1001-T → 3 Telegram messages; D-1002-T → 4; D-1003-T → 5; workflow outputs repeated 4–6 items. In production this would be systematic spam.
2. **47** still uses manual rotation of `open_decision_ids_test_only` — must derive open decisions from store before Gate E.
3. UI fixes on **45** and **47** are **not** in committed exports — redacted re-export post-fix required.
4. **`enable_wg48_handoff`** is an operational flag — document and keep **`false`** outside test.
5. **Gate E** requires a dedicated Decision Packet before any promotion.

---

## H. Conclusione

- **Claude attested Gate D PASS full** after Addendum A.
- **Gates E / F** not attested and not promoted.
- **PM-34:** BLOCKED · **`n8n_ready=false`** · wf40/41/42 untouched · no permanent schedule · no public webhook.

---

**Evidence recorded by user/Claude. Cursor docs closure only — no runtime PASS declared by Cursor.**
