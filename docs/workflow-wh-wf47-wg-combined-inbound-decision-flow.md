# Wh runbook — combined Wf47 → Wg inbound decision flow (TEST ONLY)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wh-wf47-wg-combined-inbound-decision-flow.md`  
**Status:** Package **PREP PASS** only. No runtime. Not operational automation.

---

## 1. Scope

**Wh** chains validated **Wf47** (sanitized inbound polling receipt + wf47 offset store) into **Wg** (decision lifecycle on `wg_decision_state_test`) in one **manual/inactive/off** workflow.

**Naming:** **Wh** — next unused letter after Wg; no prior `wh` in repo.

---

## 2. What Wf47 and Wg already proved

| Step | State |
|------|--------|
| **Wf47** Data Table manual validation | **PASS** — poll 1 accept, poll 2 no re-accept via `wf47_polling_state_test` |
| **Wg** manual validation | **PASS** — valid_close, duplicate, unknown on `wg_decision_state_test` |

Wh does **not** replace wf47/wf48; it documents the **handoff** between them.

---

## 3. What Wh adds

- Single importable workflow **49** with one Manual Trigger and one **Inspect combined result**.
- Scenario fixtures produce a **sanitized Wf47-style receipt**, then run Wf47 offset guard + Wg correlation in sequence.
- Optional live `getUpdates` is **not** embedded (avoids fragile token/HTTP in combined template). Live polling stays workflow **47**; Wh validates **receipt → correlation** integration.

---

## 4. Test-only Data Tables

| Table | Role |
|-------|------|
| `wf47_polling_state_test` | `last_update_id`, `last_handled_update_id`, `handled_keys_json` (+ `note` column) |
| `wg_decision_state_test` | `decision_id`, `status`, `selected_option`, `created_at`, `closed_at`, `update_id`, `note_preview`, `source` |

Seed before validation:

- **wf47:** rows at 0 / 0 / `{}` (or post-poll state if continuing)
- **wg:** open row `D-9998-T`, `status=open`, `source=TEST ONLY`

**Not** `control_plane_state`.

---

## 5. Template — workflow 49

**File:** `workflows/wh-wf47-wg-combined-inbound-decision-flow.template.json`  
**Name:** `49 - Wh Wf47 Wg Combined Inbound Decision Flow TEST ONLY - TEMPLATE`  
**active:** `false`

**UI only:** **Set Wh test config** → `scenario` + `allowed_chat_id` placeholder.

**Scenarios:** `valid_close` | `duplicate` | `unknown` | `stale_closed` | `note_only` | `malformed`

---

## 6. Manual validation gate (next)

| Order | Scenario | Expected combined inspect |
|-------|----------|---------------------------|
| 1 | Reset wg open `D-9998-T`; reset wf47 offset if needed | — |
| 2 | `valid_close` | `wf47_polling_status: accepted`, `wg_correlation_status: closed`, `state_persisted_wg: true` |
| 3 | `duplicate` | wg `blocked`, `duplicate_or_already_closed` |
| 4 | `unknown` | wg `unknown_decision_id` |
| 5 | Optional | `malformed`, `note_only`, `stale_closed` |

**Live Telegram poll + Wh in one run:** separate gate (run wf47 first, paste receipt, or future Wh HTTP branch). This prep validates **fixture handoff**.

---

## 7. PASS criteria (future Wh manual validation)

- Valid combined close persists both stores (wf47 offset + wg closed).
- Duplicate and unknown blocked at wg layer without double-close.
- Sanitized combined receipt only; workflow inactive/off.
- No production tables; no PM-34; no wf40/41.

---

## 8. BLOCKED criteria

- Secrets/raw identifiers in Git.
- Schedule / Telegram Trigger / webhook.
- Production `control_plane_state`.
- PM-34 unlocked.

---

## 9. Boundaries

| Item | State |
|------|--------|
| Wf47 / Wg manual validation | **PASS** (unchanged) |
| Wh package | **PREP PASS** |
| Operational inbound automation | **NOT ACTIVE** |
| PM-34 | **BLOCCATO** |

---

## 10. Related files

- Wf: `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- Wg: `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`
- Template: `workflows/wh-wf47-wg-combined-inbound-decision-flow.template.json`
