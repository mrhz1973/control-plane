# Wh runbook — combined Wf47 → Wg inbound decision flow (TEST ONLY)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wh-wf47-wg-combined-inbound-decision-flow.md`  
**Status:** Manual validation **PASS ATTESTATO UTENTE**. Not operational automation.

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

Seed before validation: import CSV from `data-tables/` (see `DATA_TABLE_CSV_CONVENTION.md`).

**Not** `control_plane_state`.

---

## 5. Template — workflow 49

**File:** `workflows/wh-wf47-wg-combined-inbound-decision-flow.template.json`
**Name:** `49 - Wh Wf47 Wg Combined Inbound Decision Flow TEST ONLY - TEMPLATE`
**active:** `false`
**allowed_chat_id:** committed in template per gate 2026-05-31 (configuration asset).

**Scenarios:** `valid_close` | `duplicate` | `unknown` | `stale_closed` | `note_only` | `malformed`

---

## 6. Manual validation — actual result (PASS)

User-attested **2026-05-31**. Workflow 49 imported once; remained inactive/off. CSV seeds from `data-tables/`; old test tables deleted before import.

### valid_close

- `inspect_status`: closed
- Wf47: accepted; Wg: closed
- `decision_id` D-9998-T, `selected_option` 1, `update_id` 986228910
- `prior_status`: open
- `state_persisted_wf47`: true; `state_persisted_wg`: true

### duplicate

- `inspect_status`: blocked
- Wf47: accepted; Wg: blocked (`duplicate_or_already_closed`)
- Same D-9998-T / option 1 / update_id 986228910
- `prior_status`: closed
- `state_persisted_wf47`: true; `state_persisted_wg`: false

**Nuance:** To exercise Wg `duplicate_or_already_closed` rather than Wf47 `stale_old_update_id`, the user reset **only** `wf47_polling_state_test` from CSV between valid_close and duplicate, while leaving `wg_decision_state_test` closed.

### unknown

- `inspect_status`: blocked
- Wf47: accepted; Wg: blocked (`unknown_decision_id`)
- `decision_id` D-9999-X, `selected_option` 2, `update_id` 986228911
- `prior_status`: missing
- `state_persisted_wf47`: true; `state_persisted_wg`: false

Optional scenarios `note_only`, `malformed`, `stale_closed` were **not** required for this PASS.

Evidence: [session log](sessions/2026-05-31-control-plane-wh-manual-validation-pass.md).

---

## 7. PASS criteria (met)

- Valid combined close persists both stores (wf47 offset + wg closed).
- Duplicate and unknown blocked at wg layer without double-close.
- Sanitized combined receipt only; workflow inactive/off.
- No production tables; no PM-34; no wf40/41/42.

---

## 8. BLOCKED criteria

- Secrets/raw identifiers in Git (except chat_id in config assets per gate 2026-05-31).
- Schedule / Telegram Trigger / webhook.
- Production `control_plane_state`.
- PM-34 unlocked without explicit gate.

---

## 9. Boundaries

| Item | State |
|------|--------|
| Wf47 / Wg manual validation | **PASS** (unchanged) |
| Wh package | **PREP PASS** |
| Wh manual validation | **PASS ATTESTATO UTENTE** |
| Operational inbound automation | **NOT ACTIVE** |
| Telegram Decision Packet operational automation | **NOT RUN** |
| Catena completa automatizzata | **NOT RUN** |
| PM-34 | **BLOCCATO** |

No schedule. No Telegram Trigger. No public webhook. No production Data Table. No workflow 40/41/42 mutation. No token/credential/webhook/API key/OAuth/PAT/CoT in Git.

---

## 10. Related files

- Wf: `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- Wg: `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`
- Template: `workflows/wh-wf47-wg-combined-inbound-decision-flow.template.json`
- CSV seeds: `data-tables/`
